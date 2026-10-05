begin;
create or replace function public.get_my_prime_sessions()
returns table(id uuid,created_at timestamptz,expires_at timestamptz,user_agent text,ip text,is_current boolean)
language sql stable security definer set search_path='' as $$
 select s.id,s.created_at,s.not_after,s.user_agent,s.ip::text,s.id::text=coalesce(auth.jwt()->>'session_id','')
 from auth.sessions s where s.user_id=(select auth.uid()) and (s.not_after is null or s.not_after>now())
 order by s.created_at desc;
$$;
revoke all on function public.get_my_prime_sessions() from public,anon;
grant execute on function public.get_my_prime_sessions() to authenticated;
create or replace function public.revoke_my_prime_session(p_session_id uuid) returns boolean
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then return false; end if;
 delete from auth.sessions where id=p_session_id and user_id=auth.uid();
 return found;
end;
$$;
revoke all on function public.revoke_my_prime_session(uuid) from public,anon;
grant execute on function public.revoke_my_prime_session(uuid) to authenticated;
commit;
