import assert from 'node:assert/strict';import fs from 'node:fs';import {CFG} from '../config.js';import {cleanEdges} from '../coin-clean.js';
// §17-13: 요리 3가지는 처음부터 모두 열림
assert.deepEqual(CFG.cooking.recipes.map(r=>[r.name,r.unlockLevel]),[['시바 죽',1],['고구마 간식',1],['닭가슴살 큐브',1]]);
// 코인 가장자리: 반투명 가장자리는 안쪽 색, 옅은 픽셀은 깎음, 안쪽은 그대로
{const w=5,h=5,d=new Uint8ClampedArray(w*h*4);for(let i=0;i<w*h;i++){d.set([200,150,20,255],i*4);}
 d.set([230,80,200,150],0);d.set([230,80,200,40],4);const mid=Array.from(d.slice(12*4,12*4+4));cleanEdges(d,w,h);
 assert.equal(d[7],0);assert.ok(Math.abs(d[0]-200)<2&&Math.abs(d[2]-20)<2);assert.deepEqual(Array.from(d.slice(48,52)),mid);}
assert.ok(fs.readFileSync(new URL('../main.js',import.meta.url),'utf8').includes('installCoinClean'));
assert.ok(CFG.cooking.lockedPreview.length>=1&&CFG.cooking.lockedPreview.length<=2&&CFG.cooking.lockedPreview.every(x=>x.unlockLevel===null||Number.isFinite(x.unlockLevel)));
console.log('cook3 ok');
