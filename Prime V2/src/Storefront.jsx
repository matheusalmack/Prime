import React,{useId,useState} from 'react';
import {Search,ArrowUpRight,Store,Pencil,Plus,Check} from 'lucide-react';
import {useBackend} from './Backend';
import {productOfferUrl,contrastingText,affiliateLinkReady} from './store-links.mjs';
export const storeTemplates=[
 {id:'essential',name:'Perfil central',radius:20},
 {id:'gallery',name:'Banner suave',radius:0},
 {id:'catalog',name:'Catálogo compacto',radius:4},
 {id:'rounded',name:'Cards arredondados',radius:24},
 {id:'boutique',name:'Minimalista',radius:0},
 {id:'bold',name:'Perfil lateral',radius:12}
];
export const bannerPresets=[
 {id:'blue',name:'Azul',background:'#168bff'},
 {id:'pink',name:'Rosa',background:'#f472b6'},
 {id:'green',name:'Verde',background:'#16a34a'},
 {id:'yellow',name:'Amarelo',background:'#facc15'},
 {id:'red',name:'Vermelho',background:'#ef4444'},
 {id:'orange',name:'Laranja',background:'#fb923c'},
 {id:'violet',name:'Violeta',background:'#8b5cf6'},
 {id:'mint',name:'Menta',background:'#a7f3d0'},
 {id:'rose',name:'Rosa claro',background:'#fce7f3'},
 {id:'teal',name:'Turquesa',background:'#14b8a6'},
 {id:'lemon',name:'Amarelo claro',background:'#fef08a'},
 {id:'wine',name:'Vinho',background:'#9f1239'},
 {id:'night',name:'Marinho',background:'#172554'},
 {id:'mono',name:'Preto',background:'#18181b'},
 {id:'ice',name:'Azul claro',background:'#dbeafe'},
 {id:'sand',name:'Cinza',background:'#e5e7eb'},
 {id:'sage',name:'Branco',background:'#f8fafc'}
];
const money=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
export const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
export function BannerArt({preset='blue'}){const art=bannerPresets.find(b=>b.id===preset)||bannerPresets[0];return <div className="sf2-art" style={{background:art.background}} aria-label={`Banner ${art.name}`}/>}
export function TemplateThumbnail({template,productIds=[]}){
 const {products}=useBackend();
 const items=productIds.map(id=>products.find(p=>p.id===id)).filter(Boolean);
 const samples=[...items,...products.filter(p=>!productIds.includes(p.id))].slice(0,4);
 return <div className={`sb-mini sb-mini-${template}`}><div className="sb-mini-banner"/><div className="sb-mini-identity"><span><Store size={12}/></span><strong>Sua vitrine</strong><i/></div><div className="sb-mini-search"><Search size={7}/> Buscar produtos</div><div className="sb-mini-products">{samples.map(p=><div key={p.id}><img src={p.image_url} alt=""/><i/><b/></div>)}</div></div>
}
export default function Storefront({store,mini=false,onEdit}){
 const {products}=useBackend();
 const [query,setQuery]=useState(''),[selecting,setSelecting]=useState(false),[selection,setSelection]=useState([]);
 const collectionId=useId(),template=storeTemplates.find(t=>t.id===store.template)||storeTemplates[0];
 const selected=(store.productIds||[]).map(id=>products.find(p=>p.id===id)).filter(Boolean);
 const visible=selected.filter(p=>normalize(p.name).includes(normalize(query))).slice(0,mini?6:500);
 const name=store.name||'Sua vitrine',accent=store.accent||store.primary||'#171717',background=store.background||'#ffffff',text=store.text||'#222222';
 const Brand=()=> <div className="sf2-brand sf2-brand-large"><div className="sf2-logo-identity">{store.logo?<img src={store.logo} alt={`Logo de ${name}`}/>:<span><Store size={32}/></span>}{onEdit&&<button className="sf2-identity-pencil" aria-label="Editar identidade da loja" onClick={()=>onEdit('identity')}><Pencil size={15}/></button>}</div><div className="sf2-brand-name"><p>{name}</p></div></div>;
 const Media=()=>store.banner?<img src={store.banner} alt="Banner da vitrine"/>:<BannerArt preset={store.bannerPreset||'blue'}/>;
 const style={'--v-accent':accent,'--v-action-text':store.buttonText||contrastingText(accent),'--v-editor-control':contrastingText(background),'--v-editor-control-text':contrastingText(contrastingText(background)),'--v-bg':background,'--v-text':text,'--v-radius':`${template.radius}px`,'--v-overlay':`${(store.overlay??0)/100}`,'--v-background-image':store.backgroundImage?`url("${store.backgroundImage}")`:'none'};
 return <div className={`sf2 sf2-${template.id} ${mini?'sf2-mini':''} ${onEdit?'sf2-editable':''}`} style={style}>
 <div className="sf2-vitrine-layout"><div className="sf2-presentation"><div className="sf2-profile-cover"><div className="sf2-banner-media"><Media/></div>{onEdit&&<button className="sf2-banner-hit" aria-label="Trocar banner" onClick={e=>onEdit('banner',null,{x:e.clientX,y:e.clientY})}/>}</div><section className="sf2-profile"><Brand/><div className="sf2-intro">{store.title&&<h1>{store.title}</h1>}<p>{store.description||'Produtos escolhidos para você'}</p></div><label className="sf2-search"><Search size={17}/><input aria-label="Pesquisar na vitrine" placeholder="Buscar produtos" value={query} onChange={e=>setQuery(e.target.value)}/></label></section></div>
 <div className="sf2-catalog-content">
 <section id={collectionId} className="sf2-collection"><div className="sf2-collection-title"><h2>Produtos</h2>{onEdit?<div className="sf2-edit-product-tools">{selecting&&<button disabled={!selection.length} onClick={()=>{onEdit('removeProducts',selection);setSelection([]);setSelecting(false)}}>Excluir ({selection.length})</button>}<button onClick={()=>{setSelecting(v=>!v);setSelection([])}}>{selecting?'Cancelar seleção':'Selecionar'}</button><button className="sf2-add-icon" aria-label="Adicionar produtos" onClick={()=>onEdit('addProducts')}><Plus size={20}/></button></div>:<span>{visible.length} {visible.length===1?'produto':'produtos'}</span>}</div>{query&&<p className="sf2-query">Resultados para “{query}”</p>}<div className="sf2-grid">{visible.map(p=><article className={`sf2-product ${store.cardTheme==='dark'?'sf2-card-dark':''} ${selection.includes(p.id)?'sf2-product-selected':''}`} key={p.id}><div className="sf2-product-image">{onEdit&&selecting&&<button className="sf2-select-product" aria-label={`Selecionar ${p.name}`} aria-pressed={selection.includes(p.id)} onClick={()=>setSelection(v=>v.includes(p.id)?v.filter(id=>id!==p.id):[...v,p.id])}><span>{selection.includes(p.id)&&<Check size={15}/>}</span></button>}<img loading="lazy" src={p.image_url} alt={mini?'':p.name}/></div><div className="sf2-product-info"><h3>{p.name}</h3><p>{money.format(p.price_cents/100)}</p>{onEdit?<div className="sf2-editor-product-actions"><button className="sf2-product-action" onClick={()=>onEdit('product',p)}>{affiliateLinkReady(store,p)?'Editar link':'Obter link'}</button><button className="sf2-delete-product" onClick={()=>onEdit('removeProduct',p)}>Excluir produto</button></div>:productOfferUrl(store,p)?<a className="sf2-product-action" href={productOfferUrl(store,p)} target="_blank" rel="noopener noreferrer" aria-label={`Ver oferta de ${p.name}`}>Ver oferta <ArrowUpRight size={15}/></a>:<span className="sf2-product-action" aria-disabled="true">Oferta indisponível</span>}</div></article>)}</div>{!visible.length&&<p className="sf2-empty">Nenhum produto encontrado</p>}</section></div></div>
 </div>
}
