// 수인님·똑또기 2026-10-15 이동 규칙: 걷기 프레임 없는 시바는 위치 이동 없이 제자리 동작만, 프레임이 생기면 자동으로 걷는다.
import assert from 'node:assert/strict';import * as S from '../sim.js';import {CFG} from '../config.js';import {canWalk,walkFrame,walkTable,_setFound} from '../walk-frames.js';
function fixture(){const s=S.newState(0);S.chooseStart(s,'red','',()=>.99,0);s.coins=0;Object.assign(s.shibas[0].g,{full:100,dirt:0,fatigue:0,happy:100,boredom:0});const w=S.newWorld(s,S.rng(7));w.spawnT=1e9;return {s,w};}
const run=(s,w,sec)=>{const cells=new Set(),states=new Set();for(let i=0;i<sec*10;i++){S.tick(s,w,.1,(w.t+.1)*1000);const d=Object.values(w.sh)[0];if(d){cells.add(d.cell.join());states.add(d.state);}}return {cells,states};};
// 지금 에셋: 매니저만 걷기 프레임, 시바 4종·손님·동구는 없음
assert.equal(canWalk('manager'),true);assert.equal(walkFrame('manager',null,'front-dr',2),'assets/drive/chars/manager/manager-walk-front-dr-2.png');
for(const b of ['red','white','sesame','kuro'])assert.equal(canWalk('shiba',b),false,b);assert.equal(canWalk('guest'),false);
assert.ok(walkTable().length>=6);
{const {s,w}=fixture();const r=run(s,w,120);assert.equal(r.cells.size,1,'프레임 없는 시바는 한 칸에 그대로');assert.ok(!r.states.has('walk'));assert.ok(r.states.size>=2,'제자리 동작은 계속 바뀜 '+[...r.states]);}
// 프레임 파일이 생기면(probe가 찾으면) 자동으로 걷는다
_setFound('shiba','red','assets/drive/chars/shiba-red/walk-{dir}-{n}.png');assert.equal(canWalk('shiba','red'),true);
{const {s,w}=fixture();const r=run(s,w,120);assert.ok(r.cells.size>1,'프레임 있는 시바는 걷는다');assert.ok(r.states.has('walk'));}
_setFound('shiba','red',null);
console.log('move-rule ok');
