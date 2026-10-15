import {q1715Browser} from './tests/q1715-browser.mjs';
import {q17Browser} from './tests/q17-browser.mjs';
import {startFlow} from './tests/start-flow.mjs';
// Main cafe capture using capture-spec-v3.mjs Chrome CDP pipe approach, portrait 390×844.
// Usage (from the repo root or start-room-3d/): node start-room-3d/capture-main-screen.mjs [OUTDIR] [--final | --u18 | --u179 | --u12b | --u12 | --rf]
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
 const shot=async(name,{keepToast=false}={})=>{if(!keepToast)await ev('__game.refresh();__game.ui.toastT=0;document.getElementById("toast").style.opacity=0;document.getElementById("toast").textContent="";true');await settle();await ev(`(()=>{const images=[...document.querySelectorAll('.lp-face img,.mission-btn img,.tab-ico img,#boostChip img')];if(images.some(i=>!i.complete||!i.naturalWidth))throw Error('Approved UI art failed to load');return true;})()`);await sleep(150);const {data}=await c('Page.captureScreenshot',{format:'png'});writeFileSync(join(out,name),Buffer.from(data,'base64'));shots.push(name);};
 const click=sel=>ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)throw Error('no '+${JSON.stringify(sel)});e.click();return true;})()`);
 const stage=async(edit=false)=>{
 await c('Page.navigate',{url:'file://'+resolve(ROOT,'index.html')+'?temp=1&still=1&fresh=1&seed=7'+(edit?'&edit=1':'')});
 for(let i=0;i<300&&!(await ev('Boolean(window.__ready)'));i++)await sleep(100);
 // Unsaved capture state: Lv6, M-02 in development.
 await startFlow(ev);
 await ev(`(()=>{const g=__game;g.state.cafe.level=5;g.state.coins=30000;g.state.dia=30;for(let i=0;i<250;i++)g.step(.1);g.world.custs=g.world.custs.slice(0,2);g.S.developMenu(g.state,'M-02',g.clock.now());g.refresh();return true;})()`);
 await sleep(1600);
 };
 const stageStarter=async()=>{
  await c('Page.navigate',{url:'file://'+resolve(ROOT,'index.html')+'?temp=1&still=1&fresh=1&seed=7'});
  for(let i=0;i<300&&!(await ev('Boolean(window.__ready)'));i++)await sleep(100);
  await startFlow(ev,{beforeGo:()=>shot('main-screen-final-starter.png')});
  await stage();
 };
 // §16: bottom tab row with real-state red dots, 알바 고르기 and 메뉴 개발 list popups (DPR2, unsaved TEMP staging).
 const u16=async()=>{
  await stage();await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
  await ev(`(()=>{const g=__game,sh=g.state.shibas[0];g.state.cafe.level=10;g.state.coins=Math.max(g.state.coins,g.CFG.alba.daycare.cost);sh.paws=g.S.pawsToNext(sh.level);g.refresh();return true;})()`);
  await click('[data-main-tab=manage]');
  if(!(await ev(`document.querySelectorAll('.main-tabs').length===1&&!document.querySelector('[data-main-tab=shiba] .tab-dot').hidden&&!document.querySelector('[data-main-tab=manage] .tab-dot').hidden`)))throw Error('§16 tab dots missing');
  await shot('main-screen-u16-tabs.png');
  await click('[data-main-tab=manage]');await click('[data-act=listOpen][data-list=alba]');
  if(!(await ev(`document.querySelectorAll('#mbox .lp-card').length===4`)))throw Error('§16 alba popup missing');
  await shot('main-screen-u16-popup-alba.png');
  await click('#mbox .lp-close');await click('[data-main-tab=manage]');await click('[data-act=listOpen][data-list=menu]');
  if(!(await ev(`document.querySelectorAll('#mbox .lp-card').length===13`)))throw Error('§16 menu popup missing');
  await shot('main-screen-u16-popup-menu.png');
  writeFileSync(join(out,'main-screen-u16-state.txt'),'STAGED, unsaved ?temp=1 fixture. 390×844 CSS px, DPR2. Café Lv10, M-02 developing, coins ≥ daycare price (CFG.alba.daycare.cost), 30 diamonds, starter paws = next level-up cost (시바 dot), daycare affordable (알바 dot). tabs: 가게 관리 active; popup-alba: 알바 고르기; popup-menu: 메뉴 개발 (13 menus).\n');
 };
 // §17: five-tab row (가게 관리 centre, 미션 top right), 가게 관리 status screen, 업그레이드 popup (3 kinds, prices 미정) — DPR2, unsaved TEMP staging.
 const u17=async()=>{
  await stage();await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
  await ev(`(()=>{const g=__game,sh=g.state.shibas[0];g.state.cafe.level=10;g.state.coins=Math.max(g.state.coins,g.CFG.alba.daycare.cost);sh.paws=g.S.pawsToNext(sh.level);g.refresh();return true;})()`);
  await click('[data-main-tab=manage]');
  if(!(await ev(`document.querySelectorAll('[data-main-tab]').length===5&&!document.querySelector('[data-main-tab=mission]')&&!!document.querySelector('#hud [data-act=mission]')&&document.querySelectorAll('[data-main-tab]')[2].dataset.mainTab==='manage'`)))throw Error('§17 five tabs missing');
  await shot('main-screen-u17-tabs.png');
  if(!(await ev(`!document.querySelector('[data-main-menu],.menu-card')&&!!document.querySelector('#menuList [data-cafe-level]')&&!!document.querySelector('#menuList [data-act=listOpen][data-list=upgrade]')`)))throw Error('§17 manage screen missing');
  await ev('document.getElementById("menuList").scrollTop=0;true');await shot('main-screen-u17-manage.png');
  await click('#menuList [data-act=listOpen][data-list=upgrade]');
  if(!(await ev(`document.querySelectorAll('#mbox .lp-card').length===3&&[...document.querySelectorAll('#mbox .lp-price')].every(b=>b.disabled&&b.textContent==='미정')`)))throw Error('§17 upgrade popup missing');
  await shot('main-screen-u17-upgrades.png');
  writeFileSync(join(out,'main-screen-u17-state.txt'),'STAGED, unsaved ?temp=1 fixture. 390×844 CSS px, DPR2. Café Lv10, M-02 developing, coins ≥ daycare price (CFG.alba.daycare.cost), 30 diamonds, starter paws = next level-up cost (시바 dot), daycare affordable (알바 dot). tabs: 5 tabs, 가게 관리 centre + active, 미션 button top right; manage: café status + 메뉴 개발/업그레이드/손익계산서; upgrades: 3 kinds, prices 미정 (disabled).\n');
 };
 // §17-1…17-6: heart slots + countdown, ledger lines, short list cards, 가게 관리 summary, payment floats, tab row — DPR2, unsaved TEMP staging.
 const u17b=async()=>{
  const dpr2=()=>c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
  await stage();await dpr2();
  await ev(`(()=>{const g=__game;g.state.hearts=2;g.state.heartRegenAt=g.clock.now()-1528e3;g.refresh();return true;})()`);
  await click('[data-main-tab=manage]');
  if(!(await ev(`document.querySelectorAll('#hud .heart-slot').length===5&&document.querySelectorAll('#hud .heart-slot[data-full="1"]').length===2&&!document.getElementById('heartT').hidden&&/^\\d\\d:\\d\\d$/.test(document.getElementById('heartT').textContent)`)))throw Error('§17-1 heart slots / countdown missing');
  await shot('main-screen-u17-topbar.png');
  await ev(`(()=>{const g=__game,n=g.clock.now();g.state.cafe.level=30;g.state.coins=300000+g.CFG.alba.manager.cost;g.S.recordPayment(g.state,{pending:false,base:120,total:240},n);g.S.recordPayment(g.state,{pending:false,base:60,total:90},n,{offline:true});g.S.hireAlba(g.state,'manager',[],n);g.state.shibas[0].status='sick';g.S.sendToHospital(g.state,g.state.shibas[0].id,n);g.S.buyAcc(g.state,g.S.bandanaItems()[0].id,n);g.refresh();return true;})()`);
  await click('#hud [data-act=income]');
  if(!(await ev(`document.querySelectorAll('.ledger-row[data-ledger-category]').length===9&&!!document.querySelector('[data-ledger-category=furniture]')`)))throw Error('§17-2 ledger lines missing');
  await shot('main-screen-u17-ledger.png');await click('#mbox [data-act=modalOk]');
  await stage();await dpr2();
  await ev(`(()=>{const g=__game,sh=g.state.shibas[0];g.state.cafe.level=10;g.state.coins=Math.max(g.state.coins,g.CFG.alba.daycare.cost);sh.paws=g.S.pawsToNext(sh.level);g.refresh();return true;})()`);
  await click('[data-main-tab=manage]');
  if(!(await ev(`/^착석 \\d+ · 대기 \\d+/.test(document.querySelector('[data-customer-status]').textContent)`)))throw Error('§17-4 manage summary missing');
  await ev('document.getElementById("menuList").scrollTop=0;true');await shot('main-screen-u17-manage.png');
  await shot('main-screen-u17-tabs.png');
  await click('[data-main-tab=manage]');await click('[data-act=listOpen][data-list=alba]');
  if(!(await ev(`document.querySelector('[data-lp-row=daycare] .lp-effect').textContent==='시바랑 놀아줘요'&&document.querySelectorAll('#mbox .lp-card.locked').length===3`)))throw Error('§17-4 alba popup missing');
  await shot('main-screen-u17-alba.png');
  await click('#mbox .lp-close');await click('[data-main-tab=manage]');await click('[data-act=listOpen][data-list=menu]');
  if(!(await ev(`/^개발 중 /.test(document.querySelector('[data-lp-row=M-02] .lp-effect').textContent)&&document.querySelector('[data-lp-row=M-05] .lp-effect').textContent==='판매가 5멍'`)))throw Error('§17-4 menu popup missing');
  await shot('main-screen-u17-menu.png');await click('#mbox .lp-close');
  await floatShot('heart','main-screen-u17-float.png');
  writeFileSync(join(out,'main-screen-u17b-state.txt'),'STAGED, unsaved ?temp=1 fixture. 390×844 CSS px, DPR2. topbar: café Lv5, hearts 2/5 with next heart 04:32. ledger: café Lv30, today sales 120 + meeting extra 120, offline 90, manager wages, sick hospital fee, M-02 development, one bandana; 기타 수입 and 가구 구입 at 0. manage / tabs: café Lv10, M-02 developing, starter paws = next level-up (시바 dot), daycare affordable (알바 dot). alba: Lv10 → daycare open, 산책/훈련사/매니저 "Lv{N} 해금". menu: 메뉴 개발 popup. float: café run with real guests until a paying guest whose request was met leaves; coin + heart floats held at 25% of their 1 s rise.\n');
 };
 // §17-5·17-6 floats from the real café path: run until a float of `kind` appears (heart = request met; angry = queue timeout), keep only that
 // guest's floats (coin+heart, or 빠직), hold them a quarter of the way up, check the icon files are loaded, then shoot.
 const floatShot=async(kind,name)=>{
  await ev(`(()=>{const g=__game,has=()=>(g.world.floats||[]).some(f=>f.kind==='${kind}');for(let i=0;i<20000&&!has();i++)g.step(.1);if(!has())throw Error('no ${kind} float');
   const keep='${kind}'==='angry'?['angry']:['coin','heart'],guest=g.world.floats.find(f=>f.kind==='${kind}').guestId;
   g.world.floats=g.world.floats.filter(f=>keep.includes(f.kind)&&f.guestId===guest);for(const f of g.world.floats)f.age=.25*f.dur;g.refresh();
   return Promise.all(['res-coin','res-heart','emo-angry'].map(n=>{const i=new Image();i.src='assets/drive/ui/'+n+'.png';return i.decode();})).then(()=>{g.refresh();return true;});})()`);
  if(!(await ev(`(__game.world.floats||[]).some(f=>f.kind==='${kind}')`)))throw Error(name+': float missing');
  await sleep(100);await shot(name);};
 // reviewer fixes 2026-10-15: 빠직 float (emo-angry.png, coin size) and coin+heart float (heart only when the request was met) — DPR2, unsaved TEMP staging.
 const u17c=async()=>{
  const dpr2=()=>c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
  await stage();await dpr2();await floatShot('angry','main-screen-u17-float-angry.png');
  await stage();await dpr2();await floatShot('heart','main-screen-u17-float.png');
  writeFileSync(join(out,'main-screen-u17c-state.txt'),'STAGED, unsaved ?temp=1 fixture (café Lv5, seed 7). 390×844 CSS px, DPR2. float-angry: café run with real guests until a queued guest times out (30 s) → 빠직 float (assets/drive/ui/emo-angry.png, drawn at the coin float size) held at 25% of its 1 s rise; other floats removed. float: café run with real guests until a paying guest whose request was met leaves → coin + heart floats held at 25%; other floats removed.\n');
 };
 const u17d=async()=>{
  await stage(true);await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
  await click('[data-wall-add]');
  if(!(await ev(`__game.state.placement.slots.some(s=>s.type==='wall')&&__game.iso.gridCells>0`)))throw Error('wall footprint missing');
  await shot('main-screen-u17-walls-edit.png');
  await ev(`(()=>{const g=__game,b=JSON.stringify(g.state.placement);if(g.iso.placeWall([0,5]))throw Error('entrance accepted');if(JSON.stringify(g.state.placement)!==b)throw Error('blocked edit mutated');return true;})()`);
  if(!(await ev(`document.getElementById('toast').textContent==='입구가 막혔어요!'`)))throw Error('blocked toast missing');
  await shot('main-screen-u17-walls-blocked.png',{keepToast:true});
  await ev(`(()=>{const g=__game;g.iso.setEdit(false);g.state.cafe.level=g.CFG.alba.manager.unlock;g.state.coins=g.CFG.alba.manager.cost;g.S.hireAlba(g.state,'manager',[],g.clock.now());g.step(g.CFG.navigation.cellStepSec);g.refresh();return true;})()`);
  if(!(await ev(`__game.world.manager?.role==='manager'&&!document.getElementById('manager-debug')`)))throw Error('manager navigation missing');
  await shot('main-screen-u17-manager.png');
 };
 // §11·§12: requested expansion stages, always DPR2, isolated TEMP fixture.
 const u12=async()=>{
  await stage();await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
  await click('[data-main-tab=manage]');
  for(const n of [0,1,2,3]){
   await ev(`(()=>{const g=__game;if(!g.debugExpand(${n}))throw Error('TEMP expansion rejected');g.iso.panTo(0,g.iso.maxScroll);return true;})()`);
   await sleep(300);await shot('main-screen-u12-expand-'+n+'.png');
  }
  // Pan by an actual sideways drag; travel is derived from the current bounds.
  const p=await ev(`(()=>{const g=__game,r=document.getElementById('isomap').getBoundingClientRect();g.iso.panTo(g.iso.panBounds.minX,g.iso.maxScroll);return {x:r.left+r.width/2,y:r.top+r.height/2,dx:Math.ceil(g.iso.panBounds.maxX-g.iso.panBounds.minX)+r.width};})()`);
  await c('Input.dispatchMouseEvent',{type:'mousePressed',x:p.x,y:p.y,button:'left',buttons:1,clickCount:1});
  await c('Input.dispatchMouseEvent',{type:'mouseMoved',x:p.x-p.dx,y:p.y,button:'left',buttons:1});
  await c('Input.dispatchMouseEvent',{type:'mouseReleased',x:p.x-p.dx,y:p.y,button:'left',buttons:0,clickCount:1});
  if(!(await ev('__game.iso.panX===__game.iso.panBounds.maxX&&__game.iso.panX>0')))throw Error('sideways drag failed');
  await shot('main-screen-u12-pan.png');
 };
 // Review fixes: isolated unsaved fixtures; all output is DPR2 and has no debug query.
 const rf=async()=>{
  const dpr=()=>c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
  await stage();await dpr();
  await ev(`(()=>{const g=__game;g.world.floats=[];g.world.events=[];
   for(let i=0;i<20000&&!g.world.custs.some(c=>c.phase==='seated');i++)g.step(.1);
   const guest=g.world.custs.find(c=>c.phase==='seated');if(!guest)throw Error('no seated guest');
   // Finish eating/playing before forcing this real guest's payment at their seat.
   guest.activity='interact';guest.eatRemaining=0;guest.fulfilled=true;guest.t=0;const cell=[...guest.cell];g.world.floats=[];g.world.events=[];g.step(g.CFG.navigation.cellStepSec);
   if(!['coin','heart'].every(kind=>g.world.floats.some(f=>f.kind===kind&&f.guestId===guest.id&&f.cell.join()===cell.join())))throw Error('floats not at paying seat');
   // Freeze the payment instant at the seat; characters have no art and stay invisible.
   guest.phase='seated';guest.cell=cell;g.world.custs=[guest];g.world.queue=[];
   g.world.floats=g.world.floats.filter(f=>f.guestId===guest.id&&f.cell.join()===cell.join());g.refresh();
   if(document.getElementById('manager-debug'))throw Error('debug leaked');return true;})()`);
  await shot('main-screen-rf-floats.png');
  await stage();await dpr();
  await ev('__game.state.shibas[0].paws=0;__game.refresh();true');
  await click('[data-main-tab=shiba]');await click('#menuList [data-act=care]');await click('[data-act=careOpen]');
  if(!(await ev(`document.querySelector('#panel [data-act=levelUp]').disabled`)))throw Error('level-up not disabled');
  await shot('main-screen-rf-levelup-dim.png');
  await stage();await dpr();
  await ev('__game.debugExpand(3);__game.iso.panTo(0,__game.iso.maxScroll);true');
  await shot('main-screen-rf-expand-tatami.png');
  await stage();await dpr();
  await ev(`(()=>{const g=__game;g.state.cafe.level=g.CFG.alba.manager.unlock;g.state.coins=g.CFG.alba.manager.cost;g.S.hireAlba(g.state,'manager',[],g.clock.now());g.step(g.CFG.navigation.cellStepSec);g.refresh();if(!g.world.manager||document.getElementById('manager-debug'))throw Error('manager fixture');return true;})()`);
  await shot('main-screen-rf-manager.png');
 };
 // Unsaved capture fixture: legacy spec boost multiplier 1.2 exercises the timer; production multiplier stays null.
 if(process.argv.includes('--q1715')||process.argv.includes('--q1717')){
 await stage();await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
 await q1715Browser({ev,shot,mode:process.argv.includes('--q1715')?'q1715':'q1717',check:async(name,expr)=>{if(!await ev(expr))throw Error(name);}});
 }else if(process.argv.includes('--q17')){
 await stage();await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
 await q17Browser({ev,c,shot,check:async(name,expr)=>{if(!await ev(expr))throw Error(name);}});
 await c('Page.navigate',{url:'file://'+resolve(ROOT,'index.html')+'?temp=1&still=1&fresh=1&fixture=friends'});
 for(let i=0;i<300&&!(await ev('Boolean(window.__ready)'));i++)await sleep(100);
 await startFlow(ev);await ev("__game.ui.modals=[];__game.open('friends');true");
 if(!await ev("!!document.querySelector('[data-friends] .friend-card')"))throw Error('fixture missing');
 await shot('main-screen-q17-friends-fixture.png');await ev("document.querySelector('[data-act=friendGo]').click();true");await sleep(200);await shot('main-screen-q17-friend-visit.png');await ev('__game.ui.modals=[];__game.close();__game.startTutorial();true');await sleep(300);await shot('main-screen-tutorial-1.png');await ev('document.querySelector("[data-act=confirmYes]").click();document.querySelector("[data-act=confirmYes]").click();true');await sleep(300);await shot('main-screen-tutorial-3.png');await shot('main-screen-tutorial-3-v5.png');await ev("(()=>{__game.ui.modals=[];const g=typeof __game.state==='function'?__game.state():__game.state;const a=g.shibas[0],b=g.shibas[1];a.breed='red';a.status='injured';a.injury='light';if(b){b.status='sick';b.breed='sesame';}const c=g.shibas[2];if(c){c.status='sick';c.injury=null;c.breed='white';}return true})()");await ev("document.querySelector('[data-tab=village],[data-main-tab=village]')?.click();true");await sleep(300);console.log('HOSP via village',await ev("(()=>{const b=document.querySelector('[data-act=villageHospital]');b?b.click():__game.open('hospital');return !!b})()"));await sleep(500);await shot('main-screen-hospital-v4.png');await ev("(()=>{__game.ui.modals=[];__game.open('cooking');return true})()");await sleep(500);await ev("document.querySelector('[data-act=recipePick][data-item=recipe-2]').click();true");await sleep(400);await shot('cook-popup-v9.png');await ev("document.querySelector('[data-act=recipePick][data-item=recipe-1]')?.click();true");await ev("(()=>{__game.ui.modals=[];__game.close?.();const g=__game.state;for(const o of g.shibas){o.status='ok';o.injury=null;o.sickSince=null;o.hospitalKind=null;o.placed=true;}if(g.shibas[1])g.shibas[1].breed='white';if(g.shibas[2])g.shibas[2].breed='sesame';for(let i=0;i<50;i++)__game.step(.1);__game.refresh();return true})()");await sleep(400);console.log('SHIBAS',await ev("JSON.stringify({own:__game.state.shibas.map(o=>[o.breed,o.status,o.placed]),onMap:Object.values(__game.world.sh).map(x=>[x.id,x.cell,x.state])})"));await ev("(()=>{const g=__game;if(!g.state.shibas.some(o=>o.breed==='kuro')){const o=g.S.makeShiba(g.state,{breed:'kuro',level:1,now:g.clock.now()});o.placed=true;g.state.shibas.push(o);}for(let i=0;i<30;i++)g.step(.1);g.refresh();return true})()");await sleep(500);console.log('V4',await ev("JSON.stringify(Object.values(__game.world.sh).map(d=>[__game.state.shibas.find(o=>o.id===d.id).breed,d.cell,d.state]))"));await shot('shiba-map-v4.png');await ev("(()=>{const g=__game,red=g.state.shibas.find(o=>o.breed==='red');for(let i=0;i<2000;i++){g.step(.05);const d=g.world.sh[red.id];if(d&&d.state==='walk'&&d.route?.length>=1&&d.cell[0]>0)break;}g.refresh();return true})()");await sleep(150);console.log('WALK',await ev("JSON.stringify(Object.values(__game.world.sh).map(d=>[d.id,d.cell,d.state,d.route?.length]))"));await shot('shiba-walk-v1.png');await ev("(()=>{for(let i=0;i<30;i++)__game.step(.1);__game.refresh();return true})()");await sleep(300);await ev("document.querySelector('[data-main-tab=shiba]').click();true");await sleep(400);await ev("__game.open('walk');__game.refresh();true");await sleep(400);await ev("(()=>{const c=[...document.querySelectorAll('#pbody .choice span')].find(e=>e.textContent.includes('시루'))||document.querySelector('#pbody .choice span');c?.scrollIntoView({block:'end'});return true})()");await sleep(300);await shot('shibas-names-v1.png');await ev("__game.close();__game.refresh();true");await ev("__game.open('cooking');__game.refresh();true");await sleep(200);await ev("(()=>{__game.close?.();__game.ui.modals=[];__game.refresh();return true})()");
  {const spritePoint=async id=>ev(`(async()=>{const h=__game.iso.hits.find(h=>h.id===${JSON.stringify(id)});if(!h)throw Error('missing sprite');const im=new Image();im.src='assets/drive/furn-counter-v4.png';await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);const d=ctx.getImageData(0,0,c.width,c.height).data;const r=document.getElementById('isomap').getBoundingClientRect();for(let y=Math.floor(c.height/2);y<c.height;y++)for(let x=Math.floor(c.width/2);x<c.width;x++)if(d[(y*c.width+x)*4+3])return {x:r.left+h.x+(h.mirrored?c.width-1-x:x)/c.width*h.w,y:r.top+h.y+y/c.height*h.h,dx:-h.zone.cell.w/2*h.view.scale,dy:h.zone.cell.h/2*h.view.scale};throw Error('no opaque pixel');})()`);const mouse=(type,p)=>c('Input.dispatchMouseEvent',{type,x:p.x,y:p.y,button:'left',buttons:type==='mouseReleased'?0:1,clickCount:1});
  await ev("(()=>{__game.ui.modals=[];__game.close?.();document.querySelector('[data-main-tab=bag]').click();__game.iso.setEdit(true);return true})()");await sleep(500);const p=await spritePoint('counter');await mouse('mousePressed',p);await mouse('mouseReleased',p);await sleep(400);
  if(await ev('__game.iso.selected')!=='counter')throw Error('counter not selected');await shot('furniture-edit-v4.png');await mouse('mousePressed',p);const q={x:p.x+p.dx*2,y:p.y+p.dy*2};for(let k=1;k<=6;k++){await c('Input.dispatchMouseEvent',{type:'mouseMoved',x:p.x+(q.x-p.x)*k/6,y:p.y+(q.y-p.y)*k/6,button:'left',buttons:1});await sleep(40);}await sleep(300);if(await ev('document.getElementById("isomap").dataset.dragSprite')!=='counter')throw Error('drag sprite not drawn');await mouse('mouseReleased',q);await sleep(200);await ev("(()=>{document.querySelector('[data-furniture-cancel]').click();document.querySelector('[data-furniture-save]').click();return true})()");}
  await ev("(()=>{__game.ui.modals=[];__game.state.mailClaimed=[];__game.refresh();document.querySelector('[data-act=mailbox]').click();document.querySelector('[data-act=claimMail]').click();return !!document.querySelector('[data-itemget]')})()");await sleep(1200);await shot('item-glow-v3.png');await ev('__game.ui.modals=[];__game.refresh();true');await ev("(()=>{__game.ui.modals=[];const g=__game.state;window.capLv=g.cafe.level;g.cafe.level=2;document.querySelector('[data-main-tab=manage]').click();__game.refresh();const e=document.querySelector('[data-run-locked]');e.scrollIntoView({block:'center'});return true})()");await sleep(300);await shot('locked-run.png');
  await ev("(()=>{const g=__game.state;g.cafe.level=Math.max(3,window.capLv);g.run.shibas=[g.shibas[0].id];__game.ui.modals=[];__game.open('run');return true})()");await sleep(300);await shot('run-v5-start.png');
  await ev("(()=>{__game.ui.modals=[];__game.open('run');document.querySelector('[data-act=runPlay]').click();return true})()");await sleep(300);await ev("(()=>{const R=__game.run;R.pause(true);const r=R.state;r.t=12;r.scroll=640;r.hitsTaken=1;r.coins=3;r.got={rice:1,carrot:1};r.lane=1;r.x=__game.CFG.run.laneX[1];r.objs=[{type:'obstacle',kind:'puddle',lane:0,y:1150},{type:'coin',lane:1,y:1000},{type:'ingredient',kind:'sweetPotato',lane:2,y:800},{type:'obstacle',kind:'cat',lane:1,y:520},{type:'obstacle',kind:'flowerpot',lane:2,y:300},{type:'coin',lane:0,y:620},{type:'obstacle',kind:'bicycle',lane:0,y:150}];return true})()");await sleep(600);await ev('__game.run.render();true');await shot('run-v5-red.png');await ev('__game.run.stop();__game.run=null;true');await ev("(()=>{const g=__game.state;const w=g.shibas.find(x=>x.breed==='white');g.run.shibas=[w.id];__game.ui.modals=[];__game.open('run');document.querySelector('[data-act=runPlay]').click();return true})()");await sleep(300);await ev("(()=>{const R=__game.run;R.pause(true);const r=R.state;r.t=12;r.scroll=640;r.hitsTaken=1;r.coins=3;r.got={rice:1,carrot:1};r.lane=1;r.x=__game.CFG.run.laneX[1];r.objs=[{type:'obstacle',kind:'puddle',lane:0,y:1150},{type:'coin',lane:1,y:1000},{type:'ingredient',kind:'sweetPotato',lane:2,y:800},{type:'obstacle',kind:'cat',lane:1,y:520},{type:'obstacle',kind:'flowerpot',lane:2,y:300},{type:'coin',lane:0,y:620},{type:'obstacle',kind:'bicycle',lane:0,y:150}];return true})()");await sleep(600);await ev('__game.run.render();true');await shot('run-v7-white.png');await ev('__game.run.stop();__game.run=null;true');await ev("(()=>{const g=__game.state;const w=g.shibas.find(x=>x.breed==='sesame');g.run.shibas=[w.id];__game.ui.modals=[];__game.open('run');document.querySelector('[data-act=runPlay]').click();return true})()");await sleep(300);await ev("(()=>{const R=__game.run;R.pause(true);const r=R.state;r.t=12;r.scroll=640;r.hitsTaken=1;r.coins=3;r.got={rice:1,carrot:1};r.lane=1;r.x=__game.CFG.run.laneX[1];r.objs=[{type:'obstacle',kind:'puddle',lane:0,y:1150},{type:'coin',lane:1,y:1000},{type:'ingredient',kind:'sweetPotato',lane:2,y:800},{type:'obstacle',kind:'cat',lane:1,y:520},{type:'obstacle',kind:'flowerpot',lane:2,y:300},{type:'coin',lane:0,y:620},{type:'obstacle',kind:'bicycle',lane:0,y:150}];return true})()");await sleep(600);await ev('__game.run.render();true');await shot('run-v6-sesame.png');await ev('__game.run.stop();__game.run=null;true');await ev("(()=>{const g=__game.state;const w=g.shibas.find(x=>x.breed==='kuro')||(g.shibas[1].breed='kuro',g.shibas[1]);g.run.shibas=[w.id];__game.ui.modals=[];__game.open('run');document.querySelector('[data-act=runPlay]').click();return true})()");await sleep(300);await ev("(()=>{const R=__game.run;R.pause(true);const r=R.state;r.t=12;r.scroll=640;r.hitsTaken=1;r.coins=3;r.got={rice:1,carrot:1};r.lane=1;r.x=__game.CFG.run.laneX[1];r.objs=[{type:'obstacle',kind:'puddle',lane:0,y:1150},{type:'coin',lane:1,y:1000},{type:'ingredient',kind:'sweetPotato',lane:2,y:800},{type:'obstacle',kind:'cat',lane:1,y:520},{type:'obstacle',kind:'flowerpot',lane:2,y:300},{type:'coin',lane:0,y:620},{type:'obstacle',kind:'bicycle',lane:0,y:150}];return true})()");await sleep(600);await ev('__game.run.render();true');await shot('run-v7-kuro.png');await ev('__game.run.stop();__game.run=null;true');
 }
 else if(process.argv.includes('--nav')){
 await stage();await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
 await stageStarter();
 await ev(`(()=>{const g=__game;g.state.cafe.level=10;g.state.coins=150000;g.refresh();return true;})()`);
 await shot('main-screen-nav-main.png');
 for(const t of ['village','shiba','shop','bag']){await click('[data-main-tab='+t+']');await shot('main-screen-nav-'+t+'.png');}
 await click('[data-main-tab=manage]');await click('[data-act=listOpen][data-list=menu]');await shot('main-screen-nav-popup.png');
 await ev('__game.ui.modals=[];__game.refresh();true');await click('[data-main-tab=manage]');
 await ev(`(()=>{const a=document.querySelector('[data-alba]');a&&a.scrollIntoView({block:'center'});return true;})()`);await shot('main-screen-nav-manage-alba.png');
 await ev('__game.state.hearts=3;__game.refresh();true');await click('#hud [data-act=hearts]');await shot('main-screen-nav-hearts.png');
 await ev('__game.ui.modals=[];__game.refresh();true');await click('[data-act=ledger]');await shot('main-screen-nav-ledger.png');
 await ev('__game.ui.modals=[];__game.state.wallOwned=3;__game.refresh();true');await click('[data-main-tab=bag]');
 await ev(`(()=>{const a=document.querySelector('[data-furniture-card=wall]');if(!a)throw Error('no wall card in 가방');const L=document.getElementById('menuList');L.scrollTop=a.offsetTop-L.offsetTop-L.clientHeight/2+a.offsetHeight/2;return true;})()`);await new Promise(r=>setTimeout(r,300));if(!(await ev(`(()=>{const a=document.querySelector('[data-furniture-card=wall]').getBoundingClientRect(),L=document.getElementById('menuList').getBoundingClientRect(),T=document.getElementById('mainTabs').getBoundingClientRect();return a.top>=L.top&&a.bottom<=Math.min(L.bottom,T.top);})()`)))throw Error('wall card not fully visible');await shot('main-screen-nav-walls-inv.png');
 await ev(`(()=>{const g=__game;g.state.cafe.level=g.CFG.alba.manager.unlock;g.state.coins=g.CFG.alba.manager.cost;g.S.hireAlba(g.state,'manager',[],g.clock.now());for(let k=0;k<3;k++)g.step(g.CFG.navigation.cellStepSec);g.refresh();return true;})()`);
 await click('[data-main-tab=manage]');await shot('main-screen-nav-manager.png');
 }
 else if(process.argv.includes('--final')){
 await stage();await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
 await stageStarter();
 await click('[data-act=mailbox]');await shot('main-screen-final-mailbox.png');await click('[data-act=modalOk]');
 await ev(`(()=>{const g=__game;g.S.claimMail(g.state,1,g.clock.now());g.refresh();return true;})()`);
 await click('[data-main-tab=shop]');
 if(!(await ev(`!document.querySelector('[data-act=useItem][data-item=expBoost4h]').disabled`)))throw Error('configured EXP boost remains disabled');
 await click('[data-act=useItem][data-item=expBoost4h]');
 if(!(await ev(`__game.state.items.expBoost4h===0&&document.getElementById('boostChip').textContent.includes('경험치')`)))throw Error('EXP boost consumption/timer missing');
 await click('[data-main-tab=manage]').catch(()=>{});await ev(`__game.ui.modals=[];__game.refresh();true`);await shot('main-screen-final-boost.png');
 await ev(`(()=>{const g=__game;g.state.cafe.level=g.CFG.cafe.seatRewards.findIndex(n=>n>=6)+1;g.S.grantSeatRewards(g.state);const before=g.S.seatCount(g.state);const want=[[2,2],[3,3],[1,3],[3,1],[4,2],[2,4],[4,4],[1,1]];for(const c of want)g.S.placeFurniture(g.state,'cushion',c);if(g.S.seatCount(g.state)<=before)throw Error('Reward seats not placed');g.refresh();return true;})()`);
 await click('[data-main-tab=bag]');await shot('main-screen-final-seats.png');

 await ev(`(()=>{const g=__game;g.state.cafe.level=g.CFG.themes.find(t=>t.id==='bamboo').unlockLevel;g.state.coins=g.CFG.cafe.expansion2FCost;g.state.dia=g.CFG.themes.find(t=>t.id==='bamboo').unlockDia;g.refresh();return true;})()`);await click('[data-main-tab=shop]');await click('[data-act=unlockPopup]');if(!(await ev(`document.querySelector('#mbox [data-kind=floor2][data-via=coins]')&&document.querySelector('#mbox [data-kind=theme][data-via=dia]')`)))throw Error('Unlock popup choices missing');await shot('main-screen-final-unlock.png');
 if(errors.length)throw Error(errors.join('\n'));
 }
 else if(process.argv.includes('--u12b')){
  await stage();await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
  await click('[data-main-tab=manage]');
  for(const n of [1,2,3]){
   await ev(`(()=>{const g=__game;g.state.coins=g.S.spacePrice('row',null,'coins',g.state);g.refresh();g.iso.panTo(0,g.iso.maxScroll);return true;})()`);
   const point=await ev(`(()=>{const m=__game.iso.markers.find(m=>m.kind==='row'),r=document.getElementById('isomap').getBoundingClientRect();return {x:r.left+m.buttonX,y:r.top+m.buttonY};})()`);
   for(const type of ['mousePressed','mouseReleased'])await c('Input.dispatchMouseEvent',{type,...point,button:'left',buttons:type==='mousePressed'?1:0,clickCount:1});
   if(!(await ev(`__game.ui.modals[0]?.kind==='confirm'`)))throw Error('Expansion confirmation missing');
   await shot(n===1?'main-screen-u12b-confirm.png':'main-screen-u12b-confirm-'+n+'.png');
   await click('#mbox [data-act=confirmYes]');
   if(!(await ev(`__game.state.space.unlockedRows===${n}&&__game.state.coins===0`)))throw Error('Expansion purchase failed');
   await ev('__game.iso.panTo(0,0);true');await shot('main-screen-u12b-expand-'+n+'.png');
  }
  await ev(`(()=>{const g=__game;g.state.coins=g.S.spacePrice('row',null,'coins',g.state)-1;g.refresh();g.openExpand();document.querySelector('#mbox [data-act=confirmYes]').click();return true;})()`);await sleep(150);await shot('main-screen-u12b-confirm-short.png',{keepToast:true});
 }
 else if(process.argv.includes('--fx')){
  await stage();await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
  await ev('(()=>{const g=__game;g.state.cafe.level=40;g.state.hearts=3;Object.assign(g.state.items,{incomeBoost4h:1,expBoost4h:1,cooldownTicket:2,heartReset:1,potionBig:1,potionSmall:1});g.refresh();return true;})()');
  await click('#hud [data-act=hearts]');await sleep(200);await shot('main-screen-fx-hearts-1.png');
  for(const [i,f] of [[2,0.5],[3,1]]){await ev(`(()=>{const b=document.querySelector('#mbox');const sc=[b,...b.querySelectorAll('*')].find(e=>e.scrollHeight>e.clientHeight+20&&getComputedStyle(e).overflowY!=='visible');if(sc)sc.scrollTop=(sc.scrollHeight-sc.clientHeight)*${f};return !!sc;})()`);await sleep(150);await shot('main-screen-fx-hearts-'+i+'.png');}
  console.log('ROWS',JSON.stringify(await ev(`[...document.querySelectorAll('#mbox [data-lp-row]')].map(r=>r.querySelector('.lp-name')?.textContent+' | '+r.querySelector('.lp-effect')?.textContent)`)));
  await ev('__game.ui.modals=[];__game.refresh();true');await click('[data-main-tab=bag]');await sleep(200);await shot('main-screen-fx-bag.png');
 }
 else if(process.argv.includes('--shibas')){
  await stage();await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
  await ev(`(()=>{const g=__game,st=g.state;const lv=[30,12,25,7,18,3,21];let i=0;while(st.shibas.length<7){const sh=g.S.makeShiba(st,{breed:g.CFG.breeds[i%4],level:lv[i],r:Math.random,now:0});st.shibas.push(sh);i++;}st.shibas.forEach((sh,k)=>{sh.g={full:100,dirt:0,fatigue:0,happy:100,boredom:0};sh.placed=k<3;});st.shibas[1].g.happy=40;st.shibas[2].status='sick';st.shibas[4].g.fatigue=85;g.refresh();return true;})()`);
  await click('[data-main-tab=shiba]');await sleep(200);await shot('main-screen-shibas-grid.png');
  await ev(`(()=>{const sel=document.querySelector('[data-shiba-breed]');sel.value='red';sel.dispatchEvent(new Event('change',{bubbles:true}));return true;})()`);await click('[data-sort-toggle]');await sleep(150);await shot('main-screen-shibas-filter.png');
  await ev(`(()=>{const sel=document.querySelector('[data-shiba-breed]');sel.value='all';sel.dispatchEvent(new Event('change',{bubbles:true}));return true;})()`);await click('[data-sort-toggle]');
  await click('#menuList [data-act=care]');await sleep(300);await sleep(300);await shot('main-screen-shibas-profile.png');await click('[data-act=careOpen]');await sleep(500);await shot('main-screen-shibas-care.png');
  await ev(`(()=>{const g=__game;g.ui.panel=null;g.refresh();g.state.cafe.level=g.CFG.alba.manager.unlock;g.state.coins=g.CFG.alba.manager.cost;g.S.hireAlba(g.state,'manager',[],g.clock.now());g.step(g.CFG.navigation.cellStepSec);g.refresh();return true;})()`);
  await click('[data-main-tab=manage]');
  await ev('__game.CFG.people.withMapScale=false;__game.refresh();true');await sleep(200);await shot('main-screen-people-before.png');
  await ev('__game.CFG.people.withMapScale=true;__game.refresh();true');await sleep(200);await shot('main-screen-people-after.png');
  await ev('__game.iso.setZoom(2);true');await sleep(200);await shot('main-screen-zoom-2x.png');await ev('__game.iso.setZoom(1);true');
  if(errors.length)throw Error(errors.join('\n'));
 }
 else if(process.argv.includes('--polish')){
  await stage();await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
  await click('[data-main-tab=manage]');
  await ev(`(()=>{const g=__game;g.state.coins=g.S.spacePrice('row',null,'coins',g.state);g.refresh();g.openExpand();return true;})()`);await shot('main-screen-polish-confirm.png');
  await click('#mbox [data-act=confirmYes]');await sleep(80);await shot('main-screen-polish-ease-mid.png');
  await sleep(600);await shot('main-screen-polish-ease-end.png');
  await ev(`(()=>{const g=__game;g.debugExpand(6);g.refresh();g.iso.panTo(g.iso.panX,g.iso.scroll);const m=g.iso.markers.find(x=>x.kind==='row'),cv=document.getElementById('isomap');g.iso.panTo(g.iso.panX+m.buttonX-cv.clientWidth/2,g.iso.scroll+m.buttonY-cv.clientHeight/2);return true;})()`);await sleep(300);await ev('__game.iso.setMarkerPhase(0);true');await shot('main-screen-polish-expand6-marker.png');await ev('__game.iso.setMarkerPhase(0.5);true');await shot('main-screen-polish-expand6-marker-bounce.png');await ev('__game.iso.setMarkerPhase(null);true');
  await ev(`(()=>{const g=__game;g.iso.setEdit(true);g.iso.panTo(g.iso.panX,g.iso.scroll);return true;})()`);await sleep(300);await shot('main-screen-polish-expand6-edit.png');
  if(errors.length)throw Error(errors.join('\n'));
 }
 else if(process.argv.includes('--u18')){
  await stage();await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
  await ev(`(()=>{const g=__game;g.debugExpand(3);g.world.custs=[];g.world.queue=[];g.world.manager=null;g.refresh();return true;})()`);
  await ev(`Promise.all(['left','right','corner'].map(part=>{const im=new Image();im.src='assets/drive/tiles/plate-edge-'+part+'.png';return im.decode();})).then(()=>true)`);
  await shot('main-screen-u18-edges.png');
  await ev(`(()=>{const g=__game;g.state.cafe.managerUntil=g.clock.now()+g.CFG.alba.manager.hireSec*1000;g.state.placement.slots.find(x=>x.id==='table').origin=[3,4];g.state.placement.slots.find(x=>x.id==='cushion-back').origin=[2,4];g.state.placement.slots.find(x=>x.id==='cushion-front').origin=[4,4];g.world.custs=[{id:g.world.nextCust++,phase:'seated',cell:[2,4],t:g.CFG.cafe.stayingSec,met:[]}];g.S.tickManager(g.state,g.world,0,true,g.CFG.navigation.cellStepSec);g.refresh();return true;})()`);
  const seen=new Set(),facings=new Set();for(let n=0;n<300&&seen.size<3;n++){
   const pos=await ev(`(()=>{const g=__game;g.S.tickManager(g.state,g.world,g.CFG.navigation.cellStepSec,true,g.CFG.navigation.cellStepSec);g.refresh();const m=g.world.manager;return m.phase==='walking'?m.cell.join(',')+':'+m.facing:null;})()`);
   if(pos&&!seen.has(pos)&&(seen.size!==1||!facings.has(pos.split(':')[1]))){seen.add(pos);facings.add(pos.split(':')[1]);await shot('main-screen-u18-manager-'+seen.size+'.png');}
  }if(seen.size!==3)throw Error('u18 manager needs three distinct walking positions/directions');
  await ev(`(()=>{const g=__game;g.state.cafe.level=40;g.ui.modals=[];g.refresh();return true;})()`);await click('#hud [data-act=hearts]');await shot('main-screen-u18-hearts.png');
  await click('#mbox .lp-close');await ev('__game.state.wallOwned=3;__game.iso.setEdit(false);__game.refresh();true');await click('[data-main-tab=bag]');await shot('main-screen-u18-walls-inv.png');
 }
 else if(process.argv.includes('--u179')){
  await stage();await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
  await ev(`(()=>{const g=__game;g.state.cafe.level=g.CFG.heartUse.items.find(x=>x.id==='praise').level;g.state.hearts=g.CFG.hearts.regenCap;g.S.useHeartItem(g.state,'call',null,g.clock.now());g.refresh();return true;})()`);
  await click('#hud [data-act=hearts]');await shot('main-screen-u179-hearts.png');
  await ev(`(()=>{const g=__game;for(let i=0;i<g.CFG.heartUse.ads.burst;i++)g.S.claimHeartAd(g.state,g.clock.now());g.state.hearts=0;g.state.heartRegenAt=g.clock.now();g.refresh();return true;})()`);
  await ev(`document.querySelector('.lp-list').scrollTop=0;true`);
  await shot('main-screen-u179-noheart.png');
  await ev(`__game.state.hearts=__game.CFG.hearts.regenCap;__game.refresh();document.querySelector('.lp-list').scrollTop=0;true`);
  await click('[data-lp-row=pet] .lp-price');await shot('main-screen-u179-pick.png');
  if(errors.length)throw Error(errors.join('\n'));
 }
 else if(process.argv.includes('--rf')){await rf();if(errors.length)throw Error(errors.join('\n'));}
 else if(process.argv.includes('--u12')){await u12();if(errors.length)throw Error(errors.join('\n'));}
 else if(process.argv.includes('--u141')){
  await stage();await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
  await click('[data-main-tab=shiba]');await shot('main-screen-u141-shiba.png');await click('#menuList [data-act=care]');await click('[data-act=careOpen]');
  await ev('(()=>{const g=__game,sh=g.state.shibas[0];sh.paws=g.S.pawsToNext(sh.level);g.refresh();return true;})()');
  await click('#panel [data-act=levelUp]');await shot('main-screen-u141-levelup.png');
  await ev('__game.ui.modals=[];__game.refresh();true');await click('[data-main-tab=shop]');await click('[data-act=gachaOdds]');await shot('main-screen-u141-odds.png');
 }
 else if(process.argv.includes('--u17d')){await u17d();if(errors.length)throw Error(errors.join('\n'));}
 else if(process.argv.includes('--u17c')){await u17c();if(errors.length)throw Error(errors.join('\n'));}
 else if(process.argv.includes('--u17b')){await u17b();if(errors.length)throw Error(errors.join('\n'));}
 else if(process.argv.includes('--u17')){await u17();if(errors.length)throw Error(errors.join('\n'));}
 else if(process.argv.includes('--u16')){await u16();if(errors.length)throw Error(errors.join('\n'));}
 // Capture only §14 with --u14; preserve prior approved artifacts.
 else if(process.argv.includes('--u15')){
  await stage();await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
  await ev(`(()=>{const g=__game,n=g.clock.now();g.state.cafe.level=30;g.state.coins=300000+g.CFG.alba.manager.cost;g.S.recordPayment(g.state,{pending:false,base:120,total:240},n);g.S.recordPayment(g.state,{pending:false,base:80,total:160},n-g.CFG.ledger.periodMs);g.S.recordPayment(g.state,{pending:false,base:60,total:90},n,{offline:true});g.S.hireAlba(g.state,'manager',[],n);g.state.shibas[0].status='sick';g.S.sendToHospital(g.state,g.state.shibas[0].id,n);g.S.buyAcc(g.state,g.S.bandanaItems()[0].id,n);g.refresh();return true;})()`);
  await click('#hud [data-act=income]');
  if(!(await ev(`!document.getElementById('modal').hidden&&document.querySelector('.ledger-title h2').textContent==='손익계산서'`)))throw Error('pill ledger missing');
  await click('[data-act=ledgerDay][data-day="-1"]');
  if(!(await ev(`document.querySelector('[data-ledger-category=sales]').textContent.includes('80')`)))throw Error('yesterday missing');
  await click('[data-act=ledgerDay][data-day="0"]');await click('#mbox [data-act=modalOk]');
  await click('[data-main-tab=manage]');await click('#menuList [data-act=ledger]');
  await shot('main-screen-u15-ledger.png');
  writeFileSync(join(out,'main-screen-u15-ledger-state.txt'),'STAGED, unsaved ?temp=1 fixture. 390×844 CSS px, DPR2. Today: sales 120, meeting extra 120, offline 90, manager wages (CFG.alba.manager.cost), hospital sick fee, M-02 development (its devCost, normal stage), one bandana purchase. Yesterday: sales 80 + meeting extra 80. Smoke: pill opens, yesterday/today flip, close, store button opens.\n');
  if(errors.length)throw Error(errors.join('\n'));
 }else if(process.argv.includes('--u14')){
  await stage();await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
  await click('[data-main-tab=manage]');await shot('main-screen-u14-topbar.png');
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
 if(!(await ev(`document.querySelector('[data-main-tab=bag]').classList.contains('active')&&document.getElementById('scene').contains(document.querySelector('.furniture-actions'))&&!document.querySelector('.furniture-actions').hidden`)))throw Error('edit action bar missing from furniture panel');
 await shot('main-screen-v7-edit.png');
 // Unit 2 captures are separate from the reproducible v7 stages above.
 await stage();await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
 for(const tab of ['manage','shiba','furniture','shop']){await click(`[data-main-tab=${tab}]`);await shot('main-screen-u2-'+(tab==='manage'?'menu':tab)+'.png');}
 await click('[data-main-tab=shiba]');await ev('__game.state.shibas[0].paws=__game.S.pawsToNext(__game.state.shibas[0].level);__game.refresh();true');
 await click('#menuList [data-act=care]');await click('[data-act=careOpen]');await click('#panel [data-act=levelUp]');await shot('main-screen-u2-levelup.png');
 await stage();await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
 await click('[data-main-tab=bag]');await ev('document.getElementById("menuList").scrollTop=0;true');await shot('main-screen-u3-inventory.png');
 await click('[data-main-tab=manage]');
 await ev('__game.iso.scrollTo(__game.iso.maxScroll);true');await shot('main-screen-u3-locked-row.png');
 const expansionPoint=await ev('(()=>{const m=__game.iso.markers.find(m=>m.kind==="row"),r=document.getElementById("isomap").getBoundingClientRect();return {x:r.left+m.buttonX,y:r.top+m.buttonY};})()');
 for(const type of ['mousePressed','mouseReleased'])await c('Input.dispatchMouseEvent',{type,...expansionPoint,button:'left',buttons:type==='mousePressed'?1:0,clickCount:1});
 if(!(await ev(`__game.ui.modals[0]?.kind==='confirm'&&document.getElementById('mbox').textContent.includes('멍코인')`)))throw Error('Expansion + did not show price confirmation');
 const unit3=['locked-row','inventory'].map(name=>readFileSync(join(out,'main-screen-u3-'+name+'.png')));
 if(unit3[0].equals(unit3[1]))throw Error('Unit 3 captures must be distinct');
 // Unit 4 fixture supplies undecided navigation/payment values only in unsaved TEMP mode.
 await stage();await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});await click('[data-main-tab=manage]');
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
 await click('[data-main-tab=manage]');await ev('document.getElementById("menuList").scrollTop=0;true');await shot('main-screen-u5-menu.png');
 await ev(`(()=>{const g=__game;g.world.custs=[];g.world.queue=[];g.world.sh={};g.world.events=[];g.world.spawnT=0;g.world.r=()=>.99;for(let i=0;i<200;i++){g.step(.1);if(g.world.custs.some(c=>c.phase==='seated'))break;}g.refresh();return true;})()`);
 if(!(await ev('__game.world.custs.some(c=>c.phase==="seated"&&c.itemSlot&&c.order.kind==="coffee")')))throw Error('Unit 5 staged drink missing table slot');
 await shot('main-screen-u5-table-item.png');
 await u16();await u17();
 writeFileSync(join(out,'main-screen-v7-state.txt'),'Same normal staging as v6; edit: counter origin [0,1], dir1, footprint (0,1)-(0,2); stairs unchanged; 가구 tab active with action bar in bottom panel. 390x844, normal DPR1/DPR2, edit DPR2.\n');
 console.log('Staged capture: cafe level 5, M-02 developing; coins 21,500, diamonds 30; 390x844 CSS px, DPR 1 and 2.');
 }
}catch(e){errors.push(String(e.stack||e));}finally{chrome.kill();setTimeout(()=>rmSync(prof,{recursive:true,force:true}),300);}
console.log(`${shots.length} screens → ${out}`);for(const s of shots)console.log('  '+s);for(const e of errors)console.log('  ERROR',e);process.exitCode=errors.length?1:0;
