import * as THREE from 'three';
import { CELL, WIDTH, HEIGHT, ENTRY, seededRandom } from './sim.js';
const geometries={box:new THREE.BoxGeometry(1,1,1),sphere:new THREE.SphereGeometry(1,12,8),cylinder:new THREE.CylinderGeometry(1,1,1,12),cone:new THREE.ConeGeometry(1,1,8),tail:new THREE.TorusGeometry(.17,.065,6,14,Math.PI*1.65)};
const materials=new Map();
export function material(color,extra={}) {
  const k=color+JSON.stringify(extra);
  if(!materials.has(k))materials.set(k,new THREE.MeshStandardMaterial({color,roughness:.84,...extra}));
  return materials.get(k);
}
function mesh(parent,shape,color,pos,size,extra={}) {
  const m=new THREE.Mesh(geometries[shape],material(color,extra));m.position.set(...pos);m.scale.set(...size);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
const box=(p,c,xyz,whd)=>mesh(p,'box',c,xyz,whd);
const ball=(p,c,xyz,whd)=>mesh(p,'sphere',c,xyz,whd);
const cyl=(p,c,xyz,whd)=>mesh(p,'cylinder',c,xyz,whd);
function beam(p,c,a,b,r) {
  const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),delta=vb.clone().sub(va);
  const m=cyl(p,c,va.add(vb).multiplyScalar(.5).toArray(),[r,delta.length(),r]);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;
}
export const world = (x,z) => new THREE.Vector3((x-(WIDTH-1)/2)*CELL,0,(z-(HEIGHT-1)/2)*CELL);
export function createDog({adult=false,scarf=0}={}) {
  const root=new THREE.Group(),body=new THREE.Group();root.add(body);
  const orange='#d9823b',cream='#fff1d8';
  ball(body,orange,[0,.37,-.08],[.25,.28,.32]);ball(body,cream,[0,.38,.18],[.185,.21,.095]);
  const legs=[];
  for(const x of [-.16,.16])for(const z of [-.24,.14]) {
    const leg=new THREE.Group();leg.position.set(x,.28,z);body.add(leg);legs.push(leg);
    cyl(leg,orange,[0,-.08,0],[.065,.22,.065]);ball(leg,cream,[0,-.2,.025],[.078,.055,.095]);
  }
  const head=new THREE.Group();head.position.set(0,.7,.19);body.add(head);
  ball(head,orange,[0,0,0],[.29,.27,.255]);
  for(const s of [-1,1]) {
    const ear=mesh(head,'cone',orange,[s*.2,.24,-.055],[.125,.27,.095]);ear.rotation.z=-s*.22;
    const inner=mesh(head,'cone','#e8a498',[s*.2,.25,-.005],[.065,.15,.025]);inner.rotation.z=-s*.22;
    ball(head,cream,[s*.16,-.08,.18],[.125,.12,.09]);
    ball(head,'#201615',[s*.107,.035,.229],[.034,.044,.025]);ball(head,'#fff8ed',[s*.107-.009,.05,.249],[.009,.009,.006]);
    ball(head,cream,[s*.1,.105,.205],[.037,.022,.025]);
  }
  ball(head,cream,[0,-.1,.225],[.125,.105,.09]);ball(head,'#211a19',[0,-.05,.302],[.054,.039,.034]);
  ball(head,'#542b29',[0,-.135,.3],[.044,.038,.012]);ball(head,'#ed9b9a',[0,-.151,.313],[.028,.028,.008]);
  const colors=['#b84148','#354f78','#5c876a'];
  cyl(body,adult?'#419b99':colors[scarf%3],[0,.545,.1],[.205,.065,.19]);
  if(adult){ball(body,'#d8dfdf',[0,.5,.305],[.048,.058,.014],{metalness:.7,roughness:.3});}
  else {
    const bib=mesh(body,'cone',colors[scarf%3],[0,.435,.267],[.17,.2,.025]);bib.rotation.z=Math.PI;
    for(const x of [-.08,0,.08])box(body,'#f7dfc2',[x,.455,.295],[.024,.025,.008]);
    box(body,'#f7dfc2',[0,.395,.298],[.025,.025,.008]);
  }
  const tail=new THREE.Group();tail.position.set(0,.53,-.34);body.add(tail);
  const curl=new THREE.Mesh(geometries.tail,material(orange));curl.rotation.y=Math.PI/2;curl.rotation.z=.2;curl.castShadow=true;tail.add(curl);
  ball(tail,cream,[0,.125,-.08],[.07,.07,.07]);
  root.scale.setScalar(.66);
  if(adult) {root.scale.setScalar(1.05);body.position.y=-.04;legs.forEach((leg,i)=>{if(i%2===0){leg.position.z=-.14;leg.rotation.x=-.8;}});}
  return {root,body,head,legs,tail};
}
export function animateDog(model,time,walking,seated=false) {
  model.tail.rotation.y=Math.sin(time*4.5)*.35;
  model.body.position.y=walking?Math.abs(Math.sin(time*10))*.045:0;
  model.legs.forEach((leg,i)=>{leg.rotation.x=walking?Math.sin(time*10+(i===0||i===3?0:Math.PI))*.55:(seated&&i%2===0?-.75:0);});
  model.head.rotation.y=Math.sin(time*1.1)*.07;
}
export function createGuest(kind=0) {
  const root=new THREE.Group(),body=new THREE.Group();root.add(body);
  const skin=['#efc3a5','#f0c7a8','#f6ceb6'][kind],shirt=['#a4bcc5','#b7c998','#d6a5c4'][kind];
  cyl(body,shirt,[0,.5,0],[.17,.36,.135]);
  const head=new THREE.Group();head.position.y=.86;body.add(head);
  ball(head,skin,[0,0,0],[.17,.19,.16]);ball(head,'#423033',[0,.09,-.025],[.18,.125,.16]);
  for(const s of [-1,1]) {ball(head,'#433432',[s*.06,-.015,.15],[.012,.016,.006]);ball(head,'#e7a5a1',[s*.1,-.055,.135],[.026,.013,.01]);}
  if(kind===2)for(const s of [-1,1]){ball(head,'#493337',[s*.19,.025,-.04],[.085,.12,.075]);ball(head,'#b87e9c',[s*.18,.06,-.025],[.033,.033,.033]);}
  const arms=[],legs=[];
  for(const s of [-1,1]) {
    const arm=new THREE.Group();arm.position.set(s*.18,.63,0);body.add(arm);arms.push(arm);
    cyl(arm,shirt,[0,-.105,0],[.054,.22,.054]);ball(arm,skin,[0,-.25,0],[.053,.065,.055]);
    const leg=new THREE.Group();leg.position.set(s*.085,.34,0);body.add(leg);legs.push(leg);
    cyl(leg,'#6e738e',[0,-.13,0],[.062,.28,.065]);ball(leg,'#f5ede1',[0,-.29,.025],[.072,.046,.11]);
  }
  root.scale.setScalar(kind===0?1.5:1.18);
  return {root,body,head,arms,legs};
}
export function animateGuest(m,time,walking,petting,seated) {
  m.body.position.y=seated?-.25:(walking?Math.abs(Math.sin(time*8))*.018:0);
  m.legs.forEach((leg,i)=>leg.rotation.x=seated?-Math.PI/2:(walking?Math.sin(time*8+i*Math.PI)*.4:0));
  m.arms.forEach((arm,i)=>{arm.scale.y=petting&&i===1?2.4:1;arm.rotation.x=petting&&i===1?-2.2+Math.sin(time*5)*.15:(walking?Math.sin(time*8+i*Math.PI)*.25:(seated?-.7:0));arm.rotation.z=petting&&i===1?-.25:0;});
  m.head.rotation.x=petting?.12:0;
}
export function createFurniture(item) {
  const root=new THREE.Group();root.userData.furnitureId=item.id;
  if(item.kind==='table') {
    box(root,'#ad7455',[CELL/2,.48,CELL/2],[1.05,.105,.86]);
    box(root,'#c5916c',[CELL/2,.541,CELL/2],[1.055,.018,.87]);
    for(const x of [-.12,.68])for(const z of [-.03,.59])box(root,'#825037',[x,.23,z],[.085,.46,.085]);
    const cushion=ball(root,'#af8aaf',[0,.08,CELL*2],[.29,.105,.27]);cushion.receiveShadow=true;
    ball(root,'#c5a5c3',[0,.155,CELL*2],[.23,.018,.215]);
    cyl(root,'#eee0cf',[.82,.57,.15],[.055,.04,.055]);cyl(root,'#9b715a',[.82,.591,.15],[.045,.006,.045]);
    box(root,'#c0a3ad',[.1,.558,.1],[.16,.012,.23]);
  } else if(item.kind==='moon') {
    cyl(root,'#a5785a',[0,.1,0],[.18,.18,.18]);
    ball(root,'#fff0c0',[0,.5,0],[.29,.29,.29],{emissive:'#ffdba0',emissiveIntensity:1.2,roughness:.5});
    const light=new THREE.PointLight('#ffcd8a',3,4,2);light.position.set(0,.62,0);root.add(light);
  } else {
    cyl(root,'#e0d0b9',[0,.16,0],[.18,.32,.18]);cyl(root,'#604738',[0,.326,0],[.16,.014,.16]);
    for(let i=0;i<7;i++){const a=i*2.4;beam(root,'#547758',[0,.3,0],[Math.cos(a)*.18,.65+i*.027,Math.sin(a)*.18],.02);const leaf=ball(root,'#7a9b71',[Math.cos(a)*.18,.65+i*.027,Math.sin(a)*.18],[.1,.17,.045]);leaf.rotation.z=a;}
  }
  return root;
}
export function createRoom() {
  const root=new THREE.Group(),rand=seededRandom(301);
  const wood='#83543e',lightwood='#aa7754',frontRand=seededRandom(902);
  box(root,'#ceacc7',[0,-.1,0],[5.9,.2,6.9]);
  // Fine woven tatami seams and warm perimeter wood.
  for(let x=-2.75;x<=2.75;x+=1.1)box(root,'#bfa0b8',[x,.003,0],[.018,.009,6.6]);
  for(let z=-3.3;z<=3.3;z+=1.65)box(root,'#bfa0b8',[0,.004,z],[5.5,.01,.014]);
  for(let z=-3.3;z<3.3;z+=.075)box(root,'#d5b6cd',[0,.001,z],[5.5,.002,.003]);
  box(root,wood,[0,-.02,-3.45],[6,.15,.25]);box(root,lightwood,[-2.85,-.03,0],[.22,.13,6.9]);box(root,lightwood,[2.85,-.03,0],[.22,.13,6.9]);
  // Large open garden window; roof is omitted so portrait camera sees the room.
  for(const x of [-2.85,-1.95,1.95,2.85])box(root,wood,[x,1.45,-3.35],[.16,2.9,.19]);
  box(root,wood,[0,2.8,-3.35],[5.9,.24,.25]);
  for(const s of [-1,1]) {
    box(root,'#ddbda9',[s*2.91,.64,-1.9],[.1,1.28,2.8]);
    box(root,wood,[s*2.85,1.45,-.55],[.14,2.9,.14]);
    box(root,wood,[s*2.85,2.82,-1.95],[.18,.16,2.85]);
    // Bamboo blinds flank the view, with many narrow slats.
    for(let y=1.3;y<2.7;y+=.057)box(root,'#b58b5e',[s*2.4,y,-3.31],[.78,.039,.027]);
    for(const x of [s*2.18,s*2.58])box(root,'#715040',[x,2,-3.285],[.009,1.45,.013]);
    for(let z=-3.3;z<-.6;z+=.42)box(root,'#b28565',[s*2.84,.7,z],[.018,1.22,.013]);
  }
  box(root,wood,[0,-.03,3.42],[5.9,.14,.19]);
  // The doorway straddles the simulation's entry cell, so existing routes pass through it.
  const entry=world(ENTRY.x,ENTRY.z),entryWood='#79513b';
  for(const x of [entry.x-.65,entry.x+.65])box(root,entryWood,[x,.98,entry.z],[.10,1.96,.12]);
  box(root,entryWood,[entry.x,2.0,entry.z],[1.5,.14,.17]);
  beam(root,lightwood,[entry.x-.7,1.88,entry.z+.025],[entry.x+.7,1.88,entry.z+.025],.028);
  for(const side of [-1,1]) {
    const x=entry.x+side*.31;
    box(root,'#a97692',[x,1.69,entry.z+.06],[.58,.36,.025]);
    // Cream paw crest on each split noren panel.
    ball(root,'#f9e8db',[x,1.66,entry.z+.079],[.056,.045,.009]);
    for(const dx of [-.052,0,.052])ball(root,'#f9e8db',[x+dx,1.73,entry.z+.079],[.019,.024,.009]);
  }
  box(root,'#a47a5e',[entry.x,-.12,3.72],[1.24,.15,.5]);
  ball(root,'#a897a9',[2.12,.075,2.8],[.37,.095,.32]);
  // Continuous low ground covers the view even at the furthest allowed orbit/zoom.
  box(root,'#b4ac97',[0,-.38,0],[90,.2,90]);
  box(root,'#b3ad97',[0,-.25,7.5],[26,.12,8.2]);
  // Broad timber veranda, flush with the entry step and visibly made of planks.
  box(root,wood,[0,-.2,4.23],[6.3,.18,1.48]);
  for(let z=3.55;z<4.96;z+=.18)box(root,z<4.1?'#bd916a':'#b48560',[0,-.103,z],[6.24,.024,.164]);
  box(root,lightwood,[entry.x,-.235,5.12],[1.5,.12,.38]);
  for(const x of [-3.04,3.04])box(root,wood,[x,-.13,4.24],[.10,.14,1.48]);
  // Stepping stones lead out from the actual door, with gravel and moss on both sides.
  for(let i=0;i<9;i++) {
    const z=5.5+i*.77,x=entry.x+Math.sin(i*.8)*.32;
    const stone=ball(root,i%2?'#cec5b5':'#dfd4c4',[x,-.14,z],[.34,.065,.26]);stone.rotation.y=i*.6;
  }
  for(let i=0;i<180;i++) {
    const x=(frontRand()-.5)*23,z=3.7+frontRand()*11;
    if(Math.abs(x)<3.3&&z<5.3)continue;
    const gravel=ball(root,['#d8cdbd','#c7bdad','#ede0cf'][i%3],[x,-.17,z],[.045+frontRand()*.055,.022,.035+frontRand()*.06]);gravel.castShadow=false;
  }
  for(let i=0;i<32;i++) {
    const x=(i%2?1:-1)*(1.25+frontRand()*9),z=5.4+frontRand()*9;
    ball(root,'#8d9c78',[x,-.15,z],[.32+frontRand()*.5,.085,.25+frontRand()*.38]);
    ball(root,['#a29e8d','#beb5a1'][i%2],[x+.15,-.07,z],[.15+frontRand()*.2,.12,.16+frontRand()*.16]);
  }
  // Side gardens also remain visible at either orbit limit.
  for(const side of [-1,1])for(let i=0;i<15;i++) {
    const x=side*(3.3+frontRand()*3),z=-3.3+frontRand()*7.3;
    ball(root,'#929f7d',[x,-.18,z],[.22+frontRand()*.28,.07,.22+frontRand()*.2]);
    ball(root,'#c2b9a6',[x+.13,-.13,z+.1],[.12,.055,.14]);
  }
  // Small veranda pots stay clear of the entry route.
  for(const x of [-2.5,2.5]) {
    cyl(root,'#bd9074',[x,.03,4.45],[.18,.27,.18]);cyl(root,'#685344',[x,.173,4.45],[.15,.015,.15]);
    for(let i=0;i<5;i++) {
      const a=i*2.4,tip=[x+Math.cos(a)*.14,.38+i*.04,4.45+Math.sin(a)*.12];
      beam(root,'#67835c',[x,.17,4.45],tip,.014);
      ball(root,'#91a578',tip,[.09,.12,.06]);
    }
  }
  // Low stone lantern marks the path without hiding the room.
  const lx=-1.3,lz=6.5;
  cyl(root,'#c5baa7',[lx,-.10,lz],[.28,.16,.28]);cyl(root,'#b7ac99',[lx,.15,lz],[.10,.40,.10]);
  box(root,'#d8cbb6',[lx,.43,lz],[.30,.23,.28]);box(root,'#776b56',[lx,.43,lz+.145],[.13,.11,.008]);
  const entryRoof=mesh(root,'cone','#b1a591',[lx,.63,lz],[.33,.19,.33]);entryRoof.rotation.y=Math.PI/4;
  ball(root,'#d9ccb6',[lx,.76,lz],[.05,.065,.05]);
  // Vase with cherry twigs on a side shelf.
  box(root,lightwood,[-2.55,.3,-2.3],[.42,.1,1.2]);
  ball(root,'#eee0ca',[-2.55,.5,-2.3],[.13,.2,.13]);cyl(root,'#e0ccb3',[-2.55,.68,-2.3],[.065,.15,.065]);
  for(let i=0;i<5;i++) {
    const x=-2.55+(rand()-.5)*.5,z=-2.3+(rand()-.5)*.4,y=.9+rand()*.45;
    beam(root,'#765544',[-2.55,.7,-2.3],[x,y,z],.009);
    for(let j=0;j<3;j++)ball(root,['#f1baca','#f4d6df'][j%2],[x+(rand()-.5)*.1,y+rand()*.1,z+(rand()-.5)*.1],[.045,.035,.045]);
  }
  // Garden: gravel stream, moss rocks, layered mountain silhouettes.
  box(root,'#a6ad8b',[0,-.22,-6.65],[13,.2,6.5]);
  for(let i=0;i<80;i++) {
    const z=-3.6-rand()*6,x=Math.sin(z)*.5+(rand()-.5)*1.15;
    const stone=ball(root,'#e5ddd8',[x,-.082,z],[.07+rand()*.08,.022,.07+rand()*.07]);stone.castShadow=false;
  }
  for(let i=0;i<30;i++) {
    const s=i%2?1:-1,x=s*(.95+rand()*3.8),z=-3.5-rand()*5;
    ball(root,['#849075','#9b9b86','#b1a59b'][i%3],[x,-.04,z],[.18+rand()*.35,.09+rand()*.2,.18+rand()*.35]);
    ball(root,'#81946f',[x+.1,.04,z],[.26,.06,.22]);
  }
  for(let layer=0;layer<3;layer++)for(let i=0;i<8;i++) {
    const mountain=mesh(root,'cone',['#d8bfd4','#cbb4cf','#bca8c2'][layer],[-11+i*3.1,.5,-15+layer*1.6],[2.6,3.6+rand()*2.5,.7]);mountain.castShadow=false;
  }
  // Bonsai pine, asymmetrical trunk and stacked flattened crowns.
  beam(root,'#6c5144',[1.35,-.1,-5.7],[1.5,1.55,-5.7],.11);
  for(let i=0;i<5;i++) {
    const y=.75+i*.27,x=1.5+(i%2?-.4:.35)*(1-i*.1);
    beam(root,'#6c5144',[1.5,y-.3,-5.7],[x,y,-5.7],.045);
    ball(root,'#677858',[x,y,-5.7],[.95-i*.13,.15,.45]);ball(root,'#879569',[x,y+.06,-5.7],[.8-i*.12,.09,.39]);
  }
  // Stone lantern.
  cyl(root,'#bcb1a2',[-.9,.07,-5.45],[.3,.14,.3]);cyl(root,'#c8bdab',[-.9,.36,-5.45],[.105,.53,.105]);
  box(root,'#dbd0bd',[-.9,.71,-5.45],[.37,.26,.32]);box(root,'#77725d',[-.9,.73,-5.278],[.15,.12,.008]);
  const roof=mesh(root,'cone','#b3a896',[-.9,.98,-5.45],[.38,.22,.38]);roof.rotation.y=Math.PI/4;ball(root,'#ded2bf',[-.9,1.15,-5.45],[.06,.08,.06]);
  // Cherry trees frame the opening without closing the central view.
  for(const s of [-1,1]) {
    const bx=s*3.8,bz=-5.7;
    beam(root,'#79544d',[bx,-.15,bz],[bx-s*.35,2.2,bz],.12);
    for(let i=0;i<9;i++) {
      const x=bx-s*(.2+rand()*2.3),y=2.1+rand()*1.7,z=bz+(rand()-.5)*2;
      beam(root,'#79544d',[bx-s*.3,1.6,bz],[x,y,z],.035);
      for(let j=0;j<6;j++)ball(root,['#e4a8bf','#edbdd0','#f4d3df'][j%3],[x+(rand()-.5)*.65,y+(rand()-.5)*.35,z+(rand()-.5)*.6],[.25+rand()*.15,.15,.23]);
    }
  }
  // Batch static props by shared geometry/material: fewer draw calls on phones.
  const batches=new Map();
  for(const child of [...root.children]) {
    if(!child.isMesh)continue;
    const key=child.geometry.uuid+child.material.uuid+child.castShadow+child.receiveShadow;
    if(!batches.has(key))batches.set(key,[]);
    child.updateMatrix();batches.get(key).push(child);root.remove(child);
  }
  for(const group of batches.values()) {
    const first=group[0],batch=new THREE.InstancedMesh(first.geometry,first.material,group.length);
    batch.castShadow=first.castShadow;batch.receiveShadow=first.receiveShadow;
    group.forEach((m,i)=>batch.setMatrixAt(i,m.matrix));batch.computeBoundingSphere();root.add(batch);
  }
  return root;
}
const heartShape=new THREE.Shape();heartShape.moveTo(0,-.45);heartShape.bezierCurveTo(-.9,.1,-.6,.75,0,.35);heartShape.bezierCurveTo(.6,.75,.9,.1,0,-.45);
export const heartGeometry=new THREE.ShapeGeometry(heartShape,8);
