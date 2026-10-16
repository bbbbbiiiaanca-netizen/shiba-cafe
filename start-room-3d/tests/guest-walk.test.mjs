// 걸어 들어와 앉기 (2026-10-16): 손님 10종 모두 걷기 그림으로 입구 → 자리, 앉으면 그 종류의 앉은 그림.
import assert from 'node:assert/strict';import fs from 'node:fs';import * as S from '../sim.js';import {CFG} from '../config.js';import {canWalk,walkFrame,walkTable,installWalkProbe} from '../walk-frames.js';
import {guestScale,guestDrawRect,guestPose,keyBackground,sitFile,GUEST_DIRS} from '../guest-art.js';import {faceCell} from '../navigation.js';
const ROOT=new URL('../',import.meta.url),G=CFG.characters.walkFrames.guest;
// 설정: 종류별 객체, 10종(sim.js NPC_NORMAL) 모두 그 종류 폴더의 경로
assert.deepEqual(Object.keys(G).sort(),[...S.NPC_NORMAL].sort());assert.equal(S.NPC_NORMAL.length,10);
for(const k of S.NPC_NORMAL){assert.equal(G[k],`assets/drive/chars/guest/${k}/guest-${k}-walk-{dir}-{n}.png`,k);assert.equal(canWalk('guest',k),true,k);}
assert.equal(canWalk('guest'),false);
assert.deepEqual(walkTable().filter(x=>x.kind==='guest').map(x=>[x.key,x.walk]),S.NPC_NORMAL.map(k=>[k,true]));
// 종류마다 16장 모두 있고 실제 크기는 128×176 (PNG IHDR), 앉은 그림도 그 종류 것이 있음
const size=f=>{const b=fs.readFileSync(new URL(f,ROOT));assert.equal(b.toString('ascii',1,4),'PNG',f);return [b.readUInt32BE(16),b.readUInt32BE(20)];};
for(const k of S.NPC_NORMAL){for(const dir of GUEST_DIRS)for(let n=1;n<=4;n++){const f=walkFrame('guest',k,dir,n);assert.equal(f,`assets/drive/chars/guest/${k}/guest-${k}-walk-${dir}-${n}.png`);assert.deepEqual(size(f),[128,176],f);}
 assert.equal(fs.readdirSync(new URL(`assets/drive/chars/guest/${k}/`,ROOT)).filter(f=>f.endsWith('.png')).length,16,k);
 assert.equal(sitFile(k),`assets/drive/guest-sitting-${k}-final.png`);assert.ok(fs.existsSync(new URL(sitFile(k),ROOT)),sitFile(k));}
// 발 위치: 공통 walkAnchor 가 캔버스 안이고 128×176 기준(모든 종류 같은 캔버스)
{const A=CFG.characters.guest.walkAnchor;assert.ok(A[0]===64&&A[1]>160&&A[1]<=176);}
// probe: 손님은 10종 모두 경로가 있으니 probe 요청(404) 없음, 나머지(시바·동우)는 그대로 probe
{const srcs=[];globalThis.Image=class{set src(v){srcs.push(v);}};installWalkProbe();delete globalThis.Image;
 assert.ok(srcs.length>0&&srcs.every(s=>!s.includes('/chars/guest')),srcs.join(' '));assert.ok(srcs.some(s=>s.includes('chars/shiba-red/'))&&srcs.some(s=>s.includes('chars/dongu/')),srcs.join(' '));}
// 방향: 다음 칸으로 가는 방향 → 0 front-dr, 1 front-dl, 2 back-ul, 3 back-ur
for(const [to,f] of [[[3,2],0],[[2,3],1],[[1,2],2],[[2,1],3]]){const c={cell:[2,2]};faceCell(c,to);assert.equal(GUEST_DIRS[c.facing],GUEST_DIRS[f],to.join());}
// 그림 고르기: 걷는 중 125ms마다 1→4, 멈추면 1번, 앉으면 앉은 그림
{const c={kind:'commuter',phase:'entering',route:[[0,4]],facing:3};assert.deepEqual([0,125,250,375,500].map(t=>guestPose(c,t).n),[1,2,3,4,1]);
 assert.equal(guestPose(c,250).file,'assets/drive/chars/guest/commuter/guest-commuter-walk-back-ur-3.png');
 assert.equal(guestPose({...c,route:[]},250).n,1);assert.deepEqual(guestPose({...c,phase:'seated'}),{sit:true,seiza:true,file:CFG.characters.guest.seiza.commuter,mirrored:false});}
// 배경 지우기: 가장자리와 이어진 배경색만 투명, 안쪽 그림·둘러싸인 배경은 그대로, bbox = 남은 그림
{const w=6,h=6,d=new Uint8ClampedArray(w*h*4);for(let i=0;i<w*h;i++)d.set([250,240,230,255],i*4);for(let y=1;y<5;y++)for(let x=2;x<4;x++)d.set([30,40,90,255],(y*w+x)*4);
 assert.deepEqual(keyBackground(d,w,h,42),{x:2,y:1,w:2,h:4});assert.equal(d[3],0);assert.equal(d[(2*w+2)*4+3],255);}
// 입구 → 자리: 한 칸씩, 매 걸음 방향 = 그 걸음의 방향, 도착하면 seated
function fixture(r){const s=S.newState(0);S.chooseStart(s,'red','',()=>.99,0);const w=S.newWorld(s,r);w.spawnT=0;return {s,w};}
function trace(kind){const {s,w}=fixture(()=>0);const out=[];let c=null;
 for(let i=0;i<600;i++){S.tick(s,w,.1,(w.t+.1)*1000);c??=w.custs[0];if(!c)continue;if(i===0||!out.length){c.kind=kind;}out.push({cell:[...c.cell],phase:c.phase,facing:c.facing,route:c.route?.length??0});if(c.phase==='seated')break;}
 return {c,out,w};}
{const {c,out}=trace('commuter');assert.ok(c,'손님이 들어옴');assert.equal(c.kind,'commuter');assert.equal(out.at(-1).phase,'seated');assert.equal(out[0].phase,'entering');
 const cells=out.map(o=>o.cell.join()).filter((v,i,a)=>v!==a[i-1]);assert.ok(cells.length>=3,'여러 칸을 걸어감 '+cells.join(' '));
 for(let i=1;i<out.length;i++){const a=out[i-1],b=out[i];if(a.cell.join()===b.cell.join())continue;assert.ok(Math.abs(a.cell[0]-b.cell[0])+Math.abs(a.cell[1]-b.cell[1])===1,'한 칸씩');
  const f={cell:a.cell};faceCell(f,b.cell);assert.equal(b.facing,f.facing,'걸음 방향 '+a.cell+'→'+b.cell);}
 // 첫 걸음 전에도 첫 걸음 방향을 봄
 const first=out.findIndex((o,i)=>i&&o.cell.join()!==out[0].cell.join()),f0={cell:out[0].cell};faceCell(f0,out[first].cell);assert.equal(out[0].facing,f0.facing,'첫 걸음 방향');
 assert.equal(guestPose(out.at(-1).phase==='seated'?c:null).sit,true);}
// 10종 모두: 시뮬레이션은 종류와 무관(같은 seed → 같은 길), 걷는 동안 그 종류 걷기 그림, 앉으면 그 종류 앉은 그림
{const a=trace('commuter').out;for(const k of S.NPC_NORMAL){const {c,out}=trace(k);assert.deepEqual(out,a,k);assert.equal(c.kind,k);
 for(const o of out.slice(0,-1)){const p=guestPose({kind:k,...o,route:Array(o.route)},0);assert.equal(p.sit,false);assert.equal(p.file,`assets/drive/chars/guest/${k}/guest-${k}-walk-${GUEST_DIRS[o.facing||0]}-1.png`);}
 assert.deepEqual(guestPose(c),{sit:true,seiza:true,file:`assets/drive/chars/guest/seiza/guest-seiza-${k}.png`,mirrored:false},k);
 {const Z=CFG.characters.guest.seiza,keep=Z[k];Z[k]=null;assert.deepEqual(guestPose(c),{sit:true,file:`assets/drive/guest-sitting-${k}-final.png`},k+' chair fallback');Z[k]=keep;}
 assert.equal(guestPose({kind:k,phase:'entering',route:[[1,1]],facing:2},250).file,`assets/drive/chars/guest/${k}/guest-${k}-walk-back-ul-3.png`);}}
// 지도에 연결됨
const iso=fs.readFileSync(new URL('isomap.js',ROOT),'utf8');assert.ok(iso.includes("from './guest-art.js'")&&iso.includes('guestPose(s.character'));
assert.ok(!/coat|rare/i.test(fs.readFileSync(new URL('guest-art.js',ROOT),'utf8')),'털색·희귀 코드 없음');
console.log('guest-walk ok');

assert.equal(CFG.characters.guest.seizaScale,1.4);assert.equal(CFG.characters.guest.sizeScale,undefined,'공통 배율 곱하지 않음');
{const p={x:0,y:0};assert.equal(guestDrawRect('commuter',p,128,176,[64,171],1)[3],176,'어른 걷기 1배');assert.equal(guestDrawRect('commuter',p,128,176,[64,171],1,true)[3],176*1.4,'어른 무릎 1.4배');
 assert.equal(guestDrawRect('girl',p,128,176,[64,171],1)[3],176*0.85,'아이 걷기 0.85');assert.equal(guestDrawRect('boykid',p,128,176,[64,171],1,true)[3],176*0.85,'아이 무릎도 0.85');}
assert.deepEqual(Object.keys(CFG.characters.guest.scale).sort(),[...S.NPC_NORMAL].sort());
for(const kind of S.NPC_NORMAL){
 const scale=['girl','boykid'].includes(kind)?0.85:1;
 assert.equal(CFG.characters.guest.scale[kind],scale);
 for(const [w,h,a,fit] of [[128,176,CFG.characters.guest.walkAnchor,150/151],[80,120,[40,120],125/120]]){
  const p={x:321,y:234},ref=guestDrawRect('commuter',p,w,h,a,fit),r=guestDrawRect(kind,p,w,h,a,fit);
  assert.ok(Math.abs(r[2]/ref[2]-scale)<1e-12);assert.ok(Math.abs(r[3]/ref[3]-scale)<1e-12);
  assert.ok(Math.abs(r[0]+r[2]*a[0]/w-p.x)<1e-12);
  assert.ok(Math.abs(r[1]+r[3]*a[1]/h-p.y)<1e-12);
 }
}

// Seiza keeps its transparent canvas and hips anchor; seat direction controls mirroring.
assert.deepEqual(size(CFG.characters.guest.seiza.commuter),[128,176]);
for(const dir of [0,1,2,3])assert.equal(guestPose({kind:'commuter',phase:'seated'},0,dir).mirrored,!!(dir%2));
for(const kind of S.NPC_NORMAL){assert.equal(CFG.characters.guest.seiza[kind],`assets/drive/chars/guest/seiza/guest-seiza-${kind}.png`);assert.deepEqual(size(CFG.characters.guest.seiza[kind]),[128,176]);
 const p={x:100,y:200},a=CFG.characters.guest.seizaAnchor,r=guestDrawRect(kind,p,128,176,a,1,true),scale=['girl','boykid'].includes(kind)?0.85:1.4;
 assert.equal(r[2],128*scale);assert.equal(r[0]+a[0]*scale,p.x);assert.equal(r[1]+a[1]*scale,p.y);}

for(const kind of S.NPC_NORMAL){const kid=['girl','boykid'].includes(kind);assert.equal(guestScale(kind),kid?0.85:1);assert.equal(guestScale(kind,true),kid?0.85:1.4);}
console.log('guest-scale rule ok');
