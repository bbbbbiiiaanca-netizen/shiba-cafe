import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {STR,makeT} from '../i18n.js';
const src=readFileSync(new URL('../isomap.js',import.meta.url),'utf8');
const bar=src.slice(src.indexOf('bar.innerHTML=`'),src.indexOf('`;',src.indexOf('bar.innerHTML=`')));
const btns=[...bar.matchAll(/<button[^>]*>/g)].map(m=>m[0]);assert.equal(btns.length,8);
for(const b of btns){const k=b.match(/data-i18n="([^"]+)"/)?.[1];assert.ok(k,'data-i18n missing: '+b);assert.ok(STR.ko[k],'ko key '+k);}
assert.match(src,/bar\.setAttribute\('data-i18n-attr','aria-label:edit\.aria'\)/);
assert.match(readFileSync(new URL('../main.js',import.meta.url),'utf8'),/querySelectorAll\('\[data-i18n\]'\)\.forEach\(e=>e\.textContent=L\(e\.dataset\.i18n\)\)/);
const ko=makeT(()=>'ko');assert.equal(ko('edit.rotate'),STR.ko['edit.rotate']);
console.log('edit-bar-i18n ok');
