// 2026-10-17 가구 돌리기 설정(CFG.decor.backArt.enabled) 확인용 360px 스샷 4장. test:browser에는 넣지 않고 따로 실행: node tools/capture-furniture-rotate.mjs
import {spawn} from 'node:child_process';import {resolve,dirname,join} from 'node:path';import {fileURLToPath} from 'node:url';import {rmSync,writeFileSync,mkdirSync} from 'node:fs';
const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');const prof='/tmp/shiba-rotate-'+process.pid;
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
 await c('Page.navigate',{url:'file://'+resolve(ROOT,'index.html')+'?still=1&seed=7&fresh=1&temp=1'});await sleep(300);for(let i=0;i<300&&!(await ev('Boolean(window.__ready)'));i++)await sleep(100);
 await ev(`__game.state.started=true;__game.state.tutorialDone=true;__game.state.settings.language='ko';__game.ui.modals=[];__game.applyLang();true`);
 const OUT='/workspace/compare/furniture-rotate';mkdirSync(OUT,{recursive:true});
 // 화면 위 설명 줄(스샷 확인용, 게임 UI 아님)
 const caption=t=>ev(`(()=>{let d=document.getElementById('rot-caption');if(!d){d=document.createElement('div');d.id='rot-caption';d.style.cssText='position:fixed;left:0;right:0;top:0;z-index:99999;background:rgba(0,0,0,.72);color:#fff;font:12px/1.4 sans-serif;padding:4px 6px;white-space:pre-line;pointer-events:none';document.body.append(d);}d.textContent=${JSON.stringify(t)};return true;})()`);
 const shot=async n=>{await sleep(700);const {data}=await c('Page.captureScreenshot',{format:'png'});writeFileSync(OUT+'/'+n,Buffer.from(data,'base64'));console.log('shot',OUT+'/'+n);};
 const place=async slots=>{await ev(`__game.state.placement.slots=${JSON.stringify(slots)};__game.iso.setEdit(true);__game.refresh();true`);await sleep(500);};
 // 실제 화면 클릭으로 고르기: 가구 그림의 불투명한 점을 찾아 pointerdown/up.
 const select=async sid=>{const ok=await ev(`(()=>{const cv=document.getElementById('isomap'),r=cv.getBoundingClientRect(),h=__game.iso.hits.find(h=>h.id===${JSON.stringify(sid)}&&!h.footprint);if(!h)return false;
  for(let fy=.85;fy>.1;fy-=.05)for(const fx of [.5,.4,.6,.3,.7]){const x=r.left+h.x+h.w*fx,y=r.top+h.y+h.h*fy,o={pointerId:1,button:0,clientX:x,clientY:y,bubbles:true};cv.dispatchEvent(new PointerEvent('pointerdown',o));cv.dispatchEvent(new PointerEvent('pointerup',o));if(__game.iso.selected===${JSON.stringify(sid)})return true;}return false;})()`);
  if(!ok)throw Error('select '+sid);};
 const press=async(sid,btn,n)=>{await select(sid);for(let i=0;i<n;i++){await ev(`document.querySelector('[data-furniture-${btn}]').click();true`);await sleep(80);}};
 const dirs=()=>ev(`Object.fromEntries(__game.state.placement.slots.map(s=>[s.id,s.dir]))`);
 const done=()=>ev(`document.querySelector('[data-furniture-done]').click();true`);
 const expect=(got,want,label)=>{for(const [k,v] of Object.entries(want))if(got[k]!==v)throw Error(`${label}: ${k} dir ${got[k]} expected ${v}`);console.log('ok',label,JSON.stringify(got));};

 // 1) 기본 가구 앞모습 dir 0·1
 await place(['counter','table','cushion','stairs'].flatMap((type,i)=>[0,1].map(dir=>({id:type+'-'+dir,type,dir,origin:[[0,0],[3,0],[0,2],[2,2],[4,2],[5,2],[1,4],[4,4]][i*2+dir]}))));
 await done();await caption('1. 기본 가구 앞모습: 카운터·찻상·방석·계단, 각각 dir 0(왼쪽)·1(오른쪽)');await shot('1-front-2dir.png');

 // 2) 뒤집기 전후: 같은 가구 2개, 오른쪽 것만 골라 뒤집기 1번
 const flipTypes=['shelf','low-table','shelf-momiji'];
 await place(flipTypes.flatMap((type,i)=>[{id:type+'-a',type,dir:0,origin:[1,i*2]},{id:type+'-b',type,dir:0,origin:[4,i*2]}]));
 for(const t of flipTypes)await press(t+'-b','flip',1);
 expect(await dirs(),Object.fromEntries(flipTypes.flatMap(t=>[[t+'-a',0],[t+'-b',1]])),'flip');
 await done();await caption('2. 뒤집기 전후: 선반·좌식 테이블·단풍 선반\n왼쪽 = 전(dir 0), 오른쪽 = 뒤집기 1번 누른 뒤(dir 1)');await shot('2-flip.png');

 // 3) 좌식 테이블 일반·벚꽃 4방향: 돌리기 0~3번
 const four=['low-table','low-table-sakura'];
 await place(four.flatMap((type,r)=>[0,1,2,3].map(n=>({id:type+'-'+n,type,dir:0,origin:[[0,0],[2,0],[4,0],[5,2]][n].map((v,k)=>k?v+r*3:v)}))));
 for(const t of four)for(const n of [1,2,3])await press(t+'-'+n,'rotate',n);
 expect(await dirs(),Object.fromEntries(four.flatMap(t=>[0,1,2,3].map(n=>[t+'-'+n,n]))),'4dir');
 await done();await caption('3. 좌식 테이블(위)·벚꽃 좌식 테이블(아래)\n돌리기 0·1·2·3번 → dir 0·1·2·3 (2·3 = 뒷모습)');await shot('3-4dir-low-table.png');

 // 4) 2방향만: 뒷모습 그림이 있는 선반 + 단풍 가구. 돌리기 0~3번 눌러도 0↔1
 const two=['shelf','moon-lamp','shelf-sakura'];
 await place(two.flatMap((type,r)=>[0,1,2,3].map(n=>({id:type+'-'+n,type,dir:0,origin:[[0,0],[2,0],[4,0],[5,1]][n].map((v,k)=>k?v+r*2:v)}))));
 for(const t of two)for(const n of [1,2,3])await press(t+'-'+n,'rotate',n);
 expect(await dirs(),Object.fromEntries(two.flatMap(t=>[0,1,2,3].map(n=>[t+'-'+n,n%2]))),'2dir');
 await done();await caption('4. 선반·달 조명·벚꽃 선반(뒷모습 꺼둠)\n돌리기 0·1·2·3번 → dir 0·1·0·1 (앞모습만)');await shot('4-2dir-only.png');

 // 5) 단풍·눈 4방향 (2026-10-17 뒷모습 승인)
 const ms=['low-table-momiji','shelf-snow'];
 await place(ms.flatMap((type,r)=>[0,1,2,3].map(n=>({id:type+'-'+n,type,dir:0,origin:[[0,0],[2,0],[4,0],[5,2]][n].map((v,k)=>k?v+r*3:v)}))));
 for(const t of ms)for(const n of [1,2,3])await press(t+'-'+n,'rotate',n);
 expect(await dirs(),Object.fromEntries(ms.flatMap(t=>[0,1,2,3].map(n=>[t+'-'+n,n]))),'4dir momiji/snow');
 await done();await caption('5. 단풍 좌식 테이블(위)·눈 선반(아래)\n돌리기 0·1·2·3번 → dir 0·1·2·3');await shot('5-4dir-momiji-snow.png');
 if(errors.length)throw Error(errors.join('\n'));console.log('furniture rotate capture: 5 screenshots, flip/rotate dirs checked');
}finally{chrome.kill('SIGTERM');await sleep(150);rmSync(prof,{recursive:true,force:true});}
