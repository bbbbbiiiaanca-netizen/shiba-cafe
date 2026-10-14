# Spec v3 build notes (start-room-3d)

Source: `shiba-cafe-docs/spec-v3-build/spec-v3.md` (최신 갱신 140-1 기준; 높은 갱신 번호가 앞의 내용을 대체, ~~취소선~~은 폐지로 처리),
`docs/` (decisions, guest 검수메모, onboarding, sound list), `image-list.md`. Built on branch `codex/spec-v3-core`.

- Run: open `start-room-3d/index.html` (portrait 390×844; `?fresh=1` new save, `?seed=N` fixed RNG, `?still=1` no auto-tick).
- Tests: `cd start-room-3d && npm test` (78 spec tests + legacy timeline test) · `npm run test:browser` (22 headless-Chrome checks).
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
| 메뉴 | 개발비를 내면 개발 시간이 지나야 완성: 라테 30분·치즈케이크 1시간·딸기라테 2·쿠키 3·유자 4·크루아상 6·파르페 8·티라미수 12·홀케이크 18·몽블랑 24·퐁당 30·마카롱 36·파블로바 48시간(최대 2일). 한 번에 1개. 앱을 닫아도 실시간으로 진행(휴무 중·12시간 정산 밖에서도) | 갱신 136 |
| 시간 | 남은 시간 바로 완료: 1분당 1다이아, 1분 단위 올림, 버튼 하나로 전부 — 입원(치료), 데이케어·산책 알바·훈련사 쿨타임, 메뉴 개발 | 갱신 135-2 (135·135-1 대체), 136 |
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
| 시바 | 레벨 최대 30, Lv N→N+1 발바닥 20×N(누적 8,700 = 중복 870마리), 수익 효과 ×(1+0.05×(L−1)); 발바닥은 시바별 잔고, 레벨업 버튼으로 씀 | 갱신 138 (81의 10×N 대체), 81 |
| 시바 | 활동 발바닥(하루 최대 없음): 직접 산책 1회 2 · 놀아주기 1 · 카페 근무 1시간 1(매니저 운영 시간·오프라인 12시간 정산 포함) · 재주 1단계 완료 3; 알바도 같음: 산책 알바 2 · 데이케어 1 · 훈련사 3 | 갱신 139-1·139-2 |
| 뽑기 | 1회 100다이아, 10연차 900다이아; 4종; 새 견종 = Lv1 새 시바(자리 있으면 배치), 이미 가진 견종 = 그 견종의 첫 시바에게 발바닥 10; 산책 뽑기권 1장 = 1회 | 갱신 137 (132-3 200다이아 대체)·81·82 |
| 액세서리 | 시바마다 칸 1개, 그 시바의 발바닥 1,000개 또는 1,000다이아로 해금해야 찰 수 있음(레벨로 열리지 않음); 첫 시작 시바만 칸이 열린 채 액세서리 1개를 찬 상태로 시작 | 갱신 139-5·139-6 (90·139-3·139-4 대체) |
| 액세서리 | 상점: 반다나 4종(클래식 삼각형·루프 스누드형·매듭 테일형·앞 매듭형) × 원색 9 = 36개, 1개 5,000멍; 특별 액세서리 1개 300다이아(종류 UNSET → 빈 칸); 칸 해금된 시바만 참 | 갱신 140, 1.5 |
| 액세서리 | 1개 = 한 번에 시바 1마리. 가방은 개수로 관리(보유·착용 표시), 옮기려면 벗김, 다른 것을 채우면 찬 것은 가방으로 | 갱신 140-1 |
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
6. **레벨 효과**: superseded by config audit / Unit 4: aggregation is confirmed max; no-meeting ×1 is an editable starting value pending confirmation (see Unit 5).
7. **매니저**는 '보통'으로 끝날 손님에게만 30% 굴림(실망 손님은 대상 아님).
8. **줄이 10명 꽉 찼을 때** 오는 손님은 들어오지 않음(통계 `lost`, 평판 영향 없음).
9. **임시휴무**는 오프라인(앱을 닫았거나 탭이 숨겨진 동안)에만. 온라인에서는 갱신 87의 '<30 ×1.2' 규칙대로 30 아래로 내려갈 수 있다. 오프라인 12시간을 넘긴 시간에는 카페 수익·평판이 멈추고 산책 종료·퇴원·하트 회복만 정산.
10. **산책 이벤트 시점**: 구조 순간은 출발 때 정하고(산책 중 그 시각에 장면), 부상·추가 보상·뽑기권은 귀가 정산 때. 뱀과 가벼운 부상이 둘 다 나오면 뱀(더 긴 치료)으로 입원 종류를 정함.
11. **추가 보상**: 갱신 82의 코인/하트 선택 방식과 코인 양 미정 → 추가 보상 비활성.
12. **산책은 한 번에 1마리** (누가 산책하는지 질문 10 미정 → 이전 빌드와 같은 보수적 선택).
13. **훈련 피로 +5는 성공 때만** ("성공 시 그 재주 경험치 +1, 피로 +5"의 문장 구조).
14. **퇴원** 시 부상·앓아누움 해제. 게이지가 여전히 0이면 2시간 시계가 처음부터 다시 돈다.
15. **마지막 시바는 파양 불가** (공학적 보호: 뽑기가 UNSET이라 시바를 다시 얻을 길이 산책 구조뿐 — 스펙 규칙 아님, 바꾸기 쉬움).
16. **시작값 미정**: 코인·게이지·친밀도 null 유지. 구조견 데려오기 비활성. 임의 끝값을 사용하지 않음.
17. **알바 쿨타임**은 '쿨타임이 끝난 시바만' 맡길 수 있음(123-4 문장), 쿨타임 제거권은 유료(다이아)라 결제 미연결.
18. **Hidden tab**: explicit visibility transitions use offline rules; visible frame lag retains elapsed-time debt and stays online (Unit 4, red-team 11).
19. **저장**: 새 키 `shibaCafe.save.v3`. v1/v2 저장(등급·구 재화 모델)은 건드리지 않고 이어받지 않는다.
20. **바로 완료 대상**(135-2 '남은 시간이 있는 모든 대기'): 입원, 알바 쿨타임 3종, 메뉴 개발. 산책 진행 시간은 대기가 아니라 활동이라 넣지 않음(멈추기 규칙도 UNSET), 매니저 고용 시간은 서비스 기간이라 넣지 않음, 하트 회복은 111 '하트로 시간 못 줄임'과 별개로 대상 아님.
21. **발바닥 = 시바별 잔고, 레벨업은 버튼**: 139가 발바닥을 칸 해금에도 쓰게 해서('그만큼 레벨업에 쓸 발바닥이 줄어든다') 자동 레벨업을 없앰. Lv30에서도 발바닥은 쌓임.
22. **뽑기 새 시바 Lv1**: 137 '레벨이 랜덤으로 나오는 방식은 쓰지 않는다'와 138 'Lv1→30 = 중복 870마리' 계산에서 읽음 (`gacha.startLevel:1`).
23. **'중복' = 이미 가진 견종**(4종뿐이라 견종 기준). 발바닥 10은 그 견종 중 가장 먼저 온 시바에게. 10연차 안에서 새로 나온 견종이 또 나오면 그 새 시바에게 감. 보유 50마리가 꽉 차고 없는 견종이 남아 있으면 뽑기 비활성.
24. **뽑기권**(산책 1/30, 온보딩 캡슐)은 다이아 없이 1회 뽑기.
25. **카페 근무 발바닥**: 배치되어 실제 일하는(산책·입원·잠·휴무 아님) 시간만 1시간마다 1. '매니저가 운영하는 시간'은 매니저가 있는 동안의 근무 시간도 똑같이 센다는 뜻으로 읽음(추가 지급 없음).
26. **재주 1단계 완료 3**: 직접 훈련 실패·단계 중간 성공은 0. 훈련사가 단계를 채우면 3.
27. **액세서리 가방**: `accInv` = 차지 않은 개수, 시바의 `acc` = 찬 1개. 파양한 시바가 찬 것은 가방으로 돌아옴. 반다나 색 이름(빨강·파랑·초록·노랑·분홍·남색·주황·보라·청록)은 시트 그림을 보고 붙임(스펙에 색 이름 없음).
28. **이전 v3 저장**: 칸 필드가 없으면 첫 시바를 시작 시바로 보고 칸 열림 + 시작 반다나; 개발 중 메뉴(`menuDev`)는 저장·불러오기 후에도 이어짐.

## 3. UNSET (config `null`, "UNSET: <ref>") and what the build does

| config key | spec ref | build behaviour |
|---|---|---|
| `start.coins` | §1.4 시작 멍코인 미정 | null, 미정 표시, 코인 지출 비활성 |
| `gaugeStart` | §1.2-3 질문 | 각 게이지 null, 미정 표시, 상태 증감·질병 판정 비활성 |
| `decayPerHour.{full,dirt,happy,boredom,fatigue}` | 1.2-3 '줄어드는 속도' | 게이지가 저절로 변하지 않음 (집 시바 1/4 배율·얼룩 가속·휴무 중 배고픔도 효과 없음) |
| `care.feed.{full,cost}` | 1.2-3 | 밥 주기 버튼 비활성 "미정" |
| `care.snack.{fatigue,cost}` | 1.10.0 질문 9(다-2·다-3) | 간식 버튼 비활성 |
| `care.bath.{dirt,cost}` | 내 시바 목욕 효과·비용 | 목욕 버튼 비활성 |
| `care.sleep.fatiguePerHour` | 1.10.0 질문 9(다-1) | 재우기 비활성, 피로 100% 시바는 휴무 전까지 깨지 않음 |
| `intimacy.start` | 갱신 82·90 시작값 없음 | null, 미정 표시, 증감 없음 |
| `neglect.intimacyDrop`, `neglect.donguIntimacyDrop` | 갱신 112 | 친밀도 감소 없음 (동구 입원은 동작) |
| `rescueLevel` | 질문 9(사) | 데려오기 비활성, 레벨 미정 |
| `walk.stopRule` | 질문 1-4 | 멈추기 버튼 비활성 "규칙 미정" |
| `walk.events.extraCoins` | 갱신 82 소량 | 추가 보상 선택 방식도 미정 → 비활성 |
| `itemIncome.priceDia` | 갱신 97 | 수익 1.2배 아이템 판매 불가 (효과 로직은 있음) |
| `cafe.paidSlotUnlockDia` | 갱신 87·132 | 칸 미리 해제 "미정" |
| `cafe.expansion2FCost` | 갱신 56 | 2층 없음 |
| `gacha.breedOdds` | 질문 9(바) | 4종 균등(1/4)으로 뽑음 (personalities와 같은 처리) |
| `gacha.priceCoins` | 갱신 57 | 멍코인 뽑기 없음(137은 다이아 가격만) |
| `accessory.starterItem` | 139-6 | 미정, 칸만 열고 특정 아이템은 지급하지 않음 |
| `accessory.special.items` | 갱신 140 | 특별 액세서리(300다이아) 종류·디자인 미정 → 상점에 빈 칸 1개, 구매 비활성 |
| ~~`gacha.startLevel`~~ | (was UNSET, 질문 9(바)) | 이제 1 — 갱신 137·138에서 읽음(해석 22) |
| ~~`accessories`~~ | (was 질문 9(가)) | 갱신 139-5~140-1로 정해짐 → `accessory.*` |
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
Bandana sheets copied in this round (byte-identical, see `assets/drive/MAP.md`): 삼각형·루프·매듭·앞매듭 원색 (used), 앞 매듭형 single + 옐로그린·웜 차트 (copied, not shown: pastel/solid charts vs 1.5 '원색 9, 파스텔 안 씀').
| Needed for | Where in the build | image-list ref |
|---|---|---|
| 멍코인 아이콘 | HUD coin pill | I-04 (`final-check.jpg` has heart reset/heart/paw/diamond/stamp only) |
| 밥 주기·목욕 버튼 아이콘 | care screen | 1.2-3 '게이지·버튼 아이콘' |
| 시바뽑기 캡슐/뽑기권 아이콘, 뽑기 연출(영상은 있으나 미사용) | bag, shop › 시바뽑기 | I-02 |
| 반다나 색별 낱장 그림(4종 × 9색 = 36) | shop › 액세서리, care › 액세서리 칸 | 갱신 140 — 시트 4장(3×3)을 CSS 영역으로 보여 줌, 그림은 그대로 |
| 반다나를 찬 시바 그림(견종 × 36) | café·care (찬 반다나는 초상 옆 아이콘으로만) | 갱신 140-1 — 초상에는 반다나가 이미 그려져 있음 |
| 특별 액세서리(300다이아) | shop › 특별 액세서리 (빈 칸) | 갱신 140 — 종류·디자인 미정, 지어내지 않음 |
| 액세서리 칸 잠김 아이콘 | care › 액세서리 칸 (🔒 점선 칸) | 갱신 139-6 |
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
- `tests/spec-v3.test.mjs` (78 tests; 갱신 135-2~140-1 added 22: instant-finish cost per minute with rounding and every target (hospital, 3 part-timer cooldowns, menu dev), dev-time table, timed development/one-at-a-time/offline completion/save-load, gacha prices/dup paws/new Lv1/equal odds/ticket, 20×N paw curve and manual level-up, activity paws incl. part-timers/café hours/offline, one slot + unlock by paws or diamonds, starter slot & bandana, 36 bandanas at 5,000멍, byte-identical bandana sheets, one item per shiba/take off/swap/abandon. Earlier: 갱신 134/134-1 menu table incl. 134-1 dev costs and image files, development gating/cost, +1%p per normal menu with the 40% cap, drink/dessert slot → coffee fallback, 2:1 split, 30% premium upgrade only with a premium developed, random picture among developed, prices paid by guests): spec tables and numbers, formulas (income, intelligence = 합×4 ≤100, paw & café exp curves, premium chance, condition, training chance, reputation damping/arrival), customer flow and timing, queue anger, satisfaction/requests, drag-to-guest, manager share, walks with scripted RNG and seeded rate checks (20,000 walks), rescue flow, part-timers, max 10 placed, stains, reputation drift, 12 h offline cap, 임시휴무 and reopen, save/load, walk settled once on load, UNSET features disabled.
- `tests/smoke-browser.mjs` + `tests/smoke-steps.mjs` (22 checks in headless Chrome: language/start, café loop, all screens, care, walk, shop with 14 menu rows, gacha 100/900 disabled at 0 diamonds then 1 pull, accessory shop 4 types × 9 CSS cells + buy + equip on the starter, M-02 development in progress (30 min) and finish-now for 30 diamonds, language switch, reload).
- Removed `tests/sim.test.mjs` and `tests/handoff.test.mjs`: they assert the abolished grade system (bands, S 2%, same-grade merge, promotion), the old customer pay model and 도감 — contradicted by v3.
- Kept `tests/timeline.test.mjs` (legacy 3D first check, unaffected).

## 8. Findings worth a decision
- **One shiba cannot carry the café past Lv3.** With the spec tables, a single Lv21 shiba reaches café Lv3–6 within ~1–2 h; guests then outnumber what one shiba can meet, reputation falls, and offline the café hits 임시휴무 in ~2 h (`tests` › "one shiba, 20 h away"). Without diamonds (no payment yet) a 2nd shiba comes only from the 5% rescue per walk or a capsule ticket (1/30 per walk → 137 pull, 3/4 chance of a new breed).
- **Care can only make gauges worse.** Walks/play/training add dirt and fatigue, but 밥·간식·목욕·수면 amounts are UNSET, so nothing lowers dirt or fatigue except a paid potion or 임시휴무 (fatigue → 0). After three 30-minute walks a shiba sleeps until the next closure.
- **Paws now have sources (139)**, but the numbers are slow next to 138: a café shiba earns ~24 paws a day from work + a few from walks/play; Lv21→22 needs 420. The 1,000-paw accessory slot costs that shiba ~40 days of café work.
- **Diamonds have no source in the build.** They are paid-only (132-2) and payment is not connected, so gacha, slot unlock by diamonds, finish-now and special accessories are visible but disabled at 0 diamonds (screens stage diamonds to show them). Walk capsule tickets are the only free gacha.
- **Second shiba's accessory.** Every non-starter shiba needs 1,000 paws or 1,000 diamonds before it can wear even a 5,000멍 bandana (139-6 + 140) — confirm this is intended.
- **Menus are expensive for the early café.** The first menu (M-02, Lv2) costs 8,500멍 (134-1, 6 hours of planned income). With one Lv21 shiba the café earns about 2멍 per guest, so in the capture run it had ~280멍 after 15 minutes; 134-1 already notes the cost basis (282 × 상한 per hour) — worth checking against play.
- 갱신 86 '1.5 = 만족' vs 갱신 106 '요구 충족만 만족' — confirm interpretation 2.1.

## Main café screen v2
Canvas uses the six untouched approved 128px isometric tile assets; main scene has no catalog/background illustration. `map-data.js` defines floors, grids, walls, objects, locked zones (cost null), stair connection 1→2, and sprite registry. Null sprites draw labeled temporary shapes; assign an image path to replace them. Grid row additions extend the scroll range; wheel/drag scrolls vertically. Floor 2 remains locked with unset expansion cost. Resource paws show the sum of owned shibas’ individual paws.

Capture: `node start-room-3d/capture-main-screen.mjs`, 390×844 at DPR1/DPR2, output `/workspace/shiba-cafe-docs/spec-v3-build/main-screen-v2.png` and `main-screen-v2@2x.png`. Staged unsaved Lv5, three placed Lv21 breeds, two live simulated seated guests, 30,000 coins before M-02 development (21,500 after), 30 diamonds, M-02 developing. Both screenshots visually inspected for wall/edge alignment and label overlap. Economy values come exclusively from CFG; missing development fields for the basic menu render 미정.

## Main screen v3
Capture: `node start-room-3d/capture-main-screen.mjs`; 390×844 CSS pixels at DPR 1 and 2. Same staged state as v2: seed 7, cafe Lv5, red starter plus white/kuro Lv21 placed, 25 simulated seconds, two retained guests, M-02 developing, 21,500 coins and 30 diamonds. State is unsaved.
Approved assets are copied byte-identically and drawn whole; hashes and Drive names are in assets/drive/MAP.md. Furniture anchors are source-pixel offsets in map-data.js. Wall end strips cap only the front-most cell of each back wall. Grass repeats in map coordinates. Dongu, shibas and guests remain code-drawn placeholders. Expansion/theme prices and furniture economy remain UNSET.


Furniture edit follow-up: action controls now live at the top of the bottom 가구 tab content; no edit DOM controls are added to the map. Entering edit via the toggle, setEdit, ?edit=1 or ?grid=1 activates 가구; exiting keeps 가구. Controls stay visible during edit and are disabled until selection. Browser smoke checks cover panel ownership, map separation, automatic tab activation and exit behavior.

Run `npm run test:browser` and `node capture-main-screen.mjs` on a Chrome-capable host to verify and regenerate main-screen-v7-edit.png (selected flipped counter, origin [0,1], cells (0,1)/(0,2), 가구 action bar). `python3 align-crops.py` generates align-v7/align-counter-flipped.png offline: complete room plus all furniture at 3×, grid, selected counter outline, depth sorting and mirror anchor ax′ = width − ax.


## Unit 2 implementation

- 메뉴: dedicated fixed header; 14 confirmed menu images, configured unlock levels/prices/development costs and durations (134/134-1/136), one active job, remaining-time display, rounded diamond instant finish (135-2), completion feedback. Development remains real-time in the existing core.
- 시바: owned list with confirmed portraits, status, personal paw balance and care entry; level-up confirmation and explicit result, 20×current-level cost and Lv30 cap (138/139); existing care and real-time walk screen wired from this tab (1.10, 84/85/87/124-5/125-1). No new walk rules.
- 가구: dedicated header, four confirmed Drive icons; explicit null prices (1.3/F p6·9); existing placement edit toggle and edit bar retained.
- 가게: bandanas 4×9 at 5,000 coins (140), special accessory empty slot at 300 diamonds; per-shiba single slot with 1,000 personal paws / 1,000 diamonds unlock (139-5/6). Counted inventory shows owned/worn/available and equips/unequips/swaps (140-1). Gacha visible and disabled with 준비 중. Heart-reset inventory remains usable per 1.4.
- Café: existing automatic XP progression/table to Lv50 (73/87/98/132-4), progress/threshold and reputation shown in shop, HUD progress tooltip, level-up feedback. Null threshold shows 미정 and no invented progression. No separate reputation level or fee added.
- Validation: npm test passes (93 spec tests plus timeline/map/edit suites). Added exhaustive personal-paw spending, purchase/inventory conservation through save/load, failed development and diamond transactions, null-threshold tests. Browser smoke adds tab headers, confirmation/cancel/result, inventory purchase/equip/unequip, café threshold feedback; existing menu and furniture primary-action checks retained. Chrome was not launched in this sandbox.
- Capture script adds main-screen-u2-menu.png, main-screen-u2-shiba.png, main-screen-u2-furniture.png, main-screen-u2-shop.png and main-screen-u2-levelup.png at DPR2 to /workspace/shiba-cafe-docs/spec-v3-build/. Earlier v7 staging/output names are retained. Run npm run test:browser and node capture-main-screen.mjs on the Chrome host; new images have not been generated here.
- On-map character rendering remains unchanged: shibas, guests and 동구 stay invisible. No YouTube or 도감 added. All existing costs retained.

## Unit 2 open questions

QUESTIONS (all corresponding spec config values remain null):

1. Furniture prices / purchase rules: `furniture.items[*].price = null` (1.3, F p6·9; notes §3 interior unresolved). Current furniture is editable; no purchases invented.
2. Which starting accessory? `accessory.starterItem = null` (139-6). No accessory identity is guessed; slot stays open.
3. Bandana colour names/order? `accessory.bandana.colorNames = null` (1.5, 140). Use neutral cell1–cell9 identifiers and confirmed sheets.
4. Special accessory types/designs? `accessory.special.items = null` (140). Empty slot, disabled purchase.
5. Gacha breed odds and starting level? `gacha.breedOdds`, `gacha.startLevel = null` (137, notes red-team question 9(바); 138's Lv1 calculation is an inference). Disabled 준비 중, no sampled odds.
6. Feeding/bathing quantities and costs, snack cost/recovery, sleep recovery speed? `care.feed.*`, `care.bath.*`, `care.snack.*`, `care.sleep.fatiguePerHour = null` (1.2-3, 1.10.0 questions 9(다-1/2/3)). Disabled 미정.
7. Walk stop/refund/partial reward rules and extra coin reward amount? `walk.stopRule`, `walk.events.extraCoins = null` (1.10.3 question 1-4; 82). Existing stop button disabled; extra reward branch disabled until decided.
8. Starting gauges/intimacy, personality odds, decay rates, neglect intimacy loss and rescue starting level? `gaugeStart`, `intimacy.start`, `personalityOdds`, `decayPerHour.*`, `neglect.intimacyDrop`, `neglect.donguIntimacyDrop`, `rescueLevel = null` (1.2-3, 38/39, 112, notes question 9(다/사)). All unsupported core fallbacks removed in the config audit below.
9. Starting coins / paid slot / expansion / income and XP booster diamond prices? `start.coins`, `cafe.paidSlotUnlockDia`, `cafe.expansion2FCost`, `itemIncome.priceDia`, `stub.expBoost.priceDia = null` (56, 87/132-3, 97/98). Relevant UI shows 미정; payment actions stay disabled.
10. Meeting-level income aggregation? `income.levelAggregation` now uses confirmed max (수인님 2026-10-14); no-meeting ×1 remains pending confirm. Café level thresholds themselves are confirmed by 98, so no unknown café threshold is filled in.

## Config audit (unit 3 pre-step)

Audited every numeric config line against `/workspace/shiba-cafe-docs/handoff-v1/spec-v3.md` and this file's updates through 140-1. The handoff document ends at update 36; later references use the recorded v3 build notes. Added trailing citations to table rows and continuation lines. Gameplay numbers already supported by those records remain; care feed/snack/bath/sleep, decay, neglect amounts and other existing UNSET keys remain null.

| Key | Old value | Origin | Why removed |
|---|---|---|---|
| `pending.startCoins` | 0 | build placeholder, “nothing given” | §1.4 does not decide starting coins; `start.coins` remains null |
| `pending.intimacyStart` | 0 | range-minimum placeholder | 82·90 give range, not start; `intimacy.start` remains null |
| `pending.gaugeStart.full` | 100 | reused potion refill (116) | §1.2-3 starting gauges undecided |
| `pending.gaugeStart.dirt` | 0 | reused potion refill (116) | potion effect does not define new-game gauges |
| `pending.gaugeStart.fatigue` | 0 | reused potion refill (116) | potion effect does not define new-game gauges |
| `pending.gaugeStart.happy` | 100 | reused potion refill (116) | potion effect does not define new-game gauges |
| `pending.gaugeStart.boredom` | 0 | reused potion refill (116) | potion effect does not define new-game gauges |
| `pending.rescueLevel` | 1 | minimum-level placeholder | question 9(사) undecided; bring rescue disabled |
| `pending.starterAccessory` | bandana-triangle-cell1 | first catalog item | 139-6 decides one accessory, not identity; no guessed item |
| `pending.walkExtraReward` | heart | only quantified option in 82 | reward branch undecided; extra reward disabled |

`pending.gaugeStart` itself is now null, like `gaugeStart`; each newly stored gauge is null. Unknown values cannot be coerced to zero by care effects, decay, illness checks, spending, offline totals, condition or training calculations. UI shows 미정; direct training requires known bonus stats. Potion effects (116) and closure fatigue reset (126-3) remain confirmed ways to set a gauge. Pure mechanics tests use explicitly declared fixtures; production audit tests assert null and disabled behavior.

Exempt categories: pixel/layout dimensions, sprite-sheet crop geometry (`bandana.grid`), animation/capture timing; engine integration step (`offline.stepSec`), save schema version, array indices/bounds, counters, time-unit conversions, RNG internals and floating-point precision. These are implementation metadata, not balance defaults. No starting/care/decay/gauge/intimacy value is exempt.

Default new game: choose exactly one of the four breeds at Lv21 (90·109; sit/wait stage 3: 100·133). TEMP mode does not save to production storage. Only `?temp=1` adds two test dogs to make the three-dog roster; capture-main-screen.mjs explicitly navigates with that flag and no longer adds dogs independently. The default-state test covers all four player choices and repeated start attempts.

Changed files: config.js, sim.js, main.js, capture-main-screen.mjs, tests/spec-v3.test.mjs, SPEC-V3-NOTES.md. No Chrome execution in this sandbox.

Validation: `npm test` passed (94/94 spec tests plus timeline/map/edit suites); JavaScript syntax checks passed. `diff -r --exclude=node_modules start-room-3d preview/start-room-3d` verified the deletion-aware mirror.

## Unit 3 implementation

Sources: interior specification §§1,3,4,6,8,9; spec-v3 §1.3, update 56 (single floor → second floor, cost undecided). The named themes are only 다다미 (default), 후지산 벽화 카페 and 대나무 회랑 (§1.3).

- `space.unlockedRows`, `floor2Unlocked`, unlocked theme ids persist and migrate; expanded placement restores against extended row bounds. Unlock transactions check configured positive costs, balance and ownership, deduct coins and persist through the UI. Null costs show 미정, disabled; no free unlock or production price introduced.
- Floor 2 zone is connected to A/stairs with an upward screen offset and no room image. Initially only the approved UI_자물쇠 and label above stairs render. Floor selector stays in 가구; locked 2층 is disabled.
- Next locked row uses only `tiles/tile-floor-locked.png` per cell and `tiles/marker-expand-land.png`, anchor [64,72]. Expanded rows remain data only: no floor fill or grid art is invented. Existing furniture can be dragged into these bounds. The camera clamps vertical wheel/mouse/touch drag and tracks the isometric row slope to keep lower rows reachable. Empty-map drag also scrolls during edit.
- 가구 has expansion, 2층 and two named theme cards, using confirmed Drive UI card/lock assets. Themes have null art and costs; default tatami art is retained. No theme bonus invented.
- Temporary fixture `?temp=1&fresh=1&rows=18` creates extra unlocked row data without changing production storage. Rows are a test fixture, not an unlock bypass in normal gameplay.
- `npm test` covers null/insufficient cost refusal, configured transactions (explicit test-only costs), row additions/bounds, expanded furniture save/load, floor lock/switch, theme ownership and migration. Browser smoke adds cards, drag scroll and clamp with temporary rows. Capture adds `main-screen-u3-furniture.png`, `main-screen-u3-locked-row.png`, `main-screen-u3-2f.png`, all DPR2, to `/workspace/shiba-cafe-docs/spec-v3-build/`.
- Chrome was not launched; browser checks and screenshot generation await the user's Chrome host (`npm run test:browser`, `node capture-main-screen.mjs`).

## Unit 3 open questions

1. What is the cost per unlocked land row? `expansion.rowCost = null`; interior §1 and spec-v3 §1.3 define expansion, but no amount or cost progression.
2. What is the very expensive 2층 unlock cost? `cafe.expansion2FCost = null`; interior §9 and spec-v3 update 56 explicitly leave the price undecided. No level requirement invented.
3. What are the expensive theme unlock costs and supplied art? `themes[fuji/bamboo].unlockCost = null`, `art = null`; interior §6 and spec-v3 §1.3. Theme set bonus values/rules remain undecided.
4. When will expanded-row room art and stacked 2층 room/roof/railing art be supplied? Interior §§3,4,9. Expanded rows are data only and 2층 has no room rendering. The upward offset is layout metadata pending supplied art anchors.

Changed files: config.js, map-data.js, sim.js, isomap.js, main.js, index.html, package.json, tests/unit3.test.mjs, tests/smoke-browser.mjs, capture-main-screen.mjs, SPEC-V3-NOTES.md. Mirrored deletion-aware excluding node_modules to preview/start-room-3d; no commit/push.


## Unit 4 implementation

The required handoff-v1/spec-v3.md ends at update 36. Later decisions are cited from the existing notes through 140-1 and the matching `/workspace/shiba-cafe-docs/spec-v3-build/spec-v3.md`; spec v3 supersedes core-loop.md. Interior source: `/workspace/shiba-cafe-docs/시바카페_아이소메트릭_인테리어_명세.md`.

| Feature | Spec sections / decisions | Result |
|---|---|---|
| Arrival / queue | updates 66–69, 70–75, 87, **132-4** | 100 × café cap/hour, reputation interval multiplier, cap and physical seat reservations, queue max 10 / wait 30 sec; no coin penalty |
| Seat / routes | interior §§3,5,8; physical seats explicitly requested for Unit 4 | Placed cushion footprint cells are seats; tea tables and all other footprints are obstacles. One guest reserves one cushion, sits ON its target cell; intermediate cushions stay blocked. BFS uses four neighbours and whole cells within the zone grid. Route timing / entrance remain null; production arrivals disabled until configured. |
| Order / service / payment | updates **120,129,134,134-2,136** | Basic M-01 always available; other menus require completed development. Existing probability/split/premium rules and CFG prices retained. **Selection happens at departure**, after satisfaction is known, per 120. `order → serve → leave(payment) → exit` events record settlement without inventing a cooking timer or early price selection. Developed menu image and +N 멍코인 text are anchored at the seat. |
| Requests / reputation / XP | updates 70,86,87,100,106,124-4,128 | Reachable shiba approach → meeting; learned trick random. Request satisfaction, damping, ordinary / disappointed results, XP and queue anger retained; unknown income aggregation produces 결제 미정. No customer heart reward/cost exists in spec. Hearts use §1.4 / updates 28,31,32 independently. |
| Offline / idle | updates **56,126-1–4,136,139-2** | Same core simulation, café income/work capped at 12h, real-time menu development/hearts/walk/hospital settlement preserved. No extra passive income formula imported from core-loop. |
| 알바 | updates **118,118-1,125-1** (manager); 99/99-2,123,125-1 for other helpers | Existing configured manager request support and cleanup retained; no extra cashier/service helper, salary or automation invented. Helper work grants no café XP; existing paws rules unchanged. |
| Invisible characters / depth | interior §§2–5; Unit 4 instructions | No shapes or character images drawn. CHAR_SPRITES shiba/guest/dongu files and foot-shadow anchors null. Depth entries join furniture by i+j, characters after furniture at the same sum, room/walls remain the background. Positions exposed through __game.characterPositions for tests. |
| Feedback | assets/drive/MAP.md lines 33–35,72; update 134 | Confirmed request-bubble-empty_512.png plus confirmed request icons; confirmed M/P menu images. Compact 손님 header in 메뉴 shows seated/waiting/moving and recent order/payment records. Existing tabs unchanged. |

Edit rule (interpretation pending confirmation): a seated guest follows the same cushion id to its new cell without restarting remaining visit time, score, request or meetings. Entering guests reserve that cushion and reroute. Approaching shibas reroute to an adjacent free floor cell; guests walk onto the cushion only as a target. Exiting guests reroute to the entrance. A character whose cell becomes covered by moved furniture may leave that cell, but no subsequent blocked cell may be crossed. Unreachable routes wait for a later layout change; no teleport through obstacles. Shibas take whole-cell approach routes and a free adjacent roaming step within the existing 5-second roam interval. Guest/shiba collisions are not invented.

Red-team scope: **9** belongs here because closure freezes illness/neglect but hospital treatment must still finish; fixed release during closed ticks and restart timestamps (release or newly-zero hunger during closure resumes at reopen, never shifted into the future). **10** belongs here because temporary closure is part of offline customer operation; retained confirmed fatigue→0 / hunger-only decay, all unknown hunger/recovery rates remain null. **11** fixed: visible frame gaps no longer drop time through min(dt,.25) or falsely invoke offline closure. Real elapsed debt is integrated in bounded batches and retained until consumed. 240 steps/frame is an engine work budget, not a gameplay cap; 1-second step is existing offline integration metadata. Only an actual hidden-tab transition invokes offline rules.

Removed / superseded: synthetic numeric seat slots (capacity alone no longer creates seats), instant arrival seating, immediate shiba teleport for delivery, immediate customer removal at payment, dead DOM seat-payment popup lookup, frame-time truncation and >5-second visible-gap offline heuristic. Unsupported average/no-meeting income fallback stays removed/null; non-finite prices/multipliers and unknown encountered shiba levels cannot produce payments. No unsupported hearts, idle income, employee behavior, customer sprites or grass shapes added. Land direction and camera code untouched.

## Unit 4 open questions — answered / superseded by Unit 5

1. **Answered, answer 똑또기 2026-10-14:** front-left entrance is `[0,5]` (i=0, j=rows−1 on the original floor). Guests enter from adjacent exterior grass. Entrance is reserved against furniture edits. No expansion/camera rules changed.
2. **Answered, answer 똑또기 2026-10-14:** editable starting cell times guest 0.4 s, shiba 0.5 s (`CFG.navigation`).
3. **Answered, answer 똑또기 2026-10-14:** cushion/chair seats, one guest per seat; shiba needs an adjacent free floor cell or skips. Adjacent table gets item; otherwise `inHand`, invisible pending guest sprites. Current supplied furniture has cushions; chair art/footprint is not supplied.
4. **CONFIRMED, confirmed 수인님 2026-10-14:** max single level multiplier among met shibas. No-meeting ×1.0 remains an editable starting value **pending confirm** (answer 똑또기 2026-10-14).
5. **Answered, answer 똑또기 2026-10-14:** order instantly on sit; no serving wait; charge once at departure. This supersedes Unit 4's departure-time order. Premium satisfied bonus cannot predict future fulfilment, so order uses current fulfilment (false on first sit); later fulfilment affects outcome, not a reroll of the visible item.
6. **Answered, answer 똑또기 2026-10-14:** blocked incoming route seeks another reachable free seat, otherwise queues; waiting >30 s leaves with reputation unchanged. Same-cushion edit reseats and relinks table without restarting visit/score. Blocked exits wait for a reachable route, never teleport through furniture.
7. **Answered:** approved `tile-grass-outside.png` integrated (interior §12), SHA-256 verified against supplied value; mapping in `assets/drive/MAP.md`. Exact 128×64 cells cover viewport outside land before room draw. Existing row outline/button draw afterward.

Validation: npm test includes 94 legacy spec acceptance tests with explicit geometry/timing fixtures, existing timeline/map/edit/Unit 3/renderer suites, and 11 Unit 4 tests for lifecycle, obstacles, physical seats, pricing, null gating, edit reseat, depth, frame lag, closure health/rest and hearts. Browser smoke checks and capture scenarios are written but Chrome was not launched in this sandbox. Run `npm run test:browser` and `node capture-main-screen.mjs` on the user's Chrome host. Capture adds main-screen-u4-order.png, main-screen-u4-payment.png and main-screen-u4-panel.png at DPR2 to `/workspace/shiba-cafe-docs/spec-v3-build/`; TEMP fixtures supply entrance, walk timing, gauges and payment aggregation without saving. No screenshots generated here.

Changed files: config.js, sim.js, navigation.js (new), map-data.js, isomap.js, main.js, package.json, capture-main-screen.mjs, tests/spec-v3.test.mjs, tests/unit4.test.mjs (new), tests/smoke-browser.mjs, tests/smoke-steps.mjs, SPEC-V3-NOTES.md. Deletion-aware mirror excludes node_modules; no commit/push.


## Unit 5 implementation

References: interior §§5/8/13-1/13-2/13-3, spec-v3 updates 50/51 (sprites), 69/70 (30 s visit, 7 s meeting, 5 s between meetings), 75/120/134 (prices/orders/payment), and Unit 4b answers dated 2026-10-14. Unit 5 supersedes contradictory historical Unit 4 descriptions above.

- Guest `phase`: entering → seated → exiting; queue separate and ordered. `activity`: eat → interact → play → interact. Real whole-cell entry begins on grass. A queue reservation routes back through the entrance. Seats come from furniture footprints, not café capacity alone; queue max is the spec-v3 cap 10 (66–69), further limited to 4 grass cells by the Unit 5 starting value. Queue cell layout is editable map data along the exterior entrance edge.
- Order is selected exactly once at sit from developed menus (M-01 always available), placed instantly, preserved through departure payment. `itemLocation` is table, none (all adjacent table cells taken) or inHand (no adjacent table). One item slot per table footprint cell; links use four-neighbour adjacency and exclusive slot ids. Table edits relink seated items. *(Updated by Unit 5 answers below.)*
- Only the confirmed M/P item bitmap is added to the map. Table item display is 35% of cell width, centred on the cell's table top (offset 0/−42) — starting value 똑또기 2026-10-14 (was 36×36 at ±18/−42). These are not gameplay tuning. Entries sort with furniture/characters by i+j; items follow their table at equal depth. Characters remain invisible, with null sprite and foot-shadow hooks.
- Shiba logical `phase` stays compatible with Unit 4: roam / approach / meet. `state`: wander, walk, lookAround, sit, nap, tailWag, approachGuest, play. *(Superseded by the answered open questions below: production now has starting-value odds/durations/eating; TEMP fixture removed.)* Both face whole-cell movement with directions 0(+i), 1(+j), 2(−i), 3(−j); front two can mirror, back two need separate art.
- Approach chooses a seated guest with no current shiba after eating, reserves a reachable adjacent free cell, faces guest, plays with existing score/request/7 s meeting rules, releases reservation and returns to wander (5 s roam, then seeks again). No adjacent cell skips the interaction. Absent/unplaced/walking/hospital/injured/sick/exhausted shibas use existing `canWork` and do not wander. Cosmetic nap does not invent fatigue recovery.
- `__game.world` exposes runtime state, routes, table slots, orders, facing, activities, and TEMP config. Entrance, speeds, timeout and unchanged reputation are editable starting answers, marked in data/config. Max level aggregation is confirmed; no-meeting ×1 is pending.
- Menu actions reserve card bottom space, diamond action is 70% width/21px vs former 29px height. Order toast is one line, e.g. 아이스 아메리카노 주문.

## Unit 5 open questions — answered (starting values)

All answers below are **starting value 똑또기 2026-10-14, pending user batch confirm**; each is marked with that comment in `config.js` / `map-data.js`. Production now runs with them: shibas wander and seek guests without `?temp=1`. The TEMP behaviour fixture (`TEMP_BEHAVIOUR`, `enableTempBehaviour`) was removed; any value set back to `null` still gates the feature (`behaviourReady`).

1. **Pose odds and durations** — answered: walk 40% / lookAround 15% / sit 15% / tailWag 15% / nap 15% (`behaviour.weights`); walk covers 2–4 cells (`behaviour.walkCells`; a reachable cell exactly n steps away, else any within 2–4); lookAround 2 s, tailWag 2 s, sit 4 s, nap 10 s (`behaviour.durations`). Walk lasts its route at `shibaCellStepSec`.
2. **Eating duration** — answered: `behaviour.eatSec=8`. The 30 s `stayingSec` is no longer a hard cut: a seated guest whose time is up stays until eating (8 s) or the current 7 s meeting finishes. The only strict 30 s limit is waiting in the queue (`navigation.queueWaitSec`).
3. **Approach cooldown** — answered: no separate cooldown (`cooldownSec` removed). Interaction 7 s (`visit.meetSec`) → roam 5 s (`visit.roamSec`, poses keep running) → seek a guest who has finished eating and has no shiba. A shiba prefers the guest who has met the fewest shibas (engineering choice so one shiba spreads its visits). No guest/no adjacent cell → keeps roaming and retries.
4. **Table items** — answered: one item per table **cell** (`linkTable` derives slots from the table footprint, so multi-cell tables get one per cell), centred on that cell's table top (`TABLE_ITEM_LAYOUT.offset` [0,−42] image px), drawn at 35% of cell width (`cellWidthFrac:.35` → 44.8 px). All adjacent table cells taken → `itemLocation:'none'`, guest eats with no item drawn. No adjacent table → `inHand` (unchanged; nothing drawn until hand sprites).
5. **Income** — answered: no-shiba-met ×1.0 (`income.noMeetingMultiplier`). Max single multiplier remains confirmed 수인님 2026-10-14.
6. **Queue layout / other floors** — answered: up to 4 cells on the grass straight out from the entrance (`navigation.queueCells:4` → `[0,6]…[0,9]`); overflow guests turn back (`stats.lost`). The 갱신 66 cap 10 stays in config as the upper bound. Other floors have no entrance (stairs only) → no queue.
7. **Met request** — answered: price unchanged (order is fixed at sit, never rerolled), reputation +1 (`requests.metRep`; 갱신 106 damping above 70/90 still applies).
8. **Ledger** — KST midnight day, 7 days kept, opened from the 멍코인 pill and the 가게 tab (`CFG.ledger`, unchanged values, comments updated).

**Balance flag (new):** at café Lv1 guests arrive every 7.2 s but one shiba completes a full cycle (7 s meet + 5 s roam) every 12 s, so roughly half the guests leave unmet (disappointed, reputation −1). In a 20 h offline run the café reaches reputation 30 and enters 임시휴무 after ~17 min, still at Lv1 (119/120 exp). The old code reached Lv3 first only because a guest's 30 s departure cut meetings short. The spec-v3 acceptance test was updated to assert the new behaviour (closure before 12 h; pay 2 only for met guests) — please review roam/meet times or arrival rates together.

Art request list — interior §13-2/13-3, §5 directions/anchors:

- Each of red / sesame / kuro / white shiba: walking frames in 4 directions (front original + mirror, two separate backs); lookAround, sit, lie/nap, tailWag, approach uses walk, play/interaction poses. Reuse supplied pose sheets only once separate approved sprite/frames/anchors are supplied; do not crop catalog images.
- Guests: walk, sit, drink/eat, queue frames; hand-held drink/dessert pose for a seat with no adjacent table. Supply direction mapping and front mirror/back art.
- Every sprite: transparent PNG, foot-contact anchor, foot-shadow art/anchor, frame sequence and timing. `CHAR_SPRITES` files/anchors/directional slots remain null until provided. Dongu art/animation likewise remains null; no invented figure drawn.

Validation: `npm test` includes 94 acceptance tests, timeline/map/edit/Unit 3/renderer/11 Unit 4 tests and 9 new Unit 5 tests. Legacy tests use explicit speed/behaviour fixtures, keeping production null gates tested separately. Browser smoke adds table-slot/confirmed-image state and button-rect-inside-card checks. Chrome is deliberately not launched here. On Chrome host run `npm run test:browser` and `node capture-main-screen.mjs`; DPR2 output adds main-screen-u5-table-item.png (TEMP seated drink), main-screen-u5-grass.png, main-screen-u5-menu.png (M-02 developing), and re-captures main-screen-u4-order.png with one-line toast. No captures generated in the sandbox.


### Top bar §14 art requests

> **Resolved 2026-10-14:** 그림이 supplied `ui/res-coin.png`, `res-heart.png`, `res-heart-empty.png`, `res-diamond.png`, `res-paw.png` and `ui/ui-gear.png` (MAP.md '그림이 UI icons'). The CSS-drawn `.resource.*` shapes and the text `설정` are gone; see '§17-1…17-6' below. The bullets below are kept as history.

- **Fix (before §16):** `icons-final-check.jpg` sheet cropping rendered red/black squares in the top bar. The bar now uses the pre-§14 HUD icons from 6ac0bdd — those were CSS-drawn coin/heart/diamond/paw shapes (`.resource.*`), not image files; no coin/heart/diamond/paw image file exists in the repo history. Replace when 그림이 icons arrive. The `+` now sits at the right end of the 멍코인 pill and the 다이아 pill (two buttons, toast only); the shared end-of-row + was removed.

- Optional cafe Lv badge image: no supplied badge found in assets/drive or the local Drive image mirror. Current badge uses a CSS circle and text only.
- Settings gear image: no supplied gear image found. The small accessible settings button uses text `설정` until art is supplied; the previous code-drawn SVG gear has been removed to respect the image-only icon requirement.
- No + image required by §14: the shared end-of-row button uses CSS and text `+`.
- Existing `icons-final-check.jpg` supplies coin (last tile), heart, diamond and paw via CSS background positioning, without changing the image. Separate transparent resource PNGs would remove the sheet's baked-in background, but are optional art requests.

§14 supplement implementation: four 26px-high dark translucent pills in one row, small contained 16px image icons, centered values, one common end + (toast only). Coin body remains a native button for the existing income screen. Full large values remain available in title text and accessible content while visual text truncates. The 24px Lv/EXP/status strip sits immediately below; total overlay height is 57px and the map starts at the top of the app. §98 cafe thresholds already exist, so EXP uses state/config values; unknown threshold retains an empty bar and `미정`. Land expansion, camera and character logic are untouched.

Capture: `node capture-main-screen.mjs --u14` generates only `/workspace/shiba-cafe-docs/spec-v3-build/main-screen-u14-topbar.png`, 390×844 CSS px, DPR2, 메뉴 tab. Chrome cannot launch in this sandbox and no remote browser tool is available, so the screenshot and runtime browser smoke are pending on a Chrome-capable host; no substitute screenshot was fabricated. Browser smoke checks four pills in a row, 390px overflow (including long values), contained existing icons, thin map overlay, settings, 평판, and toast-only + behaviour.

Validation for §14: `npm test` passed all existing suites; `node --check` passed main.js, smoke-browser.mjs and capture-main-screen.mjs. Preview is mirrored deletion-aware with node_modules excluded and verified using `diff -r --exclude=node_modules`.


## §15 ledger
- Real game-day ledger saved in state: Korean midnight, daily period 86,400,000 ms and 7-day cap (minimum yesterday + today), configurable starting values marked `starting value 똑또기`. Opening balance and diamonds are excluded.
- Existing categories: menu sales at base price; meeting extra = payment minus base; offline customer payments (instead of duplicating sales/meeting); alba wages (all hireAlba kinds); hospital fees including rescue bath; menu development; accessory/bandana purchases. Fractional earnings are preserved and displayed to 2 decimals; net includes those fractions, like the existing coin carry.
- Omitted furniture purchases: no purchase transaction exists (only owned furniture placement). Walk coin reward is UNSET (both branch and amount), so there is no active coin flow. Land/theme unlock prices remain UNSET; expansion and camera code were untouched.
- CSS paper modal with yesterday/today, red parenthesized expense amounts, bold net and 멍코인 unit; HUD pill and 가게 button are configurable starting entry points; + keeps its existing toast.
- `npm test` includes real transaction/category, rollover/cap, offline tick and save/load coverage. Browser smoke steps added for both entry points and day flipping.
- DPR2 staged capture command: `node capture-main-screen.mjs --u15` writes `main-screen-u15-ledger.png` and `main-screen-u15-ledger-state.txt` (STAGED, ?temp=1, nonzero flows). Chrome cannot launch in this sandbox; browser smoke/capture are prepared but not executed here, and no synthetic screenshot is substituted.

## §16 tabs
Source: interior spec §16-1 (수인님 확정 2026-10-14), layout after `refs/ref_하단탭_참고.png` (layout only, no art taken). One icon tab row at the very bottom (`tabs.js` `TABS`, `.main-tabs`); the list panel content sits above it, and full panels (care/walk/settings) stop at the row so it stays usable. The old top list-panel tab row (메뉴/시바/가구/가게) is gone. No right-side column. Top right keeps only the small 설정 button (the 평판 pill is status text, not a button).

| Tab (order) | Icon (existing image) | Contents | Came from |
|---|---|---|---|
| 시바 | first owned shiba's portrait `shiba-<breed>.png` | shiba list, care, level-up, walk | old 시바 tab |
| 알바 | — (text) | 알바 고르기 popup button, manager status, helper cooldowns + finish-now | manager card from old 가게 tab; helpers from care/walk |
| **가게 관리** (main, 3rd slot, bigger + raised) | `M-01-iced-americano_512.png` | 메뉴 개발 popup, 업그레이드 popup (준비 중), 손익계산서, café level card, customer strip, the existing 14-card menu grid | old 메뉴 tab + café level/ledger from old 가게 tab |
| 미션 | — (text) | `준비 중` stub | new |
| 가구 | `ui/ui-icon-tea-table.png` | unchanged (edit toggle, owned furniture) | old 가구 tab |
| 상점 | — (text) | bandana shop (only working purchase), accessory slots, accessory bag, item bag, gacha (disabled), 다이아 상품 (disabled) | old 가게 tab |

- Default tab = 가게 관리. Ids changed: `menu`→`manage`, `store`→`shop`; new `alba`, `mission`. `CFG.ledger.openFromStore` now gates the 손익계산서 button in 가게 관리 (key name kept).
- **Red dots** (CSS) only from real state (`tabBadges` in `tabs.js`): 가게 관리 = a menu can be developed right now (`menuCheck` passes, nothing in development) or a development finished while 가게 관리 was not open (cleared on opening the tab or the 메뉴 개발 popup); 시바 = a shiba is injured/sick or can pay its next level-up; 알바 = some helper can be hired right now (same checks as `hireAlba`). 미션·가구·상점 never show a dot. With UNSET starting coins no dot appears.
- Six tabs have no exact centre; the main item takes the 3rd slot (see question 1).
- `sim.albaCheck` now returns `'unset'` for a null helper cost/unlock (before, `coins < null` was false, so a null price would have been hireable).

## §16-2 list popup
`#mbox.list-popup` + `listPopupHtml` (`main.js`): centred cream window, CSS ribbon title, red round close X top-right, one-line cards (left face image or empty slot, name + short effect, right green price button), list scrolls inside the window (scroll position kept across the 1 s refresh). Prices come only from CFG; null → `미정`, disabled. Uses:
- **알바 고르기**: 데이케어 / 산책 알바 / 훈련사 / 매니저 with config costs, unlock levels and effects (99·118·123·125-1). 매니저 hires directly. 데이케어 opens the same popup listing shibas (portrait faces) and hires per shiba. 산책 알바 opens the existing walk screen (multi-pick, up to 4). 훈련사 lists shibas and opens that shiba's care screen, because a trick must be picked there (existing trainer buttons).
- **메뉴 개발**: the 13 developable menus (confirmed menu images, 134/134-1/136): sale price, dev time, unlock level; button = dev cost → existing `dev`; while developing → `즉시 완료 N 다이아` (135-2); developed → `개발 완료`. The menu grid in 가게 관리 still offers the same actions.
- **가게 관리 업그레이드**: no purchasable café upgrade exists (café level is automatic; expansion/2층/paid slot prices are UNSET) → popup shows `준비 중`.

## §16 art requests
- Tab icons: 알바, 미션, 상점 (text labels now); optionally a dedicated 가게 관리 icon (now the M-01 drink) and 시바 tab icon (now the portrait).
- 알바 faces for the popup: 데이케어 알바, 산책 알바, 훈련사, 매니저 (empty face slots now).
- ~~Coin / diamond icon for the green price buttons~~ — resolved 2026-10-14 (`res-coin.png` / `res-diamond.png`).
- Optional: ribbon, window frame, close-X and green button art to replace the CSS chrome.

## §16 questions
1. Six tabs (시바·알바·가게 관리·미션·가구·상점) have no exact centre. Keep six with 가게 관리 as the bigger 3rd item, or drop to five (e.g. 시바 inside 가게 관리 or 알바) so the main item is centred? And which item is "main": 가게 관리 (now) or 미션 (as in the reference)?
2. Should the 가게 관리 tab keep the 14-card menu grid next to the 메뉴 개발 popup, or should the popup be the only menu-development screen?
3. What are the 가게 관리 upgrades (items, effects, prices)? None exist in spec-v3, so the popup is `준비 중`.
4. 산책 알바 hires up to 4 shibas for one price and 훈련사 needs a trick choice; the popup hands off to the existing walk/care screens. OK, or should those choices move into the popup?
5. Which events should light a red dot beyond the three used (developable/finished menu, shiba injured/sick/level-up, helper available)? E.g. walk returned, rescue waiting, heart reset usable.

Validation: `npm test` passes (adds `tests/unit16.test.mjs`). Chrome ran in this sandbox this time: `npm run test:browser` → 116/116 checks, 0 page errors (adds §16 row/dots/popup/scroll/null-price checks; tab ids updated). `capture-main-screen.mjs --u16` writes `main-screen-u16-tabs.png`, `main-screen-u16-popup-alba.png`, `main-screen-u16-popup-menu.png` (+ `main-screen-u16-state.txt`), DPR2; the default run also produces them; `--u14`/`--u15` and all earlier outputs still run. Images were checked in a scratch dir only, not written to `/workspace/shiba-cafe-docs/spec-v3-build/`.

Changed files: tabs.js (new), main.js, index.html, sim.js (albaCheck null guard), package.json, tests/unit16.test.mjs (new), tests/smoke-browser.mjs, tests/smoke-steps.mjs, capture-main-screen.mjs, SPEC-V3-NOTES.md.

## §17 tabs / 가게 관리 / upgrades / balance (answers 2026-10-14 to §16 questions)
Supersedes the contradictory parts of '§16 tabs' and '§16-2 list popup' above (six tabs, 미션 tab, 14-card menu grid, 업그레이드 `준비 중`).

1. **Five bottom tabs** (`tabs.js` `TABS`): 시바 · 알바 · **가게 관리** (centre, 3rd of 5, larger) · 가구 · 상점. 미션 tab removed; 미션 is now a small `미션` button in the top bar right next to `설정` (`#hud [data-act=mission]`) → toast `준비 중`, no state change. CSS-only button, text label (no icon art).
2. **Menu development = popup only.** The 14-card menu grid (`[data-main-menu]`, `.menu-card` CSS) is removed. 가게 관리 now shows: buttons 메뉴 개발 (popup) / 업그레이드 (popup) / 손익계산서; café card (Lv, EXP, 평판, 배치 가능 시바, 최대 손님, upgrade levels); current development card (existing `devCard`, finish-now) and `개발 완료 n / 13`. Customer strip stays in the heading.
3. **가게 관리 업그레이드** (`CFG.upgrades`, `s.upgrades` levels, saved; older saves → 0): `seat` 좌석 추가, `interval` 손님 간격 단축, `price` 판매가 인상, `queue` 대기 줄 연장. All `price:null` → popup button `미정`, disabled; `S.upgradeCheck` returns `'unset'`, `S.buyUpgrade` refuses. `maxLevel:null` (no known cap). Effects:
   - seat `effect:1` — **starting value 2026-10-14, pending user confirm** — `capOf` + 1 max guest per level (physical seats from furniture still limit seating).
   - queue `effect:1` — **starting value 2026-10-14, pending user confirm** — +1 queue cell per level, continuing the map's grass line ([0,10], [0,11]…), still capped by 갱신 66 `queueMax` 10.
   - interval / price `effect:null` — no effect. Hooks exist (`arrivalInterval` × effect^level, `payFor` base × effect^level); the multiplicative form is an engineering placeholder for when a value arrives (question 1 below).
   - Buying (once a price exists) spends coins but is **not** a ledger line (user 2026-10-15; the `upgrade` category is removed). The 가게 관리 red dot also lights when an upgrade is affordable (never while prices are null).
4. **산책 알바 / 훈련사 handoffs kept** (walk screen / care screen), unchanged.
5. **Red dots** additionally from real state: 시바 lights while a returned walk's result is waiting (`s.walkResults`, now kept in state until the result popup's 확인 — `walkResultOk`; before, results moved straight into UI-only modals) and while a rescue is waiting (`s.rescues`).

**Balance starting values** (each marked `starting value 2026-10-14, pending user confirm` in `config.js`):
- interaction (meet) `visit.meetSec` 7 → **5 s**; post-interaction roam `visit.roamSec` 5 → **3 s** (replaces the 갱신 70 values).
- early game: `rep.unmetFreeBelowLevel:5` — below café Lv5 (the '손님 4명 이하' phase) a guest who met no shiba is still `disappointed` (exp 0, pays ×1) but reputation is unchanged; from Lv5 it is −1 as before.
- Observed (sandbox run, not a spec value): 12 h offline-style run with one Lv21 starter, coins 0, full gauges, production map/behaviour → no closure, café Lv7, 평판 99, 2,616 served (2,131 satisfied / 485 normal / 0 disappointed), Lv5 reached after ~3.1 h. The Unit 5 balance flag (closure at Lv1 after ~17 min) no longer reproduces with these values. Many guests still turn back (2,830 queue timeouts, 4,477 lost to a full queue) because only two cushions exist.

### §17 questions
1. Upgrade prices (per level or flat), max levels, and the effect sizes for 손님 간격 단축 and 판매가 인상. Are they multipliers per level (current hook) or flat amounts?
2. Should 좌석 추가 also add a physical cushion, or only raise the guest cap (current behaviour; seating still needs placed furniture)?
3. 미션 button: is a `준비 중` toast OK, or should it open an empty 미션 popup?
4. **Answered, user 2026-10-15:** natural regen cap **10** (spec v3), top bar **5 slots**, `+N` above 5 (`hearts.regenCap:10`, `hearts.slots:5`, both confirmed). Original question: **CONFLICT — heart cap 5 vs 10.** Interior §17-1 shows 5 heart slots, '최대 5개(시작값)'. Spec v3 1.4 / 갱신 28·31 (confirmed) say natural regen stops at **10** (30 min each; reward hearts may exceed it). Built: `hearts.regenCap:5` (starting value, used both as regen cap and slot count), 30 min regen from spec v3, overflow kept and shown as 5 filled + `+N`. Which cap is right — 5 or 10? If 10, should the bar show 10 slots or 5 slots + `+N`?
5. **Answered, user 2026-10-15:** starting hearts 10 and 하트 리셋권 → 10 stay (they match the cap). A new game shows 5 filled + `+5`, no countdown until hearts drop below 10. Original question: Follow-ups of (4), unchanged for now: starting hearts stay **10** (1.4 기본 소지) → a new game shows 5 filled + `+5` with no countdown until hearts drop below 5; 하트 리셋권 still fills to **10** and works only below 10 (갱신 32). Should both follow the new cap (5)?
6. **Answered, user 2026-10-15:** heart only when the guest's request was met (incl. 매니저); meeting a shiba alone → coin only. `feedback.heartIfRequestMet` / `heartIfMetShiba` removed. Original question: '완전 만족' for the heart float (§17-5): built as request met (incl. 매니저 대신 충족) **or** met at least one shiba (`feedback.heartIfRequestMet` / `heartIfMetShiba`, starting values). Should meeting a shiba without the request count?
7. 오프라인 수입 = café payments settled by the offline fast-forward: on launch (game closed) **and** after the tab/app was hidden (same catch-up and offline report). Should a backgrounded app count as 'closed', or only a real relaunch?
8. **Answered, user 2026-10-15:** drop it — no `가게 업그레이드` line. Original question: 손익계산서: §17-2 does not list `가게 업그레이드`. It is kept after 가구 구입 and shown only when non-zero (never today: all upgrade prices are null). Keep, merge into another line, or drop?
9. **Answered, user 2026-10-15:** queue timeouts only (as built); turned-away guests get none. Original question: 화난 손님 (§17-6): only queue timeouts emit 빠직 now. Guests who turn back because the queue is full (`lost`, never queued) do not. Should they?
10. **Answered, user 2026-10-15:** keep the price button hidden (no change). Original question: Locked list cards (§17-4) show name + `Lv{N} 해금` only — the price button is hidden too (shown in the tap detail). OK, or keep a disabled price button?

### §17 art requests
- 미션 button icon (top bar); faces for the 3 current upgrade rows (empty face slots now).
- Optional: 알바 faces (4) for the 알바 고르기 cards (still empty slots); a 하트 리셋권 icon (still the `icons-final-check.jpg` sheet tile).

Validation: `npm test` passes all 10 suites (adds `tests/unit17.test.mjs`: starting values, early-game reputation by level, null-price gating, test-priced purchase/ledger/maxLevel, seat/queue hooks and null interval/price hooks, save/load, walk-result/rescue dots). `tests/smoke-steps.mjs` and `tests/smoke-browser.mjs` updated (five tabs in order with centred main item, 미션 top-right stub, popup-only menu development incl. finish-now and last-row scroll, upgrade popup 4 × 미정 disabled and click-does-nothing, 가게 관리 status without grid, walk-result/rescue dots and acknowledge). **Not run here**: the user runs browser tests. `capture-main-screen.mjs --u17` writes `main-screen-u17-tabs.png`, `main-screen-u17-manage.png`, `main-screen-u17-upgrades.png` (+ `main-screen-u17-state.txt`) at DPR2; the default run includes them. `main-screen-u2-menu.png` / `main-screen-u5-menu.png` now show the 가게 관리 status screen (no grid).

Changed files: config.js, sim.js, tabs.js, main.js, index.html, package.json, tests/spec-v3.test.mjs, tests/unit5.test.mjs, tests/unit16.test.mjs, tests/unit17.test.mjs (new), tests/smoke-steps.mjs, tests/smoke-browser.mjs, capture-main-screen.mjs, SPEC-V3-NOTES.md.

## §17-1…17-6 hearts / ledger / short texts / floats + 그림이 icons (2026-10-14)
**0. Browser smoke fix (6 failures after the uncommitted §17 tab/popup changes).** Causes: (a) app bug — `confirmYes` had been pasted onto the end of the `walkResultOk` `//` comment in `main.js`, so confirming a level-up did nothing; (b) test bug — the new walk-result/rescue dot checks set `coins=0` and never restored the Lv10/8,000 fixture, so every 알바 price button was disabled and the daycare hire chain failed; (c) test bug — `/최대 손님 \+1명/` inside a JS template literal lost its backslash (`\+` → `+`, "one or more spaces"). Fixed the app for (a), the tests for (b)/(c).

**Icons.** `ui/res-coin|res-heart|res-heart-empty|res-diamond|res-paw|ui-gear.png` (MAP.md section '그림이 UI icons (2026-10-14)', sha256 verified). Top bar pills use `<img class="resource">`; the CSS-drawn coin/heart/diamond/paw shapes are deleted. Settings = gear image, `aria-label="설정"`, no text. Price buttons show coin / diamond / paw images (`priceText(n, unit)` → `ico(unit)+n`) in the list popups, shop, care screen, finish-now buttons, gacha and 다이아 상품; the 💎/🐾 emoji stand-ins are gone from `main.js` and `i18n.js`. `.ico.reset` (하트 리셋권) still uses the old sheet tile — no new icon for it.

**§17-1 hearts.** Top bar = `CFG.hearts.regenCap` heart slots (filled `res-heart`, empty `res-heart-empty`), no number. Above the cap: all slots filled + small `+N`. Below the cap: `mm:ss` to the next heart just under the pill (`#heartT`). `hearts.regenCap:5` = **starting value 2026-10-14, pending user confirm** (conflict with spec v3's 10 → '§17 questions' 4–5); `regenEverySec:1800` = spec v3 (confirmed). Reward hearts above the cap are kept (existing `settleHearts`). *(Superseded 2026-10-15 — see 'Reviewer fixes (2026-10-15)'.)*

**§17-2 ledger.** Income: 메뉴 판매 · 시바 만남 추가 수입 · 오프라인 수입 (payments settled by the offline fast-forward only) · 기타 수입 (new `other`: the walk 멍코인 reward when it becomes configured; any future non-sales coin income). Expense: 알바비 · 병원비 · 메뉴 개발비 · 액세서리 구입 (renamed from 반다나 구입비; `buyAcc` covers every accessory) · 가구 구입 (new `furniture`, always shown, 0 — no purchase exists) · then 가게 업그레이드 only when non-zero (question 8). *(Superseded 2026-10-15 — see 'Reviewer fixes (2026-10-15)'.)*
**§17-3.** Ledger row padding 10px → 4px (line-height 1.2; rows ~23 px instead of ~36 px).

**§17-4 short texts.** List cards = name + ONE line; details only after tapping the card body (face or text; inline `.lp-detail`, one open card per list, `ui.lpOpen`; tapping again closes). 알바: 데이케어 알바 "시바랑 놀아줘요", 산책 알바 "산책 4마리" (`maxShibas`), 훈련사 "훈련 1회 성공", 매니저 알바 "12시간 대신 운영" (`hireSec`); active manager "운영 중 h:mm:ss". Locked cards: "Lv{N} 해금" from CFG `unlock`/`unlockLevel`, dimmed, no price button (question 10). 메뉴 개발: "판매가 N멍" / "개발 중 h:mm:ss" / "Lv{N} 해금"; detail = 판매가 · 개발 시간 · 개발비 · 해금 레벨. 업그레이드: "좌석 추가 Lv0" + "최대 손님 +1명" / "효과 미정" / "대기 줄 +1칸"; detail = effect · 가격 · 최고 레벨. 가게 관리 heading summary = "착석 N · 대기 N" (+ " · 결제 미정" only while the last payment is undecided); café card shortened to 3 lines; the dev card drops the long 1-diamond-per-minute note (still in the menu card detail).

**§17-5 payment floats.** On `leave`, a paid guest (`coins != null`) floats a small `res-coin` from the head; '완전 만족' (`requestMet` or `metShiba` on the leave event, gated by `CFG.feedback.heartIfRequestMet` / `heartIfMetShiba`, starting values) adds a small `res-heart` beside it. Guests are invisible, so head = foot cell + `FLOAT_LAYOUT.headOffset` `[0,-90]` image px (map-data.js). Float: rises `risePx` 40 image px and fades (opaque for the first 40 %) over `CFG.feedback.floatSec` = 1 s; icon 30 / 26 image px (≈ 13 / 11 CSS px); coin/heart offset ±12 px when together. Floats live in `w.floats` (UI-only), aged in `step()`, drawn by `isomap.js`; the old canvas text "+N 멍코인" + order image at the leaving guest is replaced. Offline fast-forward makes no floats. *(Superseded 2026-10-15 — see 'Reviewer fixes (2026-10-15)'.)*
**§17-6 anger.** Queue timeout `angry` events now carry the guest cell → `w.floats` gets an `angry` float with the same 1 s life, but `FLOAT_ICONS.angry = null` → nothing is drawn (art request). *(Superseded 2026-10-15 — see 'Reviewer fixes (2026-10-15)'.)*

**Starting values added (all 'starting value 2026-10-14, pending user confirm')**: `hearts.regenCap 5`; `feedback.floatSec 1`; `feedback.heartIfRequestMet true`, `feedback.heartIfMetShiba true`; `FLOAT_LAYOUT` headOffset `[0,-90]`, risePx 40, iconPx coin 30 / heart 26 / angry 30, stagger ±12. *(Superseded 2026-10-15 — see 'Reviewer fixes (2026-10-15)'.)*

Validation: `npm test` — all 10 suites pass (`unit17` now 16 tests: icon files 128×128 RGBA + MAP.md sha256, no CSS shapes/emoji, heart cap/countdown/overflow, ledger order/labels/always-shown 가구/other income/offline, §17-3 padding, leave/angry event fields, float layout + null 빠직 slot; `spec-v3` heart assertions follow the cap). Browser smoke ran here: `node tests/smoke-browser.mjs` → **138/138, 0 page errors** (twice); new checks for icon images + gear, heart slots / `04:32` / cap / `+3`, ledger order + padding, short alba/menu/upgrade lines, locked "Lv{N} 해금", tap-to-expand/collapse, summary line, coin+heart float drawn and gone after 1 s, angry float with nothing drawn, unpaid → no coin. `capture-main-screen.mjs --u17b` writes `main-screen-u17-{topbar,ledger,alba,menu,manage,float,tabs}.png` + `main-screen-u17b-state.txt` (DPR2, `?temp=1` staging); run here into a scratch dir only (`/tmp/u17b`) and inspected — nothing written to `/workspace/shiba-cafe-docs/spec-v3-build/`. `--u16` / `--u17` still run.

Changed files: config.js, sim.js, map-data.js, isomap.js, main.js, i18n.js, index.html, assets/drive/MAP.md, tests/spec-v3.test.mjs, tests/unit17.test.mjs, tests/smoke-browser.mjs, tests/smoke-steps.mjs, capture-main-screen.mjs, SPEC-V3-NOTES.md.

## 밸런스_2년 starting values (2026-10-15)
Source: `/workspace/shiba-cafe-docs/시바카페_밸런스_2년.md` (final; 시바 배치 최대 10마리 유지). Every value below is marked `starting value 2026-10-15 (밸런스_2년.md §N), pending user confirm` in `config.js`. Supersedes, for these keys: the §3 UNSET rows for `start.coins` and `cafe.expansion2FCost`, Unit 2 question 9 (start coins / 2층 part), Unit 3 questions 2–3 (2층 and theme costs; 2층 now **has** a level requirement from the file), and the '§17 Balance starting values' offline observation (it used the 갱신 98 curve).

| Key | Was | Now | File |
|---|---|---|---|
| `cafe.expToNext` (Lv1→50, 49 steps) | 갱신 98, sum 676,180 | `[11100 … 1393900]`, sum **27,653,000** (test checks sum + every §2 checkpoint) | §2 |
| guest exp / cap / interval / `maxPlaced` | — | **unchanged** (1·2·0, 갱신 75 table, 100 × cap/h, 10) | §2, §4 |
| `menu.items[].devCost` | 갱신 134-1 (8,500 … 35,500) | **15×** 134-1, except 라테 `M-02` = **15,000** → 150,000 · 180,000 · 202,500 · 225,000 · 255,000 · **277,500** (파르페) · 352,500 · 405,000 · 457,500 · 480,000 · 510,000 · **532,500** (파블로바) | §3, 수인님 확정 |
| `alba.*.cost` | 갱신 125-1 8,000 / 18,000 / 24,000 / 60,000 | 15× → **120,000 / 270,000 / 360,000 / 900,000** (데이케어 / 산책 / 훈련사 / 매니저) — matches the §3 check table | §3, 수인님 확정 |
| `cafe.expansion2FCost` | null | **7,000,000멍** | §3 |
| `cafe.expansion2FLevel` (new) | — | **30** ('Lv30부터') — enforced in `spaceUnlockCheck` → `'locked'` | §3 |
| `themes.fuji` | cost null | `unlockLevel` **20**, `unlockCost` **2,400,000멍**, `unlockDia` **1,500** | §3 |
| `themes.bamboo` | cost null | `unlockLevel` **35**, `unlockCost` **5,400,000멍**, `unlockDia` **3,000** | §3 |
| `start.coins` | null | **30,000** (wired: `newState`) | §5 |
| `start.dia` | 0 ('유료로만' 132-2) | **300** (wired: `newState`) — see question 5 | §5 |
| `grants14` (new, config only) | — | `start` {30,000멍, 300다이아, 기본 가구 세트 5, 반다나 1} · `days1to7` daily {15,000멍, 50다이아, 하트 리셋권 1, 경험치 부스트 4h 1} · `days8to14` every 2 days {25,000멍, 100다이아} · `items` 수익 부스트 4h ×3, 쿨타임권 ×5, 큰 물약 ×2 with `day:null` · 캡슐 4·9·11일 stay in `stub.onboarding` (not duplicated) | §5 |
| `pending.startCoins` | null placeholder | removed (the live value is `start.coins`) | — |

Not applied (instruction): 땅 넓히기 (`expansion.rowCost` stays null), 가구 prices, 가게 업그레이드 prices — the file's suggestions for these are left in the file only.

Wiring: only the start grant has an existing mechanism (`CFG.start` → `newState`). There is no daily/claim mechanism (`stub.onboarding.dayMode` is still UNSET and nothing reads `stub.onboarding`), so day 1–14 grants are config only. Items without a runtime system — 경험치 부스트 (`stub.expBoost` has no effect and no inventory slot), 수익 부스트 as an item (only `cafe.boostUntil` exists), 쿨타임권 (`items.cooldownTicket` exists, no use action), 기본 가구 세트 — are config only. `?temp=1` staging: unaffected (smoke 138/138); only assertions that encoded the old `null` coins and old prices changed, and `capture-main-screen.mjs` fixtures now read `CFG.alba.*.cost` instead of assuming 8,000 / 60,000 were affordable.

### Guest-miss share (`node tests/balance-sim.mjs`, `npm run sim`)
Production config, default furniture (**2 seats**: `cushion-back`, `cushion-front`), 1 simulated hour per row, mean of 3 seeds, dt 0.1 s. File assumption (§1): served = 90 per cap-hour of 100 × cap arrivals → 10 % missed.

| Lv | shibas | cap | arrivals (expected) | served | turned away | left queue | miss % | served per cap-hour (file: 90) |
|---|---|---|---|---|---|---|---|---|
| 1 | 1 | 5 | 549 (500) | 220 | 107 | 216 | 58.8 | 44.1 |
| 1 | 2 | 5 | 548 (500) | 210 | 102 | 230 | 60.6 | 42.1 |
| 10 | 1 | 9 | 988 (900) | 221 | 532 | 230 | 77.2 | 24.5 |
| 10 | 4 | 9 | 982 (900) | 211 | 501 | 264 | 77.9 | 23.4 |
| 20 | 1 | 14 | 1,536 (1,400) | 221 | 984 | 325 | 85.2 | 15.8 |
| 20 | 6 | 14 | 1,517 (1,400) | 213 | 976 | 322 | 85.6 | 15.2 |
| 30 | 1 | 18 | 1,977 (1,800) | 221 | 1,422 | 328 | 88.5 | 12.3 |
| 30 | 8 | 18 | 1,955 (1,800) | 211 | 1,406 | 332 | 88.9 | 11.7 |
| 50 | 1 | 22 | 2,415 (2,200) | 222 | 1,860 | 328 | 90.6 | 10.1 |
| 50 | 10 | 22 | 2,387 (2,200) | 213 | 1,838 | 330 | 90.8 | 9.7 |

Reading: served is flat at ~210–222/h at every level — the 2 seats are the bottleneck (each seat turns over about every 33 s: walk in + 30 s 체류). Guest cap and shiba count do not raise throughput; more shibas slightly lower it (meetings can extend a visit). Arrivals run ~10 % above 100 × cap because 평판 climbs to ≥ 70 within the hour (arrival interval × 0.9, 갱신 87). The file's ×90 assumption therefore holds only if seating grows with the guest cap; with default furniture the measured miss share is 59 % (Lv1) → 91 % (Lv50), and served/hour at Lv30 is ~1/7.5 of the file's 1,620.

Test side effect: '20 h away → 임시휴무' (spec-v3) depended on the old curve passing café Lv5 within minutes. Under the new curve the café is still Lv1 after the 12 h cap (4,758 / 11,100 exp), and below Lv5 unmet guests cost no 평판 (`rep.unmetFreeBelowLevel`), so it no longer closes. The test now stages café Lv5.

### 밸런스_2년 questions
1. **Seats vs the ×90 assumption.** With the default 2 seats the café serves ~220 guests/h at every level (miss 59–91 %, table above), not 90 × cap. Should the 2-year curve assume default furniture, or a seat count per level (then: how many seats when, and through what — 가구 purchases or the 좌석 추가 upgrade, both unpriced)? Until then real play is far slower than 730 days to Lv50 unless players add seats.
2. 8~14일 '2일마다' 25,000멍 + 100다이아: which days? Built as `{fromDay:8,toDay:14,everyDays:2}`; days 8·10·12·14 give exactly the file's ~235,000멍 14-day total (30,000 + 7 × 15,000 + 4 × 25,000) and 1,050 diamonds (file: '약 1,000').
3. 수익 부스트 4h ×3, 쿨타임권 ×5, 큰 물약 ×2 (8~14일 row): which day(s)? `day:null` now.
4. Day grants need a mechanism that does not exist: how are days counted (calendar day since install vs login days — `stub.onboarding.dayMode` UNSET) and are they auto-given or claimed with a button? The same mechanism would also deliver the existing 하트 리셋권 / 캡슐 onboarding.
5. Start 300 다이아 contradicts 132-2 ('다이아는 유료로만', previous `start.dia:0`). Built as 300 per the file — confirm.
6. '기본 가구 세트 5개': is that the existing default placement (카운터, 방석 2, 찻상, 계단 = 5 pieces) or 5 extra items? Which bandana (1.5/139-6 starter accessory identity is still UNSET)?
7. Items with no system yet — 경험치 부스트 (no effect in `addCafeExp`), 수익 부스트 as an inventory item, 쿨타임권 use action: build them now or keep config only?
8. Level gates 2층 Lv30 / 후지산 Lv20 / 대나무 Lv35 are enforced in `spaceUnlockCheck` (UI still has no unlock button). The 다이아 price for themes (`unlockDia`) has no purchase path — wanted, and for 2층 too?

Validation: `npm test` — all 10 suites pass (spec-v3 94/94; new exp-table test checks length, sum 27,653,000 and every §2 checkpoint, plus unchanged guest exp/cap/interval/10 shibas; menu table checks 15× + 라테 15,000 + 파르페/파블로바; 알바 costs; unit3 checks 2층/theme values and level gates; unit16 red dots with start coins). `node tests/smoke-browser.mjs` → 138/138, 0 page errors. `node tests/balance-sim.mjs` → table above (~50 s).

Changed files: config.js, sim.js (`spaceUnlockCheck` level gate), package.json (`npm run sim`), README.md, tests/balance-sim.mjs (new), tests/spec-v3.test.mjs, tests/unit3.test.mjs, tests/unit16.test.mjs, tests/smoke-browser.mjs, tests/smoke-steps.mjs, capture-main-screen.mjs (fixtures read config prices), SPEC-V3-NOTES.md.

## Reviewer fixes (2026-10-15)

- **빠직 icon.** `assets/drive/ui/emo-angry.png` (128×128 RGBA; Drive `이미지/interior/UI_감정_빠직.png`, id `1QsESC0UaHiiSMDX15Jde-OG5hVPA82JM`, sha256 `4226a657…d503a7`, verified) added to MAP.md '그림이 UI icons'. `FLOAT_ICONS.angry` points to it; `FLOAT_LAYOUT.iconPx.angry` = 30 = coin float size. The queue-timeout anger float is now drawn (1 s rise/fade like coin/heart). Removed from the art requests.
- **Heart float = request met only.** `floatsFor` draws a heart only when `e.requestMet` (request fulfilled, incl. manager); a guest who only met a shiba gets the coin only. The two `CFG.feedback` flags are gone (`feedback = {floatSec:1}`).
- **Ledger.** `가게 업그레이드` (`upgrade`) removed from `ledgerCategories`; `buyUpgrade` no longer books a line; the hide-at-0 mechanism is removed (no line uses it). 가구 구입 still always shown at 0; every other line unchanged.
- **Locked cards** keep the price button hidden (confirmed; no code change). **빠직** only for queue timeouts (confirmed; no code change).
- **Hearts confirmed.** `hearts.regenCap` 5 → **10** (spec v3 1.4, confirmed, no longer a starting value); new `hearts.slots: 5` (confirmed) = top-bar slot count; `+N` above 5; mm:ss countdown while hearts < 10. 하트 리셋권 still fills to 10 (`heartReset.fillTo`).
- **Starting values removed from the list:** `hearts.regenCap 5`, `feedback.heartIfRequestMet`, `feedback.heartIfMetShiba`. **No new starting values.**
- **Tests.** `unit17`: 7 icons incl. emo-angry + MAP.md sha; cap 10 / 5 slots / overflow / reset 10; no upgrade ledger line (also when bought); meet-only guest → `requestMet:false`; heart rule in `floatsFor`; angry icon set at coin size. `spec-v3`: cap/slots. Browser smoke (`npm run test:browser`, run here): 142/142, 0 page errors — 5 slots at 2/5/8/10/13 hearts (`+3` with countdown, `+5`/`+8` without), 빠직 drawn and gone after 1 s, meet-only → coin only, request met → coin + heart.
- **Capture.** `capture-main-screen.mjs --u17c` (run here) → `/workspace/shiba-cafe-docs/spec-v3-build/main-screen-u17-float-angry.png` (real queue timeout, 빠직 held at 25 % of its rise) and `main-screen-u17-float.png` (real request-met guest, coin + heart) + `main-screen-u17c-state.txt`, DPR2, `?temp=1` staging. `--u17b` shares the same float helper (now waits for a request-met guest) but was not re-run.
- **Resolved u18.** All three floats share 30 CSS px.


## §17-7 · §17-8 (2026-10-15)
- Interior §17 read in full; handoff-v1/spec-v3.md consulted. 1-cell 가벽 uses cell occupancy (edge occupancy is unspecified). Shares furniture drag, front directions/rotation, removal and persisted placement. No wall sprite is drawn: `SPRITES.wall.file/anchor/back = null`; edit grid footprint only, also used for pointer selection.
- Every edit (including other furniture) preserves previously reachable unoccupied floor and seat cells, every current seat, and a walkable approach to each counter. Entrance blocked or disconnected → `입구가 막혔어요!`, with no placement mutation. Removal opens cells. Upper floor has no entrance or editable slots yet; this validation applies to the existing editable ground floor.
- Only manager has staff map state (`world.manager`, idle/walking, furniture-aware routes, existing guest cell-step speed); expiry/closed café removes it. Other helpers continue effects only, with no character entry. Historical state, superseded by u18: approved manager frames/anchor are integrated; no debug text is created.
- Starting values: no new numerical gameplay values. 1-cell footprint is user requested. Direct entrance occupancy remains prohibited (interior §17-7 starting value 2026-10-15, pending user confirm). Manager reuses existing `CFG.navigation.cellStepSec`, with no new speed or pause duration.
- Questions: confirm cell occupancy vs edge occupancy; wall inventory count and price (`PARTITION.count/price = null`); how are walls acquired? Until confirmed, edit mode allows layout placement without a purchase, price, inventory grant or deduction (no stock number is asserted). Should the manager patrol free floor or visit particular work stations, and at what speed/pause duration? Should preserving all existing reachable floor be the final rule?
- Art requests: transparent 1-cell partition PNG matching 128×64 isometric floor contact, front and back views for four directions, anchor and shadow metadata. Approved manager frames/anchor are now supplied (u18); separate shadow art remains null; other helpers need list portraits only, no map motion.
- Capture: `node capture-main-screen.mjs --u17d` writes `main-screen-u17-walls-edit.png`, `main-screen-u17-walls-blocked.png`, `main-screen-u17-manager.png` at existing 390×844 CSS / DPR2 to `/workspace/shiba-cafe-docs/spec-v3-build/`. Uses unsaved TEMP stage; manager is hired through existing API with configured unlock/cost. Smoke and capture scripts updated; Chrome deliberately not run in sandbox.


## 갱신 141 — 2026-10-15 confirmed 결정안
- Read 시바카페_결정안_병합_재화_MVP.md fully. Its §4 confirmations override older merge/diamond/MVP rules.
- Duplicate → that coat's first owned shiba gets 10 personal paws; no level change. Lv N→N+1 consumes 20×N personal paws; max Lv30. Starter remains Lv21 (compatible with cap).
- gacha-table.json is the only probability source: four coats equally weighted, one stamp per pull, 50 stamps redeem a chosen shiba (duplicates use the same personal-paw conversion). Paid pulls and capsule pulls earn stamps. Odds popup is reachable from shop; it imports the same JSON as the core.
- 1 diamond = 10 won confirmed. Free diamonds allowed only for events, onboarding and ranking. Existing grant quantities remain previously recorded starting values; permission for these sources is now confirmed.
- Rescue removed from runtime/config/UI/red dots/tests/capture scenarios. Subscription had no implemented code/UI/tests and remains excluded. Adoption remains. Fatigue only blocks walking at 100; removed fatigue condition/training penalties and forced sleep/work/play restriction.
- New numeric starting values: none. Existing walk fatigue +15/+25/+35 and null recovery remain; the decision's proposed +20/+35/+50 and sleep −20/hour are not independently confirmed by §4 question 5.
- Questions (null, no guessed values): gacha.startLevel remains null. What is the level for a newly drawn/chosen shiba? Paid/capsule pulls remain disabled until answered; odds screen and selecting an already owned coat with enough stamps work. Confirm whether the proposed new fatigue increments/recovery should replace the existing table. Start coins conflict: decision §2 proposes 1,000 versus existing 30,000 from balance file; retained existing starting value pending answer. Stamp carryover is preserved (spend 50, retain remainder); does the choice reward consume stamps this way? No invented ad/starter-pack quantities/prices added; those flows remain pending.
- Art requests: no new artwork needed for this update; existing coat portraits and paw icons reused. Existing outstanding art requests remain.
- Capture: node start-room-3d/capture-main-screen.mjs --u141 → /workspace/shiba-cafe-docs/spec-v3-build/main-screen-u141-{levelup,odds,shiba}.png, DPR2, unsaved TEMP fixture. Levelup shows Lv21→22 confirmation and personal cost. Chrome scripts updated only, not run in sandbox.

### Land expansion §11·§12 — 2026-10-15

- Interior §11 and §12 read in full; latest two-axis land rules replace the older vertical-only wording. `space.unlockedRows` remains the save key but now counts alternating strips: `j` grows down-left, `i` grows down-right. A strip spans the current adjacent edge, so the corner becomes land when the second axis grows. Navigation, seats/table adjacency, placement bounds, restoration and edit grid use the same derived rectangle.
- Starting value 2026-10-15, pending user confirm: first expansion is down-left (`j`), next down-right (`i`), alternating thereafter. The specification confirms alternation but does not specify which axis starts. No new economy numbers or camera tuning numbers were introduced; pan bounds come from land/tile and marker geometry.
- `CFG.expansion.rowCost` remains **null**. The proposal 170,000멍 and ×1.6 is **not applied**. Questions: what is the approved first price and subsequent strip price rule? Which diagonal should expand first?
- Each new cell uses the existing approved `assets/drive/tiles/tatami-approved.png` (타일_바닥_다다미_칸.png). Grass is excluded from owned cells; no code-drawn floor or normal-view strip outlines. `space.flooring` is persisted; `selectFlooring` accepts only unlocked flooring with approved tile art. Existing saves default to the existing 다다미 floor. Only 다다미 has a usable approved tile mapping today. Art request: matching approved repeatable floor tiles for any additional selectable flooring; no substitute is drawn for those themes. Characters with null art remain invisible.
- Approved 표시_땅넓히기 marker is centred on the **next adjacent strip**, without the old detached-row offset. Tapping retains `상점 준비 중이에요`. Dragging pans horizontally and vertically with clamped land bounds; furniture dragging remains cell placement.
- Debug: `?temp=1&expansions=N` unlocks N strips, including zero; `rows=N` is retained as an alias. In TEMP, `__game.debugExpand(N)` changes the count and syncs routes for staged tests. Production rejects it; TEMP never writes production saves. Normal configured unlocks and new-cell furniture placements persist through the existing save path.
- Unit coverage adds alternating dimensions/strip cells, new-cell pathfinding and placement, flooring validation, expanded save restoration, approved floor draw counts, complete grid, marker axis and both pan clamps/drag. Browser smoke adds query/API staging, all requested stages, real two-axis drag, production debug rejection and save/reload. Browser smoke and captures are updated but **not run** (Chrome cannot launch in this sandbox).
- User-run capture: `node start-room-3d/capture-main-screen.mjs --u12` writes DPR2 `main-screen-u12-expand-0.png`, `main-screen-u12-expand-1.png`, `main-screen-u12-expand-2.png`, `main-screen-u12-expand-3.png`, and `main-screen-u12-pan.png` into `/workspace/shiba-cafe-docs/spec-v3-build/`. Capture mode uses isolated TEMP state and an actual sideways drag for the pan image. No capture artifacts were written by this task.
- Validation: `npm test` run inside `start-room-3d/` passed after the implementation; `node --check` passed for the renderer, UI, smoke script and capture script; `git diff --check` passed. All modified files are under `start-room-3d/`. No git commit/push.

## Review fixes — 2026-10-15

- Normal view (including `?temp=1`) no longer creates the manager navigation label. Superseded by u18: no query enables debug text; approved manager sprites are now visible while hired. Removed the `refresh()` level-change toast that left “카페 Lv … · 레벨업!” over the back wall; café level/experience still update in the HUD and management card.
- Coin/heart/빠직 snapshot the emitting guest's current event cell and carry its guest ID. Rendering uses `floatOrigin()` with the same `cellToScreen`, zone view, expansion, pan and scroll as furniture. Captures group by guest ID rather than age (simultaneous guests can share an age). Renderer unit tests assert the actual icon draw coordinates equal that cell's screen point + head offset at nonzero pan/scroll. Payment/queue event tests retain coverage of current cell snapshots.
- Disabled Shiba level-up buttons use the same disabled background/text/shadow as the existing insufficient-heart care buttons, overriding the yellow button image. The existing insufficient-paws check still disables the action. Browser smoke checks compare computed disabled styles.
- Expansion tatami now uses `assets/drive/tiles/tatami-room-crop.png`: a direct central-cell crop of approved `room-tatami-noline.png`, with the existing approved tile's alpha silhouette. `python3 crop-room-tatami.py` reproduces it. Crop geometry is derived from the specified cell (3,3), centre (429,405), 128×64; no colour filter, painting, edges or borders were added. The original approved tile is preserved.
- Sideways camera movement remains enabled on expanded land. Smoke and `--u12` now overshoot fractional bounds by viewport-derived travel, avoiding browser mouse-coordinate rounding stopping just short of the exact clamp. Unit coverage exercises real pointer callbacks to both bounds. `--u12` writes `main-screen-u12-pan.png` after the actual sideways drag.
- `node capture-main-screen.mjs --rf` writes DPR2 `main-screen-rf-floats.png`, `main-screen-rf-levelup-dim.png`, `main-screen-rf-expand-tatami.png`, `main-screen-rf-manager.png` to `/workspace/shiba-cafe-docs/spec-v3-build/` by default. Unsaved TEMP fixtures: real payment at a seated guest's current cell (frozen at the payment instant), insufficient personal paws, expanded land, and hired invisible manager. No debug query. Screenshot helper clears toast text before capture.

Starting values: **none added**. Existing head offset, float sizes, rise and lifetime are reused unchanged; capture fixtures use existing config or derived geometry, not new balance defaults.

Questions: the final sprite head anchor remains **null** pending guest art. What head anchor should the guest sprite use? No new economy/timing decisions are needed for these fixes.

Art requests (updated u18): guest sprites with foot/head anchors remain pending. Approved plate edges and manager frames/anchor have been supplied and integrated; those requests are closed.

Validation: `npm test` passes. Chrome smoke/capture scripts updated and syntax checked only; intentionally not launched in this sandbox. User runs `npm run test:browser`, `node capture-main-screen.mjs --rf`, and `node capture-main-screen.mjs --u12` on the Chrome-capable host.

## §17-9 하트 쓰기 — 2026-10-15

- Interior §17-9 and the user task are the source. §16 list frame, res-heart, existing daycare portrait presentation reused. Empty action icon slots (`art:null`); no substitute drawings. Top-bar opens the list; spending keeps it open, per-shiba picker returns to it. Active effects show mm:ss; level unlocks toast. Insufficient balance dims buttons and exposes the immediate-grant ad stub with countdown. Purchase footer works; visit/invite buttons say `준비 중` and grant nothing until those flows exist.
- All new tuning below: **starting value 2026-10-15, pending user confirm**. `level:0` means available from start (a sorting sentinel, not a new café level). Time conversion ms/sec and neutral multiplier 1 are engine arithmetic, not additional tuning.

| Item | Unlock | Cost | Starting effects / limits |
| --- | --- | --- | --- |
| 손님 부르기 | start | 1♥ | 10min, arrivals ×1.5 |
| 쓰다듬기 | start | 1♥ | affinity +3, 3/day/shiba |
| 놀아 주기 | start | 1♥ | affinity +2, existing happy +10 |
| 간식 | start | 1♥ | existing happy +15, fatigue −10 |
| 산책 | start | existing | unchanged walk, affinity +1 on completion |
| 칭찬해 주기 | Lv5 | 1♥ | satisfaction reputation gain ×1.5, 30min |
| 빗질·마사지 | Lv8 | 1♥ | that shiba's income effect ×1.2, 30min; affinity/fatigue/cleanliness magnitudes null |
| 가게 음악 | Lv12 | 1♥ | 30min; one additional order payment per guest; stay extension null |
| 낮잠 이불 | Lv16 | 1♥ | happiness / recovery magnitudes null |
| 오늘의 추천 메뉴 | Lv20 | 1♥ | choose developed menu, 1h; demand / price magnitudes null |
| 메뉴 시식회 | Lv25 | 2♥ | 10min menu price ×1.2 |
| 행운 쿠키 | Lv30 | 1♥ | 3/day; coins/paws/item amounts and draw odds null |
| 특별 손님 초대 | Lv35 | 3♥ | 3 guests configured; guest selection odds/types and tip null, generation no-op pending decisions |
| 시바 장기자랑 | null | 2♥ | locked 미정; tip null |
| 간식 손님 대접 | null | 1♥ | locked 미정; all seated guests fully satisfied when unlocked |
| 소원상자 | null | 3♥ | locked 미정; 1/day, choose 1 of 5 next-login items; contents null, delivery unavailable until level/content confirmed |

- Affinity: separate per-shiba 0–100, starting 0; older saves migrate to 0. At 100, multiplier magnitude `null` → neutral. Existing intimacy unchanged. Happy/fatigue reuse existing gauges; unknown starting gauges stay null.
- Ads: 1♥ immediately, initial 3 consecutive claims, then 30min between claims, 10/day. Buy: 5♥ for 50 dia. Visit config: 3/day ×1♥; invite config: 1/day ×2♥ (both stubs). Existing regeneration: 1/30min to cap 10; rewards/purchases can exceed cap. No non-use penalty.
- Limits use existing KST ledger day and persist. Reusing a timed item refreshes its timer (same item + same shiba), without stacking; different actions coexist. This behavior is an implementation assumption pending confirmation, not a new magnitude.

Questions (all unspecified magnitudes remain null):
- Confirm all starting values above? What are brush affinity, fatigue or cleanliness amounts and which branch applies? Blanket happiness/recovery amounts (and duration/target)? Music stay extension? Recommended menu demand and price boosts? Affinity-100 guest multiplier?
- Cookie reward amounts, item identities and selection probabilities? Special guest regular/big-tip identities and selection probabilities, and tip amount? Talent tips and which guests qualify?
- Unlock levels for talent/treat/wish? Wish's five item identities and next-login delivery rule?
- Is praise's satisfaction multiplier intended for reputation gain (current hook) or a different satisfaction score/chance? Is brush's shiba effect the income multiplier (current hook) or a guest-arrival multiplier? Confirm refresh-without-stacking timing policy.

Art requests: 16 heart-action card icons (including walk) as supplied bitmap art; all reserved slots remain null. No guest/staff/character art added; invisible figures remain invisible.

Validation: `npm test` includes `tests/unit179.test.mjs`; browser smoke updated, not executed (Chrome sandbox limitation). Capture script updated, not executed: `node start-room-3d/capture-main-screen.mjs --u179` writes DPR2 `main-screen-u179-hearts.png`, `main-screen-u179-noheart.png`, `main-screen-u179-pick.png` under `/workspace/shiba-cafe-docs/spec-v3-build/`. Capture fixtures are unsaved; no output written outside the allowed workspace during this task.

## Executed Chrome regression fixes — 2026-10-15

- All three failures came from fixtures; existing app behavior and float projection were correct. No app or balance changes were needed.
- §17-9 smoke had already consumed unlock notifications at the manager level, then lowered the café to Lv1 without resetting the notification baseline. The isolated heart-list scenario now starts its notification baseline at its staged café level. Unit coverage confirms previously announced unlocks do not repeat after a level decrease/re-increase.
- §12 TEMP smoke left first-run language selection open; Chrome's real pointer hit the modal instead of the canvas. Set the fixture language before refresh. Three expansions also fit vertically in the real viewport, so the two-axis scenario now reuses the existing 18-expansion fixture to create actual vertical travel. Real Chrome pointer drags reach both horizontal and vertical bounds in both directions; renderer unit coverage checks the same return drag. The existing 0/1/2/3 grid and capture stages remain covered.
- `--rf` called `step(0)`, which correctly consumes no simulation time and emits no payment. It now advances by `CFG.navigation.cellStepSec`, after ending the staged guest's eating/playing activity. Existing payment checks require both floats to retain that guest's ID and exact seated cell. Smoke now creates an actual seated payment through `step()` instead of injecting a leave event. Unit coverage checks zero elapsed time, positive elapsed settlement, and the immutable seat-cell snapshot during exit.
- Executed `npm test` and `npm run test:browser` successfully (163/163 Chrome checks, zero page errors). Executed `node capture-main-screen.mjs captures --rf` and `node capture-main-screen.mjs captures --u12` successfully. All generated PNGs and result logs are under `start-room-3d/captures/`, within the authorized edit area.
- Read `captures/main-screen-rf-floats.png` visually: coin and heart appear above the occupied rear cushion/seat cell inside the room, rather than on empty floor or outside the left pillar. Guest sprite remains invisible, as required by its null art. Read `captures/main-screen-u12-pan.png` visually as well: the camera pans sideways over expanded tatami.

Starting values: none added; fixture counts reuse existing tests/configuration, travel derives from viewport/bounds, and payment advances by existing configured navigation time.

Questions: guest sprite head anchor remains null pending art; what is the approved head anchor? No new numerical decisions.

Art requests: existing guest sprite with foot/head anchors remains pending. No substitute art or shapes added.

No git commit or push; all edits and capture outputs are under `start-room-3d/`.

## u18 — approved plate edges, manager service and resolved values (2026-10-15)

- Original PNGs unchanged; all rows from `/workspace/prompts/s/maprows2.txt` appended verbatim to MAP.md under the requested heading. Sheet retained for reference only. Expanded land has approved left/down-left and right/down-right exterior plate pieces, a single bottom corner, top-vertex anchor (64,0), beneath all furniture/characters. Base room and expanded floor use the same cell projection and rim alignment. Floor-plate edges art request **closed**.
- Hired manager starts at a reachable counter-adjacent cell, finds a reachable free cell adjacent to a table with seated guests, waits, returns to the counter and repeats. Paths revalidate against furniture and one-cell walls. With no guests the manager idles at the counter; expiry removes it. Uses the furniture/shiba depth key, so rear positions are occluded. No debug text under any query. Other characters with null art remain invisible.
- Frame direction comes from projected screen delta (+i down-right, +j down-left, −i up-left, −j up-right). All four walk frames used; idle back-left uses stand-dl, back-right uses stand-dr. Per-frame opaque heights were measured from original PNG alpha bounds (152–158px); render scale = target screen height / measured opaque height, preserving supplied foot anchor (64,166). No code art or shadow substitute.
- Removed 좌석 upgrade from config, summary, popup and effects. Migration retains only current upgrade keys, discarding old seat level. Physical seating remains solely placed chairs/cushions; existing café guest pressure cap is unchanged.
- Walls occupy one cell (question resolved). Inventory count is total owned minus placed. Inventory placement consumes availability, removal returns it; no art means invisible wall in normal view. Additional purchases use the furniture ledger category and persist. Placement keeps entrance and reachable seats/counter accessible.
- All three floats use 30 CSS px, independent of map zoom. Gacha unlock config is Lv1. Heart list sorts by level; treat Lv10, talent Lv22, wish Lv40 resolve the old unlock questions.

All changed tuning below is **starting value 2026-10-15, pending user confirm** (also commented in source):

| Setting | Starting value |
| --- | --- |
| Manager visible opaque height / walk cycle / table wait | 150 CSS px / 8 fps, 4 supplied frames / 3 seconds |
| Floats | coin / heart / 빠직 each 30 CSS px |
| Partition inventory / price | 3 free; 50,000멍 per extra wall; one cell |
| Gacha unlock | Lv1 |
| Music | 30 minutes, +1 additional order per guest (existing implementation retained) |
| Blanket | all owned shibas happiness +10; 1 hour fatigue recovery ×2 |
| Recommended menu | 1 hour, menu selection weight ×1.3; that menu price ×1.1 only |
| Tasting | 10 minutes, all menu prices ×1.2 (retained) |
| Cookie | 15 minutes of current coin income, or 1 personal paw, or one existing heartReset item |
| Talent | 30 minutes of current coin income; Lv22 |
| Treat / wish unlock | Lv10 / Lv40 |

Questions and remaining null values:
- Confirm the starting values above? Blanket targets all owned shibas; should it target only placed shibas? Sleep's base fatigue recovery rate remains `null`; blanket multiplies a known rate only and does not invent a recovery amount.
- Back-facing idle uses the nearest front stand frame; is that acceptable, or will back-facing stand art be supplied?
- What is “current income rate”: expected café rate, or measured earnings over which interval? `heartUse.incomeRatePerSec=null` (coins/second) until defined. Talent and cookie coin rewards cannot be priced from a guessed rate. What probabilities should cookie's three outcomes use? `cookie.odds=null`; cookie/talent spending is disabled when these required values are unknown, preserving hearts. Once configured, reward formulas and ledger credits are implemented and unit tested.
- Cookie paws currently go to the supplied shiba ID, else the first owned shiba, as authorized fallback; should the player choose before drawing or after a paw result? Small-item starting choice is existing `heartReset`; confirm that identity. No new item IDs introduced.
- Wish's five contents/next-login delivery, special guest identities/odds/tips, brush affinity/fatigue/cleanliness, music stay extension and affinity-100 multiplier remain null. Prior questions for blanket amounts, recommendation multipliers, cookie reward magnitudes, talent tip formula and treat/talent/wish unlock levels are **resolved by this task**; their old null entries above are historical.

Art requests: one-cell partition front/back PNGs with anchors; guest sprites with foot/head anchors; heart-action card icons. Manager walk/stand and floor-plate edges are supplied, no longer requested. Back-facing manager idle art is optional pending the question above; separate shadow metadata remains null.

Validation: `npm test` in `start-room-3d/` includes u18 economy, wall purchase/ledger, scoped menu pricing, blanket recovery multiplier, manager service/return, frame directions and actual renderer draw/occlusion tests. Browser smoke and capture scripts updated and syntax checked only; **not launched** in this sandbox.

User-run: `node start-room-3d/capture-main-screen.mjs --u18` writes DPR2 `main-screen-u18-edges.png`, `main-screen-u18-manager-1.png`, `main-screen-u18-manager-2.png`, `main-screen-u18-manager-3.png`, `main-screen-u18-hearts.png`, `main-screen-u18-walls-inv.png` to `/workspace/shiba-cafe-docs/spec-v3-build/`. Unsaved TEMP staging: three expansions, manager walking service route (rear occlusion included), Lv40 sorted heart list, wall card with count 3 and buy button. No capture files written in this task. No commit/push; changes restricted to start-room-3d/.
