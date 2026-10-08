import React,{useEffect,useRef,useState,useId} from 'react';
import {Check,ChevronDown} from 'lucide-react';
import {storeTemplates} from './Storefront';
export default function StoreTemplateMenu({value,onChange}){
 const [open,setOpen]=useState(false),[placement,setPlacement]=useState({above:false,height:280});
 const root=useRef(null),trigger=useRef(null),items=useRef([]),menuId=useId(),labelId=useId();
 const selected=Math.max(0,storeTemplates.findIndex(t=>t.id===value));
 function measure(){
  const r=trigger.current.getBoundingClientRect(),box=root.current.getBoundingClientRect(),dialog=root.current.closest('[role="dialog"]'),bounds=dialog?.getBoundingClientRect(),footer=dialog?.querySelector('.sb-actions')?.getBoundingClientRect();
  const bottom=Math.min(window.innerHeight-12,bounds?.bottom-12||window.innerHeight-12,footer?.top-8||window.innerHeight-12),top=Math.max(12,bounds?.top+12||12),below=Math.max(0,bottom-r.bottom-6),above=Math.max(0,r.top-top-6),desired=window.matchMedia('(pointer:coarse)').matches?276:228,up=below<desired&&above>below;
  setPlacement({above:up,height:Math.max(36,Math.min(desired,up?above:below)),offset:box.height-(r.top-box.top)+6});
 }
 function show(){measure();setOpen(true)}
 function close(){setOpen(false);trigger.current?.focus()}
 useEffect(()=>{if(!open)return;items.current[selected]?.focus({preventScroll:true});const outside=e=>{if(!root.current?.contains(e.target))setOpen(false)};document.addEventListener('pointerdown',outside);window.addEventListener('resize',measure);window.addEventListener('scroll',measure,true);return()=>{document.removeEventListener('pointerdown',outside);window.removeEventListener('resize',measure);window.removeEventListener('scroll',measure,true)}},[open]);
 function keys(e){if(!open){if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();show()}return}if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();return}const index=items.current.indexOf(document.activeElement);let next;if(e.key==='ArrowDown')next=(index+1)%storeTemplates.length;if(e.key==='ArrowUp')next=(index-1+storeTemplates.length)%storeTemplates.length;if(e.key==='Home')next=0;if(e.key==='End')next=storeTemplates.length-1;if(next!==undefined){e.preventDefault();items.current[next]?.focus()}if(e.key==='Tab')setOpen(false)}
 return <div ref={root} className="store-template-picker" onKeyDown={keys}><span id={labelId}>Template</span><button ref={trigger} type="button" aria-labelledby={labelId} aria-haspopup="menu" aria-expanded={open} aria-controls={open?menuId:undefined} onClick={()=>open?close():show()}><span>{storeTemplates[selected].name}</span><ChevronDown size={18}/></button>{open&&<div id={menuId} className={`store-template-menu ${placement.above?'opens-up':''}`} role="menu" aria-label="Templates da loja" style={{maxHeight:placement.height,...(placement.above?{bottom:placement.offset}:{})}}>{storeTemplates.map((template,index)=><button key={template.id} ref={el=>items.current[index]=el} type="button" role="menuitemradio" aria-checked={value===template.id} onClick={()=>{onChange(template.id);close()}}><span>{template.name}</span>{value===template.id&&<Check size={17}/>}</button>)}</div>}</div>;
}
