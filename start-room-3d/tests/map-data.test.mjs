import assert from 'node:assert/strict';
import {MAP,zoneAt,canPlace,placeItem,SPRITES} from '../map-data.js';
const f=structuredClone(MAP.floors[0]);
assert.equal(f.zones.filter(z=>!z.locked).length,1);
assert.equal(zoneAt({zones:[{id:'cells',cells:[[2,3]],locked:false}]},2,3).id,'cells');
assert.equal(zoneAt(f,3,5).id,'A');assert.equal(zoneAt(f,4,5).id,'B');
for(const z of f.zones){assert.equal(z.unlockCost,null);assert.equal(z.theme,null);}
assert.deepEqual(SPRITES.expand.anchor,[64,72]);
assert.equal(f.slots.length,f.grid.flat().length);
assert.equal(new Set(f.slots.map(s=>s.id)).size,f.slots.length);
for(const s of f.slots)assert.equal(zoneAt(f,...s.cell).id,s.zoneId);
for(const o of f.objects){assert.equal(o.zoneId,'A');for(let r=o.row;r<o.row+o.h;r++)for(let c=o.col;c<o.col+o.w;c++)assert.equal(f.slots.find(s=>s.cell[0]===c&&s.cell[1]===r).item,o.type);}
assert.equal(canPlace(f,'1:1,0','table'),false,'occupied counter footprint');
assert.equal(canPlace(f,'1:5,5','table'),false,'locked zone');
assert.equal(canPlace(f,'1:0,0','guest'),false,'unsupported item');
assert.equal(placeItem(f,'1:0,0','table'),true);assert.equal(canPlace(f,'1:0,0','table'),false);assert.equal(placeItem(f,'1:0,0','cushion'),false);
assert.equal(placeItem(f,'missing','table'),false);
const run=f.interiorWalls[0];assert.deepEqual(run.zones,['A','B']);
assert.equal(run.edges.filter(e=>e.door).length,1);
assert.deepEqual(run.edges.find(e=>e.door),{from:[4,3],to:[4,4],door:true});
for(const e of run.edges){const [c,r]=e.from;assert.equal(zoneAt(f,c-1,r).id,'A');assert.equal(zoneAt(f,c,r).id,'B');assert.deepEqual(e.to,[c,r+1]);}
assert.deepEqual(f.objects.find(o=>o.type==='stairs').connects,[1,2]);
const upper=MAP.floors[1];assert.equal(upper.locked,true);assert.equal(canPlace(upper,upper.slots[0].id,'table'),false);
const extended=structuredClone(f);extended.grid.push(Array(6).fill('tatami'));extended.zones[0].rect.h++;extended.zones[1].rect.h++;
assert.equal(zoneAt(extended,0,6).id,'A');assert.equal(zoneAt(extended,5,6).id,'B');
console.log('map data: zones, footprints, placement, door gap, stairs and row expansion passed');
