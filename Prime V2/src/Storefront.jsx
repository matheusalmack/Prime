import React,{useId,useState} from 'react';
import {Search,ArrowUpRight,Store,ArrowLeft} from 'lucide-react';
import {useBackend} from './Backend';
import {storeUrl} from './store-data';
export const storeTemplates=[
 {id:'essential',name:'Perfil central',radius:20},
 {id:'gallery',name:'Banner suave',radius:0},
 {id:'catalog',name:'Catálogo compacto',radius:4},
 {id:'rounded',name:'Por categorias',radius:24},
 {id:'boutique',name:'Minimalista',radius:0},
 {id:'bold',name:'Perfil lateral',radius:12}
];
export const bannerPresets=[
 {id:'blue',name:'Azul',background:'var(--blue, #168bff)'},
 {id:'night',name:'Marinho',background:'#172554'},
 {id:'mono',name:'Preto',background:'#18181b'},
 {id:'ice',name:'Azul claro',background:'#dbeafe'},
 {id:'sand',name:'Cinza',background:'#e5e7eb'},
 {id:'sage',name:'Branco',background:'#f8fafc'}
];
export const productColorFields=[['background','Fundo da página','#ffffff'],['text','Textos gerais','#222222'],['muted','Textos secundários','#777777'],['accent','Destaque','#171717'],['imagePanel','Painel de imagem','#f0eee9'],['imageBackground','Fundo interno da imagem','#ffffff'],['infoCard','Card de informações','#ffffff'],['priceCard','Card de preço','#f1f3ef'],['priceText','Texto do preço','#222222'],['offerButton','Botão ver oferta','#171717'],['offerText','Texto do botão','#ffffff'],['tabs','Abas e opções','#efefeb'],['tabText','Textos das abas','#777777'],['selectedTab','Aba selecionada','#171717'],['selectedTabText','Texto da aba selecionada','#ffffff'],['backButton','Botão voltar','#f0eee9'],['backText','Texto do botão voltar','#222222']];
export const defaultProductColors=Object.fromEntries(productColorFields.map(([key,,value])=>[key,value]));
export function resolveProductColors(store){
 const background=store.background||'#ffffff',text=store.text||'#222222',accent=store.accent||'#171717';
 const inherited={...defaultProductColors,background,text,muted:`color-mix(in srgb,${text} 60%,${background})`,accent,imagePanel:background,imageBackground:'#ffffff',infoCard:background,priceCard:background,priceText:text,offerButton:accent,offerText:'#ffffff',backButton:background,backText:text};
 return store.productColorMode==='custom'?{...inherited,...store.productColors}:inherited;
}
const money=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
export const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
export function BannerArt({preset='blue'}){const art=bannerPresets.find(b=>b.id===preset)||bannerPresets[0];return <div className="sf2-art" style={{background:art.background}} aria-label={`Banner ${art.name}`}/>}
export function TemplateThumbnail({template,productIds=[]}){
 const {products}=useBackend();
 const items=productIds.map(id=>products.find(p=>p.id===id)).filter(Boolean);
 const samples=[...items,...products.filter(p=>!productIds.includes(p.id))].slice(0,4);
 return <div className={`sb-mini sb-mini-${template}`}><div className="sb-mini-banner"/><div className="sb-mini-identity"><span><Store size={12}/></span><strong>Sua vitrine</strong><i/></div><div className="sb-mini-search"><Search size={7}/> Buscar produtos</div><div className="sb-mini-categories"><i/><i/><i/></div><div className="sb-mini-products">{samples.map(p=><div key={p.id}><img src={p.image_url} alt=""/><i/><b/></div>)}</div></div>
}
export default function Storefront({store,mini=false,previewPage='store'}){
 const {products,saved}=useBackend();
 const [query,setQuery]=useState(''),[category,setCategory]=useState('all'),[detail,setDetail]=useState(null),[tab,setTab]=useState('Sobre o produto');
 const collectionId=useId(),template=storeTemplates.find(t=>t.id===store.template)||storeTemplates[0];
 const selected=(store.productIds||[]).map(id=>products.find(p=>p.id===id)).filter(Boolean),categories=store.categories||[...new Set(selected.map(p=>p.category))];
 let visible=selected.filter(p=>normalize(p.name).includes(normalize(query))&&(category==='all'||p.category===category));
 visible=visible.slice(0,mini?6:500);
 const name=store.name||'Sua vitrine',accent=store.accent||store.primary||'#171717',background=store.background||'#ffffff',text=store.text||'#222222',colors=resolveProductColors(store);
 const links=store.affiliateLinks||saved;
 const Brand=({large=false})=><div className={`sf2-brand ${large?'sf2-brand-large':''}`}>{store.logo?<img src={store.logo} alt={`Logo de ${name}`}/>:<span><Store size={large?32:23}/></span>}<p>{name}</p></div>;
 const Media=()=>store.banner?<img src={store.banner} alt="Banner da vitrine"/>:<BannerArt preset={store.bannerPreset||'blue'}/>;
 const Title=()=><div className="sf2-intro">{store.title&&<h1>{store.title}</h1>}<p>{store.description||'Produtos escolhidos para você'}</p></div>;
 const searchField=<label className="sf2-search"><Search size={17}/><input aria-label="Pesquisar na vitrine" placeholder="Buscar produtos" value={query} onChange={e=>setQuery(e.target.value)}/></label>;
 const Categories=({large=false})=>categories.length>0&&<nav className={`sf2-categories ${large?'sf2-categories-large':''} ${store.categoryTheme==='dark'?'sf2-categories-dark':''}`} aria-label="Categorias da vitrine">{[['all','Tudo'],...categories.map(c=>[c,c])].map(([key,label])=><button key={key} aria-pressed={category===key} onClick={()=>{setCategory(key);setDetail(null)}}>{large&&key!=='all'&&<img loading="lazy" src={selected.find(p=>p.category===key)?.image_url} alt=""/>}<span>{label}</span>{large&&<ArrowUpRight size={15}/>}</button>)}</nav>;
 const Card=({p,featured=false})=><button className={`sf2-product ${featured?'sf2-featured':''} ${store.cardTheme==='dark'?'sf2-card-dark':''}`} onClick={()=>{setDetail(p);setTab('Sobre o produto')}} aria-label={`Ver ${p.name}`}><div className="sf2-product-image"><img loading="lazy" src={p.image_url} alt={mini?'':p.name}/></div><div className="sf2-product-info"><span className="sf2-kicker">{featured?'Escolha em destaque':p.category}</span><h3>{p.name}</h3><p>{money.format(p.price_cents/100)}</p><span className="sf2-product-action">Ver oferta <ArrowUpRight size={15}/></span></div></button>;
 const item=previewPage==='product'?selected[0]:detail;
 const style={'--v-accent':accent,'--v-bg':background,'--v-text':text,'--v-radius':`${template.radius}px`,'--v-overlay':`${(store.overlay??0)/100}`,'--v-background-image':store.backgroundImage?`url("${store.backgroundImage}")`:'none',...Object.fromEntries(Object.entries(colors).map(([key,value])=>[`--pd-${key}`,value]))};
 return <div className={`sf2 sf2-${template.id} ${mini?'sf2-mini':''}`} style={style}>
 {item?<div className="sf2-detail"><header><Brand/><button className="sf2-back" onClick={()=>setDetail(null)} disabled={previewPage==='product'}><ArrowLeft size={16}/> Voltar à vitrine</button></header><div className="sf2-detail-grid"><div className="sf2-detail-image"><img src={item.image_url} alt={item.name}/></div><div className="sf2-detail-info"><span className="sf2-kicker">{item.category}</span><h1>{item.name}</h1><div className="sf2-detail-price"><small>Preço da oferta</small><p>{money.format(item.price_cents/100)}</p></div><a className="sf2-offer" href={storeUrl(links[item.id])||storeUrl(item.source_url)||'#'} target="_blank" rel="noreferrer">Ver oferta <ArrowUpRight size={18}/></a><p className="sf2-detail-note">Confira as condições e a disponibilidade na página da oferta</p></div></div></div>:<>
 <div className="sf2-vitrine-layout"><div className="sf2-presentation"><div className="sf2-profile-cover"><Media/></div><section className="sf2-profile"><Brand large/><Title/>{searchField}</section></div><div className="sf2-catalog-content"><Categories large={template.id==='rounded'}/>
 <section id={collectionId} className="sf2-collection"><div className="sf2-collection-title"><h2>{category==='all'?'Produtos':category}</h2><span>{visible.length} {visible.length===1?'produto':'produtos'}</span></div>{query&&<p className="sf2-query">Resultados para “{query}”</p>}<div className="sf2-grid">{visible.map(p=><Card p={p} key={p.id}/>)}</div>{!visible.length&&<p className="sf2-empty">Nenhum produto encontrado</p>}</section></div></div>
 </>}
 </div>
}
