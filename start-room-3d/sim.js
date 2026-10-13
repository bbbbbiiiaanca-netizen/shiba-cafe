// Pure game logic (no DOM / Three.js) so it can be unit-tested and stepped deterministically.
import {CFG} from './config.js';
import {customerMix} from './healing.js';
export function rng(seed=1){let s=seed>>>0||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}

// ---------- grades & levels (D-02): grade is never stored, always computed from level ----------
export const GRADES=['N','R','S'];
export function clampLevel(lv){return Math.max(1,Math.min(CFG.grades.maxLevel,Math.floor(+lv)||1));}
export function gradeOf(lv){lv=clampLevel(lv);for(const g of GRADES){const [a,b]=CFG.grades.bands[g];if(lv>=a&&lv<=b)return g;}return 'N';}
export const startLevel=g=>CFG.grades.bands[g][0];
export const dexKey=o=>o.coat+'_'+o.expr;

// ---------- persistent state ----------
export function newState(now=Date.now()){const st=baseState(now);markVisit(st,now);return st;}
function baseState(now){
 return {v:CFG.saveVersion,coins:CFG.start.coins,hearts:CFG.start.hearts,paws:CFG.start.paws,
  owned:CFG.start.shibas.map((s,i)=>({id:i+1,...s,lv:startLevel('N')})),nextId:CFG.start.shibas.length+1,dex:CFG.start.shibas.map(dexKey),
  served:0,petted:0,upg:0,gachaPulls:0,tut:0,questsClaimed:[],theme:'basic',themesOwned:['basic'],
  items:{heartReset:0,capsule:0},heartRegenAt:now,promoQueue:[],onboarding:{visits:[],claimed:[]},walk:null,rescueQueue:[],
  settings:{sound:true,music:true,language:null,todLock:CFG.healing.timeOfDay.lockToggle},lastSeen:now};
}
// Old saves (v1): `rarity` field N/R/SR + lv (lv started at 1 and grew by +1 per duplicate).
// → keep the grade the player had (old top label → S), place the shiba at that band's first level plus the levels it had gained, capped at the band end.
const LEGACY_TOP_GRADE='SR'; // the only place the old label may appear: it is read from old saves and rewritten to 'S'
export function migrate(s,now=Date.now()){
 if(s.v===1){
  for(const o of s.owned||[]){const g=o.rarity===LEGACY_TOP_GRADE?'S':GRADES.includes(o.rarity)?o.rarity:'N';const [a,b]=CFG.grades.bands[g];
   o.lv=Math.min(b,a+Math.max(0,(Math.floor(o.lv)||1)-1));delete o.rarity;}
  s.dex=[...new Set((s.owned||[]).map(dexKey))];s.heartRegenAt=s.lastSeen??now;s.v=2;}
 return sanitize(s);}
// invariants enforced on every load and save: no stored grade, level within 1..30
export function sanitize(s){
 // D-12: themes on hold (sakura/summer) or unknown fall back to the basic theme; D-11: unknown language → ask again
 const T=CFG.themes.map(t=>t.id);s.themesOwned=[...new Set(['basic',...(s.themesOwned||[]).filter(id=>T.includes(id))])];if(!T.includes(s.theme))s.theme='basic';
 if(s.settings&&!CFG.languages.includes(s.settings.language))s.settings.language=null;for(const o of s.owned||[]){if('rarity' in o)delete o.rarity;if('grade' in o)delete o.grade;o.lv=clampLevel(o.lv);}
 s.dex=[...new Set([...(s.dex||[]),...(s.owned||[]).map(dexKey)])];return s;}
// shibas out on a walk do not contribute (D-08); everyone else keeps working
export function activeOwned(s){return s.owned.filter(o=>!isBusy(s,o.id));}
export function incomePerSec(s){return (CFG.idle.perSec+CFG.idle.perShibaPerSec*Math.min(activeOwned(s).length,CFG.cafe.maxShibas))*(1+CFG.upgrade.bonus*(s.upg||0));}
export function upgradeCost(s){return Math.round(CFG.upgrade.base*Math.pow(CFG.upgrade.grow,s.upg||0));}
export function buyUpgrade(s){const c=upgradeCost(s);if(s.coins<c)return false;s.coins-=c;s.upg=(s.upg||0)+1;return true;}
export function offlineEarnings(s,now=Date.now()){const sec=Math.min((now-s.lastSeen)/1000,CFG.offline.capHours*3600);
 if(!(sec>=CFG.offline.minSeconds))return {sec:Math.max(0,sec|0),coins:0};return {sec:sec|0,coins:Math.floor(sec*incomePerSec(s)*CFG.offline.rate)};}
export function load(storage,now=Date.now()){let s=null;try{s=JSON.parse(storage.getItem(CFG.saveKey));}catch{}
 if(!s||!(s.v===1||s.v===CFG.saveVersion))return {state:newState(now),offline:{sec:0,coins:0},fresh:true};
 const d=baseState(now);s=migrate({...d,...s,onboarding:{...d.onboarding,...s.onboarding},settings:{...d.settings,...s.settings},items:{...d.items,...s.items}},now);settleHearts(s,now);markVisit(s,now);const offline=offlineEarnings(s,now);tickWalk(s,now);s.coins+=offline.coins;s.lastSeen=now;return {state:s,offline,fresh:false};}
export function save(storage,s,now=Date.now()){s.lastSeen=now;sanitize(s);storage.setItem(CFG.saveKey,JSON.stringify(s));}
// rewards are never capped (hearts from rewards may go above hearts.regenCap)
export function grant(s,r={}){for(const k of ['coins','hearts','paws'])if(r[k])s[k]+=r[k];for(const k of Object.keys(CFG.items))if(r[k])s.items[k]=(s.items[k]||0)+r[k];}

// ---------- hearts (D-05 / D-06) ----------
// heartRegenAt = start of the current 30-min regen period. While hearts ≥ cap the timer is stopped (anchor follows `now`).
// Called on load (covers time the app was closed) and every frame.
export function settleHearts(s,now=Date.now()){const H=CFG.hearts,P=H.regenEverySec*1000;
 if(!(s.heartRegenAt<=now))s.heartRegenAt=now; // missing anchor or clock moved backwards
 if(s.hearts>=H.regenCap){s.heartRegenAt=now;return 0;}
 const n=Math.floor((now-s.heartRegenAt)/P),add=Math.min(n,H.regenCap-s.hearts);s.hearts+=add;
 if(s.hearts>=H.regenCap)s.heartRegenAt=now;else s.heartRegenAt+=n*P;return add;}
export function nextHeartInSec(s,now=Date.now()){if(s.hearts>=CFG.hearts.regenCap)return null;return Math.max(0,Math.ceil((s.heartRegenAt+CFG.hearts.regenEverySec*1000-now)/1000));}
export function spendHearts(s,n,now=Date.now()){settleHearts(s,now);if(s.hearts<n)return false;s.hearts-=n;return true;}
export function canUseHeartReset(s){return (s.items.heartReset||0)>0&&s.hearts<CFG.hearts.regenCap;}
export function useHeartReset(s,now=Date.now()){settleHearts(s,now);if(!canUseHeartReset(s))return false;s.items.heartReset--;s.hearts=CFG.hearts.regenCap;s.heartRegenAt=now;return true;}

// ---------- gacha (D-01) ----------
// S = CFG.gacha.rates.S (2%, 확정). N·R rates are null (미정) → no N/R split is invented; pulls are blocked unless the TEMP switch is on.
export function gachaReady(){const R=CFG.gacha.rates;return (R.N!=null&&R.R!=null)||!!CFG.TEMP.gachaNonSAsN;}
export function rollGrade(r){const R=CFG.gacha.rates,x=r();if(x<R.S)return 'S';
 if(R.N!=null&&R.R!=null){const y=(x-R.S)/(1-R.S)*(R.N+R.R);return y<R.R?'R':'N';} // N·R share the remaining 1−S in their given ratio
 return CFG.TEMP.gachaNonSAsN?'N':null;}
// opts.capsule: pay with one 시바뽑기 캡슐 instead of paws (same rates, no guarantee)
export function canPull(s,opts={}){if(!gachaReady())return false;if(opts.capsule)return (s.items.capsule||0)>0;return (CFG.gacha.firstFree&&s.gachaPulls===0)||s.paws>=CFG.gacha.cost.paws;}
export function pull(s,r,opts={}){if(!canPull(s,opts))return null;const free=!opts.capsule&&CFG.gacha.firstFree&&s.gachaPulls===0;if(opts.capsule)s.items.capsule--;else if(!free)s.paws-=CFG.gacha.cost.paws;
 const coats=Object.keys(CFG.coats);const coat=coats[Math.floor(r()*coats.length)];const exprs=CFG.coatExprs(coat);const expr=exprs[Math.floor(r()*exprs.length)];
 const grade=rollGrade(r);s.gachaPulls++;
 // every pull is a new shiba starting at its band's first level (N 1 / R 11 / S 21); duplicates are merged by the player (D-03)
 const o={id:s.nextId++,coat,expr,lv:startLevel(grade)};const isNew=!s.dex.includes(dexKey(o));const dup=s.owned.some(x=>dexKey(x)===dexKey(o));
 s.owned.push(o);if(isNew)s.dex.push(dexKey(o));return {...o,grade,isNew,dup,free};}

// ---------- 28-day onboarding (D-07) ----------
const dateKey=now=>{const d=new Date(now);return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;}; // device-local date
export function markVisit(s,now=Date.now()){const v=s.onboarding.visits,k=dateKey(now);if(!v.includes(k)&&v.length<CFG.onboarding.days)v.push(k);}
export function onboardingMode(){return CFG.onboarding.dayMode??(CFG.TEMP.onboardingLoginDays?'loginDays':null);}
export function onboardingDay(s){return onboardingMode()==='loginDays'?Math.min(CFG.onboarding.days,s.onboarding.visits.length):null;} // null = 진행 방식 미정
// split a day's rewards into decided values and null (미정) keys
export function onboardingReward(day){const ready={},pending=[];for(const [k,v] of Object.entries(CFG.onboarding.rewards[day]||{}))v==null?pending.push(k):ready[k]=v;return {ready,pending};}
export function onboardingStatus(s,day){if(s.onboarding.claimed.includes(day))return 'claimed';if(!Object.keys(onboardingReward(day).ready).length)return 'pending';
 const cur=onboardingDay(s);return cur!=null&&day<=cur?'claimable':'locked';}
// each day is claimed once; null parts are skipped (shown as 준비 중)
export function claimOnboarding(s,day){if(onboardingStatus(s,day)!=='claimable')return null;const {ready}=onboardingReward(day);grant(s,ready);s.onboarding.claimed.push(day);return ready;}

// ---------- level changes, merge (D-03) and promotion (D-04) ----------
// every level change goes through setLevel: clamps to 1..30 and queues a promotion when the computed grade changes
export function setLevel(s,o,lv,source){const g0=gradeOf(o.lv);o.lv=clampLevel(lv);const g1=gradeOf(o.lv);
 if(g0!==g1&&promotionShouldPlay(source))(s.promoQueue||(s.promoQueue=[])).push({id:o.id,coat:o.coat,expr:o.expr,from:g0,to:g1,lv:o.lv});return g0!==g1;}
// shibas obtained directly from a pull never play it (they start at a band's first level, no level change happens)
export function promotionShouldPlay(source){if(!CFG.promotion.enabled||source==='gacha')return false;if(source==='merge')return mergeRule()?.playPromotion===true;return true;}
export function takePromotion(s){return (s.promoQueue||[]).shift()||null;} // dequeued once → plays once
// fallback card timeline (제안값): zoom → border colour → badge swap + sparkle → expression; total ≈ totalSec
export function promoPhase(t){const C=CFG.promotion.card,badge=Math.max(0,C.totalSec-C.zoomSec-C.borderSec-C.exprSec);
 const seg=[['zoom',C.zoomSec],['border',C.borderSec],['badge',badge],['expr',C.exprSec]];for(const [p,d] of seg){if(t<d)return {phase:p,k:d?t/d:1};t-=d;}return {phase:'done',k:1};}
export function mergeRule(){const M=CFG.merge;if(M.sameKey!=null&&M.mode!=null)return {sameKey:M.sameKey,mode:M.mode,playPromotion:M.playPromotion===true};
 return CFG.TEMP.mergeHandoffDefaults?{sameKey:'coat+expr',mode:'manual',playPromotion:false}:null;}
const SAME={'coat+expr':o=>o.coat+'_'+o.expr,coat:o=>o.coat};
// null = can merge; otherwise a reason code for the UI
export function mergeCheck(s,targetId,matId){const rule=mergeRule();if(!rule)return 'undecided';if(rule.mode!=='manual')return 'mode';
 const a=s.owned.find(o=>o.id===targetId),b=s.owned.find(o=>o.id===matId);if(!a||!b||a===b)return 'pick';
 if(isBusy(s,a.id)||isBusy(s,b.id))return 'busy';
 if(!SAME[rule.sameKey]||SAME[rule.sameKey](a)!==SAME[rule.sameKey](b))return 'notSame';if(gradeOf(a.lv)!==gradeOf(b.lv))return 'grade';return null;}
export const canMerge=(s,t,m)=>mergeCheck(s,t,m)===null;
export function merge(s,targetId,matId){if(!canMerge(s,targetId,matId))return null;const a=s.owned.find(o=>o.id===targetId),i=s.owned.findIndex(o=>o.id===matId),b=s.owned[i];
 const from=a.lv;const promoted=setLevel(s,a,a.lv+b.lv,'merge');s.owned.splice(i,1); // material leaves the cafe list; s.dex (도감) is untouched
 return {target:a,material:b,from,to:a.lv,promoted};}

// ---------- walk (D-08), fatigue (D-09), rescue (D-10) ----------
export function isBusy(s,id){return !!(s.walk&&s.walk.shibaId===id);}
export function walkCost(sec){const c=CFG.walk.heartCost;return c==null||c[sec]==null?null:c[sec];} // null = 미정
export function walkStopRule(){return CFG.walk.stopRule??(CFG.TEMP.walkStopNoRefund?'noRefund':null);}
export function fatigueOf(s,id){const o=s.owned.find(o=>o.id===id);return o?(o.fatigue||0):0;}
export function fatigueState(s,id){if(!CFG.FEATURES.fatigue)return 'normal';const f=fatigueOf(s,id),F=CFG.walk.fatigue;
 if(f>=1)return 'sleep';if(F.tiredAt!=null&&f>=F.tiredAt)return 'tired';return 'normal';}
export function setFatigue(s,id,v){const o=s.owned.find(o=>o.id===id);if(o)o.fatigue=Math.max(0,Math.min(1,v));} // debug / recovery
export function canPlay(s,id){return !isBusy(s,id)&&fatigueState(s,id)!=='sleep';} // 1.7.1 놀이 (healing) uses this
// null = ok, else reason code
export function walkCheck(s,id,sec){if(s.walk)return 'walking';const o=s.owned.find(o=>o.id===id);if(!o)return 'pick';if(!CFG.walk.durationsSec.includes(sec))return 'duration';
 if(CFG.FEATURES.fatigue&&(fatigueState(s,id)==='sleep'||fatigueOf(s,id)>=(CFG.walk.fatigue.max??1)))return 'fatigue';
 const cost=walkCost(sec);if(cost==null)return CFG.TEMP.walkFreeWhenCostNull?null:'costUndecided';if(s.hearts<cost)return 'hearts';return null;}
export function startWalk(s,id,sec,now=Date.now(),r=Math.random){if(walkCheck(s,id,sec))return null;const cost=walkCost(sec);if(cost)spendHearts(s,cost,now);
 s.walk={shibaId:id,walkStartAt:now,walkDurationSec:sec,rescue:rollRescue(r,now,sec)};return s.walk;}
export function walkProgress(s,now=Date.now()){if(!s.walk)return null;return Math.min(1,Math.max(0,(now-s.walk.walkStartAt)/(s.walk.walkDurationSec*1000)));}
// rescue is decided at start (time inside the walk + which shiba), shown when that moment passes — or batched on the next launch
function rollRescue(r,now,sec){const R=CFG.walk.rescue;if(!CFG.FEATURES.rescue||R.chance==null||!(r()<R.chance))return null;
 const sh=rescueShiba(r);return sh?{at:now+r()*sec*1000,shiba:sh,done:false}:null;}
export function rescueShiba(r){const R=CFG.walk.rescue;if(!R.gradeWeights||R.levelDist!=='uniform')return null; // grade odds / level distribution 미정 → no rescue
 const tot=GRADES.reduce((a,g)=>a+(R.gradeWeights[g]||0),0);let x=r()*tot,grade='N';for(const g of GRADES){if((x-=R.gradeWeights[g]||0)<0){grade=g;break;}}
 const [a,b]=CFG.grades.bands[grade],lv=a+Math.floor(r()*(b-a+1));const coats=Object.keys(CFG.coats),coat=coats[Math.floor(r()*coats.length)];
 return {coat,expr:CFG.coatExprs(coat)[0],lv};} // expression is not specified → the coat's first (base) expression
// called every frame and on load. Rescue then settlement; settlement clears s.walk so it can only happen once.
export function tickWalk(s,now=Date.now()){const W=s.walk;if(!W)return null;const out={rescued:null,returned:null};
 if(W.rescue&&!W.rescue.done&&now>=W.rescue.at){W.rescue.done=true;const o={id:s.nextId++,...W.rescue.shiba};s.owned.push(o);if(!s.dex.includes(dexKey(o)))s.dex.push(dexKey(o));s.rescueQueue.push(o.id);out.rescued=o;}
 if(now>=W.walkStartAt+W.walkDurationSec*1000){s.walk=null;out.returned=W.shibaId;
  const g=CFG.walk.fatigue.gainBySec;if(CFG.FEATURES.fatigue&&g&&g[W.walkDurationSec]!=null)setFatigue(s,W.shibaId,fatigueOf(s,W.shibaId)+g[W.walkDurationSec]);
  if(CFG.walk.reward)grant(s,CFG.walk.reward[W.walkDurationSec]||{});} // 보상량 미정 → nothing granted while null
 return out.rescued||out.returned?out:null;}
export function stopWalk(s,now=Date.now()){if(!s.walk||walkStopRule()!=='noRefund')return null;const id=s.walk.shibaId;s.walk=null;return id;} // TEMP rule: back at once, no reward / refund / rescue
export function feedSnack(s,id){const v=CFG.walk.fatigue.snackRecover;if(!CFG.FEATURES.fatigue||v==null)return false;setFatigue(s,id,fatigueOf(s,id)-v);return true;}
export function sleepRecover(s,dt){const v=CFG.walk.fatigue.sleepRecoverPerSec;if(!CFG.FEATURES.fatigue||v==null)return;for(const o of s.owned)if(o.fatigue>0&&!isBusy(s,o.id))setFatigue(s,o.id,o.fatigue-v*dt);}

// ---------- themes (D-12) ----------
export function selectTheme(s,id){const t=CFG.themes.find(t=>t.id===id);if(!t)return false;
 if(!s.themesOwned.includes(id)){if(t.price==null||s.coins<t.price)return false;s.coins-=t.price;s.themesOwned.push(id);} // price null = 미정 → not buyable
 s.theme=id;return true;}
export const currentTheme=s=>CFG.themes.find(t=>t.id===s.theme)||CFG.themes[0];

// ---------- quests / tutorial ----------
export function questStatus(s){return CFG.quests.map(q=>({...q,done:q.goal(s),claimed:s.questsClaimed.includes(q.id)}));}
export function claimQuest(s,id){const q=CFG.quests.find(q=>q.id===id);if(!q||!q.goal(s)||s.questsClaimed.includes(id))return false;s.questsClaimed.push(id);grant(s,q.reward);return true;}
export function tutStep(s){return CFG.tutorial[s.tut]||null;}
// a step that needs the gacha can be passed with 다음 while pulls are blocked (N·R 확률 미정)
export const tutCanSkip=t=>!!(t&&t.needsGacha&&!gachaReady());
export function tutAdvance(s,force=false){const t=tutStep(s);if(!t)return false;if(force?(t.next||tutCanSkip(t)):(t.done&&t.done(s))){grant(s,t.reward);s.tut++;return true;}return false;}

// ---------- the cafe floor (runtime only, not saved) ----------
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function moveTo(p,t,v,dt){const d=dist(p,t);if(d<=v*dt){p.x=t.x;p.z=t.z;return true;}p.x+=(t.x-p.x)/d*v*dt;p.z+=(t.z-p.z)/d*v*dt;return false;}
export function newWorld(s,seed=7){const r=rng(seed);const w={t:0,r,customers:[],shibas:[],nextCust:1,spawnT:CFG.customer.firstSpawn,tableBusy:CFG.tables.map(()=>null),events:[],tod:'day',
  play:{checkT:CFG.healing.play.checkIntervalSec,globalCdUntil:0,pairs:[]}};
 for(const o of activeOwned(s).slice(0,CFG.cafe.maxShibas))addShiba(w,o);return w;}
export function addShiba(w,o){if(w.shibas.length>=CFG.cafe.maxShibas)return null;const R=CFG.roam;const sh={id:o.id,coat:o.coat,expr:o.expr,phase:'idle',t:w.r()*2,x:R.x0+w.r()*(R.x1-R.x0),y:0,z:R.z0+w.r()*(R.z1-R.z0),cd:0,heading:0};w.shibas.push(sh);return sh;}
export function removeShiba(w,id){const i=w.shibas.findIndex(x=>x.id===id);if(i<0)return false;const sh=w.shibas[i];w.shibas.splice(i,1);
 const c=w.customers.find(c=>c.id===sh.cust);if(c){c.shiba=null;c.petting=false;c.t=0;}w.tableBusy=w.tableBusy.map(b=>b===id?null:b);return true;}
function roamTarget(w){const R=CFG.roam;return {x:R.x0+w.r()*(R.x1-R.x0),z:R.z0+w.r()*(R.z1-R.z0)};}
function topSpot(c){const tb=CFG.tables[c.seatDef.table];return {x:tb.x+(c.seatDef.face?.22:0),z:tb.z+(c.seatDef.face?0:.22)};}
export function tick(w,s,dt){w.t+=dt;const C=CFG.customer,V=CFG.visit;
 // spawn: customers only come in when a seat is free
 w.spawnT-=dt;const used=new Set(w.customers.map(c=>c.seat));const free=CFG.seats.map((_,i)=>i).filter(i=>!used.has(i));
 if(w.spawnT<=0&&free.length){const seat=free[Math.floor(w.r()*free.length)],sd=CFG.seats[seat];
  w.customers.push({id:w.nextCust++,kind:w.r()<.5?'boy':'girl',seat,seatDef:sd,phase:'enter',x:CFG.door.x,z:CFG.door.z,path:sd.via?[{x:CFG.door.x,z:CFG.aisleZ},{x:sd.via.x,z:CFG.aisleZ},{x:sd.via.x,z:sd.via.z},{x:sd.x,z:sd.z}]:[{x:CFG.door.x,z:CFG.aisleZ},{x:sd.x,z:CFG.aisleZ},{x:sd.x,z:sd.z}],t:0,visits:0,shiba:null,heading:Math.PI});w.spawnT=C.spawnEvery/customerMix(w.tod).countMul;}
 for(const c of w.customers){c.t+=dt;
  if(c.phase==='enter'||c.phase==='leave'){const tgt=c.path[0];const px=c.x,pz=c.z;if(moveTo(c,tgt,C.speed,dt))c.path.shift();if(c.x!==px||c.z!==pz)c.heading=Math.atan2(c.x-px,c.z-pz);
   if(!c.path.length){if(c.phase==='enter'){c.phase='wait';c.t=0;c.heading=c.seatDef.face*Math.PI/2;}else c.gone=true;}}
  else if(c.phase==='wait'&&c.visits>=C.visits&&!c.shiba&&c.t>=C.happyPause){ // pay & go home
   const coins=Math.round((C.payBase+C.payPerShiba*Math.min(activeOwned(s).length,CFG.cafe.maxShibas))*customerMix(w.tod).tipMul);s.coins+=coins;s.paws+=C.paws;s.served++;
   w.events.push({type:'pay',coins,paws:C.paws,x:c.x,z:c.z,id:c.id});c.phase='leave';c.path=[...(c.seatDef.via?[{x:c.seatDef.via.x,z:c.seatDef.via.z},{x:c.seatDef.via.x,z:CFG.aisleZ}]:[{x:c.x,z:CFG.aisleZ}]),{x:CFG.door.x,z:CFG.aisleZ},{x:CFG.door.x,z:CFG.door.z}];}
  else if(c.phase==='wait'&&c.visits<C.visits&&!c.shiba&&c.t>=C.waitBeforeVisit&&!w.tableBusy[c.seatDef.table]){ // call the nearest free shiba
   // playing shibas count as free: guests always come first (1.7.1 — the pair is interrupted in this same frame)
   let best=null,bd=1e9;for(const sh of w.shibas)if((sh.phase==='roam'||sh.phase==='idle'||sh.phase==='approach'||sh.phase==='play')&&sh.cd<=0){const d=dist(sh,c);if(d<bd){bd=d;best=sh;}}
   if(best){if(best.phase==='approach'||best.phase==='play')interruptPlay(w,best);const top=topSpot(c);best.phase='toTable';best.cust=c.id;best.from={x:top.x,z:Math.max(CFG.roam.z0,CFG.tables[c.seatDef.table].z+.85)};best.top=top;best.tgt=best.from;c.shiba=best.id;w.tableBusy[c.seatDef.table]=best.id;}}}
 w.customers=w.customers.filter(c=>!c.gone);
 const tableH=.55;
 for(const sh of w.shibas){sh.t+=dt;sh.cd-=dt;const c=w.customers.find(c=>c.id===sh.cust);
  // D-09: a 100%-tired shiba only sleeps (no serving, no play) — only when FEATURES.fatigue is on
  if(CFG.FEATURES.fatigue){const sl=fatigueState(s,sh.id)==='sleep';if(sl&&(sh.phase==='idle'||sh.phase==='roam'))sh.phase='sleep';else if(!sl&&sh.phase==='sleep'){sh.phase='idle';sh.t=0;}}
  if(sh.phase==='sleep'||sh.phase==='approach'||sh.phase==='play'){} // play phases are driven by stepPlay
  else if(sh.phase==='idle'){if(sh.t>0){sh.phase='roam';sh.tgt=roamTarget(w);}}
  else if(sh.phase==='roam'||sh.phase==='toTable'){const px=sh.x,pz=sh.z;const arrived=moveTo(sh,sh.tgt,CFG.roam.speed*(sh.phase==='toTable'?1.3:1),dt);if(sh.x!==px||sh.z!==pz)sh.heading=Math.atan2(sh.x-px,sh.z-pz);
   if(arrived){if(sh.phase==='roam'){sh.phase='idle';sh.t=-(CFG.roam.idleMin+w.r()*(CFG.roam.idleMax-CFG.roam.idleMin));}else{sh.phase='climb';sh.t=0;}}}
  else if(sh.phase==='climb'){const k=Math.min(1,sh.t/V.climb),e=k*k*(3-2*k);sh.x=sh.from.x+(sh.top.x-sh.from.x)*e;sh.z=sh.from.z+(sh.top.z-sh.from.z)*e;sh.y=tableH*e+Math.sin(k*Math.PI)*.25;sh.heading=Math.PI;
   if(k>=1){sh.phase='pet';sh.t=0;s.hearts+=V.heartsPerPet;s.petted++;w.events.push({type:'pet',id:sh.id,cust:sh.cust});if(c)c.petting=true;}}
  else if(sh.phase==='pet'){sh.heading=c?-c.seatDef.face*Math.PI/2:0;if(sh.t>=V.pet){sh.phase='descend';sh.t=0;if(c)c.petting=false;}}
  else if(sh.phase==='descend'){const k=Math.min(1,sh.t/V.descend),e=k*k*(3-2*k);sh.x=sh.top.x+(sh.from.x-sh.top.x)*e;sh.z=sh.top.z+(sh.from.z-sh.top.z)*e;sh.y=tableH*(1-e)+Math.sin(k*Math.PI)*.22;sh.heading=0;
   if(k>=1){sh.y=0;sh.phase='idle';sh.t=-.5;sh.cd=V.cooldown;if(c){c.visits++;c.shiba=null;c.t=0;w.tableBusy[c.seatDef.table]=null;}else w.tableBusy=w.tableBusy.map(b=>b===sh.id?null:b);sh.cust=null;}}}
 stepPlay(w,s,dt);
 return w;}

// ---------- 1.7.1 시바끼리 놀기 (D-13, FEATURES.healingPlay) ----------
// IDLE → APPROACH (walk to each other, ≤ approachMaxSec) → PLAY (type.dur) → COOLDOWN → IDLE. A guest assignment interrupts at once (half cooldown).
const P=()=>CFG.healing.play;
function affinity(a,b){const A=P().affinity,pa=P().personality[a.coat],pb=P().personality[b.coat];return A[pa]?.[pb]??A[pb]?.[pa]??1;}
function playTypes(w,s,a,b){const out=[];for(const [k,T] of Object.entries(P().types)){if(T.notAt&&T.notAt.includes(w.tod))continue;if(T.needsToy&&!(s.items&&s.items.toy>0))continue;
  if(k===a.lastPlayType||k===b.lastPlayType)continue;let wt=(T.weightAt&&T.weightAt[w.tod])||1;for(const sh of [a,b])wt*=P().prefer[P().personality[sh.coat]]?.[k]||1;out.push([k,wt]);}return out;}
export function playIdle(w,s,sh){return (sh.phase==='idle'||sh.phase==='roam')&&sh.cd<=0&&w.t>=(sh.playCdUntil||0)&&canPlay(s,sh.id);}
export function stepPlay(w,s,dt){if(!CFG.FEATURES.healingPlay)return;const G=w.play,C=P();
 for(const pr of [...G.pairs]){const [a,b]=pr.ids.map(id=>w.shibas.find(x=>x.id===id));if(!a||!b||a.phase!==pr.phase&&!(pr.phase==='approach'&&a.phase==='play')){endPair(w,pr,1);continue;}
  if(pr.phase==='approach'){let done=true;for(const [sh,tg] of [[a,pr.ta],[b,pr.tb]]){const px=sh.x,pz=sh.z;if(!moveTo(sh,tg,CFG.roam.speed,dt))done=false;if(sh.x!==px||sh.z!==pz)sh.heading=Math.atan2(sh.x-px,sh.z-pz);}
   if(done||w.t-pr.t0>=C.approachMaxSec){pr.phase='play';pr.until=w.t+C.types[pr.type].dur;a.phase=b.phase='play';w.events.push({type:'playStart',ids:pr.ids,play:pr.type,dongu:pr.dongu});}}
  else if(w.t>=pr.until)endPair(w,pr,1);}
 G.checkT-=dt;if(G.checkT>0)return;G.checkT=C.checkIntervalSec;
 if(G.pairs.length>=C.maxConcurrentPairs||w.t<G.globalCdUntil)return;
 const free=w.shibas.filter(sh=>playIdle(w,s,sh)),cands=[];
 for(let i=0;i<free.length;i++)for(let j=i+1;j<free.length;j++)if(dist(free[i],free[j])<=C.pairRadius)cands.push([free[i],free[j]]);
 if(!cands.length)return; // a single shiba never plays
 const [a,b]=cands[Math.floor(w.r()*cands.length)];if(!(w.r()<C.pairChance*affinity(a,b)))return;
 const types=playTypes(w,s,a,b);if(!types.length)return;let x=w.r()*types.reduce((t,[,v])=>t+v,0),type=types[0][0];for(const [k,v] of types){if((x-=v)<0){type=k;break;}}
 const mid={x:(a.x+b.x)/2,z:(a.z+b.z)/2},off=.28,dongu=(type==='sitTogether'||type==='napLean')&&w.r()<C.donguJoinChance;
 G.pairs.push({ids:[a.id,b.id],type,phase:'approach',t0:w.t,ta:{x:mid.x-off,z:mid.z},tb:{x:mid.x+off,z:mid.z},dongu});a.phase=b.phase='approach';}
function endPair(w,pr,cdMul){const C=P();w.play.pairs=w.play.pairs.filter(p=>p!==pr);w.play.globalCdUntil=w.t+C.globalCooldownSec*cdMul;
 for(const id of pr.ids){const sh=w.shibas.find(x=>x.id===id);if(!sh)continue;sh.playCdUntil=w.t+C.personalCooldownSec*cdMul;sh.lastPlayType=pr.type;if(sh.phase==='approach'||sh.phase==='play'){sh.phase='idle';sh.t=0;}}}
export function interruptPlay(w,sh){const pr=w.play.pairs.find(p=>p.ids.includes(sh.id));if(pr){endPair(w,pr,.5);w.events.push({type:'playInterrupt',id:sh.id});}}
// tapping a playing shiba gives a small heart reward; the play goes on
export function tapPlay(w,s,id){const sh=w.shibas.find(x=>x.id===id);if(!CFG.FEATURES.healingPlay||!sh||sh.phase!=='play')return 0;s.hearts+=P().heartOnTap;return P().heartOnTap;}
