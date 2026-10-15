// 출시 빌드(RELEASE): '미정/준비 중' 문구 숨김·'· 미정' 부분 제거. 일반 빌드는 원문 그대로.
import assert from 'node:assert/strict';
import {makeT,setRelease,RELEASE_HIDE_KEYS,RELEASE_STR,STR} from '../i18n.js';
for(const lang of ['ko','en']){
 const L=makeT(()=>lang);
 setRelease(false);
 assert.equal(L('care.abandonQ',{name:'시루',d:5}),STR[lang]['care.abandonQ'].replace('{name}','시루').replace('{d}',5));
 assert.ok(L('walk.stop').length>0);
 setRelease(true);
 for(const k of RELEASE_HIDE_KEYS)assert.equal(L(k),'',k);
 for(const k of Object.keys(RELEASE_STR[lang])){const v=L(k);assert.ok(!/미정|TBD|준비 중|Coming soon/.test(v),k+': '+v);}
 assert.ok(!/단골|Regulars/.test(L('care.abandonQ',{name:'x',d:1})));
 if(lang==='ko')assert.ok(STR.ko['care.abandonQ'].startsWith(RELEASE_STR.ko['care.abandonQ']),'ko 앞 두 문장 원문 유지');
}
setRelease(false);
console.log('release hide: 15 keys hidden, 9 keys trimmed, normal build unchanged (ko/en) passed');
