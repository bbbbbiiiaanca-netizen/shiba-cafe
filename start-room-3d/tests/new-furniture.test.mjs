import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {CFG} from '../config.js';
import {NEW_FURNITURE} from '../furniture-data.js';
import {SPRITES,availableDirs,spriteFor,spriteMirrored,rotateDir} from '../map-data.js';
import {sakuraSetActive} from '../decor.js';
import * as S from '../sim.js';
import {STR} from '../i18n.js';
assert.equal(NEW_FURNITURE.length,19);
assert.equal(NEW_FURNITURE.filter(it=>it.theme==='sakura').length,8);
const state=S.newState(0);state.coins=1e9;

for(const it of NEW_FURNITURE){
 const cfg=CFG.furniture.items.find(x=>x.id===it.id),sp=SPRITES[it.id];
 assert.ok(['furniture','light','garden','sign'].includes(cfg.category));assert.equal(cfg.price,null);assert.equal(S.buyFurniture(state,it.id),false);
 assert.equal(STR.ko['furn.'+it.id],it.name);assert.equal(STR.en['furn.'+it.id],it.en);
 assert.ok(existsSync(sp.file));assert.equal(sp.scale,1);assert.equal(sp.footprint.cells,1);
 assert.equal(availableDirs(it.id).length,sp.back?4:2);
 for(const d of availableDirs(it.id)){assert.ok(spriteFor(it.id,d));assert.equal(spriteMirrored(it.id,d,spriteFor(it.id,d)),Boolean(d%2));}
 const missing={[it.id]:{...sp,back:null}};assert.deepEqual(availableDirs(it.id,missing),[0,1]);assert.equal(rotateDir(it.id,1,missing),0);
}
assert.deepEqual(availableDirs('rock'),[0,1]);
const ids=NEW_FURNITURE.filter(it=>it.theme==='sakura').slice(0,3).map(it=>({type:it.id}));
assert.equal(sakuraSetActive(ids.slice(0,2),'A'),false);assert.equal(sakuraSetActive(ids,'A'),true);assert.equal(sakuraSetActive([...ids.slice(0,2),{...ids[2],zone:'B'}],'A'),false);assert.equal(sakuraSetActive(ids,'B'),false);assert.equal(CFG.decor.sakuraSet.bonus,null);
console.log("new furniture: 19 item cases + set thresholds passed (optional sakura backs follow supplied assets)");
