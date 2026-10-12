import * as THREE from 'three';
import { createSim, WIDTH, HEIGHT, CELL, seatOf, accessOf } from './sim.js';
import { createRoom, createDog, animateDog, createGuest, animateGuest, createFurniture, world, heartGeometry } from './models.js';
const canvas=document.querySelector('#scene'),hint=document.querySelector('#hint'),toastEl=document.querySelector('#toast');
let renderer;
try {renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});}
catch(error){const el=document.querySelector('#error');el.style.display='block';el.textContent='3D 화면을 열 수 없어요. WebGL을 지원하는 브라우저로 다시 열어 주세요.';throw error;}
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color('#e5c7d9');scene.fog=new THREE.Fog('#e5c7d9',17,38);
scene.add(new THREE.AmbientLight('#f7d8e7',1.35));
const sun=new THREE.DirectionalLight('#ffe0b2',3);sun.position.set(-3,7,2);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
Object.assign(sun.shadow.camera,{left:-5,right:5,top:5,bottom:-5,near:.1,far:18});sun.shadow.bias=-.0007;sun.shadow.normalBias=.025;sun.shadow.radius=3;scene.add(sun);
scene.add(createRoom());
const seedParam=Number(new URLSearchParams(location.search).get('seed')??1);const sim=createSim({seed:Number.isFinite(seedParam)?seedParam:1});
const furniture=new Map();
for(const item of sim.furniture){const model=createFurniture(item);model.position.copy(world(item.x,item.z));scene.add(model);furniture.set(item.id,model);}
const dogs=sim.dogs.map(d=>{const m=createDog({scarf:d.id});scene.add(m.root);return m;});
const boss=createDog({adult:true});boss.root.position.set(2.12,0,2.8);boss.root.rotation.y=-.6;scene.add(boss.root);
const guestModels=new Map();
const waitMaterial=new THREE.MeshBasicMaterial({color:'#fff5d9'}),heartMaterial=new THREE.MeshBasicMaterial({color:'#e786ac',side:THREE.DoubleSide,transparent:true,opacity:.85});
const waitGeometry=new THREE.SphereGeometry(.025,6,4),effects=new THREE.Group();scene.add(effects);
// Each heart fades independently; scale is calculated in CSS pixels at its depth.
heartGeometry.computeBoundingBox();
const heartHeight=heartGeometry.boundingBox.max.y-heartGeometry.boundingBox.min.y;
const cameraForward=new THREE.Vector3(),heartOffset=new THREE.Vector3();
const hearts=Array.from({length:9},()=>{const m=new THREE.Mesh(heartGeometry,heartMaterial.clone());m.visible=false;effects.add(m);return m;});
const camera=new THREE.PerspectiveCamera(48,1,.1,70),target=new THREE.Vector3(0,.4,.65);
let yaw=0,pitch=.78,zoom=1,baseDistance=11;
const cameraLimits={zoom:[.82,1.18],yaw:[-.55,.55],pitch:[.70,.88]};
function updateCamera(){const r=baseDistance*zoom;camera.position.set(target.x+Math.sin(yaw)*Math.cos(pitch)*r,target.y+Math.sin(pitch)*r,target.z+Math.cos(yaw)*Math.cos(pitch)*r);camera.lookAt(target);}
function resize(){const w=window.innerWidth,h=window.innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();baseDistance=Math.max(9.8,3.05/(Math.tan(THREE.MathUtils.degToRad(24))*camera.aspect))*1.03;updateCamera();}
window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);resize();
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),floorPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0),hitPoint=new THREE.Vector3();
const grid=new THREE.Group();scene.add(grid);grid.visible=false;
const tileGeometry=new THREE.PlaneGeometry(CELL*.9,CELL*.9);
const goodMaterial=new THREE.MeshBasicMaterial({color:'#91d3a1',transparent:true,opacity:.4,depthWrite:false,side:THREE.DoubleSide});
const badMaterial=new THREE.MeshBasicMaterial({color:'#d87f89',transparent:true,opacity:.28,depthWrite:false,side:THREE.DoubleSide});
const tiles=[];
for(let z=0;z<HEIGHT;z++)for(let x=0;x<WIDTH;x++){const m=new THREE.Mesh(tileGeometry,goodMaterial);m.rotation.x=-Math.PI/2;m.position.copy(world(x,z));m.position.y=.018;m.userData={x,z};grid.add(m);tiles.push(m);}
const selectionRing=new THREE.Mesh(new THREE.RingGeometry(.3,.34,32),new THREE.MeshBasicMaterial({color:'#fff0ad',side:THREE.DoubleSide,depthTest:false,transparent:true,opacity:.9}));selectionRing.rotation.x=-Math.PI/2;selectionRing.visible=false;selectionRing.renderOrder=5;scene.add(selectionRing);
let selected=null,toastTimer,gridRefresh=0;
function toast(message){toastEl.textContent=message;toastEl.style.opacity=1;clearTimeout(toastTimer);toastTimer=setTimeout(()=>toastEl.style.opacity=0,2200);}
function refreshGrid(){if(!selected)return;for(const tile of tiles)tile.material=sim.validateMove(selected,tile.userData.x,tile.userData.z).ok?goodMaterial:badMaterial;}
function select(id){selected=id;grid.visible=!!id;selectionRing.visible=!!id;if(id){const f=sim.furniture.find(f=>f.id===id);selectionRing.position.copy(world(f.x+(f.kind==='table'?.5:0),f.z+(f.kind==='table'?.5:0)));selectionRing.position.y=.03;selectionRing.scale.setScalar(f.kind==='table'?2:1);refreshGrid();toast('초록 칸을 탭하면 이동 · 다시 탭하면 취소');hint.classList.add('hidden');}}
function tap(clientX,clientY){const rect=canvas.getBoundingClientRect();pointer.set((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects([...furniture.values()],true);let id=null;
  if(hits.length){let obj=hits[0].object;while(obj&&!obj.userData.furnitureId)obj=obj.parent;id=obj?.userData.furnitureId;}
  if(selected){if(id===selected){select(null);return;}if(raycaster.ray.intersectPlane(floorPlane,hitPoint)){const x=Math.round(hitPoint.x/CELL+(WIDTH-1)/2),z=Math.round(hitPoint.z/CELL+(HEIGHT-1)/2);if(x>=0&&x<WIDTH&&z>=0&&z<HEIGHT){const result=sim.moveFurniture(selected,x,z);if(result.ok){const f=sim.furniture.find(f=>f.id===selected);furniture.get(selected).position.copy(world(f.x,f.z));select(null);toast('자리를 옮겼어요');}else toast(result.reason);return;}}select(null);return;}
  if(id){const f=sim.furniture.find(f=>f.id===id);if(f.kind==='table'&&sim.guests.some(g=>g.tableId===id)){toast('손님이 앉아 있어요');return;}select(id);}
}
const touches=new Map();let gesture=null,pinchDistance=0;
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);touches.set(e.pointerId,{x:e.clientX,y:e.clientY});if(touches.size===1)gesture={startX:e.clientX,startY:e.clientY,lastX:e.clientX,lastY:e.clientY,drag:false,multi:false};else {gesture.multi=true;const p=[...touches.values()];pinchDistance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);}});
canvas.addEventListener('pointermove',e=>{if(!touches.has(e.pointerId))return;touches.set(e.pointerId,{x:e.clientX,y:e.clientY});if(touches.size>=2){const p=[...touches.values()],dist=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);if(pinchDistance>0&&!selected)zoom=THREE.MathUtils.clamp(zoom*pinchDistance/Math.max(dist,1),...cameraLimits.zoom);pinchDistance=dist;updateCamera();return;}if(!gesture)return;if(Math.hypot(e.clientX-gesture.startX,e.clientY-gesture.startY)>=8)gesture.drag=true;if(gesture.drag&&!selected&&!gesture.multi){yaw=THREE.MathUtils.clamp(yaw-(e.clientX-gesture.lastX)*.005,...cameraLimits.yaw);pitch=THREE.MathUtils.clamp(pitch+(e.clientY-gesture.lastY)*.003,...cameraLimits.pitch);updateCamera();}gesture.lastX=e.clientX;gesture.lastY=e.clientY;});
function endPointer(e,cancel=false){if(!touches.has(e.pointerId))return;const g=gesture;touches.delete(e.pointerId);if(!cancel&&g&&!g.drag&&!g.multi&&Math.hypot(e.clientX-g.startX,e.clientY-g.startY)<8)tap(e.clientX,e.clientY);if(touches.size===0){gesture=null;pinchDistance=0;}}
canvas.addEventListener('pointerup',e=>endPointer(e));canvas.addEventListener('pointercancel',e=>endPointer(e,true));
canvas.addEventListener('wheel',e=>{e.preventDefault();if(!selected){zoom=THREE.MathUtils.clamp(zoom*Math.exp(e.deltaY*.001),...cameraLimits.zoom);updateCamera();}},{passive:false});
setTimeout(()=>hint.classList.add('hidden'),6500);
function syncModels(time) {
  for(const g of sim.guests){let model=guestModels.get(g.id);if(!model){model=createGuest(g.kind);model.dots=Array.from({length:3},()=>{const dot=new THREE.Mesh(waitGeometry,waitMaterial);model.root.add(dot);return dot;});guestModels.set(g.id,model);scene.add(model.root);}
    const t=sim.furniture.find(t=>t.id===g.tableId),seated=g.state==='waiting'||g.state==='petting';
    model.root.position.copy(world(seated?seatOf(t).x:g.x,seated?seatOf(t).z:g.z));model.root.rotation.y=seated?Math.PI:g.heading;
    animateGuest(model,time,g.state==='entering'||g.state==='leaving',g.state==='petting',seated);
    model.dots.forEach((dot,i)=>{dot.visible=g.state==='waiting';dot.position.set((i-1)*.075,1.15+Math.sin(time*3+i)*.015,0);});
  }
  for(const [id,m] of guestModels)if(!sim.guests.some(g=>g.id===id)){scene.remove(m.root);guestModels.delete(id);}
  for(const d of sim.dogs){const model=dogs[d.id],walking=d.path.length>0;model.root.position.copy(world(d.x,d.z));model.root.rotation.y=d.heading;
    if(d.tableId && d.state!=='approaching'){const table=sim.furniture.find(f=>f.id===d.tableId),a=world(accessOf(table).x,accessOf(table).z),b=world(table.x+.5,table.z+.65);b.y=.55;
      let k=d.state==='petting'?1:d.state==='jumping'?Math.min(d.progress,1):d.state==='descending'?1-Math.min(d.progress,1):0;
      model.root.position.lerpVectors(a,b,k);if(d.state==='jumping'||d.state==='descending')model.root.position.y+=Math.sin(k*Math.PI)*.38;
      const seat=world(seatOf(table).x,seatOf(table).z);
      model.root.rotation.y=Math.atan2(seat.x-b.x,seat.z-b.z);
    }
    animateDog(model,time,walking,d.state==='petting');
    for(let i=0;i<3;i++){
      const heart=hearts[d.id*3+i],phase=(time*.65+i/3)%1;
      heart.visible=d.state==='petting'&&phase<.92;
      if(heart.visible){
        heart.position.copy(model.root.position);heart.position.x+=(i-1)*.22+Math.sin(time*2+i)*.05;
        heart.position.y+=.8+phase*.85;heart.position.z+=.12;heart.quaternion.copy(camera.quaternion);
        camera.getWorldDirection(cameraForward);
        const depth=heartOffset.subVectors(heart.position,camera.position).dot(cameraForward);
        const pixels=18+4*Math.sin(phase*Math.PI);
        heart.scale.setScalar(pixels*2*depth*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/(window.innerHeight*heartHeight));
        heart.material.opacity=.95*Math.min(1,phase/.1,(.92-phase)/.25);
      }
    }
  }
  boss.head.rotation.y=Math.sin(time*.7)*.2;boss.tail.rotation.y=Math.sin(time*2)*.18;
}
let timeScale=1,last=performance.now(),accumulator=0;
window.__demo={sim,camera,renderer,state:()=>sim.state(),forceVisit:()=>{const result=sim.forceVisit();syncModels(sim.time);renderer.render(scene,camera);return result;},setTimeScale:n=>{if(Number.isFinite(n))timeScale=THREE.MathUtils.clamp(n,0,20);return timeScale;}};
function frame(now){requestAnimationFrame(frame);const elapsed=Math.min((now-last)/1000,.1);last=now;accumulator+=elapsed*timeScale;while(accumulator>=1/60){sim.step(1/60);accumulator-=1/60;}syncModels(sim.time);if(selected){gridRefresh+=elapsed;if(gridRefresh>.4){refreshGrid();gridRefresh=0;}}renderer.render(scene,camera);}
document.addEventListener('visibilitychange',()=>{last=performance.now();accumulator=0;});syncModels(0);requestAnimationFrame(frame);
