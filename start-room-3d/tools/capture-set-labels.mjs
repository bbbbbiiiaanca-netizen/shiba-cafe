import {spawn} from 'node:child_process';import {resolve,dirname,join} from 'node:path';import {fileURLToPath} from 'node:url';import {rmSync} from 'node:fs';
import {assertSetLabelClear} from './set-label-check.mjs';
const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');const prof='/tmp/shiba-set-labels-'+process.pid;
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
 const OUT=process.argv[2]||'/workspace/compare/water-icons';const {writeFileSync,mkdirSync}=await import('node:fs');mkdirSync(OUT,{recursive:true});
 const setup=async()=>{await go('&fresh=1&temp=1');await ev(`__game.state.started=true;__game.state.tutorialDone=true;__game.state.settings.language='ko';__game.ui.modals=[];__game.applyLang();true`);};
 for(const theme of ['sakura','momiji','snow','water']){
  await setup();
  // 키 큰 선반을 뒤쪽 모서리(0,0)에, 나머지 둘은 방 가운데·앞쪽에.
  const slots=['shelf','low-table','stone-lantern'].map((base,i)=>({id:theme+'-'+i,type:base+'-'+theme,dir:i%2,origin:[[0,0],[3,2],[2,4]][i]}));
  await ev(`__game.state.placement.slots=${JSON.stringify(slots)};__game.refresh();true`);
  // 그림이 다 뜰 때까지 기다린다(라벨은 3.5초 뒤 사라지므로 그 전에 찍는다).
  for(let i=0;i<20&&(await ev(`__game.iso.hits.filter(h=>!h.footprint).length`))<3;i++)await sleep(100);
  await sleep(400);
  if(!await ev(`document.getElementById('isomap').dataset.${theme}Zones.trim()==='A'`))throw Error(theme+' set not active');
  const r=await assertSetLabelClear(ev,theme);
  const {data}=await c('Page.captureScreenshot',{format:'png'});writeFileSync(OUT+'/set-labels-'+theme+'.png',Buffer.from(data,'base64'));
  if(!await ev(`!!document.querySelector('.${theme}-set-label')`))throw Error(theme+' label gone before screenshot');
  console.log('shot set-labels-'+theme+'.png',r.pos,JSON.stringify(r.label));
 }
 if(errors.length)throw Error(errors.join('\n'));console.log('set label browser checks passed (4 sets, no overlap with furniture/HUD)');
}finally{chrome.kill('SIGTERM');await sleep(150);rmSync(prof,{recursive:true,force:true});}
