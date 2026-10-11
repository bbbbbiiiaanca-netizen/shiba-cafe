// 밸런스 시뮬레이터 (DOM 없음). 사용: node tests/balance-sim.js [--legacy] [--runs 30] [--min 60]
// balance.js의 공식을 그대로 써서 0~N분을 0.1초 단위로 돌림. 프로필:
//   idle   : 탭 0회, 업그레이드만(메뉴·좌석·장난감·강아지방 중 가장 싼 것)
//   tap1   : idle + 초당 1회 쓰다듬기
//   active : tap1 + 유튜브 연속 촬영 + 산책 + 교육 + 모든 업그레이드
// --legacy 는 692bbdd(변경 전) 공식 근사치로 같은 시뮬을 돌려 비교용.
const { BAL, F } = require('../balance.js');
const { ZONES } = require('../zones.js');
const args = process.argv.slice(2);
const LEGACY = args.includes('--legacy');
const RUNS = +(args[args.indexOf('--runs') + 1] || 0) || 30;
const MIN = +(args[args.indexOf('--min') + 1] || 0) || 60;
const TRAITS = ['잠꾸러기', '장난꾸러기', '새침데기', '먹보', '애교쟁이'];
const COATW = ['red', 'red', 'red', 'red', 'red', 'sesame', 'sesame', 'blacktan', 'blacktan', 'white'];
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// 변경 전 공식 근사 (비교용)
const L = {
  upCost: (k, lv) => { const o = { menu: [15, 1.75], seats: [60, 2.3], toys: [40, 1.9], slots: [150, 3.2], trainer: [120, 2.1], course: [100, 2.4], cam: [150, 2.5] }[k]; return Math.floor(o[0] * Math.pow(o[1], lv)); },
  spawnInterval: (subs, rep, rush) => { let s = 7 / (1 + subs / 300) / (1 + rep * 0.01); if (rush) s /= 3; return Math.max(1.2, s); },
  happyRate: (seated, toys, trait, sleep, adopted) => { let r = (0.35 + 0.22 * seated) * (1 + 0.25 * toys); if (trait === '애교쟁이') r *= 1.3; if (trait === '새침데기') r *= 0.75; if (sleep) r *= 0.6; return r / (1 + adopted * 0.12); },
  tapCoin: (si, su, trait) => Math.max(1, (si + su) * 1.5 + 1) * (trait === '장난꾸러기' ? 2 : 1),
  filmSubs: (skill, cam, sleepy, rand, subs) => { let s = (12 + skill * 8 + subs * 0.03) * (1 + cam * 0.7) * (0.6 + rand() * 0.9) * (sleepy ? 1.5 : 1); const v = rand() < 0.12; if (v) s *= 5; return { subs: Math.max(1, Math.floor(s)), viral: v }; },
  tapHappyCap: Infinity, tapCooldown: 0, walkHappy: 20, walkHappyRate: 0, newPup: 1.8,
};
const G = LEGACY ? { ...F, ...L } : F;

function sim(profile, seed) {
  const R = rng(seed);
  const S = { t: 0, coins: BAL.startCoins, rep: 0, subs: 0, up: { menu: 0, seats: 0, toys: 0, slots: 0, trainer: 0, course: 0, cam: 0 }, pups: [], adopted: 0, dex: new Set(), custs: [], custT: 0, rushUntil: -1, film: null, walks: [], train: null, queue: [], tapCoins: 0, custCoins: 0, stage: 1, building: null };
  const mk = () => ({ born: S.t, happy: 0, trait: TRAITS[Math.floor(R() * 5)], coat: COATW[Math.floor(R() * COATW.length)], skill: 0, tapHappy: 0, lastTap: -9, sleep: false });
  const maxPups = () => LEGACY ? 2+S.up.slots : (S.stage>=2?3:2), seatCap = () => 2 + S.up.seats;
  while (S.pups.length < maxPups()) S.pups.push(mk());
  const out = { firstUp: null, adopt: {}, grow: {}, ips: {}, subs: {}, tapShare: null, zones: {}, zoneRates: {}, referenceRates: {} };
  const marks = [10, 30, 60, 120].filter(m => m <= MIN);
  const dt = 0.1; let wanderT = 0, tapT = 0;
  const buyKeys = profile === 'active' ? ['menu', 'seats', 'toys', 'trainer', 'course', 'cam'] : ['menu', 'seats', 'toys'];
  const custInc = () => F.perCust(S.up.menu) * (1 + S.rep * BAL.repIncome) * (S.pups.some(p => p.trait === '먹보') ? BAL.foodie : 1);
  for (let step = 0; step < MIN * 600; step++) {
    S.t += dt;
    if (S.building && S.t >= S.building.end) { S.stage++;out.zones[S.stage]=S.t;S.building=null; }
    const z=ZONES[S.stage];
    if(z && !z.placeholder && S.adopted>=z.unlock.adoptions && out.referenceRates[z.no]==null) out.referenceRates[z.no]=(S.custs.filter(c=>c.t>=1.3&&c.t<1.3+c.stay).length*custInc()+S.subs*BAL.subsIncome)*60;
    if (!LEGACY && z && !z.placeholder && !S.building && S.adopted>=z.unlock.adoptions && S.coins>=z.unlock.coins) {
      out.zoneRates[z.no]=(S.custs.filter(c=>c.t>=1.3&&c.t<1.3+c.stay).length*custInc()+S.subs*BAL.subsIncome)*60;
      S.coins-=z.unlock.coins;S.building={end:S.t+z.buildSec};
    }

    // 손님
    S.custT += dt;
    if (S.custT >= G.spawnInterval(S.subs, S.rep, S.t < S.rushUntil)) { S.custT = 0; if (S.custs.length < seatCap()) S.custs.push({ t: 0, stay: BAL.stayMin + R() * (BAL.stayMax - BAL.stayMin) }); }
    S.custs.forEach(c => c.t += dt); S.custs = S.custs.filter(c => c.t < 1.3 + c.stay + 1.4);
    const seated = S.custs.filter(c => c.t >= 1.3 && c.t < 1.3 + c.stay).length;
    const inc = seated * custInc(), subInc = S.subs * BAL.subsIncome;
    S.coins += (inc + subInc) * dt; S.custCoins += (inc + subInc) * dt;
    // 행복도
    wanderT += dt; if (wanderT > 2.6) { wanderT = 0; S.pups.forEach(p => { if (R() < 0.65) p.sleep = R() < (p.trait === '잠꾸러기' ? 0.5 : 0.18); }); }
    for (const p of S.pups) {
      const walking = S.walks.some(w => w.p === p);
      let r = G.happyRate(seated, S.up.toys, p.trait, p.sleep && !walking, S.adopted);
      if (walking) r *= LEGACY ? L.walkHappyRate : BAL.walkHappyRate;
      p.happy = Math.min(100, p.happy + r * dt);
    }
    // 탭
    if (profile !== 'idle') { tapT += dt; if (tapT >= 1) { tapT = 0;
      const cand = S.pups.filter(p => !S.walks.some(w => w.p === p)); if (cand.length) { const p = cand[Math.floor(R() * cand.length)];
        const cd = LEGACY ? 0 : BAL.tapCooldown; if (S.t - p.lastTap >= cd) { p.lastTap = S.t; const g = G.tapCoin(inc, subInc, p.trait); S.coins += g; S.tapCoins += g;
          const cap = LEGACY ? Infinity : BAL.tapHappyCap; const add = Math.min(BAL.tapHappy, Math.max(0, cap - p.tapHappy)); p.tapHappy += add; p.happy = Math.min(100, p.happy + add); p.sleep = false; } } } }
    // 활동 (active)
    if (profile === 'active') {
      if (!S.film) { const p = S.pups.find(p=>!S.walks.some(w=>w.p===p)&&(!S.train||S.train.p!==p)); if(p) S.film = { p, left: BAL.filmSec }; }
      else if ((S.film.left -= dt) <= 0) { const p = S.film.p; const r = G.filmSubs(p.skill, S.up.cam, p.trait === '잠꾸러기', R, S.subs); S.subs += r.subs; S.film = null; }
      if (S.walks.length < F.walkCap(S.up.course)) { const p = S.pups.find(q => !S.walks.some(w => w.p === q) && (!S.film||S.film.p!==q) && (!S.train||S.train.p!==q) && q.happy < 90); if (p) S.walks.push({ p, left: BAL.walkSec }); }
      S.walks.forEach(w => w.left -= dt);
      for (const w of S.walks.filter(w => w.left <= 0)) { const r = F.walkReward(S.up.menu, seatCap(), S.up.course); S.coins += r; w.p.happy = Math.min(100, w.p.happy + (LEGACY ? L.walkHappy : BAL.walkHappy)); S.rushUntil = S.t + BAL.rushSec; }
      S.walks = S.walks.filter(w => w.left > 0);
      if (!S.train) { const p = S.pups.find(q => q.skill < 15 && q.happy < 70 && (!S.film||S.film.p!==q) && !S.walks.some(w=>w.p===q)); if (p) { const c = F.trainCost(S.up.menu, seatCap(), S.adopted, p.skill); if (S.coins > c * 3) { S.coins -= c; S.train = { p, left: F.trainTime(Math.floor(p.skill / 5), S.up.trainer) }; } } }
      else if ((S.train.left -= dt) <= 0) { S.train.p.skill++; S.train = null; }
    }
    // 입양
    for (const p of S.pups.filter(p => p.happy >= 100)) {
      const combo = p.coat + p.trait, isNew = !S.dex.has(combo);
      S.coins += G === F ? F.adoptReward(S.up.menu, seatCap(), S.adopted, p.skill, p.trait, isNew) : F.adoptReward(S.up.menu, seatCap(), S.adopted, p.skill, p.trait, false);
      S.rep += 1 + p.skill; S.dex.add(combo); S.adopted++;
      S.pups = S.pups.filter(q => q !== p); S.walks = S.walks.filter(w => w.p !== p); if (S.film && S.film.p === p) S.film = null; if (S.train && S.train.p === p) S.train = null;
      if ([1, 5, 20, 50].includes(S.adopted)) { out.adopt[S.adopted] = S.t; out.grow[S.adopted] = S.t - p.born; }
    }
    // 새 시바 (한 마리씩)
    const need = maxPups() - S.pups.length - S.queue.length;
    for (let i = 0; i < need; i++) { const last = S.queue.length ? S.queue[S.queue.length - 1] : S.t; S.queue.push(last + (LEGACY ? L.newPup : BAL.newPupMin + R() * (BAL.newPupMax - BAL.newPupMin))); }
    while (S.queue.length && S.queue[0] <= S.t) { S.queue.shift(); if (S.pups.length < maxPups()) S.pups.push(mk()); }
    // 구매 (가장 싼 것)
    let best = null; for (const k of buyKeys) { if (S.up[k] >= (k==='seats'&&!LEGACY?2:BAL.up[k].max)) continue; const c = G.upCost(k, S.up[k]); if (!best || c < best.c) best = { k, c }; }
    if (best && S.coins >= best.c) { S.coins -= best.c; S.up[best.k]++; if (out.firstUp === null) out.firstUp = S.t; }
    for (const m of marks) if (Math.abs(S.t - m * 60) < dt / 2) { out.ips[m] = (seated * custInc() + S.subs * BAL.subsIncome) * 60; out.subs[m] = S.subs; }
  }
  out.tapShare = S.tapCoins / Math.max(1, S.custCoins);
  out.end = { up: S.up, adopted: S.adopted, dex: S.dex.size };
  return out;
}
const med = a => { const b = a.filter(x => x != null).sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)] : null; };
const fmtS = s => s == null ? '-' : s >= 60 ? `${Math.floor(s / 60)}분${Math.round(s % 60)}초` : `${Math.round(s)}초`;
const fmtN = n => n == null ? '-' : n >= 1e4 ? (n / 1e4).toFixed(1) + '만' : Math.round(n).toLocaleString('ko-KR');
console.log(`# 밸런스 시뮬 (${LEGACY ? '변경 전 692bbdd 근사' : '현재 balance.js'}) · ${RUNS}회 중앙값 · ${MIN}분`);
for (const prof of ['idle', 'tap1', 'active']) {
  const rs = Array.from({ length: RUNS }, (_, i) => sim(prof, 1000 + i));
  const g = f => med(rs.map(f));
  const marks = [10, 30, 60].filter(m => m <= MIN);
  console.log(`\n[${prof}] 첫 업그레이드 ${fmtS(g(r => r.firstUp))} | 입양 1번째 ${fmtS(g(r => r.adopt[1]))} · 5번째 ${fmtS(g(r => r.adopt[5]))} · 20번째 ${fmtS(g(r => r.adopt[20]))} · 50번째 ${fmtS(g(r => r.adopt[50]))}`);
  console.log(`  그 시바가 카페에 온 뒤 입양까지(성장 시간): 1번째 ${fmtS(g(r => r.grow[1]))} · 5번째 ${fmtS(g(r => r.grow[5]))} · 20번째 ${fmtS(g(r => r.grow[20]))} · 50번째 ${fmtS(g(r => r.grow[50]))}`);
  console.log(`  분당 코인(수입): ` + marks.map(m => `${m}분 ${fmtN(g(r => r.ips[m]))}`).join(' · ') + ` | 구독자: ` + marks.map(m => `${m}분 ${fmtN(g(r => r.subs[m]))}`).join(' · '));
  console.log('  가격 기준 R: '+[2,3,4].map(n=>`${n}: ${fmtN(g(r=>r.referenceRates[n]))}/분 × ${ZONES[n-1].unlock.nMin}`).join(' · '));
  console.log('  구역 완공: '+[2,3,4].map(n=>`${n}: ${fmtS(g(r=>r.zones[n]))} (직전 R ${fmtN(g(r=>r.zoneRates[n]))}/분 × ${ZONES[n-1].unlock.nMin})`).join(' · '));
  console.log(`  탭 수익 / 손님·구독자 수익 = ${g(r => r.tapShare).toFixed(2)} | ${MIN}분 입양 ${g(r => r.end.adopted)}마리, 도감 ${g(r => r.end.dex)}/20 | 끝 업그레이드 ${JSON.stringify(rs[0].end.up)}`);
}
