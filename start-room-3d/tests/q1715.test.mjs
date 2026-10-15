import assert from 'node:assert/strict';
import {CFG} from '../config.js';
import * as Q from '../q1715.js';
assert.deepEqual(CFG.quests,{daily:{resetKST:null,tasks:null,reward:null},dongu:{chapters:null},instantDia:null});
assert.equal(Q.progress(null),null);assert.equal(Q.progress([{progress:null,goal:1}]),null);
assert.deepEqual(Q.progress([{progress:2,goal:2},{progress:1,goal:3}]),{n:1,m:2});
assert.equal(Q.tasksFor(CFG.quests,'daily'),null);
const empty=Q.questsHtml(CFG.quests);assert.match(empty,/data-quests-empty/);assert.match(empty,/보상 미정/);assert.doesNotMatch(empty,/TEST FIXTURE|undefined|null/);
const fixture=Q.questsHtml(CFG.quests,'daily',true);assert.match(fixture,/TEST FIXTURE/);assert.equal((fixture.match(/class="quest-row"/g)||[]).length,3);assert.match(fixture,/questInstant[^>]*disabled/);
for(const variant of ['warning','rude','normal','quest']){const h=Q.dialogueHtml({variant,actor:'dongu',text:'<test>',tasks:Q.QUEST_FIXTURE});assert.match(h,/dongu-front.png/);assert.match(h,/&lt;test&gt;/);assert.match(h,/confirmYes/);assert.equal(h.includes('modalOk'),variant!=='quest');}
assert.doesNotMatch(Q.dialogueHtml({text:'미정'}),/<img/);
for(const actor of ['girl','man'])assert.match(Q.dialogueHtml({actor}),new RegExp('assets/cust_'+actor+'.png'));
assert.deepEqual(CFG.shop.itemCategories,{'tea-table':'interior',zabuton:'interior',stairs:'interior',counter:'kitchen'});
for(const [tab,count] of [['interior',3],['kitchen',1],['exterior',0]]){const h=Q.shopHtml(CFG,tab,()=>123);assert.equal((h.match(/class="furn-buy"/g)||[]).length,count);assert.doesNotMatch(h,/undefined|null/);}
assert.match(Q.shopHtml(CFG,'cash',()=>null),/couponCode/);
const special=Q.shopHtml(CFG,'special',()=>null);assert.equal((special.match(/<button disabled>/g)||[]).length,3);assert.match(special,/하트 미정/);
assert.doesNotMatch(Q.shopHtml(CFG,'interior',()=>null).split('data-theme-logos>')[1].split('</div>')[0],/<img/);
console.log('q1715/q1717: null config, safe shared dialogues, fixture isolation, progress, shop mapping and disabled prices passed');

const {readFileSync}=await import('node:fs');
const main=readFileSync(new URL('../main.js',import.meta.url),'utf8');
assert.match(main,/debugQuestFixture\(enabled\)\{if\(!temp\)return false/);
assert.match(main,/kind:'dialogue',variant:'warning',actor:'dongu',text:L\('care.abandonQ'/);
assert.match(main,/mission:\(\)=>open\('quests'\)/);
