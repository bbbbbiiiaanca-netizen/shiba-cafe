# Spec v3 build notes (start-room-3d)

Source: `shiba-cafe-docs/spec-v3-build/spec-v3.md` (최신 갱신 134-1 기준; 높은 갱신 번호가 앞의 내용을 대체, ~~취소선~~은 폐지로 처리),
`docs/` (decisions, guest 검수메모, onboarding, sound list), `image-list.md`. Built on branch `codex/spec-v3-core`.

- Run: open `start-room-3d/index.html` (portrait 390×844; `?fresh=1` new save, `?seed=N` fixed RNG, `?still=1` no auto-tick).
- Tests: `cd start-room-3d && npm test` (56 spec tests + legacy timeline test) · `npm run test:browser` (17 headless-Chrome checks).
- Screens: `node start-room-3d/capture-spec-v3.mjs [OUTDIR]` → default `/workspace/shiba-cafe-docs/spec-v3-build/screens/`.
- Files: `config.js` (all numbers, UNSET = `null`), `sim.js` (pure rules), `main.js` + `index.html` (UI), `i18n.js` (ko/en),
  `assets/drive/` (confirmed Drive images, mapping in `assets/drive/MAP.md`).

## 1. Implemented rules → spec

| Area | Rule as built | Spec |
|---|---|---|
| 재화 | 멍코인 = 기본 재화(카페 수입) | 갱신 57·54 |
| 재화 | 하트: 기본 소지 10, 30분당 1개 자연 회복(10까지), 보상 하트는 10 초과 적립 | 1.4, 갱신 28·31 |
| 재화 | 하트 리셋권: 10 미만일 때만 10으로, 10 이상이면 버튼 비활성·소모 없음 | 1.4, 갱신 32 |
| 재화 | 하트 사용처: 산책(10분당 1) · 놀아주기(1) · 직접 훈련(1) | 갱신 84·87·100·124-5 |
| 재화 | 다이아: 유료 전용, 0으로 시작, 1개 = 10원 | 갱신 132-2·132-3 |
| 재화 | 발바닥 = 시바별 경험치 | 갱신 56·77 |
| 카페 | 카페 레벨 최대 50, 필요 경험치 표(120 … 37,870, 누적 676,180) | 갱신 73·98 (91·92 대체), 132-4 |
| 카페 | 손님 압박 표 50행(시바 칸·손님 상한·도착 간격): 시바 칸 = 배치 가능 수, 손님 상한 = 카페 안 동시 손님 수 | 갱신 75 (73·74 대체), 70·71·72 |
| 카페 | 배치 최대 10, 보유 최대 50 | 갱신 74·75 |
| 카페 | 카페 경험치: 손님 보통 +1·만족 +2·실망 0, 산책 10분당 +2, 놀아주기 +1, 구조견 입양 +10, 얼룩 청소 +1 | 갱신 87, 101-3 |
| 카페 | 알바·훈련사·매니저가 한 일은 카페 경험치 없음 | 갱신 99-2, 118, 123 |
| 손님 | 도착 간격 = 표 간격 × 평판 배율(≥70 ×0.9, 30~69 ×1.0, <30 ×1.2) | 갱신 75·87 |
| 손님 | 자리가 차면 줄(최대 10명), 줄 대기 30초 넘으면 화나서 떠남: 돈 손실 없음, 평판 −2 | 갱신 66·67·68·69·87 |
| 손님 | 체류 30초. 시바는 손님 곁 7초 → 5초 돌아다님 → 다시 7초 | 갱신 69·70 |
| 손님 | 만남 점수 = 컨디션 배율(+재주 보너스), 합계 0.5 미만 = 실망 | 갱신 70·86 |
| 손님 | 컨디션 배율: 더러움 ≥60 ×0.7/≥80 ×0.5, 피로 ≥60 ×0.7/≥80 ×0.5, 포만 ≤30 ×0.8, 행복 ≥70 ×1.2, 곱, 0.25~1.3 | 갱신 86 |
| 손님 | 재주 보너스: 배운 재주 하나를 보여 주고 +0.05×단계(최대 +0.25), 1.3 상한 안 | 갱신 100 |
| 손님 | 모든 일반손님은 지금 카페에서 들어줄 수 있는 요구 1개(특정 시바 만나기·특정 재주 보기). 채우면 만족(평판 +1, 70↑ 절반·90↑ 4분의 1), 안 채우면 보통(평판 0), 벌 없음 | 갱신 106·124-4·128 |
| 손님 | 실망 평판 −1 | 갱신 87 |
| 손님 | 돌아다니는 시바를 끌어서(또는 탭→탭) 손님에게 데려다주면 7초 만남, 만나는 중인 시바는 못 끎 | 갱신 105 |
| 결제 | 손님 1명 커피 1멍 × 시바 레벨 효과 × 아이템 효과, 결제는 나갈 때. 소수는 속으로 쌓고 정수만 표시 | 갱신 75·120 |
| 메뉴 | M-01 아이스 아메리카노 = 처음부터 있는 기본 커피 1멍; 일반 음료 M-02·03·04 (3멍), 일반 디저트 M-05·06·07·08 (5멍), 프리미엄 P-01~06 (8멍) | 갱신 120·134 |
| 메뉴 | 해금 카페 Lv(2·3·5·7·9·12·15·20·25·30·35·40·45)과 판매가는 134 표, 개발비는 134-1 표(8,500 … 35,500멍; 134 표의 개발비는 대체됨) | 갱신 134·134-1 |
| 메뉴 | 개발은 멍코인으로, 해금 레벨 이상에서, 메뉴마다 한 번 | 갱신 129·134 |
| 결제 | 고급 메뉴 확률 5% + 개발한 일반 메뉴 1개당 1%p + (평판−50)×0.3%p, 요구 충족 만족 +15%p, 최대 40%; 음료:디저트 2:1 | 갱신 120·134 |
| 결제 | 고급 음료(3멍)는 일반 음료 1개 이상, 고급 디저트(5멍)는 일반 디저트 1개 이상 개발해야 주문; 아니면 그 주문은 기본 커피 | 갱신 134 |
| 결제 | 고급 디저트 주문은 프리미엄을 1개 이상 개발했으면 30% 확률로 프리미엄(8멍) | 갱신 134 |
| 결제 | 손님이 고른 메뉴 그림 = 그 종류의 개발한 메뉴 중 무작위 (떠날 때 +멍 표시 옆에 그림) | 갱신 134 |
| 결제 | 수익 계산식 화면(멍코인 누르기 / 설정): 기본 × 레벨 효과 × 아이템, 시바별 컨디션 배율 함께 표시 | 갱신 75·86 |
| 평판 | 0~100, 시작 50, 1시간마다 50 쪽으로 1점 | 갱신 87·106 |
| 오프라인 | 앱을 닫은 동안 같은 규칙으로 카페를 시뮬레이션, 수익은 최대 12시간분 | 갱신 56 |
| 오프라인 | 임시휴무: 오프라인 중 평판이 30까지 떨어지면 문 닫음 → 손님·수익·평판 변화 멈춤, 시바 피로 0, 앓아눕기·방치 시계 멈춤; 다시 켜면 평판 30으로 엶 | 갱신 126-1~4 |
| 시바 | 시작: 4종 중 1마리 선택, Lv21, 앉아·기다려 3단계 (이름은 입력, 비우면 견종 이름) | 갱신 90·100·109·133 |
| 시바 | 성격: 15개 중 무작위, 변경 불가 | 1.2, 갱신 38·39·52 |
| 시바 | 레벨 최대 30, Lv N→N+1 발바닥 10×N(누적 4,350), 수익 효과 ×(1+0.05×(L−1)) | 갱신 81 |
| 시바 | 액세서리 칸: Lv5 1, Lv15 2, Lv25 3 (아이템 목록은 UNSET → 빈 칸) | 갱신 90 |
| 시바 | 좋아하는 간식 칸 기본 2 + 레어 1, 처음엔 잠김 | 갱신 40·42·43 |
| 돌봄 | 게이지 5개: 배고픔(포만)·더러움(청결)·피로도(졸림)·행복(기분)·지루함(놀고 싶음), 0~100 | 1.2-3, 갱신 53·85·86·116 |
| 돌봄 | 놀아주기: ♥1, 지루함 −28, 더러움 +3, 피로 +5, 행복 +7, 친밀도 +3, 카페 경험치 +1, 사고·랜덤 보상 없음 | 갱신 84·88·90 |
| 돌봄 | 피로 100% → 잠만 잠: 손님·놀기·산책 불가 | 1.10.0 |
| 재주 | 5개(앉아·손·기다려·엎드려·인사), config 목록으로 추가 가능, 처음부터 모두 배움, 0~5단계 | 갱신 133 |
| 재주 | 지능 = 단계 합 × 4, 최대 100 | 갱신 133 |
| 재주 | 직접 훈련: ♥1, 성공률 60% +15(친밀 ≥70) +10(행복 ≥70) −20(피로 ≥60) −15(지루 ≥60), 20~95%; 성공 시 경험치 +1·피로 +5; N→N+1에 성공 N+1번 | 갱신 100 |
| 친밀도 | 0~100. 파양 시 남은 시바 전원 −15, 24시간 안 재파양 −20 | 갱신 76·82 |
| 산책 | 10/20/30분 선택, 실시간·앱 꺼도 진행, 다음 실행 때 한 번만 정산, 알림 없음 | 1.10, 갱신 8·9·14 |
| 산책 | 하트 10분당 1(1/2/3), 쿨타임 없음, 피로 100%면 시작 불가 | 갱신 87·124-5·125-1, 1.10.0 |
| 산책 | 산책 중 그 시바만 카페 기여에서 빠짐 | 1.10, 갱신 15 |
| 산책 | 산책 후: 지루함 −40/−55/−70, 더러움 +15/+25/+35, 피로 +15/+25/+35, 행복 +10/+15/+20, 친밀도 +2/+4/+6 | 갱신 85·90 |
| 산책 | 이벤트 독립 판정: 구조견 5%, 뱀 1/40(치료 2시간), 가벼운 부상 1/30(30분), 추가 보상 1/2, 시바 뽑기권 1/30 | 갱신 82·83·124-2 |
| 구조 | 산책 중 발견 → 진흙 강아지 그림 2장 중 랜덤 → 그 자리 목욕(고정 멍코인) → "○○시바였어요~~" → 데려오기 / "안데려갈래". 앱을 닫은 동안 발견된 건 다음 실행 때 차례로 | 1.10.1, 갱신 60·61·65·66·131 |
| 구조 | 견종은 4종 중 무작위, 데려오면 자리 있으면 바로 배치 | 1.10.1, 갱신 7 |
| 병원 | 가벼운 부상 30분·뱀 2시간·앓아누움 4시간; 비용은 카페 레벨 구간별 고정 멍코인(400/1,200/2,400 … 1,100/3,400/6,800) | 갱신 111·131 |
| 병원 | 멍코인 모자라면 못 보냄(외상 없음), 다친/앓는 시바는 손님을 안 받음 | 갱신 111-1 |
| 병원 | 배고픔·청결·기분 중 하나라도 0으로 2시간 → 앓아누움; 24시간 방치 → 동구가 데려감(비용 그대로, 입원 2배) | 갱신 111·112 |
| 알바 | 데이케어 Lv10·8,000멍·시바별 2시간 쿨: 놀아주기와 같음(친밀도 절반, 경험치 없음) | 갱신 99·99-2·125-1 |
| 알바 | 산책 알바 Lv15·18,000멍(1회, 최대 4마리)·시바별 4시간 쿨: 지루함 −50 즉시, 카페에서 안 빠짐, 하트·친밀도·경험치·이벤트 없음 | 갱신 123·123-2·123-3·123-5·124-1·125-1 |
| 알바 | 훈련사 Lv20·24,000멍·4시간 쿨: 하트 없이 훈련 1회, 항상 성공 | 갱신 99·100·125-1 |
| 알바 | 매니저 Lv25·60,000멍·12시간(자동 연장 없음): 얼룩 10분마다 1개, 시바 만나기·재주 요구 30% 대신(평판 절반, 경험치 없음) | 갱신 118·118-1·125-1 |
| 얼룩 | 배치된 시바 1마리당 2시간마다 1개; 탭하면 치움(+1); 6개 이상이면 10분마다 평판 −1 (3·6개의 청결 가속은 감소 속도 UNSET이라 효과 없음) | 갱신 101-3·117-2 |
| 동구 | 카페에 둘지 선택, 칸 차지 안 함, 손님·수익 관여 없음, 산책·파양 불가 | 갱신 78·79·80 |
| 멍포션 | 큰 포션 모든 게이지 가득, 작은 포션 1개; 지능·재주·친밀도·레벨 영향 없음 (다이아 구매는 결제 미연결) | 갱신 116 |
| 언어 | 첫 실행 언어 선택(한국어·English, 기본 선택 없음), 설정에서 즉시 변경, 저장 | 1.8·1.9 |
| 등급 | 등급 없음(N/R/S·카드·승급·등급별 병합·S 2% 모두 제거) | 1.6, 갱신 37 |
| 애니메이션 | 미끄러지는 이동 없음: 프레임 데이터가 없어 위치 변경은 컷으로만 | 갱신 50·51 |

## 2. Interpretations (spec silent or ambiguous — behaviour choices, no new numbers)
1. **만족 판정**: 갱신 86의 '합계 1.5 이상 만족'은 갱신 106("요구를 모두 채운 손님만 만족")으로 대체된 것으로 읽음. 점수 < 0.5 → 실망, 요구 충족 → 만족, 그 밖 → 보통. (`visit.scoreSatisfiedAt` 1.5는 기록용으로만 남김)
2. **만남 점수는 만남 시작 때** 더한다(30초가 끝날 때 진행 중인 만남도 1번으로 셈).
3. **시바 자동 배정**: 돌아다니기 5초가 끝난 시바는 시바를 아직 덜 만난 손님 → 그중 곧 떠날 손님 순으로 간다. 한 손님에게 동시에 1마리.
4. **보여 주는 재주**: 그 시바가 손님이 원하는 재주를 알면 그것을, 아니면 배운 재주 중 무작위 (갱신 100 '무작위'를 요구와 맞춤).
5. **요구 종류 고르기**: 들어줄 수 있는 종류(만나기/재주) 중 균등, 대상도 균등. 인테리어 요구는 인테리어 시스템 UNSET이라 내지 않음.
5a. **메뉴 그림**: '개발한 것에서 무작위'를 주문 종류 안에서로 읽음 — 음료 주문은 개발한 일반 음료 중, 디저트는 개발한 일반 디저트 중, 프리미엄은 개발한 프리미엄 중, 기본 커피는 M-01. 판매가는 그 메뉴의 표 가격(음료 3·디저트 5·프리미엄 8 = 120의 고급 음료·고급 디저트 가격과 같음).
5b. **프리미엄만 개발**하고 일반 디저트가 없으면 디저트 주문 자리가 기본 커피가 되므로 프리미엄도 나오지 않는다(프리미엄은 고급 디저트 주문에서만 바뀜).
5c. 이전 v3 저장의 `premiumDrink`/`premiumDessert` 같은 없는 메뉴 id는 불러올 때 지운다.
6. **레벨 효과**: 그 손님이 만난 시바들의 평균 레벨 효과, 아무도 못 만났으면 ×1. 실망한 손님도 커피 값은 낸다(갱신 120 "손님 1명은 기본으로 1멍").
7. **매니저**는 '보통'으로 끝날 손님에게만 30% 굴림(실망 손님은 대상 아님).
8. **줄이 10명 꽉 찼을 때** 오는 손님은 들어오지 않음(통계 `lost`, 평판 영향 없음).
9. **임시휴무**는 오프라인(앱을 닫았거나 탭이 숨겨진 동안)에만. 온라인에서는 갱신 87의 '<30 ×1.2' 규칙대로 30 아래로 내려갈 수 있다. 오프라인 12시간을 넘긴 시간에는 카페 수익·평판이 멈추고 산책 종료·퇴원·하트 회복만 정산.
10. **산책 이벤트 시점**: 구조 순간은 출발 때 정하고(산책 중 그 시각에 장면), 부상·추가 보상·뽑기권은 귀가 정산 때. 뱀과 가벼운 부상이 둘 다 나오면 뱀(더 긴 치료)으로 입원 종류를 정함.
11. **추가 보상**: '멍코인 소량 또는 하트 1개' 중 멍코인 양이 UNSET이라, 당첨되면 하트 1개만 준다.
12. **산책은 한 번에 1마리** (누가 산책하는지 질문 10 미정 → 이전 빌드와 같은 보수적 선택).
13. **훈련 피로 +5는 성공 때만** ("성공 시 그 재주 경험치 +1, 피로 +5"의 문장 구조).
14. **퇴원** 시 부상·앓아누움 해제. 게이지가 여전히 0이면 2시간 시계가 처음부터 다시 돈다.
15. **마지막 시바는 파양 불가** (공학적 보호: 뽑기가 UNSET이라 시바를 다시 얻을 길이 산책 구조뿐 — 스펙 규칙 아님, 바꾸기 쉬움).
16. **시작값이 UNSET인 저장 값**은 범위의 정의된 끝값을 쓴다(아래 UNSET 표 `START_FALLBACK`): 게이지 = 갱신 116 '가득' 상태, 친밀도 0, 구조 시바 Lv1, 시작 멍코인 0. 시작 하트 10은 1.4 '기본 소지 10개'로 읽음.
17. **알바 쿨타임**은 '쿨타임이 끝난 시바만' 맡길 수 있음(123-4 문장), 쿨타임 제거권은 유료(다이아)라 결제 미연결.
18. **탭이 5초 넘게 숨겨졌다가 돌아오면** 앱을 닫았다 연 것과 같이 오프라인 규칙으로 따라잡는다.
19. **저장**: 새 키 `shibaCafe.save.v3`. v1/v2 저장(등급·구 재화 모델)은 건드리지 않고 이어받지 않는다.

## 3. UNSET (config `null`, "UNSET: <ref>") and what the build does

| config key | spec ref | build behaviour |
|---|---|---|
| `start.coins` (no key; 0) | 시작 멍코인 미정 | 0으로 시작 |
| `gaugeStart` | 1.2-3 질문 | 116 가득 상태로 시작 |
| `decayPerHour.{full,dirt,happy,boredom,fatigue}` | 1.2-3 '줄어드는 속도' | 게이지가 저절로 변하지 않음 (집 시바 1/4 배율·얼룩 가속·휴무 중 배고픔도 효과 없음) |
| `care.feed.{full,cost}` | 1.2-3 | 밥 주기 버튼 비활성 "미정" |
| `care.snack.{fatigue,cost}` | 1.10.0 질문 9(다-2·다-3) | 간식 버튼 비활성 |
| `care.bath.{dirt,cost}` | 내 시바 목욕 효과·비용 | 목욕 버튼 비활성 |
| `care.sleep.fatiguePerHour` | 1.10.0 질문 9(다-1) | 재우기 비활성, 피로 100% 시바는 휴무 전까지 깨지 않음 |
| `intimacy.start` | — | 0 |
| `neglect.intimacyDrop`, `neglect.donguIntimacyDrop` | 갱신 112 | 친밀도 감소 없음 (동구 입원은 동작) |
| `rescueLevel` | 질문 9(사) | Lv1, 화면에 "레벨 규칙 미정 → Lv1" |
| `walk.stopRule` | 질문 1-4 | 멈추기 버튼 비활성 "규칙 미정" |
| `walk.events.extraCoins` | 갱신 82 '소량' | 추가 보상은 하트 1개만 |
| `itemIncome.priceDia` | 갱신 97 | 수익 1.2배 아이템 판매 불가 (효과 로직은 있음) |
| `cafe.paidSlotUnlockDia` | 갱신 87·132 | 칸 미리 해제 "미정" |
| `cafe.expansion2FCost` | 갱신 56 | 2층 없음 |
| `hospital.speedupDiaPer10Min` | 갱신 111·132 | 치료 앞당기기 없음 |
| `gacha.priceCoins`, `gacha.startLevel`, `gacha.breedOdds` | 갱신 57, 질문 9(바) | 뽑기 버튼 "미정"; 산책에서 얻은 뽑기권은 쌓이기만 함; 중복 → 발바닥 10(갱신 81)·'같은 시바' 기준(2-3 라)도 미정이라 발바닥을 얻을 길이 아직 없음 |
| `accessories` | 질문 9(가) | 액세서리 칸만 표시 |
| `likes.toys`, `likes.list` | 질문 9(카) | 간식 칸 3개 잠김 + 장난감 칸 "미정" |
| `stub.regulars.population` | 갱신 102·108·122 | 단골·최애 없음 (파양 확인창에 "미정") |
| `stub.expBoost.priceDia` | 갱신 98 | 판매 불가 |
| `stub.onboarding.dayMode`, `.rewards[3,17,26].hearts` | 1.4, 보상표 Q5·Q6, 질문 1(다) | 온보딩 화면 없음(설정 '준비 중') |
| `stub.heartSources.{ads,friends}` | 갱신 54 | 광고·친구 하트 없음 |
| `stub.adoptionIncome` | 질문 4 | 입양(복제본) 없음 |
| `stub.mergeCooking` | 갱신 62 | 머지 요리 없음 |
| `stub.interior` item scores | 갱신 113 | 인테리어 점수·요구 없음 |
| animation frame counts / regions | 갱신 50·51 | 걷기·표정 전환 프레임 없이 컷 전환 |
| 성격별 확률·행동 빈도 | 질문 9(다), 1.2-1 | 15개 균등, 행동 차이 없음 |

## 4. Stubs (config only, confirmed but outside the core)
랭킹(카페 레벨, 7일, GM 제외 — 갱신 61·94·130), GM 카페(94), 일일·주간 미션 3+3(101-2), 동구 부탁 6시간·하트 2~3(101-5),
진상손님(30명 중 1명, 1명씩, 10분 쿨, Lv5부터, 난이도 3단계 표·등장 비율 — 104-1·105-3), 단골·최애(102·108·122),
시바 궁합·싸움(친한/나쁜 최대 3, 1분 10%, 3+2초, 부상 1/20, 행복 −5 — 101-4·110·127), 시바끼리 놀기(20초·25%, 친한 ×2 — 1.7.1·127),
인테리어 점수(113), 경험치 1.2배 아이템(98), 쿨타임권 다이아 20/80(115-1), 멍포션 다이아 150/50(116), 28일 온보딩 확정분(1.4).
Shown to the player as "준비 중" (settings) or disabled shop rows ("미정" / "결제 미연결").

## 5. Excluded / removed
- **도감** (collection) and **게임 속 유튜브·스타견** — not in the build at all (user instruction; 1.0, 갱신 54). The old 도감 panel/journal is gone.
- **Grade system** (1.6 폐지): N/R/S bands, grade cards, promotion card/queue, S 2%, same-grade merge — removed with the old `sim.js`/`ui.js`.
- Old handoff-v1 features without a v3 basis in the core: old quests & Dongu tutorial, the `?temp=1` TEMP switches, colour-only temporary themes, the 1.7.2 time-of-day tint and 1.7.3 observation events (their journal lives in 도감) — removed; their numbers are only in the spec.
- `ui.js`, `healing.js`, `sdk-stubs.js`, `capture-game.mjs` (targets the old UI) removed. Legacy 3D first-check files (`index3d.html`, `main3d.js`, `figures.js`, `timeline.js`, `capture.mjs`, `compare.py`) left untouched.
- The old catalog PNGs in `assets/*.png` are no longer referenced by the v3 build (spec §4: replace with F / `이미지/` confirmed images). They were left in place, not deleted.

## 6. Missing images (dashed placeholder slots in the build)
| Needed for | Where in the build | image-list ref |
|---|---|---|
| 멍코인 아이콘 | HUD coin pill | I-04 (`final-check.jpg` has heart reset/heart/paw/diamond/stamp only) |
| 밥 주기·목욕 버튼 아이콘 | care screen | 1.2-3 '게이지·버튼 아이콘' |
| 시바뽑기 캡슐/뽑기권 아이콘 | bag | I-02 |
| 액세서리 아이콘 | care › 액세서리 칸 | A-01~ (8eb5d737 accessory sheet exists; unlock list UNSET) |
| 좋아하는 간식·장난감 잠김 칸 아이콘 | care › 좋아하는 간식·장난감 | U-L |
| 적색·백시바 걷기/잠들기 포즈 | walk & sleeping state (portrait shown instead) | E-07~E-14 |
| 시바·손님 걷기 프레임 + 프레임 수/영역 데이터 | all movement (cuts instead) | 갱신 50·51 |
| 손님 화난/만족 표정 프레임 | guest leave reactions (text pop instead) | 갱신 51·67 (A4 표정 시트 except kid not in the download) |
| 기본 다다미방 빈 세로 배경 | café scene (CSS colour instead) | 1.3 / F p6 (`9e648de4.png` has characters baked in) |
| 다친·앓아누운 시바 포즈, 붕대, 병원 배경 | injured/sick status | 갱신 58 |
| 재주 포즈 5종 | trick display during meetings | 갱신 133 |
| 산책 장면 배경 | walk screen | W-01 |
| 다이아 상점 상품 아이콘(쿨타임권, 수익·경험치 1.2배, 칸 해제) | shop › 다이아 | 갱신 103·115·97 |

## 7. Tests
- `tests/spec-v3.test.mjs` (56 tests; 갱신 134/134-1 added: menu table incl. 134-1 dev costs and image files, development gating/cost, +1%p per normal menu with the 40% cap, drink/dessert slot → coffee fallback, 2:1 split, 30% premium upgrade only with a premium developed, random picture among developed, prices paid by guests): spec tables and numbers, formulas (income, intelligence = 합×4 ≤100, paw & café exp curves, premium chance, condition, training chance, reputation damping/arrival), customer flow and timing, queue anger, satisfaction/requests, drag-to-guest, manager share, walks with scripted RNG and seeded rate checks (20,000 walks), rescue flow, part-timers, max 10 placed, stains, reputation drift, 12 h offline cap, 임시휴무 and reopen, save/load, walk settled once on load, UNSET features disabled.
- `tests/smoke-browser.mjs` + `tests/smoke-steps.mjs` (rewritten, 17 checks in headless Chrome, incl. 14 menu rows with images and developing M-02 at Lv2 for 8,500멍).
- Removed `tests/sim.test.mjs` and `tests/handoff.test.mjs`: they assert the abolished grade system (bands, S 2%, same-grade merge, promotion), the old customer pay model and 도감 — contradicted by v3.
- Kept `tests/timeline.test.mjs` (legacy 3D first check, unaffected).

## 8. Findings worth a decision
- **One shiba cannot carry the café past Lv3.** With the spec tables, a single Lv21 shiba reaches café Lv3–6 within ~1–2 h; guests then outnumber what one shiba can meet, reputation falls, and offline the café hits 임시휴무 in ~2 h (`tests` › "one shiba, 20 h away"). Because 뽑기 (start level/odds) and the 구조 level are UNSET, the only way to get a 2nd shiba is the 5% rescue per walk.
- **Care can only make gauges worse.** Walks/play/training add dirt and fatigue, but 밥·간식·목욕·수면 amounts are UNSET, so nothing lowers dirt or fatigue except a paid potion or 임시휴무 (fatigue → 0). After three 30-minute walks a shiba sleeps until the next closure.
- **Paws have no source** while 뽑기 is UNSET, so shiba levels never rise in this build.
- **Menus are expensive for the early café.** The first menu (M-02, Lv2) costs 8,500멍 (134-1, 6 hours of planned income). With one Lv21 shiba the café earns about 2멍 per guest, so in the capture run it had ~280멍 after 15 minutes; 134-1 already notes the cost basis (282 × 상한 per hour) — worth checking against play.
- 갱신 86 '1.5 = 만족' vs 갱신 106 '요구 충족만 만족' — confirm interpretation 2.1.
