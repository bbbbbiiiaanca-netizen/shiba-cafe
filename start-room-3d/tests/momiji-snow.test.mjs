import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {CFG} from '../config.js';
import {NEW_FURNITURE,ROOM_LAYERS} from '../furniture-data.js';
import {STR} from '../i18n.js';
import {themeSetActive,drawThemeSet,decorBonus} from '../decor.js';
import {availableDirs,restoreSpace} from '../map-data.js';
import * as S from '../sim.js';
for(const theme of ['momiji','snow']){
 const items=NEW_FURNITURE.filter(it=>it.theme===theme);assert.equal(items.length,8);
 assert.deepEqual(CFG.decor[theme+'Set'],{minItems:3,bonusMinItems:null,bonus:null});
 for(const it of items){assert.deepEqual(availableDirs(it.id),[0,1]);assert.ok(existsSync('assets/drive/furniture-v4/@2x/'+it.filename));assert.equal(it.category,NEW_FURNITURE.find(b=>b.id===it.id.replace(theme,'sakura')).category);}
 const slots=items.slice(0,3).map(it=>({type:it.id}));
 assert.equal(themeSetActive(slots.slice(0,2),'A',theme),false);assert.equal(themeSetActive(slots,'A',theme),true);
 assert.equal(themeSetActive([...slots.slice(0,2),{...slots[2],zone:'B'}],'A',theme),false);
 assert.equal(themeSetActive(slots.map(it=>({...it,zone:'B'})),'B',theme),true);
 assert.equal(drawThemeSet({}, {slots,zone:{id:'A'}},theme),true); // no drawing calls without particle art
 assert.deepEqual(decorBonus(slots),{demand:.06,stay:.03});assert.deepEqual(decorBonus(Array(20).fill(slots[0])),CFG.decor.effect.cap);
}
const s=S.newState(0);s.coins=1e9;
for(const it of ROOM_LAYERS){
 assert.equal(STR.ko['furn.'+it.id],it.name);assert.equal(STR.en['furn.'+it.id],it.en);
 assert.equal(S.buyFurniture(s,it.id),false);assert.equal(S.selectRoomLayer(s,it.id),false);
 s.furnitureInv[it.id]=1;
 assert.equal(S.placeFurniture(s,it.id,[0,0]),!!it.art);
 if(it.art){assert.ok(existsSync(it.art));assert.ok(existsSync(it.art.replace(/\/([^/]+)$/,'/@2x/$1')));assert.equal(restoreSpace(s.space).roomLayers[it.layer],it.id);}
}
assert.equal(ROOM_LAYERS.find(it=>it.id==='floor-snow').art,null);
assert.deepEqual(restoreSpace({roomLayers:{floor:'floor-snow',wall:'bogus'}}).roomLayers,{floor:null,wall:null});
assert.equal(NEW_FURNITURE.find(it=>it.id==='low-table-momiji').filename,'furn-low-table-cushion-momiji-v5.png');
assert.equal(NEW_FURNITURE.find(it=>it.id==='low-table-snow').filename,'furn-low-table-cushion-snow-v4.png');
console.log('momiji/snow: assets, sets, shared caps, layer ownership/restore and TBD passed');
