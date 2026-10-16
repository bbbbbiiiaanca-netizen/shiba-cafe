import {CFG} from './config.js';
// Image pixels are the shared coordinate system for room art and sprite anchors.
// Previous anchors: v2 given table (74,73), cushion (68,52), counter (114,142), stairs (111,177); v5 measured+scaled. v6 uses 그림이 v4 sprites at scale 1.
// 그림이 will provide back views; unavailable until the art is supplied.
export const PARTITION={count:3,price:50000}; // starting value 2026-10-15, pending user confirm
export const SPRITES={
 // starting value 2026-10-15, pending user confirm: bbox x6–95/y24–181; bottom contact midpoint (50.5,162.5), scaled to existing 64×32 cell edge and offset to the rear cell edge.
 wall:{file:'assets/drive/tiles/wall-inner.png',anchor:[50.5,162.5],scale:64/89,back:{file:'assets/drive/tiles/furn-partition-v4-back.png',anchor:[54.5,157],scale:64/89},flip:{file:'assets/drive/tiles/wall-inner-flip.png',anchor:[62.5,162.5],scale:64/89},footprint:{cells:1,axis:null}},
 // 그림이 v4 sprites, original size (scale 1). anchor = centre of floor-contact footprint, sprite px (given by 그림이).
 table:{file:'assets/drive/furn-tea-table-v4.png',anchor:[92,93],scale:1,back:{file:'assets/drive/furn-tea-table-v4-back.png',anchor:[92,93],scale:1},footprint:{cells:1,axis:null}},
 cushion:{file:'assets/drive/furn-cushion-v4.png',anchor:[90,74],scale:1,back:{file:'assets/drive/furn-cushion-v4-back.png',anchor:[90,74],scale:1},footprint:{cells:1,axis:null}},
  // counter front anchor y 132→116 (똑또기 10-16: 앞모습이 바닥 칸보다 반 칸 뒤에 보임). 뒷모습은 132 유지.
 counter:{file:'assets/drive/furn-counter-v4.png',anchor:[124,116],scale:1,back:{file:'assets/drive/furn-counter-v4-back.png',anchor:[124,132],scale:1,mirror:true},footprint:{cells:2,axis:'i'}},
 stairs:{file:'assets/drive/furn-stairs-v4.png',anchor:[121,167],scale:1,back:{file:'assets/drive/furn-stairs-v4-back.png',anchor:[121,167],scale:1,mirror:true},footprint:{cells:2,axis:'i'}}
};
// Normal-mode room background (방_기본_다다미_선없음.png, Drive 1V3vO-ZEJfPv30NeDAfVKpLVKjFvtQAGX). Same size/coords as the 시험 image.
// Opaque top-face bounds measured from alpha: x [1,127), y [0,64).
// Anchor uses pixel-edge coordinates, the diamond's centre (64,32).
export const MAP_MARKERS={
 expansion:{file:'assets/drive/tiles/marker-expand-land.png',anchor:[64,72]},
 floor2:{file:'assets/drive/ui/ui-lock.png',anchor:[32,32]}
};
export const CHAR_SPRITES={shiba:{file:null,anchor:null,footShadow:null,directions:[null,null,null,null],
 // 2026-10-15: 종류별 지도 그림. 시루(red)는 걷기 첫 프레임을 서 있는 그림으로 쓴다. 없는 종류는 null → 그리지 않음(도형 대체 없음)
 byBreed:{red:{file:'assets/drive/chars/shiba-red/walk-front-dr-1.png',anchor:[64,167]},white:{file:'assets/drive/chars/shiba-white/walk-front-dr-1.png',anchor:[64,167]},sesame:{file:'assets/drive/chars/shiba-sesame/walk-front-dr-1.png',anchor:[64,167]},kuro:{file:'assets/drive/chars/shiba-kuro/walk-front-dr-1.png',anchor:[64,167]}}},guest:{file:null,anchor:null,footShadow:null,directions:[null,null,null,null]},manager:{file:'assets/drive/chars/manager/manager-stand-dr.png',anchor:[64,166],footShadow:null,directions:['front-dr','front-dl','back-ul','back-ur']},dongu:{file:null,anchor:null,footShadow:null,directions:[null,null,null,null]}}; // foot-shadow anchors await supplied art
export function characterDepthEntries(world){return [...(world?.custs||[]),...(world?.queue||[]),...(world?.manager?[world.manager]:[]),...Object.values(world?.sh||{})].filter(c=>c.cell).map(c=>({character:c,origin:c.cell,cells:[c.cell]}));}
export const ROOM_BG='assets/drive/room-tatami-noline.png';
export const MAP={zones:[{
 // answer 똑또기 2026-10-14: front-left entrance; queue = CFG.navigation.queueCells grass cells straight out from the entrance
 id:'A',entrance:[0,5],queueCells:Array.from({length:CFG.navigation.queueCells},(_,n)=>[0,6+n]),image:ROOM_BG,origin:{x:429,y:181},
 cols:6,rows:6,cell:{w:128,h:64},locked:false,unlockCost:null,floor:1,
 slots:[
  {id:'counter',type:'counter',origin:[0,0],dir:0},
  {id:'cushion-back',type:'cushion',origin:[1,3],dir:0},
  {id:'table',type:'table',origin:[2,3],dir:0},
  {id:'cushion-front',type:'cushion',origin:[3,3],dir:0},
  {id:'stairs',type:'stairs',origin:[4,0],dir:0,connects:[1,2]}
 ]
},{id:'B',entrance:null,image:null, // other floors: no entrance, reached by stairs only, so no queue
origin:{x:429,y:181},cols:6,rows:6,cell:{w:128,h:64},locked:true,unlockCost:null,floor:2,screenOffset:{x:0,y:-615},connects:{zone:'A',slot:'stairs'},slots:[]}]};
// Placement positions are derived solely from whole-cell footprints.
export function footprintCentre(item){
 const cells=footprintCells(item);return cells.reduce((p,[i,j])=>[p[0]+i/cells.length,p[1]+j/cells.length],[0,0]);
}
export function compareDepth(a,b){
 const depth=s=>Math.max(...footprintCells(s).map(([i,j])=>i+j));
 const x=s=>{const [i,j]=footprintCentre(s);return i-j;};
 return depth(a)-depth(b)||Number(Boolean(a.character||a.tableItem))-Number(Boolean(b.character||b.tableItem))||x(a)-x(b);
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
// 칸막이 벽(그림이 뒷모습 10-16): 0 원본, 1 좌우반전 그림(flip), 2 뒷모습, 3 뒷모습 좌우반전. 2·3은 0·1 맞은편 모서리에 세운다(wallEdge).
export function spriteFor(type,dir,sprites=SPRITES){const b=sprites[type];if(dir>=2)return b.back;return type==='wall'&&dir%2?b.flip:b;}
// 벽 판이 서는 칸 모서리: 화면 [x,y] 방향(칸 너비·높이의 1/4 단위). 0 오른쪽 위, 1 왼쪽 위, 2 왼쪽 아래(0의 맞은편), 3 오른쪽 아래(1의 맞은편).
export function wallEdge(dir){return [[1,-1],[-1,-1],[-1,1],[1,1]][dir];}
// 좌우 반전 여부. 벽 0·1은 그림 자체가 따로 있어 반전 없음. 뒷모습이 반대 대각선으로 그려진 경우(back.mirror: 카운터·계단) 뒤 2방향 반전을 바꾼다.
export function spriteMirrored(type,dir,sprite){if(type==='wall'&&dir<2)return false;const m=Boolean(dir%2);return dir>=2&&sprite?.mirror?!m:m;}
export function flipDir(dir){return dir^1;}
export function rotateDir(type,dir,sprites=SPRITES){const dirs=availableDirs(type,sprites);return dirs[(dirs.indexOf(dir)+1)%dirs.length];}
export function footprintCells(item){
 if(item.character||item.tableItem||!item.origin)return item.cells; // legacy footprint callers
 const f=SPRITES[item.type].footprint,axis=item.dir%2?(f.axis==='i'?'j':'i'):f.axis;
 return Array.from({length:f.cells},(_,n)=>[item.origin[0]+(axis==='i'?n:0),item.origin[1]+(axis==='j'?n:0)]);
}
export function validPlacement(item,slots,zone=MAP.zones[0]){
 if(!SPRITES[item.type]||!availableDirs(item.type).includes(item.dir)||!Array.isArray(item.origin)||item.origin.length!==2||!item.origin.every(Number.isInteger))return false;
 // Direct entrance occupancy: starting value 2026-10-15, pending user confirm (§17-7).
 const cells=footprintCells(item);if(zone.entrance&&cells.some(c=>c.join(',')===zone.entrance.join(',')))return false;const occupied=new Set(slots.filter(s=>s.id!==item.id).flatMap(s=>footprintCells(s).map(c=>c.join(','))));
 return cells.every(([i,j])=>i>=0&&j>=0&&i<zone.cols&&j<zone.rows&&!occupied.has(`${i},${j}`));
}
export function defaultPlacement(){return {v:1,slots:structuredClone(MAP.zones[0].slots)};}
export function restorePlacement(saved,zone=MAP.zones[0]){
 const fallback=defaultPlacement();
 if(!saved||saved.v!==1||!Array.isArray(saved.slots)||saved.slots.length<fallback.slots.length)return fallback;
 if(saved.slots.some(s=>!s||!Array.isArray(s.origin)||s.origin.length!==2||!s.origin.every(Number.isInteger)||!SPRITES[s.type]||!availableDirs(s.type).includes(s.dir))||new Set(saved.slots.map(s=>s.id)).size!==saved.slots.length)return fallback;
 if(fallback.slots.some(d=>!saved.slots.some(s=>s.id===d.id&&s.type===d.type)))return fallback;
 const slots=fallback.slots.map(d=>{const s=saved.slots.find(s=>s.id===d.id&&s.type===d.type);return s?{...d,origin:s.origin,dir:s.dir}:d;});
 slots.push(...saved.slots.filter(s=>!fallback.slots.some(d=>d.id===s.id)).map(s=>({...s})));
 return slots.every(s=>validPlacement(s,slots,zone))?{v:1,slots}:fallback;
}

// unlockedRows is the persisted expansion count (legacy key retained).
// Approved room's central tatami cell, cropped by crop-room-tatami.py; original tile alpha retained.
export const FLOOR_ART={tatami:'assets/drive/tiles/floor-tatami-v3.png'}; // approved 타일_바닥_다다미_v3 (128x64 seamless), replaces the room crop
// Approved 벽_방벽_연장 왼쪽/오른쪽: 128x244, anchor = cell top vertex at (64,180).
export const WALL_EXT={left:'assets/drive/tiles/wall-ext-left.png',right:'assets/drive/tiles/wall-ext-right.png',anchor:[64,180]};
// User Task B 2026-10-15: first down-left (j), then down-right (i), alternating.
export function nextExpansion(zone,count){return count%2===0?{axis:'j',cells:Array.from({length:zone.cols},(_,i)=>[i,zone.rows])}:{axis:'i',cells:Array.from({length:zone.rows},(_,j)=>[zone.cols,j])};}
export function restoreSpace(saved){
 const unlockedRows=Number.isSafeInteger(saved?.unlockedRows)&&saved.unlockedRows>=0?saved.unlockedRows:0;
 return {unlockedRows,flooring:Object.hasOwn(FLOOR_ART,saved?.flooring)?saved.flooring:'tatami',floor2Unlocked:saved?.floor2Unlocked===true,themes:[...new Set([...CFG.themes.filter(t=>!t.locked).map(t=>t.id),...(Array.isArray(saved?.themes)?saved.themes.filter(id=>CFG.themes.some(t=>t.id===id)):[])])]};
}
export function zonesForSpace(space){const data=restoreSpace(space);return MAP.zones.map(z=>({...z,cols:z.cols+(z.floor===1?Math.floor(data.unlockedRows/2):0),rows:z.rows+(z.floor===1?Math.ceil(data.unlockedRows/2):0),flooring:data.flooring,locked:z.floor===2?!data.floor2Unlocked:z.locked}));}

// starting value 똑또기 2026-10-14, pending user batch confirm: one item per table cell, centred on that cell's table top,
// displayed at 35% of the cell width. offset = table-top point above the cell centre (image px; layout only).
export const TABLE_ITEM_LAYOUT={cellWidthFrac:.35,offset:[0,-25]}; // offset: table-top centre measured from furn-tea-table-v4 opaque top face (top vertex y36, half-width 56.5 => left/right vertices y≈68 => centre y≈68) minus anchor y93
export const tableItemSize=zone=>zone.cell.w*TABLE_ITEM_LAYOUT.cellWidthFrac;
// interior §17-5·17-6 floats (layout only, image px × map scale). Guests are invisible (CHAR_SPRITES.guest.file null), so the head
// is the foot cell centre + headOffset — starting value 2026-10-14, pending user confirm (replace with the sprite's head point when guest art lands).
// risePx: how far a float drifts up over CFG.feedback.floatSec; iconPx: drawn icon size (128-px 그림이 icons scaled down). Starting values 2026-10-14, pending user confirm.
export const FLOAT_LAYOUT={headOffset:[0,-90],risePx:40,iconPx:{coin:30,heart:30,angry:30},stagger:[-12,12]}; // starting value 2026-10-15, pending user confirm: all floats 30 CSS px; angry = coin size (user 2026-10-15: same size as the payment floats) · stagger: x offsets when coin+heart float together
// icon per float kind (그림이 UI icons, MAP.md); null = no art → the float event still runs but nothing is drawn
export const FLOAT_ICONS={coin:'assets/drive/ui/res-coin.png',heart:'assets/drive/ui/res-heart.png',angry:'assets/drive/ui/emo-angry.png'};
export function tableItemEntries(world){return (world?.custs||[]).filter(c=>c.phase==='seated'&&c.itemSlot&&c.order).map(c=>({tableItem:c,origin:c.itemSlot.cell,cells:[c.itemSlot.cell]}));}

// Float origin uses the exact zone view used by furniture (camera pan, expansion and scale included).
export function floatOrigin(f,view,zone=MAP.zones[0]){
 const p=cellToScreen(...f.cell,view,zone);
 return {x:p.x+FLOAT_LAYOUT.headOffset[0]*view.scale,y:p.y+FLOAT_LAYOUT.headOffset[1]*view.scale};
}

// starting value 2026-10-15, pending user confirm: opaque height ~150px, walk 8fps, table visit 3s.
export const MANAGER={height:150,fps:8,visitSec:3,anchor:[64,166]};
export function managerFrame(m){const names=['front-dr','front-dl','back-ul','back-ur'];const dir=names[m.facing||0];return 'assets/drive/chars/manager/manager-'+(m.phase==='walking'?'walk-'+dir+'-'+(Math.floor((m.anim||0)*MANAGER.fps)%4+1):'stand-'+(dir.endsWith('dl')||dir.endsWith('ul')?'dl':'dr'))+'.png';}
export function plateEdges(z){if(z.cols===MAP.zones[0].cols&&z.rows===MAP.zones[0].rows)return [];const edges=[];for(let j=0;j<z.rows-1;j++)edges.push({cell:[z.cols-1,j],part:'right'});for(let i=0;i<z.cols-1;i++)edges.push({cell:[i,z.rows-1],part:'left'});edges.push({cell:[z.cols-1,z.rows-1],part:'corner'});return edges;}

// Measured alpha bounding boxes of the unmodified approved frames.
export const MANAGER_OPAQUE_HEIGHT={"manager-stand-dl.png": 158, "manager-stand-dr.png": 158, "manager-walk-back-ur-1.png": 158, "manager-walk-back-ur-2.png": 157, "manager-walk-back-ur-3.png": 158, "manager-walk-back-ur-4.png": 158, "manager-walk-back-ul-1.png": 158, "manager-walk-back-ul-2.png": 157, "manager-walk-back-ul-3.png": 158, "manager-walk-back-ul-4.png": 158, "manager-walk-front-dl-1.png": 153, "manager-walk-front-dl-2.png": 152, "manager-walk-front-dl-3.png": 152, "manager-walk-front-dl-4.png": 154, "manager-walk-front-dr-1.png": 153, "manager-walk-front-dr-2.png": 152, "manager-walk-front-dr-3.png": 152, "manager-walk-front-dr-4.png": 154};
