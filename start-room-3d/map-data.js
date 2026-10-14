// Image pixels are the shared coordinate system for room art and sprite anchors.
// Previous anchors: v2 given table (74,73), cushion (68,52), counter (114,142), stairs (111,177); v5 measured+scaled. v6 uses 그림이 v4 sprites at scale 1.
// 그림이 will provide back views; unavailable until the art is supplied.
export const SPRITES={
 // 그림이 v4 sprites, original size (scale 1). anchor = centre of floor-contact footprint, sprite px (given by 그림이).
 table:{file:'assets/drive/furn-tea-table-v4.png',anchor:[92,93],scale:1,back:null,footprint:{cells:1,axis:null}},
 cushion:{file:'assets/drive/furn-cushion-v4.png',anchor:[90,74],scale:1,back:null,footprint:{cells:1,axis:null}},
 counter:{file:'assets/drive/furn-counter-v4.png',anchor:[124,132],scale:1,back:null,footprint:{cells:2,axis:'i'}},
 stairs:{file:'assets/drive/furn-stairs-v4.png',anchor:[121,167],scale:1,back:null,footprint:{cells:2,axis:'i'}}
};
// Normal-mode room background (방_기본_다다미_선없음.png, Drive 1V3vO-ZEJfPv30NeDAfVKpLVKjFvtQAGX). Same size/coords as the 시험 image.
export const ROOM_BG='assets/drive/room-tatami-noline.png';
export const MAP={zones:[{
 id:'A',image:ROOM_BG,origin:{x:429,y:181},
 cols:6,rows:6,cell:{w:128,h:64},locked:false,unlockCost:null,floor:1,
 slots:[
  {id:'counter',type:'counter',origin:[0,0],dir:0},
  {id:'cushion-back',type:'cushion',origin:[1,3],dir:0},
  {id:'table',type:'table',origin:[2,3],dir:0},
  {id:'cushion-front',type:'cushion',origin:[3,3],dir:0},
  {id:'stairs',type:'stairs',origin:[4,0],dir:0,connects:[1,2]}
 ]
}]};
// Placement positions are derived solely from whole-cell footprints.
export function footprintCentre(item){
 const cells=footprintCells(item);return cells.reduce((p,[i,j])=>[p[0]+i/cells.length,p[1]+j/cells.length],[0,0]);
}
export function compareDepth(a,b){
 const depth=s=>Math.max(...footprintCells(s).map(([i,j])=>i+j));
 const x=s=>{const [i,j]=footprintCentre(s);return i-j;};
 return depth(a)-depth(b)||x(a)-x(b);
}
export function cellToImage(col,row,zone=MAP.zones[0]){
 return {x:zone.origin.x+(col-row)*zone.cell.w/2,y:zone.origin.y+(col+row+1)*zone.cell.h/2};
}
export function cellToScreen(col,row,view,zone=MAP.zones[0]){
 const p=cellToImage(col,row,zone);return {x:view.x+p.x*view.scale,y:view.y+p.y*view.scale};
}
// Zones on another floor can share coordinates; additional rows extend each zone's grid.
export function zoneAt(map,col,row,floor=1){return map.zones.find(z=>z.floor===floor&&col>=0&&row>=0&&col<z.cols&&row<z.rows);}

export function availableDirs(type,sprites=SPRITES){return sprites[type].back?[0,1,2,3]:[0,1];}
export function flipDir(dir){return dir^1;}
export function rotateDir(type,dir,sprites=SPRITES){const dirs=availableDirs(type,sprites);return dirs[(dirs.indexOf(dir)+1)%dirs.length];}
export function footprintCells(item){
 if(!item.origin)return item.cells; // legacy footprint callers
 const f=SPRITES[item.type].footprint,axis=item.dir%2?(f.axis==='i'?'j':'i'):f.axis;
 return Array.from({length:f.cells},(_,n)=>[item.origin[0]+(axis==='i'?n:0),item.origin[1]+(axis==='j'?n:0)]);
}
export function validPlacement(item,slots,zone=MAP.zones[0]){
 if(!SPRITES[item.type]||!availableDirs(item.type).includes(item.dir)||!Array.isArray(item.origin)||item.origin.length!==2||!item.origin.every(Number.isInteger))return false;
 const cells=footprintCells(item),occupied=new Set(slots.filter(s=>s.id!==item.id).flatMap(s=>footprintCells(s).map(c=>c.join(','))));
 return cells.every(([i,j])=>i>=0&&j>=0&&i<zone.cols&&j<zone.rows&&!occupied.has(`${i},${j}`));
}
export function defaultPlacement(){return {v:1,slots:structuredClone(MAP.zones[0].slots)};}
export function restorePlacement(saved){
 const fallback=defaultPlacement();
 if(!saved||saved.v!==1||!Array.isArray(saved.slots)||saved.slots.length!==fallback.slots.length)return fallback;
 if(saved.slots.some(s=>!s||!Array.isArray(s.origin)||s.origin.length!==2||!s.origin.every(Number.isInteger)||!SPRITES[s.type]||!availableDirs(s.type).includes(s.dir))||new Set(saved.slots.map(s=>s.id)).size!==fallback.slots.length)return fallback;
 const slots=fallback.slots.map(d=>{const s=saved.slots.find(s=>s.id===d.id&&s.type===d.type);return s?{...d,origin:s.origin,dir:s.dir}:d;});
 return slots.every(s=>validPlacement(s,slots))?{v:1,slots}:fallback;
}
