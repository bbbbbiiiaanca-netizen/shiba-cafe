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

}catch(e){errors.push(String(e.stack||e));}finally{chrome.kill();setTimeout(()=>rmSync(prof,{recursive:true,force:true}),300);}
for(const [k,n] of checks)console.log(k==='ok'?'  ok  ':'  FAIL',n);for(const e of errors)console.log('  ERROR',e);
const fail=checks.filter(c=>c[0]!=='ok').length+errors.length;console.log(`${checks.length-checks.filter(c=>c[0]!=='ok').length}/${checks.length} smoke checks passed, ${errors.length} page errors`);process.exitCode=fail?1:0;
