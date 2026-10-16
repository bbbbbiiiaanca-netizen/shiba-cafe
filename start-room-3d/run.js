// §17-13 재료 달리기 (시작값, 수인님 확인 전). Values come from CFG.run; 미정 values are marked there.
import {t,tf} from './i18n.js';
import {tintImage} from './coat-art.js';
export function obstacleKinds(cfg){return Object.entries(cfg.obstacles||{}).filter(([,src])=>src).map(([id])=>id);} // null art (cat) never spawns
export const lerpAt=(v,t,len)=>typeof v==='number'?v:v.start+(v.end-v.start)*Math.max(0,Math.min(1,t/len));
export const speedAt=(cfg,t)=>lerpAt(cfg.speed,t,cfg.lengthSec),spawnAt=(cfg,t)=>lerpAt(cfg.spawnSec,t,cfg.lengthSec);
export function createRun(cfg,ingredientIds,rng=Math.random){return {cfg,ingredientIds,rng,hitsTaken:0,t:0,scroll:0,lane:Math.floor(cfg.lanes/2),x:cfg.laneX[Math.floor(cfg.lanes/2)],objs:[],nextSpawn:spawnAt(cfg,0),score:0,coins:0,got:{},over:false,reason:null};}
export function moveLane(r,d){if(r.over)return r.lane;r.lane=Math.max(0,Math.min(r.cfg.lanes-1,r.lane+d));return r.lane;}
function pick(r){const m=r.cfg.spawnMix,kinds=obstacleKinds(r.cfg);let v=r.rng()*(m.obstacle+m.coin+m.ingredient);
 if(v<m.obstacle&&kinds.length)return {type:'obstacle',kind:kinds[Math.floor(r.rng()*kinds.length)]};v-=m.obstacle;
 if(v<m.coin||!r.ingredientIds.length)return {type:'coin'};return {type:'ingredient',kind:r.ingredientIds[Math.floor(r.rng()*r.ingredientIds.length)]};}
export function stepRun(r,dt){if(r.over)return r;const c=r.cfg,sp=speedAt(c,r.t),dy=sp*dt;r.t+=dt;r.scroll+=dy;
 const tx=c.laneX[r.lane];r.x+=Math.sign(tx-r.x)*Math.min(Math.abs(tx-r.x),sp*3*dt);
 while(r.t>=r.nextSpawn){r.objs.push({...pick(r),lane:Math.floor(r.rng()*c.lanes),y:-c.obstacleW});r.nextSpawn+=spawnAt(c,r.nextSpawn);}
 for(const o of r.objs){o.y+=dy;if(o.done||o.lane!==r.lane||Math.abs(o.y-c.shibaY)>(o.type==='obstacle'?c.obstacleW:c.itemW)*0.45)continue;
  o.done=true;if(o.type==='obstacle'){r.hitsTaken++;if(r.hitsTaken>=c.hits){r.over=true;r.reason='hit';}}
  else if(o.type==='coin'){r.coins++;r.score+=c.scorePer.coin;}else{r.got[o.kind]=(r.got[o.kind]||0)+1;r.score+=c.scorePer.ingredient;}}
 r.objs=r.objs.filter(o=>!(o.done&&o.type!=='obstacle')&&o.y<c.screen[1]+c.obstacleW);
 if(!r.over&&r.t>=c.lengthSec){r.over=true;r.reason='time';}return r;}

// Browser screen: full-screen canvas 1080×1920 (contain-fit), swipe / arrow keys.
export const runFrame=(sheet,t)=>Math.floor(t*sheet.fps+1e-9)%sheet.frames;
export function startRunScreen({cfg,ingredients,shibaSrc,sheet=null,coat=null,coinSrc,onEnd,rng,playsLeft=null,resultExtra=()=>''}){
 const ids=Object.keys(ingredients),r=createRun(cfg,ids,rng),[W,H]=cfg.screen,load=src=>{const i=new Image();i.src=src;return i;};
 const img={bg:load(cfg.bg),shiba:load(sheet?sheet.src:shibaSrc),coin:load(coinSrc),heart:load(cfg.heartImg.full),heartEmpty:load(cfg.heartImg.empty),obs:Object.fromEntries(obstacleKinds(cfg).map(k=>[k,load(cfg.obstacles[k])])),ing:Object.fromEntries(ids.map(k=>[k,load(ingredients[k].img)]))};
 const root=document.createElement('div');root.id='runScreen';root.setAttribute('data-run-screen','');
 root.innerHTML=`<div class="run-hud" data-run-hud><div class="run-hud-line" data-run-stats></div><div class="run-hearts">${Array.from({length:cfg.hits},()=>`<img src="${cfg.heartImg.full}" alt="">`).join('')}</div>${playsLeft!=null?`<div class="run-hud-line">${t('run.playsLeft',{n:playsLeft})}</div>`:''}</div><div class="run-stage"><canvas width="${W}" height="${H}"></canvas></div><div class="run-end" hidden></div>`;document.body.appendChild(root);
 const stats=root.querySelector('[data-run-stats]'),hearts=[...root.querySelectorAll('.run-hearts img')],cv=root.querySelector('canvas'),g=cv.getContext('2d');let last=null,raf=0,paused=false,sx=null;
 const key=e=>{if(e.key==='ArrowLeft'){moveLane(r,-1);e.preventDefault();}if(e.key==='ArrowRight'){moveLane(r,1);e.preventDefault();}};
 addEventListener('keydown',key);
 cv.addEventListener('pointerdown',e=>{sx=e.clientX;});cv.addEventListener('pointerup',e=>{if(sx==null)return;const d=e.clientX-sx;sx=null;if(Math.abs(d)>30)moveLane(r,d>0?1:-1);});
 const draw=(i,x,y,w,src=i)=>{if(!i.complete||!i.naturalWidth)return;const h=w*i.naturalHeight/i.naturalWidth;g.drawImage(src,x-w/2,y-h/2,w,h);};
 const shibaArt=()=>coat&&tintImage(img.shiba,coat)||img.shiba; // §17-16 희귀 털색: 시트째 다시 칠함 → 프레임 자르기는 그대로
 const render=()=>{const y0=r.scroll%H;if(img.bg.complete&&img.bg.naturalWidth){g.drawImage(img.bg,0,y0,W,H);g.drawImage(img.bg,0,y0-H,W,H);}
  for(const o of r.objs){if(o.done&&o.type!=='obstacle')continue;const x=cfg.laneX[o.lane];
   if(o.type==='obstacle')draw(img.obs[o.kind],x,o.y,cfg.obstacleW);else if(o.type==='coin')draw(img.coin,x,o.y,cfg.itemW);else draw(img.ing[o.kind],x,o.y,cfg.itemW);}
  if(sheet){const i=img.shiba;if(i.complete&&i.naturalWidth){const f=runFrame(sheet,r.t),w=cfg.shibaW,h=w*sheet.frameH/sheet.frameW;g.drawImage(shibaArt(),f*sheet.frameW,0,sheet.frameW,sheet.frameH,r.x-w/2,cfg.shibaY-h/2,w,h);}}else if(cfg.shibaBlend){g.globalCompositeOperation=cfg.shibaBlend;draw(img.shiba,r.x,cfg.shibaY,cfg.shibaW,shibaArt());g.globalCompositeOperation='source-over';}else draw(img.shiba,r.x,cfg.shibaY,cfg.shibaW,shibaArt());
  const ing=Object.values(r.got).reduce((a,b)=>a+b,0),txt=`<img class="ci" src="${coinSrc}" alt="">${r.coins} · ${t('run.hud',{n:ing,sec:Math.max(0,Math.ceil(cfg.lengthSec-r.t))})}`;if(stats.innerHTML!==txt)stats.innerHTML=txt;
  hearts.forEach((h,i)=>{const s=i<cfg.hits-r.hitsTaken?cfg.heartImg.full:cfg.heartImg.empty;if(!h.src.endsWith(s))h.src=s;});};
 const end=()=>{removeEventListener('keydown',key);onEnd?.(r);const box=root.querySelector('.run-end');
  box.innerHTML=`<div class="run-card"><h2>${r.reason==='hit'?t('run.hit'):t('run.arrived')}</h2><p>${t('run.score',{n:r.score})}</p>${resultExtra(r)}<p><img class="ci" src="${coinSrc}" alt="">${r.coins}</p>${ids.filter(k=>r.got[k]).map(k=>`<p>${tf('ingredient.'+k,ingredients[k].name)} ${r.got[k]}</p>`).join('')}<button data-act="runClose">${t('app.back')}</button></div>`;
  box.hidden=false;box.querySelector('button').onclick=()=>root.remove();};
 const tick=ts=>{if(last==null)last=ts;const dt=Math.min(0.05,(ts-last)/1000);last=ts;if(!paused)stepRun(r,dt);render();if(r.over){end();return;}raf=requestAnimationFrame(tick);};
 raf=requestAnimationFrame(tick);
 return {state:r,root,pause:v=>{paused=v;},render,step:dt=>{stepRun(r,dt);render();},stop:()=>{cancelAnimationFrame(raf);removeEventListener('keydown',key);root.remove();}};}
