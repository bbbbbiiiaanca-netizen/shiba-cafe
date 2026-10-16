// §17-16 희귀 털색 (PR-B): recolour math = tools/recolor-test.py, coat field on shiba state, save/load, no way to get coats in play.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CFG} from '../config.js';
import * as S from '../sim.js';
import {COATS,isCoat,coatParams,coatSwatch,furMask,recolorRGB,recolorPixels,coatSrc} from '../coat-art.js';
const root=new URL('../',import.meta.url),src=f=>readFileSync(new URL(f,root),'utf8');

// coats come from config only (no extra colours, no numbers invented here)
assert.deepEqual(COATS,Object.keys(CFG.coats.rare));assert.deepEqual(COATS,['cream','silver','pink']);
for(const c of COATS){assert.ok(isCoat(c));assert.equal(coatParams(c),CFG.coats.rare[c]);assert.match(coatSwatch(c),/^#[0-9a-f]{6}$/);}
for(const c of [null,undefined,'','red','toString','__proto__',1])assert.equal(isCoat(c),false,String(c));
assert.equal(coatSwatch(null),null);
assert.equal(new Set(COATS.map(coatSwatch)).size,3,'each coat has its own mark colour');

// reference pixels: same formula as recolor-test.py (numpy), computed by hand
const near=(a,b,msg)=>assert.ok(a.every((v,i)=>Math.abs(v-b[i])<=1),`${msg}: ${a} vs ${b}`);
near(recolorRGB(214,120,52,CFG.coats.rare.cream),[218,200,169],'orange → cream');
near(recolorRGB(214,120,52,CFG.coats.rare.silver),[205,210,215],'orange → silver');
near(recolorRGB(214,120,52,CFG.coats.rare.pink),[216,126,149],'orange → pink');
// whites/creams (low saturation), dark outlines (low value), and non-orange hues are untouched
for(const px of [[255,255,255],[250,240,228],[20,14,10],[40,30,25],[0,0,0],[60,120,220],[200,40,60],[90,200,80]])
 for(const c of COATS)assert.deepEqual(recolorRGB(...px,coatParams(c)),px,`${px} ${c}`);
// soft mask boundaries: saturation 0.25→0.40 and value 0.20→0.35 ramp, hue band 8°..48°
const about=(a,b,msg)=>assert.ok(Math.abs(a-b)<1e-6,`${msg}: ${a}`);
about(furMask(1,0.875,0.75),0,'s=0.25 → 0');about(furMask(1,0.8375,0.675),0.5,'s=0.325 → 0.5');about(furMask(1,0.6,0.2),1,'s=0.8 → 1');
about(furMask(0.2,0.12,0.04),0,'v=0.2 → 0');about(furMask(0.275,0.165,0.055),0.5,'v=0.275 → 0.5');about(furMask(0.35,0.2,0.07),1,'v=0.35 → 1');
assert.equal(furMask(1,0.05,0),0,'hue 3° (red) untouched');assert.equal(furMask(1,0.95,0),0,'hue 57° (yellow) untouched');about(furMask(1,0.5,0),1,'hue 30° in band');
// a half-masked pixel blends between original and target (mask 0.556; numpy reference)
near(recolorRGB(255,213,170,coatParams('silver')),[252,235,217],'soft edge');
// RGBA buffer: alpha kept, transparent pixels skipped, whites untouched
{const d=new Uint8ClampedArray([214,120,52,255, 214,120,52,128, 214,120,52,0, 255,255,255,255, 20,14,10,200]);recolorPixels(d,coatParams('pink'));
 near([...d.slice(0,3)],[216,126,149],'opaque');assert.equal(d[3],255);near([...d.slice(4,7)],[216,126,149],'semi');assert.equal(d[7],128);
 assert.deepEqual([...d.slice(8,12)],[214,120,52,0]);assert.deepEqual([...d.slice(12,16)],[255,255,255,255]);assert.deepEqual([...d.slice(16,20)],[20,14,10,200]);}
// node (no Image): DOM helper falls back to the original path; normal coat always original path
assert.equal(coatSrc('assets/drive/shiba-red.png','cream'),'assets/drive/shiba-red.png');assert.equal(coatSrc('x.png',null),'x.png');assert.equal(coatSrc('x.png','gold'),'x.png');

// state: coat optional, default null (normal); only configured coats accepted
const now=Date.UTC(2026,9,16),s=S.newState(now);S.chooseStart(s,'red','시루',S.rng(1),now);
assert.ok(s.shibas.length>=1&&s.shibas.every(sh=>sh.coat===null),'starter is normal');
assert.equal(S.makeShiba(s,{breed:'white',now}).coat,null);assert.equal(S.makeShiba(s,{breed:'white',coat:'pink',now}).coat,'pink');assert.equal(S.makeShiba(s,{breed:'white',coat:'gold',now}).coat,null);
const id=s.shibas[0].id;
assert.equal(S.setCoat(s,id,'gold'),false);assert.equal(s.shibas[0].coat,null);assert.equal(S.setCoat(s,999999,'cream'),false);
assert.equal(S.setCoat(s,id,'silver'),true);assert.equal(s.shibas[0].coat,'silver');
// gacha never gives a coat
{const g=S.newState(now);S.chooseStart(g,'red','',S.rng(2),now);g.dia=1e6;g.coins=1e9;g.cafe.level=Math.max(g.cafe.level,CFG.gacha.unlock??1);let n=0;for(let i=0;i<20;i++)if(S.gachaPull(g,1,S.rng(10+i),now))n++;assert.ok(n>0&&g.shibas.every(sh=>sh.coat===null),'gacha shibas normal');}

// save/load keeps coat; old saves without coat and bad values load as normal
const store=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};};
{const st=store();S.save(st,s,now);const back=S.load(st,now).state;assert.equal(back.shibas[0].coat,'silver');assert.equal(JSON.parse(st.getItem(CFG.saveKey)).v,CFG.saveVersion);
 const raw=JSON.parse(st.getItem(CFG.saveKey));delete raw.shibas[0].coat;st.setItem(CFG.saveKey,JSON.stringify(raw));assert.equal(S.load(st,now).state.shibas[0].coat,null,'old save → normal');
 raw.shibas[0].coat='gold';st.setItem(CFG.saveKey,JSON.stringify(raw));assert.equal(S.load(st,now).state.shibas[0].coat,null,'unknown coat → normal');
 S.setCoat(s,id,null);S.save(st,s,now);assert.equal(S.load(st,now).state.shibas[0].coat,null,'reset to normal persists');}

// no breeding / acquisition flow: only the temp-gated dev helper sets coats
const main=src('main.js');
assert.match(main,/debugCoat\(id,coat=null\)\{if\(!temp\|\|/);
assert.equal((main.match(/setCoat\(/g)||[]).length,1,'setCoat only in the dev helper');
assert.equal((src('sim.js').match(/coat:'(cream|silver|pink)'|coat:\s*COATS/g)||[]).length,0);
assert.equal(CFG.breeding.enabled,false);
// every individual-shiba portrait goes through the coat helper; generic breed previews stay plain
for(const [re,msg] of [[/(?<!coatSrc\()IMG\.shiba\((sh|o)\.breed\)/,'no plain portrait for an owned shiba'],[/friends\.map\(f=>`<button data-act="care"[^`]*IMG\.shiba/,'book friend thumbnails tinted']])assert.ok(!re.test(main),msg);
assert.match(main,/book-art[^`]*src="\$\{shibaArt\(sh\)\}"/,'book art tinted');
assert.match(src('isomap.js'),/tintImage\(im,sh\.coat\)/);assert.match(src('isomap.js'),/stamp\(meta\.file,[^;]*,coat\)/);
assert.match(src('run.js'),/tintImage\(img\.shiba,coat\)/);
console.log('coats: recolour math, soft mask, state default, save/load, dev-only helper passed');
