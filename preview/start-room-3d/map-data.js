// Image pixels are the shared coordinate system for room art and sprite anchors.
// Previous anchors: v2 given table (74,73), cushion (68,52), counter (114,142), stairs (111,177); v5 measured+scaled. v6 uses 그림이 v4 sprites at scale 1.
export const SPRITES={
 // 그림이 v4 sprites, original size (scale 1). anchor = centre of floor-contact footprint, sprite px (given by 그림이).
 table:{file:'assets/drive/furn-tea-table-v4.png',anchor:[92,93],scale:1,footprint:{cells:1,axis:null}},
 cushion:{file:'assets/drive/furn-cushion-v4.png',anchor:[90,74],scale:1,footprint:{cells:1,axis:null}},
 counter:{file:'assets/drive/furn-counter-v4.png',anchor:[124,132],scale:1,footprint:{cells:2,axis:'i'}},
 stairs:{file:'assets/drive/furn-stairs-v4.png',anchor:[121,167],scale:1,footprint:{cells:2,axis:'i'}}
};
// Normal-mode room background (방_기본_다다미_선없음.png, Drive 1V3vO-ZEJfPv30NeDAfVKpLVKjFvtQAGX). Same size/coords as the 시험 image.
export const ROOM_BG='assets/drive/room-tatami-noline.png';
export const MAP={zones:[{
 id:'A',image:ROOM_BG,origin:{x:429,y:181},
 cols:6,rows:6,cell:{w:128,h:64},locked:false,unlockCost:null,floor:1,
 slots:[
  {id:'counter',type:'counter',cells:[[0,0],[1,0]]},
  {id:'cushion-back',type:'cushion',cells:[[1,3]]},
  {id:'table',type:'table',cells:[[2,3]]},
  {id:'cushion-front',type:'cushion',cells:[[3,3]]},
  {id:'stairs',type:'stairs',cells:[[4,0],[5,0]],connects:[1,2]}
 ]
}]};
// Placement positions are derived solely from whole-cell footprints.
export function footprintCentre(item){
 return item.cells.reduce((p,[i,j])=>[p[0]+i/item.cells.length,p[1]+j/item.cells.length],[0,0]);
}
export function compareDepth(a,b){
 const depth=s=>Math.max(...s.cells.map(([i,j])=>i+j));
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
