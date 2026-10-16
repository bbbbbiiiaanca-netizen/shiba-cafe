// 명세 17-7 가벽(선 따라) 스샷: __game.CFG.partitionWall.enabled=true로 켠 상태, 360×800 → /workspace/compare/partition-wall/
// test:browser와 별도로 실행하는 그림 확인용. 실행: node tools/capture-partition-wall.mjs
import {spawn} from 'node:child_process';import {resolve,dirname,join} from 'node:path';import {fileURLToPath} from 'node:url';import {rmSync,writeFileSync,mkdirSync} from 'node:fs';
const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');const prof='/tmp/shiba-partition-'+process.pid;
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
 const OUT=process.argv[2]?resolve(process.argv[2]):'/workspace/compare/partition-wall'; // 인자로 다른 폴더 지정 가능
 mkdirSync(OUT,{recursive:true});
 const shot=async n=>{await sleep(600);const {data}=await c('Page.captureScreenshot',{format:'png'});writeFileSync(OUT+'/'+n,Buffer.from(data,'base64'));console.log('shot',OUT+'/'+n);};
 const must=async(label,x)=>{if(!await ev(x))throw Error('check failed: '+label);console.log('ok',label);};
 await go('&fresh=1&temp=1');
 await ev(`__game.state.started=true;__game.state.tutorialDone=true;__game.state.settings.language='ko';__game.ui.modals=[];__game.applyLang();__game.close();true`);
 await must('on by default',`__game.CFG.partitionWall.enabled===true`);
 await ev(`__game.CFG.partitionWall.enabled=false;true`);
 await must('disabled: no edge buttons',`__game.CFG.partitionWall.enabled===false&&(__game.iso.setEdit(true),__game.refresh(),[...document.querySelectorAll('[data-edge-add]')].every(b=>getComputedStyle(b).display==='none'))`);
 await ev(`__game.CFG.partitionWall.enabled=true;__game.iso.setEdit(false);__game.iso.setEdit(true);__game.refresh();true`);
 await must('edit bar shows 가벽(1칸)·가벽(2칸)',`[...document.querySelectorAll('[data-edge-add]')].map(b=>getComputedStyle(b).display!=='none'&&b.textContent).join()==='가벽(1칸),가벽(2칸)'`);
 await shot('1-edit-bar.png');
 await ev(`document.querySelector('[data-edge-add="edge1"]').click();true`);
 await must('1칸 가벽 placed + selected (green)',`(()=>{const e=__game.state.placement.edges?.[0];return e?.type==='edge1'&&__game.iso.selected===e.id&&document.getElementById('isomap').dataset.placementValid==='true'&&getComputedStyle(document.querySelector('[data-edge-remove]')).display!=='none'})()`);
 await shot('2-edge1-placed.png');
 await ev(`document.querySelector('[data-furniture-done]').click();document.querySelector('[data-edge-add="edge2"]').click();document.querySelector('[data-furniture-flip]').click();true`);
 await must('2칸 가벽 flipped',`(()=>{const e=__game.state.placement.edges.at(-1);return __game.state.placement.edges.length===2&&e.type==='edge2'&&e.flip===true&&__game.iso.selected===e.id})()`);
 await shot('3-edge2-flipped.png');
 // 입구 [0,5]: 오른쪽 선은 허용, 위쪽 선까지 세우면 입구 칸이 갇혀 거부
 await ev(`__game.state.placement.edges=[];__game.iso.setEdit(false);__game.iso.setEdit(true);__game.iso.placeEdge('edge1',[0,5],'i');document.querySelector('[data-furniture-done]').click();true`);
 await must('blocking edge rejected with entrance toast',`__game.iso.placeEdge('edge1',[0,4],'j')===false&&document.getElementById('toast').textContent==='입구가 막혔어요!'&&__game.state.placement.edges.length===1`);
 await shot('4-blocked-toast.png');
 // 같은 네 가벽: 1칸·2칸 × i·j, 앞/뒤/일반 화면 비교
 await ev(`__game.ui.toastT=0;document.getElementById('toast').style.opacity=0;__game.iso.setEdit(false);__game.state.placement.edges=[{id:'preview-1i',type:'edge1',cell:[1,1],side:'i',flip:false},{id:'preview-1j',type:'edge1',cell:[3,1],side:'j',flip:false},{id:'preview-2i',type:'edge2',cell:[1,3],side:'i',flip:false},{id:'preview-2j',type:'edge2',cell:[3,3],side:'j',flip:false}];__game.iso.setEdit(true);__game.refresh();true`);
 await must('four front edges in edit mode',`__game.state.placement.edges.length===4&&__game.state.placement.edges.every(e=>!e.flip)&&__game.iso.hits.filter(h=>h.edge).length===4`);
 await shot('partition-edit-front.png');
 await ev(`__game.state.placement.edges.forEach(e=>e.flip=true);__game.refresh();true`);
 await must('four back edges',`__game.state.placement.edges.every(e=>e.flip)`);
 await shot('partition-edit-flip.png');
 await ev(`__game.iso.setEdit(false);__game.refresh();true`);
 await must('play: no edit edge hits',`!__game.iso.hits.some(h=>h.edge)`);
 await shot('partition-play.png');
 if(errors.length)throw Error(errors.join('\n'));console.log('partition wall captures done');
}finally{chrome.kill('SIGTERM');await sleep(150);rmSync(prof,{recursive:true,force:true});}
