import {drawThemeSet,SET_THEMES} from './decor.js';
import {loadHd} from './hd-assets.js';
import {t} from './i18n.js';
import {CFG} from './config.js';
import {preservesEntrance} from './navigation.js';
import {canWalk,walkFrame} from './walk-frames.js';
import {MAP,SPRITES,MAP_MARKERS,cellToImage,cellToScreen,footprintCentre,compareDepth,footprintCells,validPlacement,flipDir,rotateDir,spriteMirrored,spriteFor,wallEdge,zonesForSpace,CHAR_SPRITES,characterDepthEntries,tableItemEntries,tableItemSize,FLOAT_LAYOUT,floatOrigin,FLOAT_ICONS,FLOOR_ART,nextExpansion,PARTITION,MANAGER_OPAQUE_HEIGHT,MANAGER,managerFrame,plateEdges,WALL_EXT,activeEdges,edgeSegments,validEdge} from './map-data.js';
export {MAP,SPRITES,cellToImage,cellToScreen};
export function createIsoMap(canvas,{onChange=()=>{},onBlocked=()=>{},onEditChange=()=>{},onExpand=()=>{}}={}){
 const seenSakura=new Set();
 const ctx=canvas.getContext('2d'),images=new Map(),params=new URLSearchParams(location.search);
 let dragSprite=null;let edit=params.get('edit')==='1'||params.get('grid')==='1',scroll=0,panX=0,panBounds={minX:0,maxX:0},drag=null,last,selected=null,selectionBefore=null,selectionNew=false,hits=[],gridCells=0,maxScroll=0,markers=[],markerPhase=null,zoom=1;
 const bar=document.createElement('div');bar.hidden=true;bar.className='furniture-actions';bar.setAttribute('aria-label',t('edit.aria'));bar.setAttribute('data-i18n-attr','aria-label:edit.aria');
 bar.innerHTML=`<button data-furniture-cancel data-i18n="app.cancel">${t('app.cancel')}</button><button data-furniture-store data-i18n="edit.store">${t('edit.store')}</button><button data-furniture-rotate data-i18n="edit.rotate">${t('edit.rotate')}</button><button data-furniture-flip data-i18n="edit.flip">${t('edit.flip')}</button><button data-furniture-done data-i18n="app.ok">${t('app.ok')}</button><button data-furniture-save data-i18n="edit.save">${t('edit.save')}</button><button data-wall-add hidden data-i18n="edit.wallAdd">${t('edit.wallAdd')}</button><button data-edge-add="edge1" hidden data-i18n="edit.edgeAdd1">${t('edit.edgeAdd1')}</button><button data-edge-add="edge2" hidden data-i18n="edit.edgeAdd2">${t('edit.edgeAdd2')}</button><button data-edge-remove hidden data-i18n="edit.wallRemove">${t('edit.wallRemove')}</button>`;

 function syncBar(){bar.hidden=!edit;bar.classList.toggle('has-selection',!!selected);bar.classList.toggle('edge-selected',!!currentEdge());for(const button of bar.querySelectorAll('button'))button.disabled=button.hasAttribute('data-furniture-save')||button.hasAttribute('data-wall-add')||button.hasAttribute('data-edge-add')?false:!selected;
  // 17-7 가벽(선 따라): CFG.partitionWall.enabled일 때만 버튼이 보인다
  for(const button of bar.querySelectorAll('[data-edge-add],[data-edge-remove]'))button.hidden=!CFG.partitionWall.enabled;}
 const slots=()=>last?.[0].placement.slots||MAP.zones[0].slots;
 const current=()=>slots().find(s=>s.id===selected);
 const edges=()=>activeEdges(last?.[0].placement);
 const currentEdge=()=>edges().find(e=>e.id===selected);
 syncBar();
 const repaint=()=>{syncBar();last&&draw(...last);};
 function accept(candidate,zone){
  const before=slots(),after=[...before.filter(s=>s.id!==candidate.id),candidate];
  if(!preservesEntrance(zone,before,after,{edgesBefore:edges(),edgesAfter:edges()})){onBlocked(t('edit.entranceBlocked'));return false;}
  if(!validPlacement(candidate,before,zone)){onBlocked();return false;}return true;
 }
 // 가벽: 방 밖·겹침 → 일반 거부, 입구에서 닿던 칸·좌석·카운터를 막으면 입구 토스트(가구와 같은 기준)
 const edgeOk=(candidate,zone)=>validEdge(candidate,edges(),zone)&&preservesEntrance(zone,slots(),slots(),{edgesBefore:edges(),edgesAfter:[...edges().filter(e=>e.id!==candidate.id),candidate]});
 function acceptEdge(candidate,zone){
  if(!validEdge(candidate,edges(),zone)){onBlocked();return false;}
  if(!edgeOk(candidate,zone)){onBlocked(t('edit.entranceBlocked'));return false;}return true;
 }
 function placeEdge(type,cell,side){if(!CFG.partitionWall.enabled||!edit||!last)return false;if(Number.isFinite(CFG.partitionWall.count)&&edges().length>=CFG.partitionWall.count)return false;
  const candidate={id:'edge-'+crypto.randomUUID(),type,cell:[...cell],side,flip:false};
  if(!acceptEdge(candidate,zonesForSpace(last[0].space)[0]))return false;(last[0].placement.edges??=[]).push(candidate);selected=candidate.id;selectionBefore=null;selectionNew=true;onChange();repaint();return true;
 }
 // 버튼: 가구가 없는 바닥 칸 사이의 첫 빈 선에 놓고 고른다(옮기기는 끌어서)
 for(const button of bar.querySelectorAll('[data-edge-add]'))button.onclick=()=>{const type=button.dataset.edgeAdd,zone=zonesForSpace(last[0].space)[0],used=new Set(slots().flatMap(s=>footprintCells(s).map(c=>c.join(','))));
  for(let j=0;j<zone.rows;j++)for(let i=0;i<zone.cols;i++)for(const side of ['i','j']){const c={id:'edge-preview',type,cell:[i,j],side,flip:false};if(!edgeSegments(c).flat().some(p=>used.has(p.join(',')))&&edgeOk(c,zone)){placeEdge(type,c.cell,side);return;}}
  onBlocked(t('edit.entranceBlocked'));};
 bar.querySelector('[data-edge-remove]').onclick=()=>{const e=currentEdge();if(!e)return;cancelDrag();const list=last[0].placement.edges;list.splice(list.indexOf(e),1);selected=null;selectionBefore=null;selectionNew=false;onChange();repaint();};
 function placeWall(origin){if(!edit||!last)return false;if((last[0].wallOwned??PARTITION.count)<=slots().filter(x=>x.type==='wall').length)return false;const zone=zonesForSpace(last[0].space)[0];
  const candidate={id:'wall-'+crypto.randomUUID(),type:'wall',origin:[...origin],dir:0};
  if(!accept(candidate,zone))return false;slots().push(candidate);selected=candidate.id;selectionBefore=null;selectionNew=true;onChange();repaint();return true;
 }
 bar.querySelector('[data-wall-add]').onclick=()=>{const zone=zonesForSpace(last[0].space)[0];for(let j=0;j<zone.rows;j++)for(let i=0;i<zone.cols;i++){
  const c={id:'wall-preview',type:'wall',origin:[i,j],dir:0};if(validPlacement(c,slots(),zone)&&preservesEntrance(zone,slots(),[...slots(),c],{edgesBefore:edges(),edgesAfter:edges()})){placeWall(c.origin);return;}
 }onBlocked(t('edit.entranceBlocked'));};
 function orient(dir){const item=current();if(!item||drag?.item)return;const candidate={...item,dir};if(!accept(candidate,zonesForSpace(last[0].space)[0]))return;item.dir=dir;onChange();repaint();}
 // 가벽 뒤집기: flip 토글(앞/뒤 그림 자리 front/back). 막는 칸은 같지만 같은 검사를 거친다.
 function flipEdge(){const e=currentEdge();if(!e||drag?.edge)return;if(!acceptEdge({...e,flip:!e.flip},zonesForSpace(last[0].space)[0]))return;e.flip=!e.flip;onChange();repaint();}
 bar.querySelector('[data-furniture-flip]').onclick=()=>currentEdge()?flipEdge():current()&&orient(flipDir(current().dir));
 bar.querySelector('[data-furniture-rotate]').onclick=()=>current()&&orient(rotateDir(current().type,current().dir));
 bar.querySelector('[data-furniture-save]').onclick=()=>{selected=null;selectionBefore=null;edit=false;onChange();onEditChange(false);repaint();};
 bar.querySelector('[data-furniture-cancel]').onclick=()=>{cancelDrag();const e=currentEdge();if(e&&selectionNew)last[0].placement.edges.splice(last[0].placement.edges.indexOf(e),1);else if(e&&selectionBefore)Object.assign(e,selectionBefore);else if(current()&&selectionNew)slots().splice(slots().indexOf(current()),1);else if(current()&&selectionBefore)Object.assign(current(),selectionBefore);selected=null;selectionBefore=null;selectionNew=false;onChange();repaint();};
 bar.querySelector('[data-furniture-store]').onclick=()=>{const item=current();if(!item)return;if(item.type!=='wall'){const inv=last[0].furnitureInv??={};inv[item.type]=(inv[item.type]||0)+1;}slots().splice(slots().indexOf(item),1);selected=null;selectionBefore=null;onChange();repaint();};
 bar.querySelector('[data-furniture-done]').onclick=()=>{cancelDrag();selected=null;repaint();};
 // 가벽 선의 화면 끝점: [i,j]|[i+1,j] = 칸 오른쪽 꼭짓점→아래 꼭짓점, [i,j]|[i,j+1] = 아래 꼭짓점→왼쪽 꼭짓점
 const segPoints=([a,b],view,z)=>{const p=cellToScreen(...a,view,z),hw=z.cell.w*view.scale/2,hh=z.cell.h*view.scale/2,bottom={x:p.x,y:p.y+hh};return b[0]>a[0]?[{x:p.x+hw,y:p.y},bottom]:[bottom,{x:p.x-hw,y:p.y}];};
 const edgeCentre=(e,view,z)=>{const ends=edgeSegments(e).flatMap(seg=>segPoints(seg,view,z));return {x:ends.reduce((n,p)=>n+p.x,0)/ends.length,y:ends.reduce((n,p)=>n+p.y,0)/ends.length};};
 const edgeArt=e=>CFG.partitionWall.types[e.type]?.art?.[e.flip?'back':'front'];
 const load=path=>{if(!images.has(path)){const im=loadHd(path,()=>last&&draw(...last));images.set(path,im);}return images.get(path);};
 MAP.zones.forEach(z=>{if(z.image)load(z.image);z.slots.forEach(s=>load(SPRITES[s.type].file));});
 function draw(state,world){
  last=[state,world];for(const theme of SET_THEMES)canvas.dataset[theme+'Zones']="";if(!edit||!selected){delete canvas.dataset.placementValid;if(bar.dataset)delete bar.dataset.valid;}hits=[];gridCells=0;markers=[];dragSprite=null;delete canvas.dataset.dragSprite;const W=canvas.clientWidth,H=canvas.clientHeight,dpr=devicePixelRatio||1;
  if(canvas.width!==Math.round(W*dpr)||canvas.height!==Math.round(H*dpr)){canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#202224';ctx.fillRect(0,0,W,H);
  const zones=zonesForSpace(state.space).filter(z=>z.floor===(state.cafe.floor===2&&state.space.floor2Unlocked?2:1));
  // Include the whole outside row, including its leftmost diamond.
  // Scale from the base room (+ its outside row) only, so unlocked rows grow the map vertically (scroll) instead of shrinking it.
  const minX=Math.min(0,...MAP.zones.filter(z=>z.floor===1).map(z=>cellToImage(0,z.rows+(z.expansionRowOffset||0),z).x-z.cell.w/2));
  const worldWidth=861-minX,scale=(W-12)/worldWidth*zoom;
  const heights=zones.map(z=>Math.max(615,z.origin.y+(z.cols+z.rows+2)*z.cell.h/2+MAP_MARKERS.expansion.anchor[1])*scale);
  const total=heights.reduce((a,b)=>a+b,0)+Math.max(0,zones.length-1)*24;
  const baseX=(W-worldWidth*scale)/2-minX*scale;
  const extents=zones.flatMap(z=>[[0,0],[z.cols,0],[0,z.rows],[z.cols,z.rows]].map(c=>cellToImage(...c,z)));
  const left=Math.min(0,...extents.map(p=>p.x-MAP.zones[0].cell.w/2));
  const right=Math.max(861,...extents.map(p=>p.x+MAP.zones[0].cell.w/2));
  panBounds={minX:Math.min(0,baseX+left*scale),maxX:Math.max(0,baseX+right*scale-W)};
  panX=Math.max(panBounds.minX,Math.min(panX,panBounds.maxX));
  maxScroll=Math.max(0,total-H);scroll=Math.max(0,Math.min(scroll,maxScroll));
  let y=Math.max(0,(H-total)/2)-scroll;
  zones.forEach((z,index)=>{
   const view={x:baseX-panX,y:y+(z.screenOffset?.y||0)*scale,scale};const placed=z.id==='A'?state.placement.slots:z.slots;
   if(z.image){const glow=ctx.createRadialGradient(W/2,y+heights[index]*.84,0,W/2,y+heights[index]*.84,W*.55);
   glow.addColorStop(0,'#b9854540');glow.addColorStop(1,'#b9854500');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);}
   const stamp=(file,p,anchor)=>{const im=load(file);if(im.complete&&im.naturalWidth)ctx.drawImage(im,p.x-anchor[0]*scale,p.y-anchor[1]*scale,im.naturalWidth*scale,im.naturalHeight*scale);};
   // Cover the viewport with exact isometric cells, before the room image.
   if(z.floor===1){const grass=load('assets/drive/tile-grass-outside.png');if(grass.complete&&grass.naturalWidth){
    const corners=[[0,0],[W,0],[0,H],[W,H]].map(([x,y])=>{const dx=(x-view.x)/scale-z.origin.x,dy=(y-view.y)/scale-z.origin.y-z.cell.h/2;return [dy/z.cell.h+dx/z.cell.w,dy/z.cell.h-dx/z.cell.w];});
    const lo=k=>Math.floor(Math.min(...corners.map(c=>c[k])))-1,hi=k=>Math.ceil(Math.max(...corners.map(c=>c[k])))+1;
    for(let i=lo(0);i<=hi(0);i++)for(let j=lo(1);j<=hi(1);j++){if(i>=0&&j>=0&&i<z.cols&&j<z.rows)continue;const p=cellToScreen(i,j,view,z);ctx.drawImage(grass,p.x-64*scale,p.y-32*scale,128*scale,64*scale);}
   }}
   const roomFile=z.floor===1&&state.space.unlockedRows>0?'assets/drive/tiles/room-merged-'+(z.cols>MAP.zones[0].cols?'ij':'j')+'.png':z.image;
   const room=roomFile?load(roomFile):null;if(room?.complete&&room.naturalWidth)ctx.drawImage(room,view.x,view.y,room.naturalWidth*scale,room.naturalHeight*scale);
   // Transparent full-room layers share the approved room canvas coordinates.
   if(z.floor===1)for(const layer of ['floor','wall']){
    const item=CFG.decor.roomLayers.find(it=>it.layer===layer&&it.id===state.space.roomLayers?.[layer]);
    if(item?.art){const im=load(item.art);if(im.complete&&im.naturalWidth)ctx.drawImage(im,view.x,view.y,im.naturalWidth*scale,im.naturalHeight*scale);}
   }
   if(z.floor===1){
    // Approved floor bitmaps replace the grass in every newly owned cell.
    const floor=load(FLOOR_ART[z.flooring]);
    if(floor.complete&&floor.naturalWidth)for(let j=0;j<z.rows;j++)for(let i=0;i<z.cols;i++){
     if(i<MAP.zones[0].cols&&j<MAP.zones[0].rows)continue;
     const p=cellToScreen(i,j,view,z);ctx.drawImage(floor,p.x-z.cell.w*scale/2,p.y-z.cell.h*scale/2,z.cell.w*scale,z.cell.h*scale);
    }
    // Approved 벽_방벽_연장 pieces (128x244, cell top vertex at (64,180)), one per expanded row/column along the two rear edges.
    for(const [axis,count,base] of [['i',z.cols,MAP.zones[0].cols],['j',z.rows,MAP.zones[0].rows]]){
     const im=load(WALL_EXT[axis==='i'?'right':'left']);
     if(im.complete&&im.naturalWidth)for(let n=base;n<count;n++){
      const p=cellToScreen(...(axis==='i'?[n,0]:[0,n]),view,z),top={x:p.x,y:p.y-z.cell.h*scale/2};
      ctx.drawImage(im,top.x-WALL_EXT.anchor[0]*scale,top.y-WALL_EXT.anchor[1]*scale,im.naturalWidth*scale,im.naturalHeight*scale);
     }
    }
    // 똑또기 10-15 결정: 땅 넓히기 '+' 표시는 가구 편집 모드에서 숨김
    if(!edit&&!(Number.isFinite(CFG.expansion.maxSteps)&&state.space.unlockedRows>=CFG.expansion.maxSteps)){
    const strip=nextExpansion(z,state.space.unlockedRows),centre=strip.cells.reduce((p,c)=>p.map((v,k)=>v+c[k]/strip.cells.length),[0,0]);
    const p=cellToScreen(...centre,view,z),meta=MAP_MARKERS.expansion,im=load(meta.file);
    const bp=CFG.expansion.markerBounce,ph=markerPhase??((performance.now()/1000)%bp.periodSec)/bp.periodSec; // gentle bounce (starting values)
    const ms=Math.max(scale,CFG.expansion.markerMinScale)*(bp.minScale+(bp.maxScale-bp.minScale)*Math.sin(Math.PI*ph)); // marker never drawn smaller than markerMinScale (starting value)
    if(im.complete&&im.naturalWidth)ctx.drawImage(im,p.x-meta.anchor[0]*ms,p.y-meta.anchor[1]*ms,im.naturalWidth*ms,im.naturalHeight*ms);
    markers.push({kind:'row',axis:strip.axis,cells:strip.cells,...p,buttonX:p.x,buttonY:p.y-32*ms,
     x0:p.x-meta.anchor[0]*ms,y0:p.y-meta.anchor[1]*ms,w:im.naturalWidth*ms,h:im.naturalHeight*ms});
    }
   }
   if(edit&&z.image){const occupied=new Set(placed.flatMap(s=>footprintCells(s).map(c=>c.join(','))));
    for(let r=0;r<z.rows;r++)for(let c=0;c<z.cols;c++){
     ctx.strokeStyle=occupied.has(`${c},${r}`)?'#ffd36b':'#7de7ffb0';ctx.lineWidth=occupied.has(`${c},${r}`)?1.5:.8;
     gridCells++;const p=cellToScreen(c,r,view,z),hw=z.cell.w*scale/2,hh=z.cell.h*scale/2;
     ctx.beginPath();ctx.moveTo(p.x,p.y-hh);ctx.lineTo(p.x+hw,p.y);ctx.lineTo(p.x,p.y+hh);ctx.lineTo(p.x-hw,p.y);ctx.closePath();if(occupied.has(`${c},${r}`)){ctx.fillStyle="rgba(30,215,80,.35)";ctx.fill();}ctx.stroke();
    }
   }
   for(const edge of plateEdges(z)){const p=cellToScreen(...edge.cell,view,z);stamp('assets/drive/tiles/plate-edge-'+edge.part+'.png',{x:p.x,y:p.y-z.cell.h*scale/2},[64,0]);}
   const zoneEdges=z.id==='A'?activeEdges(state.placement).map(e=>drag?.edge===e.id?{...e,cell:drag.candidate}:e):[];
   [...placed,...(z.id==='A'?[...characterDepthEntries(world),...tableItemEntries(world),...zoneEdges.filter(e=>edgeArt(e)?.file).map(e=>({edgeItem:e,cells:edgeSegments(e).flat()}))]:[])].map(s=>drag?.item&&drag.item===s.id?{...s,origin:drag.candidate}:s).sort(compareDepth).forEach(s=>{
    // 가벽 그림(CFG.partitionWall.types[type].art.front/back)이 있을 때만 그린다. 기준점 = 가벽 선 가운데.
    if(s.edgeItem){const art=edgeArt(s.edgeItem),p=edgeCentre(s.edgeItem,view,z),im=load(art.file),k=scale*(art.scale||1);if(im.complete&&im.naturalWidth)ctx.drawImage(im,p.x-art.anchor[0]*k,p.y-art.anchor[1]*k,im.naturalWidth*k,im.naturalHeight*k);return;}
    if(s.tableItem){const c=s.tableItem,p=cellToScreen(...s.origin,view,z),im=load('assets/drive/'+c.order.img),size=tableItemSize(z);if(im.complete&&im.naturalWidth){const fit=size/Math.max(im.naturalWidth,im.naturalHeight)*scale;ctx.drawImage(im,p.x+c.itemSlot.offset[0]*scale-im.naturalWidth*fit/2,p.y+c.itemSlot.offset[1]*scale-im.naturalHeight*fit,im.naturalWidth*fit,im.naturalHeight*fit);}return;}
    if(s.character?.role==='manager'){const m=s.character,im=load(managerFrame(m)),p=cellToScreen(...s.origin,view,z);if(im.complete&&im.naturalWidth){const fit=MANAGER.height*CFG.people.scale*(CFG.people.withMapScale?scale:1)/MANAGER_OPAQUE_HEIGHT[managerFrame(m).split('/').at(-1)];ctx.drawImage(im,p.x-MANAGER.anchor[0]*fit,p.y-MANAGER.anchor[1]*fit,im.naturalWidth*fit,im.naturalHeight*fit);}return;}
    // 이동 규칙(10-15): 걷기 프레임이 있는 시바는 프레임을 넘기며 그린다(걷는 중 8fps, 서 있으면 1번 프레임). 없으면 아래 기존 규칙(그림 없음 → 안 그림).
    if(s.character&&!s.character.kind&&s.character.role!=='manager'){const breed=state.shibas?.find(o=>o.id===s.character.id)?.breed;if(canWalk('shiba',breed)){const c=s.character,dirs=['front-dr','front-dl','back-ul','back-ur'],moving=c.state==='walk'||c.phase==='approach',n=moving?1+Math.floor(performance.now()/125)%(CFG.characters.frameCount||4):1,im=load(walkFrame('shiba',breed,dirs[c.facing||0],n)),p=cellToScreen(...s.origin,view,z);
     if(im.complete&&im.naturalWidth){const k=scale*(CFG.characters.shibaScale||1),A=CFG.characters.shibaAnchor||CHAR_SPRITES.shiba.byBreed?.[breed]?.anchor||[im.naturalWidth/2,im.naturalHeight];ctx.drawImage(im,p.x-A[0]*k,p.y-A[1]*k,im.naturalWidth*k,im.naturalHeight*k);}return;}}
    if(s.character){let meta=CHAR_SPRITES[s.character.role==='manager'?'manager':s.character.kind?'guest':'shiba'];if(!s.character.kind&&s.character.role!=='manager'){const b=state.shibas?.find(o=>o.id===s.character.id)?.breed;meta=meta.byBreed?.[b]||meta;}if(meta.file&&meta.anchor)stamp(meta.file,cellToScreen(...s.origin,view,z),meta.anchor);return;}
    const base=SPRITES[s.type];if(!base)return;
    if(!base.file){if(edit){const p=cellToScreen(...s.origin,view,z);hits.push({id:s.id,x:p.x-z.cell.w*scale/2,y:p.y-z.cell.h*scale/2,w:z.cell.w*scale,h:z.cell.h*scale,footprint:true,view,zone:z});}return;}const sprite=spriteFor(s.type,s.dir);if(!sprite)return;
    const im=load(sprite.file),p=cellToScreen(...footprintCentre(s),view,z),spriteScale=scale*sprite.scale;
    if(drag?.item===s.id)dragSprite={s,sprite,view,z};
    if(im.complete&&im.naturalWidth){
     // starting value 2026-10-15, pending user confirm: contact midpoint on the matching cell edge (dir 2·3 = opposite edge).
     if(s.type==='wall'){const [ex,ey]=wallEdge(s.dir);p.x+=ex*z.cell.w*scale/4;p.y+=ey*z.cell.h*scale/4;}
     const mirrored=spriteMirrored(s.type,s.dir,sprite),ax=mirrored?im.naturalWidth-sprite.anchor[0]:sprite.anchor[0];
     const x=p.x-ax*spriteScale,y=p.y-sprite.anchor[1]*spriteScale,w=im.naturalWidth*spriteScale,h=im.naturalHeight*spriteScale;
     ctx.save();if(mirrored){ctx.translate(x+w,y);ctx.scale(-1,1);ctx.drawImage(im,0,0,w,h);}else ctx.drawImage(im,x,y,w,h);ctx.restore();
     hits.push({id:s.id,x,y,w,h,im,mirrored,view,zone:z});
    }
   });
   for(const theme of SET_THEMES){
    const active=drawThemeSet(ctx,{slots:placed.map(it=>({...it,zone:it.zone||z.id})),zone:z,view,cellToScreen,time:performance.now(),reducedMotion:globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false},theme);
    if(active)canvas.dataset[theme+'Zones']+=z.id+" ";
    const key=theme+':'+z.id;
    if(active&&!seenSakura.has(key)){seenSakura.add(key);const label=document.createElement('div');label.className='sakura-set-label '+theme+'-set-label';label.textContent=t('furn.'+theme+'Set');canvas.parentElement.append(label);setTimeout(()=>label.remove(),3500);}
    if(!active)seenSakura.delete(key);
   }
   if(z.id==='A'){
    for(const c of (world.custs||[]).filter(c=>c.phase==='seated'&&c.request&&!c.fulfilled)){
     const p=cellToScreen(...c.cell,view,z),im=load('assets/drive/request-bubble-empty_512.png');
     if(im.complete&&im.naturalWidth){const size=36;ctx.drawImage(im,p.x-size/2,p.y-size-18,size,size);}
     const icon=load(c.request.type==='meetShiba'?'assets/drive/request-icon-shiba_256.png':'assets/drive/request-icon-trick_256.png');
     if(icon.complete&&icon.naturalWidth)ctx.drawImage(icon,p.x-10,p.y-46,20,20);
    }
    // §17-5·17-6: icon floats rise from the guest's head and fade (age advanced by main.js); kinds with a null icon draw nothing
    for(const f of world.floats||[]){const file=FLOAT_ICONS[f.kind];if(!file||!f.cell)continue;const im=load(file);if(!(im.complete&&im.naturalWidth))continue;
     const k=Math.min(1,Math.max(0,f.age/f.dur)),p=floatOrigin(f,view,z),size=FLOAT_LAYOUT.iconPx[f.kind],F=FLOAT_LAYOUT;
     const x=p.x+(f.dx||0)*scale,y=p.y-F.risePx*scale*k;
     ctx.save();ctx.globalAlpha=k<.4?1:1-(k-.4)/.6;ctx.drawImage(im,x-size/2,y-size,size,size);ctx.restore();}
   }
   if(z.floor===1&&!state.space.floor2Unlocked){
    const stairs=placed.find(s=>s.type==='stairs');
    if(stairs){const p=cellToScreen(...footprintCentre(stairs),view,z);p.y-=(SPRITES.stairs.anchor[1]+36)*scale;
     stamp(MAP_MARKERS.floor2.file,p,MAP_MARKERS.floor2.anchor);markers.push({kind:'floor2',...p});}
   }
   if(edit&&selected){const item=placed.find(s=>s.id===selected);if(item){const candidate=drag?.item===item.id?{...item,origin:drag.candidate}:item;
    const valid=validPlacement(candidate,placed,z)&&preservesEntrance(z,placed,[...placed.filter(p=>p.id!==candidate.id),candidate],{edgesBefore:edges(),edgesAfter:edges()});canvas.dataset.placementValid=String(valid);if(bar.dataset)bar.dataset.valid=String(valid);ctx.fillStyle=valid?'rgba(30,215,80,.55)':'rgba(235,55,55,.32)';ctx.strokeStyle=valid?'#16e05a':'#ff4545';
    const centre=cellToScreen(...footprintCentre(candidate),view,z);// 17-12: 둥근 버튼 고리(가로 106·위 84·아래 106px)가 화면 밖으로 나가지 않게 가운데를 당긴다
    const ringX=Math.min(Math.max(centre.x,106),Math.max(106,W-106)),ringY=Math.min(Math.max(centre.y,84),Math.max(84,H-106));bar.style.setProperty('--select-x',ringX+'px');bar.style.setProperty('--select-y',ringY+'px');ctx.lineWidth=2;
    for(const [i,j] of footprintCells(candidate)){const p=cellToScreen(i,j,view,z),hw=z.cell.w*scale/2,hh=z.cell.h*scale/2;
     ctx.beginPath();ctx.moveTo(p.x,p.y-hh);ctx.lineTo(p.x+hw,p.y);ctx.lineTo(p.x,p.y+hh);ctx.lineTo(p.x-hw,p.y);ctx.closePath();ctx.fill();ctx.stroke();}

    // 똑또기 10-15: 끄는 중에는 가구 그림을 칸 위에 다시 그려 그림이 칸을 따라 보이게 한다
    if(dragSprite&&dragSprite.s.id===item.id){const {sprite,view:v,z:zz}=dragSprite,im=load(sprite.file),p=cellToScreen(...footprintCentre(candidate),v,zz),ss=scale*sprite.scale;
     if(im.complete&&im.naturalWidth){const m=spriteMirrored(candidate.type,candidate.dir,sprite),ax=m?im.naturalWidth-sprite.anchor[0]:sprite.anchor[0],x=p.x-ax*ss,y=p.y-sprite.anchor[1]*ss,w=im.naturalWidth*ss,h=im.naturalHeight*ss;
      ctx.save();ctx.globalAlpha=.92;if(m){ctx.translate(x+w,y);ctx.scale(-1,1);ctx.drawImage(im,0,0,w,h);}else ctx.drawImage(im,x,y,w,h);ctx.restore();canvas.dataset.dragSprite=item.id;}}
   }}
   // 17-7 가벽(선 따라): 편집 모드에서만 칸 경계선을 얇게 강조(그림 대체 도형 없음). 고른 가벽은 초록/빨강 굵은 선 + 둘레 버튼.
   if(edit&&z.id==='A')for(const e of zoneEdges){const chosen=e.id===selected,valid=chosen?edgeOk(e,z):true;
    ctx.save();ctx.lineCap='round';ctx.lineWidth=chosen?4:2.5;ctx.strokeStyle=!chosen?'#ffd36b':valid?'#16e05a':'#ff4545';
    for(const [a,b] of edgeSegments(e).map(seg=>segPoints(seg,view,z))){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}ctx.restore();
    const ends=edgeSegments(e).flatMap(seg=>segPoints(seg,view,z)),xs=ends.map(p=>p.x),ys=ends.map(p=>p.y),pad=12;
    hits.push({id:e.id,edge:true,segs:edgeSegments(e).map(seg=>segPoints(seg,view,z)),x:Math.min(...xs)-pad,y:Math.min(...ys)-pad,w:Math.max(...xs)-Math.min(...xs)+pad*2,h:Math.max(...ys)-Math.min(...ys)+pad*2,view,zone:z});
    if(chosen){canvas.dataset.placementValid=String(valid);bar.dataset&&(bar.dataset.valid=String(valid));const c=edgeCentre(e,view,z);
     bar.style.setProperty('--select-x',Math.min(Math.max(c.x,106),Math.max(106,W-106))+'px');bar.style.setProperty('--select-y',Math.min(Math.max(c.y,84),Math.max(84,H-106))+'px');}
   }
   y+=heights[index]+24;
  });
 }
 // Pinch zoom (two pointers) and ctrl/⌘+wheel zoom; clamp CFG.view.zoomMin..zoomMax (starting values).
 const touches=new Map();let pinch=null;
 const setZoom=(z,cx=canvas.clientWidth/2,cy=canvas.clientHeight/2)=>{const nz=Math.max(CFG.view.zoomMin,Math.min(CFG.view.zoomMax,z)),k=nz/zoom;if(k===1)return;panX=panX*k+(cx-canvas.clientWidth/2)*(k-1);scroll=scroll*k+(cy-canvas.clientHeight/2)*(k-1);zoom=nz;repaint();};
 const tp=()=>[...touches.values()],dist=()=>{const [a,b]=tp();return Math.hypot(a.x-b.x,a.y-b.y);},mid=()=>{const [a,b]=tp();return {x:(a.x+b.x)/2,y:(a.y+b.y)/2};};
 canvas.addEventListener('pointerdown',e=>{touches.set(e.pointerId,point(e));if(touches.size===2){cancelDrag();pinch={d0:dist(),z0:zoom};}},{capture:true});
 canvas.addEventListener('pointermove',e=>{if(!touches.has(e.pointerId))return;touches.set(e.pointerId,point(e));if(pinch&&touches.size===2){const m=mid();setZoom(pinch.z0*dist()/Math.max(1,pinch.d0),m.x,m.y);e.stopImmediatePropagation();}},{capture:true});
 const lift=e=>{touches.delete(e.pointerId);if(touches.size<2)pinch=null;};canvas.addEventListener('pointerup',lift,{capture:true});canvas.addEventListener('pointercancel',lift,{capture:true});
 canvas.addEventListener('wheel',e=>{e.preventDefault();if(e.ctrlKey||e.metaKey){const p=point(e);setZoom(zoom*Math.exp(-e.deltaY/200),p.x,p.y);return;}scroll+=e.deltaY;panX+=e.deltaX;last&&draw(...last);},{passive:false});
 // Alpha hit testing uses an offscreen copy only; rendered sprites remain unmodified.
 const masks=new Map();
 function opaque(hit,x,y){if(hit.edge)return hit.segs.some(([a,b])=>{const dx=b.x-a.x,dy=b.y-a.y,k=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(a.x+dx*k-x,a.y+dy*k-y)<=12;});if(hit.footprint)return Math.abs((x-hit.x-hit.w/2)/(hit.w/2))+Math.abs((y-hit.y-hit.h/2)/(hit.h/2))<=1;let mask=masks.get(hit.im);if(!mask){const c=document.createElement('canvas');c.width=hit.im.naturalWidth;c.height=hit.im.naturalHeight;const m=c.getContext('2d',{willReadFrequently:true});m.drawImage(hit.im,0,0,c.width,c.height);try{mask=m.getImageData(0,0,c.width,c.height);masks.set(hit.im,mask);}catch{return true;}}
  let px=Math.floor((x-hit.x)/hit.w*mask.width),py=Math.floor((y-hit.y)/hit.h*mask.height);if(hit.mirrored)px=mask.width-1-px;return mask.data[(py*mask.width+px)*4+3]>0;
 }
 const point=e=>{const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};
 const cell=(p,view,z)=>{const x=(p.x-view.x)/view.scale-z.origin.x,y=(p.y-view.y)/view.scale-z.origin.y-z.cell.h/2;return [y/z.cell.h+x/z.cell.w,y/z.cell.h-x/z.cell.w];};
 function cancelDrag(){drag=null;}
 canvas.addEventListener('pointerdown',e=>{
  if(e.button!==0||drag)return;const p=point(e);
  const marker=markers.find(m=>m.kind==='row'&&p.x>=m.x0&&p.x<m.x0+m.w&&p.y>=m.y0&&p.y<m.y0+m.h&&opaque({im:images.get(MAP_MARKERS.expansion.file),x:m.x0,y:m.y0,w:m.w,h:m.h},p.x,p.y));
  if(marker)drag={pointerId:e.pointerId,marker:true,start:p,scrollY:e.clientY,scrollX:e.clientX};
  if(edit&&!drag){const hit=[...hits].reverse().sort((a,b)=>Number(Boolean(b.edge))-Number(Boolean(a.edge))||Number(Boolean(b.footprint))-Number(Boolean(a.footprint))).find(h=>p.x>=h.x&&p.x<h.x+h.w&&p.y>=h.y&&p.y<h.y+h.h&&opaque(h,p.x,p.y));const previous=selected;selected=hit?.id||null;if(selected!==previous){selectionNew=false;selectionBefore=currentEdge()?{...currentEdge(),cell:[...currentEdge().cell]}:current()?{...current(),origin:[...current().origin]}:null;}
   if(hit?.edge){const it=currentEdge();drag={pointerId:e.pointerId,edge:it.id,start:cell(p,hit.view,hit.zone),origin:[...it.cell],candidate:[...it.cell],view:hit.view,zone:hit.zone};}
   else if(hit){const item=current();drag={pointerId:e.pointerId,item:item.id,start:cell(p,hit.view,hit.zone),origin:[...item.origin],candidate:[...item.origin],view:hit.view,zone:hit.zone};}
  }
  if(!drag)drag={pointerId:e.pointerId,scrollY:e.clientY,scrollX:e.clientX};
  canvas.setPointerCapture(e.pointerId);repaint();
 });
 canvas.addEventListener('pointermove',e=>{if(!drag||drag.pointerId!==e.pointerId)return;
  if(drag.marker&&Math.hypot(point(e).x-drag.start.x,point(e).y-drag.start.y)>=8)drag.moved=true;
  if(drag.item||drag.edge){const c=cell(point(e),drag.view,drag.zone);drag.candidate=drag.origin.map((n,i)=>n+Math.round(c[i]-drag.start[i]));}
  else {scroll+=drag.scrollY-e.clientY;panX+=drag.scrollX-e.clientX;drag.scrollY=e.clientY;drag.scrollX=e.clientX;}repaint();
 });
 canvas.addEventListener('pointerup',e=>{if(!drag||drag.pointerId!==e.pointerId)return;if(drag.marker&&!drag.moved&&Math.hypot(point(e).x-drag.start.x,point(e).y-drag.start.y)<8)onExpand();if(drag?.item){const item=current(),candidate={...item,origin:drag.candidate};if(accept(candidate,drag.zone)){item.origin=[...drag.candidate];onChange();}}
  if(drag?.edge){const it=currentEdge();if(it&&drag.candidate.join()!==it.cell.join()&&acceptEdge({...it,cell:drag.candidate},drag.zone)){it.cell=[...drag.candidate];onChange();}}cancelDrag();repaint();});
 canvas.addEventListener('pointercancel',e=>{if(drag?.pointerId===e.pointerId){cancelDrag();repaint();}});
 canvas.addEventListener('lostpointercapture',()=>{cancelDrag();repaint();});
 new ResizeObserver(()=>last&&draw(...last)).observe(canvas);
 return {draw,placeWall,placeEdge,actions:bar,get selected(){return selected;},get gridCells(){return gridCells;},get hits(){return hits.map(({im,...h})=>h);},get edit(){return edit;},setEdit(value){cancelDrag();edit=Boolean(value);if(!edit)selected=null;onEditChange(edit);repaint();},get panX(){return panX;},get panBounds(){return {...panBounds};},panTo(x,y=scroll){panX=x;scroll=y;repaint();},get scroll(){return scroll;},get maxScroll(){return maxScroll;},get markers(){return markers;},scrollTo(value){scroll=value;repaint();},setMarkerPhase(v){markerPhase=v;repaint();},get zoom(){return zoom;},setZoom(z){setZoom(z);},easeBy(dx,dy,ms=CFG.expansion.cameraEaseMs){const sx=panX,sy=scroll,t0=performance.now();const step=t=>{const k=Math.min(1,(t-t0)/Math.max(1,ms)),e=1-(1-k)**3;panX=sx+dx*e;scroll=sy+dy*e;repaint();if(k<1)requestAnimationFrame(step);};requestAnimationFrame(step);}};
}
