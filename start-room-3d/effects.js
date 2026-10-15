// Standing rule (수인님 2026-10-15 08:49): every effect line shows exact numbers + duration generated from CFG.
// A null/unset value renders as 미정 (never a guessed number) and is listed by unsetEffectKeys().
import {CFG} from './config.js';
import {t,tf} from './i18n.js';
const ok=v=>typeof v==='number'&&Number.isFinite(v);
const U=()=>t('app.unset');
export const pct=v=>ok(v)?Math.round(v*100)+'%':U();
export const sgn=v=>ok(v)?(v>0?'+':'')+v:U();
export const dur=sec=>!ok(sec)?U():sec%3600===0?t('fx.dur.h',{n:sec/3600}):t('fx.dur.m',{n:Math.round(sec/60)});
export const durFor=sec=>!ok(sec)?U():sec%3600===0?t('fx.durFor.h',{n:sec/3600}):t('fx.durFor.m',{n:Math.round(sec/60)});
const H=()=>CFG.heartUse;
export const HEART_FX={
 call:it=>t('fx.heart.call',{dur:durFor(it.sec),p:pct(it.guests)}),
 pet:it=>t('fx.heart.pet',{a:sgn(it.affinity),n:it.daily??U()}),
 play:it=>t('fx.heart.play',{a:sgn(it.affinity),h:sgn(it.happy)}),
 snack:it=>t('fx.heart.snack',{h:sgn(it.happy),f:sgn(it.fatigue)}),
 walk:()=>t('fx.heart.walk',{n:CFG.walk.heartsPer10Min??U(),a:sgn(H().walkAffinity)}),
 praise:it=>t('fx.heart.praise',{dur:durFor(it.sec),p:pct(it.satisfaction)}),
 brush:it=>t('fx.heart.brush',{dur:durFor(it.sec),p:pct(it.shibaMul)}),
 music:it=>t('fx.heart.music',{dur:durFor(it.sec),n:sgn(it.extraOrders),p:ok(it.stay)?pct(it.stay):U()}),
 blanket:it=>t('fx.heart.blanket',{h:sgn(it.happy),dur:durFor(it.sec),p:pct(it.recovery)}),
 recommend:it=>t('fx.heart.recommend',{dur:durFor(it.sec),s:pct(it.sales),p:pct(it.price)}),
 tasting:it=>t('fx.heart.tasting',{dur:durFor(it.sec),p:pct(it.price)}),
 cookie:it=>t('fx.heart.cookie',{m:it.minutes}),
 special:it=>t('fx.heart.special',{n:it.guestsCount??U(),tip:ok(it.tip)?it.tip:U()}),
 talent:it=>t('fx.heart.talent',{dur:dur(it.minutes*60)}),
 treat:()=>t('fx.heart.treat'),
 wish:it=>t('fx.heart.wish',{n:it.choices??U()}),
};
export const heartFx=it=>(HEART_FX[it.id]||(()=>tf('heart.item.'+it.id+'.line',it.line)))(it);
export const menuPickFx=it=>t('fx.heart.recommend',{dur:durFor(it.sec),s:pct(it.sales),p:pct(it.price)});
export const ITEM_FX={
 incomeBoost4h:()=>t('fx.item.incomeBoost4h',{dur:durFor(CFG.itemIncome.boostHours*3600),p:pct(CFG.itemIncome.boostMul)}),
 expBoost4h:()=>t('fx.item.expBoost4h',{dur:durFor(CFG.stub.expBoost.hours*3600),p:pct(CFG.stub.expBoost.mul)}),
 cooldownTicket:()=>t('fx.item.cooldownTicket'),
 heartReset:()=>t('fx.item.heartReset',{n:CFG.heartReset.fillTo}),
 potionBig:()=>t('fx.item.potionBig'),
 potionSmall:()=>t('fx.item.potionSmall'),
};
export const ALBA_FX={
 daycare:A=>t('fx.alba.daycare',{p:pct(A.intimacyMul)}),
 walk:A=>t('fx.alba.walk',{n:A.maxShibas??U(),b:sgn(A.boredom)}),
 trainer:()=>t('fx.alba.trainer'),
 manager:A=>t('fx.alba.manager',{dur:ok(A.hireSec)?dur(A.hireSec):U()}),
};
// Values still unset that appear in effect lines (for SPEC-V3-NOTES / tests).
export function unsetEffectKeys(){const out=[];for(const it of H().items){const x=heartFx(it);if(x.includes(U()))out.push(it.id);}return out;}

export const cookingFx=r=>t('fx.cooking',{f:sgn(r.effect.full),h:sgn(r.effect.happy)});
