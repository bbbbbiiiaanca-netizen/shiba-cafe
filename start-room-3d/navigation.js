// Whole-cell routes; cushions may be entered only as the route's seat target.
import {MAP,zonesForSpace,footprintCells,TABLE_ITEM_LAYOUT} from './map-data.js';
const key=c=>c.join(',');
export function layout(s,w){const zone=w.navigation?.zone||zonesForSpace(s.space)[0];return {zone,slots:w.navigation?.slots||s.placement.slots,entrance:w.navigation&&Object.hasOwn(w.navigation,'entrance')?w.navigation.entrance:zone.entrance};}
export function seatSlots(s,w){return layout(s,w).slots.filter(x=>['cushion','chair'].includes(x.type)).flatMap(x=>footprintCells(x).map(cell=>({id:x.id+':'+key(cell),furnitureId:x.id,cell})));}
export function pathfind(zone,slots,from,to,{seatTarget=false}={}){
 const inside=c=>Array.isArray(c)&&c.length===2&&c.every(Number.isInteger)&&c[0]>=0&&c[1]>=0&&c[0]<zone.cols&&c[1]<zone.rows;
 if(!inside(from)||!inside(to))return null;
 const blocked=new Set(slots.flatMap(x=>footprintCells(x).map(key)));
 if(seatTarget&&slots.some(x=>['cushion','chair'].includes(x.type)&&footprintCells(x).some(c=>key(c)===key(to))))blocked.delete(key(to));
 if(blocked.has(key(from))&&!slots.some(s=>['chair','cushion'].includes(s.type)&&footprintCells(s).some(c=>key(c)===key(from))))return null;
 if(blocked.has(key(to)))return null;
 const queue=[from],prev=new Map([[key(from),null]]);
 for(let n=0;n<queue.length;n++){const c=queue[n];if(key(c)===key(to)){const route=[];let p=c;while(prev.get(key(p))!==null){route.unshift(p);p=prev.get(key(p));}return route;}
 for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const p=[c[0]+di,c[1]+dj];if(inside(p)&&!blocked.has(key(p))&&!prev.has(key(p))){prev.set(key(p),c);queue.push(p);}}}
 return null;
}
export function routeTo(s,w,char,target,seatTarget=false){const {zone,slots}=layout(s,w);char.target=target&&[...target];char.seatTarget=seatTarget;char.route=pathfind(zone,slots,char.cell,target,{seatTarget});char.moveAcc=0;}
export function moveCell(char,dt,seconds){if(!Number.isFinite(seconds)||seconds<=0||!char.route)return false;char.moveAcc=(char.moveAcc||0)+dt;while(char.moveAcc>=seconds&&char.route.length){char.moveAcc-=seconds;const next=char.route.shift();faceCell(char,next);char.cell=next;}return char.route.length===0;}
export function syncRoutes(s,w){const {zone,slots,entrance}=layout(s,w),sig=JSON.stringify([zone.cols,zone.rows,slots,entrance]);if(w.layoutSig===sig)return;w.layoutSig=sig;
 const seats=seatSlots(s,w);for(const c of w.custs){const seat=seats.find(x=>x.furnitureId===c.seatFurniture);if(c.phase==='seated'){if(seat){c.seat=seat.id;c.cell=[...seat.cell];if(c.order)linkTable(s,w,c);}continue;}if(c.phase==='entering'&&seat){c.seat=seat.id;routeTo(s,w,c,seat.cell,true);}else if(c.phase==='exiting')routeTo(s,w,c,entrance);}
 for(const sh of Object.values(w.sh)){if(sh.phase==='approach'){const c=w.custs.find(c=>c.id===sh.cust);if(c?.cell){const targets=[[1,0],[-1,0],[0,1],[0,-1]].map(([i,j])=>[c.cell[0]+i,c.cell[1]+j]);routeTo(s,w,sh,targets.find(p=>pathfind(zone,slots,sh.cell,p)));}}else if(sh.target)routeTo(s,w,sh,sh.target,sh.seatTarget);}
}
export {MAP};

export function faceCell(char,target){if(!char.cell||!target)return;const di=target[0]-char.cell[0],dj=target[1]-char.cell[1];if(di||dj)char.facing=Math.abs(di)>Math.abs(dj)?(di>0?0:2):(dj>0?1:3);}
// One item per table cell (starting value 똑또기 2026-10-14). All adjacent table cells full → the guest eats with no item drawn ('none').
export function linkTable(s,w,c){const {slots}=layout(s,w);const tables=slots.filter(x=>x.type==='table'&&footprintCells(x).some(p=>Math.abs(p[0]-c.cell[0])+Math.abs(p[1]-c.cell[1])===1));
 const occupied=new Set(w.custs.filter(g=>g!==c&&g.phase==='seated'&&g.itemSlot).map(g=>g.itemSlot.id));
 c.itemSlot=null;for(const table of tables){const cells=footprintCells(table),index=cells.findIndex((_,n)=>!occupied.has(table.id+':'+n));if(index>=0){c.itemSlot={tableId:table.id,id:table.id+':'+index,index,offset:[...TABLE_ITEM_LAYOUT.offset],cell:cells[index]};break;}}
 c.itemLocation=c.itemSlot?'table':tables.length?'none':'inHand';}

// Preserve every previously reachable floor cell and seat; counter access is included in floor reachability.
export function preservesEntrance(zone,before,after){
 const entrance=zone.entrance;if(!entrance)return true;
 if(!pathfind(zone,after,entrance,entrance))return false;
 for(let i=0;i<zone.cols;i++)for(let j=0;j<zone.rows;j++){
  const cell=[i,j],seatTarget=before.some(s=>['chair','cushion'].includes(s.type)&&footprintCells(s).some(c=>key(c)===key(cell)));
  if(!pathfind(zone,before,entrance,cell,{seatTarget}))continue;
  // A newly occupied floor is exempt, but seats must retain an approach.
  if(!seatTarget&&after.some(s=>footprintCells(s).some(c=>key(c)===key(cell))))continue;
  if(!pathfind(zone,after,entrance,cell,{seatTarget}))return false;
 }
 for(const slot of after){
  if(['chair','cushion'].includes(slot.type)&&!footprintCells(slot).every(cell=>pathfind(zone,after,entrance,cell,{seatTarget:true})))return false;
  if(slot.type==='counter'&&!footprintCells(slot).some(([i,j])=>[[i+1,j],[i-1,j],[i,j+1],[i,j-1]].some(cell=>pathfind(zone,after,entrance,cell))))return false;
 }
 return true;
}
export function tickManager(s,w,dt,active,seconds){
 if(!active){w.manager=null;return;}
 const {zone,slots,entrance}=layout(s,w);if(!entrance)return;
 if(!w.manager)w.manager={role:'manager',cell:[...entrance],phase:'idle',route:null};
 const m=w.manager;
 if(slots.some(x=>footprintCells(x).some(c=>key(c)===key(m.cell)))){m.cell=[...entrance];m.route=null;}
 if(m.target){const acc=m.moveAcc;routeTo(s,w,m,m.target);m.moveAcc=acc;} // refresh against furniture changes
 if(m.phase==='walking'&&m.route===null){m.phase='idle';m.target=null;}
 if(m.phase==='walking'&&moveCell(m,dt,seconds)){m.phase='idle';m.target=null;}
 if(m.phase==='idle'){
  const targets=[];for(let i=0;i<zone.cols;i++)for(let j=0;j<zone.rows;j++)if(key([i,j])!==key(m.cell)&&pathfind(zone,slots,m.cell,[i,j]))targets.push([i,j]);
  if(targets.length){routeTo(s,w,m,targets[Math.floor(w.r()*targets.length)]);m.phase='walking';}
 }
}
