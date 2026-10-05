begin;
create table if not exists public.prime_analytics_sessions (
 visitor_id uuid not null,
 session_id uuid not null,
 user_id uuid references auth.users(id) on delete cascade,
 auth_session_id uuid,
 created_at timestamptz not null default now(),
 last_seen_at timestamptz not null default now(),
 ip inet,
 ip_source text,
 user_agent text,
 device text not null,
 platform text,
 language text,
 timezone text,
 screen_width integer,
 screen_height integer,
 first_page text not null,
 last_page text not null,
 consent jsonb not null,
 primary key (visitor_id,session_id)
);
alter table public.prime_analytics_sessions enable row level security;
revoke all on table public.prime_analytics_sessions from anon,authenticated;
grant select on table public.prime_analytics_sessions to authenticated;
do $$ begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='prime_analytics_sessions' and policyname='Read own analytics sessions') then
  create policy "Read own analytics sessions" on public.prime_analytics_sessions for select to authenticated using(user_id=(select auth.uid()));
 end if;
end $$;
create index if not exists prime_analytics_user_idx on public.prime_analytics_sessions(user_id);
create index if not exists prime_analytics_ip_created_idx on public.prime_analytics_sessions(ip,created_at);
-- Only accepts consented analytics. Account/session identity comes from the
-- verified JWT; IP and user agent come from the request, never the payload.
create or replace function public.record_prime_analytics(p_visitor_id uuid,p_session_id uuid,p_consent jsonb,p_details jsonb,p_page text)
returns void language plpgsql security definer set search_path='' as $$
declare
 headers jsonb:=coalesce(nullif(current_setting('request.headers',true),'')::jsonb,'{}'::jsonb);
 session_claim text:=auth.jwt()->>'session_id';
 current_session uuid;
 request_ip inet;
 source text;
 ua text;
 origin text:=headers->>'origin';
begin
 if origin is null or origin not in ('http://localhost:5174','http://127.0.0.1:5174','https://primeafiliado.com','https://www.primeafiliado.com','https://prime-bay-seven.vercel.app') then raise exception 'Origin not allowed'; end if;
 if p_visitor_id is null or p_session_id is null or p_consent->'analytics' is distinct from 'true'::jsonb then raise exception 'Analytics consent required'; end if;
 if jsonb_typeof(p_details) is distinct from 'object' or octet_length(p_details::text)>2048 or octet_length(p_consent::text)>1024 or p_page is null or p_page not like '/%' or length(p_page)>200 or p_page~'[?#]' then raise exception 'Invalid analytics data'; end if;
 if p_details->>'device' not in ('mobile','tablet','desktop') or p_details->>'device' is null then raise exception 'Invalid device'; end if;
 begin current_session:=session_claim::uuid; exception when invalid_text_representation then current_session:=null; end;
 -- Cloudflare's incoming client IP is supplied by the Supabase gateway.
 -- If not present, use the authenticated login IP, with its provenance retained.
 begin request_ip:=nullif(headers->>'cf-connecting-ip','')::inet; exception when invalid_text_representation then request_ip:=null; end;
 if request_ip is not null then source:='request_gateway'; end if;
 ua:=left(headers->>'user-agent',1024);
 if auth.uid() is not null then
  if not exists(select 1 from auth.sessions where id=current_session and user_id=auth.uid() and (not_after is null or not_after>now())) then raise exception 'Invalid session'; end if;
  if request_ip is null then select s.ip into request_ip from auth.sessions s where s.id=current_session and s.user_id=auth.uid(); if request_ip is not null then source:='auth_session'; end if; end if;
 end if;
 -- Bound creation by server-observed IP, including callers rotating UUIDs.
 if request_ip is null and auth.uid() is null then return; end if;
 if request_ip is not null and not exists(select 1 from public.prime_analytics_sessions where visitor_id=p_visitor_id and session_id=p_session_id)
 and (select count(*) from public.prime_analytics_sessions where ip=request_ip and created_at>now()-interval '1 hour')>=60 then return; end if;
 -- Bound repeated updates from the same visitor session; no public read access.
 if exists(select 1 from public.prime_analytics_sessions where visitor_id=p_visitor_id and session_id=p_session_id and last_seen_at>now()-interval '15 seconds') then return; end if;
 insert into public.prime_analytics_sessions(visitor_id,session_id,user_id,auth_session_id,ip,ip_source,user_agent,device,platform,language,timezone,screen_width,screen_height,first_page,last_page,consent)
 values(p_visitor_id,p_session_id,auth.uid(),current_session,request_ip,source,ua,p_details->>'device',left(p_details->>'platform',80),left(p_details->>'language',40),left(p_details->>'timezone',80),least(20000,greatest(0,(p_details->>'screen_width')::integer)),least(20000,greatest(0,(p_details->>'screen_height')::integer)),p_page,p_page,jsonb_build_object('analytics',true,'advertising',p_consent->'advertising'='true'::jsonb,'decidedAt',left(p_consent->>'decidedAt',64)))
 on conflict(visitor_id,session_id) do update set last_seen_at=now(),last_page=excluded.last_page,consent=excluded.consent
 where public.prime_analytics_sessions.user_id is not distinct from excluded.user_id;
end;
$$;
revoke all on function public.record_prime_analytics(uuid,uuid,jsonb,jsonb,text) from public;
grant execute on function public.record_prime_analytics(uuid,uuid,jsonb,jsonb,text) to anon,authenticated;
notify pgrst,'reload schema';
commit;
