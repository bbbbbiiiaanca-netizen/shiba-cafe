import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {setLabelPlacement,SET_THEMES} from '../decor.js';
// 똑또기 10-17: 세트 라벨은 방·가구 그림 위 빈 곳 → 모자라면 방 아래 → 둘 다 안 되면 위쪽 clamp. 네 세트 같은 함수.
const room={x:10,y:120,w:340,h:200},shelf={x:150,y:90,w:60,h:80},labelH=30,gap=6;
const hit=(a,b)=>a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h;
// 위에 자리가 있으면 위: 키 큰 선반(맨 위 y=90) 기준으로 그 위에 둔다.
let r=setLabelPlacement({rects:[room,shelf],labelH,minY:20,maxY:500,gap});
assert.deepEqual(r,{pos:'top',y:90-gap-labelH});
for(const o of [room,shelf])assert.ok(!hit({x:0,y:r.y,w:360,h:labelH},o));
assert.ok(r.y>=20);
// 위가 HUD에 막히면 방 바닥판 아래(하단 패널 위).
r=setLabelPlacement({rects:[room,shelf],labelH,minY:80,maxY:500,gap});
assert.deepEqual(r,{pos:'bottom',y:320+gap});
for(const o of [room,shelf])assert.ok(!hit({x:0,y:r.y,w:360,h:labelH},o));
// 가구가 방 아래로 삐져나오면 그 아래.
r=setLabelPlacement({rects:[room,{x:40,y:300,w:40,h:40}],labelH,minY:200,maxY:500,gap});
assert.deepEqual(r,{pos:'bottom',y:340+gap});
// 둘 다 안 되면 위쪽 clamp.
r=setLabelPlacement({rects:[room,shelf],labelH,minY:80,maxY:340,gap});
assert.deepEqual(r,{pos:'top',y:80});
// 아래 끝에 딱 맞으면 아래.
assert.equal(setLabelPlacement({rects:[room],labelH,minY:200,maxY:320+gap+labelH,gap}).pos,'bottom');
// 위 한계에 딱 맞으면 위.
assert.deepEqual(setLabelPlacement({rects:[room],labelH,minY:120-gap-labelH,maxY:330,gap}),{pos:'top',y:120-gap-labelH});
// 그림이 아직 없거나 크기 0인 사각형은 무시.
assert.deepEqual(setLabelPlacement({rects:[null,{x:0,y:0,w:0,h:0}],labelH,minY:50,maxY:300}),{pos:'top',y:50});
assert.deepEqual(setLabelPlacement({rects:[null,room],labelH,minY:200,maxY:500,gap}),{pos:'bottom',y:326});
// 네 세트가 한 자리 규칙(같은 라벨 생성 경로·같은 함수)을 쓴다; CSS top:120px 고정 없음.
assert.deepEqual(SET_THEMES,['sakura','momiji','snow','water']);
const iso=readFileSync(new URL('../isomap.js',import.meta.url),'utf8'),html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(iso,/for\(const theme of SET_THEMES\)\{[^]*?'sakura-set-label '\+theme\+'-set-label'[^]*?placeSetLabel\(label,\[roomRect,\.\.\.hits/);
assert.match(iso,/label\.dataset\.setLabelPos=pos/);
assert.match(iso,/setLabelPlacement\(\{rects,labelH:label\.offsetHeight,minY,maxY\}\)/);
const css=html.match(/\.sakura-set-label\{[^}]*\}/)[0];assert.doesNotMatch(css,/top:120px/);
console.log('set label placement tests passed');
