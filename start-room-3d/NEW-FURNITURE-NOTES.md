# New furniture verification

19 new items; existing 4 items retain their icons, prices and inventory flow. New prices are null (미정 / TBD), and buying is disabled. Sakura set is presentation only: 3 placed instances in one zone, no numeric bonus. System reduced motion keeps petals static.

The source folder already contained all 8 sakura backs. They were copied and are enabled by the generated FURN_BACKS manifest. Rock has 2 directions; the other 18 have 4 with the supplied assets. Missing-back fixtures verify the 2-direction fallback for every item.

Run `node tools/sync-furniture-art.mjs` to copy newly supplied art and regenerate the back/HD list. It can use FURN_ART_SOURCE to select another source directory.

## Anchors

Scale 1, footprint 시작값 1칸, 명세 없음. Alpha contact regions were measured, then footprint centres adjusted and inspected in all available directions. Mirrored anchors use the existing #18 derivation.

| Item | Front (x,y) | Back (x,y) |
|---|---|---|
| shelf | 89, 181 | 89, 181 |
| low-table | 90, 187 | 90, 187 |
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
| low-table-sakura | 90, 187 | 90, 187 |
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
