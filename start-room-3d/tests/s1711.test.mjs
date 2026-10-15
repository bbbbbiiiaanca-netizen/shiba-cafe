import assert from 'node:assert/strict';
const {CFG}=await import('../config.js');const S=await import('../sim.js');
// 1) EXP boost only days 1–7
const st=S.newState(0);const box=S.mailbox(st,14*86400000);
assert.ok(box.filter(r=>r.items.expBoost4h>0).every(r=>r.day<=7));assert.ok(box.some(r=>r.day===8)&&!box.find(r=>r.day===8).items.expBoost4h);
// 3) price tiers
const lv=n=>({cafe:{level:n}});
assert.deepEqual([1,10,11,20,21,35,36,50].map(n=>S.priceTierMul(lv(n))),[1,1,1.5,1.5,2.5,2.5,4,4]);
const s2=S.newState(0);s2.cafe.level=15;
assert.equal(S.spacePrice('row',null,'coins',s2),S.roundLandPrice(170000*1.5));
if(Number.isFinite(CFG.furniture.items[0]?.price))assert.equal(S.furniturePrice(s2,CFG.furniture.items[0].id),Math.round(CFG.furniture.items[0].price*1.5));
s2.coins=1e9;const before=s2.coins;assert.ok(S.buyWall(s2,0));assert.equal(before-s2.coins,S.wallPrice(s2));
// menus/alba unaffected: alba cost unchanged
assert.equal(CFG.alba.daycare.cost,120000);
// 2) dia pools + free skip gives no EXP
const s3=S.newState(0);s3.dia=100;s3.diaPaid=0;let r=S.spendDia(s3,30);assert.deepEqual(r,{paid:0,free:30});assert.deepEqual(S.diaPools(s3),{free:70,paid:0});
S.addPaidDia(s3,50);r=S.spendDia(s3,80);assert.deepEqual(r,{paid:10,free:70});assert.deepEqual(S.diaPools(s3),{free:0,paid:40});
const s4=S.newState(0);s4.expScale=0;const e0=s4.cafe.exp;S.addCafeExp(s4,100);assert.equal(s4.cafe.exp,e0);delete s4.expScale;S.addCafeExp(s4,100);assert.ok(s4.cafe.exp>e0);
console.log('§17-11: exp boost days1–7, dia pools, free-skip no EXP, price tiers passed');
