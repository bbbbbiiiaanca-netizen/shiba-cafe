import {isDecor,decorEffectText} from '../decor.js';
import {FURN_CATEGORIES} from '../furniture-data.js';
// PR-C (2026-10-16) 360×640 small fixes: furniture card markup (shop interior + 가방 가구 상점), menu locked card, open('menu').
import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {runInNewContext} from 'node:vm';
import {CFG} from '../config.js';import * as Q from '../q1715.js';
const main=readFileSync(new URL('../main.js',import.meta.url),'utf8');

// card = image → name (one line) → buy button holding only coin icon + number; no 장식 점수 / 미정 / category label
const cardsOf=h=>[...h.matchAll(/<article class="q17-product" data-furn-card="([^"]+)">([^]*?)<\/article>/g)].map(m=>({id:m[1],body:m[2]}));
const checkCard=({id,body},p)=>{
 const img=body.indexOf('<img class="furn-img"'),name=body.indexOf('<strong class="furn-name">'),btn=body.indexOf('<button class="furn-buy"');
 const item=CFG.furniture.items.find(it=>it.id===id);
 if(item?.category==='floorwall'&&!item.art)assert.ok(img===-1&&name>=0&&name<btn,id+': pending art has name and price only');
 else assert.ok(img>=0&&img<name&&name<btn,id+': image, name, price in order');
 assert.equal(body.slice(btn).indexOf('</button>'),body.slice(btn).length-'</button>'.length,id+': price button is last');
 const label=body.slice(btn).replace(/<button[^>]*>/,'').replace('</button>','');
 assert.match(label,/^<img class="(ci|res-ico" data-res="coin)" src="assets\/drive\/ui\/res-coin\.png"[^>]*>/,id+': coin icon first');
 const text=label.replace(/<[^>]+>/g,'');
 if(Number.isFinite(p)){assert.equal(text.replace(/,/g,''),String(p));assert.doesNotMatch(body,/ disabled>/);}
 else{assert.equal(text,'');assert.match(body,/data-act="buyFurniture"[^>]* disabled>/);}
 assert.doesNotMatch(body,/미정|장식 점수/);
 if(isDecor(id))assert.ok(body.includes(decorEffectText()));
 else assert.doesNotMatch(body,/<small/);};

const interiorIds=CFG.furniture.items.filter(it=>CFG.shop.itemCategories[it.id]==='interior').map(it=>it.id);
for(const price of [()=>40000,()=>null,id=>id===interiorIds[0]?null:1500]){
 const h=Q.shopHtml(CFG,'interior',price),cards=cardsOf(h);
 assert.match(h,/<div class="furn-grid" data-furn-grid>/);assert.equal(cards.length,interiorIds.length);assert.deepEqual(cards.map(c=>c.id),interiorIds);
 cards.forEach(c=>checkCard(c,price(c.id)));
 assert.ok(h.indexOf('data-furn-grid')<h.indexOf('data-theme-logos'),'interior cards come before theme logos (first row fits at 360×640)');
 assert.doesNotMatch(h,/장식 점수|undefined|null/);}
// other tabs keep their existing cards
{const k=Q.shopHtml(CFG,'kitchen',()=>123);assert.doesNotMatch(k,/data-furn-grid/);assert.match(k,/class="q17-swipe"/);assert.match(k,/장식 점수/);assert.ok(k.indexOf('data-theme-logos')<k.indexOf('q17-swipe'));}

// 가방 가구 상점 (main.js furnitureShop) — production source run with stubs
{const src=main.slice(main.indexOf('function furnitureShop(){'),main.indexOf('\nconst grantName='));
 const fmt=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,','),ico=k=>`<img class="res-ico" data-res="${k}" src="assets/drive/ui/res-${k}.png" alt="" draggable="false">`;
 for(const priceOf of [id=>CFG.furniture.items.findIndex(it=>it.id===id)*1000+500,()=>null]){
  const shop=runInNewContext(src+';furnitureShop',{isDecor,decorEffectText,FURN_CATEGORIES,CFG,ui:{},s:{},S:{furniturePrice:(_,id)=>priceOf(id)},L:()=>'전체',LF:(k,fb)=>fb,ico,priceText:(p,u)=>p==null?'미정':ico(u)+fmt(p)})();
  const cards=cardsOf(shop);assert.match(shop,/<div class="furn-grid" data-furn-grid>/);assert.equal(cards.length,CFG.furniture.items.length);
  cards.forEach(c=>{if(Number.isFinite(priceOf(c.id)))checkCard(c,priceOf(c.id));else{assert.match(c.body,/disabled/);assert.match(c.body,/전체/);}});}}

// 메뉴 개발: 2-column vertical grid (no horizontal swipe); card = image · name · price button; locked = lock icon only in the image slot + 'LvN 해금' in the button slot, no buy button
{const line=main.split('\n').find(l=>l.includes("if(m.list==='menu')return"));const locked=line.match(/x\.locked\?`([^`]*)`/)[1],open=line.match(/`:`([^`]*)`\)\.join/)[1];
 assert.match(line,/<div class="menu-grid" data-list-popup="menu" data-menu-cards>/);assert.doesNotMatch(line,/swipe/);
 assert.match(locked,/class="lp-face menu-card-img menu-lock">\$\{img\('assets\/drive\/ui\/ui-lock\.png'\)\}<\/span><strong class="menu-name">\$\{x\.name\}<\/strong><strong class="lp-effect menu-unlock">\$\{x\.effect\}<\/strong><\/article>$/);
 assert.doesNotMatch(locked,/data-act=|x\.face/);
 assert.match(open,/<span class="lp-face menu-card-img">\$\{x\.face\?img\(x\.face\):''\}<\/span><strong class="menu-name">\$\{x\.name\}<\/strong><small class="lp-effect">\$\{x\.effect\}<\/small>\$\{btn\(x\)\}<\/article>$/);
 const css=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(css,/\.menu-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\);[^}]*overflow-y:auto/);assert.match(css,/\.menu-grid \.menu-card:not\(\.locked\) \.lp-effect\{display:none\}/);}

// open('menu'): no P.menu → opens the menu list modal instead of throwing in renderPanel
{const src=main.slice(main.indexOf('function open(name,arg=null){'),main.indexOf('\n',main.indexOf('ui.panel=name;')));
 const ui={panel:null,modals:[]},calls=[];
 const open=runInNewContext(src+';open',{ui,P:{cooking:()=>({})},LP:{menu:()=>({})},act:{listOpen:d=>{calls.push(d);ui.modals.unshift({kind:'list',list:d.list,arg:d.kind||null});}},refresh:()=>calls.push('refresh'),renderPanel:()=>{throw Error('renderPanel');},navState:()=>{}});
 open('menu');assert.deepEqual(ui.modals,[{kind:'list',list:'menu',arg:null}]);assert.equal(ui.panel,null);assert.equal(calls.at(-1),'refresh');
 open('nope');assert.equal(ui.modals.length,1);assert.equal(ui.panel,null);}
console.log('PR-C: furniture 2-col cards (shop interior + bag), menu 2-col grid + locked card, open(menu) fallback passed');
