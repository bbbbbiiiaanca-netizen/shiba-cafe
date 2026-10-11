const { chromium }=require('playwright-core');
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),decode=require('./png');
const base=process.argv[2]||'http://localhost:8765/';
const dir=path.join(__dirname,'../screenshots/portrait');fs.mkdirSync(dir,{recursive:true});
const viewports=[[390,844],[375,667],[360,800],[412,915],[430,932],[1024,1366]];
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',args:['--no-sandbox']});
 try {let count=0;const errors=[];
 for(const [width,height] of viewports) {
  const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:true,hasTouch:true});const page=await ctx.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  const url=new URL(base);url.searchParams.set('debug','1');url.searchParams.set('bgcheck','1');
  await page.goto(url.href);await page.waitForFunction(()=>window.__game);
  await page.locator('#go').tap();
  await page.evaluate(()=>{__game.setSpeed(0);__game.S.tut=7;document.querySelector('#tut').classList.add('hidden');document.querySelector('#debug').style.display='none';document.querySelector('#panel').classList.remove('open');});
  for(const stage of [1,2,4]) {
   await page.evaluate(n=>__game.debug.setStage(n),stage);
   for(const zoom of ['minS','defS','maxS']) {
    await page.evaluate(key=>{const c=__game.debug.camera;c.focus();c.zoom(c.state[key]);},zoom);
    for(const edge of ['home','left','right','top','bottom','top-left','bottom-right']) {
     await page.evaluate(edge=>{const c=__game.debug.camera;if(edge==='home')c.focus(undefined,undefined,c.state.s);else edge.split('-').forEach(k=>c.edge(k));},edge);
     await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
     const shot=await page.screenshot({path:path.join(dir,`${width}x${height}-s${stage}-${zoom}-${edge}.png`)});
     const png=decode(shot);let magenta=0;
     // Stronger than the four-edge sample: every screen pixel must be covered.
     for(let i=0;i<png.pixels.length;i+=png.channels)if(png.pixels[i]===255&&png.pixels[i+1]===0&&png.pixels[i+2]===255)magenta++;
     assert.equal(magenta,0,`${width}×${height} stage ${stage} ${zoom} ${edge}: exposed page/view background`);
     assert(await page.evaluate(()=>{const c=__game.debug.camera.state;return c.s>=Math.max(c.vw/c.W,c.vh/c.H)-1e-8&&c.x<=1e-8&&c.y<=1e-8&&c.x+c.W*c.s>=c.vw-1e-8&&c.y+c.H*c.s>=c.vh-1e-8;}));count++;
    }
    const hud=await page.evaluate(()=>{
      const signs=[...document.querySelectorAll('.sign')];
      const probe=document.createElement('div');probe.style.cssText='position:fixed;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';document.body.append(probe);
      const p=getComputedStyle(probe),safe={t:parseFloat(p.paddingTop),r:parseFloat(p.paddingRight),b:parseFloat(p.paddingBottom),l:parseFloat(p.paddingLeft)};probe.remove();
      const row=document.querySelector('#hudRow1').getBoundingClientRect();
      const tabs=[...document.querySelectorAll('#tabs button')].map(e=>e.getBoundingClientRect());
      const small=[...document.querySelectorAll('button,.pup')].filter(e=>!e.closest('#debug')&&getComputedStyle(e).display!=='none').map(e=>({e,r:e.getBoundingClientRect()})).filter(({r})=>r.width>0&&r.height>0&&(r.width<43.99||r.height<43.99)).map(({e,r})=>`${e.id||e.className}: ${r.width}×${r.height}`);
      return {sign:signs.length===1&&signs[0].parentElement.id==='hudRow1',safe:row.top>=safe.t&&row.left>=safe.l&&row.right<=innerWidth-safe.r&&tabs.every(r=>r.bottom<=innerHeight-safe.b&&r.left>=safe.l&&r.right<=innerWidth-safe.r),small};
    });
    assert(hud.sign,'Cafe sign must exist only in HUD row 1');assert(hud.safe,'HUD / tabs safe area');assert.deepEqual(hud.small,[],'44px hit areas');
   }
  }
  // Sheets keep panning locked, and retained gameplay buttons also meet hit sizes.
  for(const tab of ['cafe','train','walk','yt','book']) {
   await page.evaluate(t=>__game.switchTab(t),tab);
   assert.deepEqual(await page.evaluate(()=>[...document.querySelectorAll('#panel button')].map(e=>e.getBoundingClientRect()).filter(r=>r.width<43.99||r.height<43.99).map(r=>[r.width,r.height])),[]);
  }
  await ctx.close();console.log(`PASS ${width}×${height}: stages / zooms / world edges / HUD / hits`);
 }
 assert.deepEqual(errors,[]);console.log(`ALL PASS (${count} screenshots, zero magenta pixels)`);
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
