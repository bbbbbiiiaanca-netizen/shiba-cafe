import assert from 'node:assert/strict';
import {CFG} from '../config.js';
import {newState,save,load,spaceUnlockCheck,unlockSpace,switchFloor} from '../sim.js';
import {MAP,zonesForSpace,validPlacement,restoreSpace} from '../map-data.js';
const state=newState(0);state.coins=Number.MAX_SAFE_INTEGER;
assert.equal(state.space.unlockedRows,0);assert.equal(state.space.floor2Unlocked,false);
assert.equal(switchFloor(state,2),false);
for(const [kind,id] of [['row'],['floor2'],['theme','fuji'],['theme','bamboo']]){
 assert.equal(spaceUnlockCheck(state,kind,id),'unset');const before=JSON.stringify(state);assert.equal(unlockSpace(state,kind,id),false);assert.equal(JSON.stringify(state),before);
}
assert.deepEqual(CFG.themes.map(t=>t.name),['다다미','후지산 벽화 카페','대나무 회랑']);assert.equal(CFG.themes[0].locked,false);
assert.ok(CFG.themes.filter(t=>t.locked).every(t=>t.art===null&&t.unlockCost===null));
const second=MAP.zones.find(z=>z.floor===2);assert.equal(second.image,null);assert.ok(second.screenOffset.y<0);assert.deepEqual(second.connects,{zone:'A',slot:'stairs'});
// Explicit test-only costs; production costs remain null.
const costs=[CFG.expansion.rowCost,CFG.cafe.expansion2FCost,CFG.themes[1].unlockCost];
try{
 CFG.expansion.rowCost=500000;CFG.cafe.expansion2FCost=1000000;CFG.themes[1].unlockCost=750000;
 state.coins=499999;assert.equal(unlockSpace(state,'row'),false);
 state.coins=2250000;assert.equal(unlockSpace(state,'row'),true);assert.equal(state.space.unlockedRows,1);assert.equal(state.coins,1750000);
 const zone=zonesForSpace(state.space)[0],table=state.placement.slots.find(s=>s.type==='table');
 assert.equal(validPlacement({...table,origin:[2,6]},state.placement.slots),false);
 assert.equal(validPlacement({...table,origin:[2,6]},state.placement.slots,zone),true);
 assert.equal(validPlacement({...table,origin:[2,7]},state.placement.slots,zone),false);
 table.origin=[2,6];assert.equal(unlockSpace(state,'floor2'),true);assert.equal(switchFloor(state,2),true);
 assert.equal(unlockSpace(state,'theme','fuji'),true);assert.equal(state.coins,0);assert.equal(unlockSpace(state,'theme','fuji'),false);
 const store={value:null,setItem(k,v){this.value=v;},getItem(){return this.value;}};save(store,state,0);const restored=load(store,0).state;
 assert.deepEqual(restored.space,state.space);assert.deepEqual(restored.placement,state.placement);assert.equal(restored.cafe.floor,2);
 delete state.space;state.cafe.floor=2;save(store,state,0);const migrated=load(store,0).state;assert.equal(migrated.space.unlockedRows,0);assert.equal(migrated.cafe.floor,1);
}finally{[CFG.expansion.rowCost,CFG.cafe.expansion2FCost,CFG.themes[1].unlockCost]=costs;}
assert.equal(restoreSpace({unlockedRows:-1}).unlockedRows,0);
console.log('Unit 3: transactions, bounds, locks, themes, persistence and migration passed');
