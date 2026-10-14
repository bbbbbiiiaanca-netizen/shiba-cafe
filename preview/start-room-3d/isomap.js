import {MAP,SPRITES,cellToImage,cellToScreen,footprintCentre,compareDepth,footprintCells,validPlacement,flipDir,rotateDir,zonesForSpace} from './map-data.js';
export {MAP,SPRITES,cellToImage,cellToScreen};
export function createIsoMap(canvas,{onChange=()=>{},onBlocked=()=>{},onEditChange=()=>{}}={}){
 const ctx=canvas.getContext('2d'),images=new Map(),params=new URLSearchParams(location.search);
 let edit=params.get('edit')==='1'||params.get('grid')==='1',scroll=0,drag=null,last,selected=null,hits=[],gridCells=0,maxScroll=0,markers=[];
 const bar=document.createElement('div');bar.hidden=true;bar.className='furniture-actions';bar.setAttribute('aria-label','가구 편집');
 bar.innerHTML='<button data-furniture-flip>좌우 반전</button><button data-furniture-rotate>회전</button><button data-furniture-done>완료/선택 해제</button>';
 function syncBar(){bar.hidden=!edit;for(const button of bar.querySelectorAll('button'))button.disabled=!selected;}
 syncBar();
 const slots=()=>last?.[0].placement.slots||MAP.zones[0].slots;
 const current=()=>slots().find(s=>s.id===selected);
 const repaint=()=>{syncBar();last&&draw(...last);};
 function orient(dir){const item=current();if(!item||drag?.item)return;const candidate={...item,dir};if(!validPlacement(candidate,slots(),zonesForSpace(last[0].space)[0])){onBlocked();return;}item.dir=dir;onChange();repaint();}
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
  const scale=(W-12)/861;
  const heights=zones.map(z=>Math.max(615,z.origin.y+(z.cols+z.rows+1)*z.cell.h/2+50)*scale);
  const total=heights.reduce((a,b)=>a+b,0)+Math.max(0,zones.length-1)*24;
  maxScroll=Math.max(0,total-H);scroll=Math.max(0,Math.min(scroll,maxScroll));
  let y=Math.max(0,(H-total)/2)-scroll;
  zones.forEach((z,index)=>{
   const view={x:(W-861*scale)/2+scroll*2,y:y+(z.screenOffset?.y||0)*scale,scale};const placed=z.id==='A'?state.placement.slots:z.slots;
   if(z.image){const glow=ctx.createRadialGradient(W/2,y+heights[index]*.84,0,W/2,y+heights[index]*.84,W*.55);
   glow.addColorStop(0,'#b9854540');glow.addColorStop(1,'#b9854500');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);}
   const room=z.image?load(z.image):null;if(room?.complete&&room.naturalWidth)ctx.drawImage(room,view.x,view.y,room.naturalWidth*scale,room.naturalHeight*scale);
   const stamp=(file,p,anchor)=>{const im=load(file);if(im.complete&&im.naturalWidth)ctx.drawImage(im,p.x-anchor[0]*scale,p.y-anchor[1]*scale,im.naturalWidth*scale,im.naturalHeight*scale);};
   if(z.floor===1){
    for(let c=0;c<z.cols;c++)stamp('assets/drive/tiles/tile-floor-locked.png',cellToScreen(c,z.rows,view,z),[64,32]);
    const p=cellToScreen((z.cols-1)/2,z.rows,view,z);stamp('assets/drive/tiles/marker-expand-land.png',p,[64,72]);markers.push({kind:'row',...p});
    if(!state.space.floor2Unlocked){const stairs=placed.find(s=>s.type==='stairs'),p=cellToScreen(...footprintCentre(stairs),view,z);p.y-=z.cell.h*scale;
     stamp('assets/drive/ui/ui-lock.png',p,[32,32]);ctx.fillStyle='#fff';ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillText('2층 · 잠김',p.x,p.y-36*scale);markers.push({kind:'floor2',...p});}
   }
   if(edit&&z.image){const occupied=new Set(placed.flatMap(s=>footprintCells(s).map(c=>c.join(','))));
    for(let r=0;r<MAP.zones[0].rows;r++)for(let c=0;c<z.cols;c++){
     ctx.strokeStyle=occupied.has(`${c},${r}`)?'#ffd36b':'#7de7ffb0';ctx.lineWidth=occupied.has(`${c},${r}`)?1.5:.8;
     gridCells++;const p=cellToScreen(c,r,view,z),hw=z.cell.w*scale/2,hh=z.cell.h*scale/2;
     ctx.beginPath();ctx.moveTo(p.x,p.y-hh);ctx.lineTo(p.x+hw,p.y);ctx.lineTo(p.x,p.y+hh);ctx.lineTo(p.x-hw,p.y);ctx.closePath();ctx.stroke();
    }
   }
   [...placed].map(s=>drag?.item===s.id?{...s,origin:drag.candidate}:s).sort(compareDepth).forEach(s=>{
    const base=SPRITES[s.type];if(!base)return;const sprite=s.dir>=2?base.back:base;if(!sprite)return;
    const im=load(sprite.file),p=cellToScreen(...footprintCentre(s),view,z),spriteScale=scale*sprite.scale;
    if(im.complete&&im.naturalWidth){
     const mirrored=Boolean(s.dir%2),ax=mirrored?im.naturalWidth-sprite.anchor[0]:sprite.anchor[0];
     const x=p.x-ax*spriteScale,y=p.y-sprite.anchor[1]*spriteScale,w=im.naturalWidth*spriteScale,h=im.naturalHeight*spriteScale;
     ctx.save();if(mirrored){ctx.translate(x+w,y);ctx.scale(-1,1);ctx.drawImage(im,0,0,w,h);}else ctx.drawImage(im,x,y,w,h);ctx.restore();
     hits.push({id:s.id,x,y,w,h,im,mirrored,view,zone:z});
    }
   });
   if(edit&&selected){const item=placed.find(s=>s.id===selected);if(item){const candidate=drag?.item===item.id?{...item,origin:drag.candidate}:item;
    ctx.strokeStyle=validPlacement(candidate,placed,z)?'#ffd36b':'#ff4545';ctx.lineWidth=2;
    for(const [i,j] of footprintCells(candidate)){const p=cellToScreen(i,j,view,z),hw=z.cell.w*scale/2,hh=z.cell.h*scale/2;
     ctx.beginPath();ctx.moveTo(p.x,p.y-hh);ctx.lineTo(p.x+hw,p.y);ctx.lineTo(p.x,p.y+hh);ctx.lineTo(p.x-hw,p.y);ctx.closePath();ctx.stroke();}
   }}
   y+=heights[index]+24;
  });
 }
 canvas.addEventListener('wheel',e=>{e.preventDefault();scroll+=e.deltaY;last&&draw(...last);},{passive:false});
 // Alpha hit testing uses an offscreen copy only; rendered sprites remain unmodified.
 const masks=new Map();
 function opaque(hit,x,y){let mask=masks.get(hit.im);if(!mask){const c=document.createElement('canvas');c.width=hit.im.naturalWidth;c.height=hit.im.naturalHeight;const m=c.getContext('2d',{willReadFrequently:true});m.drawImage(hit.im,0,0);try{mask=m.getImageData(0,0,c.width,c.height);masks.set(hit.im,mask);}catch{return true;}}
  let px=Math.floor((x-hit.x)/hit.w*mask.width),py=Math.floor((y-hit.y)/hit.h*mask.height);if(hit.mirrored)px=mask.width-1-px;return mask.data[(py*mask.width+px)*4+3]>0;
 }
 const point=e=>{const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};
 const cell=(p,view,z)=>{const x=(p.x-view.x)/view.scale-z.origin.x,y=(p.y-view.y)/view.scale-z.origin.y-z.cell.h/2;return [y/z.cell.h+x/z.cell.w,y/z.cell.h-x/z.cell.w];};
 function cancelDrag(){drag=null;}
 canvas.addEventListener('pointerdown',e=>{
  if(e.button!==0||drag)return;const p=point(e);
  if(edit){const hit=[...hits].reverse().find(h=>p.x>=h.x&&p.x<h.x+h.w&&p.y>=h.y&&p.y<h.y+h.h&&opaque(h,p.x,p.y));selected=hit?.id||null;
   if(hit){const item=current();drag={pointerId:e.pointerId,item:item.id,start:cell(p,hit.view,hit.zone),origin:[...item.origin],candidate:[...item.origin],view:hit.view,zone:hit.zone};}
  }
  if(!drag)drag={pointerId:e.pointerId,scrollY:e.clientY};
  canvas.setPointerCapture(e.pointerId);repaint();
 });
 canvas.addEventListener('pointermove',e=>{if(!drag||drag.pointerId!==e.pointerId)return;
  if(drag.item){const c=cell(point(e),drag.view,drag.zone);drag.candidate=drag.origin.map((n,i)=>n+Math.round(c[i]-drag.start[i]));}
  else {scroll+=drag.scrollY-e.clientY;drag.scrollY=e.clientY;}repaint();
 });
 canvas.addEventListener('pointerup',e=>{if(!drag||drag.pointerId!==e.pointerId)return;if(drag?.item){const item=current(),candidate={...item,origin:drag.candidate};if(validPlacement(candidate,slots(),drag.zone)){item.origin=[...drag.candidate];onChange();}else onBlocked();}cancelDrag();repaint();});
 canvas.addEventListener('pointercancel',e=>{if(drag?.pointerId===e.pointerId){cancelDrag();repaint();}});
 canvas.addEventListener('lostpointercapture',()=>{cancelDrag();repaint();});
 new ResizeObserver(()=>last&&draw(...last)).observe(canvas);
 return {draw,actions:bar,get selected(){return selected;},get gridCells(){return gridCells;},get hits(){return hits.map(({im,...h})=>h);},get edit(){return edit;},setEdit(value){cancelDrag();edit=Boolean(value);if(!edit)selected=null;onEditChange(edit);repaint();},get scroll(){return scroll;},get maxScroll(){return maxScroll;},get markers(){return markers;},scrollTo(value){scroll=value;repaint();}};
}
