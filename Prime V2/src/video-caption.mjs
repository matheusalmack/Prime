import campaigns from '../../src/data/productCampaigns.json' with {type:'json'};

export function buildVideoCaption(product,script='',affiliateLink=''){
 if(!product)return '';
 const campaign=campaigns[product.id]||campaigns[`shopee-${product.itemId}`];
 const copy=campaign?.caption||script.trim()||`Conheça ${product.name}. Confira os detalhes e as opções antes de escolher.`;
 const hashtags=campaign?.hashtags?.length?campaign.hashtags:['#AchadinhosShopee','#Achadinhos','#ComprasOnline'];
 const link=/^https:\/\//i.test(affiliateLink.trim())?affiliateLink.trim():'';
 return `✨ ${copy}\n\n🛍️ ${link?'Confira o produto na Shopee 👇\n'+link:'Confira os detalhes do produto na Shopee!'}\n\n${hashtags.join(' ')}`;
}
