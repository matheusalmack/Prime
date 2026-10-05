import React,{useEffect,useRef,useState} from 'react';
import {LoaderCircle} from 'lucide-react';
import Modal,{ModalCloseButton} from './Modal';
import './shopee-connection.css';
export default function ShopeeConnection({connected,onConnect,onDisconnect,onClose}){
 const [status,setStatus]=useState(connected?'disconnect':'ready');
 const connect=useRef(onConnect);connect.current=onConnect;
 useEffect(()=>{if(status!=='connecting')return;let active=true;const timer=setTimeout(async()=>{try{const result=await connect.current();if(active)setStatus(result===false?'error':'connected')}catch{if(active)setStatus('error')}},1200);return()=>{active=false;clearTimeout(timer)}},[status]);
 const title=status==='ready'?'Conectar Shopee':status==='connecting'?'Conectando à Shopee':status==='connected'?'Shopee conectada':status==='disconnect'?'Desconectar Shopee?':'Não foi possível conectar';
 return <Modal label={title} className="shopee-connection-modal" onClose={onClose}>
  <ModalCloseButton label="Fechar conexão Shopee" className="shopee-connection-close" onClick={onClose}/>
  <div className="shopee-connection-icon"><img src="/images/shopee.svg" alt="Shopee" width="44" height="44"/></div>
  <h2>{title}</h2>
  <p aria-live="polite">{status==='ready'?'Conecte a Shopee ao seu Prime.':status==='connecting'?'Aguarde enquanto preparamos sua conexão.':status==='connected'?'Tudo pronto para continuar no Prime.':status==='disconnect'?'Você pode conectar novamente quando quiser.':'Tente novamente em alguns instantes.'}</p>
  <div className="shopee-connection-actions">{status==='ready'||status==='error'?<button type="button" className="account-button account-button-primary" onClick={()=>setStatus('connecting')}>{status==='error'?'Tentar novamente':'Conectar'}</button>:status==='connecting'?<button type="button" className="account-button account-button-primary" disabled aria-busy="true"><LoaderCircle className="shopee-connection-spinner" size={16}/>Conectando</button>:status==='disconnect'?<><button type="button" className="account-button" onClick={onClose}>Cancelar</button><button type="button" className="account-button account-button-primary" onClick={onDisconnect}>Desconectar</button></>:<button type="button" className="account-button account-button-primary" onClick={onClose}>Concluir</button>}</div>
 </Modal>
}
