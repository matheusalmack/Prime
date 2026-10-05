-- Account deletion is requested now, finalized only after 30 days without a new login.
create table if not exists public.prime_account_deletions (
 user_id uuid primary key references auth.users(id) on delete cascade,
 requested_at timestamptz not null default now(),
 delete_after timestamptz not null default (now()+interval '30 days'),
 check(delete_after >= requested_at+interval '30 days')
);
alter table public.prime_account_deletions enable row level security;
revoke all on public.prime_account_deletions from anon,authenticated;
grant select on public.prime_account_deletions to authenticated;
grant all on public.prime_account_deletions to service_role;
drop policy if exists "Read own deletion request" on public.prime_account_deletions;
create policy "Read own deletion request" on public.prime_account_deletions for select to authenticated using(user_id=auth.uid());

-- Files are queued for Storage API removal AFTER the database deletion commits.
-- This avoids removing a photo if a concurrent login cancels the request.
create table if not exists public.prime_storage_cleanup (
 id uuid primary key default gen_random_uuid(),bucket_id text not null,object_name text not null,
 created_at timestamptz not null default now(),unique(bucket_id,object_name)
);
alter table public.prime_storage_cleanup enable row level security;
revoke all on public.prime_storage_cleanup from anon,authenticated;
grant all on public.prime_storage_cleanup to service_role;

create or replace function public.request_prime_account_deletion(p_user_id uuid,p_email text)
returns timestamptz language plpgsql security definer set search_path='' as $$
declare actual_email text; deadline timestamptz;
begin
 select email into actual_email from auth.users where id=p_user_id for update;
 if actual_email is null or lower(trim(p_email))<>lower(actual_email) then raise exception 'Confirm your email'; end if;
 insert into public.prime_account_deletions(user_id) values(p_user_id) on conflict(user_id) do nothing;
 select delete_after into deadline from public.prime_account_deletions where user_id=p_user_id;
 return deadline;
end; $$;
revoke all on function public.request_prime_account_deletion(uuid,text) from public,anon,authenticated;
grant execute on function public.request_prime_account_deletion(uuid,text) to service_role;

create or replace function public.cancel_prime_deletion_on_login()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 -- All lifecycle operations lock the user first, so login and finalization serialize.
 perform id from auth.users where id=new.user_id for update;
 delete from public.prime_account_deletions where user_id=new.user_id;
 return new;
end; $$;
revoke all on function public.cancel_prime_deletion_on_login() from public,anon,authenticated;
drop trigger if exists prime_cancel_deletion_on_login on auth.sessions;
create trigger prime_cancel_deletion_on_login before insert on auth.sessions for each row execute function public.cancel_prime_deletion_on_login();

create or replace function public.finalize_due_prime_account_deletions()
returns integer language plpgsql security definer set search_path='' as $$
declare candidate uuid; deadline timestamptz; deleted_count integer:=0;
begin
 for candidate in select user_id from public.prime_account_deletions where delete_after<=now() order by delete_after limit 50 loop
  perform id from auth.users where id=candidate for update;
  select delete_after into deadline from public.prime_account_deletions where user_id=candidate for update;
  if deadline is null or deadline>now() then continue; end if;
  insert into public.prime_storage_cleanup(bucket_id,object_name)
   select bucket_id,name from storage.objects where owner=candidate or owner_id=candidate::text
    or (bucket_id='prime-avatars' and split_part(name,'/',1)=candidate::text)
   on conflict(bucket_id,object_name) do nothing;
  -- Keep physical objects for reliable API cleanup; only detach auth ownership here.
  update storage.objects set owner=null,owner_id=null where owner=candidate or owner_id=candidate::text;
  delete from auth.users where id=candidate;
  deleted_count:=deleted_count+1;
 end loop;
 return deleted_count;
end; $$;
revoke all on function public.finalize_due_prime_account_deletions() from public,anon,authenticated;
grant execute on function public.finalize_due_prime_account_deletions() to service_role;

-- Queue only NEW approved buyers, never recreate an existing customer's account.
create table if not exists public.prime_account_activations (
 email text primary key,purchase_id uuid not null references public.approved_purchases(id),
 created_at timestamptz not null default now(),completed_at timestamptz,
 attempts integer not null default 0,next_attempt_at timestamptz not null default now(),
 lease_until timestamptz,lease_id uuid
);
alter table public.prime_account_activations enable row level security;
revoke all on public.prime_account_activations from anon,authenticated;
grant all on public.prime_account_activations to service_role;
create or replace function public.queue_prime_buyer_activation()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status='approved' and not exists(select 1 from auth.users where lower(email)=lower(new.customer_email)) then
  insert into public.prime_account_activations(email,purchase_id) values(lower(new.customer_email),new.id) on conflict(email) do nothing;
 end if;
 return new;
end; $$;
revoke all on function public.queue_prime_buyer_activation() from public,anon,authenticated;
drop trigger if exists prime_queue_buyer_activation on public.approved_purchases;
create trigger prime_queue_buyer_activation after insert or update of status on public.approved_purchases for each row execute function public.queue_prime_buyer_activation();

create or replace function public.claim_prime_buyer_activation(p_email text default null)
returns table(email text,lease_id uuid,existing_user boolean,existing_needs_password boolean) language plpgsql security definer set search_path='' as $$
declare job public.prime_account_activations%rowtype; lease uuid:=gen_random_uuid();
begin
 select a.* into job from public.prime_account_activations a where a.completed_at is null
 and a.next_attempt_at<=now() and (a.lease_until is null or a.lease_until<now())
 and (p_email is null or a.email=lower(trim(p_email)))
 order by a.created_at for update skip locked limit 1;
 if not found then return; end if;
 -- Recheck entitlement: a refund may arrive before the invitation is sent.
 if not public.check_signup_eligibility(job.email) then
  update public.prime_account_activations a set completed_at=now() where a.email=job.email;
  return;
 end if;
 update public.prime_account_activations a set lease_until=now()+interval '5 minutes',lease_id=lease,attempts=a.attempts+1 where a.email=job.email;
 return query select job.email,lease,exists(select 1 from auth.users u where lower(u.email)=job.email),coalesce((select u.raw_user_meta_data->>'prime_needs_password'='true' from auth.users u where lower(u.email)=job.email limit 1),false);
end; $$;
revoke all on function public.claim_prime_buyer_activation(text) from public,anon,authenticated;
grant execute on function public.claim_prime_buyer_activation(text) to service_role;
create or replace function public.finish_prime_buyer_activation(p_email text,p_lease_id uuid,p_success boolean)
returns void language sql security definer set search_path='' as $$
 update public.prime_account_activations a set completed_at=case when p_success then now() else null end,
 lease_until=null,lease_id=null,next_attempt_at=now()+interval '10 minutes'
 where a.email=p_email and a.lease_id=p_lease_id;
$$;
revoke all on function public.finish_prime_buyer_activation(text,uuid,boolean) from public,anon,authenticated;
grant execute on function public.finish_prime_buyer_activation(text,uuid,boolean) to service_role;
