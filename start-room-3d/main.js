// 2D isometric cafe drawn only with art cut from the user's 「시바견 카페 에셋 카탈로그」 (assets/*.png).
import {CFG} from './config.js';
import * as S from './sim.js';
import {SDK} from './sdk-stubs.js';
import {UI} from './ui.js';
const Q=new URLSearchParams(location.search);
// test build only: ?temp=1 switches on every CFG.TEMP placeholder (values the docs leave 미정). Never on by default.
if(Q.has('temp'))for(const k of Object.keys(CFG.TEMP))CFG.TEMP[k]=true;
const cv=document.getElementById('scene'),g=cv.getContext('2d');const DPR=Math.min(2,devicePixelRatio||1);
let W=0,H=0;function resize(){W=cv.clientWidth;H=cv.clientHeight;cv.width=W*DPR;cv.height=H*DPR;}resize();addEventListener('resize',resize);
const IMG={};const names=['donggu','shiba_red','shiba_sesame','shiba_kuro','shiba_white','cust_girl','cust_man','shelf','table','zabuton','lantern','counter','sign','tatami','stone_lantern','bonsai','sakura','pond','fence','gravel_path','stepping','flowers','teapot','teacup','dango','showcase','bell','menu_board','bed','toy_basket','ball','bone_cushion','cushion_pink','scroll','bonsai_pot','mini_lantern','windbell','maneki','tile_construction'];
const ready=Promise.all(names.map(n=>new Promise(r=>{const i=new Image();i.onload=i.onerror=r;i.src=`assets/${n}.png`;IMG[n]=i;})));
// ---- camera: iso projection, horizontal swipe + pinch zoom ----
let U=64,zoom=+(Q.get("zoom")||1.35),pan=0;const TOP=92,BOT=84;
const P=(x,z,y=0)=>[W/2+((x-z)+1.4)*U*zoom*.87+pan,TOP+(H-TOP-BOT)*.47+((x+z)+.8)*U*zoom*.5-y*U*zoom];
function clampPan(){const lim=U*zoom*.87*7;pan=Math.max(-lim*.95,Math.min(lim*.75,pan));}
const pts=new Map();let pinch0=0,zoom0=1,moved=0;
cv.addEventListener('pointerdown',e=>{pts.set(e.pointerId,[e.clientX,e.clientY]);if(pts.size===2){const [a,b]=[...pts.values()];pinch0=Math.hypot(a[0]-b[0],a[1]-b[1]);zoom0=zoom;}});
cv.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;const p=pts.get(e.pointerId);pts.set(e.pointerId,[e.clientX,e.clientY]);if(pts.size===1){pan+=e.clientX-p[0];moved+=Math.abs(e.clientX-p[0]);clampPan();hideHint();}else{const [a,b]=[...pts.values()];zoom=Math.max(.8,Math.min(1.7,zoom0*Math.hypot(a[0]-b[0],a[1]-b[1])/Math.max(1,pinch0)));clampPan();}});
for(const ev of ['pointerup','pointercancel','pointerleave'])cv.addEventListener(ev,e=>pts.delete(e.pointerId));
cv.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.8,Math.min(1.7,zoom*Math.exp(-e.deltaY*.001)));clampPan();},{passive:false});
const hint=document.getElementById('hint');function hideHint(){hint.style.opacity=0;}
document.getElementById('al').onclick=()=>{pan+=160;clampPan();hideHint();};document.getElementById('ar').onclick=()=>{pan-=160;clampPan();hideHint();};
// ---- drawing helpers ----
function poly(pts,fill,stroke){g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=fill;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=2;g.stroke();}}
const quad=(x0,z0,x1,z1,y=0)=>[P(x0,z0,y),P(x1,z0,y),P(x1,z1,y),P(x0,z1,y)];
// sprite: anchor bottom-centre at ground (x,z), lifted by y; w = width in world units
function spr(n,x,z,w,{y=0,flip=false,crop=1,dy=0,alpha=1}={}){const im=IMG[n];if(!im||!im.width)return;const [sx,sy]=P(x,z,y);const pw=w*U*zoom,ph=pw*im.height/im.width;
 g.save();g.globalAlpha=alpha;g.translate(sx,sy+dy*U*zoom);if(flip)g.scale(-1,1);g.drawImage(im,0,0,im.width,im.height*crop,-pw/2,-ph,pw,ph*crop);g.restore();}
function shadow(x,z,r){const [sx,sy]=P(x,z);g.save();g.fillStyle='rgba(70,40,15,.18)';g.beginPath();g.ellipse(sx,sy-2,r*U*zoom*.62,r*U*zoom*.24,0,0,7);g.fill();g.restore();}
function heart(x,y,s,a){g.save();g.globalAlpha=a;g.translate(x,y);g.scale(s,s);g.beginPath();g.moveTo(0,4);g.bezierCurveTo(-9,-3,-6,-11,0,-6);g.bezierCurveTo(6,-11,9,-3,0,4);g.fillStyle='#ef7f8c';g.fill();g.lineWidth=1.4;g.strokeStyle='#fff';g.stroke();g.restore();}
// ---- static layout (world units; room x -4.6..1.3, z -2.6..2.6; garden around) ----
const RX0=-4.6,RX1=1.3,RZ0=-2.6,RZ1=2.6;
const props=[
 ['shelf',-3.6,-2.25,1.55],['counter',-1.45,-1.95,2.1],['showcase',.35,-2.1,.95],['lantern',.95,-2.3,.48],['bell',-1.0,-1.95,.34,{y:.78}],['teapot',-1.9,-1.95,.42,{y:.78}],['maneki',-2.35,-1.95,.38,{y:.78}],
 ['menu_board',1.05,1.9,.55],['bonsai_pot',-4.2,-1.6,.55],['cushion_pink',-4.05,1.9,.7],['bed',-3.0,2.1,1.1],['toy_basket',-1.7,2.25,.55],['ball',-1.05,2.35,.3],
 // garden (catalog p12 정원 소품)
 ['stone_lantern',2.4,-2.2,.75],['bonsai',3.7,-2.0,.95],['sakura',4.5,-.3,1.15],['pond',3.1,.6,1.6],['flowers',2.2,-.8,.85],['stepping',2.3,2.5,1.1],['gravel_path',2.8,3.8,1.4],['flowers',4.3,2.6,.8],['mini_lantern',4.6,1.3,.45],
 ['sakura',-5.2,3.4,1.1],['flowers',-3.6,3.6,.8],['bonsai',-1.2,3.9,.85],['tile_construction',5.7,3.9,1.4,{alpha:.9}],['tile_construction',-6.2,-1.0,1.4,{alpha:.9}],
];
const fences=[];for(let x=1.9;x<5.4;x+=.95)fences.push(['fence',x,-2.95,1.0]);
function drawGround(){
 g.fillStyle='#e9dcc0';g.fillRect(0,0,W,H);
 // garden lot (moss + white gravel like p17)
 poly(quad(-6.6,-3.4,5.8,4.8),'#a8b884');poly(quad(-6.6,-3.4,5.8,4.8,0).map(([x,y])=>[x,y]),'rgba(0,0,0,0)','#8c9c66');
 poly(quad(1.6,1.6,5.6,4.6),'#ece6d8');poly(quad(-6.4,2.8,1.4,4.7),'#ece6d8');
 let s=11;const r=()=>(s=(s*16807)%2147483647)/2147483647;g.fillStyle='rgba(150,140,120,.35)';for(let i=0;i<420;i++){const x=1.6+r()*4,z=1.6+r()*3;const [px,py]=P(x,z);g.fillRect(px,py,2,2);}for(let i=0;i<500;i++){const x=-6.4+r()*7.8,z=2.8+r()*1.9;const [px,py]=P(x,z);g.fillRect(px,py,2,2);}
 // expansion slots (tycoon: land grows up/down/left/right)
 for(const [x0,z0,x1,z1] of [[5.0,3.2,6.6,4.8],[-7.0,-1.8,-5.4,-.2]]){g.setLineDash([6,5]);poly(quad(x0,z0,x1,z1),'rgba(255,250,235,.35)','#c9a06a');g.setLineDash([]);}
 // raised wooden floor of the cafe
 const e=.22;poly([P(RX0,RZ1),P(RX1,RZ1),P(RX1,RZ1,-e),P(RX0,RZ1,-e)],'#7a4a2e');poly([P(RX1,RZ0),P(RX1,RZ1),P(RX1,RZ1,-e),P(RX1,RZ0,-e)],'#5e3820');
 poly(quad(RX0,RZ0,RX1,RZ1),'#a8724a');
 // tatami (catalog tatami tile), 4 x 4 mats
 const nx=4,nz=4,dx=(RX1-RX0-.3)/nx,dz=(RZ1-RZ0-.3)/nz;const im=IMG.tatami;
 for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const x0=RX0+.15+i*dx,z0=RZ0+.15+j*dz;const a=P(x0,z0),b=P(x0+dx,z0),c=P(x0+dx,z0+dz),d=P(x0,z0+dz);
  const L=Math.min(a[0],d[0]),R=Math.max(b[0],c[0]),T=Math.min(a[1],b[1]),B=Math.max(c[1],d[1]);g.drawImage(im,L-(R-L)*.02,T-(B-T)*.03,(R-L)*1.04,(B-T)*1.12);}
 // walls (back-left x=RX0, back-right z=RZ0): cream plaster + wood beams, open front like a diorama
 const h=1.75;poly([P(RX0,RZ0),P(RX0,RZ1),P(RX0,RZ1,h),P(RX0,RZ0,h)],'#eedfc4');poly([P(RX0,RZ0),P(RX1,RZ0),P(RX1,RZ0,h),P(RX0,RZ0,h)],'#f5e8d0');
 g.strokeStyle='#6b4126';g.lineWidth=6*zoom;for(const y of [.05,h-.05]){g.beginPath();g.moveTo(...P(RX0,RZ1,y));g.lineTo(...P(RX0,RZ0,y));g.lineTo(...P(RX1,RZ0,y));g.stroke();}
 g.lineWidth=7*zoom;for(const x of [RX0,-2.0,.6,RX1]){g.beginPath();g.moveTo(...P(x,RZ0,0));g.lineTo(...P(x,RZ0,h));g.stroke();}for(const z of [RZ0,0,RZ1]){g.beginPath();g.moveTo(...P(RX0,z,0));g.lineTo(...P(RX0,z,h));g.stroke();}
 // wall decor: sign, scroll, wind bell
 spr('scroll',RX0+.02,-1.2,.62,{y:.55});spr('sign',-.7,RZ0+.02,.7,{y:1.0});spr('windbell',.95,RZ0+.3,.42,{y:.95});
}
// ---- game state ----
if(Q.has('fresh'))localStorage.removeItem(CFG.saveKey);
const loaded=S.load(localStorage,Date.now());const state=loaded.state;const world=S.newWorld(state,+(Q.get('seed')||7));
const popLayer=document.getElementById('pops');
function pop(text,x,z){const [px,py]=P(x,z,1.9);const d=document.createElement('div');d.className='pop';d.textContent=text;d.style.left=px+'px';d.style.top=py+'px';popLayer.appendChild(d);setTimeout(()=>d.remove(),1600);}
let incomeFrac=0;
function step(dt){S.settleHearts(state,Date.now());S.tick(world,state,dt);incomeFrac+=S.incomePerSec(state)*dt;if(incomeFrac>=1){const n=Math.floor(incomeFrac);state.coins+=n;incomeFrac-=n;}
 for(const e of world.events.splice(0)){if(e.type==='pay')pop(`+${e.coins}🪙 +${e.paws}🐾`,e.x,e.z);if(e.type==='pet')SDK.sfx('pet');}ui.tick();}
const lastX=new Map();
function draw(){g.setTransform(DPR,0,0,DPR,0,0);drawGround();const t=world.t;const L=[];
 for(const p of [...props,...fences])L.push({d:p[1]+p[2],f:()=>{shadow(p[1],p[2],p[3]*.5);spr(p[0],p[1],p[2],p[3],p[4]||{});}});
 for(const [i,tb] of CFG.tables.entries())L.push({d:tb.x+tb.z,f:()=>{shadow(tb.x,tb.z,.9);spr('table',tb.x,tb.z,1.45);spr('teacup',tb.x+.3,tb.z+.1,.32,{y:.52});spr('dango',tb.x-.25,tb.z+.15,.38,{y:.5});}});
 for(const sd of CFG.seats)L.push({d:sd.x+sd.z-.3,f:()=>spr('zabuton',sd.x,sd.z,.78)});
 L.push({d:-1.25-1.3,f:()=>{shadow(-.25,-1.3,.7);spr('donggu',-.25,-1.3,1.05,{dy:.02,y:Math.sin(performance.now()/700)*.004});}}); // 동구: always seated by the counter
 for(const c of world.customers){const n=c.kind==='boy'?'cust_man':'cust_girl';const walking=c.phase==='enter'||c.phase==='leave';const px=lastX.get('c'+c.id)??c.x-c.z;const flip=(c.x-c.z)<px-1e-4;lastX.set('c'+c.id,c.x-c.z);
  if(walking)L.push({d:c.x+c.z,f:()=>{shadow(c.x,c.z,.5);spr(n,c.x,c.z,1.0,{y:Math.abs(Math.sin(t*8))*.05,flip});}});
  else L.push({d:c.x+c.z,f:()=>{spr(n,c.x,c.z,1.0,{crop:.6,dy:-.06,y:.62*.0+(c.petting?Math.abs(Math.sin(t*6))*.03:0)+(-.0)});}});} // seated: legs hidden behind the low table
 for(const sh of world.shibas){const n='shiba_'+sh.coat;const sx=sh.x-sh.z;const px=lastX.get('s'+sh.id)??sx;const moving=Math.abs(sx-px)>1e-4;const fl=moving?sx<px:(sh._fl||false);sh._fl=fl;lastX.set('s'+sh.id,sx);
  const onTable=sh.y>.01;const lift=sh.y/.55*.62;
  L.push({d:sh.x+sh.z+(onTable?.9:0),f:()=>{if(!onTable)shadow(sh.x,sh.z,.45);const hop=(sh.phase==='roam'||sh.phase==='toTable')?Math.abs(Math.sin(t*10+sh.id))*.05:0;
   spr(n,sh.x,sh.z,.82,{y:lift+hop,flip:fl});
   if(sh.phase==='pet'){const [hx,hy]=P(sh.x,sh.z,lift+1.25);for(let i=0;i<3;i++){const k=(t*.6+i/3)%1;heart(hx+(i-1)*18,hy-k*34,1.1+Math.sin(k*Math.PI)*.4,1-k*.7);}}}});}
 L.sort((a,b)=>a.d-b.d);for(const o of L)o.f();}
// ---- gacha / panels ----
const thumb=(coat,expr)=>`assets/${CFG.exprs[expr]?expr:coat+'_smile'}.png`;
const ui=UI({state,world,CFG,S,SDK,thumb,loaded,applyTheme:()=>{},addToCafe:o=>S.addShiba(world,o),save:()=>S.save(localStorage,state,Date.now())});
let manual=Q.has('still');let last=performance.now();
function frame(now){const dt=Math.min(.1,(now-last)/1000);last=now;if(!manual){let left=dt;while(left>1e-6){const d=Math.min(1/30,left);step(d);left-=d;}}draw();requestAnimationFrame(frame);}
setInterval(()=>{if(!manual)S.save(localStorage,state,Date.now());},10000);
addEventListener('visibilitychange',()=>{if(document.hidden)S.save(localStorage,state,Date.now());});
document.getElementById('gear').onclick=()=>ui.open('settings');
ready.then(()=>{draw();requestAnimationFrame(frame);window.__ready=true;});
window.__game={state,world,CFG,ui,S,step(sec){manual=true;for(let i=0;i<Math.round(sec*30);i++)step(1/30);draw();ui.tick();return {t:world.t,customers:world.customers.map(c=>c.phase),shibas:world.shibas.map(s=>s.phase)};},
 draw,open:n=>ui.open(n),close:()=>ui.close(),gachaShow:(coat,expr,t,r)=>ui.gachaShow(coat,expr,t,r),setPan(p,z){pan=p;zoom=z||zoom;clampPan();draw();}};
