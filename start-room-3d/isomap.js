import {MAP,SPRITES,TILES} from './map-data.js';
export {MAP,SPRITES};
export function createIsoMap(canvas,onPick){
 const ctx=canvas.getContext('2d'),images=new Map();let scroll=0,drag=null,hits=[],last;
 const load=path=>{if(!images.has(path)){const i=new Image();i.onload=()=>last&&draw(...last);i.src=path;images.set(path,i);}return images.get(path);};
 const tile=n=>load('assets/drive/tiles/'+n);
 Object.values(TILES).forEach(tile);Object.values(SPRITES).filter(Boolean).forEach(s=>load(s.path));['tile-floor-side-left.png','tile-floor-side-right.png','tile-wall-left.png','tile-wall-right.png'].forEach(tile);
 function draw(state,world){last=[state,world];const W=canvas.clientWidth,physicalH=canvas.clientHeight,H=physicalH/1.35,dpr=devicePixelRatio||1;
  if(canvas.width!==W*dpr||canvas.height!==physicalH*dpr){canvas.width=W*dpr;canvas.height=physicalH*dpr;}
  ctx.setTransform(dpr,0,0,dpr*1.35,0,0);ctx.clearRect(0,0,W,H);hits=[];
  const f=MAP.floors[0],rows=f.grid.length,cols=Math.max(...f.grid.map(r=>r.length)),scale=(W-26)/(cols*128),tw=128*scale,th=64*scale;
  const height=(rows+cols)*th/2+112*scale+30;scroll=Math.max(0,Math.min(scroll,Math.max(0,height-H)));
  const point=(c,r)=>[W/2+(c-r)*tw/2,(H-height)/2+112*scale+(c+r)*th/2-scroll];
  function asset(n,c,r,dy=0){const im=tile(n),[x,y]=point(c,r);if(im.complete&&im.naturalWidth)ctx.drawImage(im,x-tw/2,y+dy*scale,im.naturalWidth*scale,im.naturalHeight*scale);}
  const grass=tile('bg-outside-grass.png');if(grass.complete&&grass.naturalWidth){ctx.save();ctx.translate(0,-scroll);ctx.fillStyle=ctx.createPattern(grass,'repeat');ctx.fillRect(0,scroll,W,H);ctx.restore();}
  for(let r=0;r<rows;r++)for(let c=0;c<f.grid[r].length;c++)asset(f.zones.some(z=>z.locked&&c>=z.col&&c<z.col+z.w&&r>=z.row&&r<z.row+z.h)?TILES.locked:TILES[f.grid[r][c]],c,r);
  // Wall bottoms at y=144 meet the tile's back edges y=0..32. Floor side tops start at y=32.
  if(f.walls.backLeft)for(let r=0;r<rows;r++)asset('tile-wall-left.png',0,r,-112);
  if(f.walls.backRight)for(let c=0;c<cols;c++)asset('tile-wall-right.png',c,0,-112);
  asset('tile-wall-end-left.png',0,rows-1,-112);asset('tile-wall-end-right.png',cols-1,0,-112);
  for(let c=0;c<cols;c++)asset('tile-floor-side-left.png',c,rows-1);
  for(let r=0;r<rows;r++)asset('tile-floor-side-right.png',cols-1,r);
  function poly(points,color){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.strokeStyle='#806c53';ctx.lineWidth=.7;ctx.stroke();}
  const objects=[...f.objects];
  const places=[[0,5],[5,3],[3,5]];
  state.shibas.filter(s=>s.placed&&world.sh[s.id]).slice(0,3).forEach((s,i)=>objects.push({type:s.breed,label:s.name||({red:'적시바',white:'백시바',kuro:'쿠로',sesame:'참깨'}[s.breed]),col:places[i][0],row:places[i][1],w:1,h:1,shiba:s.id}));
  world.custs.slice(0,2).forEach((g,i)=>objects.push({type:'guest',label:'손님',col:i?4:0,row:3,w:1,h:1,cust:g.id}));
  for(const z of f.zones)if(z.locked)objects.push({type:'expand',col:z.col,row:z.row,w:1,h:1});
  objects.sort((a,b)=>(a.col+a.row+a.w+a.h)-(b.col+b.row+b.w+b.h));
  for(const o of objects){const [x,y0]=point(o.col+(o.w||1)/2-.5,o.row+(o.h||1)/2-.5),y=y0+th/2;
   const sprite=o.sprite||SPRITES[o.type];if(sprite){const im=load(sprite.path);if(im.complete&&im.naturalWidth)ctx.drawImage(im,x-sprite.anchor[0]*scale,y-sprite.anchor[1]*scale,im.naturalWidth*scale,im.naturalHeight*scale);continue;}
   const character=['guest','dongu','red','white','kuro','sesame'].includes(o.type),h=character?28:o.type==='counter'?24:o.type==='stairs'?30:o.type==='cushion'?3:12;
   const a=tw*(character?.23:.36)*(o.w||1),b=th*.32*(o.h||1),color=character?'#c79872':o.type==='cushion'?'#99ac8e':'#c19b72';
   if(character){ctx.save();if(o.type==='guest')ctx.translate(0,7);ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y-13,a*.7,16,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#806c53';ctx.stroke();ctx.fillStyle='#f6e6cb';ctx.beginPath();ctx.arc(x,y-30,9,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();}
   else{poly([[x-a,y-h],[x,y+b-h],[x,y+b],[x-a,y]],'#a7825e');poly([[x,y+b-h],[x+a,y-h],[x+a,y],[x,y+b]],'#b68d64');poly([[x,y-b-h],[x+a,y-h],[x,y+b-h],[x-a,y-h]],color);
    if(o.type==='stairs')for(let j=0;j<3;j++){ctx.strokeStyle='#f4dec0';ctx.beginPath();ctx.moveTo(x-a*.7+j*5,y-h+j*5);ctx.lineTo(x+j*5,y+b-h+j*5);ctx.stroke();}}
   if(o.type==='cushion'&&objects.some(g=>g.type==='guest'&&g.col===o.col&&g.row===o.row))continue;
   ctx.font='bold 8px sans-serif';ctx.textAlign='center';const label=o.label;const width=ctx.measureText(label).width+8;ctx.fillStyle='#fff8e9';ctx.beginPath();ctx.roundRect(x-width/2,y+5,width,13,4);ctx.fill();ctx.fillStyle='#665140';ctx.fillText(label,x,y+14);
   hits.push({x,y:(y-10)*1.35,shiba:o.shiba,cust:o.cust});
  }
 }
 canvas.addEventListener('wheel',e=>{e.preventDefault();scroll+=e.deltaY;last&&draw(...last);},{passive:false});
 canvas.addEventListener('pointerdown',e=>{drag={y:e.clientY,start:e.clientY};canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(!drag)return;scroll+=drag.y-e.clientY;drag.y=e.clientY;last&&draw(...last);});
 canvas.addEventListener('pointerup',e=>{if(drag&&Math.abs(e.clientY-drag.start)<8){const r=canvas.getBoundingClientRect(),hit=hits.find(h=>Math.hypot(h.x-(e.clientX-r.left),h.y-(e.clientY-r.top)/1.35)<20);if(hit)onPick(hit);}drag=null;});
 new ResizeObserver(()=>last&&draw(...last)).observe(canvas);return {draw,get scroll(){return scroll;}};
}
