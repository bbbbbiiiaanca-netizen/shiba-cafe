# New furniture verification

19 new items; existing 4 items retain their icons, prices and inventory flow. New prices are null (미정 / TBD), and buying is disabled. Sakura set is presentation only: 3 placed instances in one zone, no numeric bonus. System reduced motion keeps petals static.

The source folder already contained all 8 sakura backs. They were copied and are enabled by the generated FURN_BACKS manifest. Rock has 2 directions; the other 18 have 4 with the supplied assets. Missing-back fixtures verify the 2-direction fallback for every item.

Run `node tools/sync-furniture-art.mjs` to copy newly supplied art and regenerate the back/HD list. It can use FURN_ART_SOURCE to select another source directory.

## Anchors

Scale 1, footprint 시작값 1칸, 명세 없음. Alpha contact regions were measured, then footprint centres adjusted and inspected in all available directions. Mirrored anchors use the existing #18 derivation.

| Item | Front (x,y) | Back (x,y) |
|---|---|---|
| shelf | 89, 181 | 89, 181 |
| low-table | 90, 202 | 90, 202 |
| moon-lamp | 90, 182 | 90, 182 |
| stone-lantern | 90, 189 | 90, 189 |
| chochin | 79, 194 | 102, 194 |
| bonsai | 90, 195 | 90, 195 |
| rock | 90, 192 | — |
| bamboo-fence | 90, 182 | 90, 182 |
| cherry-tree | 88, 191 | 88, 191 |
| noren | 90, 186 | 90, 186 |
| sign | 90, 187 | 90, 187 |
| shelf-sakura | 89, 181 | 89, 181 |
| low-table-sakura | 90, 202 | 90, 202 |
| stone-lantern-sakura | 90, 189 | 90, 189 |
| chochin-sakura | 79, 194 | 102, 194 |
| bonsai-sakura | 90, 195 | 90, 195 |
| bamboo-fence-sakura | 90, 182 | 90, 182 |
| noren-sakura | 90, 186 | 90, 186 |
| sign-sakura | 90, 187 | 90, 187 |

## Validation

- npm test: all 28 test programs passed, including 19 new item cases and set thresholds.
- npm run test:browser: 308/308 smoke checks, 0 page errors; new furniture checks cover 6 categories, Korean/English TBD, inventory placement, 2-item / split-zone / 3-item set activation.
- 27 requested Korean screenshots at 360×800 in /workspace/compare/new-furniture/: shop-{all,furniture,light,garden,sign,floorwall}.png, cafe-placed.png, edit-anchors-<id>.png (19), sakura-set.png. All inspected.
- Capture: node tools/capture-new-furniture.mjs (existing Chrome/CDP test setup).

Changed areas: config.js, furniture-data.js, map-data.js, furniture-anchors.js, furniture-art.generated.js, hd-assets.js, main.js, q1715.js, isomap.js, decor.js, i18n.js, index.html, package.json, tests, tools, and assets/drive/furniture-v4/.

No commit or push. node_modules symlink untouched. Prices and conflicting numeric set bonus remain pending confirmation as requested.

## low-table v5 (2026-10-16)

그림이 여백 trim + 1.4배 확대본으로 교체. canvas 180×230, floor (90,202). 일반·벚꽃 앞/뒤 + @2x. `node tools/sync-furniture-art.mjs` 후 anchors 갱신. 4방향 유지.

## Momiji / Snow (2026-10-17)

단풍·눈 가구 각 8종을 추가했다. 단풍 좌식 테이블은 v5, 눈은 v4이며 앞 그림과 @2x를 FURN_ART_SOURCE 동기화로 복사했다. 뒤 그림이 없어 모두 기존 2방향 폴백을 사용한다. 가격은 null(미정/구매 잠금), 크기와 효과·상한은 CFG.decor의 공통 설정을 사용한다. 세트는 같은 구역 3개부터 라벨만 표시하며, 추가 그림과 수치 보너스는 없다. 벚꽃 연출은 유지한다.

단풍 바닥·벽과 눈 벽은 floorwall 레이어로 추가했다. 보유 아이템의 가방 배치 동작으로 선택하며 저장/복원한다. 눈 바닥은 art:null과 미정 카드만 있고 그림은 복사하지 않았다(나무 바닥 재작업 대기). 방 레이어는 원본 방 좌표의 투명 그림이며 확장된 칸의 별도 테마 그림은 없다.

앵커는 알파 128 이상 접지 띠의 경계 중점을 측정했다. 재현: `python3 tools/measure-theme-anchors.py` (Pillow). 노렌은 앞뒤로 어긋난 두 발을 모두 포함한다.

| Front sprite | Anchor (x,y) |
|---|---|
| furn-shelf-momiji-v4.png | 90, 182 |
| furn-low-table-cushion-momiji-v5.png | 90, 186 |
| furn-stone-lantern-momiji-v4.png | 90, 186 |
| furn-chochin-momiji-v4.png | 79, 190 |
| furn-bonsai-momiji-v4.png | 94, 191 |
| furn-bamboo-fence-momiji-v4.png | 90, 181 |
| furn-noren-momiji-v4.png | 89, 176 |
| furn-entrance-sign-momiji-v4.png | 94, 186 |
| furn-shelf-snow-v4.png | 90, 182 |
| furn-low-table-cushion-snow-v4.png | 90, 186 |
| furn-stone-lantern-snow-v4.png | 89, 186 |
| furn-chochin-snow-v4.png | 77, 190 |
| furn-bonsai-snow-v4.png | 94, 190 |
| furn-bamboo-fence-snow-v4.png | 90, 180 |
| furn-noren-snow-v4.png | 89, 176 |
| furn-entrance-sign-snow-v4.png | 94, 186 |

360×800 스크린샷 9장: `/workspace/compare/momiji-snow/`. 재현: `node tools/capture-momiji-snow.mjs`. 상점 테마별 캡처는 기존 전체 목록에서 해당 테마 카드만 보이도록 캡처 시에만 제한한다.

검증: `npm test` 통과. `npm run test:browser`는 306/308, 페이지 오류 0건이며 기존 PR-C 상점/가방 가구 카드 2건 실패로 종료했다. 따라서 체인의 캡처 두 개는 별도 실행했고 `capture-new-furniture.mjs`, `capture-momiji-snow.mjs` 모두 통과했다. 커밋·푸시 없음.

## Water Garden (2026-10-17)

물방울 정원(theme `water`) 가구 8종 + 바닥·벽을 단풍·눈과 같은 방식으로 추가했다. 그림은 수인님 10/17 00:36 승인본(`furn-water/out`, `room-water/out`, @2x 포함)을 `node tools/sync-furniture-art.mjs`로 복사했다. 가구 180×230, 앵커는 모두 바닥점 (90,202). 뒷모습이 없어 `backArt.enabled`에 넣지 않았고 앞·앞 반전 2방향만 쓴다. 1칸, 가격 null(미정/구매 잠금), `CFG.decor.waterSet={minItems:3,bonusMinItems:null,bonus:null}`, 효과·상한은 공통 설정. 세트 라벨 '물방울 정원 세트' / 'Water Garden Set'.

360×800 스크린샷 3장: `/workspace/compare/water-icons/` (shop-water, water-set, room-water-layer). 재현: `node tools/capture-water.mjs`. 단위 검사: `tests/water.test.mjs`.
