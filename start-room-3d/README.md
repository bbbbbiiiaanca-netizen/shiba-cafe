# 시바견 카페 — framework-v2 (카탈로그 기준)

**2026-10-13 수인님 지시("왜 카탈로그대로 안하는거야?")로 「시바견 카페 에셋 카탈로그」(20쪽)가 유일한 시각 기준.**
`index.html`/`main.js`는 카탈로그 원본 그림을 깨끗이 오려 낸 투명 PNG(`assets/`, 출처 쪽은 status.md)를 2D 아이소 장면에 배치한다. 화면 배치는 카탈로그 17쪽 세로 A(상단 퀘스트 알약+코인·하트·발바닥, 가운데 좌우 스와이프 카페, 하단 퀘스트·가게·시바들·업그레이드·이벤트).
게임 로직(sim.js: 손님 착석→시바 2회 방문·하트→계산·퇴장, 방치/오프라인 수입, 저장 v2, 뽑기, 퀘스트, 동구 튜토리얼)은 유지. 이전 3D 판은 `index3d.html`/`main3d.js`로 보관.

**handoff-v1 (2026-10-14):** 등급·레벨, 하트·리셋권, 병합, 온보딩, 산책, 언어, 테마, 힐링 뼈대. 미정 값은 `config.js`에서 `null`,
문서가 허용한 임시 동작은 `CFG.TEMP`(전부 false), 제안값뿐인 기능은 `CFG.FEATURES`(전부 false). 정확히 `?temp=1`로 열 때만 테스트 빌드처럼 TEMP를 모두 켜고, 세이브는 별도 키(`shibaCafe.save.v2:temp`)에 저장해 일반 세이브를 건드리지 않음.
자세한 목록: `shiba-cafe-docs/handoff-v1/impl-notes.md`. 테스트: `cd start-room-3d && npm test` (+ `npm run test:browser`, headless Chrome).

캡처: `node start-room-3d/capture-game.mjs /workspace/shiba-cafe-docs/framework-v2` · 테스트: `node start-room-3d/tests/sim.test.mjs`

---
# Shiba Cafe — start-room first check only

Single Three.js scene; all room pieces, furnishings, humans, Shibas, speech bubble and hearts are scene geometry. Only lettering on the guide bubble/tags uses procedural canvas textures. No character images, downloaded models, network requests, install or CDN. Three.js r170 and license copied from `3d-demo/vendor/`.

Serve the repository using `python3 -m http.server 8000`, then open `/start-room-3d/` (390×844). The only animation runs once for 10 seconds: approach 0–2s, climb 2–3s, affection/hearts 3–7s, descend 7–8s, return 8–10s. No guest loop, expansion, editing controls or full UI.

`?still=1` pauses at zero. `window.__firstCheck.setTime(seconds)` deterministically renders any moment; `forceVisit()` renders affection at 4s.

## Reproduce deliverables

From `/workspace/shiba-cafe`:

```
node start-room-3d/capture.mjs /workspace/shiba-cafe-docs/start-room-3d
node --check start-room-3d/main.js
node --check start-room-3d/timeline.js
node --check start-room-3d/capture.mjs
node start-room-3d/tests/timeline.test.mjs
node 3d-demo/tests/sim.test.mjs
```

Capture uses installed Chrome via CDP pipe, local file ES modules, SwiftShader WebGL, deterministic 10fps frames, installed ffmpeg (VP9 WebM), and PIL. It writes `still.png` (390×844), `frames/0000.png` through `0099.png`, `hearts-10s.webm` (10 seconds) and `compare-p07.png`. Comparison uses only the P07 illustration crop and the rendered scene crop. The complete portrait still remains separate.

## Actual verification / blockers

Syntax and one-visit continuity/contact-height/hearts tests pass. Existing 3d-demo simulation suite: 7 pass. **Chrome has not rendered successfully in this sandbox**: `setsockopt: Operation not permitted`; Python HTTP socket creation is also denied. Thus still/comparison/video are not produced; runtime, appearance and exact guide-angle agreement are unverified. Do not treat this as first-check approval.

The branch remains `codex/start-room-3d`, original HEAD `844001218fd0900ffbbd74fbcf001362c2ddc9dc`. Git staging/commit fails because `/workspace/shiba-cafe/.git` is read-only (`index.lock`). No new commit, push or merge. A local copy is prepared at `/workspace/shiba-cafe/preview/start-room-3d/`. Root live files and `/workspace/agents/keeping/limits.md` are untouched.

## Guide 11 self-score

Implementation inspection: distinct red coat and fixed triangular red asanoha bib; Donggu seated with teal collar, orange B and round name tag; large figurine heads, short muzzles/limbs and curled tails; matte materials; cream/wood tatami hall and counter; open front/ceiling; orthographic elevated 3/4 camera; warm upper-left key, lantern fill; fenced bare dirt with visible boundary; child waits and dog receives hearts only during affection. These are code-level checks only.

**Visual approval: 0 items confirmed.** Character proportions/expression readability, silhouette at portrait scale, exact bandana fidelity, human/Shiba style match, short soft shadow quality, eye gloss and actual contact/petting all require rendered review. Environmental angle/framing and guide likeness require the comparison artifact. UI full-set and external-generation prompt approval are outside this first-check scope. Do not proceed to later features before reviewing the requested captures.
