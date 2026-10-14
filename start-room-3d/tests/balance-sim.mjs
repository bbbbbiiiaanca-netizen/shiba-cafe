// Guest-miss share, headless (node, no browser). Run from start-room-3d/: node tests/balance-sim.mjs [hours=1] [seeds=3]
// Runs the production sim (config.js as shipped, default furniture, no ?temp fixtures) for N simulated hours per café level,
// with 1 shiba and with every shiba slot that level allows, and compares served guests with 밸런스_2년.md §1:
// '실제로 받는 손님은 시간당 90 × 손님 상한' (= 90 of the 100 × cap arrivals per hour, i.e. 10% missed).
// Counts per run:
//  arrivals = guests generated at the entrance (w.nextCust) · served = left after a visit (stats.served)
//  turned away = queue full on arrival (stats.lost) · left queue = waited past queueWaitSec without a seat (stats.angry)
//  waiting = still in the queue or still walking to a seat when the hour ends (neither served nor missed yet)
//  miss % = (turned away + left queue) / arrivals
import * as S from '../sim.js';
import {CFG,pressureAt} from '../config.js';

const HOURS=Number(process.argv[2])||1,SEEDS=Number(process.argv[3])||3,DT=.1,LEVELS=[1,10,20,30,50];
const ASSUMED_SERVED_PER_CAP_HOUR=90,ARRIVALS_PER_CAP_HOUR=CFG.cafe.customersPerHourPerCap; // 밸런스_2년.md §1 · 갱신 132-4

function run(level,shibas,seed){
 const r=S.rng(seed),s=S.newState(0);S.chooseStart(s,'red','',r,0);s.cafe.level=level;
 for(let i=1;i<shibas;i++){const sh=S.makeShiba(s,{breed:CFG.breeds[i%CFG.breeds.length],level:CFG.startShiba.level,r,now:0});s.shibas.push(sh);if(!S.setPlaced(s,sh.id,true))throw Error(`slot ${i+1} not placeable at Lv${level}`);}
 const w=S.newWorld(s,r);let t=0;
 for(let i=0,n=Math.round(HOURS*3600/DT);i<n;i++){t+=DT;S.tick(s,w,DT,t*1000);w.events.length=0;}
 const st=s.stats,waiting=w.queue.length+w.custs.filter(c=>c.phase==='entering').length;
 return {arrivals:w.nextCust-1,served:st.served,lost:st.lost,angry:st.angry,waiting,seated:w.custs.filter(c=>c.phase==='seated').length,rep:s.cafe.rep,levelEnd:s.cafe.level};
}

const seats=(()=>{const s=S.newState(0);return S.seatSlots(s,S.newWorld(s,S.rng(1))).length;})();
const rows=[];
for(const level of LEVELS){const slots=Math.min(CFG.cafe.maxPlaced,pressureAt(level).slots);
 for(const shibas of [...new Set([1,slots])]){
  const runs=Array.from({length:SEEDS},(_,k)=>run(level,shibas,k+1)),avg=k=>runs.reduce((a,x)=>a+x[k],0)/runs.length;
  const cap=pressureAt(level).cap,arrivals=avg('arrivals'),served=avg('served'),missed=avg('lost')+avg('angry');
  rows.push({Lv:level,shibas,cap,seats,'expected arrivals':ARRIVALS_PER_CAP_HOUR*cap*HOURS,arrivals,served,'turned away':avg('lost'),'left queue':avg('angry'),waiting:avg('waiting')+avg('seated'),
   'miss %':100*missed/arrivals,'served per cap-hour':served/cap/HOURS,'rep end':avg('rep')});}}

const f=(v,d=0)=>typeof v==='number'?v.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}):String(v);
const cols=Object.keys(rows[0]),fmt=(k,v)=>f(v,/%|per cap|rep/.test(k)?1:0);
const table=[cols,...rows.map(r=>cols.map(k=>fmt(k,r[k])))],wid=cols.map((_,i)=>Math.max(...table.map(r=>r[i].length)));
console.log(`밸런스 sim: ${HOURS} simulated hour(s) per row, mean of ${SEEDS} seeds, production config, default furniture (${seats} seats), dt ${DT}s`);
console.log(`file assumption (밸런스_2년.md §1): served = ${ASSUMED_SERVED_PER_CAP_HOUR} of ${ARRIVALS_PER_CAP_HOUR} arrivals per cap-hour → miss ${100-ASSUMED_SERVED_PER_CAP_HOUR*100/ARRIVALS_PER_CAP_HOUR}%`);
console.log('waiting = in the queue, walking to a seat or seated when the run ends (not counted as served or missed)\n');
for(const [i,r] of table.entries()){console.log(r.map((c,j)=>j<2?c.padEnd(wid[j]):c.padStart(wid[j])).join('  '));if(!i)console.log(wid.map(n=>'-'.repeat(n)).join('  '));}
