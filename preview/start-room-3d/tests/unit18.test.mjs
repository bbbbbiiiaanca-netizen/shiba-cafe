import assert from 'node:assert/strict';
import * as S from '../sim.js';
import {CFG} from '../config.js';
import {MANAGER,managerFrame,plateEdges,zonesForSpace,FLOAT_LAYOUT,PARTITION,footprintCells} from '../map-data.js';
const s=S.newState(0);S.chooseStart(s,'red','',()=>0,0);s.cafe.level=40;s.hearts=100;s.coins=PARTITION.price;
assert.ok(S.buyWall(s,0));assert.equal(s.wallOwned,4);assert.equal(s.coins,0);assert.equal(S.ledgerStatement(s,0).lines.find(x=>x.id==='furniture').amount,PARTITION.price);assert.equal(S.buyWall(s,0),false);
assert.deepEqual(FLOAT_LAYOUT.iconPx,{coin:30,heart:30,angry:30});assert.equal(CFG.gacha.unlock,1);
assert.equal(S.buyUpgrade(s,'seat'),false);
for(const n of [2,3]){s.space.unlockedRows=n;const z=zonesForSpace(s.space)[0],edges=plateEdges(z);assert.equal(edges.length,z.cols+z.rows-1);assert.equal(edges.filter(e=>e.part==='corner').length,1);}
for(const [f,name] of ['front-dr','front-dl','back-ul','back-ur'].entries()){assert.ok(managerFrame({phase:'walking',facing:f,anim:0}).includes(name+'-1'));assert.ok(managerFrame({phase:'walking',facing:f,anim:1/MANAGER.fps}).includes(name+'-2'));assert.ok(managerFrame({phase:'idle',facing:f}).includes('stand-'));}
const item=id=>CFG.heartUse.items.find(x=>x.id===id),sh=s.shibas[0];sh.g.happy=50;sh.g.fatigue=50;
assert.ok(S.useHeartItem(s,'blanket',null,0));assert.equal(sh.g.happy,60);const rate=CFG.care.sleep.fatiguePerHour;CFG.care.sleep.fatiguePerHour=10;S.recoverFatigue(s,sh,3600,0);assert.equal(sh.g.fatigue,30);CFG.care.sleep.fatiguePerHour=rate;
s.menus=['M-02'];assert.ok(S.useHeartItem(s,'recommend',null,0,'M-02'));assert.equal(S.payFor(s,[],{id:'M-02',price:10},0).base,11);assert.equal(S.payFor(s,[],{id:'M-01',price:10},0).base,10);
const oldRate=CFG.heartUse.incomeRatePerSec,oldOdds=item('cookie').odds;CFG.heartUse.incomeRatePerSec=1;item('cookie').odds={coins:0,paws:1,item:0};
const paws=sh.paws;assert.ok(S.useHeartItem(s,'cookie',sh.id,0));assert.equal(sh.paws,paws+1);
item('cookie').odds={coins:1,paws:0,item:0};const coins=s.coins;assert.ok(S.useHeartItem(s,'cookie',null,0));assert.equal(s.coins,coins+15*60);assert.ok(S.useHeartItem(s,'talent',null,0));assert.equal(s.coins,coins+45*60);
item('cookie').odds=oldOdds;CFG.heartUse.incomeRatePerSec=oldRate;
const w=S.newWorld(s);w.custs=[{phase:'seated',cell:[1,3]}];S.tickManager(s,w,0,true,CFG.navigation.cellStepSec);let visited=false,returned=false;const home=[...w.manager.cell],directions=new Set();for(let n=0;n<100;n++){S.tickManager(s,w,CFG.navigation.cellStepSec,true,CFG.navigation.cellStepSec);const m=w.manager;if(m.phase==='walking')directions.add(m.facing);assert.ok(!s.placement.slots.some(x=>footprintCells(x).some(c=>c.join()===m.cell.join())));if(m.phase==='visiting')visited=true;if(visited&&m.phase==='idle'&&m.cell.join()===home.join()){returned=true;break;}}
assert.ok(visited&&returned);assert.ok(directions.size>=2);S.tickManager(s,w,0,false,1);assert.equal(w.manager,null);
console.log('u18 inventory, rewards, scoped effects, four frame directions and manager service loop passed');
