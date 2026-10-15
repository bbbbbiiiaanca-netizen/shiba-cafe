import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CFG} from '../config.js';
import {createRun,stepRun,moveLane,obstacleKinds} from '../run.js';
const c=CFG.run;
assert.deepEqual(c.screen,[1080,1920]);assert.equal(c.lanes,3);assert.equal(c.cat,undefined);
assert.deepEqual(obstacleKinds(c).sort(),['bicycle','cat','flowerpot','puddle']);assert.deepEqual(obstacleKinds({obstacles:{a:'x',b:null}}),['a']);
for(const src of [c.bg,...obstacleKinds(c).map(k=>c.obstacles[k])])assert.match(readFileSync(new URL('../assets/drive/MAP.md',import.meta.url),'utf8'),new RegExp(src.replace('assets/drive/','').replace('.','\\.')));
const ids=Object.keys(CFG.ingredients);
let r=createRun(c,ids,()=>0.99);assert.equal(r.lane,1);moveLane(r,-1);moveLane(r,-1);assert.equal(r.lane,0);moveLane(r,1);moveLane(r,1);moveLane(r,1);assert.equal(r.lane,2);
// obstacle in your lane ends the run (hit:'end'); dodge by lane change
r=createRun(c,ids,()=>0);r.objs.push({type:'obstacle',kind:'puddle',lane:1,y:c.shibaY-5});stepRun(r,0.001);assert.equal(r.over,true);assert.equal(r.reason,'hit');
r=createRun(c,ids,()=>0);r.objs.push({type:'obstacle',kind:'puddle',lane:1,y:c.shibaY-5});moveLane(r,1);stepRun(r,0.001);assert.equal(r.over,false);
// coin and ingredient pickups score
r=createRun(c,ids,()=>0);r.objs.push({type:'coin',lane:1,y:c.shibaY},{type:'ingredient',kind:'rice',lane:1,y:c.shibaY});stepRun(r,0.001);assert.equal(r.coins,1);assert.equal(r.got.rice,1);assert.equal(r.score,c.scorePer.coin+c.scorePer.ingredient);
// null-art kinds never spawn; time limit ends the run
let seq=0;r=createRun(c,ids,()=>(seq=(seq+0.137)%1));for(let i=0;i<c.lengthSec*20+5&&!r.over;i++){moveLane(r,0);r.objs=r.objs.filter(o=>o.type!=='obstacle'||o.y<c.shibaY-c.obstacleW);stepRun(r,0.05);}
assert.equal(r.reason,'time');
console.log('run: 3 lanes, swipe/keys lane change, obstacles end run, pickups, null art skipped, time limit passed');
