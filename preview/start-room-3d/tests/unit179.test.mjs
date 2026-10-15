import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CFG} from '../config.js';
import * as S from '../sim.js';
const minute=60e3;
const fresh=()=>{const s=S.newState(0);S.chooseStart(s,'red','',S.rng(1),0);return s;};
const item=id=>CFG.heartUse.items.find(x=>x.id===id);
{
 const list=S.heartItems();assert.equal(list.length,16);assert.deepEqual(list.slice(0,5).map(x=>x.level),[0,0,0,0,0]);assert.deepEqual(list.slice(-3).map(x=>x.level),[30,35,40]);assert.ok(list.every(x=>x.art.startsWith('assets/drive/ui/card-')));
 for(const it of list){const s=fresh(),sh=s.shibas[0];s.cafe.level=CFG.cafe.maxLevel;s.hearts=CFG.hearts.regenCap;s.menus=['M-02'];const ok=S.useHeartItem(s,it.id,it.shiba?sh.id:null,0,it.menu?'M-02':null);assert.equal(ok,it.level!==null&&!['walk','cookie','talent'].includes(it.id),it.id);assert.equal(s.hearts,CFG.hearts.regenCap-(ok?it.cost:0),it.id);}
}
{
 const s=fresh(),sh=s.shibas[0];assert.equal(sh.affinity,0);Object.assign(sh.g,{happy:50,fatigue:50});
 for(let i=0;i<item('pet').daily;i++)assert.ok(S.useHeartItem(s,'pet',sh.id,0));assert.equal(S.heartUseCheck(s,'pet',sh.id,0),'daily');
 const other=S.makeShiba(s,{breed:'kuro',now:0});s.shibas.push(other);assert.ok(S.useHeartItem(s,'pet',other.id,0));assert.ok(S.useHeartItem(s,'play',sh.id,0));assert.equal(sh.g.happy,60);assert.ok(S.useHeartItem(s,'snack',sh.id,0));assert.equal(sh.g.happy,75);assert.equal(sh.g.fatigue,40);
 S.addAffinity(sh,CFG.heartUse.affinity.max);assert.equal(sh.affinity,100);S.addAffinity(sh,-1000);assert.equal(sh.affinity,0);
 s.hearts=10;assert.equal(S.heartUseCheck(s,'pet',sh.id,CFG.ledger.periodMs),null);
 const old=other.g.happy;S.useHeartItem(s,'play',other.id,CFG.ledger.periodMs);assert.equal(other.g.happy,old,'unknown gauges stay unknown');
}
{
 const s=fresh();assert.equal(S.heartUseCheck(s,'praise',null,0),'locked');S.heartState(s);s.cafe.level=8;assert.deepEqual(S.heartUnlocks(s).map(x=>x.id),['praise','brush']);assert.deepEqual(S.heartUnlocks(s),[]);s.cafe.level=1;assert.deepEqual(S.heartUnlocks(s),[]);s.cafe.level=8;assert.deepEqual(S.heartUnlocks(s),[],'previous unlocks are not repeated after staging a lower level');
 S.useHeartItem(s,'call',null,0);assert.equal(S.heartMultiplier(s,'guests',0),1.5);assert.equal(S.heartMultiplier(s,'guests',10*minute),1);assert.equal(S.activeHeartEffects(s,10*minute).length,0);
 S.useHeartItem(s,'praise',null,0);assert.equal(S.heartMultiplier(s,'satisfaction',0),1.5);
 S.useHeartItem(s,'brush',s.shibas[0].id,0);assert.equal(S.heartMultiplier(s,'shibaMul',0,s.shibas[0].id),1.2);assert.equal(S.heartMultiplier(s,'shibaMul',0,-1),1);
 const storage={getItem:()=>JSON.stringify(s)};const loaded=S.load(storage,0).state;assert.equal(S.activeHeartEffects(loaded,0).length,2);
 delete s.shibas[0].affinity;assert.equal(S.load(storage,0).state.shibas[0].affinity,0);
}
{
 const s=fresh(),A=CFG.heartUse.ads;for(let i=0;i<A.burst;i++)assert.ok(S.claimHeartAd(s,0));assert.equal(S.claimHeartAd(s,0),false);assert.equal(S.heartAdStatus(s,0).left,A.cooldownSec);
 let now=0;for(let i=A.burst;i<A.daily;i++){now+=A.cooldownSec*1000;assert.ok(S.claimHeartAd(s,now));}assert.equal(S.claimHeartAd(s,now+A.cooldownSec*1000),false);assert.ok(S.claimHeartAd(s,CFG.ledger.periodMs));
 s.dia=CFG.heartUse.buy.dia-1;assert.equal(S.buyHearts(s),false);s.dia++;const before=s.hearts;assert.ok(S.buyHearts(s));assert.equal(s.hearts,before+CFG.heartUse.buy.hearts);assert.equal(s.dia,0);
 s.hearts=0;s.heartRegenAt=0;assert.equal(S.useHeartItem(s,'call',null,0),false);S.settleHearts(s,CFG.hearts.regenEverySec*1000);assert.equal(s.hearts,1);
}
{
 const s=fresh(),sh=s.shibas[0];Object.assign(sh.g,CFG.gaugeFull);assert.ok(S.startWalk(s,sh.id,CFG.walk.durationsSec[0],0));S.tickWalk(s,CFG.walk.durationsSec[0]*1000,()=>1);assert.equal(sh.affinity,CFG.heartUse.walkAffinity);
 s.cafe.level=CFG.cafe.maxLevel;s.hearts=CFG.hearts.regenCap;
 assert.equal(S.heartUseCheck(s,'cookie',null,0),'unset');assert.equal(item('cookie').odds,null);assert.equal(item('cookie').rewards.paws,1);assert.equal(item('cookie').rewards.item,'heartReset');assert.equal(CFG.heartUse.affinity.guestMul,null);
 s.menus=['M-02'];assert.equal(S.heartUseCheck(s,'recommend',null,0),'menu');assert.ok(S.useHeartItem(s,'recommend',null,0,'M-02'));assert.equal(S.heartMultiplier(s,'price',0),1.1);
 assert.ok(S.useHeartItem(s,'tasting',null,0));const agg=CFG.income.levelAggregation;CFG.income.levelAggregation=()=>1;try{assert.equal(S.payFor(s,[],{price:10},0).base,12);assert.equal(S.payFor(s,[],{price:10},10*minute).base,10);}finally{CFG.income.levelAggregation=agg;}
 const old=s.coins,w=S.newWorld(s);assert.ok(S.useHeartItem(s,'special',null,0,null,w));assert.equal(w.custs.length,0);assert.equal(s.coins,old,'unknown tip and reward amounts never invented');
}
{
 const s=fresh();s.cafe.level=CFG.cafe.maxLevel;
 for(const id of ['music','blanket','recommend','brush']){const it=item(id);for(const key of id==='music'?['stay']:id==='blanket'?[]:id==='recommend'?[]:['affinity','fatigue','cleanliness'])assert.equal(it[key],null);}
 assert.ok(S.useHeartItem(s,'music',null,0));assert.equal(S.activeHeartEffects(s,0)[0].id,'music');assert.equal(item('music').extraOrders,1);assert.equal(S.activeHeartEffects(s,item('music').sec*1000).length,0);
 const source=readFileSync(new URL('../main.js',import.meta.url),'utf8'),html=readFileSync(new URL('../index.html',import.meta.url),'utf8'),capture=readFileSync(new URL('../capture-main-screen.mjs',import.meta.url),'utf8');
 assert.match(html,/data-act="hearts"/);assert.match(source,/heartStub:\(\)=>toast\('준비 중'\)/);assert.match(source,/LP.heartShiba/);assert.match(source,/v.footer/);
 for(const name of ['hearts','noheart','pick'])assert.ok(capture.includes('main-screen-u179-'+name+'.png'));assert.ok(capture.includes("process.argv.includes('--u179')"));
}
{
 // Seated visitor fixture exercises actual settlement rather than only checking config.
 const s=fresh(),w=S.newWorld(s,()=>.99);s.cafe.level=CFG.cafe.maxLevel;s.coins=0;w.spawnT=Infinity;
 S.useHeartItem(s,'music',null,0);S.useHeartItem(s,'praise',null,0);
 const c={id:1,kind:'mom',phase:'seated',cell:[1,3],t:0,activity:'interact',met:[],score:1,with:null,fulfilled:true,order:{id:'M-01',kind:'coffee',price:CFG.menu.coffee.price,img:CFG.menu.coffee.img}};
 w.custs.push(c);S.tick(s,w,0,0);assert.equal(s.coins,CFG.menu.coffee.price*(1+item('music').extraOrders));assert.equal(w.lastPay.total,s.coins);assert.equal(s.cafe.rep,CFG.rep.start+CFG.requests.metRep*item('praise').satisfaction);assert.equal(w.events.filter(e=>e.type==='order').length,item('music').extraOrders);
 const s2=fresh();s2.heartUseNow=0;const baseline=S.arrivalInterval(s2);S.useHeartItem(s2,'call',null,0);assert.equal(S.arrivalInterval(s2),baseline/item('call').guests);
 const sh=s2.shibas[0],lv=sh.level;sh.level=null;assert.equal(S.payFor(s2,[sh.id],{price:1},0).pending,true);sh.level=lv;
}
console.log('§17-9: catalog, locks, limits, gauges, affinity, walk, effects, expiry, persistence, ads, purchase and null no-ops passed');
