-- Run once in the hosted Supabase project after deploying prime-maintenance.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
-- Restricted credential stays in Vault, never in application code or the frontend.
do $$ begin
 if not exists(select 1 from vault.secrets where name='prime_maintenance_token') then
  perform vault.create_secret(replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-',''),'prime_maintenance_token','Prime lifecycle scheduler only');
 end if;
end; $$;
create or replace function public.verify_prime_maintenance_token(p_token text)
returns boolean language sql security definer set search_path='' as $$
 select exists(select 1 from vault.decrypted_secrets where name='prime_maintenance_token' and decrypted_secret=p_token);
$$;
revoke all on function public.verify_prime_maintenance_token(text) from public,anon,authenticated;
grant execute on function public.verify_prime_maintenance_token(text) to service_role;
select cron.schedule('prime-account-maintenance','*/10 * * * *', $job$
 select net.http_post(
  url:='https://ikgilxwdllxyjmufvtqh.supabase.co/functions/v1/prime-maintenance',
  headers:=jsonb_build_object('Content-Type','application/json','x-prime-job-token',
   (select decrypted_secret from vault.decrypted_secrets where name='prime_maintenance_token')),
  body:='{}'::jsonb,timeout_milliseconds:=30000
 );
$job$);
