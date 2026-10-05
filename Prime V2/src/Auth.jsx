import React,{useEffect,useRef,useState} from 'react';
import {Eye,EyeOff} from 'lucide-react';
import Modal,{ModalCloseButton} from './Modal';
import './auth.css';
import {ServiceContent} from './ServicePages';

export default function Auth({mode='login',onModeChange,onReturn,onLogin,onRegister,onResetPassword,onUpdatePassword}){
 const [step,setStep]=useState(mode==='recovery'?'password':'email'),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[name,setName]=useState(''),[visible,setVisible]=useState(false),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[legal,setLegal]=useState(null),[messageError,setMessageError]=useState(false),[invalidCredentials,setInvalidCredentials]=useState(false);
 const heading=useRef(null);
 function clearMessage(){setMessage('');setMessageError(false);setInvalidCredentials(false)}
 const signup=mode==='signup',recovery=mode==='recovery';
 useEffect(()=>{setStep(mode==='recovery'?'password':'email');setPassword('');clearMessage();setVisible(false)},[mode]);
 useEffect(()=>{if(step!=='email')heading.current?.focus()},[step]);
 function back(){setStep('email');setPassword('');clearMessage();setVisible(false)}
 async function submit(e){
  e.preventDefault();if(busy)return;clearMessage();
  if(step==='email'){setStep('password');return}
  const action=recovery?onUpdatePassword:step==='reset'?onResetPassword:signup?onRegister:onLogin;
  if(!action){setMessage(step==='reset'?'A recuperação de senha estará disponível quando o serviço de contas for conectado.':signup?'O cadastro ainda não está conectado ao serviço de contas. Nenhuma conta foi criada.':'O login ainda não está conectado ao serviço de contas.');return}
  setBusy(true);
  try{const result=await action(recovery?password:step==='reset'?{email}:{email,password,...(signup?{name:name.trim()}:{})});if(recovery){setMessage('Senha atualizada.');onModeChange('login')}else if(step==='reset')setMessage('Confira seu e-mail para continuar.');else if(result?.message)setMessage(result.message)}catch(error){setMessage(error.message||'Não foi possível continuar. Tente novamente.');setMessageError(true);setInvalidCredentials(error.code==='invalid_credentials')}finally{setBusy(false)}
 }
 const title=recovery?'Crie sua nova senha':step==='reset'?'Recupere sua senha':signup?'Cadastre-se com seu e-mail':step==='email'?'Faça login na sua conta':'Faça login com seu e-mail';
 return <div className="auth-page">
  <header className="auth-header"><div className="auth-context"><span>{signup?'Você está se cadastrando no':'Você está fazendo login no'}</span><button className="auth-product" type="button" onClick={onReturn} aria-label="Voltar ao Prime">Prime</button></div></header>
  <main className="auth-main"><section className="auth-panel" aria-labelledby="auth-heading">
   <h1 id="auth-heading" ref={heading} tabIndex={-1}>{title}</h1>
   {step==='reset'&&<p className="auth-description">Informe seu e-mail para recuperar o acesso à sua conta.</p>}
   <form onSubmit={submit}>
    {!recovery&&<><label className="auth-label" htmlFor="auth-email">E-mail</label><input id="auth-email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required maxLength={254} value={email} aria-invalid={invalidCredentials||undefined} aria-describedby={invalidCredentials?'auth-message':undefined} disabled={busy} onChange={e=>{setEmail(e.target.value);clearMessage()}} /></>}
    {step==='password'&&<>
     {signup&&<><label className="auth-label auth-spaced" htmlFor="auth-name">Nome e sobrenome</label><input id="auth-name" autoComplete="name" required maxLength={100} value={name} onChange={e=>setName(e.target.value)}/></>}
     <div className="auth-password-label"><label htmlFor="auth-password">{signup||recovery?'Crie uma senha':'Senha'}</label>{!signup&&!recovery&&<button type="button" onClick={()=>{setStep('reset');setPassword('');clearMessage()}}>Esqueceu sua senha?</button>}</div>
     <div className="auth-password"><input id="auth-password" type={visible?'text':'password'} autoComplete={signup||recovery?'new-password':'current-password'} required minLength={signup||recovery?8:undefined} maxLength={128} value={password} disabled={busy} onChange={e=>{setPassword(e.target.value);clearMessage()}} aria-invalid={invalidCredentials||undefined} aria-describedby={invalidCredentials?'auth-message':signup?'auth-password-hint':undefined}/><button type="button" aria-label={visible?'Ocultar senha':'Mostrar senha'} aria-pressed={visible} onClick={()=>setVisible(v=>!v)}>{visible?<Eye size={18}/>:<EyeOff size={18}/>}</button></div>
     {signup&&<p className="auth-hint" id="auth-password-hint">Use pelo menos 8 caracteres.</p>}
    </>}
    {message&&<p id="auth-message" className={`auth-message${messageError?' auth-message-error':''}`} role={messageError?'alert':'status'}>{message}</p>}
    <button className="auth-button auth-primary" disabled={busy} type="submit">{busy?'Aguarde…':recovery?'Salvar senha':step==='reset'?'Enviar instruções':step==='email'?(signup?'Cadastrar-se':'Próximo'):(signup?'Criar conta':'Entrar')}</button>
    <button className="auth-button" type="button" disabled={busy} onClick={recovery?onReturn:step==='email'?onReturn:back}>Voltar</button>
   </form>
   {!recovery&&step!=='reset'&&<p className="auth-switch">{signup?'Já tem uma conta?':'Não tem uma conta?'} <button disabled={busy} onClick={()=>onModeChange(signup?'login':'signup')}>{signup?'Entrar':'Cadastrar-se'}</button></p>}
  </section></main>
  <footer className="auth-footer">Ao continuar, você concorda com os <button onClick={()=>setLegal('Termos de uso')}>Termos de uso</button> e a <button onClick={()=>setLegal('Política de privacidade')}>Política de privacidade</button> do Prime.<br/><button type="button" onClick={()=>window.dispatchEvent(new Event('prime-open-cookie-settings'))}>Configurações de cookies</button></footer>
  {legal&&<Modal label={legal} className="auth-legal" onClose={()=>setLegal(null)}><ModalCloseButton onClick={()=>setLegal(null)}/><ServiceContent type={legal==='Termos de uso'?'terms':'privacy'}/><button className="auth-button" onClick={()=>setLegal(null)}>Voltar</button></Modal>}
 </div>;
}
