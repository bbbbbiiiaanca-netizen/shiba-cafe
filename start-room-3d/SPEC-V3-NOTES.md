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
6. **레벨 효과**: superseded by config audit / Unit 4: aggregation and no-meeting multiplier are null. No average or ×1 production fallback; payments are pending.
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
10. Meeting-level income aggregation? `income.levelAggregation = null` (75/120, prior red-team #7). No payment formula guessed. Café level thresholds themselves are confirmed by 98, so no unknown café threshold is filled in.

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

## Unit 4 open questions

1. **Entrance location(s)?** Neither spec-v3 nor interior names a grid entrance. `MAP.zones[*].entrance = null`; configurable per zone, test-only runtime fixtures use an explicit cell. No production arrival until entrance and timing are known.
2. **Walking time per cell?** `CFG.navigation.cellStepSec = null` (interior §§3,5,8; v3 updates 50/70 define art and meetings, not walking speed). Guest/shiba route traversal waits; tests supply declared speed fixtures.
3. **Physical seating rules?** Interior §5 defines 1-cell cushions and tea tables, but not capacity/adjacency. Confirm one guest per placed cushion, guest ON cushion target, shiba on adjacent free floor, no mandatory table association; physical seat limit may be lower than café cap (updates 70–75/132-4). Initial placement has only two cushions.
4. **Meeting-level payment aggregation and no-meeting multiplier?** `CFG.income.levelAggregation = null` (updates 75/120; prior red-team #7). Price is known; total remains null and coins are not awarded. Tests/captures declare a temporary multiplier fixture only.
5. **Separate order/service timing?** Update 120 explicitly decides menu/payment at departure; no cooking/service duration defined. Current serve event is bookkeeping at settlement, not a timed minigame. Confirm if a separate earlier order or service action is desired before changing this sequence.
6. **Edited furniture / disconnected routes?** Confirm the same-cushion reseat rule and waiting for a reachable route when exits become blocked (interior §8). No newly invented abandonment timeout or teleport.
7. **Grass art pending**: interior §12 requires tiled outside grass and conversion on expansion. Await approved grass art/integration; no green shapes drawn and no expansion direction/camera change in Unit 4.

Validation: npm test includes 94 legacy spec acceptance tests with explicit geometry/timing fixtures, existing timeline/map/edit/Unit 3/renderer suites, and 11 Unit 4 tests for lifecycle, obstacles, physical seats, pricing, null gating, edit reseat, depth, frame lag, closure health/rest and hearts. Browser smoke checks and capture scenarios are written but Chrome was not launched in this sandbox. Run `npm run test:browser` and `node capture-main-screen.mjs` on the user's Chrome host. Capture adds main-screen-u4-order.png, main-screen-u4-payment.png and main-screen-u4-panel.png at DPR2 to `/workspace/shiba-cafe-docs/spec-v3-build/`; TEMP fixtures supply entrance, walk timing, gauges and payment aggregation without saving. No screenshots generated here.

Changed files: config.js, sim.js, navigation.js (new), map-data.js, isomap.js, main.js, package.json, capture-main-screen.mjs, tests/spec-v3.test.mjs, tests/unit4.test.mjs (new), tests/smoke-browser.mjs, tests/smoke-steps.mjs, SPEC-V3-NOTES.md. Deletion-aware mirror excludes node_modules; no commit/push.
