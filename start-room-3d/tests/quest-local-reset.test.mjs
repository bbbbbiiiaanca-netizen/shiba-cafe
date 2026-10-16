// 일일 퀘스트 초기화 = 기기 현지 시간 (2026-10-16). tz injected like Date#getTimezoneOffset (minutes, KST → -540).
import assert from 'node:assert/strict';
import {CFG} from '../config.js';
import * as S from '../sim.js';
import * as Q from '../q1715.js';
const H=3600e3,M=60e3;
assert.equal(CFG.quests.daily.resetLocal,'00:00');assert.ok(!('resetKST' in CFG.quests.daily));
assert.equal(S.questResetHM({resetKST:'05:00'}),'05:00','legacy resetKST still read');
assert.equal(S.questResetHM({resetLocal:'04:00',resetKST:'05:00'}),'04:00','resetLocal wins');
assert.equal(S.questResetHM({}),null);assert.equal(S.questClock(0,null,0),null);
// local midnight 2026-10-16 in each zone = UTC midnight + offset
for(const [name,tz] of [['UTC',0],['KST',-540],['New York EDT',240],['India',-330],['Nepal',-345]]){
 const mid=Date.UTC(2026,9,16)+tz*M;
 const before=S.questClock(mid-1,'00:00',tz),at=S.questClock(mid,'00:00',tz),after=S.questClock(mid+5*H,'00:00',tz);
 assert.equal(at.day,before.day+1,name+': day rolls over exactly at local midnight');assert.equal(after.day,at.day,name);
 assert.equal(before.next,mid,name+': next reset = local midnight');assert.equal(before.leftSec,0.001,name);
 assert.equal(at.next,mid+24*H,name);assert.equal(at.leftSec,86400,name);assert.equal(after.leftSec,19*3600,name);
 // non-midnight reset 05:30 local
 const r=mid+5.5*H,b=S.questClock(r-M,'05:30',tz),a=S.questClock(r,'05:30',tz);
 assert.equal(a.day,b.day+1,name+' 05:30');assert.equal(b.next,r);assert.equal(b.leftSec,60);assert.equal(a.next,r+24*H);
}
{const n=Date.UTC(2026,9,16,7,13);assert.deepEqual(S.questClock(n,'00:00'),S.questClock(n,'00:00',new Date(n).getTimezoneOffset()),'default = device getTimezoneOffset');}
// the same instant is a different quest day in different zones (not fixed KST)
const t=Date.UTC(2026,9,16,10); // 19:00 KST, 06:00 EDT
assert.equal(S.questClock(t,'00:00',-540).leftSec,5*3600);assert.equal(S.questClock(t,'00:00',240).leftSec,18*3600);assert.equal(S.questClock(t,'00:00',0).leftSec,14*3600);
const t2=Date.UTC(2026,9,16,16); // KST already 10-17, UTC still 10-16
assert.equal(S.questClock(t2,'00:00',-540).day,S.questClock(t2,'00:00',0).day+1);
// DST: offset function — New York 2026-11-01 02:00 EDT→EST; day 10-31 23:00 EST-side reset lands on the post-change offset
const ny=x=>x<Date.UTC(2026,10,1,6)?240:300;const nov2=Date.UTC(2026,10,2,5); // 11-02 00:00 EST
const c=S.questClock(Date.UTC(2026,10,1,12),'00:00',ny);assert.equal(c.next,nov2);assert.equal(c.leftSec,17*3600);
assert.equal(S.questClock(Date.UTC(2026,10,1,3),'00:00',ny).next,Date.UTC(2026,10,1,4),'pre-change reset uses EDT');
// state: progress, instant-complete and reset follow the injected local day
{const s=S.newState(),tz=-540,mid=Date.UTC(2026,9,16)+tz*M;s.dia=10;
 S.questBump(s,'serve',mid-H,tz);assert.deepEqual(S.questTasks(s,mid-H,tz).map(t=>t.progress),[1,0,0]);
 assert.equal(S.questInstant(s,'pet',mid-H,tz),true);assert.equal(s.dia,0);assert.deepEqual(S.questTasks(s,mid-1,tz).map(t=>t.progress),[1,1,0]);
 assert.deepEqual(S.questTasks(s,mid,tz).map(t=>t.progress),[0,0,0],'local midnight resets');
 assert.deepEqual(S.questTasks(s,mid-20*H,tz).map(t=>t.progress),[1,1,0]);assert.deepEqual(S.questTasks(s,mid-20*H,0).map(t=>t.progress),[0,0,0],'KST 10-15 04:00 = UTC 10-14 → other day');
 S.questBump(s,'sell',mid,tz);assert.deepEqual(S.questTasks(s,mid,tz).map(t=>t.progress),[0,0,1]);}
// screen: countdown text + 3 tasks + 10-dia instant + null reward stays unset
const tasks=CFG.quests.daily.tasks.map(t=>({...t,progress:0}));
const h=Q.questsHtml(CFG.quests,'daily',tasks,10,S.questClock(t,'00:00',-540).leftSec);
assert.match(h,/매일 00:00 초기화/);assert.match(h,/data-quest-left>5:00:00 남음/);assert.doesNotMatch(h,/KST/);
assert.equal((h.match(/class="quest-row"/g)||[]).length,3);assert.match(h,/10 즉시완료/);assert.equal(CFG.quests.daily.reward,null);
assert.equal(Q.leftText(86400),'24:00:00');assert.equal(Q.leftText(59.2),'0:01:00');assert.equal(Q.leftText(-3),'0:00:00');
assert.match(Q.questsHtml({...CFG.quests,daily:{...CFG.quests.daily,resetLocal:undefined,resetKST:'06:00'}},'daily',tasks,0,60),/매일 06:00 초기화.*0:01:00 남음/);
assert.match(Q.questsHtml({...CFG.quests,daily:{...CFG.quests.daily,resetLocal:null}},'daily',tasks,0,null),/초기화 시간 미정/);
console.log('quest local reset: device-timezone day key, offsets UTC/KST/EDT/IST/NPT, DST, legacy resetKST, countdown passed');
