import {spawn} from 'node:child_process';import {resolve,dirname,join} from 'node:path';import {fileURLToPath} from 'node:url';import {rmSync} from 'node:fs';
const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');const prof='/tmp/shiba-furniture-'+process.pid;
const chrome=spawn('google-chrome',['--headless','--no-sandbox','--disable-dev-shm-usage','--user-data-dir='+prof,'--remote-debugging-pipe','--allow-file-access-from-files','--autoplay-policy=no-user-gesture-required','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],{stdio:['ignore','ignore','pipe','pipe','pipe']});
let id=0,buf='';const pend=new Map(),errors=[];for(const p of [chrome.stdio[3],chrome.stdio[4]])p.on('error',()=>{});
chrome.stdio[4].on('data',d=>{buf+=d;let e;while((e=buf.indexOf('\0'))>=0){const m=JSON.parse(buf.slice(0,e));buf=buf.slice(e+1);
 if(m.method==='Runtime.exceptionThrown')errors.push(JSON.stringify(m.params.exceptionDetails).slice(0,500));
 if(m.id&&pend.has(m.id)){const p=pend.get(m.id);pend.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}}});
let chromeStderr='';chrome.stderr.on('data',d=>chromeStderr+=d);
chrome.on('exit',(code,signal)=>{if(pend.size){const error=Error(`Chrome exited before completing CDP (${signal||code}): ${chromeStderr.trim()}`);for(const p of pend.values())p.reject(error);pend.clear();}});
const call=(method,params={},sessionId)=>new Promise((res,rej)=>{const n=++id;pend.set(n,{resolve:res,reject:rej});chrome.stdio[3].write(JSON.stringify({id:n,method,params,sessionId})+'\0');});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{const {targetId}=await call('Target.createTarget',{url:'about:blank'});const {sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});const c=(m,p)=>call(m,p,sessionId);
 await c('Emulation.setDeviceMetricsOverride',{width:360,height:800,deviceScaleFactor:1,mobile:true});await c('Page.enable');await c('Runtime.enable');
 const ev=async(x)=>{const r=await c('Runtime.evaluate',{expression:x,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(x.slice(0,80)+' -> '+JSON.stringify(r.exceptionDetails).slice(0,500));return r.result.value;};
 const go=async(q='')=>{await c('Page.navigate',{url:'file://'+resolve(ROOT,'index.html')+'?still=1&seed=7'+q});await sleep(300);for(let i=0;i<300&&!(await ev('Boolean(window.__ready)'));i++)await sleep(100);};
 const OUT='/workspace/compare/water-icons';const {writeFileSync,mkdirSync}=await import('node:fs');mkdirSync(OUT,{recursive:true});
 const shot=async n=>{await sleep(600);const {data}=await c('Page.captureScreenshot',{format:'png'});writeFileSync(OUT+'/'+n,Buffer.from(data,'base64'));console.log('shot',n);};
 const {NEW_FURNITURE}=await import('../furniture-data.js');
 const setup=async()=>{await go('&fresh=1&temp=1');await ev(`__game.state.started=true;__game.state.tutorialDone=true;__game.state.settings.language='ko';__game.ui.modals=[];__game.applyLang();true`);};
 // 상점: 물방울 가구 8장만 보이게 (캡처용으로만 숨김, 상품 필터는 추가하지 않음).
 await setup();await ev(`document.querySelector('[data-main-tab=shop]').click();__game.refresh();true`);
 await ev(`[...document.querySelectorAll('[data-furniture-shop] [data-furn-card]')].forEach(e=>{e.hidden=!e.dataset.furnCard.endsWith('-water')||e.dataset.furnCard.startsWith('floor-')||e.dataset.furnCard.startsWith('wall-');});document.querySelector('[data-furniture-shop]').scrollIntoView({block:'start'});true`);
 if(!await ev(`(()=>{const v=[...document.querySelectorAll('[data-furniture-shop] [data-furn-card]:not([hidden])')];return v.length===8&&v.every(e=>/-water-v4\.png$/.test(e.querySelector('.furn-img')?.getAttribute('src')||''))&&v.every(e=>e.querySelector('.furn-buy').disabled&&e.querySelector('.furn-buy').textContent==='미정')&&v[0].querySelector('.furn-name').textContent==='물방울 선반';})()`))throw Error('water shop cards');
 await shot('shop-water.png');
 if(!await ev(`[...document.querySelectorAll('[data-furn-card="floor-water"],[data-furn-card="wall-water"]')].length===2&&[...document.querySelectorAll('[data-furn-card="floor-water"] .furn-buy,[data-furn-card="wall-water"] .furn-buy')].every(b=>b.disabled&&b.textContent==='미정')`))throw Error('water floor/wall TBD cards');
 // 세트 라벨: 2개는 없음, 다른 구역에 나뉘면 없음, 같은 구역 3개면 표시.
 const items=NEW_FURNITURE.filter(it=>it.theme==='water');
 const slots=items.map((it,i)=>({id:'water'+i,type:it.id,dir:i%2,origin:[[0,0],[2,2],[4,0],[0,3],[4,4],[2,4],[4,2],[1,5]][i]}));
 await setup();await ev(`__game.state.placement.slots=${JSON.stringify(slots.slice(0,2))};__game.refresh();true`);
 if(await ev(`!!document.getElementById('isomap').dataset.waterZones.trim()`))throw Error('set with two');
 await ev(`__game.state.placement.slots=${JSON.stringify(slots.slice(0,3).map((it,i)=>i===2?{...it,zone:'B'}:it))};__game.refresh();true`);
 if(await ev(`!!document.getElementById('isomap').dataset.waterZones.trim()`))throw Error('split-zone set');
 await ev(`__game.state.placement.slots=${JSON.stringify(slots.slice(0,3))};__game.refresh();true`);await shot('water-set.png');
 if(!await ev(`document.getElementById('isomap').dataset.waterZones.trim()==='A'&&document.querySelector('.water-set-label')?.textContent==='물방울 정원 세트'`))throw Error('water set label missing');
 // 바닥·벽 레이어: 가방 배치 동작(placeFurniture)으로 선택.
 await setup();
 await ev(`__game.state.placement.slots=[];for(const id of ['floor-water','wall-water']){__game.state.furnitureInv[id]=1;__game.S.placeFurniture(__game.state,id,[0,0]);}__game.refresh();true`);
 if(!await ev(`__game.state.space.roomLayers.floor==='floor-water'&&__game.state.space.roomLayers.wall==='wall-water'`))throw Error('water floor/wall selection');
 await shot('room-water-layer.png');
 if(errors.length)throw Error(errors.join('\n'));console.log('water browser checks passed');
}finally{chrome.kill('SIGTERM');await sleep(150);rmSync(prof,{recursive:true,force:true});}
