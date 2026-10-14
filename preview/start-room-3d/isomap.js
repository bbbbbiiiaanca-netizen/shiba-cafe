import {preservesEntrance} from './navigation.js';
import {MAP,SPRITES,MAP_MARKERS,cellToImage,cellToScreen,footprintCentre,compareDepth,footprintCells,validPlacement,flipDir,rotateDir,zonesForSpace,CHAR_SPRITES,characterDepthEntries,tableItemEntries,tableItemSize,FLOAT_LAYOUT,floatOrigin,FLOAT_ICONS,FLOOR_ART,nextExpansion,PARTITION,MANAGER_OPAQUE_HEIGHT,MANAGER,managerFrame,plateEdges} from './map-data.js';
export {MAP,SPRITES,cellToImage,cellToScreen};
export function createIsoMap(canvas,{onChange=()=>{},onBlocked=()=>{},onEditChange=()=>{},onExpand=()=>{}}={}){
 const ctx=canvas.getContext('2d'),images=new Map(),params=new URLSearchParams(location.search);
 let edit=params.get('edit')==='1'||params.get('grid')==='1',scroll=0,panX=0,panBounds={minX:0,maxX:0},drag=null,last,selected=null,hits=[],gridCells=0,maxScroll=0,markers=[];
 const bar=document.createElement('div');bar.hidden=true;bar.className='furniture-actions';bar.setAttribute('aria-label','가구 편집');
 bar.innerHTML='<button data-furniture-flip>좌우 반전</button><button data-furniture-rotate>회전</button><button data-wall-add hidden>가벽 배치</button><button data-wall-remove>가벽 제거</button><button data-furniture-done>완료/선택 해제</button>';
 function syncBar(){bar.hidden=!edit;for(const button of bar.querySelectorAll('button'))button.disabled=button.hasAttribute('data-wall-add')?false:button.hasAttribute('data-wall-remove')?current()?.type!=='wall':!selected;}
 const slots=()=>last?.[0].placement.slots||MAP.zones[0].slots;
 const current=()=>slots().find(s=>s.id===selected);
 syncBar();
 const repaint=()=>{syncBar();last&&draw(...last);};
 function accept(candidate,zone){
  const before=slots(),after=[...before.filter(s=>s.id!==candidate.id),candidate];
  if(!preservesEntrance(zone,before,after)){onBlocked('입구가 막혔어요!');return false;}
  if(!validPlacement(candidate,before,zone)){onBlocked();return false;}return true;
 }
 function placeWall(origin){if(!edit||!last)return false;if((last[0].wallOwned??PARTITION.count)<=slots().filter(x=>x.type==='wall').length)return false;const zone=zonesForSpace(last[0].space)[0];
  const candidate={id:'wall-'+crypto.randomUUID(),type:'wall',origin:[...origin],dir:0};
  if(!accept(candidate,zone))return false;slots().push(candidate);selected=candidate.id;onChange();repaint();return true;
 }
 bar.querySelector('[data-wall-add]').onclick=()=>{const zone=zonesForSpace(last[0].space)[0];for(let j=0;j<zone.rows;j++)for(let i=0;i<zone.cols;i++){
  const c={id:'wall-preview',type:'wall',origin:[i,j],dir:0};if(validPlacement(c,slots(),zone)&&preservesEntrance(zone,slots(),[...slots(),c])){placeWall(c.origin);return;}
 }onBlocked('입구가 막혔어요!');};
 bar.querySelector('[data-wall-remove]').onclick=()=>{const item=current();if(item?.type!=='wall')return;slots().splice(slots().indexOf(item),1);selected=null;onChange();repaint();};
 function orient(dir){const item=current();if(!item||drag?.item)return;const candidate={...item,dir};if(!accept(candidate,zonesForSpace(last[0].space)[0]))return;item.dir=dir;onChange();repaint();}
 bar.querySelector('[data-furniture-flip]').onclick=()=>current()&&orient(flipDir(current().dir));
 bar.querySelector('[data-furniture-rotate]').onclick=()=>current()&&orient(rotateDir(current().type,current().dir));
 bar.querySelector('[data-furniture-done]').onclick=()=>{cancelDrag();selected=null;repaint();};
 const load=path=>{if(!images.has(path)){const im=new Image();im.onload=()=>last&&draw(...last);im.src=path;images.set(path,im);}return images.get(path);};
 MAP.zones.forEach(z=>{if(z.image)load(z.image);z.slots.forEach(s=>load(SPRITES[s.type].file));});
 function draw(state,world){
  last=[state,world];hits=[];gridCells=0;markers=[];const W=canvas.clientWidth,H=canvas.clientHeight,dpr=devicePixelRatio||1;
  if(canvas.width!==Math.round(W*dpr)||canvas.height!==Math.round(H*dpr)){canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#202224';ctx.fillRect(0,0,W,H);
  const zones=zonesForSpace(state.space).filter(z=>z.floor===(state.cafe.floor===2&&state.space.floor2Unlocked?2:1));
  // Include the whole outside row, including its leftmost diamond.
  // Scale from the base room (+ its outside row) only, so unlocked rows grow the map vertically (scroll) instead of shrinking it.
  const minX=Math.min(0,...MAP.zones.filter(z=>z.floor===1).map(z=>cellToImage(0,z.rows+(z.expansionRowOffset||0),z).x-z.cell.w/2));
  const worldWidth=861-minX,scale=(W-12)/worldWidth;
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
   const room=z.image?load(z.image):null;if(room?.complete&&room.naturalWidth)ctx.drawImage(room,view.x,view.y,room.naturalWidth*scale,room.naturalHeight*scale);
   if(z.floor===1){
    // Approved floor bitmaps replace the grass in every newly owned cell.
    const floor=load(FLOOR_ART[z.flooring]);
    if(floor.complete&&floor.naturalWidth)for(let j=0;j<z.rows;j++)for(let i=0;i<z.cols;i++){
     if(i<MAP.zones[0].cols&&j<MAP.zones[0].rows)continue;
     const p=cellToScreen(i,j,view,z);ctx.drawImage(floor,p.x-z.cell.w*scale/2,p.y-z.cell.h*scale/2,z.cell.w*scale,z.cell.h*scale);
    }
    const strip=nextExpansion(z,state.space.unlockedRows),centre=strip.cells.reduce((p,c)=>p.map((v,k)=>v+c[k]/strip.cells.length),[0,0]);
    const p=cellToScreen(...centre,view,z),meta=MAP_MARKERS.expansion,im=load(meta.file);
    stamp(meta.file,p,meta.anchor);
    markers.push({kind:'row',axis:strip.axis,cells:strip.cells,...p,buttonX:p.x,buttonY:p.y-32*scale,
     x0:p.x-meta.anchor[0]*scale,y0:p.y-meta.anchor[1]*scale,w:im.naturalWidth*scale,h:im.naturalHeight*scale});
   }
   if(edit&&z.image){const occupied=new Set(placed.flatMap(s=>footprintCells(s).map(c=>c.join(','))));
    for(let r=0;r<z.rows;r++)for(let c=0;c<z.cols;c++){
     ctx.strokeStyle=occupied.has(`${c},${r}`)?'#ffd36b':'#7de7ffb0';ctx.lineWidth=occupied.has(`${c},${r}`)?1.5:.8;
     gridCells++;const p=cellToScreen(c,r,view,z),hw=z.cell.w*scale/2,hh=z.cell.h*scale/2;
     ctx.beginPath();ctx.moveTo(p.x,p.y-hh);ctx.lineTo(p.x+hw,p.y);ctx.lineTo(p.x,p.y+hh);ctx.lineTo(p.x-hw,p.y);ctx.closePath();ctx.stroke();
    }
   }
   for(const edge of plateEdges(z)){const p=cellToScreen(...edge.cell,view,z);stamp('assets/drive/tiles/plate-edge-'+edge.part+'.png',{x:p.x,y:p.y-z.cell.h*scale/2},[64,0]);}
   [...placed,...(z.id==='A'?[...characterDepthEntries(world),...tableItemEntries(world)]:[])].map(s=>drag?.item&&drag.item===s.id?{...s,origin:drag.candidate}:s).sort(compareDepth).forEach(s=>{
    if(s.tableItem){const c=s.tableItem,p=cellToScreen(...s.origin,view,z),im=load('assets/drive/'+c.order.img),size=tableItemSize(z);if(im.complete&&im.naturalWidth){const fit=size/Math.max(im.naturalWidth,im.naturalHeight)*scale;ctx.drawImage(im,p.x+c.itemSlot.offset[0]*scale-im.naturalWidth*fit/2,p.y+c.itemSlot.offset[1]*scale-im.naturalHeight*fit,im.naturalWidth*fit,im.naturalHeight*fit);}return;}
    if(s.character?.role==='manager'){const m=s.character,im=load(managerFrame(m)),p=cellToScreen(...s.origin,view,z);if(im.complete&&im.naturalWidth){const fit=MANAGER.height/MANAGER_OPAQUE_HEIGHT[managerFrame(m).split('/').at(-1)];ctx.drawImage(im,p.x-MANAGER.anchor[0]*fit,p.y-MANAGER.anchor[1]*fit,im.naturalWidth*fit,im.naturalHeight*fit);}return;}
    if(s.character){const meta=CHAR_SPRITES[s.character.role==='manager'?'manager':s.character.kind?'guest':'shiba'];if(meta.file&&meta.anchor)stamp(meta.file,cellToScreen(...s.origin,view,z),meta.anchor);return;}
    const base=SPRITES[s.type];if(!base)return;
    if(!base.file){if(edit){const p=cellToScreen(...s.origin,view,z);hits.push({id:s.id,x:p.x-z.cell.w*scale/2,y:p.y-z.cell.h*scale/2,w:z.cell.w*scale,h:z.cell.h*scale,footprint:true,view,zone:z});}return;}const sprite=s.dir>=2?base.back:base;if(!sprite)return;
    const im=load(sprite.file),p=cellToScreen(...footprintCentre(s),view,z),spriteScale=scale*sprite.scale;
    if(im.complete&&im.naturalWidth){
     const mirrored=Boolean(s.dir%2),ax=mirrored?im.naturalWidth-sprite.anchor[0]:sprite.anchor[0];
     const x=p.x-ax*spriteScale,y=p.y-sprite.anchor[1]*spriteScale,w=im.naturalWidth*spriteScale,h=im.naturalHeight*spriteScale;
     ctx.save();if(mirrored){ctx.translate(x+w,y);ctx.scale(-1,1);ctx.drawImage(im,0,0,w,h);}else ctx.drawImage(im,x,y,w,h);ctx.restore();
     hits.push({id:s.id,x,y,w,h,im,mirrored,view,zone:z});
    }
   });
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
    ctx.strokeStyle=validPlacement(candidate,placed,z)?'#ffd36b':'#ff4545';ctx.lineWidth=2;
    for(const [i,j] of footprintCells(candidate)){const p=cellToScreen(i,j,view,z),hw=z.cell.w*scale/2,hh=z.cell.h*scale/2;
     ctx.beginPath();ctx.moveTo(p.x,p.y-hh);ctx.lineTo(p.x+hw,p.y);ctx.lineTo(p.x,p.y+hh);ctx.lineTo(p.x-hw,p.y);ctx.closePath();ctx.stroke();}
   }}
   y+=heights[index]+24;
  });
 }
 canvas.addEventListener('wheel',e=>{e.preventDefault();scroll+=e.deltaY;panX+=e.deltaX;last&&draw(...last);},{passive:false});
 // Alpha hit testing uses an offscreen copy only; rendered sprites remain unmodified.
 const masks=new Map();
 function opaque(hit,x,y){if(hit.footprint)return Math.abs((x-hit.x-hit.w/2)/(hit.w/2))+Math.abs((y-hit.y-hit.h/2)/(hit.h/2))<=1;let mask=masks.get(hit.im);if(!mask){const c=document.createElement('canvas');c.width=hit.im.naturalWidth;c.height=hit.im.naturalHeight;const m=c.getContext('2d',{willReadFrequently:true});m.drawImage(hit.im,0,0);try{mask=m.getImageData(0,0,c.width,c.height);masks.set(hit.im,mask);}catch{return true;}}
  let px=Math.floor((x-hit.x)/hit.w*mask.width),py=Math.floor((y-hit.y)/hit.h*mask.height);if(hit.mirrored)px=mask.width-1-px;return mask.data[(py*mask.width+px)*4+3]>0;
 }
 const point=e=>{const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};
 const cell=(p,view,z)=>{const x=(p.x-view.x)/view.scale-z.origin.x,y=(p.y-view.y)/view.scale-z.origin.y-z.cell.h/2;return [y/z.cell.h+x/z.cell.w,y/z.cell.h-x/z.cell.w];};
 function cancelDrag(){drag=null;}
 canvas.addEventListener('pointerdown',e=>{
  if(e.button!==0||drag)return;const p=point(e);
  const marker=markers.find(m=>m.kind==='row'&&p.x>=m.x0&&p.x<m.x0+m.w&&p.y>=m.y0&&p.y<m.y0+m.h&&opaque({im:images.get(MAP_MARKERS.expansion.file),x:m.x0,y:m.y0,w:m.w,h:m.h},p.x,p.y));
  if(marker)drag={pointerId:e.pointerId,marker:true,start:p,scrollY:e.clientY,scrollX:e.clientX};
  if(edit&&!drag){const hit=[...hits].reverse().sort((a,b)=>Number(Boolean(b.footprint))-Number(Boolean(a.footprint))).find(h=>p.x>=h.x&&p.x<h.x+h.w&&p.y>=h.y&&p.y<h.y+h.h&&opaque(h,p.x,p.y));selected=hit?.id||null;
   if(hit){const item=current();drag={pointerId:e.pointerId,item:item.id,start:cell(p,hit.view,hit.zone),origin:[...item.origin],candidate:[...item.origin],view:hit.view,zone:hit.zone};}
  }
  if(!drag)drag={pointerId:e.pointerId,scrollY:e.clientY,scrollX:e.clientX};
  canvas.setPointerCapture(e.pointerId);repaint();
 });
 canvas.addEventListener('pointermove',e=>{if(!drag||drag.pointerId!==e.pointerId)return;
  if(drag.marker&&Math.hypot(point(e).x-drag.start.x,point(e).y-drag.start.y)>=8)drag.moved=true;
  if(drag.item){const c=cell(point(e),drag.view,drag.zone);drag.candidate=drag.origin.map((n,i)=>n+Math.round(c[i]-drag.start[i]));}
  else {scroll+=drag.scrollY-e.clientY;panX+=drag.scrollX-e.clientX;drag.scrollY=e.clientY;drag.scrollX=e.clientX;}repaint();
 });
 canvas.addEventListener('pointerup',e=>{if(!drag||drag.pointerId!==e.pointerId)return;if(drag.marker&&!drag.moved&&Math.hypot(point(e).x-drag.start.x,point(e).y-drag.start.y)<8)onExpand();if(drag?.item){const item=current(),candidate={...item,origin:drag.candidate};if(accept(candidate,drag.zone)){item.origin=[...drag.candidate];onChange();}}cancelDrag();repaint();});
 canvas.addEventListener('pointercancel',e=>{if(drag?.pointerId===e.pointerId){cancelDrag();repaint();}});
 canvas.addEventListener('lostpointercapture',()=>{cancelDrag();repaint();});
 new ResizeObserver(()=>last&&draw(...last)).observe(canvas);
 return {draw,placeWall,actions:bar,get selected(){return selected;},get gridCells(){return gridCells;},get hits(){return hits.map(({im,...h})=>h);},get edit(){return edit;},setEdit(value){cancelDrag();edit=Boolean(value);if(!edit)selected=null;onEditChange(edit);repaint();},get panX(){return panX;},get panBounds(){return {...panBounds};},panTo(x,y=scroll){panX=x;scroll=y;repaint();},get scroll(){return scroll;},get maxScroll(){return maxScroll;},get markers(){return markers;},scrollTo(value){scroll=value;repaint();}};
}
