import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CFG} from '../config.js';
import {createRun,stepRun,moveLane,obstacleKinds,speedAt,spawnAt} from '../run.js';
import * as Q from '../q17.js';
const c=CFG.run;
assert.deepEqual(c.screen,[1080,1920]);assert.equal(c.lanes,3);assert.equal(c.cat,undefined);
assert.deepEqual(obstacleKinds(c).sort(),['bicycle','cat','flowerpot','puddle']);assert.deepEqual(obstacleKinds({obstacles:{a:'x',b:null}}),['a']);
for(const src of [c.bg,...obstacleKinds(c).map(k=>c.obstacles[k])])assert.match(readFileSync(new URL('../assets/drive/MAP.md',import.meta.url),'utf8'),new RegExp(src.replace('assets/drive/','').replace('.','\\.')));
const ids=Object.keys(CFG.ingredients);
let r=createRun(c,ids,()=>0.99);assert.equal(r.lane,1);moveLane(r,-1);moveLane(r,-1);assert.equal(r.lane,0);moveLane(r,1);moveLane(r,1);moveLane(r,1);assert.equal(r.lane,2);
// speed 700→1000 and spawn 0.8→0.5 linearly over 45 s
assert.equal(speedAt(c,0),700);assert.equal(speedAt(c,22.5),850);assert.equal(speedAt(c,45),1000);assert.equal(speedAt(c,99),1000);
assert.equal(spawnAt(c,0),0.8);assert.ok(Math.abs(spawnAt(c,45)-0.5)<1e-9);assert.equal(c.lengthSec,45);
// first hit survives, second ends
r=createRun(c,ids,()=>0);r.objs.push({type:'obstacle',kind:'puddle',lane:1,y:c.shibaY-5});stepRun(r,0.001);assert.equal(r.over,false);assert.equal(r.hitsTaken,1);
r.objs.push({type:'obstacle',kind:'cat',lane:1,y:c.shibaY-5});stepRun(r,0.001);assert.equal(r.over,true);assert.equal(r.reason,'hit');
r=createRun(c,ids,()=>0);r.objs.push({type:'obstacle',kind:'puddle',lane:1,y:c.shibaY-5});moveLane(r,1);stepRun(r,0.001);assert.equal(r.over,false);
// coin and ingredient pickups score
r=createRun(c,ids,()=>0);r.objs.push({type:'coin',lane:1,y:c.shibaY},{type:'ingredient',kind:'rice',lane:1,y:c.shibaY});stepRun(r,0.001);assert.equal(r.coins,1);assert.equal(r.got.rice,1);assert.equal(r.score,c.scorePer.coin+c.scorePer.ingredient);
// null-art kinds never spawn; time limit ends the run
let seq=0;r=createRun(c,ids,()=>(seq=(seq+0.137)%1));for(let i=0;i<c.lengthSec*20+5&&!r.over;i++){moveLane(r,0);r.objs=r.objs.filter(o=>o.type!=='obstacle'||o.y<c.shibaY-c.obstacleW);stepRun(r,0.05);}
assert.equal(r.reason,'time');
// daily plays, ad stub, rewards, today best
const now=Date.UTC(2026,9,15,3);const s={coins:100,ingredients:{},shibas:[]};Q.initQ17(s);assert.equal(c.playEnergy,undefined);
assert.equal(Q.runPlaysLeft(s,now),5);for(let i=0;i<5;i++)assert.equal(Q.startRunPlay(s,now),true);assert.equal(Q.startRunPlay(s,now),false);
assert.equal(c.adsEnabled,false);assert.equal(Q.claimRunAd(s,now),false);assert.equal(Q.runAdsLeft(s,now),0);
c.adsEnabled=true;for(let i=0;i<3;i++)assert.equal(Q.claimRunAd(s,now),true);assert.equal(Q.claimRunAd(s,now),false);assert.equal(Q.runPlaysLeft(s,now),3);const dk=Q.runDay(s,now).key;assert.deepEqual(s.run.adLog,{[dk]:3});Q.claimRunAd(s,now+86400e3);assert.deepEqual(s.run.adLog,{[dk]:3,[dk+1]:1});c.adsEnabled=false;
assert.equal(Q.finishRun(s,{coins:4,got:{rice:2,carrot:1},score:7},now),7);assert.equal(s.coins,140);assert.deepEqual(s.ingredients,{rice:2,carrot:1});
assert.equal(Q.finishRun(s,{coins:0,got:{},score:3},now),7);assert.equal(s.run.lastScore,3);
assert.equal(Q.runPlaysLeft(s,now+2*86400e3),5);assert.equal(Q.runDay(s,now+86400e3).best,null);
console.log('run: speed/spawn ramps, 2-hit hearts, daily 5 + 3 ads, 10멍 coins + ingredients, today best, ads off by default, adLog per day; 3 lanes, swipe/keys lane change, obstacles end run, pickups, null art skipped, time limit passed');
