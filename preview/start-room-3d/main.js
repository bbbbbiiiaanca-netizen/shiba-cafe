// Spec v3 UI: DOM screens over the pure core in sim.js. Images are the confirmed Drive files in assets/drive/ (see MAP.md), shown
// unmodified (sub-regions via CSS only). A needed image that does not exist is a dashed placeholder slot.
// 갱신 50: no "sticker" sliding — without walk frames (frame data UNSET) characters change place as a cut, never by gliding.
import {createIsoMap} from './isomap.js';
import {CFG,pressureAt,isUnset} from './config.js';
import * as S from './sim.js';
import {makeT,LANGS} from './i18n.js';

const Q=new URLSearchParams(location.search);
const $=id=>document.getElementById(id);
if(Q.get('fresh'))localStorage.removeItem(CFG.saveKey);
const r=Q.get('seed')?S.rng(+Q.get('seed')):Math.random;
const clock={offset:0,now(){return Date.now()+this.offset;}};
const L0=S.load(localStorage,clock.now(),r);let s=L0.state,w=S.newWorld(s,r);
const L=makeT(()=>s.settings.language);
const ui={nav:'cafe',panel:null,arg:null,sel:null,modals:[],toastT:0,walkPick:null,walkAlba:new Set(),trainPick:{}};

// ───────── images (assets/drive, MAP.md) ─────────
const IMG={shiba:b=>`assets/drive/shiba-${b}.png`,dongu:'assets/drive/dongu.webp',four:'assets/drive/shiba-four.webp',
 guest:k=>`assets/drive/guest-sitting-${k}-final.png`,rescue:['assets/drive/rescue-brown.png','assets/drive/rescue-gray.png'],
 walkPose:{sesame:'assets/drive/pose-sesame-walk.png',kuro:'assets/drive/pose-kuro-walk.png'},sleepPose:{sesame:'assets/drive/pose-sesame-sleep.png',kuro:'assets/drive/pose-kuro-sleep.png'},
 reqShiba:'assets/drive/request-icon-shiba_256.png',reqTrick:'assets/drive/request-icon-trick_256.png',snack:'assets/drive/T-01-basic-snack_256.png',toy:'assets/drive/T-03-rope-toy_256.png',
 potion:'assets/drive/mung-potion_256.png',potionSmall:'assets/drive/mung-potion-small_256.png'};
const slot=(label,wpx=54,hpx=54)=>`<span class="slot" style="width:${wpx}px;height:${hpx}px">${label}</span>`;
const islot=()=>`<span class="slot" style="width:20px;height:20px" title="${L('app.missingImg')}"></span>`;
const img=(src,alt='')=>`<img src="${src}" alt="${alt}" draggable="false">`;
const shibaImg=sh=>{const st=S.statusOf(s,sh);if(st==='sleeping'&&IMG.sleepPose[sh.breed])return IMG.sleepPose[sh.breed];if(st==='walking'&&IMG.walkPose[sh.breed])return IMG.walkPose[sh.breed];return IMG.shiba(sh.breed);};

// ───────── formatting ─────────
const fmt=n=>Math.floor(n).toLocaleString(s.settings.language==='en'?'en-US':'ko-KR');
const f2=n=>n==null?L('unset'):(Math.round(n*100)/100).toString();
const tfmt=sec=>{sec=Math.max(0,Math.ceil(sec));const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),x=sec%60;return h?`${h}:${String(m).padStart(2,'0')}:${String(x).padStart(2,'0')}`:`${m}:${String(x).padStart(2,'0')}`;};
const nameOf=sh=>sh.name||L('shiba.breed.'+sh.breed);
const bar=(k,col)=>`<div class="bar"><i style="width:${Math.round(Math.max(0,Math.min(1,k))*100)}%${col?';background:'+col:''}"></i></div>`;
function toast(t){const e=$('toast');e.textContent=t;e.style.opacity=1;ui.toastT=2.2;}
const reason={slot:'toast.slot',none:'toast.none',ticket:'toast.ticket',owned:'rescue.full',busy:'toast.devBusy',coins:'toast.coins',hearts:'toast.hearts',slots:'toast.slots',unset:'toast.unset',last:'toast.last',dia:'toast.dia',odds:'toast.odds'};
function why(code){toast(L(reason[code]||'toast.unset'));}
// 갱신 135-2: 남은 시간 바로 완료 버튼 (1분당 1다이아, 1분 올림)
function skipBtn(t){const left=S.skipLeftSec(s,t,clock.now());if(!(left>0))return '';const cost=S.skipCost(left);
 return `<button class="sec" data-act="skip" data-type="${t.type}" data-id="${t.id??''}" ${s.dia<cost?'disabled':''}>${L('skip.btn',{n:fmt(cost)})}</button>`;}

// ───────── HUD ─────────
function renderHUD(){const now=clock.now();$('coins').textContent=fmt(s.coins);$('hearts').textContent=fmt(s.hearts);$('dia').textContent=fmt(s.dia);
 const nh=S.nextHeartInSec(s,now);$('heartT').textContent=nh==null?'':tfmt(nh);
 const C=s.cafe,need=S.cafeNeed(C.level);$('lvl').textContent=L('hud.level',{lv:C.level});$('expBar').style.width=(need?Math.min(100,C.exp/need*100):100)+'%';
 $('rep').textContent=L('hud.rep',{rep:Math.round(C.rep)});$('mgr').textContent=S.managerActive(s,now)?L('hud.manager',{t:tfmt((C.managerUntil-now)/1000)}):'';
 $('closed').hidden=!C.closed;$('closed').textContent=L('hud.closed');}

let sceneSig='';
const iso=createIsoMap($('isomap'),{onChange:()=>S.save(localStorage,s,clock.now()),onBlocked:()=>toast('다른 가구와 겹치거나 방 밖으로 나갈 수 없어요.'),onEditChange:()=>{mainTab='furniture';menuSig='';renderMainMenu();}});
function renderScene(){iso.draw(s,w);renderMainMenu();}
let menuSig='',mainTab=iso.edit?'furniture':'menu';
function renderMainMenu(){
 document.querySelectorAll('[data-main-tab]').forEach(b=>b.classList.toggle('active',b.dataset.mainTab===mainTab));
 $('paws').textContent=fmt(s.shibas.reduce((n,sh)=>n+(sh.paws||0),0));
 const now=clock.now(),sig=JSON.stringify([mainTab,s.cafe.level,s.coins,s.dia,s.menus,s.menuDev,Math.ceil((s.menuDev?.until-now)/1000)]);
 if(mainTab==='menu'&&sig===menuSig)return;menuSig=sig;
 $('menuList').classList.toggle('tab-list',mainTab!=='menu');
 if(mainTab!=='menu'){const content=mainTab==='shiba'?P.shibas().html:mainTab==='store'?P.shop().html:`<button data-edit-toggle aria-pressed="${iso.edit}">${iso.edit?'편집 끝':'배치 편집'}</button><div class="note">가구 배치 · 가격 미정</div>${[['tea-table','찻상'],['zabuton','방석'],['counter','카운터'],['stairs','계단']].map(([id,name])=>`<div class="card li"><img class="furniture-icon" src="assets/drive/ui/ui-icon-${id}.png" alt=""><strong>${name}</strong></div>`).join('')}`;$('menuList').innerHTML=content;if(mainTab==='furniture'&&iso.edit)$('menuList').prepend(iso.actions);$('menuList').querySelector('[data-edit-toggle]')?.addEventListener('click',()=>{iso.setEdit(!iso.edit);});return;}
 const items=[CFG.menu.coffee,...CFG.menu.items].sort((a,b)=>a.id.localeCompare(b.id));
 const value=n=>n==null?'미정':fmt(n);
 $('menuList').innerHTML=items.map(m=>{const basic=m.id===CFG.menu.coffee.id,locked=!basic&&s.cafe.level<m.unlockLevel,dev=s.menuDev?.id===m.id,owned=s.menus.includes(m.id);
 return `<article class="menu-card ${locked?'locked':''}" data-main-menu="${m.id}"><img src="assets/drive/${m.img}" alt="${L('menu.'+m.id)}"><div class="menu-info"><small>${m.id}</small><strong>${L('menu.'+m.id)}</strong><span>가격 ${value(m.price)} 멍코인</span>${basic?'':``}${dev?`<span>개발 중 · ${tfmt((s.menuDev.until-now)/1000)}</span>`:''}</div><div class="menu-action">${basic?'<b>기본 메뉴</b>':locked?`<img class="lock" src="assets/drive/ui/ui-lock.png" alt="잠금"><b>Lv ${m.unlockLevel} 해금</b>`:dev?`<button class="instant" data-act="skip" data-type="menu" data-id="" ${S.skipCheck(s,{type:'menu'},now)?'disabled':''}>💎 즉시 완료 ${S.skipCost(S.skipLeftSec(s,{type:'menu'},now))}</button>`:owned?'<b>개발 완료</b>':`<button data-act="dev" data-id="${m.id}" ${S.menuCheck(s,m.id)?'disabled':''}>개발 ${value(m.devCost)} 멍코인</button>`}</div></article>`;
 }).join('');
}
document.querySelectorAll('[data-main-tab]').forEach(b=>b.addEventListener('click',()=>{close();mainTab=b.dataset.mainTab;menuSig='';document.querySelectorAll('[data-main-tab]').forEach(x=>x.classList.toggle('active',x===b));close();renderMainMenu();}));
function popAt(el,text,orderImg){if(!el)return;const sc=$('scene').getBoundingClientRect(),b=el.getBoundingClientRect();const p=document.createElement('div');p.className='pop';p.textContent=text;
 if(orderImg){const i=document.createElement('img');i.src='assets/drive/'+orderImg;p.prepend(i);} // 갱신 134: the ordered menu's picture
 p.style.left=(b.left-sc.left+4)+'px';p.style.top=(b.bottom-sc.top-30)+'px';$('scene').appendChild(p);setTimeout(()=>p.remove(),1500);}
function handleEvents(){for(const e of w.events.splice(0)){
 if(e.type==='menuDone')toast(L('toast.menuDone',{name:L('menu.'+e.id)}));
 if(e.type==='leave'){const el=document.querySelector(`[data-seat="${e.seat}"],[data-cust="${e.id}"]`);popAt(el,`+${f2(e.coins)} ${L('out.'+e.outcome)}`,e.orderImg);}
}
 while(s.walkResults.length)ui.modals.push({kind:'walkResult',res:s.walkResults.shift()});}

// ───────── panels ─────────
const P={};
P.shibas=()=>{const n=S.placedShibas(s).length;let h=`<button data-open="walk">${L('nav.walk')}</button><div class="card"><div class="note">${L('shibas.slots',{n,max:S.slotsOf(s),own:s.shibas.length,ownMax:CFG.cafe.maxOwned})}</div>`;
 for(const sh of s.shibas){const st=S.statusOf(s,sh);h+=`<div class="li"><div class="pt" data-act="care" data-id="${sh.id}">${img(shibaImg(sh))}</div><div class="grow" data-act="care" data-id="${sh.id}"><div class="nm">${nameOf(sh)} · ${L('app.lv',{lv:sh.level})}</div><div class="sub">${statusText(sh,st)}</div></div>
  <button class="${sh.placed?'sec':''}" data-act="place" data-id="${sh.id}" data-on="${sh.placed?0:1}" ${!sh.placed&&S.placeCheck(s,sh.id)?'disabled':''}>${sh.placed?L('care.unplace'):L('care.place')}</button></div>`;}
 h+=`</div><div class="card"><div class="li"><div class="pt">${img(IMG.dongu)}</div><div class="grow"><div class="nm">${L('char.dongu.name')}</div><div class="sub">${L('shibas.dongu')}</div></div>
  <button class="${s.dongu.placed?'sec':''}" data-act="dongu">${s.dongu.placed?L('care.unplace'):L('care.place')}</button></div></div>`;return {title:L('shibas.title'),html:`<button data-nav="walk">${L('nav.walk')}</button>`+h};};
function statusText(sh,st){if(st==='hospital')return L('st.hospital',{t:tfmt((sh.hospitalUntil-clock.now())/1000)})+' · '+L('inj.'+sh.hospitalKind);if(st==='injured')return L('st.injured')+' · '+L('inj.'+sh.injury);
 if(st==='ok'&&!sh.placed)return L('st.home');return L('st.'+st);}
// 갱신 140: 반다나 = 3×3 시트의 한 칸을 CSS로만 보여 줌 (그림은 그대로)
function bandHtml(id,cls=''){const it=S.accItem(id);if(!it)return slot(L('app.missingImg'),42,28);const B=CFG.accessory.bandana,i=B.colors.indexOf(it.color),[cols,rows]=B.grid;
 return `<span class="band ${cls}" data-band="${id}" title="${accName(id)}" style="background-image:url(assets/drive/${B.sheet[it.type]});background-position:${(i%cols)*100/(cols-1)}% ${Math.floor(i/cols)*100/(rows-1)}%"></span>`;}
const accName=id=>{const it=S.accItem(id);return it?L('acc.name',{c:L('acc.color.'+it.color),t:L('acc.type.'+it.type)}):id;};
// 갱신 139-5·139-6: 액세서리 칸 1개 — 잠김이면 발바닥 1,000 / 1,000다이아로 해금
function accCard(sh){const A=CFG.accessory,id=sh.id;let h=`<div class="card" data-acc="${id}"><h3>${L('care.acc')}</h3>`;
 if(!sh.accUnlocked)return h+`<div class="li">${slot('🔒 '+L('care.locked'))}<div class="grow note">${L('care.accLockedNote')}</div></div>
  <div class="btns"><button data-act="accUnlock" data-id="${id}" data-via="paws" ${S.accUnlockCheck(s,id,'paws')?'disabled':''}>${L('care.accUnlockPaws',{n:fmt(A.unlockPaws),have:fmt(sh.paws)})}</button>
  <button data-act="accUnlock" data-id="${id}" data-via="dia" ${S.accUnlockCheck(s,id,'dia')?'disabled':''}>${L('care.accUnlockDia',{n:fmt(A.unlockDia)})}</button></div></div>`;
 h+=sh.acc?`<div class="li">${bandHtml(sh.acc)}<div class="grow"><div class="nm">${accName(sh.acc)}</div><div class="sub">${L('care.accWorn')}</div></div><button class="sec" data-act="unequip" data-id="${id}">${L('care.accOff')}</button></div>`
  :`<div class="li">${slot(L('care.accEmpty'))}<div class="grow note">${L('care.accOpen')}</div></div>`;
 const bag=Object.entries(s.accInv).filter(([,n])=>n>0);
 h+=bag.length?`<div class="note">${L('care.accBag')}</div>`+bag.map(([k,n])=>`<div class="li">${bandHtml(k,'sm')}<div class="grow note">${accName(k)} ×${n}</div><button data-act="equip" data-id="${id}" data-item="${k}" ${S.equipCheck(s,id,k)?'disabled':''}>${L('care.accOn')}</button></div>`).join('')
  :`<div class="note">${L('care.accNone')}</div>`;
 return h+'</div>';}
// 갱신 140·140-1 액세서리 상점: 반다나 4종 × 9색 (5,000멍), 특별 액세서리 300다이아(종류 미정 → 빈 칸)
function accShop(){const B=CFG.accessory.bandana,t=ui.accType||B.types[0],items=S.bandanaItems().filter(x=>x.type===t);
 let h=`<div class="card" data-accshop><h3>${L('shop.acc')}</h3><div class="note">${L('shop.accRule')}</div>
  <div class="tabs">${B.types.map(k=>`<button class="${k===t?'':'sec'}" data-act="accType" data-type="${k}">${L('acc.type.'+k)}</button>`).join('')}</div><div class="accgrid">`;
 for(const it of items){const c=S.buyAccCheck(s,it.id),own=S.accOwned(s,it.id),worn=S.accWorn(s,it.id);
  h+=`<div class="ai" data-accitem="${it.id}">${bandHtml(it.id)}<span>${L('acc.color.'+it.color)}</span><span class="note">${L('shop.accOwned',{n:own,w:worn})}</span><button data-act="buyAcc" data-item="${it.id}" ${c?'disabled':''}>${L('app.coins',{n:fmt(it.price)})}</button></div>`;}
 const SP=CFG.accessory.special;
 h+=`</div><h3>${L('shop.accSpecial')}</h3><div class="li">${slot(L('app.unset'))}<div class="grow note">${L('shop.accSpecialNote',{dia:SP.priceDia})}</div><button disabled>${SP.priceDia}💎 · ${L('app.unset')}</button></div></div>`;
 return h;}
P.care=id=>{const sh=S.byId(s,id);if(!sh)return P.shibas();const st=S.statusOf(s,sh),now=clock.now(),need=S.pawsToNext(sh.level);
 let h=`<div class="card"><div class="big">${img(shibaImg(sh),nameOf(sh))}</div><div style="text-align:center"><div class="nm" style="font-size:18px;font-weight:900">${nameOf(sh)}</div>
  <div class="note">${L('shiba.breed.'+sh.breed)} · ${L('care.personality')}: ${sh.personality?L('per.'+sh.personality):L('app.oddsUnset')} · ${statusText(sh,st)}</div></div>
  <div class="g"><span>${L('care.level')} ${sh.level}</span>${bar(need?sh.paws/need:1)}<span class="ico paw"></span></div><div class="btns"><span class="note grow">${need?L('care.paws',{n:fmt(sh.paws),need:fmt(need)}):L('care.pawsMax',{n:fmt(sh.paws)})} · ${L('care.levelEff',{m:f2(S.levelEffect(sh.level))})}</span>
   ${need?`<button data-act="levelUp" data-id="${id}" ${S.levelUpCheck(s,id)?'disabled':''}>${L('care.levelUp',{n:fmt(need)})}</button>`:''}</div><div class="note">${L('care.pawsSrc')}</div>
  <div class="g"><span>${L('care.intimacy')}</span>${bar(sh.intimacy/100,'#e98aa0')}<span>${Math.round(sh.intimacy)}</span></div>
  <div class="g"><span>${L('care.intel')}</span>${bar(S.intelligence(sh)/100,'#6aa5d8')}<span>${S.intelligence(sh)}</span></div></div>`;
 h+=`<div class="card">${CFG.gauges.map(k=>`<div class="g"><span>${L('g.'+k)}</span>${bar(sh.g[k]/100,(k==='dirt'||k==='fatigue'||k==='boredom')?'#b58a5a':'#7fbf6a')}<span>${Math.round(sh.g[k])}</span></div>`).join('')}
  <div class="note">${L('care.cond',{m:f2(S.conditionMul(sh))})}</div>
  <div class="btns"><button data-act="play" data-id="${id}" ${S.careCheck(s,id,'play')?'disabled':''}>${img(IMG.toy)}${L('care.play',{n:CFG.care.play.hearts})}</button>
   <button disabled>${islot()}${L('care.feed')} · ${L('app.unset')}</button><button disabled>${img(IMG.snack)}${L('care.snack')} · ${L('app.unset')}</button>
   <button disabled>${islot()}${L('care.bath')} · ${L('app.unset')}</button><button disabled>${L('care.sleep')} · ${L('app.unset')}</button>
   <button data-act="walkFor" data-id="${id}" ${st!=='ok'?'disabled':''}>${L('care.walk')}</button></div><div class="note">${L('care.feed')}·${L('care.snack')}·${L('care.bath')}·${L('care.sleep')}: ${L('care.unsetNote')}</div>`;
 if(sh.status==='injured'||sh.status==='sick'){const cost=S.hospitalCost(s,sh.status==='sick'?'sick':sh.injury),c=S.hospitalCheck(s,id);h+=`<button class="warn" data-act="hospital" data-id="${id}" ${c?'disabled':''}>${c==='coins'?L('care.hospitalNo',{cost:fmt(cost)}):L('care.hospital',{cost:fmt(cost)})}</button>`;}
 const D=CFG.alba.daycare,dcd=(sh.cd.daycare||0)-now,dc=S.albaCheck(s,'daycare',[id],now);
 if(st==='hospital')h+=`<div class="btns">${skipBtn({type:'hospital',id})}</div>`;
 h+=`<div class="btns"><button class="sec" data-act="daycare" data-id="${id}" ${dc?'disabled':''}>${L('care.daycare')} · ${s.cafe.level<D.unlock?L('app.locked',{lv:D.unlock}):dcd>0?L('app.cooldown',{t:tfmt(dcd/1000)}):L('app.coins',{n:fmt(D.cost)})}</button>${skipBtn({type:'daycare',id})}</div>
  <div class="note">${L('care.potion',{n:s.items.potionBig,m:s.items.potionSmall})}</div></div>`;
 const T=CFG.alba.trainer;h+=`<div class="card"><h3>${L('care.tricks')}</h3>${(sh.cd.trainer||0)>now?`<div class="btns"><span class="note">${L('care.trainer')} ${L('app.cooldown',{t:tfmt((sh.cd.trainer-now)/1000)})}</span>${skipBtn({type:'trainer',id})}</div>`:''}`;
 for(const t of CFG.tricks){const lv=sh.tricks[t.id],c=S.trainCheck(s,id,t.id),tc=S.albaCheck(s,'trainer',[id],now,t.id),tcd=(sh.cd.trainer||0)-now;
  h+=`<div class="trk"><div class="li"><b>${L('trick.'+t.id)}</b><span class="stars">${'★'.repeat(lv)}${'☆'.repeat(CFG.trickMaxLevel-lv)}</span><span class="grow note">${lv<CFG.trickMaxLevel?sh.trickExp[t.id]+'/'+(lv+1):L('care.trainMax')}</span></div>
   ${lv>=CFG.trickMaxLevel?'':`<div class="btns"><button data-act="train" data-id="${id}" data-trick="${t.id}" ${c?'disabled':''}>${L('care.train',{p:Math.round(S.trainChance(sh)*100)})}</button><button class="sec" data-act="trainer" data-id="${id}" data-trick="${t.id}" ${tc?'disabled':''}>${L('care.trainer')} · ${s.cafe.level<T.unlock?L('app.locked',{lv:T.unlock}):tcd>0?tfmt(tcd/1000):L('app.coins',{n:fmt(T.cost)})}</button></div>`}</div>`;}
 h+=`</div>${accCard(sh)}<div class="card">
  <h3>${L('care.likes')}</h3><div class="btns">${Array.from({length:CFG.likes.snacks.basic+CFG.likes.snacks.rare},()=>slot('🔒 '+L('care.locked'))).join('')}${slot('🔒 '+L('app.unset'))}</div></div>
  <div class="card"><div class="btns"><button class="${sh.placed?'sec':''}" data-act="place" data-id="${id}" data-on="${sh.placed?0:1}" ${!sh.placed&&S.placeCheck(s,id)?'disabled':''}>${sh.placed?L('care.unplace'):L('care.place')}</button>
   <button class="warn" data-act="abandon" data-id="${id}" ${S.abandonCheck(s,id)?'disabled':''}>${L('care.abandon')}</button></div></div>`;
 return {title:nameOf(sh),html:h};};
P.walk=()=>{const now=clock.now();let h='';const W=s.walk;
 if(W){const sh=S.byId(s,W.shibaId),left=(W.walkStartAt+W.walkDurationSec*1000-now)/1000;
  h+=`<div class="card"><div class="li"><div class="pt">${img(shibaImg(sh))}</div><div class="grow"><div class="nm">${L('walk.now',{name:nameOf(sh),t:tfmt(left)})}</div>${bar(S.walkProgress(s,now))}</div></div>
   <button disabled>${L('walk.stop')}</button></div>`;}
 const cands=s.shibas;if(ui.walkPick==null||!S.byId(s,ui.walkPick))ui.walkPick=(cands.find(o=>S.statusOf(s,o)==='ok')||{}).id??null;
 h+=`<div class="card"><h3>${L('walk.pick')}</h3><div class="choices">${cands.map(o=>{const st=S.statusOf(s,o);return `<button class="choice${ui.walkPick===o.id?' on':''}" data-act="walkPick" data-id="${o.id}" ${st!=='ok'?'disabled':''}>${img(IMG.shiba(o.breed))}<span>${nameOf(o)} · ${statusText(o,st)}</span></button>`;}).join('')}</div>
  ${CFG.walk.durationsSec.map(sec=>{const fx=CFG.walkEffect[sec],c=ui.walkPick!=null?S.walkCheck(s,ui.walkPick,sec,now):'pick';
   return `<button data-act="walk" data-sec="${sec}" ${c?'disabled':''}>${L('walk.min',{m:sec/60,h:S.walkHearts(sec)})}</button><div class="note">${L('walk.fx',{b:fx.boredom,d:fx.dirt,f:fx.fatigue,h:fx.happy,i:fx.intimacy})}</div>`;}).join('')}</div>`;
 const A=CFG.alba.walk,ids=[...ui.walkAlba].filter(id=>S.byId(s,id)),ac=S.albaCheck(s,'walk',ids,now);
 h+=`<div class="card"><h3>${L('walk.alba')}</h3><div class="note">${L('walk.albaNote',{n:A.maxShibas})}</div>${s.cafe.level<A.unlock?`<div class="note">${L('app.locked',{lv:A.unlock})}</div>`:''}
  <div class="choices">${s.shibas.map(o=>{const cd=(o.cd.walk||0)-now;return `<button class="choice${ui.walkAlba.has(o.id)?' on':''}" data-act="albaPick" data-id="${o.id}" ${s.cafe.level<A.unlock||cd>0?'disabled':''}><span>${nameOf(o)}${cd>0?' · '+tfmt(cd/1000):''}</span></button>`;}).join('')}</div>
  ${s.shibas.filter(o=>(o.cd.walk||0)>now).map(o=>`<div class="li"><span class="grow note">${nameOf(o)} · ${L('app.cooldown',{t:tfmt((o.cd.walk-now)/1000)})}</span>${skipBtn({type:'walk',id:o.id})}</div>`).join('')}
  <button data-act="albaWalk" ${ac?'disabled':''}>${L('walk.albaGo',{cost:fmt(A.cost)})}</button></div>`;
 return {title:L('walk.title'),html:h};};
const hm=sec=>{const h=Math.floor(sec/3600),m=Math.round(sec%3600/60);return h&&m?L('app.hm',{h,m}):h?L('app.h',{h}):L('app.m',{m});};
// 갱신 136: 개발 중인 메뉴 1개 — 남은 시간, 진행 막대, 바로 완료(135-2)
function devCard(now){const D=s.menuDev;if(!D)return `<div class="note">${L('shop.devIdle')}</div>`;const m=S.menuItem(D.id),left=(D.until-now)/1000;
 return `<div class="li dev" data-dev="${D.id}"><div class="pt">${img('assets/drive/'+m.img)}</div><div class="grow"><div class="nm">${L('shop.developing',{name:L('menu.'+D.id)})}</div>
  ${bar((now-D.startAt)/(D.until-D.startAt))}<div class="sub">${L('shop.devLeft',{t:tfmt(left)})} · ${L('skip.note')}</div></div>${skipBtn({type:'menu'})}</div>`;}
// 갱신 137 시바뽑기 — 확률표 UNSET(질문 9(바))이면 버튼 3개 모두 비활성 '확률 미정'
function gachaCard(){const G=CFG.gacha,odds=S.gachaOddsSet(),tag=odds?'':' · '+L('app.oddsUnset'),dis=(n,o)=>S.gachaCheck(s,n,o)?'disabled':'';
 return `<div class="card" data-gacha><h3>${L('shop.gacha')}</h3><div class="note">${L(odds&&!isUnset(G.startLevel)?'shop.gachaNote':'shop.gachaNoteUnset',{p:G.dupPaws,lv:G.startLevel})}</div><div class="btns">
   <button data-act="gacha" data-n="1" ${dis(1)}>${L('shop.gacha1',{dia:G.priceDia})}${tag}</button>
   <button data-act="gacha" data-n="${G.tenCount}" ${dis(G.tenCount)}>${L('shop.gacha10',{n:G.tenCount,dia:fmt(G.tenDia)})}${tag}</button>
   <button class="sec" data-act="gacha" data-n="1" data-ticket="1" ${dis(1,{ticket:true})}>${L('shop.gachaTicket',{n:s.items.capsule})}${tag}</button></div></div>`;}
P.shop=()=>{const now=clock.now(),M=CFG.menu,menuImg=f=>`<div class="pt">${img('assets/drive/'+f)}</div>`;
 let h=`<div class="card"><h3>${L('shop.menu')}</h3><div class="note">${L('shop.menuRule',{n:S.normalDeveloped(s),p:f2(S.premiumChance(s.cafe.rep,false,S.normalDeveloped(s))*100)})}</div>
  ${devCard(now)}<div class="li" data-menu="${M.coffee.id}">${menuImg(M.coffee.img)}<div class="grow"><div class="nm">${L('menu.'+M.coffee.id)}</div><div class="sub">${L('shop.coffee',{p:M.coffee.price})}</div></div><button disabled>✓</button></div>`;
 for(const m of M.items){const c=S.menuCheck(s,m.id);
  h+=`<div class="li" data-menu="${m.id}">${menuImg(m.img)}<div class="grow"><div class="nm">${L('menu.'+m.id)}</div><div class="sub">${L('menu.kind.'+m.kind)} · ${L('shop.sell',{p:m.price})} · ${L('app.lv',{lv:m.unlockLevel})} · ${L('shop.devTime',{t:hm(m.devSec)})}</div></div>
   <button data-act="dev" data-id="${m.id}" ${c?'disabled':''}>${c==='owned'?'✓':c==='developing'?L('shop.developingShort'):c==='locked'?L('app.locked',{lv:m.unlockLevel}):L('app.coins',{n:fmt(m.devCost)})}</button></div>`;}
 h+='</div>';
 const G=CFG.alba.manager,mc=S.albaCheck(s,'manager',[],now);
 h+=`<div class="card"><h3>${L('shop.manager')}</h3><div class="note">${L('shop.managerNote')}</div><button data-act="manager" ${mc?'disabled':''}>${s.cafe.level<G.unlock?L('app.locked',{lv:G.unlock}):S.managerActive(s,now)?L('hud.manager',{t:tfmt((s.cafe.managerUntil-now)/1000)}):L('shop.hire',{cost:fmt(G.cost)})}</button></div>
  ${accShop()}<div class="card"><h3>${L('shop.bag')}</h3><div class="li"><span class="ico reset" style="width:34px;height:34px"></span><div class="grow nm">${L('shop.heartReset',{n:s.items.heartReset})}</div><button data-act="heartReset" ${S.canUseHeartReset(s)?'':'disabled'}>${L('shop.use')}</button></div>
   <div class="li">${slot(L('app.missingImg'),34,34)}<div class="grow nm">${L('shop.capsule',{n:s.items.capsule})}</div></div>
   <div class="li">${img(IMG.potion)}<div class="grow nm">${L('dia.potionBig')} ×${s.items.potionBig} · ${L('dia.potionSmall')} ×${s.items.potionSmall}</div></div></div>
  ${gachaCard()}
  <div class="card"><h3>${L('shop.dia')}</h3><div class="note">${L('shop.diaRate',{won:CFG.stub.diaPriceWon})} · ${L('app.payment')}</div>
   ${[['cooldown1',CFG.cooldownTicketDia.one],['cooldown5',CFG.cooldownTicketDia.five],['potionBig',CFG.potion.bigDia],['potionSmall',CFG.potion.smallDia],['boost',CFG.itemIncome.priceDia],['expBoost',CFG.stub.expBoost.priceDia],['slot',CFG.cafe.paidSlotUnlockDia]]
    .map(([k,p])=>`<div class="li"><span class="ico dia"></span><div class="grow">${L('dia.'+k)}</div><button disabled>${p==null?L('app.unset'):p+'💎'}</button></div>`).join('')}</div>`;
 return {title:L('shop.title'),html:h};};
P.settings=()=>{const h=`<div class="card"><h3>${L('settings.language')}</h3><div class="btns">${LANGS.map(c=>`<button class="${s.settings.language===c?'':'sec'}" data-act="setLang" data-lang="${c}">${makeT(()=>c)('lang.name.'+c)}</button>`).join('')}</div></div>
 <div class="card"><div class="btns"><button class="sec" data-act="toggle" data-k="sound">${L('set.sound')}: ${s.settings.sound?'ON':'OFF'}</button><button class="sec" data-act="toggle" data-k="music">${L('set.music')}: ${s.settings.music?'ON':'OFF'}</button></div></div>
 <div class="card"><button data-act="income">${L('set.income')}</button></div>
 <div class="card"><h3>${L('set.stubs')}</h3><div class="note">${L('stub.list')}</div></div>
 <div class="card"><button class="warn" data-act="reset">${L('set.reset')}</button></div>`;return {title:L('set.title'),html:h};};
P.income=()=>{const now=clock.now(),item=S.itemIncomeMul(s,now),base=CFG.menu.coffee.price;
 let h=`<div class="card"><h3>${L('inc.formula')}</h3><div class="note">${L('inc.base',{p:base})}</div>
  <div class="note">${s.menus.length?S.developed(s).map(m=>L('menu.'+m.id)+' '+L('app.coins',{n:m.price})).join(' · '):L('inc.noPremium')}</div>
  <div class="note">${L('inc.premium',{p:f2(S.premiumChance(s.cafe.rep,false,S.normalDeveloped(s))*100)})}</div><div class="note">${L('inc.item',{m:item})}</div></div><div class="card">`;
 for(const sh of S.placedShibas(s)){const e=S.levelEffect(sh.level);h+=`<div class="li"><div class="pt" style="width:40px;height:40px">${img(IMG.shiba(sh.breed))}</div><div class="grow"><div class="nm" style="font-size:12px">${L('inc.row',{name:nameOf(sh),lv:sh.level,base,lv2:f2(e),item,total:f2(base*e*item)})}</div><div class="sub">${L('inc.cond',{m:f2(S.conditionMul(sh))})}</div></div></div>`;}
 const p=w.lastPay;if(p)h+=`<div class="note">${L('inc.last',{out:L('out.'+p.outcome),base:p.base,lv:f2(p.lvMul),item:p.item,total:f2(p.total)})} ${p.pending?L('inc.pending'):''}</div>`;
 return {title:L('inc.title'),html:h+'</div>'};};
let panelSig='';
function renderPanel(force){if(!ui.panel){$('panel').hidden=true;return;}const v=P[ui.panel](ui.arg);const sig=v.title+v.html;if(!force&&sig===panelSig)return;panelSig=sig;
 const sc=$('pbody').scrollTop;$('ptitle').textContent=v.title;$('pbody').innerHTML=v.html;$('pbody').scrollTop=sc;$('panel').hidden=false;}
function open(name,arg=null){ui.panel=name;ui.arg=arg;ui.nav=['shibas','care'].includes(name)?'shibas':name==='income'?ui.nav:name;renderPanel(true);navState();}
function close(){ui.panel=null;$('pbody').innerHTML='';panelSig='';ui.nav='cafe';renderPanel();navState();}
function navState(){document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('on',b.dataset.nav===ui.nav));}

// ───────── modals ─────────
let modalSig='';
function renderModal(){const m=ui.modals[0]||(!s.settings.language?{kind:'lang'}:!s.started?{kind:'start'}:s.rescues.length?{kind:'rescue',x:s.rescues[0]}:null);
 if(!m){$('modal').hidden=true;modalSig='';return;}const sig=JSON.stringify([m.kind,m.x,ui.langPick,ui.startPick,s.settings.language,s.coins>=(m.kind==='rescue'?S.hospitalCost(s,'rescueBath'):0)]);if(sig===modalSig)return;modalSig=sig;
 let h='';
 if(m.kind==='lang')h=`<h2>${makeT(()=>ui.langPick||'ko')('lang.select.title')}</h2>${LANGS.map(c=>`<button class="${ui.langPick===c?'':'sec'}" data-act="langPick" data-lang="${c}">${makeT(()=>c)('lang.name.'+c)}</button>`).join('')}
  <div class="note">${makeT(()=>ui.langPick||'ko')('lang.select.hint')}</div><button data-act="langOk" ${ui.langPick?'':'disabled'}>${makeT(()=>ui.langPick||'ko')('lang.select.confirm')}</button>`;
 if(m.kind==='start')h=`<h2>${L('start.title')}</h2><div class="banner">${img(IMG.four)}</div><div class="note">${L('start.hint')}</div>
  <div class="choices">${CFG.breeds.map(b=>`<button class="choice${ui.startPick===b?' on':''}" data-act="startPick" data-breed="${b}">${img(IMG.shiba(b))}<span>${L('shiba.breed.'+b)}</span></button>`).join('')}</div>
  <input type="text" id="startName" maxlength="12" placeholder="${L('start.name')}" value="${ui.startName||''}"><button data-act="startGo" ${ui.startPick?'':'disabled'}>${L('start.go')}</button>`;
 if(m.kind==='offline'){const o=m.o,mins=Math.round(o.sec/60);h=`<h2>${L('off.title')}</h2><div class="note" style="font-size:14px">${L('off.body',{h:Math.floor(mins/60),m:mins%60,n:o.served,coins:fmt(o.coins),r0:Math.round(o.repFrom),r1:Math.round(o.repTo)})}</div>
  ${o.sec>CFG.offline.capHours*3600?`<div class="note">${L('off.cap')}</div>`:''}${m.closed?`<div class="note" style="font-size:13px;color:#9c4136">${L('off.closed')}</div>`:''}<button data-act="modalOk">${L('app.ok')}</button>`;}
 if(m.kind==='walkResult'){const sh=S.byId(s,m.res.shibaId);h=`<h2>${L('walk.back',{name:sh?nameOf(sh):'?'})}</h2><div class="big" style="width:120px;height:120px">${sh?img(IMG.shiba(sh.breed)):''}</div>
  <div class="note" style="text-align:center">${[m.res.paws?L('walk.paws',{n:m.res.paws}):'',...m.res.events.map(e=>L('walk.ev.'+e))].filter(Boolean).join(' · ')}</div><button data-act="modalOk">${L('app.ok')}</button>`;}
 if(m.kind==='rescue'){const x=m.x,cost=S.hospitalCost(s,'rescueBath');
  h=x.bathed?`<h2>${L('rescue.reveal',{breed:L('shiba.breed.'+x.breed)})}</h2><div class="big">${img(IMG.shiba(x.breed))}</div><div class="note" style="text-align:center">${L('rescue.lvNote',{lv:CFG.rescueLevel??CFG.pending.rescueLevel})}</div>
    <button data-act="rescueBring" ${S.bringCheck(s,x.rid)?'disabled':''}>${L('rescue.bring')}</button>${S.bringCheck(s,x.rid)==='owned'?`<div class="note">${L('rescue.full')}</div>`:''}<button class="sec" data-act="rescueDecline">${L('rescue.decline')}</button>`
   :`<h2>${L('rescue.found')}</h2><div class="big">${img(IMG.rescue[x.pic])}</div><button data-act="rescueBath" ${s.coins<cost?'disabled':''}>${L('rescue.bath',{cost:fmt(cost)})}</button><button class="sec" data-act="rescueDecline">${L('rescue.decline')}</button>`;}
 if(m.kind==='gacha')h=`<h2>${L('gacha.title')}</h2><div class="gres">${m.res.map(x=>`<div class="gi${x.dup?' dup':''}">${img(IMG.shiba(x.breed))}<span>${x.dup?L('gacha.dup',{name:nameOf(S.byId(s,x.toId)||{breed:x.breed}),p:x.paws}):L('gacha.new',{breed:L('shiba.breed.'+x.breed),lv:CFG.gacha.startLevel})}</span></div>`).join('')}</div><button data-act="modalOk">${L('app.ok')}</button>`;
 if(m.kind==='confirm')h=`<div class="note" style="font-size:14px">${m.text}</div><div class="btns"><button class="warn" data-act="confirmYes">${L('app.ok')}</button><button class="sec" data-act="modalOk">${L('app.cancel')}</button></div>`;
 $('mbox').innerHTML=h;$('modal').hidden=false;}
if(L0.offline&&(L0.offline.sec>=60||L0.reopened))ui.modals.push({kind:'offline',o:L0.offline,closed:!!L0.reopened});

// ───────── actions ─────────
const act={
 close,income:()=>open('income'),care:d=>open('care',+d.id),
 place:d=>{if(!S.setPlaced(s,+d.id,d.on==='1'))why(S.placeCheck(s,+d.id));},
 dongu:()=>{s.dongu.placed=!s.dongu.placed;},
 play:d=>{if(!S.playWith(s,+d.id,clock.now()))why(S.careCheck(s,+d.id,'play'));},
 train:d=>{const res=S.train(s,+d.id,d.trick,r,clock.now());if(res)toast(L(res.ok?'toast.trainOk':'toast.trainFail'));},
 trainer:d=>{S.hireAlba(s,'trainer',[+d.id],clock.now(),d.trick);},
 daycare:d=>{S.hireAlba(s,'daycare',[+d.id],clock.now());},
 hospital:d=>{if(!S.sendToHospital(s,+d.id,clock.now()))why(S.hospitalCheck(s,+d.id));},
 abandon:d=>{const sh=S.byId(s,+d.id);const now=clock.now(),I=CFG.intimacy,dd=s.lastAbandonAt!=null&&now-s.lastAbandonAt<I.abandonRepeatWithinH*3600e3?I.abandonShockRepeat:I.abandonShock;
  ui.modals.unshift({kind:'confirm',text:L('care.abandonQ',{name:nameOf(sh),d:dd}),yes:()=>{if(S.abandon(s,+d.id,clock.now()))open('shibas');}});},
 walkFor:d=>{ui.walkPick=+d.id;open('walk');},walkPick:d=>{ui.walkPick=+d.id;},
 walk:d=>{if(S.startWalk(s,ui.walkPick,+d.sec,clock.now(),r))S.tick(s,w,0,clock.now());else why(S.walkCheck(s,ui.walkPick,+d.sec,clock.now()));},
 albaPick:d=>{const id=+d.id;if(ui.walkAlba.has(id))ui.walkAlba.delete(id);else if(ui.walkAlba.size<CFG.alba.walk.maxShibas)ui.walkAlba.add(id);},
 albaWalk:()=>{if(S.hireAlba(s,'walk',[...ui.walkAlba],clock.now()))ui.walkAlba.clear();},
 manager:()=>{S.hireAlba(s,'manager',[],clock.now());},
 skip:d=>{const t={type:d.type,id:d.id===''?null:+d.id};if(S.skipNow(s,t,clock.now())==null)why(S.skipCheck(s,t,clock.now()));},
 levelUp:d=>{if(S.levelUp(s,+d.id))toast(L('toast.levelUpShiba',{lv:S.byId(s,+d.id).level}));else toast(L('toast.paws'));},
 gacha:d=>{const res=S.gachaPull(s,+d.n,r,clock.now(),{ticket:!!d.ticket});if(res)ui.modals.push({kind:'gacha',res});else why(S.gachaCheck(s,+d.n,{ticket:!!d.ticket}));},
 accUnlock:d=>{if(!S.unlockAccSlot(s,+d.id,d.via))why(S.accUnlockCheck(s,+d.id,d.via));},
 accType:d=>{ui.accType=d.type;},buyAcc:d=>{if(S.buyAcc(s,d.item))toast(L('toast.accBought',{name:accName(d.item)}));else why(S.buyAccCheck(s,d.item));},
 equip:d=>{if(!S.equipAcc(s,+d.id,d.item))why(S.equipCheck(s,+d.id,d.item));},unequip:d=>{S.unequipAcc(s,+d.id);},
 dev:d=>{if(!S.developMenu(s,d.id,clock.now()))why(S.menuCheck(s,d.id));},
 heartReset:()=>{S.useHeartReset(s,clock.now());},
 setLang:d=>{s.settings.language=d.lang;applyStatic();},toggle:d=>{s.settings[d.k]=!s.settings[d.k];},
 reset:()=>ui.modals.unshift({kind:'confirm',text:L('set.resetQ'),yes:()=>{localStorage.removeItem(CFG.saveKey);s=S.newState(clock.now());w=S.newWorld(s,r);close();}}),
 stain:()=>{if(S.cleanStain(s))toast(L('toast.cleaned'));},
 pickShiba:d=>{const id=+d.shiba;ui.sel=ui.sel===id?null:id;if(ui.sel!=null)toast(L('cafe.pick'));},
 seat:d=>{if(ui.sel==null)return;if(S.deliver(s,w,ui.sel,+d.cust,clock.now()))ui.sel=null;},
 langPick:d=>{ui.langPick=d.lang;},langOk:()=>{s.settings.language=ui.langPick;applyStatic();},
 startPick:d=>{ui.startName=$('startName')?.value||'';ui.startPick=d.breed;},
 startGo:()=>{const name=($('startName')?.value||'').trim();if(S.chooseStart(s,ui.startPick,name,r,clock.now())){w=S.newWorld(s,r);}},
 modalOk:()=>{ui.modals.shift();},confirmYes:()=>{const m=ui.modals.shift();m.yes();},
 rescueBath:()=>{if(!S.bathRescue(s,s.rescues[0].rid))toast(L('toast.coins'));},
 rescueBring:()=>{S.bringRescue(s,s.rescues[0].rid,r,clock.now());},rescueDecline:()=>{S.declineRescue(s,s.rescues[0].rid);},
};
document.addEventListener('click',e=>{const opener=e.target.closest('[data-open]');if(opener){open(opener.dataset.open);refresh();return;}const nb=e.target.closest('[data-nav]');if(nb){const n=nb.dataset.nav;if(n==='cafe')close();else open(n);refresh();return;}
 const el=e.target.closest('[data-act]');if(!el||el.disabled)return;const f=act[el.dataset.act];if(f){f(el.dataset);refresh();}});
// drag a roaming shiba onto a guest (갱신 105)
let drag=null;
$('scene').addEventListener('pointerdown',e=>{const t=e.target.closest('[data-act=pickShiba]');if(t)drag={id:+t.dataset.shiba,x:e.clientX,y:e.clientY};});
addEventListener('pointerup',e=>{if(!drag)return;const d=drag;drag=null;if(Math.hypot(e.clientX-d.x,e.clientY-d.y)<12)return;
 const seat=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-cust]');if(seat&&S.deliver(s,w,d.id,+seat.dataset.cust,clock.now())){ui.sel=null;refresh();}});
function applyStatic(){document.documentElement.lang=s.settings.language||'ko';document.title=L('app.title');document.querySelectorAll('[data-i18n]').forEach(e=>e.textContent=L(e.dataset.i18n));sceneSig='';panelSig='';modalSig='';}
function refresh(){handleEvents();renderHUD();renderScene();renderPanel();renderModal();}

// ───────── loop ─────────
let last=performance.now(),saveT=0;
function step(dt){const now=clock.now();
 if(s.started&&s.settings.language){S.tick(s,w,dt,now);S.settleHearts(s,now);}
 handleEvents();if(ui.toastT>0&&(ui.toastT-=dt)<=0)$('toast').style.opacity=0;
 if(ui.sel!=null&&!w.sh[ui.sel])ui.sel=null;refresh();
 if((saveT+=dt)>=2){saveT=0;S.save(localStorage,s,now);}}
// a long frame gap means the tab was hidden: the player was away → same offline fast-forward as on launch (임시휴무 rule applies)
function catchUp(ms){const now=clock.now(),o=S.fastForward(s,w,now-ms,now,{offline:true});
 if(s.cafe.closed){const re=S.reopenCafe(s,now);ui.modals.push({kind:'offline',o,closed:!!re});w=S.newWorld(s,r);}else if(ms>=60e3)ui.modals.push({kind:'offline',o,closed:false});return o;}
function advance(ms,offline=false){clock.offset+=ms;if(offline)return catchUp(ms);const now=clock.now(),o=S.fastForward(s,w,now-ms,now,{offline:false});refresh();return o;}
function frame(t){let dt=(t-last)/1000;last=t;if(Q.get('still')){requestAnimationFrame(frame);return;}
 if(dt>5&&s.started){catchUp(dt*1000);dt=0;}step(Math.min(dt,.25));requestAnimationFrame(frame);}
addEventListener('pagehide',()=>S.save(localStorage,s,clock.now()));
document.addEventListener('visibilitychange',()=>{if(document.hidden)S.save(localStorage,s,clock.now());});
const game={CFG,S,iso,get state(){return s;},get world(){return w;},step:(dt=.1)=>{step(dt);return {custs:w.custs.length,queue:w.queue.length,coins:s.coins};},advance,open,close,clock,ui,refresh};
window.__game=game;applyStatic();refresh();requestAnimationFrame(frame);window.__ready=true;
