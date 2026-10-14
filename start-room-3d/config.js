// 시바카페 spec v3 — every tunable lives here. Each value carries its spec source (갱신 N = "v3 갱신 N" in spec-v3.md).
// Rule: numbers come from the spec only. Anything the spec leaves undecided is `null` with a comment "UNSET: <spec ref>";
// code that depends on an UNSET value disables that feature (button off / "미정" label) instead of guessing.
const U=null; // marker for UNSET values (kept as plain null so JSON saves stay simple)

// 갱신 75 손님 압박 표 (갱신 73·74 대체): [시바 칸, 손님 상한, 손님 오는 간격(초), 한계 대비 %] for café levels 1..50
const PRESSURE=[
 [2,5,7.5,125],[2,5,6.6,110],[2,5,5.1,85],[3,7,5.4,125],[3,7,4.7,110],[3,7,3.6,85],[4,9,4.2,125],[4,9,3.7,110],[4,9,3.3,98],[4,9,2.8,85], // 갱신 75 pressure table
 [5,11,3.4,125],[5,11,3.0,110],[5,11,2.8,102],[5,11,2.5,93],[5,11,2.3,85],[6,14,2.5,125],[6,14,2.2,110],[6,14,2.0,102],[6,14,1.9,93],[6,14,1.7,85], // 갱신 75 pressure table
 [7,16,2.2,125],[7,16,1.9,110],[7,16,1.8,104],[7,16,1.7,98],[7,16,1.6,91],[7,16,1.5,85],[8,18,2.0,125],[8,18,1.7,110],[8,18,1.7,105],[8,18,1.6,100], // 갱신 75 pressure table
 [8,18,1.5,95],[8,18,1.4,90],[8,18,1.3,85],[9,20,1.8,125],[9,20,1.6,110],[9,20,1.5,106],[9,20,1.5,102],[9,20,1.4,98],[9,20,1.3,93],[9,20,1.3,89], // 갱신 75 pressure table
 [9,20,1.2,85],[10,22,1.6,125],[10,22,1.4,110],[10,22,1.3,106],[10,22,1.3,103],[10,22,1.2,99],[10,22,1.2,96],[10,22,1.2,92],[10,22,1.1,89],[10,22,1.1,85]]; // 갱신 75 pressure table

// 갱신 98 카페 레벨 경험치 (L→L+1, 갱신 87·91·92 대체; 132-4로 표 그대로 유지)
const CAFE_EXP=[120,220,370,520,740,1000,1850,1940,2050,2190,2860,3070,3300,3540,3800,5190,5560,5940,6340,6760, // 갱신 98 experience table; 132-4 unchanged
 8220,8730,9250,9790,10350,10920,12950,13620,14310,15020,15740,16480,17230,19990,20850,21730,22630,23540,24460,25400, // 갱신 98 experience table; 132-4 unchanged
 26350,30040,31120,32210,33310,34430,35570,36710,37870]; // 갱신 98 experience table; 132-4 unchanged

export const CFG={
 saveKey:'shibaCafe.save.v3',saveVersion:3, // EXEMPT: save schema version (engine metadata)

 // Removed unsupported build placeholders; null is preserved by the engine.
 pending:{
  startCoins:U, // UNSET: §1.4 starting coins unspecified
  intimacyStart:U, // UNSET: 갱신 82·90 starting intimacy unspecified
  gaugeStart:U, // UNSET: §1.2-3 starting gauges unspecified
  rescueLevel:U, // UNSET: 질문 9(사) rescue level unspecified
  starterAccessory:U, // UNSET: 갱신 139-6 accessory identity unspecified
  walkExtraReward:U, // UNSET: 갱신 82 reward branch unspecified
 },

 // ── 재화 ──
 start:{coins:U,hearts:10,dia:0}, // coins: UNSET 시작 멍코인. hearts: 기본 소지 10 (1.4, 갱신 28). dia: 유료로만 (132-2) → 0
 hearts:{regenCap:10,regenEverySec:1800}, // 1.4 / 갱신 28·31: 30분당 1개, 10개까지 자연 회복; 보상 하트는 무제한 적립
 heartReset:{fillTo:10}, // 1.4 / 갱신 32: 10개 미만일 때만 10개까지, 10개 이상이면 사용 불가(소모 없음)

 expansion:{rowCost:U}, // UNSET: interior §1 / spec v3 §1.3 land row cost
 themes:[
  {id:'tatami',name:'다다미',locked:false,unlockCost:null,art:'assets/drive/room-tatami-noline.png'}, // §1.3 default
  {id:'fuji',name:'후지산 벽화 카페',locked:true,unlockCost:U,art:null}, // §1.3 / interior §6 cost and art UNSET
  {id:'bamboo',name:'대나무 회랑',locked:true,unlockCost:U,art:null} // §1.3 / interior §6 cost and art UNSET
 ],
 furniture:{items:[{id:'tea-table',name:'찻상',price:U},{id:'zabuton',name:'방석',price:U},{id:'counter',name:'카운터',price:U},{id:'stairs',name:'계단',price:U}]}, // UNSET: 1.3 / F p6·9 furniture prices
 // ── 카페 ──
 cafe:{maxLevel:50, // 갱신 73
  customersPerHourPerCap:100, // 갱신 132-4 supersedes 갱신 75 arrival intervals
  pressure:PRESSURE, // 갱신 75 (interval column retained as source history only)
  expToNext:CAFE_EXP, // 갱신 98
  capFromSlots:2.2, // 갱신 70·71: 손님 상한 = 배치 가능 시바 수 × 2.2, 올림 (표 값과 일치; 표가 우선)
  maxPlaced:10, // 갱신 74
  maxOwned:50, // 갱신 75
  stayingSec:30, // 갱신 69: 손님 체류 시간
  queueMax:10, // 갱신 66
  queueWaitSec:30, // 갱신 68·69: 줄 대기 제한 = 체류 시간
  hourlyCustomersPerCap:100, // 갱신 132-4: 시간당 손님 = 100 × 손님 상한 (planning only; live sim uses customersPerHourPerCap)
  paidSlotUnlockDia:U, // UNSET: 갱신 87 유료 칸 미리 해제 — 다이아 가격 미정(132-3)
  expansion2FCost:U, // UNSET: 갱신 56 2층 확장 비용 미정
 },
 // 갱신 87 카페 경험치
 cafeExp:{custNormal:1,custSatisfied:2,custDisappointed:0,walkPer10Min:2,play:1,feed:1,bath:1,snack:1,rescueAdopt:10, // 갱신 87 café experience
  stainClean:1, // 갱신 101-3
  albaGivesExp:false}, // 갱신 99-2 · 118: 알바·훈련사·매니저가 한 일은 경험치 없음

 // ── 평판 (갱신 87, 106, 126) ──
 rep:{min:0,max:100,start:50,satisfied:1,normal:0,disappointed:-1,queueAngry:-2, // 갱신 87 reputation
  damp:[[90,.25],[70,.5]], // 갱신 106: 70 이상 만족 증가 절반, 90 이상 4분의 1
  driftPerHour:1,driftTo:50, // 갱신 106: 1시간마다 50 쪽으로 1점
  arrivalMul:[[70,.9],[30,1.0],[0,1.2]], // 갱신 87: ≥70 ×0.9, 30~69 ×1.0, <30 ×1.2 (간격 배율)
  closureFloor:30}, // 갱신 126-1: 오프라인 중 평판 하한 30 → 임시휴무

 // ── 손님 (갱신 70, 86, 100, 105, 106, 113, 120, 124-4, 128, 129) ──
 visit:{meetSec:7,roamSec:5, // 갱신 70: 손님 곁 7초, 5초 돌아다님
  scoreDisappointedBelow:.5, // 갱신 86: 합계 0.5 미만 실망
  scoreSatisfiedAt:1.5, // 갱신 86 (만족 판정은 갱신 106에서 '요구 충족'으로 바뀜 — notes 참고; 값은 기록용)
  condMin:.25,condMax:1.3, // 갱신 86
  trickBonusPerLevel:.05,trickBonusMax:.25}, // 갱신 100 손님 만남: +0.05 × 재주 단계, 최대 +0.25 (컨디션 상한 1.3 안)
 // 갱신 86 컨디션 배율 (곱해서 적용). 같은 게이지의 두 단계는 더 높은 단계 하나만 적용.
 condition:[
  {gauge:'dirt',atLeast:80,mul:.5},{gauge:'dirt',atLeast:60,mul:.7}, // 갱신 86 condition thresholds
  {gauge:'fatigue',atLeast:80,mul:.5},{gauge:'fatigue',atLeast:60,mul:.7}, // 갱신 86 condition thresholds
  {gauge:'full',atMost:30,mul:.8}, // 갱신 86 condition thresholds
  {gauge:'happy',atLeast:70,mul:1.2}], // 갱신 86 condition thresholds
 // 갱신 106 일반손님 요구 (124-4: 필수 아님, 안 들어줘도 벌 없음). 113: 인테리어 요구 — 인테리어 점수·아이템 미정이라 꺼 둠.
 requests:{types:['meetShiba','seeTrick'],interior:{enabled:false,minThemeItems:3}, // 갱신 113 '특정 테마 아이템 3개 이상' (인테리어 시스템 UNSET)
  managerChance:.3,managerRepMul:.5}, // 갱신 118
 // 갱신 120 결제 · 129 메뉴 개발(멍코인) · 134 메뉴 목록·주문 규칙 · 134-1 개발비 (134 표의 개발비는 134-1로 대체)
 income:{levelAggregation:U}, // UNSET 갱신 75·120: combining meeting-level effects and no-meeting fallback are undecided; payments gated
 menu:{coffee:{id:'M-01',price:1,img:'M-01-iced-americano_512.png'}, // 갱신 134: M-01 아이스 아메리카노 = 처음부터 있는 기본 커피 1멍 (120)
  // kind: drink/dessert = 일반 메뉴, premium = 프리미엄. unlockLevel·price = 갱신 134 표, devCost = 갱신 134-1 표, devSec = 갱신 136 개발 시간
  items:[
   {id:'M-02',kind:'drink',unlockLevel:2,devCost:8500,devSec:1800,price:3,img:'M-02-hot-latte_512.png'},            // 따뜻한 라테; 갱신 134·134-1·136 (level, cost, time, price)
   {id:'M-05',kind:'dessert',unlockLevel:3,devCost:10000,devSec:3600,price:5,img:'M-05-cheesecake_512.png'},        // 치즈케이크; 갱신 134·134-1·136 (level, cost, time, price)
   {id:'M-03',kind:'drink',unlockLevel:5,devCost:12000,devSec:7200,price:3,img:'M-03-strawberry-latte_512.png'},    // 딸기 라테; 갱신 134·134-1·136 (level, cost, time, price)
   {id:'M-06',kind:'dessert',unlockLevel:7,devCost:13500,devSec:10800,price:5,img:'M-06-chocochip-cookie_512.png'},  // 초코칩 쿠키; 갱신 134·134-1·136 (level, cost, time, price)
   {id:'M-04',kind:'drink',unlockLevel:9,devCost:15000,devSec:14400,price:3,img:'M-04-yuja-ade_512.png'},            // 유자 에이드; 갱신 134·134-1·136 (level, cost, time, price)
   {id:'M-07',kind:'dessert',unlockLevel:12,devCost:17000,devSec:21600,price:5,img:'M-07-croissant_512.png'},        // 크루아상; 갱신 134·134-1·136 (level, cost, time, price)
   {id:'M-08',kind:'dessert',unlockLevel:15,devCost:18500,devSec:28800,price:5,img:'M-08-strawberry-parfait_512.png'},// 딸기 파르페; 갱신 134·134-1·136 (level, cost, time, price)
   {id:'P-01',kind:'premium',unlockLevel:20,devCost:23500,devSec:43200,price:8,img:'P-01-gold-tiramisu_512.png'},    // 골드 티라미수; 갱신 134·134-1·136 (level, cost, time, price)
   {id:'P-02',kind:'premium',unlockLevel:25,devCost:27000,devSec:64800,price:8,img:'P-02-strawberry-whole-cake_512.png'}, // 딸기 홀케이크; 갱신 134·134-1·136 (level, cost, time, price)
   {id:'P-03',kind:'premium',unlockLevel:30,devCost:30500,devSec:86400,price:8,img:'P-03-montblanc_512.png'},        // 몽블랑; 갱신 134·134-1·136 (level, cost, time, price)
   {id:'P-04',kind:'premium',unlockLevel:35,devCost:32000,devSec:108000,price:8,img:'P-04-choco-fondant_512.png'},    // 초코 퐁당; 갱신 134·134-1·136 (level, cost, time, price)
   {id:'P-05',kind:'premium',unlockLevel:40,devCost:34000,devSec:129600,price:8,img:'P-05-macaron-trio_512.png'},     // 마카롱 3종; 갱신 134·134-1·136 (level, cost, time, price)
   {id:'P-06',kind:'premium',unlockLevel:45,devCost:35500,devSec:172800,price:8,img:'P-06-pavlova_512.png'}],         // 파블로바; 갱신 134·134-1·136 (level, cost, time, price)
  premiumDrinkPrice:3,premiumDessertPrice:5, // 갱신 120 고급 음료 3멍·고급 디저트 5멍 (134: 일반 음료/디저트를 1개 이상 개발해야 주문, 아니면 기본 커피)
  premiumBase:.05,premiumPerRepAbove50:.003,premiumSatisfiedBonus:.15,premiumCap:.4, // 갱신 120
  premiumPerNormalDeveloped:.01, // 갱신 134: 개발한 일반 메뉴 1개마다 고급 메뉴 기본 확률 +1%p (상한 40% 그대로)
  premiumUpgradeChance:.3, // 갱신 134: 고급 디저트 주문 → 프리미엄 1개 이상 개발 시 30% 확률로 프리미엄(8멍)
  drinkToDessert:[2,1], // 갱신 120: 음료:디저트 2:1
  devAtOnce:1,devMaxSec:172800}, // 갱신 136: 개발 시간이 지나야 완성, 최대 2일, 한 번에 1개
 itemIncome:{boostMul:1.2,boostHours:4,boostMaxHours:24,paidCapMul:1.5,priceDia:U}, // 갱신 97 시간제 수익 1.2배 · UNSET: 가격(다이아)
 navigation:{cellStepSec:U}, // UNSET: interior §§3·5·8; whole-cell walking speed unspecified
 offline:{capHours:12,stepSec:1}, // 갱신 56: 오프라인 수익 최대 12시간분. EXEMPT stepSec = engine integration step

 // ── 시바 ──
 breeds:['red','sesame','kuro','white'], // 1.2 기본 4종 (레어 4종 ⏸️ 보류)
 personalities:['prankster','shy','tomboy','sweet','mopey','lazy','curious','boss','peopleLover','dogLover','tomgirl','zoomies','fighter','foodie','walkLover'], // 1.2 13개 + 갱신 52 먹보·산책광 = 15
 personalityOdds:U, // UNSET: 질문 9(다) '성격별 확률은 모두 같나요?' → 성격을 뽑지 않음(시바의 성격 = 미정, 화면 '확률 미정'). {id:weight} 로 채우면 입양 때 뽑음
 level:{max:30,pawsPerLevel:20,dupPaws:10, // 갱신 138: Lv N→N+1 발바닥 20×N (81의 10×N 대체, 누적 8,700) · 81: 중복 1마리당 10
  incomePerLevel:.05}, // 갱신 81: ×(1 + 0.05×(레벨−1))
 // 갱신 139-1·139-2 활동 발바닥 (시바 개인, 하루 최대 없음). 알바가 대신한 활동도 똑같이, 매니저 운영 시간도 카페 근무
 activityPaws:{walk:2,play:1,cafeWorkHour:1,trickLevel:3, // 139-1: 직접 산책 1회 2, 놀아주기 1회 1, 카페 근무 1시간 1, 훈련 1단계 완료 3
  walkAlba:2,daycare:1,trainer:3,dailyCap:null}, // 139-2: 산책 알바 = 산책 2, 데이케어 = 놀아주기 1, 훈련사 = 훈련 1단계 3 · dailyCap null = '하루 최대 없음'(정해진 값)
 // 갱신 139-5·139-6 액세서리 칸: 시바마다 1칸, 해금해야 찰 수 있음 (90의 Lv5/15/25 칸, 139-3·139-4의 2·3칸 삭제)
 accessory:{slots:1,unlockPaws:1000,unlockDia:1000, // 139-5: 발바닥 1,000개 또는 1,000다이아(10,000원)
  starterSlotOpen:true,starterItems:1, // 139-6: 첫 시작 시바만 칸이 열린 채로 액세서리 1개 제공
  starterItem:U, // UNSET: 139-6 첫 시바에게 주는 액세서리가 어느 것인지
  // 갱신 140 액세서리 상점 · 140-1 액세서리 1개 = 한 번에 시바 1마리 (시바 수만큼 따로 사고, 옮기려면 벗김)
  bandana:{priceCoins:5000, // 140: 무료템 반다나 4종(F p11) × 원색 9색, 1개 5,000멍
   types:['triangle','loop','knotTail','frontKnot'], // 1.5 / F p11: 클래식 삼각형, 루프 스누드형, 매듭 테일형, 앞 매듭형
   // 원색 9색 (1.5·140): 색 이름·순서는 정해지지 않음 → 시트 칸 번호만 씀 (3×3, 왼쪽 위부터 cell1..cell9). 이름이 정해지면 i18n acc.color.<id>만 바꿈
   colorNames:U, // UNSET: 1.5 / 갱신 140 colour names and ordering; identify sheet cells only
   colors:['cell1','cell2','cell3','cell4','cell5','cell6','cell7','cell8','cell9'], // 갱신 86 condition thresholds
   legacyColorIds:['red','blue','green','yellow','pink','navy','orange','purple','teal'], // 이전 v3 저장의 id (같은 순서 = 같은 칸) → 불러올 때 cellN으로 바꿈
   sheet:{triangle:'bandana-triangle-sheet.webp',loop:'bandana-loop-sheet.webp',knotTail:'bandana-knottail-sheet.webp',frontKnot:'bandana-frontknot-sheet.webp'},
   grid:[3,3]}, // 시트 1장 = 3×3, 색 1개 = 칸 1개 (CSS 영역 표시만, 그림은 그대로); EXEMPT: sprite-sheet crop geometry
  special:{priceDia:300,items:U}}, // 140: 유료템 특별 액세서리 1개 300다이아(3,000원) · UNSET: 종류·디자인(그림 없음) → 빈 칸
 likes:{snacks:{basic:2,rare:1},toys:U,list:U}, // 갱신 40: 좋아하는 간식 기본 2 + 레어 1 · UNSET: 장난감 구조(제안), 간식·장난감 목록(질문 9(카))
 startShiba:{level:21,tricks:{sit:3,wait:3}}, // 갱신 90 레벨 21 · 갱신 100·109·133 앉아·기다려 3단계 · 갱신 109 4종 중 선택
 rescueLevel:U, // UNSET: 질문 9(사) 구조한 시바의 레벨
 intimacy:{min:0,max:100,start:U, // 갱신 82·90 range; UNSET: starting intimacy
  abandonShock:-15,abandonShockRepeat:-20,abandonRepeatWithinH:24}, // 갱신 82
 // 게이지 0~100 (1.2-3, 갱신 53·85·86·116). full=포만(배고픔 게이지), dirt=더러움(청결의 반대), fatigue=피로도(=졸림), happy=행복(=기분), boredom=지루함(=놀고 싶음)
 gauges:['full','dirt','fatigue','happy','boredom'],
 gaugeStart:U, // UNSET: 1.2-3 게이지 시작값
 gaugeFull:{full:100,dirt:0,fatigue:0,happy:100,boredom:0}, // 갱신 116: 모든 게이지 100%, 행복 만점
 decayPerHour:{full:U,dirt:U,happy:U,boredom:U,fatigue:U}, // UNSET: 1.2-3 질문 '게이지가 줄어드는 속도' → 자연 변화 없음
 homeDecayMul:.25, // 갱신 81: 집 시바는 카페 배치 시바의 1/4 속도
 sick:{zeroGauges:['full','dirt','happy'],zeroHours:2}, // 갱신 111: 배고픔·청결·기분 중 하나라도 0인 채로 2시간 (청결 0 = dirt 100)
 neglect:{intimacyDropAfterH:12,intimacyDrop:U,donguAfterH:24,donguStayMul:2,donguIntimacyDrop:U}, // 갱신 112 · UNSET: 친밀도 감소량
 // 갱신 85 산책 후 상태 변화 · 90 친밀도 · 88 놀아주기
 walkEffect:{600:{boredom:-40,dirt:15,fatigue:15,happy:10,intimacy:2},1200:{boredom:-55,dirt:25,fatigue:25,happy:15,intimacy:4},1800:{boredom:-70,dirt:35,fatigue:35,happy:20,intimacy:6}}, // 갱신 85·90 walk effects; durations 갱신 14
 care:{
  play:{hearts:1,boredom:-28,dirt:3,fatigue:5,happy:7,intimacy:3}, // 갱신 84·88·90 놀아주기
  feed:{full:U,cost:U}, // UNSET: 밥 회복량·비용 (1.2-3 질문)
  snack:{fatigue:U,cost:U}, // UNSET: 1.10.0 질문 9(다-2) 간식 1개당 피로 회복량, (다-3) 비용
  bath:{dirt:U,cost:U}, // UNSET: 내 시바 목욕 효과·비용 (구조견 목욕비는 hospital.rescueBath)
  sleep:{fatiguePerHour:U}, // UNSET: 1.10.0 질문 9(다-1) 수면 회복 속도 (수면 > 간식은 확정)
  fatigueMax:100}, // 1.10.0: 100%면 놀기·산책 불가, 잠만 잠
 potion:{bigDia:150,smallDia:50}, // 갱신 116 (다이아 = 유료 전용, stub)

 // ── 재주 (갱신 100 · 133) ──
 tricks:[{id:'sit'},{id:'paw'},{id:'wait'},{id:'down'},{id:'bow'}], // 갱신 133: 앉아·손·기다려·엎드려·인사. 더 넣으려면 여기에 추가(이름은 i18n trick.<id>)
 trickMaxLevel:5,intelligencePerLevel:4,intelligenceMax:100, // 갱신 133: 지능 = 단계 합 × 4, 최대 100
 training:{hearts:1,fatigue:5, // 갱신 100: 하트 1, 성공 시 피로 +5
  successBase:.6,bonuses:[{stat:'intimacy',atLeast:70,add:.15},{stat:'happy',atLeast:70,add:.10},{stat:'fatigue',atLeast:60,add:-.20},{stat:'boredom',atLeast:60,add:-.15}], // 갱신 100 training success table
  min:.2,max:.95}, // 갱신 100 성공률 · 단계 N→N+1 성공 N+1번

 // ── 산책 (1.10, 갱신 82·83·85·87·90·124·125) ──
 walk:{durationsSec:[600,1200,1800], // 갱신 14
  heartsPer10Min:1, // 갱신 87·124-5
  cooldownSec:0, // 갱신 125-1: 직접 산책 쿨타임 없음
  stopRule:U, // UNSET: 질문 1-4 멈췄을 때 규칙 → 멈추기 버튼 꺼 둠
  events:{rescue:.05, // 갱신 124-2 (82의 1/30 대체)
   snake:1/40,light:1/30, // 갱신 83
   extra:.5,extraCoins:U,extraHeart:1, // 갱신 82: 1/2 확률로 멍코인 소량 또는 하트 1 · UNSET: 멍코인 양 · 어느 쪽인지 → pending.walkExtraReward
   capsule:1/30}}, // 갱신 82 시바 뽑기권

 // ── 병원 (갱신 58·111·111-1·112·131) ──
 hospital:{stays:{light:1800,snake:7200,sick:14400}, // 갱신 111: 30분, 2시간, 4시간
  // 갱신 131 카페 레벨 구간별 고정 멍코인 [최저레벨, 가벼운 부상, 뱀 물림, 앓아누움, 구조견 목욕]
  costs:[[1,400,1200,2400,200],[10,500,1500,3000,250],[20,800,2400,4700,400],[30,1000,3000,6100,500],[40,1100,3400,6800,550]], // 갱신 131 hospital cost table
  }, // 치료 앞당기기 = timeSkip (갱신 135-2)

 // ── 알바 (갱신 99·99-2·118·118-1·123-x·124-1·125-1) ──
 alba:{
  daycare:{unlock:10,cost:8000,cooldownSec:7200,intimacyMul:.5}, // 갱신 99 · 125-1 가격 · 99-2 쿨 2시간
  walk:{unlock:15,cost:18000,cooldownSec:14400,maxShibas:4,boredom:-50}, // 갱신 125-1 가격 · 123-5 쿨 4시간·최대 4마리 · 123-3/124-1 지루함 50 즉시 해소
  trainer:{unlock:20,cost:24000,cooldownSec:14400}, // 갱신 125-1 · 99-2 쿨 4시간
  manager:{unlock:25,cost:60000,hireSec:43200,cleanEverySec:600}}, // 갱신 125-1 · 118-1 12시간 · 118 10분마다 얼룩 1개
 cooldownTicketDia:{one:20,five:80}, // 갱신 115-1 (유료 전용, stub)

 // ── 남은 시간 바로 완료 (갱신 135-2, 135·135-1 대체) ──
 timeSkip:{diaPerMin:1, // 1분당 1다이아(10원), 1분 단위 올림, 버튼 하나로 남은 시간 전부; 갱신 135-2
  targets:['hospital','daycare','walk','trainer','menu']}, // '치료와 알바 쿨타임 등 남은 시간이 있는 모든 대기' · menu = 메뉴 개발(갱신 136)

 // ── 얼룩 (갱신 101-3 · 117-2) ──
 stains:{everySecPerShiba:7200,warnAt:3,warnDirtMul:1.5,badAt:6,badDirtMul:2,badRepEverySec:600,badRep:-1}, // 갱신 101-3·117-2 stain thresholds

 // ── 동구 (갱신 78·79·80) ──
 dongu:{takesSlot:false,earns:false,canWalk:false,canAbandon:false},

 // ── 시바뽑기 (갱신 137: 132-3의 200다이아 대체) ──
 gacha:{priceDia:100,tenDia:900,tenCount:10, // 갱신 137: 1회 100다이아(1,000원), 10연차 900다이아(9,000원)
  startLevel:U, // UNSET: 질문 9(바) '뽑기로 나온 시바의 시작 레벨' (137은 '랜덤 레벨 아님'만, 138의 Lv1→30 계산은 추론) → 뽑기 비활성(확률표와 함께)
  dupPaws:10, // 갱신 137·81: 이미 가진 견종이 또 나오면 발바닥 10개 (레벨업 재료)
  priceCoins:U, // UNSET: 갱신 57 멍코인 뽑기 가격 → 멍코인 뽑기 없음
  breedOdds:U, // UNSET: 질문 9(바) 가챠 확률표 → 뽑기 비활성(버튼 '확률 미정'). {red:w,sesame:w,kuro:w,white:w} 로 채우면 열림
  video:'drive-images/영상/media-generation-gacha-reveal-video-v7-with-sfx.mp4'}, // not copied: 뽑기 disabled

 // ── stubs: confirmed systems outside the core, kept as config only ──
 stub:{
  ranking:{by:'cafeLevel',periodDays:7,excludeGM:true}, // 갱신 61·94·130 (보상표 94는 경험치 기준 → 130으로 기준만 바꿈)
  gmCafe:true, // 갱신 94
  missions:{daily:3,weekly:3}, // 갱신 101-2
  donguRequest:{everySec:21600,heartsMin:2,heartsMax:3}, // 갱신 101-5
  rudeCustomer:{chance:1/30,maxAtOnce:1,cooldownSec:600,fromLevel:5, // 갱신 104-1
   difficulty:{easy:{conds:1,sec:150,ok:1,fail:-2,stains:2},normal:{conds:2,sec:120,ok:2,fail:-3,stains:3},hard:{conds:3,sec:120,ok:4,fail:-4,stains:4}}, // 갱신 105-3
   mix:[[5,[6,4,0]],[15,[3,5,2]],[30,[2,4,4]]]}, // 갱신 105-3
  regulars:{becomeAfter:5,favMul:1.5,perHour:3,minIntervalSec:3600,dropAfterMisses:3,population:U}, // 갱신 102·108·122 · UNSET: '같은 손님'을 가를 손님 개체 수
  relations:{friendsMax:3,enemiesMax:3,fightChancePerMin:.1,fightSec:3,huffSec:2,fightInjury:1/20,fightHappy:-5,friendPickMul:2}, // 갱신 101-4·110·127
  shibaPlay:{checkIntervalSec:20,pairChance:.25}, // 1.7.1 · 갱신 127
  interior:{score:[0,100],recommended:{10:20,30:50,50:80},maxArrivalPenalty:.2,walkoutChance:.01}, // 갱신 113 (아이템별 점수 UNSET)
  expBoost:{mul:1.2,hours:4,maxHours:24,capTotal:.2,priceDia:U}, // 갱신 98 · UNSET 가격
  diaPriceWon:10, // 갱신 132-3
  // 1.4 · 갱신 29·33 28일 온보딩 (확정분만): 1~7일 하트 리셋권 1장, 캡슐 4·11·18·25일 1개 + 9일 5개 + 19일 10개. 3·17·26일 하트 개수 UNSET(질문 1(다)), 날짜 진행 방식 UNSET(보상표 Q5·Q6)
  onboarding:{days:28,dayMode:U,rewards:{1:{heartReset:1},2:{heartReset:1},3:{heartReset:1,hearts:U},4:{heartReset:1,capsule:1},5:{heartReset:1},6:{heartReset:1},7:{heartReset:1}, // §1.4 · 갱신 29·33 onboarding days and quantities
   9:{capsule:5},11:{capsule:1},17:{hearts:U},18:{capsule:1},19:{capsule:10},25:{capsule:1},26:{hearts:U}}}, // §1.4 · 갱신 29·33 onboarding days and quantities
  heartSources:{ads:U,friends:U}, // 갱신 54: 광고 시청·플레이어끼리 주고받기 — 방식·한도 UNSET
  adoptionIncome:U, // UNSET: 질문 4 입양 수익
  mergeCooking:U, // UNSET: 갱신 62
 },
 languages:['ko','en'], // 1.8·1.9
};

// helpers that only read CFG
export const isUnset=v=>v===null||v===undefined;
export const pressureAt=lv=>{const p=CFG.cafe.pressure[Math.max(1,Math.min(CFG.cafe.maxLevel,lv))-1];return {slots:p[0],cap:p[1],interval:p[2],pct:p[3]};}; // EXEMPT: array indexing and bounds, uses 갱신 75 table
