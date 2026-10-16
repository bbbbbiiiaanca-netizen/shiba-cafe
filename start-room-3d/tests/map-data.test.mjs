import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {MAP,SPRITES,zoneAt,cellToImage,cellToScreen,footprintCentre,compareDepth,footprintCells,validPlacement,flipDir,rotateDir,availableDirs,defaultPlacement,restorePlacement} from '../map-data.js';
const z=structuredClone(MAP.zones[0]);
assert.deepEqual(z.origin,{x:429,y:181});assert.deepEqual(z.cell,{w:128,h:64});
assert.equal(z.cols,6);assert.equal(z.rows,6);assert.equal(z.floor,1);assert.equal(z.locked,false);assert.equal(z.unlockCost,null);
assert.equal(existsSync(new URL('../'+z.image,import.meta.url)),true);
assert.deepEqual(cellToImage(0,0,z),{x:429,y:213});
assert.deepEqual(cellToImage(3,3,z),{x:429,y:405});
assert.deepEqual(cellToImage(0,3.5,z),{x:205,y:325});
assert.deepEqual(cellToImage(2.5,0,z),{x:589,y:293});
assert.deepEqual(cellToScreen(3,3,{x:10,y:20,scale:.5},z),{x:224.5,y:222.5});
assert.deepEqual(z.slots.map(s=>[s.type,footprintCells(s)]),[['counter',[[0,0],[1,0]]],['cushion',[[1,3]]],['table',[[2,3]]],['cushion',[[3,3]]],['stairs',[[4,0],[5,0]]]]);
assert.deepEqual(Object.values(SPRITES).filter(s=>s.file).map(s=>s.anchor),[[50.5,162.5],[92,93],[90,74],[124,116],[121,167]]);
assert.deepEqual(Object.values(SPRITES).filter(s=>s.file).map(s=>s.scale),[64/89,1,1,1,1]);
assert.deepEqual(footprintCentre(z.slots[0]),[0.5,0]);
assert.deepEqual(footprintCentre(z.slots[4]),[4.5,0]);
assert.deepEqual([...z.slots].sort(compareDepth).map(s=>s.id),['counter','cushion-back','table','stairs','cushion-front']);
assert.ok(compareDepth({cells:[[0,2]]},{cells:[[2,0]]})<0);
const occupied=new Set();for(const s of z.slots){assert.ok(SPRITES[s.type]);assert.ok(!('i' in s)&&!('j' in s));assert.equal(footprintCells(s).length,SPRITES[s.type].footprint.cells);assert.ok(footprintCells(s).length===1||footprintCells(s).length===2);const axis=SPRITES[s.type].footprint.axis;if(axis)assert.equal(footprintCells(s)[1][axis==='i'?0:1]-footprintCells(s)[0][axis==='i'?0:1],1);assert.ok(existsSync(new URL('../'+SPRITES[s.type].file,import.meta.url)));for(const [c,r] of footprintCells(s)){assert.ok(Number.isInteger(c)&&Number.isInteger(r));assert.ok(c>=0&&c<z.cols&&r>=0&&r<z.rows);assert.ok(!occupied.has(`${c},${r}`));occupied.add(`${c},${r}`);}}
{const st=z.slots.find(s=>s.type==='stairs');assert.deepEqual(st.connects,[1,2]);assert.equal(footprintCells(st).length,2);assert.equal(footprintCells(z.slots.find(s=>s.type==='counter')).length,2);}
const expanded={zones:[z,{...structuredClone(z),id:'upstairs',floor:2,locked:true,slots:[]}]};z.rows++;
assert.equal(zoneAt(expanded,5,6).id,'A');assert.equal(zoneAt(expanded,5,7),undefined);
assert.equal(zoneAt(expanded,3,3,2).id,'upstairs');assert.equal(zoneAt(expanded,3,3,2).unlockCost,null);
console.log('map data: image coordinates, approved anchors, footprints, zones, row expansion and second floor passed');

const counter=z.slots[0];
for(const dir of [0,1,2,3])assert.deepEqual(footprintCells({...counter,dir}),dir%2?[[0,0],[0,1]]:[[0,0],[1,0]]);
assert.equal(validPlacement({...counter,origin:[5,0]},z.slots),false);
assert.equal(validPlacement({...counter,origin:[-1,0]},z.slots),false);
assert.equal(validPlacement({...counter,origin:[1,3]},z.slots),false);
assert.equal(validPlacement({...counter,origin:[0,1],dir:1},z.slots),true);
assert.equal(validPlacement({...counter,origin:[0,5],dir:1},z.slots,MAP.zones[0]),false);
assert.equal(validPlacement({...counter,dir:2},z.slots),true);assert.equal(validPlacement({type:'wall',id:'w',origin:[0,0],dir:2},[]),false);
assert.deepEqual([0,1,2,3].map(flipDir),[1,0,3,2]);
// 10-14 수인님: 앞 → 앞 반전 → 뒤 → 뒤 반전. 뒷모습 있는 4종은 4방향, 칸막이(뒷모습 없음)는 앞/앞 반전만.
for(const t of ['table','cushion','counter','stairs']){assert.deepEqual(availableDirs(t),[0,1,2,3]);assert.deepEqual([0,1,2,3].map(d=>rotateDir(t,d)),[1,2,3,0]);assert.match(SPRITES[t].back.file,/-v4-back\.png$/);}
assert.equal(SPRITES.counter.back.mirror,true);assert.equal(SPRITES.stairs.back.mirror,true);assert.deepEqual(availableDirs('wall'),[0,1]);assert.equal(rotateDir('wall',0),1);assert.equal(rotateDir('wall',1),0);
{const sv=defaultPlacement();sv.slots[0].dir=3;assert.equal(restorePlacement(JSON.parse(JSON.stringify(sv))).slots[0].dir,3);}
const back={...SPRITES,counter:{...SPRITES.counter,back:{...SPRITES.counter}}};
assert.deepEqual(availableDirs('counter',back),[0,1,2,3]);
assert.deepEqual([0,1,2,3].map(d=>rotateDir('counter',d,back)),[1,2,3,0]);
assert.deepEqual(restorePlacement(null),defaultPlacement());
const saved=defaultPlacement();saved.slots[0].origin=[0,1];saved.slots[0].dir=1;
assert.deepEqual(restorePlacement(JSON.parse(JSON.stringify(saved))),saved);
saved.slots[0].origin=[1,3];assert.deepEqual(restorePlacement(saved),defaultPlacement());
const {newState,save,load}=await import('../sim.js');
const store={value:null,setItem(k,v){this.value=v;},getItem(){return this.value;}};
const state=newState(0);state.placement=restorePlacement({v:1,slots:defaultPlacement().slots.map(s=>s.id==='counter'?{...s,origin:[0,1],dir:1}:s)});
save(store,state,0);assert.deepEqual(load(store,0).state.placement,state.placement);
delete state.placement;save(store,state,0);assert.deepEqual(load(store,0).state.placement,defaultPlacement());
console.log('furniture edit: directions, bounds, collisions, rotation, placement save and migration passed');

assert.deepEqual(restorePlacement({v:1,slots:defaultPlacement().slots.map(s=>s.id==='stairs'?{...s,origin:null}:s)}),defaultPlacement());
