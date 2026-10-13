// HUD, 동구 dialogue, slide-up panels, gacha flow.
export function UI(ctx){const {state:s,CFG,S,SDK}=ctx;const $=id=>document.getElementById(id);
 const fmt=n=>Math.floor(n).toLocaleString('ko-KR');
 const queue=[];if(ctx.loaded.offline.coins>0)queue.push({say:`자리 비운 동안 ${fmt(ctx.loaded.offline.coins)}코인을 벌었어요! (${Math.round(ctx.loaded.offline.sec/60)}분)`,ad:ctx.loaded.offline.coins});
 let lastSay='';
 function setSay(text,btn,extra=''){const key=text+btn+extra;if(key===lastSay)return;lastSay=key;$('say').textContent=text;$('sayBtns').innerHTML=(btn?`<button id="sayNext">${btn}</button>`:'')+extra;
  const nb=$('sayNext');if(nb)nb.onclick=()=>{if(queue.length)queue.shift();else S.tutAdvance(s,true);lastSay='';tick();};
  const ab=$('sayAd');if(ab)ab.onclick=async()=>{const r=await SDK.ads.rewarded('offline2x');if(r.ok){S.grant(s,{coins:queue[0].ad});queue.shift();lastSay='';tick();}};}
 function tick(){$('coins').textContent=fmt(s.coins);$('hearts').textContent=fmt(s.hearts);$('paws').textContent=fmt(s.paws);
  S.tutAdvance(s);const t=S.tutStep(s);document.querySelectorAll('.menu button').forEach(b=>b.classList.toggle('hl',!queue.length&&!!t&&t.highlight===b.dataset.p));
  if(queue.length){const q=queue[0];setSay(q.say,'받기',q.ad?'<button id="sayAd" class="ad">광고 보고 2배 (스텁)</button>':'');}
  else if(t)setSay(t.say,t.next?'다음 ▶':'');
  else{const qs=S.questStatus(s);const ready=qs.find(q=>q.done&&!q.claimed),todo=qs.find(q=>!q.claimed);
   setSay(ready?`퀘스트 "${ready.text}" 완료! [퀘스트]에서 보상을 받아요.`:todo?`오늘의 부탁: ${todo.text}. 손님이 오면 시바들이 알아서 놀러 가요.`:'모든 부탁을 끝냈어요! 고마워요.','');}
  $('qdot').hidden=!S.questStatus(s).some(q=>q.done&&!q.claimed);
  if(openName&&openName!=='gacha'&&panels[openName].live)panels[openName].render();}
 // ---- panels ----
 let openName=null;
 const panels={
  shiba:{title:'시바 도감',render(){const coats=Object.keys(CFG.coats),ex=Object.keys(CFG.exprs);let h=`<p class="sub">${s.owned.length} / 20 · 카페에 최대 ${CFG.cafe.maxShibas}마리</p><div class="grid">`;
   for(const c of coats)for(const e of ex){const o=s.owned.find(o=>o.coat===c&&o.expr===e);h+=o?`<div class="card"><img src="${ctx.thumb(c,e)}"><b>${CFG.coats[c]}·${CFG.exprs[e]}</b><i>${o.rarity} · Lv.${o.lv}</i></div>`:`<div class="card off"><div class="q">?</div><b>${CFG.coats[c]}·???</b></div>`;}
   body().innerHTML=h+'</div>';}},
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
 function open(n){if(n==='gacha'){close();showPull();return;}if(openName===n){close();return;}openName=n;const p=panels[n];$('ptitle').textContent=p.title;p._k='';p.render();$('panel').classList.add('on');document.body.classList.add('popen');document.querySelectorAll('.menu button').forEach(b=>b.classList.toggle('on',b.dataset.p===n));}
 function close(){openName=null;$('panel').classList.remove('on');document.body.classList.remove('popen');document.querySelectorAll('.menu button').forEach(b=>b.classList.remove('on'));}
 document.querySelectorAll('.menu button').forEach(b=>b.onclick=()=>open(b.dataset.p));$('pclose').onclick=close;
 // ---- gacha flow: user's fixed video; at the burst the drawn shiba appears as a live 3D figure ----
 const vid=$('gvid'),gl=$('gacha');let cur=null,revealT0=0,batch=[];
 function showPull(){SDK.sfx('click');const free=CFG.gacha.firstFree&&s.gachaPulls===0;$('gpPaw').textContent=fmt(s.paws);
  $('pull1').textContent=free?'1회 뽑기 · 무료':`1회 뽑기 · 🐾${CFG.gacha.cost.paws}`;$('pull10').textContent=`10회 뽑기 · 🐾${CFG.gacha.cost10.paws}`;
  $('pull1').disabled=!S.canPull(s);$('pull10').disabled=s.paws<CFG.gacha.cost10.paws;$('gpull').classList.add('on');}
 $('pull1').onclick=()=>startGacha(1);$('pull10').onclick=()=>startGacha(10);$('gpClose').onclick=()=>$('gpull').classList.remove('on');
 $('gpShop').onclick=()=>{$('gpull').classList.remove('on');open('shop');};$('gpSet').onclick=()=>{$('gpull').classList.remove('on');open('settings');};
 const RANK={N:0,R:1,SR:2};const cardHtml=o=>`<div class="rc ${o.rarity}">${o.rarity==='SR'?'<em>★ ★ ★</em>':''}<img src="${ctx.thumb(o.coat,o.expr)}"><b>${o.rarity==='SR'?'레어 ':''}${CFG.coats[o.coat]} · ${CFG.exprs[o.expr]}</b><i>${o.rarity}${o.dup?' · Lv.'+o.lv:' · NEW'}</i></div>`;
 function startGacha(n=1){batch=[];if(n===10){if(s.paws<CFG.gacha.cost10.paws)return;s.paws-=CFG.gacha.cost10.paws-CFG.gacha.cost.paws*10;for(let i=0;i<10;i++){const r=S.pull(s,Math.random);if(r)batch.push(r);}}else{const r=S.pull(s,Math.random);if(r)batch.push(r);}if(!batch.length)return;
  cur=batch.reduce((a,b)=>RANK[b.rarity]>RANK[a.rarity]?b:a);SDK.sfx('click');SDK.sfx('knob');SDK.sfx('reveal');$('gpull').classList.remove('on');ctx.save();close();showGacha();vid.currentTime=0;vid.muted=!s.settings.sound;vid.play().catch(()=>{vid.muted=true;vid.play();});}
 function showGacha(){gl.classList.add('on');$('gcard').hidden=true;$('reveal3d').style.opacity=0;revealT0=0;}
 function reveal(){if(revealT0)return;revealT0=performance.now();$('reveal3d').style.opacity=1;const c=$('gcard');c.hidden=false;
  SDK.sfx('fanfare');if(!batch.length)batch=[cur];
  c.innerHTML=(batch.length>1?`<div class="rgrid">${batch.map(cardHtml).join('')}</div>`:cardHtml(cur))+`<button id="gok">${batch.every(b=>b.dup)?'확인':'카페로 보내기'}</button>`;
  $('gok').onclick=()=>{for(const b of batch)if(!b.dup)ctx.addToCafe(b);gl.classList.remove('on');vid.pause();cur=null;tick();};}
 vid.addEventListener('timeupdate',()=>{if(cur&&vid.currentTime>=CFG.gacha.revealAt)reveal();});vid.addEventListener('ended',()=>{if(cur)reveal();});
 $('gskip').onclick=()=>{if(cur){vid.currentTime=Math.max(vid.currentTime,CFG.gacha.revealAt);reveal();}};
 function frame(now){if(revealT0&&cur){const k=Math.min(1,(now-revealT0)/450);const sc=k<1?1.15*(1-Math.pow(1-k,3))+Math.sin(k*Math.PI)*.2:1.15;const w=Math.min(innerWidth,420);ctx.renderFigure(cur.coat,cur.expr,w,w,Math.sin(now/700)*.35,Math.max(.01,sc));}}
 // capture helper: show the reveal moment for a given figure at video time t
 async function gachaShow(coat,expr,t,rar){cur={coat,expr,rarity:rar||'R',lv:1,dup:false};batch=[cur];close();showGacha();vid.muted=true;await new Promise(r=>{vid.addEventListener('seeked',r,{once:true});vid.currentTime=t;});vid.pause();if(t>=CFG.gacha.revealAt){reveal();revealT0=performance.now()-1000;frame(performance.now());}return true;}
 tick();return {tick,open,close,frame,gachaShow};}
