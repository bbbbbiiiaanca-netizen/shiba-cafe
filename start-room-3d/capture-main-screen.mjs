// Main cafe capture using capture-spec-v3.mjs Chrome CDP pipe approach, portrait 390×844.
// Usage (from the repo root or start-room-3d/): node start-room-3d/capture-main-screen.mjs [OUTDIR]
// Default OUTDIR: /workspace/shiba-cafe-docs/spec-v3-build
import {spawn} from 'node:child_process';import {mkdirSync,writeFileSync,rmSync} from 'node:fs';import {resolve,dirname,join} from 'node:path';import {fileURLToPath} from 'node:url';
const ROOT=dirname(fileURLToPath(import.meta.url));
const out=resolve(process.argv[2]||'/workspace/shiba-cafe-docs/spec-v3-build');mkdirSync(out,{recursive:true});
const prof='/tmp/shiba-main-cap-'+process.pid;
const chrome=spawn('google-chrome',['--headless','--no-sandbox','--disable-dev-shm-usage','--user-data-dir='+prof,'--remote-debugging-pipe','--allow-file-access-from-files','--hide-scrollbars'],{stdio:['ignore','ignore','pipe','pipe','pipe']});
let id=0,buf='';const pend=new Map(),errors=[];for(const p of [chrome.stdio[3],chrome.stdio[4]])p.on('error',()=>{});
chrome.stdio[4].on('data',d=>{buf+=d;let e;while((e=buf.indexOf('\0'))>=0){const m=JSON.parse(buf.slice(0,e));buf=buf.slice(e+1);
 if(m.method==='Runtime.exceptionThrown')errors.push(JSON.stringify(m.params.exceptionDetails).slice(0,400));
 if(m.id&&pend.has(m.id)){const p=pend.get(m.id);pend.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}}});
let chromeStderr='';chrome.stderr.on('data',d=>chromeStderr+=d);
chrome.on('exit',(code,signal)=>{if(pend.size){const error=Error(`Chrome exited before completing CDP (${signal||code}): ${chromeStderr.trim()}`);for(const p of pend.values())p.reject(error);pend.clear();}});
const call=(method,params={},sessionId)=>new Promise((res,rej)=>{const n=++id;pend.set(n,{resolve:res,reject:rej});chrome.stdio[3].write(JSON.stringify({id:n,method,params,sessionId})+'\0');});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));const shots=[];
try{const {targetId}=await call('Target.createTarget',{url:'about:blank'});const {sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});const c=(m,p)=>call(m,p,sessionId);
 await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:+(process.env.DSF||2),mobile:true});await c('Page.enable');await c('Runtime.enable');
 const ev=async x=>{const r=await c('Runtime.evaluate',{expression:x,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(x.slice(0,90)+' -> '+JSON.stringify(r.exceptionDetails).slice(0,500));return r.result.value;};
 const settle=()=>ev('new Promise(r=>{const imgs=[...document.images].filter(i=>!i.complete);if(!imgs.length)return r(true);let n=imgs.length;for(const i of imgs)i.onload=i.onerror=()=>--n||r(true);setTimeout(()=>r(true),4000);})');
 const shot=async(name)=>{await ev('__game.refresh();__game.ui.toastT=0;document.getElementById("toast").style.opacity=0;true');await settle();await sleep(150);const {data}=await c('Page.captureScreenshot',{format:'png'});writeFileSync(join(out,name),Buffer.from(data,'base64'));shots.push(name);};
 const click=sel=>ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)throw Error('no '+${JSON.stringify(sel)});e.click();return true;})()`);
 const stage=async(grid=false)=>{
 await c('Page.navigate',{url:'file://'+resolve(ROOT,'index.html')+'?still=1&fresh=1&seed=7'+(grid?'&grid=1':'')});
 for(let i=0;i<300&&!(await ev('Boolean(window.__ready)'));i++)await sleep(100);
 // Staged, unsaved state: Lv5, three placed shibas, two seated guests; M-02 in development.
 await click('[data-lang=ko]');await click('[data-act=langOk]');await click('[data-breed=red]');await click('[data-act=startGo]');
 await ev(`(()=>{const g=__game;g.state.cafe.level=5;g.state.coins=30000;g.state.dia=30;for(const breed of ['white','kuro']){const sh=g.S.makeShiba(g.state,{breed,level:21,now:g.clock.now()});sh.placed=true;g.state.shibas.push(sh);}for(let i=0;i<250;i++)g.step(.1);g.world.custs=g.world.custs.slice(0,2);g.S.developMenu(g.state,'M-02',g.clock.now());g.refresh();return true;})()`);
 await sleep(1600);
 };
 await stage();
 for(const dsf of [1,2]){await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:dsf,mobile:true});await shot(dsf===1?'main-screen-v4.png':'main-screen-v4@2x.png');}
 await stage(true);await shot('main-screen-v4-grid.png');
 writeFileSync(join(out,'main-screen-v4-state.txt'),'Lv5; three placed shibas (red, white, kuro), two simulated guests; M-02 developing; coins 21,500; diamonds 30; fresh=1, still=1, seed=7; 250 steps of 0.1 seconds. 390x844, DPR1 and DPR2.\n');
 console.log('Staged capture: cafe level 5, three placed shibas, two simulated guests, M-02 developing; coins 21,500, diamonds 30; 390x844 CSS px, DPR 1 and 2.');
}catch(e){errors.push(String(e.stack||e));}finally{chrome.kill();setTimeout(()=>rmSync(prof,{recursive:true,force:true}),300);}
console.log(`${shots.length} screens → ${out}`);for(const s of shots)console.log('  '+s);for(const e of errors)console.log('  ERROR',e);process.exitCode=errors.length?1:0;
