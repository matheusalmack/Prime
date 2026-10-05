import React,{useEffect,useState} from 'react';
import {ShieldCheck} from 'lucide-react';
import Modal,{ModalCloseButton} from './Modal';
import './cookie-notice.css';
import {consentStore,CONSENT_EVENT,CONSENT_KEY} from './cookie-consent.mjs';
const readPreferences=()=>consentStore.preferences();
export default function CookieNotice({showBanner=true,manageOpen=false,onManageClose=()=>{},onLegal}){
 const [shown,setShown]=useState(()=>!consentStore.read()),[settings,setSettings]=useState(false),[prefs,setPrefs]=useState(readPreferences),[error,setError]=useState('');
 useEffect(()=>{consentStore.ensureCookie();const manage=()=>{if(showBanner){setPrefs(readPreferences());setError('');setSettings(true)}};window.addEventListener('prime-open-cookie-settings',manage);const sync=()=>{setShown(!consentStore.read());setPrefs(readPreferences())};const storage=e=>{if(e.key===CONSENT_KEY)sync()};window.addEventListener(CONSENT_EVENT,sync);window.addEventListener('storage',storage);return()=>{window.removeEventListener('prime-open-cookie-settings',manage);window.removeEventListener(CONSENT_EVENT,sync);window.removeEventListener('storage',storage)}},[showBanner]);
 function close(){setSettings(false);onManageClose()}
 function open(){setPrefs(readPreferences());setError('');setSettings(true)}
 function save(next){try{setPrefs(consentStore.save(next));setShown(false);close()}catch(e){setError(e.message)}}
 return <>
  {showBanner&&shown&&<aside className="cookie-notice" aria-label="Aviso de cookies"><ModalCloseButton label="Fechar aviso de cookies" onClick={()=>save({analytics:false,advertising:false})}/><p>Cookies essenciais mantêm o site funcionando e estão sempre ativos. Cookies opcionais ajudam com análises e publicidade. Você pode aceitar, rejeitar ou gerenciar suas preferências. Saiba mais em nossa <button onClick={()=>onLegal('privacy')}>Política de privacidade</button> e nos <button onClick={()=>onLegal('terms')}>Termos de uso</button>.</p><div className="cookie-actions"><button onClick={open}>Definições de cookies</button><button className="cookie-primary" onClick={()=>save({analytics:false,advertising:false})}>Rejeitar todos</button><button className="cookie-primary" onClick={()=>save({analytics:true,advertising:true})}>Aceitar todos os cookies</button></div>{error&&<p role="alert">{error}</p>}</aside>}
  {(settings||manageOpen)&&<Modal label="Configurações de cookies" className="cookie-settings" onClose={close}><header><h2>Configurações de cookies</h2><ModalCloseButton onClick={close}/></header><p>Escolha quais cookies opcionais você permite.</p><div className="cookie-setting"><div><strong>Essenciais</strong><p>Necessários para o funcionamento do site.</p></div><span><ShieldCheck size={14}/>Sempre ativos</span></div>{[['analytics','Análises','Ajudam a entender o uso da plataforma.'],['advertising','Publicidade','Permitem personalizar publicidade.']].map(([key,label,description])=><div className="cookie-setting" key={key}><div><strong>{label}</strong><p>{description}</p></div><button className="cookie-switch" role="switch" aria-label={label} aria-checked={!!prefs[key]} onClick={()=>setPrefs(p=>({...p,[key]:!p[key]}))}><span/></button></div>)}{error&&<p role="alert">{error}</p>}<div className="cookie-actions"><button className="cookie-primary" onClick={()=>save(prefs)}>Salvar preferências</button></div></Modal>}
 </>;
}
