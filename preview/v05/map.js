/* Portrait camera, adapted from layout-test/portrait.html's pointer samples,
 * pinch anchor and exponential momentum. World includes generous ground margins. */
(function () {
'use strict';
const view = document.querySelector('#room'), world = document.querySelector('#world');
const W = 3600, H = 4400;
let vw, vh, minS, defS, maxS, s = 1, x = 0, y = 0, motionId = 0;
let bounds = { x: 1420, y: 2700, w: 760, h: 480 };
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const locked = () => !document.querySelector('#modal').classList.contains('hidden') || document.querySelector('#panel').classList.contains('open');
function apply() {
  x = clamp(x, vw-W*s, 0); y = clamp(y, vh-H*s, 0);
  world.style.transform = `translate3d(${x}px,${y}px,0) scale(${s})`;
  world.style.setProperty('--hit', `${44/s}px`);
}
function measure() {
  vw = view.clientWidth; vh = view.clientHeight;
  const available = Math.max(100,vh-document.querySelector('#topbar').offsetHeight-document.querySelector('#tabs').offsetHeight);
  const cover = Math.max(vw/W,vh/H);
  const fit = Math.min(vw/(bounds.w+100),available/(bounds.h+100));
  minS = Math.max(cover,fit*.8); defS = Math.max(minS,Math.min(1,vw/(bounds.w+100))); maxS = defS*1.5;
  s = clamp(s,minS,maxS); apply();
}
function focus(px=1800,py=2940,scale=defS) {
  motionId++; s=clamp(scale,minS,maxS);
  const top=document.querySelector('#topbar').offsetHeight;
  const sheet = !document.querySelector('#modal').classList.contains('hidden') ? document.querySelector('#modalCard').offsetHeight : (document.querySelector('#panel').classList.contains('open') ? document.querySelector('#panel').offsetHeight : 0);
  const bottom=document.querySelector('#tabs').offsetHeight + sheet;
  x=vw/2-px*s; y=top+(vh-top-bottom)/2-py*s; apply();
}
function zoom(ns,cx=vw/2,cy=vh/2) { motionId++; const wx=(cx-x)/s,wy=(cy-y)/s; s=clamp(ns,minS,maxS); x=cx-wx*s;y=cy-wy*s;apply(); }
function momentum(vx,vy) {
  const id=++motionId; let last=performance.now();
  function step(now) { if(id!==motionId || locked())return;const dt=Math.min(48,now-last);last=now;
    const nx=clamp(x+vx*dt,vw-W*s,0),ny=clamp(y+vy*dt,vh-H*s,0);
    if(nx!==x+vx*dt)vx=0;if(ny!==y+vy*dt)vy=0;x=nx;y=ny;
    const f=Math.exp(-dt/325);vx*=f;vy*=f;apply();if(Math.hypot(vx,vy)>.02)requestAnimationFrame(step);
  } requestAnimationFrame(step);
}
const ptrs=new Map();let tapOK=false,startX=0,startY=0,samples=[],pinch=null,dragged=false;
function two(){return [...ptrs.values()].slice(0,2);}
function startPinch(){const [a,b]=two(),mx=(a.x+b.x)/2,my=(a.y+b.y)/2;pinch={d:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),s,wx:(mx-x)/s,wy:(my-y)/s};}
view.addEventListener('pointerdown',e=>{if(locked() || e.target.closest('#mapControls'))return;motionId++;ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size===1){tapOK=true;dragged=false;startX=e.clientX;startY=e.clientY;samples=[{t:e.timeStamp,x:e.clientX,y:e.clientY}];}
  else {tapOK=false;dragged=true;samples=[];if(ptrs.size===2)startPinch();}
});
view.addEventListener('pointermove',e=>{const p=ptrs.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
  if(ptrs.size===1){if(tapOK && Math.hypot(p.x-startX,p.y-startY)>8){tapOK=false;dragged=true;view.setPointerCapture(e.pointerId);}if(tapOK)return;
    // Edge resistance stays inside the filled world, so a rubber drag never exposes the page.
    const rx=(dx>0? -x:x-(vw-W*s)),ry=(dy>0? -y:y-(vh-H*s));
    x+=dx*Math.min(1,Math.max(.18,rx/60));y+=dy*Math.min(1,Math.max(.18,ry/60));samples.push({t:e.timeStamp,x:p.x,y:p.y});if(samples.length>8)samples.shift();apply();
  }else if(pinch){const [a,b]=two(),mx=(a.x+b.x)/2,my=(a.y+b.y)/2;s=clamp(pinch.s*Math.hypot(a.x-b.x,a.y-b.y)/pinch.d,minS,maxS);x=mx-pinch.wx*s;y=my-pinch.wy*s;apply();}
});
function release(e){if(!ptrs.has(e.pointerId))return;ptrs.delete(e.pointerId);if(ptrs.size===2){startPinch();return;}pinch=null;if(ptrs.size)return;
 if(e.type!=='pointercancel' && !tapOK && samples.length>1){const a=samples[0],b=samples.at(-1),dt=b.t-a.t;if(dt>0 && e.timeStamp-b.t<80)momentum((b.x-a.x)/dt,(b.y-a.y)/dt);}
}
view.addEventListener('pointerup',release);view.addEventListener('pointercancel',release);
view.addEventListener('click',e=>{if(dragged){e.stopImmediatePropagation();e.preventDefault();dragged=false;}},true);
view.addEventListener('wheel',e=>{e.preventDefault();if(!locked())zoom(s*Math.exp(-e.deltaY*(e.ctrlKey?.01:.0015)),e.clientX,e.clientY);},{passive:false});
document.querySelector('#mapHome').onclick=()=>{document.querySelector('#panel').classList.remove('open');measure();focus();};
document.querySelector('#mapAll').onclick=()=>{document.querySelector('#panel').classList.remove('open');measure();focus(bounds.x+bounds.w/2,bounds.y+bounds.h/2,minS);};
window.addEventListener('resize',()=>{measure();focus();});
window.CafeMap={measure,focus,zoom,stop:()=>motionId++,setBounds(b){bounds=b;measure();},get state(){return {W,H,vw,vh,minS,defS,maxS,s,x,y};},edge(k){motionId++;if(k==='left')x=0;if(k==='right')x=vw-W*s;if(k==='top')y=0;if(k==='bottom')y=vh-H*s;apply();}};
measure();focus();
})();
