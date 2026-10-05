import React,{useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {TriangleAlert,Info,Check} from 'lucide-react';
export function notify(message,type='error'){
 const text=String(message||'').trim().replace(/[.!]+$/,'');
 if(text)window.dispatchEvent(new CustomEvent('prime-v2-alert',{detail:{message:text,type}}));
}
export default function Alerts(){
 const [alert,setAlert]=useState(null),timer=useRef(null);
 useEffect(()=>{
  const show=e=>{clearTimeout(timer.current);setAlert({...e.detail,id:Date.now()});timer.current=setTimeout(()=>setAlert(null),5000)};
  let validating=false;
  const invalid=e=>{
   e.preventDefault();if(validating)return;validating=true;queueMicrotask(()=>{validating=false});
   const field=e.target,label=field.labels?.[0]?.childNodes[0]?.textContent?.trim();
   const message=field.validity.valueMissing?`Preencha ${label?label.toLowerCase():'este campo'}`:field.validity.typeMismatch?'Insira um link válido começando com https://':field.validity.patternMismatch?'Use apenas letras minúsculas, números e hífens no endereço':'Confira o valor informado';
   field.focus();notify(message);
  };
  window.addEventListener('prime-v2-alert',show);document.addEventListener('invalid',invalid,true);
  return()=>{clearTimeout(timer.current);window.removeEventListener('prime-v2-alert',show);document.removeEventListener('invalid',invalid,true)};
 },[]);
 if(!alert)return null;
 const Icon=alert.type==='error'?TriangleAlert:alert.type==='success'?Check:Info;
 return createPortal(<div key={alert.id} className={`app-alert app-alert-${alert.type}`} role={alert.type==='error'?'alert':'status'}><Icon size={17} strokeWidth={1.8} aria-hidden="true"/><span>{alert.message}</span></div>,document.body);
}
