import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {CFG} from '../config.js';
import {NEW_FURNITURE,ROOM_LAYERS} from '../furniture-data.js';
import {FURN_ANCHORS} from '../furniture-anchors.js';
import {FURN_BACKS} from '../furniture-art.generated.js';
import {STR} from '../i18n.js';
import {SET_THEMES,themeSetActive,drawThemeSet,decorBonus} from '../decor.js';
import {SPRITES,availableDirs,restoreSpace} from '../map-data.js';
import * as S from '../sim.js';
// 물방울 정원(water): 단풍·눈과 같은 방식. 그림 수인님 10/17 00:36 승인. 뒷모습 없음 → 앞 2방향.
const items=NEW_FURNITURE.filter(it=>it.theme==='water');assert.equal(items.length,8);
assert.ok(SET_THEMES.includes('water'));
assert.deepEqual(CFG.decor.waterSet,{minItems:3,bonusMinItems:null,bonus:null});
assert.equal(STR.ko['furn.waterSet'],'물방울 정원 세트');assert.equal(STR.en['furn.waterSet'],'Water Garden Set');
for(const it of items){
 const cfg=CFG.furniture.items.find(x=>x.id===it.id);
 assert.equal(it.category,NEW_FURNITURE.find(b=>b.id===it.id.replace('water','sakura')).category,it.id);
 assert.equal(it.source,'furn-water');assert.equal(it.backname,null);assert.equal(it.price,null);assert.equal(cfg.price,null);
 assert.match(it.name,/^물방울 /);assert.match(it.en,/^Water Garden /);
 assert.equal(STR.ko['furn.'+it.id],it.name);assert.equal(STR.en['furn.'+it.id],it.en);
 assert.ok(existsSync('assets/drive/furniture-v4/'+it.filename));assert.ok(existsSync('assets/drive/furniture-v4/@2x/'+it.filename));
 assert.deepEqual(FURN_ANCHORS[it.filename],[90,202]);assert.deepEqual(SPRITES[it.id].anchor,[90,202]);
 assert.equal(SPRITES[it.id].footprint.cells,1);
 assert.ok(!CFG.decor.backArt.enabled.includes(it.id));assert.equal(FURN_BACKS[it.id],undefined);assert.deepEqual(availableDirs(it.id),[0,1]);
}
const slots=items.slice(0,3).map(it=>({type:it.id}));
assert.equal(themeSetActive(slots.slice(0,2),'A','water'),false);assert.equal(themeSetActive(slots,'A','water'),true);
assert.equal(themeSetActive([...slots.slice(0,2),{...slots[2],zone:'B'}],'A','water'),false);
assert.equal(themeSetActive(slots.map(it=>({...it,zone:'B'})),'B','water'),true);
assert.equal(drawThemeSet({}, {slots,zone:{id:'A'}},'water'),true); // no drawing calls without particle art
// 효과·상한은 벚꽃과 공유: 세트 보너스 없음, 섞어 놓아도 같은 상한.
assert.deepEqual(decorBonus(slots),{demand:.06,stay:.03});assert.deepEqual(decorBonus(Array(20).fill(slots[0])),CFG.decor.effect.cap);
const sakura=NEW_FURNITURE.filter(it=>it.theme==='sakura').slice(0,3).map(it=>({type:it.id}));
assert.deepEqual(decorBonus([...slots,...sakura]),decorBonus([...sakura,...sakura]));
const s=S.newState(0);s.coins=1e9;
for(const id of ['floor-water','wall-water']){
 const it=ROOM_LAYERS.find(x=>x.id===id);
 assert.equal(it.theme,'water');assert.equal(it.price,null);assert.equal(it.art,'assets/drive/furniture-v4/room-water-'+it.layer+'-v4.png');
 assert.ok(existsSync(it.art));assert.ok(existsSync(it.art.replace(/\/([^/]+)$/,'/@2x/$1')));
 assert.equal(STR.ko['furn.'+id],it.name);assert.equal(STR.en['furn.'+id],it.en);
 assert.equal(S.buyFurniture(s,id),false);assert.equal(S.selectRoomLayer(s,id),false);
 s.furnitureInv[id]=1;assert.equal(S.placeFurniture(s,id,[0,0]),true);assert.equal(restoreSpace(s.space).roomLayers[it.layer],id);
}
assert.deepEqual(restoreSpace({roomLayers:{floor:'floor-water',wall:'wall-water'}}).roomLayers,{floor:'floor-water',wall:'wall-water'});
console.log('water: 8 items + floor/wall assets, anchors, 2-dir, set label, shared caps, layer ownership/restore and TBD passed');
