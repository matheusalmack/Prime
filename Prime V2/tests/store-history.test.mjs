import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initialStoreHistory,storeHistoryReducer as reduce,sameStoreDraft} from '../src/store-history.mjs';
const original={id:'shop',name:'Original',background:'#ffffff',accent:'#171717',productIds:['one'],affiliateLinks:{},status:'published',domain:'shop'};
test('changes stay in the draft until an explicit publish checkpoint',()=>{
 const state=reduce(initialStoreHistory(original),{type:'change',value:d=>({...d,name:'Edited'})});
 assert.equal(state.published.name,'Original');assert.equal(original.name,'Original');assert.equal(state.present.name,'Edited');
});
test('undo and redo restore mixed changes, including products and affiliate links',()=>{
 let state=initialStoreHistory(original);
 state=reduce(state,{type:'change',value:d=>({...d,productIds:['one','two'],affiliateLinks:{two:'https://s.shopee.com.br/owner'}})});
 state=reduce(state,{type:'change',value:d=>({...d,background:'#000000'})});
 state=reduce(state,{type:'undo'});assert.equal(state.present.background,'#ffffff');assert.deepEqual(state.present.productIds,['one','two']);
 state=reduce(state,{type:'undo'});assert.deepEqual(state.present.productIds,['one']);assert.deepEqual(state.present.affiliateLinks,{});
 state=reduce(state,{type:'redo'});assert.equal(state.present.affiliateLinks.two,'https://s.shopee.com.br/owner');
 state=reduce(state,{type:'redo'});assert.equal(state.present.background,'#000000');
});
test('new edits discard the redo branch and empty undo does nothing',()=>{
 let state=initialStoreHistory(original);assert.equal(reduce(state,{type:'undo'}),state);
 state=reduce(state,{type:'change',value:d=>({...d,name:'A'})});state=reduce(state,{type:'undo'});
 state=reduce(state,{type:'change',value:d=>({...d,name:'B'})});assert.equal(state.future.length,0);
});
test('a slider gesture is one undo operation',()=>{
 let state=initialStoreHistory({...original,overlay:0});
 for(const overlay of [10,20,30])state=reduce(state,{type:'change',group:'overlay',value:d=>({...d,overlay})});
 assert.equal(state.past.length,1);state=reduce(state,{type:'undo'});assert.equal(state.present.overlay,0);
});
test('publication preserves newer unsaved edits and undo keeps backend identity',()=>{
 let state=reduce(initialStoreHistory(original),{type:'change',value:d=>({...d,name:'Submitted'})});const submitted=state.present;
 state=reduce(state,{type:'change',value:d=>({...d,name:'Newer unsaved'})});
 state=reduce(state,{type:'publish',submitted,value:{...submitted,id:'canonical',updatedAt:'now'}});
 assert.equal(state.present.name,'Newer unsaved');assert.equal(state.published.name,'Submitted');
 state=reduce(state,{type:'undo'});assert.equal(state.present.name,'Submitted');assert.equal(state.present.id,'canonical');
 assert.equal(sameStoreDraft(state.present,state.published),true);
});
