// 걸어 들어와 앉기 (2026-10-16) real canvas checks: commuter walks in with the frame for each step's direction, animates 1→4, then the sitting art; other kinds draw nothing (unchanged).
export async function guestWalkBrowser({ev,check,sleep}){
 await ev(`(()=>{const g=__game;g.ui.modals=[];g.close?.();g.iso.setEdit(false);g.iso.scrollTo(0);
  if(!window.gwDraw){const P=CanvasRenderingContext2D.prototype,o=P.drawImage;window.gwDraw=[];P.drawImage=function(im,...a){if(this.canvas.id==='isomap')gwDraw.push(im.dataset?.sit?'sit:'+im.dataset.sit:im.src||im.currentSrc||'');return o.call(this,im,...a);};}
  window.gwSpawn=kind=>{const w=g.world;w.custs.length=0;w.queue.length=0;w.spawnT=0;const r=w.r;w.r=()=>0;g.S.tick(g.state,w,.01,g.clock.now());w.r=r;w.spawnT=1e9;const c=w.custs[0];c.kind=kind;return c;};
  window.gwDrawNow=()=>{gwDraw.length=0;g.refresh();return gwDraw.filter(s=>s.includes('guest'));};return true;})()`);
 // preload all 16 frames + the sitting cutout through the map itself
 await ev(`(async()=>{const g=__game,c=gwSpawn('commuter');for(const f of [0,1,2,3]){c.facing=f;for(let i=0;i<4;i++){gwDrawNow();await new Promise(r=>setTimeout(r,130));}}c.phase='seated';gwDrawNow();await new Promise(r=>setTimeout(r,800));gwDrawNow();return true;})()`);
 await check('걸어 들어와 앉기: 출근길 손님은 입구에서 자리까지 매 걸음 그 걸음 방향의 걷기 그림으로 그려지고, 도착하면 앉은 그림(guest-sitting-commuter-final.png)으로 바뀐다',`(async()=>{const g=__game,D=['front-dr','front-dl','back-ul','back-ur'],c=gwSpawn('commuter'),res=[],dirs=new Set();
  const start=c.cell.join();for(let i=0;i<400&&c.phase!=='seated';i++){const before=c.cell.join();g.S.tick(g.state,g.world,.05,g.clock.now());if(c.phase==='seated')break;
   const d=gwDrawNow(),want='assets/drive/chars/guest/commuter/guest-commuter-walk-'+D[c.facing||0]+'-';dirs.add(D[c.facing||0]);
   res.push(d.length===1&&d[0].includes(want)&&!d[0].includes('sit'));}
  const seat=gwDrawNow();
  return res.length>5&&res.every(Boolean)&&c.phase==='seated'&&c.cell.join()!==start&&dirs.size>=2&&seat.length===1&&seat[0]==='sit:assets/drive/guest-sitting-commuter-final.png';})()`);
 await check('걸어 들어와 앉기: 걷는 동안 프레임 1→4 가 돌고(8fps), 4 방향 16장 모두 실제로 로드되어 그려진다',`(async()=>{const c=gwSpawn('commuter'),seen={};c.route=[[1,5],[2,5]];
  for(const f of [0,1,2,3]){c.facing=f;for(let i=0;i<8;i++){const d=gwDrawNow();for(const s of d){const m=s.match(/walk-([a-z-]+)-(\\d)\\.png$/);if(m)(seen[m[1]]??=new Set()).add(m[2]);}await new Promise(r=>setTimeout(r,70));}}
  c.route=[];const still=gwDrawNow();return ['front-dr','front-dl','back-ul','back-ur'].every(d=>seen[d]?.size===4)&&still.length===1&&still[0].endsWith('-1.png');})()`);
 await check('걸어 들어와 앉기: 걷기 그림이 없는 다른 9종 손님은 지금처럼 지도에 그리지 않는다(걷기·앉기 모두)',`(()=>{const g=__game,res=[];for(const k of g.S.NPC_NORMAL.filter(k=>k!=='commuter')){const c=gwSpawn(k);res.push(gwDrawNow().length===0);c.phase='seated';res.push(gwDrawNow().length===0);}
  g.world.custs.length=0;g.refresh();return res.length===18&&res.every(Boolean);})()`);
}
