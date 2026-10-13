// All tunables for the 시바견 카페 game skeleton live here.
export const CFG={
 saveKey:'shibaCafe.save.v2', // key unchanged; the save's internal version `v` is bumped and old saves are migrated in sim.migrate()
 saveVersion:2,
 // ── switches ──
 // FEATURES: whole features whose numbers are only proposals (제안값) in the docs. All off until confirmed.
 FEATURES:{
  promotionCard:false, // D-04 대체 카드 연출 — 타이밍은 명세 1.6 '제안'값이라 꺼 둠
  fatigue:false,       // D-09 피로도 (= 핸드오프의 walk.fatigue.enabled) — 수치 전부 미정(질문 12)
  rescue:false,        // D-10 미아 시바 구조 — 발생 확률·등급 확률 미정(질문 18·19)
  healingPlay:false,healingTimeOfDay:false,healingObserve:false, // D-13 — 명세 1.7 수치는 모두 제안값
 },
 // TEMP: placeholder behaviours the handoff allows "for checking only" (// TEMP 미정). All off; `?temp=1` turns them on in a test build.
 TEMP:{
  gachaNonSAsN:false,
  onboardingLoginDays:false, // D-07 날짜 진행 방식(onboarding.dayMode) 미정(보상표 Q5 일반 출석과의 관계·Q6 빠뜨린 날): 켜면 '접속한 날짜 수 = 진행 일차'로 임시 진행
  mergeHandoffDefaults:false,
  walkFreeWhenCostNull:false, // D-08 산책 하트 소모량 미정(질문 9): 켜면 테스트 빌드에서만 무료로 보낼 수 있음
  walkStopNoRefund:false,     // D-08 멈췄을 때 규칙 미정(질문 11): 켜면 '즉시 복귀, 보상·환불 없음' // D-03 '같은 시바' 기준·자동/선택·병합 승급 연출 미정(질문 2-3 라·마·바): 켜면 핸드오프 임시값 sameKey 'coat+expr', mode 'manual', playPromotion false  // D-01 N·R 확률 미정(명세 질문 2): 켜면 S가 아닌 결과를 모두 N으로 처리(R 확률을 지어내지 않음), 화면에 확률 표시 안 함
 },
 // ── grades & levels (명세 1.6 ✅ 확정) ──
 grades:{bands:{N:[1,10],R:[11,20],S:[21,30]},maxLevel:30}, // grade is computed from level; start level of a pull = band start
 start:{coins:500,hearts:0,paws:3,shibas:[{coat:'red',expr:'red_smile'},{coat:'white',expr:'white_smile'}]},
 coats:{red:'적색',sesame:'참깨',kuro:'쿠로',white:'백시바'}, // display names come from i18n shiba.breed.<coat>
 // catalog p7-8 expressions (적색 9, 참깨·쿠로·백 3) — images assets/<id>.png
 exprs:{red_smile:'해맑은 미소',red_laugh:'함박웃음',red_yawn:'하품',red_wow:'깜짝',red_wink:'윙크',red_yum:'냠냠',red_pout:'삐침',red_love:'하트 눈',red_sleepy:'졸림',
  sesame_smile:'헤헤',sesame_wow:'깜짝',sesame_grin:'싱글',kuro_calm:'도도',kuro_wink:'윙크',kuro_laugh:'웃음',white_smile:'방긋',white_happy:'반가움',white_sweet:'다정'},
 coatExprs(c){return Object.keys(this.exprs).filter(k=>k.startsWith(c+'_'));},
 // floor geometry (world units) — seats face the table (+1 = looking toward +x)
 tables:[{x:-2.7,z:-.3},{x:-.5,z:.4}],
 seats:[{x:-3.25,z:-.85,face:1,table:0,via:{x:-4.1,z:-.85}},{x:-1.35,z:.4,face:1,table:1},{x:-.5,z:-.45,face:0,table:1,via:{x:.6,z:-.45}}], // all seats sit behind their table (2D depth)
 door:{x:1.6,z:3.2},aisleZ:1.7,
 roam:{x0:-4,x1:.9,z0:1.15,z1:2.2,speed:.65,idleMin:1,idleMax:3},
 customer:{speed:.9,spawnEvery:6,firstSpawn:1,waitBeforeVisit:1.5,visits:2,happyPause:1.2,payBase:40,payPerShiba:6,paws:1},
 visit:{climb:.9,pet:3.5,descend:.9,cooldown:3,heartsPerPet:1},
 cafe:{maxShibas:6},
 // D-03 병합 ✅ 확정: 같은 등급끼리만 · 레벨 += 재료 레벨 · 30에서 멈춤 · 승급은 레벨에서 자동 · 재료는 카페 목록에서 빠지고 도감은 유지.
 // ❓미정 → null: sameKey('같은 시바' 기준: 'coat+expr' | 'coat'), mode('manual' | 'auto'), playPromotion(병합 승급 때 연출 재생). null이면 병합 버튼은 '기준 미정'으로 꺼짐.
 merge:{sameKey:null,mode:null,playPromotion:null},
 // D-04 승급 연출: 필요는 ✅ 확정, 영상은 미정(videoAsset null). card = 영상 전 대체 카드 연출의 '제안' 수치(명세 1.6) → FEATURES.promotionCard 로 꺼 둠.
 promotion:{enabled:true,skippable:true,videoAsset:null,card:{zoomSec:.3,borderSec:.5,exprSec:1,totalSec:2.5}},
 // D-08 산책 ✅ 확정: 10/20/30분 선택(walkDurationSec 600/1200/1800) · 실시간·백그라운드 진행(walkStartAt) · 다음 실행 때 한 번만 정산 · 완료 알림 없음 ·
 //   도중 멈추기 가능 · 산책 중에도 카페 운영(산책 간 시바의 기여만 빠짐) · 비용은 하트(시간 비례).
 // ❓미정 → null: heartCost(질문 9, 넣을 때 {600:…,1200:…,1800:…}), reward(보상량), stopRule(멈췄을 때, 질문 11). 누가 가는지(질문 10) 미정 → 뼈대는 시바 1마리를 골라 보내는 것만.
 walk:{durationsSec:[600,1200,1800],heartCost:null,reward:null,stopRule:null,
  // D-09 피로도 (FEATURES.fatigue): 확정 = 산책할수록 쌓임, 최대치면 산책 시작 불가, 100%면 놀기·산책 불가·잠만 잠, 회복은 수면·간식(수면이 더 빠름). 수치 전부 미정(질문 12) → null.
  //   fatigue is stored per shiba as a 0..1 ratio (1 = 100%). max: 산책 시작 불가 기준(null → 100%), tiredAt: '피곤' 경계, gainBySec: {600:…} 산책 1회 증가량, sleepRecoverPerSec / snackRecover: 회복량.
  fatigue:{max:null,tiredAt:null,gainBySec:null,sleepRecoverPerSec:null,snackRecover:null},
  // D-10 미아 시바 구조 (FEATURES.rescue): 확정 = 등급 먼저 무작위 → 그 구간에서 레벨 무작위, 견종 기본 4종 무작위, 산책 중 장면, 닫혀 있던 동안 일어난 건 다음 실행 때 몰아서.
  //   ❓미정 → null: chance(산책 1회당 확률, null = 발생 0, 질문 19), gradeWeights({N,R,S}, 질문 18), levelDist('uniform' 등, 질문 18). 절차·거절·중복·하루 제한(질문 20·22·23)은 구현 안 함.
  rescue:{chance:null,gradeWeights:null,levelDist:null}},
 // D-05 하트 ✅ 확정(명세 1.4): 자연 회복 상한 10, 30분당 1개, 10개 이상이면 회복 타이머 멈춤. 보상 하트는 상한 없이 쌓임.
 hearts:{regenCap:10,regenEverySec:1800},
 // D-06 하트 리셋권 ✅ 확정: 하트 < 10 일 때만 10개로 채움, 10 이상이면 사용 불가(소모 없음). 아이콘 I-01 전까지 이모지.
 items:{heartReset:{icon:'🎟️',name:'하트 리셋권'},capsule:{icon:'🥚',name:'시바뽑기 캡슐'}}, // capsule = 1 free pull at normal rates (no grade guarantee)
 // D-07 28일 온보딩 — ✅ 확정분만: 1~7일 하트 리셋권 1장씩(7장) · 캡슐 4·11·18·25일 1개 + 9일 5개 + 19일 10개 = 19개(등급 보장 없음).
 // 3·17·26일 하트 개수 ❓미정(질문 8) → null('준비 중'). 멍코인·간식·장난감·다이아·인테리어는 보상표의 제안값이라 넣지 않음. ⏸️ 도장 지급 보류 → 넣지 않음.
 // dayMode ❓미정(Q5·Q6) → null: 일차가 진행되지 않음(CFG.TEMP.onboardingLoginDays로만 임시 진행). 튜토리얼 무료 첫 뽑기(Q4)는 기존 gacha.firstFree 그대로, 변경 없음.
 onboarding:{days:28,dayMode:null,rewards:{1:{heartReset:1},2:{heartReset:1},3:{heartReset:1,hearts:null},4:{heartReset:1,capsule:1},5:{heartReset:1},6:{heartReset:1},7:{heartReset:1},
  9:{capsule:5},11:{capsule:1},17:{hearts:null},18:{capsule:1},19:{capsule:10},25:{capsule:1},26:{hearts:null}}},
 upgrade:{base:300,grow:1.8,bonus:.25}, // 업그레이드: 방치 수입 +25%/단계
 idle:{perSec:.5,perShibaPerSec:.25},
 offline:{rate:.5,capHours:8,minSeconds:60},
 gacha:{cost:{paws:3},cost10:{paws:27},machineImg:'media/gacha-machine.jpg',firstFree:true,revealAt:6.7,video:'media/gacha-reveal.mp4',
  // S 2% ✅ 확정(명세 1.6). N·R ❓미정(명세 질문 2) → null. While N or R is null the pull is blocked ('확률 미정') unless CFG.TEMP.gachaNonSAsN.
  // grade has no stat effect yet (수익 배율 기준 미정, 질문 2-2)
  rates:{N:null,R:null,S:.02}},
 sfx:{click:{slot:'sfx-button-click',sec:.12},knob:{slot:'sfx-knob-turn',sec:.5},drop:{slot:'sfx-capsule-drop',sec:.6},reveal:{slot:'sfx-gacha-reveal',sec:10},fanfare:{slot:'sfx-success-fanfare',sec:1.2}}, // slots only: no audio files given yet
 // D-12 테마: 다다미 기본 + 후지산 벽화 카페 + 대나무 회랑(명세 1.3, F p8). 벚꽃·여름축제는 ⏸️ 보류로 뺌(이전 세이브는 기본 테마로).
 // 배경 그림 R-01·R-02 전까지 색만 바꾼 임시 테마(색은 자리표시용, 확정 아님). 가격 ❓미정 → null('가격 미정', 구매 불가).
 themes:[{id:'basic',nameKey:'theme.tatami.name',price:0,wall:'#e2cba6',tatami:'#d3c08e',light:'#ffe6c8'},
  {id:'fuji',nameKey:'theme.fuji.name',price:null,wall:'#cfdbe6',tatami:'#cdbf95',light:'#f4ecff'},   // TEMP 색: 벽화 그림(R-01) 전
  {id:'bamboo',nameKey:'theme.bamboo.name',price:null,wall:'#cfdcb4',tatami:'#c9c48c',light:'#eef8dc'}], // TEMP 색: 대나무 그림(R-02) 전
 quests:[{id:'serve5',goal:s=>s.served>=5,reward:{coins:200}}, // text: i18n quest.<id>
  {id:'hearts20',goal:s=>s.hearts>=20,reward:{paws:2}},
  {id:'own4',goal:s=>s.owned.length>=4,reward:{coins:300}},
  {id:'theme',goal:s=>s.themesOwned.length>=2,reward:{paws:3}}],
 tutorial:[ // lines: i18n tut.<index>
  {next:true},
  {done:s=>s.served>=1,reward:{coins:100}},
  {done:s=>s.gachaPulls>=1,highlight:'shiba',needsGacha:true},
  {next:true}],
 // D-11 언어 ✅ 확정: 첫 실행 언어 선택(한국어·English), 설정에서 언제든 변경. 저장 키 settings.language (BCP-47).
 // ❓미정(명세 1.8 질문, 질문 31): 기기 언어 기본값·로그인 전후·동구 등장·버튼 모양 → 핸드오프 임시 구현대로 세로 목록 + 기본 선택 없음, 기기 언어는 쓰지 않음.
 languages:['ko','en'],
 // D-13 힐링 3종 — 방향 ✅ 확정, 아래 수치는 명세 1.7의 '제안값(미정)' 그대로. 그래서 FEATURES.healingPlay / healingTimeOfDay / healingObserve 로 모두 꺼 둠.
 // 공통: 벌 없음, 손님 응대가 항상 먼저(놀이 중 손님 배정 → 같은 프레임에 중단).
 healing:{
  play:{checkIntervalSec:20,pairChance:.25,pairRadius:2.5,personalCooldownSec:90,globalCooldownSec:30,maxConcurrentPairs:1,heartOnTap:1,donguJoinChance:.15,approachMaxSec:4,
   personality:{red:'cheerful',sesame:'playful',kuro:'proud',white:'smiley'}, // F p2 성격 (해맑·개구쟁이·도도·방긋) ✅
   affinity:{cheerful:{cheerful:1,playful:1.5,proud:.8,smiley:1.3},playful:{playful:1.2,proud:.6,smiley:1},proud:{proud:.7,smiley:1.4},smiley:{smiley:1}}, // symmetric
   prefer:{playful:{chase:1.5,tug:1.5},proud:{sitTogether:1.5,napLean:1.5}},
   types:{chase:{dur:6,notAt:['night']},sniff:{dur:4},napLean:{dur:20,weightAt:{evening:2,night:2}},tug:{dur:6,needsToy:true},sitTogether:{dur:10}}},
  timeOfDay:{boundaries:{morning:'06:00',day:'11:00',evening:'17:00',night:'21:00'},transitionSec:20,checkIntervalSec:60,lockToggle:false,
   presets:{morning:{kelvin:5500,exposure:1},day:{kelvin:6000},evening:{kelvin:3500},night:{kelvin:2700,exposure:.75}},
   customerMix:{night:{countMul:.7,tipMul:1.43}}},
  observe:{idleThresholdSec:20,rollIntervalSec:15,rollChance:.35,tapWindowSec:8,cooldownSec:60,dailyRewardCap:{coins:100,stamp:5},
   // reward null: 도장 지급은 ⏸️ 보류라 도장 보상(petals·fireflies·moonWindow)은 넣지 않음. fireflies '여름' 달 범위 미정 → months null = 나오지 않음.
   // petals는 '정원 소품 보유' 조건 — 정원 소품 세트 아이템이 아직 없어 나오지 않음. 7종 완성 보상(인테리어 소품)은 아이템 체계가 없어 구현 안 함.
   events:{butterfly:{w:30,icon:'🦋',reward:{coins:5},tod:['morning','day']},sparrow:{w:30,icon:'🐦',reward:{coins:5},tod:['morning']},
    donguNap:{w:15,icon:'💤',reward:{hearts:1},tod:['day','evening']},petals:{w:10,icon:'🌸',reward:null,months:[3,4,5],needs:'gardenSet'},
    fireflies:{w:5,icon:'✨',reward:null,tod:['night'],months:null},shibaDream:{w:15,icon:'💭',reward:{hearts:1},tod:['night']},moonWindow:{w:3,icon:'🌕',reward:null,tod:['night']}}}},
};
