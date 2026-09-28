import test from 'node:test';
import assert from 'node:assert/strict';
import content from '../src/data/productCampaigns.json' with { type: 'json' };
import { getProductCampaign, buildProductCaption, buildVideoPrompt, getFacebookGroupTerms } from '../src/utils/campaigns.js';
const products = (await Promise.all([1, 2, 3, 4, 5].map(async n => (await import(`../src/shopeeProductsPart${n}.js`)).default))).flat();

test('every catalog product has unique authored copy and a 20-word Portuguese speech', () => {
  assert.equal(products.length, 500);
  assert.equal(Object.keys(content).length, products.length);
  assert.equal(new Set(products.map(p => getProductCampaign(p).caption)).size, products.length);
  assert.equal(new Set(products.map(p => getProductCampaign(p).speech)).size, products.length);
  for (const product of products) {
    const entry = getProductCampaign(product);
    assert.equal(entry.productName, product.name);
    assert.equal(entry.speech.trim().split(/\s+/u).length, 20, product.id);
    assert(entry.hashtags.length >= 2);
    assert(entry.hashtags.every(tag => /^#[A-Za-z0-9]+$/.test(tag)));
    assert(!entry.caption.includes('http'));
  }
});

test('caption uses only the current user link for the selected product', () => {
  const [first, second] = products;
  const links = { [first.id]: 'https://shope.ee/first-user-product', [second.id]: 'https://shope.ee/other-product' };
  const caption = buildProductCaption(first, links);
  assert(caption.includes(links[first.id]));
  assert(!caption.includes(links[second.id]));
  assert(!caption.includes(first.url));
  assert(caption.includes(getProductCampaign(first).caption));
  assert(caption.includes('#AchadinhosShopee'));
  assert(!buildProductCaption(first, { [first.id]: 'https://shope.ee/second-user' }).includes(links[first.id]));
  assert.equal(buildProductCaption(first, { [second.id]: links[second.id] }), '');
  assert.equal(buildProductCaption(first, { [first.id]: '  ' }), '');
});

test('the UGC prompt is fixed and only the product speech changes', () => {
  const templates = new Set(products.map(p => buildVideoPrompt(p).replace(getProductCampaign(p).speech, '{speech}')));
  assert.equal(templates.size, 1);
  assert(buildVideoPrompt(products[0]).includes('português do Brasil'));
  assert(buildVideoPrompt(products[0]).includes('segurando'));
  assert(buildVideoPrompt(products[0]).includes('UGC realista'));
});

test('unknown products do not receive a generic caption or another item speech', () => {
  assert.equal(getProductCampaign({ id: 'new-product' }), null);
  assert.equal(buildProductCaption({ id: 'new-product' }, { 'new-product': 'https://shope.ee/link' }), '');
  assert.equal(buildVideoPrompt(null), '');
  assert.equal(getProductCampaign({ id: 'database-id', itemId: products[0].itemId }), content[products[0].id]);
});

test('first two group searches are always Shopee and remain unique', () => {
  for (const category of new Set(products.map(p => p.category))) {
    const groups = getFacebookGroupTerms([category, 'Achadinhos Shopee', 'Ofertas Shopee']);
    assert.deepEqual(groups.slice(0, 2), ['Achadinhos Shopee', 'Ofertas Shopee']);
    assert.equal(groups.length, new Set(groups).size);
  }
  assert.deepEqual(getFacebookGroupTerms(), ['Achadinhos Shopee', 'Ofertas Shopee']);
});
