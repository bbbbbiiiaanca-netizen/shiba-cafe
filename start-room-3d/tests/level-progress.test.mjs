import assert from 'node:assert/strict';
import {makeT} from '../i18n.js';
import {levelProgressText} from '../level-progress.js';
for(const lang of ['ko','en']){
 const L=makeT(()=>lang);
 assert.equal(levelProgressText(1,0,7187,50,L),'Lv 1 · 0% (0 / 7,187)');
 assert.equal(levelProgressText(2,1234,12345,50,L),'Lv 2 · 9% (1,234 / 12,345)');
 assert.match(levelProgressText(50,0,null,50,L),/100%/);
 assert.ok(!levelProgressText(2,0,null,50,L).includes('null'));
}
console.log('level progress formatting: ko/en, separators, percent, max and unset passed');
