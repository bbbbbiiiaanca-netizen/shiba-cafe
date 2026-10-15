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
// 하트 효과 배수 → 증가분(+50%), 하트 1개는 단수형.
{const {pctUp,HEART_FX}=await import('../effects.js');const {setLangSource}=await import('../i18n.js');const {CFG}=await import('../config.js');
 assert.equal(pctUp(1.5),'+50%');assert.equal(pctUp(1.2),'+20%');assert.equal(pctUp(2),'+100%');
 const it=id=>CFG.heartUse.items.find(x=>x.id===id);
 setLangSource(()=>'en');assert.match(HEART_FX.praise(it('praise')),/^Rep from happy guests \+50% /);assert.match(HEART_FX.brush(it('brush')),/^Shiba bonus \+20% /);
 if(CFG.walk.heartsPer10Min===1)assert.match(HEART_FX.walk(),/^1 heart\/10 min/);
 setLangSource(()=>'ko');assert.match(HEART_FX.praise(it('praise')),/만족 평판 \+50%/);setLangSource(()=>'ko');
 console.log('heart fx: +N% increments and singular heart passed');}
