// Offline capture through Chrome's CDP pipe. No packages, server or network needed.
import {spawn,spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const output=resolve(process.argv[2]||'/workspace/shiba-cafe-docs/start-room-3d');
mkdirSync(output+'/frames',{recursive:true});
spawnSync('rm',['-rf','/tmp/shiba-first-check-capture']);
const chrome=spawn('google-chrome',['--headless','--no-sandbox','--disable-dev-shm-usage','--user-data-dir=/tmp/shiba-first-check-capture','--remote-debugging-pipe','--allow-file-access-from-files','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],{stdio:['ignore','ignore','pipe','pipe','pipe']});
let id=0,buffer='',pending=new Map(),errors='';
chrome.stderr.on('data',d=>{errors+=d;});
for(const pipe of [chrome.stdio[3],chrome.stdio[4]])pipe.on('error',()=>{});
chrome.on('exit',code=>{for(const {reject} of pending.values())reject(new Error(`Chrome exited ${code}: ${errors}`));});
chrome.stdio[4].on('data',d=>{buffer+=d;let end;while((end=buffer.indexOf('\0'))>=0){const message=JSON.parse(buffer.slice(0,end));buffer=buffer.slice(end+1);if(message.id&&pending.has(message.id)){const p=pending.get(message.id);pending.delete(message.id);message.error?p.reject(new Error(JSON.stringify(message.error))):p.resolve(message.result);}}});
function call(method,params={},sessionId){return new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});chrome.stdio[3].write(JSON.stringify({id:n,method,params,sessionId})+'\0');});}
try{
 const {targetId}=await call('Target.createTarget',{url:'about:blank'});
 const {sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});
 const c=(m,p)=>call(m,p,sessionId);
 await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await c('Page.enable');await c('Runtime.enable');
 await c('Page.navigate',{url:'file://'+resolve('start-room-3d/index.html')+'?still=1'});
 let ready=false;for(let i=0;i<100;i++){const r=await c('Runtime.evaluate',{expression:'Boolean(window.__firstCheck)'});if(r.result.value){ready=true;break;}await new Promise(r=>setTimeout(r,100));}if(!ready)throw Error('Scene did not initialize');
 async function shot(path,t){const state=await c('Runtime.evaluate',{expression:`window.__firstCheck.setTime(${t})`,returnByValue:true});if(state.exceptionDetails)throw Error(JSON.stringify(state.exceptionDetails));const {data}=await c('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(path,Buffer.from(data,'base64'));}
 await shot(output+'/still.png',0);
 for(let i=0;i<100;i++)await shot(output+`/frames/${String(i).padStart(4,'0')}.png`,i/10);
 const ff=spawnSync('ffmpeg',['-y','-framerate','10','-i',output+'/frames/%04d.png','-c:v','libvpx-vp9','-pix_fmt','yuv420p',output+'/hearts-10s.webm'],{stdio:'inherit'});if(ff.status)throw Error('ffmpeg failed');
 const py=spawnSync('python3',[resolve('start-room-3d/compare.py'),output],{stdio:'inherit'});if(py.status)throw Error('PIL comparison failed');
 console.log('390×844 still, 10-second WebM, 100 frames and guide comparison saved:',output);
}finally{chrome.kill();}
