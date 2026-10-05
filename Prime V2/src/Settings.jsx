import {notify} from './Alerts';
import {useBackend} from './Backend';
import React,{useState,useEffect,useRef} from 'react';
import {UserRound,Paintbrush,PanelsTopLeft,Bell,SlidersHorizontal,Database,Languages,ChevronRight,Pencil} from 'lucide-react';
import Modal,{ModalCloseButton} from './Modal';
import LanguagePicker,{languages} from './LanguagePicker';
import ShopeeConnection from './ShopeeConnection';
import HomePagePicker from './HomePagePicker';
function saveSetting(key,value){try{localStorage.setItem(key,value);return true}catch{notify('Não foi possível salvar as configurações');return false}}
const sections=[['account','Conta',UserRound],['appearance','Aparência',Paintbrush],['behavior','Comportamento',PanelsTopLeft],['notifications','Notificações',Bell],['customize','Customizar',SlidersHorizontal],['data','Controle de dados',Database]];
function Toggle({value,onChange,label}){return <button className="settings-switch" role="switch" aria-label={label} aria-checked={value} onClick={()=>onChange(!value)}><span/></button>}
export default function Settings({theme,setTheme,onClose,onProfileChange,onManageProfile,onUpgrade,plan='free',shopeeConnected=false,onShopeeConnect,onShopeeDisconnect,onHelp,onSignOut,mobile=false,accountProfile}){
 const content=useRef(null);
 const [section,setSection]=useState(mobile?'overview':'account'),[changingLanguage,setChangingLanguage]=useState(false);
 useEffect(()=>{setSection(mobile?'overview':'account')},[mobile]);
 useEffect(()=>{if(mobile)content.current?.closest('.v2-modal')?.scrollTo({top:0,behavior:'instant'})},[section,mobile]);
 const [homePage,setHomePage]=useState(()=>{try{return localStorage.getItem('prime-v2-home')||'0'}catch{return '0'}});
 async function changeHomePage(value){try{await savePreferences({homePage:value});setHomePage(value);saveSetting('prime-v2-home',value);return true}catch(e){notify(e.message);return false}}
 const [showShopee,setShowShopee]=useState(false);
 const [demoConnected,setDemoConnected]=useState(()=>{try{return localStorage.getItem('prime-v2-shopee-demo-connected')==='true'}catch{return false}});
 const [language,setLanguage]=useState(()=>{try{return localStorage.getItem('prime-v2-language')||'pt-BR'}catch{return 'pt-BR'}});
 const planName={free:'Free',prime:'Prime',monthly:'SuperPrime',super:'SuperPrime',superprime:'SuperPrime',lifetime:'SuperPrime Heavy',founder:'Fundador',admin:'Administrador'}[String(plan).toLowerCase()]||'Free';
 async function changeLanguage(value){try{await savePreferences({language:value});setLanguage(value);setChangingLanguage(false)}catch(e){notify(e.message)}}
 function manageShopee(){setShowShopee(true)}
 function connectDemo(){if(!saveSetting('prime-v2-shopee-demo-connected','true'))return false;setDemoConnected(true);return true}
 function disconnectDemo(){if(saveSetting('prime-v2-shopee-demo-connected','false')){setDemoConnected(false);setShowShopee(false);notify('Shopee desconectada','success')}}
 const {saved,user,savePreferences}=useBackend();
 const stored=user?.user_metadata?.prime_v2_preferences||{};
 useEffect(()=>{setHomePage(stored.homePage||'0');setLanguage(stored.language||'pt-BR');setPrefs({autoScroll:true,confirmCopy:false,notifications:false,compact:false,...stored.behavior})},[user?.id]);
 const profile=accountProfile||{};
 const [prefs,setPrefs]=useState(()=>{try{return JSON.parse(localStorage.getItem('prime-v2-preferences'))||{autoScroll:true,confirmCopy:false,notifications:false,compact:false}}catch{return {autoScroll:true,confirmCopy:false,notifications:false,compact:false}}});
 async function preference(key,value){const next={...prefs,[key]:value};try{await savePreferences({behavior:next});setPrefs(next)}catch(e){notify(e.message)}}

 const row=(title,description,control)=><div className="settings-row"><div><div>{title}</div>{description&&<p>{description}</p>}</div>{control}</div>;
 return <Modal label="Configurações" className={`settings-modal ${mobile?'settings-mobile':''} ${section==='overview'?'settings-overview':''}`} onClose={onClose} onBack={section==='overview'?onClose:()=>setSection('overview')}>
  <ModalCloseButton className="settings-close" label="Fechar configurações" onClick={onClose}/>
  <nav className="settings-nav" aria-label="Seções de configurações"><div className="settings-group-label">Geral</div>{sections.map(([id,label,Icon],i)=><React.Fragment key={id}>{i===4&&<div className="settings-group-label">Prime</div>}{i===5&&<div className="settings-group-label">Dados e informações</div>}<button className={section===id?'selected':''} aria-current={section===id?'page':undefined} onClick={()=>setSection(id)}><Icon size={16}/>{label}</button></React.Fragment>)}</nav>
  <div className="settings-body"><div className="settings-content" ref={content}>{section==='overview'?<>
 <div className="mobile-settings-profile"><div className="mobile-settings-photo"><img src={profile.avatar||'/images/avatar.svg'} alt=""/><button className="mobile-profile-edit" aria-label="Gerenciar conta" onClick={onManageProfile}><Pencil size={18}/></button></div><h2>{profile.name}</h2><p>{profile.email}</p></div>
 
 <h3 className="mobile-settings-label">Seu Prime</h3><div className="mobile-settings-list">{sections.map(([id,label,Icon])=><button key={id} onClick={()=>setSection(id)}><Icon size={21}/><span>{label}</span><ChevronRight size={18}/></button>)}</div>
 <h3 className="mobile-settings-label">Ajuda</h3><div className="mobile-settings-list"><a href="/faq" target="_blank" rel="noopener noreferrer">Perguntas frequentes<ChevronRight size={18}/></a><button onClick={()=>onHelp?.('release')}>Notas de lançamento<ChevronRight size={18}/></button><a href="https://discord.gg/primeafiliado" target="_blank" rel="noopener noreferrer">Comunidade<ChevronRight size={18}/></a><button onClick={()=>onHelp?.('shared')}>Links compartilhados<ChevronRight size={18}/></button><button onClick={()=>onHelp?.('feedback')}>Enviar comentário<ChevronRight size={18}/></button><button onClick={onManageProfile}>Conta, privacidade e serviços<ChevronRight size={18}/></button></div><button className="mobile-settings-signout" onClick={onSignOut}>Sair do Prime</button>
 </>:<h2>{sections.find(s=>s[0]===section)?.[1]}</h2>}
   {section==='account'&&<>
    <div className="settings-account"><span className="settings-avatar"><img src={profile.avatar||'/images/avatar.svg'} alt=""/></span><div><div>{profile.name}</div><p>{profile.email}</p></div><button className="settings-outline" onClick={onManageProfile}>Gerenciar</button></div>

    <div className="settings-divider"/>
    {row(<>{mobile?'Assinatura':'Subscription'} <span className="settings-value">{planName}</span></>,null,<button className="settings-outline" onClick={()=>onUpgrade?.()}>{planName==='Free'?(mobile?'Atualizar':'Upgrade'):'Gerenciar'}</button>)}
    {row('Conta Shopee',null,<button className="settings-outline" onClick={manageShopee}>{demoConnected?'Desconectar':'Conectar'}</button>)}
    <div className="settings-divider"/>
    {row(<>Idioma <Languages size={16}/><span className="settings-value">{languages.find(([value])=>value===language)?.[1]||'Português'}</span></>,null,<div className="settings-language-control"><button className="settings-outline" aria-haspopup="dialog" aria-expanded={changingLanguage} onClick={()=>setChangingLanguage(true)}>Mudar</button></div>)}
    {row(<>Ano de nascimento <span className="settings-value">Não informado</span></>)}
   </>}
   {section==='appearance'&&<>
    <div className="settings-theme-row"><span>Tema</span><div className="settings-theme-options">{[['light','Claro'],['dark','Escuro'],['system','Sistema']].map(([value,label])=><button key={value} className={theme===value?'selected':''} aria-pressed={theme===value} onClick={()=>setTheme(value)}><div className={`theme-preview theme-preview-${value}`}><div className="theme-mini-window"><span/><div><i/><i/><i/></div></div></div><span>{label}</span></button>)}</div></div>
    <div className="settings-divider"/>
   </>}
   {section==='behavior'&&<>
    {row('Ativar rolagem automática','Preferência para os próximos fluxos de criação.',<Toggle label="Ativar rolagem automática" value={prefs.autoScroll} onChange={v=>preference('autoScroll',v)}/>)}<div className="settings-divider"/>
    {row('Confirmar ações','Solicitar confirmação em ações dos próximos fluxos.',<Toggle label="Confirmar ações" value={prefs.confirmCopy} onChange={v=>preference('confirmCopy',v)}/>)}<div className="settings-divider"/>
   </>}
   {section==='notifications'&&row('Notificações na plataforma','Preferência salva para quando sua conta estiver conectada.',<Toggle label="Notificações na plataforma" value={prefs.notifications} onChange={v=>preference('notifications',v)}/>)}
   {section==='customize'&&row('Página inicial','Escolha a seção exibida ao abrir o Prime.',<HomePagePicker value={homePage} onChange={changeHomePage}/>)}
   {section==='data'&&<>{row('Produtos salvos','Baixe os links de afiliado salvos na sua conta.',<button className="settings-outline" onClick={()=>{const blob=new Blob([JSON.stringify(saved)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='prime-produtos.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}}>Exportar</button>)}<div className="settings-divider"/>{row('Sua conta','Seus produtos e dados de perfil são salvos na sua conta Prime.')}</>}
  </div><footer className="settings-footer"></footer></div>
 {changingLanguage&&<LanguagePicker value={language} onChange={changeLanguage} onClose={()=>setChangingLanguage(false)}/>}
 {showShopee&&<ShopeeConnection connected={demoConnected} onConnect={connectDemo} onDisconnect={disconnectDemo} onClose={()=>setShowShopee(false)}/>}
 </Modal>
}
