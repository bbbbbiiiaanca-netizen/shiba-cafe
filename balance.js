/* 시바견 카페 — 밸런스 상수·공식 (게임과 tests/balance-sim.js가 같이 씀) */
(function (root) {
'use strict';
const CONFIG = typeof module !== 'undefined' && module.exports ? require('./balance-config') : root.BalanceConfig;
const BAL = CONFIG.legacy;
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
