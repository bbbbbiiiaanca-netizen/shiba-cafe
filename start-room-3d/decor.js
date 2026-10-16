import {CFG} from './config.js';
import {NEW_FURNITURE} from './furniture-data.js';
import {t} from './i18n.js';
const decorIds=new Set(NEW_FURNITURE.map(it=>it.id));
export const SET_THEMES=['sakura','momiji','snow'];
export const isDecor=id=>decorIds.has(id);
export function furnitureSize(id){return CFG.decor.footprint.overrides[id]??CFG.decor.footprint.default;}
export function decorBonus(slots){
 const placed=slots.filter(it=>isDecor(it.type)),{perItem,cap}=CFG.decor.effect;
 let setBonus=0;
 for(const theme of SET_THEMES){
  const set=CFG.decor[theme+'Set'],zones=new Map();
  const ids=new Set(NEW_FURNITURE.filter(it=>it.theme===theme).map(it=>it.id));
  for(const it of placed)if(ids.has(it.type)){const zone=it.zone||'A';zones.set(zone,(zones.get(zone)||0)+1);}
  if(set.bonus!=null&&set.bonusMinItems!=null&&[...zones.values()].some(n=>n>=set.bonusMinItems))setBonus+=set.bonus;
 }
 return {demand:Math.min(cap.demand,placed.length*perItem.demand+setBonus),stay:Math.min(cap.stay,placed.length*perItem.stay)};
}
export function decorEffectText(cfg=CFG){
 const percent=n=>Number((n*100).toFixed(10));
 return t('shop.decorEffect',{demand:percent(cfg.decor.effect.perItem.demand),stay:percent(cfg.decor.effect.perItem.stay)});
}
// Presentation only. Count placed instances within an explicit room/floor zone.
export function themeSetActive(slots,zone,theme){
 const set=CFG.decor[theme+'Set'];if(!set)return false;
 const ids=new Set(NEW_FURNITURE.filter(it=>it.theme===theme).map(it=>it.id));
 return slots.filter(it=>(it.zone||'A')===zone&&ids.has(it.type)).length>=set.minItems;
}
export const sakuraSetActive=(slots,zone)=>themeSetActive(slots,zone,'sakura');
// Reuse the set presentation entry point. No new particle art was supplied.
export function drawThemeSet(ctx,options,theme){
 return theme==='sakura'?drawSakuraSet(ctx,options):themeSetActive(options.slots,options.zone.id,theme);
}
export function drawSakuraSet(ctx,{slots,zone,view,cellToScreen,time,reducedMotion}){
 if(!sakuraSetActive(slots,zone.id))return false;
 const corners=[[0,0],[zone.cols-1,0],[zone.cols-1,zone.rows-1],[0,zone.rows-1]].map(c=>cellToScreen(...c,view,zone));
 ctx.save();ctx.beginPath();corners.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.clip();
 const xs=corners.map(p=>p.x),ys=corners.map(p=>p.y),left=Math.min(...xs),top=Math.min(...ys),w=Math.max(...xs)-left,h=Math.max(...ys)-top;
 for(let i=0;i<32;i++){const t=reducedMotion?0:time/1000;const x=left+((i*.618033+t*.025)%1)*w,y=top+((i*.414214+t*.075)%1)*h;ctx.fillStyle='#ffb7d5';ctx.beginPath();ctx.ellipse(x,y,3,1.6,i+t,0,Math.PI*2);ctx.fill();}ctx.restore();
 return true;
}
