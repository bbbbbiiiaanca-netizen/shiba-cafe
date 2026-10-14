// Spec v3 acceptance tests (node, no deps). Run: node tests/spec-v3.test.mjs  (or npm test)
import assert from 'node:assert/strict';
import {CFG,pressureAt} from '../config.js';
import * as S from '../sim.js';
import {existsSync} from 'node:fs';import {join,dirname} from 'node:path';import {fileURLToPath} from 'node:url';
const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');

let pass=0;const fails=[];
function test(name,fn){try{fn();pass++;}catch(e){fails.push([name,e]);}}
const H=3600e3,MIN=60e3;
const near=(a,b,eps=1e-9,msg)=>assert.ok(Math.abs(a-b)<=eps,`${msg||''} ${a} ≉ ${b}`);
const freshGame=(breed='red',now=0,seed=1)=>{const r=S.rng(seed),s=S.newState(now);S.chooseStart(s,breed,'',r,now);return {s,r,sh:s.shibas[0],w:S.newWorld(s,r)};};
// scripted RNG: returns the given values in order, then `rest`
const script=(vals,rest=.99)=>{let i=0;return()=>i<vals.length?vals[i++]:rest;};
const run=(s,w,sec,t0=0,dt=.5)=>{let t=t0;const ev=[];for(let k=0;k<sec/dt;k++){t+=dt*1000;S.tick(s,w,dt,t);ev.push(...w.events.splice(0));}return {t,ev};};

// ───────── spec numbers used (config ↔ spec) ─────────
test('갱신 75 pressure table: 50 rows, spot values, cap = ceil(slots×2.2) (70·71)',()=>{
 assert.equal(CFG.cafe.pressure.length,50);
 assert.deepEqual(pressureAt(1),{slots:2,cap:5,interval:7.5,pct:125});assert.deepEqual(pressureAt(3),{slots:2,cap:5,interval:5.1,pct:85});
 assert.deepEqual(pressureAt(16),{slots:6,cap:14,interval:2.5,pct:125});assert.deepEqual(pressureAt(42),{slots:10,cap:22,interval:1.6,pct:125});
 assert.deepEqual(pressureAt(50),{slots:10,cap:22,interval:1.1,pct:85});
 for(let lv=1;lv<=50;lv++){const p=pressureAt(lv);assert.equal(p.cap,Math.ceil(+(p.slots*CFG.cafe.capFromSlots).toFixed(6)),'lv'+lv);}
 // slots only grow at the 125% (숨통) levels (73)
 for(let lv=2;lv<=50;lv++)if(pressureAt(lv).slots>pressureAt(lv-1).slots)assert.equal(pressureAt(lv).pct,125,'lv'+lv);});
test('갱신 98 café exp table: 49 steps, 120 … 37,870, total 676,180; max level 50 (73)',()=>{
 const e=CFG.cafe.expToNext;assert.equal(e.length,49);assert.equal(e[0],120);assert.equal(e[6],1850);assert.equal(e[48],37870);assert.equal(e.reduce((a,b)=>a+b,0),676180);assert.equal(CFG.cafe.maxLevel,50);});
test('spec numbers: stay/queue/visit/rep/hearts/walk/hospital/part-timers/payment',()=>{
 const C=CFG;assert.equal(C.cafe.stayingSec,30);assert.equal(C.cafe.queueMax,10);assert.equal(C.cafe.queueWaitSec,30);assert.equal(C.cafe.maxPlaced,10);assert.equal(C.cafe.maxOwned,50);
 assert.equal(C.visit.meetSec,7);assert.equal(C.visit.roamSec,5);assert.equal(C.rep.start,50);assert.equal(C.rep.queueAngry,-2);assert.equal(C.rep.closureFloor,30);
 assert.deepEqual([C.hearts.regenCap,C.hearts.regenEverySec],[10,1800]);assert.deepEqual(C.walk.durationsSec,[600,1200,1800]);assert.equal(C.walk.cooldownSec,0);
 assert.equal(C.walk.events.rescue,.05);assert.equal(C.walk.events.snake,1/40);assert.equal(C.walk.events.light,1/30);assert.equal(C.walk.events.capsule,1/30);assert.equal(C.walk.events.extra,.5);
 assert.deepEqual(C.hospital.stays,{light:1800,snake:7200,sick:14400});assert.equal(C.offline.capHours,12);
 assert.deepEqual([C.alba.daycare.cost,C.alba.walk.cost,C.alba.trainer.cost,C.alba.manager.cost],[8000,18000,24000,60000]);
 assert.deepEqual([C.alba.daycare.cooldownSec,C.alba.walk.cooldownSec,C.alba.trainer.cooldownSec,C.alba.manager.hireSec],[7200,14400,14400,43200]);
 assert.deepEqual([C.alba.daycare.unlock,C.alba.walk.unlock,C.alba.trainer.unlock,C.alba.manager.unlock],[10,15,20,25]);
 assert.equal(C.alba.walk.maxShibas,4);assert.equal(C.alba.walk.boredom,-50);
 assert.equal(C.menu.coffee.price,1);assert.equal(C.menu.coffee.id,'M-01');assert.deepEqual([C.menu.premiumDrinkPrice,C.menu.premiumDessertPrice],[3,5]);assert.equal(C.gacha.priceDia,200);assert.equal(C.stub.diaPriceWon,10);
 assert.deepEqual(C.cooldownTicketDia,{one:20,five:80});assert.deepEqual(C.potion,{bigDia:150,smallDia:50});});
test('갱신 133: exactly 5 tricks from config (앉아·손·기다려·엎드려·인사), max step 5, ×4',()=>{
 assert.deepEqual(CFG.tricks.map(t=>t.id),['sit','paw','wait','down','bow']);assert.equal(CFG.trickMaxLevel,5);assert.equal(CFG.intelligencePerLevel,4);assert.equal(CFG.intelligenceMax,100);});
test('grades abolished: no grade/rarity anywhere in config or shibas',()=>{
 const txt=JSON.stringify(CFG);assert.ok(!/"grades?"|rarity|"SR"/.test(txt));const {sh}=freshGame();assert.ok(!('grade' in sh)&&!('rarity' in sh));});
test('도감 and in-game YouTube are not in the build',async()=>{});

// ───────── formulas ─────────
test('shiba level income effect ×(1+0.05(L−1)) (81): Lv10 1.45, Lv21 2.0, Lv30 2.45',()=>{near(S.levelEffect(1),1);near(S.levelEffect(10),1.45);near(S.levelEffect(21),2);near(S.levelEffect(30),2.45);});
test('paw exp 10×N per level, cumulative 4,350 to Lv30, cap 30 (81)',()=>{let tot=0;for(let l=1;l<30;l++)tot+=S.pawsToNext(l);assert.equal(tot,4350);assert.equal(S.pawsToNext(30),null);
 const {sh}=freshGame();sh.level=1;assert.equal(S.addPaws(sh,10),1);assert.equal(sh.level,2);S.addPaws(sh,99999);assert.equal(sh.level,30);assert.equal(sh.paws,0);});
test('intelligence = sum of trick steps × 4, capped at 100 (133)',()=>{const {sh}=freshGame();assert.equal(S.intelligence(sh),24); // 앉아·기다려 3단계 (100·109)
 for(const t of CFG.tricks)sh.tricks[t.id]=5;assert.equal(S.intelligence(sh),100);
 CFG.tricks.push({id:'extra'});sh.tricks.extra=5;try{assert.equal(S.intelligence(sh),100);}finally{CFG.tricks.pop();}});
test('accessory slots by level 5/15/25 (90); start shiba Lv21 has 2',()=>{assert.equal(S.accessorySlots(4),0);assert.equal(S.accessorySlots(5),1);assert.equal(S.accessorySlots(15),2);assert.equal(S.accessorySlots(25),3);assert.equal(S.accessorySlots(21),2);});
test('café exp curve: level ups at table values, Lv7 after 2,970 exp, stops at 50',()=>{const s=S.newState(0);S.addCafeExp(s,119);assert.equal(s.cafe.level,1);S.addCafeExp(s,1);assert.equal(s.cafe.level,2);
 const t=S.newState(0);S.addCafeExp(t,2970);assert.equal(t.cafe.level,7);assert.equal(t.cafe.exp,0);S.addCafeExp(t,1e9);assert.equal(t.cafe.level,50);});
test('premium chance 5% + (rep−50)×0.3%p, +15%p satisfied, cap 40% (120)',()=>{near(S.premiumChance(50,false),.05);near(S.premiumChance(30,false),.05);near(S.premiumChance(70,false),.11);near(S.premiumChance(90,false),.17);near(S.premiumChance(90,true),.32);near(S.premiumChance(100,true),.35);
 const bak=CFG.menu.premiumSatisfiedBonus;CFG.menu.premiumSatisfiedBonus=.5;try{near(S.premiumChance(100,true),.4);}finally{CFG.menu.premiumSatisfiedBonus=bak;}});
test('income = base × level effect (met shibas avg) × item (75·120); fractions kept (120)',()=>{const {s,sh}=freshGame();
 assert.equal(S.payFor(s,[sh.id],{price:1}).total,2);assert.equal(S.payFor(s,[],{price:1}).total,1);
 const o=S.makeShiba(s,{breed:'kuro',level:1});s.shibas.push(o);near(S.payFor(s,[sh.id,o.id],{price:3}).total,3*1.5);
 s.cafe.boostUntil=1e15;near(S.payFor(s,[sh.id],{price:1}).total,2.4);});
test('갱신 134/134-1 menu table: 13 items, unlock level & price from 134, dev cost from 134-1 (not 134)',()=>{
 const T={'M-02':['drink',2,8500,3],'M-05':['dessert',3,10000,5],'M-03':['drink',5,12000,3],'M-06':['dessert',7,13500,5],'M-04':['drink',9,15000,3],'M-07':['dessert',12,17000,5],'M-08':['dessert',15,18500,5],
  'P-01':['premium',20,23500,8],'P-02':['premium',25,27000,8],'P-03':['premium',30,30500,8],'P-04':['premium',35,32000,8],'P-05':['premium',40,34000,8],'P-06':['premium',45,35500,8]};
 assert.equal(CFG.menu.items.length,13);for(const m of CFG.menu.items)assert.deepEqual([m.kind,m.unlockLevel,m.devCost,m.price],T[m.id],m.id);
 const old134=[1500,1500,2000,2500,3000,3500,4000,12000,14000,16000,17000,18000,20000];assert.ok(CFG.menu.items.every((m,i)=>m.devCost!==old134[i]),'134 dev costs replaced by 134-1');
 assert.equal(CFG.menu.premiumPerNormalDeveloped,.01);assert.equal(CFG.menu.premiumUpgradeChance,.3);assert.equal(CFG.menu.premiumCap,.4);
 for(const m of [CFG.menu.coffee,...CFG.menu.items])assert.ok(existsSync(join(ROOT,'assets/drive',m.img)),m.img);});
test('menu development: 멍코인, gated by café level, once each (129·134)',()=>{const {s}=freshGame();s.coins=8499;
 assert.equal(S.menuCheck(s,'M-02'),'locked','M-02 unlocks at Lv2');s.cafe.level=2;assert.equal(S.menuCheck(s,'M-02'),'coins');s.coins=8500;assert.ok(S.developMenu(s,'M-02',0));assert.equal(s.coins,0);assert.equal(S.menuCheck(s,'M-02'),'developing');S.settleMenuDev(s,30*MIN);assert.equal(S.menuCheck(s,'M-02'),'owned');
 s.coins=1e6;assert.equal(S.menuCheck(s,'M-05'),'locked');s.cafe.level=3;assert.ok(S.developMenu(s,'M-05',0));assert.equal(s.coins,1e6-10000);S.settleMenuDev(s,H);
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
 Object.assign(sh.g,{happy:50,dirt:60});near(S.conditionMul(sh),.7);sh.g.dirt=80;near(S.conditionMul(sh),.5);sh.g.fatigue=80;near(S.conditionMul(sh),.25);sh.g.full=30;near(S.conditionMul(sh),.25);
 Object.assign(sh.g,{dirt:0,fatigue:60,full:30});near(S.conditionMul(sh),.7*.8);
 Object.assign(sh.g,{dirt:0,fatigue:0,full:100,happy:70});near(S.meetingScore(sh,0),1.2);near(S.meetingScore(sh,3),1.3);sh.g.happy=0;near(S.meetingScore(sh,5),1.25);});
test('training chance 60% +15 intimacy≥70 +10 happy≥70 −20 fatigue≥60 −15 boredom≥60, 20–95% (100)',()=>{const {sh}=freshGame();sh.g.happy=0;near(S.trainChance(sh),.6);
 sh.intimacy=70;sh.g.happy=70;near(S.trainChance(sh),.85);sh.g.fatigue=60;sh.g.boredom=60;near(S.trainChance(sh),.5);sh.intimacy=0;sh.g.happy=0;near(S.trainChance(sh),.25);});
test('reputation: satisfied gain halves ≥70, quarters ≥90; arrival interval ×0.9/1.0/1.2 (87·106)',()=>{assert.equal(S.satisfiedGain(50),1);assert.equal(S.satisfiedGain(70),.5);assert.equal(S.satisfiedGain(90),.25);
 assert.equal(S.arrivalMul(70),.9);assert.equal(S.arrivalMul(50),1);assert.equal(S.arrivalMul(29.9),1.2);const s=S.newState(0);s.cafe.rep=75;near(S.arrivalInterval(s),7.5*.9);});
test('hospital & rescue-bath fixed costs by café level band (131)',()=>{const s=S.newState(0);const c=k=>S.hospitalCost(s,k);
 assert.deepEqual([c('light'),c('snake'),c('sick'),c('rescueBath')],[400,1200,2400,200]);s.cafe.level=10;assert.equal(c('snake'),1500);s.cafe.level=25;assert.equal(c('sick'),4700);s.cafe.level=39;assert.equal(c('light'),1000);s.cafe.level=45;assert.equal(c('rescueBath'),550);});

// ───────── customers ─────────
test('customer flow: arrive → seat → shiba 7 s meeting / 5 s roam → leave after 30 s → pay (69·70·120)',()=>{const {s,w,sh}=freshGame();
 const {ev}=run(s,w,600);const leaves=ev.filter(e=>e.type==='leave');assert.ok(leaves.length>=60,'served '+leaves.length);assert.equal(s.stats.served,leaves.length);
 const paid=leaves.reduce((a,e)=>a+e.coins,0);near(s.coins+s.coinFrac,paid,1e-6);assert.ok(leaves.every(e=>e.coins===2),'coffee 1 × Lv21 2.0');
 // meeting timing: 7 s at a guest then 5 s roaming
 const g=freshGame();const ws=g.w;let t=0,phase=[];for(let i=0;i<200;i++){t+=100;S.tick(g.s,ws,.1,t);phase.push(ws.sh[g.sh.id]?.phase);}
 const first=phase.indexOf('meet'),endM=phase.indexOf('roam',first);if(endM>0){const nextM=phase.indexOf('meet',endM);assert.ok(endM-first<=71,'meeting ≤7 s (+1 tick float)');if(nextM>0)assert.ok(Math.abs(nextM-endM-50)<=1,'roam 5 s: '+(nextM-endM));}});
test('queue: cap reached → queue (max 10); waiting 30 s → leaves angry, rep −2, no money (66·68·87)',()=>{const {s,w}=freshGame();s.cafe.rep=50;
 for(const sh of s.shibas)sh.placed=false; // nobody serves → seats stay full
 w.spawnT=1e9;for(let i=0;i<5;i++)w.custs.push({id:100+i,kind:'mom',phase:'seated',seat:i,t:999,score:0,met:[],with:null,fulfilled:false,request:null});
 for(let i=0;i<12;i++){w.spawnT=0;S.tick(s,w,0,0);w.spawnT=1e9;}assert.equal(w.queue.length,10);assert.equal(s.stats.lost,2);
 const c0=s.coins;run(s,w,30.5);assert.equal(w.queue.length,0);assert.equal(s.stats.angry,10);assert.equal(s.cafe.rep,30);assert.equal(s.coins,c0);});
test('0 meetings → disappointed (rep −1, exp 0); request met → satisfied (+1, exp +2); met but not met-request → normal (+0, exp +1) (70·86·87·106)',()=>{
 const a=freshGame();a.sh.placed=false;const {ev}=run(a.s,a.w,60);const L=ev.filter(e=>e.type==='leave');assert.ok(L.length&&L.every(e=>e.outcome==='disappointed'));assert.equal(a.s.cafe.exp,0);assert.equal(a.s.cafe.rep,50-L.length);assert.ok(L.every(e=>e.coins===1),'coffee still paid ×1');
 const b=freshGame();b.w.spawnT=1e9;b.w.custs.push({id:1,kind:'dad',phase:'seated',seat:0,t:30,score:0,met:[],with:null,fulfilled:false,request:{type:'meetShiba',shibaId:b.sh.id}});
 const rb=run(b.s,b.w,31).ev.find(e=>e.type==='leave');assert.equal(rb.outcome,'satisfied');assert.equal(b.s.cafe.exp,2);assert.equal(b.s.cafe.rep,51);
 const c=freshGame();c.w.spawnT=1e9;c.w.custs.push({id:1,kind:'dad',phase:'seated',seat:0,t:30,score:0,met:[],with:null,fulfilled:false,request:{type:'seeTrick',trick:'bow'}});
 const rc=run(c.s,c.w,31).ev.find(e=>e.type==='leave');assert.equal(rc.outcome,'normal');assert.equal(c.s.cafe.exp,1);assert.equal(c.s.cafe.rep,50);});
test('every normal guest gets a request that the café can meet now (106); none for interior while UNSET (113)',()=>{const {s,w}=freshGame();const {ev}=run(s,w,300);
 for(const c of w.custs)assert.ok(c.request&&['meetShiba','seeTrick'].includes(c.request.type));assert.equal(CFG.requests.interior.enabled,false);
 for(const c of w.custs)if(c.request.type==='seeTrick')assert.ok(['sit','wait'].includes(c.request.trick),'only tricks a placed shiba knows');});
test('drag a roaming shiba to a guest → 7 s meeting; busy shiba cannot be dragged (105)',()=>{const {s,w,sh}=freshGame();w.spawnT=1e9;
 w.custs.push({id:1,kind:'mom',phase:'seated',seat:0,t:30,score:0,met:[],with:null,fulfilled:false,request:null},{id:2,kind:'dad',phase:'seated',seat:1,t:30,score:0,met:[],with:null,fulfilled:false,request:null});
 w.sh[sh.id]={id:sh.id,phase:'roam',t:3,cust:null};assert.ok(S.deliver(s,w,sh.id,2,0));assert.equal(w.custs[1].with,sh.id);assert.equal(S.deliverCheck(s,w,sh.id,1),'busy');});
test('manager: ~30% of unmet requests fulfilled at half reputation, no café exp (118)',()=>{let mgr=0,n=0;for(let seed=1;seed<=400;seed++){const g=freshGame('red',0,seed);g.s.cafe.managerUntil=1e12;g.w.spawnT=1e9;
  g.w.custs.push({id:1,kind:'mom',phase:'seated',seat:0,t:.1,score:1,met:[g.sh.id],with:null,fulfilled:false,request:{type:'meetShiba',shibaId:g.sh.id}});g.w.sh[g.sh.id]={id:g.sh.id,phase:'roam',t:99,cust:null};
  const e=run(g.s,g.w,1).ev.find(e=>e.type==='leave');n++;if(e.byManager){mgr++;assert.equal(g.s.cafe.rep,50.5);assert.equal(g.s.cafe.exp,0);}}near(mgr/n,.3,.07,'manager share');});
test('a walking shiba gives no meetings; the rest keep working (15)',()=>{const {s,w,sh,r}=freshGame();const o=S.makeShiba(s,{breed:'kuro',level:1});o.placed=true;s.shibas.push(o);
 S.startWalk(s,sh.id,600,0,()=>.9);const {ev}=run(s,w,300);assert.ok(ev.filter(e=>e.type==='meet').every(e=>e.shibaId===o.id));});

// ───────── shiba care ─────────
test('play: ♥1, boredom −28 dirt +3 fatigue +5 happy +7 intimacy +3, café exp +1 (84·88·90)',()=>{const {s,sh}=freshGame();Object.assign(sh.g,{boredom:50,happy:50});
 assert.ok(S.playWith(s,sh.id,0));assert.equal(s.hearts,9);assert.deepEqual([sh.g.boredom,sh.g.dirt,sh.g.fatigue,sh.g.happy,sh.intimacy],[22,3,5,57,3]);assert.equal(s.cafe.exp,1);
 sh.g.fatigue=100;assert.equal(S.careCheck(s,sh.id,'play'),'sleeping');s.hearts=0;sh.g.fatigue=0;assert.equal(S.careCheck(s,sh.id,'play'),'hearts');});
test('training: ♥1, step N→N+1 needs N+1 successes, fatigue +5 on success (100·133); all 5 trainable from start',()=>{const {s,sh}=freshGame();s.hearts=100;
 for(const t of CFG.tricks)assert.equal(S.trainCheck(s,sh.id,t.id),null,t.id);
 let r=S.train(s,sh.id,'paw',()=>0,0);assert.ok(r.ok&&r.up&&sh.tricks.paw===1);assert.equal(sh.g.fatigue,5);
 S.train(s,sh.id,'paw',()=>0,0);assert.equal(sh.tricks.paw,1);S.train(s,sh.id,'paw',()=>0,0);assert.equal(sh.tricks.paw,2);
 const f=sh.g.fatigue;r=S.train(s,sh.id,'paw',()=>.999,0);assert.ok(!r.ok);assert.equal(sh.g.fatigue,f);assert.equal(s.hearts,96);
 sh.tricks.bow=5;assert.equal(S.trainCheck(s,sh.id,'bow'),'max');});
test('feed / snack / bath / sleep stay disabled while their amounts are UNSET',()=>{const {s,sh}=freshGame();for(const k of ['feed','snack','bath','sleep'])assert.equal(S.careCheck(s,sh.id,k),'unset',k);});
test('gauges do not change by themselves while decay rates are UNSET; START_FALLBACK = 116 full state',()=>{const {s,w,sh}=freshGame();assert.deepEqual(sh.g,CFG.gaugeFull);run(s,w,3600,0,2);assert.equal(sh.g.full,100);assert.equal(sh.g.happy,100);});
test('fatigue 100% → only sleeps: no walk, no play, no guests (1.10.0)',()=>{const {s,w,sh}=freshGame();sh.g.fatigue=100;assert.equal(S.statusOf(s,sh),'sleeping');assert.equal(S.walkCheck(s,sh.id,600,0),'sleeping');
 const {ev}=run(s,w,60);assert.equal(ev.filter(e=>e.type==='meet').length,0);});
test('sick after a 0 gauge for 2 h; hospital needs coins (no credit); 4 h stay; 동구 takes it after 24 h with 2× stay (111·111-1·112)',()=>{const {s,w,sh}=freshGame();
 S.changeGauges(s,sh,{dirt:100},0);run(s,w,2*3600-10,0,10);assert.equal(sh.status,'ok');run(s,w,20,2*3600e3-10e3,10);assert.equal(sh.status,'sick');
 assert.equal(S.hospitalCheck(s,sh.id),'coins');s.coins=2400;assert.ok(S.sendToHospital(s,sh.id,3*H));assert.equal(s.coins,0);assert.equal(sh.hospitalUntil,7*H);assert.equal(S.statusOf(s,sh),'hospital');
 const g=freshGame();S.changeGauges(g.s,g.sh,{happy:-100},0);g.s.coins=1e6;run(g.s,g.w,26*3600,0,60);assert.equal(g.sh.status,'hospital');assert.equal(g.sh.hospitalUntil-g.sh.hospitalUntil%1,(2+24)*H+2*14400e3);});
test('abandon: others −15, again within 24 h −20; the last shiba cannot be given up (76·82)',()=>{const {s,sh}=freshGame();const a=S.makeShiba(s,{breed:'kuro'}),b=S.makeShiba(s,{breed:'white'});a.intimacy=b.intimacy=50;s.shibas.push(a,b);
 S.abandon(s,sh.id,0);assert.equal(a.intimacy,35);S.abandon(s,b.id,10*H);assert.equal(a.intimacy,15);assert.equal(S.abandonCheck(s,a.id),'last');});
test('hearts: +1 per 30 min up to 10; reward hearts above 10; reset ticket only below 10 (1.4)',()=>{const s=S.newState(0);s.hearts=0;S.settleHearts(s,95*MIN);assert.equal(s.hearts,3);S.settleHearts(s,100*H);assert.equal(s.hearts,10);
 s.hearts=14;S.settleHearts(s,200*H);assert.equal(s.hearts,14);s.items.heartReset=1;assert.equal(S.useHeartReset(s,200*H),false);assert.equal(s.items.heartReset,1);
 s.hearts=4;assert.ok(S.useHeartReset(s,200*H));assert.equal(s.hearts,10);assert.equal(s.items.heartReset,0);});

// ───────── walks (seeded) ─────────
test('walk: hearts 1 per 10 min, no cooldown, effects by duration, exp +2/10 min (85·87·90·124-5·125-1)',()=>{const {s,sh}=freshGame();
 assert.equal(S.walkHearts(600),1);assert.equal(S.walkHearts(1800),3);assert.ok(S.startWalk(s,sh.id,1800,0,()=>.99));assert.equal(s.hearts,7);assert.equal(S.walkCheck(s,sh.id,600,0),'walking');
 S.tickWalk(s,1799e3,()=>.99);assert.ok(s.walk);const out=S.tickWalk(s,1800e3,()=>.99);assert.ok(out.settled&&!s.walk);
 assert.deepEqual([sh.g.boredom,sh.g.dirt,sh.g.fatigue,sh.g.happy,sh.intimacy],[0,35,35,100,6]);assert.equal(s.cafe.exp,6);
 assert.equal(S.walkCheck(s,sh.id,600,1800e3),null,'no cooldown');s.hearts=0;assert.equal(S.walkCheck(s,sh.id,600,1800e3),'hearts');});
test('walk outcomes with a scripted RNG: rescue at start, snake/light/extra/capsule at the end (82·83·124-2)',()=>{const {s,sh}=freshGame();
 S.startWalk(s,sh.id,600,0,script([.049,.5]));assert.equal(s.walk.rescueAt,300e3);
 const mid=S.tickWalk(s,300e3,script([.1,.1]));assert.ok(mid.rescued);assert.equal(s.rescues.length,1);
 const h=s.hearts;S.tickWalk(s,600e3,script([1/40-1e-9,.99,.49,1/30-1e-9]));assert.equal(sh.status,'injured');assert.equal(sh.injury,'snake');assert.equal(s.hearts,h+1);assert.equal(s.items.capsule,1);
 const g=freshGame();S.startWalk(g.s,g.sh.id,600,0,()=>.06);assert.equal(g.s.walk.rescueAt,null);S.tickWalk(g.s,600e3,script([.5,1/30-1e-9,.6,.5]));assert.equal(g.sh.injury,'light');assert.equal(g.s.items.capsule,0);});
test('walk event rates over 20,000 seeded walks ≈ 5% rescue, 2.5% snake, 3.33% light, 50% extra, 3.33% capsule',()=>{const r=S.rng(42);const n=20000,k={rescue:0,snake:0,light:0,extraHeart:0,capsule:0};
 for(let i=0;i<n;i++){const s=S.newState(0);S.chooseStart(s,'red','',r,0);S.startWalk(s,s.shibas[0].id,600,0,r);S.tickWalk(s,600e3,r);for(const e of s.walkResults[0].events)k[e]++;}
 near(k.rescue/n,.05,.006,'rescue');near(k.snake/n,1/40,.004,'snake');near(k.light/n,1/30,.005,'light');near(k.extraHeart/n,.5,.015,'extra');near(k.capsule/n,1/30,.005,'capsule');});
test('walk stop disabled while 질문 1-4 is UNSET; injured / hospital shibas cannot walk',()=>{assert.equal(S.canStopWalk(),false);const {s,sh}=freshGame();sh.status='injured';sh.injury='light';assert.equal(S.walkCheck(s,sh.id,600,0),'injured');});
test('rescue flow: bath (fixed 200 at Lv1) → reveal → bring (Lv1 while UNSET, café exp +10) or decline; owned cap 50 (65·66·81·131)',()=>{const {s,r}=freshGame();
 s.rescues.push({rid:'a',foundAt:0,breed:'kuro',pic:1,bathed:false},{rid:'b',foundAt:0,breed:'white',pic:0,bathed:false});
 assert.equal(S.bringCheck(s,'a'),'bath');assert.equal(S.bathRescue(s,'a'),null,'no coins');s.coins=250;assert.ok(S.bathRescue(s,'a'));assert.equal(s.coins,50);
 const o=S.bringRescue(s,'a',r,0);assert.equal(o.breed,'kuro');assert.equal(o.level,1);assert.ok(o.placed,'free slot at Lv1 (2 slots)');assert.equal(s.cafe.exp,10);
 assert.ok(S.declineRescue(s,'b'));assert.equal(s.rescues.length,0);
 while(s.shibas.length<50)s.shibas.push(S.makeShiba(s,{breed:'red'}));s.rescues.push({rid:'c',foundAt:0,breed:'red',pic:0,bathed:true});assert.equal(S.bringCheck(s,'c'),'owned');});
test('walk part-timer: Lv15, 18,000, ≤4 shibas, boredom −50 now, 4 h cooldown each, no hearts/exp (123-x·124-1·125-1)',()=>{const {s,sh}=freshGame();assert.equal(S.albaCheck(s,'walk',[sh.id],0),'locked');
 s.cafe.level=15;s.coins=18000;sh.g.boredom=80;const h=s.hearts;assert.ok(S.hireAlba(s,'walk',[sh.id],0));assert.equal(sh.g.boredom,30);assert.equal(s.coins,0);assert.equal(s.hearts,h);assert.equal(s.cafe.exp,0);assert.equal(s.walk,null,'stays in the café');
 s.coins=1e6;assert.equal(S.albaCheck(s,'walk',[sh.id],4*H-1),'cooldown');assert.equal(S.albaCheck(s,'walk',[sh.id],4*H),null);
 const ids=[1,2,3,4,5].map(()=>{const o=S.makeShiba(s,{breed:'red'});s.shibas.push(o);return o.id;});assert.equal(S.albaCheck(s,'walk',ids,0),'count');});
test('daycare / trainer / manager: unlock, price, cooldown, half intimacy, no exp (99·118·125-1)',()=>{const {s,sh}=freshGame();s.coins=1e6;
 assert.equal(S.albaCheck(s,'daycare',[sh.id],0),'locked');s.cafe.level=25;sh.g.boredom=50;S.hireAlba(s,'daycare',[sh.id],0);assert.equal(sh.intimacy,1.5);assert.equal(sh.g.boredom,22);assert.equal(s.cafe.exp,0);assert.equal(s.coins,1e6-8000);
 assert.equal(S.albaCheck(s,'daycare',[sh.id],2*H-1),'cooldown');S.hireAlba(s,'trainer',[sh.id],0,'bow');assert.equal(sh.tricks.bow,1);assert.equal(s.coins,1e6-32000);
 S.hireAlba(s,'manager',[],0);assert.ok(S.managerActive(s,12*H-1));assert.ok(!S.managerActive(s,12*H));assert.equal(S.albaCheck(s,'manager',[],H),'active');});

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
test('one shiba, 20 h away with the spec numbers → café levels up, guests outgrow one shiba, 임시휴무 before 12 h (75·87·126)',()=>{const {s,r}=freshGame();const o=S.fastForward(s,S.newWorld(s,r),0,20*H,{offline:true});
 assert.ok(o.closed&&o.simSec<12*3600,'closed after '+o.simSec+' s');assert.ok(s.cafe.level>=3);});
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
test('136: paying starts development; the menu is not ordered until the time has passed (tick settles it)',()=>{const {s,w}=freshGame();s.cafe.level=3;s.coins=10000;w.spawnT=1e12;
 assert.ok(S.developMenu(s,'M-05',0));assert.equal(s.coins,0);assert.deepEqual(s.menus,[]);assert.equal(S.normalDeveloped(s),0);
 S.tick(s,w,1,H-1000);assert.deepEqual(s.menus,[]);S.tick(s,w,1,H);assert.deepEqual(s.menus,['M-05']);assert.equal(s.menuDev,null);assert.ok(w.events.some(e=>e.type==='menuDone'&&e.id==='M-05'));});
test('136: only one development at a time; the next can start once it is done',()=>{const {s}=freshGame();s.cafe.level=50;s.coins=1e6;
 assert.ok(S.developMenu(s,'M-02',0));assert.equal(S.menuCheck(s,'M-05'),'busy');assert.equal(S.developMenu(s,'M-05',0),false);assert.equal(s.coins,1e6-8500);
 S.settleMenuDev(s,30*MIN);assert.equal(S.menuCheck(s,'M-05'),null);assert.ok(S.developMenu(s,'M-05',30*MIN));});
test('136 + 135-2: remaining development time finishes at once for 1 diamond per minute (P-06 48 h → 2,880)',()=>{const {s}=freshGame();s.cafe.level=45;s.coins=1e6;
 assert.ok(S.developMenu(s,'P-06',0));const t={type:'menu'};assert.equal(S.skipLeftSec(s,t,0),172800);s.dia=5000;assert.equal(S.skipNow(s,t,0),2880);assert.ok(s.menus.includes('P-06'));assert.equal(s.menuDev,null);
 assert.ok(S.developMenu(s,'P-05',0));assert.equal(S.skipNow(s,t,(36*60-37)*MIN+20e3),37);assert.equal(s.dia,5000-2880-37);});
test('136: development finishes while the app is closed (offline fast-forward, also past the 12 h income cap) and survives save/load',()=>{const {s}=freshGame();s.cafe.level=45;s.coins=1e6;
 assert.ok(S.developMenu(s,'P-06',0));const st={m:{},getItem(k){return this.m[k]??null;},setItem(k,v){this.m[k]=v;}};S.save(st,s,0);
 const a=S.load(st,H,S.rng(2)).state;assert.ok(a.menuDev&&a.menuDev.id==='P-06'&&!a.menus.includes('P-06'));S.save(st,a,H);
 const b=S.load(st,49*H,S.rng(2)).state;assert.ok(b.menus.includes('P-06'));assert.equal(b.menuDev,null);});

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
test('UNSET features are disabled: gacha, paid slot, regulars, walk stop, rescue level → Lv1',()=>{const {s}=freshGame();s.coins=1e9;
 assert.equal(S.gachaCheck(),'unset');assert.equal(S.slotUnlockCheck(),'unset');
 assert.equal(S.regularsCheck(),'unset');assert.equal(S.canStopWalk(),false);assert.equal(CFG.rescueLevel,null);
 for(const [k,v] of Object.entries(CFG.decayPerHour))assert.equal(v,null,k);for(const k of ['feed','snack','bath','sleep'])assert.ok(Object.values(CFG.care[k]).every(v=>v===null),k);});
test('potions (116): big fills all gauges, small one gauge; no effect on tricks/intimacy/level',()=>{const {s,sh}=freshGame();Object.assign(sh.g,{full:10,dirt:90,fatigue:90,happy:10,boredom:90});s.items.potionSmall=1;s.items.potionBig=1;
 assert.ok(S.usePotion(s,sh.id,'small','dirt'));assert.equal(sh.g.dirt,0);assert.equal(sh.g.full,10);assert.ok(S.usePotion(s,sh.id,'big'));assert.deepEqual(sh.g,CFG.gaugeFull);assert.equal(sh.level,21);assert.equal(S.intelligence(sh),24);});
test('start: choose 1 of 4 breeds, Lv21, 앉아·기다려 3 (109·90·100); personality from 15 (38·52)',()=>{for(const b of CFG.breeds){const {sh}=freshGame(b);assert.equal(sh.breed,b);assert.equal(sh.level,21);assert.deepEqual([sh.tricks.sit,sh.tricks.wait,sh.tricks.paw],[3,3,0]);assert.ok(CFG.personalities.includes(sh.personality));}
 assert.equal(CFG.personalities.length,15);const s=S.newState(0);assert.equal(S.chooseStart(s,'rare_red','',Math.random,0),null);});

for(const [n,e] of fails)console.log('  FAIL',n,'\n       ',String(e.message).split('\n').slice(0,4).join('\n        '));
console.log(`spec-v3: ${pass}/${pass+fails.length} passed`);process.exitCode=fails.length?1:0;
