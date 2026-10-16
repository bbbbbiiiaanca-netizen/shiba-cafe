import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {STR,makeT} from '../i18n.js';
const src=readFileSync(new URL('../isomap.js',import.meta.url),'utf8');
const bar=src.slice(src.indexOf('bar.innerHTML=`'),src.indexOf('`;',src.indexOf('bar.innerHTML=`')));
const btns=[...bar.matchAll(/<button[^>]*>/g)].map(m=>m[0]);
for(const b of btns){const k=b.match(/data-i18n="([^"]+)"/)?.[1];assert.ok(k,'data-i18n missing: '+b);assert.ok(STR.ko[k],'ko key '+k);}
// 17-12: 고른 가구 둘레 5개 + 오른쪽 위 저장하기. 아래 칸 편집 줄 버튼(가벽 제거 등)은 없다.
const keyOf=attr=>btns.find(b=>b.includes(attr))?.match(/data-i18n="([^"]+)"/)[1];
const want={'data-furniture-cancel':'app.cancel','data-furniture-store':'edit.store','data-furniture-rotate':'edit.rotate','data-furniture-flip':'edit.flip','data-furniture-done':'app.ok','data-furniture-save':'edit.save'};
for(const [attr,key] of Object.entries(want))assert.equal(keyOf(attr),key,attr);
assert.ok(!bar.includes('data-wall-remove'),'wall remove goes through 보관');
assert.deepEqual(btns.filter(b=>!b.includes(' hidden')).length,6);
assert.match(src,/bar\.setAttribute\('data-i18n-attr','aria-label:edit\.aria'\)/);
assert.match(readFileSync(new URL('../main.js',import.meta.url),'utf8'),/querySelectorAll\('\[data-i18n\]'\)\.forEach\(e=>e\.textContent=L\(e\.dataset\.i18n\)\)/);
const ko=makeT(()=>'ko'),en=makeT(()=>'en');
for(const key of [...Object.values(want),'edit.aria']){assert.ok(ko(key)&&ko(key)===STR.ko[key],'ko '+key);assert.ok(en(key)&&en(key)!==key,'en '+key);}
assert.deepEqual(['app.cancel','edit.store','edit.rotate','edit.flip','app.ok','edit.save'].map(ko),['취소','보관','돌리기','뒤집기','확인','저장하기']);
assert.deepEqual(['app.cancel','edit.store','edit.rotate','edit.flip','app.ok','edit.save'].map(en),['Cancel','Store','Rotate','Flip','OK','Save']);
console.log('edit-bar-i18n ok');
