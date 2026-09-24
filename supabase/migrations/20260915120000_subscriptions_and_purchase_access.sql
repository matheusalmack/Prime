-- Purchase-backed access control for monthly and lifetime accounts.

alter table public.profiles
  add column if not exists app_role text not null default 'member';

alter table public.profiles
  drop constraint if exists profiles_app_role_check;

alter table public.profiles
  add constraint profiles_app_role_check
  check (app_role in ('member', 'admin', 'founder'));

create table if not exists public.approved_purchases (
  id uuid primary key default gen_random_uuid(),
  gateway text not null default 'manual' check (char_length(gateway) between 2 and 40),
  external_order_id text not null check (char_length(external_order_id) between 1 and 160),
  customer_email text not null check (char_length(customer_email) <= 254),
  plan_code text not null check (plan_code in ('monthly', 'lifetime')),
  status text not null check (status in ('approved', 'pending', 'cancelled', 'refunded', 'chargeback')),
  paid_at timestamptz,
  period_starts_at timestamptz,
  period_ends_at timestamptz,
  user_id uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  applied_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (gateway, external_order_id)
);

create index if not exists approved_purchases_email_idx
  on public.approved_purchases (lower(customer_email));

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_code text not null check (plan_code in ('monthly', 'lifetime')),
  status text not null default 'active' check (status in ('active', 'past_due', 'cancelled', 'revoked')),
  access_starts_at timestamptz not null default timezone('utc', now()),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  source_purchase_id uuid references public.approved_purchases(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (
    (plan_code = 'lifetime' and current_period_end is null)
    or (plan_code = 'monthly' and current_period_end is not null)
  )
);

create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  gateway text not null,
  external_event_id text not null,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz not null default timezone('utc', now()),
  unique (gateway, external_event_id)
);

drop trigger if exists approved_purchases_set_updated_at on public.approved_purchases;
create trigger approved_purchases_set_updated_at before update on public.approved_purchases
for each row execute function public.set_updated_at();

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at before update on public.subscriptions
for each row execute function public.set_updated_at();

create or replace function public.apply_approved_purchase(p_purchase_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  purchase public.approved_purchases%rowtype;
  matched_user_id uuid;
  existing_end timestamptz;
begin
  select * into purchase
  from public.approved_purchases
  where id = p_purchase_id
  for update;

  if not found or purchase.status <> 'approved' or purchase.applied_at is not null then
    return;
  end if;

  select id into matched_user_id
  from auth.users
  where lower(email) = lower(purchase.customer_email)
  limit 1;

  if matched_user_id is null then
    return;
  end if;

  if purchase.plan_code = 'lifetime' then
    insert into public.subscriptions (
      user_id, plan_code, status, access_starts_at, current_period_end,
      cancel_at_period_end, source_purchase_id
    ) values (
      matched_user_id, 'lifetime', 'active', coalesce(purchase.paid_at, timezone('utc', now())),
      null, false, purchase.id
    )
    on conflict (user_id) do update set
      plan_code = 'lifetime',
      status = 'active',
      current_period_end = null,
      cancel_at_period_end = false,
      source_purchase_id = excluded.source_purchase_id;
  else
    select current_period_end into existing_end
    from public.subscriptions
    where user_id = matched_user_id and plan_code = 'monthly';

    insert into public.subscriptions (
      user_id, plan_code, status, access_starts_at, current_period_end,
      cancel_at_period_end, source_purchase_id
    ) values (
      matched_user_id, 'monthly', 'active', coalesce(purchase.period_starts_at, purchase.paid_at, timezone('utc', now())),
      coalesce(
        purchase.period_ends_at,
        greatest(coalesce(existing_end, timezone('utc', now())), timezone('utc', now())) + interval '30 days'
      ),
      false, purchase.id
    )
    on conflict (user_id) do update set
      plan_code = case when public.subscriptions.plan_code = 'lifetime' then 'lifetime' else 'monthly' end,
      status = 'active',
      current_period_end = case
        when public.subscriptions.plan_code = 'lifetime' then null
        else excluded.current_period_end
      end,
      cancel_at_period_end = false,
      source_purchase_id = excluded.source_purchase_id;
  end if;

  update public.approved_purchases
  set user_id = matched_user_id,
      claimed_at = coalesce(claimed_at, timezone('utc', now())),
      applied_at = timezone('utc', now())
  where id = purchase.id;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  purchase_id uuid;
begin
  insert into public.profiles (id, first_name, last_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do update set
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    email = excluded.email;

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  for purchase_id in
    select id
    from public.approved_purchases
    where lower(customer_email) = lower(coalesce(new.email, ''))
      and status = 'approved'
      and applied_at is null
    order by paid_at nulls last, created_at
  loop
    perform public.apply_approved_purchase(purchase_id);
  end loop;

  return new;
end;
$$;

create or replace function public.hook_require_approved_purchase(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_email text := lower(trim(event -> 'user' ->> 'email'));
begin
  if requested_email <> '' and exists (
    select 1
    from public.approved_purchases
    where lower(customer_email) = requested_email
      and status = 'approved'
      and (
        plan_code = 'lifetime'
        or coalesce(period_ends_at, timezone('utc', now()) + interval '30 days') > timezone('utc', now())
      )
  ) then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 403,
      'message', 'Nenhuma compra aprovada foi encontrada para este e-mail.'
    )
  );
end;
$$;

create or replace function public.check_signup_eligibility(p_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.approved_purchases
    where lower(customer_email) = lower(trim(p_email))
      and status = 'approved'
      and (
        plan_code = 'lifetime'
        or coalesce(period_ends_at, timezone('utc', now()) + interval '30 days') > timezone('utc', now())
      )
  );
$$;

create or replace function public.get_my_access()
returns table (
  has_access boolean,
  plan_code text,
  account_role text,
  access_ends_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(
      p.app_role in ('admin', 'founder')
      or (
        s.status = 'active'
        and (s.plan_code = 'lifetime' or s.current_period_end > timezone('utc', now()))
      ),
      false
    ) as has_access,
    s.plan_code,
    p.app_role,
    s.current_period_end
  from public.profiles p
  left join public.subscriptions s on s.user_id = p.id
  where p.id = auth.uid();
$$;

create or replace function public.process_payment_event(
  p_gateway text,
  p_event_id text,
  p_event_type text,
  p_order_id text,
  p_email text,
  p_plan_code text,
  p_status text,
  p_paid_at timestamptz,
  p_period_starts_at timestamptz,
  p_period_ends_at timestamptz,
  p_payload jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  purchase_id uuid;
begin
  insert into public.payment_webhook_events (gateway, external_event_id, event_type, payload)
  values (p_gateway, p_event_id, p_event_type, coalesce(p_payload, '{}'::jsonb))
  on conflict (gateway, external_event_id) do nothing;

  if not found then
    select id into purchase_id
    from public.approved_purchases
    where gateway = p_gateway and external_order_id = p_order_id;
    return purchase_id;
  end if;

  insert into public.approved_purchases (
    gateway, external_order_id, customer_email, plan_code, status, paid_at,
    period_starts_at, period_ends_at, raw_payload
  ) values (
    p_gateway, p_order_id, lower(trim(p_email)), p_plan_code, p_status, p_paid_at,
    p_period_starts_at, p_period_ends_at, coalesce(p_payload, '{}'::jsonb)
  )
  on conflict (gateway, external_order_id) do update set
    customer_email = excluded.customer_email,
    plan_code = excluded.plan_code,
    status = excluded.status,
    paid_at = coalesce(excluded.paid_at, public.approved_purchases.paid_at),
    period_starts_at = coalesce(excluded.period_starts_at, public.approved_purchases.period_starts_at),
    period_ends_at = coalesce(excluded.period_ends_at, public.approved_purchases.period_ends_at),
    raw_payload = excluded.raw_payload,
    applied_at = case
      when public.approved_purchases.status <> 'approved' and excluded.status = 'approved' then null
      else public.approved_purchases.applied_at
    end
  returning id into purchase_id;

  if p_status = 'approved' then
    perform public.apply_approved_purchase(purchase_id);
  elsif p_status in ('refunded', 'chargeback') then
    update public.subscriptions
    set status = 'revoked', current_period_end = case when plan_code = 'monthly' then timezone('utc', now()) else null end
    where source_purchase_id = purchase_id;
  elsif p_status = 'cancelled' then
    update public.subscriptions
    set cancel_at_period_end = true
    where source_purchase_id = purchase_id and plan_code = 'monthly';
  end if;

  return purchase_id;
end;
$$;

alter table public.approved_purchases enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payment_webhook_events enable row level security;

revoke all on table public.approved_purchases from anon, authenticated;
revoke all on table public.subscriptions from anon, authenticated;
revoke all on table public.payment_webhook_events from anon, authenticated;
revoke all on function public.apply_approved_purchase(uuid) from public, anon, authenticated;
revoke all on function public.process_payment_event(text, text, text, text, text, text, text, timestamptz, timestamptz, timestamptz, jsonb) from public, anon, authenticated;
revoke all on function public.hook_require_approved_purchase(jsonb) from public, anon, authenticated;
grant execute on function public.hook_require_approved_purchase(jsonb) to supabase_auth_admin;
grant execute on function public.check_signup_eligibility(text) to anon, authenticated;
grant execute on function public.get_my_access() to authenticated;
grant select on table public.subscriptions to authenticated;

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions
for select to authenticated using ((select auth.uid()) = user_id);

-- Profiles may edit names only; account roles remain backend-controlled.
revoke update on table public.profiles from authenticated;
grant update (first_name, last_name) on table public.profiles to authenticated;

