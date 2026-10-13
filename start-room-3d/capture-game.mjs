// Headless capture of the game skeleton (Chrome CDP pipe, SwiftShader). Usage: node start-room-3d/capture-game.mjs OUTDIR
import {spawn,spawnSync} from 'node:child_process';import {mkdirSync,writeFileSync} from 'node:fs';import {resolve} from 'node:path';
const out=resolve(process.argv[2]||'/workspace/shiba-cafe-docs/framework-v2');mkdirSync(out+'/frames',{recursive:true});spawnSync('rm',['-rf','/tmp/shiba-game-cap',out+'/frames']);mkdirSync(out+'/frames');
const chrome=spawn('google-chrome',['--headless','--no-sandbox','--disable-dev-shm-usage','--user-data-dir=/tmp/shiba-game-cap','--remote-debugging-pipe','--allow-file-access-from-files','--autoplay-policy=no-user-gesture-required','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],{stdio:['ignore','ignore','pipe','pipe','pipe']});
let id=0,buf='',pend=new Map(),err='';chrome.stderr.on('data',d=>err+=d);for(const p of [chrome.stdio[3],chrome.stdio[4]])p.on('error',()=>{});
chrome.stdio[4].on('data',d=>{buf+=d;let e;while((e=buf.indexOf('\0'))>=0){const m=JSON.parse(buf.slice(0,e));buf=buf.slice(e+1);if(m.id&&pend.has(m.id)){const p=pend.get(m.id);pend.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}}});
const call=(method,params={},sessionId)=>new Promise((res,rej)=>{const n=++id;pend.set(n,{resolve:res,reject:rej});chrome.stdio[3].write(JSON.stringify({id:n,method,params,sessionId})+'\0');});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{const {targetId}=await call('Target.createTarget',{url:'about:blank'});const {sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});const c=(m,p)=>call(m,p,sessionId);
 await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:+(process.env.DSF||2),mobile:true});await c('Page.enable');await c('Runtime.enable');
 const ev=async(x)=>{const r=await c('Runtime.evaluate',{expression:x,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(x+' -> '+JSON.stringify(r.exceptionDetails).slice(0,600));return r.result.value;};
 const shot=async(p)=>{const {data}=await c('Page.captureScreenshot',{format:'png'});writeFileSync(p,Buffer.from(data,'base64'));};
 await c('Page.navigate',{url:'file://'+resolve('start-room-3d/index.html')+'?still=1&fresh=1&seed=7'});
 for(let i=0;i<300&&!(await ev('Boolean(window.__ready)'));i++)await sleep(100);
 console.log(await ev('JSON.stringify(__game.step(.5))'));await shot(out+'/01-start.png');
 // loop: go through tutorial welcome then run the cafe; record 10fps frames
 await ev('document.getElementById("sayNext")?.click()');let f=0,petShot=false,payShot=false;
 for(let i=0;i<(+process.env.N||450);i++){const st=JSON.parse(await ev('JSON.stringify(__game.step(.1))'));await shot(`${out}/frames/${String(f++).padStart(4,'0')}.png`);
  if(!petShot&&st.shibas.includes('pet')&&(await ev('__game.world.shibas.some(s=>s.phase==="pet"&&s.t>1)'))){await shot(out+'/loop-hearts.png');petShot=true;}
  if(!payShot&&(await ev('document.querySelectorAll(".pop").length>0'))){await shot(out+'/03-pay-leave.png');payShot=true;}}
 console.log(await ev('JSON.stringify({coins:__game.state.coins,served:__game.state.served,hearts:__game.state.hearts,tut:__game.state.tut})'));
 await shot(out+'/04-tutorial-gacha-step.png');
 await ev('__game.state.tut=99;__game.state.served=Math.max(1,__game.state.served);true');for(let i=0;i<600;i++){await ev('__game.step(.1);true');if(await ev('__game.world.customers.filter(c=>c.phase==="wait").length>=2&&!__game.world.customers.some(c=>c.phase!=="wait")&&__game.world.shibas.some(s=>s.phase==="pet"&&s.t>1)'))break;}await shot(out+'/main.png');
 await ev('__game.open("gacha")');await sleep(500);await shot(out+'/05-gacha-pull-screen.png');await ev('document.getElementById("gpull").classList.remove("on")');
 await ev('__game.gachaShow("kuro","kuro_calm",6.95,"S")');await sleep(1200);await ev('true');await shot(out+'/gacha-reveal.png');
 await ev('document.getElementById("gok").click()');await ev('__game.state.owned.push({id:99,coat:"sesame",expr:"sesame_wow",lv:1},{id:98,coat:"kuro",expr:"kuro_laugh",lv:11})');
 await ev('__game.open("shiba")');await sleep(800);await shot(out+'/07-panel-shiba.png');
 await ev('__game.open("quest")');await sleep(500);await shot(out+'/08-panel-quest.png');
 await ev('__game.close()');await ev('__game.step(.1)');await sleep(400);await shot(out+'/09-after-gacha.png');
 const ff=spawnSync('ffmpeg',['-y','-loglevel','error','-framerate','10','-i',out+'/frames/%04d.png','-c:v','libx264','-pix_fmt','yuv420p','-r','30',out+'/loop-30s.mp4'],{stdio:'inherit'});console.log('ffmpeg',ff.status);
}finally{chrome.kill();}
