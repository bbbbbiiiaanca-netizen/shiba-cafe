// §17-16 희귀 털색: 기존 시바 그림을 런타임에 다시 칠한다 (tools/recolor-test.py와 같은 식). 원본 파일은 그대로.
// 주황 털 띠(색상 8–48°, 채도·밝기 부드러운 경계)만 CFG.coats.rare[coat]의 {hue,satMul,valAdd}로 바꾸고 흰색·검은 선·투명도는 건드리지 않는다.
import {CFG} from './config.js';
export const COATS=Object.keys(CFG.coats?.rare||{});
export const isCoat=c=>typeof c==='string'&&Object.hasOwn(CFG.coats?.rare||{},c);
export const coatParams=c=>isCoat(c)?CFG.coats.rare[c]:null;
// 털색 표시 점 색 = 중간 밝기 주황(시루 털)을 같은 식으로 칠한 색
export function coatSwatch(c){const p=coatParams(c);if(!p)return null;const [r,g,b]=recolorRGB(214,120,52,p);return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');}

function rgb2hsv(r,g,b){const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn+1e-9;
 const h=(mx===r?(((g-b)/d)%6+6)%6:mx===g?(b-r)/d+2:(r-g)/d+4)/6;return [h,mx>0?d/(mx+1e-9):0,mx];}
function hsv2rgb(h,s,v){const i=((Math.floor(h*6)%6)+6)%6,f=h*6-Math.floor(h*6),p=v*(1-s),q=v*(1-f*s),t=v*(1-(1-f)*s);
 return [[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][i];}
const clip=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
// soft fur mask (0..1) for one 0..1 RGB pixel
export function furMask(r,g,b){const [h,s,v]=rgb2hsv(r,g,b);return h>=8/360&&h<=48/360?clip((s-0.25)/0.15)*clip((v-0.2)/0.15):0;}
// one 0..255 pixel → recoloured 0..255 pixel
export function recolorRGB(R,G,B,{hue,satMul,valAdd}){const r=R/255,g=G/255,b=B/255,w=furMask(r,g,b);if(!w)return [R,G,B];
 const [,s,v]=rgb2hsv(r,g,b),o=hsv2rgb(hue/360,s*satMul,clip(v+valAdd*(1-v)));
 return [r,g,b].map((a,k)=>Math.round((a*(1-w)+o[k]*w)*255));}
// RGBA bytes (ImageData.data) in place; alpha untouched
export function recolorPixels(data,params){for(let i=0;i<data.length;i+=4){if(!data[i+3])continue;const o=recolorRGB(data[i],data[i+1],data[i+2],params);data[i]=o[0];data[i+1]=o[1];data[i+2]=o[2];}return data;}
const keyOf=(src,c)=>{const p=coatParams(c);return `${src}|${c}|${p.hue},${p.satMul},${p.valAdd}`;};

// ── browser: canvas tint of a loaded image, cached per (image, coat, params) ──
let tints=new WeakMap(),stats={tinted:0};
export const coatStats=()=>({...stats});
export function tintImage(im,coat){const p=coatParams(coat);if(!p||!im?.complete||!im.naturalWidth)return null;
 let m=tints.get(im);if(!m)tints.set(im,m=new Map());const k=keyOf('',coat);if(m.has(k))return m.get(k);
 let c=null;try{c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(im,0,0,c.width,c.height);
  const d=x.getImageData(0,0,c.width,c.height);recolorPixels(d.data,p);x.putImageData(d,0,0);stats.tinted++;}catch{c=null;} // tainted canvas (file://) → normal art
 m.set(k,c);return c;}
// <img src> 용: 칠한 그림의 blob URL. 원본을 읽거나 칠하는 중이면 원본 경로를 돌려주고, 다 되면 onCoatReady 콜백으로 다시 그리게 한다.
const srcImgs=new Map(),urls=new Map(),listeners=new Set();
export const onCoatReady=f=>{listeners.add(f);return ()=>listeners.delete(f);};
const ready=src=>listeners.forEach(f=>f(src));
export function coatSrc(src,coat){if(!src||!isCoat(coat)||typeof Image==='undefined')return src;const k=keyOf(src,coat);
 if(urls.has(k))return urls.get(k)||src; // null = 칠하는 중 또는 실패 → 원본
 let im=srcImgs.get(src);if(!im){im=new Image();srcImgs.set(src,im);im.onload=()=>ready(src);im.src=src;}
 if(!(im.complete&&im.naturalWidth))return src;urls.set(k,null);const c=tintImage(im,coat);
 if(c)try{c.toBlob(b=>{if(!b)return;urls.set(k,URL.createObjectURL(b));ready(src);},'image/png');}catch{}
 return src;}
export function _resetCoatCache(){tints=new WeakMap();urls.clear();srcImgs.clear();stats={tinted:0};}
