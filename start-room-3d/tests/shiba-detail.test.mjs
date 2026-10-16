import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {CFG} from '../config.js';
import {makeT} from '../i18n.js';
const main=readFileSync(new URL('../main.js',import.meta.url),'utf8');
const src=main.slice(main.indexOf('const bookHtml=id=>'),main.indexOf('// Only white connected'));
const shibas=Object.keys(CFG.profiles).map((breed,i)=>({id:i+1,breed,level:2,name:breed,friends:[(i+1)%4+1]}));
for(const lang of ['ko','en']){
 const L=makeT(()=>lang),P={};
 // Only evaluate the book renderer and P.profile assignment.
 runInNewContext(src.slice(0,src.indexOf('\n',src.indexOf('P.profile=id=>'))),{P,CFG,s:{},S:{byId:(_,id)=>shibas.find(x=>x.id===id)},L,LF:(k,fb)=>L(k)===k?fb:L(k),nameOf:x=>x.name,IMG:{shiba:b=>b+'.png'},img:(src,alt='')=>`<img src="${src}" alt="${alt}">`});
 for(const sh of shibas){const h=P.profile(sh.id).html;
 const order=['book-ribbon','book-art','book-intro','data-fav="favSnack"','data-fav="favPlay"','book-friend-section','book-growth','book-care-out'].map(x=>h.indexOf(x));
 assert.ok(order.every((n,i)=>n>=0&&(!i||n>order[i-1])));
 assert.ok(h.includes(L('app.temp')));assert.equal(h.split(L('app.unset')).length-1,3);
 assert.match(h,/card-snack.png/);assert.match(h,/card-play.png/);
 assert.doesNotMatch(h,/book-fav-icon"><img|book-ribbon"><img|털색|새끼|fur color|puppy|undefined|null/);
 assert.match(h,new RegExp(`data-act="profile" data-id="${sh.friends[0]}"`));assert.match(h,/data-act="careOpen"/);
 }
}
assert.equal(CFG.profileBook.ribbon,null);assert.equal(CFG.profileBook.growthStages,null);
for(const p of Object.values(CFG.profiles))for(const k of ['favSnack','favPlay']){assert.equal(p[k].icon,null);assert.equal(p[k].line,null);}
assert.match(main,/profile:d=>\{ui.modals=\[\{kind:'book',id:\+d.id\}\];\}/);
console.log('shiba detail: order, temporary labels, null fallbacks, friend detail route, no cancelled features, empty image slots, ko/en passed');
