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
