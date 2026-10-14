// Whole-cell routes; cushions may be entered only as the route's seat target.
import {MAP,SPRITES,zonesForSpace,footprintCells} from './map-data.js';
const key=c=>c.join(',');
export function layout(s,w){const zone=w.navigation?.zone||zonesForSpace(s.space)[0];return {zone,slots:w.navigation?.slots||s.placement.slots,entrance:w.navigation&&Object.hasOwn(w.navigation,'entrance')?w.navigation.entrance:zone.entrance};}
export function seatSlots(s,w){return layout(s,w).slots.filter(x=>['cushion','chair'].includes(x.type)).flatMap(x=>footprintCells(x).map(cell=>({id:x.id+':'+key(cell),furnitureId:x.id,cell})));}
export function pathfind(zone,slots,from,to,{seatTarget=false}={}){
 const inside=c=>Array.isArray(c)&&c.length===2&&c.every(Number.isInteger)&&c[0]>=0&&c[1]>=0&&c[0]<zone.cols&&c[1]<zone.rows;
 if(!inside(from)||!inside(to))return null;
 const blocked=new Set(slots.flatMap(x=>footprintCells(x).map(key)));
 if(seatTarget&&slots.some(x=>['cushion','chair'].includes(x.type)&&footprintCells(x).some(c=>key(c)===key(to))))blocked.delete(key(to));
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
export function linkTable(s,w,c){const {slots}=layout(s,w);const table=slots.find(x=>x.type==='table'&&footprintCells(x).some(p=>Math.abs(p[0]-c.cell[0])+Math.abs(p[1]-c.cell[1])===1));
 const occupied=new Set(w.custs.filter(g=>g!==c&&g.phase==='seated'&&g.itemSlot&&g.itemSlot.tableId===table?.id).map(g=>g.itemSlot.index));
 const index=table?SPRITES.table.itemSlots.findIndex((slot,n)=>!occupied.has(n)):-1;
 const slot=index>=0?SPRITES.table.itemSlots[index]:null;c.itemSlot=slot?{tableId:table.id,id:table.id+':'+index,index,offset:slot.offset,cell:footprintCells(table)[slot.cellIndex]}:null;c.itemLocation=c.itemSlot?'table':'inHand';}
