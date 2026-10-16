import assert from 'node:assert/strict';import {STR,makeT,kstToLocal,setRelease} from '../i18n.js';
const ph=s=>(String(s).match(/\{\w+\}/g)||[]).sort().join();
const ko=Object.keys(STR.ko),en=Object.keys(STR.en);
assert.deepEqual(ko.filter(k=>!(k in STR.en)),[],'en missing keys');assert.deepEqual(en.filter(k=>!(k in STR.ko)),[],'en extra keys');
for(const k of ko)assert.equal(ph(STR.en[k]),ph(STR.ko[k]),'placeholder '+k);
assert.equal(ko.length,642); // +quest.left (현지 초기화 남은 시간)
// was 641: // +bag.potionNote, +bag.tab.furniture/acc, bag.fx.capsule/furn (가방 아이콘 UI)
// was 636: // +dongu.unplace (동구 카드 전용, en "Go home"), +fx.heart.walk.one (단수 heart)
assert.ok(!/KST/.test(STR.en['quest.reset']));assert.ok(!/KST/.test(STR.ko['quest.reset']));
assert.equal(typeof kstToLocal('00:00','en-US'),'string');
const T=makeT(()=>'en');assert.equal(T('shiba.breed.red'),'Shiru');
setRelease(true);assert.equal(T('app.unset'),'—');setRelease(false);assert.equal(makeT(()=>'ko')('app.unset'),STR.ko['app.unset']);
console.log('i18n-en ok');
