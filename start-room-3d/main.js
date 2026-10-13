import * as T from './vendor/three.module.min.js';
import {CFG} from './config.js';
import {dog,human} from './figures.js';
import {EffectComposer} from './vendor/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from './vendor/jsm/postprocessing/RenderPass.js';
import {GTAOPass} from './vendor/jsm/postprocessing/GTAOPass.js';
import {OutputPass} from './vendor/jsm/postprocessing/OutputPass.js';
const renderer=new T.WebGLRenderer({canvas:document.getElementById('scene'),antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NeutralToneMapping;renderer.toneMappingExposure=1.08;
const scene=new T.Scene();{const c=document.createElement('canvas');c.width=4;c.height=256;const a=c.getContext('2d');const g=a.createLinearGradient(0,0,0,256);g.addColorStop(0,'#fff4e2');g.addColorStop(.55,'#fcebd2');g.addColorStop(1,'#f8e0c2');a.fillStyle=g;a.fillRect(0,0,4,256);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;scene.background=tx;}
scene.add(new T.HemisphereLight('#fff3e2','#a8927a',1.9));
const sun=new T.DirectionalLight('#ffe6c8',2.3);sun.position.set(-4,9,6);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);Object.assign(sun.shadow.camera,{left:-9,right:9,top:8,bottom:-8});sun.shadow.normalBias=.025;sun.shadow.bias=-.0002;sun.shadow.radius=4;scene.add(sun);
const camera=new T.OrthographicCamera(-1,1,1,-1,.1,80);
let BASE_SPAN=9.5,VY=-.35,PAN0=0;const LOOK=new T.Vector3(-.2,.35,.2),OFF=new T.Vector3(10,10,13);let zoom=1,pan=0;const right=new T.Vector3();
let placeCam=function(){camera.position.copy(LOOK).add(OFF);camera.lookAt(LOOK);right.setFromMatrixColumn(camera.matrixWorld,0);camera.position.addScaledVector(right,pan+PAN0);camera.updateMatrixWorld();}
let composer,gtao;window.__tapGuard=0;let resize=function(){const w=innerWidth,h=innerHeight,span=BASE_SPAN/zoom,vy=VY;camera.left=-span/2;camera.right=span/2;camera.top=span*h/w/2+vy;camera.bottom=-span*h/w/2+vy;camera.updateProjectionMatrix();renderer.setSize(w,h);if(composer){composer.setSize(w,h);}}
placeCam();resize();
// Pass 4 framing: fit the whole diorama to the portrait width (no side crop) and
// place its top just under the HUD bar (no empty strip at the top).
function fitView(){pan=0;PAN0=0;placeCam();const up=new T.Vector3().setFromMatrixColumn(camera.matrixWorld,1),rt=new T.Vector3().setFromMatrixColumn(camera.matrixWorld,0);let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
 // plan (가): frame the tatami hall only so characters read large; the dirt lot is reachable by panning.
 for(const x of [-4.62,1.25])for(const z of [-2.62,2.62])for(const y of [-.4,2.0]){const v=new T.Vector3(x,y,z).sub(LOOK);const a=v.dot(rt),b=v.dot(up);x0=Math.min(x0,a);x1=Math.max(x1,a);y0=Math.min(y0,b);y1=Math.max(y1,b);}
 const w=innerWidth,h=innerHeight,top=60,bot=230;BASE_SPAN=(x1-x0)*.9;PAN0=(x0+x1)/2+.05;const ppu=w/BASE_SPAN;const cy=(y0+y1)/2, screenMid=(top+(h-bot))/2;VY=cy+(screenMid-h/2)/ppu;placeCam();resize();}
fitView();addEventListener('resize',fitView);

// Finger drag pans left/right, pinch (or wheel) zooms, both clamped.
const pts=new Map();let pinch0=0,zoom0=1;const cv=renderer.domElement;cv.style.touchAction='none';
function clampView(){zoom=Math.min(1.9,Math.max(.85,zoom));pan=Math.min(2.6+2*(zoom-1),Math.max(-1.2-2*(zoom-1),pan));placeCam();resize();}
cv.addEventListener('pointerdown',e=>{pts.set(e.pointerId,[e.clientX,e.clientY]);if(pts.size===2){const [a,b]=[...pts.values()];pinch0=Math.hypot(a[0]-b[0],a[1]-b[1]);zoom0=zoom;}});
cv.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;const prev=pts.get(e.pointerId);pts.set(e.pointerId,[e.clientX,e.clientY]);if(pts.size===1){pan-=(e.clientX-prev[0])*(BASE_SPAN/zoom)/innerWidth;clampView();}else if(pts.size===2){const [a,b]=[...pts.values()];zoom=zoom0*Math.hypot(a[0]-b[0],a[1]-b[1])/Math.max(1,pinch0);clampView();}});
for(const ev of ['pointerup','pointercancel','pointerleave'])cv.addEventListener(ev,e=>pts.delete(e.pointerId));
cv.addEventListener('wheel',e=>{e.preventDefault();zoom*=Math.exp(-e.deltaY*.001);clampView();},{passive:false});
function canvasTex(w,h,draw,rep=[1,1]){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(...rep);t.anisotropy=4;return t;}
let tseed=7;const tr=()=>{tseed=(tseed*16807)%2147483647;return tseed/2147483647;};
const woodTex=canvasTex(256,256,(a,w,h)=>{a.fillStyle='#fff';a.fillRect(0,0,w,h);for(let i=0;i<70;i++){a.strokeStyle=`rgba(90,45,20,${.06+tr()*.12})`;a.lineWidth=1+tr()*2.5;a.beginPath();let y=tr()*h;a.moveTo(0,y);for(let x=0;x<=w;x+=16){y+=(tr()-.5)*3;a.lineTo(x,y);}a.stroke();}});
const tatamiTex=canvasTex(256,256,(a,w,h)=>{a.fillStyle='#fff';a.fillRect(0,0,w,h);for(let y=0;y<h;y+=4){a.fillStyle=`rgba(110,95,40,${.10+tr()*.10})`;a.fillRect(0,y,w,1.6);}for(let i=0;i<500;i++){a.fillStyle=`rgba(120,100,50,${tr()*.08})`;a.fillRect(tr()*w,tr()*h,6+tr()*14,1);}});
const dirtTex=canvasTex(256,256,(a,w,h)=>{a.fillStyle='#fff';a.fillRect(0,0,w,h);for(let i=0;i<2600;i++){const v=tr();a.fillStyle=v<.5?`rgba(60,32,14,${.08+tr()*.18})`:`rgba(255,230,190,${tr()*.15})`;const r=.6+tr()*2.2;a.beginPath();a.arc(tr()*w,tr()*h,r,0,7);a.fill();}},[2,2]);
const texFor={'#7a4a2e':woodTex,'#a07452':woodTex,'#a8805c':woodTex,'#b08560':woodTex,'#e2cba6':woodTex,'#d3c08e':tatamiTex,'#86664a':dirtTex,'#937256':dirtTex};
const rgCache=new Map();
function roundedGeo(sx,sy,sz){const r=Math.min(.16,Math.min(sx,sy,sz)*.46);const key=[sx,sy,sz].map(v=>v.toFixed(3)).join();if(rgCache.has(key))return rgCache.get(key);
 const seg=(v)=>Math.max(4,Math.min(16,Math.round(v/ .06)));const g=new T.BoxGeometry(sx,sy,sz,seg(sx),seg(sy),seg(sz));const P=g.attributes.position,v=new T.Vector3(),inner=new T.Vector3(sx/2-r,sy/2-r,sz/2-r);
 for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i);const c=new T.Vector3(Math.max(-inner.x,Math.min(inner.x,v.x)),Math.max(-inner.y,Math.min(inner.y,v.y)),Math.max(-inner.z,Math.min(inner.z,v.z)));const d=v.clone().sub(c);if(d.lengthSq()>1e-9){d.normalize().multiplyScalar(r);v.copy(c).add(d);P.setXYZ(i,v.x,v.y,v.z);}}
 g.computeVertexNormals();const N=g.attributes.normal;for(let i=0;i<N.count;i++){const x=N.getX(i),y=N.getY(i),z=N.getZ(i);if(!(Math.hypot(x,y,z)>.5))N.setXYZ(i,0,1,0);}rgCache.set(key,g);return g;}
const mats=new Map();function mat(c){if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:1,metalness:0,map:texFor[c]||null}));return mats.get(c);}
const sphere=new T.SphereGeometry(1,28,20),cube=new T.BoxGeometry(1,1,1),cylinder=(()=>{const g=new T.CapsuleGeometry(1,1,6,24);const P=g.attributes.position;for(let i=0;i<P.count;i++){const y=P.getY(i);const ay=Math.abs(y);P.setY(i,ay>.5?Math.sign(y)*(.5+ (ay-.5)*.12)-Math.sign(y)*.06:y*.88);}g.computeVertexNormals();return g;})();
function mesh(p,g,c,pos,scale){const m=new T.Mesh(g,mat(c));m.position.set(...pos);m.scale.set(...scale);m.castShadow=m.receiveShadow=true;p.add(m);return m;}
const box=(p,c,pos,scale)=>(Math.max(...scale)>50||Math.min(...scale)<.012)?mesh(p,cube,c,pos,scale):mesh(p,roundedGeo(...scale),c,pos,[1,1,1]),ball=(p,c,pos,scale)=>mesh(p,sphere,c,pos,scale),cyl=(p,c,pos,scale)=>mesh(p,cylinder,c,pos,scale);
const wood='#7a4a2e',edge='#a07452',cream='#fbf1e2',ink='#302018';
box(scene,'#f5e3cb',[.5,-.39,0],[200,.12,200]);scene.children.at(-1).material=new T.ShadowMaterial({color:'#7a5a40',opacity:.22});
box(scene,wood,[-1.7,-.18,0],[5.8,.36,5.2]);box(scene,edge,[-1.7,.01,0],[5.64,.06,5.03]);
for(let x=0;x<3;x++)for(let z=0;z<3;z++){
 const px=-3.56+x*1.86,pz=-1.7+z*1.7;box(scene,'#d3c08e',[px,.065,pz],[1.8,.07,1.64]);
 box(scene,'#687052',[px-.91,.105,pz],[.055,.02,1.65]);
 for(let q=0;q<10;q++)box(scene,'#ccb278',[px,.104,pz-.75+q*.16],[1.76,.002,.009]);
}
// Only rear and left walls: no ceiling or front wall.
box(scene,'#e2cba6',[-1.7,.9,-2.55],[5.8,1.7,.12]);box(scene,'#e2cba6',[-4.55,.9,0],[.12,1.7,5.2]);
for(const y of [.15,.65,1.7]){box(scene,wood,[-1.7,y,-2.49],[5.8,.12,.15]);box(scene,wood,[-4.49,y,0],[.15,.12,5.2]);}
for(const x of [-4.48,-1.6,1.12])box(scene,wood,[x,.9,-2.48],[.14,1.85,.16]);
// Counter and shelving.
box(scene,wood,[-1.3,.48,-1.75],[4.5,.85,.62]);box(scene,edge,[-1.3,.94,-1.73],[4.65,.14,.79]);
for(let i=0;i<8;i++)box(scene,'#a8805c',[-3.25+i*.52,.46,-1.42],[.42,.63,.025]);
for(const y of [.4,1.13,1.65])box(scene,wood,[-2.8,y,-2.28],[2.7,.09,.38]);
for(let i=0;i<6;i++){cyl(scene,'#b28a54',[-3.85+i*.43,1.24,-2.24],[.12,.17,.12]);cyl(scene,cream,[-3.85+i*.43,1.33,-2.24],[.13,.025,.13]);}
for(const x of [-2.2,-1.6,-.95]){cyl(scene,cream,[x,1.05,-1.7],[.11,.13,.11]);cyl(scene,'#67472c',[x,1.12,-1.7],[.09,.008,.09]);}
const lantern=ball(scene,'#ffd18b',[.55,1.29,-1.72],[.24,.36,.24]);lantern.material=new T.MeshStandardMaterial({color:'#ffe0a0',roughness:1,emissive:'#ffb650',emissiveIntensity:1.1});
for(let y=1.03;y<1.6;y+=.085){const ring=new T.Mesh(new T.TorusGeometry(.235,.008,6,32),mat('#dfae64'));ring.rotation.x=Math.PI/2;ring.position.set(.55,y,-1.72);scene.add(ring);}cyl(scene,wood,[.55,1.64,-1.72],[.12,.06,.12]);
const fill=new T.PointLight('#ffb766',5,7,1.3);fill.position.set(.55,1.4,-1.4);scene.add(fill);
// Guide p7 andon: paper lantern at the right end of the back shelf, orange fill light.
{const L=new T.Group();L.position.set(.85,1.8,-2.2);scene.add(L);box(L,wood,[0,-.02,0],[.36,.05,.36]);const paper=box(L,'#ffd99a',[0,.24,0],[.28,.42,.28]);paper.material=new T.MeshStandardMaterial({color:'#ffe2a8',roughness:1,emissive:'#ff9a3a',emissiveIntensity:1.4});paper.castShadow=false;for(const a of [-.15,.15])for(const b of [-.15,.15])box(L,wood,[a,.24,b],[.04,.48,.04]);box(L,wood,[0,.49,0],[.36,.05,.36]);
const andon=new T.PointLight('#ffa850',5,6,1.2);andon.position.set(0,.25,.35);L.add(andon);}
// Empty dirt module and perimeter fence, with open front entry.
box(scene,'#6b5038',[3.13,-.2,.1],[3.6,.22,4.8]);box(scene,'#86664a',[3.13,-.07,.1],[3.55,.05,4.76]);
let seed=123;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
for(let i=0;i<500;i++){const x=1.4+rand()*3.45,z=-2.2+rand()*4.58;ball(scene,i%3?'#80634a':'#937a60',[x,-.036,z],[.025+rand()*.025,.012,.024]);}
function fence(a,b){const dx=b[0]-a[0],dz=b[1]-a[1],n=Math.ceil(Math.hypot(dx,dz)/.85);for(let i=0;i<=n;i++)cyl(scene,edge,[a[0]+dx*i/n,.31,a[1]+dz*i/n],[.055,.76,.055]);for(const y of [.22,.53]){const rail=box(scene,wood,[(a[0]+b[0])/2,y,(a[1]+b[1])/2],[Math.hypot(dx,dz),.07,.07]);rail.rotation.y=-Math.atan2(dz,dx);}}
fence([1.4,-2.2],[4.84,-2.2]);fence([4.84,-2.2],[4.84,2.35]);fence([3.2,2.35],[4.84,2.35]);
for(let i=0;i<32;i++){const x=1.4+rand()*3.45;ball(scene,'#7f8a5a',[x,-.025,-2.18],[.10,.025,.06]);}
function table(x,z){box(scene,wood,[x,.46,z],[1.3,.13,1.05]);box(scene,'#b08560',[x,.535,z],[1.34,.025,1.09]);for(const a of [-.5,.5])for(const b of [-.37,.37])box(scene,wood,[x+a,.22,z+b],[.09,.44,.09]);for(const a of [-.95,.95]){const c=box(scene,'#6f7d58',[x+a,.13,z],[.56,.18,.62]);}cyl(scene,cream,[x+.37,.6,z-.28],[.09,.11,.09]);cyl(scene,'#593921',[x+.37,.661,z-.28],[.072,.008,.072]);cyl(scene,'#bf9057',[x-.4,.57,z-.27],[.17,.03,.17]);for(let i=0;i<3;i++)ball(scene,'#e6bc79',[x-.47+i*.07,.61,z-.27],[.045,.035,.04]);}
table(-2.8,.15);table(-.65,.7);
const owner=human('owner');owner.g.scale.setScalar(1.5);owner.g.position.set(-.45,.05,-2.05);scene.add(owner.g);
const donggu=dog(true);donggu.g.scale.setScalar(1.55);donggu.g.position.set(.22,.05,-1.17);donggu.g.rotation.y=.3;scene.add(donggu.g);
// Extra props from guide p7: jars on shelf, plank pile on the empty plot.
for(let i=0;i<5;i++){const x=-3.9+i*.5;const jc=['#8a5a34','#b98a52','#6b4a32','#c9a06a','#7c5236'][i];ball(scene,jc,[x,.6,-2.25],[.15,.17,.15]);cyl(scene,'#4b3020',[x,.76,-2.25],[.08,.05,.08]);}
for(let i=0;i<4;i++)ball(scene,['#a8784a','#d2b07a','#86603c','#c48d55'][i],[-3.6+i*.55,1.78,-2.25],[.13,.14,.13]);
for(let l=0;l<3;l++)for(let i=0;i<4;i++){const b=box(scene,l%2?'#b58250':'#a36739',[3.4+(l%2? (i-1.5)*.25:0),.0+l*.1,.4+(l%2?0:(i-1.5)*.25)],l%2?[.22,.09,1.1]:[1.1,.09,.22]);}
const heartShape=new T.Shape();heartShape.moveTo(0,-.15);heartShape.bezierCurveTo(-.32,.03,-.24,.31,0,.16);heartShape.bezierCurveTo(.24,.31,.32,.03,0,-.15);
const heartGeo=new T.ExtrudeGeometry(heartShape,{depth:.025,bevelEnabled:true,bevelSize:.015,bevelThickness:.01,bevelSegments:2,steps:1});const hearts=Array.from({length:9},()=>{const m=new T.Mesh(heartGeo,mat('#ed7f82'));scene.add(m);return m;});
renderer.toneMapping=T.NeutralToneMapping;composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
gtao=new GTAOPass(scene,camera,innerWidth,innerHeight);gtao.updateGtaoMaterial({radius:.9,distanceExponent:1.3,thickness:1.6,scale:1.8,samples:16});gtao.updatePdMaterial({lumaPhi:10,depthPhi:2,normalPhi:3,radius:6,rings:2,samples:16});gtao.blendIntensity=1;{const o=new URLSearchParams(location.search).get('out');if(o)gtao.output=+o;}if(!new URLSearchParams(location.search).has('noao'))composer.addPass(gtao);composer.addPass(new OutputPass());resize();
scene.traverse(o=>{const N=o.geometry?.attributes?.normal;if(!N)return;for(let i=0;i<N.count;i++){if(!(Math.hypot(N.getX(i),N.getY(i),N.getZ(i))>.5))N.setXYZ(i,0,1,0);}});

// ======================= GAME LAYER =======================
import * as S from './sim.js';
import {SDK} from './sdk-stubs.js';
import {UI} from './ui.js';
const Q=new URLSearchParams(location.search);
if(Q.has('fresh'))localStorage.removeItem(CFG.saveKey);
const loaded=S.load(localStorage,Date.now());const state=loaded.state;
const world=S.newWorld(state,+(Q.get('seed')||7));
const wallMat=mat('#e2cba6'),tatamiMat=mat('#d3c08e');
function applyTheme(){const th=CFG.themes.find(t=>t.id===state.theme)||CFG.themes[0];wallMat.color.set(th.wall);tatamiMat.color.set(th.tatami);sun.color.set(th.light);}
applyTheme();
// figures for shibas / customers
const SH_SCALE=1.35,HU_SCALE=1.55;const shibaFig=new Map(),custFig=new Map();
function ensureShibaFig(sh){if(shibaFig.has(sh.id))return shibaFig.get(sh.id);const f=dog(false,sh.coat,sh.expr);f.g.scale.setScalar(SH_SCALE);scene.add(f.g);shibaFig.set(sh.id,f);return f;}
function ensureCustFig(c){if(custFig.has(c.id))return custFig.get(c.id);const f=human(c.kind);f.g.scale.setScalar(HU_SCALE);scene.add(f.g);custFig.set(c.id,f);return f;}
const popLayer=document.getElementById('pops');
function screenOf(x,y,z){const v=new T.Vector3(x,y,z).project(camera);return [(v.x+1)/2*innerWidth,(1-v.y)/2*innerHeight];}
function pop(text,x,y,z){const [px,py]=screenOf(x,y,z);const d=document.createElement('div');d.className='pop';d.textContent=text;d.style.left=px+'px';d.style.top=py+'px';popLayer.appendChild(d);setTimeout(()=>d.remove(),1600);}
let incomeFrac=0;
function step(dt){S.tick(world,state,dt);incomeFrac+=S.incomePerSec(state)*dt;if(incomeFrac>=1){const n=Math.floor(incomeFrac);state.coins+=n;incomeFrac-=n;}
 for(const e of world.events.splice(0)){if(e.type==='pay')pop(`+${e.coins}🪙 +${e.paws}🐾`,e.x,1.9,e.z);if(e.type==='pet')SDK.sfx('pet');}
 ui.tick();}
let tNow=0;
function draw(){tNow=world.t;
 const alive=new Set(world.customers.map(c=>c.id));for(const [id,f] of custFig)if(!alive.has(id)){scene.remove(f.g);custFig.delete(id);}
 for(const c of world.customers){const f=ensureCustFig(c);const walking=c.phase==='enter'||c.phase==='leave';f.g.position.set(c.x,.17+(walking?Math.abs(Math.sin(world.t*9))*.06:0)+(c.petting?Math.abs(Math.sin(world.t*6))*.03:0),c.z);f.g.rotation.y=c.heading;}
 let hi=0;
 for(const sh of world.shibas){const f=ensureShibaFig(sh);const moving=sh.phase==='roam'||sh.phase==='toTable';
  f.g.position.set(sh.x,sh.y+.11+(moving?Math.abs(Math.sin(world.t*10+sh.id))*.04:0),sh.z);f.g.rotation.y=sh.heading;
  f.g.rotation.x=sh.phase==='pet'?Math.sin(world.t*5)*.05:0;f.g.rotation.z=sh.phase==='pet'?Math.sin(world.t*7)*.04:0;
  if(sh.phase==='pet')for(let i=0;i<3&&hi<hearts.length;i++,hi++){const h=hearts[hi];const k=(world.t*.6+i/3)%1;h.visible=true;h.position.set(sh.x+(i-1)*.38,sh.y+1.4+k*.7,sh.z);h.scale.setScalar(.85+Math.sin(k*Math.PI)*.15);h.quaternion.copy(camera.quaternion);}}
 for(;hi<hearts.length;hi++)hearts[hi].visible=false;
 donggu.g.rotation.z=Math.sin(performance.now()/900)*.02; // 동구 stays seated; tiny breathing sway only
 composer.render();}
// ---- gacha overlay: a second transparent WebGL view rendering the real 3D figure (no images) ----
const gl2=new T.WebGLRenderer({canvas:document.getElementById('reveal3d'),alpha:true,antialias:true,preserveDrawingBuffer:true});gl2.setPixelRatio(1);gl2.outputColorSpace=T.SRGBColorSpace;gl2.toneMapping=T.NeutralToneMapping;
const rScene=new T.Scene();rScene.add(new T.HemisphereLight('#fff3e2','#a8927a',2.2));const rSun=new T.DirectionalLight('#ffe6c8',2.4);rSun.position.set(-2,4,5);rScene.add(rSun);
const rCam=new T.PerspectiveCamera(30,1,.1,20);rCam.position.set(0,.7,3.6);rCam.lookAt(0,.55,0);const rHolder=new T.Group();rScene.add(rHolder);
const figCache=new Map();function figFor(coat,expr){const k=coat+expr;if(!figCache.has(k))figCache.set(k,dog(false,coat,expr));return figCache.get(k);}
function renderFigure(coat,expr,w,h,spin=0,sc=1){rHolder.clear();const f=figFor(coat,expr);f.g.scale.setScalar(sc);f.g.rotation.y=spin;f.g.position.set(0,0,0);rHolder.add(f.g);gl2.setSize(w,h,false);rCam.aspect=w/h;rCam.updateProjectionMatrix();gl2.render(rScene,rCam);}
const thumbs=new Map();function thumb(coat,expr){const k=coat+expr;if(!thumbs.has(k)){renderFigure(coat,expr,160,160,-.35,1.15);thumbs.set(k,gl2.domElement.toDataURL());}return thumbs.get(k);}
const ui=UI({state,world,CFG,S,SDK,thumb,renderFigure,applyTheme,loaded,addToCafe:o=>{const sh=S.addShiba(world,o);if(sh){ensureShibaFig(sh);}},save:()=>S.save(localStorage,state,Date.now())});
// ---- loop ----
let manual=Q.has('still');let last=performance.now();
function frame(now){const dt=Math.min(.1,(now-last)/1000);last=now;if(!manual){let left=dt;while(left>1e-6){const d=Math.min(1/30,left);step(d);left-=d;}draw();}ui.frame(now);requestAnimationFrame(frame);}
setInterval(()=>{if(!manual)S.save(localStorage,state,Date.now());},10000);
addEventListener('visibilitychange',()=>{if(document.hidden)S.save(localStorage,state,Date.now());});
draw();requestAnimationFrame(frame);
window.__game={state,world,CFG,step(sec){manual=true;for(let i=0;i<Math.round(sec*30);i++)step(1/30);draw();ui.tick();return {t:world.t,customers:world.customers.map(c=>c.phase),shibas:world.shibas.map(s=>s.phase)};},
 draw,open:n=>ui.open(n),close:()=>ui.close(),gachaShow:(coat,expr,t,r)=>ui.gachaShow(coat,expr,t,r),setPan(p,z){pan=p;zoom=z||zoom;clampView();draw();}};
window.__firstCheck={setTime(t){window.__game.step(t);return {}}};
