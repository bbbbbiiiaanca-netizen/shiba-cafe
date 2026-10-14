// Guest-miss share, headless (node, no browser). Run from start-room-3d/: node tests/balance-sim.mjs [hours=1] [seeds=3]
// Production sim with cumulative level-reward seats placed, all unlocked shiba slots filled.
// Unsaved fixture: eight alternating land rows allow the largest reward layout; furniture is packed in four columns.
// Reports measured served/hour/seat; the old 90/hour/cap planning assumption is superseded.
// Counts per run:
//  arrivals = guests generated at the entrance (w.nextCust) · served = left after a visit (stats.served)
//  turned away = queue full on arrival (stats.lost) · left queue = waited past queueWaitSec without a seat (stats.angry)
//  waiting = still in the queue or still walking to a seat when the hour ends (neither served nor missed yet)
//  miss % = (turned away + left queue) / arrivals
import {validPlacement,zonesForSpace} from '../map-data.js';
import {writeFileSync} from 'node:fs';
import * as S from '../sim.js';
import {CFG,pressureAt} from '../config.js';

const HOURS=Number(process.argv[2])||1,SEEDS=Number(process.argv[3])||3,DT=1,LEVELS=Array.from({length:50},(_,i)=>i+1);
const ARRIVALS_PER_CAP_HOUR=CFG.cafe.customersPerHourPerCap; // 밸런스_2년.md §1 · 갱신 132-4

function run(level,shibas,seed){
 const r=S.rng(seed),s=S.newState(0);S.chooseStart(s,'red','',r,0);s.cafe.level=level;
 for(let i=1;i<shibas;i++){const sh=S.makeShiba(s,{breed:CFG.breeds[i%CFG.breeds.length],level:CFG.startShiba.level,r,now:0});s.shibas.push(sh);if(!S.setPlaced(s,sh.id,true))throw Error(`slot ${i+1} not placeable at Lv${level}`);}
 s.placement.slots=s.placement.slots.filter(x=>x.type!=='cushion');s.space.unlockedRows=8;for(let j=1,n=0;n<CFG.cafe.seatRewards[level-1];j++)for(let i=1;i<5&&n<CFG.cafe.seatRewards[level-1];i++){const item={id:'sim-seat-'+n,type:'cushion',origin:[i,j],dir:0};if(validPlacement(item,s.placement.slots,zonesForSpace(s.space)[0])){s.placement.slots.push(item);n++;}}const w=S.newWorld(s,r);let t=0;
 for(let i=0,n=Math.round(HOURS*3600/DT);i<n;i++){t+=DT;S.tick(s,w,DT,t*1000);w.events.length=0;}
 const st=s.stats,waiting=w.queue.length+w.custs.filter(c=>c.phase==='entering').length;
 return {arrivals:w.nextCust-1,served:st.served,lost:st.lost,angry:st.angry,waiting,seated:w.custs.filter(c=>c.phase==='seated').length,rep:s.cafe.rep,levelEnd:s.cafe.level};
}

const rows=[];
for(const level of LEVELS){const slots=Math.min(CFG.cafe.maxPlaced,pressureAt(level).slots);
 for(const shibas of [slots]){
  const runs=Array.from({length:SEEDS},(_,k)=>run(level,shibas,k+1)),avg=k=>runs.reduce((a,x)=>a+x[k],0)/runs.length;
  const cap=pressureAt(level).cap,arrivals=avg('arrivals'),served=avg('served'),missed=avg('lost')+avg('angry');
  rows.push({Lv:level,hours:HOURS,seeds:SEEDS,shibas,cap,seats:CFG.cafe.seatRewards[level-1],'expected arrivals':ARRIVALS_PER_CAP_HOUR*cap*HOURS,arrivals,served,'served/hour':served/HOURS,'turned away':avg('lost'),'left queue':avg('angry'),waiting:avg('waiting')+avg('seated'),
   'miss %':100*missed/arrivals,'served per seat-hour':served/CFG.cafe.seatRewards[level-1]/HOURS,'rep end':avg('rep')});console.error('measured Lv'+level);}}

const f=(v,d=0)=>typeof v==='number'?v.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}):String(v);
const cols=Object.keys(rows[0]),fmt=(k,v)=>f(v,/%|per cap|rep/.test(k)?1:0);
const table=[cols,...rows.map(r=>cols.map(k=>fmt(k,r[k])))],wid=cols.map((_,i)=>Math.max(...table.map(r=>r[i].length)));
console.log(`밸런스 sim: ${HOURS} simulated hour(s) per row, mean of ${SEEDS} seeds, production config, level seat schedule (2→20 seats), eight land rows, dt ${DT}s`);
console.log('served per seat-hour is measured, not a fixed 90 per cap-hour. Layout, paths and shiba availability affect throughput.');
console.log('waiting = in the queue, walking to a seat or seated when the run ends (not counted as served or missed)\n');
for(const [i,r] of table.entries()){console.log(r.map((c,j)=>j<2?c.padEnd(wid[j]):c.padStart(wid[j])).join('  '));if(!i)console.log(wid.map(n=>'-'.repeat(n)).join('  '));}

writeFileSync(new URL('./balance-results.json',import.meta.url),JSON.stringify(rows,null,2));
