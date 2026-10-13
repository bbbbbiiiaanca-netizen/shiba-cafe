// Acceptance tests for handoff-v1 (D-01 … D-13). Run: node tests/handoff.test.mjs (from start-room-3d/)
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {CFG} from '../config.js';
import * as S from '../sim.js';
const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');
const mem=()=>({d:{},getItem(k){return this.d[k]??null},setItem(k,v){this.d[k]=v}});
const results=[];
function test(name,fn){const snap=JSON.stringify({F:CFG.FEATURES,T:CFG.TEMP});try{fn();results.push(['ok',name]);}catch(e){results.push(['FAIL',name,e]);}
 finally{const o=JSON.parse(snap);Object.assign(CFG.FEATURES,o.F);Object.assign(CFG.TEMP,o.T);}}

// ---------- D-01 ----------
test('D-01 S rate is 2% ±0.1%p over 100,000 rolls; N/R stay null (no invented split)',()=>{
 assert.equal(CFG.gacha.rates.S,.02);assert.equal(CFG.gacha.rates.N,null);assert.equal(CFG.gacha.rates.R,null);
 const r=S.rng(12345);let s=0;const n=100000;for(let i=0;i<n;i++)if(S.rollGrade(r)==='S')s++;
 assert.ok(Math.abs(s/n-.02)<=.001,'S ratio '+s/n);});
test('D-01 with N/R undecided the pull is blocked; TEMP switch maps non-S to N only',()=>{
 const st=S.newState(0);assert.equal(S.gachaReady(),false);assert.equal(S.pull(st,S.rng(1)),null);assert.equal(st.gachaPulls,0);
 CFG.TEMP.gachaNonSAsN=true;const r=S.rng(9);const seen=new Set();const st2=S.newState(0);st2.paws=1e6;
 for(let i=0;i<3000;i++)seen.add(S.pull(st2,r).grade);assert.deepEqual([...seen].sort(),['N','S']);});
test('D-01 no "SR" grade label left in code (except the one legacy-migration constant)',()=>{
 const files=readdirSync(ROOT).filter(f=>/\.(js|mjs|html)$/.test(f));const hits=[];
 for(const f of files)readFileSync(join(ROOT,f),'utf8').split('\n').forEach((l,i)=>{const m=l.match(/(['"`])SR\1|\.SR\b|\bSR\s*:/g);if(m)hits.push(`${f}: ${l.trim().slice(0,60)}`);});
 assert.equal(hits.length,1,'SR hits '+hits);assert.match(hits[0],/^sim\.js: const LEGACY_TOP_GRADE='SR'/);});
test('D-01 old save with SR loads as S and the re-saved JSON contains no SR',()=>{
 const m=mem();m.setItem(CFG.saveKey,JSON.stringify({v:1,coins:1,hearts:0,paws:0,lastSeen:0,owned:[{id:1,coat:'red',expr:'red_smile',lv:3,rarity:'SR'},{id:2,coat:'kuro',expr:'kuro_calm',lv:1,rarity:'R'},{id:3,coat:'white',expr:'white_smile',lv:2,rarity:'N'}],nextId:4}));
 const {state}=S.load(m,1000);assert.deepEqual(state.owned.map(o=>[S.gradeOf(o.lv),o.lv]),[['S',23],['R',11],['N',2]]);
 S.save(m,state,1000);const raw=m.getItem(CFG.saveKey);assert.ok(!raw.includes('SR')&&!raw.includes('rarity'),raw);});
test('D-01 result-card CSS: N colourless, R blue, S gold; no ★/레어 prefix in card markup',()=>{
 const html=readFileSync(join(ROOT,'index.html'),'utf8'),ui=readFileSync(join(ROOT,'ui.js'),'utf8');
 assert.match(html,/\.rc\.N\{border-color:#e4e4e4;background:#fff\}/);assert.match(html,/\.rc\.R\{border-color:#6f9fd6/);assert.match(html,/\.rc\.S\{border:4px double #d4a437/);
 assert.ok(!ui.includes('★ ★ ★')&&!ui.includes("'레어 '"));});

// ---------- D-02 ----------
test('D-02 gradeOf bands, promotion boundaries and Lv 30 cap',()=>{
 assert.equal(S.gradeOf(1),'N');assert.equal(S.gradeOf(10),'N');assert.equal(S.gradeOf(11),'R');assert.equal(S.gradeOf(20),'R');assert.equal(S.gradeOf(21),'S');assert.equal(S.gradeOf(30),'S');
 assert.deepEqual(['N','R','S'].map(S.startLevel),[1,11,21]);
 const st=S.newState(0);st.owned[0].lv=99;const m=mem();S.save(m,st,0);assert.equal(JSON.parse(m.getItem(CFG.saveKey)).owned[0].lv,30);
 assert.ok(!('rarity' in st.owned[0])&&!('grade' in st.owned[0]));});
test('D-02 pulls start at band start level',()=>{
 CFG.TEMP.gachaNonSAsN=true;const st=S.newState(0);st.paws=1e6;const r=S.rng(4);
 for(let i=0;i<2000;i++){const o=S.pull(st,r);assert.equal(o.lv,S.startLevel(o.grade));}});
test('D-02 old save rarity is converted to a matching level',()=>{
 const st=S.migrate({v:1,owned:[{id:1,coat:'red',expr:'red_smile',lv:15,rarity:'R'},{id:2,coat:'red',expr:'red_wink',lv:1,rarity:'N'}]});
 assert.deepEqual(st.owned.map(o=>o.lv),[20,1]);assert.deepEqual(st.owned.map(o=>S.gradeOf(o.lv)),['R','N']);});

// ---------- report ----------
let fail=0;for(const [k,n,e] of results){console.log(k==='ok'?'  ok  ':'  FAIL',n);if(e){fail++;console.log('       ',e.message);}}
console.log(`${results.length-fail}/${results.length} handoff tests passed`);if(fail)process.exit(1);
