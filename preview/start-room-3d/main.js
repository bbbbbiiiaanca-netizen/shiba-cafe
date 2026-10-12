import * as T from './vendor/three.module.min.js';
import {visitAt} from './timeline.js';
const renderer=new T.WebGLRenderer({canvas:document.querySelector('canvas'),antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.VSMShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
const scene=new T.Scene();{const c=document.createElement('canvas');c.width=4;c.height=256;const a=c.getContext('2d');const g=a.createLinearGradient(0,0,0,256);g.addColorStop(0,'#f9dcb4');g.addColorStop(.55,'#f6d0a0');g.addColorStop(1,'#eebd88');a.fillStyle=g;a.fillRect(0,0,4,256);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;scene.background=tx;}
scene.add(new T.HemisphereLight('#ffe2bc','#8a5a38',1.55));
const sun=new T.DirectionalLight('#ffc98a',3.0);sun.position.set(-4,9,6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-9,right:9,top:8,bottom:-8});sun.shadow.normalBias=.025;sun.shadow.bias=-.0002;sun.shadow.radius=9;sun.shadow.blurSamples=20;scene.add(sun);
const camera=new T.OrthographicCamera();camera.position.set(10,10,13);camera.lookAt(-.2,.35,.2);
function resize(){const w=innerWidth,h=innerHeight,span=10.3;camera.left=-span/2;camera.right=span/2;camera.top=span*h/w/2;camera.bottom=-span*h/w/2;camera.updateProjectionMatrix();renderer.setSize(w,h);}resize();addEventListener('resize',resize);
function canvasTex(w,h,draw,rep=[1,1]){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(...rep);t.anisotropy=4;return t;}
let tseed=7;const tr=()=>{tseed=(tseed*16807)%2147483647;return tseed/2147483647;};
const woodTex=canvasTex(256,256,(a,w,h)=>{a.fillStyle='#fff';a.fillRect(0,0,w,h);for(let i=0;i<70;i++){a.strokeStyle=`rgba(90,45,20,${.06+tr()*.12})`;a.lineWidth=1+tr()*2.5;a.beginPath();let y=tr()*h;a.moveTo(0,y);for(let x=0;x<=w;x+=16){y+=(tr()-.5)*3;a.lineTo(x,y);}a.stroke();}});
const tatamiTex=canvasTex(256,256,(a,w,h)=>{a.fillStyle='#fff';a.fillRect(0,0,w,h);for(let y=0;y<h;y+=4){a.fillStyle=`rgba(110,95,40,${.10+tr()*.10})`;a.fillRect(0,y,w,1.6);}for(let i=0;i<500;i++){a.fillStyle=`rgba(120,100,50,${tr()*.08})`;a.fillRect(tr()*w,tr()*h,6+tr()*14,1);}});
const dirtTex=canvasTex(256,256,(a,w,h)=>{a.fillStyle='#fff';a.fillRect(0,0,w,h);for(let i=0;i<2600;i++){const v=tr();a.fillStyle=v<.5?`rgba(60,32,14,${.08+tr()*.18})`:`rgba(255,230,190,${tr()*.15})`;const r=.6+tr()*2.2;a.beginPath();a.arc(tr()*w,tr()*h,r,0,7);a.fill();}},[2,2]);
const texFor={'#7b4224':woodTex,'#a36739':woodTex,'#a97640':woodTex,'#b17b43':woodTex,'#c99b63':woodTex,'#d8bd7f':tatamiTex,'#7a5232':dirtTex,'#8a6040':dirtTex};
const rgCache=new Map();
function roundedGeo(sx,sy,sz){const r=Math.min(.05,Math.min(sx,sy,sz)*.35);const key=[sx,sy,sz].map(v=>v.toFixed(3)).join();if(rgCache.has(key))return rgCache.get(key);
 const seg=(v)=>Math.max(2,Math.min(12,Math.round(v/ .08)));const g=new T.BoxGeometry(sx,sy,sz,seg(sx),seg(sy),seg(sz));const P=g.attributes.position,v=new T.Vector3(),inner=new T.Vector3(sx/2-r,sy/2-r,sz/2-r);
 for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i);const c=new T.Vector3(Math.max(-inner.x,Math.min(inner.x,v.x)),Math.max(-inner.y,Math.min(inner.y,v.y)),Math.max(-inner.z,Math.min(inner.z,v.z)));const d=v.clone().sub(c);if(d.lengthSq()>1e-9){d.normalize().multiplyScalar(r);v.copy(c).add(d);P.setXYZ(i,v.x,v.y,v.z);}}
 g.computeVertexNormals();rgCache.set(key,g);return g;}
const mats=new Map();function mat(c){if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:.93,metalness:0,map:texFor[c]||null}));return mats.get(c);}
const sphere=new T.SphereGeometry(1,28,20),cube=new T.BoxGeometry(1,1,1),cylinder=new T.CylinderGeometry(1,1,1,24);
function mesh(p,g,c,pos,scale){const m=new T.Mesh(g,mat(c));m.position.set(...pos);m.scale.set(...scale);m.castShadow=m.receiveShadow=true;p.add(m);return m;}
const box=(p,c,pos,scale)=>(Math.max(...scale)>50||Math.min(...scale)<.012)?mesh(p,cube,c,pos,scale):mesh(p,roundedGeo(...scale),c,pos,[1,1,1]),ball=(p,c,pos,scale)=>mesh(p,sphere,c,pos,scale),cyl=(p,c,pos,scale)=>mesh(p,cylinder,c,pos,scale);
const wood='#7b4224',edge='#a36739',cream='#fff1d7',ink='#302018';
box(scene,'#efc898',[.5,-.39,0],[200,.12,200]);scene.children.at(-1).material=new T.ShadowMaterial({color:'#7a4520',opacity:.28});
box(scene,wood,[-1.7,-.18,0],[5.8,.36,5.2]);box(scene,edge,[-1.7,.01,0],[5.64,.06,5.03]);
for(let x=0;x<3;x++)for(let z=0;z<3;z++){
 const px=-3.56+x*1.86,pz=-1.7+z*1.7;box(scene,'#d8bd7f',[px,.065,pz],[1.8,.07,1.64]);
 box(scene,'#687052',[px-.91,.105,pz],[.055,.02,1.65]);
 for(let q=0;q<10;q++)box(scene,'#ccb278',[px,.104,pz-.75+q*.16],[1.76,.002,.009]);
}
// Only rear and left walls: no ceiling or front wall.
box(scene,'#c99b63',[-1.7,.9,-2.55],[5.8,1.7,.12]);box(scene,'#c99b63',[-4.55,.9,0],[.12,1.7,5.2]);
for(const y of [.15,.65,1.7]){box(scene,wood,[-1.7,y,-2.49],[5.8,.12,.15]);box(scene,wood,[-4.49,y,0],[.15,.12,5.2]);}
for(const x of [-4.48,-1.6,1.12])box(scene,wood,[x,.9,-2.48],[.14,1.85,.16]);
// Counter and shelving.
box(scene,wood,[-1.3,.48,-1.75],[4.5,.85,.62]);box(scene,edge,[-1.3,.94,-1.73],[4.65,.14,.79]);
for(let i=0;i<8;i++)box(scene,'#a97640',[-3.25+i*.52,.46,-1.42],[.42,.63,.025]);
for(const y of [.4,1.13,1.65])box(scene,wood,[-2.8,y,-2.28],[2.7,.09,.38]);
for(let i=0;i<6;i++){cyl(scene,'#b28a54',[-3.85+i*.43,1.24,-2.24],[.12,.17,.12]);cyl(scene,cream,[-3.85+i*.43,1.33,-2.24],[.13,.025,.13]);}
for(const x of [-2.2,-1.6,-.95]){cyl(scene,cream,[x,1.05,-1.7],[.11,.13,.11]);cyl(scene,'#67472c',[x,1.12,-1.7],[.09,.008,.09]);}
const lantern=ball(scene,'#ffd18b',[.55,1.29,-1.72],[.24,.36,.24]);lantern.material=new T.MeshStandardMaterial({color:'#ffe0a0',roughness:1,emissive:'#ffb650',emissiveIntensity:1.1});
for(let y=1.03;y<1.6;y+=.085){const ring=new T.Mesh(new T.TorusGeometry(.235,.008,6,32),mat('#dfae64'));ring.rotation.x=Math.PI/2;ring.position.set(.55,y,-1.72);scene.add(ring);}cyl(scene,wood,[.55,1.64,-1.72],[.12,.06,.12]);
const fill=new T.PointLight('#ff9d3c',6,6,1.4);fill.position.set(.55,1.4,-1.5);scene.add(fill);
// Empty dirt module and perimeter fence, with open front entry.
box(scene,'#5e3d22',[3.13,-.2,.1],[3.6,.22,4.8]);box(scene,'#7a5232',[3.13,-.07,.1],[3.55,.05,4.76]);
let seed=123;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
for(let i=0;i<500;i++){const x=1.4+rand()*3.45,z=-2.2+rand()*4.58;ball(scene,i%3?'#6a4528':'#8a6040',[x,-.036,z],[.025+rand()*.025,.012,.024]);}
function fence(a,b){const dx=b[0]-a[0],dz=b[1]-a[1],n=Math.ceil(Math.hypot(dx,dz)/.85);for(let i=0;i<=n;i++)cyl(scene,edge,[a[0]+dx*i/n,.31,a[1]+dz*i/n],[.055,.76,.055]);for(const y of [.22,.53]){const rail=box(scene,wood,[(a[0]+b[0])/2,y,(a[1]+b[1])/2],[Math.hypot(dx,dz),.07,.07]);rail.rotation.y=-Math.atan2(dz,dx);}}
fence([1.4,-2.2],[4.84,-2.2]);fence([4.84,-2.2],[4.84,2.35]);fence([3.2,2.35],[4.84,2.35]);
for(let i=0;i<32;i++){const x=1.4+rand()*3.45;ball(scene,'#7c8147',[x,-.025,-2.18],[.10,.025,.06]);}
function table(x,z){box(scene,wood,[x,.46,z],[1.3,.13,1.05]);box(scene,'#b17b43',[x,.535,z],[1.34,.025,1.09]);for(const a of [-.5,.5])for(const b of [-.37,.37])box(scene,wood,[x+a,.22,z+b],[.09,.44,.09]);for(const a of [-.95,.95]){const c=box(scene,'#66744a',[x+a,.13,z],[.56,.18,.62]);}cyl(scene,cream,[x+.37,.6,z-.28],[.09,.11,.09]);cyl(scene,'#593921',[x+.37,.661,z-.28],[.072,.008,.072]);cyl(scene,'#bf9057',[x-.4,.57,z-.27],[.17,.03,.17]);for(let i=0;i<3;i++)ball(scene,'#e6bc79',[x-.47+i*.07,.61,z-.27],[.045,.035,.04]);}
table(-2.8,.15);table(-.65,.7);
function human(owner=false,girl=false){const g=new T.Group();const skin='#f0c49e',shirt=owner?'#ad7848':girl?'#ed928f':'#83a968';
 ball(g,shirt,[0,.43,0],[.19,.25,.15]);const head=new T.Group();head.position.y=.83;g.add(head);ball(head,skin,[0,0,0],[.245,.245,.22]);ball(head,'#493022',[0,.12,-.04],[.255,.16,.22]);
 for(const s of [-1,1]){ball(head,skin,[s*.24,-.015,0],[.055,.07,.05]);ball(head,ink,[s*.085,-.015,.2],[.034,.043,.021]);ball(head,'#e49a80',[s*.15,-.075,.184],[.042,.02,.015]);}
 ball(head,'#925638',[0,-.105,.212],[.043,.012,.01]);ball(head,skin,[0,-.06,.22],[.029,.025,.025]);
 for(let i=0;i<5;i++){const lock=ball(head,'#493022',[-.17+i*.08,.14,.12],[.065,.095,.06]);lock.rotation.z=(i-2)*.2;}
 if(girl)for(const s of [-1,1])ball(head,'#493022',[s*.26,.03,-.04],[.09,.18,.09]);
 const arms=[];for(const s of [-1,1]){const a=new T.Group();a.position.set(s*.21,.59,0);g.add(a);cyl(a,shirt,[0,-.085,0],[.065,.17,.065]);ball(a,skin,[0,-.22,.02],[.065,.08,.065]);arms.push(a);if(owner){cyl(g,'#695039',[s*.10,.14,0],[.075,.28,.075]);ball(g,'#493022',[s*.10,.015,.055],[.09,.045,.14]);}else {cyl(g,girl?'#efb6a4':'#b29a68',[s*.10,.13,.16],[.072,.18,.072]).rotation.x=Math.PI/2;ball(g,cream,[s*.1,.08,.31],[.09,.065,.12]);}}
 if(owner){box(g,'#e9d4a8',[0,.4,.15],[.29,.36,.035]);for(const s of [-1,1])box(g,cream,[s*.1,.64,.11],[.035,.25,.028]);box(g,'#cbb68f',[0,.39,.175],[.13,.1,.009]);}else g.position.y=.17;
 return {g,head,arms};}
const owner=human(true);owner.g.scale.setScalar(1.3);owner.g.position.set(-.45,.05,-2.05);scene.add(owner.g);
const boy=human();boy.g.scale.setScalar(1.3);boy.g.position.x=-1.64;boy.g.position.z=.7;boy.g.rotation.y=Math.PI/2;scene.add(boy.g);
const girl=human(false,true);girl.g.scale.setScalar(1.3);girl.g.position.x=-3.72;girl.g.position.z=.15;girl.g.rotation.y=Math.PI/2;scene.add(girl.g);
const COATS={red:{fur:'#d9853c',band:'#c4402f',mark:'#fff1d7'},white:{fur:'#f6ead6',band:'#efc23e',mark:'#f39fb0'}};
function dog(donggu=false,coat='red'){const g=new T.Group(),head=new T.Group();const C=COATS[coat],orange=C.fur;ball(g,orange,[0,.29,-.08],[.23,.27,.29]);ball(g,cream,[0,.32,.15],[.18,.2,.07]);
 for(const s of [-1,1]){ball(g,orange,[s*.17,.12,-.15],[.12,.12,.14]);cyl(g,orange,[s*.14,.19,.16],[.07,.29,.075]);ball(g,cream,[s*.14,.055,.19],[.095,.065,.13]);}
 head.position.set(0,.62,.11);g.add(head);ball(head,orange,[0,0,0],[.29,.275,.245]);
 for(const s of [-1,1]){const ear=mesh(head,new T.ConeGeometry(1,1,3),orange,[s*.20,.25,-.025],[.115,.25,.10]);ear.rotation.z=-s*.17;mesh(head,new T.ConeGeometry(1,1,3),'#edb38a',[s*.2,.265,.025],[.065,.14,.025]);ball(head,cream,[s*.14,-.1,.18],[.14,.115,.085]);ball(head,ink,[s*.105,.015,.224],[.045,.052,.028]);ball(head,cream,[s*.1,.115,.20],[.036,.025,.018]);}
 ball(head,cream,[0,-.105,.235],[.12,.075,.07]);ball(head,ink,[0,-.055,.294],[.054,.034,.029]);ball(head,'#694132',[0,-.145,.286],[.06,.027,.011]);ball(head,'#ef9a91',[0,-.162,.294],[.03,.024,.01]);
 const tail=mesh(g,new T.TorusGeometry(.145,.065,12,28,Math.PI*1.85),orange,[.14,.4,-.31],[1,1,1]);tail.rotation.y=.6;
 cyl(g,donggu?'#308f89':C.band,[0,.45,.09],[.225,.07,.21]);
 if(donggu){cyl(g,'#e6ddd0',[0,.38,.29],[.06,.014,.06]).rotation.x=Math.PI/2;ball(g,'#f09c3d',[.09,.4,.27],[.044,.053,.018]);}
 else {const shape=new T.Shape();shape.moveTo(-.24,.07);shape.lineTo(.24,.07);shape.lineTo(0,-.27);shape.closePath();const bib=mesh(g,new T.ExtrudeGeometry(shape,{depth:.018,bevelEnabled:true,bevelSize:.012,bevelThickness:.008,bevelSegments:3,steps:1}),C.band,[0,.40,.275],[1,1,1]);
 // Fixed asanoha: six-spoke hemp-leaf geometry on the triangular red bib.
 if(coat==='red'){for(const [x,y] of [[-.12,.015],[.12,.015],[0,-.11]])for(let i=0;i<6;i++){const a=i*Math.PI/3;const line=mesh(bib,cube,C.mark,[x+Math.cos(a)*.03,y+Math.sin(a)*.03,.03],[.06,.008,.004]);line.rotation.z=a;}}else{for(const [x,y] of [[-.12,.02],[.12,.02],[0,-.11]])for(let i=0;i<5;i++){const a=i*Math.PI*2/5+Math.PI/2;ball(bib,C.mark,[x+Math.cos(a)*.022,y+Math.sin(a)*.022,.03],[.02,.02,.006]);}}}
 return {g,head,tail};}
const donggu=dog(true);donggu.g.scale.setScalar(1.25);donggu.g.position.set(.22,.05,-1.17);donggu.g.rotation.y=.3;scene.add(donggu.g);
// One guide bubble, built in the same scene; only its lettering uses a canvas texture.
const label=document.createElement('canvas');label.width=512;label.height=160;const ctx=label.getContext('2d');ctx.fillStyle='#fff8ec';ctx.fillRect(0,0,512,160);ctx.fillStyle='#493022';ctx.font='bold 54px sans-serif';ctx.textAlign='center';ctx.fillText('어서 와요! 동구예요',256,100);
const bubble=new T.Group();ball(bubble,cream,[0,0,0],[.75,.21,.055]);const text=new T.Mesh(new T.PlaneGeometry(1.35,.37),new T.MeshBasicMaterial({map:new T.CanvasTexture(label),transparent:true}));text.position.z=.058;bubble.add(text);mesh(bubble,new T.ConeGeometry(.10,.19,3),cream,[-.17,-.23,0],[1,1,.3]).rotation.z=Math.PI;scene.add(bubble);bubble.position.set(.22,1.32,-1.17);bubble.quaternion.copy(camera.quaternion);
function tagText(word,x,y,w,h){const c=document.createElement('canvas');c.width=128;c.height=64;const a=c.getContext('2d');a.fillStyle='#493022';a.font='bold 30px sans-serif';a.textAlign='center';a.fillText(word,64,43);const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true}));m.position.set(x,y,.31);donggu.g.add(m);}tagText('동구',0,.38,.10,.05);tagText('B',.09,.40,.06,.035);
const red=dog();red.g.scale.setScalar(1.08);scene.add(red.g);
// Extra props from guide p7: jars on shelf, plank pile on the empty plot.
for(let i=0;i<5;i++){const x=-3.9+i*.5;const jc=['#8a5a34','#b98a52','#6b4a32','#c9a06a','#7c5236'][i];ball(scene,jc,[x,.6,-2.25],[.15,.17,.15]);cyl(scene,'#4b3020',[x,.76,-2.25],[.08,.05,.08]);}
for(let i=0;i<4;i++)ball(scene,['#a8784a','#d2b07a','#86603c','#c48d55'][i],[-3.6+i*.55,1.78,-2.25],[.13,.14,.13]);
for(let l=0;l<3;l++)for(let i=0;i<4;i++){const b=box(scene,l%2?'#b58250':'#a36739',[3.4+(l%2? (i-1.5)*.25:0),.0+l*.1,.4+(l%2?0:(i-1.5)*.25)],l%2?[.22,.09,1.1]:[1.1,.09,.22]);}
const blobTex=canvasTex(128,128,(a,w,h)=>{const g=a.createRadialGradient(64,64,4,64,64,64);g.addColorStop(0,'rgba(60,25,8,.55)');g.addColorStop(1,'rgba(60,25,8,0)');a.fillStyle=g;a.fillRect(0,0,w,h);});
function blob(x,y,z,sx,sz){const m=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:blobTex,transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x,y,z);m.scale.set(sx,sz,1);scene.add(m);return m;}
blob(-2.8,.11,.15,2.4,1.7);blob(-.65,.11,.7,2.4,1.7);blob(.22,.11,-1.17,.9,.8);blob(-1.3,.11,-1.35,4.6,.5);blob(3.4,-.035,.4,1.6,1.6);
const redBlob=blob(0,.11,0,.8,.8);
const white=dog(false,'white');white.g.scale.setScalar(1.0);white.g.position.set(-3.0,.6,-.05);white.g.rotation.y=-.5;scene.add(white.g);
const heartShape=new T.Shape();heartShape.moveTo(0,-.15);heartShape.bezierCurveTo(-.32,.03,-.24,.31,0,.16);heartShape.bezierCurveTo(.24,.31,.32,.03,0,-.15);
const hearts=Array.from({length:3},()=>{const m=new T.Mesh(new T.ExtrudeGeometry(heartShape,{depth:.025,bevelEnabled:true,bevelSize:.015,bevelThickness:.01,bevelSegments:2,steps:1}),mat('#ed7f82'));scene.add(m);return m;});
let manual=new URLSearchParams(location.search).has('still'),time=0,start=performance.now();
function render(t){const s=visitAt(t);red.g.position.set(s.x,s.y+.11,s.z);redBlob.position.set(s.x,s.y>.3?.6:.11,s.z);red.g.rotation.y=s.phase==='return'?0:Math.PI;red.tail.rotation.z=Math.sin(t*7)*.15;red.head.rotation.x=s.hearts?Math.sin(t*5)*.08:0;boy.arms[1].rotation.x=s.hearts?-1.2+Math.sin(t*7)*.12:-.55;boy.arms[1].rotation.z=s.hearts?-.4:0;
 hearts.forEach((h,i)=>{h.visible=s.hearts;const k=(t*.6+i/3)%1;h.position.set(s.x+(i-1)*.27,s.y+1.12+k*.6,s.z);h.scale.setScalar(.45+Math.sin(k*Math.PI)*.08);h.quaternion.copy(camera.quaternion);});renderer.render(scene,camera);time=t;}
window.__firstCheck={setTime(t){manual=true;render(t);return visitAt(t);},forceVisit(){manual=true;render(4);},state:()=>visitAt(time),renderer,scene,camera};
function frame(){if(!manual)render(Math.min((performance.now()-start)/1000,10));requestAnimationFrame(frame);}render(0);requestAnimationFrame(frame);
