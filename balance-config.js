/* 수인님 core-loop.md v0.6: 조정 가능한 경제 수치의 단일 원본. */
(function(root){'use strict';
const legacy = {
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
const CONFIG = {
 legacy,
 schemaVersion:3, saveIntervalSec:30,
 seats:2, initialPups:2, gardenPups:1, maxZone:2,
 draw:{probabilities:{N:70,R:23,SR:6,SSR:1},pity:{R:10,SR:40,SSR:120},fragments:{N:5,R:8,SR:15,SSR:30},discoveryPity:10,
 // 기존 20종 중 네 털색·다섯 성격을 모두 소개. 레드 중심이며 성격 수입 우열 없음.
 identities:['red_잠꾸러기','red_장난꾸러기','sesame_새침데기','blacktan_먹보','white_애교쟁이'],
 single:1,ten:10,tutorialTickets:3,dailyTickets:1,careTickets:1,coinDaily:1,coinMinutes:20},
 level:{max:10,growth:.08,fragmentCoefficient:5,coinCoefficient:500},
 rarity:{N:1,R:1.25,SR:1.6,SSR:2.2},
 adoption:{base:5000,training:.25,trainingMax:5,reputation:10,reputationTraining:.1},
 economy:{teaPrice:20,orderSec:10,staySec:30,baseDemandPerMin:5,shibaBonus:.05,shibaBonusMax:.30,topPups:3,subscriberBonusMax:.10,subscriberDiv:10000,totalBonusMax:.40,subscriberPerMin:.2,subscriberIncomeCap:.30,filmSubs:20,filmCooldownSec:1800,offlineMinutes:480,offlineFraction:.5},
 garden:{minutes:20,adoptions:2,buildSec:30},
 decor:{ids:['lamp_paper','vase','bonsai','sign_paw'],demand:.02,stay:.01,setBonus:.02,demandCap:.20,stayCap:.10,prices:{lamp_paper:300,lamp_sakura:2500,bonsai:600,stone_lamp:1200,vase:450,sign_paw:800}},
 ads:{dailyTotal:10,gapSec:0,adopt:{daily:2,multiplier:2},boost:{daily:2,durSec:300,afterSec:0,minPlaySec:0,multiplier:2},ticket:{daily:1,tickets:1},demand:{daily:2,durSec:600,bonus:.5},offline:{daily:3,minAwaySec:0,multiplier:2}},
 invite:{monthlyMax:5,stages:[{days:2,tutorial:true,reward:'초대 기념 등불'},{days:7,adoptions:5,reward:'초대 한정 시바',rarity:'R'},{days:14,zone:3,reward:'우정 정원 인테리어'}]},
 products:[{id:'reward_pass',name:'광고 없이 보상 즉시 수령',krw:5500,usd:3.99},{id:'starter',name:'외형 전용 스타터팩',krw:3900,usd:2.99}],
 star:{rarity:'R',level:5,training:3,happiness:100,subscribers:500,slots:1,daily:2,cooldownHours:4,activities:[{name:'소품 광고 촬영',hours:2,coins:1500,menuStage:1},{name:'작은 팬미팅',hours:4,coins:3000,menuStage:2},{name:'정원 행사',hours:8,coins:5000,menuStage:3}]},
 share:{weekly:1,weekDays:7,frames:4}, tutorial:{petCount:3,minHappyRate:.6}
};
legacy.ads=CONFIG.ads;legacy.offlineCapSec=[[0,CONFIG.economy.offlineMinutes*60]];legacy.offlineIncome=CONFIG.economy.offlineFraction;
if(typeof module!=='undefined'&&module.exports)module.exports=CONFIG;else root.BalanceConfig=CONFIG;
})(this);
