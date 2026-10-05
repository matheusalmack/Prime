import React,{useId} from 'react';
import {HugeiconsIcon} from '@hugeicons/react';
import {ShoppingBag03Icon,Home01Icon,SparklesIcon,Shirt01Icon,HeadphonesIcon,PawPrintIcon,GameController01Icon,Baby02Icon,Dumbbell02Icon} from '@hugeicons/core-free-icons';
import './facebook-groups-visual.css';
const groups=[
 {name:'Casa e decoração',icon:Home01Icon,color:'#47705d',background:'#dce9df'},
 {name:'Beleza e cuidados',icon:SparklesIcon,color:'#9c5570',background:'#f1dce5'},
 {name:'Moda e estilo',icon:Shirt01Icon,color:'#a26b3c',background:'#f3e3ce'},
 {name:'Eletrônicos e tecnologia',icon:HeadphonesIcon,color:'#315c91',background:'#dbe6f4'},
 {name:'Achadinhos e ofertas',icon:ShoppingBag03Icon,color:'#1877f2',background:'#dceaff'},
 {name:'Pets e companhia',icon:PawPrintIcon,color:'#966249',background:'#efdfd2'},
 {name:'Jogos e diversão',icon:GameController01Icon,color:'#675593',background:'#e5def4'},
 {name:'Mães e bebês',icon:Baby02Icon,color:'#50847d',background:'#d9eee7'},
 {name:'Saúde e fitness',icon:Dumbbell02Icon,color:'#b07134',background:'#f5e7cc'},
];
export default function FacebookGroupsVisual(){
 const uid=useId().replace(/:/g,'');
 return <div className="facebook-groups-visual" role="img" aria-label="Comunidades de Facebook de diversos nichos: achadinhos, casa, beleza, moda, eletrônicos, pets, jogos, bebês e fitness.">
  {groups.map((group,index)=>{const pathId=`${uid}-circle-${index}`;return <div key={group.name} className="facebook-group-disc" style={{left:`${2.4+(index%3)*47.6}%`,top:`${2.4+Math.floor(index/3)*47.6}%`,'--group-color':group.color,'--group-background':group.background}}>
   <div className="facebook-group-badge">
    <svg className="facebook-group-ring" viewBox="0 0 200 200" aria-hidden="true"><defs><path id={pathId} d="M 100,100 m -78,0 a 78,78 0 1,1 156,0 a 78,78 0 1,1 -156,0"/><path id={`${pathId}-bottom`} d="M 22,100 a 78,78 0 0,0 156,0"/></defs><circle cx="100" cy="100" r="96"/><text><textPath href={`#${pathId}`} startOffset="25%" textAnchor="middle">{group.name.toLocaleUpperCase('pt-BR')}</textPath></text><text className="facebook-group-ring-bottom"><textPath href={`#${pathId}-bottom`} startOffset="50%" textAnchor="middle">COMUNIDADE · FACEBOOK</textPath></text></svg>
    <div className="facebook-group-emblem"><HugeiconsIcon icon={group.icon} strokeWidth={1.65}/></div>
   </div>
  </div>})}
 </div>;
}
