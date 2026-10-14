// Image pixels are the shared coordinate system for room art and sprite anchors.
export const SPRITES={
 table:{path:'assets/drive/furn-tea-table.png',anchor:[74,73]},
 cushion:{path:'assets/drive/furn-cushion.png',anchor:[68,52]},
 counter:{path:'assets/drive/furn-counter.png',anchor:[114,142]},
 stairs:{path:'assets/drive/furn-stairs.png',anchor:[111,177]}
};
export const MAP={zones:[{
 id:'A',image:'assets/drive/방_기본_다다미_시험.png',origin:{x:429,y:181},
 cols:6,rows:6,cell:{w:128,h:64},locked:false,unlockCost:null,floor:1,
 slots:[
  {id:'stairs',type:'stairs',i:0,j:3.5,cells:[[0,3],[0,4]],connects:[1,2]},
  {id:'counter',type:'counter',i:2.5,j:0,cells:[[2,0],[3,0]]},
  {id:'table',type:'table',i:3,j:3,cells:[[3,3]]},
  {id:'cushion-back',type:'cushion',i:3,j:2,cells:[[3,2]]},
  {id:'cushion-front',type:'cushion',i:3,j:4,cells:[[3,4]]}
 ]
}]};
// Fractional columns/rows locate the center of merged footprints.
export function cellToImage(col,row,zone=MAP.zones[0]){
 return {x:zone.origin.x+(col-row)*zone.cell.w/2,y:zone.origin.y+(col+row+1)*zone.cell.h/2};
}
export function cellToScreen(col,row,view,zone=MAP.zones[0]){
 const p=cellToImage(col,row,zone);return {x:view.x+p.x*view.scale,y:view.y+p.y*view.scale};
}
// Zones on another floor can share coordinates; additional rows extend each zone's grid.
export function zoneAt(map,col,row,floor=1){return map.zones.find(z=>z.floor===floor&&col>=0&&row>=0&&col<z.cols&&row<z.rows);}
