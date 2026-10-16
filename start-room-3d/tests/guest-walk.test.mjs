// 걸어 들어와 앉기 (2026-10-16): 출근길 손님(commuter)만 걷기 그림으로 입구 → 자리, 앉으면 앉은 그림. 나머지 9종은 그대로(지도에 안 그림).
import assert from 'node:assert/strict';import fs from 'node:fs';import * as S from '../sim.js';import {CFG} from '../config.js';import {canWalk,walkFrame,walkTable} from '../walk-frames.js';
import {guestPose,keyBackground,sitFile,GUEST_DIRS} from '../guest-art.js';import {faceCell} from '../navigation.js';
const ROOT=new URL('../',import.meta.url),G=CFG.characters.walkFrames.guest;
// 설정: 종류별 객체, commuter 만 경로, 나머지 9종 null (나중에 종류별로 추가)
assert.deepEqual(Object.keys(G).sort(),[...S.NPC_NORMAL].sort());
assert.equal(G.commuter,'assets/drive/chars/guest/commuter/guest-commuter-walk-{dir}-{n}.png');
for(const k of S.NPC_NORMAL.filter(k=>k!=='commuter')){assert.equal(G[k],null,k);assert.equal(canWalk('guest',k),false,k);assert.equal(guestPose({kind:k,phase:'entering',route:[[1,1]],facing:2}),null,k);}
assert.equal(canWalk('guest','commuter'),true);assert.equal(canWalk('guest'),false);
assert.deepEqual(walkTable().filter(x=>x.kind==='guest').map(x=>[x.key,x.walk]),S.NPC_NORMAL.map(k=>[k,k==='commuter']));
// 16장 모두 있고 128×176 (PNG IHDR)
const size=f=>{const b=fs.readFileSync(new URL(f,ROOT));assert.equal(b.toString('ascii',1,4),'PNG',f);return [b.readUInt32BE(16),b.readUInt32BE(20)];};
for(const dir of GUEST_DIRS)for(let n=1;n<=4;n++){const f=walkFrame('guest','commuter',dir,n);assert.equal(f,`assets/drive/chars/guest/commuter/guest-commuter-walk-${dir}-${n}.png`);assert.deepEqual(size(f),[128,176],f);}
assert.equal(sitFile('commuter'),'assets/drive/guest-sitting-commuter-final.png');assert.ok(fs.existsSync(new URL(sitFile('commuter'),ROOT)));
// 방향: 다음 칸으로 가는 방향 → 0 front-dr, 1 front-dl, 2 back-ul, 3 back-ur
for(const [to,f] of [[[3,2],0],[[2,3],1],[[1,2],2],[[2,1],3]]){const c={cell:[2,2]};faceCell(c,to);assert.equal(GUEST_DIRS[c.facing],GUEST_DIRS[f],to.join());}
// 그림 고르기: 걷는 중 125ms마다 1→4, 멈추면 1번, 앉으면 앉은 그림
{const c={kind:'commuter',phase:'entering',route:[[0,4]],facing:3};assert.deepEqual([0,125,250,375,500].map(t=>guestPose(c,t).n),[1,2,3,4,1]);
 assert.equal(guestPose(c,250).file,'assets/drive/chars/guest/commuter/guest-commuter-walk-back-ur-3.png');
 assert.equal(guestPose({...c,route:[]},250).n,1);assert.deepEqual(guestPose({...c,phase:'seated'}),{sit:true,file:'assets/drive/guest-sitting-commuter-final.png'});}
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
// 다른 종류: 시뮬레이션은 종류와 무관(같은 seed → 같은 길), 지도엔 안 그림
{const a=trace('commuter').out,b=trace('mom').out;assert.deepEqual(b,a);assert.equal(guestPose({kind:'mom',phase:'seated'}),null);}
// 지도에 연결됨
const iso=fs.readFileSync(new URL('isomap.js',ROOT),'utf8');assert.ok(iso.includes("from './guest-art.js'")&&iso.includes('guestPose(s.character'));
assert.ok(!/coat|rare/i.test(fs.readFileSync(new URL('guest-art.js',ROOT),'utf8')),'털색·희귀 코드 없음');
console.log('guest-walk ok');
