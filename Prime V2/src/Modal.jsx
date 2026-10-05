import React,{useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {X,ChevronLeft} from 'lucide-react';
export function ModalCloseButton({label='Fechar',onClick,className=''}){return <button type="button" className={`modal-close-button ${className}`} aria-label={label} onClick={onClick}><X size={18}/></button>}
export default function Modal({label,onClose,onBack,mobileBack,children,className=''}){
 const showBack=mobileBack??Boolean(onBack||/settings-mobile|language-picker/.test(className));
 const panel=useRef(null),close=useRef(onClose);close.current=onClose;
 const [expanded,setExpanded]=useState(false),[dragOffset,setDragOffset]=useState(0),[closing,setClosing]=useState(false);
 const gesture=useRef(null),dismissTimer=useRef(null),dragged=useRef(false);
 const isSheet=()=>matchMedia('(max-width:759px)').matches&&!/settings-mobile|language-picker/.test(className);
 useEffect(()=>()=>clearTimeout(dismissTimer.current),[]);
 const dismiss=()=>{
  if(!isSheet()){close.current();return}
  if(dismissTimer.current)return;
  setClosing(true);dismissTimer.current=setTimeout(()=>close.current(),220);
 };
 const startDrag=e=>{
  if(!isSheet())return;
  dragged.current=false;gesture.current={y:e.clientY,time:performance.now()};
  e.currentTarget.setPointerCapture(e.pointerId);
 };
 const moveDrag=e=>{
  if(!gesture.current)return;
  setDragOffset(Math.max(-80,e.clientY-gesture.current.y));
 };
 const finishDrag=e=>{
  if(!gesture.current)return;
  const distance=e.clientY-gesture.current.y;
  const speed=distance/Math.max(1,performance.now()-gesture.current.time);
  dragged.current=Math.abs(distance)>8;gesture.current=null;setDragOffset(0);
  if(distance>100||distance>35&&speed>.5){if(expanded)setExpanded(false);else dismiss()}
  else if(distance < -30)setExpanded(true);
 };
 const contentTouch=useRef(null);
 const startContentTouch=e=>{
  if(!isSheet()||e.target.closest('button,input,textarea,select,a'))return;
  contentTouch.current={y:e.touches[0].clientY,atTop:panel.current.scrollTop<=0};
 };
 const finishContentTouch=e=>{
  const start=contentTouch.current;contentTouch.current=null;
  if(!start||!e.changedTouches.length)return;
  const distance=e.changedTouches[0].clientY-start.y;
  if(distance < -45)setExpanded(true);
  else if(start.atTop&&distance>100){if(expanded)setExpanded(false);else dismiss()}
 };
 useEffect(()=>{
  const previous=document.activeElement,overflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  const focusable=()=>[...panel.current.querySelectorAll('button,a[href],input,select,textarea,[tabindex="0"]')].filter(el=>!el.disabled&&el.getClientRects().length>0);
  const initial=panel.current.querySelector('[data-autofocus]')||[...panel.current.querySelectorAll('[autofocus],input,textarea')].find(el=>!el.disabled&&el.getClientRects().length>0);
  (initial||focusable()[0]||panel.current).focus();
  const keys=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();dismiss()}else if(e.key==='Tab'){const items=focusable(),first=items[0],last=items.at(-1);if(!first){e.preventDefault();panel.current.focus()}else if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}};
  panel.current.addEventListener('keydown',keys);const el=panel.current;
  return()=>{el.removeEventListener('keydown',keys);document.body.style.overflow=overflow;if(previous?.isConnected)previous.focus()};
 },[]);
 return createPortal(<div className={`v2-modal-overlay mobile-sheet-overlay ${closing?'sheet-closing':''}`} onMouseDown={e=>{if(e.target===e.currentTarget)dismiss()}}><section ref={panel} onScrollCapture={e=>{if(isSheet()&&e.target.scrollTop>16)setExpanded(true)}} onTouchStart={startContentTouch} onTouchEnd={finishContentTouch} onWheel={e=>{if(isSheet()&&e.deltaY>20)setExpanded(true)}} style={{'--sheet-drag':`${dragOffset}px`}} onPointerDown={e=>{if(!e.target.closest('input,textarea,select')&&panel.current.contains(document.activeElement)&&document.activeElement.matches('input,textarea,select'))document.activeElement.blur()}} tabIndex={-1} className={`v2-modal mobile-sheet ${expanded?'sheet-expanded':''} ${dragOffset?'sheet-dragging':''} ${!showBack?'sheet-dismiss-only':''} ${className}`} role="dialog" aria-modal="true" aria-label={label}><button type="button" className="mobile-sheet-handle" aria-label={expanded?'Recolher painel':'Expandir painel'} onClick={()=>{if(dragged.current){dragged.current=false;return}setExpanded(v=>!v)}} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={finishDrag} onPointerCancel={()=>{gesture.current=null;setDragOffset(0)}}><span/></button><nav className="mobile-modal-navigation" aria-label="Navegação da janela">{showBack&&<button type="button" className="mobile-circle-control" aria-label="Voltar" onClick={onBack||dismiss}><ChevronLeft size={22}/></button>}<button type="button" className="mobile-circle-control" aria-label={`Fechar ${label.toLowerCase()}`} onClick={dismiss}><X size={21}/></button></nav>{children}</section></div>,document.body);
}
