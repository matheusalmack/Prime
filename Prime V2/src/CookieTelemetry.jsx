import {useEffect} from 'react';
import {useBackend,supabase} from './Backend';
import {analyticsDetails,consentStore,CONSENT_EVENT,CONSENT_KEY} from './cookie-consent.mjs';
// Optional analytics are sent only after consent. Authentication security logs
// are maintained separately by Supabase Auth, including real login IP/session.
export default function CookieTelemetry(){
 const {user}=useBackend();
 useEffect(()=>{
  let active=true,timer,busy=false,last='';
  async function collect(){
   const consent=consentStore.read();if(!active||busy||!supabase||!consent?.analytics)return;
   const signature=`${location.pathname}:${user?.id||'anonymous'}:${consent.decidedAt}`;if(signature===last)return;
   try{
    let visitor=localStorage.getItem('prime-analytics-visitor');if(!visitor){visitor=crypto.randomUUID();localStorage.setItem('prime-analytics-visitor',visitor)}
    const sessionKey=`prime-analytics-session:${user?.id||'anonymous'}`;let session=sessionStorage.getItem(sessionKey);if(!session){session=crypto.randomUUID();sessionStorage.setItem(sessionKey,session)}
    const details=analyticsDetails({navigator,screen,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone});
    busy=true;const {error}=await supabase.rpc('record_prime_analytics',{p_visitor_id:visitor,p_session_id:session,p_consent:{analytics:true,advertising:consent.advertising,decidedAt:consent.decidedAt},p_details:details,p_page:location.pathname});
    if(error)console.warn('Não foi possível registrar as análises do Prime.');else last=signature;
   }catch{console.warn('Não foi possível registrar as análises do Prime.')}finally{busy=false}
  }
  const sync=()=>{if(!consentStore.read()?.analytics){try{localStorage.removeItem('prime-analytics-visitor');Object.keys(sessionStorage).filter(key=>key.startsWith('prime-analytics-session')).forEach(key=>sessionStorage.removeItem(key))}catch{}last='';return}collect()};
  const storage=e=>{if(e.key===CONSENT_KEY)sync()};
  sync();timer=setInterval(collect,30000);window.addEventListener(CONSENT_EVENT,sync);window.addEventListener('storage',storage);window.addEventListener('popstate',collect);
  return()=>{active=false;clearInterval(timer);window.removeEventListener(CONSENT_EVENT,sync);window.removeEventListener('storage',storage);window.removeEventListener('popstate',collect)};
 },[user?.id]);
 return null;
}
