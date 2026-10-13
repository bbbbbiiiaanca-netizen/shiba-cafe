// HUD, 동구 dialogue, slide-up panels, gacha flow. All visible text goes through L() (i18n.js, D-11).
import {makeT,LANGS} from './i18n.js';
export function UI(ctx){const {state:s,CFG,S,SDK}=ctx;const $=id=>document.getElementById(id);
 const L=makeT(()=>s.settings.language,CFG.exprs),Lin=c=>makeT(()=>c,CFG.exprs);
 const fmt=n=>Math.floor(n).toLocaleString(s.settings.language==='en'?'en-US':'ko-KR');
 const breed=c=>L('shiba.breed.'+c),exprName=e=>L('expr.'+e),nameOf=o=>`${breed(o.coat)}·${exprName(o.expr)}`,selfName=c=>Lin(c)('lang.name.'+c);
 const queue=[];if(ctx.loaded.offline.coins>0)queue.push({sayFn:()=>L('app.offline',{count:fmt(ctx.loaded.offline.coins),min:Math.round(ctx.loaded.offline.sec/60)}),ad:ctx.loaded.offline.coins});
 let lastSay='',shownLang;
 function setSay(text,btn,extra=''){const key=text+btn+extra;if(key===lastSay)return;lastSay=key;$('say').textContent=text;$('sayBtns').innerHTML=(btn?`<button id="sayNext">${btn}</button>`:'')+extra;
  const nb=$('sayNext');if(nb)nb.onclick=()=>{if(queue.length)queue.shift();else S.tutAdvance(s,true);lastSay='';tick();};
  const ab=$('sayAd');if(ab)ab.onclick=async()=>{const r=await SDK.ads.rewarded('offline2x');if(r.ok){S.grant(s,{coins:queue[0].ad});queue.shift();lastSay='';tick();}};}
 // static page text (data-i18n) — re-applied whenever the language changes, so the main screen switches on the next frame
 function applyStatic(){document.documentElement.lang=s.settings.language||'ko';document.title=L('app.title');
  document.querySelectorAll('[data-i18n]').forEach(e=>e.innerHTML=L(e.dataset.i18n));
  if(openName)$('ptitle').textContent=L(panels[openName].title);for(const p of Object.values(panels))p._k='';lastSay='';}
 function tick(){const lang=s.settings.language;if(lang!==shownLang){shownLang=lang;applyStatic();if(openName)panels[openName].render();}
  langScreen();
  $('coins').textContent=fmt(s.coins);$('hearts').textContent=fmt(s.hearts);$('paws').textContent=fmt(s.paws);
  S.tutAdvance(s);const t=S.tutStep(s);document.querySelectorAll('.bar button').forEach(b=>b.classList.toggle('hl',!queue.length&&!!t&&t.highlight===b.dataset.p));
  const qs=S.questStatus(s);const ready=qs.find(q=>q.done&&!q.claimed),todo=qs.find(q=>!q.claimed);
  $('qpill').textContent=t?L('app.qpill.tut'):ready?L('app.qpill.done',{name:L('quest.'+ready.id)}):todo?L('quest.'+todo.id):L('app.qpill.idle');
  if(s.rescueQueue&&s.rescueQueue.length){const got=s.rescueQueue.splice(0).map(id=>s.owned.find(o=>o.id===id)).filter(Boolean);for(const o of got)ctx.addToCafe(o);ctx.save();
   queue.push({sayFn:()=>L('walk.rescued',{name:got.map(o=>`${breed(o.coat)} ${S.gradeOf(o.lv)} Lv.${o.lv}`).join(', ')})});} // D-10: batched when several happened while closed
  $('talk').hidden=!(queue.length||t);
  if(queue.length){const q=queue[0];setSay(q.sayFn(),L('app.receive'),q.ad?`<button id="sayAd" class="ad">${L('app.ad2x')}</button>`:'');}
  else if(t){const i=CFG.tutorial.indexOf(t),skip=S.tutCanSkip(t);setSay(L('tut.'+i)+(skip?L('app.tut.skip'):''),(t.next||skip)?L('app.next'):'');}
  $('qdot').hidden=!S.questStatus(s).some(q=>q.done&&!q.claimed);
  if(openName&&openName!=='gacha'&&panels[openName].live)panels[openName].render();}
 // ---- D-11 첫 실행 언어 선택: 세로 목록, 기본 선택 없음(임시 — 명세 1.8 질문 1·4 미정), 기기 언어는 보지 않음 ----
 let langPick=null;
 function langScreen(){const el=$('lang');if(!el)return;const need=!s.settings.language;el.hidden=!need;if(!need)return;
  if(el._k===String(langPick))return;el._k=String(langPick);
  const txt=key=>langPick?Lin(langPick)(key):LANGS.map(c=>Lin(c)(key)).join(' / '); // before a pick: every language at once
  $('langTitle').textContent=txt('lang.select.title');$('langHint').textContent=txt('lang.select.hint');
  $('langList').innerHTML=CFG.languages.map(c=>`<button data-lang="${c}" class="${langPick===c?'on':''}">${selfName(c)}</button>`).join('');
  $('langOk').textContent=langPick?Lin(langPick)('lang.select.confirm'):'OK';$('langOk').disabled=!langPick;
  el.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{langPick=b.dataset.lang;langScreen();});}
 if($('langOk'))$('langOk').onclick=()=>{if(!langPick)return;s.settings.language=langPick;ctx.save();tick();};
 // ---- panels ----
 let openName=null;
 const panels={
  shiba:{title:'shiba.title',live:true,render(){const coats=Object.keys(CFG.coats),N=Object.keys(CFG.exprs).length;let h=`<button class="big" id="toPull">${L('shiba.pullBtn')}</button><p class="sub">${L('shiba.dex',{count:s.dex.length,total:N,max:CFG.cafe.maxShibas})}</p><div class="grid">`;
   for(const c of coats)for(const e of CFG.coatExprs(c)){const own=s.owned.filter(o=>o.coat===c&&o.expr===e).sort((a,b)=>b.lv-a.lv),o=own[0]||(s.dex.includes(c+'_'+e)?{lv:0}:null);
    h+=o?`<div class="card"><img src="${ctx.thumb(c,e)}"><b>${breed(c)}·${exprName(e)}</b><i>${o.lv?`${S.gradeOf(o.lv)} · Lv.${o.lv}${own.length>1?' ×'+own.length:''}`:L('shiba.notInCafe')}</i></div>`:`<div class="card off"><img src="${ctx.thumb(c,e)}"><b>${breed(c)}·???</b></div>`;}
   h+='</div>'+cafeList()+(ctx.journalHtml?ctx.journalHtml(L):'');if(this._k===h)return;this._k=h;body().innerHTML=h;$('toPull').onclick=()=>open('gacha');bindCafeList();}},
  upgrade:{title:'upgrade.title',live:true,render(){const c=S.upgradeCost(s),lv=s.upg||0;const h=`<div class="row"><img src="assets/counter.png"><b>${L('upgrade.counter',{count:lv})}<br><i>${L('upgrade.desc',{pct:Math.round(CFG.upgrade.bonus*100),rate:S.incomePerSec(s).toFixed(2)})}</i></b><button id="upg" ${s.coins<c?'disabled':''}>🪙 ${fmt(c)}</button></div><p class="sub">${L('upgrade.next')}</p>`;
   if(this._k===h)return;this._k=h;body().innerHTML=h;$('upg').onclick=()=>{if(S.buyUpgrade(s)){ctx.save();this._k='';tick();}};}},
  event:{title:'event.title',live:true,render(){const cur=S.onboardingDay(s);
   let h=`<h4>${L('booster.title')}</h4><p class="sub">${cur==null?L('event.dayModeUndecided'):L('booster.day',{count:cur})}</p><div class="ob">`;
   for(let d=1;d<=CFG.onboarding.days;d++){const st=S.onboardingStatus(s,d),{ready,pending}=S.onboardingReward(d);
    const items=Object.entries(ready).map(([k,v])=>`${CFG.items[k]?.icon||{hearts:'💗',coins:'🪙',paws:'🐾'}[k]}${v}`).concat(pending.map(k=>`${{hearts:'💗'}[k]||k} ${L('app.pending')}`));
    h+=`<button class="obd ${st}" data-ob="${d}" ${st==='claimable'?'':'disabled'}><b>${L('booster.day',{count:d})}</b><span>${items.length?items.join(' '):L('app.pending')}</span><i>${{claimed:'✔',claimable:L('attend.claim'),locked:'',pending:''}[st]}</i></button>`;}
   h+=`</div><p class="sub">${L('event.season')}</p><div class="row"><img src="assets/sakura.png"><b>${L('event.sakura')}<br><i>${L('app.pending')}</i></b></div><div class="row"><img src="assets/lantern.png"><b>${L('event.summer')}<br><i>${L('app.pending')}</i></b></div>`;
   if(this._k===h)return;this._k=h;body().innerHTML=h;
   body().querySelectorAll('[data-ob]').forEach(b=>b.onclick=()=>{if(S.claimOnboarding(s,+b.dataset.ob)){SDK.sfx('fanfare');ctx.save();}this._k='';tick();});}},
  shop:{title:'shop.title',render(){let h=`<h4>${L('shop.themes')}</h4>`;for(const t of CFG.themes){const own=s.themesOwned.includes(t.id),buyable=own||(t.price!=null&&s.coins>=t.price);
    h+=`<div class="row"><span class="sw" style="background:${t.wall}"></span><span class="sw" style="background:${t.tatami}"></span><b>${L(t.nameKey)}</b><button data-th="${t.id}" ${buyable?'':'disabled'}>${s.theme===t.id?L('shop.inUse'):own?L('shop.use'):t.price==null?L('shop.priceUndecided'):`🪙 ${fmt(t.price)}`}</button></div>`;}
   h+=`<h4>${L('shop.paws')}</h4>`;for(const p of SDK.iap.products)h+=`<div class="row"><b>${p.name}</b><button data-iap="${p.id}">${p.price}</button></div>`;h+='<p class="sub" id="shopMsg"></p>';body().innerHTML=h;
   body().querySelectorAll('[data-th]').forEach(b=>b.onclick=()=>{if(S.selectTheme(s,b.dataset.th)){ctx.applyTheme();ctx.save();}tick();this.render();});
   body().querySelectorAll('[data-iap]').forEach(b=>b.onclick=async()=>{const r=await SDK.iap.buy(b.dataset.iap);$('shopMsg').textContent=r.msg;});}},
  quest:{title:'quest.title',live:true,render(){const qs=S.questStatus(s);let h=S.tutStep(s)?`<p class="sub">${L('quest.locked')}</p>`:'';
   for(const q of qs){const r=Object.entries(q.reward).map(([k,v])=>({coins:'🪙',paws:'🐾',hearts:'❤'}[k])+' '+v).join(' ');h+=`<div class="row"><b>${L('quest.'+q.id)}</b><i>${r}</i><button data-q="${q.id}" ${q.done&&!q.claimed&&!S.tutStep(s)?'':'disabled'}>${q.claimed?L('quest.done'):q.done?L('app.receive'):L('quest.progress')}</button></div>`;}
   if(this._k===h)return;this._k=h;body().innerHTML=h;body().querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{S.claimQuest(s,b.dataset.q);ctx.save();this._k='';tick();});}},
  // D-06 가방: 하트 리셋권 (하트 10개 이상이면 버튼 꺼짐, 눌러도 변화 없음)
  bag:{title:'bag.title',live:true,render(){const H=CFG.hearts,n=s.items.heartReset||0,can=S.canUseHeartReset(s),nx=S.nextHeartInSec(s);
   const h=`<div class="row"><span class="icon">${CFG.items.heartReset.icon}</span><b>${L('bag.heartReset')} ×${n}<br><i>${L('bag.heartResetDesc',{count:H.regenCap})}</i></b><button id="useReset" ${can?'':'disabled'}>${L('bag.use')}</button></div>
   <div class="row"><span class="icon">${CFG.items.capsule.icon}</span><b>${L('bag.capsule')} ×${s.items.capsule||0}<br><i>${L('bag.capsuleDesc')}</i></b></div>
   <p class="sub">💗 ${fmt(s.hearts)} · ${nx==null?L('bag.regenStopped',{count:H.regenCap}):L('bag.regenNext',{time:mmss(nx),count:H.regenCap})}</p>`;
   if(this._k===h)return;this._k=h;body().innerHTML=h;$('useReset').onclick=()=>{if(S.useHeartReset(s,Date.now())){SDK.sfx('click');ctx.save();}this._k='';tick();};}},
  settings:{title:'settings.title',render(){const onoff=v=>v?L('settings.on'):L('settings.off');const cur=s.settings.language;
   body().innerHTML=`<div class="row"><b>${L('settings.sound')}</b><button data-k="sound">${onoff(s.settings.sound)}</button></div><div class="row"><b>${L('settings.music')}</b><button data-k="music">${onoff(s.settings.music)}</button></div>
   ${ctx.settingsExtra?ctx.settingsExtra(L,onoff):''}
   <h4>${L('settings.language')}</h4><p class="sub">${L('settings.language.current',{language:selfName(cur||'ko')})}</p><div class="langs">${CFG.languages.map(c=>`<button data-setlang="${c}" class="${c===cur?'on':''}">${selfName(c)}</button>`).join('')}</div>
   <div class="row"><b>${L('settings.cloud')}</b><button id="cloud">${L('settings.save')}</button></div><div class="row"><b>${L('settings.reset')}</b><button id="reset">${L('settings.resetBtn')}</button></div><p class="sub" id="setMsg">${this._msg||L('settings.autosave')}</p>`;this._msg='';
   body().querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{s.settings[b.dataset.k]=!s.settings[b.dataset.k];ctx.save();this.render();});
   body().querySelectorAll('[data-setlang]').forEach(b=>b.onclick=()=>{s.settings.language=b.dataset.setlang;ctx.save();tick();this._msg=L('settings.language.applied',{language:selfName(s.settings.language)});this.render();});
   $('cloud').onclick=async()=>{const r=await SDK.playGames.cloudSave(s);$('setMsg').textContent=r.msg;};
   $('reset').onclick=()=>{if(confirm(L('settings.resetConfirm'))){localStorage.removeItem(CFG.saveKey);location.search='?fresh=1';}};}},
 };
 const body=()=>$('pbody');
 // ---- D-03 카페 시바 목록 + 병합 (재료 → 대상). 같은 등급·같은 시바(merge.sameKey)일 때만 버튼이 켜짐 ----
 let sel=[];
 function cafeList(){sel=sel.filter(id=>s.owned.some(o=>o.id===id));const why=S.mergeCheck(s,sel[0],sel[1]);
  let h=`<h4>${L('shiba.cafe',{count:s.owned.length})}</h4>`;
  for(const o of [...s.owned].sort((a,b)=>a.coat.localeCompare(b.coat)||a.expr.localeCompare(b.expr)||b.lv-a.lv)){const k=sel.indexOf(o.id);
   h+=`<div class="row${k>=0?' sel':''}" data-sel="${o.id}"><img src="${ctx.thumb(o.coat,o.expr)}"><b>${nameOf(o)}<br><i>${S.gradeOf(o.lv)} · Lv.${o.lv}</i></b>${extraRow(o)}<i class="selk">${k===0?L('merge.target'):k===1?L('merge.material'):''}</i></div>`;}
  const a=s.owned.find(o=>o.id===sel[0]),b=s.owned.find(o=>o.id===sel[1]);
  h+=`<p class="sub" id="mergeWhy">${why?L('merge.'+why):`${nameOf(a)} Lv.${a.lv} + Lv.${b.lv} → Lv.${Math.min(CFG.grades.maxLevel,a.lv+b.lv)}`}</p><button class="big" id="mergeBtn" ${why?'disabled':''}>${L('merge.btn')}</button>`;return h;}
 // ---- D-08 산책 (비용 미정이면 '미정' 표시, 테스트 빌드에서만 무료) · D-09 피로 상태 표시(기능 꺼짐이면 안 보임) ----
 let walkPick=null;const mmss=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
 function extraRow(o){const fs=S.fatigueState(s,o.id),fz=fs==='sleep'?'<i>💤</i>':fs==='tired'?`<i>${L('status.tired')}</i>`:'';
  if(S.isBusy(s,o.id)){const W=s.walk,left=W.walkDurationSec-(Date.now()-W.walkStartAt)/1000;const stop=S.walkStopRule();
   return `<i>${L('walk.going',{time:mmss(Math.max(0,left))})}</i><button data-walkstop="${o.id}" ${stop?'':'disabled'}>${stop?L('walk.stop'):L('walk.stopUndecided')}</button>`;}
  if(walkPick!==o.id)return fz+`<button data-walk="${o.id}" ${S.walkCheck(s,o.id,CFG.walk.durationsSec[0])==='walking'||fs==='sleep'?'disabled':''}>🦮 ${L('care.walk')}</button>`;
  return fz+'<span class="walkopts">'+CFG.walk.durationsSec.map(sec=>{const c=S.walkCost(sec),why=S.walkCheck(s,o.id,sec);return `<button data-walkgo="${o.id}:${sec}" ${why?'disabled':''} title="${why?L('walk.why.'+why):''}">${L('walk.min',{count:sec/60})} · 💗${c==null?L('app.undecided'):c}</button>`;}).join('')+'</span>';}
 function bindCafeList(){const re=()=>{panels.shiba._k='';panels.shiba.render();};
  body().querySelectorAll('[data-sel]').forEach(r=>r.onclick=e=>{if(e.target.closest('button'))return;const id=+r.dataset.sel;const k=sel.indexOf(id);if(k>=0)sel.splice(k,1);else{if(sel.length>=2)sel=[sel[0]];sel.push(id);}re();});
  $('mergeBtn').onclick=()=>{const r=S.merge(s,sel[0],sel[1]);if(!r)return;ctx.removeFromCafe(r.material.id);sel=[];ctx.save();SDK.sfx('fanfare');re();tick();};
  body().querySelectorAll('[data-walk]').forEach(b=>b.onclick=()=>{walkPick=walkPick===+b.dataset.walk?null:+b.dataset.walk;re();});
  body().querySelectorAll('[data-walkgo]').forEach(b=>b.onclick=()=>{const [id,sec]=b.dataset.walkgo.split(':').map(Number);if(S.startWalk(s,id,sec,Date.now())){ctx.removeFromCafe(id);walkPick=null;ctx.save();}re();tick();});
  body().querySelectorAll('[data-walkstop]').forEach(b=>b.onclick=()=>{const id=S.stopWalk(s,Date.now());if(id!=null){ctx.addToCafe(s.owned.find(o=>o.id===id));ctx.save();}re();tick();});}
 function open(n){if(n==='gacha'){close();showPull();return;}if(openName===n){close();return;}openName=n;const p=panels[n];$('ptitle').textContent=L(p.title);p._k='';p.render();$('panel').classList.add('on');document.body.classList.add('popen');document.querySelectorAll('.bar button').forEach(b=>b.classList.toggle('on',b.dataset.p===n));}
 function close(){openName=null;$('panel').classList.remove('on');document.body.classList.remove('popen');document.querySelectorAll('.bar button').forEach(b=>b.classList.remove('on'));}
 document.querySelectorAll('.bar button').forEach(b=>b.onclick=()=>open(b.dataset.p));for(const id of ['bagBtn','heartPlus'])if($(id))$(id).onclick=()=>open('bag');$('pclose').onclick=close;
 // ---- gacha flow: user's fixed video; at the burst the drawn shiba appears ----
 const vid=$('gvid'),gl=$('gacha');let cur=null,revealT0=0,batch=[];
 function showPull(){SDK.sfx('click');const free=CFG.gacha.firstFree&&s.gachaPulls===0;$('gpPaw').textContent=fmt(s.paws);
  $('pull1').textContent=free?`${L('gacha.pull1')} · ${L('gacha.free')}`:`${L('gacha.pull1')} · 🐾${CFG.gacha.cost.paws}`;$('pull10').textContent=`${L('gacha.pull10')} · 🐾${CFG.gacha.cost10.paws}`;
  $('pull1').disabled=!S.canPull(s);$('pull10').disabled=!S.gachaReady()||s.paws<CFG.gacha.cost10.paws;
  if($('gpNote'))$('gpNote').hidden=S.gachaReady();if($('pullCap')){const n=s.items.capsule||0;$('pullCap').hidden=!n;$('pullCap').textContent=`${CFG.items.capsule.icon} ${L('gacha.useCapsule',{count:n})}`;$('pullCap').disabled=!S.canPull(s,{capsule:true});}$('gpull').classList.add('on');}
 $('pull1').onclick=()=>startGacha(1);if($('pullCap'))$('pullCap').onclick=()=>startGacha('cap');$('pull10').onclick=()=>startGacha(10);$('gpClose').onclick=()=>$('gpull').classList.remove('on');
 $('gpShop').onclick=()=>{$('gpull').classList.remove('on');open('shop');};$('gpSet').onclick=()=>{$('gpull').classList.remove('on');open('settings');};
 // result card: colour by grade (N 무색 · R 파랑 · S 금색), on-screen grade text is the initial only
 const RANK={N:0,R:1,S:2};const gradeOfCard=o=>S.gradeOf(o.lv);
 const cardHtml=o=>`<div class="rc ${gradeOfCard(o)}"><img src="${ctx.thumb(o.coat,o.expr)}"><b>${breed(o.coat)} · ${exprName(o.expr)}</b><i>${gradeOfCard(o)} · Lv.${o.lv}${o.isNew?' · '+L('gacha.new.short'):''}</i></div>`;
 function startGacha(n=1){batch=[];if(!S.gachaReady())return;if(n==='cap'){const r=S.pull(s,Math.random,{capsule:true});if(r)batch.push(r);}else if(n===10){if(s.paws<CFG.gacha.cost10.paws)return;s.paws-=CFG.gacha.cost10.paws-CFG.gacha.cost.paws*10;for(let i=0;i<10;i++){const r=S.pull(s,Math.random);if(r)batch.push(r);}}else{const r=S.pull(s,Math.random);if(r)batch.push(r);}if(!batch.length)return;
  cur=batch.reduce((a,b)=>RANK[gradeOfCard(b)]>RANK[gradeOfCard(a)]?b:a);SDK.sfx('click');SDK.sfx('knob');SDK.sfx('reveal');$('gpull').classList.remove('on');ctx.save();close();showGacha();vid.currentTime=0;vid.muted=!s.settings.sound;vid.play().catch(()=>{vid.muted=true;vid.play();});}
 function showGacha(){gl.classList.add('on');$('gcard').hidden=true;$('revealImg').classList.remove('on');revealT0=0;}
 function reveal(){if(revealT0)return;revealT0=performance.now();const ri=$('revealImg');ri.src=ctx.thumb(cur.coat,cur.expr);ri.classList.remove('on');void ri.offsetWidth;ri.classList.add('on');const c=$('gcard');c.hidden=false;
  SDK.sfx('fanfare');if(!batch.length)batch=[cur];
  c.innerHTML=(batch.length>1?`<div class="rgrid">${batch.map(cardHtml).join('')}</div>`:cardHtml(cur))+`<button id="gok">${L('gacha.toCafe')}</button>`;
  $('gok').onclick=()=>{for(const b of batch)ctx.addToCafe(b);gl.classList.remove('on');vid.pause();cur=null;tick();};}
 vid.addEventListener('timeupdate',()=>{if(cur&&vid.currentTime>=CFG.gacha.revealAt)reveal();});vid.addEventListener('ended',()=>{if(cur)reveal();});
 $('gskip').onclick=()=>{if(cur){vid.currentTime=Math.max(vid.currentTime,CFG.gacha.revealAt);reveal();}};
 // ---- D-04 승급 대체 카드 연출 (FEATURES.promotionCard, 영상 promotion.videoAsset 미정) ----
 let promo=null;const BORDER={N:'#e4e4e4',R:'#6f9fd6',S:'#d4a437'};
 function frame(){const busy=gl.classList.contains('on')||$('gpull').classList.contains('on');
  if(!promo&&!busy&&s.promoQueue&&s.promoQueue.length){const p=S.takePromotion(s);ctx.save();
   if(CFG.FEATURES.promotionCard&&$('promo')){promo={...p,t0:performance.now()};const el=$('promo');el.hidden=false;$('promoImg').src=ctx.thumb(p.coat,p.expr);}}
  if(!promo)return;const t=(performance.now()-promo.t0)/1000,ph=S.promoPhase(t),card=$('promoCard');
  card.style.transform=`scale(${ph.phase==='zoom'?1+.15*Math.sin(ph.k*Math.PI/2):1.15})`;
  card.style.borderColor=ph.phase==='zoom'?BORDER[promo.from]:ph.phase==='border'?mix(BORDER[promo.from],BORDER[promo.to],ph.k):BORDER[promo.to];
  $('promoBadge').textContent=ph.phase==='zoom'||ph.phase==='border'?promo.from:promo.to;$('promoBadge').classList.toggle('spark',ph.phase==='badge');
  card.classList.toggle('joy',ph.phase==='expr');if(ph.phase==='done')endPromo();}
 function endPromo(){promo=null;if($('promo'))$('promo').hidden=true;}
 if($('promo'))$('promo').onclick=()=>{if(promo&&CFG.promotion.skippable)endPromo();};
 const mix=(a,b,k)=>{const p=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));const A=p(a),B=p(b);return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*k).toString(16).padStart(2,'0')).join('');};
 // capture helper: show the reveal moment for a given figure at video time t
 async function gachaShow(coat,expr,t,grade){cur={coat,expr,lv:S.startLevel(grade||'R'),isNew:true};batch=[cur];close();showGacha();vid.muted=true;await new Promise(r=>{vid.addEventListener('seeked',r,{once:true});vid.currentTime=t;});vid.pause();if(t>=CFG.gacha.revealAt){reveal();const ri=$('revealImg');ri.style.animation='none';ri.style.opacity=1;ri.style.transform='translate(-50%,-50%) scale(1)';await new Promise(r=>ri.complete?r():ri.onload=r);}return true;}
 // true while a panel / gacha / promotion / language screen covers the cafe (used by 1.7.3 관찰 소이벤트)
 const isOverlay=()=>!!openName||gl.classList.contains('on')||$('gpull').classList.contains('on')||!!promo||($('lang')&&!$('lang').hidden);
 tick();return {tick,open,close,frame,gachaShow,isPromo:()=>!!promo,isOverlay,L};}
