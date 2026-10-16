import assert from 'node:assert/strict';
import {CFG} from '../config.js';
import * as Q from '../q1715.js';
assert.deepEqual(CFG.quests.daily.tasks.map(t=>[t.name,t.goal]),[['손님 3명 받기',3],['시바 1마리 쓰다듬기',1],['메뉴 1잔 판매',1]]);assert.equal(CFG.quests.instantDia,10);
assert.equal(Q.progress(null),null);assert.equal(Q.progress([{progress:null,goal:1}]),null);
assert.deepEqual(Q.progress([{progress:2,goal:2},{progress:1,goal:3}]),{n:1,m:2});
const tasks=CFG.quests.daily.tasks.map(t=>({...t,progress:0}));tasks[1].progress=1;
const h=Q.questsHtml(CFG.quests,'daily',tasks,5,Date.UTC(2026,9,15,3));assert.equal((h.match(/class="quest-row"/g)||[]).length,3);assert.doesNotMatch(h,/TEST FIXTURE|undefined|null/);assert.match(h,/0\/3/);assert.match(h,/<span class="quest-progress">진행 1\/3<\/span>/);assert.match(h,/<h3>일일<\/h3><div class="quest-reward"><span class="art-slot quest-reward-art"><img src="assets\/drive\/ui\/ui-quest-reward-box\.png" alt="" onerror="this\.remove\(\)"><\/span><strong>미정<\/strong>/);assert.match(h,/남은 시간 12시간 0분/);assert.doesNotMatch(h,/>일일 1\/3/);assert.match(h,/quest-done/);assert.match(h,/questInstant[^>]*disabled/);assert.match(h,/10 즉시완료/);
assert.doesNotMatch(Q.questsHtml(CFG.quests,'daily',tasks,10),/questInstant[^>]*disabled/);assert.ok(h.indexOf('quest-tabs')<h.indexOf('quest-row'));
const dongu=Q.questsHtml(CFG.quests,'dongu',tasks,0);assert.match(dongu,/data-quests-empty/);assert.match(dongu,/진행 미정/);assert.match(dongu,/동구와 대화/);assert.doesNotMatch(dongu,/class="quest-row"/);
assert.deepEqual(CFG.quests.temp,['daily.tasks','instantDia']);
const unset={...CFG.quests,daily:{...CFG.quests.daily,resetKST:null}};assert.match(Q.questsHtml(unset),/초기화 시간 미정/);
const reward={...CFG.quests,daily:{...CFG.quests.daily,reward:123}};assert.match(Q.questsHtml(reward,'daily',tasks),/<strong>123<\/strong>/);assert.match(Q.questsHtml(reward,'dongu'),/<strong>미정<\/strong>/);
assert.match(Q.questsHtml(CFG.quests,'daily',tasks,0,Date.UTC(2026,9,15,15)),/남은 시간 24시간 0분/);assert.match(Q.questsHtml(CFG.quests,'daily',tasks,0,Date.UTC(2026,9,15,14,59)),/남은 시간 0시간 1분/);
for(const variant of ['warning','rude','normal','quest']){const h=Q.dialogueHtml({variant,actor:'dongu',text:'<test>',tasks:Q.QUEST_FIXTURE});assert.match(h,/dongu-front.png/);assert.match(h,/&lt;test&gt;/);assert.match(h,/confirmYes/);assert.equal(h.includes('modalOk'),variant!=='quest');}
assert.doesNotMatch(Q.dialogueHtml({text:'미정'}),/<img/);
for(const actor of ['girl','man'])assert.match(Q.dialogueHtml({actor}),new RegExp('assets/cust_'+actor+'.png'));
assert.deepEqual(CFG.shop.itemCategories,{'tea-table':'interior',zabuton:'interior',stairs:'interior',counter:'kitchen'});
for(const [tab,count] of [['interior',3],['kitchen',1],['exterior',0]]){const h=Q.shopHtml(CFG,tab,()=>123);assert.equal((h.match(/class="furn-buy"/g)||[]).length,count);assert.doesNotMatch(h,/undefined|null/);}
assert.match(Q.shopHtml(CFG,'cash',()=>null),/couponCode/);
const special=Q.shopHtml(CFG,'special',()=>null);assert.equal((special.match(/<button disabled>/g)||[]).length,3);assert.match(special,/하트 미정/);
{const row=Q.shopHtml(CFG,'interior',()=>null).split('data-theme-logos>')[1].split('</div>')[0];assert.equal((row.match(/class="theme-logo[ "]/g)||[]).length,3);assert.equal((row.match(/theme-lock/g)||[]).length,2);assert.doesNotMatch(row,/art-slot/);assert.match(row,/aspect-ratio:256\/128/);}
console.log('q1715/q1717: null config, safe shared dialogues, fixture isolation, progress, shop mapping and disabled prices passed');

const {readFileSync}=await import('node:fs');
const main=readFileSync(new URL('../main.js',import.meta.url),'utf8');
assert.ok(main.includes("function warn(text,actor='dongu'){ui.modals.unshift({kind:'dialogue',variant:'warning',actor,speech:L('dlg.check'),text});refresh();}"));assert.ok(main.includes("onBlocked:message=>warn(message||L('edit.blocked'))"));assert.match(main,/const game=\{CFG,S,iso,warn,/);assert.ok(main.includes('S.questTasks(s,clock.now()),s.dia,clock.now())'));
assert.match(main,/debugQuestFixture\(enabled\)\{if\(!temp\)return false/);
assert.match(main,/kind:'dialogue',variant:'warning',actor:'dongu',text:L\('care.abandonQ'/);
assert.match(main,/mission:\(\)=>open\('quests'\)/);
{const S=await import('../sim.js');const s=S.newState();s.dia=10;const now=Date.UTC(2026,9,15,3);
assert.deepEqual(S.questTasks(s,now).map(t=>t.progress),[0,0,0]);S.questBump(s,'serve',now);S.questBump(s,'sell',now);assert.deepEqual(S.questTasks(s,now).map(t=>t.progress),[1,0,1]);
assert.equal(S.questInstant(s,'pet',now),true);assert.equal(s.dia,0);assert.equal(S.questTasks(s,now)[1].progress,1);assert.equal(S.questInstant(s,'serve',now),false);
assert.deepEqual(S.questTasks(s,now+86400e3).map(t=>t.progress),[0,0,0]);console.log('daily quests: progress, 10-dia instant, KST reset passed');}
