import {BackendProvider,useBackend,supabase} from './Backend';
import GlobalCookieNotice from './GlobalCookieNotice';
import {pagePaths,authPath,readRoute} from './routes.mjs';
import MobileViewport from './MobileViewport';
import ServicePages,{serviceRoutes} from './ServicePages';
import PrimeLogo from './PrimeLogo';
import LoadingScreen from './LoadingScreen';
import {ReleaseNotes,SharedLinks} from './HelpPages';
import FeedbackModal from './Feedback';
import Plans from './Plans';
import Account from './Account';
import Auth from './Auth';
import Landing from './Landing';
import GlobalSearch from './GlobalSearch';
import Alerts,{notify} from './Alerts';
import React,{useState,useEffect,useId,useRef} from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';
import './store-editor.css';
import './input-focus.css';
import './autofill.css';
import Supplier from './Supplier';
import Videos from './Videos';
import Promotion from './Promotion';
import Stores from './Stores.jsx';
import Storefront from './Storefront';
import {sidebarStores} from './store-data.js';
import Modal from './Modal';
import SettingsModal from './Settings';
import {LifeBuoy,Crown,Flag,Share2,Plus,ChevronDown,Mic,AudioLines,Glasses,Settings,ChevronRight,LogOut,X,ArrowUp,CircleHelp,History,Users,Accessibility,ArrowUpRight,Megaphone} from 'lucide-react';
import {motion,useAnimation,useReducedMotion} from 'motion/react';
import {HugeiconsIcon} from '@hugeicons/react';
import {AiImage01Icon,Store01Icon,ShoppingBag03Icon,BriefcaseBusinessIcon,LayoutLeftIcon,Search01Icon} from '@hugeicons/core-free-icons';
import {SearchIcon} from './components/ui/search';
import {PlusIcon} from './components/ui/plus';
import {ChevronDownIcon} from './components/ui/chevron-down';
import {MicIcon} from './components/ui/mic';
import {AudioLinesIcon} from './components/ui/audio-lines';
import {HatGlassesIcon} from './components/ui/hat-glasses';
import {SettingsIcon} from './components/ui/settings';
import {ChevronRightIcon} from './components/ui/chevron-right';
import {LogoutIcon} from './components/ui/logout';
import {XIcon} from './components/ui/x';
import {ArrowUpIcon} from './components/ui/arrow-up';
import {CircleHelpIcon} from './components/ui/circle-help';
import {HistoryIcon} from './components/ui/history';
import {UsersIcon} from './components/ui/users';
import './mobile-experience.css';

const animatedIcons={search:SearchIcon,plus:PlusIcon,chevron:ChevronDownIcon,mic:MicIcon,wave:AudioLinesIcon,private:HatGlassesIcon,gear:SettingsIcon,right:ChevronRightIcon,logout:LogoutIcon,x:XIcon,arrow:ArrowUpIcon,question:CircleHelpIcon,history:HistoryIcon,people:UsersIcon};
const hugeIcon=(icon)=>function HugeIcon({size=18,strokeWidth=1.7}){return <HugeiconsIcon icon={icon} size={size} strokeWidth={strokeWidth}/>};
const LayoutLeft=hugeIcon(LayoutLeftIcon);
const staticIcons={bag:hugeIcon(BriefcaseBusinessIcon),bookmark:hugeIcon(ShoppingBag03Icon),shop:hugeIcon(Store01Icon),video:hugeIcon(AiImage01Icon),promote:Megaphone,help:LifeBuoy,upgrade:Crown,flag:Flag,share:Share2,search:hugeIcon(Search01Icon),panel:LayoutLeft,collapse:LayoutLeft,plus:Plus,chevron:ChevronDown,mic:Mic,wave:AudioLines,private:Glasses,gear:Settings,right:ChevronRight,logout:LogOut,x:X,arrow:ArrowUp,question:CircleHelp,history:History,people:Users,accessibility:Accessibility};
function Icon({name,size=18,animated=false}){
 if(animated)return <AnimatedIcon name={name} size={size}/>;
 const Component=staticIcons[name];
 return <span className="animated-icon" style={{width:size,height:size}} aria-hidden="true"><Component size={size} strokeWidth={1.7}/></span>;
}
function AnimatedIcon({name,size=18}){
 const ref=useRef(null),container=useRef(null),controls=useAnimation(),reduceMotion=useReducedMotion();
 const Component=animatedIcons[name]||staticIcons[name];
 useEffect(()=>{
  const target=container.current?.closest('button')||container.current;
  if(!target)return;
  const start=()=>{if(reduceMotion)return;if(animatedIcons[name])ref.current?.startAnimation();else controls.start({scale:1.04,transition:{duration:.18,ease:[.2,.8,.2,1]}})};
  const stop=()=>{if(animatedIcons[name])ref.current?.stopAnimation();else controls.start({scale:1,transition:{duration:.18,ease:[.2,.8,.2,1]}})};
  target.addEventListener('pointerenter',start);target.addEventListener('pointerleave',stop);target.addEventListener('focusin',start);target.addEventListener('focusout',stop);
  return()=>{target.removeEventListener('pointerenter',start);target.removeEventListener('pointerleave',stop);target.removeEventListener('focusin',start);target.removeEventListener('focusout',stop)};
 },[name,controls,reduceMotion]);
 return <motion.span className="animated-icon" ref={container} animate={controls} style={{width:size,height:size}} aria-hidden="true">{animatedIcons[name]?<Component ref={ref} size={size}/>:<Component size={size} strokeWidth={1.7}/>}</motion.span>;
}
const shortcutKey = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl+';
function Tooltip({label,shortcut,align='center',children}){
 const id=useId(),[dismissed,setDismissed]=useState(false),[touchUI,setTouchUI]=useState(()=>matchMedia('(max-width:759px), (hover:none)').matches);
 useEffect(()=>{const query=matchMedia('(max-width:759px), (hover:none)'),sync=()=>setTouchUI(query.matches);query.addEventListener('change',sync);return()=>query.removeEventListener('change',sync)},[]);
 if(touchUI)return children;
 return <span className={`tooltip-control tooltip-${align} ${dismissed?'tooltip-dismissed':''}`} onMouseEnter={()=>setDismissed(false)} onFocus={()=>setDismissed(false)} onKeyDown={e=>{if(e.key==='Escape')setDismissed(true)}}>
  {React.cloneElement(children,{'aria-describedby':id})}
  <span className="control-tooltip" role="tooltip" id={id}>{label}{shortcut&&<kbd>{shortcut}</kbd>}</span>
 </span>;
}
const links=[{name:'Fornecedor',icon:'bag',heading:'O que devemos explorar?',placeholder:'Encontre seu próximo produto favorito'}, {name:'Meus produtos',icon:'bookmark',heading:'O que vamos preparar hoje?',placeholder:'Comece com um dos seus produtos salvos'}, {name:'Lojas',icon:'shop',heading:'Vamos criar a sua loja?',placeholder:'Conte como você imagina sua loja'}, {name:'Vídeos',icon:'video',heading:'Qual ideia vamos transformar?',placeholder:'Descreva o vídeo que você quer criar'}];
function App(){
 const [isMobile,setIsMobile]=useState(()=>matchMedia('(max-width:759px)').matches);
 const swipeStart=useRef(null);
 useEffect(()=>{const mq=matchMedia('(max-width:759px)'),sync=()=>{setIsMobile(mq.matches);setMobileOpen(false)};mq.addEventListener('change',sync);return()=>mq.removeEventListener('change',sync)},[]);
 function touchStart(e){swipeStart.current=null;if(!isMobile||e.touches.length!==1||e.target.closest('input,textarea,select,[role=slider]'))return;const t=e.touches[0];swipeStart.current={x:t.clientX,y:t.clientY}}
 function touchEnd(e){const start=swipeStart.current;swipeStart.current=null;if(!start||!isMobile)return;const t=e.changedTouches[0],dx=t.clientX-start.x,dy=t.clientY-start.y;if(Math.abs(dy)>55)return;if(!mobileOpen&&start.x<36&&dx>75)setMobileOpen(true);else if(mobileOpen&&dx< -75)setMobileOpen(false)}
 const [landingOpen,setLandingOpen]=useState(()=>readRoute(location).landing);
 const [promotionTab,setPromotionTab]=useState('groups');
 function exploreApp(target,tab){setPromotionTab(tab==='templates'?'templates':'groups');const url=new URL(location.href);url.pathname=pagePaths[target]||'/fornecedor';url.search='';url.hash='';history.pushState(null,'',url);setLandingOpen(false);setAuthMode(null);setAccountOpen(false);select(target);window.scrollTo({top:0,behavior:'instant'})}
 useEffect(()=>{const sync=()=>setLandingOpen(readRoute(location).landing);window.addEventListener('popstate',sync);return()=>window.removeEventListener('popstate',sync)},[]);
 const [authMode,setAuthMode]=useState(()=>readRoute(location).auth);
 function navigateAuth(mode){setLandingOpen(false);const url=new URL(location.href);url.pathname=authPath(mode);url.hash='';url.search='';history.pushState(null,'',url);setAuthMode(mode);setAccountOpen(false);setPopup(null);window.scrollTo({top:0,behavior:'instant'})}
 const [accountOpen,setAccountOpen]=useState(()=>readRoute(location).account);
 function openAccount(){history.pushState(null,'','/conta');setPopup(null);setAccountOpen(true);window.scrollTo({top:0,behavior:'instant'})}
 function closeAccount(){history.pushState(null,'',pagePaths[active]||'/fornecedor');setPopup(null);setAccountOpen(false);window.scrollTo({top:0,behavior:'instant'})}
 useEffect(()=>{const sync=()=>{const route=readRoute(location);setLandingOpen(route.landing);setAuthMode(route.auth);setAccountOpen(route.account);if(route.page!==null)setActive(route.page);setPopup(null)};window.addEventListener('popstate',sync);return()=>window.removeEventListener('popstate',sync)},[]);
 const backend=useBackend();
 const profile=backend.profile||{name:'Sua conta',email:''};
 const setProfile=backend.updateProfile;
 const [active,setActive]=useState(()=>{try{return readRoute(location).page??Math.min(3,Math.max(0,Number(localStorage.getItem('prime-v2-home'))||0))}catch{return 0}}),[collapsed,setCollapsed]=useState(false),[mobileOpen,setMobileOpen]=useState(false),[text,setText]=useState('');
 const [popup,setPopup]=useState(null),[theme,setThemeState]=useState(()=>{try{return ['light','dark','system'].includes(localStorage.getItem('prime-v2-theme'))?localStorage.getItem('prime-v2-theme'):'light'}catch{return 'light'}}),[search,setSearch]=useState(''),[feedback,setFeedback]=useState('');
 async function setTheme(value){try{if(backend.user)await backend.savePreferences({theme:value});setThemeState(value)}catch(e){notify(e.message)}}
 useEffect(()=>{if(backend.user){setThemeState(backend.preferences?.theme||'light');setActive(readRoute(location).page??Math.min(3,Math.max(0,Number(backend.preferences?.homePage)||0)))}},[backend.user?.id]);
 useEffect(()=>{if(!mobileOpen||!isMobile)return;const old=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=old}},[mobileOpen,isMobile]);
 const [mode,setMode]=useState('Explorar');
 const [searchTarget,setSearchTarget]=useState(null);
 const [helpOpen,setHelpOpen]=useState(false);
 const helpCloseTimer=useRef(null);
 function keepHelpOpen(){clearTimeout(helpCloseTimer.current)}
 function openHelp(){keepHelpOpen();setHelpOpen(true)}
 function closeHelp(){keepHelpOpen();setHelpOpen(false)}
 function scheduleHelpClose(){keepHelpOpen();helpCloseTimer.current=setTimeout(()=>setHelpOpen(false),160)}
 const [storesExpanded,setStoresExpanded]=useState(true);
 const stores=backend.stores;
 const {visible:visibleStores,hasMore:hasMoreStores}=sidebarStores(stores);
 useEffect(()=>{closeHelp();return()=>clearTimeout(helpCloseTimer.current)},[popup]);
 useEffect(()=>{document.documentElement.dataset.theme=theme;try{localStorage.setItem('prime-v2-theme',theme)}catch{}},[theme]);
 useEffect(()=>{
  if(!['profile','help'].includes(popup))return;
  const close=e=>{if(!e.target.closest('.sidebar-bottom'))setPopup(null)};
  document.addEventListener('pointerdown',close);
  if(popup==='profile')document.querySelector('.profile-menu [role="menuitem"]')?.focus();
  return()=>document.removeEventListener('pointerdown',close);
 },[popup]);
 useEffect(()=>{const shortcuts=e=>{
  if(e.key==='Escape'){setPopup(null);setMobileOpen(false)}
  if((e.metaKey||e.ctrlKey)&&!e.altKey){
   if(e.key.toLowerCase()==='k'){e.preventDefault();setPopup(p=>p==='search'?null:'search');setSearch('')}
   if(e.key.toLowerCase()==='b'){e.preventDefault();setCollapsed(v=>!v);setPopup(null);setMobileOpen(v=>!v)}
  }
 };window.addEventListener('keydown',shortcuts);return()=>window.removeEventListener('keydown',shortcuts)},[]);
 function select(i){history.pushState(null,'',pagePaths[i]||'/fornecedor');setSearchTarget(null);setActive(i);setMobileOpen(false);setPopup(null);setFeedback('');setText('')}
 function submit(e){e.preventDefault();if(!text.trim())return;setFeedback('Esta é a primeira prévia visual. As funcionalidades serão conectadas nas próximas etapas.')}
 const publicService=Object.keys(serviceRoutes).find(key=>serviceRoutes[key]===location.pathname);
 if(publicService&&!backend.user)return <ServicePages type={publicService}/>;
 if(landingOpen)return <Landing faqOnly={location.pathname==='/faq'} onAuth={navigateAuth} onExplore={exploreApp} theme={theme} setTheme={setTheme}/>;
 if(!backend.ready)return <LoadingScreen label="Carregando sua conta…"/>;
 if(backend.error||backend.catalogError)return <div className="backend-state"><p role="alert">{backend.error||backend.catalogError}</p><button onClick={backend.retry}>Tentar novamente</button></div>;
 if(backend.recovery||authMode==='recovery')return <Auth mode="recovery" onUpdatePassword={backend.definePassword} onModeChange={navigateAuth} onReturn={()=>navigateAuth('login')}/>;
 if(authMode||!backend.user)return <Auth mode={authMode||'login'} onModeChange={navigateAuth} onReturn={()=>{history.pushState(null,'','/');setAuthMode(null);setLandingOpen(true)}} onLogin={async values=>{await backend.login(values);navigateAuth(null)}} onRegister={async values=>{const result=await backend.register(values);if(!result.message)navigateAuth(null);return result}} onResetPassword={backend.resetPassword}/>;
 if(!backend.catalogReady)return <LoadingScreen label="Carregando catálogo…"/>;
 if(!backend.access?.has_access)return <div className="backend-state"><PrimeLogo/><h1>Seu plano não está ativo</h1><p>Atualize seu plano para continuar usando o Prime.</p><Plans onClose={()=>backend.signOut().then(()=>navigateAuth('login'))}/></div>;
 const serviceType=Object.keys(serviceRoutes).find(key=>serviceRoutes[key]===location.pathname);
 if(accountOpen||serviceType)return <><Account initialResource={serviceType} profile={profile} onProfileChange={setProfile} accountData={{createdAt:profile.createdAt,passwordEnabled:true,sessions:backend.sessions}} onRevokeSession={backend.revokeSession} onDefinePassword={backend.definePassword} onDeleteAccount={backend.deleteAccount} onExportData={backend.exportAccountData} plan={backend.access?.plan_code||backend.access?.account_role} theme={theme} setTheme={setTheme} onReturn={closeAccount} onBack={()=>{closeAccount();setPopup('settings')}} onSignOut={async scope=>{await backend.signOut(scope);navigateAuth('login')}} onUpgrade={()=>setPopup('plans')}/>{popup==='plans'&&<Plans onClose={()=>setPopup(null)}/>}</>;
 return <div className={`shell ${collapsed?'collapsed':''} ${mobileOpen?'mobile-drawer-open':''}`} onTouchStart={touchStart} onTouchEnd={touchEnd} onTouchCancel={()=>{swipeStart.current=null}}>
  {mobileOpen&&<button className="scrim" aria-label="Fechar menu" onClick={()=>setMobileOpen(false)}/>}
  <aside className={`sidebar ${mobileOpen?'mobile-open':''}`} aria-label="Navegação principal">
   <div className="sidebar-top"><PrimeLogo/><div><Tooltip label="Buscar" shortcut={`${shortcutKey}K`}><button className="icon-button" aria-label="Buscar no Prime" aria-keyshortcuts="Meta+K Control+K" onClick={()=>{setMobileOpen(false);setPopup('search');setSearch('')}}><Icon name="search" size={19}/></button></Tooltip><Tooltip label={collapsed?'Expandir':'Recolher'} align="right"><button className="icon-button collapse-button" aria-label={collapsed?'Expandir sidebar':'Recolher sidebar'} aria-keyshortcuts="Meta+B Control+B" onClick={()=>setCollapsed(v=>!v)}><Icon name="collapse" size={18}/></button></Tooltip><button className="icon-button mobile-close" aria-label="Fechar menu" onClick={()=>setMobileOpen(false)}><Icon name="x"/></button></div></div>
   <nav>{[...links,{name:'Divulgação',icon:'promote'}].map((l,index)=>{const i=index===4?6:index;const button=<button className={`nav-link ${active===i?'active':''}`} aria-label={l.name} aria-current={active===i?'page':undefined} onClick={()=>select(i)}><Icon name={l.icon} size={18}/><span>{l.name}</span></button>;return collapsed?<Tooltip key={l.name} label={l.name} align="right">{button}</Tooltip>:React.cloneElement(button,{key:l.name})})}</nav>
   <div className="stores-section"><button className="projects" aria-expanded={storesExpanded} aria-controls="sidebar-stores" onClick={()=>setStoresExpanded(v=>!v)}><span>Minhas lojas</span><span className={`projects-chevron ${storesExpanded?'':'is-collapsed'}`}><Icon name="chevron" size={14}/></span></button><div id="sidebar-stores" hidden={!storesExpanded}>{visibleStores.map(store=>store.url?<a key={store.id} className="nav-link sidebar-store-link" href={store.url} target="_blank" rel="noreferrer" title={store.name}><Icon name="shop" size={18}/><span>{store.name}</span><ArrowUpRight className="sidebar-store-arrow" size={15}/></a>:<button key={store.id} className="nav-link sidebar-store-link" onClick={()=>{select(2);setSearchTarget({storeId:store.id})}}><Icon name="shop" size={18}/><span>{store.name}</span></button>)}{hasMoreStores&&<button className="nav-link sidebar-stores-more" onClick={()=>select(2)}><span>Ver mais</span><ChevronRight size={15}/></button>}</div></div>
   <div className="sidebar-bottom"><button className="profile nav-link" aria-label={`Perfil de ${profile.name}`} onClick={()=>{if(isMobile){setMobileOpen(false);setPopup('settings')}else setPopup(p=>p==='profile'?null:'profile')}} aria-expanded={popup==='profile'}><span className="avatar"><img src={profile.avatar||'/images/avatar.svg'} alt=""/></span><span>{profile.name}</span></button>
    {popup==='profile'&&<div className="profile-menu" role="menu" aria-label="Menu do perfil" onMouseEnter={keepHelpOpen} onMouseMove={e=>{if(e.target.closest('#profile-help,.help-submenu'))keepHelpOpen();else if(e.target.closest('[role=menuitem],.profile-email'))closeHelp();else scheduleHelpClose()}} onMouseLeave={scheduleHelpClose} onKeyDown={e=>{if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const items=[...e.currentTarget.querySelectorAll(':scope > button[role="menuitem"]')];const i=items.indexOf(document.activeElement);items[e.key==='Home'?0:e.key==='End'?items.length-1:(i+(e.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus();}}}>
     <span className="profile-email" onMouseEnter={closeHelp}>{profile.email}</span>
     <button role="menuitem" onMouseEnter={closeHelp} onClick={()=>setPopup('settings')}><Icon name="gear" size={20}/><span>Configurações</span></button>
     <button id="profile-help" role="menuitem" className={helpOpen?'help-active':''} aria-haspopup="menu" aria-expanded={helpOpen} onMouseEnter={openHelp} onClick={()=>setHelpOpen(true)} onKeyDown={e=>{if(e.key==='ArrowRight'){e.preventDefault();setHelpOpen(true);requestAnimationFrame(()=>document.querySelector('.help-submenu [role=menuitem]')?.focus())}}}><Icon name="help" size={20}/><span>Ajuda</span><Icon name="right" size={16}/></button>
     {helpOpen&&<div className="help-submenu" role="menu" aria-label="Ajuda" onMouseEnter={keepHelpOpen} onKeyDown={e=>{e.stopPropagation();if(e.key==='ArrowLeft'){setHelpOpen(false);document.getElementById('profile-help')?.focus()}else if(e.key==='Escape'){setPopup(null)}else if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const items=[...e.currentTarget.querySelectorAll('[role=menuitem]')],i=items.indexOf(document.activeElement);items[e.key==='Home'?0:e.key==='End'?items.length-1:(i+(e.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus()}}}>{[['flag','Comentário'],['question','Perguntas frequentes'],['history','Notas de Lançamento'],['people','Comunidade'],['share','Links compartilhados']].map(([icon,label])=>{const content=<><Icon name={icon} size={16}/><span>{label}</span></>;const href=label==='Perguntas frequentes'?'/faq':label==='Comunidade'?'https://discord.gg/primeafiliado':null;return href?<a role="menuitem" key={label} href={href} target="_blank" rel="noopener noreferrer" onClick={()=>setPopup(null)}>{content}</a>:<button role="menuitem" key={label} onClick={()=>{if(label==='Comentário'){setPopup('comment');return}select(label==='Notas de Lançamento'?4:5);window.scrollTo({top:0,behavior:'instant'})}}>{content}</button>})}</div>}
     <button role="menuitem" onMouseEnter={closeHelp} onClick={()=>setPopup('plans')}><Icon name="upgrade" size={20}/><span>Atualizar plano</span></button>
     <button role="menuitem" onMouseEnter={closeHelp} onClick={()=>backend.signOut().then(()=>navigateAuth('login'))}><Icon name="logout" size={20}/><span>Sair</span></button>
    </div>}


   </div>
  </aside>
  <button className="sidebar-divider" aria-label={collapsed?'Expandir sidebar':'Recolher sidebar'} aria-expanded={!collapsed} onClick={()=>setCollapsed(v=>!v)}/>
  {popup==='plans'&&<Plans onClose={()=>setPopup(null)}/>}
  {popup==='comment'&&<FeedbackModal onClose={()=>setPopup(null)}/>}
  {popup==='settings'&&<SettingsModal accountProfile={profile} plan={backend.access?.plan_code||backend.access?.account_role} onSignOut={async scope=>{await backend.signOut(scope);navigateAuth('login')}} onHelp={kind=>{if(kind==='feedback')setPopup('comment');else{select(kind==='release'?4:5);window.scrollTo({top:0,behavior:'instant'})}}} onManageProfile={openAccount} onProfileChange={setProfile} theme={theme} setTheme={setTheme} onUpgrade={()=>setPopup('plans')} onClose={()=>setPopup(null)} mobile={isMobile}/>}
  <main className="main" inert={isMobile&&mobileOpen?true:undefined}><header className="main-top"><Tooltip label="Abrir sidebar" shortcut={`${shortcutKey}B`} align="start"><button className="icon-button expand-button" aria-label={mobileOpen?"Fechar sidebar":"Abrir sidebar"} aria-expanded={mobileOpen} aria-keyshortcuts="Meta+B Control+B" onClick={()=>{setCollapsed(false);setMobileOpen(v=>!v)}}>{isMobile?<span className="mobile-menu-glyph" aria-hidden="true"><i/><i/><b/></span>:<Icon name="panel"/>}</button></Tooltip></header>

   {(active===0||active===1)&&<Supplier key={`${active}-${searchTarget?.productId||''}`} savedOnly={active===1} initialProductId={searchTarget?.productId}/>}
   {active===2&&backend.storesError?<p role="alert">{backend.storesError}<button onClick={backend.retry}>Tentar novamente</button></p>:active===2&&<Stores key={searchTarget?.storeId|| (searchTarget?.create?'create':'stores')} stores={stores} initialCreate={searchTarget?.create} initialEdit={searchTarget?.storeId}/>}
   {active===4&&<ReleaseNotes/>}
   {active===5&&<SharedLinks/>}
   {active===6&&<Promotion profileName={profile.name} initialTab={promotionTab}/>}
   {active===3&&<Videos key={searchTarget?.influencerId||'videos'} initialInfluencerId={searchTarget?.influencerId}/>}
  </main>
  {popup==='search'&&<GlobalSearch stores={stores} onClose={()=>setPopup(null)} onSettings={()=>setPopup('settings')} onNavigate={(page,target)=>{select(page);setSearchTarget(target);window.scrollTo({top:0,behavior:'instant'})}}/>}
 </div>
}
const storeDomain=new URLSearchParams(location.search).get('loja');
function PublicStore(){const {catalogReady,catalogError}=useBackend();const [store,setStore]=useState(null),[ready,setReady]=useState(false);useEffect(()=>{let active=true;supabase.rpc('get_prime_store',{p_domain:storeDomain}).then(({data,error})=>{if(active){setStore(error?null:data);setReady(true)}});return()=>{active=false}},[]);if(!ready||!catalogReady)return <LoadingScreen label="Carregando loja…"/>;return store&&!catalogError?<Storefront store={store}/>:<main className="store-not-found"><h1>Loja indisponível</h1><a href="/">Ir para o Prime</a></main>}
const root=import.meta.hot?.data.root||createRoot(document.getElementById('root'));
if(import.meta.hot)import.meta.hot.data.root=root;
root.render(<BackendProvider><><MobileViewport/><Alerts/><GlobalCookieNotice/>{storeDomain?<PublicStore/>:<App/>}</></BackendProvider>);
