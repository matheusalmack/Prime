insert into public.profiles (id, first_name, last_name, email)
select
  id,
  coalesce(raw_user_meta_data ->> 'first_name', ''),
  coalesce(raw_user_meta_data ->> 'last_name', ''),
  coalesce(email, '')
from auth.users
on conflict (id) do update set
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  email = excluded.email;

insert into public.user_preferences (user_id)
select id from auth.users
on conflict (user_id) do nothing;
