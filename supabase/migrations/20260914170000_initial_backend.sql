-- Divulga backend: authentication profiles, product catalog, user data and Storage.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '' check (char_length(first_name) <= 80),
  last_name text not null default '' check (char_length(last_name) <= 80),
  email text not null check (char_length(email) <= 254),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists profiles_email_lower_idx on public.profiles (lower(email));

create table if not exists public.products (
  id text primary key check (char_length(id) between 1 and 120),
  item_id text not null,
  shop_id text not null,
  name text not null check (char_length(name) between 1 and 500),
  category text not null check (char_length(category) between 1 and 120),
  source_image_url text not null,
  image_path text,
  image_url text,
  source_url text not null,
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'BRL' check (currency ~ '^[A-Z]{3}$'),
  commission_rate numeric(5,2) check (commission_rate between 0 and 100),
  sales_count bigint check (sales_count >= 0),
  source_data jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  imported_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists products_category_idx on public.products(category);
create index if not exists products_active_idx on public.products(is_active) where is_active;

create table if not exists public.saved_products (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  affiliate_url text not null check (
    char_length(affiliate_url) between 8 and 2048
    and affiliate_url ~* '^https://'
  ),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, product_id)
);

create index if not exists saved_products_user_idx on public.saved_products(user_id);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  language text not null default 'pt-BR',
  theme text not null default 'light' check (theme = 'light'),
  style text not null default 'default',
  accent text not null default 'orange',
  sidebar_collapsed boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists saved_products_set_updated_at on public.saved_products;
create trigger saved_products_set_updated_at before update on public.saved_products
for each row execute function public.set_updated_at();

drop trigger if exists user_preferences_set_updated_at on public.user_preferences;
create trigger user_preferences_set_updated_at before update on public.user_preferences
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
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

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.saved_products enable row level security;
alter table public.user_preferences enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.products from anon, authenticated;
revoke all on table public.saved_products from anon, authenticated;
revoke all on table public.user_preferences from anon, authenticated;

grant select, update on table public.profiles to authenticated;
grant select on table public.products to anon, authenticated;
grant select, insert, update, delete on table public.saved_products to authenticated;
grant select, insert, update on table public.user_preferences to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products
for select to anon, authenticated using (is_active = true);

drop policy if exists "saved_products_select_own" on public.saved_products;
create policy "saved_products_select_own" on public.saved_products
for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "saved_products_insert_own" on public.saved_products;
create policy "saved_products_insert_own" on public.saved_products
for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "saved_products_update_own" on public.saved_products;
create policy "saved_products_update_own" on public.saved_products
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "saved_products_delete_own" on public.saved_products;
create policy "saved_products_delete_own" on public.saved_products
for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "preferences_select_own" on public.user_preferences;
create policy "preferences_select_own" on public.user_preferences
for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "preferences_insert_own" on public.user_preferences;
create policy "preferences_insert_own" on public.user_preferences
for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "preferences_update_own" on public.user_preferences;
create policy "preferences_update_own" on public.user_preferences
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read" on storage.objects
for select to anon, authenticated
using (bucket_id = 'product-images');
