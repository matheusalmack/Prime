-- Payment ledger is the source of truth. Recompute rather than extending an
-- account on delivery time: late/repeated callbacks cannot add free days.
create or replace function public.purchase_access_for_email(p_email text)
returns table (plan_code text, access_starts_at timestamptz, access_ends_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
declare
  purchase public.approved_purchases%rowtype;
  first_start timestamptz;
  period_end timestamptz;
  paid_start timestamptz;
begin
  select * into purchase from public.approved_purchases p
  where lower(p.customer_email) = lower(trim(p_email)) and p.status = 'approved'
    and p.plan_code = 'lifetime' order by p.paid_at nulls last, p.created_at limit 1;
  if found then
    return query select 'lifetime'::text, coalesce(purchase.paid_at, purchase.created_at), null::timestamptz;
    return;
  end if;
  for purchase in
    select * from public.approved_purchases p
    where lower(p.customer_email) = lower(trim(p_email)) and p.status = 'approved'
      and p.plan_code = 'monthly'
    order by coalesce(p.period_starts_at, p.paid_at, p.created_at), p.created_at, p.id
  loop
    paid_start := coalesce(purchase.period_starts_at, purchase.paid_at, purchase.created_at);
    first_start := least(coalesce(first_start, paid_start), paid_start);
    if purchase.period_ends_at is not null then
      period_end := greatest(period_end, purchase.period_ends_at);
    else
      period_end := greatest(coalesce(period_end, paid_start), paid_start) + interval '30 days';
    end if;
  end loop;
  if first_start is not null then
    return query select 'monthly'::text, first_start, period_end;
  end if;
end;
$$;
revoke all on function public.purchase_access_for_email(text) from public, anon, authenticated;
grant execute on function public.purchase_access_for_email(text) to service_role;

create or replace function public.apply_approved_purchase(p_purchase_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  purchase public.approved_purchases%rowtype;
  matched_user_id uuid;
  entitlement record;
begin
  select * into purchase from public.approved_purchases where id = p_purchase_id;
  if not found then return; end if;
  perform pg_advisory_xact_lock(hashtextextended(lower(purchase.customer_email), 0));
  select id into matched_user_id from auth.users where lower(email) = lower(purchase.customer_email) limit 1;
  if matched_user_id is null then return; end if;
  select * into entitlement from public.purchase_access_for_email(purchase.customer_email);
  if not found then
    update public.subscriptions set status = 'revoked' where user_id = matched_user_id;
    return;
  end if;
  insert into public.subscriptions(user_id, plan_code, status, access_starts_at, current_period_end, source_purchase_id)
  values (matched_user_id, entitlement.plan_code, 'active', entitlement.access_starts_at, entitlement.access_ends_at, purchase.id)
  on conflict (user_id) do update set plan_code = excluded.plan_code, status = 'active',
    access_starts_at = excluded.access_starts_at, current_period_end = excluded.current_period_end,
    source_purchase_id = excluded.source_purchase_id;
  update public.approved_purchases set user_id = matched_user_id,
    claimed_at = coalesce(claimed_at, now()), applied_at = coalesce(applied_at, now())
  where lower(customer_email) = lower(purchase.customer_email) and status = 'approved';
end;
$$;

create or replace function public.check_signup_eligibility(p_email text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.purchase_access_for_email(p_email) a
    where a.plan_code = 'lifetime' or a.access_ends_at > now());
$$;

create or replace function public.hook_require_approved_purchase(event jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if public.check_signup_eligibility(event -> 'user' ->> 'email') then return '{}'::jsonb; end if;
  return jsonb_build_object('error', jsonb_build_object('http_code', 403,
    'message', 'Nenhuma compra aprovada e ativa foi encontrada para este e-mail.'));
end;
$$;

create or replace function public.process_payment_event(
  p_gateway text, p_event_id text, p_event_type text, p_order_id text,
  p_email text, p_plan_code text, p_status text, p_paid_at timestamptz,
  p_period_starts_at timestamptz, p_period_ends_at timestamptz, p_payload jsonb
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  purchase_id uuid;
  previous public.approved_purchases%rowtype;
  effective_status text := p_status;
  normalized_email text := lower(trim(p_email));
begin
  if normalized_email is null or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or p_plan_code is null or p_plan_code not in ('monthly', 'lifetime')
    or p_status is null or p_status not in ('approved', 'pending', 'cancelled', 'refunded', 'chargeback') then
    raise exception 'Invalid payment fields';
  end if;
  if p_status = 'approved' and p_paid_at is null then raise exception 'Approval requires paid_at'; end if;
  if p_period_ends_at is not null and p_period_ends_at <= coalesce(p_period_starts_at, p_paid_at) then
    raise exception 'Invalid paid period';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(normalized_email, 0));
  select * into previous from public.approved_purchases
    where gateway = p_gateway and external_order_id = p_order_id for update;
  if found then
    if lower(previous.customer_email) <> normalized_email or previous.plan_code <> p_plan_code then
      raise exception 'Existing order identity cannot change';
    end if;
    if previous.status in ('refunded', 'chargeback') then effective_status := previous.status;
    elsif previous.status = 'approved' and p_status in ('pending', 'cancelled') then effective_status := 'approved';
    end if;
  end if;
  insert into public.payment_webhook_events(gateway, external_event_id, event_type, payload)
  values (p_gateway, p_event_id, p_event_type, coalesce(p_payload, '{}'::jsonb))
  on conflict (gateway, external_event_id) do nothing;
  if not found then return previous.id; end if;
  insert into public.approved_purchases(gateway, external_order_id, customer_email, plan_code, status,
    paid_at, period_starts_at, period_ends_at, raw_payload)
  values(p_gateway, p_order_id, normalized_email, p_plan_code, effective_status,
    p_paid_at, p_period_starts_at, p_period_ends_at, coalesce(p_payload, '{}'::jsonb))
  on conflict(gateway, external_order_id) do update set status = excluded.status,
    paid_at = coalesce(public.approved_purchases.paid_at, excluded.paid_at),
    period_starts_at = coalesce(public.approved_purchases.period_starts_at, excluded.period_starts_at),
    period_ends_at = coalesce(public.approved_purchases.period_ends_at, excluded.period_ends_at),
    raw_payload = excluded.raw_payload
  returning id into purchase_id;
  perform public.apply_approved_purchase(purchase_id);
  if p_status = 'cancelled' and p_plan_code = 'monthly' then
    update public.subscriptions set cancel_at_period_end = true
    where user_id = (select id from auth.users where lower(email) = normalized_email limit 1)
      and plan_code = 'monthly';
  elsif p_status = 'approved' and effective_status = 'approved' then
    update public.subscriptions set cancel_at_period_end = false
    where user_id = (select id from auth.users where lower(email) = normalized_email limit 1);
  end if;
  return purchase_id;
end;
$$;

-- Only the trusted webhook/backend can update payment state.
revoke all on function public.apply_approved_purchase(uuid) from public, anon, authenticated;
revoke all on function public.process_payment_event(text,text,text,text,text,text,text,timestamptz,timestamptz,timestamptz,jsonb) from public, anon, authenticated;
grant execute on function public.process_payment_event(text,text,text,text,text,text,text,timestamptz,timestamptz,timestamptz,jsonb) to service_role;
revoke all on function public.hook_require_approved_purchase(jsonb) from public, anon, authenticated;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.hook_require_approved_purchase(jsonb) to supabase_auth_admin;
revoke all on function public.check_signup_eligibility(text) from public;
grant execute on function public.check_signup_eligibility(text) to anon, authenticated;

create or replace function public.has_active_access()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select has_access from public.get_my_access()), false);
$$;
revoke all on function public.has_active_access() from public, anon;
grant execute on function public.has_active_access() to authenticated;

-- Ownership still isolates accounts. This additional restrictive policy also
-- blocks direct API access when a subscription expires, with no cron required.
drop policy if exists saved_products_require_active_access on public.saved_products;
create policy saved_products_require_active_access on public.saved_products
as restrictive for all to authenticated
using ((select public.has_active_access())) with check ((select public.has_active_access()));
drop policy if exists preferences_require_active_access on public.user_preferences;
create policy preferences_require_active_access on public.user_preferences
as restrictive for all to authenticated
using ((select public.has_active_access())) with check ((select public.has_active_access()));
