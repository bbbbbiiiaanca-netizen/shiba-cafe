import {spawn} from 'node:child_process';import {resolve,dirname,join} from 'node:path';import {fileURLToPath} from 'node:url';import {rmSync,mkdirSync,writeFileSync} from 'node:fs';
export async function runBrowser(run,{captureDirs=[]}={}){
const debugHits=[];const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');const prof='/tmp/shiba-smoke-'+process.pid;
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
 await c('Emulation.setDeviceMetricsOverride',{width:360,height:800,deviceScaleFactor:2,mobile:true});await c('Page.enable');await c('Runtime.enable');
 const ev=async(x)=>{const r=await c('Runtime.evaluate',{expression:x,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(x.slice(0,80)+' -> '+JSON.stringify(r.exceptionDetails).slice(0,500));return r.result.value;};

 const check=async(name,expr)=>{const v=await ev(expr);checks.push([v?'ok':'FAIL',name]);const hit=await ev(`(()=>{const t=document.body.innerText||'',m=t.match(/\\b(unset|UNSET|null|undefined|NaN)\\b/);return m?m[0]+' … '+t.slice(Math.max(0,m.index-30),m.index+20).replace(/\\s+/g,' '):'';})()`);if(hit)debugHits.push(name+' → '+hit);};

 await c('Page.navigate',{url:'file://'+resolve(ROOT,'index.html')+'?still=1&seed=7&fresh=1&temp=1'});
 for(let i=0;i<300&&!(await ev('Boolean(window.__ready)'));i++)await sleep(100);
 await (await import('./start-flow.mjs')).startFlow(ev);
 await ev('__game.state.settings.language="ko";__game.applyLang();true');
 const shot=async name=>{await ev('document.fonts.ready.then(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))).then(()=>true)');await sleep(150);const {data}=await c('Page.captureScreenshot',{format:'png'});for(const dir of captureDirs){mkdirSync(dir,{recursive:true});writeFileSync(join(dir,name),Buffer.from(data,'base64'));}};
 await run({ev,c,check,sleep,shot});
 if(debugHits.length)throw Error(debugHits.join('\n'));
 if(errors.length)throw Error(errors.join('\n'));
 for(const [status,name] of checks){console.log(status,name);if(status!=='ok')process.exitCode=1;}
}finally{chrome.kill();setTimeout(()=>rmSync(prof,{recursive:true,force:true}),300);}
}
