// 걸어 들어와 앉기 (2026-10-16) real canvas checks: all 10 guest kinds walk in with the frame for each step's direction, animate 1→4, keep their feet on the cell, then show their own sitting art; no guest walk probe 404s.
export async function guestWalkBrowser({ev,check,sleep}){
 await ev(`(()=>{const g=__game;g.ui.modals=[];g.close?.();g.iso.setEdit(false);g.iso.scrollTo(0);
  if(!window.gwDraw){const P=CanvasRenderingContext2D.prototype,o=P.drawImage;window.gwDraw=[];window.gwRect=[];window.gwMatrix=[];P.drawImage=function(im,...a){if(this.canvas.id==='isomap'){gwDraw.push(im.dataset?.sit?'sit:'+im.dataset.sit:im.src||im.currentSrc||'');gwRect.push(a.length>=4?a.slice(-4):a);gwMatrix.push(this.getTransform().a);}return o.call(this,im,...a);};}
  window.gwSpawn=kind=>{const w=g.world;w.custs.length=0;w.queue.length=0;w.spawnT=0;const r=w.r;w.r=()=>0;g.S.tick(g.state,w,.01,g.clock.now());w.r=r;w.spawnT=1e9;const c=w.custs[0];c.kind=kind;return c;};
  window.gwDrawNow=()=>{gwDraw.length=0;gwRect.length=0;gwMatrix.length=0;g.refresh();const out=[];gwDraw.forEach((s,i)=>{if(s.includes('guest'))out.push(s);});return out;};
  window.gwDrawRects=()=>{gwDrawNow();return gwDraw.map((s,i)=>[s,gwRect[i]]).filter(([s])=>s.includes('guest'));};return true;})()`);
 // preload all 160 frames + the 10 sitting cutouts through the map's own image cache (draw every kind × direction across several 125ms frame slots)
 await ev(`(async()=>{const g=__game,K=g.S.NPC_NORMAL,w=g.world;w.custs.length=0;w.queue.length=0;
  for(let round=0;round<16;round++){for(const k of K)for(const f of [0,1,2,3])w.custs.push({id:-1-w.custs.length,kind:k,phase:'entering',cell:[2+f,4],route:[[3,4]],facing:f});
   gwDrawNow();w.custs.length=0;await new Promise(r=>setTimeout(r,70));}
  for(const k of K){const c=gwSpawn(k);c.phase='seated';gwDrawNow();}await new Promise(r=>setTimeout(r,1500));for(const k of K){const c=gwSpawn(k);c.phase='seated';gwDrawNow();}return true;})()`);
 await check('걸어 들어와 앉기: 손님 10종 모두 입구에서 자리까지 매 걸음 그 걸음 방향의 자기 걷기 그림으로 그려지고, 도착하면 자기 앉은 그림(guest-sitting-{종류}-final.png)으로 바뀐다',`(async()=>{const g=__game,D=['front-dr','front-dl','back-ul','back-ur'],bad=[];
  for(const k of g.S.NPC_NORMAL){const c=gwSpawn(k),res=[],dirs=new Set(),start=c.cell.join();
   for(let i=0;i<400&&c.phase!=='seated';i++){g.S.tick(g.state,g.world,.05,g.clock.now());if(c.phase==='seated')break;
    const d=gwDrawNow(),want='assets/drive/chars/guest/'+k+'/guest-'+k+'-walk-'+D[c.facing||0]+'-';dirs.add(D[c.facing||0]);res.push(d.length===1&&d[0].includes(want)&&!d[0].includes('sit'));}
   const seat=gwDrawNow();if(!(res.length>5&&res.every(Boolean)&&c.phase==='seated'&&c.cell.join()!==start&&dirs.size>=2&&seat.length===1&&seat[0]===new URL('assets/drive/chars/guest/seiza/guest-seiza-'+k+'.png',location.href).href))bad.push(k);}
  return (window.gwBad=bad).length===0;})()`);
 await check('걸어 들어와 앉기: 10종 모두 걷는 동안 프레임 1→4 가 돌고(8fps), 4 방향 16장이 실제로 로드되어 그려지며, 멈추면 1번 프레임',`(async()=>{const g=__game,bad=[];
  for(const k of g.S.NPC_NORMAL){const c=gwSpawn(k),seen={};c.route=[[1,5],[2,5]];
   for(const f of [0,1,2,3]){c.facing=f;for(let i=0;i<60&&seen[['front-dr','front-dl','back-ul','back-ur'][f]]?.size!==4;i++){const d=gwDrawNow();for(const s of d){const t=s.split('/guest-'+k+'-walk-')[1]?.replace('.png','');const m=t&&[null,t.slice(0,-2),t.slice(-1)];if(m)(seen[m[1]]??=new Set()).add(m[2]);}await new Promise(r=>setTimeout(r,40));}}
   c.route=[];const still=gwDrawNow();if(!(['front-dr','front-dl','back-ul','back-ur'].every(d=>seen[d]?.size===4)&&still.length===1&&still[0].endsWith('-1.png')))bad.push(k+':'+JSON.stringify(Object.fromEntries(Object.entries(seen).map(([a,b])=>[a,[...b]]))));}
  return (window.gwBad=bad).length===0;})()`);
 await check('걸어 들어와 앉기: 10종 걷기 그림은 실제 크기(128×176)로 설정 배율(아이 0.85), 같은 칸에서 발(walkAnchor) 위치가 모두 같다',`(async()=>{const g=__game,G=(await import('./config.js')).CFG.characters.guest,bad=[];let ref=null;
  for(const k of g.S.NPC_NORMAL){const c=gwSpawn(k);c.route=[];const r=gwDrawRects();if(r.length!==1){bad.push(k+':n'+r.length);continue;}const [x,y,w,h]=r[0][1];
   if(Math.abs(w/h-128/176)>1e-6)bad.push(k+':ratio');const footY=y+h*G.walkAnchor[1]/176,footX=x+w*G.walkAnchor[0]/128;ref??=[footX,footY,w,h];
   if(Math.abs(footX-ref[0])>.01||Math.abs(footY-ref[1])>.01||Math.abs(w/ref[2]-G.scale[k])>1e-6||Math.abs(h/ref[3]-G.scale[k])>1e-6)bad.push(k+':foot');}
  return (window.gwBad=bad).length===0;})()`);
 await check('앉은 손님: girl·boykid 높이는 무릎 어른(1.4)의 0.85/1.4배(아이는 무릎도 0.85), 좌석 앵커는 그대로',`(()=>{const g=__game,bad=[];let ref=null;
  for(const k of ['mom',...g.S.NPC_NORMAL.filter(k=>k!=='commuter'&&k!=='mom')]){const c=gwSpawn(k);c.phase='seated';const rows=gwDrawRects();if(rows.length!==1){bad.push(k+':missing');continue;}
   const [x,y,w,h]=rows[0][1],scale=['girl','boykid'].includes(k)?0.85/g.CFG.characters.guest.seizaScale:1,A=g.CFG.characters.guest.seizaAnchor,ax=x+w*A[0]/128,ay=y+h*A[1]/176;ref??=[ax,ay,h];
   if(Math.abs(ax-ref[0])>.01||Math.abs(ay-ref[1])>.01||Math.abs(h/ref[2]-scale)>1e-6)bad.push(k);}
  return (window.gwBad=bad).length===0;})()`);
 await check('정좌: commuter 투명 원본과 좌석 방향 반전, 아이 배율 및 엉덩이 앵커',`(async()=>{const g=__game,G=(await import('./config.js')).CFG.characters.guest,c=gwSpawn('commuter'),seat=g.state.placement.slots.find(s=>s.id===c.seatFurniture),old=seat.dir,bad=[];c.phase='seated';
 try{for(const dir of [0,1,2,3]){seat.dir=dir;c.facing=(dir+1)%4;const rows=gwDrawRects(),idx=gwDraw.findIndex(s=>s.includes('guest-seiza-commuter'));if(rows.length!==1||idx<0||Math.sign(gwMatrix[idx])!==((dir%2)?-1:1))bad.push('mirror'+dir);
 const [x,y,w,h]=rows[0][1],a=G.seizaAnchor,anchor=[x+w*a[0]/128,y+h*a[1]/176];if(Math.abs(w/h-128/176)>1e-6)bad.push('canvas');
 for(const kind of ['girl','boykid']){const prev=G.seiza[kind];try{G.seiza[kind]=G.seiza.commuter;c.kind=kind;const r=gwDrawRects()[0][1];if(Math.abs(r[2]/w-.85/G.seizaScale)>1e-6||Math.abs(r[0]+r[2]*a[0]/128-anchor[0])>.01||Math.abs(r[1]+r[3]*a[1]/176-anchor[1])>.01)bad.push(kind);}finally{G.seiza[kind]=prev;c.kind='commuter';}}
 }}finally{seat.dir=old;}return (window.gwBad=bad).length===0;})()`);
 await check('걸어 들어와 앉기: 손님 걷기 그림은 config 경로로만 불러오고 probe 경로(chars/guest-*) 요청(404)이 없다',`(()=>!performance.getEntriesByType('resource').some(e=>e.name.includes('/chars/guest-')))()`);
 await ev(`(()=>{__game.world.custs.length=0;__game.refresh();return true;})()`);
}
