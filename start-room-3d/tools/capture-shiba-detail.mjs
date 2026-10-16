import {spawn} from 'node:child_process';import {resolve,dirname,join} from 'node:path';import {fileURLToPath} from 'node:url';import {rmSync} from 'node:fs';
const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');const prof='/tmp/shiba-smoke-'+process.pid;
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
 await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await c('Page.enable');await c('Runtime.enable');
 const ev=async(x)=>{const r=await c('Runtime.evaluate',{expression:x,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(x.slice(0,80)+' -> '+JSON.stringify(r.exceptionDetails).slice(0,500));return r.result.value;};
 const go=async(q='')=>{await c('Page.navigate',{url:'file://'+resolve(ROOT,'index.html')+'?still=1&seed=7'+q});await sleep(300);for(let i=0;i<300&&!(await ev('Boolean(window.__ready)'));i++)await sleep(100);};
 const OUT='/workspace/compare/shiba-detail';const {writeFileSync,mkdirSync}=await import('node:fs');mkdirSync(OUT,{recursive:true});
 const shot=async n=>{await ev(`Promise.all([...document.images].map(i=>i.decode().catch(()=>0))).then(()=>document.fonts.ready).then(()=>true)`);await sleep(450);const {data}=await c('Page.captureScreenshot',{format:'png'});writeFileSync(OUT+'/'+n,Buffer.from(data,'base64'));console.log('shot',n);};
 await c('Emulation.setDeviceMetricsOverride',{width:360,height:800,deviceScaleFactor:1,mobile:true});
 await go('&fresh=1&temp=1');await (await import('../tests/start-flow.mjs')).startFlow(ev);
 await ev(`(()=>{const g=__game;g.ui.modals=[];g.close();g.state.settings.language='ko';g.applyLang();for(const breed of ['red','white','sesame','kuro'])if(!g.state.shibas.some(x=>x.breed===breed)){const n=g.S.makeShiba(g.state,{breed});if(!g.state.shibas.includes(n))g.state.shibas.push(n);}const red=g.state.shibas.find(x=>x.breed==='red'),white=g.state.shibas.find(x=>x.breed==='white');red.friends=[white.id];white.friends=[red.id];g.ui.modals=[{kind:'book',id:red.id}];g.refresh();return true;})()`);
 await shot('1-detail-red.png');await shot('2-detail-friend.png');await ev(`document.querySelector('.book-friends button').click();true`);await shot('2b-friend-opened.png');await ev(`document.querySelector('[data-act=careOpen]').click();true`);await shot('3-care-open.png');
 for(const breed of ['red','white','sesame','kuro']){await ev(`__game.close();__game.ui.modals=[{kind:'book',id:__game.state.shibas.find(x=>x.breed==='${breed}').id}];__game.refresh();true`);await shot('detail-'+breed+'.png');}
 if(errors.length)throw Error(errors.join('\n'));
}catch(e){console.error(e);process.exitCode=1}finally{chrome.kill();await sleep(500);try{rmSync(prof,{recursive:true,force:true});}catch{}}
