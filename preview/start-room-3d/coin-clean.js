// 코인 아이콘 가장자리 다듬기 (런타임 전용, 원본 파일·sha는 그대로).
// 가장자리 반투명 픽셀의 색을 안쪽 불투명 픽셀 색으로 바꾸고, 아주 옅은 픽셀(알파<96)은 깎아 낸다.
export function cleanEdges(d,w,h,{cut=96,r=3}={}){
 const a=i=>d[i*4+3],src=Uint8ClampedArray.from(d);
 const solid=new Uint8Array(w*h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(src[i*4+3]<255)continue;let ok=1;
  for(let dy=-1;dy<=1&&ok;dy++)for(let dx=-1;dx<=1;dx++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=w||Y>=h||src[(Y*w+X)*4+3]<255){ok=0;break;}}solid[i]=ok;}
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x,al=src[i*4+3];if(!al||solid[i])continue;
  if(al<cut){d[i*4+3]=0;continue;}
  let R=0,G=0,B=0,n=0;for(let rr=1;rr<=r&&!n;rr++)for(let dy=-rr;dy<=rr;dy++)for(let dx=-rr;dx<=rr;dx++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=w||Y>=h)continue;const j=Y*w+X;if(!solid[j])continue;R+=src[j*4];G+=src[j*4+1];B+=src[j*4+2];n++;}
  if(n){d[i*4]=R/n;d[i*4+1]=G/n;d[i*4+2]=B/n;}else d[i*4+3]=0;}
 return d;}
// 브라우저: res-coin.png 를 다듬은 blob URL 로 바꿔 끼운다.
export function installCoinClean(url='assets/drive/ui/res-coin.png'){
 if(typeof document==='undefined')return;const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const g=c.getContext('2d');g.drawImage(im,0,0);const D=g.getImageData(0,0,c.width,c.height);cleanEdges(D.data,c.width,c.height);g.putImageData(D,0,0);
  c.toBlob(b=>{if(!b)return;const u=URL.createObjectURL(b);window.__coinClean=u;const fix=root=>root.querySelectorAll?.('img[src$="res-coin.png"]').forEach(e=>{e.dataset.src0=e.getAttribute('src');e.src=u;e.dataset.coinClean='1';});fix(document);
   new MutationObserver(ms=>{for(const m of ms){if(m.type==='attributes'){const e=m.target;if(e.tagName==='IMG'&&/res-coin\.png$/.test(e.getAttribute('src')||''))fix(e.parentNode||document);}else m.addedNodes.forEach(n=>{if(n.nodeType===1){if(n.tagName==='IMG'&&/res-coin\.png$/.test(n.getAttribute('src')))fix(n.parentNode);else fix(n);}});}}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['src']});},'image/png');};im.src=url;}
