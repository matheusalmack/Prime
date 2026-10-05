import React,{useEffect,useRef,useState} from 'react';
import {Check,ChevronDown} from 'lucide-react';
import './home-page-picker.css';
const pages=[['0','Fornecedor','Explore produtos para sua loja.'],['1','Meus produtos','Acesse seus produtos salvos.'],['2','Lojas','Veja e gerencie suas lojas.'],['3','Vídeos','Explore vídeos e influenciadores.']];
export default function HomePagePicker({value,onChange}){
 const [open,setOpen]=useState(false);
 const root=useRef(null),trigger=useRef(null),options=useRef([]);
 useEffect(()=>{if(!open)return;function outside(event){if(!root.current?.contains(event.target))setOpen(false)}function escape(event){if(event.key==='Escape'){event.preventDefault();event.stopPropagation();setOpen(false);trigger.current?.focus()}}const element=root.current;element.addEventListener('keydown',escape);document.addEventListener('pointerdown',outside);return()=>{element.removeEventListener('keydown',escape);document.removeEventListener('pointerdown',outside)}},[open]);
 useEffect(()=>{if(open)options.current[pages.findIndex(([id])=>id===value)]?.focus()},[open]);
 function close(){setOpen(false);trigger.current?.focus()}
 async function choose(id){if(await onChange(id)!==false)close()}
 function keys(event,index){if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close()}else if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?pages.length-1:(index+(event.key==='ArrowDown'?1:-1)+pages.length)%pages.length;options.current[next]?.focus()}else if(event.key==='Tab'){setOpen(false)}}
 return <div className="home-page-picker" ref={root}>
  <button type="button" ref={trigger} className="home-page-trigger" aria-label={`Página inicial: ${pages.find(([id])=>id===value)?.[1]||'Fornecedor'}`} aria-haspopup="menu" aria-expanded={open} aria-controls={open?'home-page-menu':undefined} onClick={()=>setOpen(!open)} onKeyDown={event=>{if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();setOpen(true)}}}>{pages.find(([id])=>id===value)?.[1]||'Fornecedor'}<ChevronDown size={15} className={open?'is-open':''}/></button>
  {open&&<div className="home-page-menu" id="home-page-menu" role="menu" aria-label="Página inicial">{pages.map(([id,label,description],index)=><button type="button" role="menuitemradio" aria-checked={value===id} key={id} ref={element=>options.current[index]=element} onKeyDown={event=>keys(event,index)} onClick={()=>choose(id)}><span className="home-page-option-title">{label}{value===id&&<Check size={17}/>}</span><span className="home-page-option-description">{description}</span></button>)}</div>}
 </div>
}
