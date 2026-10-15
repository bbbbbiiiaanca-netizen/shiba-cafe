// Writes i18n-en-todo.md: every STR.ko key whose English slot is empty (the screen falls back to Korean).
// Run from start-room-3d/: node tools/i18n-todo.mjs
import {writeFileSync} from 'node:fs';
import {STR} from '../i18n.js';

const keys=Object.keys(STR.ko).filter(k=>!(k in STR.en));
const cell=v=>String(v).replace(/\\/g,'\\\\').replace(/\|/g,'\\|').replace(/</g,'&lt;').replace(/\n/g,' ');
const out=[
 '# i18n: English to do',
 '',
 `영어 칸이 비어 한국어로 대체되는 키: **${keys.length}개** (전체 ${Object.keys(STR.ko).length}개 중 영어 확정 ${Object.keys(STR.ko).length-keys.length}개).`,
 '',
 '`node tools/i18n-todo.mjs` 로 다시 만든다. 번역은 i18n.js 의 STR.en 에 같은 키로 넣는다. {이름} 은 자리표시자라 그대로 둔다.',
 '',
 '| 키 | 한국어 |',
 '| --- | --- |',
 ...keys.map(k=>`| ${cell(k)} | ${cell(STR.ko[k])} |`),
 ''];
writeFileSync(new URL('../i18n-en-todo.md',import.meta.url),out.join('\n'));
console.log(`i18n-en-todo.md: ${keys.length} keys`);
