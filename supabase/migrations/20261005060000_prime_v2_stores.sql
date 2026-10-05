begin;
create table if not exists public.prime_stores (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(length(trim(name)) between 1 and 60),
 domain text unique check(domain is null or domain ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(domain) between 3 and 63),
 status text not null default 'draft' check(status in ('draft','published')),
 settings jsonb not null default '{}' check(jsonb_typeof(settings)='object'),
 product_ids jsonb not null default '[]' check(jsonb_typeof(product_ids)='array'),
 affiliate_links jsonb not null default '{}' check(jsonb_typeof(affiliate_links)='object'),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(status <> 'published' or domain is not null)
);
create index if not exists prime_stores_user_id_idx on public.prime_stores(user_id);
alter table public.prime_stores enable row level security;
revoke all on public.prime_stores from anon;
grant select,insert,update,delete on public.prime_stores to authenticated;
drop policy if exists prime_stores_owner on public.prime_stores;
create policy prime_stores_owner on public.prime_stores for all to authenticated
 using(user_id=(select auth.uid()) and (select public.has_active_access()))
 with check(user_id=(select auth.uid()) and (select public.has_active_access()));
drop trigger if exists prime_stores_updated on public.prime_stores;
create trigger prime_stores_updated before update on public.prime_stores for each row execute function public.set_updated_at();
-- Only explicitly published storefront content is public. No profile or private saved-products query is exposed.
create or replace function public.get_prime_store(p_domain text) returns jsonb language sql stable security definer set search_path='' as $$
 select s.settings || jsonb_build_object('id',s.id,'name',s.name,'domain',s.domain,'status',s.status,'productIds',s.product_ids,'affiliateLinks',s.affiliate_links)
 from public.prime_stores s join public.profiles p on p.id=s.user_id left join public.subscriptions sub on sub.user_id=p.id
 where s.domain=p_domain and s.status='published' and (p.app_role in ('admin','founder') or sub.status='active' and (sub.plan_code='lifetime' or sub.current_period_end>now()));
$$;
revoke all on function public.get_prime_store(text) from public;
grant execute on function public.get_prime_store(text) to anon,authenticated;
commit;
