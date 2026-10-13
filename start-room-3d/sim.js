// Pure game logic (no DOM / Three.js) so it can be unit-tested and stepped deterministically.
import {CFG} from './config.js';
export function rng(seed=1){let s=seed>>>0||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}

// ---------- grades & levels (D-02): grade is never stored, always computed from level ----------
export const GRADES=['N','R','S'];
export function clampLevel(lv){return Math.max(1,Math.min(CFG.grades.maxLevel,Math.floor(+lv)||1));}
export function gradeOf(lv){lv=clampLevel(lv);for(const g of GRADES){const [a,b]=CFG.grades.bands[g];if(lv>=a&&lv<=b)return g;}return 'N';}
export const startLevel=g=>CFG.grades.bands[g][0];
export const dexKey=o=>o.coat+'_'+o.expr;

// ---------- persistent state ----------
export function newState(now=Date.now()){
 return {v:CFG.saveVersion,coins:CFG.start.coins,hearts:CFG.start.hearts,paws:CFG.start.paws,
  owned:CFG.start.shibas.map((s,i)=>({id:i+1,...s,lv:startLevel('N')})),nextId:CFG.start.shibas.length+1,dex:CFG.start.shibas.map(dexKey),
  served:0,petted:0,upg:0,gachaPulls:0,tut:0,questsClaimed:[],theme:'basic',themesOwned:['basic'],
  items:{heartReset:0},heartRegenAt:now,
  settings:{sound:true,music:true},lastSeen:now};
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
export function sanitize(s){for(const o of s.owned||[]){if('rarity' in o)delete o.rarity;if('grade' in o)delete o.grade;o.lv=clampLevel(o.lv);}
 s.dex=[...new Set([...(s.dex||[]),...(s.owned||[]).map(dexKey)])];return s;}
export function incomePerSec(s){return (CFG.idle.perSec+CFG.idle.perShibaPerSec*Math.min(s.owned.length,CFG.cafe.maxShibas))*(1+CFG.upgrade.bonus*(s.upg||0));}
export function upgradeCost(s){return Math.round(CFG.upgrade.base*Math.pow(CFG.upgrade.grow,s.upg||0));}
export function buyUpgrade(s){const c=upgradeCost(s);if(s.coins<c)return false;s.coins-=c;s.upg=(s.upg||0)+1;return true;}
export function offlineEarnings(s,now=Date.now()){const sec=Math.min((now-s.lastSeen)/1000,CFG.offline.capHours*3600);
 if(!(sec>=CFG.offline.minSeconds))return {sec:Math.max(0,sec|0),coins:0};return {sec:sec|0,coins:Math.floor(sec*incomePerSec(s)*CFG.offline.rate)};}
export function load(storage,now=Date.now()){let s=null;try{s=JSON.parse(storage.getItem(CFG.saveKey));}catch{}
 if(!s||!(s.v===1||s.v===CFG.saveVersion))return {state:newState(now),offline:{sec:0,coins:0},fresh:true};
 const d=newState(now);s=migrate({...d,...s,settings:{...d.settings,...s.settings},items:{...d.items,...s.items}},now);settleHearts(s,now);const offline=offlineEarnings(s,now);s.coins+=offline.coins;s.lastSeen=now;return {state:s,offline,fresh:false};}
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
export function canPull(s){return gachaReady()&&((CFG.gacha.firstFree&&s.gachaPulls===0)||s.paws>=CFG.gacha.cost.paws);}
export function pull(s,r){if(!canPull(s))return null;const free=CFG.gacha.firstFree&&s.gachaPulls===0;if(!free)s.paws-=CFG.gacha.cost.paws;
 const coats=Object.keys(CFG.coats);const coat=coats[Math.floor(r()*coats.length)];const exprs=CFG.coatExprs(coat);const expr=exprs[Math.floor(r()*exprs.length)];
 const grade=rollGrade(r);s.gachaPulls++;
 // every pull is a new shiba starting at its band's first level (N 1 / R 11 / S 21); duplicates are merged by the player (D-03)
 const o={id:s.nextId++,coat,expr,lv:startLevel(grade)};const isNew=!s.dex.includes(dexKey(o));const dup=s.owned.some(x=>dexKey(x)===dexKey(o));
 s.owned.push(o);if(isNew)s.dex.push(dexKey(o));return {...o,grade,isNew,dup,free};}

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
export function newWorld(s,seed=7){const r=rng(seed);const w={t:0,r,customers:[],shibas:[],nextCust:1,spawnT:CFG.customer.firstSpawn,tableBusy:CFG.tables.map(()=>null),events:[]};
 for(const o of s.owned.slice(0,CFG.cafe.maxShibas))addShiba(w,o);return w;}
export function addShiba(w,o){if(w.shibas.length>=CFG.cafe.maxShibas)return null;const R=CFG.roam;const sh={id:o.id,coat:o.coat,expr:o.expr,phase:'idle',t:w.r()*2,x:R.x0+w.r()*(R.x1-R.x0),y:0,z:R.z0+w.r()*(R.z1-R.z0),cd:0,heading:0};w.shibas.push(sh);return sh;}
function roamTarget(w){const R=CFG.roam;return {x:R.x0+w.r()*(R.x1-R.x0),z:R.z0+w.r()*(R.z1-R.z0)};}
function topSpot(c){const tb=CFG.tables[c.seatDef.table];return {x:tb.x+(c.seatDef.face?.22:0),z:tb.z+(c.seatDef.face?0:.22)};}
export function tick(w,s,dt){w.t+=dt;const C=CFG.customer,V=CFG.visit;
 // spawn: customers only come in when a seat is free
 w.spawnT-=dt;const used=new Set(w.customers.map(c=>c.seat));const free=CFG.seats.map((_,i)=>i).filter(i=>!used.has(i));
 if(w.spawnT<=0&&free.length){const seat=free[Math.floor(w.r()*free.length)],sd=CFG.seats[seat];
  w.customers.push({id:w.nextCust++,kind:w.r()<.5?'boy':'girl',seat,seatDef:sd,phase:'enter',x:CFG.door.x,z:CFG.door.z,path:sd.via?[{x:CFG.door.x,z:CFG.aisleZ},{x:sd.via.x,z:CFG.aisleZ},{x:sd.via.x,z:sd.via.z},{x:sd.x,z:sd.z}]:[{x:CFG.door.x,z:CFG.aisleZ},{x:sd.x,z:CFG.aisleZ},{x:sd.x,z:sd.z}],t:0,visits:0,shiba:null,heading:Math.PI});w.spawnT=C.spawnEvery;}
 for(const c of w.customers){c.t+=dt;
  if(c.phase==='enter'||c.phase==='leave'){const tgt=c.path[0];const px=c.x,pz=c.z;if(moveTo(c,tgt,C.speed,dt))c.path.shift();if(c.x!==px||c.z!==pz)c.heading=Math.atan2(c.x-px,c.z-pz);
   if(!c.path.length){if(c.phase==='enter'){c.phase='wait';c.t=0;c.heading=c.seatDef.face*Math.PI/2;}else c.gone=true;}}
  else if(c.phase==='wait'&&c.visits>=C.visits&&!c.shiba&&c.t>=C.happyPause){ // pay & go home
   const coins=C.payBase+C.payPerShiba*Math.min(s.owned.length,CFG.cafe.maxShibas);s.coins+=coins;s.paws+=C.paws;s.served++;
   w.events.push({type:'pay',coins,paws:C.paws,x:c.x,z:c.z,id:c.id});c.phase='leave';c.path=[...(c.seatDef.via?[{x:c.seatDef.via.x,z:c.seatDef.via.z},{x:c.seatDef.via.x,z:CFG.aisleZ}]:[{x:c.x,z:CFG.aisleZ}]),{x:CFG.door.x,z:CFG.aisleZ},{x:CFG.door.x,z:CFG.door.z}];}
  else if(c.phase==='wait'&&c.visits<C.visits&&!c.shiba&&c.t>=C.waitBeforeVisit&&!w.tableBusy[c.seatDef.table]){ // call the nearest free shiba
   let best=null,bd=1e9;for(const sh of w.shibas)if((sh.phase==='roam'||sh.phase==='idle')&&sh.cd<=0){const d=dist(sh,c);if(d<bd){bd=d;best=sh;}}
   if(best){const top=topSpot(c);best.phase='toTable';best.cust=c.id;best.from={x:top.x,z:Math.max(CFG.roam.z0,CFG.tables[c.seatDef.table].z+.85)};best.top=top;best.tgt=best.from;c.shiba=best.id;w.tableBusy[c.seatDef.table]=best.id;}}}
 w.customers=w.customers.filter(c=>!c.gone);
 const tableH=.55;
 for(const sh of w.shibas){sh.t+=dt;sh.cd-=dt;const c=w.customers.find(c=>c.id===sh.cust);
  if(sh.phase==='idle'){if(sh.t>0){sh.phase='roam';sh.tgt=roamTarget(w);}}
  else if(sh.phase==='roam'||sh.phase==='toTable'){const px=sh.x,pz=sh.z;const arrived=moveTo(sh,sh.tgt,CFG.roam.speed*(sh.phase==='toTable'?1.3:1),dt);if(sh.x!==px||sh.z!==pz)sh.heading=Math.atan2(sh.x-px,sh.z-pz);
   if(arrived){if(sh.phase==='roam'){sh.phase='idle';sh.t=-(CFG.roam.idleMin+w.r()*(CFG.roam.idleMax-CFG.roam.idleMin));}else{sh.phase='climb';sh.t=0;}}}
  else if(sh.phase==='climb'){const k=Math.min(1,sh.t/V.climb),e=k*k*(3-2*k);sh.x=sh.from.x+(sh.top.x-sh.from.x)*e;sh.z=sh.from.z+(sh.top.z-sh.from.z)*e;sh.y=tableH*e+Math.sin(k*Math.PI)*.25;sh.heading=Math.PI;
   if(k>=1){sh.phase='pet';sh.t=0;s.hearts+=V.heartsPerPet;s.petted++;w.events.push({type:'pet',id:sh.id,cust:sh.cust});if(c)c.petting=true;}}
  else if(sh.phase==='pet'){sh.heading=c?-c.seatDef.face*Math.PI/2:0;if(sh.t>=V.pet){sh.phase='descend';sh.t=0;if(c)c.petting=false;}}
  else if(sh.phase==='descend'){const k=Math.min(1,sh.t/V.descend),e=k*k*(3-2*k);sh.x=sh.top.x+(sh.from.x-sh.top.x)*e;sh.z=sh.top.z+(sh.from.z-sh.top.z)*e;sh.y=tableH*(1-e)+Math.sin(k*Math.PI)*.22;sh.heading=0;
   if(k>=1){sh.y=0;sh.phase='idle';sh.t=-.5;sh.cd=V.cooldown;if(c){c.visits++;c.shiba=null;c.t=0;w.tableBusy[c.seatDef.table]=null;}else w.tableBusy=w.tableBusy.map(b=>b===sh.id?null:b);sh.cust=null;}}}
 // safety: free a table whose customer vanished
 return w;}
