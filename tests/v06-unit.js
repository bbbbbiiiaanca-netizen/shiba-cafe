const assert=require('assert/strict');
const C=require('../balance-config'),Core=require('../core-loop');
const {SaveService,LocalStorageAdapter,PlayGamesAdapter}=require('../save-service');
const fresh=()=>Core.init({coins:30,pups:[],adopted:[],dex:{},tut:0});
// Weighted guarantees, priority, only counters for obtained rank reset.
for(const [rank,limit] of Object.entries(C.draw.pity)){
 const s=fresh();s.pity[rank]=limit-1;
 assert.equal(Core.roll(s,()=>0).rarity,rank);
}
let s=fresh();s.pity={R:9,SR:39,SSR:119};assert.equal(Core.roll(s,()=>0).rarity,'SSR');assert.deepEqual(s.pity,{R:0,SR:0,SSR:0});
s=fresh();s.pity={R:9,SR:12,SSR:30};assert.equal(Core.roll(s,()=>0).rarity,'R');assert.deepEqual(s.pity,{R:0,SR:13,SSR:31});
s=fresh();for(let i=0;i<9;i++)assert.equal(Core.roll(s,()=>0).rarity,'N');assert.equal(Core.roll(s,()=>0).rarity,'R');
s=fresh();s.discovered[C.draw.identities[0]]=1;for(let i=0;i<9;i++)assert.equal(Core.roll(s,()=>0).fresh,false);assert.equal(Core.roll(s,()=>0).fresh,true);
s=fresh();s.discovered=Object.fromEntries(C.draw.identities.map(k=>[k,1]));s.missedDiscovery=9;assert.doesNotThrow(()=>Core.roll(s,()=>0));
const p={rarity:'SR',level:5,skills:{sit:1,paw:1,wait:1,down:0,bang:0}};assert.equal(Core.adoption(p),18480);assert.deepEqual(Core.levelCost(p),{fragments:25,coins:12500});assert.equal(Core.multiplier({rarity:'SSR',level:10}),3.7840000000000003);
assert.deepEqual(Core.decorEffect({slots:Object.fromEntries(C.decor.ids.map((id,i)=>[i,id]))}),{count:4,demand:.1,stay:.06});
const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
const adapter=new LocalStorageAdapter(storage),migrations={1:d=>({...d,ver:2}),2:d=>Core.init(d)};
const service=new SaveService(adapter,3,migrations);const old={ver:2,coins:500,pups:[],adopted:[],queue:[20]};adapter.write(JSON.stringify(old));const migrated=service.load();assert.equal(migrated.schemaVersion,3);assert.deepEqual(migrated.queue,[]);assert.equal(migrated.tickets,3);assert(service.save(migrated));assert.deepEqual(JSON.parse(adapter.readBackup()),old);
migrated.coins=1000;assert(service.save(migrated));assert.equal(JSON.parse(adapter.readBackup()).coins,500);
adapter.write('{broken');const broken=new SaveService(adapter,3,migrations);assert.equal(broken.load(),null);assert.equal(broken.save(migrated),false);assert.equal(adapter.read(),'{broken');
adapter.write(JSON.stringify({...old,schemaVersion:99}));const future=new SaveService(adapter,3,migrations);assert.equal(future.load(),null);assert.equal(future.save(migrated),false);
assert.throws(()=>new PlayGamesAdapter().read(),/unavailable/);
// 100,000 draws: baseline distribution separately, cumulative pity separately.
let seed=20261012;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const baseline={N:0,R:0,SR:0,SSR:0},pity={...baseline};s=fresh();
for(let i=0;i<100000;i++){baseline[Core.roll(fresh(),rng).rarity]++;pity[Core.roll(s,rng).rarity]++;assert(s.pity.R<C.draw.pity.R);assert(s.pity.SR<C.draw.pity.SR);assert(s.pity.SSR<C.draw.pity.SSR);}
for(const r in baseline)assert(Math.abs(baseline[r]/1000-C.draw.probabilities[r])<.6);
console.log('ALL PASS (pity / discovery / growth / migration / preservation / backup)');console.log('100k baseline:',baseline,'with pity:',pity);
