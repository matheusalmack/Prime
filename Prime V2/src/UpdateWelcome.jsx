import React,{useEffect,useRef,useState} from 'react';
import PrimeLogo from './PrimeLogo';
import {ReleaseNotes} from './HelpPages';
import './update-welcome.css';
export const PRIME_UPDATE_VERSION='2026-prime-redesign';
export default function UpdateWelcome({onContinue,busy=false,error}){
 const heading=useRef(null),[readingNotes,setReadingNotes]=useState(false);
 useEffect(()=>{heading.current?.focus();window.scrollTo({top:0,behavior:'instant'})},[readingNotes]);
 if(readingNotes)return <main className="update-release-preview"><header><PrimeLogo/></header><ReleaseNotes/><button className="update-release-continue" onClick={onContinue} disabled={busy}>Entendido</button>{error&&<p role="alert">{error}</p>}</main>;
 return <main className="update-welcome" aria-labelledby="update-welcome-title"><div className="update-welcome-content"><PrimeLogo/><h1 id="update-welcome-title" ref={heading} tabIndex={-1}>O Prime está de cara nova, com uma nova experiência para a sua rotina de afiliado.</h1><p>Atualizamos nosso site e serviços para melhorar sua experiência.<br/>{' '}Para saber mais, consulte as <a href="#notas-de-lancamento" onClick={event=>{event.preventDefault();setReadingNotes(true)}}>notas de lançamento</a>.</p><button type="button" onClick={onContinue} disabled={busy}>Entendido</button>{error&&<p role="alert">{error}</p>}</div></main>;
}
