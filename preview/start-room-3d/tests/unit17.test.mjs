import assert from 'node:assert/strict';
import * as S from '../sim.js';
import {CFG} from '../config.js';
import {tabBadges} from '../tabs.js';
let passed=0;const test=(name,fn)=>{fn();passed++;console.log('ok',name);};
const now=Date.UTC(2026,9,14,3);
const fresh=()=>{const s=S.newState(now);S.chooseStart(s,'red','',()=>.9,now);return s;};
const withCfg=(obj,patch,fn)=>{const bak={};for(const k in patch){bak[k]=obj[k];obj[k]=patch[k];}try{return fn();}finally{Object.assign(obj,bak);}};

test('§17 balance starting values 2026-10-14: meet 5 s, roam 3 s, unmet guests free below café Lv5',()=>{
 assert.equal(CFG.visit.meetSec,5);assert.equal(CFG.visit.roamSec,3);assert.equal(CFG.rep.unmetFreeBelowLevel,5);});

test('§17 early game: an unmet guest costs no reputation below Lv5, −1 from Lv5; met guests are unchanged',()=>{
 for(const [lv,rep] of [[1,50],[4,50],[5,49]]){const s=fresh();s.coins=0;s.cafe.level=lv;const w=S.newWorld(s,S.rng(3));w.spawnT=1e9;
  w.custs.push({id:1,kind:'mom',phase:'seated',cell:[1,3],t:.05,activity:'interact',met:[],score:0,with:null,fulfilled:false,request:null,order:{id:'M-01',kind:'coffee',price:1,img:'x'}});
  for(const sh of s.shibas)sh.placed=false;S.tick(s,w,.1,now+100);const e=w.events.find(e=>e.type==='leave');assert.equal(e.outcome,'disappointed');assert.equal(s.cafe.rep,rep,'Lv'+lv);}});

test('§17 upgrades: three kinds, null prices disabled (미정), queue +1, interval/price effects null',()=>{
 assert.deepEqual(Object.keys(CFG.upgrades),['interval','price','queue']);
 for(const k of Object.keys(CFG.upgrades))assert.equal(CFG.upgrades[k].price,null,k);
 assert.equal(CFG.upgrades.queue.effect,1);assert.equal(CFG.upgrades.interval.effect,null);assert.equal(CFG.upgrades.price.effect,null);
 const s=fresh();s.coins=1e9;assert.deepEqual(s.upgrades,{interval:0,price:0,queue:0});
 for(const k of Object.keys(CFG.upgrades)){assert.equal(S.upgradeCheck(s,k),'unset');assert.equal(S.buyUpgrade(s,k,now),false);}
 assert.equal(s.coins,1e9);assert.deepEqual(s.upgrades,{interval:0,price:0,queue:0});assert.equal(S.upgradeCheck(s,'nope'),'kind');});

test('§17 upgrades: with a test price, buying charges coins (no ledger line), raises the level; maxLevel caps',()=>{
 withCfg(CFG.upgrades.queue,{price:100,maxLevel:2},()=>{const s=fresh();s.coins=150;const cap=S.queueCells(s,S.newWorld(s)).length;
  assert.ok(S.buyUpgrade(s,'queue',now));assert.equal(s.coins,50);assert.equal(S.upgradeLevel(s,'queue'),1);assert.equal(S.queueCells(s,S.newWorld(s)).length,cap+1,'max guests +1');
  assert.ok(!S.ledgerStatement(s,now).lines.some(x=>x.id==='upgrade'),'가게 업그레이드 is not a ledger line');assert.equal(S.ledgerStatement(s,now).net,0);assert.equal(S.upgradeCheck(s,'queue'),'coins');
  s.coins=1000;assert.ok(S.buyUpgrade(s,'queue',now));assert.equal(S.upgradeCheck(s,'queue'),'max');assert.equal(S.queueCells(s,S.newWorld(s)).length,cap+2);});});

test('§17 upgrade hooks: queue +1 cell continues the grass line; null interval/price effects leave the game unchanged',()=>{
 const s=fresh();s.coins=0;const w=S.newWorld(s,S.rng(1));assert.equal(S.queueCells(s,w).length,CFG.navigation.queueCells);
 s.upgrades.queue=1;const q=S.queueCells(s,w);assert.equal(q.length,CFG.navigation.queueCells+1);assert.deepEqual(q.at(-1),[0,10]);
 for(const sh of s.shibas)sh.placed=false;w.navigation={entrance:[0,5],slots:[]};for(let i=0;i<7;i++){w.spawnT=0;S.tick(s,w,0,now);w.spawnT=1e9;}assert.equal(w.queue.length,5);
 const t=fresh();const base=S.arrivalInterval(t),pay=S.payFor(t,[],{price:3},now).total;t.upgrades.interval=3;t.upgrades.price=3;
 assert.equal(S.arrivalInterval(t),base);assert.equal(S.payFor(t,[],{price:3},now).total,pay);
 withCfg(CFG.upgrades.price,{effect:2},()=>assert.equal(S.payFor(t,[],{price:3},now).base,24));}); // hook applies once an effect is configured

test('§17 upgrades survive save/load (older saves get level 0)',()=>{const mem=new Map(),st={getItem:k=>mem.get(k)??null,setItem:(k,v)=>mem.set(k,v)};
 const s=fresh();s.upgrades.seat=2;S.save(st,s,now);assert.equal(S.load(st,now).state.upgrades.seat,undefined);
 const old=JSON.parse(mem.get(CFG.saveKey));delete old.upgrades;mem.set(CFG.saveKey,JSON.stringify(old));assert.deepEqual(S.load(st,now).state.upgrades,{interval:0,price:0,queue:0});});

test('§17 red dots: 시바 lights for a waiting walk result (real state); 미션 has no tab',()=>{
 let s=fresh();assert.equal(tabBadges(s,now).shiba,false);assert.ok(!('mission' in tabBadges(s,now)));
 S.startWalk(s,s.shibas[0].id,600,now,()=>.99);S.tickWalk(s,now+600e3,()=>.99);assert.equal(s.walkResults.length,1);assert.equal(tabBadges(s,now+600e3).shiba,true,'walk returned');
 s.walkResults.shift();assert.equal(tabBadges(s,now).shiba,false);
 s=fresh();withCfg(CFG.upgrades.queue,{price:10},()=>{s.coins=10;assert.equal(tabBadges(s,now).manage,true,'affordable upgrade');});s.coins=1e9;assert.equal(tabBadges(s,now).manage,false,'null upgrade prices never light');});
// ───────── §17-1 … §17-6 (2026-10-14) ─────────
const {readFileSync,existsSync}=await import('node:fs');const root=new URL('..',import.meta.url).pathname;
const {FLOAT_LAYOUT,FLOAT_ICONS,CHAR_SPRITES}=await import('../map-data.js');const {createHash}=await import('node:crypto');
const png=f=>{const b=readFileSync(root+f);return {sig:b.subarray(1,4).toString(),w:b.readUInt32BE(16),h:b.readUInt32BE(20),colorType:b[25]};};
const ICONS=['ui/ui-gear.png','ui/res-coin.png','ui/res-heart.png','ui/res-heart-empty.png','ui/res-diamond.png','ui/res-paw.png','ui/emo-angry.png'];

test('icons: the seven 그림이 icons (incl. 빠직) exist as 128×128 RGBA PNGs and are listed in MAP.md with their sha256',()=>{
 const map=readFileSync(root+'assets/drive/MAP.md','utf8');assert.ok(map.includes('## 그림이 UI icons (2026-10-14)'));
 for(const f of ICONS){const p=png('assets/drive/'+f);assert.equal(p.sig,'PNG',f);assert.equal(p.w,128,f);assert.equal(p.h,128,f);assert.equal(p.colorType,6,f+' has alpha');
  const sha=createHash('sha256').update(readFileSync(root+'assets/drive/'+f)).digest('hex');assert.ok(map.includes('| `'+f+'` |')&&map.includes('`'+sha+'`'),f+' + sha256 in MAP.md');}});

test('icons: no CSS-drawn resource shapes left; top bar, gear and price buttons use the image files',()=>{
 const html=readFileSync(root+'index.html','utf8'),main=readFileSync(root+'main.js','utf8');
 assert.ok(!/\.resource\.(coin|heart|diamond|paw)/.test(html),'old CSS shapes removed');assert.ok(!/clip-path:polygon\(25% 0/.test(html));
 for(const f of ['res-coin','res-diamond','res-paw'])assert.ok(html.includes(`assets/drive/ui/${f}.png`),f);
 assert.ok(/<button class="gear" data-nav="settings" data-i18n-attr="aria-label:nav.settings"><img src="assets\/drive\/ui\/ui-gear.png" alt=""/.test(html),'gear image, no text');
 for(const f of ['res-heart','res-heart-empty'])assert.ok(main.includes(`assets/drive/ui/${f}.png`),f);
 assert.ok(!/💎|🐾/.test(main+readFileSync(root+'i18n.js','utf8')),'no emoji stand-ins for diamond/paw');});

test('§17-1 hearts: natural cap 10 + 5 slots (confirmed), +1 per 30 min, overflow from rewards kept, countdown only below the cap',()=>{
 assert.equal(CFG.hearts.regenCap,10);assert.equal(CFG.hearts.slots,5);assert.equal(CFG.hearts.regenEverySec,1800);assert.equal(CFG.heartReset.fillTo,10);
 const s=S.newState(0);s.hearts=2;s.heartRegenAt=0;assert.equal(S.nextHeartInSec(s,0),1800);assert.equal(S.nextHeartInSec(s,1528e3),272,'04:32 left');
 S.settleHearts(s,3600e3);assert.equal(s.hearts,4);S.settleHearts(s,100*3600e3);assert.equal(s.hearts,10,'stops at the natural cap');assert.equal(S.nextHeartInSec(s,100*3600e3),null);
 s.hearts=13;S.settleHearts(s,200*3600e3);assert.equal(s.hearts,13,'reward hearts above the cap stay');assert.equal(S.nextHeartInSec(s,200*3600e3),null);
 assert.ok(S.spendHearts(s,6,200*3600e3));assert.equal(s.hearts,7);assert.equal(S.nextHeartInSec(s,200*3600e3),1800,'dropping below the cap starts a fresh 30 min');});

test('§17-2 ledger: income/expense lines in the requested order; 가구 구입 always shown; no 가게 업그레이드 line',()=>{
 const s=fresh();s.coins=0;const L=S.ledgerStatement(s,now).lines;
 assert.deepEqual(L.filter(x=>x.kind==='income').map(x=>x.label),['메뉴 판매','시바 만남 추가 수입','오프라인 수입','기타 수입']);
 assert.deepEqual(L.filter(x=>x.kind==='expense').map(x=>x.label),['알바비','병원비','메뉴 개발비','액세서리 구입','가구 구입']);
 assert.equal(L.find(x=>x.id==='furniture').amount,0);
 assert.ok(!('upgrade' in S.ledgerCategories));S.recordLedger(s,'upgrade',100,now);assert.equal(S.ledgerStatement(s,now).lines.at(-1).label,'가구 구입');assert.equal(S.ledgerStatement(s,now).net,0);});

test('§17-2 ledger: walk coin rewards are 기타 수입 (also during offline catch-up); café payments while closed are 오프라인 수입 only',()=>{
 withCfg(CFG.walk.events,{extraCoins:7,extra:1,snake:0,light:0,capsule:0},()=>withCfg(CFG.pending,{walkExtraReward:'coins'},()=>{
  const s=fresh();s.coins=0;S.startWalk(s,s.shibas[0].id,600,now,()=>.99);S.tickWalk(s,now+600e3,()=>0);
  const L=S.ledgerStatement(s,now+600e3).lines;assert.equal(L.find(x=>x.id==='other').amount,7);assert.equal(L.find(x=>x.id==='offline').amount,0);assert.equal(s.coins,7);}));
 const s=fresh();s.coins=0;S.recordPayment(s,{pending:false,base:3,total:6},now,{offline:true});S.recordPayment(s,{pending:false,base:1,total:2},now);
 const L=S.ledgerStatement(s,now).lines;assert.equal(L.find(x=>x.id==='offline').amount,6);assert.equal(L.find(x=>x.id==='sales').amount,1);assert.equal(L.find(x=>x.id==='meeting').amount,1);});

test('§17-3 ledger rows: vertical padding is half or less of the old 10px',()=>{
 const m=/\.ledger-row\{[^}]*padding:(\d+)px 0/.exec(readFileSync(root+'index.html','utf8'));assert.ok(m);assert.ok(+m[1]<=5);});

test('§17-5 leave events carry what the floats need: paid coins, request met, met a shiba, foot cell',()=>{
 const run=(c)=>{const s=fresh();s.coins=0;const w=S.newWorld(s,S.rng(3));w.spawnT=1e9;for(const sh of s.shibas)sh.placed=false;
  w.custs.push({id:1,kind:'mom',phase:'seated',cell:[1,3],t:.05,activity:'interact',met:[],score:1,with:null,fulfilled:false,request:null,order:{id:'M-01',kind:'coffee',price:1,img:'x'},...c});S.tick(s,w,.1,now+100);return w.events.find(e=>e.type==='leave');};
 let e=run({fulfilled:true,met:[1]});assert.equal(e.requestMet,true);assert.equal(e.metShiba,true);assert.deepEqual(e.cell,[1,3]);assert.equal(e.coins,2,'coffee 1 × Lv21 meeting ×2');
 e=run({});assert.equal(e.requestMet,false);assert.equal(e.metShiba,false);
 e=run({met:[1]});assert.equal(e.requestMet,false,'meeting a shiba alone is not a met request');assert.equal(e.metShiba,true);
 assert.deepEqual(CFG.feedback,{floatSec:1});
 const main=readFileSync(root+'main.js','utf8');assert.ok(/function floatsFor\(e\)\{const heart=!!e\.requestMet,/.test(main),'heart float only when the request was met');});

test('§17-5 elapsed payment stays at the seat and zero elapsed does not settle',()=>{
 const s=fresh(),w=S.newWorld(s,S.rng(1));w.spawnT=Infinity;
 const cell=S.seatSlots(s,w)[0].cell;
 const guest={id:w.nextCust++,kind:'mom',phase:'seated',cell:[...cell],t:0,activity:'interact',met:[],score:1,with:null,fulfilled:true,order:{id:'M-01',kind:'coffee',price:CFG.menu.coffee.price,img:CFG.menu.coffee.img}};
 w.custs=[guest];S.consumeElapsed(s,w,0,now);assert.equal(w.events.length,0);
 S.consumeElapsed(s,w,CFG.navigation.cellStepSec,now);
 const event=w.events.find(e=>e.type==='leave');assert.ok(event);assert.equal(event.id,guest.id);assert.deepEqual(event.cell,cell);assert.ok(event.requestMet);assert.ok(Number.isFinite(event.coins));
 guest.cell[0]++;assert.deepEqual(event.cell,cell,'payment retains a snapshot while the guest exits');
});

test('§17-5/6 float layout: head = foot cell + offset (invisible guest), coin/heart/빠직 are 그림이 icons, 빠직 drawn at coin size',()=>{
 assert.equal(CHAR_SPRITES.guest.file,null);assert.ok(FLOAT_LAYOUT.headOffset[1]<0);assert.ok(FLOAT_LAYOUT.risePx>0);
 assert.equal(FLOAT_ICONS.coin,'assets/drive/ui/res-coin.png');assert.equal(FLOAT_ICONS.heart,'assets/drive/ui/res-heart.png');assert.equal(FLOAT_ICONS.angry,'assets/drive/ui/emo-angry.png');
 assert.equal(FLOAT_LAYOUT.iconPx.angry,FLOAT_LAYOUT.iconPx.coin);for(const k of ['coin','heart','angry'])assert.ok(existsSync(root+FLOAT_ICONS[k]));});

test('§17-6 angry: a queue timeout emits an angry event with the guest cell (for the float)',()=>{
 const s=fresh();s.coins=0;for(const sh of s.shibas)sh.placed=false;const w=S.newWorld(s,S.rng(1));w.navigation={entrance:[0,5],slots:[]};w.spawnT=1e9;
 w.queue.push({id:9,kind:'mom',cell:[0,7],phase:'queue',t:.05});S.tick(s,w,.1,now);const e=w.events.find(e=>e.type==='angry');assert.ok(e);assert.deepEqual(e.cell,[0,7]);});
console.log(`§17: ${passed} passed`);
