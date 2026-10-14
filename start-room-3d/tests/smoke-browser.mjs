// Headless Chrome smoke test of index.html (CDP pipe, no network). Run from start-room-3d/: node tests/smoke-browser.mjs
// Opens the game fresh, drives the UI through the spec-v3 screens and fails on any page exception.
import {spawn} from 'node:child_process';import {resolve,dirname,join} from 'node:path';import {fileURLToPath} from 'node:url';import {rmSync} from 'node:fs';
const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');const prof='/tmp/shiba-smoke-'+process.pid;
const chrome=spawn('google-chrome',['--headless','--no-sandbox','--disable-dev-shm-usage','--user-data-dir='+prof,'--remote-debugging-pipe','--allow-file-access-from-files','--autoplay-policy=no-user-gesture-required','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],{stdio:['ignore','ignore','pipe','pipe','pipe']});
let id=0,buf='';const pend=new Map(),errors=[];for(const p of [chrome.stdio[3],chrome.stdio[4]])p.on('error',()=>{});
chrome.stdio[4].on('data',d=>{buf+=d;let e;while((e=buf.indexOf('\0'))>=0){const m=JSON.parse(buf.slice(0,e));buf=buf.slice(e+1);
 if(m.method==='Runtime.exceptionThrown')errors.push(JSON.stringify(m.params.exceptionDetails).slice(0,500));
 if(m.id&&pend.has(m.id)){const p=pend.get(m.id);pend.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}}});
const call=(method,params={},sessionId)=>new Promise((res,rej)=>{const n=++id;pend.set(n,{resolve:res,reject:rej});chrome.stdio[3].write(JSON.stringify({id:n,method,params,sessionId})+'\0');});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));const checks=[];
try{const {targetId}=await call('Target.createTarget',{url:'about:blank'});const {sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});const c=(m,p)=>call(m,p,sessionId);
 await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await c('Page.enable');await c('Runtime.enable');
 const ev=async(x)=>{const r=await c('Runtime.evaluate',{expression:x,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(x.slice(0,80)+' -> '+JSON.stringify(r.exceptionDetails).slice(0,500));return r.result.value;};
 const check=async(name,expr)=>{const v=await ev(expr);checks.push([v?'ok':'FAIL',name]);};
 const steps=(await import('./smoke-steps.mjs')).default;
 const go=async(fresh)=>{await c('Page.navigate',{url:'file://'+resolve(ROOT,'index.html')+'?still=1&seed=7'+(fresh?'&fresh=1':'')});await sleep(300);
  for(let i=0;i<300&&!(await ev('Boolean(window.__ready)'));i++)await sleep(100);};
 await go(true);await steps({ev,check,sleep,reload:()=>go(false)});
}catch(e){errors.push(String(e.stack||e));}finally{chrome.kill();setTimeout(()=>rmSync(prof,{recursive:true,force:true}),300);}
for(const [k,n] of checks)console.log(k==='ok'?'  ok  ':'  FAIL',n);for(const e of errors)console.log('  ERROR',e);
const fail=checks.filter(c=>c[0]!=='ok').length+errors.length;console.log(`${checks.length-checks.filter(c=>c[0]!=='ok').length}/${checks.length} smoke checks passed, ${errors.length} page errors`);process.exitCode=fail?1:0;
