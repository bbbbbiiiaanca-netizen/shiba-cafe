import assert from 'node:assert/strict';
import {CFG} from '../config.js';
import {NEW_FURNITURE} from '../furniture-data.js';
import {FURN_BACKS} from '../furniture-art.generated.js';
import {SPRITES,availableDirs,rotateDir,flipDir,newFurnitureBack,defaultPlacement,restorePlacement} from '../map-data.js';

// 2026-10-17: 뒷모습은 CFG.decor.backArt.enabled에 있는 가구만. 지금은 좌식 테이블 일반·벚꽃.
const MS=['momiji','snow'].flatMap(th=>['shelf','low-table','stone-lantern','chochin','bonsai','bamboo-fence','noren','sign'].map(b=>b+'-'+th));
assert.deepEqual(CFG.decor.backArt.enabled,['low-table','low-table-sakura',...MS]);
for(const it of NEW_FURNITURE){
 const on=CFG.decor.backArt.enabled.includes(it.id)&&Boolean(FURN_BACKS[it.id]);
 assert.deepEqual(availableDirs(it.id),on?[0,1,2,3]:[0,1],it.id);
 assert.equal(SPRITES[it.id].back?.file??null,on?FURN_BACKS[it.id]:null,it.id);
}
for(const id of ['low-table','low-table-sakura']){assert.ok(FURN_BACKS[id],id);assert.deepEqual([0,1,2,3].map(d=>rotateDir(id,d)),[1,2,3,0]);}
// 뒷모습 그림이 있어도 꺼져 있으면 돌리기는 0↔1만, 뒤집기도 0↔1.
for(const id of ['shelf','bonsai','moon-lamp','shelf-sakura']){assert.deepEqual([0,1].map(d=>rotateDir(id,d)),[1,0],id);assert.deepEqual([0,1].map(flipDir),[1,0]);}
assert.ok(FURN_BACKS.shelf&&!SPRITES.shelf.back);
// 기존 가구(카운터·방석·계단·찻상·칸막이)는 그대로 4방향.
for(const t of ['counter','cushion','stairs','table','wall'])assert.deepEqual(availableDirs(t),[0,1,2,3],t);

// 함수 단위: 가짜 데이터로 enabled에 id를 더하면 4방향.
{const it={id:'fake',filename:'furn-shelf-v4.png',backname:null},backs={fake:'fake-back.png'};
 assert.equal(newFurnitureBack(it,backs,[]),null);assert.equal(newFurnitureBack(it,{},['fake']),null);
 const back=newFurnitureBack(it,backs,['fake']);assert.equal(back.file,'fake-back.png');assert.equal(back.scale,1);
 const sprites={fake:{file:'x.png',back}};assert.deepEqual(availableDirs('fake',sprites),[0,1,2,3]);assert.equal(rotateDir('fake',1,sprites),2);
 assert.deepEqual(availableDirs('fake',{fake:{file:'x.png',back:newFurnitureBack(it,backs,[])}}),[0,1]);
 const real=NEW_FURNITURE.find(x=>x.id==='shelf');assert.equal(newFurnitureBack(real,FURN_BACKS,['shelf']).file,FURN_BACKS.shelf);}

// 저장 불러오기: 지금 2방향뿐인 가구의 dir 2·3 → dir%2(초기화하지 않음). 4방향 가구는 그대로.
{const base=defaultPlacement().slots,extra=[{id:'f1',type:'shelf',origin:[5,5],dir:2},{id:'f2',type:'moon-lamp',origin:[2,5],dir:3},{id:'f3',type:'low-table',origin:[5,3],dir:3}];
 const r=restorePlacement(JSON.parse(JSON.stringify({v:1,slots:[...base,...extra]})));
 assert.notDeepEqual(r,defaultPlacement());
 assert.deepEqual(r.slots.slice(base.length).map(s=>[s.id,s.dir]),[['f1',0],['f2',1],['f3',3]]);
 assert.deepEqual(r.slots.slice(base.length).map(s=>s.origin),extra.map(s=>s.origin));
 // 앞모습 저장은 바뀌지 않음, 잘못된 dir은 여전히 초기화.
 assert.equal(restorePlacement({v:1,slots:[...base,{id:'f1',type:'shelf',origin:[5,5],dir:1}]}).slots.at(-1).dir,1);
 assert.deepEqual(restorePlacement({v:1,slots:[...base,{id:'f1',type:'shelf',origin:[5,5],dir:4}]}),defaultPlacement());}
console.log('furniture rotate config: backArt.enabled gate, 2-dir rotate/flip, fake-data 4-dir, save dir%2 restore passed');

// 2026-10-17: 단풍·눈 16종 뒷모습 승인 → 4방향
for(const th of ['momiji','snow'])for(const b of ['shelf','low-table','stone-lantern','chochin','bonsai','bamboo-fence','noren','sign']){const id=b+'-'+th;assert.deepEqual(availableDirs(id),[0,1,2,3],id);}
