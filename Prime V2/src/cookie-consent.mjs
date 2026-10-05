export const CONSENT_KEY='prime-v2-cookie-preferences';
export const CONSENT_COOKIE='prime_cookie_preferences';
export const CONSENT_EVENT='prime-cookie-choice';
const defaults={essential:true,analytics:false,advertising:false};
export function normalizeConsent(value){return value&&typeof value==='object'&&typeof value.analytics==='boolean'&&typeof value.advertising==='boolean'?{...defaults,analytics:value.analytics,advertising:value.advertising,decidedAt:typeof value.decidedAt==='string'?value.decidedAt:null}:null}
export function createConsentStore({document,storage,secure=false,dispatch=()=>{}}){
 function read(){try{const cookie=document.cookie.split(';').map(v=>v.trim()).find(v=>v.startsWith(CONSENT_COOKIE+'='));if(cookie){const value=normalizeConsent(JSON.parse(decodeURIComponent(cookie.slice(CONSENT_COOKIE.length+1))));if(value)return value}}catch{}try{return normalizeConsent(JSON.parse(storage.getItem(CONSENT_KEY)))}catch{return null}}
 function save(values){const consent={...defaults,analytics:values.analytics===true,advertising:values.advertising===true,decidedAt:new Date().toISOString()},encoded=encodeURIComponent(JSON.stringify(consent));let persisted=false;try{document.cookie=`${CONSENT_COOKIE}=${encoded}; Path=/; Max-Age=31536000; SameSite=Lax${secure?'; Secure':''}`;persisted=document.cookie.includes(CONSENT_COOKIE+'=')}catch{}try{storage.setItem(CONSENT_KEY,JSON.stringify(consent));persisted=true}catch{}if(!persisted)throw new Error('Não foi possível salvar suas preferências. Verifique o armazenamento do navegador.');dispatch();return consent}
 function ensureCookie(){const consent=read();if(consent){try{document.cookie=`${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(consent))}; Path=/; Max-Age=31536000; SameSite=Lax${secure?'; Secure':''}`}catch{}}}
 return {read,save,ensureCookie,preferences:()=>read()||{...defaults}};
}
export const consentStore=typeof window==='undefined'?null:createConsentStore({document,storage:{getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)},secure:location.protocol==='https:',dispatch:()=>window.dispatchEvent(new Event(CONSENT_EVENT))});
export function analyticsDetails({navigator,screen,timezone}){const ua=navigator.userAgent||'';return {device:/iPhone|iPad|Android|Mobile/i.test(ua)?(/iPad|Tablet/i.test(ua)?'tablet':'mobile'):'desktop',platform:navigator.userAgentData?.platform||navigator.platform||null,language:navigator.language||null,timezone,screen_width:screen.width,screen_height:screen.height};}
