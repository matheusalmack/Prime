import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProfile,validatedAffiliateUrl,mapSavedProducts} from '../src/backend-contract.mjs';
test('preserves legacy profile identity and actual creation date',()=>{const user={id:'user-a',email:'a@example.com',created_at:'2020-01-01',user_metadata:{first_name:'Old',last_name:'Metadata'}};assert.deepEqual(normalizeProfile(user,{first_name:'Maria',last_name:'Silva',created_at:'2021-04-02'}),{id:'user-a',name:'Maria Silva',email:'a@example.com',avatar:null,createdAt:'2021-04-02'});});
test('does not substitute owner photo for users without a photo',()=>{assert.equal(normalizeProfile({id:'b',email:'b@example.com',user_metadata:{}}).avatar,null)});
test('preserves existing product IDs and affiliate links without reseeding',()=>{const rows=[{product_id:'legacy-item',affiliate_url:'https://s.shopee.com.br/abc'}];assert.deepEqual(mapSavedProducts(rows),{'legacy-item':'https://s.shopee.com.br/abc'});assert.deepEqual(mapSavedProducts([]),{})});
test('rejects unsafe URLs before sending saved-product writes',()=>{for(const value of ['http://example.com','javascript:alert(1)','data:text/html,test','not-url'])assert.throws(()=>validatedAffiliateUrl(value));assert.equal(validatedAffiliateUrl('https://s.shopee.com.br/abc'),'https://s.shopee.com.br/abc')});
