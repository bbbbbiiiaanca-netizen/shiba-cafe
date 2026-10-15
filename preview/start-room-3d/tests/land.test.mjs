// 땅 넓히기 최대 단계(미정 → 제한 없음, 숫자면 그 단계에서 막힘)
import assert from 'node:assert/strict';import * as S from '../sim.js';import {CFG} from '../config.js';
assert.equal(CFG.expansion.maxSteps,8);
const s=S.newState(0);s.coins=1e12;s.space.unlockedRows=7;assert.notEqual(S.spaceUnlockCheck(s,'row',null,'coins'),'max');
s.space.unlockedRows=8;assert.equal(S.spaceUnlockCheck(s,'row',null,'coins'),'max');assert.equal(S.unlockSpace(s,'row',null,'coins',0),false);
console.log('land ok');
// 시작 직후 카페 시바 수 ≤ 배치 상한 (S.slotsOf: config cafe.maxPlaced·레벨 표)
{const s=S.newState(0);S.chooseStart(s,'red','',()=>.99,0);for(const breed of ['white','kuro']){const sh=S.makeShiba(s,{breed,level:1,now:0});s.shibas.push(sh);S.setPlaced(s,sh.id,true);}
 assert.ok(s.shibas.filter(o=>o.placed).length<=S.slotsOf(s));assert.equal(s.shibas.filter(o=>o.placed).length,Math.min(3,S.slotsOf(s)));console.log('start cap ok');}
