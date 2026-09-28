import productCampaigns from '../data/productCampaigns.json' with { type: 'json' };

// Copy is authored per catalog item, never selected from random variants.
export function getProductCampaign(product) {
  if (!product) return null;
  return productCampaigns[product.id] ?? productCampaigns[`shopee-${product.itemId}`] ?? null;
}

export function buildProductCaption(product, affiliateLinks) {
  const campaign = getProductCampaign(product);
  const link = affiliateLinks[product?.id]?.trim();
  if (!campaign || !link) return '';
  return `${campaign.caption}\n\nVeja os detalhes e as opções do produto na Shopee:\n${link}\n\n${campaign.hashtags.join(' ')}`;
}

export function buildVideoPrompt(product) {
  const campaign = getProductCampaign(product);
  if (!campaign) return '';
  return `Crie um vídeo vertical 9:16 em estilo UGC realista, com duração de 10 a 15 segundos. Use as duas imagens anexadas como referência: uma do influenciador de IA e outra do produto. Preserve o rosto, a aparência e a roupa do influenciador, assim como o formato, a cor, a embalagem e os detalhes do produto. Coloque o influenciador segurando e apresentando o produto de forma natural; se o tamanho ou a função não permitir segurá-lo, posicione o produto ao lado e mostre uma interação coerente. Use um ambiente cotidiano, luz natural, enquadramento de celular e gestos discretos. A pessoa deve olhar para a câmera e falar em português do Brasil, com voz natural, áudio limpo e sincronização labial. Não acrescente promessas, depoimentos de uso, legendas na tela, preços ou outras falas. Reproduza exatamente esta fala de 20 palavras:\n\n“${campaign.speech}”`;
}

export const SHOPEE_GROUP_TERMS = ['Achadinhos Shopee', 'Ofertas Shopee'];
export function getFacebookGroupTerms(nicheTerms = []) {
  return [...SHOPEE_GROUP_TERMS, ...nicheTerms.filter((term) => !SHOPEE_GROUP_TERMS.includes(term))].slice(0, 10);
}
