import {MAP,SPRITES,TILES,zoneAt} from './map-data.js';
export {MAP,SPRITES};
export function createIsoMap(canvas,onPick){
 const ctx=canvas.getContext('2d'),images=new Map();let scroll=0,drag=null,hits=[],last;
 const load=path=>{if(!images.has(path)){const i=new Image();i.onload=()=>last&&draw(...last);i.src=path;images.set(path,i);}return images.get(path);};
 const tile=n=>load('assets/drive/tiles/'+n);
 Object.values(TILES).forEach(tile);Object.values(SPRITES).filter(Boolean).forEach(s=>load(s.path));['tile-floor-side-left.png','tile-floor-side-right.png','tile-wall-left.png','tile-wall-right.png','bg-outside-grass.png'].forEach(tile);
 function draw(state,world){last=[state,world];const W=canvas.clientWidth,physicalH=canvas.clientHeight,H=physicalH,dpr=devicePixelRatio||1;
  if(canvas.width!==W*dpr||canvas.height!==physicalH*dpr){canvas.width=W*dpr;canvas.height=physicalH*dpr;}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);hits=[];
  const f=MAP.floors[0],rows=f.grid.length,cols=Math.max(...f.grid.map(r=>r.length)),scale=(W-18)/((cols+rows)*64),tw=128*scale,th=64*scale;
  const height=(rows+cols)*th/2+112*scale+36;scroll=Math.max(0,Math.min(scroll,Math.max(0,height-H)));
  const point=(c,r)=>[W/2+(c-r)*tw/2,Math.max(0,H-height)/2+112*scale+(c+r)*th/2-scroll];
  function asset(n,c,r,dy=0){const im=tile(n),[x,y]=point(c,r);if(im.complete&&im.naturalWidth)ctx.drawImage(im,x-tw/2,y+dy*scale,im.naturalWidth*scale,im.naturalHeight*scale);}
  const bg=ctx.createRadialGradient(W*.4,H*.25,0,W*.5,H*.5,W*.8);bg.addColorStop(0,'#363936');bg.addColorStop(1,'#11171b');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  function polygon(p,color){ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=color;ctx.fill();}
  const top=point(0,0),left=point(0,rows),right=point(cols,0),front=point(cols,rows),depth=32;
  const pool=ctx.createRadialGradient(W/2,front[1]+12,0,W/2,front[1]+12,W*.55);pool.addColorStop(0,'#96704450');pool.addColorStop(1,'#96704400');ctx.fillStyle=pool;ctx.fillRect(0,0,W,H);
  ctx.save();ctx.filter='blur(15px)';ctx.fillStyle='#000a';ctx.beginPath();ctx.ellipse(W/2,front[1]+20,W*.39,22,0,0,Math.PI*2);ctx.fill();ctx.restore();
  polygon([left,front,[front[0],front[1]+depth],[left[0],left[1]+depth]],'#34403b');
  polygon([front,right,[right[0],right[1]+depth],[front[0],front[1]+depth]],'#1b2727');
  for(let r=0;r<rows;r++)for(let c=0;c<f.grid[r].length;c++)asset(zoneAt(f,c,r)?.locked?TILES.locked:TILES[f.grid[r][c]],c,r);
  ctx.strokeStyle='#b9ad8170';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(...left);ctx.lineTo(...front);ctx.lineTo(...right);ctx.stroke();
  function wall(c,r,kind){asset(kind,c,r,-112);const a=point(c,r),b=kind==='tile-wall-left.png'?point(c,r+1):point(c+1,r);const h=112*scale;
   ctx.save();ctx.filter='blur(3px)';ctx.strokeStyle='#14211db0';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();ctx.restore();
   const A=[a[0],a[1]-h],B=[b[0],b[1]-h];polygon([A,B,[B[0],B[1]+10],[A[0],A[1]+10]],'#263d38');polygon([[A[0],A[1]-4],[B[0],B[1]-4],B,A],'#5b6d58');
   for(const E of [A,B])polygon([[E[0]-2,E[1]-4],[E[0]+2,E[1]-4],[E[0]+2,E[1]+10],[E[0]-2,E[1]+10]],'#344a40');
  }
  // Wall bottoms at y=144 meet the tile's back edges y=0..32. Floor side tops start at y=32.
  if(f.walls.backLeft)for(let r=0;r<rows;r++)wall(0,r,'tile-wall-left.png');
  if(f.walls.backRight)for(let c=0;c<cols;c++)wall(c,0,'tile-wall-right.png');
  asset('tile-wall-end-left.png',0,rows-1,-112);asset('tile-wall-end-right.png',cols-1,0,-112);
  function poly(points,color){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.strokeStyle='#806c53';ctx.lineWidth=.7;ctx.stroke();}
  const objects=[...f.objects];
  for(const slot of f.slots)if(slot.item&&!zoneAt(f,...slot.cell)?.locked&&!f.objects.some(o=>slot.cell[0]>=o.col&&slot.cell[0]<o.col+o.w&&slot.cell[1]>=o.row&&slot.cell[1]<o.row+o.h))objects.push({type:slot.item,col:slot.cell[0],row:slot.cell[1],w:1,h:1});
  const places=[[0,5],[2,5],[1,5]];
  state.shibas.filter(s=>s.placed&&world.sh[s.id]).slice(0,3).forEach((s,i)=>objects.push({type:s.breed,label:s.name||({red:'적시바',white:'백시바',kuro:'쿠로',sesame:'참깨'}[s.breed]),col:places[i][0],row:places[i][1],w:1,h:1,shiba:s.id}));
  world.custs.slice(0,2).forEach((g,i)=>objects.push({type:'guest',label:'손님',col:i?1:0,row:3,w:1,h:1,cust:g.id}));
  for(const z of f.zones)if(z.locked)objects.push({type:'expand',col:z.rect.col+1,row:z.rect.row+3,w:1,h:1});
  objects.sort((a,b)=>(a.col+a.row+a.w+a.h)-(b.col+b.row+b.w+b.h));
  for(const run of f.interiorWalls)for(const e of run.edges)if(!e.door)objects.push({type:'wall',col:e.from[0],row:e.from[1],w:0,h:0});
  objects.sort((a,b)=>(a.col+a.row)-(b.col+b.row));
  for(const o of objects){if(o.type==='wall'){wall(o.col,o.row,'tile-wall-left.png');continue;}const [x,y0]=point(o.col+(o.w||1)/2-.5,o.row+(o.h||1)/2-.5),y=y0+th/2;
   ctx.save();ctx.globalCompositeOperation='multiply';ctx.filter='blur(3px)';ctx.fillStyle='#18231b55';ctx.beginPath();ctx.ellipse(x,y+2,tw*(o.type==='counter'?.65:.29),th*.23,0,0,Math.PI*2);ctx.fill();ctx.filter='blur(1px)';ctx.fillStyle='#13201955';ctx.beginPath();ctx.ellipse(x,y+1,tw*.17,th*.12,0,0,Math.PI*2);ctx.fill();ctx.restore();
   const sprite=o.sprite||SPRITES[o.type];if(sprite){const im=load(sprite.path);if(im.complete&&im.naturalWidth)ctx.drawImage(im,x-sprite.anchor[0]*scale,y-sprite.anchor[1]*scale,im.naturalWidth*scale,im.naturalHeight*scale);continue;}
   const character=['guest','dongu','red','white','kuro','sesame'].includes(o.type),h=character?28:o.type==='counter'?24:o.type==='stairs'?30:o.type==='cushion'?3:12;
   const a=tw*(character?.23:.36)*(o.w||1),b=th*.32*(o.h||1),color=character?'#c79872':o.type==='cushion'?'#99ac8e':'#c19b72';
   if(character){ctx.save();if(o.type==='guest')ctx.translate(0,7);ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y-13,a*.7,16,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#806c53';ctx.stroke();ctx.fillStyle='#f6e6cb';ctx.beginPath();ctx.arc(x,y-30,9,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();}
   else{poly([[x-a,y-h],[x,y+b-h],[x,y+b],[x-a,y]],'#a7825e');poly([[x,y+b-h],[x+a,y-h],[x+a,y],[x,y+b]],'#b68d64');poly([[x,y-b-h],[x+a,y-h],[x,y+b-h],[x-a,y-h]],color);
    if(o.type==='stairs')for(let j=0;j<3;j++){ctx.strokeStyle='#f4dec0';ctx.beginPath();ctx.moveTo(x-a*.7+j*5,y-h+j*5);ctx.lineTo(x+j*5,y+b-h+j*5);ctx.stroke();}}
   if(o.type==='cushion'&&objects.some(g=>g.type==='guest'&&g.col===o.col&&g.row===o.row))continue;
   ctx.font='bold 8px sans-serif';ctx.textAlign='center';const label=o.label;const width=ctx.measureText(label).width+8;ctx.fillStyle='#fff8e9';ctx.beginPath();ctx.roundRect(x-width/2,y+5,width,13,4);ctx.fill();ctx.fillStyle='#665140';ctx.fillText(label,x,y+14);
   hits.push({x,y:y-10,shiba:o.shiba,cust:o.cust});
  }
  ctx.save();ctx.globalCompositeOperation='screen';
  const lamp=point(1,0),glow=ctx.createRadialGradient(lamp[0],lamp[1],0,lamp[0],lamp[1],95);glow.addColorStop(0,'#ffbb5840');glow.addColorStop(1,'#ffb45400');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
  ctx.filter='blur(8px)';polygon([[top[0]-60,top[1]-35],[top[0]-25,top[1]-20],[front[0]+75,front[1]-20],[front[0]+20,front[1]-5]],'#ffe0a00c');ctx.restore();
  ctx.fillStyle='#eaba6410';polygon([top,right,front,left],ctx.fillStyle);
  const vignette=ctx.createRadialGradient(W/2,H/2,W*.25,W/2,H/2,W*.8);vignette.addColorStop(0,'#0000');vignette.addColorStop(1,'#0007');ctx.fillStyle=vignette;ctx.fillRect(0,0,W,H);
 }
 canvas.addEventListener('wheel',e=>{e.preventDefault();scroll+=e.deltaY;last&&draw(...last);},{passive:false});
 canvas.addEventListener('pointerdown',e=>{drag={y:e.clientY,start:e.clientY};canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(!drag)return;scroll+=drag.y-e.clientY;drag.y=e.clientY;last&&draw(...last);});
 canvas.addEventListener('pointerup',e=>{if(drag&&Math.abs(e.clientY-drag.start)<8){const r=canvas.getBoundingClientRect(),hit=hits.find(h=>Math.hypot(h.x-(e.clientX-r.left),h.y-(e.clientY-r.top))<20);if(hit)onPick(hit);}drag=null;});
 new ResizeObserver(()=>last&&draw(...last)).observe(canvas);return {draw,get scroll(){return scroll;}};
}
