import test from 'node:test';
import assert from 'node:assert/strict';
import {pagePaths,authPath,readRoute} from '../src/routes.mjs';
const route=path=>readRoute(new URL(path,'https://primeafiliado.com'));
test('root and FAQ are public; account preview links do not open the landing',()=>{assert.equal(route('/').landing,true);assert.equal(route('/faq').landing,true);assert.equal(route('/?conta=1').account,true);assert.equal(route('/?conta=1').landing,false);assert.equal(route('/?atualizacao=1').landing,false)});
test('direct links and refresh recover the correct app page',()=>{for(const [page,path] of Object.entries(pagePaths)){assert.equal(route(path).page,Number(page));assert.equal(route(path+'/').page,Number(page));assert.equal(route(path).landing,false)}assert.equal(route('/conta').account,true)});
test('login, registration and recovery support clean paths and legacy links',()=>{for(const mode of ['login','signup','recovery']){assert.equal(route(authPath(mode)).auth,mode);assert.equal(route('/?auth='+mode).auth,mode)}assert.equal(route('/login').auth,'login');assert.equal(route('/signup').auth,'signup')});
