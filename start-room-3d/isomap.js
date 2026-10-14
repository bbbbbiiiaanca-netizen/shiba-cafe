import {MAP,SPRITES,cellToImage,cellToScreen,footprintCentre,compareDepth} from './map-data.js';
export {MAP,SPRITES,cellToImage,cellToScreen};
export function createIsoMap(canvas){
 const ctx=canvas.getContext('2d'),images=new Map(),params=new URLSearchParams(location.search);
 let edit=params.get('edit')==='1'||params.get('grid')==='1',scroll=0,drag=null,last;
 const load=path=>{if(!images.has(path)){const im=new Image();im.onload=()=>last&&draw(...last);im.src=path;images.set(path,im);}return images.get(path);};
 MAP.zones.forEach(z=>{load(z.image);z.slots.forEach(s=>load(SPRITES[s.type].file));});
 function draw(state,world){
  last=[state,world];const W=canvas.clientWidth,H=canvas.clientHeight,dpr=devicePixelRatio||1;
  if(canvas.width!==Math.round(W*dpr)||canvas.height!==Math.round(H*dpr)){canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#202224';ctx.fillRect(0,0,W,H);
  const zones=MAP.zones.filter(z=>z.floor===(state.cafe.floor||1));
  const scale=(W-12)/861;
  const heights=zones.map(z=>Math.max(615,z.origin.y+(z.cols+z.rows)*z.cell.h/2+50)*scale);
  const total=heights.reduce((a,b)=>a+b,0)+Math.max(0,zones.length-1)*24;
  scroll=Math.max(0,Math.min(scroll,Math.max(0,total-H)));
  let y=Math.max(0,(H-total)/2)-scroll;
  zones.forEach((z,index)=>{
   const view={x:(W-861*scale)/2,y,scale};
   const glow=ctx.createRadialGradient(W/2,y+heights[index]*.84,0,W/2,y+heights[index]*.84,W*.55);
   glow.addColorStop(0,'#b9854540');glow.addColorStop(1,'#b9854500');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
   const room=load(z.image);if(room.complete&&room.naturalWidth)ctx.drawImage(room,view.x,view.y,room.naturalWidth*scale,room.naturalHeight*scale);
   if(edit){const occupied=new Set(z.slots.flatMap(s=>s.cells.map(c=>c.join(','))));
    for(let r=0;r<z.rows;r++)for(let c=0;c<z.cols;c++){
     ctx.strokeStyle=occupied.has(`${c},${r}`)?'#ffd36b':'#7de7ffb0';ctx.lineWidth=occupied.has(`${c},${r}`)?1.5:.8;
     const p=cellToScreen(c,r,view,z),hw=z.cell.w*scale/2,hh=z.cell.h*scale/2;
     ctx.beginPath();ctx.moveTo(p.x,p.y-hh);ctx.lineTo(p.x+hw,p.y);ctx.lineTo(p.x,p.y+hh);ctx.lineTo(p.x-hw,p.y);ctx.closePath();ctx.stroke();
    }
   }
   [...z.slots].sort(compareDepth).forEach(s=>{
    const sprite=SPRITES[s.type];if(!sprite)return;const im=load(sprite.file),p=cellToScreen(...footprintCentre(s),view,z),spriteScale=scale*sprite.scale;
    if(im.complete&&im.naturalWidth)ctx.drawImage(im,p.x-sprite.anchor[0]*spriteScale,p.y-sprite.anchor[1]*spriteScale,im.naturalWidth*spriteScale,im.naturalHeight*spriteScale);
   });
   y+=heights[index]+24;
  });
 }
 canvas.addEventListener('wheel',e=>{e.preventDefault();scroll+=e.deltaY;last&&draw(...last);},{passive:false});
 canvas.addEventListener('pointerdown',e=>{drag=e.clientY;canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(drag===null)return;scroll+=drag-e.clientY;drag=e.clientY;last&&draw(...last);});
 canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
 new ResizeObserver(()=>last&&draw(...last)).observe(canvas);
 return {draw,get edit(){return edit;},setEdit(value){edit=Boolean(value);last&&draw(...last);},get scroll(){return scroll;}};
}
