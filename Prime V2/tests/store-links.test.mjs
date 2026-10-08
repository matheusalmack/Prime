import {test} from 'node:test';
import assert from 'node:assert/strict';
import {safeStoreUrl,productOfferUrl,affiliateLinkReady,missingAffiliateProducts,cleanStoreLinks,contrastingText} from '../src/store-links.mjs';
const product={id:'one',source_url:'https://shopee.com.br/product/123/456'};
test('new stores open the original product, never a visitor saved link',()=>{
 assert.equal(productOfferUrl({},product),product.source_url);
 assert.equal(productOfferUrl({saved:{one:'https://s.shopee.com.br/visitor'}},product),product.source_url);
 assert.equal(productOfferUrl({affiliateLinks:{one:'https://s.shopee.com.br/owner'}},product),'https://s.shopee.com.br/owner');
});
test('distinguishes original links from configured affiliate links without changing defaults',()=>{
 const second={id:'two',source_url:'https://shopee.com.br/product/123/789'};
 const store={productIds:['one','two'],affiliateLinks:{one:product.source_url}};
 assert.deepEqual(missingAffiliateProducts(store,[product,second]),['one','two']);
 store.affiliateLinks.one='https://s.shopee.com.br/first';
 assert.deepEqual(missingAffiliateProducts(store,[product,second]),['two']);
 store.affiliateLinks.two='https://s.shopee.com.br/second';
 assert.deepEqual(missingAffiliateProducts(store,[product,second]),[]);
 assert.deepEqual(missingAffiliateProducts({...store,productIds:['unknown']},[product]),['unknown']);
});
test('unsafe and credential-bearing links cannot be configured or opened',()=>{
 for(const value of ['javascript:alert(1)','data:text/html,hi','not-url','https://user:password@example.com']){
  assert.equal(safeStoreUrl(value),null);
  assert.equal(affiliateLinkReady({affiliateLinks:{one:value}},product),false);
  assert.equal(productOfferUrl({affiliateLinks:{one:value}},product),product.source_url);
 }
});
test('store writes preserve explicit links and discard removed products',()=>{
 assert.deepEqual(cleanStoreLinks({one:' https://s.shopee.com.br/owner ',two:'https://s.shopee.com.br/removed'},['one']),{one:'https://s.shopee.com.br/owner'});
 assert.deepEqual(cleanStoreLinks({},['one']),{});
});
test('button labels remain readable on light and dark accent colors',()=>{
 assert.equal(contrastingText('#facc15'),'#171717');
 assert.equal(contrastingText('#ffffff'),'#171717');
 assert.equal(contrastingText('#171717'),'#ffffff');
});
