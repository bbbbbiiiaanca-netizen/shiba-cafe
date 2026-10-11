/* 시바견 카페 — 밸런스 상수·공식 (게임과 tests/balance-sim.js가 같이 씀) */
(function (root) {
'use strict';
const BAL = {
  startCoins: 30,
  // 손님
  custBase: 1, custMul: 1.25,  /* 메뉴 레벨당 손님 지출 배율: 기존 1.55 → 시뮬 결과 10분 만에 전부 MAX라 1.25 */ repIncome: 0.02, foodie: 1.1,
  spawnBase: 7, spawnSubsDiv: 1000, spawnRep: 0.01, spawnMin: 3.5, rushDiv: 3, rushMin: 1.2, rushSec: 25,
  stayMin: 18, stayMax: 32,
  subsIncome: 0.02,
  // 쓰다듬기
  tapIncomeFrac: 0.25, tapFlat: 1, tapCooldown: 0.4, tapHappy: 1.5, tapHappyCap: 15, mischief: 2,
  // 행복도 / 입양
  happyBase: 0.31, happySeat: 0.10, happySeatCap: 4, /* 행복도에 반영되는 손님 수 상한 */ happyToy: 0.035, affection: 1.3, aloof: 0.75, sleepMul: 0.6,
  adoptSlow: 0.45, adoptLate: 0.10, adoptLong: 4, discoveryEarly: 0.65, discoveryLate: 0.06,   // D(n) = 1 + 0.6·log2(1+n)  (GPT안 0.45 → 시뮬 후 0.6)
  adoptBase: 80, adoptMenuSeat: 45, adoptPerAdopted: 25, adoptSkill: 0.25, aloofReward: 1.5, firstCombo: 0.20,
  newPupMin: 5, newPupMax: 15,
  // 교육
  trainFrac: 0.08, trainGrowth: 1.08, trainTimes: [15, 25, 35], trainerMul: 0.85, skillMax: 3,
  // 산책
  walkSec: 40, walkFirstSec: 20, walkHappy: 14, walkHappyRate: 0.5, walkBase: 25, walkMenuSeat: 18, walkCourse: 0.5,
  // 유튜브
  filmSec: 30, filmBase: 12, filmSkill: 4, camBonus: 0.30, filmRndMin: 0.8, filmRndMax: 1.2, sleepyFilm: 1.5,
  viralP: 0.05, viralMul: 3,
  // 업그레이드
  up: {
    menu:    { base: 15,  mul: 1.62, max: 60 },
    seats:   { base: 45,  mul: 2.0,  max: 6 },
    toys:    { base: 40,  mul: 1.6,  max: 20 },   // max 30→20 (후반 입양 속도 유지)
    slots:   { base: 150, mul: 3.2,  max: 4 },
    trainer: { base: 120, mul: 2.1,  max: 10 },
    course:  { base: 100, mul: 2.4,  max: 5 },
    cam:     { base: 150, mul: 2.5,  max: 5 },
  },
  // 광고 (가정값 — /workspace/shiba-cafe-docs/monetization.md §2)
  ads: {
    dailyTotal: 10, gapSec: 120,
    adopt:   { daily: 6 },
    boost:   { daily: 6, durSec: 300, afterSec: 600, minPlaySec: 150 },
    offline: { daily: 3, minAwaySec: 1800 },
  },
  // 오프라인
  offlineCapSec: [[0, 15 * 60], [1, 3600], [5, 8 * 3600]],
  offlineIncome: 0.5, offlineSeatFill: 0.6, offlineHappy: 0.25,
};
const F = {
  pupCombo(known, rand = Math.random) {
    const coats=['red','red','red','red','red','sesame','sesame','blacktan','blacktan','white'];
    const traits=['잠꾸러기','장난꾸러기','새침데기','먹보','애교쟁이'];
    const keys=Object.keys(known).filter(k=>known[k]);
    const key=()=>coats[Math.floor(rand()*coats.length)]+'_'+traits[Math.floor(rand()*traits.length)];
    if(keys.length && rand() >= (keys.length<6?BAL.discoveryEarly:BAL.discoveryLate)) return keys[Math.floor(rand()*keys.length)];
    return key();
  },
  perCust: lv => BAL.custBase * Math.pow(BAL.custMul, lv),
  upCost: (k, lv) => Math.floor(BAL.up[k].base * Math.pow(BAL.up[k].mul, lv)),
  spawnInterval(subs, rep, rush) {
    let s = Math.max(BAL.spawnMin, BAL.spawnBase / (1 + subs / BAL.spawnSubsDiv) / (1 + rep * BAL.spawnRep));
    if (rush) s = Math.max(BAL.rushMin, s / BAL.rushDiv);
    return s;
  },
  slow: adopted => 1 + BAL.adoptSlow * Math.log2(1 + adopted) + F.lateSlow(adopted),
  happyRate(seated, toys, trait, sleep, adopted) {
    let r = (BAL.happyBase + BAL.happySeat * Math.min(seated, BAL.happySeatCap)) * (1 + BAL.happyToy * toys);
    if (trait === '애교쟁이') r *= BAL.affection;
    if (trait === '새침데기') r *= BAL.aloof;
    if (sleep) r *= BAL.sleepMul;
    return r / F.slow(adopted);
  },
  lateSlow: adopted => BAL.adoptLate * Math.pow(Math.max(0,adopted-4),2) + Math.pow(BAL.adoptLong,Math.max(0,adopted-12))-1,
  activityHappy: (amount, adopted) => amount / (1 + F.lateSlow(adopted)),
  tapCoin(seatedIncome, subsInc, trait) {
    return Math.max(1, BAL.tapIncomeFrac * (seatedIncome + subsInc) + BAL.tapFlat) * (trait === '장난꾸러기' ? BAL.mischief : 1);
  },
  adoptBase: (menuLv, seatCap, adopted) => BAL.adoptBase + F.perCust(menuLv) * seatCap * BAL.adoptMenuSeat + adopted * BAL.adoptPerAdopted,
  adoptReward(menuLv, seatCap, adopted, skill, trait, newCombo) {
    return Math.floor(F.adoptBase(menuLv, seatCap, adopted) * (1 + skill * BAL.adoptSkill) * (trait === '새침데기' ? BAL.aloofReward : 1) * (newCombo ? 1 + BAL.firstCombo : 1));
  },
  trainCost: (menuLv, seatCap, adopted, skill) => Math.floor(F.adoptBase(menuLv, seatCap, adopted) * BAL.trainFrac * Math.pow(BAL.trainGrowth, skill)),
  trainMult: lv => Math.pow(BAL.trainerMul, lv),
  trainTime: (skillLv, trainerLv) => BAL.trainTimes[Math.min(skillLv, BAL.trainTimes.length - 1)] * F.trainMult(trainerLv),
  walkCap: lv => 1 + Math.floor(lv / 2),
  walkReward: (menuLv, seatCap, course) => Math.floor((BAL.walkBase + F.perCust(menuLv) * seatCap * BAL.walkMenuSeat) * (1 + course * BAL.walkCourse)),
  filmSubs(skill, cam, sleepy, rand) {
    rand = rand || Math.random;
    let s = (BAL.filmBase + BAL.filmSkill * skill) * (1 + BAL.camBonus * cam) * (BAL.filmRndMin + rand() * (BAL.filmRndMax - BAL.filmRndMin)) * (sleepy ? BAL.sleepyFilm : 1);
    const viral = rand() < BAL.viralP; if (viral) s *= BAL.viralMul;
    return { subs: Math.max(1, Math.floor(s)), viral };
  },
  offlineCap(adopted) { let c = 0; for (const [n, s] of BAL.offlineCapSec) if (adopted >= n) c = s; return c; },
};
if (typeof process !== 'undefined' && process.env && process.env.BAL_OVERRIDE) { const o = JSON.parse(process.env.BAL_OVERRIDE); for (const k in o) { if (k.includes('.')) { const [a, b, c] = k.split('.'); if (c) BAL[a][b][c] = o[k]; else BAL[a][b] = o[k]; } else BAL[k] = o[k]; } }
const api = { BAL, F };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.SC = api;
})(this);
