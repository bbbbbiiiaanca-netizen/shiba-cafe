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
  $('talk').hidden=!(queue.length||t);
  if(queue.length){const q=queue[0];setSay(q.say,'받기',q.ad?'<button id="sayAd" class="ad">광고 보고 2배 (스텁)</button>':'');}
  else if(t)setSay(S.tutCanSkip(t)?t.say+' (뽑기 확률이 아직 정해지지 않아 지금은 건너뛰어요.)':t.say,(t.next||S.tutCanSkip(t))?'다음 ▶':'');
  $('qdot').hidden=!S.questStatus(s).some(q=>q.done&&!q.claimed);
  if(openName&&openName!=='gacha'&&panels[openName].live)panels[openName].render();}
 // ---- panels ----
 let openName=null;
 const panels={
  shiba:{title:'시바들',render(){const coats=Object.keys(CFG.coats),N=Object.keys(CFG.exprs).length;let h=`<button class="big" id="toPull">🎰 새 시바 뽑기</button><p class="sub">도감 ${s.dex.length} / ${N} · 카페에 최대 ${CFG.cafe.maxShibas}마리</p><div class="grid">`;
   for(const c of coats)for(const e of CFG.coatExprs(c)){const own=s.owned.filter(o=>o.coat===c&&o.expr===e).sort((a,b)=>b.lv-a.lv),o=own[0]||(s.dex.includes(c+'_'+e)?{lv:0}:null);h+=o?`<div class="card"><img src="${ctx.thumb(c,e)}"><b>${CFG.coats[c]}·${CFG.exprs[e]}</b><i>${o.lv?`${S.gradeOf(o.lv)} · Lv.${o.lv}${own.length>1?' ×'+own.length:''}`:'카페에 없음'}</i></div>`:`<div class="card off"><img src="${ctx.thumb(c,e)}"><b>${CFG.coats[c]}·???</b></div>`;}
   body().innerHTML=h+'</div>';$('toPull').onclick=()=>open('gacha');}},
  upgrade:{title:'업그레이드',live:true,render(){const c=S.upgradeCost(s),lv=s.upg||0;const h=`<div class="row"><img src="assets/counter.png"><b>카운터 개선 Lv.${lv}<br><i>방치 수입 +${Math.round(CFG.upgrade.bonus*100)}%씩 · 지금 초당 ${S.incomePerSec(s).toFixed(2)}🪙</i></b><button id="upg" ${s.coins<c?'disabled':''}>🪙 ${c.toLocaleString('ko-KR')}</button></div><p class="sub">땅 확장(상하좌우)과 2층은 다음 단계예요. 카페 양옆의 점선 칸이 확장 자리예요.</p>`;if(this._k===h)return;this._k=h;body().innerHTML=h;$('upg').onclick=()=>{if(S.buyUpgrade(s)){ctx.save();this._k='';tick();}};}},
  event:{title:'이벤트',render(){body().innerHTML=`<p class="sub">계절 이벤트는 준비 중이에요 (카탈로그 14쪽 계절 소품 세트).</p><div class="row"><img src="assets/sakura.png"><b>벚꽃 축제<br><i>준비 중</i></b></div><div class="row"><img src="assets/lantern.png"><b>여름 축제 초롱<br><i>준비 중</i></b></div>`;}},
  shop:{title:'꾸미기 · 상점',render(){let h='<h4>인테리어 테마 (스텁: 벽·다다미·조명 색만 바뀜)</h4>';for(const t of CFG.themes){const own=s.themesOwned.includes(t.id);h+=`<div class="row"><span class="sw" style="background:${t.wall}"></span><span class="sw" style="background:${t.tatami}"></span><b>${t.name}</b><button data-th="${t.id}" ${!own&&s.coins<t.price?'disabled':''}>${s.theme===t.id?'사용 중':own?'사용':`🪙 ${t.price.toLocaleString('ko-KR')}`}</button></div>`;}
   h+='<h4>발바닥 상점 (결제 스텁)</h4>';for(const p of SDK.iap.products)h+=`<div class="row"><b>${p.name}</b><button data-iap="${p.id}">${p.price}</button></div>`;h+='<p class="sub" id="shopMsg"></p>';body().innerHTML=h;
   body().querySelectorAll('[data-th]').forEach(b=>b.onclick=()=>{const t=CFG.themes.find(t=>t.id===b.dataset.th);if(!s.themesOwned.includes(t.id)){if(s.coins<t.price)return;s.coins-=t.price;s.themesOwned.push(t.id);}s.theme=t.id;ctx.applyTheme();ctx.save();tick();this.render();});
   body().querySelectorAll('[data-iap]').forEach(b=>b.onclick=async()=>{const r=await SDK.iap.buy(b.dataset.iap);$('shopMsg').textContent=r.msg;});}},
  quest:{title:'동구의 퀘스트',live:true,render(){const qs=S.questStatus(s);let h=S.tutStep(s)?'<p class="sub">튜토리얼을 끝내면 열려요. 지금은 대사창의 동구 안내를 따라 주세요.</p>':'';
   for(const q of qs){const r=Object.entries(q.reward).map(([k,v])=>({coins:'🪙',paws:'🐾',hearts:'❤'}[k])+' '+v).join(' ');h+=`<div class="row"><b>${q.text}</b><i>${r}</i><button data-q="${q.id}" ${q.done&&!q.claimed&&!S.tutStep(s)?'':'disabled'}>${q.claimed?'완료':q.done?'받기':'진행 중'}</button></div>`;}
   const key=h;if(this._k===key)return;this._k=key;body().innerHTML=h;body().querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{S.claimQuest(s,b.dataset.q);ctx.save();this._k='';tick();});}},
  settings:{title:'설정',render(){body().innerHTML=`<div class="row"><b>효과음</b><button data-k="sound">${s.settings.sound?'켜짐':'꺼짐'}</button></div><div class="row"><b>배경음</b><button data-k="music">${s.settings.music?'켜짐':'꺼짐'}</button></div>
   <div class="row"><b>Play Games 클라우드 저장</b><button id="cloud">저장</button></div><div class="row"><b>처음부터 다시</b><button id="reset">초기화</button></div><p class="sub" id="setMsg">이 기기에 자동 저장 중 (10초마다)</p>`;
   body().querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{s.settings[b.dataset.k]=!s.settings[b.dataset.k];ctx.save();this.render();});
   $('cloud').onclick=async()=>{const r=await SDK.playGames.cloudSave(s);$('setMsg').textContent=r.msg;};
   $('reset').onclick=()=>{if(confirm('저장을 지우고 처음부터 시작할까요?')){localStorage.removeItem(CFG.saveKey);location.search='?fresh=1';}};}},
 };
 const body=()=>$('pbody');
 function open(n){if(n==='gacha'){close();showPull();return;}if(openName===n){close();return;}openName=n;const p=panels[n];$('ptitle').textContent=p.title;p._k='';p.render();$('panel').classList.add('on');document.body.classList.add('popen');document.querySelectorAll('.bar button').forEach(b=>b.classList.toggle('on',b.dataset.p===n));}
 function close(){openName=null;$('panel').classList.remove('on');document.body.classList.remove('popen');document.querySelectorAll('.bar button').forEach(b=>b.classList.remove('on'));}
 document.querySelectorAll('.bar button').forEach(b=>b.onclick=()=>open(b.dataset.p));$('pclose').onclick=close;
 // ---- gacha flow: user's fixed video; at the burst the drawn shiba appears as a live 3D figure ----
 const vid=$('gvid'),gl=$('gacha');let cur=null,revealT0=0,batch=[];
 function showPull(){SDK.sfx('click');const free=CFG.gacha.firstFree&&s.gachaPulls===0;$('gpPaw').textContent=fmt(s.paws);
  $('pull1').textContent=free?'1회 뽑기 · 무료':`1회 뽑기 · 🐾${CFG.gacha.cost.paws}`;$('pull10').textContent=`10회 뽑기 · 🐾${CFG.gacha.cost10.paws}`;
  $('pull1').disabled=!S.canPull(s);$('pull10').disabled=!S.gachaReady()||s.paws<CFG.gacha.cost10.paws;
  $('gpNote').hidden=S.gachaReady();$('gpull').classList.add('on');}
 $('pull1').onclick=()=>startGacha(1);$('pull10').onclick=()=>startGacha(10);$('gpClose').onclick=()=>$('gpull').classList.remove('on');
 $('gpShop').onclick=()=>{$('gpull').classList.remove('on');open('shop');};$('gpSet').onclick=()=>{$('gpull').classList.remove('on');open('settings');};
 // result card: colour by grade (N 무색 · R 파랑 · S 금색), on-screen grade text is the initial only
 const RANK={N:0,R:1,S:2};const gradeOfCard=o=>S.gradeOf(o.lv);
 const cardHtml=o=>`<div class="rc ${gradeOfCard(o)}"><img src="${ctx.thumb(o.coat,o.expr)}"><b>${CFG.coats[o.coat]} · ${CFG.exprs[o.expr]}</b><i>${gradeOfCard(o)} · Lv.${o.lv}${o.isNew?' · NEW':''}</i></div>`;
 function startGacha(n=1){batch=[];if(!S.gachaReady())return;if(n===10){if(s.paws<CFG.gacha.cost10.paws)return;s.paws-=CFG.gacha.cost10.paws-CFG.gacha.cost.paws*10;for(let i=0;i<10;i++){const r=S.pull(s,Math.random);if(r)batch.push(r);}}else{const r=S.pull(s,Math.random);if(r)batch.push(r);}if(!batch.length)return;
  cur=batch.reduce((a,b)=>RANK[gradeOfCard(b)]>RANK[gradeOfCard(a)]?b:a);SDK.sfx('click');SDK.sfx('knob');SDK.sfx('reveal');$('gpull').classList.remove('on');ctx.save();close();showGacha();vid.currentTime=0;vid.muted=!s.settings.sound;vid.play().catch(()=>{vid.muted=true;vid.play();});}
 function showGacha(){gl.classList.add('on');$('gcard').hidden=true;$('revealImg').classList.remove('on');revealT0=0;}
 function reveal(){if(revealT0)return;revealT0=performance.now();const ri=$('revealImg');ri.src=ctx.thumb(cur.coat,cur.expr);ri.classList.remove('on');void ri.offsetWidth;ri.classList.add('on');const c=$('gcard');c.hidden=false;
  SDK.sfx('fanfare');if(!batch.length)batch=[cur];
  c.innerHTML=(batch.length>1?`<div class="rgrid">${batch.map(cardHtml).join('')}</div>`:cardHtml(cur))+`<button id="gok">카페로 보내기</button>`;
  $('gok').onclick=()=>{for(const b of batch)ctx.addToCafe(b);gl.classList.remove('on');vid.pause();cur=null;tick();};}
 vid.addEventListener('timeupdate',()=>{if(cur&&vid.currentTime>=CFG.gacha.revealAt)reveal();});vid.addEventListener('ended',()=>{if(cur)reveal();});
 $('gskip').onclick=()=>{if(cur){vid.currentTime=Math.max(vid.currentTime,CFG.gacha.revealAt);reveal();}};
 function frame(){}
 // capture helper: show the reveal moment for a given figure at video time t
 async function gachaShow(coat,expr,t,grade){cur={coat,expr,lv:S.startLevel(grade||'R'),isNew:true};batch=[cur];close();showGacha();vid.muted=true;await new Promise(r=>{vid.addEventListener('seeked',r,{once:true});vid.currentTime=t;});vid.pause();if(t>=CFG.gacha.revealAt){reveal();const ri=$('revealImg');ri.style.animation='none';ri.style.opacity=1;ri.style.transform='translate(-50%,-50%) scale(1)';await new Promise(r=>ri.complete?r():ri.onload=r);}return true;}
 tick();return {tick,open,close,frame,gachaShow};}
