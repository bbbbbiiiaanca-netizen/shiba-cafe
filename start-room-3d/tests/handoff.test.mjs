// Acceptance tests for handoff-v1 (D-01 … D-13). Run: node tests/handoff.test.mjs (from start-room-3d/)
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {CFG} from '../config.js';
import * as S from '../sim.js';
import {STR,makeT,LANGS} from '../i18n.js';
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

// ---------- report ----------
let fail=0;for(const [k,n,e] of results){console.log(k==='ok'?'  ok  ':'  FAIL',n);if(e){fail++;console.log('       ',e.message);}}
console.log(`${results.length-fail}/${results.length} handoff tests passed`);if(fail)process.exit(1);
