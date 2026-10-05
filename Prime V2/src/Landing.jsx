import FaqContent from './FaqContent';
import PrimeLogoOutline from './PrimeLogoOutline';
import PrimeLogo from './PrimeLogo';
import React,{useState} from 'react';
import {ChevronDown,Menu,X} from 'lucide-react';
import {PlanCards} from './Plans';
import CookieNotice from './CookieNotice';
import FacebookGroupsVisual from './FacebookGroupsVisual';
import StoreExamplesVisual from './StoreExamplesVisual';
import StoryNetworksVisual from './StoryNetworksVisual';
import SupplierProductsVisual from './SupplierProductsVisual';
import UgcVideosVisual from './UgcVideosVisual';
import Modal,{ModalCloseButton} from './Modal';
import './landing.css';
const features=[
 {id:'fornecedor',label:'Fornecedor',title:'Mais de 500 produtos para divulgar',text:'Descubra novos achadinhos no catálogo de produtos. O fornecedor já vem incluído no Prime, sem custo extra.',link:'Explorar produtos',target:0,image:'fornecedor'},
 {id:'lojas',label:'Lojas',title:'Uma loja com a sua identidade',text:'Seus achadinhos em uma vitrine com a sua cara. Personalize sua loja e compartilhe tudo em um só link.',link:'Criar minha loja',target:2,image:'lojas'},
 {id:'videos',label:'Vídeos',title:'Dê vida aos seus produtos',text:'Transforme seus achadinhos em vídeos com IA. Escolha um apresentador, prepare o roteiro e crie sua divulgação.',link:'Criar um vídeo',target:3,image:'videos'},
 {id:'grupos',label:'Grupos do Facebook',title:'Encontre quem procura seus achadinhos',text:'Busque grupos no Facebook por nicho e leve suas ofertas a comunidades com interesses em comum.',link:'Encontrar grupos',target:6,image:'grupos'},
 {id:'templates',label:'Templates de stories',title:'Seu próximo story começa aqui',text:'Escolha um template e deixe a oferta com a sua cara. Publique no Instagram, Facebook ou Status do WhatsApp.',link:'Explorar templates',target:6,tab:'templates',image:'templates'},
];
const faq=[['O fornecedor está incluído?','Sim. O acesso ao catálogo vem com o Prime, sem custo adicional pelo fornecedor. Você escolhe os produtos e usa seus links de afiliado para divulgar.'],['Preciso ter estoque?','Não para atuar como afiliado. A compra e a entrega acontecem na plataforma do vendedor, conforme as condições de cada oferta.'],['Como recebo minha comissão?','O programa de afiliados em que você está cadastrado apura e paga as comissões de pedidos elegíveis. O Prime reúne as ferramentas para selecionar, organizar e divulgar os produtos.'],['Qual é a diferença entre os planos?','O SuperPrime Heavy oferece acesso vitalício, por R$ 299 à vista ou 12x de R$ 32. O SuperPrime é mensal, por R$ 169 por mês. Os recursos de cada plano estão apresentados acima.'],['Os grupos são links de comunidades específicas?','São palavras-chave que abrem a busca de grupos no Facebook. Você escolhe as comunidades e verifica as regras de participação e divulgação.'],['O Prime garante vendas?','Não. Os resultados dependem da oferta, do público e do seu trabalho de divulgação. O Prime ajuda a preparar e organizar esse trabalho.']];
export default function Landing({onAuth,onExplore,theme,setTheme,faqOnly=false}){
 const [menu,setMenu]=useState(false),[legal,setLegal]=useState(null),[cookies,setCookies]=useState(false);
 return <div className="landing-page">
  <header className="landing-header">
   <a className="landing-logo-space" href={faqOnly?'/#inicio':'#inicio'} aria-label="Prime, início"><PrimeLogo/></a>
   <nav className={menu?'open':''} aria-label="Navegação da página de vendas">
    { [['fornecedor','Produtos'],['recursos','Soluções'],['planos','Planos'],['faq','Dúvidas']].map(([id,label])=><a key={id} href={(faqOnly?'/':'')+'#'+id} onClick={()=>setMenu(false)}>{label}</a>) }
   </nav>
   <div className="landing-header-actions">
    <button className="landing-button landing-login" onClick={()=>onAuth('login')}>Entrar</button>
    <button className="landing-button primary landing-create" onClick={()=>onAuth('signup')}>Criar conta</button>
    <button className="landing-icon landing-menu" aria-label={menu?'Fechar menu':'Abrir menu'} aria-expanded={menu} onClick={()=>setMenu(!menu)}>{menu?<X size={18}/>:<Menu size={18}/>}</button>
   </div>

  </header>
  <main id="inicio">{faqOnly?<FaqContent/>:<>
   <section className="landing-hero"><h1>Do primeiro achadinho à divulgação,<br/>sua próxima venda começa no Prime</h1><p>Escolha entre mais de 500 produtos, crie sua loja e prepare vídeos e stories para divulgar. Tudo em um só lugar.</p><div><a className="landing-button primary" href="#planos">Conhecer os planos</a><a className="landing-button" href="#recursos">Explorar o Prime</a></div></section>
   <section className="landing-features" id="recursos" aria-label="Recursos do Prime">{features.map(f=><article className="landing-feature" key={f.id} id={f.id}>{f.id==='fornecedor'?<SupplierProductsVisual/>:f.id==='grupos'?<FacebookGroupsVisual/>:f.id==='lojas'?<StoreExamplesVisual/>:f.id==='templates'?<StoryNetworksVisual/>:f.id==='videos'?<UgcVideosVisual/>:<img src={'/images/landing/'+f.image+'.png'} alt={'Tela real de '+f.label+' no aplicativo Prime'} loading="lazy" width="760" height="760"/>}<div><h2>{f.title}</h2><p>{f.text}</p><button className="landing-feature-link" onClick={()=>onExplore(f.target,f.tab)}>{f.link}</button></div></article>)}</section>
   <section className="landing-section landing-pricing" id="planos"><header><h2>Seu investimento no Prime</h2><p>Escolha entre o acesso vitalício do SuperPrime Heavy e a assinatura mensal do SuperPrime.</p></header><div className="plans-content"><PlanCards/></div></section>
   <section className="landing-section landing-faq" id="faq"><header><h2>Perguntas frequentes</h2><p>O que você precisa saber antes de começar.</p></header><div>{faq.map(([q,a])=><details key={q}><summary>{q}<ChevronDown size={16}/></summary><p>{a}</p></details>)}</div></section>
   <section className="landing-closing" id="comecar" aria-label="Comece no Prime">
    <div className="landing-closing-copy"><h2>Seu próximo passo começa no Prime</h2><p>Produtos, loja e conteúdo para transformar seus achadinhos em oportunidades.</p><div className="landing-closing-actions"><a className="landing-button primary" href="#planos">Escolher meu plano</a><button className="landing-button" onClick={()=>onAuth('signup')}>Criar conta</button></div></div>
    <div className="landing-logo-outline"><PrimeLogoOutline/></div>
   </section>
  </>}</main>
  <CookieNotice showBanner={false} manageOpen={cookies} onManageClose={()=>setCookies(false)} onLegal={type=>setLegal(type==='privacy'?'Política de privacidade':'Termos de uso')}/>
  {legal&&<Modal label={legal} className="landing-legal" onClose={()=>setLegal(null)}><ModalCloseButton onClick={()=>setLegal(null)}/><h2>{legal}</h2><p>O documento oficial será disponibilizado aqui.</p></Modal>}
 </div>;
}
