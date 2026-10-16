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
const sleep=ms=>new Promise(r=>setTimeout(r,ms));const checks=[];
try{const {targetId}=await call('Target.createTarget',{url:'about:blank'});const {sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});const c=(m,p)=>call(m,p,sessionId);
 await c('Emulation.setDeviceMetricsOverride',{width:360,height:800,deviceScaleFactor:1,mobile:true});await c('Page.enable');await c('Runtime.enable');
 const ev=async(x)=>{const r=await c('Runtime.evaluate',{expression:x,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(x.slice(0,80)+' -> '+JSON.stringify(r.exceptionDetails).slice(0,500));return r.result.value;};
 const go=async(q='')=>{await c('Page.navigate',{url:'file://'+resolve(ROOT,'index.html')+'?still=1&seed=7'+q});await sleep(300);for(let i=0;i<300&&!(await ev('Boolean(window.__ready)'));i++)await sleep(100);};
 const OUT='/workspace/compare/new-furniture';const {writeFileSync,mkdirSync}=await import('node:fs');mkdirSync(OUT,{recursive:true});
 const shot=async n=>{await sleep(600);const {data}=await c('Page.captureScreenshot',{format:'png'});writeFileSync(OUT+'/'+n,Buffer.from(data,'base64'));console.log('shot',n);};
 await go('&fresh=1&temp=1');
 await ev(`__game.state.started=true;__game.state.tutorialDone=true;__game.state.settings.language='ko';__game.ui.modals=[];__game.applyLang();document.querySelector('[data-main-tab=shop]').click();true`);
 for(const category of ['all','furniture','light','garden','sign','floorwall']){
  await ev(`__game.ui.furnitureCategory='${category}';__game.refresh();document.querySelector('[data-act=furnitureCategory][data-item="${category}"]').click();true`);
  await ev(`document.querySelector('[data-act=furnitureCategory][data-item="${category}"]').scrollIntoView({block:'nearest',inline:'nearest'});true`);
  await sleep(150);
  const count=await ev(`document.querySelectorAll('[data-furniture-shop] [data-furn-card]').length`);
  const expected={all:43,furniture:12,light:9,garden:10,sign:8,floorwall:4}[category];
  if(count!==expected)throw Error(category+' count '+count+' expected '+expected);
  if(!await ev(`[...document.querySelectorAll('[data-furniture-shop] [data-furn-card]')].filter(e=>!['tea-table','zabuton','counter','stairs'].includes(e.dataset.furnCard)).every(e=>e.querySelector('button').disabled&&e.querySelector('button').textContent==='미정')`))throw Error('TBD button');
  await shot('shop-'+category+'.png');
 }
 await ev(`__game.state.settings.language='en';__game.ui.furnitureCategory='all';__game.applyLang();true`);
 if(!await ev(`[...document.querySelectorAll('[data-furniture-shop] .furn-buy:disabled')].every(e=>e.textContent==='TBD')`))throw Error('English TBD');
 await ev(`__game.state.settings.language='ko';__game.applyLang();document.querySelector('[data-main-tab=manage]').click();__game.ui.modals=[];__game.close();true`);
 const {NEW_FURNITURE}=await import('../furniture-data.js');const {availableDirs}=await import('../map-data.js');
 // Grant through the same inventory and placement functions as the bag, without assigning prices.
 await ev(`__game.state.placement.slots=[];__game.state.furnitureInv['shelf']=1;window.placedFromBag=__game.S.placeFurniture(__game.state,'shelf',[1,1]);__game.refresh();true`);
 if(!await ev(`placedFromBag&&__game.state.furnitureInv.shelf===0&&__game.state.placement.slots[0].type==='shelf'`))throw Error('grant placement');
 for(const it of NEW_FURNITURE){
  const slots=availableDirs(it.id).map((dir,i)=>({id:'anchor-'+i,type:it.id,origin:[[1,1],[4,1],[1,4],[4,4]][i],dir}));
  await ev(`__game.state.placement.slots=${JSON.stringify(slots)};__game.iso.setEdit(true);__game.refresh();true`);
  await shot('edit-anchors-'+it.id+'.png');
 }
 const placed=[['shelf',0,[0,0]],['low-table',1,[2,2]],['moon-lamp',0,[3,0]],['stone-lantern',1,[0,3]],['bonsai',0,[4,4]],['noren',0,[5,2]],['rock',1,[1,5]]].map(([type,dir,origin],i)=>({id:'cafe-'+i,type,dir,origin}));
 await ev(`__game.state.placement.slots=${JSON.stringify(placed)};__game.iso.setEdit(false);__game.refresh();true`);await shot('cafe-placed.png');
 await go('&fresh=1&temp=1');await ev(`__game.state.started=true;__game.state.tutorialDone=true;__game.state.settings.language='ko';__game.ui.modals=[];__game.applyLang();true`);
 const sakura=['shelf-sakura','low-table-sakura','stone-lantern-sakura'].map((type,i)=>({id:'sakura-'+i,type,dir:i%2,origin:[[1,1],[3,2],[2,4]][i]}));
 await ev(`__game.state.placement.slots=${JSON.stringify(sakura.slice(0,2))};__game.refresh();true`);
 if(await ev(`!!document.getElementById('isomap').dataset.sakuraZones`))throw Error('Set active with only 2');
 await ev(`__game.state.placement.slots=${JSON.stringify(sakura.map((it,i)=>i===2?{...it,zone:'B'}:it))};__game.refresh();true`);
 if(await ev(`!!document.getElementById('isomap').dataset.sakuraZones`))throw Error('Set active across zones');
 await ev(`__game.state.placement.slots=${JSON.stringify(sakura)};__game.refresh();true`);await shot('sakura-set.png');
 if(!await ev(`document.getElementById('isomap').dataset.sakuraZones.trim()==='A'`))throw Error('Set missing with 3');
 if(!await ev(`!!document.querySelector('.sakura-set-label')`))throw Error('Sakura label missing');
 if(errors.length)throw Error(errors.join('\n'));console.log('new furniture browser: 6 categories, ko/en TBD, inventory placement, set thresholds + 35 direction screenshots passed');
}finally{chrome.kill('SIGTERM');await sleep(150);rmSync(prof,{recursive:true,force:true});}
