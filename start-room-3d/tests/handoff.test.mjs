// Acceptance tests for handoff-v1 (D-01 … D-13). Run: node tests/handoff.test.mjs (from start-room-3d/)
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {CFG} from '../config.js';
import * as S from '../sim.js';
import {STR,makeT,LANGS} from '../i18n.js';
import * as H from '../healing.js';
const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');
const mem=()=>({d:{},getItem(k){return this.d[k]??null},setItem(k,v){this.d[k]=v}});
const results=[];
const KEY0=CFG.saveKey;
function guarded(fn){const snap=JSON.stringify({F:CFG.FEATURES,T:CFG.TEMP});try{return fn();}finally{const o=JSON.parse(snap);Object.assign(CFG.FEATURES,o.F);Object.assign(CFG.TEMP,o.T);CFG.saveKey=KEY0;}}
function test(name,fn){try{guarded(fn);results.push(['ok',name]);}catch(e){results.push(['FAIL',name,e]);}}
// known-fail criterion: fn returns {met, info}. Not met → reported as BLOCKED (does not fail the run, never shown as ok).
// Met → FAIL, so the stale known-fail mark gets removed instead of hiding a pass.
function knownFail(name,why,fn){try{const r=guarded(fn);results.push(r.met?['FAIL',name,Error('criterion is now met — remove the known-fail mark: '+r.info)]:['BLOCKED',name,null,why+' · '+r.info]);}catch(e){results.push(['FAIL',name,e]);}}

// ---------- D-01 ----------
test('D-01 S rate is 2% ±0.1%p over 100,000 rolls; N/R stay null (no invented split)',()=>{
 assert.equal(CFG.gacha.rates.S,.02);assert.equal(CFG.gacha.rates.N,null);assert.equal(CFG.gacha.rates.R,null);
 const r=S.rng(12345);let s=0;const n=100000;for(let i=0;i<n;i++)if(S.rollGrade(r)==='S')s++;
 assert.ok(Math.abs(s/n-.02)<=.001,'S ratio '+s/n);});
test('D-01 with N/R undecided the pull is blocked; TEMP switch maps non-S to N only',()=>{
 const st=S.newState(0);assert.equal(S.gachaReady(),false);assert.equal(S.pull(st,S.rng(1)),null);assert.equal(st.gachaPulls,0);
 CFG.TEMP.gachaNonSAsN=true;const r=S.rng(9);const seen=new Set();const st2=S.newState(0);st2.paws=1e6;
 for(let i=0;i<3000;i++)seen.add(S.pull(st2,r).grade);assert.deepEqual([...seen].sort(),['N','S']);});
test('D-01 TEMP: no R is ever pulled (R rate null → not invented), by paws, capsule or first free pull; R appears only via level',()=>{
 CFG.TEMP.gachaNonSAsN=true;const st=S.newState(0);st.paws=1e6;st.items.capsule=500;const r=S.rng(77);const got={N:0,R:0,S:0};
 for(let i=0;i<3000;i++){const o=S.pull(st,r,{capsule:i<500});got[o.grade]++;assert.equal(S.gradeOf(o.lv),o.grade);}
 assert.equal(got.R,0,'R pulls '+got.R);assert.ok(got.N>0&&got.S>0);assert.equal(st.items.capsule,0);
 assert.equal(S.rollGrade(()=>CFG.gacha.rates.S),'N','first non-S roll is N, not R');CFG.TEMP.gachaNonSAsN=false;assert.equal(S.rollGrade(()=>CFG.gacha.rates.S),null);
 assert.equal(S.gradeOf(S.startLevel('R')),'R');});
test('D-01 no "SR" grade label left in code',()=>{
 const files=readdirSync(ROOT).filter(f=>/\.(js|mjs|html)$/.test(f));const hits=[];
 for(const f of files)readFileSync(join(ROOT,f),'utf8').split('\n').forEach((l,i)=>{const m=l.match(/(['"`])SR\1|\.SR\b|\bSR\s*:/g);if(m)hits.push(`${f}: ${l.trim().slice(0,60)}`);});
 assert.equal(hits.length,0,'SR hits '+hits);});
test('D-01 old save with SR: level kept, grade from level, re-saved JSON has no SR / rarity',()=>{
 const m=mem();m.setItem(CFG.saveKey,JSON.stringify({v:1,coins:1,hearts:0,paws:0,lastSeen:0,owned:[{id:1,coat:'red',expr:'red_smile',lv:3,rarity:'SR'},{id:2,coat:'kuro',expr:'kuro_calm',lv:1,rarity:'R'},{id:3,coat:'white',expr:'white_smile',lv:2,rarity:'N'}],nextId:4}));
 const {state}=S.load(m,1000);assert.deepEqual(state.owned.map(o=>[S.gradeOf(o.lv),o.lv]),[['N',3],['N',1],['N',2]]);
 S.save(m,state,1000);const raw=m.getItem(CFG.saveKey);assert.ok(!raw.includes('SR')&&!raw.includes('rarity'),raw);});
test('D-01 result-card CSS: N colourless, R blue, S gold; no ★/레어 prefix in card markup',()=>{
 const html=readFileSync(join(ROOT,'index.html'),'utf8'),ui=readFileSync(join(ROOT,'ui.js'),'utf8');
 assert.match(html,/\.rc\.N\{border-color:#e4e4e4;background:#fff\}/);assert.match(html,/\.rc\.R\{border-color:#6f9fd6/);assert.match(html,/\.rc\.S\{border:4px double #d4a437/);
 assert.ok(!ui.includes('★ ★ ★')&&!ui.includes("'레어 '"));});

// ---------- D-02 ----------
test('D-02 gradeOf bands, promotion boundaries and Lv 30 cap',()=>{
 assert.equal(S.gradeOf(1),'N');assert.equal(S.gradeOf(10),'N');assert.equal(S.gradeOf(11),'R');assert.equal(S.gradeOf(20),'R');assert.equal(S.gradeOf(21),'S');assert.equal(S.gradeOf(30),'S');
 assert.deepEqual(['N','R','S'].map(S.startLevel),[1,11,21]);
 const st=S.newState(0);st.owned[0].lv=99;const m=mem();S.save(m,st,0);assert.equal(JSON.parse(m.getItem(CFG.saveKey)).owned[0].lv,30);
 assert.ok(!('rarity' in st.owned[0])&&!('grade' in st.owned[0]));});
test('D-02 pulls start at band start level',()=>{
 CFG.TEMP.gachaNonSAsN=true;const st=S.newState(0);st.paws=1e6;const r=S.rng(4);
 for(let i=0;i<2000;i++){const o=S.pull(st,r);assert.equal(o.lv,S.startLevel(o.grade));}});
test('D-02 migration keeps the stored level (no remapping), drops rarity, grade from level',()=>{
 const st=S.migrate({v:1,owned:[{id:1,coat:'red',expr:'red_smile',lv:15,rarity:'R'},{id:2,coat:'red',expr:'red_wink',lv:1,rarity:'N'},{id:3,coat:'kuro',expr:'kuro_calm',lv:4,rarity:'SR'}]});
 assert.deepEqual(st.owned.map(o=>o.lv),[15,1,4]);assert.deepEqual(st.owned.map(o=>S.gradeOf(o.lv)),['R','N','N']);assert.ok(st.owned.every(o=>!('rarity' in o)&&!('grade' in o)));});
test('D-02 migration boundaries: band edges unchanged, only the Lv30 cap clamps',()=>{const B=CFG.grades.bands,cap=CFG.grades.maxLevel;
 const lv=[B.N[0],B.N[1],B.R[0],B.R[1],B.S[0],B.S[1],cap+1,0,-3,'7',null,undefined,NaN,2.9];
 const st=S.migrate({v:1,owned:lv.map((l,i)=>({id:i+1,coat:'red',expr:'red_smile',lv:l,rarity:'SR'}))});
 assert.deepEqual(st.owned.map(o=>o.lv),[B.N[0],B.N[1],B.R[0],B.R[1],B.S[0],B.S[1],cap,1,1,7,1,1,1,2]);
 assert.deepEqual(st.owned.slice(0,6).map(o=>S.gradeOf(o.lv)),['N','N','R','R','S','S']);});
test('D-02 migration is idempotent; already-v2 saves are not touched',()=>{
 const v1=()=>({v:1,lastSeen:0,owned:[{id:1,coat:'red',expr:'red_smile',lv:12,rarity:'N'},{id:2,coat:'white',expr:'white_smile',lv:31,rarity:'SR'}]});
 const once=S.migrate(v1(),5),twice=S.migrate(JSON.parse(JSON.stringify(once)),99);assert.deepEqual(twice,once);assert.equal(once.v,2);
 const m=mem();m.setItem(CFG.saveKey,JSON.stringify(v1()));const a=S.load(m,1000).state;S.save(m,a,1000);const b=S.load(m,2000).state;assert.deepEqual(b.owned,a.owned);assert.deepEqual(a.owned.map(o=>o.lv),[12,30]);});
test('D-02 the original pre-migration save is kept under a backup key (written once)',()=>{
 const m=mem();const raw=JSON.stringify({v:1,coins:7,hearts:0,paws:0,lastSeen:0,owned:[{id:1,coat:'red',expr:'red_smile',lv:3,rarity:'SR'}],nextId:2});m.setItem(CFG.saveKey,raw);
 const {state}=S.load(m,1000);assert.equal(S.backupKey(1),CFG.saveKey+':backup.v1');assert.equal(m.getItem(S.backupKey(1)),raw,'byte-for-byte copy');
 S.save(m,state,1000);assert.notEqual(m.getItem(CFG.saveKey),raw);S.load(m,2000);assert.equal(m.getItem(S.backupKey(1)),raw,'v2 load does not touch the backup');
 const m2=mem();m2.setItem(CFG.saveKey,JSON.stringify({...S.newState(0)}));S.load(m2,1000);assert.equal(m2.getItem(S.backupKey(1)),null,'no backup for v2 saves');
 const m3=mem();m3.setItem(S.backupKey(1),'older');m3.setItem(CFG.saveKey,raw);S.load(m3,1000);assert.equal(m3.getItem(S.backupKey(1)),'older','existing backup never overwritten');});

// ---------- D-05 ----------
const HOUR=3600e3,MIN=60e3;
test('D-05 hearts 0 → app closed 5 h → 10 (no more)',()=>{const m=mem();const st=S.newState(0);st.hearts=0;S.save(m,st,0);
 const {state}=S.load(m,5*HOUR);assert.equal(state.hearts,10);const again=S.load(m,50*HOUR).state;assert.equal(again.hearts,10);});
test('D-05 regen is 1 per 30 min and stops at 10',()=>{const st=S.newState(0);st.hearts=3;st.heartRegenAt=0;
 S.settleHearts(st,29*MIN);assert.equal(st.hearts,3);S.settleHearts(st,30*MIN);assert.equal(st.hearts,4);S.settleHearts(st,89*MIN);assert.equal(st.hearts,5);
 S.settleHearts(st,100*HOUR);assert.equal(st.hearts,10);assert.equal(S.nextHeartInSec(st,100*HOUR),null);});
test('D-05 hearts 15 stay 15 over time; rewards stack above 10',()=>{const st=S.newState(0);st.hearts=15;S.settleHearts(st,0);S.settleHearts(st,10*HOUR);assert.equal(st.hearts,15);
 const st2=S.newState(0);st2.hearts=9;S.grant(st2,{hearts:5});assert.equal(st2.hearts,14);S.settleHearts(st2,10*HOUR);assert.equal(st2.hearts,14);});
test('D-05 timer restarts when spending drops hearts below 10',()=>{const st=S.newState(0);st.hearts=12;S.settleHearts(st,0);
 assert.ok(S.spendHearts(st,5,HOUR));assert.equal(st.hearts,7);S.settleHearts(st,HOUR+29*MIN);assert.equal(st.hearts,7);S.settleHearts(st,HOUR+30*MIN);assert.equal(st.hearts,8);});
test('D-05 quest "하트 20개 모으기" still reachable (reward hearts are uncapped)',()=>{const st=S.newState(0);st.tut=99;st.hearts=10;S.grant(st,{hearts:10});S.settleHearts(st,HOUR);
 assert.equal(st.hearts,20);assert.ok(S.claimQuest(st,'hearts20'));});

// ---------- D-06 ----------
test('D-06 hearts 3 → use reset → 10, one ticket consumed',()=>{const st=S.newState(0);st.hearts=3;st.items.heartReset=2;
 assert.ok(S.canUseHeartReset(st));assert.ok(S.useHeartReset(st,0));assert.equal(st.hearts,10);assert.equal(st.items.heartReset,1);});
test('D-06 hearts ≥ 10 → disabled, no change, no ticket used',()=>{for(const h of [10,15]){const st=S.newState(0);st.hearts=h;st.items.heartReset=1;
 assert.equal(S.canUseHeartReset(st),false);assert.equal(S.useHeartReset(st,0),false);assert.equal(st.hearts,h);assert.equal(st.items.heartReset,1);}
 const st=S.newState(0);st.hearts=0;st.items.heartReset=0;assert.equal(S.useHeartReset(st,0),false);assert.equal(st.hearts,0);});
test('D-06 bag button is bound to canUseHeartReset (disabled attribute)',()=>{assert.match(readFileSync(join(ROOT,'ui.js'),'utf8'),/id="useReset" \$\{can\?'':'disabled'\}/);});

// ---------- D-03 ----------
const mk=(st,list)=>{st.owned=list.map((x,i)=>({id:100+i,coat:'red',expr:'red_smile',...x}));st.dex=[...new Set(st.owned.map(S.dexKey))];return st;};
test('D-03 merge rule is undecided by default → merge disabled',()=>{assert.equal(CFG.merge.sameKey,null);assert.equal(CFG.merge.mode,null);assert.equal(CFG.merge.playPromotion,null);
 const st=mk(S.newState(0),[{lv:10},{lv:5}]);assert.equal(S.mergeCheck(st,100,101),'undecided');assert.equal(S.merge(st,100,101),null);});
test('D-03 N Lv10 + N Lv5 → R Lv15; afterwards N duplicates cannot merge into it',()=>{CFG.TEMP.mergeHandoffDefaults=true;
 const st=mk(S.newState(0),[{lv:10},{lv:5},{lv:3}]);const r=S.merge(st,100,101);assert.equal(r.to,15);assert.equal(S.gradeOf(r.target.lv),'R');assert.ok(r.promoted);
 assert.equal(S.mergeCheck(st,100,102),'grade');assert.equal(S.mergeCheck(st,102,100),'grade');});
test('D-03 S Lv21 + S Lv21 → Lv30 (not 42)',()=>{CFG.TEMP.mergeHandoffDefaults=true;const st=mk(S.newState(0),[{lv:21},{lv:21}]);assert.equal(S.merge(st,100,101).to,30);});
test('D-03 different grades or different shiba → disabled',()=>{CFG.TEMP.mergeHandoffDefaults=true;const st=mk(S.newState(0),[{lv:5},{lv:12},{lv:5,expr:'red_wink'}]);
 assert.equal(S.mergeCheck(st,100,101),'grade');assert.equal(S.mergeCheck(st,100,102),'notSame');assert.equal(S.mergeCheck(st,100,100),'pick');});
test('D-03 material leaves the cafe list, dex record stays',()=>{CFG.TEMP.mergeHandoffDefaults=true;const st=mk(S.newState(0),[{lv:2},{lv:2,expr:'red_wink'},{lv:4,expr:'red_wink'}]);
 const w=S.newWorld(st,1);assert.equal(w.shibas.length,3);S.merge(st,102,101);S.removeShiba(w,101);
 assert.deepEqual(st.owned.map(o=>o.id),[100,102]);assert.ok(st.dex.includes('red_red_wink'));assert.ok(!w.shibas.some(x=>x.id===101));assert.equal(st.owned[1].lv,6);});

// ---------- D-04 ----------
test('D-04 promotion queued once on 10→11 / 20→21 only when allowed; never for gacha',()=>{
 const st=mk(S.newState(0),[{lv:10},{lv:20},{lv:5}]);
 S.setLevel(st,st.owned[0],11,'levelup');S.setLevel(st,st.owned[1],21,'levelup');S.setLevel(st,st.owned[2],6,'levelup');
 assert.deepEqual(st.promoQueue.map(p=>p.from+'>'+p.to),['N>R','R>S']);
 assert.ok(S.takePromotion(st));assert.ok(S.takePromotion(st));assert.equal(S.takePromotion(st),null);
 assert.equal(S.promotionShouldPlay('gacha'),false);
 CFG.TEMP.mergeHandoffDefaults=true;const st2=mk(S.newState(0),[{lv:10},{lv:5}]);S.merge(st2,100,101);assert.equal(st2.promoQueue.length,0,'merge.playPromotion undecided → no replay');
 assert.equal(CFG.promotion.videoAsset,null);assert.equal(CFG.FEATURES.promotionCard,false);});
test('D-04 card timeline: 0.3 zoom → 0.5 border → badge → 1 s expression, ≈2.5 s total',()=>{
 assert.equal(S.promoPhase(.1).phase,'zoom');assert.equal(S.promoPhase(.5).phase,'border');assert.equal(S.promoPhase(1).phase,'badge');assert.equal(S.promoPhase(2).phase,'expr');assert.equal(S.promoPhase(2.51).phase,'done');});

// ---------- D-07 ----------
const DAY=86400e3;
test('D-07 dayMode undecided → no day advances, nothing claimable, no crash',()=>{assert.equal(CFG.onboarding.dayMode,null);const st=S.newState(0);
 assert.equal(S.onboardingDay(st),null);for(let d=1;d<=28;d++){assert.notEqual(S.onboardingStatus(st,d),'claimable');assert.equal(S.claimOnboarding(st,d),null);}});
test('D-07 28 days (TEMP login-days): 7 reset tickets on days 1–7, exactly 19 capsules, each day once',()=>{CFG.TEMP.onboardingLoginDays=true;
 const m=mem();let st=S.newState(0);let resets=0,caps=0;
 for(let d=1;d<=28;d++){if(d>1){S.save(m,st,(d-1)*DAY-1);st=S.load(m,(d-1)*DAY+1000).state;}
  assert.equal(S.onboardingDay(st),d);const r=S.claimOnboarding(st,d);if(r){resets+=r.heartReset||0;caps+=r.capsule||0;if(r.heartReset)assert.ok(d<=7);}
  assert.equal(S.claimOnboarding(st,d),null,'day '+d+' twice');}
 assert.equal(resets,7);assert.equal(caps,19);assert.equal(st.items.heartReset,7);assert.equal(st.items.capsule,19);
 S.save(m,st,40*DAY);st=S.load(m,41*DAY).state;assert.equal(S.onboardingDay(st),28);});
test('D-07 null days show 준비 중 (pending) and never error; day 3 gives its ticket, hearts stay 미정',()=>{CFG.TEMP.onboardingLoginDays=true;
 for(const d of [3,17,26])assert.deepEqual(S.onboardingReward(d).pending,['hearts']);assert.equal(S.onboardingStatus(S.newState(0),17),'pending');assert.equal(S.onboardingStatus(S.newState(0),8),'pending');
 const st=S.newState(0);st.onboarding.visits=['a','b','c'];const h=st.hearts;assert.deepEqual(S.claimOnboarding(st,3),{heartReset:1});assert.equal(st.hearts,h);
 assert.ok(!JSON.stringify(CFG.onboarding).includes('stamp'),'stamps are on hold');});
test('D-07 capsule pull uses normal rates, consumes one capsule, needs gacha rates',()=>{const st=S.newState(0);st.items.capsule=2;st.gachaPulls=1;st.paws=0;
 assert.equal(S.pull(st,S.rng(2),{capsule:true}),null);CFG.TEMP.gachaNonSAsN=true;const o=S.pull(st,S.rng(2),{capsule:true});assert.ok(o);assert.equal(st.items.capsule,1);assert.equal(st.paws,0);});

// ---------- D-08 ----------
test('D-08 cost undecided → walk refused (미정); TEMP allows free walks in test builds',()=>{assert.equal(CFG.walk.heartCost,null);assert.deepEqual(CFG.walk.durationsSec,[600,1200,1800]);
 const st=S.newState(0);assert.equal(S.walkCheck(st,1,600),'costUndecided');assert.equal(S.startWalk(st,1,600,0),null);
 CFG.TEMP.walkFreeWhenCostNull=true;assert.equal(S.walkCheck(st,1,900),'duration');assert.ok(S.startWalk(st,1,600,0));assert.equal(S.walkCheck(st,2,600),'walking');});
test('D-08 10-min walk, app closed, reopened after 11 min → shiba back in cafe, settled exactly once',()=>{CFG.TEMP.walkFreeWhenCostNull=true;
 const m=mem();const st=S.newState(0);const h0=st.hearts;S.startWalk(st,1,600,0);assert.equal(S.walkProgress(st,300e3),.5);S.save(m,st,1000);
 const {state}=S.load(m,11*MIN);assert.equal(state.walk,null);assert.ok(state.owned.some(o=>o.id===1));assert.equal(S.tickWalk(state,12*MIN),null,'no second settlement');
 assert.ok(S.newWorld(state,1).shibas.some(x=>x.id===1),'back in the cafe');assert.equal(state.hearts,h0);
 S.save(m,state,12*MIN);assert.equal(S.load(m,13*MIN).state.walk,null);});
test('D-08 walking shiba leaves income & serving, the others keep working',()=>{CFG.TEMP.walkFreeWhenCostNull=true;const st=S.newState(0);const before=S.incomePerSec(st);
 S.startWalk(st,1,1800,0);assert.ok(S.incomePerSec(st)<before);const w=S.newWorld(st,3);assert.deepEqual(w.shibas.map(x=>x.id),[2]);
 w.spawnT=0;let pets=0;for(let i=0;i<30*90;i++){S.tick(w,st,1/30);for(const e of w.events.splice(0))if(e.type==='pet'){pets++;assert.equal(e.id,2);}}assert.ok(pets>0);});
test('D-08 stop rule undecided → stop refused; TEMP: back at once, no reward/refund',()=>{CFG.TEMP.walkFreeWhenCostNull=true;const st=S.newState(0);S.startWalk(st,1,600,0);
 assert.equal(S.stopWalk(st,1000),null);assert.ok(st.walk);CFG.TEMP.walkStopNoRefund=true;const h=st.hearts;assert.equal(S.stopWalk(st,1000),1);assert.equal(st.walk,null);assert.equal(st.hearts,h);});
test('D-08 heart cost is charged when decided (test-only value injected)',()=>{const old=CFG.walk.heartCost;CFG.walk.heartCost={600:1,1200:2,1800:3};
 try{const st=S.newState(0);st.hearts=2;assert.equal(S.walkCheck(st,1,1800),'hearts');assert.ok(S.startWalk(st,1,1200,0));assert.equal(st.hearts,0);}finally{CFG.walk.heartCost=old;}});

test('D-08 returning walker reappears on a full floor (7 owned): reclaims its slot, the stand-in goes back to reserve',()=>{CFG.TEMP.walkFreeWhenCostNull=true;
 const st=mk(S.newState(0),Array.from({length:7},()=>({lv:1})));const max=CFG.cafe.maxShibas;assert.equal(max,6);const ids=st.owned.map(o=>o.id);
 const w=S.newWorld(st,1);assert.deepEqual(w.shibas.map(x=>x.id),ids.slice(0,6));
 const walker=ids[2],reserve=ids[6];S.startWalk(st,walker,600,0);S.leaveFloor(w,st,walker);
 assert.ok(!w.shibas.some(x=>x.id===walker));assert.ok(w.shibas.some(x=>x.id===reserve),'reserve fills the slot');assert.equal(w.shibas.length,6);
 const r=S.tickWalk(st,601e3);assert.equal(r.returned,walker);S.returnToFloor(w,st,walker);
 assert.ok(w.shibas.some(x=>x.id===walker),'walker back on the floor');assert.ok(!w.shibas.some(x=>x.id===reserve),'stand-in back to reserve');assert.equal(w.shibas.length,6);
 assert.equal(new Set(w.shibas.map(x=>x.id)).size,6);S.returnToFloor(w,st,walker);assert.equal(w.shibas.length,6,'second call is a no-op');
 // walker was the 7th (reserve) shiba itself → still comes back; the floor shiba last in owned order steps out
 const st2=mk(S.newState(0),Array.from({length:7},()=>({lv:1})));const w2=S.newWorld(st2,1);const last=st2.owned[6].id;S.startWalk(st2,last,600,0);S.leaveFloor(w2,st2,last);
 S.tickWalk(st2,601e3);S.returnToFloor(w2,st2,last);assert.ok(w2.shibas.some(x=>x.id===last));assert.ok(!w2.shibas.some(x=>x.id===st2.owned[5].id));assert.equal(w2.shibas.length,6);});
test('D-08 walker returning while the app was closed (7 owned, full floor) is on the floor after load',()=>{CFG.TEMP.walkFreeWhenCostNull=true;
 const st=mk(S.newState(0),Array.from({length:7},()=>({lv:1})));const walker=st.owned[1].id;S.startWalk(st,walker,600,0);const m=mem();S.save(m,st,0);
 const L=S.load(m,HOUR);assert.equal(L.returned,walker);const w=S.newWorld(L.state,1);S.returnToFloor(w,L.state,walker);
 assert.ok(w.shibas.some(x=>x.id===walker));assert.equal(w.shibas.length,CFG.cafe.maxShibas);assert.ok(!w.shibas.some(x=>x.id===L.state.owned[6].id),'reserve stays in reserve');
 // walker 7th in owned order (newWorld leaves it out) → still put on the floor
 const st2=mk(S.newState(0),Array.from({length:7},()=>({lv:1})));const w7=st2.owned[6].id;S.startWalk(st2,w7,600,0);const m2=mem();S.save(m2,st2,0);
 const L2=S.load(m2,HOUR);const w2=S.newWorld(L2.state,1);assert.ok(!w2.shibas.some(x=>x.id===w7));S.returnToFloor(w2,L2.state,L2.returned);assert.ok(w2.shibas.some(x=>x.id===w7));assert.equal(w2.shibas.length,CFG.cafe.maxShibas);});
test('D-08 offline income is split at the walk completion time (10-min walk inside a 1-hour absence)',()=>{CFG.TEMP.walkFreeWhenCostNull=true;
 const st=S.newState(0);S.startWalk(st,1,600,0);const m=mem();S.save(m,st,0);
 const during=S.incomePerSec(st),after=S.incomePerSec({...st,walk:null});assert.ok(after>during);
 const L=S.load(m,HOUR);const walkSec=600,rest=HOUR/1000-walkSec;
 assert.equal(L.offline.coins,Math.floor((walkSec*during+rest*after)*CFG.offline.rate));
 assert.ok(L.offline.coins>Math.floor(HOUR/1000*during*CFG.offline.rate),'walker earns again after returning');
 // walk already over before the app was closed → no split; walk still running at reopen → walker absent the whole time
 const st2=S.newState(0);S.startWalk(st2,1,600,0);st2.lastSeen=0;assert.equal(S.offlineEarnings(st2,5*MIN).coins,Math.floor(300*during*CFG.offline.rate));
 const st3=S.newState(0);S.startWalk(st3,1,600,0);st3.lastSeen=20*MIN;assert.equal(S.offlineEarnings(st3,HOUR+20*MIN).coins,Math.floor(3600*after*CFG.offline.rate));});
test('build mode: only exact temp=1 turns TEMP on, and then saves use a separate :temp key',()=>{
 for(const q of ['','?temp','?temp=','?temp=0','?temp=true','?temp=11','?Temp=1','?xtemp=1']){assert.equal(S.applyBuildMode(q),false,q);assert.ok(Object.values(CFG.TEMP).every(v=>v===false),q);assert.equal(CFG.saveKey,KEY0,q);}
 const m=mem();const ord=S.newState(0);ord.coins=123;S.save(m,ord,0);const before=m.getItem(KEY0);
 assert.equal(S.applyBuildMode('?still=1&seed=7&temp=1'),true);assert.ok(Object.values(CFG.TEMP).every(v=>v===true));assert.equal(CFG.saveKey,KEY0+':temp');
 const L=S.load(m,1000);assert.ok(L.fresh,'TEMP build starts from its own save');L.state.coins=999;S.save(m,L.state,2000);
 assert.equal(m.getItem(KEY0),before,'ordinary save untouched');assert.equal(JSON.parse(m.getItem(KEY0+':temp')).coins,999);
 const main=readFileSync(join(ROOT,'main.js'),'utf8');assert.ok(main.includes('S.applyBuildMode(location.search)')&&!/Q\.has\('temp'\)/.test(main),'main.js uses applyBuildMode');});

// ---------- D-09 ----------
test('D-09 off by default: fatigue has no effect',()=>{assert.equal(CFG.FEATURES.fatigue,false);const st=S.newState(0);S.setFatigue(st,1,1);
 assert.equal(S.fatigueState(st,1),'normal');assert.ok(S.canPlay(st,1));CFG.TEMP.walkFreeWhenCostNull=true;assert.equal(S.walkCheck(st,1,600),null);
 const w=S.newWorld(st,3);for(let i=0;i<300;i++)S.tick(w,st,1/30);assert.ok(w.shibas.every(x=>x.phase!=='sleep'));});
test('D-09 debug: fatigue 100% → sleeping, walk & play disabled; values stay null',()=>{CFG.FEATURES.fatigue=true;CFG.TEMP.walkFreeWhenCostNull=true;
 for(const v of Object.values(CFG.walk.fatigue))assert.equal(v,null);const st=S.newState(0);S.setFatigue(st,1,1);
 assert.equal(S.fatigueState(st,1),'sleep');assert.equal(S.canPlay(st,1),false);assert.equal(S.walkCheck(st,1,600),'fatigue');
 const w=S.newWorld(st,3);for(let i=0;i<60;i++)S.tick(w,st,1/30);assert.equal(w.shibas.find(x=>x.id===1).phase,'sleep');
 assert.equal(S.feedSnack(st,1),false,'snack amount 미정');S.sleepRecover(st,3600);assert.equal(S.fatigueOf(st,1),1,'sleep rate 미정');
 S.setFatigue(st,1,0);for(let i=0;i<5;i++)S.tick(w,st,1/30);assert.notEqual(w.shibas.find(x=>x.id===1).phase,'sleep');});

// ---------- D-10 ----------
test('D-10 off by default / chance null → never happens',()=>{CFG.TEMP.walkFreeWhenCostNull=true;assert.equal(CFG.FEATURES.rescue,false);assert.equal(CFG.walk.rescue.chance,null);
 for(const on of [false,true]){CFG.FEATURES.rescue=on;const st=S.newState(0);const n=st.owned.length;for(let i=0;i<200;i++){S.startWalk(st,1,600,i*DAY,S.rng(i+1));S.tickWalk(st,i*DAY+601e3);}
  assert.equal(st.owned.length,n);assert.equal(st.rescueQueue.length,0);}});
test('D-10 debug chance 1: rescue during the walk, batched on next launch; grade then level-in-band, 4 coats',()=>{CFG.FEATURES.rescue=true;CFG.TEMP.walkFreeWhenCostNull=true;
 const R=CFG.walk.rescue,old={...R};Object.assign(R,{chance:1,gradeWeights:{N:1,R:1,S:1},levelDist:'uniform'});
 try{const st=S.newState(0);S.startWalk(st,1,1800,0,S.rng(3));const at=st.walk.rescue.at;assert.ok(at>=0&&at<=1800e3);
  assert.equal(S.tickWalk(st,at-1),null);const r=S.tickWalk(st,at);assert.ok(r.rescued&&!r.returned,'shown while walking');assert.equal(st.rescueQueue.length,1);
  const m=mem();const st2=S.newState(0);S.startWalk(st2,2,600,0,S.rng(8));S.save(m,st2,1);const L=S.load(m,700e3).state;assert.equal(L.rescueQueue.length,1);assert.equal(L.walk,null);
  const seen={N:0,R:0,S:0},coats=new Set();const rr=S.rng(77);for(let i=0;i<3000;i++){const o=S.rescueShiba(rr);const g=S.gradeOf(o.lv);seen[g]++;coats.add(o.coat);
   const [a,b]=CFG.grades.bands[g];assert.ok(o.lv>=a&&o.lv<=b);}assert.ok(seen.N&&seen.R&&seen.S);assert.equal(coats.size,4);
  R.gradeWeights=null;assert.equal(S.rescueShiba(S.rng(1)),null,'grade odds 미정 → none');}finally{Object.assign(R,old);}});

// ---------- D-11 ----------
test('D-11 every L(key) used in ui.js exists in ko and en; ko/en key sets match',()=>{const ui=readFileSync(join(ROOT,'ui.js'),'utf8');
 const keys=new Set([...ui.matchAll(/\bL\('([a-z0-9_.]+)'/g)].map(m=>m[1]).filter(k=>!k.endsWith('.'))); // prefix keys are expanded below
 for(const r of ['undecided','mode','pick','busy','notSame','grade'])keys.add('merge.'+r);for(const r of ['walking','fatigue','costUndecided','hearts'])keys.add('walk.why.'+r);for(const k of readFileSync(join(ROOT,'index.html'),'utf8').matchAll(/data-i18n="([^"]+)"/g))keys.add(k[1]);
 for(const q of CFG.quests)keys.add('quest.'+q.id);CFG.tutorial.forEach((_,i)=>keys.add('tut.'+i));for(const t of CFG.themes)keys.add(t.nameKey);for(const c of Object.keys(CFG.coats))keys.add('shiba.breed.'+c);
 const missing=[...keys].filter(k=>!(k in STR.ko)||!(k in STR.en));assert.deepEqual(missing,[]);
 assert.deepEqual(Object.keys(STR.ko).sort(),Object.keys(STR.en).filter(k=>!k.startsWith('expr.')).sort());
 for(const e of Object.keys(CFG.exprs))assert.ok(STR.en['expr.'+e],e);});
test('D-11 language: none on first run, saved as BCP-47, survives restart; fallback rules',()=>{assert.deepEqual(CFG.languages,LANGS);const m=mem();const st=S.newState(0);assert.equal(st.settings.language,null);
 st.settings.language='en';S.save(m,st,0);assert.equal(S.load(m,1).state.settings.language,'en');
 const raw=JSON.parse(m.getItem(CFG.saveKey));raw.settings.language='xx';m.setItem(CFG.saveKey,JSON.stringify(raw));assert.equal(S.load(m,2).state.settings.language,null,'unknown → ask again');
 const t=makeT(()=>'en');assert.equal(t('booster.day',{count:3}),'Day 3');assert.equal(t('no.such.key'),'no.such.key');assert.equal(makeT(()=>'ko',CFG.exprs)('expr.red_smile'),'해맑은 미소');
 assert.equal(makeT(()=>'en')('lang.name.ko'),'한국어');});

// ---------- D-12 ----------
test('D-12 theme list = tatami basic + Fuji + bamboo; prices null; basic free',()=>{assert.deepEqual(CFG.themes.map(t=>t.id),['basic','fuji','bamboo']);
 assert.equal(CFG.themes[0].price,0);assert.equal(CFG.themes[1].price,null);assert.equal(CFG.themes[2].price,null);
 const st=S.newState(0);st.coins=1e9;assert.equal(S.selectTheme(st,'fuji'),false);assert.equal(st.theme,'basic');assert.equal(st.coins,1e9);assert.ok(S.selectTheme(st,'basic'));});
test('D-12 old save with sakura/summer loads without error on the basic theme',()=>{const m=mem();
 m.setItem(CFG.saveKey,JSON.stringify({v:1,coins:5,hearts:0,paws:0,lastSeen:0,owned:[],nextId:1,theme:'summer',themesOwned:['basic','sakura','summer']}));
 const {state}=S.load(m,10);assert.equal(state.theme,'basic');assert.deepEqual(state.themesOwned,['basic']);assert.equal(S.currentTheme(state).id,'basic');});

// ---------- D-13 ----------
const quietWorld=(st,seed)=>{const w=S.newWorld(st,seed);w.spawnT=1e12;return w;}; // no guests
const firstPlay=(st,seed,tod='day',max=600)=>{const w=quietWorld(st,seed);w.tod=tod;for(let i=0;i<max*30;i++){S.tick(w,st,1/30);for(const e of w.events.splice(0))if(e.type==='playStart')return {t:w.t,e};}return null;};
test('D-13 all three healing features are off by default and change nothing',()=>{assert.equal(CFG.FEATURES.healingPlay,false);assert.equal(CFG.FEATURES.healingTimeOfDay,false);assert.equal(CFG.FEATURES.healingObserve,false);
 assert.equal(firstPlay(S.newState(0),1,'day',300),null);assert.deepEqual(H.customerMix('night'),{countMul:1,tipMul:1});
 const O=H.newObserve();for(let i=0;i<1000;i++)assert.equal(H.stepObserve(O,1,{overlay:false,tod:'day',month:6,r:Math.random}),null);});
test('D-13 1.7.1 no guests, ≥2 shibas → a play starts within 2 min on average',()=>{CFG.FEATURES.healingPlay=true;let sum=0,n=0;
 for(let seed=1;seed<=40;seed++){const r=firstPlay(S.newState(0),seed);assert.ok(r,'seed '+seed);sum+=r.t;n++;}assert.ok(sum/n<=120,'mean '+(sum/n).toFixed(1)+'s');});
test('D-13 1.7.1 one shiba → never plays, no error; night → never chase; config alone changes frequency',()=>{CFG.FEATURES.healingPlay=true;
 const one=S.newState(0);one.owned=one.owned.slice(0,1);assert.equal(firstPlay(one,3,'day',600),null);
 const st=S.newState(0);st.owned.push({id:9,coat:'sesame',expr:'sesame_smile',lv:1},{id:10,coat:'kuro',expr:'kuro_calm',lv:1});const w=quietWorld(st,5);w.tod='night';const types=new Set();
 for(let i=0;i<30*3600;i++){S.tick(w,st,1/30);for(const e of w.events.splice(0))if(e.type==='playStart')types.add(e.play);}assert.ok(types.size>0);assert.ok(!types.has('chase'),[...types]);
 const old=CFG.healing.play.pairChance;try{CFG.healing.play.pairChance=0;assert.equal(firstPlay(S.newState(0),2,'day',600),null);}finally{CFG.healing.play.pairChance=old;}});
test('D-13 1.7.1 guests first: a playing shiba is pulled to the guest in the same frame, guests never wait on a play',()=>{CFG.FEATURES.healingPlay=true;
 const st=S.newState(0);st.owned.push({id:9,coat:'sesame',expr:'sesame_smile',lv:1});const w=S.newWorld(st,4);let interrupts=0;const C=CFG.customer;
 for(let i=0;i<30*1800;i++){const busy0=[...w.tableBusy];S.tick(w,st,1/30);for(const e of w.events.splice(0))if(e.type==='playInterrupt'){interrupts++;assert.equal(w.shibas.find(x=>x.id===e.id).phase,'toTable');}
  for(const c of w.customers)if(c.phase==='wait'&&c.visits<C.visits&&!c.shiba&&c.t>=C.waitBeforeVisit+1/30&&!w.tableBusy[c.seatDef.table]&&!busy0[c.seatDef.table])
   assert.ok(!w.shibas.some(x=>(x.phase==='play'||x.phase==='approach')&&x.cd<=-1/30),'guest waiting while a shiba plays');} // cd was ≤0 when guests were matched this frame
 assert.ok(interrupts>0,'scenario exercised');
 const st2=S.newState(0);st2.hearts=0;const w2=quietWorld(st2,1);while(!w2.shibas.some(x=>x.phase==='play'))S.tick(w2,st2,1/30);
 const id=w2.shibas.find(x=>x.phase==='play').id;assert.equal(S.tapPlay(w2,st2,id),1);assert.equal(st2.hearts,1);assert.equal(w2.shibas.find(x=>x.id===id).phase,'play');});
test('D-13 1.7.2 periods from local time, 20 s transition, lock keeps the period',()=>{const at=(h,m=0)=>new Date(2026,9,14,h,m);
 assert.deepEqual([at(5,59),at(6),at(10,59),at(11),at(17),at(20,59),at(21),at(0)].map(H.timeOfDay),['night','morning','morning','day','evening','evening','night','night']);
 const T=H.newTod(at(10,59));assert.equal(T.key,'morning');assert.equal(T.k,1,'launch snaps without transition');H.stepTod(T,1,at(11,0));assert.equal(T.key,'day');assert.equal(T.k,0);
 H.stepTod(T,10,at(11,0));assert.ok(T.k>.45&&T.k<.55);H.stepTod(T,10,at(11,0));assert.equal(T.k,1);
 const Lk=H.newTod(at(10,59),true);H.stepTod(Lk,61,at(12));assert.equal(Lk.key,'morning');});
test('D-13 1.7.2 night guest mix: arrival interval ÷0.7, pay ×1.43 (product within ±5%)',()=>{CFG.FEATURES.healingTimeOfDay=true;
 const M=H.customerMix('night');assert.ok(Math.abs(M.countMul*M.tipMul-1)<=.05);assert.deepEqual(H.customerMix('day'),{countMul:1,tipMul:1});});
knownFail('D-13 1.7.2 night income per hour = day ±5% (simulated)','FEATURES.healingTimeOfDay is off; seats, not arrivals, limit guests in this build → needs a decision (impl-notes)',()=>{CFG.FEATURES.healingTimeOfDay=true;
 const run=tod=>{let total=0,spawned=0;for(let seed=1;seed<=6;seed++){const st=S.newState(0);const w=S.newWorld(st,seed);w.tod=tod;const c0=st.coins;for(let i=0;i<30*3600;i++)S.tick(w,st,1/30);total+=st.coins-c0;spawned+=w.nextCust-1;}return {total,spawned};};
 const day=run('day'),night=run('night'),ratio=night.total/day.total;
 return {met:Math.abs(ratio-1)<=.05,info:`night/day coins = ${ratio.toFixed(3)}, guests night/day = ${(night.spawned/day.spawned).toFixed(3)}`};});
test('D-13 1.7.3 idle 20 s → an event within ~1 min on average; touch / overlay reset; tod filter',()=>{CFG.FEATURES.healingObserve=true;const r=S.rng(11);let sum=0;
 for(let k=0;k<200;k++){const O=H.newObserve();let t=0;while(O.phase!=='active'){H.stepObserve(O,.5,{overlay:false,tod:'day',month:6,r});t+=.5;}sum+=t-CFG.healing.observe.idleThresholdSec;}
 assert.ok(sum/200<=60,'mean after idle '+(sum/200).toFixed(1));
 const O=H.newObserve();for(let i=0;i<40;i++)H.stepObserve(O,1,{overlay:true,tod:'day',month:6,r:()=>0});assert.equal(O.phase,'hidden');
 for(let i=0;i<19;i++)H.stepObserve(O,1,{overlay:false,tod:'day',month:6,r:()=>0});H.touch(O);for(let i=0;i<19;i++)H.stepObserve(O,1,{overlay:false,tod:'day',month:6,r:()=>0});assert.equal(O.phase,'hidden');
 for(const tod of ['morning','day','evening','night'])for(const k of Object.keys(CFG.healing.observe.events)){const ok=H.eventAllowed(k,{tod,month:6,owns:[]});const E=CFG.healing.observe.events[k];if(ok)assert.ok(!E.tod||E.tod.includes(tod));}
 assert.equal(H.eventAllowed('fireflies',{tod:'night',month:7}),false,'summer months undecided');assert.equal(H.eventAllowed('petals',{tod:'day',month:4,owns:[]}),false);});
test('D-13 1.7.3 tap rewards + journal exactly once; daily cap → 0 reward but journal continues; no stamps',()=>{CFG.FEATURES.healingObserve=true;const st=S.newState(0);const c0=st.coins;
 const show=ev=>{const O=H.newObserve();O.phase='active';O.ev=ev;return O;};const O=show('butterfly');const r1=H.tapObserve(O,st,0);assert.deepEqual(r1.got,{coins:5});assert.ok(r1.first);assert.equal(H.tapObserve(O,st,0),null);
 assert.equal(st.coins,c0+5);for(let i=0;i<30;i++)H.tapObserve(show('sparrow'),st,1);assert.equal(st.coins,c0+100,'cap 100');const r=H.tapObserve(show('butterfly'),st,2);assert.deepEqual(r.got,{});assert.equal(st.observeJournal.butterfly.count,2);
 assert.equal(H.tapObserve(show('butterfly'),st,86400e3*2).got.coins,5,'cap resets next day');const m=H.tapObserve(show('moonWindow'),st,3);assert.deepEqual(m.got,{});assert.ok(!('stamp' in st));});

// ---------- report ----------
let fail=0,blocked=0;for(const [k,n,e,info] of results){console.log({ok:'  ok     ',FAIL:'  FAIL   ',BLOCKED:'  BLOCKED'}[k],n);if(e){fail++;console.log('         ',e.message);}if(k==='BLOCKED'){blocked++;console.log('          known-fail:',info);}}
console.log(`${results.length-fail-blocked}/${results.length} handoff tests passed, ${blocked} BLOCKED (known-fail), ${fail} failed`);if(fail)process.exit(1);
