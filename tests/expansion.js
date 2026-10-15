const {chromium}=require('playwright-core');const assert=require('assert/strict');
const base=process.argv[2]||'http://localhost:8765/';
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',args:['--no-sandbox']});
 try{
  const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'?debug=1');await page.waitForFunction(()=>window.__game);await page.tap('#go');
  await page.evaluate(()=>{__game.setSpeed(0);__game.S.flow=5;__game.S.tut=7;__game.S.coins=1e7;__game.S.adoptCount=2;document.querySelector('#tut').classList.add('hidden');document.querySelector('#panel').classList.remove('open');});
  await page.tap('#nextGoal');await page.tap('#zoneClose');await page.locator('.zone-sign').tap();assert(await page.locator('#startBuild').isEnabled());
  const before=await page.evaluate(()=>__game.S.coins),price=await page.evaluate(()=>__game.S.zonePrices.z2_garden);await page.tap('#startBuild');assert.equal(before-await page.evaluate(()=>__game.S.coins),price);
  const ends=await page.evaluate(()=>__game.S.zones.z2_garden.endsAt);await page.reload();await page.waitForFunction(()=>window.__game);await page.evaluate(()=>__game.setSpeed(0));assert.equal(await page.evaluate(()=>__game.S.zones.z2_garden.endsAt),ends);
  await page.evaluate(()=>__game.debug.advanceBuild(31));assert.equal(await page.evaluate(()=>__game.S.zones.z2_garden.state),'open');assert.equal(await page.evaluate(()=>__game.debug.caps().pupCap),3);
  await page.waitForSelector('[data-gift]');await page.locator('[data-gift]').first().tap();assert.equal(await page.locator('.zone-sign').count(),0,'③ 이후 v0.6 잠금');
  await page.evaluate(()=>__game.switchTab('walk'));assert.equal(await page.locator('#playCard').count(),0,'놀이터 플레이 범위 제외');assert.equal(await page.evaluate(()=>__game.debug.caps().walkCap),1);
  // v1→v2 refund layer remains sequentially under schemaVersion 3.
  await page.goto(base+'README.md');await page.evaluate(()=>localStorage.setItem('shibaCafe_v1',JSON.stringify({ver:1,coins:500,rep:3,subs:0,up:{menu:1,seats:5,slots:3},pups:[],adopted:[],last:Date.now()})));
  await page.goto(base+'?debug=1');await page.waitForFunction(()=>window.__game);await page.evaluate(()=>__game.setSpeed(0));
  const s=await page.evaluate(()=>({ver:__game.S.ver,schema:__game.S.schemaVersion,coins:__game.S.coins,up:__game.S.up,zones:__game.S.zones}));assert.equal(s.ver,2);assert.equal(s.schema,3);assert.equal(s.coins,500+150+480+1536);assert.equal(s.up.slots,undefined);assert.equal(s.up.seats,5);assert.equal(s.zones.z2_garden.state,'open');
  assert.equal(await page.locator('[data-act=buy][data-arg=seats]').count(),0);await page.reload();await page.waitForFunction(()=>window.__game);assert.equal(await page.evaluate(()=>__game.S.coins),s.coins,'refund once');assert.equal(await page.evaluate(()=>__game.S.up.seats),5,'legacy purchase metadata retained');
  assert.deepEqual(errors,[]);console.log('ALL PASS (② construction / persisted price / gifts / ③ lock / legacy migration)');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
