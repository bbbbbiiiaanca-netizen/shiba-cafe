// Headless Chrome smoke test of index.html (CDP pipe, no network). Run from start-room-3d/: node tests/smoke-browser.mjs
// Opens the game fresh, drives the UI through the spec-v3 screens and fails on any page exception.
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
 const check=async(name,expr)=>{const v=await ev(expr);checks.push([v?'ok':'FAIL',name]);};
 const steps=(await import('./smoke-steps.mjs')).default;
 const go=async(fresh,view='')=>{await c('Page.navigate',{url:'file://'+resolve(ROOT,'index.html')+'?still=1&seed=7'+(fresh?'&fresh=1':'')+view});await sleep(300);
  for(let i=0;i<300&&!(await ev('Boolean(window.__ready)'));i++)await sleep(100);};
 await go(true);
 await check('fresh save keeps unspecified starting coins null','__game.state.coins===null&&__game.state.coinFrac===0');
 await steps({ev,check,sleep,reload:()=>go(false)});
 await ev('__game.ui.modals=[];__game.close();__game.state.settings.language="ko";__game.refresh();true');
 await check('§14: four compact pills share one row with no overflow at 390px',`(()=>{const hud=document.getElementById('hud'),row=hud.querySelector('.resources'),pills=[...row.querySelectorAll('.pill')],r=row.getBoundingClientRect();return innerWidth===390&&pills.length===4&&pills.every(p=>{const b=p.getBoundingClientRect(),i=p.querySelector('.ico').getBoundingClientRect();return Math.abs(b.top-pills[0].getBoundingClientRect().top)<1&&b.left>=r.left&&b.right<=r.right&&i.width<=18&&i.left>=b.left&&i.right<=b.right;})&&row.scrollWidth<=row.clientWidth&&hud.scrollWidth<=hud.clientWidth&&document.documentElement.scrollWidth<=innerWidth;})()`);
 await check('§14: thin overlay, reputation and settings are present',`(()=>{const h=document.getElementById('hud').getBoundingClientRect(),s=document.getElementById('scene').getBoundingClientRect();return h.height<=72&&s.top===0&&!!document.querySelector('.gear[data-nav=settings][aria-label="설정"]')&&document.getElementById('rep').textContent.includes('평판');})()`);
 await check('§14: existing image icons, accessible coin button and end-only +',`document.querySelectorAll('#hud .ico').length===4&&[...document.querySelectorAll('#hud .ico')].every(e=>getComputedStyle(e).backgroundImage.includes('icons-final-check.jpg'))&&document.querySelector('#hud .pill[data-act=income]').tagName==='BUTTON'&&document.querySelectorAll('#hud .resource-add').length===1&&document.querySelector('.resources').lastElementChild.matches('.resource-add')`);
 await ev('window.u14Before=JSON.stringify(__game.state);document.querySelector(".resource-add").click();true');
 await check('§14: + only shows pending shop toast',`document.getElementById('toast').textContent==='상점 준비 중이에요'&&JSON.stringify(__game.state)===window.u14Before`);
 await ev('window.u14Values=[__game.state.coins,__game.state.hearts,__game.state.dia];__game.state.coins=123456789012;__game.state.hearts=123456789012;__game.state.dia=123456789012;__game.refresh();true');
 await check('§14: long values stay inside their pills',`[...document.querySelectorAll('#hud .pill')].every(p=>{const b=p.getBoundingClientRect(),v=p.querySelector('span').getBoundingClientRect();return v.left>=b.left&&v.right<=b.right;})&&document.querySelector('.resources').scrollWidth<=document.querySelector('.resources').clientWidth`);

 await ev('[__game.state.coins,__game.state.hearts,__game.state.dia]=window.u14Values;__game.refresh();true');
 await ev(`__game.ui.modals=[];__game.state.coins=1000;__game.state.ledger={days:{},now:__game.clock.now()};__game.S.recordPayment(__game.state,{pending:false,base:12,total:24},__game.clock.now());document.querySelector('#hud [data-act=income]').click();true`);
 await check('§15: pill opens paper ledger',`!document.getElementById('modal').hidden&&document.querySelector('#mbox.ledger-paper h2').textContent==='손익계산서'&&document.querySelector('[data-ledger-category=sales]').textContent.includes('12')`);
 await ev(`document.querySelector('[data-act=ledgerDay][data-day="-1"]').click();true`);
 await check('§15: yesterday flip',`document.querySelector('[data-act=ledgerDay][data-day="-1"]').getAttribute('aria-pressed')==='true'&&document.querySelector('[data-ledger-category=sales]').textContent.includes('0')`);
 await ev(`document.querySelector('[data-act=ledgerDay][data-day="0"]').click();true`);
 await check('§15: today flip',`document.querySelector('[data-ledger-category=sales]').textContent.includes('12')`);
 await ev(`document.querySelector('#mbox [data-act=modalOk]').click();document.querySelector('[data-main-tab=store]').click();document.querySelector('#menuList [data-act=ledger]').click();true`);
 await check('§15: store opens ledger with red parenthesized expenses and bold net',`!document.getElementById('modal').hidden&&document.querySelector('.ledger-row.expense').textContent.includes('(')&&document.querySelector('.ledger-net strong').textContent==='순이익'`);
 await ev(`document.querySelector('#mbox [data-act=modalOk]').click();true`);
 for(const [tab,title] of [['menu','메뉴 개발'],['shiba','시바'],['furniture','가구'],['store','가게']]){await ev(`document.querySelector('[data-main-tab=${tab}]').click();true`);await check('Unit 2 '+tab+' header',`document.querySelector('.menu-heading').firstChild.textContent.trim()===${JSON.stringify(title)}`);}
 await ev('document.querySelector("[data-main-tab=shiba]").click();__game.state.shibas[0].paws=420;__game.refresh();document.querySelector("#menuList [data-act=levelUp]").click();true');
 await check('level-up confirmation leaves paws intact','__game.state.shibas[0].level===21&&__game.state.shibas[0].paws===420&&!document.getElementById("modal").hidden');
 await ev('document.querySelector("[data-act=modalOk]").click();true');
 await check('cancel spends nothing','__game.state.shibas[0].paws===420');
 await ev('document.querySelector("#menuList [data-act=levelUp]").click();document.querySelector("[data-act=confirmYes]").click();true');
 await check('confirmed level-up consumes personal paws and shows result','__game.state.shibas[0].level===22&&__game.state.shibas[0].paws===0&&/레벨업 완료/.test(document.getElementById("mbox").textContent)');
 await ev('document.querySelector("[data-act=modalOk]").click();document.querySelector("[data-main-tab=store]").click();__game.state.coins=5000;__game.refresh();document.querySelector("[data-act=buyAcc][data-item=bandana-triangle-cell2]").click();true');
 await check('shop primary action buys into inventory','__game.state.coins===0&&__game.state.accInv["bandana-triangle-cell2"]===1&&/가방 1/.test(document.querySelector("[data-inventory]").textContent)');
 await ev('document.querySelector("[data-inventory] [data-act=equip][data-item=bandana-triangle-cell2]").click();true');
 await check('inventory equips one copy','__game.state.shibas[0].acc==="bandana-triangle-cell2"&&__game.state.accInv["bandana-triangle-cell2"]===0');
 await ev('document.querySelector("[data-inventory] [data-act=unequip][data-item=bandana-triangle-cell2]").click();true');
 await check('inventory unequips back to bag','__game.state.shibas[0].acc===null&&__game.state.accInv["bandana-triangle-cell2"]===1');
 await ev('__game.state.cafe.level=1;__game.refresh();__game.state.cafe.exp=__game.S.cafeNeed(1)-1;__game.S.addCafeExp(__game.state,1);__game.refresh();true');
 await check('cafe experience threshold advances level with feedback','__game.state.cafe.level===2&&/카페 Lv 2/.test(document.querySelector("[data-cafe-level]").textContent)&&/레벨업/.test(document.getElementById("toast").textContent)');
 await go(true,'&temp=1&rows=18');
 await ev('__game.state.settings.language="ko";__game.state.started=true;__game.ui.modals=[];__game.refresh();document.querySelector("[data-main-tab=furniture]").click();true');
 await check('inventory has no theme, space, floor or purchase UI',`!document.querySelector('[data-space-card],[data-act=spaceUnlock],[data-act=floor]')&&!/후지산 벽화 카페|대나무 회랑|가격|미정|멍코인|땅 넓히기|2층 증축/.test(document.getElementById('menuList').textContent+document.querySelector('.menu-heading').textContent)`);
 await check('furniture grid has four equal square columns and contained icons',`(()=>{const grid=document.querySelector('.furniture-grid'),cards=[...grid.querySelectorAll('.furniture-card')],rects=cards.map(e=>e.getBoundingClientRect()),style=getComputedStyle(grid);return style.display==='grid'&&style.gridTemplateColumns.split(' ').length===4&&cards.length===4&&rects.every(r=>Math.abs(r.width-r.height)<1&&Math.abs(r.width-rects[0].width)<1&&Math.abs(r.top-rects[0].top)<1)&&rects[3].right<=grid.getBoundingClientRect().right+1&&cards.every(e=>getComputedStyle(e.querySelector('img')).objectFit==='contain'&&e.querySelector('strong').textContent&&!e.querySelector('span'))&&document.getElementById('furniture-heading').textContent==='가구';})()`);
 await check('Unit 3 temp rows extend scroll range','__game.state.space.unlockedRows===18&&__game.iso.maxScroll>0&&__game.iso.markers.some(m=>m.kind==="floor2")');
 const mapRect=await ev('(()=>{const r=document.getElementById("isomap").getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};})()');
 for(const [type,dy] of [['mousePressed',0],['mouseMoved',-100],['mouseReleased',-100]])await c('Input.dispatchMouseEvent',{type,x:mapRect.x,y:mapRect.y+dy,button:'left',buttons:type==='mouseReleased'?0:1,clickCount:1});
 await check('Unit 3 mouse drag scrolls map','__game.iso.scroll>0&&__game.iso.scroll<=__game.iso.maxScroll');
 await ev('__game.iso.scrollTo(Number.MAX_SAFE_INTEGER);true');
 await check('Unit 3 scroll clamps and reaches locked row','__game.iso.scroll===__game.iso.maxScroll&&__game.iso.markers.find(m=>m.kind==="row").y<document.getElementById("isomap").clientHeight');
 await ev('document.querySelector("[data-main-tab=menu]").click();true');
 await ev("__game.state.space.unlockedRows=0;__game.iso.scrollTo(0);__game.refresh();true");await sleep(200);
 const expansionPoint=await ev('(()=>{const m=__game.iso.markers.find(m=>m.kind==="row"),r=document.getElementById("isomap").getBoundingClientRect();return {x:r.left+m.buttonX,y:r.top+m.buttonY};})()');
 for(const type of ['mousePressed','mouseReleased'])await c('Input.dispatchMouseEvent',{type,...expansionPoint,button:'left',buttons:type==='mousePressed'?1:0,clickCount:1});
 await check('expansion + shows shop pending toast without changing tab',`document.getElementById('toast').textContent==='상점 준비 중이에요'&&__game.ui.toastT>0&&document.querySelector('[data-main-tab=menu]').classList.contains('active')&&!document.querySelector('[data-space-card]')`);
 await go(false);
 await ev('document.querySelector("[data-main-tab=furniture]").click();document.querySelector("[data-edit-toggle]").click();true');
 await check('toggle enters edit in furniture panel','__game.iso.edit && __game.iso.gridCells===36 && document.querySelector("[data-main-tab=furniture]").classList.contains("active")');
 await check('action bar is inside bottom panel, clear of map',`(()=>{const bar=document.querySelector('.furniture-actions'),map=document.getElementById('isomap').getBoundingClientRect();return document.getElementById('menuList').contains(bar)&&!document.getElementById('scene').contains(bar)&&bar.getBoundingClientRect().top>=map.bottom&&!bar.hidden&&bar.querySelector('[data-furniture-flip]').disabled;})()`);
 await ev('document.querySelector("[data-main-tab=menu]").click();__game.iso.setEdit(true);true');
 await check('programmatic edit activation switches to furniture','document.querySelector("[data-main-tab=furniture]").classList.contains("active")');
 await ev('new Promise(r=>setTimeout(r,300))');
 // Find an opaque sprite pixel, then drive actual pointer events through CDP.
 const spritePoint=async id=>ev(`(async()=>{const h=__game.iso.hits.find(h=>h.id===${JSON.stringify(id)});if(!h)throw Error('missing sprite');const im=new Image();im.src='assets/drive/furn-counter-v4.png';await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);const d=ctx.getImageData(0,0,c.width,c.height).data;const r=document.getElementById('isomap').getBoundingClientRect();for(let y=Math.floor(c.height/2);y<c.height;y++)for(let x=Math.floor(c.width/2);x<c.width;x++)if(d[(y*c.width+x)*4+3])return {x:r.left+h.x+(h.mirrored?c.width-1-x:x)/c.width*h.w,y:r.top+h.y+y/c.height*h.h,dx:-h.zone.cell.w/2*h.view.scale,dy:h.zone.cell.h/2*h.view.scale};throw Error('no opaque pixel');})()`);
 const mouse=(type,p)=>c('Input.dispatchMouseEvent',{type,x:p.x,y:p.y,button:'left',buttons:type==='mouseReleased'?0:1,clickCount:1});
 let p=await spritePoint('counter');await mouse('mousePressed',p);await mouse('mouseReleased',p);
 await check('sprite selects counter','__game.iso.selected==="counter"&&!document.querySelector(".furniture-actions").hidden');
 p=await spritePoint('counter');await mouse('mousePressed',p);await mouse('mouseMoved',{x:p.x+p.dx*1.2,y:p.y+p.dy*1.2});await mouse('mouseReleased',{x:p.x+p.dx*1.2,y:p.y+p.dy*1.2});
 await check('drag snaps to whole cell','JSON.stringify(__game.state.placement.slots[0].origin)==="[0,1]"');
 p=await spritePoint('counter');await mouse('mousePressed',p);await mouse('mouseMoved',{x:p.x-p.dx*2,y:p.y-p.dy*2});
 await check('invalid drag is only a preview','JSON.stringify(__game.state.placement.slots[0].origin)==="[0,1]"');
 await mouse('mouseReleased',{x:p.x-p.dx*2,y:p.y-p.dy*2});
 await check('invalid drop reverts','JSON.stringify(__game.state.placement.slots[0].origin)==="[0,1]"');
 await ev('document.querySelector("[data-furniture-flip]").click();true');
 await check('flip swaps counter axis','__game.state.placement.slots[0].dir===1');
 await ev('document.querySelector("[data-furniture-rotate]").click();true');
 await check('rotation cycles front views','__game.state.placement.slots[0].dir===0');
 await ev('document.querySelector("[data-furniture-flip]").click();document.querySelector("[data-furniture-done]").click();true');
 await check('done deselects','__game.iso.selected===null');
 await ev('document.querySelector("[data-edit-toggle]").click();true');
 await check('normal mode has no grid','!__game.iso.edit&&__game.iso.gridCells===0&&document.querySelector("[data-main-tab=furniture]").classList.contains("active")&&!document.querySelector(".furniture-actions")');
 await go(false);
 await check('placement survives reload','__game.state.placement.slots[0].dir===1&&JSON.stringify(__game.state.placement.slots[0].origin)==="[0,1]"');
 for(const param of ['edit','grid']){
  await go(false,'&'+param+'=1');
  await check(param+'=1 opens edit view','document.querySelector("[data-edit-toggle]").getAttribute("aria-pressed")==="true"&&__game.iso.gridCells===36&&document.querySelector("[data-main-tab=furniture]").classList.contains("active")&&document.getElementById("menuList").contains(document.querySelector(".furniture-actions"))');
 }

 // Unit 4 checks use TEMP staging and explicit pending-value fixtures; no production save.
 await go(true,'&temp=1');
 await ev(`(()=>{const g=__game;g.state.settings.language='ko';g.S.chooseStart(g.state,'red','',()=>.99,g.clock.now());g.state.coins=0;g.state.shibas[0].g={full:100,dirt:0,fatigue:0,happy:100,boredom:0};g.world.navigation={entrance:[5,5]};g.CFG.navigation.cellStepSec=1;g.CFG.income.levelAggregation=xs=>xs.length?xs[0]:1;for(let i=0;i<70;i++)g.step(1);g.refresh();document.querySelector('[data-main-tab=menu]').click();return true;})()`);
 await check('Unit 4 customer strip exposes seated/waiting and recent payment','/손님.*착석.*대기/.test(document.querySelector("[data-customer-status]").textContent)&&/멍코인/.test(document.querySelector("[data-customer-status]").textContent)');
 await check('Unit 4 invisible characters expose whole cells for testing','__game.characterPositions.length>0&&__game.characterPositions.every(c=>!c.cell||c.cell.every(Number.isInteger))&&!document.querySelector("[data-cust]")');
 await ev(`(()=>{const g=__game,c=g.world.custs.find(c=>c.phase==='seated');if(!c)throw Error('no seated fixture guest');window.u4Guest=c;window.u4VisitTime=c.t;g.iso.setEdit(true);g.state.placement.slots.find(x=>x.id===c.seatFurniture).origin=[5,3];g.S.syncRoutes(g.state,g.world);g.refresh();return true;})()`);
 await check('Unit 4 edit reseats guest without restarting visit','window.u4Guest.cell.join(",")==="5,3"&&window.u4Guest.t===window.u4VisitTime&&document.querySelector("[data-main-tab=furniture]").classList.contains("active")');
 await ev('__game.CFG.income.levelAggregation=null;__game.world.spawnT=1e12;for(let i=0;i<40;i++)__game.step(1);document.querySelector("[data-main-tab=menu]").click();true');
 await check('Unit 4 null payment feedback is explicit','__game.world.lastPay.total===null&&document.querySelector("[data-customer-status]").textContent.includes("결제 미정")');

 // Unit 5: deterministic unsaved table image + all menu actions stay inside cards.
 await go(true,'&temp=1&still=1');
 await ev(`(()=>{const g=__game;g.state.settings.language='ko';g.S.chooseStart(g.state,'red','',()=>.99,g.clock.now());g.state.coins=30000;g.state.dia=100;g.state.cafe.level=5;g.S.developMenu(g.state,'M-02',g.clock.now());g.world.spawnT=0;for(let i=0;i<200&&!g.world.custs.some(c=>c.phase==='seated');i++)g.step(.1);g.refresh();return true;})()`);
 await check('Unit 5 seated order has a table slot and confirmed image','__game.world.custs.some(c=>c.phase==="seated"&&c.itemSlot&&c.itemLocation==="table"&&c.order.img)&&__game.CFG.behaviour.eatSec===null');
 await check('Unit 5 all menu buttons fit inside card border','[...document.querySelectorAll(".menu-card button")].length>0&&[...document.querySelectorAll(".menu-card button")].every(b=>{const r=b.getBoundingClientRect(),c=b.closest(".menu-card").getBoundingClientRect();return r.left>=c.left&&r.right<=c.right&&r.top>=c.top&&r.bottom<=c.bottom;})');
 await check('Unit 5 diamond action is inside bottom area and 70 percent width','(()=>{const b=document.querySelector(".menu-card .instant"),r=b.getBoundingClientRect(),c=b.closest(".menu-card").getBoundingClientRect();return r.top>c.top+c.height*.6&&r.width<c.width*.75;})()');
 await check('Unit 5 no character art placeholders are drawn','Object.values(__game.world.sh).every(c=>!c.cell||c.cell.every(Number.isInteger))&&!document.querySelector("[data-cust]")');
}catch(e){errors.push(String(e.stack||e));}finally{chrome.kill();setTimeout(()=>rmSync(prof,{recursive:true,force:true}),300);}
for(const [k,n] of checks)console.log(k==='ok'?'  ok  ':'  FAIL',n);for(const e of errors)console.log('  ERROR',e);
const fail=checks.filter(c=>c[0]!=='ok').length+errors.length;console.log(`${checks.length-checks.filter(c=>c[0]!=='ok').length}/${checks.length} smoke checks passed, ${errors.length} page errors`);process.exitCode=fail?1:0;
