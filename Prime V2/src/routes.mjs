export const pagePaths={0:'/fornecedor',1:'/produtos',2:'/lojas',3:'/videos',4:'/notas-de-lancamento',5:'/links-compartilhados',6:'/divulgacao'};
export const authPath=mode=>({login:'/entrar',signup:'/criar-conta',recovery:'/recuperar-senha'}[mode]||'/fornecedor');
export function readRoute(location){
 const path=location.pathname.replace(/\/$/,'')||'/',query=new URLSearchParams(location.search);
 const auth=({'/entrar':'login','/login':'login','/criar-conta':'signup','/signup':'signup','/recuperar-senha':'recovery'})[path]||(['login','signup','recovery'].includes(query.get('auth'))?query.get('auth'):null);
 const page=Object.keys(pagePaths).find(key=>pagePaths[key]===path);
 return {auth,page:page===undefined?null:Number(page),account:path==='/conta'||query.get('conta')==='1',landing:path==='/faq'||path==='/v2'||(path==='/'&&!auth&&!query.has('conta')&&!query.has('atualizacao'))};
}
