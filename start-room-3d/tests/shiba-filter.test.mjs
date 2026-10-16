// 2026-10-16 똑또기: 시바들 탭 필터 = 한 줄 칩 (전체 + 종류별 얼굴 그림, 글자 없음) + 레벨 ↓/↑. <select>·털색·희귀 색 필터 없음.
import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {runInNewContext} from 'node:vm';
import {CFG} from '../config.js';import {STR} from '../i18n.js';
const main=readFileSync(new URL('../main.js',import.meta.url),'utf8'),html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const src=main.slice(main.indexOf('function shibaTools(f){'),main.indexOf('\n// Tiny status light'));
assert.ok(src.length>0,'shibaTools exists');
const ko=STR.ko,L=k=>ko[k]??k,img=(src,alt='')=>`<img src="${src}" alt="${alt}" draggable="false">`,IMG={shiba:b=>`assets/drive/shiba-${b}.png`};
const tools=f=>runInNewContext(src+';shibaTools',{CFG,L,img,IMG})(f);
const names=CFG.breeds.map(b=>L('shiba.breed.'+b));assert.ok(names.every(n=>n&&!n.startsWith('shiba.')),'breed names exist for aria');
for(const breed of ['all',...CFG.breeds])for(const sort of ['levelDesc','levelAsc']){
 const h=tools({breed,sort});
 assert.match(h,/^<div class="shiba-tools" data-shiba-filter data-shiba-sort role="group" aria-label="[^"]+">/);
 assert.doesNotMatch(h,/<select|<option|data-shiba-breed/);
 assert.doesNotMatch(h,/coat|rare|털색|희귀/i,'no coat / rare colour filter');
 const chips=[...h.matchAll(/<button class="chip( breed-chip)?( on)?" data-act="shibaView" data-k="breed" data-v="([^"]+)" aria-pressed="(true|false)"([^>]*)>([^]*?)<\/button>/g)];
 assert.deepEqual(chips.map(m=>m[3]),['all',...CFG.breeds],'전체 + one chip per breed, in order');
 chips.forEach(m=>{const on=m[3]===breed;assert.equal(!!m[2],on);assert.equal(m[4],String(on));});
 assert.equal(chips[0][6],L('app.all'));assert.equal(chips[0][1],undefined);
 chips.slice(1).forEach((m,i)=>{const b=CFG.breeds[i];assert.equal(m[1],' breed-chip');
  assert.equal(m[5],` aria-label="${names[i]}" title="${names[i]}"`);
  assert.equal(m[6],`<img src="assets/drive/shiba-${b}.png" alt="" draggable="false">`,b+': face image only, empty alt');});
 // no visible breed name anywhere: strip attributes → text only
 const text=h.replace(/<[^>]+>/g,'');names.forEach(n=>assert.ok(!text.includes(n),'no visible breed name: '+n));
 assert.equal(text,L('app.all')+L('shibas.level')+' '+(sort==='levelAsc'?'↑':'↓'));
 assert.match(h,new RegExp(`<button class="chip" data-act="shibaView" data-k="sort" data-v="${sort==='levelAsc'?'levelDesc':'levelAsc'}" data-sort-toggle="${sort}">`));
 assert.ok(h.endsWith('</button></div>'));}
// wiring: P.shibas uses it; old select change listener gone; act.shibaView still keyed by k/v
assert.match(main,/<div class="note">\$\{L\('shibas\.slots'[^\n]*\n  \$\{shibaTools\(f\)\}\n  <div class="shiba-grid" data-shiba-grid>/);
assert.doesNotMatch(main,/data-shiba-breed|addEventListener\('change'[^\n]*shiba/);
assert.match(main,/shibaView:d=>\{ui\.shibaView=\{\.\.\.\(ui\.shibaView\|\|\{breed:'all',sort:'levelDesc'\}\),\[d\.k\]:d\.v\}/);
// CSS: one row, no wrap, square 4-col grid kept, no select styling left
assert.match(html,/\.shiba-tools\{display:flex;flex-wrap:nowrap;/);assert.doesNotMatch(html,/\.shiba-tools select/);
assert.match(html,/\.shiba-tools \.breed-chip img\{width:24px;height:24px;/);
assert.match(html,/\.shiba-grid\{[^}]*grid-template-columns:repeat\(4,/);
console.log('shiba-filter ok');
