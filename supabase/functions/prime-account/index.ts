import {createClient} from 'npm:@supabase/supabase-js@2.116.0';
// Service key stays server-side. Every operation is bound to the verified caller.
Deno.serve(async(req)=>{
 const origin=req.headers.get('origin')||'';
 const allowed=(Deno.env.get('PRIME_ALLOWED_ORIGINS')||'https://primeafiliado.com,https://www.primeafiliado.com,http://localhost:5174').split(',');
 const headers={'Content-Type':'application/json','Vary':'Origin',...(allowed.includes(origin)?{'Access-Control-Allow-Origin':origin}:{}),'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS'};
 const respond=(status:number,value:unknown)=>new Response(JSON.stringify(value),{status,headers});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(origin&&!allowed.includes(origin))return respond(403,{error:'Origem não permitida'});
 if(req.method!=='POST')return respond(405,{error:'Método não permitido'});
 const token=req.headers.get('authorization')?.replace(/^Bearer /i,'');
 if(!token)return respond(401,{error:'Entre novamente'});
 const client=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error}=await client.auth.getUser(token);
 if(error||!user)return respond(401,{error:'Sessão inválida'});
 let payload;try{payload=await req.json()}catch{return respond(400,{error:'Solicitação inválida'})}
 if(payload.action==='delete-account'){
  if(String(payload.email).trim().toLowerCase()!==user.email?.toLowerCase())return respond(400,{error:'Confirme seu e-mail'});
  const result=await client.rpc('request_prime_account_deletion',{p_user_id:user.id,p_email:user.email});
  if(result.error)return respond(500,{error:'Não foi possível solicitar a exclusão da conta'});
  // End all existing refresh sessions; a new login cancels the request in the database.
  const signedOut=await client.auth.admin.signOut(token,'global');
  return respond(200,{scheduled:true,delete_after:result.data,sessions_ended:!signedOut.error});
 }
 return respond(400,{error:'Ação desconhecida'});
});
