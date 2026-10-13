// Acceptance tests for handoff-v1 (D-01 … D-13). Run: node tests/handoff.test.mjs (from start-room-3d/)
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {CFG} from '../config.js';
import * as S from '../sim.js';
const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');
const mem=()=>({d:{},getItem(k){return this.d[k]??null},setItem(k,v){this.d[k]=v}});
const results=[];
function test(name,fn){const snap=JSON.stringify({F:CFG.FEATURES,T:CFG.TEMP});try{fn();results.push(['ok',name]);}catch(e){results.push(['FAIL',name,e]);}
 finally{const o=JSON.parse(snap);Object.assign(CFG.FEATURES,o.F);Object.assign(CFG.TEMP,o.T);}}

// ---------- D-01 ----------
test('D-01 S rate is 2% ±0.1%p over 100,000 rolls; N/R stay null (no invented split)',()=>{
 assert.equal(CFG.gacha.rates.S,.02);assert.equal(CFG.gacha.rates.N,null);assert.equal(CFG.gacha.rates.R,null);
 const r=S.rng(12345);let s=0;const n=100000;for(let i=0;i<n;i++)if(S.rollGrade(r)==='S')s++;
 assert.ok(Math.abs(s/n-.02)<=.001,'S ratio '+s/n);});
test('D-01 with N/R undecided the pull is blocked; TEMP switch maps non-S to N only',()=>{
 const st=S.newState(0);assert.equal(S.gachaReady(),false);assert.equal(S.pull(st,S.rng(1)),null);assert.equal(st.gachaPulls,0);
 CFG.TEMP.gachaNonSAsN=true;const r=S.rng(9);const seen=new Set();const st2=S.newState(0);st2.paws=1e6;
 for(let i=0;i<3000;i++)seen.add(S.pull(st2,r).grade);assert.deepEqual([...seen].sort(),['N','S']);});
test('D-01 no "SR" grade label left in code (except the one legacy-migration constant)',()=>{
 const files=readdirSync(ROOT).filter(f=>/\.(js|mjs|html)$/.test(f));const hits=[];
 for(const f of files)readFileSync(join(ROOT,f),'utf8').split('\n').forEach((l,i)=>{const m=l.match(/(['"`])SR\1|\.SR\b|\bSR\s*:/g);if(m)hits.push(`${f}: ${l.trim().slice(0,60)}`);});
 assert.equal(hits.length,1,'SR hits '+hits);assert.match(hits[0],/^sim\.js: const LEGACY_TOP_GRADE='SR'/);});
test('D-01 old save with SR loads as S and the re-saved JSON contains no SR',()=>{
 const m=mem();m.setItem(CFG.saveKey,JSON.stringify({v:1,coins:1,hearts:0,paws:0,lastSeen:0,owned:[{id:1,coat:'red',expr:'red_smile',lv:3,rarity:'SR'},{id:2,coat:'kuro',expr:'kuro_calm',lv:1,rarity:'R'},{id:3,coat:'white',expr:'white_smile',lv:2,rarity:'N'}],nextId:4}));
 const {state}=S.load(m,1000);assert.deepEqual(state.owned.map(o=>[S.gradeOf(o.lv),o.lv]),[['S',23],['R',11],['N',2]]);
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
test('D-02 old save rarity is converted to a matching level',()=>{
 const st=S.migrate({v:1,owned:[{id:1,coat:'red',expr:'red_smile',lv:15,rarity:'R'},{id:2,coat:'red',expr:'red_wink',lv:1,rarity:'N'}]});
 assert.deepEqual(st.owned.map(o=>o.lv),[20,1]);assert.deepEqual(st.owned.map(o=>S.gradeOf(o.lv)),['R','N']);});

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

// ---------- report ----------
let fail=0;for(const [k,n,e] of results){console.log(k==='ok'?'  ok  ':'  FAIL',n);if(e){fail++;console.log('       ',e.message);}}
console.log(`${results.length-fail}/${results.length} handoff tests passed`);if(fail)process.exit(1);
