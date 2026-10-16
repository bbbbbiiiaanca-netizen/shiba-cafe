// 걸어 들어와 앉기 (2026-10-16): 손님 10종 모두 입구 → 자리까지 프레임을 넘기며 걷고, 앉으면 그 종류의 기존 앉은 그림으로 바뀐다.
// config 에 걷기 그림 경로가 없는(null) 종류는 null → isomap 이 아무것도 그리지 않는다.
import {CFG} from './config.js';
import {canWalk,walkFrame} from './walk-frames.js';
export const GUEST_DIRS=['front-dr','front-dl','back-ul','back-ur']; // facing 0..3 (navigation.faceCell)
export const sitFile=kind=>CFG.characters.guest.sit.replace('{key}',kind);
// 지도에 그릴 손님 그림: {sit:true,file} | {sit:false,file,dir,n} | null(그리지 않음 = 기존 동작)
export function guestPose(c,nowMs=0){if(!c?.kind||!canWalk('guest',c.kind))return null;
 if(c.phase==='seated')return {sit:true,file:sitFile(c.kind)};
 const dir=GUEST_DIRS[c.facing||0],moving=!!c.route?.length,n=moving?1+Math.floor(nowMs/125)%(CFG.characters.frameCount||4):1;
 return {sit:false,file:walkFrame('guest',c.kind,dir,n),dir,n};}
// 배경 지우기: 가장자리에서 시작해 네 모서리 평균색과 비슷한(채널 차 합 ≤ tol) 이어진 픽셀만 투명하게. 남은 불투명 영역의 bbox 를 돌려준다.
export function keyBackground(d,w,h,tol=CFG.characters.guest.sitKeyTol){
 const px=(x,y)=>(y*w+x)*4,cs=[px(0,0),px(w-1,0),px(0,h-1),px(w-1,h-1)],bg=[0,1,2].map(k=>cs.reduce((a,i)=>a+d[i+k],0)/4);
 const near=i=>Math.abs(d[i]-bg[0])+Math.abs(d[i+1]-bg[1])+Math.abs(d[i+2]-bg[2])<=tol,seen=new Uint8Array(w*h),q=[];
 for(let x=0;x<w;x++)q.push(x,0,x,h-1);for(let y=0;y<h;y++)q.push(0,y,w-1,y);
 while(q.length){const y=q.pop(),x=q.pop(),k=y*w+x;if(seen[k])continue;seen[k]=1;const i=k*4;if(!near(i))continue;d[i+3]=0;
  if(x>0)q.push(x-1,y);if(x<w-1)q.push(x+1,y);if(y>0)q.push(x,y-1);if(y<h-1)q.push(x,y+1);}
 let x0=w,y0=h,x1=-1,y1=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
 return x1<0?null:{x:x0,y:y0,w:x1-x0+1,h:y1-y0+1};}
// 브라우저: 앉은 그림을 줄여(높이 384) 배경을 지우고 불투명 영역만 잘라 캐시. 준비 전엔 null.
const sitCache=new Map();
export function sitCutout(file,onReady=()=>{}){if(sitCache.has(file))return sitCache.get(file);sitCache.set(file,null);if(typeof Image==='undefined'||typeof document==='undefined')return null;
 const im=new Image();im.onload=()=>{const H=384,W=Math.round(im.naturalWidth*H/im.naturalHeight),c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0,W,H);
  const D=g.getImageData(0,0,W,H),b=keyBackground(D.data,W,H);if(!b)return;g.putImageData(D,0,0);const out=document.createElement('canvas');out.width=b.w;out.height=b.h;out.getContext('2d').drawImage(c,b.x,b.y,b.w,b.h,0,0,b.w,b.h);
  out.dataset.sit=file;sitCache.set(file,out);onReady(file);};im.onerror=()=>{};im.src=file;return null;}

// Scale dimensions and offsets together to preserve the foot / seat anchor.
export function guestDrawRect(kind,p,width,height,anchor,fit){
 const scale=fit*(CFG.characters.guest.scale[kind]??1);
 return [p.x-anchor[0]*scale,p.y-anchor[1]*scale,width*scale,height*scale];
}
