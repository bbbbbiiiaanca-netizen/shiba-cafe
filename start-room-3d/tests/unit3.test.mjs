import assert from 'node:assert/strict';
import {CFG} from '../config.js';
import {newState,save,load,spaceUnlockCheck,unlockSpace,switchFloor} from '../sim.js';
import {MAP,zonesForSpace,validPlacement,restoreSpace} from '../map-data.js';
const state=newState(0);state.coins=Number.MAX_SAFE_INTEGER;
assert.equal(state.space.unlockedRows,0);assert.equal(state.space.floor2Unlocked,false);
assert.equal(switchFloor(state,2),false);
// row cost stays UNSET (밸런스_2년.md §3 땅 넓히기 not applied); 2층·themes have starting values and a level gate → at café Lv1 they are 'locked'
for(const [kind,id,why] of [['floor2',undefined,'locked'],['theme','fuji','locked'],['theme','bamboo','locked']]){
 assert.equal(spaceUnlockCheck(state,kind,id),why,kind+(id||''));const before=JSON.stringify(state);assert.equal(unlockSpace(state,kind,id),false);assert.equal(JSON.stringify(state),before);
}
assert.deepEqual(CFG.themes.map(t=>t.name),['다다미','후지산 벽화 카페','대나무 회랑']);assert.equal(CFG.themes[0].locked,false);
assert.ok(CFG.themes.filter(t=>t.locked).every(t=>t.art===null));
// starting values 2026-10-15 (밸런스_2년.md §3), pending user confirm
assert.equal(CFG.expansion.rowCost,170000);assert.deepEqual([CFG.cafe.expansion2FCost,CFG.cafe.expansion2FLevel],[7000000,30]);
assert.deepEqual(CFG.themes.filter(t=>t.locked).map(t=>[t.id,t.unlockLevel,t.unlockCost,t.unlockDia]),[['fuji',20,2400000,1500],['bamboo',35,5400000,3000]]);
for(const [kind,id,lv] of [['floor2',undefined,30],['theme','fuji',20],['theme','bamboo',35]]){state.cafe.level=lv-1;assert.equal(spaceUnlockCheck(state,kind,id),'locked');state.cafe.level=lv;assert.equal(spaceUnlockCheck(state,kind,id),null);}
const second=MAP.zones.find(z=>z.floor===2);assert.equal(second.image,null);assert.ok(second.screenOffset.y<0);assert.deepEqual(second.connects,{zone:'A',slot:'stairs'});
// Explicit test-only row cost (production row cost remains null); 2층 and 후지산 use their configured costs.
const rowCost=CFG.expansion.rowCost;
try{
 CFG.expansion.rowCost=500000;state.cafe.level=50;
 state.coins=499999;assert.equal(unlockSpace(state,'row'),false);
 state.coins=500000+7000000+2400000;assert.equal(unlockSpace(state,'row'),true);assert.equal(state.space.unlockedRows,1);assert.equal(state.coins,9400000);
 const zone=zonesForSpace(state.space)[0],table=state.placement.slots.find(s=>s.type==='table');
 assert.equal(validPlacement({...table,origin:[2,6]},state.placement.slots),false);
 assert.equal(validPlacement({...table,origin:[2,6]},state.placement.slots,zone),true);
 assert.equal(validPlacement({...table,origin:[2,7]},state.placement.slots,zone),false);
 table.origin=[2,6];assert.equal(unlockSpace(state,'floor2'),true);assert.equal(state.coins,2400000);assert.equal(switchFloor(state,2),true);
 assert.equal(unlockSpace(state,'theme','fuji'),true);assert.equal(state.coins,0);assert.equal(unlockSpace(state,'theme','fuji'),false);
 const store={value:null,setItem(k,v){this.value=v;},getItem(){return this.value;}};save(store,state,0);const restored=load(store,0).state;
 assert.deepEqual(restored.space,state.space);assert.deepEqual(restored.placement,state.placement);assert.equal(restored.cafe.floor,2);
 delete state.space;state.cafe.floor=2;save(store,state,0);const migrated=load(store,0).state;assert.equal(migrated.space.unlockedRows,0);assert.equal(migrated.cafe.floor,1);
}finally{CFG.expansion.rowCost=rowCost;}
assert.equal(restoreSpace({unlockedRows:-1}).unlockedRows,0);
console.log('Unit 3: transactions, bounds, locks, themes, persistence and migration passed');

const {nextExpansion}=await import('../map-data.js');
const {pathfind}=await import('../navigation.js');
for(const [n,cols,rows,axis] of [[0,6,6,'j'],[1,6,7,'i'],[2,7,7,'j'],[3,7,8,'i']]){
 const z=zonesForSpace({unlockedRows:n})[0];assert.deepEqual([z.cols,z.rows],[cols,rows]);
 const strip=nextExpansion(z,n);assert.equal(strip.axis,axis);
 const grown=zonesForSpace({unlockedRows:n+1})[0];
 for(const cell of strip.cells){assert.equal(validPlacement({id:'new',type:'table',dir:0,origin:cell},[],z),false);assert.equal(validPlacement({id:'new',type:'table',dir:0,origin:cell},[],grown),true);assert.ok(pathfind(grown,[],[0,5],cell));}
}
state.space=restoreSpace({unlockedRows:3,flooring:'tatami'});state.placement.slots.find(x=>x.id==='table').origin=[6,7];
const expansionStore={setItem(k,v){this.value=v;},getItem(){return this.value;}};save(expansionStore,state,0);
const expanded=load(expansionStore,0).state;assert.equal(expanded.space.unlockedRows,3);assert.equal(expanded.space.flooring,'tatami');assert.deepEqual(expanded.placement.slots.find(x=>x.id==='table').origin,[6,7]);
console.log('§12: alternating grass conversion, placement, navigation and expanded placement save passed');

const {selectFlooring}=await import('../sim.js');
assert.equal(selectFlooring(expanded,'fuji'),false);assert.equal(selectFlooring(expanded,'tatami'),true);
assert.equal(restoreSpace({flooring:'missing'}).flooring,'tatami');

// Task B production values and real purchases: exponential pricing from the first row,
// rounding each quoted total (not recursively multiplying rounded previous quotes).
const B=await import('../sim.js'),land=B.newState(0);
assert.equal(land.coins,30000);assert.equal(B.makeShiba(land,{breed:'white',now:0}).level,1);
B.chooseStart(land,'red','',B.rng(1),0,B.bandanaItems()[0].id);assert.equal(land.shibas[0].level,21);
assert.ok(!B.ledgerStatement(land,0).lines.some(x=>x.id==='land'));
for(const [n,price] of [170000,270000,440000,700000,1100000].entries()){
 assert.equal(B.spacePrice('row',null,'coins',land),price);
 land.coins=price-1;const before=JSON.stringify(land);assert.equal(B.unlockSpace(land,'row',null,'coins',0),false);assert.equal(JSON.stringify(land),before);
 land.coins=price;assert.ok(B.unlockSpace(land,'row',null,'coins',0));assert.equal(land.coins,0);assert.equal(land.space.unlockedRows,n+1);
}
assert.equal(B.roundLandPrice(99499),99000);assert.equal(B.roundLandPrice(99999),100000);assert.equal(B.roundLandPrice(435200),440000);assert.equal(B.roundLandPrice(1782579.2),1800000);assert.equal(B.roundLandPrice(2852126.72),2900000);
const report=B.ledgerStatement(land,0);assert.equal(report.lines.find(x=>x.id==='land').amount,170000+270000+440000+700000+1100000);assert.equal(report.lines.find(x=>x.id==='furniture').amount,0);
assert.ok(!B.ledgerStatement(land,CFG.ledger.periodMs).lines.some(x=>x.id==='land'));
const savedPrice=CFG.expansion.rowCost;try{CFG.expansion.rowCost=null;assert.equal(B.spacePrice('row',null,'coins',land),null);assert.equal(B.spaceUnlockCheck(land,'row'),'unset');}finally{CFG.expansion.rowCost=savedPrice;}
console.log('Task B: price progression/rounding, failed purchase atomicity, land-only daily ledger and Lv1 arrivals passed');
