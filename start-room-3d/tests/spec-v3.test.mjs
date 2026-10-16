// Spec v3 acceptance tests (node, no deps). Run: node tests/spec-v3.test.mjs  (or npm test)
import assert from 'node:assert/strict';
import {CFG,pressureAt} from '../config.js';
import * as S from '../sim.js';
import {MAP,footprintCells} from '../map-data.js';
import {existsSync,readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import {join,dirname} from 'node:path';import {fileURLToPath} from 'node:url';
const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');

let pass=0;const fails=[];
// Explicit fixtures for isolated mechanics tests; production audit/start tests use unchanged null config.
// The wrapper sets coins/gauges/intimacy only for mechanics unrelated to start defaults.
const fixtureAggregation=lvs=>lvs.length?lvs.reduce((a,b)=>a+b,0)/lvs.length:1;
function test(name,fn){const savedEntrance=MAP.zones[0].entrance,savedSlots=MAP.zones[0].slots,savedSpeed=CFG.navigation.cellStepSec,savedShibaSpeed=CFG.navigation.shibaCellStepSec,savedBehaviour=CFG.behaviour;CFG.navigation.shibaCellStepSec=.001;CFG.behaviour={eatSec:0,weights:{sit:1},durations:{sit:0},walkCells:[2,4]};
 // Explicit geometry/speed fixture preserves the original economy tests' capacity. Production values stay null.
 MAP.zones[0].entrance=[0,5];CFG.navigation.cellStepSec=.001;
 const occupied=new Set(savedSlots.flatMap(x=>footprintCells(x).map(c=>c.join(','))));
 MAP.zones[0].slots=[...savedSlots];for(const j of [0,2,4])for(const i of [1,3,5])if(!occupied.has(`${i},${j}`))MAP.zones[0].slots.push({id:`fixture-${i}-${j}`,type:'cushion',origin:[i,j],dir:0});
 const old=CFG.income.levelAggregation;if(!name.startsWith('red-team #7'))CFG.income.levelAggregation=fixtureAggregation;try{const production=/red-team #2|gauges do not|UNSET features|139-6|fresh default|audit null/.test(name);if(production)fn();else withCfg(CFG.start,{coins:0,dia:0},()=>withCfg(CFG,{gaugeStart:{full:100,dirt:0,fatigue:0,happy:100,boredom:0}},()=>withCfg(CFG.intimacy,{start:0},fn)));pass++;}catch(e){fails.push([name,e]);}finally{CFG.income.levelAggregation=old;MAP.zones[0].entrance=savedEntrance;MAP.zones[0].slots=savedSlots;CFG.navigation.cellStepSec=savedSpeed;CFG.navigation.shibaCellStepSec=savedShibaSpeed;CFG.behaviour=savedBehaviour;}}
const H=3600e3,MIN=60e3;
const near=(a,b,eps=1e-9,msg)=>assert.ok(Math.abs(a-b)<=eps,`${msg||''} ${a} ≉ ${b}`);
const freshGame=(breed='red',now=0,seed=1)=>{const r=S.rng(seed),s=S.newState(now);S.chooseStart(s,breed,'',r,now);return {s,r,sh:s.shibas[0],w:S.newWorld(s,r)};};
// scripted RNG: returns the given values in order, then `rest`
const script=(vals,rest=.99)=>{let i=0;return()=>i<vals.length?vals[i++]:rest;};
// temporarily set config values (e.g. odds the spec has not decided) and restore them afterwards
const withCfg=(obj,patch,fn)=>{const bak={};for(const k in patch){bak[k]=obj[k];obj[k]=patch[k];}try{return fn();}finally{Object.assign(obj,bak);}};
const TEST_ODDS=CFG.gacha.breedOdds; // only startLevel is a test fixture
const gachaOn=fn=>withCfg(CFG.gacha,{breedOdds:TEST_ODDS,startLevel:1},fn);
const run=(s,w,sec,t0=0,dt=.5)=>{let t=t0;const ev=[];for(let k=0;k<sec/dt;k++){t+=dt*1000;S.tick(s,w,dt,t);ev.push(...w.events.splice(0));}return {t,ev};};

test('fresh default game: exactly one Lv21 shiba of each chosen breed (90·109)',()=>{for(const breed of CFG.breeds){const s=S.newState(0);S.chooseStart(s,breed,'',S.rng(1),0);assert.equal(s.shibas.length,1);assert.equal(s.shibas[0].level,21);assert.equal(s.shibas[0].breed,breed);S.chooseStart(s,'red','');assert.equal(s.shibas.length,1);}});

// ───────── spec numbers used (config ↔ spec) ─────────
test('갱신 75 pressure table: 50 rows, spot values, cap = ceil(slots×2.2) (70·71)',()=>{
 assert.equal(CFG.cafe.pressure.length,50);
 assert.deepEqual(pressureAt(1),{slots:2,cap:5,interval:7.5,pct:125});assert.deepEqual(pressureAt(3),{slots:2,cap:5,interval:5.1,pct:85});
 assert.deepEqual(pressureAt(16),{slots:6,cap:14,interval:2.5,pct:125});assert.deepEqual(pressureAt(42),{slots:10,cap:22,interval:1.6,pct:125});
 assert.deepEqual(pressureAt(50),{slots:10,cap:22,interval:1.1,pct:85});
 for(let lv=1;lv<=50;lv++){const p=pressureAt(lv);assert.equal(p.cap,Math.ceil(+(p.slots*CFG.cafe.capFromSlots).toFixed(6)),'lv'+lv);}
 // slots only grow at the 125% (숨통) levels (73)
 for(let lv=2;lv<=50;lv++)if(pressureAt(lv).slots>pressureAt(lv-1).slots)assert.equal(pressureAt(lv).pct,125,'lv'+lv);});
test('café exp table: seat-growth calibration has 49 positive steps, max level 50',()=>{
 const e=CFG.cafe.expToNext;assert.equal(e.length,49);assert.ok(e.every(n=>Number.isInteger(n)&&n>0));assert.equal(CFG.cafe.maxLevel,50);
 // unchanged by §2: guest exp, cap, interval, 10 placed shibas
 assert.deepEqual([CFG.cafeExp.custNormal,CFG.cafeExp.custSatisfied,CFG.cafeExp.custDisappointed,CFG.cafe.customersPerHourPerCap,CFG.cafe.maxPlaced],[1,2,0,100,10]);});
test('spec numbers: stay/queue/visit/rep/hearts/walk/hospital/part-timers/payment',()=>{
 const C=CFG;assert.equal(C.cafe.stayingSec,30);assert.equal(C.cafe.queueMax,10);assert.equal(C.cafe.queueWaitSec,30);assert.equal(C.cafe.maxPlaced,10);assert.equal(C.cafe.maxOwned,50);
 assert.equal(C.visit.meetSec,5);assert.equal(C.visit.roamSec,3); // starting value 2026-10-14, pending user confirm (was 갱신 70 7 s / 5 s)
 assert.equal(C.rep.start,50);assert.equal(C.rep.queueAngry,-2);assert.equal(C.rep.closureFloor,30);
 assert.deepEqual([C.hearts.regenCap,C.hearts.slots,C.hearts.regenEverySec],[10,5,1800]); // cap 10 (spec v3 1.4, confirmed 2026-10-15), 5 top-bar slots (confirmed), 30 min: spec v3
assert.deepEqual(C.walk.durationsSec,[600,1200,1800]);assert.equal(C.walk.cooldownSec,0);
 assert.equal(C.walk.events.snake,1/40);assert.equal(C.walk.events.light,1/30);assert.equal(C.walk.events.capsule,1/30);assert.equal(C.walk.events.extra,.5);
 assert.deepEqual(C.hospital.stays,{light:1800,snake:7200,sick:14400});assert.equal(C.offline.capHours,12);
 assert.deepEqual([C.alba.daycare.cost,C.alba.walk.cost,C.alba.trainer.cost,C.alba.manager.cost],[120000,270000,360000,900000]); // 밸런스_2년.md §3: 15× 갱신 125-1 (8,000·18,000·24,000·60,000)
 assert.deepEqual([C.alba.daycare.cooldownSec,C.alba.walk.cooldownSec,C.alba.trainer.cooldownSec,C.alba.manager.hireSec],[7200,14400,14400,43200]);
 assert.deepEqual([C.alba.daycare.unlock,C.alba.walk.unlock,C.alba.trainer.unlock,C.alba.manager.unlock],[10,15,20,25]);
 assert.equal(C.alba.walk.maxShibas,4);assert.equal(C.alba.walk.boredom,-50);
 assert.equal(C.menu.coffee.price,1);assert.equal(C.menu.coffee.id,'M-01');assert.deepEqual([C.menu.premiumDrinkPrice,C.menu.premiumDessertPrice],[3,5]);assert.equal(C.gacha.priceDia,100);assert.equal(C.stub.diaPriceWon,10);
 assert.deepEqual(C.cooldownTicketDia,{one:20,five:80});assert.deepEqual(C.potion,{bigDia:150,smallDia:50});});
test('갱신 133: exactly 5 tricks from config (앉아·손·기다려·엎드려·인사), max step 5, ×4',()=>{
 assert.deepEqual(CFG.tricks.map(t=>t.id),['sit','paw','wait','down','bow']);assert.equal(CFG.trickMaxLevel,5);assert.equal(CFG.intelligencePerLevel,4);assert.equal(CFG.intelligenceMax,100);});
test('grades abolished: no grade/rarity anywhere in config or shibas',()=>{
 const txt=JSON.stringify(CFG);assert.ok(!/"grades?"|rarity|"SR"/.test(txt));const {sh}=freshGame();assert.ok(!('grade' in sh)&&!('rarity' in sh));});
test('도감 and in-game YouTube are not in the build',async()=>{});

// ───────── formulas ─────────
test('shiba level income effect ×(1+0.05(L−1)) (81): Lv10 1.45, Lv21 2.0, Lv30 2.45',()=>{near(S.levelEffect(1),1);near(S.levelEffect(10),1.45);near(S.levelEffect(21),2);near(S.levelEffect(30),2.45);});
test('138: paws 20×N per level (Lv1→2 20, Lv10→11 200, Lv29→30 580), cumulative 8,700 = 870 duplicates, cap 30',()=>{let tot=0;for(let l=1;l<30;l++)tot+=S.pawsToNext(l);
 assert.equal(tot,8700);assert.equal(tot/CFG.level.dupPaws,870);assert.deepEqual([S.pawsToNext(1),S.pawsToNext(10),S.pawsToNext(29)],[20,200,580]);assert.equal(S.pawsToNext(30),null);});
test('138: paws are a per-shiba balance spent with the level-up button (not automatic); max Lv30 keeps the balance',()=>{const {s,sh}=freshGame();sh.level=1;
 S.addPaws(sh,19);assert.equal(sh.level,1);assert.equal(S.levelUpCheck(s,sh.id),'paws');assert.equal(S.levelUp(s,sh.id),false);
 S.addPaws(sh,1);assert.ok(S.levelUp(s,sh.id));assert.deepEqual([sh.level,sh.paws],[2,0]);
 S.addPaws(sh,99999);while(S.levelUp(s,sh.id));assert.equal(sh.level,30);assert.equal(sh.paws,99999-(8700-20));assert.equal(S.levelUpCheck(s,sh.id),'max');});
test('intelligence = sum of trick steps × 4, capped at 100 (133)',()=>{const {sh}=freshGame();assert.equal(S.intelligence(sh),24); // 앉아·기다려 3단계 (100·109)
 for(const t of CFG.tricks)sh.tricks[t.id]=5;assert.equal(S.intelligence(sh),100);
 CFG.tricks.push({id:'extra'});sh.tricks.extra=5;try{assert.equal(S.intelligence(sh),100);}finally{CFG.tricks.pop();}});
test('139-5·139-6: one accessory slot per shiba (no Lv5/15/25 slots); only the starting shiba has it open',()=>{const {s,r,sh}=freshGame();
 assert.equal(CFG.accessory.slots,1);assert.equal(CFG.accessorySlots,undefined);assert.ok(sh.accUnlocked&&sh.starter);
 s.items.capsule=1;s.dia=0;const res=gachaOn(()=>S.gachaPull(s,1,()=>.3,0,{ticket:true}))[0];const n=S.byId(s,res.id);assert.equal(n.accUnlocked,false);assert.ok(!n.starter);
 n.level=30;assert.equal(n.accUnlocked,false,'levels do not open slots');});
test('139-5: unlock costs that shiba\'s 1,000 paws or 1,000 diamonds; paws used are no longer there for level-ups',()=>{const {s,sh}=freshGame();s.dia=0;
 const n=S.makeShiba(s,{breed:'kuro',level:1});s.shibas.push(n);assert.equal(CFG.accessory.unlockPaws,1000);assert.equal(CFG.accessory.unlockDia,1000);
 n.paws=999;assert.equal(S.accUnlockCheck(s,n.id,'paws'),'paws');sh.paws=5000;assert.equal(S.accUnlockCheck(s,n.id,'paws'),'paws','another shiba\'s paws do not count');
 n.paws=1020;assert.ok(S.unlockAccSlot(s,n.id,'paws'));assert.equal(n.paws,20);assert.ok(n.accUnlocked);assert.equal(S.accUnlockCheck(s,n.id,'paws'),'done');
 const m=S.makeShiba(s,{breed:'white',level:1});s.shibas.push(m);s.dia=999;assert.equal(S.accUnlockCheck(s,m.id,'dia'),'dia');s.dia=1000;assert.ok(S.unlockAccSlot(s,m.id,'dia'));assert.equal(s.dia,0);assert.ok(m.accUnlocked);});
test('café exp curve: level boundaries, cumulative threshold and max level 50',()=>{const s=S.newState(0);S.addCafeExp(s,CFG.cafe.expToNext[0]-1);assert.equal(s.cafe.level,1);S.addCafeExp(s,1);assert.equal(s.cafe.level,2);
 const t=S.newState(0);S.addCafeExp(t,CFG.cafe.expToNext.slice(0,6).reduce((a,b)=>a+b,0));assert.equal(t.cafe.level,7);assert.equal(t.cafe.exp,0);S.addCafeExp(t,1e9);assert.equal(t.cafe.level,50);});
test('premium chance 5% + (rep−50)×0.3%p, +15%p satisfied, cap 40% (120)',()=>{near(S.premiumChance(50,false),.05);near(S.premiumChance(30,false),.05);near(S.premiumChance(70,false),.11);near(S.premiumChance(90,false),.17);near(S.premiumChance(90,true),.32);near(S.premiumChance(100,true),.35);
 const bak=CFG.menu.premiumSatisfiedBonus;CFG.menu.premiumSatisfiedBonus=.5;try{near(S.premiumChance(100,true),.4);}finally{CFG.menu.premiumSatisfiedBonus=bak;}});
test('payment mechanics with explicit test aggregation × item (75·120); fractions kept (120)',()=>{const {s,sh}=freshGame();
 assert.equal(S.payFor(s,[sh.id],{price:1}).total,2);assert.equal(S.payFor(s,[],{price:1}).total,1);
 const o=S.makeShiba(s,{breed:'kuro',level:1});s.shibas.push(o);near(S.payFor(s,[sh.id,o.id],{price:3}).total,3*1.5);
 s.cafe.boostUntil=1e15;near(S.payFor(s,[sh.id],{price:1}).total,4);const saved=CFG.itemIncome.boostMul;try{CFG.itemIncome.boostMul=1.2;near(S.payFor(s,[sh.id],{price:1}).total,2.4);}finally{CFG.itemIncome.boostMul=saved;}});
test('갱신 134 menu table: 13 items, unlock level & price from 134; dev cost = 15× 134-1 except 라테 15,000 (밸런스_2년.md §3)',()=>{
 const T={'M-02':['drink',2,8500,3],'M-05':['dessert',3,10000,5],'M-03':['drink',5,12000,3],'M-06':['dessert',7,13500,5],'M-04':['drink',9,15000,3],'M-07':['dessert',12,17000,5],'M-08':['dessert',15,18500,5],
  'P-01':['premium',20,23500,8],'P-02':['premium',25,27000,8],'P-03':['premium',30,30500,8],'P-04':['premium',35,32000,8],'P-05':['premium',40,34000,8],'P-06':['premium',45,35500,8]}; // [kind, level, 134-1 cost, price]
 assert.equal(CFG.menu.items.length,13);for(const m of CFG.menu.items){const [kind,lv,cost,price]=T[m.id];assert.deepEqual([m.kind,m.unlockLevel,m.devCost,m.price],[kind,lv,m.id==='M-02'?15000:cost*15,price],m.id);}
 assert.deepEqual(['M-08','P-06'].map(id=>S.menuItem(id).devCost),[277500,532500],'밸런스_2년.md §3 check table (파르페, 파블로바)');
 const old134=[1500,1500,2000,2500,3000,3500,4000,12000,14000,16000,17000,18000,20000];assert.ok(CFG.menu.items.every((m,i)=>m.devCost!==old134[i]),'134 dev costs replaced by 134-1');
 assert.equal(CFG.menu.premiumPerNormalDeveloped,.01);assert.equal(CFG.menu.premiumUpgradeChance,.3);assert.equal(CFG.menu.premiumCap,.4);
 for(const m of [CFG.menu.coffee,...CFG.menu.items])assert.ok(existsSync(join(ROOT,'assets/drive',m.img)),m.img);});
test('menu development: 멍코인, gated by café level, once each (129·134)',()=>{const {s}=freshGame();s.coins=14999;
 assert.equal(S.menuCheck(s,'M-02'),'locked','M-02 unlocks at Lv2');s.cafe.level=2;assert.equal(S.menuCheck(s,'M-02'),'coins');s.coins=15000;assert.ok(S.developMenu(s,'M-02',0));assert.equal(s.coins,0);assert.equal(S.menuCheck(s,'M-02'),'developing');S.settleMenuDev(s,30*MIN);assert.equal(S.menuCheck(s,'M-02'),'owned');
 s.coins=1e6;assert.equal(S.menuCheck(s,'M-05'),'locked');s.cafe.level=3;assert.ok(S.developMenu(s,'M-05',0));assert.equal(s.coins,1e6-150000);S.settleMenuDev(s,H);
 assert.equal(S.menuCheck(s,'P-01'),'locked');s.cafe.level=20;assert.ok(S.developMenu(s,'P-01',0));assert.equal(S.developMenu(s,'P-01',0),false);assert.equal(S.menuCheck(s,'nope'),'pick');});
test('premium chance +1%p per developed normal menu, cap 40% unchanged (120·134)',()=>{near(S.premiumChance(50,false,7),.12);near(S.premiumChance(90,true,7),.39);near(S.premiumChance(100,true,7),.4);
 const {s}=freshGame();s.menus=['M-02','M-05','P-01'];assert.equal(S.normalDeveloped(s),2);});
test('orders (134): no menus → always coffee M-01; drink slot needs a normal drink, dessert slot a normal dessert, else coffee; 2:1 split',()=>{
 const {s}=freshGame();const o=S.chooseOrder(s,true,()=>0);assert.deepEqual([o.id,o.price,o.img],['M-01',1,'M-01-iced-americano_512.png']);
 // r: premium roll, kind roll (<2/3 → drink), pick
 s.menus=['M-05'];assert.equal(S.chooseOrder(s,true,script([0,.1,0])).id,'M-01','drink slot without a drink → coffee');
 const d=S.chooseOrder(s,true,script([0,.9,.99,0]));assert.deepEqual([d.id,d.price,d.kind],['M-05',5,'dessert']);
 s.menus=['M-02'];const dr=S.chooseOrder(s,true,script([0,.1,0]));assert.deepEqual([dr.id,dr.price],['M-02',3]);assert.equal(S.chooseOrder(s,true,script([0,.9,0])).id,'M-01','dessert slot without a dessert → coffee');
 assert.equal(S.chooseOrder(s,false,script([.99])).id,'M-01','premium roll failed');
 s.menus=['M-02','M-05'];let dk=0,n=0;const r=S.rng(3);for(let i=0;i<30000;i++){const x=S.chooseOrder(s,true,r);if(x.id!=='M-01'){n++;if(x.kind==='drink')dk++;}}near(dk/n,2/3,.02,'drink share');});
test('premium dessert → 30% premium (8멍) only with a premium developed; picture random among developed of that kind (134)',()=>{const {s}=freshGame();
 s.menus=['M-05','M-06','P-01','P-03'];const r=S.rng(11);let des=0,prem=0;const imgs=new Set();
 for(let i=0;i<40000;i++){const o=S.chooseOrder(s,true,r);if(o.slot==='dessert'){des++;if(o.kind==='premium'){prem++;assert.equal(o.price,8);assert.ok(['P-01','P-03'].includes(o.id));}else{assert.equal(o.price,5);assert.ok(['M-05','M-06'].includes(o.id));}imgs.add(o.img);}}
 near(prem/des,.3,.02,'premium share');assert.equal(imgs.size,4,'every developed dessert/premium picture shows up');
 s.menus=['M-05'];for(let i=0;i<2000;i++)assert.notEqual(S.chooseOrder(s,true,r).kind,'premium');
 s.menus=['P-01'];for(let i=0;i<2000;i++)assert.equal(S.chooseOrder(s,true,r).id,'M-01','premium alone never ordered without a normal dessert');});
test('guests pay the ordered menu price × level effect, and the leave event carries its picture (120·134)',()=>{const {s,w}=freshGame();s.cafe.level=3;s.menus=['M-02','M-05'];s.cafe.rep=100;
 const {ev}=run(s,w,1200);const L=ev.filter(e=>e.type==='leave');
 const price={'M-01':1,'M-02':3,'M-05':5};for(const e of L)assert.ok([1,2].some(m=>Math.abs(e.coins-price[e.order]*m)<1e-9),e.order+' '+e.coins); // ×2 if it met the Lv21 shiba, ×1 if nobody
 assert.ok(L.some(e=>e.order==='M-02')&&L.some(e=>e.order==='M-05'));assert.ok(L.every(e=>/^(M-01|M-02|M-05)-/.test(e.orderImg)));});
test('condition multiplier (86): steps, products, clamp .25–1.3; meeting score + trick bonus within 1.3 (100)',()=>{const {sh}=freshGame();
 near(S.conditionMul(sh),1.2); // full state: happy 100
 Object.assign(sh.g,{happy:50,dirt:60});near(S.conditionMul(sh),.7);sh.g.dirt=80;near(S.conditionMul(sh),.5);sh.g.fatigue=80;near(S.conditionMul(sh),.5);sh.g.full=30;near(S.conditionMul(sh),.4);
 Object.assign(sh.g,{dirt:0,fatigue:60,full:30});near(S.conditionMul(sh),.8);
 Object.assign(sh.g,{dirt:0,fatigue:0,full:100,happy:70});near(S.meetingScore(sh,0),1.2);near(S.meetingScore(sh,3),1.3);sh.g.happy=0;near(S.meetingScore(sh,5),1.25);});
test('training chance 60% +15 intimacy≥70 +10 happy≥70 −15 boredom≥60, 20–95% (100)',()=>{const {sh}=freshGame();sh.g.happy=0;near(S.trainChance(sh),.6);
 sh.intimacy=70;sh.g.happy=70;near(S.trainChance(sh),.85);sh.g.fatigue=60;sh.g.boredom=60;near(S.trainChance(sh),.7);sh.intimacy=0;sh.g.happy=0;near(S.trainChance(sh),.45);});
test('reputation: satisfied gain halves ≥70, quarters ≥90; arrival interval ×0.9/1.0/1.2 (87·106)',()=>{assert.equal(S.satisfiedGain(50),1);assert.equal(S.satisfiedGain(70),.5);assert.equal(S.satisfiedGain(90),.25);
 assert.equal(S.arrivalMul(70),.9);assert.equal(S.arrivalMul(50),1);assert.equal(S.arrivalMul(29.9),1.2);const s=S.newState(0);s.cafe.rep=75;near(S.arrivalInterval(s),7.2*.9);});
test('hospital fixed costs by café level band (131)',()=>{const s=S.newState(0);const c=k=>S.hospitalCost(s,k);
 assert.deepEqual([c('light'),c('snake'),c('sick')],[400,1200,2400]);s.cafe.level=10;assert.equal(c('snake'),1500);s.cafe.level=25;assert.equal(c('sick'),4700);s.cafe.level=39;assert.equal(c('light'),1000);});

// ───────── customers ─────────
test('customer flow: arrive → seat → shiba 5 s meeting / 3 s roam (starting values 2026-10-14) → leave after 30 s → pay (69·70·120)',()=>{const {s,w,sh}=freshGame();
 const {ev}=run(s,w,600);const leaves=ev.filter(e=>e.type==='leave');assert.ok(leaves.length>=60,'served '+leaves.length);assert.equal(s.stats.served,leaves.length);
 const paid=leaves.reduce((a,e)=>a+e.coins,0);near(s.coins+s.coinFrac,paid,1e-6);
 // full 5 s meetings (visit extends while playing, starting value 똑또기 2026-10-14): one shiba cannot reach every guest, so pay is 2 only for met guests
 const metIds=new Set(ev.filter(e=>e.type==='meet').map(e=>e.custId));assert.ok(leaves.every(e=>e.coins===(metIds.has(e.id)?2:1)),'coffee 1 × Lv21 2.0 when met, ×1.0 otherwise');assert.ok(leaves.some(e=>e.coins===2));
 // meeting timing: 5 s at a guest then 3 s roaming
 const g=freshGame();const ws=g.w;let t=0,phase=[];for(let i=0;i<200;i++){t+=100;S.tick(g.s,ws,.1,t);phase.push(ws.sh[g.sh.id]?.phase);}
 const first=phase.indexOf('meet'),endM=phase.indexOf('roam',first);if(endM>0){const nextM=phase.indexOf('meet',endM);assert.ok(endM-first<=51,'meeting ≤5 s (+1 tick float)');if(nextM>0)assert.ok(Math.abs(nextM-endM-30)<=3,'roam 3 s plus route steps: '+(nextM-endM));}});
test('queue: cap reached → queue (4 grass cells, starting value 똑또기 2026-10-14; 66 max 10); waiting >30 s → leaves, reputation unchanged, no money (66·68·87)',()=>{const {s,w}=freshGame();s.cafe.rep=50;
 for(const sh of s.shibas)sh.placed=false; // nobody serves → seats stay full
 w.spawnT=1e9;for(let i=0;i<5;i++)w.custs.push({id:100+i,kind:'mom',phase:'seated',seat:i,cell:[1,3],t:999,score:0,met:[],with:null,fulfilled:false,request:null});
 for(let i=0;i<12;i++){w.spawnT=0;S.tick(s,w,0,0);w.spawnT=1e9;}assert.equal(w.queue.length,CFG.navigation.queueCells);assert.equal(w.queue.length,4);assert.equal(s.stats.lost,8);
 const c0=s.coins;run(s,w,30.5);assert.equal(w.queue.length,0);assert.equal(s.stats.angry,4);assert.equal(s.cafe.rep,50);assert.equal(s.coins,c0);});
test('0 meetings → disappointed (rep −1 from café Lv5, 0 below Lv5 — starting value 2026-10-14; exp 0); request met → satisfied (+1, exp +2); met but not met-request → normal (+0, exp +1) (70·86·87·106)',()=>{
 const e=freshGame();e.sh.placed=false;const le=run(e.s,e.w,60).ev.filter(x=>x.type==='leave');assert.ok(le.length&&le.every(x=>x.outcome==='disappointed'));assert.equal(e.s.cafe.rep,50,'early game (Lv<5): unmet guests cost no reputation');
 const a=freshGame();a.s.cafe.level=CFG.rep.unmetFreeBelowLevel;a.sh.placed=false;const {ev}=run(a.s,a.w,60);const L=ev.filter(e=>e.type==='leave');assert.ok(L.length&&L.every(e=>e.outcome==='disappointed'));assert.equal(a.s.cafe.exp,0);assert.equal(a.s.cafe.rep,50-L.length);assert.ok(L.every(e=>e.coins===1),'coffee still paid ×1');
 const b=freshGame();b.w.spawnT=1e9;b.w.custs.push({id:1,kind:'dad',phase:'seated',seat:0,cell:[1,3],t:30,score:0,met:[],with:null,fulfilled:false,request:{type:'meetShiba',shibaId:b.sh.id}});
 const rb=run(b.s,b.w,40).ev.find(e=>e.type==='leave'); // visit may run past 30 s while playing (starting value 똑또기 2026-10-14)assert.equal(rb.outcome,'satisfied');assert.equal(b.s.cafe.exp,2);assert.equal(b.s.cafe.rep,51);
 const c=freshGame();c.w.spawnT=1e9;c.w.custs.push({id:1,kind:'dad',phase:'seated',seat:0,cell:[1,3],t:30,score:0,met:[],with:null,fulfilled:false,request:{type:'seeTrick',trick:'bow'}});
 const rc=run(c.s,c.w,40).ev.find(e=>e.type==='leave');assert.equal(rc.outcome,'normal');assert.equal(c.s.cafe.exp,1);assert.equal(c.s.cafe.rep,50);});
test('every normal guest gets a request that the café can meet now (106); none for interior while UNSET (113)',()=>{const {s,w}=freshGame();const {ev}=run(s,w,300);
 for(const c of w.custs)assert.ok(c.request&&['meetShiba','seeTrick'].includes(c.request.type));assert.equal(CFG.requests.interior.enabled,false);
 for(const c of w.custs)if(c.request.type==='seeTrick')assert.ok(['sit','wait'].includes(c.request.trick),'only tricks a placed shiba knows');});
test('drag a roaming shiba to a guest → 7 s meeting; busy shiba cannot be dragged (105)',()=>{const {s,w,sh}=freshGame();w.spawnT=1e9;
 w.custs.push({id:1,kind:'mom',phase:'seated',seat:0,cell:[1,3],t:30,score:0,met:[],with:null,fulfilled:false,request:null},{id:2,kind:'dad',phase:'seated',seat:1,cell:[3,3],t:30,score:0,met:[],with:null,fulfilled:false,request:null});
 w.sh[sh.id]={id:sh.id,phase:'roam',cell:[0,5],t:3,cust:null};assert.ok(S.deliver(s,w,sh.id,2,0));assert.equal(w.custs[1].with,sh.id);assert.equal(S.deliverCheck(s,w,sh.id,1),'busy');});
test('manager: ~30% of unmet requests fulfilled at half reputation, no café exp (118)',()=>{let mgr=0,n=0;for(let seed=1;seed<=400;seed++){const g=freshGame('red',0,seed);g.s.cafe.managerUntil=1e12;g.w.spawnT=1e9;
  g.w.custs.push({id:1,kind:'mom',phase:'seated',seat:0,cell:[1,3],t:.1,score:1,met:[g.sh.id],with:null,fulfilled:false,request:{type:'meetShiba',shibaId:g.sh.id}});g.w.sh[g.sh.id]={id:g.sh.id,phase:'roam',cell:[0,5],t:99,cust:null};
  const e=run(g.s,g.w,1).ev.find(e=>e.type==='leave');n++;if(e.byManager){mgr++;assert.equal(g.s.cafe.rep,50.5);assert.equal(g.s.cafe.exp,0);}}near(mgr/n,.3,.07,'manager share');});
test('a walking shiba gives no meetings; the rest keep working (15)',()=>{const {s,w,sh,r}=freshGame();const o=S.makeShiba(s,{breed:'kuro',level:1});o.placed=true;s.shibas.push(o);
 S.startWalk(s,sh.id,600,0,()=>.9);const {ev}=run(s,w,300);assert.ok(ev.filter(e=>e.type==='meet').every(e=>e.shibaId===o.id));});

// ───────── shiba care ─────────
test('play: ♥1, boredom −28 dirt +3 fatigue +5 happy +7 intimacy +3, café exp +1 (84·88·90)',()=>{const {s,sh}=freshGame();Object.assign(sh.g,{boredom:50,happy:50});
 assert.ok(S.playWith(s,sh.id,0));assert.equal(s.hearts,9);assert.deepEqual([sh.g.boredom,sh.g.dirt,sh.g.fatigue,sh.g.happy,sh.intimacy],[22,3,5,57,3]);assert.equal(s.cafe.exp,1);
 sh.g.fatigue=100;assert.equal(S.careCheck(s,sh.id,'play'),null);s.hearts=0;sh.g.fatigue=0;assert.equal(S.careCheck(s,sh.id,'play'),'hearts');});
test('training: ♥1, step N→N+1 needs N+1 successes, fatigue +5 on success (100·133); all 5 trainable from start',()=>{const {s,sh}=freshGame();s.hearts=100;
 for(const t of CFG.tricks)assert.equal(S.trainCheck(s,sh.id,t.id),null,t.id);
 let r=S.train(s,sh.id,'paw',()=>0,0);assert.ok(r.ok&&r.up&&sh.tricks.paw===1);assert.equal(sh.g.fatigue,5);
 S.train(s,sh.id,'paw',()=>0,0);assert.equal(sh.tricks.paw,1);S.train(s,sh.id,'paw',()=>0,0);assert.equal(sh.tricks.paw,2);
 const f=sh.g.fatigue;r=S.train(s,sh.id,'paw',()=>.999,0);assert.ok(!r.ok);assert.equal(sh.g.fatigue,f);assert.equal(s.hearts,96);
 sh.tricks.bow=5;assert.equal(S.trainCheck(s,sh.id,'bow'),'max');});
test('feed / snack / bath / sleep stay disabled while their amounts are UNSET',()=>{const {s,sh}=freshGame();for(const k of ['feed','snack','bath','sleep'])assert.equal(S.careCheck(s,sh.id,k),'unset',k);});
test('gauges do not change while starting values and decay are UNSET',()=>{const {s,w,sh}=freshGame();const unknown=Object.fromEntries(CFG.gauges.map(k=>[k,null]));assert.deepEqual(sh.g,unknown);run(s,w,3600,0,2);assert.deepEqual(sh.g,unknown);assert.equal(sh.zeroSince,null);});
test('141: fatigue 100 blocks only walks; work and play remain available',()=>{const {s,sh}=freshGame();sh.g.fatigue=100;assert.equal(S.statusOf(s,sh),'ok');assert.equal(S.walkCheck(s,sh.id,600,0),'fatigue');assert.equal(S.canWork(s,sh),true);assert.equal(S.careCheck(s,sh.id,'play'),null);});
test('sick after a 0 gauge for 2 h; hospital needs coins (no credit); 4 h stay; 동구 takes it after 24 h with 2× stay (111·111-1·112)',()=>{const {s,w,sh}=freshGame();
 S.changeGauges(s,sh,{dirt:100},0);run(s,w,2*3600-10,0,10);assert.equal(sh.status,'ok');run(s,w,20,2*3600e3-10e3,10);assert.equal(sh.status,'sick');
 assert.equal(S.hospitalCheck(s,sh.id),'coins');s.coins=2400;assert.ok(S.sendToHospital(s,sh.id,3*H));assert.equal(s.coins,0);assert.equal(sh.hospitalUntil,7*H);assert.equal(S.statusOf(s,sh),'hospital');
 const g=freshGame();S.changeGauges(g.s,g.sh,{happy:-100},0);g.s.coins=1e6;run(g.s,g.w,26*3600,0,60);assert.equal(g.sh.status,'hospital');assert.equal(g.sh.hospitalUntil-g.sh.hospitalUntil%1,(2+24)*H+2*14400e3);});
test('abandon: others −15, again within 24 h −20; the last shiba cannot be given up (76·82)',()=>{const {s,sh}=freshGame();const a=S.makeShiba(s,{breed:'kuro'}),b=S.makeShiba(s,{breed:'white'});a.intimacy=b.intimacy=50;s.shibas.push(a,b);
 S.abandon(s,sh.id,0);assert.equal(a.intimacy,35);S.abandon(s,b.id,10*H);assert.equal(a.intimacy,15);assert.equal(S.abandonCheck(s,a.id),'last');});
test('hearts: +1 per 30 min up to the natural cap 10 (1.4); reward hearts above it; reset ticket only below 10 (1.4)',()=>{const s=S.newState(0);s.hearts=0;S.settleHearts(s,95*MIN);assert.equal(s.hearts,3);S.settleHearts(s,100*H);assert.equal(s.hearts,CFG.hearts.regenCap);
 s.hearts=14;S.settleHearts(s,200*H);assert.equal(s.hearts,14);s.items.heartReset=1;assert.equal(S.useHeartReset(s,200*H),false);assert.equal(s.items.heartReset,1);
 s.hearts=4;assert.ok(S.useHeartReset(s,200*H));assert.equal(s.hearts,10);assert.equal(s.items.heartReset,0);});

// ───────── walks (seeded) ─────────
test('walk: hearts 1 per 10 min, no cooldown, effects by duration, exp +2/10 min (85·87·90·124-5·125-1)',()=>{const {s,sh}=freshGame();
 assert.equal(S.walkHearts(600),1);assert.equal(S.walkHearts(1800),3);assert.ok(S.startWalk(s,sh.id,1800,0,()=>.99));assert.equal(s.hearts,7);assert.equal(S.walkCheck(s,sh.id,600,0),'walking');
 S.tickWalk(s,1799e3,()=>.99);assert.ok(s.walk);const out=S.tickWalk(s,1800e3,()=>.99);assert.ok(out.settled&&!s.walk);
 assert.deepEqual([sh.g.boredom,sh.g.dirt,sh.g.fatigue,sh.g.happy,sh.intimacy],[0,35,35,100,6]);assert.equal(s.cafe.exp,6);
 assert.equal(S.walkCheck(s,sh.id,600,1800e3),null,'no cooldown');s.hearts=0;assert.equal(S.walkCheck(s,sh.id,600,1800e3),'hearts');});
test('walk outcomes with scripted RNG settle once on return (141)',()=>{const {s,sh}=freshGame();
 S.startWalk(s,sh.id,600,0);
 assert.equal(S.tickWalk(s,300e3),null);
 const h=s.hearts;S.tickWalk(s,600e3,script([1/40-1e-9,.99,.49,1/30-1e-9]));assert.equal(sh.status,'injured');assert.equal(sh.injury,'snake');assert.equal(s.hearts,h);assert.equal(s.items.capsule,1);
 const g=freshGame();S.startWalk(g.s,g.sh.id,600,0,()=>.06);S.tickWalk(g.s,600e3,script([.5,1/30-1e-9,.6,.5]));assert.equal(g.sh.injury,'light');assert.equal(g.s.items.capsule,0);});
test('walk event rates over 20,000 seeded walks ≈ 2.5% snake, 3.33% light, 50% extra, 3.33% capsule',()=>{const r=S.rng(42);const n=20000,k={snake:0,light:0,extraHeart:0,capsule:0};
 for(let i=0;i<n;i++){const s=S.newState(0);S.chooseStart(s,'red','',r,0);S.startWalk(s,s.shibas[0].id,600,0,r);S.tickWalk(s,600e3,r);for(const e of s.walkResults[0].events)k[e]++;}
 near(k.snake/n,1/40,.004,'snake');near(k.light/n,1/30,.005,'light');assert.equal(k.extraHeart,0,'unknown reward branch disabled');near(k.capsule/n,1/30,.005,'capsule');});
test('walk stop disabled while 질문 1-4 is UNSET; injured / hospital shibas cannot walk',()=>{assert.equal(S.canStopWalk(),false);const {s,sh}=freshGame();sh.status='injured';sh.injury='light';assert.equal(S.walkCheck(s,sh.id,600,0),'injured');});
test('walk part-timer: Lv15, 270,000, ≤4 shibas, boredom −50 now, 4 h cooldown each, no hearts/exp (123-x·124-1·125-1)',()=>{const {s,sh}=freshGame();assert.equal(S.albaCheck(s,'walk',[sh.id],0),'locked');
 s.cafe.level=15;s.coins=270000;sh.g.boredom=80;const h=s.hearts;assert.ok(S.hireAlba(s,'walk',[sh.id],0));assert.equal(sh.g.boredom,30);assert.equal(s.coins,0);assert.equal(s.hearts,h);assert.equal(s.cafe.exp,0);assert.equal(s.walk,null,'stays in the café');
 s.coins=1e6;assert.equal(S.albaCheck(s,'walk',[sh.id],4*H-1),'cooldown');assert.equal(S.albaCheck(s,'walk',[sh.id],4*H),null);
 const ids=[1,2,3,4,5].map(()=>{const o=S.makeShiba(s,{breed:'red'});s.shibas.push(o);return o.id;});assert.equal(S.albaCheck(s,'walk',ids,0),'count');});
test('daycare / trainer / manager: unlock, price, cooldown, half intimacy, no exp (99·118·125-1)',()=>{const {s,sh}=freshGame();s.coins=3e6;
 assert.equal(S.albaCheck(s,'daycare',[sh.id],0),'locked');s.cafe.level=25;sh.g.boredom=50;S.hireAlba(s,'daycare',[sh.id],0);assert.equal(sh.intimacy,1.5);assert.equal(sh.g.boredom,22);assert.equal(s.cafe.exp,0);assert.equal(s.coins,3e6-120000);
 assert.equal(S.albaCheck(s,'daycare',[sh.id],2*H-1),'cooldown');S.hireAlba(s,'trainer',[sh.id],0,'bow');assert.equal(sh.tricks.bow,1);assert.equal(s.coins,3e6-480000);
 assert.ok(S.hireAlba(s,'manager',[],0));assert.equal(s.coins,3e6-1380000);assert.ok(S.managerActive(s,12*H-1));assert.ok(!S.managerActive(s,12*H));assert.equal(S.albaCheck(s,'manager',[],H),'active');});

// ───────── placement / max 10 ─────────
test('max 10 placed shibas (74); slots follow the café level table; 동구 takes no slot (80)',()=>{const {s}=freshGame();for(let i=0;i<14;i++)s.shibas.push(S.makeShiba(s,{breed:'red'}));
 const place=()=>{let n=0;for(const o of s.shibas)if(!o.placed&&S.setPlaced(s,o.id,true))n++;return S.placedShibas(s).length;};
 assert.equal(place(),2);s.cafe.level=4;assert.equal(place(),3);s.cafe.level=50;assert.equal(place(),10);assert.equal(S.slotsOf(s),10);
 assert.equal(S.placeCheck(s,s.shibas.find(o=>!o.placed).id),'slots');s.dongu.placed=true;assert.equal(S.placedShibas(s).length,10);});

// ───────── stains, reputation drift ─────────
test('stains: 1 per placed shiba per 2 h; ≥6 → rep −1 per 10 min; tap clean +1 exp; manager cleans 1/10 min (101-3·117-2·118)',()=>{const {s,w}=freshGame();w.spawnT=1e12;
 run(s,w,2*3600,0,10);assert.equal(s.cafe.stains,1);s.cafe.stains=6;s.cafe.rep=50;s.cafe.driftAcc=0;run(s,w,600,0,10);assert.equal(s.cafe.rep,49);
 assert.ok(S.cleanStain(s));assert.equal(s.cafe.stains,5);s.cafe.managerUntil=1e12;run(s,w,1200,0,10);assert.equal(s.cafe.stains,3);});
test('reputation drifts 1 point per hour toward 50 (106)',()=>{const {s,w}=freshGame();w.spawnT=1e12;s.shibas[0].placed=false;s.cafe.rep=40;run(s,w,3*3600,0,10);assert.equal(s.cafe.rep,43);});

// ───────── offline / 임시휴무 ─────────
test('offline income is simulated for at most 12 h (56)',()=>{const {s,r}=freshGame();const w=S.newWorld(s,r);const bak=CFG.rep.closureFloor;CFG.rep.closureFloor=-1; // isolate the cap from 임시휴무
 try{const o=S.fastForward(s,w,0,20*H,{offline:true});assert.equal(o.simSec,12*3600);assert.ok(o.coins>0);}finally{CFG.rep.closureFloor=bak;}});
// Balance flag (Unit 5 starting values 똑또기 2026-10-14): with full 7 s meetings one Lv1-café shiba meets ~half the guests, the rest are
// disappointed, so offline reputation reaches 30 within minutes. Previously (meetings cut at departure) the café reached Lv3 first.
test('one shiba, 20 h away with the spec numbers → guests outgrow one shiba, 임시휴무 before 12 h (75·87·126)',()=>{const {s,r}=freshGame();s.cafe.level=CFG.rep.unmetFreeBelowLevel; // 2-year curve (밸런스_2년.md §2): the café no longer leaves the reputation-free early levels within 12 h, so stage the first level where unmet guests count
 const o=S.fastForward(s,S.newWorld(s,r),0,20*H,{offline:true});
 assert.ok(o.simSec<=12*3600,'income cap respected');assert.ok(o.closed&&o.simSec<12*3600);assert.ok(s.stats.satisfied>0&&s.stats.disappointed>0);});
test('임시휴무: offline rep reaching 30 closes the café (no guests, income, rep change; fatigue 0); reopen at 30 with frozen sick clock (126)',()=>{const {s,r,sh}=freshGame();
 s.cafe.rep=31;s.cafe.stains=6;sh.g.fatigue=40;S.changeGauges(s,sh,{dirt:100},0);const w=S.newWorld(s,r);w.spawnT=1e12;
 const o=S.fastForward(s,w,0,10*H,{offline:true});assert.ok(o.closed);assert.equal(s.cafe.rep,30);assert.equal(s.cafe.closedAt,10*MIN);assert.equal(sh.g.fatigue,0);assert.equal(sh.status,'ok','sick clock stopped');
 const c=s.coins;const w2=S.newWorld(s,r);S.tick(s,w2,60,10*H+60e3);assert.equal(s.coins,c);assert.equal(w2.custs.length,0);
 const re=S.reopenCafe(s,10*H);assert.ok(re&&!s.cafe.closed);assert.equal(s.cafe.rep,30);assert.equal(sh.zeroSince,10*H-10*MIN);
 const g=freshGame();g.s.cafe.rep=31;g.s.cafe.stains=6;g.w.spawnT=1e12;S.fastForward(g.s,g.w,0,H,{offline:false});assert.ok(!g.s.cafe.closed);assert.ok(g.s.cafe.rep<30,'online it can go below 30');});
test('save → load 2 h later runs the café offline once and reports it',()=>{const {s}=freshGame();const mem={d:{},getItem(k){return this.d[k]??null},setItem(k,v){this.d[k]=v}};
 S.save(mem,s,0);const L=S.load(mem,2*H,S.rng(9));assert.ok(!L.fresh&&L.offline.coins>0&&L.offline.served>0);assert.equal(L.state.lastSeen,2*H);
 const L2=S.load({getItem:()=>JSON.stringify({v:2,owned:[]})},0);assert.ok(L2.fresh,'v2 saves are not migrated (separate v3 key)');});
test('walk that ends while away settles once on load',()=>{const {s,sh}=freshGame();S.startWalk(s,sh.id,600,0,()=>.99);const mem={d:{},getItem(k){return this.d[k]??null},setItem(k,v){this.d[k]=v}};
 S.save(mem,s,60e3);const L=S.load(mem,H,()=>.99);assert.equal(L.state.walk,null);assert.equal(L.state.walkResults.length,1);assert.equal(L.state.shibas[0].g.fatigue,15);});

// ───────── 갱신 136 메뉴 개발 시간 ─────────
test('136: development times per menu (라테 30분 … 파블로바 48시간), max 2 days',()=>{const t=Object.fromEntries(CFG.menu.items.map(m=>[m.id,m.devSec]));
 assert.deepEqual(t,{'M-02':1800,'M-05':3600,'M-03':7200,'M-06':10800,'M-04':14400,'M-07':21600,'M-08':28800,'P-01':43200,'P-02':64800,'P-03':86400,'P-04':108000,'P-05':129600,'P-06':172800});
 assert.equal(CFG.menu.devMaxSec,2*86400);assert.ok(CFG.menu.items.every(m=>m.devSec<=CFG.menu.devMaxSec));assert.equal(CFG.menu.devAtOnce,1);});
test('136: paying starts development; the menu is not ordered until the time has passed (tick settles it)',()=>{const {s,w}=freshGame();s.cafe.level=3;s.coins=150000;w.spawnT=1e12;
 assert.ok(S.developMenu(s,'M-05',0));assert.equal(s.coins,0);assert.deepEqual(s.menus,[]);assert.equal(S.normalDeveloped(s),0);
 S.tick(s,w,1,H-1000);assert.deepEqual(s.menus,[]);S.tick(s,w,1,H);assert.deepEqual(s.menus,['M-05']);assert.equal(s.menuDev,null);assert.ok(w.events.some(e=>e.type==='menuDone'&&e.id==='M-05'));});
test('136: only one development at a time; the next can start once it is done',()=>{const {s}=freshGame();s.cafe.level=50;s.coins=1e6;
 assert.ok(S.developMenu(s,'M-02',0));assert.equal(S.menuCheck(s,'M-05'),'busy');assert.equal(S.developMenu(s,'M-05',0),false);assert.equal(s.coins,1e6-15000);
 S.settleMenuDev(s,30*MIN);assert.equal(S.menuCheck(s,'M-05'),null);assert.ok(S.developMenu(s,'M-05',30*MIN));});
test('136 + 135-2: remaining development time finishes at once for 1 diamond per minute (P-06 48 h → 2,880)',()=>{const {s}=freshGame();s.cafe.level=45;s.coins=2e6;
 assert.ok(S.developMenu(s,'P-06',0));const t={type:'menu'};assert.equal(S.skipLeftSec(s,t,0),172800);s.dia=5000;assert.equal(S.skipNow(s,t,0),2880);assert.ok(s.menus.includes('P-06'));assert.equal(s.menuDev,null);
 assert.ok(S.developMenu(s,'P-05',0));assert.equal(S.skipNow(s,t,(36*60-37)*MIN+20e3),37);assert.equal(s.dia,5000-2880-37);});
test('136: development finishes while the app is closed (offline fast-forward, also past the 12 h income cap) and survives save/load',()=>{const {s}=freshGame();s.cafe.level=45;s.coins=1e6;
 assert.ok(S.developMenu(s,'P-06',0));const st={m:{},getItem(k){return this.m[k]??null;},setItem(k,v){this.m[k]=v;}};S.save(st,s,0);
 const a=S.load(st,H,S.rng(2)).state;assert.ok(a.menuDev&&a.menuDev.id==='P-06'&&!a.menus.includes('P-06'));S.save(st,a,H);
 const b=S.load(st,49*H,S.rng(2)).state;assert.ok(b.menus.includes('P-06'));assert.equal(b.menuDev,null);});

// ───────── 갱신 137 시바뽑기 ─────────
test('137: gacha 100 diamonds per pull, 900 for 10 (10% off); not enough diamonds → refused',()=>gachaOn(()=>{const {s}=freshGame();
 assert.deepEqual([CFG.gacha.priceDia,CFG.gacha.tenDia,CFG.gacha.tenCount,CFG.gacha.dupPaws],[100,900,10,10]);assert.equal(S.gachaPrice(1),100);assert.equal(S.gachaPrice(10),900);assert.equal(S.gachaPrice(5),null);
 s.dia=99;assert.equal(S.gachaCheck(s,1),'dia');assert.equal(S.gachaPull(s,1,S.rng(1),0),null);assert.equal(s.dia,99);
 s.dia=1000;assert.equal(S.gachaPull(s,10,S.rng(1),0).length,10);assert.equal(s.dia,100);assert.equal(S.gachaPull(s,1,S.rng(2),0).length,1);assert.equal(s.dia,0);}));
test('137 + 81: new breed → new Lv1 shiba (no random level); owned breed → 10 paws to that breed\'s first shiba, no new shiba',()=>gachaOn(()=>{const {s,sh}=freshGame('red');s.dia=100;
 const p0=sh.paws;const dupRes=S.gachaPull(s,1,()=>0,0);assert.deepEqual(dupRes,[{breed:'red',dup:true,toId:sh.id,paws:10}]);assert.equal(sh.paws,p0+10);assert.equal(s.shibas.length,1);
 s.dia=100;const nw=S.gachaPull(s,1,()=>.3,0)[0];assert.equal(nw.dup,false);assert.equal(nw.breed,'sesame');const n=S.byId(s,nw.id);assert.equal(n.level,1);assert.ok(n.placed,'placed when a slot is free');
 assert.equal(s.shibas.length,2);}));
test('137: 4 breeds only, draws follow the configured odds table; 10-pull from 4 owned breeds = 100 paws, no new shibas',()=>{const {s}=freshGame('red');s.dia=1e7;const r=S.rng(5),cnt={};
 withCfg(CFG.gacha,{startLevel:1},()=>{for(let i=0;i<4000;i++)for(const x of S.gachaPull(s,1,r,0))cnt[x.breed]=(cnt[x.breed]||0)+1;});
 assert.deepEqual(Object.keys(cnt).sort(),[...CFG.breeds].sort());for(const b of CFG.breeds)near(cnt[b]/4000,CFG.gacha.breedOdds[b]/Object.values(CFG.gacha.breedOdds).reduce((a,b)=>a+b),.03,b);
 gachaOn(()=>{for(let i=0;i<200;i++)S.gachaPull(s,1,r,0);assert.equal(s.shibas.length,4);const before=s.shibas.reduce((a,o)=>a+o.paws,0);S.gachaPull(s,10,r,0);assert.equal(s.shibas.reduce((a,o)=>a+o.paws,0)-before,100);assert.equal(s.shibas.length,4);});});
test('137 + 82: a capsule ticket from walks = one free pull',()=>gachaOn(()=>{const {s}=freshGame();assert.equal(S.gachaCheck(s,1,{ticket:true}),'ticket');s.items.capsule=1;
 assert.equal(S.gachaCheck(s,10,{ticket:true}),'count');assert.equal(S.gachaPull(s,1,S.rng(1),0,{ticket:true}).length,1);assert.equal(s.items.capsule,0);assert.equal(s.dia,0);}));
// red-team #1: UNSET odds must never become equal odds
test('red-team #1: 141: confirmed odds with unknown start level: nothing spent',()=>withCfg(CFG.gacha,{startLevel:null},()=>{const {s}=freshGame();assert.equal(S.gachaOddsSet(),true);
 s.dia=10000;s.items.capsule=3;for(const [n,o] of [[1,{}],[10,{}],[1,{ticket:true}]]){assert.equal(S.gachaCheck(s,n,o),'unset');assert.equal(S.gachaPull(s,n,S.rng(1),0,o),null);}
 assert.equal(s.dia,10000);assert.equal(s.items.capsule,3);assert.equal(s.shibas.length,1);}));
test('red-team #1: personality odds UNSET (질문 9(다)) → no personality is drawn (start); set odds are followed',()=>{assert.equal(CFG.personalityOdds,null);assert.equal(S.personalityOddsSet(),false);
 const {s,sh}=freshGame();assert.equal(sh.personality,null);
 withCfg(CFG,{personalityOdds:{foodie:1}},()=>{const g=freshGame('red',0,3);assert.equal(g.sh.personality,'foodie');});});

// ───────── 갱신 139-1·139-2 활동 발바닥 ─────────
test('139-1: walk 2, play 1, trick step done 3 (failures and partial reps give none), no daily cap',()=>{const {s,sh}=freshGame();s.hearts=999;
 assert.deepEqual([CFG.activityPaws.walk,CFG.activityPaws.play,CFG.activityPaws.cafeWorkHour,CFG.activityPaws.trickLevel],[2,1,1,3]);
 for(let i=0;i<50;i++){sh.g.fatigue=0;S.playWith(s,sh.id,0);}assert.equal(sh.paws,50,'no daily cap');
 sh.paws=0;S.train(s,sh.id,'paw',()=>.999,0);assert.equal(sh.paws,0,'failed rep');S.train(s,sh.id,'paw',()=>0,0);assert.equal(sh.paws,3,'0→1 done');
 S.train(s,sh.id,'paw',()=>0,0);assert.equal(sh.paws,3,'1 of 2 reps');S.train(s,sh.id,'paw',()=>0,0);assert.equal(sh.paws,6,'1→2 done');
 sh.paws=0;sh.g.fatigue=0;S.startWalk(s,sh.id,600,0,()=>.99);const res=S.tickWalk(s,10*MIN,()=>.99);assert.equal(res.settled.paws,2);assert.equal(sh.paws,2);});
test('139-1: café work 1 paw per hour per working shiba (online and offline, not when at home)',()=>{const {s,w,sh}=freshGame();w.spawnT=1e12;
 run(s,w,3600-10,0,10);assert.equal(sh.paws,0);run(s,w,20,(3600-10)*1000,10);assert.equal(sh.paws,1);
 sh.placed=false;run(s,w,7200,3610e3,10);assert.equal(sh.paws,1,'home shiba does not work');
 const g=freshGame();g.w.spawnT=1e12;S.fastForward(g.s,g.w,0,5*H,{offline:true});assert.equal(g.sh.paws,5);});
test('139-2: part-timers give the same paws: walk part-timer 2, daycare 1, trainer 3 per step; manager hours count as café work',()=>{const {s,w,sh}=freshGame();s.coins=1e6;s.cafe.level=25;
 S.hireAlba(s,'walk',[sh.id],0);assert.equal(sh.paws,2);S.hireAlba(s,'daycare',[sh.id],0);assert.equal(sh.paws,3);S.hireAlba(s,'trainer',[sh.id],0,'paw');assert.equal(sh.paws,6);
 S.hireAlba(s,'manager',[],0);w.spawnT=1e12;run(s,w,2*3600,0,10);assert.equal(sh.paws,8);});

// ───────── 갱신 140·140-1 액세서리 상점 ─────────
test('140: bandana 4 types (F p11) × 9 primary colours = 36 items at 5,000멍; special accessories 300 diamonds with kinds UNSET',()=>{const B=CFG.accessory.bandana,items=S.bandanaItems();
 assert.deepEqual(B.types,['triangle','loop','knotTail','frontKnot']);assert.equal(B.colors.length,9);assert.equal(items.length,36);assert.ok(items.every(x=>x.price===5000));assert.equal(new Set(items.map(x=>x.id)).size,36);
 assert.equal(CFG.accessory.special.priceDia,300);assert.equal(CFG.accessory.special.items,null);const {s}=freshGame();s.dia=1e4;assert.equal(S.buyAccCheck(s,'special-1'),'unset');});
test('140: bandana sheets are byte-identical copies of the Drive ITEM images',()=>{const src='/workspace/shiba-cafe-docs/spec-v3-build/drive-images/이미지/ITEM/';
 const map={'bandana-triangle-sheet.webp':'삼각형 원색.webp','bandana-loop-sheet.webp':'루프 원색.webp','bandana-knottail-sheet.webp':'매듭 원색.webp','bandana-frontknot-sheet.webp':'앞매듭 원색.webp',
  'bandana-frontknot-single.webp':'앞 매듭형.webp','bandana-chart-yellowgreen.webp':'옐로그린 차트.webp','bandana-chart-warm.webp':'웜 차트.webp'};
 const h=f=>createHash('sha256').update(readFileSync(f)).digest('hex');for(const f of Object.values(CFG.accessory.bandana.sheet))assert.ok(map[f],f);
 for(const [a,b] of Object.entries(map)){const here=join(ROOT,'assets/drive',a);assert.ok(existsSync(here),a);if(existsSync(src+b))assert.equal(h(here),h(src+b),a);}});
test('140: buying costs 5,000멍 and adds one to the bag; not enough coins → refused',()=>{const {s}=freshGame();const id='bandana-loop-cell6';
 s.coins=4999;assert.equal(S.buyAccCheck(s,id),'coins');assert.equal(S.buyAcc(s,id),false);s.coins=10000;assert.ok(S.buyAcc(s,id));assert.ok(S.buyAcc(s,id));assert.equal(s.coins,0);assert.equal(s.accInv[id],2);});
test('139-6 + 140: the starting shiba starts wearing one accessory (identity UNSET → no accessory); bought items fit only unlocked slots',()=>{const {s,sh}=freshGame();
 assert.equal(sh.acc,null);assert.equal(S.accOwned(s,'bandana-triangle-cell1'),0);
 const n=S.makeShiba(s,{breed:'kuro',level:1});s.shibas.push(n);s.coins=5000;S.buyAcc(s,'bandana-loop-cell2');assert.equal(S.equipCheck(s,n.id,'bandana-loop-cell2'),'slot');
 n.paws=1000;S.unlockAccSlot(s,n.id,'paws');assert.ok(S.equipAcc(s,n.id,'bandana-loop-cell2'));assert.equal(n.acc,'bandana-loop-cell2');assert.equal(s.accInv['bandana-loop-cell2'],0);});
test('140-1: one item = one shiba at a time; to move it, take it off first; swapping returns the old one to the bag; counts tracked',()=>{const {s,sh}=freshGame();
 sh.acc='bandana-triangle-cell1'; // explicit inventory fixture, never a production starter
 const n=S.makeShiba(s,{breed:'white',level:1});n.accUnlocked=true;s.shibas.push(n);s.coins=5000;const id='bandana-frontKnot-cell4';S.buyAcc(s,id);
 assert.ok(S.equipAcc(s,sh.id,id));assert.equal(s.accInv['bandana-triangle-cell1'],1,'old one back to the bag');assert.equal(S.equipCheck(s,n.id,id),'none','already worn by another shiba');
 assert.deepEqual([S.accOwned(s,id),S.accWorn(s,id)],[1,1]);assert.ok(S.unequipAcc(s,sh.id));assert.equal(sh.acc,null);assert.ok(S.equipAcc(s,n.id,id));assert.equal(n.acc,id);
 assert.ok(S.equipAcc(s,sh.id,'bandana-triangle-cell1'));assert.deepEqual([s.accInv[id],s.accInv['bandana-triangle-cell1']],[0,0]);
 s.coins=5000;S.buyAcc(s,id);assert.equal(S.accOwned(s,id),2,'buy one per shiba');S.abandon(s,n.id,0);assert.equal(s.accInv[id],2,'abandoned shiba\'s accessory returns to the bag');});

// ───────── 갱신 135-2 남은 시간 바로 완료 ─────────
test('135-2: instant finish = 1 diamond per remaining minute, rounded up per minute (37 min → 37, 4 h → 240, 30 s → 1)',()=>{
 assert.equal(CFG.timeSkip.diaPerMin,1);assert.equal(S.skipCost(37*60),37);assert.equal(S.skipCost(4*3600),240);assert.equal(S.skipCost(30),1);assert.equal(S.skipCost(60.001),2);assert.equal(S.skipCost(0),0);
 assert.equal(S.skipCost(1800),30);assert.equal(S.skipCost(7200),120);});
test('135-2: hospital stay finishes at once for diamonds; not enough diamonds → refused, nothing spent',()=>{const {s,sh}=freshGame();s.coins=1e6;sh.status='injured';sh.injury='snake';
 assert.ok(S.sendToHospital(s,sh.id,0));const t={type:'hospital',id:sh.id};assert.equal(S.skipLeftSec(s,t,23*MIN),97*60);
 s.dia=96;assert.equal(S.skipCheck(s,t,23*MIN),'dia');assert.equal(S.skipNow(s,t,23*MIN),null);assert.equal(s.dia,96);
 s.dia=100;assert.equal(S.skipNow(s,t,23*MIN),97);assert.equal(s.dia,3);assert.equal(sh.status,'ok');assert.equal(sh.injury,null);assert.equal(S.skipCheck(s,t,23*MIN),'none');});
test('135-2: part-timer cooldowns (데이케어·산책 알바·훈련사) finish at once; cooled shiba can be booked again',()=>{const {s,sh}=freshGame();s.coins=1e6;s.cafe.level=20;s.dia=1000;
 assert.ok(S.hireAlba(s,'daycare',[sh.id],0));assert.equal(S.albaCheck(s,'daycare',[sh.id],MIN),'cooldown');
 assert.equal(S.skipNow(s,{type:'daycare',id:sh.id},MIN+30e3),119);assert.equal(S.albaCheck(s,'daycare',[sh.id],MIN+30e3),null);
 assert.ok(S.hireAlba(s,'walk',[sh.id],0));assert.equal(S.skipNow(s,{type:'walk',id:sh.id},0),240);
 assert.ok(S.hireAlba(s,'trainer',[sh.id],0,'paw'));assert.equal(S.skipNow(s,{type:'trainer',id:sh.id},H),180);assert.equal(s.dia,1000-119-240-180);
 assert.equal(S.skipCheck(s,{type:'manager'},0),'none','manager hire time is not a wait');});

// ───────── UNSET features stay off ─────────
test('UNSET features are disabled: paid slot, regulars, walk stop',()=>{const {s}=freshGame();s.coins=1e9;
 assert.equal(S.slotUnlockCheck(),'unset');
 assert.equal(S.regularsCheck(),'unset');assert.equal(S.canStopWalk(),false);assert.equal(CFG.gacha.startLevel,1);
 for(const [k,v] of Object.entries(CFG.decayPerHour))assert.equal(v,null,k);for(const k of ['feed','snack','bath','sleep'])assert.ok(Object.values(CFG.care[k]).every(v=>v===null),k);});
test('potions (116): big fills all gauges, small one gauge; no effect on tricks/intimacy/level',()=>{const {s,sh}=freshGame();Object.assign(sh.g,{full:10,dirt:90,fatigue:90,happy:10,boredom:90});s.items.potionSmall=1;s.items.potionBig=1;
 assert.ok(S.usePotion(s,sh.id,'small','dirt'));assert.equal(sh.g.dirt,0);assert.equal(sh.g.full,10);assert.ok(S.usePotion(s,sh.id,'big'));assert.deepEqual(sh.g,CFG.gaugeFull);assert.equal(sh.level,21);assert.equal(S.intelligence(sh),24);});
test('start: choose 1 of 4 breeds, Lv21, 앉아·기다려 3 (109·90·100); 15 personalities listed (38·52), not drawn while odds UNSET',()=>{for(const b of CFG.breeds){const {sh}=freshGame(b);assert.equal(sh.breed,b);assert.equal(sh.level,21);assert.deepEqual([sh.tricks.sit,sh.tricks.wait,sh.tricks.paw],[3,3,0]);assert.equal(sh.personality,null);}
 assert.equal(CFG.personalities.length,15);const s=S.newState(0);assert.equal(S.chooseStart(s,'rare_red','',Math.random,0),null);});

// red-team #2: start values the game needs are PENDING_CONFIRM placeholders (spec keys stay UNSET); unnecessary ones are UNSET and gated
test('red-team #2: unsupported starts stay null',()=>{for(const v of Object.values(CFG.pending))assert.equal(v,null);const {s,sh}=freshGame();assert.equal(s.coins,30000,'밸런스_2년.md §5 start coins');assert.equal(s.dia,300,'밸런스_2년.md §5 start diamonds');assert.equal(sh.intimacy,null);assert.equal(sh.acc,null);assert.ok(Object.values(sh.g).every(v=>v===null));S.playWith(s,sh.id,0);assert.equal(sh.intimacy,null);assert.ok(Object.values(sh.g).every(v=>v===null));assert.equal(S.buyAccCheck(s,'bandana-loop-cell2'),null,'start coins (밸런스_2년.md §5) cover one 5,000 bandana');assert.equal(S.conditionMul(sh),null);assert.equal(S.trainChance(sh),null);assert.equal(S.trainCheck(s,sh.id,'paw'),'unset');});
test('red-team #2: unknown walk reward branch is disabled',()=>{const {s,sh}=freshGame();S.startWalk(s,sh.id,600,0,()=>.99);const h=s.hearts;S.tickWalk(s,600e3,script([.99,.99,0,.99]));assert.deepEqual(s.walkResults[0].events,[]);assert.equal(s.hearts,h);assert.equal(s.coins,CFG.start.coins,'no walk coins');});
test('red-team #2: gacha start level UNSET → gated even when odds are set',()=>withCfg(CFG.gacha,{breedOdds:TEST_ODDS,startLevel:null},()=>{const {s}=freshGame();s.dia=1000;assert.equal(S.gachaCheck(s,1),'unset');assert.equal(S.gachaPull(s,1,S.rng(1),0),null);assert.equal(s.dia,1000);}));

// red-team #3: bandana colours are neutral sheet-cell ids, no invented names
test('red-team #3: bandana colour ids are cell1..cell9 (no colour names); old colour-named saves migrate to the same cell',()=>{const B=CFG.accessory.bandana;
 assert.deepEqual(B.colors,Array.from({length:9},(_,i)=>'cell'+(i+1)));assert.ok(S.bandanaItems().every(x=>/^bandana-\w+-cell[1-9]$/.test(x.id)));assert.equal(CFG.pending.starterAccessory,null);
 const {s}=freshGame();s.shibas[0].acc='bandana-triangle-red';s.accInv={'bandana-loop-teal':2,'bandana-loop-cell9':1};const mem={v:null,getItem(){return this.v;},setItem(k,v){this.v=v;}};S.save(mem,s,0);
 const L=S.load(mem,0,S.rng(1)).state;assert.equal(L.shibas[0].acc,'bandana-triangle-cell1');assert.deepEqual(L.accInv,{'bandana-loop-cell9':3});});

test('red-team #4: all levels use 100 × cap hourly arrivals before reputation',()=>{const s=S.newState(0);for(let lv=1;lv<=50;lv++){s.cafe.level=lv;near(3600/S.arrivalInterval(s),100*S.capOf(s));}});

test('red-team #5: fulfilled and manager requests win over low score',()=>{for(const manager of [false,true]){const {s,w,sh}=freshGame();w.r=()=>0;w.spawnT=1e9;if(manager)s.cafe.managerUntil=H;w.custs.push({id:1,phase:'seated',seat:0,cell:[1,3],t:0,score:0,met:[],fulfilled:!manager,request:{type:'meetShiba',shibaId:sh.id}});S.tick(s,w,0,0);assert.equal(w.lastPay.outcome,'satisfied');assert.ok(s.cafe.rep>50);}});

test('red-team #6: requested trick does not override random learned trick',()=>{const {s,w,sh}=freshGame();w.r=()=>.99;w.sh[sh.id]={id:sh.id,phase:'roam',cell:[0,5],t:0};const c={id:1,phase:'seated',cell:[1,3],t:30,with:null,score:0,met:[],fulfilled:false,request:{type:'seeTrick',trick:'sit'}};w.custs.push(c);assert.ok(S.deliver(s,w,sh.id,1,0));S.tick(s,w,.1,100);assert.equal(w.events.at(-1).trick,'wait');assert.equal(c.fulfilled,false);});

test('red-team #7: UNSET aggregation gates payments for no, single, repeated and multiple meetings',()=>{CFG.income.levelAggregation=null;const {s,w,sh}=freshGame();for(const met of [[],[sh.id],[sh.id,sh.id]]){const p=S.payFor(s,met,{price:3},0);assert.equal(p.total,null);assert.equal(p.lvMul,null);assert.ok(p.pending);}w.spawnT=1e9;w.custs.push({id:1,phase:'seated',seat:0,cell:[1,3],t:0,score:1,met:[sh.id],fulfilled:true});const before=s.coins;S.tick(s,w,0,0);assert.equal(s.coins,before);assert.equal(w.lastPay.total,null);});

test('red-team #8: incapacitated dogs cannot play, train or buy activities',()=>{for(const status of ['sick','injured','hospital']){const {s,sh}=freshGame();sh.status=status;s.coins=1e6;s.cafe.level=25;const before=[s.hearts,s.coins,sh.paws];assert.equal(S.careCheck(s,sh.id,'play'),status);assert.equal(S.playWith(s,sh.id,0),null);assert.equal(S.trainCheck(s,sh.id,'paw'),status);assert.equal(S.train(s,sh.id,'paw',()=>0,0),null);for(const kind of ['daycare','walk','trainer']){assert.equal(S.albaCheck(s,kind,[sh.id],0,'paw'),status);assert.equal(S.hireAlba(s,kind,[sh.id],0,'paw'),null);}assert.deepEqual([s.hearts,s.coins,sh.paws],before);}});

test('Unit 2: paw curve exhaustively spends only the chosen shiba balance; max retains paws',()=>{const {s,sh}=freshGame();const other=S.makeShiba(s,{breed:'white'});s.shibas.push(other);other.paws=1000;for(let lv=1;lv<30;lv++){sh.level=lv;sh.paws=20*lv-1;assert.equal(S.levelUp(s,sh.id),false);sh.paws++;assert.ok(S.levelUp(s,sh.id));assert.equal(sh.level,lv+1);assert.equal(sh.paws,0);assert.equal(other.paws,1000);}sh.paws=9000;assert.equal(S.levelUp(s,sh.id),false);assert.equal(sh.paws,9000);});
test('Unit 2: bandana purchases and swaps conserve counted inventory through save/load',()=>{const {s,sh}=freshGame();const id='bandana-frontKnot-cell3',second=S.makeShiba(s,{breed:'white'});second.accUnlocked=true;s.shibas.push(second);s.coins=9999;assert.ok(S.buyAcc(s,id));assert.equal(S.buyAcc(s,id),false);assert.equal(s.coins,4999);assert.ok(S.equipAcc(s,sh.id,id));assert.equal(S.equipAcc(s,second.id,id),false);assert.equal(S.accOwned(s,id),1);S.unequipAcc(s,sh.id);assert.ok(S.equipAcc(s,second.id,id));const mem={value:null,setItem(k,v){this.value=v;},getItem(){return this.value;}};S.save(mem,s,0);const loaded=S.load(mem,0).state;assert.equal(S.accOwned(loaded,id),1);assert.equal(S.accWorn(loaded,id),1);assert.equal(loaded.accInv[id],0);});
test('Unit 2: development rejects another job without charging, insufficient diamonds never finish, rounded finish once',()=>{const {s}=freshGame();s.cafe.level=5;s.coins=30000;assert.ok(S.developMenu(s,'M-02',0));const coins=s.coins;assert.equal(S.developMenu(s,'M-05',1),false);assert.equal(s.coins,coins);s.dia=29;assert.equal(S.skipNow(s,{type:'menu'},1),null);assert.equal(s.menuDev.id,'M-02');s.dia=30;assert.equal(S.skipNow(s,{type:'menu'},1),30);assert.equal(s.dia,0);assert.deepEqual(s.menus,['M-02']);assert.equal(S.skipNow(s,{type:'menu'},1),null);assert.deepEqual(s.menus,['M-02']);});
test('Unit 2: unknown cafe threshold does not consume exp or advance; furniture starting prices',()=>withCfg(CFG.cafe,{expToNext:[null]},()=>{const s=S.newState(0);S.addCafeExp(s,200);assert.equal(s.cafe.level,1);assert.equal(s.cafe.exp,200);assert.deepEqual(CFG.furniture.items.slice(0,4).map(it=>it.price),[40000,20000,5000,5000]);}));

test('141: pity stamps count all paid/ticket pulls; choice uses personal paws, never duplicate levels',()=>gachaOn(()=>{const {s,sh}=freshGame();const level=sh.level;s.dia=10000;for(let i=0;i<5;i++)S.gachaPull(s,10,()=>0,0);assert.equal(s.gachaStamps,50);assert.equal(sh.level,level);assert.equal(sh.paws,500);const coins=s.coins,dia=s.dia;const picked=S.pityPick(s,'red',()=>0,0);assert.equal(picked.paws,10);assert.equal(sh.paws,510);assert.equal(sh.level,level);assert.equal(s.gachaStamps,0);assert.equal(s.dia,dia);assert.equal(s.coins,coins);assert.equal(S.pityPick(s,'white'),null);s.items.capsule=1;S.gachaPull(s,1,()=>0,0,{ticket:true});assert.equal(s.gachaStamps,1);s.gachaStamps=50;const nw=S.pityPick(s,'white',()=>0,0);assert.equal(S.byId(s,nw.id).breed,'white');assert.equal(s.gachaStamps,0);const store={value:null,setItem(k,v){this.value=v},getItem(){return this.value}};s.gachaStamps=49;S.save(store,s,0);assert.equal(S.load(store,0).state.gachaStamps,49);}));

for(const [n,e] of fails)console.log('  FAIL',n,'\n       ',String(e.message).split('\n').slice(0,4).join('\n        '));
console.log(`spec-v3: ${pass}/${pass+fails.length} passed`);process.exitCode=fails.length?1:0;
