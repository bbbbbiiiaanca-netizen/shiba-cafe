import assert from 'node:assert/strict';
import { createSim, findPath, buildGrid, footprint, ENTRY } from '../sim.js';
const run=(sim,seconds)=>{for(let i=0;i<seconds*60;i++)sim.step(1/60);};
const tests=[];
function test(name,fn){fn();tests.push(name);console.log(`✓ ${name}`);}
test('손님은 서로 다른 빈 자리에 입장하고 앉는다',()=>{
 const sim=createSim({seed:1});assert.equal(new Set(sim.guests.map(g=>g.tableId)).size,2);
 run(sim,5);assert.ok(sim.guests.every(g=>g.state==='waiting'||g.state==='petting'));assert.ok(sim.guests.every(g=>g.visits===0));
});
test('방문 두 번 후 퇴장하며 새 손님이 빈 자리에 들어온다',()=>{
 const sim=createSim({seed:1});const old=sim.guests[0];let observed=false;
 for(let i=0;i<60*40;i++){sim.step(1/60);if(old.state==='leaving'){assert.equal(old.visits,2);observed=true;}if(!sim.guests.includes(old))break;}
 assert.ok(observed);assert.ok(!sim.guests.includes(old));assert.ok(sim.guests.some(g=>g.id>=2));assert.equal(new Set(sim.guests.map(g=>g.tableId)).size,2);assert.ok(sim.stats.departures>0);
});
test('어느 순간에도 테이블당 시바 예약은 하나이며 한 분 동안 순환한다',()=>{
 const sim=createSim({seed:11});for(let i=0;i<60*60;i++){sim.step(1/60);const reserved=sim.dogs.map(d=>d.tableId).filter(Boolean);assert.equal(new Set(reserved).size,reserved.length);}
 assert.ok(sim.stats.departures>=6);assert.ok(sim.stats.visits>=12);
});
test('BFS 경로는 막힌 칸을 통과하지 않는다',()=>{
 const sim=createSim();for(const goal of [{x:9,z:11},{x:0,z:5},{x:4,z:0}]) {const path=findPath(sim.grid,ENTRY,goal);assert.ok(path);for(const c of path)assert.ok(!sim.grid.has(`${c.x},${c.z}`));for(let i=1;i<path.length;i++)assert.equal(Math.abs(path[i].x-path[i-1].x)+Math.abs(path[i].z-path[i-1].z),1);}
 assert.equal(findPath(sim.grid,ENTRY,{x:1,z:2}),null);
});
test('가구 겹침·범위·입구 통로 차단을 거부한다',()=>{
 const sim=createSim();assert.equal(sim.moveFurniture('plant',1,2).ok,false);assert.equal(sim.moveFurniture('plant',-1,0).ok,false);assert.equal(sim.moveFurniture('moon',5,11).ok,false);
 assert.equal(sim.gridVersion,0);assert.equal(sim.moveFurniture('table-0',0,5).reason,'손님이 앉아 있어요');
});
test('통로를 끊는 배치를 거부하며 정상 이동은 격자를 갱신한다',()=>{
 const sim=createSim();sim.guests=[];sim.dogs=[];
 sim.furniture=[{id:'wall-a',kind:'table',x:0,z:4},{id:'wall-b',kind:'table',x:2,z:4},{id:'wall-c',kind:'table',x:4,z:4},{id:'wall-d',kind:'table',x:6,z:4},{id:'plug',kind:'table',x:8,z:0}];sim.grid=buildGrid(sim.furniture);
 assert.equal(sim.moveFurniture('plug',8,4).ok,false);
 const normal=createSim();const result=normal.moveFurniture('plant',0,1);assert.equal(result.ok,true);assert.equal(normal.gridVersion,1);assert.ok(normal.grid.has('0,1'));assert.ok(!normal.grid.has('0,0'));assert.deepEqual(normal.grid,buildGrid(normal.furniture));
});
test('빈 테이블 세트 이동과 강제 방문 훅, 결정적 난수',()=>{
 const live=createSim();assert.equal(live.moveFurniture('table-2',1,7).ok,true);
 const sim=createSim();sim.guests=[];sim.dogs=[];assert.equal(sim.moveFurniture('table-0',0,1).ok,true);for(const c of footprint(sim.furniture[0]))assert.ok(sim.grid.has(`${c.x},${c.z}`));
 const a=createSim({seed:9}),b=createSim({seed:9});run(a,10);run(b,10);assert.deepEqual(a.state(),b.state());assert.equal(a.forceVisit(),true);assert.ok(a.dogs.some(d=>d.state==='petting'));assert.ok(a.guests.some(g=>g.state==='petting'));
});
console.log(`${tests.length} tests passed`);
