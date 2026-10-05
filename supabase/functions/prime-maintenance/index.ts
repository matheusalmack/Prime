import {createClient} from 'npm:@supabase/supabase-js@2.116.0';
function safeEqual(a:string,b:string){if(!a||a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0}
Deno.serve(async request=>{
 const respond=(status:number,data:unknown)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}});
 if(request.method!=='POST')return respond(405,{error:'Method not allowed'});
 const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
 const admin=createClient(Deno.env.get('SUPABASE_URL')!,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const serviceCall=safeEqual(request.headers.get('authorization')?.replace(/^Bearer /i,'')||'',key);
 if(!serviceCall){const token=request.headers.get('x-prime-job-token')||'';if(!token||token.length>256)return respond(401,{error:'Unauthorized'});const verified=await admin.rpc('verify_prime_maintenance_token',{p_token:token});if(verified.error||verified.data!==true)return respond(401,{error:'Unauthorized'})}
 try{
  let payload;try{payload=await request.json()}catch{payload={}}
  const email=serviceCall&&typeof payload.email==='string'?payload.email:null;
  let activated=0,failed=0;
  const autoActivationEnabled=Deno.env.get('PRIME_AUTO_ACTIVATION_ENABLED')==='true';
  for(let i=0;i<(autoActivationEnabled?(email?1:20):0);i++){
   const claimed=await admin.rpc('claim_prime_buyer_activation',{p_email:email});if(claimed.error)throw claimed.error;
   const job=claimed.data?.[0];if(!job)break;
   let success=job.existing_user;
   if(job.existing_user&&job.existing_needs_password){
    const resent=await admin.auth.resetPasswordForEmail(job.email,{redirectTo:'https://primeafiliado.com/recuperar-senha'});success=!resent.error;
   }else if(!job.existing_user){
    const result=await admin.auth.admin.inviteUserByEmail(job.email,{redirectTo:'https://primeafiliado.com/recuperar-senha',data:{prime_needs_password:true}});
    success=!result.error;
    // A manual signup can race the invitation; never overwrite its password or profile.
    if(result.error&&['email_exists','user_already_exists'].includes(result.error.code||''))success=true;
   }
   const finish=await admin.rpc('finish_prime_buyer_activation',{p_email:job.email,p_lease_id:job.lease_id,p_success:success});if(finish.error)throw finish.error;
   if(success)activated++;else failed++;
  }
  let deleted=0,cleaned=0;
  if(!email){
   const finalized=await admin.rpc('finalize_due_prime_account_deletions');if(finalized.error)throw finalized.error;deleted=finalized.data;
   const cleanup=await admin.from('prime_storage_cleanup').select('id,bucket_id,object_name').order('created_at').limit(100);if(cleanup.error)throw cleanup.error;
   for(const file of cleanup.data){const removed=await admin.storage.from(file.bucket_id).remove([file.object_name]);if(removed.error){failed++;continue}const ack=await admin.from('prime_storage_cleanup').delete().eq('id',file.id);if(ack.error){failed++;continue}cleaned++}
  }
  // Counts only: do not leak buyer e-mails, auth tokens, IPs or storage paths into logs.
  return respond(failed?503:200,{activated,deleted,cleaned,failed,auto_activation_enabled:autoActivationEnabled});
 }catch{return respond(500,{error:'Maintenance failed; jobs remain available for retry'})}
});
