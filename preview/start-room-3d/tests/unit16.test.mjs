import assert from 'node:assert/strict';
import * as S from '../sim.js';
import {CFG} from '../config.js';
import {TABS,DEFAULT_TAB,tabBadges,albaAvailable} from '../tabs.js';
const now=Date.UTC(2026,9,14,3);
const fresh=()=>{const s=S.newState(now);S.chooseStart(s,'red','',()=>.9,now);return s;};

// §16-1 / §17: one row of five, no duplicate ids/labels, the old list tabs are all merged, one main item in the centre, icons only existing files or null.
assert.deepEqual(TABS.map(t=>t.id),['shiba','alba','manage','furniture','shop']);assert.equal(TABS.findIndex(t=>t.main),2);
assert.equal(new Set(TABS.map(t=>t.label)).size,TABS.length);
assert.equal(TABS.filter(t=>t.main).length,1);assert.equal(DEFAULT_TAB,'manage');
const {existsSync}=await import('node:fs');const root=new URL('..',import.meta.url).pathname;
for(const t of TABS)if(t.icon&&t.icon!=='shiba')assert.ok(existsSync(root+t.icon),t.icon);
for(const b of CFG.breeds)assert.ok(existsSync(root+`assets/drive/shiba-${b}.png`));

// Production fresh game (café Lv1): start coins 30,000 (밸런스_2년.md §5) but every menu/알바 is level-locked → no red dots.
let s=fresh();assert.equal(s.coins,30000);
assert.deepEqual(tabBadges(s,now),{shiba:false,alba:false,manage:false,furniture:false,shop:false});

// 가게 관리: a developable menu, or an unseen finished development.
s=fresh();s.coins=S.menuItem('M-02').devCost-1;s.cafe.level=2;assert.equal(tabBadges(s,now).manage,false);s.coins++;assert.equal(tabBadges(s,now).manage,true);
S.developMenu(s,'M-02',now);assert.equal(tabBadges(s,now).manage,false,'in development, nothing else can start');
assert.equal(tabBadges(s,now,{menuDone:true}).manage,true);

// 시바: injured/sick or a level-up the paws can pay for.
s=fresh();s.shibas[0].paws=S.pawsToNext(s.shibas[0].level)-1;assert.equal(tabBadges(s,now).shiba,false);
s.shibas[0].paws++;assert.equal(tabBadges(s,now).shiba,true);
s=fresh();s.shibas[0].status='injured';s.shibas[0].injury='light';assert.equal(tabBadges(s,now).shiba,true);

// 알바: only when some helper can actually be hired (level, coins, cooldown, status).
s=fresh();s.coins=CFG.alba.daycare.cost;s.cafe.level=CFG.alba.daycare.unlock-1;assert.equal(albaAvailable(s,now),false);
s.cafe.level=CFG.alba.daycare.unlock;assert.equal(albaAvailable(s,now),true);
S.hireAlba(s,'daycare',[s.shibas[0].id],now);s.coins=CFG.alba.daycare.cost;assert.equal(albaAvailable(s,now),false,'cooldown');
s=fresh();s.coins=CFG.alba.manager.cost;s.cafe.level=CFG.alba.manager.unlock;s.shibas[0].status='sick';assert.equal(albaAvailable(s,now),true,'manager needs no shiba');

// Null alba cost is never hireable (albaCheck 'unset'), even with coins.
const old=CFG.alba.manager.cost;CFG.alba.manager.cost=null;
try{s=fresh();s.coins=1e9;s.cafe.level=50;s.shibas[0].status='sick';assert.equal(S.albaCheck(s,'manager',[],now),'unset');assert.equal(S.hireAlba(s,'manager',[],now),null);assert.equal(s.coins,1e9);assert.equal(albaAvailable(s,now),false);}
finally{CFG.alba.manager.cost=old;}
console.log('§16 tabs: single merged row, red dots from real state, null alba price disabled passed');
