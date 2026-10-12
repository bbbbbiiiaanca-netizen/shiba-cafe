import * as T from './vendor/three.module.min.js';
import {visitAt} from './timeline.js';
const renderer=new T.WebGLRenderer({canvas:document.querySelector('canvas'),antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
const scene=new T.Scene();scene.background=new T.Color('#fff8ec');
scene.add(new T.HemisphereLight('#fff4dc','#b69470',2.1));
const sun=new T.DirectionalLight('#ffe5be',3.1);sun.position.set(-3,8,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-9,right:9,top:8,bottom:-8});sun.shadow.normalBias=.025;sun.shadow.bias=-.0002;sun.shadow.radius=4;scene.add(sun);
const camera=new T.OrthographicCamera();camera.position.set(10,10,13);camera.lookAt(.75,.3,0);
function resize(){const w=innerWidth,h=innerHeight,span=11.6;camera.left=-span/2;camera.right=span/2;camera.top=span*h/w/2;camera.bottom=-span*h/w/2;camera.updateProjectionMatrix();renderer.setSize(w,h);}resize();addEventListener('resize',resize);
const mats=new Map();function mat(c){if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:.96,metalness:0}));return mats.get(c);}
const sphere=new T.SphereGeometry(1,28,20),cube=new T.BoxGeometry(1,1,1),cylinder=new T.CylinderGeometry(1,1,1,24);
function mesh(p,g,c,pos,scale){const m=new T.Mesh(g,mat(c));m.position.set(...pos);m.scale.set(...scale);m.castShadow=m.receiveShadow=true;p.add(m);return m;}
const box=(p,c,pos,scale)=>mesh(p,cube,c,pos,scale),ball=(p,c,pos,scale)=>mesh(p,sphere,c,pos,scale),cyl=(p,c,pos,scale)=>mesh(p,cylinder,c,pos,scale);
const wood='#7b4224',edge='#a36739',cream='#fff1d7',ink='#302018';
box(scene,'#f4e5cf',[.5,-.39,0],[200,.12,200]);
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
const lantern=ball(scene,'#ffd18b',[.55,1.29,-1.72],[.24,.36,.24]);lantern.material=new T.MeshStandardMaterial({color:'#ffe0a0',roughness:1,emissive:'#ffb650',emissiveIntensity:.4});
for(let y=1.03;y<1.6;y+=.085){const ring=new T.Mesh(new T.TorusGeometry(.235,.008,6,32),mat('#dfae64'));ring.rotation.x=Math.PI/2;ring.position.set(.55,y,-1.72);scene.add(ring);}cyl(scene,wood,[.55,1.64,-1.72],[.12,.06,.12]);
const fill=new T.PointLight('#ffb45c',2.5,4);fill.position.set(.55,1.4,-1.5);scene.add(fill);
// Empty dirt module and perimeter fence, with open front entry.
box(scene,'#887044',[3.13,-.2,.1],[3.6,.22,4.8]);box(scene,'#a2794c',[3.13,-.07,.1],[3.55,.05,4.76]);
let seed=123;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
for(let i=0;i<500;i++){const x=1.4+rand()*3.45,z=-2.2+rand()*4.58;ball(scene,i%3?'#96754a':'#b08b5c',[x,-.036,z],[.025+rand()*.025,.012,.024]);}
function fence(a,b){const dx=b[0]-a[0],dz=b[1]-a[1],n=Math.ceil(Math.hypot(dx,dz)/.85);for(let i=0;i<=n;i++)cyl(scene,edge,[a[0]+dx*i/n,.31,a[1]+dz*i/n],[.055,.76,.055]);for(const y of [.22,.53]){const rail=box(scene,wood,[(a[0]+b[0])/2,y,(a[1]+b[1])/2],[Math.hypot(dx,dz),.07,.07]);rail.rotation.y=-Math.atan2(dz,dx);}}
fence([1.4,-2.2],[4.84,-2.2]);fence([4.84,-2.2],[4.84,2.35]);fence([3.2,2.35],[4.84,2.35]);
for(let i=0;i<32;i++){const x=1.4+rand()*3.45;ball(scene,'#7c8147',[x,-.025,-2.18],[.10,.025,.06]);}
function table(x,z){box(scene,wood,[x,.46,z],[1.3,.13,1.05]);box(scene,'#b17b43',[x,.535,z],[1.34,.025,1.09]);for(const a of [-.5,.5])for(const b of [-.37,.37])box(scene,wood,[x+a,.22,z+b],[.09,.44,.09]);for(const a of [-.95,.95]){const c=box(scene,'#66744a',[x+a,.13,z],[.56,.18,.62]);c.geometry=new T.BoxGeometry(1,1,1,2,2,2);}cyl(scene,cream,[x+.37,.6,z-.28],[.09,.11,.09]);cyl(scene,'#593921',[x+.37,.661,z-.28],[.072,.008,.072]);cyl(scene,'#bf9057',[x-.4,.57,z-.27],[.17,.03,.17]);for(let i=0;i<3;i++)ball(scene,'#e6bc79',[x-.47+i*.07,.61,z-.27],[.045,.035,.04]);}
table(-2.8,.15);table(-.65,.7);
function human(owner=false,girl=false){const g=new T.Group();const skin='#f0c49e',shirt=owner?'#ad7848':girl?'#ed928f':'#83a968';
 ball(g,shirt,[0,.43,0],[.19,.25,.15]);const head=new T.Group();head.position.y=.83;g.add(head);ball(head,skin,[0,0,0],[.245,.245,.22]);ball(head,'#493022',[0,.12,-.04],[.255,.16,.22]);
 for(const s of [-1,1]){ball(head,skin,[s*.24,-.015,0],[.055,.07,.05]);ball(head,ink,[s*.085,-.015,.2],[.034,.043,.021]);ball(head,cream,[s*.078,0,.22],[.008,.009,.004]);ball(head,'#e49a80',[s*.15,-.075,.184],[.042,.02,.015]);}
 ball(head,'#925638',[0,-.105,.212],[.043,.012,.01]);ball(head,skin,[0,-.06,.22],[.029,.025,.025]);
 for(let i=0;i<5;i++){const lock=ball(head,'#493022',[-.17+i*.08,.14,.12],[.065,.095,.06]);lock.rotation.z=(i-2)*.2;}
 if(girl)for(const s of [-1,1])ball(head,'#493022',[s*.26,.03,-.04],[.09,.18,.09]);
 const arms=[];for(const s of [-1,1]){const a=new T.Group();a.position.set(s*.21,.59,0);g.add(a);cyl(a,shirt,[0,-.085,0],[.065,.17,.065]);ball(a,skin,[0,-.22,.02],[.065,.08,.065]);arms.push(a);if(owner){cyl(g,'#695039',[s*.10,.14,0],[.075,.28,.075]);ball(g,'#493022',[s*.10,.015,.055],[.09,.045,.14]);}else {cyl(g,girl?'#efb6a4':'#b29a68',[s*.10,.13,.16],[.072,.18,.072]).rotation.x=Math.PI/2;ball(g,cream,[s*.1,.08,.31],[.09,.065,.12]);}}
 if(owner){box(g,'#e9d4a8',[0,.4,.15],[.29,.36,.035]);for(const s of [-1,1])box(g,cream,[s*.1,.64,.11],[.035,.25,.028]);box(g,'#cbb68f',[0,.39,.175],[.13,.1,.009]);}else g.position.y=.17;
 return {g,head,arms};}
const owner=human(true);owner.g.position.set(-.45,.05,-2.05);scene.add(owner.g);
const boy=human();boy.g.position.x=-1.64;boy.g.position.z=.7;boy.g.rotation.y=Math.PI/2;scene.add(boy.g);
const girl=human(false,true);girl.g.position.x=-3.75;girl.g.position.z=.15;girl.g.rotation.y=Math.PI/2;scene.add(girl.g);
function dog(donggu=false){const g=new T.Group(),head=new T.Group();const orange='#df9145';ball(g,orange,[0,.29,-.08],[.23,.27,.29]);ball(g,cream,[0,.32,.15],[.18,.2,.07]);
 for(const s of [-1,1]){ball(g,orange,[s*.17,.12,-.15],[.12,.12,.14]);cyl(g,orange,[s*.14,.19,.16],[.07,.29,.075]);ball(g,cream,[s*.14,.055,.19],[.095,.065,.13]);}
 head.position.set(0,.62,.11);g.add(head);ball(head,orange,[0,0,0],[.29,.275,.245]);
 for(const s of [-1,1]){const ear=mesh(head,new T.ConeGeometry(1,1,3),orange,[s*.20,.25,-.025],[.115,.25,.10]);ear.rotation.z=-s*.17;mesh(head,new T.ConeGeometry(1,1,3),'#edb38a',[s*.2,.265,.025],[.065,.14,.025]);ball(head,cream,[s*.14,-.1,.18],[.14,.115,.085]);ball(head,ink,[s*.105,.015,.224],[.045,.052,.028]);ball(head,cream,[s*.115,.035,.247],[.013,.013,.006]);ball(head,cream,[s*.1,.115,.20],[.036,.025,.018]);}
 ball(head,cream,[0,-.105,.235],[.12,.075,.07]);ball(head,ink,[0,-.055,.294],[.054,.034,.029]);ball(head,'#694132',[0,-.145,.286],[.06,.027,.011]);ball(head,'#ef9a91',[0,-.162,.294],[.03,.024,.01]);
 const tail=mesh(g,new T.TorusGeometry(.145,.065,12,28,Math.PI*1.85),orange,[.14,.4,-.31],[1,1,1]);tail.rotation.y=.6;
 cyl(g,donggu?'#308f89':'#c74537',[0,.45,.09],[.225,.07,.21]);
 if(donggu){cyl(g,'#e6ddd0',[0,.38,.29],[.06,.014,.06]).rotation.x=Math.PI/2;ball(g,'#f09c3d',[.09,.4,.27],[.044,.053,.018]);}
 else {const shape=new T.Shape();shape.moveTo(-.19,.07);shape.lineTo(.19,.07);shape.lineTo(0,-.20);shape.closePath();const bib=mesh(g,new T.ExtrudeGeometry(shape,{depth:.018,bevelEnabled:true,bevelSize:.007,bevelThickness:.005,bevelSegments:2,steps:1}),'#c74537',[0,.40,.275],[1,1,1]);
 // Fixed asanoha: six-spoke hemp-leaf geometry on the triangular red bib.
 for(const [x,y] of [[-.10,.015],[.09,.015],[0,-.085]])for(let i=0;i<6;i++){const a=i*Math.PI/3;const line=box(bib,cream,[x+Math.cos(a)*.024,y+Math.sin(a)*.024,.027],[.05,.006,.003]);line.rotation.z=a;}}
 return {g,head,tail};}
const donggu=dog(true);donggu.g.position.set(.22,.05,-1.17);donggu.g.rotation.y=.3;scene.add(donggu.g);
// One guide bubble, built in the same scene; only its lettering uses a canvas texture.
const label=document.createElement('canvas');label.width=512;label.height=160;const ctx=label.getContext('2d');ctx.fillStyle='#fff8ec';ctx.fillRect(0,0,512,160);ctx.fillStyle='#493022';ctx.font='bold 38px sans-serif';ctx.textAlign='center';ctx.fillText('시바를 기다려 주세요',256,94);
const bubble=new T.Group();ball(bubble,cream,[0,0,0],[.75,.21,.055]);const text=new T.Mesh(new T.PlaneGeometry(1.35,.37),new T.MeshBasicMaterial({map:new T.CanvasTexture(label),transparent:true}));text.position.z=.058;bubble.add(text);mesh(bubble,new T.ConeGeometry(.10,.19,3),cream,[-.17,-.23,0],[1,1,.3]).rotation.z=Math.PI;scene.add(bubble);bubble.position.set(.22,1.32,-1.17);bubble.quaternion.copy(camera.quaternion);
function tagText(word,x,y,w,h){const c=document.createElement('canvas');c.width=128;c.height=64;const a=c.getContext('2d');a.fillStyle='#493022';a.font='bold 30px sans-serif';a.textAlign='center';a.fillText(word,64,43);const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true}));m.position.set(x,y,.31);donggu.g.add(m);}tagText('동구',0,.38,.10,.05);tagText('B',.09,.40,.06,.035);
const red=dog();red.g.scale.setScalar(.82);scene.add(red.g);
const heartShape=new T.Shape();heartShape.moveTo(0,-.15);heartShape.bezierCurveTo(-.32,.03,-.24,.31,0,.16);heartShape.bezierCurveTo(.24,.31,.32,.03,0,-.15);
const hearts=Array.from({length:3},()=>{const m=new T.Mesh(new T.ExtrudeGeometry(heartShape,{depth:.025,bevelEnabled:true,bevelSize:.015,bevelThickness:.01,bevelSegments:2,steps:1}),mat('#ed7f82'));scene.add(m);return m;});
let manual=new URLSearchParams(location.search).has('still'),time=0,start=performance.now();
function render(t){const s=visitAt(t);red.g.position.set(s.x,s.y+.11,s.z);red.g.rotation.y=s.phase==='return'?0:Math.PI;red.tail.rotation.z=Math.sin(t*7)*.15;red.head.rotation.x=s.hearts?Math.sin(t*5)*.08:0;boy.arms[1].rotation.x=s.hearts?-1.2+Math.sin(t*7)*.12:-.55;boy.arms[1].rotation.z=s.hearts?-.4:0;
 hearts.forEach((h,i)=>{h.visible=s.hearts;const k=(t*.6+i/3)%1;h.position.set(s.x+(i-1)*.27,s.y+1.12+k*.6,s.z);h.scale.setScalar(.45+Math.sin(k*Math.PI)*.08);h.quaternion.copy(camera.quaternion);});renderer.render(scene,camera);time=t;}
window.__firstCheck={setTime(t){manual=true;render(t);return visitAt(t);},forceVisit(){manual=true;render(4);},state:()=>visitAt(time),renderer,scene,camera};
function frame(){if(!manual)render(Math.min((performance.now()-start)/1000,10));requestAnimationFrame(frame);}render(0);requestAnimationFrame(frame);
