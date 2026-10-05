import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { resolvePaymentStatus, resolveOfferPlan } from '../supabase/functions/applyfy-webhook/payment-contract.mjs';
const db = new PGlite();
let sequence = 0;
const uid = () => crypto.randomUUID();
async function scalar(sql, values = []) { return Object.values((await db.query(sql, values)).rows[0])[0]; }
async function payment(email, plan = 'monthly', status = 'approved', options = {}) {
  return scalar('select public.process_payment_event($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)', [
    'applyfy', options.event ?? `evt-${++sequence}`, `payment.${status}`, options.order ?? `order-${sequence}`,
    email, plan, status, options.paid ?? new Date().toISOString(), null, options.end ?? null, {},
  ]);
}
async function user(email) {
  const id = uid();
  await db.query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)', [id,email,{first_name:'Cliente',last_name:'Teste'}]);
  return id;
}
async function access(id) {
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);
  return (await db.query('select * from public.get_my_access()')).rows[0];
}
before(async () => {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create role supabase_auth_admin;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
    create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id) on delete cascade,created_at timestamptz default now(),not_after timestamptz,user_agent text,ip inet);
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to authenticated;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid,bucket_id text,name text,owner uuid,owner_id text);
  `);
  for (const file of ['20260914170000_initial_backend.sql','20260915120000_subscriptions_and_purchase_access.sql','20260922220000_harden_purchase_access.sql','20261005060000_prime_v2_stores.sql','20261005061000_prime_v2_sessions.sql','20261005062000_prime_v2_avatars.sql','20261005064000_prime_v2_account_lifecycle.sql']) {
    await db.exec(await readFile(new URL(`../supabase/migrations/${file}`,import.meta.url),'utf8'));
  }
});
after(() => db.close());

test('four offers map to correct access; unknown and negative statuses fail closed', () => {
  assert.equal(resolveOfferPlan('X1XE2DU'),'monthly'); assert.equal(resolveOfferPlan('2E2RG39'),'monthly');
  assert.equal(resolveOfferPlan('ENMG0W8'),'lifetime'); assert.equal(resolveOfferPlan('L83RFTI'),'lifetime');
  assert.equal(resolveOfferPlan('unknown'),null);
  for (const s of ['unapproved','not_paid','unsuccessful','incomplete']) assert.equal(resolvePaymentStatus(s),null);
});
test('purchase reserves access before signup; user starts with no saved products', async () => {
  const email='new@example.test';
  assert.equal(await scalar('select public.check_signup_eligibility($1)',[email]),false);
  await payment(email);
  assert.equal(await scalar('select public.check_signup_eligibility($1)',[' NEW@example.test ']),true);
  const id=await user(email); const result=await access(id);
  assert.equal(result.has_access,true); assert.equal(result.plan_code,'monthly');
  assert.equal(await scalar('select count(*)::int from public.saved_products where user_id=$1',[id]),0);
  assert.equal(await scalar('select first_name from public.profiles where id=$1',[id]),'Cliente');
});
test('monthly purchase older than 30 days cannot be activated; lifetime remains valid', async () => {
  const paid=new Date(Date.now()-31*86400000).toISOString();
  await payment('old@example.test','monthly','approved',{paid});
  assert.equal(await scalar('select public.check_signup_eligibility($1)',['old@example.test']),false);
  const blocked=await scalar("select public.hook_require_approved_purchase($1)",[{user:{email:'old@example.test'}}]);
  assert.equal(blocked.error.http_code,403);
  await payment('forever@example.test','lifetime','approved',{paid});
  assert.equal((await access(await user('forever@example.test'))).has_access,true);
});
test('duplicate events and duplicate approval callbacks cannot extend paid time', async () => {
  const email='duplicate@example.test'; await payment(email,'monthly','approved',{event:'same-event',order:'same-order'});
  const id=await user(email); const end=(await access(id)).access_ends_at;
  await payment(email,'monthly','approved',{event:'same-event',order:'same-order'});
  await payment(email,'monthly','approved',{event:'different-event',order:'same-order'});
  assert.deepEqual((await access(id)).access_ends_at,end);
});
test('renewal adds 30 days; cancellation preserves paid access; refund removes renewal', async () => {
  const email='renew@example.test'; await payment(email,'monthly','approved',{order:'first-renew'});
  const id=await user(email); const firstEnd=(await access(id)).access_ends_at;
  await payment(email,'monthly','approved',{order:'second-renew'});
  assert.equal(new Date((await access(id)).access_ends_at)-new Date(firstEnd),30*86400000);
  await payment(email,'monthly','cancelled',{order:'second-renew'});
  assert.equal((await access(id)).has_access,true);
  await payment(email,'monthly','refunded',{order:'second-renew'});
  assert.deepEqual((await access(id)).access_ends_at,firstEnd);
});
test('late approval cannot undo refund; monthly payment cannot remove lifetime access', async () => {
  const email='mixed@example.test'; await payment(email,'lifetime','approved',{order:'life-order'});
  const id=await user(email); await payment(email,'monthly','approved',{order:'month-order'});
  assert.equal((await access(id)).plan_code,'lifetime');
  await payment(email,'monthly','refunded',{order:'month-order'});
  assert.equal((await access(id)).plan_code,'lifetime');
  await payment(email,'lifetime','refunded',{order:'life-order'});
  assert.equal((await access(id)).has_access,false);
  await payment(email,'lifetime','approved',{order:'life-order'});
  assert.equal((await access(id)).has_access,false);
});
test('RLS isolates users and blocks expired customers even with an existing JWT', async () => {
  const email='rls@example.test'; await payment(email); const id=await user(email);
  const other=await user('other@example.test');
  await db.query("insert into public.products(id,item_id,shop_id,name,category,source_image_url,source_url,price_cents) values('fixture','i','s','Produto','Teste','https://example.test/a.png','https://example.test',100)");
  await access(id); await db.exec('set role authenticated');
  try {
    await db.query("insert into public.saved_products(user_id,product_id,affiliate_url) values($1,'fixture','https://example.test/mine')",[id]);
    await assert.rejects(db.query("insert into public.saved_products(user_id,product_id,affiliate_url) values($1,'fixture','https://example.test/other')",[other]));
  } finally { await db.exec('reset role'); }
  await db.query("update public.subscriptions set current_period_end=now()-interval '1 second' where user_id=$1",[id]);
  await db.exec('set role authenticated');
  try {
    assert.equal(await scalar('select count(*)::int from public.saved_products'),0);
    await assert.rejects(db.query("update public.user_preferences set sidebar_collapsed=false where user_id=$1 returning *",[other]).then(r=>{ if(r.rows.length===0) throw new Error('blocked'); }));
    await assert.rejects(db.query("insert into public.saved_products(user_id,product_id,affiliate_url) values($1,'fixture','https://example.test/expired') on conflict(user_id,product_id) do update set affiliate_url=excluded.affiliate_url",[id]));
  } finally { await db.exec('reset role'); }
});

test('official Applyfy payload validates offer, plan, approval and stable transaction identity', async () => {
  const { normalizeApplyfyPayment } = await import('../supabase/functions/applyfy-webhook/payment-contract.mjs');
  const payload={event:'TRANSACTION_PAID',token:'never-store-me',offerCode:'2E2RG39',client:{email:' Buyer@example.test '},transaction:{id:'txn-real-shape',status:'COMPLETED',payedAt:new Date().toISOString()}};
  const event=normalizeApplyfyPayment(payload,'monthly');
  assert.equal(event.p_email,'buyer@example.test');
  assert.equal(event.p_event_id,'txn-real-shape:TRANSACTION_PAID');
  assert.equal(JSON.stringify(event).includes('never-store-me'),false);
  assert.throws(()=>normalizeApplyfyPayment(payload,'lifetime'));
  assert.throws(()=>normalizeApplyfyPayment({...payload,transaction:{...payload.transaction,status:'PENDING'}},'monthly'));
  assert.throws(()=>normalizeApplyfyPayment({...payload,transaction:{...payload.transaction,payedAt:null}},'monthly'));
  assert.equal(normalizeApplyfyPayment({...payload,event:'SESSION_CREATED'},'monthly'),null);
});


test('store RLS isolates customers and anonymous visitors only see published storefronts', async () => {
  await payment('store-owner@example.test','lifetime');
  await payment('store-other@example.test','lifetime');
  const owner=await user('store-owner@example.test'),other=await user('store-other@example.test');
  await db.exec('grant usage on schema public to authenticated,anon');
  await access(owner);
  await db.exec('set role authenticated');
  const id=await scalar("insert into public.prime_stores(user_id,name,domain,status) values(auth.uid(),'Vitrine','vitrine-teste','draft') returning id");
  assert.equal(await scalar('select count(*)::int from public.prime_stores'),1);
  await db.exec('reset role');await access(other);await db.exec('set role authenticated');
  assert.equal(await scalar('select count(*)::int from public.prime_stores'),0);
  assert.equal(await scalar("select public.get_prime_store('vitrine-teste')"),null);
  await db.exec('reset role');await access(owner);await db.exec('set role authenticated');
  await db.query("update public.prime_stores set status='published' where id=$1",[id]);
  await db.exec('reset role; set role anon');
  const storefront=await scalar("select public.get_prime_store('vitrine-teste')");
  assert.equal(storefront.name,'Vitrine');assert.equal(storefront.user_id,undefined);
  await assert.rejects(db.query('select * from public.prime_stores'));
  await db.exec('reset role');
});

test('session APIs expose only caller sessions and cannot revoke another customer', async()=>{
 const owner=await user('session-owner@example.test'),other=await user('session-other@example.test'),first=uid(),second=uid();
 await db.query('insert into auth.sessions(id,user_id) values($1,$2),($3,$4)',[first,owner,second,other]);
 await access(owner);await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({session_id:first})]);
 await db.exec('set role authenticated');
 const sessions=(await db.query('select * from public.get_my_prime_sessions()')).rows;
 assert.equal(sessions.length,1);assert.equal(sessions[0].id,first);assert.equal(sessions[0].is_current,true);
 assert.equal(await scalar('select public.revoke_my_prime_session($1)',[second]),false);
 assert.equal(await scalar('select public.revoke_my_prime_session($1)',[first]),true);
 await db.exec('reset role');assert.equal(await scalar('select count(*)::int from auth.sessions where id=$1',[second]),1);
});

test('profile avatar bucket stays private',async()=>{
 assert.equal(await scalar("select public from storage.buckets where id='prime-avatars'"),false);
});

test('avatar rules prevent cross-account reads and uploads',async()=>{
 const owner=await user('avatar-owner@example.test'),other=await user('avatar-other@example.test');
 await db.exec('alter table storage.objects enable row level security; grant usage on schema storage to authenticated; grant select,insert,update on storage.objects to authenticated');
 await access(owner);await db.exec('set role authenticated');
 await db.query('insert into storage.objects(id,bucket_id,name) values($1,$2,$3)',[uid(),'prime-avatars',`${owner}/avatar.jpg`]);
 await assert.rejects(db.query('insert into storage.objects(id,bucket_id,name) values($1,$2,$3)',[uid(),'prime-avatars',`${other}/avatar.jpg`]));
 await db.exec('reset role');await access(other);await db.exec('set role authenticated');
 assert.equal(await scalar("select count(*)::int from storage.objects where bucket_id='prime-avatars'"),0);
 await db.exec('reset role');
});


test('account deletion waits 30 days, stays idempotent and a new login cancels it',async()=>{
 const id=await user('delete-delay@example.test');
 const deadline=await scalar('select public.request_prime_account_deletion($1,$2)',[id,'delete-delay@example.test']);
 assert.ok(new Date(deadline)-Date.now()>=30*86400000-5000);
 assert.deepEqual(await scalar('select public.request_prime_account_deletion($1,$2)',[id,'delete-delay@example.test']),deadline);
 assert.equal(await scalar('select public.finalize_due_prime_account_deletions()'),0);
 assert.equal(await scalar('select count(*)::int from auth.users where id=$1',[id]),1);
 await db.query('insert into auth.sessions(id,user_id) values($1,$2)',[uid(),id]);
 assert.equal(await scalar('select count(*)::int from public.prime_account_deletions where user_id=$1',[id]),0);
});
test('only due deletions finalize; storage cleanup is queued after the account is removed',async()=>{
 const id=await user('due-delete@example.test');
 await db.query("insert into public.prime_account_deletions(user_id,requested_at,delete_after) values($1,now()-interval '31 days',now()-interval '1 day')",[id]);
 await db.query("insert into storage.objects(id,bucket_id,name,owner,owner_id) values($1,'prime-avatars',$2,$3,$4)",[uid(),id+'/avatar.jpg',id,id]);
 assert.equal(await scalar('select public.finalize_due_prime_account_deletions()'),1);
 assert.equal(await scalar('select count(*)::int from auth.users where id=$1',[id]),0);
 assert.equal(await scalar('select count(*)::int from public.prime_storage_cleanup where object_name=$1',[id+'/avatar.jpg']),1);
 assert.equal(await scalar('select owner from storage.objects where name=$1',[id+'/avatar.jpg']),null);
});
test('activation outbox ignores existing buyers, leases work and stops refunded purchases',async()=>{
 const email='activation@example.test';await payment(email);
 const first=(await db.query('select * from public.claim_prime_buyer_activation($1)',[email])).rows[0];
 assert.equal(first.email,email);assert.equal(first.existing_user,false);
 assert.equal((await db.query('select * from public.claim_prime_buyer_activation($1)',[email])).rows.length,0);
 await scalar('select public.finish_prime_buyer_activation($1,$2,true)',[email,first.lease_id]);
 assert.equal((await db.query('select * from public.claim_prime_buyer_activation($1)',[email])).rows.length,0);
 const existing='existing-activation@example.test';await user(existing);await payment(existing);
 assert.equal(await scalar('select count(*)::int from public.prime_account_activations where email=$1',[existing]),0);
 const refund='refunded-activation@example.test';await payment(refund,'monthly','approved',{order:'activation-refund'});await payment(refund,'monthly','refunded',{order:'activation-refund'});
 assert.equal((await db.query('select * from public.claim_prime_buyer_activation($1)',[refund])).rows.length,0);
});
test('customers cannot request deletion or activation for another account through service RPCs',async()=>{
 await db.exec('set role authenticated');
 try{await assert.rejects(db.query('select public.request_prime_account_deletion($1,$2)',[uid(),'other@example.test']));await assert.rejects(db.query('select public.finalize_due_prime_account_deletions()'));await assert.rejects(db.query('select * from public.claim_prime_buyer_activation(null)'));}
 finally{await db.exec('reset role')}
});
