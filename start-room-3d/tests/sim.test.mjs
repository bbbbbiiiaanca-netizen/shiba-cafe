import assert from 'node:assert';
import {newState,newWorld,tick,pull,load,save,offlineEarnings,rng,claimQuest,tutAdvance} from '../sim.js';
import {CFG} from '../config.js';
const s=newState(0),w=newWorld(s,3);let pets=0,pays=0,maxSeated=0;const visitsAtPay=[];
for(let i=0;i<30*120;i++){tick(w,s,1/30);for(const e of w.events.splice(0)){if(e.type==='pet')pets++;if(e.type==='pay')pays++;}
 for(const c of w.customers){if(c.phase==='wait'||c.phase==='leave'&&c.path.length===3){} if(c.phase==='wait'){const sd=CFG.seats[c.seat];assert(Math.abs(c.x-sd.x)<1e-6&&Math.abs(c.z-sd.z)<1e-6,'waiting customer stays in seat');}}
 for(const sh of w.shibas)if(sh.phase==='pet')assert(sh.y>.5,'shiba is on the table while petted');}
assert(pays>=4,'customers rotate: '+pays);assert(pets>=pays*2,'about two visits per customer');assert.equal(s.served,pays);
const s2=newState(0),r=rng(5);assert.equal(pull(s2,r),null,'pull blocked while N/R rates are undecided');CFG.TEMP.gachaNonSAsN=true;const a=pull(s2,r);CFG.TEMP.gachaNonSAsN=false;assert(a&&a.free&&s2.paws===CFG.start.paws);s2.paws=0;CFG.TEMP.gachaNonSAsN=true;assert.equal(pull(s2,r),null);CFG.TEMP.gachaNonSAsN=false;
const mem={d:{},getItem(k){return this.d[k]??null},setItem(k,v){this.d[k]=v}};save(mem,s2,0);const L=load(mem,3600e3);assert(!L.fresh&&L.offline.coins>0&&L.state.coins===s2.coins+L.offline.coins);
assert.equal(offlineEarnings({...s2,lastSeen:0},10e3).coins,0);
s.served=5;assert(claimQuest(s,'serve5'));assert(!claimQuest(s,'serve5'));
const s3=newState(0);assert(tutAdvance(s3,true));assert(!tutAdvance(s3));s3.served=1;assert(tutAdvance(s3));
console.log('sim ok',{pays,pets,coins:s.coins,hearts:s.hearts});
