import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {MAP,SPRITES,zoneAt,cellToImage,cellToScreen,footprintCentre,compareDepth} from '../map-data.js';
const z=structuredClone(MAP.zones[0]);
assert.deepEqual(z.origin,{x:429,y:181});assert.deepEqual(z.cell,{w:128,h:64});
assert.equal(z.cols,6);assert.equal(z.rows,6);assert.equal(z.floor,1);assert.equal(z.locked,false);assert.equal(z.unlockCost,null);
assert.equal(existsSync(new URL('../'+z.image,import.meta.url)),true);
assert.deepEqual(cellToImage(0,0,z),{x:429,y:213});
assert.deepEqual(cellToImage(3,3,z),{x:429,y:405});
assert.deepEqual(cellToImage(0,3.5,z),{x:205,y:325});
assert.deepEqual(cellToImage(2.5,0,z),{x:589,y:293});
assert.deepEqual(cellToScreen(3,3,{x:10,y:20,scale:.5},z),{x:224.5,y:222.5});
assert.deepEqual(z.slots.map(s=>[s.type,s.cells]),[['counter',[[0,0],[1,0]]],['cushion',[[1,3]]],['table',[[2,3]]],['cushion',[[3,3]]],['stairs',[[4,0],[5,0]]]]);
assert.deepEqual(Object.values(SPRITES).map(s=>s.anchor),[[92,93],[90,74],[124,132],[121,167]]);
assert.deepEqual(Object.values(SPRITES).map(s=>s.scale),[1,1,1,1]);
assert.deepEqual(footprintCentre(z.slots[0]),[0.5,0]);
assert.deepEqual(footprintCentre(z.slots[4]),[4.5,0]);
assert.deepEqual([...z.slots].sort(compareDepth).map(s=>s.id),['counter','cushion-back','table','stairs','cushion-front']);
assert.ok(compareDepth({cells:[[0,2]]},{cells:[[2,0]]})<0);
const occupied=new Set();for(const s of z.slots){assert.ok(SPRITES[s.type]);assert.ok(!('i' in s)&&!('j' in s));assert.equal(s.cells.length,SPRITES[s.type].footprint.cells);assert.ok(s.cells.length===1||s.cells.length===2);const axis=SPRITES[s.type].footprint.axis;if(axis)assert.equal(s.cells[1][axis==='i'?0:1]-s.cells[0][axis==='i'?0:1],1);assert.ok(existsSync(new URL('../'+SPRITES[s.type].file,import.meta.url)));for(const [c,r] of s.cells){assert.ok(Number.isInteger(c)&&Number.isInteger(r));assert.ok(c>=0&&c<z.cols&&r>=0&&r<z.rows);assert.ok(!occupied.has(`${c},${r}`));occupied.add(`${c},${r}`);}}
{const st=z.slots.find(s=>s.type==='stairs');assert.deepEqual(st.connects,[1,2]);assert.equal(st.cells.length,2);assert.equal(z.slots.find(s=>s.type==='counter').cells.length,2);}
const expanded={zones:[z,{...structuredClone(z),id:'upstairs',floor:2,locked:true,slots:[]}]};z.rows++;
assert.equal(zoneAt(expanded,5,6).id,'A');assert.equal(zoneAt(expanded,5,7),undefined);
assert.equal(zoneAt(expanded,3,3,2).id,'upstairs');assert.equal(zoneAt(expanded,3,3,2).unlockCost,null);
console.log('map data: image coordinates, approved anchors, footprints, zones, row expansion and second floor passed');
