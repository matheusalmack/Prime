import React from 'react';
import PrimeLogo from './PrimeLogo';
import './loading-screen.css';

export default function LoadingScreen({label='Carregando o Prime…',overlay=false}){
 return <div className={`prime-loading${overlay?' prime-loading-overlay':''}`} role="status" aria-live="polite" aria-label={label}>
  <div className="prime-loading-mark" aria-hidden="true"><PrimeLogo/></div>
  <span className="prime-loading-description">{label}</span>
 </div>;
}
