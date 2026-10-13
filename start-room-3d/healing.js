// D-13 힐링 기능 — 1.7.2 시간대 분위기, 1.7.3 관찰 소이벤트 (pure logic; the 1.7.1 놀이 lives in sim.js because it moves cafe shibas).
// Every number comes from CFG.healing (명세 1.7 제안값). Each part is inert unless its CFG.FEATURES switch is on.
import {CFG} from './config.js';

// ---------- 1.7.2 time of day ----------
const mins=hhmm=>{const [h,m]=hhmm.split(':').map(Number);return h*60+m;};
export function timeOfDay(date){const B=CFG.healing.timeOfDay.boundaries,m=date.getHours()*60+date.getMinutes();
 const order=Object.entries(B).map(([k,v])=>[k,mins(v)]).sort((a,b)=>a[1]-b[1]);let cur=order[order.length-1][0]; // before the first boundary = last period (night wraps midnight)
 for(const [k,v] of order)if(m>=v)cur=k;return cur;}
// warm/cool tint from colour temperature (Tanner Helland approximation) + darkness from exposure
export function kelvinRGB(k){const t=k/100;let r,g,b;
 if(t<=66){r=255;g=99.47*Math.log(t)-161.12;b=t<=19?0:138.52*Math.log(t-10)-305.04;}else{r=329.7*Math.pow(t-60,-.1332);g=288.12*Math.pow(t-60,-.0755);b=255;}
 return [r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))));}
export function todLook(key){const p=CFG.healing.timeOfDay.presets[key]||{};const [r,g,b]=kelvinRGB(p.kelvin??6000);
 return {r,g,b,tintA:.18*Math.abs(6000-(p.kelvin??6000))/3300,dark:1-(p.exposure??1)};}
// tracks the current period, checks every checkIntervalSec, eases over transitionSec; first call snaps (no transition on launch)
export function newTod(date,locked=false){const k=timeOfDay(date);return {key:k,from:todLook(k),to:todLook(k),k:1,checkT:0,locked};}
export function stepTod(T,dt,date){const C=CFG.healing.timeOfDay;if(T.k<1)T.k=Math.min(1,T.k+dt/C.transitionSec);T.checkT-=dt;
 if(T.checkT<=0){T.checkT=C.checkIntervalSec;const k=timeOfDay(date);if(!T.locked&&k!==T.key){T.from=currentLook(T);T.to=todLook(k);T.key=k;T.k=0;}}return T;}
export function currentLook(T){const a=T.from,b=T.to,k=T.k,m=(x,y)=>x+(y-x)*k;return {r:m(a.r,b.r),g:m(a.g,b.g),b:m(a.b,b.b),tintA:m(a.tintA,b.tintA),dark:m(a.dark,b.dark)};}
// night: arrivals ×countMul (spawn interval ÷countMul) and pay ×tipMul. NOTE: this build's cafe is seat-limited, so fewer arrivals do not
// reduce guests and night income ends up higher than day — the ±5% criterion does not hold with these proposal values (see impl-notes).
export function customerMix(key){return (CFG.FEATURES.healingTimeOfDay&&CFG.healing.timeOfDay.customerMix[key])||{countMul:1,tipMul:1};}

// ---------- 1.7.3 observation mini-events ----------
// HIDDEN → (APPEAR) ACTIVE (tapWindowSec) → tap: REWARD / timeout: LEAVE → COOLDOWN → HIDDEN. Missing one costs nothing.
export function newObserve(){return {phase:'hidden',ev:null,t:0,idle:0,rollT:0};}
export function touch(O){O.idle=0;O.rollT=0;} // any touch restarts the idle timer
export function eventAllowed(key,ctx){const E=CFG.healing.observe.events[key];if(E.tod&&!E.tod.includes(ctx.tod))return false;
 if('months' in E&&(E.months==null||!E.months.includes(ctx.month)))return false;if(E.needs&&!(ctx.owns||[]).includes(E.needs))return false;return true;}
// ctx: {overlay, tod, month, owns, r}
export function stepObserve(O,dt,ctx){const C=CFG.healing.observe;if(!CFG.FEATURES.healingObserve)return null;O.t+=dt;
 if(O.phase==='active'){if(O.t>=C.tapWindowSec){O.phase='cooldown';O.t=0;return {type:'leave',ev:O.ev};}return null;}
 if(O.phase==='cooldown'){if(O.t>=C.cooldownSec){O.phase='hidden';O.t=0;O.ev=null;O.rollT=0;}return null;}
 if(ctx.overlay){O.idle=0;O.rollT=0;return null;} // popups / other screens open → nothing appears
 O.idle+=dt;if(O.idle<C.idleThresholdSec)return null;O.rollT+=dt;if(O.rollT<C.rollIntervalSec)return null;O.rollT=0;
 if(!(ctx.r()<C.rollChance))return null;
 const keys=Object.keys(C.events).filter(k=>eventAllowed(k,ctx));if(!keys.length)return null;
 let x=ctx.r()*keys.reduce((a,k)=>a+C.events[k].w,0),pick=keys[0];for(const k of keys){if((x-=C.events[k].w)<0){pick=k;break;}}
 O.phase='active';O.ev=pick;O.t=0;return {type:'appear',ev:pick};}
const dayKey=now=>{const d=new Date(now);return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;};
// tap: reward (within the daily cap) + journal entry, exactly once per appearance
export function tapObserve(O,s,now=Date.now()){if(O.phase!=='active')return null;const key=O.ev,E=CFG.healing.observe.events[key],cap=CFG.healing.observe.dailyRewardCap;
 O.phase='cooldown';O.t=0;
 const j=s.observeJournal||(s.observeJournal={});const first=!j[key];j[key]=j[key]||{firstSeenAt:now,count:0};j[key].count++;
 if(!s.observeDaily||s.observeDaily.date!==dayKey(now))s.observeDaily={date:dayKey(now),coins:0,stamp:0};
 const got={};for(const [k,v] of Object.entries(E.reward||{})){const left=cap[k]==null?v:Math.max(0,Math.min(v,cap[k]-(s.observeDaily[k]||0)));if(left>0){got[k]=left;s.observeDaily[k]=(s.observeDaily[k]||0)+left;}}
 for(const [k,v] of Object.entries(got))s[k]=(s[k]||0)+v;return {key,first,got};}
