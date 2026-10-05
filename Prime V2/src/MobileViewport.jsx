import {useEffect} from 'react';

// Keep fixed search controls inside the visual viewport when the native keyboard opens.
export default function MobileViewport(){
 useEffect(()=>{
  const viewport=window.visualViewport;
  if(!viewport)return;
  const root=document.documentElement;
  let frame;
  const update=()=>{
   cancelAnimationFrame(frame);
   frame=requestAnimationFrame(()=>{
    const editing=document.activeElement?.matches('input:not([readonly]),textarea:not([readonly])');
    const inset=matchMedia('(max-width:759px)').matches&&editing?Math.max(0,window.innerHeight-viewport.height-viewport.offsetTop):0;
    root.style.setProperty('--keyboard-inset',`${Math.round(inset)}px`);
   });
  };
  viewport.addEventListener('resize',update);viewport.addEventListener('scroll',update);
  document.addEventListener('focusin',update);document.addEventListener('focusout',update);
  window.addEventListener('resize',update);
  function focusSearch(event){
   if(!matchMedia('(max-width:759px)').matches||event.target.closest('button,a'))return;
   const search=event.target.closest('.supplier-search');
   search?.querySelector('input')?.focus();
  }
  document.addEventListener('click',focusSearch);
  return()=>{cancelAnimationFrame(frame);viewport.removeEventListener('resize',update);viewport.removeEventListener('scroll',update);document.removeEventListener('focusin',update);document.removeEventListener('focusout',update);window.removeEventListener('resize',update);document.removeEventListener('click',focusSearch);root.style.removeProperty('--keyboard-inset')};
 },[]);
 return null;
}
