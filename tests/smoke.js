const { chromium } = require('playwright-core');
// 사용법: (1) python3 -m http.server 8765 (이 폴더에서)  (2) npm i --no-save playwright-core  (3) CHROME=/usr/bin/google-chrome node tests/smoke.js [URL]
// 튜토리얼 전체 → 첫 입양(광고 버튼 없음) → 도감 → 유튜브 → 2번째 입양(광고 2배) → 광고 쿨다운/부스트 → 오프라인 → 저장 → v1 세이브 이전
const path = require('path');
const SS = path.join(__dirname, '..', 'screenshots') + '/';
require('fs').mkdirSync(SS, { recursive: true });
const URL = process.argv[2] || 'http://localhost:8765/';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'ko-KR' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/README|favicon/.test(m.location().url + page.url())) errs.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('requestfailed', r => errs.push('requestfailed: ' + r.url()));
  page.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) errs.push('http ' + r.status() + ': ' + r.url()); });
  const G = f => page.evaluate(f);
  const shot = async name => { await page.evaluate(() => { const d = document.querySelector('#debug'); if (d) d.style.visibility = 'hidden'; }); await page.screenshot({ path: SS + name }); await page.evaluate(() => { const d = document.querySelector('#debug'); if (d) d.style.visibility = ''; }); };
  await page.goto(URL + '?debug=1'); await page.waitForTimeout(900);
  await shot('01_welcome.png');
  await page.tap('#go'); await page.waitForTimeout(2500);
  ok(await G(() => __game.S.tut === 0 && !document.querySelector('#tut').classList.contains('hidden')), '튜토리얼 말풍선 표시 (1단계 쓰다듬기)');
  ok(await G(() => document.querySelector('#tabs [data-tab=train]').classList.contains('locked')), '교육 탭 잠김');
  await shot('tutorial.png');
  for (let i = 0; i < 3; i++) { await page.locator('#floor .pup').first().tap({ force: true }); await page.waitForTimeout(500); }
  const st1 = await G(() => __game.S.tut); ok(st1 >= 1, '쓰다듬기 3회 → 다음 단계 (tut=' + st1 + ')');
  if (st1 === 1) { await page.waitForTimeout(300); await page.tap('[data-act=buy][data-arg=menu]'); await page.waitForTimeout(400); }
  ok(await G(() => __game.S.tut === 2 && __game.S.up.menu >= 1), '메뉴 개발 → 교육 탭 해금');
  await shot('tutorial_2.png');
  await page.tap('#tabs [data-tab=train]'); await page.waitForTimeout(300);
  const c0 = await G(() => __game.S.coins);
  await page.locator('[data-act=train]:not([disabled])').first().tap(); await page.waitForTimeout(400);
  ok(await G(() => __game.S.train.length === 1 && __game.S.tut === 3), '첫 교육 시작 → 산책 탭 해금');
  ok(await G(() => __game.S.coins) >= c0 - 0.001, '첫 교육 무료');
  await shot('04_train.png');
  await page.tap('#tabs [data-tab=walk]'); await page.waitForTimeout(300);
  await page.locator('[data-act=walk]:not([disabled])').first().tap(); await page.waitForTimeout(400);
  ok(await G(() => __game.S.walks.length === 1 && Math.round(__game.S.walks[0].dur) === 20 && __game.S.tut === 4), '첫 산책 20초, 입양 단계로');
  await shot('05_walk.png');
  // 첫 입양까지 x20 속도
  const tStart = await G(() => __game.S.playSec);
  await G(() => __game.setSpeed(20));
  await page.waitForFunction(() => __game.S.pups.some(p => p.happy >= 100), null, { timeout: 30000 });
  await G(() => __game.setSpeed(1));
  const tAdopt = await G(() => __game.S.playSec);
  console.log('first adoption-ready at playSec', Math.round(tAdopt), '(tutorial steps took', Math.round(tStart), 's)');
  ok(tAdopt < 180, '첫 입양 가능 시점 < 3분 (게임 시간 ' + Math.round(tAdopt) + '초)');
  await page.waitForTimeout(600);
  await shot('cafe.png');
  await page.locator('#floor .pup .adopt').first().evaluate(e => e.closest('.pup').click());
  await page.waitForTimeout(500);
  ok(await G(() => !document.querySelector('#adAdopt') && !!document.querySelector('#okAdopt')), '첫 입양: 광고 버튼 없음');
  await shot('adoption_modal.png');
  await page.tap('#okAdopt'); await page.waitForTimeout(600);
  ok(await G(() => __game.S.adopted.length === 1 && __game.S.tut === 5), '첫 입양 완료 → 도감 해금');
  await page.tap('#tabs [data-tab=book]'); await page.waitForTimeout(400);
  ok(await G(() => document.querySelectorAll('.dex .slot').length === 20 && document.querySelectorAll('.dex .slot.got').length === 1), '도감 20칸, 1칸 채움');
  await shot('dex.png');
  await page.tap('#tabs [data-tab=yt]'); await page.waitForTimeout(300);
  await page.locator('[data-act=film]:not([disabled])').first().tap(); await page.waitForTimeout(400);
  ok(await G(() => !!__game.S.film && __game.S.tut === 7), '첫 촬영 → 튜토리얼 완료');
  await shot('06_yt.png');
  // 새 시바 도착(5~15초) + 영상 완료
  await G(() => __game.setSpeed(10)); await page.waitForTimeout(3500); await G(() => __game.setSpeed(1));
  ok(await G(() => __game.S.pups.length === 2 && __game.S.videos.length >= 1), '새 시바 도착 + 영상 업로드 (subs=' + await G(() => __game.S.subs) + ')');
  // 2번째 입양: 광고 2배
  await page.tap('#tabs [data-tab=cafe]'); await page.waitForTimeout(300);
  await G(() => { __game.S.pups[0].happy = 100; }); await page.waitForTimeout(600);
  await page.locator('#floor .pup .adopt').first().evaluate(e => e.closest('.pup').click()); await page.waitForTimeout(400);
  ok(await G(() => !!document.querySelector('#adAdopt')), '2번째 입양: 광고 2배 버튼 표시');
  await shot('adoption_modal_2.png');
  const coinsB = await G(() => __game.S.coins);
  await page.tap('#adAdopt'); await page.waitForTimeout(1200);
  await shot('09_fake_ad.png');
  await page.waitForTimeout(2800);
  ok(await G(() => __game.S.adopted.length === 2 && __game.S.ads.adopt === 1 && __game.S.ads.total === 1), '광고 입양 집계 (adopt=1,total=1)');
  console.log('coins gained on ad adoption', Math.round(await G(() => __game.S.coins) - coinsB));
  // 부스트: 전역 2분 간격 → 대기 표시, 간격 지나면 사용 가능
  await G(() => { __game.S.playSec = Math.max(__game.S.playSec, 200); });
  await page.waitForTimeout(500);
  const bst = await G(() => { const b = document.querySelector('#boostBtn'); return { cls: b.className, txt: b.textContent, tut: __game.S.tut, ps: Math.round(__game.S.playSec), ad: __game.S.adopted.length, g: __game.adGate('boost') }; });
  ok(!bst.cls.includes('hidden') && bst.cls.includes('wait'), '광고 직후 부스트 버튼 = 대기 표시 ' + JSON.stringify(bst));
  await G(() => { __game.S.ads.lastAt = 0; }); await page.waitForTimeout(500);
  await page.tap('#boostBtn'); await page.waitForTimeout(300); await page.tap('#bOk'); await page.waitForTimeout(3600);
  ok(await G(() => __game.S.boostUntil > Date.now() && __game.S.boostReadyAt > __game.S.boostUntil), '부스트 켜짐 + 종료 후 10분 쿨다운 설정');
  await shot('12_boost.png');
  ok(await G(() => { __game.S.ads.total = 10; const g = __game.adGate('adopt'); __game.S.ads.total = 2; return !g.ok && g.cap; }), '하루 전역 10회 캡');
  // 오프라인 2시간 (입양 2마리 → 최대 1시간)
  await G(() => { __game.S.ads.lastAt = 0; });
  await page.tap('#settings'); await page.tap('#debug [data-d=off]'); await page.waitForTimeout(500);
  ok(await G(() => /최대 1시간/.test(document.querySelector('#modalCard').textContent) && !!document.querySelector('#oAd')), '오프라인: 상한 1시간 표시 + 30분 이상이라 광고 버튼');
  await shot('13_offline.png');
  await page.tap('#oOk'); await page.waitForTimeout(300);
  await page.tap('#settings');
  ok(await page.locator('#debug [data-d=off]').isVisible(), '디버그 컨트롤은 설정에서 다시 열림');
  await page.tap('#settingsClose');
  // 쓰다듬기 상한/쿨다운
  const th = await G(() => { const p = __game.S.pups[0]; p.happy = 0; p.tapHappy = 0; return p.id; });
  for (let i = 0; i < 30; i++) await page.evaluate(id => document.querySelector(`#floor .pup[data-id="${id}"]`).click(), th);
  ok(await G(() => __game.S.pups[0].tapHappy <= 1.5 + 1e-9), '연타 30번(0.4초 이내) → 보상 1번만');
  // 저장/새로고침
  await page.reload(); await page.waitForTimeout(900);
  ok(await G(() => __game.S.adopted.length === 2 && __game.S.tut === 7 && document.querySelector('#modal').classList.contains('hidden')), '새로고침 후 저장 유지');
  // 모든 이미지 로드
  ok(await G(() => [...document.images].every(i => i.complete && i.naturalWidth > 0)), '이미지 전부 로드 (' + await G(() => document.images.length) + '개)');
  // v1 세이브 이전
  await page.goto(URL + 'README.md'); // 게임 밖(같은 origin)에서 세이브 주입 — 게임 페이지의 pagehide 저장이 덮어쓰지 않게
  await G(() => localStorage.setItem('shibaCafe_v1', JSON.stringify({ coins: 500, rep: 3, subs: 50, up: { menu: 3, toys: 25 }, pups: [{ id: 1, name: '콩이', coat: 'cream', trait: '먹보', happy: 40, skills: { sit: 1, paw: 0, wait: 0, down: 0, bang: 0 }, x: 30, y: 40 }], adopted: [{ name: '보리', coat: 'red', trait: '잠꾸러기', family: 'x', skill: 0, date: '10/11' }], last: Date.now(), tut: true })));
  await page.goto(URL + '?debug=1'); await page.waitForTimeout(900);
  ok(await G(() => __game.S.tut === 7 && __game.S.up.toys === 20 && __game.S.pups[0].coat === 'white' && __game.S.dex['red_잠꾸러기'] === 1 && !document.querySelector('#tabs .locked')), 'v1 세이브 이전 (튜토 완료·탭 해금·도감 재구성·toys 상한)');
  await G(() => localStorage.clear());
  console.log('fmt', await G(() => [999, 12345, 1234567, 123456789, 5e12].map(__game.fmt).join(' | ')));
  console.log('ERRORS:', errs.length ? errs : 'none');
  ok(!errs.length, '콘솔 오류/경고/404 0건');
  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FAIL', e); process.exit(1); });
