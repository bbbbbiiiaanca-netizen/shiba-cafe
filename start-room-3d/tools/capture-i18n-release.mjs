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
 const go=async(q='')=>{await c('Page.navigate',{url:'file://'+resolve(ROOT,'index.html')+'?still=1&seed=7'+q});await sleep(300);for(let i=0;i<300&&!(await ev('Boolean(window.__ready)'));i++)await sleep(100);};
 const OUT=process.env.OUT||resolve(ROOT,'../docs/shots/i18n');const {writeFileSync,mkdirSync}=await import('node:fs');mkdirSync(OUT,{recursive:true});
 const shot=async n=>{await sleep(450);const {data}=await c('Page.captureScreenshot',{format:'png'});writeFileSync(OUT+'/'+n,Buffer.from(data,'base64'));console.log('shot',n);};
 const over=`(()=>{const bad=[];for(const root of document.querySelectorAll('#modal:not([hidden]),#toast,#panel:not([hidden]),.menu-heading'))for(const e of [root,...root.querySelectorAll('*')]){if(!e.offsetParent&&e.id!=='toast')continue;const t=(e.innerText||'').trim();if(!t)continue;const r=e.getBoundingClientRect();if(r.width&&(r.right>innerWidth+1||r.left<-1))bad.push(t.slice(0,40)+' [viewport]');const cs=getComputedStyle(e);if(e.scrollWidth>e.clientWidth+1&&cs.overflowX!=='auto'&&cs.overflowX!=='scroll'&&e.children.length===0)bad.push(t.slice(0,40)+' [clip '+e.scrollWidth+'>'+e.clientWidth+']');}return bad;})()`;
 const lang=l=>ev(`__game.state.started=true;if(!__game.state.shibas.length){const n=__game.S.makeShiba(__game.state,{breed:'red',now:__game.clock.now()});if(!__game.state.shibas.includes(n))__game.state.shibas.push(n);}__game.ui.modals=[];__game.close();__game.state.settings.language="${l}";__game.applyLang();true`);
 const mode=process.argv[2]||'overflow';
 if(mode==='overflow'){
  await go();await lang('en');
  const T=[
   ['lang.select.hint','en-lang-select.png',`__game.ui.langPick='en';__game.ui.modals=[{kind:'lang'}];__game.refresh();true`,'Settings'],
   ['toast.slot','en-toast-slot.png',`(()=>{__game.ui.modals=[];__game.state.started=true;__game.refresh();const e=document.getElementById('toast');e.innerHTML=__game.t?__game.t('toast.slot'):'Unlock the accessory slot first';e.style.opacity=1;__game.ui.toastT=60;return true})()`,'accessory slot'],
   ['fx.heart.praise','en-hearts-praise.png',`__game.state.cafe.level=99;__game.ui.modals=[{kind:'list',list:'hearts'}];__game.refresh();new Promise(r=>setTimeout(()=>{const e=[...document.querySelectorAll('#modal *')].find(x=>x.children.length===0&&/happy guests/.test(x.textContent));e&&e.scrollIntoView({block:'center'});r(true)},300))`,'happy guests'],
   ['fx.heart.treat','en-hearts-treat.png',`new Promise(r=>{const e=[...document.querySelectorAll('#modal *')].find(x=>x.children.length===0&&/fully happy/.test(x.textContent));e&&e.scrollIntoView({block:'center'});r(true)})`,'fully happy'],
   ['mm.hint.bag','en-bag-hint.png',`__game.ui.modals=[];__game.state.started=true;__game.refresh();document.querySelector('[data-main-tab=bag]')?.click();true`,'Accessories'],
   ['profile.kuro.intro','en-kuro-profile.png',`(()=>{const k=__game.state.shibas.find(x=>x.breed==='kuro')||(()=>{const n=__game.S.makeShiba(__game.state,{breed:'kuro'});if(!__game.state.shibas.includes(n))__game.state.shibas.push(n);return n})();__game.ui.modals=[{kind:'book',id:k.id}];__game.refresh();return true})()`,'really cares'],
  ];
  const tag=process.env.TAG||'';
  for(const [k,f,x,needle] of T){const r=await ev(x);await sleep(400);const vis=await ev(`document.body.innerText.includes(${JSON.stringify(needle)})`);const b=await ev(over);console.log(JSON.stringify({k,r,visible:vis,overflow:b}));await shot(f.replace('.png',tag+'.png'));}
 } else {
  for(const rel of [false,true]){await go(rel?'&release=1':'');
   for(const l of ['ko','en']){await lang(l);const t=(rel?'release':'normal');
    await ev(`__game.state.cafe.level=99;__game.ui.modals=[{kind:'list',list:'hearts'}];__game.refresh();new Promise(r=>setTimeout(()=>{const e=[...document.querySelectorAll('#modal *')].find(x=>x.children.length===0&&/빗질|Brush/.test(x.textContent));e&&e.scrollIntoView({block:'start'});r(true)},300))`);await shot(`rel-hearts-${l}-${t}.png`);
    await ev(`__game.ui.modals.length=0;__game.refresh();__game.close();__game.open('care',__game.state.shibas[0].id);__game.refresh();true`);await shot(`rel-care-${l}-${t}.png`);
    await ev(`__game.close();if(!__game.state.walk){__game.state.shibas[0].status='ok';__game.S.startWalk(__game.state,__game.state.shibas[0].id,600,__game.clock.now());}__game.open('walk');__game.refresh();true`);await shot(`rel-walk-${l}-${t}.png`);
    const txt=await ev(`document.body.innerText`);console.log(l,t,'TBD/미정 visible:',(txt.match(/[^\n]*(미정|TBD|준비 중|Coming soon)[^\n]*/g)||[]).slice(0,8));
   }}
 }
}catch(e){console.error(e);process.exitCode=1}finally{chrome.kill();await sleep(500);try{rmSync(prof,{recursive:true,force:true});}catch{}}
