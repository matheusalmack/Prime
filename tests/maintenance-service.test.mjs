import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const source=stripTypeScriptTypes((await readFile(new URL('../supabase/functions/prime-maintenance/index.ts',import.meta.url),'utf8')).replace(/^import .*;\n/,''));
function setup({authorized=false,jobs=[],inviteError=null}={}){
 let handler;const calls=[];
 const admin={rpc:async(name,args)=>{calls.push({name,args});return {error:null,data:name==='verify_prime_maintenance_token'?authorized:name==='claim_prime_buyer_activation'?(jobs.length?[jobs.shift()]:[]):name==='finalize_due_prime_account_deletions'?0:null}},
 auth:{admin:{inviteUserByEmail:async(email,options)=>{calls.push({name:'invite',email,options});return {error:inviteError}}},resetPasswordForEmail:async email=>{calls.push({name:'resend',email});return {error:null}}},
 from:()=>({select:()=>({order:()=>({limit:async()=>({data:[],error:null})})})})};
 new Function('Deno','createClient',source)({serve:fn=>handler=fn,env:{get:key=>key==='SUPABASE_SERVICE_ROLE_KEY'?'server-test-key':key==='PRIME_AUTO_ACTIVATION_ENABLED'?'true':'https://example.test'}},()=>admin);
 return {handler,calls};
}
function request(headers={},body={}){return new Request('https://example.test',{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body)})}
test('public callers cannot activate buyers or run deletion jobs',async()=>{
 const {handler,calls}=setup();assert.equal((await handler(request())).status,401);assert.deepEqual(calls,[]);
 assert.equal((await handler(request({'x-prime-job-token':'wrong'}))).status,401);assert.equal(calls.length,1);assert.equal(calls[0].name,'verify_prime_maintenance_token');
});
test('approved buyer activation uses an email invitation, no generated or overwritten password',async()=>{
 const {handler,calls}=setup({jobs:[{email:'buyer@example.test',lease_id:'lease',existing_user:false}]});
 assert.equal((await handler(request({authorization:'Bearer server-test-key'},{email:'buyer@example.test'}))).status,200);
 const invite=calls.find(c=>c.name==='invite');assert.equal(invite.email,'buyer@example.test');assert.equal(invite.options.redirectTo,'https://primeafiliado.com/recuperar-senha');assert.equal(invite.options.data.prime_needs_password,true);assert.equal(Object.hasOwn(invite.options,'password'),false);
 assert.equal(calls.some(c=>c.name==='finalize_due_prime_account_deletions'),false);
});
test('SMTP failures leave activation retryable; existing users receive no new invite',async()=>{
 const {handler,calls}=setup({jobs:[{email:'buyer@example.test',lease_id:'lease',existing_user:false}],inviteError:{code:'email_send_failed'}});
 assert.equal((await handler(request({authorization:'Bearer server-test-key'},{email:'buyer@example.test'}))).status,503);
 assert.equal(calls.find(c=>c.name==='finish_prime_buyer_activation').args.p_success,false);
 const existing=setup({jobs:[{email:'existing@example.test',lease_id:'lease',existing_user:true}]});
 await existing.handler(request({authorization:'Bearer server-test-key'},{email:'existing@example.test'}));assert.equal(existing.calls.some(c=>c.name==='invite'),false);
});
test('scheduler can retry and finalize but cannot target an arbitrary buyer from its body',async()=>{
 const {handler,calls}=setup({authorized:true});assert.equal((await handler(request({'x-prime-job-token':'private-scheduler-token'},{email:'victim@example.test'}))).status,200);
 assert.equal(calls.find(c=>c.name==='claim_prime_buyer_activation').args.p_email,null);
 assert.equal(calls.some(c=>c.name==='finalize_due_prime_account_deletions'),true);
});
