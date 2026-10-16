// 명세 17-7 가벽(선 따라 세우는 가벽, 수인님 10/14): 경계 막힘 길찾기, 입구 길 막는 배치 거부, 범위·겹침, 뒤집기, 저장 복원, enabled=false 무시.
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
if(!globalThis.crypto)Object.defineProperty(globalThis,'crypto',{value:webcrypto});
import {readFileSync} from 'node:fs';
import {CFG} from '../config.js';
import {MAP,defaultPlacement,restorePlacement,edgeSegments,validEdge,activeEdges} from '../map-data.js';
import {pathfind,preservesEntrance,layout,routeTo} from '../navigation.js';
import {newState,newWorld,save,load} from '../sim.js';

const zone=MAP.zones[0],base=defaultPlacement().slots,E=(id,type,cell,side,flip=false)=>({id,type,cell,side,flip});
assert.equal(CFG.partitionWall.enabled,false,'기본은 꺼짐(그림 대기)');
assert.deepEqual(Object.fromEntries(Object.entries(CFG.partitionWall.types).map(([k,v])=>[k,v.len])),{edge1:1,edge2:2});
for(const t of Object.values(CFG.partitionWall.types))assert.deepEqual(t.art,{front:null,back:null});
assert.equal(CFG.partitionWall.count,null);assert.equal(CFG.partitionWall.price,null);

// 경계 모양: side 'i' = [i,j]|[i+1,j], 2칸은 선을 따라 j+1 쪽으로
assert.deepEqual(edgeSegments(E('a','edge1',[2,2],'i')),[[[2,2],[3,2]]]);
assert.deepEqual(edgeSegments(E('a','edge2',[2,2],'i')),[[[2,2],[3,2]],[[2,3],[3,3]]]);
assert.deepEqual(edgeSegments(E('a','edge2',[2,2],'j')),[[[2,2],[2,3]],[[3,2],[3,3]]]);

// 경계 막힘 pathfind
const open={cols:6,rows:6};
assert.equal(pathfind(open,[],[0,0],[1,0]).length,1);
assert.equal(pathfind(open,[],[0,0],[1,0],{edges:[E('a','edge1',[0,0],'i')]}).length,3,'바로 옆 칸도 선 너머면 돌아간다');
assert.equal(pathfind(open,[],[1,0],[0,0],{edges:[E('a','edge1',[0,0],'i')]}).length,3,'양쪽 방향 모두 막힘');
const line=[0,2,4].map(j=>E('l'+j,'edge2',[2,j],'i'));
assert.equal(pathfind(open,[],[0,0],[5,5],{edges:line}),null,'방을 가로지르는 가벽 줄 → 못 건넘');
assert.ok(pathfind(open,[],[0,0],[5,5],{edges:line.slice(0,2)}),'틈이 있으면 지나감');

// 입구 길 막는 배치 거부: 입구 칸 둘러싸기
const pe=(before,after,slots=base)=>preservesEntrance(zone,slots,slots,{edgesBefore:before,edgesAfter:after});
const ring=[E('r1','edge1',zone.entrance,'i')];
assert.equal(pe([],ring),true,'한쪽만 막으면 다른 쪽으로 들어감');
assert.equal(pe(ring,[...ring,E('r2','edge1',[0,4],'j')]),false,'입구 칸을 둘러싸면 거부');
// 좌석 접근 막기: 방석 [1,3] 둘레(왼쪽 [0,3], 위 [1,2], 아래 [1,4]; 오른쪽은 찻상)
const seat=[E('s1','edge1',[0,3],'i'),E('s2','edge1',[1,2],'j')];
assert.equal(pe([],seat),true);
assert.equal(pe(seat,[...seat,E('s3','edge1',[1,3],'j')]),false,'좌석 마지막 접근 막으면 거부');
// 카운터 접근 막기: 카운터 [0,0]·[1,0] — 옆 칸 [0,1]·[1,1]·[2,0] 모두 선 너머
const counter=[E('c1','edge2',[0,0],'j')];
assert.equal(pe([],counter),true);
assert.equal(pe(counter,[...counter,E('c2','edge1',[1,0],'i')]),false,'카운터에 닿는 옆 칸이 모두 가벽 너머면 거부');
// 가구 배치도 가벽을 포함해 검사: 가벽 2개 + 찻상 하나 더 [1,4] → 방석 [1,3] 길이 막힘
const moved=[...base,{id:'t2',type:'table',origin:[1,4],dir:0}];
assert.equal(preservesEntrance(zone,base,moved,{edgesBefore:seat,edgesAfter:seat}),false);
assert.equal(preservesEntrance(zone,base,moved),true,'가벽이 없으면 같은 이동은 통과');

// 2칸 범위·방 밖·겹침 거부
assert.equal(validEdge(E('a','edge2',[0,4],'j'),[],zone),true);
assert.equal(validEdge(E('a','edge2',[5,0],'i'),[],zone),false,'오른쪽 끝 선 = 방 밖');
assert.equal(validEdge(E('a','edge2',[0,5],'i'),[],zone),false,'2칸째가 방 밖');
assert.equal(validEdge(E('a','edge2',[4,0],'j'),[],zone),true);
assert.equal(validEdge(E('a','edge2',[5,0],'j'),[],zone),false,'2칸째 i+1이 방 밖');
assert.equal(validEdge(E('a','edge1',[-1,0],'i'),[],zone),false);
assert.equal(validEdge(E('a','edge1',[0,0],'k'),[],zone),false);
assert.equal(validEdge(E('a','edge3',[0,0],'i'),[],zone),false);
assert.equal(validEdge({...E('a','edge1',[0,0],'i'),flip:'yes'},[],zone),false);
assert.equal(validEdge(E('a','edge1',[0,1],'i'),[E('b','edge2',[0,0],'i')],zone),false,'겹침 거부');
assert.equal(validEdge(E('a','edge1',[0,1],'j'),[E('b','edge2',[0,0],'i')],zone),true,'교차(다른 선)는 허용');
assert.equal(validEdge(E('b','edge1',[0,1],'i'),[E('b','edge2',[0,0],'i')],zone),true,'자기 자신은 겹침 아님(옮기기)');

// 저장 복원: 잘못된 값은 하나씩 버림, 정상 값은 유지
{const good=[E('g1','edge2',[2,2],'i',true),E('g2','edge1',[4,4],'j')];
 const r=restorePlacement(JSON.parse(JSON.stringify({v:1,slots:base,edges:[...good,E('g1','edge1',[0,0],'i'),E('x1','edge2',[2,3],'i'),E('x2','edge1',[6,0],'i'),{id:'x3',type:'edge1',cell:[1,1],side:'i'}, null,'bad']})));
 assert.deepEqual(r.edges,good);assert.deepEqual(r.slots,base);
 assert.deepEqual(restorePlacement({v:1,slots:base}),{v:1,slots:base},'가벽 없으면 예전 모양 그대로');
 assert.deepEqual(restorePlacement({v:1,slots:base,edges:'nope'}),{v:1,slots:base});
 const store={m:{},getItem(k){return this.m[k]??null;},setItem(k,v){this.m[k]=v;}};
 const st=newState(0);st.placement={v:1,slots:base,edges:good};save(store,st,0);
 assert.deepEqual(load(store,0).state.placement.edges,good,'저장 → 불러오기');}

// enabled=false → 길찾기·편집에 효과 없음(저장 값은 남음)
{const s=newState(0),w=newWorld(s);s.placement.edges=[E('a','edge1',[2,4],'i')];
 assert.deepEqual(activeEdges(s.placement),[]);assert.deepEqual(layout(s,w).edges,[]);
 const ch={cell:[2,4]};routeTo(s,w,ch,[3,4]);assert.equal(ch.route.length,1,'꺼져 있으면 선을 그냥 건넘');
 CFG.partitionWall.enabled=true;
 assert.equal(layout(s,w).edges.length,1);routeTo(s,w,ch,[3,4]);assert.equal(ch.route.length,3,'손님·시바 이동(routeTo)도 가벽 반영');
 CFG.partitionWall.enabled=false;}

// 편집 UI(실제 isomap): 버튼, 배치, 뒤집기, 제거, 막힘 토스트, 그림 없음 → 편집 모드 선만
const strokes=[],draws=[];
const ctx={fill(){},translate(){},scale(){},setTransform(){},fillRect(){},drawImage(im){draws.push(im.file);},save(){},restore(){},beginPath(){this.path=[];},moveTo(x,y){this.path.push([x,y]);},lineTo(x,y){this.path.push([x,y]);},closePath(){},stroke(){strokes.push({colour:this.strokeStyle,width:this.lineWidth,path:this.path});},createRadialGradient(){return {addColorStop(){}};}};
globalThis.location={search:''};globalThis.devicePixelRatio=1;globalThis.ResizeObserver=class{observe(){}};
globalThis.Image=class{set src(path){path=path.replace('/@2x/','/');this.file=path;this.naturalWidth=128;this.naturalHeight=64;this.complete=true;try{readFileSync(new URL('../'+path,import.meta.url));}catch{this.naturalWidth=0;}}};
// 버튼 속성 선택자([a], [a="v"], 쉼표 목록)만 아는 작은 가짜 DOM
const makeButton=tag=>{const attrs=Object.fromEntries([...tag.matchAll(/([\w-]+)(?:="([^"]*)")?/g)].slice(1).map(m=>[m[1],m[2]??'']));
 return {attrs,hidden:'hidden' in attrs,disabled:false,onclick:null,hasAttribute:a=>a in attrs,dataset:Object.fromEntries(Object.entries(attrs).filter(([k])=>k.startsWith('data-')).map(([k,v])=>[k.slice(5).replace(/-(\w)/g,(_,c)=>c.toUpperCase()),v]))};};
const matches=(b,sel)=>sel.split(',').some(one=>{const m=one.trim().match(/^\[([\w-]+)(?:="([^"]*)")?\]$/);return m&&m[1] in b.attrs&&(m[2]===undefined||b.attrs[m[1]]===m[2]);});
globalThis.document={createElement(type){if(type==='canvas')return {getContext:()=>ctx};const el={buttons:[],dataset:{},style:{setProperty(){}},classList:{names:new Set(),toggle(n,on){on?this.names.add(n):this.names.delete(n);},contains(n){return this.names.has(n);}},setAttribute(){},
 set innerHTML(html){el.buttons=[...html.matchAll(/<button[^>]*>/g)].map(m=>makeButton(m[0]));},querySelector(sel){return el.buttons.find(b=>matches(b,sel))||null;},querySelectorAll(sel){return el.buttons.filter(b=>matches(b,sel));}};return el;}};
const {createIsoMap}=await import('../isomap.js');
const canvas={dataset:{},clientWidth:360,clientHeight:600,getContext:()=>ctx,addEventListener(){},getBoundingClientRect:()=>({left:0,top:0}),setPointerCapture(){}};
let blocked=null,changed=0;const iso=createIsoMap(canvas,{onBlocked:m=>blocked=m??'generic',onChange:()=>changed++});
const bar=iso.actions,q=s=>bar.querySelector(s),state=newState(0);
iso.draw(state,{});iso.setEdit(true);
assert.equal(q('[data-edge-add="edge1"]').hidden,true,'꺼져 있으면 버튼 숨김');assert.equal(q('[data-edge-add="edge2"]').hidden,true);assert.equal(q('[data-edge-remove]').hidden,true);
assert.equal(iso.placeEdge('edge1',[2,4],'i'),false,'꺼져 있으면 배치 안 됨');assert.equal(state.placement.edges,undefined);
CFG.partitionWall.enabled=true;iso.draw(state,{});iso.setEdit(true);
assert.equal(q('[data-edge-add="edge1"]').hidden,false);assert.equal(q('[data-edge-add="edge2"]').hidden,false);assert.equal(q('[data-edge-add="edge1"]').attrs['data-i18n'],'edit.edgeAdd1');
// 버튼으로 1칸 가벽 → 선택, 뒤집기, 제거
q('[data-edge-add="edge1"]').onclick();
const id=iso.selected;assert.ok(id?.startsWith('edge-'));assert.equal(state.placement.edges.length,1);assert.ok(bar.classList.contains('edge-selected'));
const edge=state.placement.edges[0];assert.equal(edge.type,'edge1');assert.equal(edge.flip,false);
strokes.length=0;draws.length=0;iso.draw(state,{});
assert.ok(strokes.some(s=>s.colour==='#16e05a'&&s.width===4&&s.path.length===2),'고른 가벽 = 초록 강조선');
assert.ok(iso.hits.some(h=>h.id===id&&h.edge));
assert.ok(!draws.some(f=>/partition|edge/.test(f||'')),'그림 null → 가벽 그림 없음');
q('[data-furniture-flip]').onclick();assert.equal(edge.flip,true);q('[data-furniture-flip]').onclick();assert.equal(edge.flip,false);
q('[data-furniture-done]').onclick();assert.equal(iso.selected,null);
// 2칸 가벽 + 뒤집기
assert.equal(iso.placeEdge('edge2',[3,1],'i'),true);const e2=state.placement.edges.at(-1);q('[data-furniture-flip]').onclick();assert.equal(e2.flip,true);
q('[data-edge-remove]').onclick();assert.ok(!state.placement.edges.includes(e2));assert.equal(iso.selected,null);
// 방 밖·겹침 → 일반 거부, 입구 둘러싸기 → 입구 토스트
blocked=null;assert.equal(iso.placeEdge('edge2',[5,0],'i'),false);assert.equal(blocked,'generic');
blocked=null;assert.equal(iso.placeEdge('edge1',edge.cell,edge.side),false);assert.equal(blocked,'generic');
state.placement.edges=[];assert.equal(iso.placeEdge('edge1',zone.entrance,'i'),true);
blocked=null;const snap=JSON.stringify(state.placement);assert.equal(iso.placeEdge('edge1',[0,4],'j'),false);assert.equal(blocked,'입구가 막혔어요!');assert.equal(JSON.stringify(state.placement),snap,'거부하면 그대로');
// 새로 놓은 가벽 취소 → 사라짐
assert.equal(iso.placeEdge('edge1',[4,4],'j'),true);q('[data-furniture-cancel]').onclick();assert.equal(state.placement.edges.length,1);
// 일반 화면: 그림이 없으니 아무것도 그리지 않음
iso.setEdit(false);strokes.length=0;iso.draw(state,{});assert.equal(strokes.length,0,'편집 밖에서는 선도 없음');
CFG.partitionWall.enabled=false;iso.setEdit(true);strokes.length=0;iso.draw(state,{});
assert.ok(!strokes.some(s=>s.path?.length===2),'꺼지면 저장된 가벽도 안 보임');assert.ok(!iso.hits.some(h=>h.edge));
assert.ok(changed>0);
console.log('partition edge (17-7): blocked crossings, entrance/seat/counter rejection, 2-cell range, flip, restore, enabled=false passed');
