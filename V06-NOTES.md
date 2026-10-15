# v0.6 인계 (2026-10-12)

작업 브랜치: `codex/core-loop-v06`, 시작 SHA `e7e973a`.
네트워크·npm install·checkout·push·main 변경 없음. 기존 에셋만 사용.

## 구현

- `balance-config.js`: 기존 BAL 값과 v0.6 경제 설정 단일 원본.
- `save-service.js`: schemaVersion 3, v1→v2→v0.6 순차 이전, 이전 정상 저장 백업 1개,
  이전/읽기 실패 원본 보존·저장 차단. LocalStorageAdapter, unavailable PlayGamesAdapter.
- `core-loop.js`: RNG 주입, 10/40/120 천장 우선순위·카운터, 9회 미발견 보장,
  희귀도/성장/입양/인테리어 공식.
- `game.js`: 처음 시바 1마리 이후 자동 도착 제거. 소원권 1/10회, 중복 선택,
  대기함, 레벨 10, ①②만 플레이(좌석 2, 시바 2→3), 보리차,
  돌봄→입양 확인→꾸미기→사진 안내. 대기함은 수입·돌봄 제외.
- 일본 정원 4개: 기존 종이 등·테이블 꽃병·분재·발바닥 간판(기존 4 슬롯 대응).
  기존 장식 중 이전 저장 소유권은 보존. 효과는 지정 4개만 집계.
- 사진: 현재 카메라/맵 DOM을 로컬 SVG/canvas로 합성, 900×1600 PNG 생성·다운로드.
  foreignObject 미지원 시 현재 화면 좌표의 기존 에셋 합성으로 대체.
  로고/카페명과 ‘미리보기’ 표시. 다운로드로 공유 액자 지급하지 않음.
- 설정: BGM/환경음 토글 상태만 저장(음원 미정), UI 숨김/한 터치 복원,
  클라우드 준비 중, 초대 코드/조건 안내, 상품 미리보기, 스타견 조건·활동 데이터.
- `CafeHooks`: 광고 결과 completed/cancelled/unavailable 테스트, 구매·스타견·클라우드 unavailable,
  공유 완료 훅은 주 1회/액자 4종/중복 이벤트 방지. 실제 SDK 연결 없음.
- 광고 5슬롯 합계 10회, 취소·실패 무차감, 완료 1회 지급, 부스트 동시 사용 금지.
  입양 기본 보상은 먼저 수령, 설정 내 훅 테스트로 추가 코인만 지급.

첫 주 5종(설정 주석에 이유): 레드·잠꾸러기, 레드·장난꾸러기,
참깨·새침데기, 블랙탄·먹보, 흰색·애교쟁이. 네 털색·다섯 성격을 모두 소개.
성격은 입양·손님·촬영 수입 계수에 우열을 주지 않는다.

## 검증

통과:
- 모든 루트/테스트 JS `node --check`.
- `git diff --check`.
- `node tests/v06-unit.js`: 천장/카운터/미발견/성장/입양/인테리어/마이그레이션/
  저장 실패 원본 보존/이전 정상 백업/PlayGames unavailable.
- `node tests/v06-runtime.js`: 실제 game.js 상태 흐름, 대기함·중복 선택,
  광고 취소 무차감·완료 콜백 중복 방지·합계 10회, 실제 v1 환급 계층 재실행,
  손상 저장 원본 보존. 이 검사의 DOM은 최소 모의이므로 화면·터치 검증은 아니다.
- 100,000회 기본 확률: N 70,134 / R 22,875 / SR 6,022 / SSR 969.
  천장 포함: N 68,540 / R 23,514 / SR 6,406 / SSR 1,540.

브라우저 실행 차단:
`NODE_PATH=/tmp/pw/node_modules CHROME=/usr/bin/google-chrome node tests/{smoke,expansion,portrait,v06-flow}.js`
모두 Chrome 시작 단계에서 `setsockopt: Operation not permitted`, SIGTRAP.
오케스트레이터가 네 테스트를 실행해야 한다. 콘솔 오류 0·이미지 다운로드·픽셀·터치 결과는 아직 확인하지 못했다.

테스트 변경 이유:
- smoke: 기존 메뉴 구매/자동 도착/3초 광고/기존 튜토리얼 기대를 새 흐름으로 변경.
  쓰다듬기 쿨다운, 첫 무료 교육, 산책, 촬영, 도감, 설정 디버그, 오프라인, 재실행, v1 이전 검사 유지.
- expansion: ②만 공사, U×20분 가격 고정 저장. ③④ 플레이 검사는 v0.6 잠금 검사로 교체.
  공사 저장·재실행·수용량·선물·v1 slots 정확한 환급·seats 이전 메타데이터 보존 검사 유지.
- portrait: 튜토리얼 완료 상태에 flow=5 추가, 단계 1/2만 검사(③④ 제외).
  여섯 화면 크기·모든 줌/경계·마젠타 0·HUD·안전영역·44px 검사는 유지(252장).
- v06-flow 추가: 처음 플레이, 1/10회, 중복/대기함, 돌봄/입양 확인 취소·완료,
  정원 4개, 사진 PNG 9:16/다운로드, 광고 5슬롯·일일 상한, 저장/백업/v0.5 이전.

## 커밋 차단 및 예정 메시지

`.git`이 읽기 전용이므로 `git add`와 `git commit` 모두
`Unable to create '/workspace/shiba-cafe/.git/index.lock': Read-only file system`로 실패.
권한 우회하지 않았고 변경 사항은 작업 트리에 남아 있다. 따라서 새 커밋 없음.
권한 있는 오케스트레이터가 아래 단위로 커밋할 수 있다(각 커밋 전 구문·diff 검사 필요).

1. `[codex] v0.6 설정 단일 원본과 로컬 저장·뽑기 순수 로직 추가`
   balance-config.js / balance.js / save-service.js / core-loop.js
2. `[codex] v0.6 소원권·돌봄·입양·정원·사진·미리보기 훅 연결`
   game.js / zones.js / decor.js / index.html / style.css
3. `[codex] v0.6 흐름·천장·저장 검사; 범위에 맞춰 회귀 기대 변경; Chrome sandbox blocked`
   tests/* 및 이 문서. 위 변경 이유를 커밋 본문에 포함.

모든 브라우저 결과 확인 전 검증 완료로 취급하지 않는다. 음원은 미정.
사진 foreignObject 미지원 환경의 대체 합성은 기본 맵/에셋 중심이라 CSS 마스크·효과의 픽셀 일치를 보장하지 않는다.
