// 명세 17-7 가벽(선 따라 세우는 가벽, 수인님 10/14): 경계 막힘 길찾기, 입구 길 막는 배치 거부, 범위·겹침, 뒤집기, 저장 복원, enabled=false 무시.
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
if(!globalThis.crypto)Object.defineProperty(globalThis,'crypto',{value:webcrypto});
import {readFileSync} from 'node:fs';
import {CFG} from '../config.js';
import {MAP,defaultPlacement,restorePlacement,edgeSegments,edgeMirrored,cellToScreen,validEdge,activeEdges} from '../map-data.js';
import {pathfind,preservesEntrance,layout,routeTo} from '../navigation.js';
import {newState,newWorld,save,load} from '../sim.js';

const zone=MAP.zones[0],base=defaultPlacement().slots,E=(id,type,cell,side,flip=false)=>({id,type,cell,side,flip});
assert.equal(CFG.partitionWall.enabled,true,'기본 켜짐');
const originalEnabled=CFG.partitionWall.enabled;
const withEnabled=(enabled,fn)=>{const before=CFG.partitionWall.enabled;CFG.partitionWall.enabled=enabled;try{return fn();}finally{CFG.partitionWall.enabled=before;}};
assert.deepEqual(Object.fromEntries(Object.entries(CFG.partitionWall.types).map(([k,v])=>[k,v.len])),{edge1:1,edge2:2});
const {HD_FILES,hdPath}=await import('../hd-assets.js');
const dimensions=[];
const anchors={edge1:{front:[40,64],back:[39,60]},edge2:{front:[79,72],back:[78,72]}};
const pngSize=file=>{const b=readFileSync(new URL('../'+file,import.meta.url));assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(b.toString('ascii',12,16),'IHDR');return [b.readUInt32BE(16),b.readUInt32BE(20)];};
for(const [type,t] of Object.entries(CFG.partitionWall.types))for(const side of ['front','back']){const a=t.art[side];assert.equal(a.file,`assets/drive/partition/partition-${t.len}tile-${side}-v2.png`);assert.deepEqual(a.anchor,anchors[type][side]);assert.equal(a.scale,1);dimensions.push({file:a.file,actual:pngSize(hdPath(a.file)),expected:pngSize(a.file).map(n=>n*2)});}
for(const cell of [[0,0],[2,3],[4,1]])for(const type of ['edge1','edge2'])for(const side of ['i','j']){
 const points=edgeSegments(E('mirror',type,cell,side)).flatMap(([a,b])=>{const p=cellToScreen(...a,{x:17,y:29,scale:.75},zone),hw=zone.cell.w*.75/2,hh=zone.cell.h*.75/2;return b[0]>a[0]?[{x:p.x+hw,y:p.y},{x:p.x,y:p.y+hh}]:[{x:p.x,y:p.y+hh},{x:p.x-hw,y:p.y}];});
 assert.equal(edgeMirrored(points),side==='j');assert.equal(edgeMirrored([...points].reverse()),side==='j');
}
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
withEnabled(false,()=>{const s=newState(0),w=newWorld(s);s.placement.edges=[E('a','edge1',[2,4],'i')];
 assert.deepEqual(activeEdges(s.placement),[]);assert.deepEqual(layout(s,w).edges,[]);
 const ch={cell:[2,4]};routeTo(s,w,ch,[3,4]);assert.equal(ch.route.length,1,'꺼져 있으면 선을 그냥 건넘');
 CFG.partitionWall.enabled=true;
 assert.equal(layout(s,w).edges.length,1);routeTo(s,w,ch,[3,4]);assert.equal(ch.route.length,3,'손님·시바 이동(routeTo)도 가벽 반영');
 CFG.partitionWall.enabled=false;});

// 편집 UI(실제 isomap): 버튼, 배치, 뒤집기, 제거, 막힘 토스트, 앞/뒤 그림과 편집 모드 강조선
const strokes=[],draws=[],renderOps=[];
const ctx={fill(){},translate(...args){renderOps.push(["translate",...args]);},scale(...args){renderOps.push(["scale",...args]);},setTransform(){},fillRect(){},drawImage(im,...args){draws.push(im.file);renderOps.push(["draw",im.file,...args]);},save(){},restore(){},beginPath(){this.path=[];},moveTo(x,y){this.path.push([x,y]);},lineTo(x,y){this.path.push([x,y]);},closePath(){},stroke(){strokes.push({colour:this.strokeStyle,width:this.lineWidth,path:this.path});},createRadialGradient(){return {addColorStop(){}};}};
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
CFG.partitionWall.enabled=false;
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
assert.ok(draws.includes(CFG.partitionWall.types.edge1.art.front.file),'앞모습 그림');
q('[data-furniture-flip]').onclick();assert.equal(edge.flip,true);draws.length=0;iso.draw(state,{});assert.ok(draws.includes(CFG.partitionWall.types.edge1.art.back.file),'뒷모습 그림');q('[data-furniture-flip]').onclick();assert.equal(edge.flip,false);
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
// 일반 화면: 그림은 표시하고 강조선은 숨김
iso.setEdit(false);strokes.length=0;draws.length=0;iso.draw(state,{});assert.equal(strokes.length,0,'편집 밖에서는 선도 없음');assert.ok(draws.some(f=>f?.includes('/partition/')),'일반 화면에도 그림 표시');
CFG.partitionWall.enabled=false;iso.setEdit(true);strokes.length=0;iso.draw(state,{});
assert.ok(!strokes.some(s=>s.path?.length===2),'꺼지면 저장된 가벽도 안 보임');assert.ok(!iso.hits.some(h=>h.edge));
assert.ok(changed>0);
CFG.partitionWall.enabled=originalEnabled;
// 실제 렌더러: 두 길이·앞/뒤 모두 j만 선 가운데에서 반전한다.
iso.setEdit(false);
for(const type of ['edge1','edge2'])for(const side of ['i','j'])for(const flip of [false,true]){
 state.placement.edges=[E('render',type,[3,3],side,flip)];renderOps.length=0;iso.draw(state,{});
 const art=CFG.partitionWall.types[type].art[flip?'back':'front'],n=renderOps.findIndex(op=>op[0]==='draw'&&op[1]===art.file);
 assert.ok(n>=0);const before=renderOps[n-1];
 if(side==='j'){assert.deepEqual(before,['scale',-1,1]);assert.equal(renderOps[n-2][0],'translate');}else assert.equal(before[0],'translate');
 const [, ,x,y,w,h]=renderOps[n];assert.equal(x/w,-art.anchor[0]/128);assert.equal(y/h,-art.anchor[1]/64);
}
const N=await import('../navigation.js'),S=await import('../sim.js'),{PARTITION}=await import('../map-data.js');
withEnabled(false,()=>{

// ── 똑또기 확정 10/17 ──

const fresh=()=>{const s=newState(0);return {s,w:newWorld(s)};},on=fn=>withEnabled(true,fn);
// 1) 가격: 종류별 price null(미정), 칸막이 PARTITION.price(50000)를 쓰지 않는다
for(const t of ['edge1','edge2']){assert.ok(Object.hasOwn(CFG.partitionWall.types[t],'price'));assert.equal(CFG.partitionWall.types[t].price,null);assert.equal(S.edgePrice(newState(0),t),null,'미정');}
assert.equal(PARTITION.price,50000);assert.notEqual(S.edgePrice(newState(0),'edge1'),S.wallPrice(newState(0)));
CFG.partitionWall.types.edge2.price=7;assert.equal(S.edgePrice(newState(0),'edge2'),7,'종류별 값만 본다');CFG.partitionWall.types.edge2.price=null;
{const src=readFileSync(new URL('../isomap.js',import.meta.url),'utf8'),edgeCode=src.slice(src.indexOf('const edgeOk='),src.indexOf('function placeWall('));
 assert.ok(edgeCode.length>100&&!edgeCode.includes('PARTITION'),'가벽 편집 코드가 PARTITION 값을 쓰지 않음');
 assert.ok(!readFileSync(new URL('../map-data.js',import.meta.url),'utf8').split('\n').filter(l=>/edge/i.test(l)).some(l=>l.includes('PARTITION')));}

// 2) 가방 '놓기': 입구 길 검사(가구는 항상, 가벽은 enabled일 때만)
{const {s}=fresh();s.furnitureInv={table:2};s.placement.slots.push({id:'x1',type:'table',origin:[0,3],dir:0},{id:'x2',type:'table',origin:[1,2],dir:0});
 const snap=JSON.stringify(s.placement),n=s.nextId;
 assert.equal(S.furnitureFit(s,'table',[1,4]),'entrance','방석 [1,3]의 마지막 접근을 막는 자리');
 assert.equal(S.placeFurniture(s,'table',[1,4]),false,'가벽이 꺼져 있어도 가구 검사는 한다');
 assert.equal(JSON.stringify(s.placement),snap);assert.equal(s.furnitureInv.table,2);assert.equal(s.nextId,n);
 assert.equal(S.furnitureFit(s,'table',[0,0]),'invalid');assert.equal(S.furnitureFit(s,'table',[4,4]),'ok');
 assert.equal(S.placeFurniture(s,'table',[4,4]),true);assert.equal(s.furnitureInv.table,1);}
{const {s}=fresh();s.furnitureInv={table:1};s.placement.edges=seat;
 assert.equal(S.furnitureFit(s,'table',[1,4]),'ok','꺼져 있으면 저장된 가벽은 무시');
 on(()=>{assert.equal(S.furnitureFit(s,'table',[1,4]),'entrance','켜지면 가벽 포함 검사');assert.equal(S.placeFurniture(s,'table',[1,4]),false);});
 assert.equal(s.furnitureInv.table,1);assert.equal(S.placeFurniture(s,'table',[1,4]),true);}
{const src=readFileSync(new URL('../main.js',import.meta.url),'utf8'),act=src.slice(src.indexOf('placeFurniture:d=>{'),src.indexOf('unlockPopup:'));
 assert.ok(act.includes("S.furnitureFit(")&&act.includes("toast(L('edit.entranceBlocked'))"),'main.js 놓기(bagPlace → placeFurniture)도 같은 토스트');
 assert.ok(/bagPlace:d=>\{act\.bagDone\(\);act\.placeFurniture\(d\);\}/.test(src));}

// 3) 옆 칸 판정 adjacent(a,b,edges)
{const eI=E('a','edge1',[0,0],'i');
 assert.equal(N.adjacent([0,0],[1,0]),true);assert.equal(N.adjacent([0,0],[1,1]),false,'대각선 아님');assert.equal(N.adjacent([0,0],[0,0]),false);assert.equal(N.adjacent([0,0],[2,0]),false);
 assert.equal(N.adjacent([0,0],[1,0],[eI]),false);assert.equal(N.adjacent([1,0],[0,0],[eI]),false,'양쪽 방향');assert.equal(N.adjacent([0,0],[0,1],[eI]),true,'다른 선은 그대로');
 for(let a=0;a<36;a++)for(let b=0;b<36;b++){const p=[a%6,a/6|0],q=[b%6,b/6|0];assert.equal(N.adjacent(p,q,[]),Math.abs(p[0]-q[0])+Math.abs(p[1]-q[1])===1,'가벽 없음 = 맨해튼 1');}}
// 주문 음식을 찻상에: 방석 [1,3]과 찻상 [2,3] 사이 가벽 → 찻상 아님(손에 들고)
{const between=[E('t','edge1',[1,3],'i')],run=()=>{const {s,w}=fresh();s.placement.edges=between;const c={id:1,phase:'seated',cell:[1,3]};w.custs.push(c);N.linkTable(s,w,c);return c;};
 const off=run();assert.equal(off.itemLocation,'table');assert.equal(off.itemSlot.tableId,'table');
 const blockedC=on(run);assert.equal(blockedC.itemLocation,'inHand');assert.equal(blockedC.itemSlot,null);}
// 매니저: 찻상 옆 칸 중 가벽 너머는 가지 않음 / 찻상과 손님 사이 가벽이면 그 찻상에 가지 않음
{const mgr=edges=>{const {s,w}=fresh();s.placement.edges=edges;w.custs.push({id:1,phase:'seated',cell:[3,3]});N.tickManager(s,w,0.01,true,1);return w.manager;};
 const off=mgr([E('u','edge1',[2,2],'j'),E('d','edge1',[2,3],'j')]);assert.equal(off.phase,'walking');assert.ok(['2,2','2,4'].includes(off.target.join(',')));
 const sides=on(()=>mgr([E('u','edge1',[2,2],'j'),E('d','edge1',[2,3],'j')]));assert.equal(sides.phase,'idle','찻상 옆 빈 칸이 모두 가벽 너머');assert.equal(sides.target??null,null);
 const guest=on(()=>mgr([E('g','edge1',[2,3],'i')]));assert.equal(guest.phase,'idle','찻상-손님 사이 가벽 → 찻상 아님');
 assert.deepEqual(on(()=>mgr([])),mgr([]),'가벽 없으면 켜져 있어도 같음');}
// 카운터 접근: 매니저 자리 [2,0](카운터 [1,0] 옆) 사이 가벽 → 카운터 옆 다른 칸
{const home=edges=>{const {s,w}=fresh();s.placement.edges=edges;N.tickManager(s,w,0.01,true,1);return w.manager.cell;},wall=[E('h','edge1',[1,0],'i')];
 assert.deepEqual(home(wall),[2,0],'꺼져 있으면 예전 자리');
 const h=on(()=>home(wall));assert.notDeepEqual(h,[2,0]);assert.ok([[0,0],[1,0]].some(c=>N.adjacent(c,h,wall)),'가벽 너머가 아닌 카운터 옆 칸');}
// 시바가 손님 옆 칸 고르기: sim deliver/approach, syncRoutes approach
{const pick=(edges,via)=>{const {s,w}=fresh();s.placement.edges=edges;const c={id:1,phase:'seated',cell:[1,3],t:30,with:null,score:0,met:[]};w.custs.push(c);
  w.sh[7]={id:7,phase:'roam',cell:[0,1],t:0,cust:null};assert.ok(S.deliver(s,w,7,1));if(via==='sync'){w.sh[7].target=null;w.layoutSig=null;N.syncRoutes(s,w);}return w.sh[7].target.join(',');};
 const wall=[E('w','edge1',[0,3],'i')];
 for(const via of ['deliver','sync']){assert.equal(pick(wall,via),'0,3','꺼져 있으면 예전과 같은 칸');assert.equal(on(()=>pick(wall,via)),'1,4','가벽 너머 [0,3]은 옆 칸 아님 → 다음 칸');assert.equal(on(()=>pick([],via)),'0,3');}}
// 입구 검사 카운터 판정도 adjacent 사용(기존 시나리오 유지)
assert.equal(pe(counter,[...counter,E('c2','edge1',[1,0],'i')]),false);
assert.equal(CFG.partitionWall.enabled,false);
});
assert.equal(CFG.partitionWall.enabled,originalEnabled);
console.log('partition edge 10/17: edge price null (no PARTITION.price), bag place entrance check, adjacent() blocks table/manager/counter/shiba neighbours, disabled = unchanged passed');
console.log('partition edge (17-7): blocked crossings, entrance/seat/counter rejection, 2-cell range, flip, restore, enabled=false passed');

// @2x는 정확히 2배일 때만 HD_FILES에 올린다(아니면 절반 크기 계산이 어긋남 → 1x 사용). 03:55 승인본 중 1tile-back만 정확히 2배.
for(const d of dimensions){const exact=d.actual.join()===d.expected.join();assert.equal(HD_FILES.has(d.file),exact,d.file+': @2x '+d.actual+' vs '+d.expected);}
assert.deepEqual(dimensions.filter(d=>HD_FILES.has(d.file)).map(d=>d.file),['assets/drive/partition/partition-1tile-back-v2.png']);
