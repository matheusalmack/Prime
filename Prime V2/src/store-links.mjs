// A storefront owns its affiliate links. Never use the visitor's saved links.
export function safeStoreUrl(value){
 try{const url=new URL(String(value||'').trim());return ['https:','http:'].includes(url.protocol)&&!url.username&&!url.password?url.href:null}catch{return null}
}
export function productOfferUrl(store,product){return safeStoreUrl(store.affiliateLinks?.[product.id])||safeStoreUrl(product.source_url)}
export function affiliateLinkReady(store,product){
 const link=safeStoreUrl(store.affiliateLinks?.[product.id]);
 return Boolean(link&&link!==safeStoreUrl(product.source_url));
}
export function missingAffiliateProducts(store,products){
 return (store.productIds||[]).filter(id=>{const p=products.find(p=>p.id===id);return !p||!affiliateLinkReady(store,p)});
}
export function cleanStoreLinks(links,productIds){
 return Object.fromEntries(productIds.flatMap(id=>{const url=safeStoreUrl(links?.[id]);return url?[[id,url]]:[]}));
}
export function contrastingText(hex){
 const color=/^#[a-f\d]{6}$/i.test(hex||'')?hex:'#171717';
 const channels=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
 return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722>.179?'#171717':'#ffffff';
}
