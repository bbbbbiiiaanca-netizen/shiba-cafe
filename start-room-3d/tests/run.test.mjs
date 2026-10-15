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
const now=Date.UTC(2026,9,15,3);const s={coins:100,ingredients:{},shibas:[],cafe:{level:3}};Q.initQ17(s);assert.equal(c.playEnergy,undefined);
assert.equal(Q.runPlaysLeft(s,now),5);for(let i=0;i<5;i++)assert.equal(Q.startRunPlay(s,now),true);assert.equal(Q.startRunPlay(s,now),false);
assert.equal(c.adsEnabled,false);assert.equal(Q.claimRunAd(s,now),false);assert.equal(Q.runAdsLeft(s,now),0);
c.adsEnabled=true;for(let i=0;i<3;i++)assert.equal(Q.claimRunAd(s,now),true);assert.equal(Q.claimRunAd(s,now),false);assert.equal(Q.runPlaysLeft(s,now),3);const dk=Q.runDay(s,now).key;assert.deepEqual(s.run.adLog,{[dk]:3});Q.claimRunAd(s,now+86400e3);assert.deepEqual(s.run.adLog,{[dk]:3,[dk+1]:1});c.adsEnabled=false;
assert.equal(Q.finishRun(s,{coins:4,got:{rice:2,carrot:1},score:7},now),7);assert.equal(s.coins,140);assert.deepEqual(s.ingredients,{rice:2,carrot:1});
assert.equal(Q.finishRun(s,{coins:0,got:{},score:3},now),7);assert.equal(s.run.lastScore,3);
assert.equal(Q.runPlaysLeft(s,now+2*86400e3),5);assert.equal(Q.runDay(s,now+86400e3).best,null);
// unlock Lv3, shiba bonus, skip (after a real run, 1 play, 70% of today's best)
{const L={cafe:{level:2},shibas:[],ingredients:{}};Q.initQ17(L);assert.equal(c.unlockLevel,3);assert.equal(Q.runUnlocked(L),false);assert.equal(Q.startRunPlay(L,now),false);assert.equal(Q.skipCheck(L,now),'locked');L.cafe.level=3;assert.equal(Q.runUnlocked(L),true);}
for(const k of ['skipEnergy','startEnergy','energyCap','regenSec','scoreToReward','playEnergy','startLevel','bonusPerShiba'])assert.equal(k in c,false,k);assert.equal(c.upgrades,null);
{const B={cafe:{level:5},coins:0,ingredients:{},shibas:[{id:1,level:20},{id:2,level:80}]};Q.initQ17(B);assert.equal(Q.runBonusPct(B),0);B.run.shibas=[1];assert.equal(Q.runBonusPct(B),20);B.run.shibas=[2];assert.equal(Q.runBonusPct(B),50);
 assert.equal(Q.skipCheck(B,now),'run');assert.equal(Q.skipRun(B,now),false);
 B.run.shibas=[1];Q.startRunPlay(B,now);Q.finishRun(B,{coins:10,got:{rice:3,carrot:1},score:14},now);assert.equal(B.coins,120);
 Q.startRunPlay(B,now);Q.finishRun(B,{coins:1,got:{},score:1},now);assert.equal(B.coins,132);
 assert.deepEqual(Q.skipReward(B,now),{mung:84,got:{rice:2,carrot:1}});const left=Q.runPlaysLeft(B,now);assert.deepEqual(Q.skipRun(B,now),{mung:84,got:{rice:2,carrot:1}});
 assert.equal(B.coins,216);assert.equal(B.ingredients.rice,5);assert.equal(Q.runPlaysLeft(B,now),left-1);
 Q.skipRun(B,now);Q.skipRun(B,now);assert.equal(Q.runPlaysLeft(B,now),0);assert.equal(Q.skipCheck(B,now),'plays');assert.equal(Q.skipRun(B,now),false);
 assert.equal(Q.skipCheck(B,now+86400e3),'run');
 const D=Q.runDay(B,now);D.bestReward={mung:10,got:{rice:1,chicken:0}};assert.deepEqual(Q.skipReward(B,now),{mung:10,got:{rice:1}});D.bestReward={mung:12,got:{}};assert.equal(Q.skipReward(B,now).mung,10);D.bestReward={mung:20,got:{}};assert.equal(Q.skipReward(B,now).mung,14);D.bestReward={mung:0,got:{}};assert.deepEqual(Q.skipReward(B,now),{mung:0,got:{}});}
// red back-run sheet: 4 frames looped at config fps; others keep multiply
{const sh=c.runSheets.red;assert.deepEqual([sh.frameW,sh.frameH,sh.frames,sh.fps],[360,480,4,10]);assert.equal(c.runSheets.sesame,undefined);assert.equal(c.shibaBlend,'multiply');
 assert.match(readFileSync(new URL('../assets/drive/MAP.md',import.meta.url),'utf8'),/run\/run-red-back-sheet\.png/);
 const {runFrame}=await import('../run.js');assert.deepEqual([0,0.1,0.2,0.3,0.4,0.55].map(t=>runFrame(sh,t)),[0,1,2,3,0,1]);
 const main=readFileSync(new URL('../main.js',import.meta.url),'utf8');assert.match(main,/sheet:CFG\.run\.runSheets\[sh\?\.breed\]/);}
console.log('run: red 4-frame sheet; Lv3 unlock, shiba bonus 1%/Lv max 50%, skip 70% after real run, old energy keys removed; speed/spawn ramps, 2-hit hearts, daily 5 + 3 ads, 10멍 coins + ingredients, today best, ads off by default, adLog per day; 3 lanes, swipe/keys lane change, obstacles end run, pickups, null art skipped, time limit passed');
