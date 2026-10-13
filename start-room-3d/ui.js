// HUD, 동구 dialogue, slide-up panels, gacha flow.
export function UI(ctx){const {state:s,CFG,S,SDK}=ctx;const $=id=>document.getElementById(id);
 const fmt=n=>Math.floor(n).toLocaleString('ko-KR');
 const queue=[];if(ctx.loaded.offline.coins>0)queue.push({say:`자리 비운 동안 ${fmt(ctx.loaded.offline.coins)}코인을 벌었어요! (${Math.round(ctx.loaded.offline.sec/60)}분)`,ad:ctx.loaded.offline.coins});
 let lastSay='';
 function setSay(text,btn,extra=''){const key=text+btn+extra;if(key===lastSay)return;lastSay=key;$('say').textContent=text;$('sayBtns').innerHTML=(btn?`<button id="sayNext">${btn}</button>`:'')+extra;
  const nb=$('sayNext');if(nb)nb.onclick=()=>{if(queue.length)queue.shift();else S.tutAdvance(s,true);lastSay='';tick();};
  const ab=$('sayAd');if(ab)ab.onclick=async()=>{const r=await SDK.ads.rewarded('offline2x');if(r.ok){S.grant(s,{coins:queue[0].ad});queue.shift();lastSay='';tick();}};}
 function tick(){$('coins').textContent=fmt(s.coins);$('hearts').textContent=fmt(s.hearts);$('paws').textContent=fmt(s.paws);
  S.tutAdvance(s);const t=S.tutStep(s);document.querySelectorAll('.bar button').forEach(b=>b.classList.toggle('hl',!queue.length&&!!t&&t.highlight===b.dataset.p));
  const qs=S.questStatus(s);const ready=qs.find(q=>q.done&&!q.claimed),todo=qs.find(q=>!q.claimed);
  $('qpill').textContent=t?'동구의 안내를 따라 카페를 열어요!':ready?`퀘스트 완료: ${ready.text}`:todo?todo.text:'카페를 발전시켜요!';
  if(s.rescueQueue&&s.rescueQueue.length){const got=s.rescueQueue.splice(0).map(id=>s.owned.find(o=>o.id===id)).filter(Boolean);for(const o of got)ctx.addToCafe(o);ctx.save();
   queue.push({say:`산책 중에 길 잃은 시바를 구조했어요! ${got.map(o=>`${CFG.coats[o.coat]} ${S.gradeOf(o.lv)} Lv.${o.lv}`).join(', ')}`});} // D-10: batched when several happened while closed
  $('talk').hidden=!(queue.length||t);
  if(queue.length){const q=queue[0];setSay(q.say,'받기',q.ad?'<button id="sayAd" class="ad">광고 보고 2배 (스텁)</button>':'');}
  else if(t)setSay(S.tutCanSkip(t)?t.say+' (뽑기 확률이 아직 정해지지 않아 지금은 건너뛰어요.)':t.say,(t.next||S.tutCanSkip(t))?'다음 ▶':'');
  $('qdot').hidden=!S.questStatus(s).some(q=>q.done&&!q.claimed);
  if(openName&&openName!=='gacha'&&panels[openName].live)panels[openName].render();}
 // ---- panels ----
 let openName=null;
 const panels={
  shiba:{title:'시바들',live:true,render(){const coats=Object.keys(CFG.coats),N=Object.keys(CFG.exprs).length;let h=`<button class="big" id="toPull">🎰 새 시바 뽑기</button><p class="sub">도감 ${s.dex.length} / ${N} · 카페에 최대 ${CFG.cafe.maxShibas}마리</p><div class="grid">`;
   for(const c of coats)for(const e of CFG.coatExprs(c)){const own=s.owned.filter(o=>o.coat===c&&o.expr===e).sort((a,b)=>b.lv-a.lv),o=own[0]||(s.dex.includes(c+'_'+e)?{lv:0}:null);h+=o?`<div class="card"><img src="${ctx.thumb(c,e)}"><b>${CFG.coats[c]}·${CFG.exprs[e]}</b><i>${o.lv?`${S.gradeOf(o.lv)} · Lv.${o.lv}${own.length>1?' ×'+own.length:''}`:'카페에 없음'}</i></div>`:`<div class="card off"><img src="${ctx.thumb(c,e)}"><b>${CFG.coats[c]}·???</b></div>`;}
   h+='</div>'+cafeList();if(this._k===h)return;this._k=h;body().innerHTML=h;$('toPull').onclick=()=>open('gacha');bindCafeList();}},
  upgrade:{title:'업그레이드',live:true,render(){const c=S.upgradeCost(s),lv=s.upg||0;const h=`<div class="row"><img src="assets/counter.png"><b>카운터 개선 Lv.${lv}<br><i>방치 수입 +${Math.round(CFG.upgrade.bonus*100)}%씩 · 지금 초당 ${S.incomePerSec(s).toFixed(2)}🪙</i></b><button id="upg" ${s.coins<c?'disabled':''}>🪙 ${c.toLocaleString('ko-KR')}</button></div><p class="sub">땅 확장(상하좌우)과 2층은 다음 단계예요. 카페 양옆의 점선 칸이 확장 자리예요.</p>`;if(this._k===h)return;this._k=h;body().innerHTML=h;$('upg').onclick=()=>{if(S.buyUpgrade(s)){ctx.save();this._k='';tick();}};}},
  event:{title:'이벤트',live:true,render(){const cur=S.onboardingDay(s);
   let h=`<h4>새 사장님 응원 28일</h4><p class="sub">${cur==null?'날짜 진행 방식이 아직 정해지지 않았어요 (준비 중) · 보상 목록만 미리 보여요':`${cur}일째`}</p><div class="ob">`;
   for(let d=1;d<=CFG.onboarding.days;d++){const st=S.onboardingStatus(s,d),{ready,pending}=S.onboardingReward(d);
    const items=Object.entries(ready).map(([k,v])=>`${CFG.items[k]?.icon||{hearts:'💗',coins:'🪙',paws:'🐾'}[k]}${v}`).concat(pending.map(k=>`${{hearts:'💗'}[k]||k} 준비 중`));
    h+=`<button class="obd ${st}" data-ob="${d}" ${st==='claimable'?'':'disabled'}><b>${d}일째</b><span>${items.length?items.join(' '):'준비 중'}</span><i>${{claimed:'✔',claimable:'받기',locked:'',pending:''}[st]}</i></button>`;}
   h+='</div>';if(this._k===h)return;this._k=h;
   body().innerHTML=h+`<p class="sub">계절 이벤트는 준비 중이에요 (카탈로그 14쪽 계절 소품 세트).</p><div class="row"><img src="assets/sakura.png"><b>벚꽃 축제<br><i>준비 중</i></b></div><div class="row"><img src="assets/lantern.png"><b>여름 축제 초롱<br><i>준비 중</i></b></div>`;
   body().querySelectorAll('[data-ob]').forEach(b=>b.onclick=()=>{if(S.claimOnboarding(s,+b.dataset.ob)){SDK.sfx('fanfare');ctx.save();}this._k='';tick();});}},
  shop:{title:'꾸미기 · 상점',render(){let h='<h4>인테리어 테마 (스텁: 벽·다다미·조명 색만 바뀜)</h4>';for(const t of CFG.themes){const own=s.themesOwned.includes(t.id);h+=`<div class="row"><span class="sw" style="background:${t.wall}"></span><span class="sw" style="background:${t.tatami}"></span><b>${t.name}</b><button data-th="${t.id}" ${!own&&s.coins<t.price?'disabled':''}>${s.theme===t.id?'사용 중':own?'사용':`🪙 ${t.price.toLocaleString('ko-KR')}`}</button></div>`;}
   h+='<h4>발바닥 상점 (결제 스텁)</h4>';for(const p of SDK.iap.products)h+=`<div class="row"><b>${p.name}</b><button data-iap="${p.id}">${p.price}</button></div>`;h+='<p class="sub" id="shopMsg"></p>';body().innerHTML=h;
   body().querySelectorAll('[data-th]').forEach(b=>b.onclick=()=>{const t=CFG.themes.find(t=>t.id===b.dataset.th);if(!s.themesOwned.includes(t.id)){if(s.coins<t.price)return;s.coins-=t.price;s.themesOwned.push(t.id);}s.theme=t.id;ctx.applyTheme();ctx.save();tick();this.render();});
   body().querySelectorAll('[data-iap]').forEach(b=>b.onclick=async()=>{const r=await SDK.iap.buy(b.dataset.iap);$('shopMsg').textContent=r.msg;});}},
  quest:{title:'동구의 퀘스트',live:true,render(){const qs=S.questStatus(s);let h=S.tutStep(s)?'<p class="sub">튜토리얼을 끝내면 열려요. 지금은 대사창의 동구 안내를 따라 주세요.</p>':'';
   for(const q of qs){const r=Object.entries(q.reward).map(([k,v])=>({coins:'🪙',paws:'🐾',hearts:'❤'}[k])+' '+v).join(' ');h+=`<div class="row"><b>${q.text}</b><i>${r}</i><button data-q="${q.id}" ${q.done&&!q.claimed&&!S.tutStep(s)?'':'disabled'}>${q.claimed?'완료':q.done?'받기':'진행 중'}</button></div>`;}
   const key=h;if(this._k===key)return;this._k=key;body().innerHTML=h;body().querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{S.claimQuest(s,b.dataset.q);ctx.save();this._k='';tick();});}},
  // D-06 가방: 하트 리셋권 (하트 10개 이상이면 버튼 꺼짐, 눌러도 변화 없음)
  bag:{title:'가방',live:true,render(){const H=CFG.hearts,n=s.items.heartReset||0,can=S.canUseHeartReset(s),nx=S.nextHeartInSec(s);
   const h=`<div class="row"><span class="icon">${CFG.items.heartReset.icon}</span><b>${CFG.items.heartReset.name} ×${n}<br><i>하트가 ${H.regenCap}개 미만일 때 ${H.regenCap}개까지 채워요</i></b><button id="useReset" ${can?'':'disabled'}>사용</button></div>
   <p class="sub">💗 ${fmt(s.hearts)} · ${nx==null?`${H.regenCap}개 이상이라 자연 회복 멈춤`:`다음 하트까지 ${Math.floor(nx/60)}:${String(nx%60).padStart(2,'0')} (30분마다 1개, ${H.regenCap}개까지)`}</p>`;
   if(this._k===h)return;this._k=h;body().innerHTML=h;$('useReset').onclick=()=>{if(S.useHeartReset(s,Date.now())){SDK.sfx('click');ctx.save();}this._k='';tick();};}},
  settings:{title:'설정',render(){body().innerHTML=`<div class="row"><b>효과음</b><button data-k="sound">${s.settings.sound?'켜짐':'꺼짐'}</button></div><div class="row"><b>배경음</b><button data-k="music">${s.settings.music?'켜짐':'꺼짐'}</button></div>
   <div class="row"><b>Play Games 클라우드 저장</b><button id="cloud">저장</button></div><div class="row"><b>처음부터 다시</b><button id="reset">초기화</button></div><p class="sub" id="setMsg">이 기기에 자동 저장 중 (10초마다)</p>`;
   body().querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{s.settings[b.dataset.k]=!s.settings[b.dataset.k];ctx.save();this.render();});
   $('cloud').onclick=async()=>{const r=await SDK.playGames.cloudSave(s);$('setMsg').textContent=r.msg;};
   $('reset').onclick=()=>{if(confirm('저장을 지우고 처음부터 시작할까요?')){localStorage.removeItem(CFG.saveKey);location.search='?fresh=1';}};}},
 };
 const body=()=>$('pbody');
 // ---- D-03 카페 시바 목록 + 병합 (재료 → 대상). 같은 등급·같은 시바(merge.sameKey)일 때만 버튼이 켜짐 ----
 let sel=[];const MERGE_WHY={undecided:'병합 기준이 아직 정해지지 않았어요 (준비 중)',mode:'자동 병합 방식은 아직 정해지지 않았어요',pick:'합칠 시바 둘을 골라요 (먼저 고른 쪽이 레벨이 올라요)',busy:'산책 중인 시바는 합칠 수 없어요',notSame:'같은 시바끼리만 합칠 수 있어요',grade:'같은 등급끼리만 합칠 수 있어요'};
 const nameOf=o=>`${CFG.coats[o.coat]}·${CFG.exprs[o.expr]}`;
 function cafeList(){sel=sel.filter(id=>s.owned.some(o=>o.id===id));const why=S.mergeCheck(s,sel[0],sel[1]);
  let h=`<h4>카페 시바 ${s.owned.length}마리</h4>`;
  for(const o of [...s.owned].sort((a,b)=>a.coat.localeCompare(b.coat)||a.expr.localeCompare(b.expr)||b.lv-a.lv)){const k=sel.indexOf(o.id);
   h+=`<div class="row${k>=0?' sel':''}" data-sel="${o.id}"><img src="${ctx.thumb(o.coat,o.expr)}"><b>${nameOf(o)}<br><i>${S.gradeOf(o.lv)} · Lv.${o.lv}</i></b>${extraRow(o)}<i class="selk">${k===0?'대상':k===1?'재료':''}</i></div>`;}
  const a=s.owned.find(o=>o.id===sel[0]),b=s.owned.find(o=>o.id===sel[1]);
  h+=`<p class="sub" id="mergeWhy">${why?MERGE_WHY[why]:`${nameOf(a)} Lv.${a.lv} + Lv.${b.lv} → Lv.${Math.min(CFG.grades.maxLevel,a.lv+b.lv)}`}</p><button class="big" id="mergeBtn" ${why?'disabled':''}>병합</button>`;return h;}
 // ---- D-08 산책 (비용 미정이면 '미정' 표시, 테스트 빌드에서만 무료) · D-09 피로 상태 표시(기능 꺼짐이면 안 보임) ----
 let walkPick=null;const mmss=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
 const WALK_WHY={walking:'다른 시바가 산책 중',fatigue:'너무 지쳐서 쉬어야 해요',costUndecided:'하트 소모량 미정',hearts:'하트가 모자라요'};
 function extraRow(o){const fs=S.fatigueState(s,o.id),fz=fs==='sleep'?'<i>💤</i>':fs==='tired'?'<i>조금 지쳤어요</i>':'';
  if(S.isBusy(s,o.id)){const W=s.walk,left=W.walkDurationSec-(Date.now()-W.walkStartAt)/1000;const stop=S.walkStopRule();
   return `<i>🦮 산책 중 ${mmss(Math.max(0,left))}</i><button data-walkstop="${o.id}" ${stop?'':'disabled'}>${stop?'멈추기':'멈추기(규칙 미정)'}</button>`;}
  if(walkPick!==o.id)return fz+`<button data-walk="${o.id}" ${S.walkCheck(s,o.id,CFG.walk.durationsSec[0])==='walking'||fs==='sleep'?'disabled':''}>🦮 산책</button>`;
  return fz+CFG.walk.durationsSec.map(sec=>{const c=S.walkCost(sec),why=S.walkCheck(s,o.id,sec);return `<button data-walkgo="${o.id}:${sec}" ${why?'disabled':''} title="${why?WALK_WHY[why]||why:''}">${sec/60}분 · 💗${c==null?'미정':c}</button>`;}).join('');}
 function bindCafeList(){body().querySelectorAll('[data-sel]').forEach(r=>r.onclick=e=>{if(e.target.closest('button'))return;const id=+r.dataset.sel;const k=sel.indexOf(id);if(k>=0)sel.splice(k,1);else{if(sel.length>=2)sel=[sel[0]];sel.push(id);}panels.shiba._k='';panels.shiba.render();});
  $('mergeBtn').onclick=()=>{const r=S.merge(s,sel[0],sel[1]);if(!r)return;ctx.removeFromCafe(r.material.id);sel=[];ctx.save();SDK.sfx('fanfare');panels.shiba._k='';panels.shiba.render();tick();};
  // D-08 산책 버튼
  body().querySelectorAll('[data-walk]').forEach(b=>b.onclick=()=>{walkPick=walkPick===+b.dataset.walk?null:+b.dataset.walk;panels.shiba._k='';panels.shiba.render();});
  body().querySelectorAll('[data-walkgo]').forEach(b=>b.onclick=()=>{const [id,sec]=b.dataset.walkgo.split(':').map(Number);if(S.startWalk(s,id,sec,Date.now())){ctx.removeFromCafe(id);walkPick=null;ctx.save();}panels.shiba._k='';panels.shiba.render();tick();});
  body().querySelectorAll('[data-walkstop]').forEach(b=>b.onclick=()=>{const id=S.stopWalk(s,Date.now());if(id!=null){ctx.addToCafe(s.owned.find(o=>o.id===id));ctx.save();}panels.shiba._k='';panels.shiba.render();tick();});}
 function open(n){if(n==='gacha'){close();showPull();return;}if(openName===n){close();return;}openName=n;const p=panels[n];$('ptitle').textContent=p.title;p._k='';p.render();$('panel').classList.add('on');document.body.classList.add('popen');document.querySelectorAll('.bar button').forEach(b=>b.classList.toggle('on',b.dataset.p===n));}
 function close(){openName=null;$('panel').classList.remove('on');document.body.classList.remove('popen');document.querySelectorAll('.bar button').forEach(b=>b.classList.remove('on'));}
 document.querySelectorAll('.bar button').forEach(b=>b.onclick=()=>open(b.dataset.p));for(const id of ['bagBtn','heartPlus'])if($(id))$(id).onclick=()=>open('bag');$('pclose').onclick=close;
 // ---- gacha flow: user's fixed video; at the burst the drawn shiba appears as a live 3D figure ----
 const vid=$('gvid'),gl=$('gacha');let cur=null,revealT0=0,batch=[];
 function showPull(){SDK.sfx('click');const free=CFG.gacha.firstFree&&s.gachaPulls===0;$('gpPaw').textContent=fmt(s.paws);
  $('pull1').textContent=free?'1회 뽑기 · 무료':`1회 뽑기 · 🐾${CFG.gacha.cost.paws}`;$('pull10').textContent=`10회 뽑기 · 🐾${CFG.gacha.cost10.paws}`;
  $('pull1').disabled=!S.canPull(s);$('pull10').disabled=!S.gachaReady()||s.paws<CFG.gacha.cost10.paws;
  if($('gpNote'))$('gpNote').hidden=S.gachaReady();if($('pullCap')){const n=s.items.capsule||0;$('pullCap').hidden=!n;$('pullCap').textContent=`${CFG.items.capsule.icon} 캡슐 사용 (${n})`;$('pullCap').disabled=!S.canPull(s,{capsule:true});}$('gpull').classList.add('on');}
 $('pull1').onclick=()=>startGacha(1);if($('pullCap'))$('pullCap').onclick=()=>startGacha('cap');$('pull10').onclick=()=>startGacha(10);$('gpClose').onclick=()=>$('gpull').classList.remove('on');
 $('gpShop').onclick=()=>{$('gpull').classList.remove('on');open('shop');};$('gpSet').onclick=()=>{$('gpull').classList.remove('on');open('settings');};
 // result card: colour by grade (N 무색 · R 파랑 · S 금색), on-screen grade text is the initial only
 const RANK={N:0,R:1,S:2};const gradeOfCard=o=>S.gradeOf(o.lv);
 const cardHtml=o=>`<div class="rc ${gradeOfCard(o)}"><img src="${ctx.thumb(o.coat,o.expr)}"><b>${CFG.coats[o.coat]} · ${CFG.exprs[o.expr]}</b><i>${gradeOfCard(o)} · Lv.${o.lv}${o.isNew?' · NEW':''}</i></div>`;
 function startGacha(n=1){batch=[];if(!S.gachaReady())return;if(n==='cap'){const r=S.pull(s,Math.random,{capsule:true});if(r)batch.push(r);}else if(n===10){if(s.paws<CFG.gacha.cost10.paws)return;s.paws-=CFG.gacha.cost10.paws-CFG.gacha.cost.paws*10;for(let i=0;i<10;i++){const r=S.pull(s,Math.random);if(r)batch.push(r);}}else{const r=S.pull(s,Math.random);if(r)batch.push(r);}if(!batch.length)return;
  cur=batch.reduce((a,b)=>RANK[gradeOfCard(b)]>RANK[gradeOfCard(a)]?b:a);SDK.sfx('click');SDK.sfx('knob');SDK.sfx('reveal');$('gpull').classList.remove('on');ctx.save();close();showGacha();vid.currentTime=0;vid.muted=!s.settings.sound;vid.play().catch(()=>{vid.muted=true;vid.play();});}
 function showGacha(){gl.classList.add('on');$('gcard').hidden=true;$('revealImg').classList.remove('on');revealT0=0;}
 function reveal(){if(revealT0)return;revealT0=performance.now();const ri=$('revealImg');ri.src=ctx.thumb(cur.coat,cur.expr);ri.classList.remove('on');void ri.offsetWidth;ri.classList.add('on');const c=$('gcard');c.hidden=false;
  SDK.sfx('fanfare');if(!batch.length)batch=[cur];
  c.innerHTML=(batch.length>1?`<div class="rgrid">${batch.map(cardHtml).join('')}</div>`:cardHtml(cur))+`<button id="gok">카페로 보내기</button>`;
  $('gok').onclick=()=>{for(const b of batch)ctx.addToCafe(b);gl.classList.remove('on');vid.pause();cur=null;tick();};}
 vid.addEventListener('timeupdate',()=>{if(cur&&vid.currentTime>=CFG.gacha.revealAt)reveal();});vid.addEventListener('ended',()=>{if(cur)reveal();});
 $('gskip').onclick=()=>{if(cur){vid.currentTime=Math.max(vid.currentTime,CFG.gacha.revealAt);reveal();}};
 // ---- D-04 승급 대체 카드 연출 (FEATURES.promotionCard, 영상 promotion.videoAsset 미정) ----
 let promo=null;const BORDER={N:'#e4e4e4',R:'#6f9fd6',S:'#d4a437'};
 function frame(){const busy=gl.classList.contains('on')||$('gpull').classList.contains('on');
  if(!promo&&!busy&&s.promoQueue&&s.promoQueue.length){const p=S.takePromotion(s);ctx.save();
   if(CFG.FEATURES.promotionCard&&$('promo')){promo={...p,t0:performance.now()};const el=$('promo');el.hidden=false;$('promoImg').src=ctx.thumb(p.coat,p.expr);}}
  if(!promo)return;const t=(performance.now()-promo.t0)/1000,ph=S.promoPhase(t),card=$('promoCard'),C=CFG.promotion.card;
  card.style.transform=`scale(${ph.phase==='zoom'?1+.15*Math.sin(ph.k*Math.PI/2):1.15})`;
  card.style.borderColor=ph.phase==='zoom'?BORDER[promo.from]:ph.phase==='border'?mix(BORDER[promo.from],BORDER[promo.to],ph.k):BORDER[promo.to];
  $('promoBadge').textContent=ph.phase==='zoom'||ph.phase==='border'?promo.from:promo.to;$('promoBadge').classList.toggle('spark',ph.phase==='badge');
  card.classList.toggle('joy',ph.phase==='expr');if(ph.phase==='done')endPromo();}
 function endPromo(){promo=null;if($('promo'))$('promo').hidden=true;}
 if($('promo'))$('promo').onclick=()=>{if(promo&&CFG.promotion.skippable)endPromo();};
 const mix=(a,b,k)=>{const p=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));const A=p(a),B=p(b);return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*k).toString(16).padStart(2,'0')).join('');};
 // capture helper: show the reveal moment for a given figure at video time t
 async function gachaShow(coat,expr,t,grade){cur={coat,expr,lv:S.startLevel(grade||'R'),isNew:true};batch=[cur];close();showGacha();vid.muted=true;await new Promise(r=>{vid.addEventListener('seeked',r,{once:true});vid.currentTime=t;});vid.pause();if(t>=CFG.gacha.revealAt){reveal();const ri=$('revealImg');ri.style.animation='none';ri.style.opacity=1;ri.style.transform='translate(-50%,-50%) scale(1)';await new Promise(r=>ri.complete?r():ri.onload=r);}return true;}
 tick();return {tick,open,close,frame,gachaShow,isPromo:()=>!!promo};}
