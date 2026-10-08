const limit=50;
const fields=['name','description','title','logo','banner','bannerPreset','backgroundImage','background','text','accent','buttonText','overlay','cardTheme','categoryTheme','template','productIds','categories','affiliateLinks'];
export function sameStoreDraft(a,b){return JSON.stringify(fields.map(key=>a?.[key]))===JSON.stringify(fields.map(key=>b?.[key]));}
export function initialStoreHistory(value){return {past:[],present:value,future:[],published:value,group:null,action:'initial'};}
export function storeHistoryReducer(state,event){
 if(event.type==='change'){
  const next=typeof event.value==='function'?event.value(state.present):event.value;
  if(sameStoreDraft(next,state.present))return state;
  const grouped=event.group&&state.group===event.group;
  return {...state,past:grouped?state.past:[...state.past,state.present].slice(-limit),present:next,future:[],group:event.group||null,action:'change'};
 }
 if(event.type==='end-group')return {...state,group:null};
 if(event.type==='undo'&&state.past.length)return {...state,past:state.past.slice(0,-1),present:state.past.at(-1),future:[state.present,...state.future],group:null,action:'undo'};
 if(event.type==='redo'&&state.future.length)return {...state,past:[...state.past,state.present].slice(-limit),present:state.future[0],future:state.future.slice(1),group:null,action:'redo'};
 if(event.type==='publish'){
  // Keep undo available, but never undo backend identity or lose edits made during saving.
  const meta=Object.fromEntries(['id','domain','status','url','createdAt','updatedAt'].map(key=>[key,event.value[key]]));
  const pin=value=>({...value,...meta});
  return {...state,past:state.past.map(pin),future:state.future.map(pin),present:sameStoreDraft(state.present,event.submitted)?event.value:pin(state.present),published:event.value,group:null,action:'publish'};
 }
 return state;
}
