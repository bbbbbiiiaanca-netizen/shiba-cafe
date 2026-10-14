import {linkTable,faceCell,layout,seatSlots,pathfind,routeTo,moveCell,syncRoutes} from './navigation.js';
export {seatSlots,syncRoutes,pathfind};
// Spec v3 game core — pure logic (no DOM), deterministic with an injected RNG so tests can replay it.
// Times: `now` is epoch ms; `dt` is seconds. Every number comes from CFG (config.js); UNSET (null) values disable what depends on them.
import {defaultPlacement,restorePlacement,restoreSpace,zonesForSpace} from './map-data.js';
import {CFG,pressureAt,isUnset} from './config.js';

export function rng(seed=1){let a=seed>>>0||1;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const pick=(r,arr)=>arr[Math.floor(r()*arr.length)];
// weighted draw from {key:weight}; only used once the spec gives the odds (UNSET odds → the draw is gated, never equal odds)
function pickWeighted(r,keys,odds){let x=r()*keys.reduce((a,k)=>a+(odds[k]||0),0);for(const k of keys){x-=odds[k]||0;if(x<0)return k;}return keys.at(-1);}
// 1.2 / 갱신 38: personality is drawn at adoption — gated while 질문 9(다) odds are UNSET (personality stays null = 미정)
export const personalityOddsSet=()=>!isUnset(CFG.personalityOdds);
const drawPersonality=r=>personalityOddsSet()?pickWeighted(r,CFG.personalities,CFG.personalityOdds):null;
const H=3600e3;

// §15: actual coin flows only; balances at creation/migration are not income.
// §17-2 order: income 메뉴 판매 · 시바 만남 추가 수입 · 오프라인 수입 (café payments settled while the game was closed/hidden) · 기타 수입 (walk rewards, any other non-sales coins);
// expense 알바비 · 병원비 · 메뉴 개발비 · 액세서리 구입 (all accessories) · 가구 구입 (always shown, no purchase exists yet).
// 가게 업그레이드 is not in the §17-2 list: kept for when upgrade prices exist, shown only when non-zero (4th element = hide at 0).
export const ledgerCategories={sales:['메뉴 판매','income'],meeting:['시바 만남 추가 수입','income'],offline:['오프라인 수입','income'],other:['기타 수입','income'],
 alba:['알바비','expense'],hospital:['병원비','expense'],menu:['메뉴 개발비','expense'],accessory:['액세서리 구입','expense'],furniture:['가구 구입','expense'],upgrade:['가게 업그레이드','expense',true]};
export const ledgerDay=now=>Math.floor((now+CFG.ledger.dayOffsetMs)/CFG.ledger.periodMs);
export function settleLedger(s,now){
 const today=ledgerDay(now);s.ledger??={days:{},now};s.ledger.now=Math.max(now,s.ledger.now??now);const latest=ledgerDay(s.ledger.now);
 s.ledger.days??={};for(const key of Object.keys(s.ledger.days))if(+key<latest-Math.max(2,CFG.ledger.historyDays)+1)delete s.ledger.days[key];
 return today;
}
export function recordLedger(s,category,amount,now=s.ledger?.now??s.lastSeen){
 if(!ledgerCategories[category]||!Number.isFinite(amount)||amount===0)return;
 const day=settleLedger(s,now);if(day<ledgerDay(s.ledger.now)-Math.max(2,CFG.ledger.historyDays)+1)return;const row=s.ledger.days[day]??={};row[category]=(row[category]||0)+amount;
}
export function ledgerStatement(s,now,offset=0){
 const day=settleLedger(s,now)+(offset===-1?-1:0),row=s.ledger.days[day]||{};
 const lines=Object.entries(ledgerCategories).map(([id,[label,kind,hideZero]])=>({id,label,kind,amount:row[id]||0,hideZero})).filter(x=>!x.hideZero||x.amount).map(({hideZero,...x})=>x);
 return {day,lines,net:lines.reduce((n,x)=>n+(x.kind==='expense'?-x.amount:x.amount),0)};
}
export function recordPayment(s,pay,now,{offline=false}={}){
 if(pay.pending||!Number.isFinite(pay.total)||isUnset(s.coins))return null;
 const credited=addCoins(s,pay.total);
 // Book exact flows including fractional carry; statement formatting keeps them visible.
 if(offline)recordLedger(s,'offline',pay.total,now);
 else{recordLedger(s,'sales',pay.base,now);recordLedger(s,'meeting',pay.total-pay.base,now);}
 return credited;
}

// ───────────────────────── state ─────────────────────────
export function newState(now=Date.now()){
 return {v:CFG.saveVersion,started:false,coins:CFG.start.coins,coinFrac:0,hearts:CFG.start.hearts,heartRegenAt:now,dia:CFG.start.dia,
  ledger:{days:{},now},placement:defaultPlacement(),space:restoreSpace(null),
  items:{heartReset:0,capsule:0,potionBig:0,potionSmall:0,cooldownTicket:0},
  cafe:{level:1,exp:0,rep:CFG.rep.start,stains:0,stainAcc:0,badStainAcc:0,driftAcc:0,closed:false,closedAt:null,managerUntil:0,managerCleanAcc:0,boostUntil:0},
  upgrades:Object.fromEntries(Object.keys(CFG.upgrades).map(k=>[k,0])),shibas:[],nextId:1,dongu:{placed:true},walk:null,rescues:[],walkResults:[],menus:[],menuDev:null,accInv:{},lastAbandonAt:null,
  stats:{served:0,satisfied:0,normal:0,disappointed:0,angry:0,lost:0},
  settings:{language:null,sound:true,music:true},lastSeen:now};
}

// ───────────────────────── shibas ─────────────────────────
export function makeShiba(s,{breed,level=null,name=null,tricks={},r=Math.random,now=Date.now()}){
 const g=Object.fromEntries(CFG.gauges.map(k=>[k,CFG.gaugeStart?.[k]??null])); // §1.2-3: unknown remains null
 const tr={},te={};for(const t of CFG.tricks){tr[t.id]=clamp(tricks[t.id]||0,0,CFG.trickMaxLevel);te[t.id]=0;}
 return {id:s.nextId++,breed,name,personality:drawPersonality(r),level:isUnset(level)?null:clamp(level,1,CFG.level.max),paws:0,
  intimacy:CFG.intimacy.start,g,tricks:tr,trickExp:te,placed:false,status:'ok',injury:null,hospitalUntil:0,hospitalKind:null,
  zeroSince:null,sickSince:null,cd:{},joinedAt:now,acc:null,accUnlocked:false,likesFound:{snacks:[],toys:[]}};
}
export const byId=(s,id)=>s.shibas.find(o=>o.id===id);
export const levelEffect=lv=>isUnset(lv)?null:1+CFG.level.incomePerLevel*(lv-1); // 갱신 81
export const pawsToNext=lv=>isUnset(lv)||lv>=CFG.level.max?null:CFG.level.pawsPerLevel*lv; // 갱신 138: 20×N
// 발바닥 = 시바별 잔고. 레벨업과 액세서리 칸 해금(139-6)에 쓰므로 자동으로 레벨을 올리지 않고 플레이어가 레벨업 버튼으로 쓴다.
export function addPaws(sh,n){if(sh&&n>0)sh.paws+=n;return sh?sh.paws:0;}
export function levelUpCheck(s,id){const sh=byId(s,id);if(!sh)return 'pick';const need=pawsToNext(sh.level);if(need==null)return 'max';if(sh.paws<need)return 'paws';return null;}
export function levelUp(s,id){if(levelUpCheck(s,id))return false;const sh=byId(s,id);sh.paws-=pawsToNext(sh.level);sh.level++;return true;}
// 갱신 139-5·139-6: 액세서리 칸 1개, 시바마다 발바닥 1,000개(그 시바의 발바닥) 또는 1,000다이아로 해금
export function accUnlockCheck(s,id,via){const sh=byId(s,id);if(!sh)return 'pick';if(sh.accUnlocked)return 'done';const A=CFG.accessory;
 if(via==='paws')return sh.paws<A.unlockPaws?'paws':null;if(via==='dia')return s.dia<A.unlockDia?'dia':null;return 'via';}
// 갱신 140·140-1 액세서리: accInv = 차지 않은 개수, sh.acc = 찬 액세서리 1개
export const bandanaItems=()=>{const B=CFG.accessory.bandana;return B.types.flatMap(t=>B.colors.map(c=>({id:`bandana-${t}-${c}`,type:t,color:c,price:B.priceCoins})));};
export const accItem=id=>bandanaItems().find(x=>x.id===id)||null;
export const starterItem=()=>CFG.accessory.starterItem; // identity UNSET → no guessed accessory
export const accWorn=(s,id)=>s.shibas.filter(o=>o.acc===id).length;
export const accOwned=(s,id)=>(s.accInv[id]||0)+accWorn(s,id);
export function buyAccCheck(s,id){const it=accItem(id);if(!it)return isUnset(CFG.accessory.special.items)?'unset':'pick';if(isUnset(s.coins)||s.coins<it.price)return 'coins';return null;}
export function buyAcc(s,id,now=Date.now()){if(buyAccCheck(s,id))return false;s.coins-=accItem(id).price;recordLedger(s,'accessory',accItem(id).price,now);s.accInv[id]=(s.accInv[id]||0)+1;return true;}
export function equipCheck(s,shId,id){const sh=byId(s,shId);if(!sh)return 'pick';if(!sh.accUnlocked)return 'slot';if(sh.acc===id)return 'worn';if(!(s.accInv[id]>0))return 'none';return null;}
export function equipAcc(s,shId,id){if(equipCheck(s,shId,id))return false;const sh=byId(s,shId);if(sh.acc)s.accInv[sh.acc]=(s.accInv[sh.acc]||0)+1;s.accInv[id]--;sh.acc=id;return true;}
export function unequipAcc(s,shId){const sh=byId(s,shId);if(!sh||!sh.acc)return false;s.accInv[sh.acc]=(s.accInv[sh.acc]||0)+1;sh.acc=null;return true;}
export function unlockAccSlot(s,id,via){if(accUnlockCheck(s,id,via))return false;const sh=byId(s,id);if(via==='paws')sh.paws-=CFG.accessory.unlockPaws;else s.dia-=CFG.accessory.unlockDia;sh.accUnlocked=true;return true;}
export const trickSum=sh=>CFG.tricks.reduce((a,t)=>a+(sh.tricks[t.id]||0),0);
export const intelligence=sh=>Math.min(CFG.intelligenceMax,trickSum(sh)*CFG.intelligencePerLevel); // 갱신 133
export function changeGauges(s,sh,d,now=Date.now()){for(const k of CFG.gauges)if(d[k]&&!isUnset(sh.g[k]))sh.g[k]=clamp(sh.g[k]+d[k],0,100);
 if(d.intimacy&&!isUnset(sh.intimacy))sh.intimacy=clamp(sh.intimacy+d.intimacy,CFG.intimacy.min,CFG.intimacy.max);updateZero(sh,now);}
// 갱신 111: a gauge at 0 (배고픔·청결·기분; 청결 0 = dirt 100) starts the 2-hour 앓아눕기 clock
const isZero=(sh,k)=>!isUnset(sh.g[k])&&(k==='dirt'?sh.g.dirt>=100:sh.g[k]<=0);
function updateZero(sh,now){const z=CFG.sick.zeroGauges.some(k=>isZero(sh,k));if(z&&sh.zeroSince==null)sh.zeroSince=now;if(!z)sh.zeroSince=null;}
// 갱신 86 condition multiplier: strongest matching step per gauge, multiplied, clamped 0.25..1.3
export function conditionMul(sh){if(CFG.condition.some(c=>isUnset(sh.g[c.gauge])))return null;const seen=new Set();let m=1;
 for(const c of CFG.condition){if(seen.has(c.gauge))continue;const v=sh.g[c.gauge];if(isUnset(v))continue;if((c.atLeast!=null&&v>=c.atLeast)||(c.atMost!=null&&v<=c.atMost)){m*=c.mul;seen.add(c.gauge);}}
 return clamp(m,CFG.visit.condMin,CFG.visit.condMax);}
// 갱신 86·100: meeting score = condition multiplier + 0.05 × shown trick level (≤ +0.25), all within the 1.3 cap
export function meetingScore(sh,trickLv=0){if(isUnset(conditionMul(sh)))return null;return Math.min(CFG.visit.condMax,conditionMul(sh)+Math.min(CFG.visit.trickBonusMax,CFG.visit.trickBonusPerLevel*trickLv));}
export function statusOf(s,sh){if(s.walk&&s.walk.shibaId===sh.id)return 'walking';if(sh.status!=='ok')return sh.status;if(sh.g.fatigue>=CFG.care.fatigueMax)return 'sleeping';return 'ok';}
// works in the café: placed, healthy, not walking, not asleep (1.10.0: 피로도 100% → 잠만 잠), café open
export const canWork=(s,sh)=>sh.placed&&statusOf(s,sh)==='ok'&&!s.cafe.closed;

// ───────────────────────── café level, reputation, hearts ─────────────────────────
export const cafeNeed=lv=>lv>=CFG.cafe.maxLevel?null:CFG.cafe.expToNext[lv-1];
export function addCafeExp(s,n){if(!(n>0))return 0;const C=s.cafe;let up=0;if(C.level>=CFG.cafe.maxLevel)return 0;C.exp+=n;
 for(let need=cafeNeed(C.level);need!=null&&C.exp>=need;need=cafeNeed(C.level)){C.exp-=need;C.level++;up++;}if(C.level>=CFG.cafe.maxLevel)C.exp=0;return up;}
export const slotsOf=s=>Math.min(CFG.cafe.maxPlaced,pressureAt(s.cafe.level).slots);
export const capOf=s=>pressureAt(s.cafe.level).cap+upgradeAdd(s,'seat'); // 좌석 추가 upgrade: +effect guests per level
export function arrivalMul(rep){for(const [at,m] of CFG.rep.arrivalMul)if(rep>=at)return m;return CFG.rep.arrivalMul.at(-1)[1];}
export const arrivalInterval=s=>3600/(CFG.cafe.customersPerHourPerCap*capOf(s))*arrivalMul(s.cafe.rep)*upgradeMul(s,'interval');
export function satisfiedGain(rep,base=CFG.rep.satisfied){for(const [at,m] of CFG.rep.damp)if(rep>=at)return base*m;return base;}
// offline: if a drop reaches the floor the café closes for the day (갱신 126-1)
export function addRep(s,d,ctx={}){const C=s.cafe;C.rep=clamp(C.rep+d,CFG.rep.min,CFG.rep.max);
 if(ctx.offline&&d<0&&C.rep<=CFG.rep.closureFloor)closeCafe(s,ctx.now??Date.now(),ctx.world);}
export function settleHearts(s,now=Date.now()){const Hc=CFG.hearts,P=Hc.regenEverySec*1000;
 if(!(s.heartRegenAt<=now))s.heartRegenAt=now;if(s.hearts>=Hc.regenCap){s.heartRegenAt=now;return 0;}
 const n=Math.floor((now-s.heartRegenAt)/P),add=Math.min(n,Hc.regenCap-s.hearts);s.hearts+=add;if(s.hearts>=Hc.regenCap)s.heartRegenAt=now;else s.heartRegenAt+=n*P;return add;}
export function nextHeartInSec(s,now=Date.now()){if(s.hearts>=CFG.hearts.regenCap)return null;return Math.max(0,Math.ceil((s.heartRegenAt+CFG.hearts.regenEverySec*1000-now)/1000));}
export function spendHearts(s,n,now=Date.now()){settleHearts(s,now);if(s.hearts<n)return false;if(s.hearts>=CFG.hearts.regenCap&&s.hearts-n<CFG.hearts.regenCap)s.heartRegenAt=now;s.hearts-=n;return true;}
export const canUseHeartReset=s=>(s.items.heartReset||0)>0&&s.hearts<CFG.heartReset.fillTo;
export function useHeartReset(s,now=Date.now()){settleHearts(s,now);if(!canUseHeartReset(s))return false;s.items.heartReset--;s.hearts=CFG.heartReset.fillTo;s.heartRegenAt=now;return true;}
function addCoins(s,x){if(isUnset(s.coins))return null;const t=s.coinFrac+x,w=Math.floor(t+1e-9);s.coins+=w;s.coinFrac=t-w;return w;} // 갱신 120: fractions kept inside, integers shown

// ───────────────────────── start / placement / abandon ─────────────────────────
// 갱신 109: the player picks one of the 4 breeds; it starts at Lv21 (갱신 90) with 앉아·기다려 3단계 (갱신 100·133)
export function chooseStart(s,breed,name,r=Math.random,now=Date.now()){if(s.started||!CFG.breeds.includes(breed))return null;
 const sh=makeShiba(s,{breed,name:name||null,level:CFG.startShiba.level,tricks:CFG.startShiba.tricks,r,now});sh.placed=true;
 sh.starter=true;sh.accUnlocked=!!CFG.accessory.starterSlotOpen;if(CFG.accessory.starterItems>0)sh.acc=starterItem(); // 139-6: 첫 시작 시바만 칸이 열려 있고 액세서리 1개를 찬 채로
 s.shibas.push(sh);s.started=true;return sh;}
export const placedShibas=s=>s.shibas.filter(o=>o.placed);
export function placeCheck(s,id){const sh=byId(s,id);if(!sh)return 'pick';if(sh.placed)return null;if(placedShibas(s).length>=slotsOf(s))return 'slots';return null;}
export function setPlaced(s,id,on){const sh=byId(s,id);if(!sh)return false;if(on&&placeCheck(s,id))return false;sh.placed=!!on;return true;}
export function abandonCheck(s,id){if(!byId(s,id))return 'pick';if(s.shibas.length<=1)return 'last';if(s.walk&&s.walk.shibaId===id)return 'walking';return null;}
// 갱신 76·82: 남은 시바 전원 친밀도 −15, 24시간 안에 다시 하면 −20. 동구는 목록에 없어 파양할 수 없다(갱신 78).
export function abandon(s,id,now=Date.now()){if(abandonCheck(s,id))return null;const I=CFG.intimacy;
 const d=s.lastAbandonAt!=null&&now-s.lastAbandonAt<I.abandonRepeatWithinH*H?I.abandonShockRepeat:I.abandonShock;
 const gone=byId(s,id);if(gone.acc)unequipAcc(s,id); // 찬 액세서리는 가방으로 돌아옴
 s.shibas=s.shibas.filter(o=>o.id!==id);for(const o of s.shibas)changeGauges(s,o,{intimacy:d},now);s.lastAbandonAt=now;return {gone,shock:d};}

// ───────────────────────── care (1.2-3) ─────────────────────────
export function careCheck(s,id,kind){const sh=byId(s,id);if(!sh)return 'pick';const st=statusOf(s,sh);
 if(kind==='play'){if(st!=='ok')return st;if(s.hearts<CFG.care.play.hearts)return 'hearts';return null;}
 const c=CFG.care[kind];if(!c)return 'pick';if(Object.values(c).some(isUnset))return 'unset';return null;} // feed / snack / bath / sleep: amounts UNSET
export function playWith(s,id,now=Date.now()){if(careCheck(s,id,'play'))return null;const P=CFG.care.play;spendHearts(s,P.hearts,now);const sh=byId(s,id);
 changeGauges(s,sh,P,now);addCafeExp(s,CFG.cafeExp.play);addPaws(sh,CFG.activityPaws.play);return sh;} // 갱신 84·88·90: 하트 1, 사고·랜덤 보상 없음

// 갱신 100·133 training
export function trainChance(sh){const T=CFG.training;if(T.bonuses.some(b=>isUnset(b.stat==='intimacy'?sh.intimacy:sh.g[b.stat])))return null;let p=T.successBase;for(const b of T.bonuses){const v=b.stat==='intimacy'?sh.intimacy:sh.g[b.stat];if(!isUnset(v)&&v>=b.atLeast)p+=b.add;}return clamp(p,T.min,T.max);}
export function trainCheck(s,id,trick,{trainer=false}={}){const sh=byId(s,id);if(!sh)return 'pick';if(!CFG.tricks.some(t=>t.id===trick))return 'trick';
 if((sh.tricks[trick]||0)>=CFG.trickMaxLevel)return 'max';const st=statusOf(s,sh);if(st!=='ok')return st;
 if(!trainer&&isUnset(trainChance(sh)))return 'unset';if(!trainer&&s.hearts<CFG.training.hearts)return 'hearts';return null;}
function addTrickRep(s,sh,trick,now,paws=CFG.activityPaws.trickLevel){sh.trickExp[trick]=(sh.trickExp[trick]||0)+1;let up=false;if(sh.trickExp[trick]>=sh.tricks[trick]+1){sh.trickExp[trick]=0;sh.tricks[trick]++;up=true;addPaws(sh,paws);} // 단계 N→N+1에 성공 N+1번 · 139-1 1단계 완료 발바닥 3
 changeGauges(s,sh,{fatigue:CFG.training.fatigue},now);return up;}
export function train(s,id,trick,r=Math.random,now=Date.now()){if(trainCheck(s,id,trick))return null;spendHearts(s,CFG.training.hearts,now);const sh=byId(s,id);
 const p=trainChance(sh),ok=r()<p;const up=ok?addTrickRep(s,sh,trick,now):false;return {ok,p,up,level:sh.tricks[trick],exp:sh.trickExp[trick]};}

// ───────────────────────── 알바 (갱신 99·118·123·125) ─────────────────────────
export function albaCheck(s,kind,ids=[],now=Date.now(),trick=null){const A=CFG.alba[kind];if(!A)return 'kind';if(isUnset(A.cost)||isUnset(A.unlock))return 'unset';if(s.cafe.level<A.unlock)return 'locked';if(isUnset(s.coins)||s.coins<A.cost)return 'coins';
 if(kind==='manager')return now<s.cafe.managerUntil?'active':null;
 if(!ids.length)return 'pick';if(kind==='walk'?ids.length>A.maxShibas:ids.length!==1)return 'count';
 for(const id of ids){const sh=byId(s,id);if(!sh)return 'pick';if((sh.cd[kind]||0)>now)return 'cooldown';const st=statusOf(s,sh);if(st!=='ok')return st;}
 if(kind==='trainer')return trainCheck(s,ids[0],trick,{trainer:true});return null;}
export function hireAlba(s,kind,ids=[],now=Date.now(),trick=null){if(albaCheck(s,kind,ids,now,trick))return null;const A=CFG.alba[kind];s.coins-=A.cost;recordLedger(s,'alba',A.cost,now);
 if(kind==='manager'){s.cafe.managerUntil=now+A.hireSec*1000;return {kind};}
 for(const id of ids){const sh=byId(s,id);sh.cd[kind]=now+A.cooldownSec*1000;
  if(kind==='walk'){changeGauges(s,sh,{boredom:A.boredom},now);addPaws(sh,CFG.activityPaws.walkAlba);} // 지루함 50 즉시 해소, 하트·경험치·친밀도·구조견 없음 · 139-2 발바닥 2
  if(kind==='daycare'){const P=CFG.care.play;changeGauges(s,sh,{boredom:P.boredom,dirt:P.dirt,fatigue:P.fatigue,happy:P.happy,intimacy:P.intimacy*A.intimacyMul},now);addPaws(sh,CFG.activityPaws.daycare);} // 놀아주기와 같음, 친밀도 절반, 경험치 없음
  if(kind==='trainer')addTrickRep(s,sh,trick,now,CFG.activityPaws.trainer);} // 항상 성공, 하트·경험치 없음
 return {kind,ids};}
export const managerActive=(s,now=Date.now())=>now<s.cafe.managerUntil;

// ───────────────────────── 병원 (갱신 58·111·111-1·112·131) ─────────────────────────
export function hospitalCost(s,kind){const col={light:1,snake:2,sick:3,rescueBath:4}[kind];let row=CFG.hospital.costs[0];for(const c of CFG.hospital.costs)if(s.cafe.level>=c[0])row=c;return row[col];}
export function hospitalCheck(s,id){const sh=byId(s,id);if(!sh)return 'pick';if(sh.status!=='injured'&&sh.status!=='sick')return 'healthy';
 if(isUnset(s.coins)||s.coins<hospitalCost(s,sh.status==='sick'?'sick':sh.injury))return 'coins';return null;} // 갱신 111-1: 외상 없음
export function sendToHospital(s,id,now=Date.now(),stayMul=1){if(hospitalCheck(s,id))return null;const sh=byId(s,id),kind=sh.status==='sick'?'sick':sh.injury;
 s.coins-=hospitalCost(s,kind);recordLedger(s,'hospital',hospitalCost(s,kind),now);sh.status='hospital';sh.hospitalKind=kind;sh.hospitalUntil=now+CFG.hospital.stays[kind]*1000*stayMul;return sh;}
function releaseHospital(s,now){for(const sh of s.shibas)if(sh.status==='hospital'&&now>=sh.hospitalUntil){sh.status='ok';sh.injury=null;sh.hospitalKind=null;sh.sickSince=null;sh.zeroSince=null;updateZero(sh,s.cafe.closed?s.cafe.closedAt:now);}} // a gauge still at 0 restarts the 2-hour clock
function tickHealth(s,now){releaseHospital(s,now);for(const sh of s.shibas){
 if(sh.status==='ok'&&sh.zeroSince!=null&&now-sh.zeroSince>=CFG.sick.zeroHours*H){sh.status='sick';sh.sickSince=now;}
 if(sh.status==='sick'&&sh.sickSince!=null&&now-sh.sickSince>=CFG.neglect.donguAfterH*H&&s.coins>=hospitalCost(s,'sick')){ // 갱신 112: 동구가 대신 데려감, 입원 2배
  sendToHospital(s,sh.id,now,CFG.neglect.donguStayMul);if(!isUnset(CFG.neglect.donguIntimacyDrop))changeGauges(s,sh,{intimacy:-CFG.neglect.donguIntimacyDrop},now);}}}

// ───────────────────────── 남은 시간 바로 완료 (갱신 135-2) ─────────────────────────
// 1분당 1다이아, 1분 단위 올림. target: {type:'hospital',id} · {type:'daycare'|'walk'|'trainer',id} (알바 쿨타임)
export const skipCost=sec=>sec>0?Math.ceil(sec/60)*CFG.timeSkip.diaPerMin:0;
function skipEnd(s,t){if(!CFG.timeSkip.targets.includes(t.type))return null;if(t.type==='menu')return s.menuDev?s.menuDev.until:null;
 const sh=byId(s,t.id);if(!sh)return null;if(t.type==='hospital')return sh.status==='hospital'?sh.hospitalUntil:null;return sh.cd[t.type]||null;}
export function skipLeftSec(s,t,now=Date.now()){const e=skipEnd(s,t);return e==null?0:Math.max(0,(e-now)/1000);}
export function skipCheck(s,t,now=Date.now()){const left=skipLeftSec(s,t,now);if(!(left>0))return 'none';if(s.dia<skipCost(left))return 'dia';return null;}
export function skipNow(s,t,now=Date.now()){if(skipCheck(s,t,now))return null;const cost=skipCost(skipLeftSec(s,t,now));s.dia-=cost;
 if(t.type==='menu'){s.menuDev.until=now;settleMenuDev(s,now);}else if(t.type==='hospital'){byId(s,t.id).hospitalUntil=now;releaseHospital(s,now);}else byId(s,t.id).cd[t.type]=now;return cost;}

// ───────────────────────── 산책 (1.10, 갱신 82·83·85·87·90·124·125) ─────────────────────────
export const walkHearts=sec=>CFG.walk.heartsPer10Min*sec/600;
export function walkCheck(s,id,sec,now=Date.now()){if(s.walk)return 'walking';const sh=byId(s,id);if(!sh)return 'pick';if(!CFG.walk.durationsSec.includes(sec))return 'duration';
 const st=statusOf(s,sh);if(st!=='ok')return st; // 다침·입원·앓아누움·잠(피로 100%)이면 못 감
 settleHearts(s,now);if(s.hearts<walkHearts(sec))return 'hearts';return null;} // 쿨타임 없음(125-1)
// the rescue moment is drawn at the start (shown during the walk, 1.10.1); the other events are drawn when the walk settles
export function startWalk(s,id,sec,now=Date.now(),r=Math.random){if(walkCheck(s,id,sec,now))return null;spendHearts(s,walkHearts(sec),now);
 const rescueAt=r()<CFG.walk.events.rescue?now+r()*sec*1000:null;s.walk={shibaId:id,walkStartAt:now,walkDurationSec:sec,rescueAt,rescueShown:false};return s.walk;}
export const walkProgress=(s,now=Date.now())=>s.walk?clamp((now-s.walk.walkStartAt)/(s.walk.walkDurationSec*1000),0,1):null;
export const canStopWalk=()=>!isUnset(CFG.walk.stopRule); // UNSET 질문 1-4
// 갱신 82 extra reward: which of '멍코인 소량 / 하트 1' is PENDING_CONFIRM; the coin option needs the UNSET amount, so it never pays a guessed sum
export const extraRewardKind=()=>{const k=CFG.pending.walkExtraReward;return k==='coins'&&isUnset(CFG.walk.events.extraCoins)?null:k;};
function newRescue(s,r,now){return {rid:'r'+now+'_'+Math.floor(r()*1e6),foundAt:now,breed:pick(r,CFG.breeds),pic:Math.floor(r()*2),bathed:false};} // 갱신 61: 그림 2장 중 랜덤, 견종과 무관
// returns {rescued, settled}; settles exactly once (s.walk cleared)
export function tickWalk(s,now=Date.now(),r=Math.random){const W=s.walk;if(!W)return null;const out={};
 if(W.rescueAt!=null&&!W.rescueShown&&now>=W.rescueAt){W.rescueShown=true;const x=newRescue(s,r,W.rescueAt);s.rescues.push(x);out.rescued=x;}
 if(now>=W.walkStartAt+W.walkDurationSec*1000){const sh=byId(s,W.shibaId),E=CFG.walk.events,sec=W.walkDurationSec,res={shibaId:W.shibaId,sec,at:now,events:[]};s.walk=null;
  if(sh){const fx=CFG.walkEffect[sec];changeGauges(s,sh,fx,now);addCafeExp(s,CFG.cafeExp.walkPer10Min*sec/600);addPaws(sh,CFG.activityPaws.walk);res.paws=CFG.activityPaws.walk; // 139-1 직접 산책 1회 2
   // 갱신 82·83 independent rolls
   if(r()<E.snake){sh.status='injured';sh.injury='snake';res.events.push('snake');}
   if(r()<E.light){if(sh.status!=='injured'){sh.status='injured';sh.injury='light';}res.events.push('light');}
   if(r()<E.extra){const kind=extraRewardKind();if(kind==='heart'){s.hearts+=E.extraHeart;res.events.push('extraHeart');}else if(kind==='coins'){addCoins(s,E.extraCoins);recordLedger(s,'other',E.extraCoins,now);res.paidCoins=E.extraCoins;res.events.push('extraCoins');}}
   if(r()<E.capsule){s.items.capsule++;res.events.push('capsule');}
   if(W.rescueAt!=null)res.events.push('rescue');}
  s.walkResults.push(res);out.settled=res;}
 return out.rescued||out.settled?out:null;}
// 갱신 65·66·81·131: find → bath right there (fixed 멍코인 by café level) → reveal → bring / "안데려갈래"
export function bathRescue(s,rid,now=Date.now()){const x=s.rescues.find(x=>x.rid===rid);if(!x||x.bathed)return null;const c=hospitalCost(s,'rescueBath');if(isUnset(s.coins)||s.coins<c)return null;s.coins-=c;recordLedger(s,'hospital',c,now);x.bathed=true;return x;}
export function bringCheck(s,rid){const x=s.rescues.find(x=>x.rid===rid);if(!x)return 'pick';if(!x.bathed)return 'bath';if(isUnset(CFG.rescueLevel))return 'unset';if(s.shibas.length>=CFG.cafe.maxOwned)return 'owned';return null;}
export function bringRescue(s,rid,r=Math.random,now=Date.now()){if(bringCheck(s,rid))return null;const x=s.rescues.find(x=>x.rid===rid);
 const sh=makeShiba(s,{breed:x.breed,level:CFG.rescueLevel,r,now});s.shibas.push(sh);if(placedShibas(s).length<slotsOf(s))sh.placed=true;
 s.rescues=s.rescues.filter(y=>y!==x);addCafeExp(s,CFG.cafeExp.rescueAdopt);return sh;}
export function declineRescue(s,rid){const n=s.rescues.length;s.rescues=s.rescues.filter(x=>x.rid!==rid);return s.rescues.length<n;}

// ───────────────────────── 시바뽑기 (갱신 137·81·82) ─────────────────────────
// n = 1 (100다이아 또는 뽑기권 1장) or 10 (900다이아). 견종 4종; 이미 가진 견종이면 그 견종의 가장 먼저 온 시바에게 발바닥 10개.
export const gachaPrice=n=>n===CFG.gacha.tenCount?CFG.gacha.tenDia:n===1?CFG.gacha.priceDia:null;
export const gachaOddsSet=()=>!isUnset(CFG.gacha.breedOdds);
export function gachaCheck(s,n=1,{ticket=false}={}){if(!s.started)return 'pick';if(!gachaOddsSet())return 'odds';if(isUnset(CFG.gacha.startLevel))return 'unset'; // UNSET 질문 9(바) 확률표·시작 레벨 → 뽑기 비활성
 if(ticket){if(n!==1)return 'count';if(!(s.items.capsule>0))return 'ticket';}
 else{const p=gachaPrice(n);if(p==null)return 'count';if(s.dia<p)return 'dia';}
 if(s.shibas.length>=CFG.cafe.maxOwned&&CFG.breeds.some(b=>!s.shibas.some(o=>o.breed===b)))return 'owned';return null;}
const pickBreed=r=>pickWeighted(r,CFG.breeds,CFG.gacha.breedOdds); // gachaCheck guarantees the odds are set
export function gachaPull(s,n=1,r=Math.random,now=Date.now(),{ticket=false}={}){if(gachaCheck(s,n,{ticket}))return null;
 if(ticket)s.items.capsule--;else s.dia-=gachaPrice(n);const out=[];
 for(let i=0;i<n;i++){const breed=pickBreed(r),own=s.shibas.find(o=>o.breed===breed);
  if(own){addPaws(own,CFG.gacha.dupPaws);out.push({breed,dup:true,toId:own.id,paws:CFG.gacha.dupPaws});continue;}
  const sh=makeShiba(s,{breed,level:CFG.gacha.startLevel,r,now});s.shibas.push(sh);if(placedShibas(s).length<slotsOf(s))sh.placed=true;out.push({breed,dup:false,id:sh.id});}
 return out;}

// ───────────────────────── 메뉴·결제 (갱신 120·129) ─────────────────────────
export const menuItem=id=>CFG.menu.items.find(m=>m.id===id);
export function menuCheck(s,id){const m=menuItem(id);if(!m)return 'pick';if(s.menus.includes(id))return 'owned';if(s.menuDev&&s.menuDev.id===id)return 'developing';
 if(isUnset(m.devCost)||isUnset(m.unlockLevel)||isUnset(m.devSec))return 'unset';if(s.cafe.level<m.unlockLevel)return 'locked';
 if(s.menuDev)return 'busy';if(isUnset(s.coins)||s.coins<m.devCost)return 'coins';return null;} // 갱신 129: 멍코인으로 개발, 134: 카페 레벨 해금, 136: 한 번에 1개
// 갱신 136: 멍코인을 내면 개발이 시작되고 개발 시간이 지나야 완성(메뉴에 추가)
export function developMenu(s,id,now=Date.now()){if(menuCheck(s,id))return false;const m=menuItem(id);s.coins-=m.devCost;recordLedger(s,'menu',m.devCost,now);
 s.menuDev={id,startAt:now,until:now+Math.min(m.devSec,CFG.menu.devMaxSec)*1000};return true;}
export function settleMenuDev(s,now=Date.now()){const D=s.menuDev;if(!D||now<D.until)return null;s.menuDev=null;if(!s.menus.includes(D.id))s.menus.push(D.id);return D.id;}
export const developed=(s,kind)=>CFG.menu.items.filter(m=>s.menus.includes(m.id)&&(!kind||m.kind===kind));
export const normalDeveloped=s=>developed(s,'drink').length+developed(s,'dessert').length;
// 갱신 120 + 134: 5% + (평판−50)×0.3%p + 개발한 일반 메뉴 1개당 1%p (+15%p 만족), 상한 40%
export function premiumChance(rep,satisfied,normalDev=0){const M=CFG.menu;
 return Math.min(M.premiumCap,M.premiumBase+normalDev*M.premiumPerNormalDeveloped+Math.max(0,rep-50)*M.premiumPerRepAbove50+(satisfied?M.premiumSatisfiedBonus:0));}
export function itemIncomeMul(s,now=Date.now()){return now<s.cafe.boostUntil?Math.min(CFG.itemIncome.paidCapMul,CFG.itemIncome.boostMul):1;}
const coffeeOrder=p=>({id:CFG.menu.coffee.id,kind:'coffee',price:CFG.menu.coffee.price,img:CFG.menu.coffee.img,p});
// 갱신 134 order rules; instant on sit: answer 똑또기 2026-10-14.
//  고급 음료(3멍) needs ≥1 developed normal drink, 고급 디저트(5멍) ≥1 normal dessert — otherwise that slot becomes the default coffee;
//  a 고급 디저트 becomes a premium (8멍) with 30% when ≥1 premium is developed. The picture is a random developed item of that kind.
export function chooseOrder(s,satisfied,r){const M=CFG.menu,p=premiumChance(s.cafe.rep,satisfied,normalDeveloped(s));
 if(!(r()<p))return coffeeOrder(p);
 const [wd,ws]=M.drinkToDessert,kind=r()*(wd+ws)<wd?'drink':'dessert';const list=developed(s,kind);
 if(!list.length)return {...coffeeOrder(p),slot:kind};
 if(kind==='dessert'){const prem=developed(s,'premium');if(prem.length&&r()<M.premiumUpgradeChance){const m=pick(r,prem);return {id:m.id,kind:'premium',price:m.price,img:m.img,p,slot:kind};}}
 const m=pick(r,list);return {id:m.id,kind,price:m.price,img:m.img,p,slot:kind};}
// confirmed 수인님 2026-10-14: max meeting effect; no-meeting starting x1 pending confirm.
export function payFor(s,met,order,now=Date.now()){
 const aggregate=CFG.income.levelAggregation,item=itemIncomeMul(s,now);
 const effects=met.map(id=>byId(s,id)).filter(Boolean).map(o=>levelEffect(o.level));
 const lvMul=typeof aggregate==='function'&&effects.every(Number.isFinite)?aggregate(effects):null;
 const base=order.price*upgradeMul(s,'price'); // 메뉴 판매가 인상 upgrade (effect UNSET → ×1)
 const pending=!Number.isFinite(lvMul)||!Number.isFinite(base)||!Number.isFinite(item);return {base,lvMul:pending?null:lvMul,item,total:pending?null:base*lvMul*item,pending};}

// ───────────────────────── 가게 관리 업그레이드 (§16 answer 2026-10-14) ─────────────────────────
// Levels live in s.upgrades. A null price disables buying; a null effect has no effect (hooks below return the neutral value).
export const upgradeLevel=(s,kind)=>s.upgrades?.[kind]||0;
const upgradeAdd=(s,kind)=>{const e=CFG.upgrades[kind]?.effect;return Number.isFinite(e)?e*upgradeLevel(s,kind):0;}; // seat · queue: +effect per level
const upgradeMul=(s,kind)=>{const e=CFG.upgrades[kind]?.effect;return Number.isFinite(e)?e**upgradeLevel(s,kind):1;}; // interval · price: ×effect per level (form pending confirm)
export function upgradeCheck(s,kind){const U=CFG.upgrades[kind];if(!U)return 'kind';if(!Number.isFinite(U.price))return 'unset';
 if(Number.isFinite(U.maxLevel)&&upgradeLevel(s,kind)>=U.maxLevel)return 'max';if(isUnset(s.coins)||s.coins<U.price)return 'coins';return null;}
export function buyUpgrade(s,kind,now=Date.now()){if(upgradeCheck(s,kind))return false;const p=CFG.upgrades[kind].price;s.coins-=p;recordLedger(s,'upgrade',p,now);s.upgrades[kind]=upgradeLevel(s,kind)+1;return true;}

// ───────────────────────── 얼룩 (갱신 101-3·117-2) ─────────────────────────
export function cleanStain(s){if(s.cafe.stains<=0)return false;s.cafe.stains--;addCafeExp(s,CFG.cafeExp.stainClean);return true;}

// ───────────────────────── 임시휴무 (갱신 126) ─────────────────────────
export function closeCafe(s,now,w){const C=s.cafe;if(C.closed)return;C.closed=true;C.closedAt=now;C.rep=Math.max(C.rep,CFG.rep.closureFloor);
 for(const sh of s.shibas)sh.g.fatigue=0; // 126-3: 집에서 잠, 피로도 0
 if(w){w.custs=[];w.queue=[];w.sh={};}}
// 126-2·126-4: opening the app reopens at 평판 30; the 앓아눕기·방치 clocks did not run while closed
export function reopenCafe(s,now){const C=s.cafe;if(!C.closed)return null;const gap=Math.max(0,now-C.closedAt);
 for(const sh of s.shibas){if(sh.zeroSince!=null)sh.zeroSince+=gap;if(sh.sickSince!=null)sh.sickSince+=gap;}
 C.closed=false;C.closedAt=null;C.rep=CFG.rep.closureFloor;return {gapSec:gap/1000};}

// ───────────────────────── the café floor (runtime world) ─────────────────────────
export const NPC_NORMAL=['commuter','mom','dad','girl','boykid','grandma','grandpa','coupleman','couplewoman','friend']; // 갱신 51 (진상·부동산 제외)
export function newWorld(s,r=Math.random,navigation=null){return {navigation,behaviour:null,r,t:0,custs:[],queue:[],nextCust:1,spawnT:arrivalInterval(s),sh:{},events:[],recent:[],lastPay:null};}
function makeRequest(s,w){const T=[];const working=s.shibas.filter(o=>canWork(s,o));
 if(working.length)T.push('meetShiba');const known=CFG.tricks.filter(t=>working.some(o=>o.tricks[t.id]>0));if(known.length)T.push('seeTrick');
 if(!T.length)return null;const type=pick(w.r,T);return type==='meetShiba'?{type,shibaId:pick(w.r,working).id}:{type,trick:pick(w.r,known).id};}
function seat(s,w,c){const entranceCell=layout(s,w).entrance;const queueFrom=c.phase==='queue'&&c.cell?[...c.cell]:null;const from=c.phase==='queue'?entranceCell:c.cell||entranceCell;const used=new Set(w.custs.filter(c=>c.phase!=='exiting').map(x=>x.seat));const {zone,slots,entrance}=layout(s,w);
 const target=seatSlots(s,w).find(x=>!used.has(x.id)&&pathfind(zone,slots,from,x.cell,{seatTarget:true}));
 if(!target||w.custs.filter(c=>c.phase!=='exiting').length>=capOf(s))return false;
 Object.assign(c,{phase:'entering',seat:target.id,seatFurniture:target.furnitureId,cell:[...from],t:CFG.cafe.stayingSec,score:0,met:[],with:null,fulfilled:false,request:makeRequest(s,w)});
 routeTo(s,w,c,target.cell,true);if(queueFrom){const prefix=[];for(let j=queueFrom[1]-1;j>=entrance[1];j--)prefix.push([entrance[0],j]);c.route=[...prefix,...c.route];c.cell=queueFrom;}else if(c.entryFrom){c.route.unshift([...entrance]);c.cell=[...c.entryFrom];delete c.entryFrom;}w.custs.push(c);w.events.push({type:'enter',id:c.id});return true;}
function spawn(s,w,now){const {zone,slots,entrance}=layout(s,w);
 if(!Number.isFinite(CFG.navigation.cellStepSec)||CFG.navigation.cellStepSec<=0||!pathfind(zone,slots,entrance,entrance))return;
 const c={id:w.nextCust++,kind:pick(w.r,NPC_NORMAL),cell:[...entrance],entryFrom:[entrance[0],entrance[1]+1]};
 if(!w.queue.length&&seat(s,w,c))return;
 if(w.queue.length<queueLimit(s,w)){c.phase='queue';c.t=CFG.navigation.queueWaitSec;w.queue.push(c);w.events.push({type:'queue',id:c.id});}
 else{s.stats.lost++;w.events.push({type:'lost'});}} // overflow guests turn back
// starting value 똑또기 2026-10-14: queue only on the grass cells outside the entrance (capped by 갱신 66 queueMax)
// 대기 줄 연장 upgrade: +effect cells per level, continuing the map's queue line in the same direction (needs ≥1 map cell; no entrance → no queue)
export function queueCells(s,w){const base=layout(s,w).zone.queueCells||[];const extra=upgradeAdd(s,'queue');if(!base.length||!extra)return base;
 const a=base.at(-1),b=base.at(-2)||layout(s,w).entrance,d=[a[0]-b[0],a[1]-b[1]],out=[...base];for(let n=1;n<=extra;n++)out.push([a[0]+d[0]*n,a[1]+d[1]*n]);return out;}
const queueLimit=(s,w)=>Math.min(CFG.cafe.queueMax??Infinity,queueCells(s,w).length);
function approach(s,w,sh,c){const {zone,slots}=layout(s,w);const targets=[[1,0],[-1,0],[0,1],[0,-1]].map(([i,j])=>[c.cell[0]+i,c.cell[1]+j]);const target=targets.find(p=>!Object.values(w.sh).some(other=>other!==sh&&(other.target||other.cell)?.join(',')===p.join(','))&&pathfind(zone,slots,sh.cell,p));if(!target)return false;sh.state='approachGuest';sh.phase='approach';sh.cust=c.id;c.with=sh.id;routeTo(s,w,sh,target);return true;}
function startMeeting(s,w,sh,c,ctx){const o=byId(s,sh.id);
 // 갱신 100: the shiba shows one learned trick — a random learned one, independent of the request
 const learned=CFG.tricks.filter(t=>o.tricks[t.id]>0).map(t=>t.id);const req=c.request;
 const shown=learned.length?pick(w.r,learned):null;
 const score=meetingScore(o,shown?o.tricks[shown]:0);c.score=isUnset(c.score)||isUnset(score)?null:c.score+score;c.met.push(o.id);c.with=o.id;
 if(req&&!c.fulfilled&&((req.type==='meetShiba'&&req.shibaId===o.id)||(req.type==='seeTrick'&&shown===req.trick)))c.fulfilled=true;
 c.activity='play';sh.state='play';sh.phase='meet';sh.t=CFG.visit.meetSec;sh.cust=c.id;w.events.push({type:'meet',shibaId:o.id,custId:c.id,trick:shown,fulfilled:c.fulfilled});}
function endMeeting(w,sh){const c=w.custs.find(c=>c.id===sh.cust);if(c&&c.with===sh.id){c.with=null;c.activity='interact';}sh.state='wander';sh.phase='roam';sh.t=0;sh.roamT=CFG.visit.roamSec;sh.cust=null;sh.route=null;sh.target=null;}
function managerCanFulfil(s,c){const q=c.request;if(!q)return false;const working=s.shibas.filter(o=>canWork(s,o));
 return q.type==='meetShiba'?working.some(o=>o.id===q.shibaId):q.type==='seeTrick'?working.some(o=>o.tricks[q.trick]>0):false;} // 갱신 118: 인테리어·진상 요구는 못 함
function leave(s,w,c,ctx){const V=CFG.visit,E=CFG.cafeExp;let outcome,repD=0,exp=0,byManager=false;
 if(c.fulfilled){outcome='satisfied';repD=satisfiedGain(s.cafe.rep,CFG.requests.metRep);exp=E.custSatisfied;} // price unchanged: the order was fixed at sit
 else if(managerActive(s,ctx.now)&&managerCanFulfil(s,c)&&w.r()<CFG.requests.managerChance){outcome='satisfied';byManager=true;repD=satisfiedGain(s.cafe.rep,CFG.rep.satisfied*CFG.requests.managerRepMul);exp=0;}
 else if(!isUnset(c.score)&&c.score<V.scoreDisappointedBelow){outcome='disappointed';repD=!c.met.length&&s.cafe.level<CFG.rep.unmetFreeBelowLevel?0:CFG.rep.disappointed;exp=E.custDisappointed;} // starting value 2026-10-14: unmet guests cost no reputation below café Lv5
 else{outcome='normal';repD=CFG.rep.normal;exp=E.custNormal;}
 const order=c.order||chooseOrder(s,outcome==='satisfied',w.r);const pay=payFor(s,c.met,order,ctx.now);recordPayment(s,pay,ctx.now,ctx);
 s.stats.served++;s.stats[outcome]++;addCafeExp(s,exp);w.lastPay={...pay,order:order.id,orderImg:order.img,outcome,met:[...c.met]};
 w.events.push({type:'leave',id:c.id,outcome,coins:pay.total,order:order.id,orderImg:order.img,byManager,requestMet:outcome==='satisfied',metShiba:c.met.length>0,seat:c.seat,cell:c.cell&&[...c.cell]});
 w.recent.push({id:c.id,order:order.id,coins:pay.total,pending:pay.pending});w.recent=w.recent.slice(-3);c.phase='exiting';routeTo(s,w,c,layout(s,w).entrance);if(repD)addRep(s,repD,{...ctx,world:w});}
// one step of everything that runs with time (online, or fast-forwarded while the app was closed)
export function tick(s,w,dt,now,ctx={}){ctx={...ctx,now};settleLedger(s,now);syncRoutes(s,w);w.t+=dt;const C=s.cafe;
 for(const c of [...w.custs])if(c.phase==='entering'&&c.route===null){w.custs=w.custs.filter(x=>x!==c);if(!seat(s,w,c)){c.phase='queue';c.t=CFG.navigation.queueWaitSec;c.seat=null;w.queue.push(c);}}

 const dev=settleMenuDev(s,now);if(dev)w.events.push({type:'menuDone',id:dev}); // 갱신 136: real time, also while closed
 if(C.closed){releaseHospital(s,now);decayGauges(s,dt,true,now);return w;} // 126-3: 휴무 중엔 배고픔만 (속도 UNSET → 변화 없음)
 const wr=tickWalk(s,now,w.r);if(wr)w.events.push({type:'walk',...wr});
 tickHealth(s,now);decayGauges(s,dt,false,now);
 // 얼룩: 배치되어 카페에 있는 시바 1마리당 2시간마다 1개
 const present=s.shibas.filter(o=>o.placed&&statusOf(s,o)!=='walking').length;const St=CFG.stains;
 C.stainAcc+=dt*present;while(C.stainAcc>=St.everySecPerShiba){C.stainAcc-=St.everySecPerShiba;C.stains++;w.events.push({type:'stain'});}
 if(managerActive(s,now)){C.managerCleanAcc+=dt;while(C.managerCleanAcc>=CFG.alba.manager.cleanEverySec){C.managerCleanAcc-=CFG.alba.manager.cleanEverySec;if(C.stains>0)C.stains--;}}else C.managerCleanAcc=0;
 if(C.stains>=St.badAt){C.badStainAcc+=dt;while(C.badStainAcc>=St.badRepEverySec&&!C.closed){C.badStainAcc-=St.badRepEverySec;addRep(s,St.badRep,{...ctx,world:w});}}else C.badStainAcc=0;
 if(C.closed)return w;
 // 갱신 106: 1시간마다 50 쪽으로 1점
 C.driftAcc+=dt;while(C.driftAcc>=3600){C.driftAcc-=3600;const d=CFG.rep.driftTo-C.rep;if(d)C.rep+=Math.sign(d)*Math.min(Math.abs(d),CFG.rep.driftPerHour);}
 // customers
 w.spawnT-=dt;while(w.spawnT<=0){w.spawnT+=arrivalInterval(s);spawn(s,w,now);}
 for(const c of [...w.queue]){c.t-=dt;if(c.t<0){w.queue=w.queue.filter(x=>x!==c);s.stats.angry++;w.events.push({type:'angry',id:c.id,cell:c.cell&&[...c.cell]});addRep(s,CFG.navigation.queueReputation,{...ctx,world:w});if(C.closed)return w;}} // answer 똑또기 2026-10-14: timeout leaves, reputation unchanged
 for(const c of [...w.custs]){
  if(c.phase==='exiting'){if(moveCell(c,dt,CFG.navigation.cellStepSec)){w.custs=w.custs.filter(x=>x!==c);w.events.push({type:'exit',id:c.id});}continue;}
  if(c.phase==='entering'){if(moveCell(c,dt,CFG.navigation.cellStepSec)){c.phase='seated';c.activity='eat';c.eatRemaining=behaviour(w).eatSec;c.order=chooseOrder(s,false,w.r);linkTable(s,w,c);w.events.push({type:'seat',id:c.id},{type:'order',id:c.id,order:c.order.id,orderImg:c.order.img,cell:[...c.cell]},{type:'serve',id:c.id,order:c.order.id});}continue;}
  const eating=c.activity==='eat'&&Number.isFinite(c.eatRemaining);if(eating){c.eatRemaining-=dt;if(c.eatRemaining<=0)c.activity='interact';}c.t-=dt;
  // starting value 똑또기 2026-10-14: the visit may run past stayingSec while eating (finite eatSec) or playing; eatSec null keeps the plain 30 s visit
  if(c.t<=0&&(c.activity==='play'||c.activity==='eat'&&Number.isFinite(c.eatRemaining)))continue;
  if(c.t<=0){if(c.with!=null&&w.sh[c.with])endMeeting(w,w.sh[c.with]);leave(s,w,c,ctx);if(C.closed)return w;}}
 while(w.queue.length){if(!seat(s,w,w.queue[0]))break;w.queue.shift();}
 // shibas: starting value 2026-10-14 (pending user confirm): 손님 곁 visit.meetSec 5초 → roamSec 3초 돌아다님 → 다시
 const work=new Set(s.shibas.filter(o=>canWork(s,o)).map(o=>o.id));
 for(const id of Object.keys(w.sh).map(Number))if(!work.has(id)){const sh=w.sh[id];if(sh.phase==='meet'||sh.phase==='approach')endMeeting(w,sh);delete w.sh[id];}
 for(const id of work)if(!w.sh[id])w.sh[id]={id,phase:'roam',state:'wander',facing:0,t:0,cust:null,cell:layout(s,w).entrance&&[...layout(s,w).entrance]};
 // 139-1·139-2: 카페 근무 1시간마다 발바닥 1 (매니저가 운영하는 시간 포함, 오프라인 12시간 정산 안에서)
 for(const id of work){const o=byId(s,id);o.workAcc=(o.workAcc||0)+dt;while(o.workAcc>=3600){o.workAcc-=3600;addPaws(o,CFG.activityPaws.cafeWorkHour);}}
 for(const sh of Object.values(w.sh)){if(Number.isFinite(sh.t))sh.t-=dt;if(Number.isFinite(sh.roamT))sh.roamT-=dt;
  if(sh.phase==='approach'){const c=w.custs.find(c=>c.id===sh.cust&&c.phase==='seated');if(!c){endMeeting(w,sh);continue;}if(moveCell(sh,dt,CFG.navigation.shibaCellStepSec)){faceCell(sh,c.cell);startMeeting(s,w,sh,c,ctx);}continue;}
  if(sh.phase==='meet'&&sh.t<=0)endMeeting(w,sh);
  if(sh.phase==='meet'){sh.state='play';continue;}
  const B=behaviour(w);if(!behaviourReady(B))continue; // any null odds/duration keeps the shiba still (manual delivery still works)
  // starting value 똑또기 2026-10-14: after roamSec the shiba seeks a guest who has finished eating and has no shiba
  // (guests who have met the fewest shibas first, so one shiba spreads its visits)
  if(!(sh.roamT>0)&&w.custs.filter(c=>c.phase==='seated'&&c.activity!=='eat'&&c.with==null&&c.t>0).sort((a,b)=>(a.met?.length||0)-(b.met?.length||0)).some(c=>approach(s,w,sh,c)))continue;
  if(sh.state==='walk'&&sh.route?.length){moveCell(sh,dt,CFG.navigation.shibaCellStepSec);continue;}
  if(sh.t>0)continue;
  sh.state=weightedState(w,B.weights);sh.route=null;sh.target=null;
  if(sh.state!=='walk'){sh.t=B.durations[sh.state];continue;}
  // walk 2–4 cells: a reachable cell exactly n steps away, else any within the range; boxed in → pick again next tick
  const {zone,slots}=layout(s,w),[lo,hi]=B.walkCells,n=lo+Math.floor(w.r()*(hi-lo+1)),near=[];
  for(let i=0;i<zone.cols;i++)for(let j=0;j<zone.rows;j++){const len=pathfind(zone,slots,sh.cell,[i,j])?.length;if(len>=lo&&len<=hi)near.push({cell:[i,j],len});}
  const exact=near.filter(x=>x.len===n),list=exact.length?exact:near;if(list.length)routeTo(s,w,sh,pick(w.r,list).cell);else sh.state='wander';sh.t=0;
 }
 const qc=queueCells(s,w);for(let n=0;n<w.queue.length;n++){const c=w.queue[n],cell=qc[n];if(cell){if(c.queueTarget?.join(',')!==cell.join(',')){c.queueTarget=[...cell];c.route=[];const direction=Math.sign(cell[1]-c.cell[1]);for(let j=c.cell[1]+direction;direction&&j!==cell[1]+direction;j+=direction)c.route.push([cell[0],j]);c.moveAcc=0;}moveCell(c,dt,CFG.navigation.cellStepSec);}}

 return w;}
// 갱신 105: a roaming shiba (not with a guest) can be brought straight to a chosen guest → normal 7-second meeting
export function deliverCheck(s,w,shibaId,custId){const sh=w.sh[shibaId];if(!sh)return 'notWorking';if(sh.phase==='meet'||sh.phase==='approach')return 'busy';const c=w.custs.find(c=>c.id===custId);if(!c||c.phase!=='seated')return 'cust';if(c.with!=null)return 'custBusy';return null;}
export function deliver(s,w,shibaId,custId,now=Date.now()){if(deliverCheck(s,w,shibaId,custId))return false;return approach(s,w,w.sh[shibaId],w.custs.find(c=>c.id===custId));}
function decayGauges(s,dt,closed,now){const D=CFG.decayPerHour;for(const sh of s.shibas){const placed=sh.placed&&!closed;
 for(const k of CFG.gauges){if(closed&&k!=='full')continue;const rate=D[k];if(isUnset(sh.g[k])||isUnset(rate)||sh.status==='hospital')continue;
  let m=placed?1:CFG.homeDecayMul;if(k==='dirt'&&placed){if(s.cafe.stains>=CFG.stains.badAt)m*=CFG.stains.badDirtMul;else if(s.cafe.stains>=CFG.stains.warnAt)m*=CFG.stains.warnDirtMul;}
  const sign=k==='dirt'||k==='fatigue'||k==='boredom'?1:-1;sh.g[k]=clamp(sh.g[k]+sign*rate*m*dt/3600,0,100);}updateZero(sh,closed?s.cafe.closedAt:now);}}

// fast-forward from `from` to `to` (both ms). Café income runs for at most offline.capHours (갱신 56); timed things (walk end, hospital,
// hearts) still settle at `to`. `offline` turns on the 임시휴무 rule (126).
export function fastForward(s,w,from,to,{offline=true}={}){const step=CFG.offline.stepSec,end=Math.min(to,from+CFG.offline.capHours*H);
 const c0=s.coins+s.coinFrac,r0=s.cafe.rep,st0={...s.stats};let t=from;
 while(t<end&&!s.cafe.closed){const dt=Math.min(step,(end-t)/1000);t+=dt*1000;tick(s,w,dt,t,{offline});w.events.length=0;}
 if(t<to){if(s.walk)tickWalk(s,to,w.r);settleMenuDev(s,to);if(s.cafe.closed)releaseHospital(s,to);else tickHealth(s,to);} // 126-4: 휴무 중엔 앓아눕기·방치 시계가 멈춤
 settleHearts(s,to);
 return {sec:Math.round((to-from)/1000),simSec:Math.round((Math.min(t,end)-from)/1000),coins:isUnset(s.coins)?null:Math.floor(s.coins+s.coinFrac-c0),repFrom:r0,repTo:s.cafe.rep,
  served:s.stats.served-st0.served,closed:s.cafe.closed,closedAt:s.cafe.closedAt};}

// ───────────────────────── save / load ─────────────────────────
export function save(storage,s,now=Date.now()){settleLedger(s,now);s.lastSeen=now;storage.setItem(CFG.saveKey,JSON.stringify(s));}
// v3 uses its own save key; v1/v2 saves (grades, old currencies) are left untouched and not migrated (spec v3 abolished their model).
export function load(storage,now=Date.now(),r=Math.random){let s=null;try{s=JSON.parse(storage.getItem(CFG.saveKey));}catch{}
 if(!s||s.v!==CFG.saveVersion)return {state:newState(now),fresh:true,offline:null,reopened:null};
 const d=newState(now);s={...d,...s,items:{...d.items,...s.items},cafe:{...d.cafe,...s.cafe},upgrades:{...d.upgrades,...s.upgrades},stats:{...d.stats,...s.stats},settings:{...d.settings,...s.settings}};
 s.space=restoreSpace(s.space);s.placement=restorePlacement(s.placement,zonesForSpace(s.space)[0]);
 if(s.cafe.floor===2&&!s.space.floor2Unlocked)s.cafe.floor=1;
 s.menus=(s.menus||[]).filter(id=>menuItem(id));if(s.menuDev&&!menuItem(s.menuDev.id))s.menuDev=null;
 // older v3 saves: bandana ids named after guessed colours → neutral sheet-cell ids (same position)
 const B=CFG.accessory.bandana,cellId=id=>{const m=/^bandana-(\w+)-(\w+)$/.exec(id||'');const i=m?B.legacyColorIds.indexOf(m[2]):-1;return i<0?id:`bandana-${m[1]}-${B.colors[i]}`;};
 const inv={};for(const [k,n] of Object.entries(s.accInv||{})){const k2=cellId(k);inv[k2]=(inv[k2]||0)+n;}s.accInv=inv;for(const sh of s.shibas)if(sh.acc)sh.acc=cellId(sh.acc);
 // older v3 saves: 90's level slots → 139-6 one slot (the first shiba is the starter)
 for(const sh of s.shibas){if(!('accUnlocked' in sh)){sh.starter=sh.id===Math.min(...s.shibas.map(o=>o.id));sh.accUnlocked=sh.starter;sh.acc=sh.starter?starterItem():null;delete sh.accessories;}}let offline=null;if(s.started&&now>s.lastSeen){const w=newWorld(s,r);offline=fastForward(s,w,s.lastSeen,now,{offline:true});}
 settleLedger(s,now);const reopened=reopenCafe(s,now);s.lastSeen=now;return {state:s,fresh:false,offline,reopened};}

// ───────────────────────── UNSET-gated features (stubs) ─────────────────────────
export function slotUnlockCheck(){return isUnset(CFG.cafe.paidSlotUnlockDia)?'unset':'payment';}
export const regularsCheck=()=>isUnset(CFG.stub.regulars.population)?'unset':'stub'; // 갱신 102·108·122: '같은 손님' 개체 수 UNSET
// 갱신 116 potions (bought with 다이아 only — stub shop); using one you own works
export function usePotion(s,id,kind,gauge,now=Date.now()){const sh=byId(s,id),k=kind==='big'?'potionBig':'potionSmall';if(!sh||!(s.items[k]>0))return false;
 if(kind==='big'){Object.assign(sh.g,CFG.gaugeFull);}else{if(!CFG.gauges.includes(gauge))return false;sh.g[gauge]=CFG.gaugeFull[gauge];}
 s.items[k]--;updateZero(sh,now);return true;} // 116 보완: 지능·재주·친밀도·레벨에는 영향 없음

// Unit 3: all unlock transactions are gated by the actual configured cost.
export function spaceUnlockCheck(s,kind,id){
 const space=s.space,theme=CFG.themes.find(t=>t.id===id);
 if(!['row','floor2','theme'].includes(kind)||kind==='theme'&&!theme)return 'invalid';
 if(kind==='floor2'&&space.floor2Unlocked||kind==='theme'&&(!theme.locked||space.themes.includes(id)))return 'owned';
 const cost=kind==='row'?CFG.expansion.rowCost:kind==='floor2'?CFG.cafe.expansion2FCost:theme.unlockCost;
 if(!Number.isFinite(cost)||cost<=0)return 'unset';
 const level=kind==='floor2'?CFG.cafe.expansion2FLevel:kind==='theme'?theme.unlockLevel:null; // 밸런스_2년.md §3 'Lv N부터' (starting values)
 if(Number.isFinite(level)&&s.cafe.level<level)return 'locked';
 if(!Number.isFinite(s.coins)||s.coins<cost)return 'coins';
 return null;
}
export function unlockSpace(s,kind,id){
 if(spaceUnlockCheck(s,kind,id))return false;
 const cost=kind==='row'?CFG.expansion.rowCost:kind==='floor2'?CFG.cafe.expansion2FCost:CFG.themes.find(t=>t.id===id).unlockCost;
 s.coins-=cost;
 if(kind==='row')s.space.unlockedRows++;
 else if(kind==='floor2')s.space.floor2Unlocked=true;
 else s.space.themes.push(id);
 return true;
}
export function switchFloor(s,floor){if(floor!==1&&floor!==2||floor===2&&!s.space.floor2Unlocked)return false;s.cafe.floor=floor;return true;}

// Integration budget is engine metadata: remaining elapsed time stays queued, never discarded.
export function consumeElapsed(s,w,elapsedSec,now,{maxSteps=240,offline=false}={}){
 if(!Number.isFinite(elapsedSec)||elapsedSec<0)return 0;w.elapsedDebt=(w.elapsedDebt||0)+elapsedSec;let steps=0,used=0;
 while(w.elapsedDebt>1e-9&&steps++<maxSteps){const dt=Math.min(CFG.offline.stepSec,w.elapsedDebt);w.elapsedDebt-=dt;used+=dt;tick(s,w,dt,now-w.elapsedDebt*1000,{offline});}return used;
}

function behaviour(w){return w.behaviour||CFG.behaviour;}
function weightedState(w,weights){let n=w.r()*Object.values(weights).reduce((a,b)=>a+b,0);for(const [state,weight] of Object.entries(weights)){n-=weight;if(n<0)return state;}return 'lookAround';}
// every state that can be drawn needs its duration (walk: its cell range); otherwise autonomous behaviour stays gated
export function behaviourReady(B){const W=B?.weights,ws=W?Object.values(W):[];if(!ws.length||!ws.every(Number.isFinite)||!(ws.reduce((a,b)=>a+b,0)>0))return false;
 return Object.entries(W).every(([k,v])=>!(v>0)||(k==='walk'?Array.isArray(B.walkCells)&&B.walkCells.every(Number.isInteger)&&B.walkCells[0]>=1&&B.walkCells[0]<=B.walkCells[1]:Number.isFinite(B.durations?.[k])));}
