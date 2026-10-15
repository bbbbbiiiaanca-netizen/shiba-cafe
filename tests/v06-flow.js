const {chromium}=require('playwright-core');
const assert=require('assert/strict');
const base=process.argv[2]||'http://localhost:8765/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',args:['--no-sandbox']});
 try{
  const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,acceptDownloads:true});const page=await ctx.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/README|favicon/.test(m.location().url+page.url()))errors.push(m.text());});
  await page.goto(base+'?debug=1');await page.waitForFunction(()=>window.__game);await page.tap('#go');await page.evaluate(()=>__game.setSpeed(0));
  assert.equal(await page.evaluate(()=>__game.S.pups.length),1);assert.equal(await page.evaluate(()=>__game.S.tickets),4,'tutorial 3 + first visit 1');
  await page.tap('#drawBtn');assert.match(await page.locator('#modalCard').textContent(),/N 70%.*R 23%.*SR 6%.*SSR 1%/s);
  // Deterministic draw through the same public operation used by the 1x button.
  await page.evaluate(()=>__game.draw(1,()=>.3));assert.equal(await page.evaluate(()=>__game.S.flow),1);assert.equal(await page.evaluate(()=>__game.S.pups.length),2);
  await page.tap('#drawClose');await page.tap('#tabs [data-tab=train]');await page.locator('[data-act=train]:not([disabled])').first().tap();
  await page.evaluate(()=>__game.tick(16));assert.equal(await page.evaluate(()=>__game.S.flow),2);assert.equal(await page.evaluate(()=>__game.S.daily.care),true);
  // Fast-forward only the clock; happiness and adoption price use production formulas.
  await page.evaluate(()=>{for(let i=0;i<180;i++)__game.tick(1);});
  await page.evaluate(()=>{__game.switchTab('cafe');__game.openAdoption(__game.S.pups[0]);});
  const before=await page.evaluate(()=>({coins:__game.S.coins,n:__game.S.pups.length,price:__game.Core.adoption(__game.S.pups[0])}));
  assert.match(await page.locator('#modalCard').textContent(),/성장비·조각은 환급되지/);await page.tap('#noAdopt');assert.equal(await page.evaluate(()=>__game.S.pups.length),before.n);
  await page.evaluate(()=>__game.openAdoption(__game.S.pups[0]));await page.tap('#okAdopt');
  assert.equal(await page.evaluate(()=>__game.S.pups.length),before.n-1);assert.equal(await page.evaluate(()=>__game.S.coins),before.coins+before.price);assert.equal(await page.evaluate(()=>__game.S.flow),3);
  await page.tap('#decorBtn');await page.locator('[data-garden=lamp_paper]').tap();assert.equal(await page.evaluate(()=>__game.S.flow),4);await page.tap('#gardenClose');
  await page.tap('#photoBtn');await page.waitForSelector('#downloadPhoto');await page.waitForFunction(()=>document.querySelector('#photoPreview')?.naturalWidth===900);
  assert.deepEqual(await page.locator('#photoPreview').evaluate(i=>({w:i.naturalWidth,h:i.naturalHeight})),{w:900,h:1600});
  const download=page.waitForEvent('download');await page.tap('#downloadPhoto');assert.equal((await download).suggestedFilename(),'shiba-cafe-donggu.png');assert.equal(await page.evaluate(()=>__game.S.flow),5);await page.tap('#photoClose');
  // 10x, duplicate fragment decision, overflow and no waiting care/income.
  await page.evaluate(()=>{__game.S.tickets=10;__game.draw(10,()=>0);});
  assert.equal(await page.evaluate(()=>__game.S.lastDraw.length),10);
  const fragmentBefore=await page.evaluate(()=>__game.S.fragments);await page.locator('[data-duplicate][data-fragments]').first().tap();assert.equal(await page.evaluate(()=>__game.S.fragments),fragmentBefore+5);
  await page.evaluate(()=>{while(__game.S.drawPending.length)__game.resolveDuplicate(__game.S.drawPending[0].id,false);});
  assert(await page.evaluate(()=>__game.S.waiting.length>0));const waitingHappy=await page.evaluate(()=>__game.S.waiting[0].happy);
  await page.evaluate(()=>__game.tick(30));assert.equal(await page.evaluate(()=>__game.S.waiting[0].happy),waitingHappy);
  await page.tap('#drawClose');
  // Second adoption unlocks zone ②; no automatic new pups arrive.
  await page.evaluate(()=>__game.openAdoption(__game.S.pups.find(p=>p.happy>=100)));await page.tap('#okAdopt');
  await page.tap('#nextGoal');assert.equal(await page.locator('#startBuild').isEnabled(),true);const price=await page.evaluate(()=>__game.S.zonePrices.z2_garden);await page.tap('#startBuild');
  const ends=await page.evaluate(()=>__game.S.zones.z2_garden.endsAt);await page.reload();await page.waitForFunction(()=>window.__game);await page.evaluate(()=>__game.setSpeed(0));
  assert.equal(await page.evaluate(()=>__game.S.zones.z2_garden.endsAt),ends);assert.equal(await page.evaluate(()=>__game.S.zonePrices.z2_garden),price);
  await page.evaluate(()=>__game.debug.advanceBuild(31));await page.waitForSelector('[data-gift]');await page.locator('[data-gift]').first().tap();
  await page.tap('#decorBtn');for(const id of ['vase','bonsai','sign_paw']){const b=page.locator(`[data-garden=${id}]`);if(await b.isEnabled())await b.tap();}
  assert.deepEqual(await page.evaluate(()=>__game.Core.decorEffect(__game.S)),{count:4,demand:.1,stay:.06});await page.tap('#gardenClose');
  assert.equal(await page.evaluate(()=>__game.debug.caps().pupCap),3);assert.equal(await page.evaluate(()=>__game.debug.caps().walkCap),1);
  // Pity thresholds and counter priority in browser runtime.
  assert.deepEqual(await page.evaluate(()=>['R','SR','SSR'].map(r=>{const s={pity:{R:0,SR:0,SSR:0},discovered:{},scarves:{},missedDiscovery:0,drawCount:0};s.pity[r]=__game.C.draw.pity[r]-1;return __game.Core.roll(s,()=>0).rarity;})),['R','SR','SSR']);
  const reward=async(type,result)=>{await page.evaluate(type=>{window.testRewardPromise=__game.rewardTest(type);},type);await page.locator(`[data-reward-result=${result}]`).tap();return page.evaluate(()=>window.testRewardPromise);};
  const tickets=await page.evaluate(()=>__game.S.tickets);await reward('ticket','cancelled');assert.equal(await page.evaluate(()=>__game.S.ads.ticket),0);assert.equal(await page.evaluate(()=>__game.S.tickets),tickets);
  await reward('ticket','completed');assert.equal(await page.evaluate(()=>__game.S.tickets),tickets+1);assert.equal(await page.evaluate(()=>__game.S.ads.ticket),1);assert.equal(await page.evaluate(()=>__game.adGate('ticket').ok),false);
  await reward('boost','unavailable');assert.equal(await page.evaluate(()=>__game.S.ads.boost),0);
  // Fill five independent slots to aggregate cap; fixture eligible base reward records.
  await page.evaluate(()=>{__game.S.ads=null;});
  for(const [type,count] of [['adopt',2],['boost',2],['ticket',1],['demand',2],['offline',3]])for(let i=0;i<count;i++){
   await page.evaluate(type=>{__game.S.boostUntil=0;__game.S.demandUntil=0;if(type==='adopt')__game.S.lastAdoption={id:Math.random().toString(),coins:5000,claimed:false};if(type==='offline')__game.S.lastOffline={id:Math.random().toString(),coins:50,claimed:false};},type);
   await reward(type,'completed');
  }
  assert.equal(await page.evaluate(()=>__game.S.ads.total),10);assert.equal(await page.evaluate(()=>__game.adGate('boost').ok),false);
  const snapshot=await page.evaluate(()=>{__game.save();return {tickets:__game.S.tickets,waiting:__game.S.waiting.length,fragments:__game.S.fragments,flow:__game.S.flow};});
  await page.reload();await page.waitForFunction(()=>window.__game);assert.deepEqual(await page.evaluate(()=>({tickets:__game.S.tickets,waiting:__game.S.waiting.length,fragments:__game.S.fragments,flow:__game.S.flow})),snapshot);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('shibaCafe_v1_backup')).schemaVersion),3);
  // v0.5 migration and daily grant cannot repeat on reload.
  await page.goto(base+'README.md');await page.evaluate(()=>localStorage.setItem('shibaCafe_v1',JSON.stringify({ver:2,coins:500,pups:[],adopted:[],up:{},zones:{z1_tatami:{state:'open'}},tut:7,last:Date.now(),queue:[20]})));
  await page.goto(base+'?debug=1');await page.waitForFunction(()=>window.__game);assert.equal(await page.evaluate(()=>__game.S.schemaVersion),3);assert.equal(await page.evaluate(()=>__game.S.queue.length),0);assert.equal(await page.evaluate(()=>__game.S.flow),5);const daily=await page.evaluate(()=>__game.S.tickets);
  await page.reload();await page.waitForFunction(()=>window.__game);assert.equal(await page.evaluate(()=>__game.S.tickets),daily);
  assert.deepEqual(errors,[]);console.log('ALL PASS (v0.6 first-play / 1x + 10x / pity / waiting / decor / photo / ads / save)');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
