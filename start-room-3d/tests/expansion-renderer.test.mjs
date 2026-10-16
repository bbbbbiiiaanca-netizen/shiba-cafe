import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
if(!globalThis.crypto)Object.defineProperty(globalThis,'crypto',{value:webcrypto});
import {readFileSync} from 'node:fs';
import {createIsoMap} from '../isomap.js';
import {floatOrigin,FLOAT_LAYOUT,FLOAT_ICONS,cellToScreen} from '../map-data.js';
import {newState} from '../sim.js';
const draws=[],loads=[],strokes=[],events={};
const ctx={fill(){},translate(){},scale(){},setTransform(){},fillRect(){},drawImage(im,...args){draws.push({file:im.file,args});},save(){},restore(){},beginPath(){this.path=[];},moveTo(x,y){this.path.push([x,y]);},lineTo(x,y){this.path.push([x,y]);},closePath(){},stroke(){strokes.push({colour:this.strokeStyle,path:this.path});},createRadialGradient(){return {addColorStop(){}};},getImageData(x,y,w,h){return {width:w,height:h,data:new Uint8ClampedArray(w*h*4).fill(255)};}};
const button={disabled:false};
globalThis.location={search:''};globalThis.devicePixelRatio=1;
globalThis.ResizeObserver=class{observe(){}};
globalThis.Image=class{set src(path){const hd=path.includes('/@2x/'),k=hd?2:1;path=path.replace('/@2x/','/');loads.push(path);this.file=path;const png=readFileSync(new URL('../'+(hd?path.replace(/\/([^/]+)$/,'/@2x/$1'):path),import.meta.url));this.naturalWidth=png.readUInt32BE(16)/k;this.naturalHeight=png.readUInt32BE(20)/k;this.complete=true;}};// @2x는 화면에서 절반 크기(hd-assets.js)
globalThis.document={createElement(type){return type==='canvas'?{getContext:()=>ctx}:{classList:{names:new Set(),toggle(name,on){on?this.names.add(name):this.names.delete(name);},contains(name){return this.names.has(name);}},style:{setProperty(){}},buttons:new Map(),setAttribute(){},querySelector(selector){if(!this.buttons.has(selector))this.buttons.set(selector,{...button,hasAttribute:a=>selector==='['+a+']'});return this.buttons.get(selector);},querySelectorAll(){return [...this.buttons.values()];}};}};
const canvas={dataset:{},clientWidth:390,clientHeight:300,getContext:()=>ctx,addEventListener:(name,fn)=>events[name]=fn,getBoundingClientRect:()=>({left:0,top:0}),setPointerCapture(){}};
let opens=0;
const iso=createIsoMap(canvas,{onExpand:()=>opens++});
const state=newState(0);iso.draw(state,{});iso.scrollTo(iso.maxScroll);
assert.ok(!loads.some(p=>p.includes('tile-floor-locked')));
assert.equal(strokes.length,0,'normal view has no drawn strip outlines');
assert.ok(iso.markers.some(m=>m.kind==='floor2'));
const marker=iso.markers.find(m=>m.kind==='row');
const pointer=(x,y)=>({button:0,pointerId:1,clientX:x,clientY:y});
events.pointerdown(pointer(marker.buttonX,marker.buttonY));events.pointerup(pointer(marker.buttonX,marker.buttonY));
assert.equal(opens,1,'plus tap invokes expansion callback');
events.pointerdown(pointer(marker.buttonX,marker.buttonY));events.pointermove(pointer(marker.buttonX,marker.buttonY-30));events.pointerup(pointer(marker.buttonX,marker.buttonY-30));
assert.equal(opens,1,'scroll gesture does not activate plus');
console.log('Expansion renderer: bitmap marker, no locked tile, stairs lock, plus tap and drag passed');

const grass=draws.filter(d=>d.file==='assets/drive/tile-grass-outside.png');
assert.ok(grass.length>36,'outside grid extends beyond room');
assert.ok(draws.findIndex(d=>d.file==='assets/drive/tile-grass-outside.png')<draws.findIndex(d=>d.file==='assets/drive/room-tatami-noline.png'),'grass before room');
assert.ok(grass.every(d=>Math.abs(d.args[2]/d.args[3]-2)<1e-9),'cell-exact 2:1 tile sizing');
const item={id:91,phase:'seated',cell:[1,3],order:{img:'M-01-iced-americano_512.png'},itemSlot:{tableId:'table',cell:[2,3],offset:[-18,-42]}};
iso.draw(state,{custs:[item],sh:{}});
const tableIndex=draws.findLastIndex(d=>d.file==='assets/drive/furn-tea-table-v4.png'),itemIndex=draws.findLastIndex(d=>d.file==='assets/drive/M-01-iced-americano_512.png');
assert.ok(itemIndex>tableIndex,'confirmed item bitmap after adjacent table');
assert.ok(draws[itemIndex].args[2]<draws[tableIndex].args[2],'item scaled at draw time');
console.log('Unit 5 renderer: outside grass before room, exact tile ratio, confirmed bitmap above table passed');

// Real renderer editing callbacks: approved bitmap wall selection, drag, rejection and removal.
let blocked='',changed=0;
const wallIso=createIsoMap(canvas,{onBlocked:message=>blocked=message,onChange:()=>changed++});
const wallState=newState(0);wallIso.draw(wallState,{});wallIso.setEdit(true);
assert.equal(wallIso.placeWall([2,2]),true);
const wallId=wallIso.selected;
assert.ok(wallIso.hits.find(h=>h.id===wallId)&&!wallIso.hits.find(h=>h.id===wallId).footprint);assert.ok(draws.some(d=>d.file.endsWith('wall-inner.png')));
{const h=wallIso.hits.find(h=>h.id===wallId),p=cellToScreen(2,2,h.view,h.zone);assert.ok(Math.abs(h.x+50.5*(64/89)*h.view.scale-(p.x+h.zone.cell.w*h.view.scale/4))<1e-9);assert.ok(Math.abs(h.y+162.5*(64/89)*h.view.scale-(p.y-h.zone.cell.h*h.view.scale/4))<1e-9);}
assert.ok(!loads.includes(null));
wallIso.actions.querySelector('[data-furniture-rotate]').onclick();
assert.equal(wallState.placement.slots.find(s=>s.id===wallId).dir,1);assert.ok(draws.some(d=>d.file.endsWith('wall-inner-flip.png')));
const center=()=>{const h=wallIso.hits.find(h=>h.id===wallId);return {h,x:h.x+h.w/2,y:h.y+h.h/2};};
let p=center();events.pointerdown(pointer(p.x,p.y));
const delta=[p.h.zone.cell.w*p.h.view.scale/2,p.h.zone.cell.h*p.h.view.scale/2];
events.pointermove(pointer(p.x+delta[0],p.y+delta[1]));events.pointerup(pointer(p.x+delta[0],p.y+delta[1]));
assert.deepEqual(wallState.placement.slots.find(s=>s.id===wallId).origin,[3,2]);
const snapshot=JSON.stringify(wallState.placement);
assert.equal(wallIso.placeWall([0,5]),false);assert.equal(blocked,'입구가 막혔어요!');
assert.equal(JSON.stringify(wallState.placement),snapshot);
// Drag the existing wall onto the entrance; the original cell must survive.
p=center();events.pointerdown(pointer(p.x,p.y));
const dx=-3,dy=3,scale=p.h.view.scale;
const end=pointer(p.x+(dx-dy)*64*scale,p.y+(dx+dy)*32*scale);
events.pointermove(end);events.pointerup(end);
assert.equal(JSON.stringify(wallState.placement),snapshot);
// 17-12: 가벽 제거는 둥근 보관 버튼으로 한다(가구 보관함에는 들어가지 않음).
assert.equal(wallIso.selected,wallId);const wallInv=JSON.stringify(wallState.furnitureInv||{});
wallIso.actions.querySelector('[data-furniture-store]').onclick();
assert.ok(!wallState.placement.slots.some(s=>s.type==='wall'));assert.equal(JSON.stringify(wallState.furnitureInv||{}),wallInv);assert.equal(wallIso.selected,null);assert.ok(changed>=4);
console.log('§17 renderer: approved wall images, alpha selection, move/rotate/remove and blocked rollback passed');

// Both axes use approved floor art, full edit grid and clamped drag pan.
const expandIso=createIsoMap(canvas);
state.space.unlockedRows=3;draws.length=0;expandIso.setEdit(true);expandIso.draw(state,{});
assert.equal(expandIso.gridCells,7*8);
assert.equal(draws.filter(d=>d.file==='assets/drive/tiles/floor-tatami-v3.png').length,7*8-36);assert.equal(draws.filter(d=>/wall-ext-(left|right)\.png$/.test(d.file)).length,(7-6)+(8-6));
assert.ok(!expandIso.markers.some(m=>m.kind==='row'),'edit mode hides + marker');expandIso.setEdit(false);expandIso.draw(state,{});assert.equal(expandIso.markers.find(m=>m.kind==='row').axis,'i');expandIso.setEdit(true);expandIso.draw(state,{});
expandIso.panTo(Infinity,Infinity);assert.equal(expandIso.panX,expandIso.panBounds.maxX);assert.equal(expandIso.scroll,expandIso.maxScroll);
expandIso.panTo(-Infinity,-Infinity);assert.equal(expandIso.panX,expandIso.panBounds.minX);assert.equal(expandIso.scroll,0);
expandIso.setEdit(false);expandIso.panTo(0,0);
events.pointerdown(pointer(200,150));events.pointermove(pointer(100,100));events.pointerup(pointer(100,100));
assert.ok(expandIso.panX>0);assert.ok(expandIso.scroll>0);
console.log('§12 renderer: new floor bitmap count, full grid, alternating marker, clamped two-axis drag passed');

// Verify the actual bitmap draw origin in the furniture view after expansion, pan and scroll.
expandIso.panTo(expandIso.panBounds.maxX,expandIso.maxScroll);
for(const kind of ['coin','heart','angry']){
 const f={kind,cell:[3,3],age:0,dur:1,dx:0};draws.length=0;
 expandIso.draw(state,{floats:[f]});
 const view=expandIso.hits.find(h=>h.id==='table').view,zone=expandIso.hits.find(h=>h.id==='table').zone;
 const foot=cellToScreen(...f.cell,view,zone),origin=floatOrigin(f,view,zone);
 assert.deepEqual(origin,{x:foot.x+FLOAT_LAYOUT.headOffset[0]*view.scale,y:foot.y+FLOAT_LAYOUT.headOffset[1]*view.scale});
 const draw=draws.find(d=>d.file===FLOAT_ICONS[kind]),size=FLOAT_LAYOUT.iconPx[kind];
 assert.deepEqual(draw.args,[origin.x-size/2,origin.y-size,size,size]);
}
// Fractional pan bounds must be reached by overshooting with real pointer input.
expandIso.panTo(expandIso.panBounds.minX,0);
const distance=expandIso.panBounds.maxX-expandIso.panBounds.minX;
events.pointerdown(pointer(200,150));
events.pointermove(pointer(200-Math.ceil(distance)-canvas.clientWidth,150-Math.ceil(expandIso.maxScroll)-canvas.clientHeight));
events.pointerup(pointer(200-Math.ceil(distance)-canvas.clientWidth,150-Math.ceil(expandIso.maxScroll)-canvas.clientHeight));
assert.equal(expandIso.panX,expandIso.panBounds.maxX);assert.equal(expandIso.scroll,expandIso.maxScroll);
console.log('Review fixes: floats use guest cell + head offset in furniture camera view; pointer drag reaches both bounds');

// Returning by pointer drag reaches the opposite camera bounds too.
events.pointerdown(pointer(200,150));
const reverse=pointer(200+Math.ceil(distance)+canvas.clientWidth,150+Math.ceil(expandIso.maxScroll)+canvas.clientHeight);
events.pointermove(reverse);events.pointerup(reverse);
assert.equal(expandIso.panX,expandIso.panBounds.minX);assert.equal(expandIso.scroll,0);

// u18 actual render calls: approved edges under furniture; manager occluded by the same depth ordering.
state.space.unlockedRows=3;draws.length=0;
iso.draw(state,{manager:{role:'manager',cell:[2,2],phase:'walking',facing:2,anim:0}});
const edgeDraws=draws.filter(d=>d.file.includes('/plate-edge-'));
assert.ok(edgeDraws.some(d=>d.file.endsWith('left.png'))&&edgeDraws.some(d=>d.file.endsWith('right.png'))&&edgeDraws.some(d=>d.file.endsWith('corner.png')));
assert.ok(draws.findLastIndex(d=>d.file.includes('/plate-edge-'))<draws.findIndex(d=>d.file.includes('/furn-')));
const managerIndex=draws.findIndex(d=>d.file.includes('manager-walk-back-ul-1.png'));
assert.ok(managerIndex>=0&&managerIndex<draws.findIndex(d=>d.file.includes('furn-tea-table')));
assert.equal(draws.some(d=>d.file.includes('manager-sheet')),false);
draws.length=0;iso.draw(state,{});assert.equal(draws.some(d=>d.file.includes('/chars/manager/')),false);
console.log('u18 approved plate edges and manager render/occlusion passed');

// Merged room image has cropped front rims; approved walls extend only on rear edges.
for(const n of [1,2,3]){
 const merged=newState(0);merged.space.unlockedRows=n;draws.length=0;iso.draw(merged,{});
 assert.ok(draws.some(d=>d.file.endsWith(n===1?'room-merged-j.png':'room-merged-ij.png')));
 assert.ok(!draws.some(d=>d.file.endsWith('room-tatami-noline.png')));
 assert.equal(draws.filter(d=>/wall-ext-(left|right)\.png$/.test(d.file)).length,n);
 assert.ok(draws.every(d=>d.args.every(Number.isFinite)),'wall flip scaling and all draw coordinates finite');
 const walls=draws.map((d,i)=>/wall-ext-/.test(d.file)?i:-1).filter(i=>i>=0);
 assert.ok(Math.max(...walls)<draws.findIndex(d=>d.file.includes('/furn-')));
}
console.log('Task B: cropped room rims, both approved rear wall axes, finite scale and furniture layering passed');
const qstate=newState(0);qstate.placement.slots=[{id:'q17-counter',type:'counter',origin:[2,2],dir:0}];
const qiso=createIsoMap(canvas);qiso.draw(qstate,{});qiso.setEdit(true);
const qhit=qiso.hits[0],qp={x:qhit.x+qhit.w/2,y:qhit.y+qhit.h/2};
events.pointerdown(pointer(qp.x,qp.y));events.pointerup(pointer(qp.x,qp.y));
assert.equal(qiso.selected,'q17-counter');assert.equal(canvas.dataset.placementValid,'true');
qiso.actions.querySelector('[data-furniture-rotate]').onclick();assert.equal(qstate.placement.slots[0].dir,1);
qiso.actions.querySelector('[data-furniture-cancel]').onclick();assert.equal(qstate.placement.slots[0].dir,0);assert.equal(qiso.selected,null);
// 17-12: 돌리기·뒤집기는 따로 있는 둥근 버튼, 확인은 바뀐 방향을 두고 선택만 푼다.
events.pointerdown(pointer(qp.x,qp.y));events.pointerup(pointer(qp.x,qp.y));assert.equal(qiso.selected,'q17-counter');
assert.ok(qiso.actions.classList.contains('has-selection'));for(const a of ['cancel','store','rotate','flip','done'])assert.equal(qiso.actions.querySelector(`[data-furniture-${a}]`).disabled,false,a);
qiso.actions.querySelector('[data-furniture-flip]').onclick();assert.equal(qstate.placement.slots[0].dir,1);
qiso.actions.querySelector('[data-furniture-rotate]').onclick();assert.equal(qstate.placement.slots[0].dir,0);
qiso.actions.querySelector('[data-furniture-flip]').onclick();qiso.actions.querySelector('[data-furniture-done]').onclick();assert.equal(qiso.selected,null);assert.equal(qstate.placement.slots[0].dir,1);
assert.ok(!qiso.actions.classList.contains('has-selection'));assert.equal(qiso.actions.querySelector('[data-furniture-rotate]').disabled,true);assert.equal(qiso.actions.querySelector('[data-furniture-save]').disabled,false);
qstate.placement.slots[0].dir=0;qiso.draw(qstate,{});
events.pointerdown(pointer(qp.x,qp.y));events.pointermove(pointer(qp.x-300,qp.y-300));assert.equal(canvas.dataset.placementValid,'false');events.pointerup(pointer(qp.x-300,qp.y-300));
assert.deepEqual(qstate.placement.slots[0].origin,[2,2]);
const invBefore=qstate.furnitureInv.counter||0;qiso.actions.querySelector('[data-furniture-store]').onclick();assert.equal(qstate.placement.slots.length,0);assert.equal(qstate.furnitureInv.counter,invBefore+1);
qiso.actions.querySelector('[data-furniture-save]').onclick();assert.equal(qiso.edit,false);assert.equal(qiso.gridCells,0);
console.log('q17 edit: validity tint, cancel rollback, generic storage and save/grid passed');
