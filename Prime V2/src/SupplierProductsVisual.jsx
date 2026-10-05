import React from 'react';
import products from './products.json';
import './supplier-products-visual.css';
const rows=[[0,1,2,8],[5,4,7,3],[6,9,10,11]];
export default function SupplierProductsVisual(){
 return <div className="supplier-products-visual" role="img" aria-label="Seleção de produtos do catálogo Prime, com eletrônicos, casa, moda, beleza e pets">
  <div className="supplier-products-rows" aria-hidden="true">{rows.map((row,index)=><div className="supplier-products-row" key={index}>{row.map(item=>products[item]).filter(Boolean).map(product=><img key={product.id} src={product.image_url} alt="" loading="lazy" width="240" height="240"/>)}</div>)}</div>
 </div>;
}
