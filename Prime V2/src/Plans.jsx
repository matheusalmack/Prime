import React from 'react';
import {Package,TrendingUp,ShieldCheck,Video,Captions,Link,Users,Infinity,CalendarDays} from 'lucide-react';
import Modal,{ModalCloseButton} from './Modal';
import './plans.css';
import PrimeLogo from './PrimeLogo';

const benefits=[
 [Package,'Catálogo de produtos Prime','Encontre produtos para a sua próxima divulgação'],
 [TrendingUp,'Produtos virais e campeões de vendas'],
 [ShieldCheck,'Produtos de confiança','Com estoque e entrega'],
 [Video,'IA para criar seus vídeos'],
 [Captions,'IA para gerar legendas prontas'],
 [Link,'Afiliação semiautomática pela Shopee'],
 [Users,'Catálogo de grupos para divulgação'],
];
export const primePlans=[
 {id:'super',checkoutUrl:'https://checkout.applyfy.com.br/checkout/cmucrkrsx01ut01oo0065w954?offer=L83RFTI',name:'SuperPrime Heavy',description:'Seu próximo passo, com acesso vitalício',price:32,term:'ou R$ 299 à vista',popular:true,action:'Escolher SuperPrime Heavy',last:[Infinity,'Acesso vitalício','Pagamento único, sem mensalidade']},
 {id:'monthly',checkoutUrl:'https://checkout.applyfy.com.br/checkout/cmucrf9v601z301q16mul4qag?offer=2E2RG39',name:'SuperPrime',description:'Tudo para começar, mês a mês',price:169,term:'Plano mensal',action:'Escolher SuperPrime',last:[CalendarDays,'Cancele quando quiser']},
];
export function PlanCards(){return (<div className="plans-grid">{primePlans.map(plan=><article className={`plans-card ${plan.popular?'plans-card-popular':''}`} key={plan.id} aria-labelledby={`plan-${plan.id}`}>
    <div className="plans-card-title"><h2 id={`plan-${plan.id}`}>SuperPrime{plan.id==='super'&&<> <span className="plans-heavy">Heavy</span></>}</h2>{plan.popular&&<span className="plans-badge">Mais popular</span>}</div>
    <p className="plans-description">{plan.description}</p>
    <div className="plans-price">{plan.popular&&<small className="plans-installments">12x de</small>}<span>R$ {plan.price}</span>{!plan.popular&&<small>/mês</small>}</div>
    <p className="plans-term">{plan.term}</p>
    <a className="plans-action" href={plan.checkoutUrl} target="_blank" rel="noopener noreferrer">{plan.action}</a>
    <ul className="plans-benefits">{[...benefits,plan.last].map(([Icon,title,description])=><li key={title}><Icon size={16} strokeWidth={1.7} aria-hidden="true"/><div><span>{title}</span>{description&&<p>{description}</p>}</div></li>)}</ul>
   </article>)}</div>);}
export default function Plans({onClose}){
 return <Modal label="Planos Prime" className="plans-screen" onClose={onClose}>
  <ModalCloseButton className="plans-close" label="Fechar planos" onClick={onClose}/>
  <div className="plans-content">
   <header className="plans-heading"><div className="plans-brand"><PrimeLogo/><span>SuperPrime</span></div><h1>Desbloqueie todo o potencial do Prime</h1></header>
   <PlanCards/>

  </div>
 </Modal>
}
