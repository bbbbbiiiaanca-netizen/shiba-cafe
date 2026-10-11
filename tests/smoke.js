const { chromium } = require('playwright-core');
// 사용법: (1) python3 -m http.server 8765 (이 폴더에서)  (2) npm i playwright-core  (3) CHROME=/usr/bin/google-chrome node tests/smoke.js
const path = require('path');
const SS = path.join(__dirname, '..', 'screenshots') + '/';
require('fs').mkdirSync(SS, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'ko-KR' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error' || m.type()==='warning') errs.push(m.type()+': '+m.text()); });
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await page.goto('http://localhost:8765/?debug=1');
  await page.waitForTimeout(800);
  await page.screenshot({ path: SS + '01_welcome.png' });
  await page.tap('#go');
  await page.waitForTimeout(3500);
  // tap puppies
  for (let i = 0; i < 5; i++) { await page.locator('#floor .pup').first().tap({ force: true }); await page.waitForTimeout(150); }
  await page.screenshot({ path: SS + '02_cafe.png' });
  const c0 = await page.evaluate(() => __game.S.coins);
  console.log('coins after taps', c0);
  // give coins, buy upgrades
  await page.evaluate(() => { __game.S.coins += 5000; });
  await page.waitForTimeout(400);
  for (const k of ['menu', 'seats', 'toys', 'slots']) { await page.tap(`[data-act=buy][data-arg=${k}]`); await page.waitForTimeout(300); }
  const up = await page.evaluate(() => JSON.stringify(__game.S.up) + ' pups=' + __game.S.pups.length);
  console.log('upgrades', up);
  await page.screenshot({ path: SS + '03_upgrades.png' });
  // train
  await page.tap('#tabs [data-tab=train]'); await page.waitForTimeout(300);
  await page.locator('[data-act=train]').first().tap(); await page.waitForTimeout(500);
  await page.screenshot({ path: SS + '04_train.png' });
  // walk
  await page.tap('#tabs [data-tab=walk]'); await page.waitForTimeout(300);
  await page.locator('[data-act=walk]:not([disabled])').first().tap(); await page.waitForTimeout(500);
  await page.screenshot({ path: SS + '05_walk.png' });
  // youtube
  await page.tap('#tabs [data-tab=yt]'); await page.waitForTimeout(300);
  await page.locator('[data-act=film]:not([disabled])').first().tap(); await page.waitForTimeout(400);
  // fast forward x50
  await page.evaluate(() => __game.setSpeed(50));
  await page.waitForTimeout(3000);
  await page.evaluate(() => __game.setSpeed(1));
  await page.waitForTimeout(400);
  await page.screenshot({ path: SS + '06_youtube.png' });
  const st = await page.evaluate(() => ({ subs: __game.S.subs, skills: __game.S.pups.map(p => p.skills), walks: __game.S.walks.length, train: __game.S.train.length, happy: __game.S.pups.map(p=>Math.round(p.happy)) }));
  console.log('after ff', JSON.stringify(st));
  // adoption
  await page.tap('#tabs [data-tab=cafe]'); await page.waitForTimeout(300);
  await page.evaluate(() => { __game.S.pups[0].happy = 100; });
  await page.waitForTimeout(600);
  await page.screenshot({ path: SS + '07_adopt_ready.png' });
  await page.locator('#floor .pup .adopt').first().evaluate(e => e.closest('.pup').click());
  await page.waitForTimeout(400);
  await page.screenshot({ path: SS + '08_adopt_modal.png' });
  await page.tap('#adAdopt'); await page.waitForTimeout(1200);
  await page.screenshot({ path: SS + '09_fake_ad.png' });
  await page.waitForTimeout(2800);
  await page.screenshot({ path: SS + '10_adopted.png' });
  await page.waitForTimeout(1500);
  await page.tap('#tabs [data-tab=book]'); await page.waitForTimeout(300);
  await page.screenshot({ path: SS + '11_book.png' });
  console.log('adopted', await page.evaluate(() => JSON.stringify(__game.S.adopted) + ' pups=' + __game.S.pups.length));
  // boost
  await page.tap('#boostBtn'); await page.waitForTimeout(300); await page.tap('#bOk'); await page.waitForTimeout(3600);
  console.log('boost on', await page.evaluate(() => __game.S.boostUntil > Date.now()));
  await page.screenshot({ path: SS + '12_boost.png' });
  await page.tap('#debug [data-d=off]'); await page.waitForTimeout(500);
  await page.screenshot({ path: SS + '13_offline.png' });
  await page.tap('#oOk'); await page.waitForTimeout(300);
  await page.reload(); await page.waitForTimeout(800);
  console.log('after reload', await page.evaluate(() => JSON.stringify({c:Math.floor(__game.S.coins), ad:__game.S.adopted.length, pups:__game.S.pups.length})));
  await page.evaluate(() => { document.querySelector('#modalCard').innerHTML = '<h2>털색 4종</h2><div style="display:flex">' + ['red','sesame','blacktan','cream'].map(c => '<div style="width:80px">' + __game.shibaSVG(c) + '</div>').join('') + '</div>'; document.querySelector('#modal').classList.remove('hidden'); });
  await page.waitForTimeout(200); await page.screenshot({ path: SS + '14_coats.png' });
  console.log('fmt', await page.evaluate(() => [999, 12345, 1234567, 123456789, 5e12].map(__game.fmt).join(' | ')));
  console.log('ERRORS:', errs.length ? errs : 'none');
  await b.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
