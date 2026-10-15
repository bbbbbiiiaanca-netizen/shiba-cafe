// Standing rule (수인님 2026-10-15 08:49): every effect line shows exact numbers + duration generated from CFG.
// A null/unset value renders as 미정 (never a guessed number) and is listed by unsetEffectKeys().
import {CFG} from './config.js';
const ok=v=>typeof v==='number'&&Number.isFinite(v);
export const pct=v=>ok(v)?Math.round(v*100)+'%':'미정';
export const sgn=v=>ok(v)?(v>0?'+':'')+v:'미정';
export const dur=sec=>!ok(sec)?'미정':sec%3600===0?`${sec/3600}시간`:`${Math.round(sec/60)}분`;
export const durFor=sec=>dur(sec)+(!ok(sec)?'':sec%3600===0?' 동안':'간');
const H=()=>CFG.heartUse;
export const HEART_FX={
 call:it=>`${durFor(it.sec)} 손님 방문 ${pct(it.guests)}`,
 pet:it=>`친밀도 ${sgn(it.affinity)} · 하루 ${it.daily??'미정'}회`,
 play:it=>`친밀도 ${sgn(it.affinity)} · 행복 ${sgn(it.happy)}`,
 snack:it=>`행복 ${sgn(it.happy)} · 피로 ${sgn(it.fatigue)}`,
 walk:()=>`10분당 하트 ${CFG.walk.heartsPer10Min??'미정'} · 친밀도 ${sgn(H().walkAffinity)}`,
 praise:it=>`${durFor(it.sec)} 만족 평판 ${pct(it.satisfaction)}`,
 brush:it=>`${durFor(it.sec)} 시바 효과 ${pct(it.shibaMul)} · 친밀도 미정`,
 music:it=>`${durFor(it.sec)} 추가 주문 ${sgn(it.extraOrders)} · 머무름 ${ok(it.stay)?pct(it.stay):'미정'}`,
 blanket:it=>`모두 행복 ${sgn(it.happy)} · ${durFor(it.sec)} 회복 ${pct(it.recovery)}`,
 recommend:it=>`${durFor(it.sec)} 판매 ${pct(it.sales)} · 가격 ${pct(it.price)}`,
 tasting:it=>`${durFor(it.sec)} 판매가 ${pct(it.price)}`,
 cookie:it=>`선물 1개(${it.minutes}분 수익 등) · 확률 미정`,
 special:it=>`특별 손님 ${it.guestsCount??'미정'}명 · 팁 ${ok(it.tip)?it.tip:'미정'}`,
 talent:it=>`${dur(it.minutes*60)} 수익 바로 받기`,
 treat:()=>`앉은 손님 모두 완전 만족`,
 wish:it=>`${it.choices??'미정'}개 중 1개 선물 · 목록 미정`,
};
export const heartFx=it=>(HEART_FX[it.id]||(()=>it.line))(it);
export const menuPickFx=it=>`${durFor(it.sec)} 판매 ${pct(it.sales)} · 가격 ${pct(it.price)}`;
export const ITEM_FX={
 incomeBoost4h:()=>`${durFor(CFG.itemIncome.boostHours*3600)} 수익 ${pct(CFG.itemIncome.boostMul)}`,
 expBoost4h:()=>`${durFor(CFG.stub.expBoost.hours*3600)} 경험치 ${pct(CFG.stub.expBoost.mul)}`,
 cooldownTicket:()=>`기다리는 시간 바로 끝`,
 heartReset:()=>`하트 ${CFG.heartReset.fillTo}개까지 채우기`,
 potionBig:()=>`모든 게이지 가득`,
 potionSmall:()=>`게이지 1개 가득`,
};
export const ALBA_FX={
 daycare:A=>`친밀도 ${pct(A.intimacyMul)} 놀이`,
 walk:A=>`${A.maxShibas??'미정'}마리 산책·지루함${sgn(A.boredom)}`,
 trainer:()=>`훈련 1회 성공`,
 manager:A=>`${ok(A.hireSec)?dur(A.hireSec):'미정'} 대신 운영`,
};
// Values still unset that appear in effect lines (for SPEC-V3-NOTES / tests).
export function unsetEffectKeys(){const out=[];for(const it of H().items){const t=heartFx(it);if(t.includes('미정'))out.push(it.id);}return out;}

export const cookingFx=r=>`포만 ${sgn(r.effect.full)} · 행복 ${sgn(r.effect.happy)}`;
export const runFx=()=>`배치 보너스 ${sgn(CFG.run.bonusPerShiba)}`;
