const {chromium}=require('playwright-core');const assert=require('assert/strict');
const base=process.argv[2]||'http://localhost:8765/';
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',args:['--no-sandbox']});
 try{
  const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/README|favicon/.test(m.location().url+page.url()))errors.push(m.text());});page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.url());});
  await page.goto(base+'?debug=1');await page.waitForFunction(()=>window.__game);await page.tap('#go');
  await page.evaluate(()=>{__game.setSpeed(0);__game.S.flow=5;__game.S.tut=7;__game.S.coins=10000;document.querySelector('#tut').classList.add('hidden');});
  assert.equal(await page.evaluate(()=>__game.debug.caps().pupCap),2);const id=await page.evaluate(()=>__game.S.pups[0].id);
  // Tap cooldown retained; happy cap cannot be bypassed by bursts.
  await page.evaluate(id=>{const p=__game.S.pups[0];p.happy=0;p.tapHappy=0;for(let i=0;i<30;i++)__game.tapPup(id);},id);assert(await page.evaluate(()=>__game.S.pups[0].tapHappy<=1.5));
  await page.tap('#tabs [data-tab=train]');const coins=await page.evaluate(()=>__game.S.coins);await page.locator('[data-act=train]:not([disabled])').first().tap();assert.equal(await page.evaluate(()=>__game.S.coins),coins);await page.evaluate(()=>__game.tick(16));assert.equal(await page.evaluate(()=>__game.S.pups[0].skills.sit),1);
  await page.tap('#tabs [data-tab=walk]');await page.locator('[data-act=walk]:not([disabled])').first().tap();assert.equal(await page.evaluate(()=>__game.S.walks[0].dur),20);await page.evaluate(()=>__game.tick(21));assert.equal(await page.evaluate(()=>__game.S.walks.length),0);
  await page.tap('#tabs [data-tab=yt]');await page.locator('[data-act=film]:not([disabled])').first().tap();await page.evaluate(()=>__game.tick(31));assert.equal(await page.evaluate(()=>__game.S.videos.length),1);assert.equal(await page.evaluate(()=>__game.S.subs),20);
  await page.tap('#tabs [data-tab=book]');assert.equal(await page.locator('.dex .slot').count(),20);assert.equal(await page.locator('.dex .slot.got').count(),1);
  await page.tap('#settings');assert(await page.locator('#debug [data-d=off]').isVisible());await page.locator('#debug [data-d=off]').tap();assert.match(await page.locator('#modalCard').textContent(),/8시간/);await page.tap('#oOk');await page.tap('#settings');assert(await page.locator('#debug [data-d=off]').isVisible());await page.tap('#settingsClose');
  await page.reload();await page.waitForFunction(()=>window.__game);assert.equal(await page.evaluate(()=>__game.S.flow),5);assert.equal(await page.evaluate(()=>__game.S.videos.length),1);
  assert(await page.evaluate(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0)));
  await page.goto(base+'README.md');await page.evaluate(()=>localStorage.setItem('shibaCafe_v1',JSON.stringify({coins:500,rep:3,subs:50,up:{menu:3,toys:25},pups:[{id:1,name:'콩이',coat:'cream',trait:'먹보',happy:40,skills:{sit:1,paw:0,wait:0,down:0,bang:0},x:30,y:40}],adopted:[{name:'보리',coat:'red',trait:'잠꾸러기',family:'가족',skill:0,date:'10/11'}],last:Date.now(),tut:true})));
  await page.goto(base+'?debug=1');await page.waitForFunction(()=>window.__game);assert(await page.evaluate(()=>__game.S.flow===5&&__game.S.tut===7&&__game.S.up.toys===20&&__game.S.pups[0].coat==='white'&&__game.S.dex['red_잠꾸러기']===1));
  assert.deepEqual(errors,[]);console.log('ALL PASS (tap / train / walk / film / dex / offline / settings / reload / v1)');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
