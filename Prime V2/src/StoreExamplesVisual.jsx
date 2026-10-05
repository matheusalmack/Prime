import React from 'react';
import products from './products.json';
import './store-examples-visual.css';
const stores=[
 ['Casa Aurora','Detalhes que fazem a casa.',1,'#54725c','#e8ede4'],
 ['Forma Studio','Vista o seu momento.',3,'#272421','#e9e3dd'],
 ['Nuvem Kids','Pequenos grandes momentos.',2,'#927057','#f1e7db'],
 ['Essência','Sua rotina merece cuidado.',8,'#82465c','#f1e2e8'],
 ['Conecta','Tecnologia no seu dia a dia.',0,'#293e70','#dce5f3'],
 ['Movimento','Encontre seu ritmo.',4,'#3f584c','#e4e9dd'],
 ['Entre Linhas','Escolhas para o seu estilo.',5,'#7b4b3a','#eee0d9'],
 ['Companhia','Mais carinho, todos os dias.',7,'#8d663a','#efe6d5'],
];
// Fictional storefront examples, arranged as a collage rather than interactive shops.
const positions=[[-8,-5,29],[35,-8,30],[78,-2,31],[7,22,29],[53,17,19],[88,25,30],[-13,47,30],[37,43,30],[77,50,28],[4,73,26],[48,76,29],[91,80,27],[24,4,14],[63,2,14],[30,28,13],[73,32,14],[15,51,14],[65,66,14],[28,86,15],[59,92,14],[0,7,16],[80,70,12],[1,93,23]];
export default function StoreExamplesVisual(){
 return <div className="store-examples-visual" aria-label="Colagem de exemplos fictícios de lojas online">
  <div className="store-examples-scene" aria-hidden="true">{positions.map(([x,y,width],index)=>{const [name,title,start,color,background]=stores[index%stores.length];const items=[0,1,2].map(offset=>products[(start+offset)%products.length]);return <div key={index} className={`store-example-site ${width<20?'is-distant':''}`} style={{left:`${x}%`,top:`${y}%`,width:`${width*.85}%`,'--shop-color':color,'--shop-background':background}}>
   <div className="store-example-browser"><i/><i/><i/><span/></div>
   <header><strong>{name}</strong><span>Novidades　 Coleções　 Sobre</span><span>⌕　♡</span></header>
   <div className="store-example-hero"><div><small>ESCOLHAS PARA VOCÊ</small><h3>{title}</h3><span>Conheça a coleção →</span></div><img src={items[0].image_url} alt="" loading="lazy"/></div>
   <div className="store-example-products"><h4>Os favoritos da semana</h4><div>{items.map(item=><div key={item.id}><img src={item.image_url} alt="" loading="lazy"/><span>{item.category}</span><b>{(item.price_cents/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</b></div>)}</div></div>
  </div>})}</div>

 </div>;
}
