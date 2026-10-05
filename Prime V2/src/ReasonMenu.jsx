import React,{useEffect,useId,useRef,useState} from 'react';
import {ChevronDown,Check} from 'lucide-react';

const groups=[
 ['Reportar este conteúdo',[
  'Abuso infantil ou segurança',
  'Imagens íntimas não consensuais de uma pessoa real',
  'Violência, terrorismo, autolesão, suicídio ou drogas',
  'Golpes, fraudes, hacking, phishing ou spam',
  'Privacidade, doxing, stalking ou assédio',
  'Direitos autorais ou propriedade intelectual',
  'Outro conteúdo inapropriado'
 ]],
 ['Comentário',['Feedback geral','Reportar um problema']]
];

export default function ReasonMenu({value,onChange}){
 const [open,setOpen]=useState(false),root=useRef(null),trigger=useRef(null),id=useId();
 useEffect(()=>{if(!open)return;function outside(e){if(!root.current?.contains(e.target))setOpen(false)}document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside)},[open]);
 function focus(index){requestAnimationFrame(()=>{const options=root.current?.querySelectorAll('[role="option"]');options?.[index<0?options.length-1:index]?.focus()})}
 function show(last=false){setOpen(true);focus(last?-1:Math.max(0,groups.flatMap(([,items])=>items).indexOf(value)))}
 function choose(reason){onChange(reason);setOpen(false);trigger.current?.focus()}
 return <div className="feedback-select" ref={root} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpen(false)}}>
  <button ref={trigger} id="feedback-reason" className="feedback-reason-trigger" type="button" aria-haspopup="listbox" aria-expanded={open} aria-controls={open?id:undefined} aria-labelledby="feedback-reason-label feedback-reason-value" onClick={()=>open?setOpen(false):show()} onKeyDown={e=>{if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();show(e.key==='ArrowUp')}}}>
   <span id="feedback-reason-value">{value||'Selecione um motivo'}</span><ChevronDown size={17} className={open?'is-open':''}/>
  </button>
  {open&&<div id={id} className="feedback-reason-menu" role="listbox" aria-label="Motivo" onKeyDown={e=>{
   if(e.key==='Escape'){e.preventDefault();e.stopPropagation();setOpen(false);trigger.current?.focus()}
   else if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const options=[...root.current.querySelectorAll('[role="option"]')],index=options.indexOf(document.activeElement);focus(e.key==='Home'?0:e.key==='End'?-1:(index+(e.key==='ArrowDown'?1:-1)+options.length)%options.length)}
  }}>{groups.map(([title,items],group)=><div className="feedback-reason-group" role="group" aria-labelledby={`${id}-${group}`} key={title}><p id={`${id}-${group}`}>{title}</p>{items.map(reason=><button key={reason} role="option" aria-selected={value===reason} tabIndex={-1} type="button" onClick={()=>choose(reason)}><span>{reason}</span>{value===reason&&<Check size={15}/>}</button>)}</div>)}</div>}
 </div>
}
