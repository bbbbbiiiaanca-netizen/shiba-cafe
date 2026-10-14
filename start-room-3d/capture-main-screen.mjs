// Main cafe capture using capture-spec-v3.mjs Chrome CDP pipe approach, portrait 390×844.
// Usage (from the repo root or start-room-3d/): node start-room-3d/capture-main-screen.mjs [OUTDIR]
// Default OUTDIR: /workspace/shiba-cafe-docs/spec-v3-build
import {spawn} from 'node:child_process';import {mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';import {resolve,dirname,join} from 'node:path';import {fileURLToPath} from 'node:url';
const ROOT=dirname(fileURLToPath(import.meta.url));
const out=resolve(process.argv.slice(2).find(x=>!x.startsWith('--'))||'/workspace/shiba-cafe-docs/spec-v3-build');mkdirSync(out,{recursive:true});
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
 const ev=async x=>{const r=await c('Runtime.evaluate',{expression:x,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(x.slice(0,90)+' -> '+JSON.stringify(r.exceptionDetails).slice(0,3000));return r.result.value;};
 const settle=()=>ev('new Promise(r=>{const imgs=[...document.images].filter(i=>!i.complete);if(!imgs.length)return r(true);let n=imgs.length;for(const i of imgs)i.onload=i.onerror=()=>--n||r(true);setTimeout(()=>r(true),4000);})');
 const shot=async(name,{keepToast=false}={})=>{if(!keepToast)await ev('__game.refresh();__game.ui.toastT=0;document.getElementById("toast").style.opacity=0;true');await settle();await sleep(150);const {data}=await c('Page.captureScreenshot',{format:'png'});writeFileSync(join(out,name),Buffer.from(data,'base64'));shots.push(name);};
 const click=sel=>ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)throw Error('no '+${JSON.stringify(sel)});e.click();return true;})()`);
 const stage=async(edit=false)=>{
 await c('Page.navigate',{url:'file://'+resolve(ROOT,'index.html')+'?temp=1&still=1&fresh=1&seed=7'+(edit?'&edit=1':'')});
 for(let i=0;i<300&&!(await ev('Boolean(window.__ready)'));i++)await sleep(100);
 // Unsaved capture state: Lv6, M-02 in development.
 await click('[data-lang=ko]');await click('[data-act=langOk]');await click('[data-breed=red]');await click('[data-act=startGo]');
 await ev(`(()=>{const g=__game;g.state.cafe.level=5;g.state.coins=30000;g.state.dia=30;for(let i=0;i<250;i++)g.step(.1);g.world.custs=g.world.custs.slice(0,2);g.S.developMenu(g.state,'M-02',g.clock.now());g.refresh();return true;})()`);
 await sleep(1600);
 };
 // Capture only §14 with --u14; preserve prior approved artifacts.
 if(process.argv.includes('--u15')){
  await stage();await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
  await ev(`(()=>{const g=__game,n=g.clock.now();g.state.cafe.level=30;g.state.coins=300000;g.S.recordPayment(g.state,{pending:false,base:120,total:240},n);g.S.recordPayment(g.state,{pending:false,base:80,total:160},n-g.CFG.ledger.periodMs);g.S.recordPayment(g.state,{pending:false,base:60,total:90},n,{offline:true});g.S.hireAlba(g.state,'manager',[],n);g.state.shibas[0].status='sick';g.S.sendToHospital(g.state,g.state.shibas[0].id,n);g.S.buyAcc(g.state,g.S.bandanaItems()[0].id,n);g.refresh();return true;})()`);
  await click('#hud [data-act=income]');
  if(!(await ev(`!document.getElementById('modal').hidden&&document.querySelector('.ledger-title h2').textContent==='손익계산서'`)))throw Error('pill ledger missing');
  await click('[data-act=ledgerDay][data-day="-1"]');
  if(!(await ev(`document.querySelector('[data-ledger-category=sales]').textContent.includes('80')`)))throw Error('yesterday missing');
  await click('[data-act=ledgerDay][data-day="0"]');await click('#mbox [data-act=modalOk]');
  await click('[data-main-tab=store]');await click('#menuList [data-act=ledger]');
  await shot('main-screen-u15-ledger.png');
  writeFileSync(join(out,'main-screen-u15-ledger-state.txt'),'STAGED, unsaved ?temp=1 fixture. 390×844 CSS px, DPR2. Today: sales 120, meeting extra 120, offline 90, manager wages 60000, hospital sick fee, M-02 development 8500 (normal stage), one bandana purchase. Yesterday: sales 80 + meeting extra 80. Smoke: pill opens, yesterday/today flip, close, store button opens.\n');
  if(errors.length)throw Error(errors.join('\n'));
 }else if(process.argv.includes('--u14')){
  await stage();await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
  await click('[data-main-tab=menu]');await shot('main-screen-u14-topbar.png');
  if(errors.length)throw Error(errors.join('\n'));
  console.log('§14: 390×844, DPR2, 메뉴 tab → '+join(out,'main-screen-u14-topbar.png'));
 }else{
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
 await click('[data-main-tab=furniture]');await ev('document.getElementById("menuList").scrollTop=0;true');await shot('main-screen-u3-inventory.png');
 await click('[data-main-tab=menu]');
 await ev('__game.iso.scrollTo(__game.iso.maxScroll);true');await shot('main-screen-u3-locked-row.png');
 const expansionPoint=await ev('(()=>{const m=__game.iso.markers.find(m=>m.kind==="row"),r=document.getElementById("isomap").getBoundingClientRect();return {x:r.left+m.buttonX,y:r.top+m.buttonY};})()');
 for(const type of ['mousePressed','mouseReleased'])await c('Input.dispatchMouseEvent',{type,...expansionPoint,button:'left',buttons:type==='mousePressed'?1:0,clickCount:1});
 if(!(await ev(`document.getElementById('toast').textContent==='상점 준비 중이에요'&&document.querySelector('[data-main-tab=menu]').classList.contains('active')&&!document.querySelector('[data-space-card]')`)))throw Error('Expansion + did not show pending shop toast');
 const unit3=['locked-row','inventory'].map(name=>readFileSync(join(out,'main-screen-u3-'+name+'.png')));
 if(unit3[0].equals(unit3[1]))throw Error('Unit 3 captures must be distinct');
 // Unit 4 fixture supplies undecided navigation/payment values only in unsaved TEMP mode.
 await stage();await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});await click('[data-main-tab=menu]');
 await ev(`(()=>{const g=__game;g.world.navigation={entrance:[5,5]};g.CFG.navigation.cellStepSec=1;g.CFG.income.levelAggregation=xs=>xs.length?xs[0]:1;g.state.menus=['M-02'];for(const sh of g.state.shibas)Object.assign(sh.g,{full:100,dirt:0,fatigue:0,happy:100,boredom:0});g.world.spawnT=0;for(let i=0;i<80;i++){g.S.tick(g.state,g.world,1,g.clock.now()+i*1000);if(g.world.events.some(e=>e.type==='leave'))break;}window.u4Payments=g.world.events.filter(e=>e.type==='leave');g.world.events=g.world.events.filter(e=>e.type==='order');g.step(0);return true;})()`);
 if(!(await ev('document.getElementById("toast").textContent.includes("주문")')))throw Error('Unit 4 order feedback missing');
 await shot('main-screen-u4-order.png',{keepToast:true});
 await ev('__game.world.events=window.u4Payments;__game.step(0);true');
 if(!(await ev('document.getElementById("toast").textContent.includes("멍코인")')))throw Error('Unit 4 payment feedback missing');
 await shot('main-screen-u4-payment.png',{keepToast:true});
 await shot('main-screen-u4-panel.png');

 // Unit 5 new DPR2 artifacts. Table item uses actual sit/order rules in TEMP.
 await stage();await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
 await shot('main-screen-u5-grass.png');
 await click('[data-main-tab=menu]');await ev('document.getElementById("menuList").scrollTop=0;true');await shot('main-screen-u5-menu.png');
 await ev(`(()=>{const g=__game;g.world.custs=[];g.world.queue=[];g.world.sh={};g.world.events=[];g.world.spawnT=0;g.world.r=()=>.99;for(let i=0;i<200;i++){g.step(.1);if(g.world.custs.some(c=>c.phase==='seated'))break;}g.refresh();return true;})()`);
 if(!(await ev('__game.world.custs.some(c=>c.phase==="seated"&&c.itemSlot&&c.order.kind==="coffee")')))throw Error('Unit 5 staged drink missing table slot');
 await shot('main-screen-u5-table-item.png');
 writeFileSync(join(out,'main-screen-v7-state.txt'),'Same normal staging as v6; edit: counter origin [0,1], dir1, footprint (0,1)-(0,2); stairs unchanged; 가구 tab active with action bar in bottom panel. 390x844, normal DPR1/DPR2, edit DPR2.\n');
 console.log('Staged capture: cafe level 5, M-02 developing; coins 21,500, diamonds 30; 390x844 CSS px, DPR 1 and 2.');
 }
}catch(e){errors.push(String(e.stack||e));}finally{chrome.kill();setTimeout(()=>rmSync(prof,{recursive:true,force:true}),300);}
console.log(`${shots.length} screens → ${out}`);for(const s of shots)console.log('  '+s);for(const e of errors)console.log('  ERROR',e);process.exitCode=errors.length?1:0;
