// Pass 4: smooth single-piece clay figures. Each body is one SDF (smooth-union of
// ellipsoids/capsules) polygonized by MarchingCubes, painted with vertex colours.
import * as T from './vendor/three.module.min.js';
import {MarchingCubes} from './vendor/jsm/MarchingCubes.js';
const clay=new T.MeshStandardMaterial({vertexColors:true,roughness:.92,metalness:0});
const E=(c,r,col,k=.06)=>({t:'e',c,r,col:new T.Color(col),k});
const C=(a,b,r,col,k=.06)=>({t:'c',a,b,r,col:new T.Color(col),k});
function dPrim(p,x,y,z){if(p.t==='e'){const [cx,cy,cz]=p.c,[rx,ry,rz]=p.r;const X=(x-cx)/rx,Y=(y-cy)/ry,Z=(z-cz)/rz;const k0=Math.hypot(X,Y,Z),k1=Math.hypot(X/rx,Y/ry,Z/rz);return k0*(k0-1)/Math.max(k1,1e-6);}
 const [ax,ay,az]=p.a,[bx,by,bz]=p.b;const px=x-ax,py=y-ay,pz=z-az,qx=bx-ax,qy=by-ay,qz=bz-az;const h=Math.max(0,Math.min(1,(px*qx+py*qy+pz*qz)/(qx*qx+qy*qy+qz*qz)));return Math.hypot(px-qx*h,py-qy*h,pz-qz*h)-p.r;}
function sdf(P,x,y,z){let d=1e9;for(const p of P){const e=dPrim(p,x,y,z);const k=p.k;const h=Math.max(k-Math.abs(d-e),0)/k;d=Math.min(d,e)-h*h*k*.25;}return d;}
export function figure(P,res=60){let lo=[1e9,1e9,1e9],hi=[-1e9,-1e9,-1e9];for(const p of P){const pts=p.t==='e'?[p.c.map((v,i)=>v-p.r[i]),p.c.map((v,i)=>v+p.r[i])]:[p.a.map((v,i)=>Math.min(v,p.b[i])-p.r),p.a.map((v,i)=>Math.max(v,p.b[i])+p.r)];for(let i=0;i<3;i++){lo[i]=Math.min(lo[i],pts[0][i]-.05);hi[i]=Math.max(hi[i],pts[1][i]+.05);}}
 const ctr=lo.map((v,i)=>(v+hi[i])/2),half=Math.max(...hi.map((v,i)=>(v-lo[i])/2))*1.08;
 const mc=new MarchingCubes(res,clay,false,false,120000);mc.isolation=0;const S=mc.size,hs=S/2;
 for(let z=0;z<S;z++)for(let y=0;y<S;y++)for(let x=0;x<S;x++){const wx=ctr[0]+(x-hs)/hs*half,wy=ctr[1]+(y-hs)/hs*half,wz=ctr[2]+(z-hs)/hs*half;mc.field[x+y*S+z*S*S]=-sdf(P,wx,wy,wz)*40;}
 mc.update();const n=mc.count;const pos=new Float32Array(n*3),nor=new Float32Array(n*3),col=new Float32Array(n*3);
 for(let i=0;i<n;i++){for(let j=0;j<3;j++){pos[i*3+j]=mc.positionArray[i*3+j]*half+ctr[j];nor[i*3+j]=mc.normalArray[i*3+j];}
  // colour: softly blended by which primitive the surface point sits on
  let w=0,cc=new T.Color(0,0,0);for(const p of P){const d=dPrim(p,pos[i*3],pos[i*3+1],pos[i*3+2]);const ww=Math.exp(-Math.max(d,0)/.006)*(d<.02?1:0)+1e-9;cc.r+=p.col.r*ww;cc.g+=p.col.g*ww;cc.b+=p.col.b*ww;w+=ww;}
  col[i*3]=cc.r/w;col[i*3+1]=cc.g/w;col[i*3+2]=cc.b/w;}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('normal',new T.BufferAttribute(nor,3));g.setAttribute('color',new T.BufferAttribute(col,3));
{const N=new T.Vector3();for(let i=0;i<n;i++){N.set(nor[i*3],nor[i*3+1],nor[i*3+2]);if(!(N.length()>.1))N.set(0,1,0);N.normalize();nor.set([N.x,N.y,N.z],i*3);}}
 const m=new T.Mesh(g,clay);m.castShadow=m.receiveShadow=true;m.userData.P=P;return m;}
// Face paint: small flattened ovals laid onto the surface found by marching the SDF from the front.
const dm=new Map();const dmat=c=>{if(!dm.has(c))dm.set(c,new T.MeshStandardMaterial({color:c,roughness:.85,metalness:0}));return dm.get(c);};
const sph=new T.SphereGeometry(1,20,14);
export function decal(parent,P,x,y,sx,sy,color,lift=.002,depth=.012,zFrom=1){let z=zFrom;for(let i=0;i<400&&sdf(P,x,y,z)>.0005;i++)z-=Math.min(.03,Math.max(sdf(P,x,y,z)*.8,.0008));
 const e=.003,n=new T.Vector3(sdf(P,x+e,y,z)-sdf(P,x-e,y,z),sdf(P,x,y+e,z)-sdf(P,x,y-e,z),sdf(P,x,y,z+e)-sdf(P,x,y,z-e)).normalize();
 const m=new T.Mesh(sph,dmat(color));m.scale.set(sx,sy,depth);m.position.set(x,y,z).addScaledVector(n,lift);m.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),n);parent.add(m);return m;}
export function smile(parent,P,x,y,w,color,arc=Math.PI*.8){let z=1;for(let i=0;i<400&&sdf(P,x,y,z)>.0005;i++)z-=Math.min(.03,Math.max(sdf(P,x,y,z)*.8,.0008));
 const m=new T.Mesh(new T.TorusGeometry(w,w*.22,8,20,arc),dmat(color));m.rotation.z=Math.PI+(Math.PI-arc)/2;m.position.set(x,y+w*.5,z-.004);parent.add(m);return m;}
function patternTex(kind){const c=document.createElement('canvas');c.width=c.height=256;const a=c.getContext('2d');
 if(kind==='asanoha'){a.fillStyle='#c4483c';a.fillRect(0,0,256,256);a.strokeStyle='#fbefe0';a.lineWidth=5;const s=64,h=s*Math.sqrt(3)/2;for(let r=-1;r<6;r++)for(let q=-1;q<6;q++){const cx=q*s+(r%2?s/2:0),cy=r*h;for(let i=0;i<6;i++){const an=i*Math.PI/3+Math.PI/6;a.beginPath();a.moveTo(cx,cy);a.lineTo(cx+Math.cos(an)*s*.58,cy+Math.sin(an)*s*.58);a.stroke();}a.beginPath();for(let i=0;i<=6;i++){const an=i*Math.PI/3+Math.PI/6;a.lineTo(cx+Math.cos(an)*s*.58,cy+Math.sin(an)*s*.58);}a.stroke();}}
 else {a.fillStyle='#e8bb4a';a.fillRect(0,0,256,256);for(const [cx,cy] of [[48,52],[176,40],[112,128],[40,200],[200,180],[128,240],[240,100]]){for(let i=0;i<5;i++){const an=i*Math.PI*2/5-Math.PI/2;a.fillStyle='#f6a6b6';a.beginPath();a.ellipse(cx+Math.cos(an)*15,cy+Math.sin(an)*15,12,9,an,0,7);a.fill();}a.fillStyle='#fff3d8';a.beginPath();a.arc(cx,cy,6,0,7);a.fill();}}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;return t;}
const PAT={asanoha:patternTex('asanoha'),sakura:patternTex('sakura')};
export const COATS={red:{fur:'#c98d58',cream:'#f6e8d3',band:'asanoha',bandCol:'#c4483c'},white:{fur:'#f1e8dc',cream:'#faf4ea',band:'sakura',bandCol:'#e8bb4a'}};
const INK='#3b2519',BLUSH='#eea08e';
export function dog(donggu=false,coat='red'){const K=COATS[coat],F=K.fur,W=K.cream,g=new T.Group();
 const P=[E([0,.28,-.05],[.24,.25,.23],F,.08),E([0,.33,.12],[.15,.17,.1],W,.06)];
 for(const s of [-1,1]){P.push(E([s*.15,.14,-.08],[.14,.13,.16],F,.07),C([s*.095,.3,.11],[s*.1,.07,.15],.07,F,.05),E([s*.1,.045,.19],[.08,.045,.085],W,.04),
  E([s*.16,.84,.05],[.085,.07,.06],F,.06),C([s*.165,.86,.045],[s*.2,.94,.03],.045,F,.05),E([s*.12,.58,.22],[.13,.095,.09],W,.05));}
 P.push(E([0,.66,.07],[.29,.25,.25],F,.09),E([0,.58,.27],[.11,.075,.08],W,.05));
 const tailPts=[];for(let i=0;i<=6;i++){const a=i/6*Math.PI*1.7;tailPts.push([.03+Math.cos(a)*.11,.42+Math.sin(a)*.11,-.3]);}
 for(let i=0;i<6;i++)P.push(C(tailPts[i],tailPts[i+1],.06,i>3?W:F,.04));
 const body=figure(P);g.add(body);
 for(const s of [-1,1]){decal(g,P,s*.105,.675,.042,.052,INK,.002,.02);decal(g,P,s*.105+.014,.693,.012,.012,'#fffaf0',.012,.006);
  decal(g,P,s*.11,.75,.03,.018,W,.001,.01);decal(g,P,s*.185,.6,.045,.026,BLUSH,.001,.008);
  const inner=decal(g,P,s*.17,.87,.03,.045,'#efb7a0',.001,.01,.2);}
 decal(g,P,0,.618,.042,.03,INK,.003,.022);smile(g,P,0,.565,.035,INK);decal(g,P,0,.535,.022,.022,'#e88a86',.003,.01);
 // tail as separate animated pivot = the whole figure tilts slightly; keep a dummy group for timeline
 const tail=new T.Group();g.add(tail);const head=new T.Group();g.add(head);
 if(donggu){const col=new T.Mesh(new T.TorusGeometry(.17,.028,12,32),dmat('#2f8a83'));col.rotation.x=Math.PI/2-.35;col.position.set(0,.47,.08);col.scale.set(1,1.05,1);g.add(col);
  const c2=document.createElement('canvas');c2.width=c2.height=128;const a=c2.getContext('2d');a.fillStyle='#d9d6cf';a.beginPath();a.arc(64,64,62,0,7);a.fill();a.fillStyle='#3b2519';a.font='bold 40px sans-serif';a.textAlign='center';a.fillText('동구',64,78);const tt=new T.CanvasTexture(c2);tt.colorSpace=T.SRGBColorSpace;
  const tag=new T.Mesh(new T.CylinderGeometry(.05,.05,.014,24),[new T.MeshStandardMaterial({color:'#cfcac0',roughness:.6}),new T.MeshStandardMaterial({map:tt,roughness:.7}),new T.MeshStandardMaterial({color:'#cfcac0'})]);tag.rotation.x=Math.PI/2;tag.position.set(0,.38,.27);g.add(tag);
  const b=new T.Mesh(new T.CylinderGeometry(.025,.025,.012,16),dmat('#ee9440'));b.rotation.x=Math.PI/2;b.position.set(.075,.4,.26);g.add(b);}
 else{const nb=new T.Mesh(new T.TorusGeometry(.165,.03,12,32),dmat(K.bandCol));nb.rotation.x=Math.PI/2-.35;nb.position.set(0,.48,.08);g.add(nb);
  const sh=new T.Shape();sh.moveTo(-.2,0);sh.quadraticCurveTo(0,.02,.2,0);sh.quadraticCurveTo(.06,-.16,0,-.24);sh.quadraticCurveTo(-.06,-.16,-.2,0);
  const geo=new T.ShapeGeometry(sh,16);const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*2.2,uv.getY(i)*2.2);
  // bend onto the chest: push vertices forward by the chest surface
  const p=geo.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i)+.47;let z=.6;for(let k=0;k<200&&sdf(P,x,y,z)>.0005;k++)z-=Math.min(.03,Math.max(sdf(P,x,y,z)*.8,.0008));z=Math.max(z,-.1);p.setXYZ(i,x,y,z+.012+Math.max(0,-p.getY(i))*.05);}geo.computeVertexNormals();
  const bib=new T.Mesh(geo,new T.MeshStandardMaterial({map:PAT[K.band],roughness:.95,side:T.DoubleSide}));bib.castShadow=true;g.add(bib);
  for(const s of [-1,1])decal(g,P,s*.2,.47,.035,.03,K.bandCol,.01,.03,.4);}
 return {g,head,tail,body};}
export function human(kind){const owner=kind==='owner',girl=kind==='girl',g=new T.Group();const skin='#f2cfac',hair=girl?'#4a2f22':'#3d2a20';
 const shirt=owner?'#9c6b45':girl?'#7d9a72':'#d9c49a',pants=owner?'#6a5240':girl?'#8a9e74':'#8a9b6a';
 const P=[];const hy=owner?1.0:.8;
 if(owner){P.push(C([-.08,.05,0],[-.08,.32,0],.075,pants,.05),C([.08,.05,0],[.08,.32,0],.075,pants,.05),E([0,.55,0],[.2,.26,.16],shirt,.08),E([0,.44,.12],[.165,.26,.06],'#f1e2c4',.012),C([-.1,.66,.1],[-.06,.76,.07],.025,'#f1e2c4',.01),C([.1,.66,.1],[.06,.76,.07],.025,'#f1e2c4',.01));}
 else{P.push(E([0,.34,0],[.2,.22,.17],shirt,.08),C([-.17,.1,.05],[.17,.1,.17],.085,pants,.06),C([.17,.1,.05],[-.17,.1,.17],.085,pants,.06));}
 P.push(C([0,hy-.3,0],[0,hy-.15,0],.07,skin,.05),E([0,hy,.02],[.25,.24,.23],skin,.07));
 for(const s of [-1,1])P.push(E([s*.245,hy-.01,.01],[.045,.06,.04],skin,.03));
 // hair: back cap + lifted fringe sitting above the eyes so the face stays open
 P.push(E([0,hy+.06,-.05],[.265,.22,.235],hair,.025),E([0,hy+.17,.08],[.22,.08,.17],hair,.03));
 for(const s of [-1,1])P.push(E([s*.2,hy+.08,.06],[.08,.12,.12],hair,.025));
 if(girl)P.push(E([0,hy+.27,-.08],[.11,.1,.1],hair,.04));
 const sh=owner?[.2,.68]:[.19,.48];
 for(const s of [-1,1]){const hand=owner?[s*.13,.36,.19]:[s*.1,.27,.25];P.push(C([s*sh[0]*.9,sh[1],0],hand,.05,shirt,.025),E(hand,[.055,.05,.06],skin,.02));}
 const body=figure(P,64);g.add(body);
 for(const s of [-1,1]){const eye=decal(g,P,s*.085,hy-.02,.032,.042,INK,.002,.018);decal(g,P,s*.085+.011,hy-.005,.01,.01,'#fffaf0',.011,.005);
  decal(g,P,s*.145,hy-.085,.04,.024,BLUSH,.001,.008);decal(g,P,s*.09,hy+.055,.032,.009,hair,.002,.008);}
 smile(g,P,0,hy-.12,.035,'#9a5a44');
 if(owner)decal(g,P,0,.42,.07,.05,'#cdb790',.003,.01);
 const arms=[new T.Group(),new T.Group()];arms.forEach(a=>g.add(a));if(!owner)g.position.y=.17;
 return {g,arms,body};}
