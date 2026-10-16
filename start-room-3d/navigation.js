// Whole-cell routes; cushions may be entered only as the route's seat target.
import {cellToScreen,MANAGER,MAP,zonesForSpace,footprintCells,TABLE_ITEM_LAYOUT,activeEdges,edgeSegments} from './map-data.js';
const key=c=>c.join(',');
export function layout(s,w){const zone=w.navigation?.zone||zonesForSpace(s.space)[0];return {zone,slots:w.navigation?.slots||s.placement.slots,edges:w.navigation?.edges||activeEdges(s.placement),entrance:w.navigation&&Object.hasOwn(w.navigation,'entrance')?w.navigation.entrance:zone.entrance};}
// 17-7 가벽: 선을 건너는 한 칸 이동(양쪽 방향)
const crossings=edges=>new Set(edges.flatMap(e=>edgeSegments(e).flatMap(([a,b])=>[key(a)+'|'+key(b),key(b)+'|'+key(a)])));
// 옆 칸(맨해튼 거리 1) 판정: 그 사이 선에 가벽이 있으면 이웃 아님. edges=[] → 예전 판정 그대로.
export function adjacent(a,b,edges=[]){if(!a||!b||Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])!==1)return false;return !edges.length||!crossings(edges).has(key(a)+'|'+key(b));}
const around=([i,j])=>[[i+1,j],[i-1,j],[i,j+1],[i,j-1]];
export function seatSlots(s,w){return layout(s,w).slots.filter(x=>['cushion','chair'].includes(x.type)).flatMap(x=>footprintCells(x).map(cell=>({id:x.id+':'+key(cell),furnitureId:x.id,cell})));}
export function pathfind(zone,slots,from,to,{seatTarget=false,edges=[]}={}){
 const inside=c=>Array.isArray(c)&&c.length===2&&c.every(Number.isInteger)&&c[0]>=0&&c[1]>=0&&c[0]<zone.cols&&c[1]<zone.rows;
 if(!inside(from)||!inside(to))return null;
 const blocked=new Set(slots.flatMap(x=>footprintCells(x).map(key)));
 if(seatTarget&&slots.some(x=>['cushion','chair'].includes(x.type)&&footprintCells(x).some(c=>key(c)===key(to))))blocked.delete(key(to));
 if(blocked.has(key(from))&&!slots.some(s=>['chair','cushion'].includes(s.type)&&footprintCells(s).some(c=>key(c)===key(from))))return null;
 if(blocked.has(key(to)))return null;
 const walls=crossings(edges),queue=[from],prev=new Map([[key(from),null]]);
 for(let n=0;n<queue.length;n++){const c=queue[n];if(key(c)===key(to)){const route=[];let p=c;while(prev.get(key(p))!==null){route.unshift(p);p=prev.get(key(p));}return route;}
 for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const p=[c[0]+di,c[1]+dj];if(inside(p)&&!blocked.has(key(p))&&!prev.has(key(p))&&!walls.has(key(c)+'|'+key(p))){prev.set(key(p),c);queue.push(p);}}}
 return null;
}
export function routeTo(s,w,char,target,seatTarget=false){const {zone,slots,edges}=layout(s,w);char.target=target&&[...target];char.seatTarget=seatTarget;char.route=pathfind(zone,slots,char.cell,target,{seatTarget,edges});char.moveAcc=0;}
export function moveCell(char,dt,seconds){if(char.noWalk){char.route=char.route&&[];char.moveAcc=0;return !!char.route;} // 걷기 프레임 없음 → 위치 이동 없이 그 자리에서 도착 처리
 if(!Number.isFinite(seconds)||seconds<=0||!char.route)return false;char.moveAcc=(char.moveAcc||0)+dt;while(char.moveAcc>=seconds&&char.route.length){char.moveAcc-=seconds;const next=char.route.shift();faceCell(char,next);char.cell=next;}return char.route.length===0;}
export function syncRoutes(s,w){const {zone,slots,edges,entrance}=layout(s,w),sig=JSON.stringify([zone.cols,zone.rows,slots,edges,entrance]);if(w.layoutSig===sig)return;w.layoutSig=sig;
 const seats=seatSlots(s,w);for(const c of w.custs){const seat=seats.find(x=>x.furnitureId===c.seatFurniture);if(c.phase==='seated'){if(seat){c.seat=seat.id;c.cell=[...seat.cell];if(c.order)linkTable(s,w,c);}continue;}if(c.phase==='entering'&&seat){c.seat=seat.id;routeTo(s,w,c,seat.cell,true);}else if(c.phase==='exiting')routeTo(s,w,c,entrance);}
 for(const sh of Object.values(w.sh)){if(sh.phase==='approach'){const c=w.custs.find(c=>c.id===sh.cust);if(c?.cell){const targets=around(c.cell).filter(p=>adjacent(c.cell,p,edges));routeTo(s,w,sh,targets.find(p=>pathfind(zone,slots,sh.cell,p,{edges})));}}else if(sh.target)routeTo(s,w,sh,sh.target,sh.seatTarget);}
}
export {MAP};

export function faceCell(char,target){if(!char.cell||!target)return;const view={x:0,y:0,scale:1},a=cellToScreen(...char.cell,view),b=cellToScreen(...target,view),dx=b.x-a.x,dy=b.y-a.y;if(dx||dy)char.facing=dy>0?(dx>0?0:1):(dx<0?2:3);}
// One item per table cell (starting value 똑또기 2026-10-14). All adjacent table cells full → the guest eats with no item drawn ('none').
export function linkTable(s,w,c){const {slots,edges}=layout(s,w);const tables=slots.filter(x=>x.type==='table'&&footprintCells(x).some(p=>adjacent(p,c.cell,edges)));
 const occupied=new Set(w.custs.filter(g=>g!==c&&g.phase==='seated'&&g.itemSlot).map(g=>g.itemSlot.id));
 c.itemSlot=null;for(const table of tables){const cells=footprintCells(table),index=cells.findIndex((_,n)=>!occupied.has(table.id+':'+n));if(index>=0){c.itemSlot={tableId:table.id,id:table.id+':'+index,index,offset:[...TABLE_ITEM_LAYOUT.offset],cell:cells[index]};break;}}
 c.itemLocation=c.itemSlot?'table':tables.length?'none':'inHand';}

// Preserve every previously reachable floor cell and seat; counter access is included in floor reachability.
// 17-7: edgesBefore/edgesAfter = 선 따라 세운 가벽, 같은 기준으로 검사. 카운터는 가벽 너머 옆 칸에서는 닿지 않는다.
export function preservesEntrance(zone,before,after,{edgesBefore=[],edgesAfter=[]}={}){
 const entrance=zone.entrance;if(!entrance)return true;
 const was={edges:edgesBefore},now={edges:edgesAfter};
 if(!pathfind(zone,after,entrance,entrance,now))return false;
 for(let i=0;i<zone.cols;i++)for(let j=0;j<zone.rows;j++){
  const cell=[i,j],seatTarget=before.some(s=>['chair','cushion'].includes(s.type)&&footprintCells(s).some(c=>key(c)===key(cell)));
  if(!pathfind(zone,before,entrance,cell,{...was,seatTarget}))continue;
  // A newly occupied floor is exempt, but seats must retain an approach.
  if(!seatTarget&&after.some(s=>footprintCells(s).some(c=>key(c)===key(cell))))continue;
  if(!pathfind(zone,after,entrance,cell,{...now,seatTarget}))return false;
 }
 for(const slot of after){
  if(['chair','cushion'].includes(slot.type)&&!footprintCells(slot).every(cell=>pathfind(zone,after,entrance,cell,{...now,seatTarget:true})))return false;
  if(slot.type==='counter'&&!footprintCells(slot).some(p=>around(p).some(cell=>adjacent(p,cell,edgesAfter)&&pathfind(zone,after,entrance,cell,now))))return false;
 }
 return true;
}
export function tickManager(s,w,dt,active,seconds){
 if(!active){w.manager=null;return;}
 const {zone,slots,edges,entrance}=layout(s,w);if(!entrance)return;
 // 가구 옆 칸 = 가벽 너머가 아닌 칸만
 const touches=slot=>p=>footprintCells(slot).some(c=>adjacent(c,p,edges));
 const beside=slot=>footprintCells(slot).flatMap(c=>around(c).filter(p=>adjacent(c,p,edges)));
 const reachable=(from,targets)=>targets.map(p=>({p,route:pathfind(zone,slots,from,p,{edges})})).filter(x=>x.route).sort((a,b)=>a.route.length-b.route.length)[0]?.p;
 // Home = beside the counter's short end (same row), so the 150px sprite doesn't stand in front of the counter and cover it;
 // falls back to any reachable adjacent cell.
 const counters=slots.filter(x=>x.type==='counter'),side=slot=>{const c=footprintCells(slot),is=c.map(p=>p[0]),js=c.map(p=>p[1]),sameRow=new Set(js).size===1;
  return sameRow?[[Math.max(...is)+1,js[0]],[Math.min(...is)-1,js[0]]]:[[is[0],Math.max(...js)+1],[is[0],Math.min(...js)-1]];};
 const home=reachable(entrance,counters.flatMap(slot=>side(slot).filter(touches(slot))))||reachable(entrance,counters.flatMap(beside))||entrance;
 const m=w.manager??={role:'manager',cell:[...home],phase:'idle',route:null,facing:0,anim:0};m.anim+=dt;
 if(!pathfind(zone,slots,m.cell,m.cell,{edges})){m.cell=[...home];m.phase='idle';m.target=null;}
 if(m.phase==='visiting'){m.wait-=dt;if(m.wait>0)return;m.returning=true;m.phase='idle';}
 if(m.phase==='walking'){
  const acc=m.moveAcc;routeTo(s,w,m,m.target);m.moveAcc=acc;
  if(m.route===null){m.phase='idle';m.target=null;return;}
  if(!moveCell(m,dt,seconds)){faceCell(m,m.route[0]);return;}
  m.target=null;m.phase=m.returning?'idle':'visiting';m.wait=MANAGER.visitSec;if(m.phase==='visiting')return;m.returning=false;return;
 }
 const tables=slots.filter(x=>x.type==='table'&&w.custs.some(c=>c.phase==='seated'&&footprintCells(x).some(p=>adjacent(p,c.cell,edges))));
 const target=m.returning?home:reachable(m.cell,tables.flatMap(beside).filter(p=>key(p)!==key(m.cell)));
 if(target&&key(target)!==key(m.cell)){routeTo(s,w,m,target);faceCell(m,m.route?.[0]);m.phase='walking';}
}
