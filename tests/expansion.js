const {chromium}=require('playwright-core');
const assert=require('assert/strict');
const base=process.argv[2]||'http://localhost:8765/';
const url=new URL(base);url.searchParams.set('debug','1');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',args:['--no-sandbox']});
 try {
  const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url.href);await page.waitForFunction(()=>window.__game);await page.tap('#go');
  await page.evaluate(()=>{__game.setSpeed(0);__game.S.tut=7;__game.S.coins=1e7;__game.S.adopted=Array.from({length:4},()=>({coat:'red',trait:'먹보',name:'보리',family:'가족',date:'오늘',skills:{}}));document.querySelector('#tut').classList.add('hidden');document.querySelector('#debug').style.display='none';document.querySelector('#panel').classList.remove('open');});
  for(const no of [2,3,4]) {
   // Goal brings the next sign into view; tap the actual map sign to open conditions.
   await page.tap('#nextGoal');await page.tap('#zoneClose');
   await page.locator('.zone-sign').tap();
   assert.equal(await page.locator('#startBuild').isEnabled(),true);
   const before=await page.evaluate(()=>__game.S.coins);
   await page.tap('#startBuild');
   assert.equal(await page.evaluate(n=>__game.S.zones[CafeZones.ZONES[n-1].id].state,no),'building');
   const expected=await page.evaluate(n=>CafeZones.ZONES[n-1].unlock.coins,no);
   assert.equal(before-await page.evaluate(()=>__game.S.coins),expected);
   // Verify persistent endsAt before fast-forwarding.
   const ends=await page.evaluate(n=>__game.S.zones[CafeZones.ZONES[n-1].id].endsAt,no);
   await page.reload();await page.waitForFunction(()=>window.__game);
   await page.evaluate(()=>{__game.setSpeed(0);document.querySelector('#debug').style.display='none';});
   assert.equal(await page.evaluate(n=>__game.S.zones[CafeZones.ZONES[n-1].id].endsAt,no),ends);
   await page.evaluate(()=>__game.debug.advanceBuild(121));
   assert.equal(await page.evaluate(n=>__game.S.zones[CafeZones.ZONES[n-1].id].state,no),'open');
   assert.equal(await page.evaluate(()=>__game.debug.caps().pupCap),3);
   if(no>=3)assert.equal(await page.evaluate(()=>__game.debug.caps().walkCap),2);
   await page.waitForSelector('[data-gift]');await page.locator('[data-gift]').first().tap();
   console.log(`PASS zone ${no}: sign → build → reload → complete → caps → free prop`);
  }
  await page.evaluate(()=>__game.switchTab('walk'));assert.equal(await page.locator('#playCard').count(),1);
  await page.locator('[data-act=play]:not([disabled])').first().tap();
  const playing=await page.evaluate(()=>__game.S.plays[0].id);
  assert.equal(await page.evaluate(id=>{__game.switchTab('train');return [...document.querySelectorAll(`[data-act=train][data-arg^="${id}:"]`)].every(b=>b.disabled);},playing),true);
  await page.evaluate(()=>__game.tick(21));assert.equal(await page.evaluate(()=>__game.S.plays.length),0);
  await page.evaluate(()=>__game.switchTab('walk'));assert.equal(await page.locator(`[data-act=play][data-arg="${playing}"]`).isDisabled(),true);
  // Inject outside game so its pagehide save cannot overwrite fixtures.
  await page.goto(new URL('README.md',base).href);
  await page.evaluate(()=>{
   const s=JSON.parse(localStorage.getItem('shibaCafe_v1'));s.zones.z4_play={state:'building',endsAt:Date.now()-1000};s.last=Date.now()-3600*1000;s.pendingGifts=[];localStorage.setItem('shibaCafe_v1',JSON.stringify(s));
  });
  await page.goto(url.href);await page.waitForFunction(()=>window.__game);
  assert.equal(await page.evaluate(()=>__game.S.zones.z4_play.state),'open');
  assert.match(await page.locator('#modalCard').textContent(),/놀이터 완공/);await page.tap('#oOk');
  await page.locator('[data-gift]').first().tap();await page.reload();await page.waitForFunction(()=>window.__game);
  assert.equal(await page.locator('#modal.hidden').count(),1,'offline construction summary appears once');
  await page.goto(new URL('README.md',base).href);
  await page.evaluate(()=>localStorage.setItem('shibaCafe_v1',JSON.stringify({ver:1,coins:500,rep:3,subs:0,up:{menu:1,seats:5,slots:3},pups:[],adopted:[],last:Date.now()})));
  await page.goto(url.href);await page.waitForFunction(()=>window.__game);await page.evaluate(()=>__game.setSpeed(0));
  const migrated=await page.evaluate(()=>({ver:__game.S.ver,coins:__game.S.coins,zones:__game.S.zones,up:__game.S.up}));
  assert.equal(migrated.ver,2);assert.equal(migrated.zones.z1_tatami.state,'open');assert.equal(migrated.zones.z2_garden.state,'open');assert.equal(migrated.up.slots,undefined);assert.equal(migrated.up.seats,5);
  assert.equal(migrated.coins,500+150+480+1536,'exact cost of all purchased slots refunded');
  await page.evaluate(()=>{__game.S.coins=1e7;__game.switchTab('cafe');});
  assert.equal(await page.locator('[data-act=buy][data-arg=seats]').count(),0,'legacy seat levels retained, further purchase blocked');
  await page.reload();await page.waitForFunction(()=>window.__game);assert.equal(await page.evaluate(()=>__game.S.up.seats),5);
  await page.evaluate(()=>__game.setSpeed(0));
  assert.equal(await page.evaluate(()=>__game.S.coins),1e7,'refund once');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('shibaCafe_v1')).ver),2,'v2 persisted');
  assert.deepEqual(errors,[]);console.log('ALL PASS (zones, play exclusion/cooldown, offline summary, v1 refund/migration)');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
