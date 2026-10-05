const general=[
 'Achadinhos Shopee','Ofertas Shopee','Promoções Shopee','Cupons Shopee','Descontos Shopee',
 'Achadinhos do dia','Ofertas do dia','Promoções do dia','Achadinhos baratos','Comprinhas Shopee',
 'Achadinhos e ofertas','Promoções e descontos','Cupons e ofertas','Garimpos Shopee','Shopee frete grátis',
 'Achadinhos para casa','Ofertas imperdíveis','Promoções relâmpago','Shopee preço baixo','Dicas de compras Shopee'
];
const niches=[
 ['Eletrônicos','eletrônicos'],['Casa','casa e decoração'],['Beleza','beleza'],['Roupa feminina','moda feminina'],
 ['Moda infantil','moda infantil'],['Mãe e bebê','mãe e bebê'],['Roupa masculina','moda masculina'],['Fitness','fitness'],
 ['Pets','pets'],['Automotivo','acessórios automotivos'],['Eletrônicos','celulares'],['Eletrônicos','informática'],
 ['Eletrônicos','games'],['Eletrônicos','fones de ouvido'],['Casa','cozinha'],['Casa','organização da casa'],
 ['Casa','cama mesa e banho'],['Casa','jardim'],['Beleza','maquiagem'],['Beleza','skincare'],
 ['Beleza','cuidados com cabelo'],['Roupa feminina','bolsas femininas'],['Roupa feminina','calçados femininos'],
 ['Roupa feminina','bijuterias'],['Roupa masculina','calçados masculinos'],['Moda infantil','brinquedos'],
 ['Mãe e bebê','enxoval de bebê'],['Fitness','academia'],['Pets','cachorros e gatos'],['Papelaria','papelaria']
];
const prefixes=['Achadinhos','Ofertas','Promoções','Descontos','Cupons','Achadinhos Shopee','Ofertas Shopee','Promoções Shopee','Comprinhas Shopee','Garimpos Shopee'];
const terms=[...general.map(name=>({name,niche:'Geral'})),...niches.flatMap(([niche,term])=>prefixes.map(prefix=>({name:`${prefix} ${term}`,niche})))];
export const promotionKeywords=[...new Map(terms.map(item=>[item.name,item])).values()].map(item=>({...item,id:item.name,url:`https://www.facebook.com/search/groups/?q=${encodeURIComponent(item.name)}`}));
