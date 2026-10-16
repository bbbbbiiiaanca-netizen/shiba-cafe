import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {CFG} from '../config.js';
import {addOrderBubble,ageOrderBubbles,drawOrderBubble} from '../order-bubble.js';
const p=CFG.village.places.find(p=>p.id==='walk');
assert.ok(existsSync(new URL('../'+p.art.src,import.meta.url)));
assert.equal(CFG.feedback.orderBubbleSec,1.5);
const w={},event={id:4,cell:[2,3],orderImg:'menu.png'};
addOrderBubble(w,event,1.5);event.cell[0]=9;
assert.deepEqual(w.orderBubbles[0].cell,[2,3]);
addOrderBubble(w,{...event,id:5},1.5);assert.equal(w.orderBubbles.length,2);
ageOrderBubbles(w,1.49);assert.equal(w.orderBubbles.length,2);
ageOrderBubbles(w,.01);assert.equal(w.orderBubbles.length,0);
let images=0,rounded=0;
const ctx=new Proxy({},{get:(_,k)=>()=>{if(k==='drawImage')images++;if(k==='roundRect')rounded++;},set:()=>true});
const draws=[];const ctx2=new Proxy({},{get:(_,k)=>(...a)=>{if(k==='drawImage')draws.push(a);if(k==='roundRect')rounded++;},set:()=>true});
const BA=CFG.feedback.orderBubbleArt;assert.equal(BA.file,'assets/drive/request-bubble-empty_512.png');
drawOrderBubble(ctx2,{complete:true,naturalWidth:64,naturalHeight:32},{x:100,y:100},{complete:true,naturalWidth:512,naturalHeight:512},BA);
assert.equal(draws.length,2);assert.equal(rounded,0,'도형 테두리 없음');
{const k=BA.drawHeight/BA.opaqueHeight,[b,ic]=draws;assert.ok(Math.abs(b[1]+BA.tip[0]*k-100)<1e-9&&Math.abs(b[2]+BA.tip[1]*k-100)<1e-9,'꼬리 끝이 머리 위치');
 assert.ok(Math.abs(ic[1]+ic[3]/2-(b[1]+BA.center[0]*k))<1e-9&&Math.abs(ic[2]+ic[4]/2-(b[2]+BA.center[1]*k))<1e-9,'아이콘 가운데');assert.equal(ic[3],BA.iconSize);}
{draws.length=0;drawOrderBubble(ctx2,{complete:true,naturalWidth:64,naturalHeight:32},{x:0,y:0},{complete:false},BA);assert.equal(draws.length,0,'그림 없으면 안 그림');}
const main=readFileSync(new URL('../main.js',import.meta.url),'utf8');
assert.ok(!main.slice(main.indexOf('P.shibas='),main.indexOf('// Tiny status')).includes('data-open="walk"'));
assert.ok(!main.includes("toast(L('toast.order'"));
console.log('walk/order unit tests passed');
