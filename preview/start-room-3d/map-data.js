// Image pixels are the shared coordinate system for room art and sprite anchors.
// Previous anchors: table (74,73), cushion (68,52), counter (114,142), stairs (111,177).
// Measured floor-contact diamond centres exclude shadows; source files stay untouched.
export const SPRITES={
 table:{file:'assets/drive/furn-tea-table.png',anchor:[73,72.5],scale:1.255,footprint:{cells:1,axis:null}},
 cushion:{file:'assets/drive/furn-cushion.png',anchor:[68,51],scale:1.267,footprint:{cells:1,axis:null}},
 counter:{file:'assets/drive/furn-counter.png',anchor:[93,147.5],scale:0.853,footprint:{cells:2,axis:'i'}}, // anchor: base centre measured (114,137); base ~0.44 cell deep, shifted so back edge sits on j=0 wall line
 stairs:{file:'assets/drive/furn-stairs.png',anchor:[111,158],scale:1.164,footprint:{cells:2,axis:'j'}}
};
// Replace with assets/drive/방_기본_다다미_선없음.png (same size/coords) when uploaded to Drive 이미지/interior.
export const ROOM_BG='assets/drive/방_기본_다다미_시험.png';
export const MAP={zones:[{
 id:'A',image:ROOM_BG,origin:{x:429,y:181},
 cols:6,rows:6,cell:{w:128,h:64},locked:false,unlockCost:null,floor:1,
 slots:[
  {id:'stairs',type:'stairs',cells:[[0,3],[0,4]],connects:[1,2]},
  {id:'counter',type:'counter',cells:[[2,0],[3,0]]},
  {id:'table',type:'table',cells:[[3,3]]},
  {id:'cushion-back',type:'cushion',cells:[[3,2]]},
  {id:'cushion-front',type:'cushion',cells:[[3,4]]}
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
