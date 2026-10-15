// 땅 넓히기 최대 단계(미정 → 제한 없음, 숫자면 그 단계에서 막힘)
import assert from 'node:assert/strict';import * as S from '../sim.js';import {CFG} from '../config.js';
assert.equal(CFG.expansion.maxSteps,null);
const s=S.newState(0);s.coins=1e12;s.space.unlockedRows=3;assert.notEqual(S.spaceUnlockCheck(s,'row',null,'coins'),'max');
CFG.expansion.maxSteps=3;assert.equal(S.spaceUnlockCheck(s,'row',null,'coins'),'max');assert.equal(S.unlockSpace(s,'row',null,'coins',0),false);CFG.expansion.maxSteps=null;
console.log('land ok');
