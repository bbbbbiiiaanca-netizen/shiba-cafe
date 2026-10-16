import {NEW_FURNITURE} from './furniture-data.js';
import GACHA_TABLE from './gacha-table.json' with {type:'json'};
export {GACHA_TABLE}; // 갱신 141 confirmed: single source for gacha probabilities and pity.
// i18n: Korean names/labels below (recipes, ingredients, quests, profiles, tutorial, heart items, themes, furniture, colours, village places)
// stay as data; the screen reads the same text from i18n.js STR by key (recipe.*, ingredient.*, quest.task.*, profile.*, tutorial.N,
// heart.item.*, theme.*, furn.*, acc.color.*, place.*). tests/i18n.test.mjs keeps both in sync.
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

// Café EXP fitted from tests/balance-results.json, 20h/day, mean XP 1.1, ×1.5 first 14 days.
// starting value 2026-10-15, pending user confirm: seat schedule 2→20; target days 10/80/215/425/735.
const CAFE_EXP=[7187,7187,11293,10853,10853,14813,14227,18480,18480,99792,77000,77000,77000,62216,62216,75768,75768,75768,91168,175824,177012,175824,175824,175824,206712,206712,239976,239976,239976,421344,421344,421344,417648,413952,413952,460152,460152,511896,511896,755656,750200,752928,752928,755656,755656,826584,826584,826584,886600];

export const CFG={
 // §17-14 시바 상세 = 펼친 책 팝업. Frame art pending (empty popup of the same ratio). Boxes are [x,y,w,h] in frame px; starting values until 그림이 gives coordinates.
 profileBook:{frame:'assets/drive/ui/ui-shiba-book-frame.png',size:[1080,1600], // interior UI_시바상세_책틀.png 1VZRsBZT…; paper (lower page) = [88,804,900,532]
  boxes:{art:[88,153,900,561],paper:[88,804,900,532],intro:[112,828,852,202],favs:[112,1042,852,138],friends:[112,1192,852,120]}, // 그림이 coordinates (frame px)
  careGap:16, // 똑또기 starting value 2026-10-15: 돌봄 button outside the frame, centred just below it, 16px gap
  close:{right:-14,top:-14},knockoutMin:240}, // starting value: close button outside the frame, top-right (CSS px)
 itemGet:{dimAlpha:0.75, // 시작값 2026-10-15(똑또기): 아이템 획득 팝업 아래 검정 75% 어두운 막(상단 바·패널·탭 줄까지 화면 전체)
  rays:{src:'assets/drive/ui/ui-itemget-glow.png',size:[1024,1024],spinSec:8}}, // 빛 효과 = interior 1XGANByL… (아이템획득_빛효과.png, 확정본; 이전 198nrcFL… 대체). spinSec 8 = 한 바퀴 8초, 시작값 2026-10-15(똑또기) // 빛줄기 = interior 198nrcFL… (UI_팝업_빛줄기.png)
 // §17-13 starting value 2026-10-15, pending user confirm: 3 slots, 30–300 sec; energy 1/2.
 // ── 임시 값 (TEMP, 코코아 요청 2026-10-15 via 똑또기 검수): everything in this block is a placeholder until confirmed ──
 cooking:{ingredientBuyCount:1,dishesPerCraft:1, popupHeightPct:0.56,popupAlign:'center', // 수인님 10-15: 높이 56% 유지, 화면 정가운데(위아래·좌우)
 lockedPreview:[{unlockLevel:3},{unlockLevel:5}], // 똑또기 10-15 시작값: 처음 3가지 뒤 잠긴 카드(빈 그림 칸) Lv3·Lv5
  // 임시
  fxIcons:{full:null,happy:null}, // 미정: 배고픔·행복 효과 아이콘(interior 그림 없음 → 글자만)
  startUnlocked:1,craftSecRange:[30,300], // 임시: 1 recipe open at start, others by unlockLevel
  recipes:[ // 임시 recipes. 이름은 여기 한 곳(수인님 10-15: 단호박 시바 죽·고구마 쿠키·닭가슴살 미트볼). img = 완성 음식 그림: 쿠키·미트볼 새 그림이 오면 이 경로만 바꾼다
   {id:'recipe-1',img:'assets/drive/cooking/dish-shiba-porridge.png',name:'단호박 시바 죽',unlockLevel:1,ingredients:{rice:1,carrot:1},craftSec:30,effect:{full:20,happy:10}}, // 임시
   {id:'recipe-2',img:'assets/drive/cooking/dish-sweet-potato-cookie.png',name:'고구마 쿠키',unlockLevel:1,ingredients:{sweetPotato:1},craftSec:60,effect:{full:15,happy:15}}, // 임시
   {id:'recipe-3',img:'assets/drive/cooking/dish-chicken-meatball.png',name:'닭가슴살 미트볼',unlockLevel:1,ingredients:{chicken:1},craftSec:90,effect:{full:25,happy:10}}]}, // 임시
 ingredients:{rice:{name:'쌀',price:50,img:'assets/drive/cooking/ing-rice.png'},carrot:{name:'당근',price:50,img:'assets/drive/cooking/ing-carrot.png'},sweetPotato:{name:'고구마',price:80,img:'assets/drive/cooking/ing-sweet-potato.png'},chicken:{name:'닭고기',price:120,img:'assets/drive/cooking/ing-chicken.png'}}, // 임시 prices (멍); img = 256 transparent art from 그림이 (pending, slot stays empty)
 quests:{daily:{resetKST:'00:00',reward:null, // 임시 reset time; reward UNSET
   tasks:[{id:'serve',name:'손님 3명 받기',goal:3,tab:'manage',icon:'assets/drive/ui/tab-manage.png'}, // 임시
    {id:'pet',name:'시바 1마리 쓰다듬기',goal:1,tab:'shiba',icon:'assets/drive/ui/tab-shiba.png'}, // 임시
    {id:'sell',name:'메뉴 1잔 판매',goal:1,tab:'manage',icon:'assets/drive/ui/tab-manage.png'}]}, // 임시
  dongu:{chapters:null},instantDia:10}, // 임시: 즉시완료 10다이아
 profiles:{red:{intro:'활발하고 사람을 좋아해요',favSnack:{name:'육포'},favPlay:{name:'공 굴리기'}}, // 임시
  white:{intro:'조용하고 다정해요',favSnack:{name:'우유 과자'},favPlay:{name:'햇살 낮잠'}}, // 임시
  sesame:{intro:'호기심이 많아요',favSnack:{name:'고구마칩'},favPlay:{name:'짧은 산책'}}, // 임시
  kuro:{intro:'쿨해 보이지만 잘 챙겨요',favSnack:{name:'연어 스틱'},favPlay:{name:'줄다리기'}}}, // 임시
 friendCafe:{room:'assets/drive/room-tatami-noline.png',roomSize:[861,615], // 임시: friend café = our approved room art, view-only
  furniture:[{src:'assets/drive/furn-counter-v4.png',x:30,y:30,w:24},{src:'assets/drive/furn-tea-table-v4.png',x:52,y:56,w:20},{src:'assets/drive/furn-cushion-v4.png',x:40,y:64,w:11},{src:'assets/drive/furn-cushion-v4.png',x:64,y:66,w:11}], // 임시 배치 (% of room, x/y = sprite centre)
  shiba:{x:60,y:48,w:16}}, // 임시: friend's shiba position
 tutorial:{steps:[ // 임시 문구 (첫 실행 동구 안내, v3 흐름 순서); tab = 안내와 함께 열 탭
  {text:'어서 와요! 저는 이 카페의 간판견 동구예요.',tab:null},
  {text:'손님이 오면 시바를 데려다 주세요. 시바를 만나면 손님이 기뻐해요.',tab:null},
  {text:'가게관리에서 메뉴를 개발하고 카페를 키울 수 있어요.',tab:'manage'},
  {text:'시바들 탭에서 시바를 눌러 소개를 보고 돌봐 주세요.',tab:'shiba'},
  {text:'오른쪽 위 미션을 하면 보상을 받아요. 그럼 잘 부탁해요!',tab:'manage'}]},
 // ── end 임시 block ──
 shop:{itemCategories:{'tea-table':'interior',zabuton:'interior',stairs:'interior',counter:'kitchen'}, // starting value 2026-10-15, pending user confirm
  newItems:['tea-table','zabuton','stairs','counter'], // starting value 2026-10-15, pending user confirm: existing catalog launch badges
  decorScores:{'tea-table':null,zabuton:null,stairs:null,counter:null},themeLogos:{tatami:'assets/drive/ui/ui-theme-logo-tatami.png',fuji:null,bamboo:null},themeLogoSize:[256,128],luckyBoxArt:'assets/drive/ui/ui-lucky-box.png',luckyBoxArtSize:[512,512], // 행운 상자 = interior 1Fgl1U8v… ; 다다미 logo (256×128) pending
   // logo/lucky box art pending (empty frames)
  luckyBoxPrices:{dia:null,coin:null,heart:null}}, // UNSET decor/logo art/lucky box prices pending 똑또기
 run:{bg:'assets/drive/run/bg-ingredient-run-v2.png', /* 재료달리기_배경_v2.png 1080×1920 위아래 반복 */
  // §17-13 재료 달리기 시작값(똑또기 2026-10-15, 수인님 확인 전): 1080×1920 세로, 위로 달림, 3레인, 좌우 스와이프·방향키, 점프 없음
  screen:[1080,1920],lanes:3,
  obstacles:{puddle:'assets/drive/run/obs-puddle.png',flowerpot:'assets/drive/run/obs-flowerpot.png',bicycle:'assets/drive/run/obs-bicycle.png',cat:'assets/drive/run/obs-cat.png'}, // 장애물 4종(웅덩이·화분·자전거·고양이) interior; null이면 나오지 않음
  // ── 시작값 2026-10-15 (똑또기 확정, 수인님 확인 전) ──
  laneX:[330,540,750],shibaY:1480,shibaW:300,shibaBlend:'multiply', runSheets:{red:{src:'assets/drive/run/run-red-back-sheet.png',frameW:360,frameH:480,frames:4,fps:10},white:{src:'assets/drive/run/run-white-back-sheet.png',frameW:360,frameH:480,frames:4,fps:10},sesame:{src:'assets/drive/run/run-sesame-back-sheet.png',frameW:360,frameH:480,frames:4,fps:10},kuro:{src:'assets/drive/run/run-kuro-back-sheet.png',frameW:360,frameH:480,frames:4,fps:10}}, /* 적시바(v2)·백시바(v2)·참깨·쿠로 뒷모습 달리기 시트(투명) → multiply 끔. fps 10 = 시작값 2026-10-15. 다른 시바는 시트가 올 때까지 기존 그림+multiply */ /* 시작값 2026-10-15: 화면 배치(1080 기준 px). 기존 시바 그림은 흰 배경(투명 아님) → 파일은 그대로 두고 화면에서만 곱하기 합성. 투명 달리기 포즈가 오면 null */ obstacleW:230,itemW:150,
  speed:{start:700,end:1000}, // 시작값 2026-10-15: px/초(1080 기준), 한 판 동안 선형 증가
  lengthSec:45, // 시작값 2026-10-15: 한 판 길이(초)
  spawnSec:{start:0.8,end:0.5}, // 시작값 2026-10-15: 물건 나오는 간격(초), 끝날 때까지 선형 감소
  spawnMix:{obstacle:0.4,coin:0.35,ingredient:0.25}, // 시작값 2026-10-15: 장애물·코인·재료 비율
  hits:2, // 시작값 2026-10-15: 첫 부딪힘은 버티고 두 번째에 끝남(하트 2칸)
  heartImg:{full:'assets/drive/ui/res-heart.png',empty:'assets/drive/ui/res-heart-empty.png'}, // 기존 하트 그림
  scorePer:{coin:1,ingredient:1}, // 시작값 2026-10-15: 점수
  coinValue:10,grantIngredients:true, // 시작값 2026-10-15: 코인 1개 = 10멍, 재료는 1개씩 요리 재료 창고(s.ingredients)로
  daily:{free:5,adExtra:1,adMax:3},adsEnabled:false, // adsEnabled: 광고 승인 전 false → 광고 버튼 숨김, 무료 5판만(머니 2026-10-15). 시작값 2026-10-15: 하루 무료 5판, 광고 1번 = 1판 추가(하루 최대 3번). 광고 SDK는 스텁. 하루 = 기존 KST ledger day
  skip:{needRunToday:true,cost:1,rate:0.7}, // 시작값 2026-10-15: 오늘 직접 1판 이상 달린 뒤에만, 무료 판 1개 사용, 오늘 최고 판 보상(멍·재료)의 70% 즉시 지급(버림, 1개 이상 모은 항목은 최소 1개, 멍코인 1개 = coinValue 멍)
  shibaBonus:{perLevel:1,maxPct:50}, // 시작값 2026-10-15: 함께 달리는 시바 레벨 1당 코인 +1%, 최대 50%
  unlockLevel:3, // 시작값 2026-10-15: 카페 Lv3에 열림
  upgrades:null}, // 나중에 정함: 강화는 출시 버전에서 제외

 ledger:{periodMs:86400000,dayOffsetMs:32400000,historyDays:7,includeDiamonds:false,openFromPill:true,openFromStore:false}, // §15 starting value 똑또기 2026-10-14, pending user batch confirm: KST midnight day, 7 days kept, 멍코인만, opened from 멍코인 pill and 가게 tab
 saveKey:'shibaCafe.save.v3',saveVersion:3, // EXEMPT: save schema version (engine metadata)

 // Removed unsupported build placeholders; null is preserved by the engine.
 pending:{
  intimacyStart:U, // UNSET: 갱신 82·90 starting intimacy unspecified
  gaugeStart:U, // UNSET: §1.2-3 starting gauges unspecified
  starterAccessory:U, // UNSET: 갱신 139-6 accessory identity unspecified
  walkExtraReward:U, // UNSET: 갱신 82 reward branch unspecified
 },

 // ── 재화 ──
 start:{coins:30000,hearts:10,dia:300}, // coins: starting value 2026-10-15 (밸런스_2년.md §5), pending user confirm (was UNSET). hearts: 기본 소지 10 (1.4, 갱신 28). dia: starting value 2026-10-15 (밸런스_2년.md §5), pending user confirm (was 0 '유료로만' 132-2)
 // 처음 14일 뿌리기 (밸런스_2년.md §5). starting value 2026-10-15, pending user confirm. Starting wallet applies at newState; daily grants require mailbox claim.
 // Daily grants are merged with onboarding rewards in the claimable mailbox.
 grants14:{incomeBoostRemainingDay:10, // starting value 2026-10-15, pending user confirm: remaining boost on day 10
  dayMode:'calendar-KST', // starting value 2026-10-15, pending user confirm
  itemDays:{8:{incomeBoost4h:1},10:{cooldownTicket:5,incomeBoost4h:1},12:{potionBig:2},14:{incomeBoost4h:1}}, // starting value 2026-10-15, pending user confirm: income split unclear: 1 each on days 8/14; third boost on day 10; tickets 5, big potions 2

  start:{coins:30000,dia:300,items:{furnitureSet:5,bandana:1}}, // starting value 2026-10-15 (밸런스_2년.md §5), pending user confirm · coins/dia → CFG.start; five extra approved furniture items go to inventory; one existing bandana is chosen by the player
  days1to7:{fromDay:1,toDay:7,everyDays:1,coins:15000,dia:50,items:{heartReset:1,expBoost4h:1}}, // starting value 2026-10-15 (밸런스_2년.md §5), pending user confirm · heartReset = the same 확정 grant as stub.onboarding days 1–7 (not extra)
  days8to14:{fromDay:8,toDay:14,everyDays:2,coins:25000,dia:100}, // starting value 2026-10-15 (밸런스_2년.md §5), pending user confirm · 8·10·12·14 per user task; merged into mailbox
  items:[{item:'incomeBoost4h',count:3,day:U},{item:'cooldownTicket',count:5,day:U},{item:'potionBig',count:2,day:U}], // starting value 2026-10-15 (밸런스_2년.md §5), pending user confirm · 8~14일 row, day UNSET
  capsules:'stub.onboarding'}, // 캡슐 4·9·11일 (확정 온보딩) already live in stub.onboarding.rewards — not duplicated
 hearts:{regenCap:10, // 1.4 / 갱신 28·31, confirmed by user 2026-10-15: natural regen stops at 10
  slots:5, // confirmed by user 2026-10-15: top bar shows 5 heart slots; hearts above 5 → 5 full + '+N'
  regenEverySec:1800}, // 1.4 / 갱신 28·31: 30분당 1개; 보상 하트는 상한을 넘어 무제한 적립
 // §17-9: all numeric values below are starting value 2026-10-15, pending user confirm.
 heartUse:{incomeRatePerSec:null,affinity:{min:0,max:100,start:0,guestMul:null},walkAffinity:1,
  ads:{grant:1,burst:3,cooldownSec:1800,daily:10},buy:{hearts:5,dia:50},visit:{daily:20,hearts:1},invite:{daily:1,hearts:2},
  items:[
   {id:'call',name:'손님 부르기',level:0,cost:1,sec:600,guests:1.5,line:'손님 더 많이'},
   {id:'pet',name:'쓰다듬기',level:0,cost:1,shiba:true,affinity:3,daily:3,line:'친밀도 올리기'},
   {id:'play',name:'놀아 주기',level:0,cost:1,shiba:true,affinity:2,happy:10,line:'친밀도 · 행복'},
   {id:'snack',name:'간식',level:0,cost:1,shiba:true,happy:15,fatigue:-10,line:'행복 · 피로 회복'},
   {id:'walk',name:'산책',level:0,cost:null,line:'산책 · 친밀도'},
   {id:'praise',name:'칭찬해 주기',level:5,cost:1,sec:1800,satisfaction:1.5,line:'손님 만족 증가'},
   {id:'brush',name:'빗질·마사지',level:8,cost:1,shiba:true,sec:1800,affinity:null,fatigue:null,cleanliness:null,shibaMul:1.2,line:'시바 효과 증가'},
   {id:'music',name:'가게 음악',level:12,cost:1,sec:1800,stay:null,extraOrders:1,line:'머무르며 추가 주문'},
   {id:'blanket',name:'낮잠 이불',level:16,cost:1,sec:3600,happy:10,recovery:2,line:'행복 · 피로 회복'},
   {id:'recommend',name:'오늘의 추천 메뉴',level:20,cost:1,sec:3600,sales:1.3,price:1.1,menu:true,line:'추천 메뉴 고르기'},
   {id:'tasting',name:'메뉴 시식회',level:25,cost:2,sec:600,price:1.2,line:'메뉴 판매가 증가'},
   {id:'cookie',name:'행운 쿠키',level:30,cost:1,daily:3,minutes:15,rewards:{coins:null,paws:1,item:'heartReset'},odds:null,line:'행운의 선물 미정'},
   {id:'special',name:'특별 손님 초대',level:35,cost:3,guestsCount:3,tip:null,guestOdds:null,line:'특별 손님 초대'},
   {id:'talent',name:'시바 장기자랑',level:22,cost:2,minutes:30,tip:null,line:'관람 손님 팁'},
   {id:'treat',name:'간식 손님 대접',level:10,cost:1,line:'모두 완전 만족'},
   {id:'wish',name:'소원상자',level:40,cost:3,daily:1,choices:5,items:null,line:'다음 접속 선물'}
  ].map(x=>({...x,art:`assets/drive/ui/card-${({blanket:'nap',special:'vip'})[x.id]||x.id}.png`}))},
 heartReset:{fillTo:10}, // 1.4 / 갱신 32: 10개 미만일 때만 10개까지, 10개 이상이면 사용 불가(소모 없음)

 expansion:{maxSteps:8, // 똑또기 10-15 시작값: 땅 넓히기 최대 8단계 (비용 170,000 ×1.6 확정)
 rowCost:170000,rowMultiplier:1.6,rowRoundTiers:[[100000,1000],[1000000,10000],[Infinity,100000]],cameraEaseMs:400,markerMinScale:0.6,markerBounce:{periodSec:1.2,minScale:1.0,maxScale:1.1}}, // 똑또기 starting value 2026-10-15: exact ×1.6 chain; shown/charged price rounded: <100,000→1,000, 100,000–<1,000,000→10,000, ≥1,000,000→100,000; cameraEaseMs 400 and markerMinScale 0.6 (+ marker min draw scale) = starting values (approved 08:27); markerBounce 1.2s 1.0–1.1 = 똑또기 starting value 2026-10-15, pending user confirm
 themes:[
  {id:'tatami',name:'다다미',locked:false,unlockCost:null,art:'assets/drive/room-tatami-noline.png'}, // §1.3 default
  // unlockCost (멍코인) / unlockDia / unlockLevel: starting value 2026-10-15 (밸런스_2년.md §3), pending user confirm. art UNSET (interior §6). Theme UI offers either currency while retaining level gates.
  {id:'fuji',name:'후지산 벽화 카페',locked:true,unlockCost:2400000,unlockDia:1500,unlockLevel:20,art:null}, // starting value 2026-10-15 (밸런스_2년.md §3), pending user confirm: Lv20, 2,400,000멍 or 1,500다이아
  {id:'bamboo',name:'대나무 회랑',locked:true,unlockCost:5400000,unlockDia:3000,unlockLevel:35,art:null} // starting value 2026-10-15 (밸런스_2년.md §3), pending user confirm: Lv35, 5,400,000멍 or 3,000다이아
 ],
 bagUi:{ // 가방 아이콘 UI. 아이콘 경로만 바꾸면 교체됨. 그림이 시트(2026-10-16) 반영
  tabs:{furniture:'assets/drive/ui/bag/tab_furniture.png',items:'assets/drive/ui/bag/tab_item.png',acc:'assets/drive/ui/bag/tab_accessory.png'},
  items:{incomeBoost4h:'assets/drive/ui/bag/icon_income_boost.png',expBoost4h:'assets/drive/ui/bag/icon_xp_boost.png',cooldownTicket:'assets/drive/ui/bag/icon_cooldown.png',heartReset:'assets/drive/ui/bag/icon_heart_reset.png',potionBig:'assets/drive/ui/bag/icon_potion.png',potionSmall:'assets/drive/ui/bag/icon_potion_small.png',capsule:'assets/drive/ui/bag/icon_gacha_ticket.png'},
  furniture:{table:'assets/drive/ui/ui-icon-tea-table.png',cushion:'assets/drive/ui/ui-icon-zabuton.png',counter:'assets/drive/ui/ui-icon-counter.png',stairs:'assets/drive/ui/ui-icon-stairs.png',wall:'assets/drive/ui/bag/icon_partition_wall.png'}},
decor:{sakuraSet:{minItems:3,bonus:null /* 미정: 2-1 연출만 vs 10-12 업데이트 4개 세트 +2% 충돌, 똑또기 확인 */}},
furniture:{starterExtra:{table:1,cushion:2,counter:1,stairs:1}, // starting value 2026-10-15, pending user confirm: five extra approved-sprite items, unplaced
 // starting value 2026-10-15, pending user confirm: table 40,000; cushion 20,000; extra props 5,000 coins.
 items:[{id:'tea-table',name:'찻상',category:'furniture',price:40000},{id:'zabuton',name:'방석',category:'furniture',price:20000},{id:'counter',name:'카운터',category:'furniture',price:5000},{id:'stairs',name:'계단',category:'furniture',price:5000},...NEW_FURNITURE.map(it=>({...it,front:'assets/drive/furniture-v4/'+it.filename,price:null /* 미정 — 똑또기 확인 대기 */}))]}, // Prices: starting value 2026-10-15, pending user confirm; historical source: 1.3 / F p6·9 furniture prices
 // ── 카페 ──
 cafe:{seatRewards:Array.from({length:50},(_,i)=>Math.round(2+18*i/49)), // starting value 2026-10-15, pending user confirm: cumulative cushions earned, Lv1 2 → Lv50 20
  expansion2FDia:null, // UNSET: 2F diamond price
  maxLevel:50, // 갱신 73
  customersPerHourPerCap:100, // 갱신 132-4 supersedes 갱신 75 arrival intervals
  pressure:PRESSURE, // 갱신 75 (interval column retained as source history only)
  expToNext:CAFE_EXP, // starting value 2026-10-15, pending user confirm: fitted physical-seat curve, see BALANCE-2Y-2026-10-15.md
  capFromSlots:2.2, // 갱신 70·71: 손님 상한 = 배치 가능 시바 수 × 2.2, 올림 (표 값과 일치; 표가 우선)
  maxPlaced:10, // 갱신 74
  maxOwned:50, // 갱신 75
  stayingSec:30, // 갱신 69: 손님 체류 시간 · starting value 똑또기 2026-10-14, pending user batch confirm: may be exceeded while eating/playing
  queueMax:10, // 갱신 66 (live queue is also limited by navigation.queueCells)
  queueWaitSec:30, // 갱신 68·69: 줄 대기 제한 = 체류 시간
  hourlyCustomersPerCap:100, // 갱신 132-4: 시간당 손님 = 100 × 손님 상한 (planning only; live sim uses customersPerHourPerCap)
  paidSlotUnlockDia:U, // UNSET: 갱신 87 유료 칸 미리 해제 — 다이아 가격 미정(132-3)
  expansion2FCost:7000000, // starting value 2026-10-15 (밸런스_2년.md §3), pending user confirm: 2층 증축 7,000,000멍 (was UNSET, 갱신 56)
  expansion2FLevel:30, // starting value 2026-10-15 (밸런스_2년.md §3), pending user confirm: 2층 증축 Lv30부터
 },
 // 갱신 87 카페 경험치
 cafeExp:{custNormal:1,custSatisfied:2,custDisappointed:0,walkPer10Min:2,play:1,feed:1,bath:1,snack:1, // 갱신 87 café experience
  stainClean:1, // 갱신 101-3
  albaGivesExp:false}, // 갱신 99-2 · 118: 알바·훈련사·매니저가 한 일은 경험치 없음

 // ── 평판 (갱신 87, 106, 126) ──
 rep:{min:0,max:100,start:50,satisfied:1,normal:0,disappointed:-1,queueAngry:-2, // 갱신 87 reputation
  damp:[[90,.25],[70,.5]], // 갱신 106: 70 이상 만족 증가 절반, 90 이상 4분의 1
  driftPerHour:1,driftTo:50, // 갱신 106: 1시간마다 50 쪽으로 1점
  arrivalMul:[[70,.9],[30,1.0],[0,1.2]], // 갱신 87: ≥70 ×0.9, 30~69 ×1.0, <30 ×1.2 (간격 배율)
  closureFloor:30, // 갱신 126-1: 오프라인 중 평판 하한 30 → 임시휴무
  unmetFreeBelowLevel:5}, // starting value 2026-10-14, pending user confirm: early game ('손님 4명 이하' phase = café Lv < 5) a guest who met no shiba costs no reputation

 // ── 가게 관리 업그레이드 (§16 question 3 answer 2026-10-14) ──
 // price: UNSET → '미정', purchase disabled. maxLevel: UNSET → no known cap (purchase is still gated by price).
 // effect = per purchased level. queue +1 comes from the item name; interval/price magnitudes are UNSET (no effect while null).
 upgrades:{
  interval:{price:U,maxLevel:U,effect:U}, // UNSET: 손님 오는 간격 단축 — effect (interval multiplier per level), price, max level
  price:{price:U,maxLevel:U,effect:U}, // UNSET: 메뉴 판매가 인상 — effect (sale price multiplier per level), price, max level
  queue:{price:U,maxLevel:U,effect:1}}, // starting value 2026-10-14, pending user confirm: 대기 줄 연장 → +1 queue cell per level · UNSET price/max level

 // ── 손님 (갱신 70, 86, 100, 105, 106, 113, 120, 124-4, 128, 129) ──
 visit:{meetSec:5,roamSec:3, // starting value 2026-10-14, pending user confirm: interaction (meet) 5 s, then roam 3 s, then seek a guest (was 갱신 70 7 s / 5 s)
  scoreDisappointedBelow:.5, // 갱신 86: 합계 0.5 미만 실망
  scoreSatisfiedAt:1.5, // 갱신 86 (만족 판정은 갱신 106에서 '요구 충족'으로 바뀜 — notes 참고; 값은 기록용)
  condMin:.25,condMax:1.3, // 갱신 86
  trickBonusPerLevel:.05,trickBonusMax:.25}, // 갱신 100 손님 만남: +0.05 × 재주 단계, 최대 +0.25 (컨디션 상한 1.3 안)
 // 갱신 86 컨디션 배율 (곱해서 적용). 같은 게이지의 두 단계는 더 높은 단계 하나만 적용.
 condition:[
  {gauge:'dirt',atLeast:80,mul:.5},{gauge:'dirt',atLeast:60,mul:.7}, // 갱신 86 condition thresholds
  {gauge:'full',atMost:30,mul:.8}, // 갱신 86 condition thresholds
  {gauge:'happy',atLeast:70,mul:1.2}], // 갱신 86 condition thresholds
 // 갱신 106 일반손님 요구 (124-4: 필수 아님, 안 들어줘도 벌 없음). 113: 인테리어 요구 — 인테리어 점수·아이템 미정이라 꺼 둠.
 requests:{types:['meetShiba','seeTrick'],interior:{enabled:false,minThemeItems:3}, // 갱신 113 '특정 테마 아이템 3개 이상' (인테리어 시스템 UNSET)
  metRep:1, // starting value 똑또기 2026-10-14, pending user batch confirm: met request → price unchanged (order fixed at sit), reputation +1 (갱신 106 high-reputation damping still applies)
  managerChance:.3,managerRepMul:.5}, // 갱신 118
 // 갱신 120 결제 · 129 메뉴 개발(멍코인) · 134 메뉴 목록·주문 규칙 · 134-1 개발비 (134 표의 개발비는 134-1로 대체)
 income:{levelAggregation:effects=>effects.length?Math.max(...effects):CFG.income.noMeetingMultiplier,noMeetingMultiplier:1}, // confirmed 수인님 2026-10-14: max · noMeetingMultiplier: starting value 똑또기 2026-10-14, pending user batch confirm (x1.0)
 menu:{coffee:{id:'M-01',price:1,img:'M-01-iced-americano_512.png'}, // 갱신 134: M-01 아이스 아메리카노 = 처음부터 있는 기본 커피 1멍 (120)
  // kind: drink/dessert = 일반 메뉴, premium = 프리미엄. unlockLevel·price = 갱신 134 표, devSec = 갱신 136 개발 시간
  // devCost: starting value 2026-10-15 (밸런스_2년.md §3 수인님 확정), pending user confirm: 15× the 갱신 134-1 cost (in each comment), except 라테 M-02 = 15,000멍
  items:[
   {id:'M-02',kind:'drink',unlockLevel:2,devCost:15000,devSec:1800,price:3,img:'M-02-hot-latte_512.png'},            // 따뜻한 라테; 갱신 134·136 · devCost starting value 2026-10-15 (밸런스_2년.md §3), pending user confirm: 15,000멍, not 15× (was 8,500)
   {id:'M-05',kind:'dessert',unlockLevel:3,devCost:150000,devSec:3600,price:5,img:'M-05-cheesecake_512.png'},       // 치즈케이크; 갱신 134·136 · devCost starting value 2026-10-15 (밸런스_2년.md §3), pending user confirm: 15× 10,000
   {id:'M-03',kind:'drink',unlockLevel:5,devCost:180000,devSec:7200,price:3,img:'M-03-strawberry-latte_512.png'},   // 딸기 라테; 갱신 134·136 · devCost starting value 2026-10-15 (밸런스_2년.md §3), pending user confirm: 15× 12,000
   {id:'M-06',kind:'dessert',unlockLevel:7,devCost:202500,devSec:10800,price:5,img:'M-06-chocochip-cookie_512.png'}, // 초코칩 쿠키; 갱신 134·136 · devCost starting value 2026-10-15 (밸런스_2년.md §3), pending user confirm: 15× 13,500
   {id:'M-04',kind:'drink',unlockLevel:9,devCost:225000,devSec:14400,price:3,img:'M-04-yuja-ade_512.png'},           // 유자 에이드; 갱신 134·136 · devCost starting value 2026-10-15 (밸런스_2년.md §3), pending user confirm: 15× 15,000
   {id:'M-07',kind:'dessert',unlockLevel:12,devCost:255000,devSec:21600,price:5,img:'M-07-croissant_512.png'},       // 크루아상; 갱신 134·136 · devCost starting value 2026-10-15 (밸런스_2년.md §3), pending user confirm: 15× 17,000
   {id:'M-08',kind:'dessert',unlockLevel:15,devCost:277500,devSec:28800,price:5,img:'M-08-strawberry-parfait_512.png'},// 딸기 파르페; 갱신 134·136 · devCost starting value 2026-10-15 (밸런스_2년.md §3), pending user confirm: 15× 18,500
   {id:'P-01',kind:'premium',unlockLevel:20,devCost:352500,devSec:43200,price:8,img:'P-01-gold-tiramisu_512.png'},   // 골드 티라미수; 갱신 134·136 · devCost starting value 2026-10-15 (밸런스_2년.md §3), pending user confirm: 15× 23,500
   {id:'P-02',kind:'premium',unlockLevel:25,devCost:405000,devSec:64800,price:8,img:'P-02-strawberry-whole-cake_512.png'}, // 딸기 홀케이크; 갱신 134·136 · devCost starting value 2026-10-15 (밸런스_2년.md §3), pending user confirm: 15× 27,000
   {id:'P-03',kind:'premium',unlockLevel:30,devCost:457500,devSec:86400,price:8,img:'P-03-montblanc_512.png'},       // 몽블랑; 갱신 134·136 · devCost starting value 2026-10-15 (밸런스_2년.md §3), pending user confirm: 15× 30,500
   {id:'P-04',kind:'premium',unlockLevel:35,devCost:480000,devSec:108000,price:8,img:'P-04-choco-fondant_512.png'},   // 초코 퐁당; 갱신 134·136 · devCost starting value 2026-10-15 (밸런스_2년.md §3), pending user confirm: 15× 32,000
   {id:'P-05',kind:'premium',unlockLevel:40,devCost:510000,devSec:129600,price:8,img:'P-05-macaron-trio_512.png'},    // 마카롱 3종; 갱신 134·136 · devCost starting value 2026-10-15 (밸런스_2년.md §3), pending user confirm: 15× 34,000
   {id:'P-06',kind:'premium',unlockLevel:45,devCost:532500,devSec:172800,price:8,img:'P-06-pavlova_512.png'}],        // 파블로바; 갱신 134·136 · devCost starting value 2026-10-15 (밸런스_2년.md §3), pending user confirm: 15× 35,500
  premiumDrinkPrice:3,premiumDessertPrice:5, // 갱신 120 고급 음료 3멍·고급 디저트 5멍 (134: 일반 음료/디저트를 1개 이상 개발해야 주문, 아니면 기본 커피)
  premiumBase:.05,premiumPerRepAbove50:.003,premiumSatisfiedBonus:.15,premiumCap:.4, // 갱신 120
  premiumPerNormalDeveloped:.01, // 갱신 134: 개발한 일반 메뉴 1개마다 고급 메뉴 기본 확률 +1%p (상한 40% 그대로)
  premiumUpgradeChance:.3, // 갱신 134: 고급 디저트 주문 → 프리미엄 1개 이상 개발 시 30% 확률로 프리미엄(8멍)
  drinkToDessert:[2,1], // 갱신 120: 음료:디저트 2:1
  devAtOnce:1,devMaxSec:172800}, // 갱신 136: 개발 시간이 지나야 완성, 최대 2일, 한 번에 1개
 itemIncome:{boostMul:2,boostHours:.5,boostMaxHours:24,paidCapMul:1.5,priceDia:U}, // starting value 2026-10-15, pending user confirm: 30 min ×2; existing ceiling retained.
 navigation:{cellStepSec:.4,shibaCellStepSec:.5,queueWaitSec:30,queueReputation:0, // answer 똑또기 2026-10-14: editable starting values; queueWaitSec = the only 30 s limit (waiting for a seat)
  queueCells:4}, // starting value 똑또기 2026-10-14, pending user batch confirm: up to 4 queue cells on the grass outside the entrance, overflow guests turn back; floors without an entrance (stairs only) have no queue
 // interior §13 shiba poses. After a meeting the shiba roams visit.roamSec (3 s) then seeks a free guest; the meeting lasts visit.meetSec (5 s).
 behaviour:{eatSec:8, // starting value 똑또기 2026-10-14, pending user batch confirm: eating 8 s; a visit may run past stayingSec while eating/playing
  weights:{walk:40,lookAround:15,sit:15,tailWag:15,nap:15}, // starting value 똑또기 2026-10-14, pending user batch confirm: action odds in %
  walkCells:[2,4], // starting value 똑또기 2026-10-14, pending user batch confirm: a walk covers 2–4 cells
  durations:{lookAround:2,tailWag:2,sit:4,nap:10}}, // starting value 똑또기 2026-10-14, pending user batch confirm: seconds per pose (walk lasts its route)
 // interior §17-5·17-6 floats over a guest's head (layout constants: map-data.js FLOAT_LAYOUT)
 // heart float = request met only (incl. manager), confirmed by user 2026-10-15; meeting a shiba alone → coin only
 feedback:{floatSec:1}, // starting value 2026-10-14, pending user confirm: §17-5/17-6 '약 1초, 시작값' — rise and fade time of coin / heart / anger floats
 offline:{capHours:12,stepSec:1}, // 갱신 56: 오프라인 수익 최대 12시간분. EXEMPT stepSec = engine integration step

 // ── 시바 ──
 breeds:['red','sesame','kuro','white'], // 1.2 기본 4종 (레어 4종 ⏸️ 보류)
 personalities:['prankster','shy','tomboy','sweet','mopey','lazy','curious','boss','peopleLover','dogLover','tomgirl','zoomies','fighter','foodie','walkLover'], // 1.2 13개 + 갱신 52 먹보·산책광 = 15
 personalityOdds:U, // UNSET: 질문 9(다) '성격별 확률은 모두 같나요?' → 성격을 뽑지 않음(시바의 성격 = 미정, 화면 '확률 미정'). {id:weight} 로 채우면 입양 때 뽑음
 level:{max:GACHA_TABLE.maxLevel,pawsPerLevel:Number(GACHA_TABLE.pawPerLevel.split('*')[0]),dupPaws:GACHA_TABLE.dupToPaw, // 갱신 138: Lv N→N+1 발바닥 20×N (81의 10×N 대체, 누적 8,700) · 81: 중복 1마리당 10
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
   // Approved sheet colours, row-major; persisted cell IDs retained.
   colorNames:['빨강','파랑','초록','노랑','분홍','남색','주황','보라','청록'], // observed approved sheet row-major colours; stable cell IDs retained
   colors:['cell1','cell2','cell3','cell4','cell5','cell6','cell7','cell8','cell9'], // 갱신 86 condition thresholds
   legacyColorIds:['red','blue','green','yellow','pink','navy','orange','purple','teal'], // 이전 v3 저장의 id (같은 순서 = 같은 칸) → 불러올 때 cellN으로 바꿈
   sheet:{triangle:'bandana-triangle-sheet.webp',loop:'bandana-loop-sheet.webp',knotTail:'bandana-knottail-sheet.webp',frontKnot:'bandana-frontknot-sheet.webp'},
   grid:[3,3]}, // 시트 1장 = 3×3, 색 1개 = 칸 1개 (CSS 영역 표시만, 그림은 그대로); EXEMPT: sprite-sheet crop geometry
  special:{priceDia:300,items:U}}, // 140: 유료템 특별 액세서리 1개 300다이아(3,000원) · UNSET: 종류·디자인(그림 없음) → 빈 칸
 likes:{snacks:{basic:2,rare:1},toys:U,list:U}, // 갱신 40: 좋아하는 간식 기본 2 + 레어 1 · UNSET: 장난감 구조(제안), 간식·장난감 목록(질문 9(카))
 startShiba:{level:21,tricks:{sit:3,wait:3}}, // 갱신 90 레벨 21 · 갱신 100·109·133 앉아·기다려 3단계 · 갱신 109 4종 중 선택
 intimacy:{min:0,max:100,start:U, // 갱신 82·90 range; UNSET: starting intimacy
  abandonShock:-15,abandonShockRepeat:-20,abandonRepeatWithinH:24}, // 갱신 82
 // 게이지 0~100 (1.2-3, 갱신 53·85·86·116). full=포만(배고픔 게이지), dirt=더러움(청결의 반대), fatigue=피로도(=졸림), happy=행복(=기분), boredom=지루함(=놀고 싶음)
 gauges:['full','dirt','fatigue','happy','boredom'],
 gaugeStart:U, // UNSET: 1.2-3 게이지 시작값
 // §17-11 (똑또기 2026-10-15, starting values; 시바카페_멍가격_곡선검토.md §3): cafe-level multiplier on coin prices of decor (furniture/walls/themes), land rows and shop upgrades only — not menus/알바/2F
 priceTiers:[[10,1],[20,1.5],[35,2.5],[50,4]], // [max cafe level, ×]
 dia:{spendOrder:'freeFirst', // starting value 2026-10-15, pending user confirm: which 다이아 pool is spent first
  freeSkipGivesExp:false}, // §17-11: time-skips paid with free 다이아 give no EXP (mixed payment → EXP × paid share)
 // §17-16 rare coats by runtime recolour of existing art (test: tools/recolor-test.py); breeding = design only, build after recolour approval
 coats:{rare:{cream:{hue:38,satMul:0.30,valAdd:0.10},silver:{hue:210,satMul:0.06,valAdd:0.02},pink:{hue:345,satMul:0.55,valAdd:0.06}}}, // starting value 2026-10-15, pending user confirm: recolour params from the test
 breeding:{enabled:false,minCloseness:null,inheritParentCoat:null,rareMutation:null,cooldownSec:null,cost:null}, // UNSET pending 똑또기: probabilities/conditions
 tabs:{iconScale:{shiba:1.1}}, // starting value 2026-10-15, pending user confirm: 시바들 tab art drawn 1.1×
 village:{background:'assets/drive/village/village-map_v2.png',size:[1024,1536], // 똑또기 검수 통과 2026-10-15 village-map_v2 (건물이 바탕에 그려짐 → 스티커 art 없음)
  lots:[{x:485,y:460,w:270,h:270},{x:200,y:697.5,w:300,h:255},{x:822.5,y:745,w:355,h:280}], // 터치 영역(이미지 px, 중심·크기): 병원 x350–620 y325–595, 재료가게 x50–350 y570–825, 산책 x645–1000 y605–885
  places:[{id:'hospital',name:'병원',lot:0,icon:null,art:null},{id:'ingredients',name:'재료 가게',lot:1,icon:null,art:null},{id:'walk',name:'산책',lot:2,icon:null,art:null}]},
 view:{zoomMin:1,zoomMax:2}, // 수인님 확정 2026-10-15: 최대 2배: pinch/ctrl+wheel zoom range (1 = fit width)
 // 수인님·똑또기 2026-10-15 이동 규칙: 그림 한 장을 미끄러지듯 옮기지 않는다. 걷기 프레임이 있으면 프레임을 넘기며 걷고, 없으면 제자리 동작(idle)만.
 // walkFrames: 값이 있으면 그 파일들을 쓰고, null이면 probe 경로({key}/{dir}/{n})에 첫 프레임 파일이 실제로 있는지 런타임에 확인 → 파일을 추가하면 자동으로 걷는다.
 characters:{walkFrames:{manager:'assets/drive/chars/manager/manager-walk-{dir}-{n}.png',shiba:{red:null,white:null,sesame:null,kuro:null},guest:null,dongu:null},
  probe:'assets/drive/chars/{key}/walk-{dir}-{n}.png',probeDir:'front-dr',frameCount:4,shibaAnchor:null,shibaScale:0.52}, // shibaAnchor null → CHAR_SPRITES 종류별 발 위치(시루 [64,167]). shibaScale 1: 시루 불투명 키 ≈113px = 알바 150px의 3/4 (2026-10-15 시작값)
 people:{scale:1,withMapScale:true}, // starting value 2026-10-15, pending user confirm: people (manager/guests) were drawn at fixed 150 screen px ignoring map scale; now 150 art px × map scale × scale, foot anchor kept
 shibaRisk:{orange:50,red:80,highIsBad:['dirt','fatigue','boredom']}, // starting value 2026-10-15, pending user confirm: 'badness' 0–100 per gauge (full/happy inverted); ≥50 orange, ≥80 red; sick/injured red, hospital orange
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
  bath:{dirt:U,cost:U}, // UNSET: 내 시바 목욕 효과·비용
  sleep:{fatiguePerHour:U}, // UNSET: 1.10.0 질문 9(다-1) 수면 회복 속도 (수면 > 간식은 확정)
  fatigueMax:100}, // 1.10.0: 갱신 141: 100이면 산책만 불가
 potion:{bigDia:150,smallDia:50}, // 갱신 116 (다이아 = 유료 전용, stub)

 // ── 재주 (갱신 100 · 133) ──
 tricks:[{id:'sit'},{id:'paw'},{id:'wait'},{id:'down'},{id:'bow'}], // 갱신 133: 앉아·손·기다려·엎드려·인사. 더 넣으려면 여기에 추가(이름은 i18n trick.<id>)
 trickMaxLevel:5,intelligencePerLevel:4,intelligenceMax:100, // 갱신 133: 지능 = 단계 합 × 4, 최대 100
 training:{hearts:1,fatigue:5, // 갱신 100: 하트 1, 성공 시 피로 +5
  successBase:.6,bonuses:[{stat:'intimacy',atLeast:70,add:.15},{stat:'happy',atLeast:70,add:.10},{stat:'boredom',atLeast:60,add:-.15}], // 갱신 100 training success table
  min:.2,max:.95}, // 갱신 100 성공률 · 단계 N→N+1 성공 N+1번

 // ── 산책 (1.10, 갱신 82·83·85·87·90·124·125) ──
 walk:{durationsSec:[600,1200,1800], // 갱신 14
  heartsPer10Min:1, // 갱신 87·124-5
  cooldownSec:0, // 갱신 125-1: 직접 산책 쿨타임 없음
  stopRule:U, // UNSET: 질문 1-4 멈췄을 때 규칙 → 멈추기 버튼 꺼 둠
  events:{ // 갱신 141: MVP walk events
   snake:1/40,light:1/30, // 갱신 83
   extra:.5,extraCoins:U,extraHeart:1, // 갱신 82: 1/2 확률로 멍코인 소량 또는 하트 1 · UNSET: 멍코인 양 · 어느 쪽인지 → pending.walkExtraReward
   capsule:1/30}}, // 갱신 82 시바 뽑기권

 // ── 병원 (갱신 58·111·111-1·112·131) ──
 hospital:{stays:{light:1800,snake:7200,sick:14400}, // 갱신 111: 30분, 2시간, 4시간
  // 갱신 131 카페 레벨 구간별 고정 멍코인 [최저레벨, 가벼운 부상, 뱀 물림, 앓아누움]
  costs:[[1,400,1200,2400],[10,500,1500,3000],[20,800,2400,4700],[30,1000,3000,6100],[40,1100,3400,6800]], // 갱신 131 hospital cost table
  }, // 치료 앞당기기 = timeSkip (갱신 135-2)

 hospitalArt:{background:'assets/drive/bg-hospital-clinic.png', // 배경_병원진료실.png
  sick:{red:'assets/drive/hospital/sick-red-bandage.png',sesame:'assets/drive/hospital/sick-sesame-bandage.png',kuro:'assets/drive/hospital/sick-kuro-bandage.png',white:'assets/drive/hospital/sick-white-bandage.png'}}, // 시바_적시바·참깨·쿠로·백시바_아픔_붕대.png

 // ── 알바 (갱신 99·99-2·118·118-1·123-x·124-1·125-1) ──
 alba:{
  // cost: starting value 2026-10-15 (밸런스_2년.md §3 수인님 확정), pending user confirm: 15× the 갱신 125-1 price
  daycare:{unlock:10,cost:120000,cooldownSec:7200,intimacyMul:.5}, // 갱신 99 · 99-2 쿨 2시간 · cost starting value 2026-10-15 (밸런스_2년.md §3), pending user confirm: 15× 8,000
  walk:{unlock:15,cost:270000,cooldownSec:14400,maxShibas:4,boredom:-50}, // 123-5 쿨 4시간·최대 4마리 · 123-3/124-1 지루함 50 즉시 해소 · cost starting value 2026-10-15 (밸런스_2년.md §3), pending user confirm: 15× 18,000
  trainer:{unlock:20,cost:360000,cooldownSec:14400}, // 99-2 쿨 4시간 · cost starting value 2026-10-15 (밸런스_2년.md §3), pending user confirm: 15× 24,000
  manager:{unlock:25,cost:900000,hireSec:43200,cleanEverySec:600}}, // 118-1 12시간 · 118 10분마다 얼룩 1개 · cost starting value 2026-10-15 (밸런스_2년.md §3), pending user confirm: 15× 60,000
 cooldownTicketDia:{one:20,five:80}, // 갱신 115-1 (유료 전용, stub)

 // ── 남은 시간 바로 완료 (갱신 135-2, 135·135-1 대체) ──
 timeSkip:{diaPerMin:1, // 1분당 1다이아(10원), 1분 단위 올림, 버튼 하나로 남은 시간 전부; 갱신 135-2
  targets:['hospital','daycare','walk','trainer','menu']}, // '치료와 알바 쿨타임 등 남은 시간이 있는 모든 대기' · menu = 메뉴 개발(갱신 136)

 // ── 얼룩 (갱신 101-3 · 117-2) ──
 stains:{everySecPerShiba:7200,warnAt:3,warnDirtMul:1.5,badAt:6,badDirtMul:2,badRepEverySec:600,badRep:-1}, // 갱신 101-3·117-2 stain thresholds

 // ── 동구 (갱신 78·79·80) ──
 dongu:{takesSlot:false,earns:false,canWalk:false,canAbandon:false},

 // ── 시바뽑기 (갱신 137: 132-3의 200다이아 대체) ──
 // starting value 2026-10-15, pending user confirm: gacha unlock Lv1.
 gacha:{unlock:1,priceDia:100,tenDia:900,tenCount:10, // 갱신 137: 1회 100다이아(1,000원), 10연차 900다이아(9,000원)
  startLevel:1, // user Task B 2026-10-15: later arrivals Lv1, starter Lv21
  dupPaws:GACHA_TABLE.dupToPaw, // 갱신 137·81: 이미 가진 견종이 또 나오면 발바닥 10개 (레벨업 재료)
  priceCoins:U, // UNSET: 갱신 57 멍코인 뽑기 가격 → 멍코인 뽑기 없음
  breedOdds:Object.fromEntries(GACHA_TABLE.pool.map(x=>[x.id,x.w])), // 갱신 141 confirmed; rates only in JSON
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
  expBoost:{mul:1.5,hours:.5,maxHours:24,capTotal:.2,priceDia:U}, // starting value 2026-10-15, pending user confirm: 30 min ×1.5; existing ceiling retained.
  diaPriceWon:10, // 갱신 141 confirmed: 1다이아 = 10원; free grants only events/onboarding/ranking
  // 1.4 · 갱신 29·33 28일 온보딩 (확정분만): 1~7일 하트 리셋권 1장, 캡슐 4·11·18·25일 1개 + 9일 5개 + 19일 10개. 3·17·26일 하트 개수 UNSET(질문 1(다)), 날짜 진행 방식 UNSET(보상표 Q5·Q6)
  onboarding:{days:28,dayMode:'calendar-KST',rewards:{1:{heartReset:1},2:{heartReset:1},3:{heartReset:1,hearts:U},4:{heartReset:1,capsule:1},5:{heartReset:1},6:{heartReset:1},7:{heartReset:1}, // §1.4 · 갱신 29·33 onboarding days and quantities
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

// income.levelAggregation: confirmed 수인님 2026-10-14 (max single multiplier).
// income.noMeetingMultiplier: starting value 똑또기 2026-10-14, pending user batch confirm.
