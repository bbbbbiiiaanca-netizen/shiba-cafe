# 시바견 카페 (방치형 모바일 게임 프로토타입)

아기 시바들이 뛰노는 카페에 손님이 와서 돈을 쓰고, 행복도가 가득 찬 시바는 새 가족에게 입양을 가요.
순수 HTML5/CSS/JS (빌드 없음) — 나중에 Capacitor로 감싸 Google Play 출시 예정.

- 실행: `index.html`을 정적 서버로 열기 (예: `python3 -m http.server 8765`)
- 디버그: `?debug=1` (속도 ×10/×50, 코인, 행복도 가득, 오프라인 2시간, 초기화)
- 광고: `game.js`의 `showRewardedAd(cb)` 하나만 AdMob 보상형 광고로 교체 (현재 3초 가짜 광고)
- 저장: localStorage `shibaCafe_v1` (ver 2 — v1 세이브는 자동 이전)
- 밸런스: 모든 상수·공식은 `balance.js` (`BAL`, `F`), 시뮬레이터 `node tests/balance-sim.js [--legacy] [--runs 30] [--min 60]`
- 아트: `assets/` — 아기 시바 `{red|sesame|blacktan|white}_{sleepy|grin|aloof|drool|sparkle}.webp`, 동구 `owner_donggu.webp`, 손님 `cust_1~6.webp`, 배경 `bg_cafe.webp` (총 ~440KB)

## 테스트
`tests/smoke.js` (playwright-core + Chrome, 390×844 모바일, `npm i --no-save playwright-core`):
동구 튜토리얼 전 단계 → 첫 입양(광고 버튼 없음) → 도감 20칸 → 유튜브 → 2번째 입양(광고 2배) → 광고 간격·부스트 쿨다운·일일 캡 → 오프라인 상한 → 쓰다듬기 쿨다운 → 저장 → v1 세이브 이전, 이미지 로드·콘솔 오류 0 확인.
