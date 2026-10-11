# 시바견 카페 (방치형 모바일 게임 프로토타입)

아기 시바들이 뛰노는 카페에 손님이 와서 돈을 쓰고, 행복도가 가득 찬 시바는 새 가족에게 입양을 가요.
순수 HTML5/CSS/JS (빌드 없음) — 나중에 Capacitor로 감싸 Google Play 출시 예정.

- 실행: `index.html`을 정적 서버로 열기 (예: `python3 -m http.server 8765`)
- 디버그: `?debug=1` (속도 ×10/×50, 코인, 행복도 가득, 오프라인 2시간, 초기화)
- 광고: `game.js`의 `showRewardedAd(cb)` 하나만 AdMob 보상형 광고로 교체 (현재 3초 가짜 광고)
- 저장: localStorage `shibaCafe_v1`

## 테스트
`tests/smoke.js` (playwright-core + Chrome, 390×844 모바일):
탭·업그레이드 구매·교육·산책·유튜브 촬영·입양(광고 2배)·부스트·오프라인 팝업·새로고침 저장·숫자 포맷 확인, 콘솔 오류 0 확인.
