import React,{useState} from 'react';
import CookieTelemetry from './CookieTelemetry';
import CookieNotice from './CookieNotice';
import Modal,{ModalCloseButton} from './Modal';
import {ServiceContent} from './ServicePages';
export default function GlobalCookieNotice(){const [legal,setLegal]=useState(null);return <><CookieTelemetry/><CookieNotice onLegal={setLegal}/>{legal&&<Modal label={legal==='privacy'?'Política de privacidade':'Termos de uso'} className="cookie-legal" onClose={()=>setLegal(null)}><ModalCloseButton onClick={()=>setLegal(null)}/><ServiceContent type={legal}/></Modal>}</>}
