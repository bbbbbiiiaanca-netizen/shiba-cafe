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
 const stage=async(edit=false)=>{
 await c('Page.navigate',{url:'file://'+resolve(ROOT,'index.html')+'?temp=1&still=1&fresh=1&seed=7'+(edit?'&edit=1':'')});
 for(let i=0;i<300&&!(await ev('Boolean(window.__ready)'));i++)await sleep(100);
 // Unsaved capture state: Lv6, M-02 in development.
 await click('[data-lang=ko]');await click('[data-act=langOk]');await click('[data-breed=red]');await click('[data-act=startGo]');
 await ev(`(()=>{const g=__game;g.state.cafe.level=5;g.state.coins=30000;g.state.dia=30;for(let i=0;i<250;i++)g.step(.1);g.world.custs=g.world.custs.slice(0,2);g.S.developMenu(g.state,'M-02',g.clock.now());g.refresh();return true;})()`);
 await sleep(1600);
 };
 // v6 artifacts are approved references: do not overwrite them.
 await stage();
 for(const dsf of [1,2]){await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:dsf,mobile:true});await shot(dsf===1?'main-screen-v7.png':'main-screen-v7@2x.png');}
 await stage(true);
 await ev(`(()=>{const item=__game.state.placement.slots.find(s=>s.id==='counter');item.origin=[0,1];item.dir=1;__game.refresh();return true;})()`);
 await sleep(300);
 const p=await ev(`(async()=>{const h=__game.iso.hits.find(h=>h.id==='counter'),im=new Image();im.src='assets/drive/furn-counter-v4.png';await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);const d=ctx.getImageData(0,0,c.width,c.height).data,r=document.getElementById('isomap').getBoundingClientRect();for(let y=Math.floor(c.height/2);y<c.height;y++)for(let x=Math.floor(c.width/2);x<c.width;x++)if(d[(y*c.width+x)*4+3])return {x:r.left+h.x+(c.width-1-x)/c.width*h.w,y:r.top+h.y+y/c.height*h.h};throw Error('no counter pixel');})()`);
 for(const type of ['mousePressed','mouseReleased'])await c('Input.dispatchMouseEvent',{type,...p,button:'left',buttons:type==='mousePressed'?1:0,clickCount:1});
 if(!(await ev('__game.iso.selected==="counter"')))throw Error('counter selection failed');
 if(!(await ev(`document.querySelector('[data-main-tab=furniture]').classList.contains('active')&&document.getElementById('menuList').contains(document.querySelector('.furniture-actions'))&&!document.querySelector('.furniture-actions').hidden`)))throw Error('edit action bar missing from furniture panel');
 await shot('main-screen-v7-edit.png');
 // Unit 2 captures are separate from the reproducible v7 stages above.
 await stage();await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
 for(const tab of ['menu','shiba','furniture','store']){await click(`[data-main-tab=${tab}]`);await shot('main-screen-u2-'+(tab==='store'?'shop':tab)+'.png');}
 await click('[data-main-tab=shiba]');await ev('__game.state.shibas[0].paws=__game.S.pawsToNext(__game.state.shibas[0].level);__game.refresh();true');
 await click('#menuList [data-act=levelUp]');await shot('main-screen-u2-levelup.png');
 await stage();await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
 await click('[data-main-tab=furniture]');await shot('main-screen-u3-furniture.png');
 await ev('__game.iso.scrollTo(__game.iso.maxScroll);true');await shot('main-screen-u3-locked-row.png');
 await ev('__game.iso.scrollTo(0);true');await shot('main-screen-u3-2f.png');
 writeFileSync(join(out,'main-screen-v7-state.txt'),'Same normal staging as v6; edit: counter origin [0,1], dir1, footprint (0,1)-(0,2); stairs unchanged; 가구 tab active with action bar in bottom panel. 390x844, normal DPR1/DPR2, edit DPR2.\n');
 console.log('Staged capture: cafe level 5, M-02 developing; coins 21,500, diamonds 30; 390x844 CSS px, DPR 1 and 2.');
}catch(e){errors.push(String(e.stack||e));}finally{chrome.kill();setTimeout(()=>rmSync(prof,{recursive:true,force:true}),300);}
console.log(`${shots.length} screens → ${out}`);for(const s of shots)console.log('  '+s);for(const e of errors)console.log('  ERROR',e);process.exitCode=errors.length?1:0;
