// 요리 효과 아이콘(배고픔·행복) + 잠긴 Lv3·Lv5 카드 그림 캡처, 360×640. test:browser에는 넣지 않음(눈으로 보는 용).
// node tools/capture-cooking-icons.mjs   → OUT(기본 /workspace/compare/water-icons)/icons-cooking.png, icons-locked.png
import {spawn} from 'node:child_process';import {resolve,dirname,join} from 'node:path';import {fileURLToPath} from 'node:url';import {rmSync,mkdirSync,writeFileSync} from 'node:fs';
import {startFlow} from '../tests/start-flow.mjs';
const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');const prof='/tmp/shiba-smoke-'+process.pid;
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
 await c('Emulation.setDeviceMetricsOverride',{width:360,height:640,deviceScaleFactor:+(process.env.DPR||1),mobile:true});await c('Page.enable');await c('Runtime.enable');
 const ev=async(x)=>{const r=await c('Runtime.evaluate',{expression:x,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(x.slice(0,80)+' -> '+JSON.stringify(r.exceptionDetails).slice(0,500));return r.result.value;};
 await c('Page.navigate',{url:'file://'+resolve(ROOT,'index.html')+'?still=1&seed=7&fresh=1&temp=1'});await sleep(300);for(let i=0;i<300&&!(await ev('Boolean(window.__ready)'));i++)await sleep(100);
 await startFlow(ev);
 const OUT=process.env.OUT||'/workspace/compare/water-icons';mkdirSync(OUT,{recursive:true});
 const shot=async n=>{await sleep(450);const {data}=await c('Page.captureScreenshot',{format:'png'});writeFileSync(OUT+'/'+n,Buffer.from(data,'base64'));console.log('shot',OUT+'/'+n);};
 const loaded=`Promise.all([...document.querySelectorAll('[data-cooking] img')].map(i=>i.decode().catch(()=>{}))).then(()=>true)`;
 await ev(`__game.ui.modals=[];__game.close();__game.ui.recipe=null;__game.open('cooking');__game.refresh();true`);await sleep(200);await ev(loaded);
 console.log('fx',JSON.stringify(await ev(`[...document.querySelectorAll('[data-cook-fx] [data-fx]')].map(e=>{const im=e.querySelector('img');return {k:e.dataset.fx,text:e.textContent.trim(),src:im?.getAttribute('src'),cur:im?.currentSrc.replace(/^.*assets/,'assets'),w:im?.naturalWidth,box:im&&Math.round(im.getBoundingClientRect().width)};})`)));
 await shot('icons-cooking.png');
 await ev(`(()=>{const st=document.querySelector('[data-cook-strip]');st.style.scrollSnapType='none';st.scrollLeft=st.scrollWidth;return true;})()`);await sleep(200);
 console.log('locked',JSON.stringify(await ev(`[...document.querySelectorAll('[data-cook-preview]')].map(b=>{const im=b.querySelector('img:first-child'),r=b.getBoundingClientRect();return {text:b.textContent.trim(),src:im?.getAttribute('src'),w:im?.naturalWidth,slot:!!b.querySelector('.slot'),inView:r.left>=0&&r.right<=innerWidth};})`)));
 await shot('icons-locked.png');
 if(errors.length){console.error('page errors',errors);process.exitCode=1;}
}catch(e){console.error(e);process.exitCode=1}finally{chrome.kill();await sleep(500);try{rmSync(prof,{recursive:true,force:true});}catch{}}
