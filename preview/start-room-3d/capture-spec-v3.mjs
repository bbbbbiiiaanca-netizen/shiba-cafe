// Headless capture of the spec-v3 screens (Chrome CDP pipe, same approach as capture-game.mjs), portrait 390×844.
// Usage (from the repo root or start-room-3d/): node start-room-3d/capture-spec-v3.mjs [OUTDIR]
// Default OUTDIR: /workspace/shiba-cafe-docs/spec-v3-build/screens
import {spawn} from 'node:child_process';import {mkdirSync,writeFileSync,rmSync} from 'node:fs';import {resolve,dirname,join} from 'node:path';import {fileURLToPath} from 'node:url';
const ROOT=dirname(fileURLToPath(import.meta.url));
const out=resolve(process.argv[2]||'/workspace/shiba-cafe-docs/spec-v3-build/screens');mkdirSync(out,{recursive:true});
const prof='/tmp/shiba-v3-cap-'+process.pid;
const chrome=spawn('google-chrome',['--headless','--no-sandbox','--disable-dev-shm-usage','--user-data-dir='+prof,'--remote-debugging-pipe','--allow-file-access-from-files','--hide-scrollbars'],{stdio:['ignore','ignore','pipe','pipe','pipe']});
let id=0,buf='';const pend=new Map(),errors=[];for(const p of [chrome.stdio[3],chrome.stdio[4]])p.on('error',()=>{});
chrome.stdio[4].on('data',d=>{buf+=d;let e;while((e=buf.indexOf('\0'))>=0){const m=JSON.parse(buf.slice(0,e));buf=buf.slice(e+1);
 if(m.method==='Runtime.exceptionThrown')errors.push(JSON.stringify(m.params.exceptionDetails).slice(0,400));
 if(m.id&&pend.has(m.id)){const p=pend.get(m.id);pend.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}}});
const call=(method,params={},sessionId)=>new Promise((res,rej)=>{const n=++id;pend.set(n,{resolve:res,reject:rej});chrome.stdio[3].write(JSON.stringify({id:n,method,params,sessionId})+'\0');});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));const shots=[];
try{const {targetId}=await call('Target.createTarget',{url:'about:blank'});const {sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});const c=(m,p)=>call(m,p,sessionId);
 await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:+(process.env.DSF||2),mobile:true});await c('Page.enable');await c('Runtime.enable');
 const ev=async x=>{const r=await c('Runtime.evaluate',{expression:x,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(x.slice(0,90)+' -> '+JSON.stringify(r.exceptionDetails).slice(0,500));return r.result.value;};
 const settle=()=>ev('new Promise(r=>{const imgs=[...document.images].filter(i=>!i.complete);if(!imgs.length)return r(true);let n=imgs.length;for(const i of imgs)i.onload=i.onerror=()=>--n||r(true);setTimeout(()=>r(true),4000);})');
 const shot=async(name)=>{await ev('__game.refresh();__game.ui.toastT=0;document.getElementById("toast").style.opacity=0;true');await settle();await sleep(150);const {data}=await c('Page.captureScreenshot',{format:'png'});writeFileSync(join(out,name),Buffer.from(data,'base64'));shots.push(name);};
 const click=sel=>ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)throw Error('no '+${JSON.stringify(sel)});e.click();return true;})()`);
 await c('Page.navigate',{url:'file://'+resolve(ROOT,'index.html')+'?still=1&fresh=1&seed=7'});
 for(let i=0;i<300&&!(await ev('Boolean(window.__ready)'));i++)await sleep(100);
 await shot('01-language.png'); // 1.8 first run
 await click('[data-lang=ko]');await click('[data-act=langOk]');await shot('02-start-choice.png'); // 갱신 109
 await click('[data-breed=red]');await ev('document.getElementById("startName").value="복실이";true');await click('[data-act=startGo]');
 // run the café for real: 15 simulated minutes (fast-forward, online rules) then 40 s of live steps so guests are mid-visit
 await ev('__game.advance(15*60e3);true');for(let i=0;i<400;i++)await ev('__game.step(.1);true');
 for(let i=0;i<300&&!(await ev('Object.values(__game.world.sh).some(x=>x.phase==="meet"&&x.t>4)'));i++)await ev('__game.step(.1);true'); // catch a live 7 s meeting
 await sleep(1600);await shot('03-cafe-main.png'); // let the +멍 pops fade
 await click('[data-nav=shibas]');await shot('04-shiba-list.png');
 await click('[data-act=care]');await shot('05-shiba-care.png');
 await ev('document.getElementById("pbody").scrollTop=520;true');await shot('06-shiba-care-tricks.png');
 await ev('document.querySelector("[data-acc]").scrollIntoView();true');await shot('06b-shiba-care-accessory.png'); // 139-6: starter slot open, wearing 1 bandana
 await click('[data-nav=walk]');await shot('07-walk-pick.png');
 await click('[data-act=walk][data-sec="600"]');await ev('__game.advance(4*60e3);true');await shot('08-walk-in-progress.png');
 await ev('__game.advance(7*60e3);true');await shot('11-walk-result.png');await click('[data-act=modalOk]');
 await click('[data-nav=shop]');await shot('12-shop-menu-dev.png');
 // 메뉴 개발 (갱신 134·136): staged — café level 20, 100,000 멍코인, 50 다이아; M-05 developed earlier (staged), M-02 started by clicking and 7 min passed
 await ev('window.__bak=JSON.stringify({l:__game.state.cafe.level,c:__game.state.coins,m:__game.state.menus,d:__game.state.dia,inv:__game.state.accInv,sh:__game.state.shibas.map(o=>[o.acc,o.accUnlocked,o.paws])});__game.state.cafe.level=20;__game.state.coins=100000;__game.state.dia=50;__game.state.menus=["M-05"];__game.refresh();true');
 await click('[data-act=dev][data-id=M-02]');await ev('__game.advance(7*60e3);true');await shot('12b-shop-menu-dev-in-progress.png');
 // 액세서리 상점 (갱신 140·140-1): 2 bought (staged coins above), loop tab open
 await click('[data-act=accType][data-type=loop]');await click('[data-act=buyAcc][data-item=bandana-loop-cell9]');await click('[data-act=buyAcc][data-item=bandana-loop-cell5]');
 await ev('document.querySelector("[data-accshop]").scrollIntoView();true');await shot('12c-shop-accessories.png');
 // 시바뽑기 (갱신 137): staged 100 다이아 → 1 pull result card
 await ev('__game.state.dia=100;__game.refresh();document.querySelector("[data-gacha]").scrollIntoView();true');await shot('12d-shop-gacha.png');
 await click('[data-act=gacha][data-n="1"]:not([data-ticket])');await shot('12e-gacha-result.png');await click('[data-act=modalOk]');
 await ev('(b=>{const s=__game.state;s.cafe.level=b.l;s.coins=b.c;s.menus=b.m;s.menuDev=null;s.dia=b.d;s.accInv=b.inv;s.shibas=s.shibas.slice(0,b.sh.length);s.shibas.forEach((o,i)=>{[o.acc,o.accUnlocked,o.paws]=b.sh[i];});})(JSON.parse(window.__bak));__game.open("shop");true'); // undo the staging
 await ev('document.querySelector("[data-gacha]").scrollIntoView();true');await shot('13-shop-bag-dia.png');
 await click('[data-nav=settings]');await shot('14-settings.png');
 await click('#panel [data-act=income]');await shot('15-income-formula.png');
 await click('[data-act=close]');
 // 임시휴무: staged — reputation set to 31 with 6 stains, then 3 h away (offline rules): the next −1 closes the café
 await ev('__game.state.cafe.rep=31;__game.state.cafe.stains=6;__game.advance(3*3600e3,true);true');await shot('16-offline-closure.png');
 await click('[data-act=modalOk]');for(let i=0;i<120;i++)await ev('__game.step(.1);true');await shot('17-cafe-after-reopen.png');
}catch(e){errors.push(String(e.stack||e));}finally{chrome.kill();setTimeout(()=>rmSync(prof,{recursive:true,force:true}),300);}
console.log(`${shots.length} screens → ${out}`);for(const s of shots)console.log('  '+s);for(const e of errors)console.log('  ERROR',e);process.exitCode=errors.length?1:0;
