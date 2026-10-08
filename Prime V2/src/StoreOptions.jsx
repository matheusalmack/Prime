import React,{useEffect,useRef,useState,useLayoutEffect} from 'react';
import {createPortal} from 'react-dom';
import {ArrowUpRight,ChevronRight} from 'lucide-react';
export default function StoreOptions({store,onEdit,onConfigure,onRemove}){
 const [open,setOpen]=useState(false),[more,setMore]=useState(false),[position,setPosition]=useState(null),[submenu,setSubmenu]=useState(null);
 const trigger=useRef(null),panel=useRef(null),extra=useRef(null),moreButton=useRef(null),timer=useRef(null);
 const close=()=>{setOpen(false);setMore(false)};
 useLayoutEffect(()=>{if(!open)return;const place=()=>{const rect=trigger.current.getBoundingClientRect(),height=panel.current?.offsetHeight||126,width=Math.max(156,Math.min(176,rect.width-16)),above=(rect.top>window.innerHeight*.55||window.innerHeight-rect.bottom<height+12)&&rect.top>height+12;setPosition({left:Math.max(8,Math.min(rect.left,window.innerWidth-width-8)),top:above?rect.top-height-6:rect.bottom+6,above,width})};place();window.addEventListener('resize',place);window.addEventListener('scroll',place,true);return()=>{window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true)}},[open]);
 useLayoutEffect(()=>{if(!more||!position)return;const height=extra.current?.offsetHeight||104,width=position.width,right=position.left+width+5;setSubmenu({left:right+width<window.innerWidth-8?right:Math.max(8,position.left-width-5),top:Math.max(8,Math.min(position.top,window.innerHeight-height-8))})},[more,position]);
 useEffect(()=>{if(!open)return;const outside=e=>{if(!trigger.current?.contains(e.target)&&!panel.current?.contains(e.target)&&!extra.current?.contains(e.target))close()};const escape=e=>{if(e.key==='Escape'){close();trigger.current?.focus()}};document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape)}},[open]);
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 const keep=()=>clearTimeout(timer.current),leave=()=>{clearTimeout(timer.current);timer.current=setTimeout(()=>setMore(false),180)};
 const act=fn=>{close();fn()};
 return <><button ref={trigger} className="store-options-trigger" aria-haspopup="menu" aria-expanded={open} aria-label={`Mais opções de ${store.name}`} onClick={()=>{setMore(false);setOpen(v=>!v)}}>Mais opções</button>{open&&createPortal(<>
 <div ref={panel} className={`store-options-popover ${position?.above?'opens-up':''}`} role="menu" aria-label={`Opções de ${store.name}`} style={{left:position?.left??0,top:position?.top??0,visibility:position?'visible':'hidden',width:position?.width}}>
 <button role="menuitem" onMouseEnter={()=>setMore(false)} onClick={()=>act(onEdit)}>Editar loja</button>
 {store.url?<a role="menuitem" href={store.url} target="_blank" rel="noopener noreferrer" onMouseEnter={()=>setMore(false)} onClick={close} className="store-options-open-link"><span>Abrir link da loja</span><ArrowUpRight className="store-options-hover-arrow" size={12}/></a>:<button role="menuitem" disabled>Abrir link da loja</button>}
 <button ref={moreButton} role="menuitem" aria-haspopup="menu" aria-expanded={more} onMouseEnter={()=>{keep();setMore(true)}} onMouseLeave={leave} onFocus={()=>{keep();setMore(true)}} onClick={()=>{keep();setMore(true)}}><span>Mais</span><ChevronRight size={12}/></button>
 </div>
 {more&&<div ref={extra} className="store-options-popover store-options-submenu" role="menu" aria-label="Mais opções da loja" onMouseEnter={keep} onMouseLeave={leave} style={{left:submenu?.left??0,top:submenu?.top??0,visibility:submenu?'visible':'hidden',width:position?.width}}>
 <button role="menuitem" onClick={()=>act(onConfigure)}>Configurar endereço</button>
 <button role="menuitem" disabled={!store.url} onClick={()=>act(async()=>{try{await navigator.clipboard.writeText(store.url);window.dispatchEvent(new CustomEvent('prime-v2-alert',{detail:{message:'Link copiado',type:'success'}}))}catch{window.dispatchEvent(new CustomEvent('prime-v2-alert',{detail:{message:'Não foi possível copiar o link',type:'error'}}))}})}>Copiar link</button>
 <button role="menuitem" onClick={()=>act(onRemove)}>Excluir loja</button>
 </div>}
 </>,document.body)}</>;
}
