import React,{useRef,useState} from 'react';
import {Search,Check} from 'lucide-react';
import Modal,{ModalCloseButton} from './Modal';
import './language-picker.css';
export const languages=[
 ['ar','العربية','Arabic'],['ar-SA','العربية (السعودية)','Arabic (Saudi Arabia)'],['bn','বাংলা','Bengali'],['cs','Čeština','Czech'],['de','Deutsch','German'],['en','English','English'],['es','Español','Spanish'],['fa','فارسی','Persian'],['fil','Filipino','Filipino'],['fr','Français','French'],['hi','हिन्दी','Hindi'],['id','Bahasa Indonesia','Indonesian'],['it','Italiano','Italian'],['ja','日本語','Japanese'],['ko','한국어','Korean'],['nl','Nederlands','Dutch'],['pl','Polski','Polish'],['pt-BR','Português (Brasil)','Portuguese (Brazil)'],['pt-PT','Português (Portugal)','Portuguese (Portugal)'],['ru','Русский','Russian'],['th','ไทย','Thai'],['tr','Türkçe','Turkish'],['uk','Українська','Ukrainian'],['vi','Tiếng Việt','Vietnamese'],['zh-CN','简体中文','Chinese (Simplified)'],['zh-TW','繁體中文','Chinese (Traditional)']
];
const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export default function LanguagePicker({value,onChange,onClose}){
 const [query,setQuery]=useState('');
 const buttons=useRef([]);
 const filtered=languages.filter(language=>normalize(language.join(' ')).includes(normalize(query.trim())));
 function move(e,index){let next;if(e.key==='ArrowDown')next=(index+1)%filtered.length;else if(e.key==='ArrowUp')next=(index-1+filtered.length)%filtered.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=filtered.length-1;else return;e.preventDefault();buttons.current[next]?.focus()}
 return <Modal label="Escolher idioma" className="language-picker" onClose={onClose}>
  <ModalCloseButton className="language-mobile-close" label="Fechar idiomas" onClick={onClose}/><div className="language-picker-search"><Search size={19}/><input autoFocus type="search" aria-label="Buscar idioma" placeholder="Buscar idioma" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='ArrowDown'&&filtered.length){e.preventDefault();buttons.current[0]?.focus()}}}/></div>
  <div className="language-picker-list" role="listbox" aria-label="Idiomas">{filtered.map(([code,native,english],index)=><button key={code} ref={el=>buttons.current[index]=el} type="button" role="option" aria-selected={code===value} onClick={()=>onChange(code)} onKeyDown={e=>move(e,index)}><span className="language-picker-native" lang={code} dir="auto">{native}</span><span className="language-picker-english">{english}{code===value&&<Check size={15}/>}</span></button>)}{!filtered.length&&<p className="language-picker-empty" role="status">Nenhum idioma encontrado</p>}</div>
 </Modal>
}
