import {CFG} from './config.js';
// Presentation only. Count placed instances within an explicit room/floor zone.
export function sakuraSetActive(slots,zone){
 const themes=new Set(CFG.furniture.items.filter(it=>it.theme==='sakura').map(it=>it.id));
 return slots.filter(it=>(it.zone||'A')===zone&&themes.has(it.type)).length>=CFG.decor.sakuraSet.minItems;
}
export function drawSakuraSet(ctx,{slots,zone,view,cellToScreen,time,reducedMotion}){
 if(!sakuraSetActive(slots,zone.id))return false;
 const corners=[[0,0],[zone.cols-1,0],[zone.cols-1,zone.rows-1],[0,zone.rows-1]].map(c=>cellToScreen(...c,view,zone));
 ctx.save();ctx.beginPath();corners.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.clip();
 const xs=corners.map(p=>p.x),ys=corners.map(p=>p.y),left=Math.min(...xs),top=Math.min(...ys),w=Math.max(...xs)-left,h=Math.max(...ys)-top;
 for(let i=0;i<32;i++){const t=reducedMotion?0:time/1000;const x=left+((i*.618033+t*.025)%1)*w,y=top+((i*.414214+t*.075)%1)*h;ctx.fillStyle='#ffb7d5';ctx.beginPath();ctx.ellipse(x,y,3,1.6,i+t,0,Math.PI*2);ctx.fill();}ctx.restore();
 return true;
}
