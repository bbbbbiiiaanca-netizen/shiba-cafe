// Whole-cell routes; cushions may be entered only as the route's seat target.
import {MAP,zonesForSpace,footprintCells} from './map-data.js';
const key=c=>c.join(',');
export function layout(s,w){const zone=w.navigation?.zone||zonesForSpace(s.space)[0];return {zone,slots:w.navigation?.slots||s.placement.slots,entrance:w.navigation?.entrance??zone.entrance};}
export function seatSlots(s,w){return layout(s,w).slots.filter(x=>x.type==='cushion').flatMap(x=>footprintCells(x).map(cell=>({id:x.id+':'+key(cell),furnitureId:x.id,cell})));}
export function pathfind(zone,slots,from,to,{seatTarget=false}={}){
 const inside=c=>Array.isArray(c)&&c.length===2&&c.every(Number.isInteger)&&c[0]>=0&&c[1]>=0&&c[0]<zone.cols&&c[1]<zone.rows;
 if(!inside(from)||!inside(to))return null;
 const blocked=new Set(slots.flatMap(x=>footprintCells(x).map(key)));
 if(seatTarget&&slots.some(x=>x.type==='cushion'&&footprintCells(x).some(c=>key(c)===key(to))))blocked.delete(key(to));
 if(blocked.has(key(to)))return null;
 const queue=[from],prev=new Map([[key(from),null]]);
 for(let n=0;n<queue.length;n++){const c=queue[n];if(key(c)===key(to)){const route=[];let p=c;while(prev.get(key(p))!==null){route.unshift(p);p=prev.get(key(p));}return route;}
 for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const p=[c[0]+di,c[1]+dj];if(inside(p)&&!blocked.has(key(p))&&!prev.has(key(p))){prev.set(key(p),c);queue.push(p);}}}
 return null;
}
export function routeTo(s,w,char,target,seatTarget=false){const {zone,slots}=layout(s,w);char.target=target&&[...target];char.seatTarget=seatTarget;char.route=pathfind(zone,slots,char.cell,target,{seatTarget});char.moveAcc=0;}
export function moveCell(char,dt,seconds){if(!Number.isFinite(seconds)||seconds<=0||!char.route)return false;char.moveAcc=(char.moveAcc||0)+dt;while(char.moveAcc>=seconds&&char.route.length){char.moveAcc-=seconds;char.cell=char.route.shift();}return char.route.length===0;}
export function syncRoutes(s,w){const {zone,slots,entrance}=layout(s,w),sig=JSON.stringify([zone.cols,zone.rows,slots,entrance]);if(w.layoutSig===sig)return;w.layoutSig=sig;
 const seats=seatSlots(s,w);for(const c of w.custs){const seat=seats.find(x=>x.furnitureId===c.seatFurniture);if(c.phase==='seated'){if(seat){c.seat=seat.id;c.cell=[...seat.cell];}continue;}if(c.phase==='entering'&&seat){c.seat=seat.id;routeTo(s,w,c,seat.cell,true);}else if(c.phase==='exiting')routeTo(s,w,c,entrance);}
 for(const sh of Object.values(w.sh)){if(sh.phase==='approach'){const c=w.custs.find(c=>c.id===sh.cust);if(c?.cell){const targets=[[1,0],[-1,0],[0,1],[0,-1]].map(([i,j])=>[c.cell[0]+i,c.cell[1]+j]);routeTo(s,w,sh,targets.find(p=>pathfind(zone,slots,sh.cell,p)));}}else if(sh.target)routeTo(s,w,sh,sh.target,sh.seatTarget);}
}
export {MAP};
