import {notify} from './Alerts';
import React,{useState,useId,useRef,useEffect} from 'react';
import {motion,useReducedMotion} from 'motion/react';
import {HugeiconsIcon} from '@hugeicons/react';
import {Search01Icon} from '@hugeicons/core-free-icons';
import {X} from 'lucide-react';
import {useBackend} from './Backend';
import Modal,{ModalCloseButton} from './Modal';
import AffiliateLinkModal from './AffiliateLinkModal';
const categories=[['all','Todos os produtos'],['Eletrônicos','Eletrônicos'],['Casa e construção','Casa'],['Beleza','Beleza'],['Roupas femininas','Roupa feminina'],['Moda infantil','Moda infantil'],['Mãe e bebê','Mãe e bebê'],['Roupa masculina','Roupa masculina'],['Fitness','Fitness'],['Pets','Pets'],['Automotivo','Automotivo']];
const money=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
export default function Supplier({savedOnly=false,initialProductId}){
 const {products,saved,saveLink}=useBackend();
 const [saving,setSaving]=useState(false);
 const tabId=useId(),reduceMotion=useReducedMotion();
 const [manualLink,setManualLink]=useState(''),[copiedIds,setCopiedIds]=useState({});
 const copyTimers=useRef(new Map());
 useEffect(()=>()=>{copyTimers.current.forEach(clearTimeout)},[]);
 const [tab,setTab]=useState('all'),[query,setQuery]=useState(''),[selected,setSelected]=useState(null),[link,setLink]=useState('');
 useEffect(()=>{const product=products.find(p=>p.id===initialProductId);if(product&&!savedOnly){setSelected(product);setLink(saved[product.id]||'')}},[initialProductId]);
 const filtered=products.filter(p=>(!savedOnly||saved[p.id])&&(tab==='all'||p.category===tab)&&p.name.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes(query.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')));
 async function copySavedLink(product){try{await navigator.clipboard.writeText(saved[product.id]);setCopiedIds(v=>({...v,[product.id]:true}));clearTimeout(copyTimers.current.get(product.id));copyTimers.current.set(product.id,setTimeout(()=>{setCopiedIds(v=>{const next={...v};delete next[product.id];return next});copyTimers.current.delete(product.id)},2000))}catch{notify('Não foi possível copiar o link');setManualLink(saved[product.id])}}
 async function save(e){e.preventDefault();if(saving)return;setSaving(true);try{await saveLink(selected.id,link);setSelected(null)}catch(error){notify(error.message||'Não foi possível salvar seu link.')}finally{setSaving(false)}}
 return <section className="supplier-page">
  <h1>{savedOnly?'Meus produtos':'Fornecedor'}</h1>
  {<div className="supplier-tabs" role="tablist" aria-label="Categorias de produtos">{categories.map(([value,label])=><button key={value} role="tab" aria-selected={tab===value} className={tab===value?'selected':''} tabIndex={tab===value?0:-1} onKeyDown={e=>{const index=categories.findIndex(c=>c[0]===value);let next;if(e.key==='ArrowRight')next=(index+1)%categories.length;if(e.key==='ArrowLeft')next=(index-1+categories.length)%categories.length;if(e.key==='Home')next=0;if(e.key==='End')next=categories.length-1;if(next!==undefined){e.preventDefault();setTab(categories[next][0]);const el=e.currentTarget.parentElement.children[next];el.focus();el.scrollIntoView({block:'nearest',inline:'nearest'})}}} onClick={()=>setTab(value)}>{tab===value&&<motion.span className="supplier-tab-highlight" layoutId={tabId} transition={{duration:reduceMotion?0:.22,ease:[.2,.8,.2,1]}}/>}<span className="supplier-tab-label">{label}</span></button>)}</div>}
  <div className="supplier-grid">{filtered.map(p=><article className="supplier-card" key={p.id}><img loading="lazy" src={p.image_url} alt={p.name}/><div className="supplier-card-info"><h2 title={p.name}>{p.name}</h2><p>{money.format(p.price_cents/100)}</p><button onClick={()=>{if(savedOnly){copySavedLink(p);return}setSelected(p);setLink(saved[p.id]||'')}}>{savedOnly?(copiedIds[p.id]?'Link copiado':'Copiar link'):(saved[p.id]?'Editar link':'Obter link')}</button></div></article>)}</div>
  {!filtered.length&&<p className="supplier-empty">{query?'Nenhum produto encontrado.':'Seus produtos salvos aparecerão aqui.'}</p>}
  <div className="supplier-search-dock"><div className="supplier-search"><HugeiconsIcon icon={Search01Icon} size={20}/><input aria-label="Pesquisar produtos" placeholder="Pesquisar produtos" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button aria-label="Limpar pesquisa" onClick={()=>setQuery('')}><X size={17}/></button>}</div></div>
  {manualLink&&<Modal label="Copiar link" className="supplier-modal" onClose={()=>setManualLink('')}><ModalCloseButton className="supplier-modal-close" onClick={()=>setManualLink('')}/><h2>Copiar link</h2><p>Copie seu link de afiliado abaixo.</p><input autoFocus readOnly aria-label="Link de afiliado para copiar" value={manualLink} onFocus={e=>e.target.select()}/></Modal>}
  {selected&&<AffiliateLinkModal key={selected.id} product={selected} value={link} onChange={setLink} onSubmit={save} onClose={()=>setSelected(null)} editing={!!saved[selected.id]} saving={saving}/>}

 </section>
}
