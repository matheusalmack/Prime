import {supabase} from './supabase-client';
export function storeUrl(value){try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)?url.href:null}catch{return null}}
export function storeRecord(row){const url=new URL(location.origin);url.searchParams.set('loja',row.domain);return {...row.settings,id:row.id,name:row.name,domain:row.domain,status:row.status,productIds:row.product_ids,affiliateLinks:row.affiliate_links,createdAt:row.created_at,updatedAt:row.updated_at,url:row.domain?url.href:null}}
export async function loadStores(){const {data,error}=await supabase.from('prime_stores').select('*').order('created_at');if(error)throw new Error('Não foi possível carregar suas lojas.');return data.map(storeRecord)}
export async function deleteStore(id){const {error}=await supabase.from('prime_stores').delete().eq('id',id);if(error)throw new Error('Não foi possível excluir a loja.');window.dispatchEvent(new Event('prime-v2-stores-updated'))}
export async function createStore(draft,productIds){
 const {data:{user},error:authError}=await supabase.auth.getUser();if(authError||!user)throw new Error('Entre novamente para salvar sua loja.');
 const links=await supabase.from('saved_products').select('product_id,affiliate_url').eq('user_id',user.id).in('product_id',productIds);if(links.error)throw new Error('Não foi possível carregar seus links.');
 const {id,name,domain,status,productIds:unusedIds,affiliateLinks:unusedLinks,url,createdAt,updatedAt,...settings}=draft;
 const payload={...(id?{id}:{}),user_id:user.id,name,domain:domain||null,status:status||'draft',settings,product_ids:[...new Set(productIds)],affiliate_links:Object.fromEntries(links.data.map(p=>[p.product_id,p.affiliate_url]))};
 const {data,error}=await supabase.from('prime_stores').upsert(payload).select().single();if(error)throw new Error(error.code==='23505'?'Esse endereço já está em uso.':'Não foi possível salvar sua loja.');
 window.dispatchEvent(new Event('prime-v2-stores-updated'));return storeRecord(data);
}
export function sidebarStores(stores){
 const published=stores.filter(store=>store.status==='published');
 return {visible:published.slice(0,8),hasMore:published.length>8};
}
