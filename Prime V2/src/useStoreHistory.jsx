import {useCallback,useReducer} from 'react';
import {initialStoreHistory,storeHistoryReducer,sameStoreDraft} from './store-history.mjs';
export default function useStoreHistory(store){
 const [history,dispatch]=useReducer(storeHistoryReducer,store,initialStoreHistory);
 const change=useCallback((value,group)=>dispatch({type:'change',value,group}),[]);
 const undo=useCallback(()=>dispatch({type:'undo'}),[]),redo=useCallback(()=>dispatch({type:'redo'}),[]),endGroup=useCallback(()=>dispatch({type:'end-group'}),[]);
 const markPublished=useCallback((value,submitted)=>dispatch({type:'publish',value,submitted}),[]);
 return {draft:history.present,change,undo,redo,endGroup,markPublished,canUndo:!!history.past.length,canRedo:!!history.future.length,dirty:!sameStoreDraft(history.present,history.published),action:history.action};
}
