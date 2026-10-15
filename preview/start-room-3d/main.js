import * as Q1715 from './q1715.js';
// Spec v3 UI: DOM screens over the pure core in sim.js. Images are the confirmed Drive files in assets/drive/ (see MAP.md), shown
// unmodified (sub-regions via CSS only). A needed image that does not exist is a dashed placeholder slot.
// 갱신 50: no "sticker" sliding — without walk frames (frame data UNSET) characters change place as a cut, never by gliding.
import * as Q17 from './q17.js';
import {cookingFx,runFx,heartFx,menuPickFx,ITEM_FX,ALBA_FX} from './effects.js';
import {createIsoMap} from './isomap.js';
import {CFG,GACHA_TABLE,pressureAt,isUnset} from './config.js';
import * as S from './sim.js';
import {makeT,LANGS} from './i18n.js';
import {TABS,DEFAULT_TAB,tabBadges} from './tabs.js';
import {PARTITION,FLOAT_LAYOUT,zonesForSpace} from './map-data.js';

const Q=new URLSearchParams(location.search);
const temp=Q.get('temp')==='1'; // capture/test roster never writes a production save
const persist=()=>{if(!temp)S.save(localStorage,s,clock.now());};
const $=id=>document.getElementById(id);
if(Q.get('fresh')&&!temp)localStorage.removeItem(CFG.saveKey);
const r=Q.get('seed')?S.rng(+Q.get('seed')):Math.random;
const clock={offset:0,now(){return Date.now()+this.offset;}};
const L0=temp&&Q.get('fresh')?{state:S.newState(clock.now())}:S.load(localStorage,clock.now(),r);let s=L0.state,w=S.newWorld(s,r);
if(temp&&(Q.has('expansions')||Q.has('rows'))){const rows=Number(Q.get('expansions')??Q.get('rows'));if(Number.isSafeInteger(rows)&&rows>=0)s.space.unlockedRows=rows;}
Q17.initQ17(s);
if(temp&&Q.get('fixture')==='friends')s.friends=[{id:'f1',name:'모카',level:4,breed:'red'},{id:'f2',name:'두부',level:2,breed:'white'},{id:'f3',name:'깨비',level:6,breed:'sesame'}];
const L=makeT(()=>s.settings.language);
const ui={seen:{menuDone:false},knownMenus:null,nav:'cafe',panel:null,arg:null,sel:null,modals:[],toastT:0,walkPick:null,walkAlba:new Set(),trainPick:{},lpOpen:{}};

// ───────── images (assets/drive, MAP.md) ─────────
const IMG={shiba:b=>`assets/drive/shiba-${b}.png`,dongu:'assets/drive/dongu.webp',four:'assets/drive/shiba-four.webp',
 guest:k=>`assets/drive/guest-sitting-${k}-final.png`,
 walkPose:{sesame:'assets/drive/pose-sesame-walk.png',kuro:'assets/drive/pose-kuro-walk.png'},sleepPose:{sesame:'assets/drive/pose-sesame-sleep.png',kuro:'assets/drive/pose-kuro-sleep.png'},
 reqShiba:'assets/drive/request-icon-shiba_256.png',reqTrick:'assets/drive/request-icon-trick_256.png',snack:'assets/drive/T-01-basic-snack_256.png',toy:'assets/drive/T-03-rope-toy_256.png',
 potion:'assets/drive/mung-potion_256.png',potionSmall:'assets/drive/mung-potion-small_256.png'};
// 그림이 resource icons (MAP.md '그림이 UI icons'): top bar, price buttons, floats. ico(k) = small inline icon before a number.
const RES={coin:'assets/drive/ui/res-coin.png',heart:'assets/drive/ui/res-heart.png',heartEmpty:'assets/drive/ui/res-heart-empty.png',dia:'assets/drive/ui/res-diamond.png',paw:'assets/drive/ui/res-paw.png'};
const ico=k=>`<img class="res-ico" data-res="${k}" src="${RES[k]}" alt="" draggable="false">`;
const slot=(label,wpx=54,hpx=54)=>`<span class="slot" style="width:${wpx}px;height:${hpx}px">${label}</span>`;
const islot=()=>`<span class="slot" style="width:20px;height:20px" title="${L('app.missingImg')}"></span>`;
const img=(src,alt='')=>`<img src="${src}" alt="${alt}" draggable="false">`;
const shibaImg=sh=>{const st=S.statusOf(s,sh);if(st==='sleeping'&&IMG.sleepPose[sh.breed])return IMG.sleepPose[sh.breed];if(st==='walking'&&IMG.walkPose[sh.breed])return IMG.walkPose[sh.breed];return IMG.shiba(sh.breed);};

// ───────── formatting ─────────
const fmt=n=>isUnset(n)?L('unset'):Math.floor(n).toLocaleString(s.settings.language==='en'?'en-US':'ko-KR');
const f2=n=>n==null?L('unset'):(Math.round(n*100)/100).toString();
const tfmt=sec=>{sec=Math.max(0,Math.ceil(sec));const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),x=sec%60;return h?`${h}:${String(m).padStart(2,'0')}:${String(x).padStart(2,'0')}`:`${m}:${String(x).padStart(2,'0')}`;};
const nameOf=sh=>sh.name||L('shiba.breed.'+sh.breed);
const bar=(k,col)=>isUnset(k)?L('unset'):`<div class="bar"><i style="width:${Math.round(Math.max(0,Math.min(1,k))*100)}%${col?';background:'+col:''}"></i></div>`;
function toast(t){const e=$('toast');e.textContent=t;e.style.opacity=1;ui.toastT=2.2;}
const reason={slot:'toast.slot',none:'toast.none',ticket:'toast.ticket',owned:'toast.owned',fatigue:'toast.fatigue',busy:'toast.devBusy',coins:'toast.coins',hearts:'toast.hearts',slots:'toast.slots',unset:'toast.unset',last:'toast.last',dia:'toast.dia',odds:'toast.odds'};
function why(code){toast(L(reason[code]||'toast.unset'));}
// 갱신 135-2: 남은 시간 바로 완료 버튼 (1분당 1다이아, 1분 올림)
function skipBtn(t){const left=S.skipLeftSec(s,t,clock.now());if(!(left>0))return '';const cost=S.skipCost(left);
 return `<button class="sec" data-act="skip" data-type="${t.type}" data-id="${t.id??''}" ${s.dia<cost?'disabled':''}>${L('skip.btn',{n:ico('dia')+fmt(cost)})}</button>`;}
const mmss=sec=>{sec=Math.max(0,Math.ceil(sec));return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;}; // §17-1 '04:32'

// ───────── HUD ─────────
// §17-1: hearts as CFG.hearts.slots slots (filled/empty icons); hearts above the slot count → all slots filled + small '+N'; mm:ss to the next heart while below the regen cap
function renderHearts(now){const cap=CFG.hearts.slots,n=Math.max(0,Math.floor(s.hearts||0)),el=$('hearts'),sig=n+'/'+cap;
 if(el.dataset.sig!==sig){el.dataset.sig=sig;el.innerHTML=Array.from({length:cap},(_,i)=>`<img class="heart-slot" data-full="${i<n?1:0}" src="${i<n?RES.heart:RES.heartEmpty}" alt="" draggable="false">`).join('')+(n>cap?`<small class="heart-more">+${fmt(n-cap)}</small>`:'');}
 const nh=S.nextHeartInSec(s,now);$('heartT').hidden=nh==null;$('heartT').textContent=nh==null?'':mmss(nh);
 el.parentElement.setAttribute('aria-label',`하트 ${fmt(n)}`+(nh==null?'':` · 다음 하트 ${mmss(nh)}`));el.parentElement.title=el.parentElement.getAttribute('aria-label');}
function renderHUD(){const now=clock.now();$('coins').textContent=fmt(s.coins);$('dia').textContent=fmt(s.dia);renderHearts(now);
 const C=s.cafe,need=S.cafeNeed(C.level);$('lvl').textContent=String(C.level);$('lvl').setAttribute('aria-label',L('hud.level',{lv:C.level}));$('expBar').style.width=(C.level>=CFG.cafe.maxLevel?100:need==null?0:Math.min(100,C.exp/need*100))+'%';
 $('expBar').parentElement.title=C.level>=CFG.cafe.maxLevel?'최고 레벨':need==null?'미정':`${fmt(C.exp)} / ${fmt(need)}`;
 const exp=$('cafeExp');exp.setAttribute('aria-valuemin','0');exp.setAttribute('aria-valuemax',String(need??100));exp.setAttribute('aria-valuetext',exp.title=$('expBar').parentElement.title);if(need==null)exp.removeAttribute('aria-valuenow');else exp.setAttribute('aria-valuenow',String(Math.min(C.exp,need)));
 for(const id of ['coins','dia','paws']){const el=$(id);el.parentElement.title=el.parentElement.getAttribute('aria-label')+' '+el.textContent;}
 $('rep').textContent=L('hud.rep',{rep:Math.round(C.rep)});$('mgr').textContent=S.managerActive(s,now)?L('hud.manager',{t:tfmt((C.managerUntil-now)/1000)}):'';
 $('questDot').hidden=!Q1715.progress(S.questTasks(s,clock.now()))?.n;$('entryMailDot').hidden=!S.mailbox(s,now).some(m=>!m.claimed);const qp=Q1715.progress(S.questTasks(s,clock.now()));$('questGuide').hidden=!qp;$('questGuide').innerHTML=qp?'미션 '+qp.n+'/'+qp.m+`<progress aria-label=미션 value=${qp.n} max=${qp.m||1}></progress>`:'';
 $('mailDot').hidden=!S.mailbox(s,now).some(m=>!m.claimed);$('boostChip').innerHTML=[['수익','boostUntil'],['경험치','expBoostUntil']].filter(([,k])=>C[k]>now).map(([n,k])=>itemIcon(k==='boostUntil'?'incomeBoost4h':'expBoost4h')+n+' '+tfmt((C[k]-now)/1000)).join(' · ');
 $('closed').hidden=!C.closed;$('closed').textContent=L('hud.closed');}

let sceneSig='';
const iso=createIsoMap($('isomap'),{onChange:()=>{S.syncRoutes(s,w);persist();},onExpand:()=>openExpand(),onBlocked:message=>toast(message||'다른 가구와 겹치거나 방 밖으로 나갈 수 없어요.'),onEditChange:()=>{mainTab='bag';menuSig='';renderMainMenu();}});
function renderScene(){iso.draw(s,w);renderMainMenu();}
$('scene').append(iso.actions);
let menuSig='',mainTab=iso.edit?'bag':DEFAULT_TAB;
// §16-1 tab row: built once from TABS; icons only from existing images, red dots from tabBadges (real state).
$('mainTabs').innerHTML=TABS.map(t=>`<button data-main-tab="${t.id}" class="${t.main?'main':''}" aria-label="${t.label}"><i class="tab-dot" aria-hidden="true" hidden></i><span class="tab-ico" style="${t.scaleKey?`transform:scale(${CFG.tabs.iconScale[t.scaleKey]})`:''}">${t.icon?img(t.icon):''}</span><span class="tab-label">${t.label}</span></button>`).join('');
function renderTabs(now){
 // a development finished (any path: tick, fast-forward, instant finish) while 가게 관리 was not open → dot until it is opened
 if(ui.knownMenus!=null&&s.menus.length>ui.knownMenus&&mainTab!=='manage')ui.seen.menuDone=true;ui.knownMenus=s.menus.length;
 const b=tabBadges(s,now,ui.seen);
 document.querySelectorAll('[data-main-tab]').forEach(e=>{const on=!!b[e.dataset.mainTab],t=TABS.find(x=>x.id===e.dataset.mainTab);e.classList.toggle('active',e.dataset.mainTab===mainTab);e.querySelector('.tab-dot').hidden=!on;e.dataset.badge=on?'1':'0';e.setAttribute('aria-label',t.label+(on?' · 알림':''));});}
function renderMainMenu(){
 const now=clock.now();renderTabs(now);
 $('paws').textContent=fmt(s.shibas.reduce((n,sh)=>n+(sh.paws||0),0));$('paws').parentElement.title='발바닥 '+$('paws').textContent;
 const sig=JSON.stringify([mainTab,ui.seen.menuDone,s,w.custs.map(c=>[c.phase,c.request]),w.queue.length,w.recent,ui.accType,iso.edit,s.settings.language,CFG.itemIncome.boostMul,CFG.stub.expBoost.mul,Math.floor(now/1000)]);
 if(sig===menuSig)return;menuSig=sig;
 const headers={manage:['가게관리','카페 현황 · 메뉴 개발 · 알바'],shiba:['시바들','돌봄 · 레벨업'],village:['마을','병원 · 산책'],bag:['가방','가구 · 아이템 · 액세서리'],shop:['상점','반다나 · 다이아 · 해금']};const [title,hint]=headers[mainTab];// §17-4: 가게 관리 shows one short summary line instead of the hint ('착석 2 · 대기 2'; '결제 미정' only while the last payment is undecided)
 document.querySelector('.menu-heading').innerHTML=title+(mainTab==='manage'?` <small data-customer-status>착석 ${w.custs.filter(c=>c.phase==='seated').length} · 대기 ${w.queue.length}${w.recent.at(-1)?.pending?' · 결제 미정':''}</small>`:' <small>'+hint+'</small>');
 $('menuList').classList.add('tab-list');
 // §17: 가게 관리 = café status + popup buttons only (the old menu card grid is gone; 메뉴 개발 lives in its popup)
 if(mainTab==='manage'){const scroll=$('menuList').scrollTop;$('menuList').innerHTML=manageTop(now)+`<button data-open="cooking">밥 만들기</button><button data-open="run">재료 달리기</button>`+P.alba().html+`<div class=chips>${w.custs.filter(c=>c.request&&!c.fulfilled).map(c=>`<button data-act=guestRequest data-id=${c.id}>손님 요청</button>`).join('')}</div>`;$('menuList').scrollTop=scroll;return;}
 if(mainTab==='village'){const scroll=$('menuList').scrollTop;$('menuList').innerHTML=villageHtml();$('menuList').scrollTop=scroll;return;}
 const content=mainTab==='shiba'?P.shibas().html:mainTab==='shop'?P.shop().html:consumables()+bagItems()+inventoryCard()+`<button data-edit-toggle aria-pressed="${iso.edit}">${iso.edit?'편집 끝':'배치 편집'}</button><section class="furniture-section" aria-labelledby="furniture-heading"><h3 id="furniture-heading">가구 · 좌석 ${S.seatCount(s)}</h3>${Object.entries(s.furnitureInv||{}).map(([type,n])=>`<div class="furn-row"><img width="48" src="assets/drive/furn-${type==='table'?'tea-table':type}-v4.png" alt="">${({table:'찻상',cushion:'방석',counter:'카운터',stairs:'계단'})[type]||type} ×${n}<button data-act="placeFurniture" data-item="${type}" ${n>0?'':'disabled'}>배치</button></div>`).join('')}${furnitureShop()}<div class="furniture-grid">${CFG.furniture.items.filter(({id})=>s.placement.slots.some(slot=>slot.type===({'tea-table':'table',zabuton:'cushion'}[id]||id))).map(({id,name})=>`<article class="furniture-card" data-furniture-card="${id}"><img class="furniture-icon" src="assets/drive/ui/ui-icon-${id}.png" alt=""><strong>${name}</strong></article>`).join('')}<article class="furniture-card" data-furniture-card="wall"><strong>가벽</strong><span data-wall-count>${(s.wallOwned??PARTITION.count)-s.placement.slots.filter(x=>x.type==='wall').length}</span><button data-act="wallBuy" ${s.coins<S.wallPrice(s)?'disabled':''}>${fmt(S.wallPrice(s))}멍 구입</button><button data-wall-inventory-place ${(s.wallOwned??PARTITION.count)<=s.placement.slots.filter(x=>x.type==='wall').length?'disabled':''}>배치</button></article></div></section>`;const scroll=$('menuList').scrollTop;$('menuList').innerHTML=content;$('menuList').scrollTop=scroll;$('menuList').querySelector('[data-wall-inventory-place]')?.addEventListener('click',()=>{iso.setEdit(true);iso.actions.querySelector('[data-wall-add]').click();});$('menuList').querySelector('[data-edit-toggle]')?.addEventListener('click',()=>{iso.setEdit(!iso.edit);});
}
document.querySelectorAll('[data-main-tab]').forEach(b=>b.addEventListener('click',()=>{close();mainTab=b.dataset.mainTab;if(mainTab==='manage')ui.seen.menuDone=false;menuSig='';renderMainMenu();}));
// 가게 관리 (§17): popup buttons (메뉴 개발 · 업그레이드), §15 ledger, café status (level, current development, upgrade levels).
function manageTop(now){return `<div class="manage-top" data-manage-top><div class="card"><div class="btns"><button data-act="listOpen" data-list="menu">메뉴 개발</button><button class="sec" data-act="listOpen" data-list="upgrade">업그레이드</button>${CFG.ledger.openFromStore?'<button class="sec" data-act="ledger">손익계산서</button>':''}</div></div>${cafeCard()}<div class="card" data-manage-dev><h3>${L('shop.menu')}</h3>${devCard(now)}<div class="note">개발 완료 ${s.menus.length} / ${CFG.menu.items.length}</div></div></div>`;}
function handleEvents(){for(const e of w.events.splice(0)){
 if(e.type==='menuDone')toast(L('toast.menuDone',{name:L('menu.'+e.id)}));
 if(e.type==='order')toast(`${L('menu.'+e.order)} 주문`);
 if(e.type==='leave')floatsFor(e);
 if(e.type==='angry')addFloat('angry',e.cell,0,e.id);
 if(e.type==='leave')toast(e.coins==null?`${L('menu.'+e.order)} · 결제 미정`:`+${f2(e.coins)} 멍코인`);
}} // walk results stay in s.walkResults until acknowledged (§17 red dot); renderModal shows them
// §17-5·17-6 floats: w.floats [{kind,cell,age,dur,dx}] drawn by isomap from the guest's head; aged in step(), gone after CFG.feedback.floatSec.
// Paying guest → coin; request met (완전 만족; meeting a shiba alone does not count) → heart beside it; angry (queue timeout) → 빠직.
function addFloat(kind,cell,dx=0,guestId=null){if(!cell)return;(w.floats??=[]).push({kind,cell:[...cell],age:0,dur:CFG.feedback.floatSec,dx,guestId});}
function floatsFor(e){const heart=!!e.requestMet,coin=e.coins!=null,[l,r]=FLOAT_LAYOUT.stagger;
 if(coin)addFloat('coin',e.cell,heart?l:0,e.id);if(heart)addFloat('heart',e.cell,coin?r:0,e.id);}
function ageFloats(dt){if(w.floats?.length)w.floats=w.floats.filter(f=>(f.age+=dt)<f.dur);}

// ───────── panels ─────────
const P={};
P.shibas=()=>{const n=S.placedShibas(s).length,f=ui.shibaView||(ui.shibaView={breed:'all',sort:'levelDesc'});
 let list=s.shibas.filter(sh=>f.breed==='all'||sh.breed===f.breed);
 list=[...list].sort(f.sort==='levelAsc'?(a,b)=>a.level-b.level||a.id-b.id:f.sort==='recent'?(a,b)=>b.id-a.id:(a,b)=>b.level-a.level||a.id-b.id);
 const opt=(k,v,label)=>`<button class="chip${f[k]===v?' on':''}" data-act="shibaView" data-k="${k}" data-v="${v}" aria-pressed="${f[k]===v}">${label}</button>`;
 let h=`<button data-open="walk">${L('nav.walk')}</button><div class="card" data-shiba-grid-card><div class="note">${L('shibas.slots',{n,max:S.slotsOf(s),own:s.shibas.length,ownMax:CFG.cafe.maxOwned})}</div>
  <div class="shiba-tools" data-shiba-filter data-shiba-sort><select data-shiba-breed aria-label="종류">${['all',...CFG.breeds].map(b=>`<option value="${b}" ${f.breed===b?'selected':''}>${b==='all'?'전체':L('shiba.breed.'+b)}</option>`).join('')}</select><button class="chip" data-act="shibaView" data-k="sort" data-v="${f.sort==='levelAsc'?'levelDesc':'levelAsc'}" data-sort-toggle="${f.sort}">레벨 ${f.sort==='levelAsc'?'↑':'↓'}</button></div>
  <div class="shiba-grid" data-shiba-grid>${list.map(sh=>{const st=S.statusOf(s,sh),r=shibaRisk(sh,st);return `<div class="sq" data-shiba-cell="${sh.id}"><button class="sq-pic" data-act="care" data-id="${sh.id}">${img(shibaImg(sh),nameOf(sh))}<i class="risk ${r}" data-risk="${r}" title="${({green:'좋음',orange:'주의',red:'위험'})[r]}"></i><span class="sq-where">${sh.placed?'카페':'집'}</span><span class="sq-lv">Lv${sh.level}</span></button><button class="sq-btn${sh.placed?' sec':''}" data-act="place" data-id="${sh.id}" data-on="${sh.placed?0:1}" ${!sh.placed&&S.placeCheck(s,sh.id)?'disabled':''}>${sh.placed?'넣기':'꺼내기'}</button></div>`;}).join('')||'<div class="note">시바가 없어요</div>'}</div>`;
 h+=`</div><div class="card"><div class="li"><div class="pt">${img(IMG.dongu)}</div><div class="grow"><div class="nm">${L('char.dongu.name')}</div><div class="sub">${L('shibas.dongu')}</div></div>
  <button class="${s.dongu.placed?'sec':''}" data-act="dongu">${s.dongu.placed?L('care.unplace'):L('care.place')}</button></div></div>`;return {title:L('shibas.title'),html:h};};
// Tiny status light (UI dot, not art): red = sick/injured or any gauge past red line; orange = hospital/walking-home or past orange line. Thresholds CFG.shibaRisk (starting values).
function shibaRisk(sh,st=S.statusOf(s,sh)){const R=CFG.shibaRisk;if(st==='sick'||st==='injured')return 'red';let worst='green';
 for(const k of CFG.gauges){const v=sh.g?.[k];if(typeof v!=='number'||!Number.isFinite(v))continue;const bad=R.highIsBad.includes(k)?v:100-v;if(bad>=R.red)return 'red';if(bad>=R.orange)worst='orange';}
 return st==='hospital'?'orange':worst;}
function statusText(sh,st){if(st==='hospital')return L('st.hospital',{t:tfmt((sh.hospitalUntil-clock.now())/1000)})+' · '+L('inj.'+sh.hospitalKind);if(st==='injured')return L('st.injured')+' · '+L('inj.'+sh.injury);
 if(st==='ok'&&!sh.placed)return L('st.home');return L('st.'+st);}
// 갱신 140: 반다나 = 3×3 시트의 한 칸을 CSS로만 보여 줌 (그림은 그대로)
function bandHtml(id,cls=''){const it=S.accItem(id);if(!it)return slot(L('app.missingImg'),42,28);const B=CFG.accessory.bandana,i=B.colors.indexOf(it.color),[cols,rows]=B.grid;
 return `<span class="band ${cls}" data-band="${id}" title="${accName(id)}" style="background-image:url(assets/drive/${B.sheet[it.type]});background-position:${(i%cols)*100/(cols-1)}% ${Math.floor(i/cols)*100/(rows-1)}%"></span>`;}
const accName=id=>{const it=S.accItem(id);return it?L('acc.name',{c:L('acc.color.'+it.color),t:L('acc.type.'+it.type)}):id;};
// 갱신 139-5·139-6: 액세서리 칸 1개 — 잠김이면 발바닥 1,000 / 1,000다이아로 해금
function accCard(sh){const A=CFG.accessory,id=sh.id;let h=`<div class="card" data-acc="${id}"><h3>${L('care.acc')}</h3>`;
 if(!sh.accUnlocked)return h+`<div class="li">${slot('🔒 '+L('care.locked'))}<div class="grow note">${L('care.accLockedNote')}</div></div>
  <div class="btns"><button data-act="accUnlock" data-id="${id}" data-via="paws" ${S.accUnlockCheck(s,id,'paws')?'disabled':''}>${L('care.accUnlockPaws',{n:ico('paw')+fmt(A.unlockPaws),have:fmt(sh.paws)})}</button>
  <button data-act="accUnlock" data-id="${id}" data-via="dia" ${S.accUnlockCheck(s,id,'dia')?'disabled':''}>${L('care.accUnlockDia',{n:ico('dia')+fmt(A.unlockDia)})}</button></div></div>`;
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
  h+=`<div class="ai" data-accitem="${it.id}">${bandHtml(it.id)}<span>${L('acc.color.'+it.color)}</span><span class="note">${L('shop.accOwned',{n:own,w:worn})}</span><button data-act="buyAcc" data-item="${it.id}" ${c?'disabled':''}>${priceText(it.price*CFG.cooking.ingredientBuyCount,'coin')}</button></div>`;}
 const SP=CFG.accessory.special;
 h+=`</div><h3>${L('shop.accSpecial')}</h3><div class="li">${slot(L('app.unset'))}<div class="grow note">${L('shop.accSpecialNote',{dia:SP.priceDia})}</div><button disabled>${priceText(SP.priceDia,'dia')} · ${L('app.unset')}</button></div></div>`;
 return h;}
P.care=id=>{const sh=S.byId(s,id);if(!sh)return P.shibas();const st=S.statusOf(s,sh),now=clock.now(),need=S.pawsToNext(sh.level);
 let h=`<div class="card"><div class="big tama" data-tama>${img(shibaImg(sh),nameOf(sh))}<i class="risk ${shibaRisk(sh,st)}" data-risk="${shibaRisk(sh,st)}"></i></div><div style="text-align:center"><div class="nm" style="font-size:18px;font-weight:900">${nameOf(sh)}</div>
  <div class="note">${L('shiba.breed.'+sh.breed)} · ${L('care.personality')}: ${sh.personality?L('per.'+sh.personality):L('app.oddsUnset')} · ${statusText(sh,st)}</div></div>
  <div class="g"><span>${L('care.level')} ${sh.level}</span>${bar(need?sh.paws/need:1)}${ico('paw')}</div><div class="btns"><span class="note grow">${need?L('care.paws',{n:fmt(sh.paws),need:fmt(need)}):L('care.pawsMax',{n:fmt(sh.paws)})} · ${L('care.levelEff',{m:f2(S.levelEffect(sh.level))})}</span>
   ${need?`<button data-act="levelUp" data-id="${id}" ${S.levelUpCheck(s,id)?'disabled':''}>${L('care.levelUp',{n:ico('paw')+fmt(need)})}</button>`:''}</div><div class="note">${L('care.pawsSrc')}</div>
  <div class="g"><span>${L('care.intimacy')}</span>${bar(isUnset(sh.intimacy)?null:sh.intimacy/100,'#e98aa0')}<span>${f2(sh.intimacy)}</span></div>
  <div class="g"><span>${L('care.intel')}</span>${bar(S.intelligence(sh)/100,'#6aa5d8')}<span>${S.intelligence(sh)}</span></div></div>`;
 h+=`<div class="card"><button data-open="cooking">밥 만들기</button>${CFG.cooking.recipes.map((r,i)=>`<button data-act="feedDish" data-id="${id}" data-item="${r.id}" ${Q17.feedCheck(s,sh,r.id)?'disabled':''}>${Q17.recipeName(r,i)} · ${r.effect.full==null||r.effect.happy==null||sh.g.full==null||sh.g.happy==null?'미정':'먹이기'}</button>`).join('')}</div>`;
 h+=`<div class="card"><div class="note">친밀도 ${sh.affinity??CFG.heartUse.affinity.start} / ${CFG.heartUse.affinity.max}</div>${CFG.gauges.map(k=>`<div class="g"><span>${L('g.'+k)}</span>${bar(isUnset(sh.g[k])?null:sh.g[k]/100,(k==='dirt'||k==='fatigue'||k==='boredom')?'#b58a5a':'#7fbf6a')}<span>${f2(sh.g[k])}</span></div>`).join('')}
  <div class="note">${L('care.cond',{m:f2(S.conditionMul(sh))})}</div>
  <div class="btns"><button data-act="play" data-id="${id}" ${S.careCheck(s,id,'play')?'disabled':''}>${img(IMG.toy)}${L('care.play',{n:CFG.care.play.hearts})}</button>
   <button disabled>${islot()}${L('care.feed')} · ${L('app.unset')}</button><button disabled>${img(IMG.snack)}${L('care.snack')} · ${L('app.unset')}</button>
   <button disabled>${islot()}${L('care.bath')} · ${L('app.unset')}</button><button disabled>${L('care.sleep')} · ${L('app.unset')}</button>
   <button data-act="walkFor" data-id="${id}" ${st!=='ok'?'disabled':''}>${L('care.walk')}</button></div><div class="note">${L('care.feed')}·${L('care.snack')}·${L('care.bath')}·${L('care.sleep')}: ${L('care.unsetNote')}</div>`;
 if(sh.status==='injured'||sh.status==='sick'){const cost=S.hospitalCost(s,sh.status==='sick'?'sick':sh.injury),c=S.hospitalCheck(s,id);h+=`<button class="warn" data-act="hospital" data-id="${id}" ${c?'disabled':''}>${c==='coins'?L('care.hospitalNo',{cost:fmt(cost)}):L('care.hospital',{cost:fmt(cost)})}</button>`;}
 const D=CFG.alba.daycare,dcd=(sh.cd.daycare||0)-now,dc=S.albaCheck(s,'daycare',[id],now);
 if(st==='hospital')h+=`<div class="btns">${skipBtn({type:'hospital',id})}</div>`;
 h+=`<div class="btns"><button class="sec" data-act="daycare" data-id="${id}" ${dc?'disabled':''}>${L('care.daycare')} · ${s.cafe.level<D.unlock?L('app.locked',{lv:D.unlock}):dcd>0?L('app.cooldown',{t:tfmt(dcd/1000)}):priceText(D.cost,'coin')}</button>${skipBtn({type:'daycare',id})}</div>
  <div class="note">${L('care.potion',{n:s.items.potionBig,m:s.items.potionSmall})}</div></div>`;
 const T=CFG.alba.trainer;h+=`<div class="card"><h3>${L('care.tricks')}</h3>${(sh.cd.trainer||0)>now?`<div class="btns"><span class="note">${L('care.trainer')} ${L('app.cooldown',{t:tfmt((sh.cd.trainer-now)/1000)})}</span>${skipBtn({type:'trainer',id})}</div>`:''}`;
 for(const t of CFG.tricks){const lv=sh.tricks[t.id],c=S.trainCheck(s,id,t.id),tc=S.albaCheck(s,'trainer',[id],now,t.id),tcd=(sh.cd.trainer||0)-now;
  h+=`<div class="trk"><div class="li"><b>${L('trick.'+t.id)}</b><span class="stars">${'★'.repeat(lv)}${'☆'.repeat(CFG.trickMaxLevel-lv)}</span><span class="grow note">${lv<CFG.trickMaxLevel?sh.trickExp[t.id]+'/'+(lv+1):L('care.trainMax')}</span></div>
   ${lv>=CFG.trickMaxLevel?'':`<div class="btns"><button data-act="train" data-id="${id}" data-trick="${t.id}" ${c?'disabled':''}>${L('care.train',{p:isUnset(S.trainChance(sh))?L('unset'):Math.round(S.trainChance(sh)*100)})}</button><button class="sec" data-act="trainer" data-id="${id}" data-trick="${t.id}" ${tc?'disabled':''}>${L('care.trainer')} · ${s.cafe.level<T.unlock?L('app.locked',{lv:T.unlock}):tcd>0?tfmt(tcd/1000):priceText(T.cost,'coin')}</button></div>`}</div>`;}
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
// §16-1 알바 tab: existing helpers (갱신 99·118·123·125-1). Hiring happens in the §16-2 popup or the existing care/walk screens.
P.alba=()=>{const now=clock.now(),G=CFG.alba.manager;let h=`<div class="card" data-alba><button data-act="listOpen" data-list="alba">알바 고르기</button><div class="note">${L('shop.manager')} · ${S.managerActive(s,now)?L('hud.manager',{t:tfmt((s.cafe.managerUntil-now)/1000)}):s.cafe.level<G.unlock?L('app.locked',{lv:G.unlock}):'대기'}</div></div>`;
 const cds=s.shibas.flatMap(sh=>['daycare','walk','trainer'].filter(k=>(sh.cd[k]||0)>now).map(k=>`<div class="li"><span class="grow note">${nameOf(sh)} · ${ALBA_NAME(k)} ${L('app.cooldown',{t:tfmt((sh.cd[k]-now)/1000)})}</span>${skipBtn({type:k,id:sh.id})}</div>`));
 return {title:'알바',html:h+`<div class="card"><h3>쿨타임</h3>${cds.join('')||'<div class="note">쿨타임 중인 시바가 없어요.</div>'}</div>`};};
const ALBA_NAME=k=>L({daycare:'care.daycare',walk:'walk.alba',trainer:'care.trainer',manager:'shop.manager'}[k]);
const hm=sec=>{const h=Math.floor(sec/3600),m=Math.round(sec%3600/60);return h&&m?L('app.hm',{h,m}):h?L('app.h',{h}):L('app.m',{m});};
// 갱신 136: 개발 중인 메뉴 1개 — 남은 시간, 진행 막대, 바로 완료(135-2)
function devCard(now){const D=s.menuDev;if(!D)return `<div class="note">${L('shop.devIdle')}</div>`;const m=S.menuItem(D.id),left=(D.until-now)/1000;
 return `<div class="li dev" data-dev="${D.id}"><div class="pt">${img('assets/drive/'+m.img)}</div><div class="grow"><div class="nm">${L('shop.developing',{name:L('menu.'+D.id)})}</div>
  ${bar((now-D.startAt)/(D.until-D.startAt))}<div class="sub">${L('shop.devLeft',{t:tfmt(left)})}</div></div>${skipBtn({type:'menu'})}</div>`;}
// 갱신 137 시바뽑기 — 확률표 UNSET(질문 9(바))이면 버튼 3개 모두 비활성 '확률 미정'
function gachaCard(){const G=CFG.gacha;return `<div class="card" data-gacha><h3>${L('shop.gacha')}</h3><button class="sec" data-act="gachaOdds">확률 보기</button><div class="note">${G.startLevel==null?'시작 레벨 미정':''} · 도장 ${fmt(s.gachaStamps||0)}/${GACHA_TABLE.pity.stampsForPick}</div><div class="btns">${[1,G.tenCount].map(n=>`<button data-act="gacha" data-n="${n}" ${S.gachaCheck(s,n)?'disabled':''}>${priceText(S.gachaPrice(n),'dia')}</button>`).join('')}<button data-act="gacha" data-n="1" data-ticket="1" ${S.gachaCheck(s,1,{ticket:true})?'disabled':''}>캡슐 ${s.items.capsule}</button></div><div class="note">도장 ${GACHA_TABLE.pity.stampsForPick}개로 원하는 시바 선택</div><div class="btns">${CFG.breeds.map(b=>`<button data-act="pityPick" data-breed="${b}" ${S.pityCheck(s,b)?'disabled':''}>${L('shiba.breed.'+b)}</button>`).join('')}</div></div>`;}

// §17-4 short: level + bar, one status line, one upgrade-level line
function cafeCard(){const C=s.cafe,need=S.cafeNeed(C.level);return `<div class="card" data-cafe-level><h3>카페 Lv ${C.level} <small class="note">${fmt(C.exp)} / ${C.level>=CFG.cafe.maxLevel?'최고':need==null?'미정':fmt(need)}</small></h3>${bar(need==null?0:C.exp/need)}<div class="note">평판 ${Math.round(C.rep)} · 시바 ${S.slotsOf(s)}칸 · 최대 손님 ${S.capOf(s)}명</div><div class="note" data-upgrade-levels>${UPGRADES.map(k=>`${UPGRADE_SHORT[k]} Lv${S.upgradeLevel(s,k)}`).join(' · ')}</div></div>`;}
function shopSlots(){return `<div class="card" data-shop-slots><h3>시바 액세서리 칸</h3>${s.shibas.map(sh=>`<div class="li"><div class="pt">${img(IMG.shiba(sh.breed))}</div><div class="grow"><b>${nameOf(sh)}</b><div class="note">${sh.accUnlocked?'칸 열림 · '+(sh.acc?accName(sh.acc):'빈 칸'):'칸 잠김'}</div><div class="btns">${sh.accUnlocked?`<button class="sec" data-act="care" data-id="${sh.id}">돌봄 · 액세서리</button>`:`<button data-act="accUnlock" data-id="${sh.id}" data-via="paws" ${S.accUnlockCheck(s,sh.id,'paws')?'disabled':''}>${priceText(CFG.accessory.unlockPaws,'paw')}</button><button data-act="accUnlock" data-id="${sh.id}" data-via="dia" ${S.accUnlockCheck(s,sh.id,'dia')?'disabled':''}>${priceText(CFG.accessory.unlockDia,'dia')}</button>`}</div></div></div>`).join('')}</div>`;}
function inventoryCard(){const items=S.bandanaItems().filter(it=>S.accOwned(s,it.id)>0);return `<div class="card" data-inventory><h3>액세서리 가방</h3>${items.length?items.map(it=>`<div class="li">${bandHtml(it.id)}<div class="grow"><b>${accName(it.id)}</b><div class="note">보유 ${S.accOwned(s,it.id)} · 착용 ${S.accWorn(s,it.id)} · 가방 ${s.accInv[it.id]||0}</div>${s.shibas.map(sh=>`<button class="sec" data-act="${sh.acc===it.id?'unequip':'equip'}" data-id="${sh.id}" data-item="${it.id}" ${sh.acc===it.id?'':S.equipCheck(s,sh.id,it.id)?'disabled':''}>${nameOf(sh)} · ${sh.acc===it.id?'벗기기':sh.accUnlocked?'착용':'칸 잠김'}</button>`).join('')}</div></div>`).join(''):'<div class="note">보유한 액세서리가 없어요.</div>'}</div>`;}
// §16-1 상점 tab: the old 가게 tab minus café level/ledger (→ 가게 관리) and manager (→ 알바). Only the bandana purchase works.
P.shopLegacy=()=>{let h=`<button data-act="unlockPopup">공간 해금</button>${unlocks()}${accShop()}${shopSlots()}<div class="card" hidden data-old-bag><h3>${L('shop.bag')}</h3><div class="li"><span class="ico reset" style="width:34px;height:34px"></span><div class="grow nm">${L('shop.heartReset',{n:s.items.heartReset})}</div><button data-act="heartReset" ${S.canUseHeartReset(s)?'':'disabled'}>${L('shop.use')}</button></div>
   <div class="li">${slot(L('app.missingImg'),34,34)}<div class="grow nm">${L('shop.capsule',{n:s.items.capsule})}</div></div>
   <div class="li">${img(IMG.potion)}<div class="grow nm">${L('dia.potionBig')} ×${s.items.potionBig} · ${L('dia.potionSmall')} ×${s.items.potionSmall}</div></div></div>
  ${gachaCard()}
  <div class="card"><h3>${L('shop.dia')}</h3><div class="note">${L('shop.diaRate',{won:CFG.stub.diaPriceWon})} · ${L('app.payment')}</div>
   ${[['cooldown1',CFG.cooldownTicketDia.one],['cooldown5',CFG.cooldownTicketDia.five],['potionBig',CFG.potion.bigDia],['potionSmall',CFG.potion.smallDia],['boost',CFG.itemIncome.priceDia],['expBoost',CFG.stub.expBoost.priceDia],['slot',CFG.cafe.paidSlotUnlockDia]]
    .map(([k,p])=>`<div class="li">${ico('dia')}<div class="grow">${L('dia.'+k)}</div><button disabled>${priceText(p,'dia')}</button></div>`).join('')}</div>`;
 return {title:L('shop.title'),html:h};};
P.shop=()=>({title:L('shop.title'),html:Q1715.shopHtml(CFG,ui.shopTab,id=>S.furniturePrice(s,id))+(ui.shopTab==='cash'?P.shopLegacy().html:ui.shopTab==='theme'?unlocks():'')});
P.quests=()=>({title:'미션',html:Q1715.questsHtml(CFG.quests,ui.questTab,S.questTasks(s,clock.now()),s.dia)});
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

// ───────── §16-2 list popup ─────────
// Row: {key, face (existing image path or null → empty slot), portrait, name, effect (§17-4: ONE short line ~10 chars), detail (shown only after
//  tapping the card body), locked (→ effect 'Lv{N} 해금' only, no price button), price (config value; null → '미정' disabled),
//  unit 'coin'|'dia', label (button text instead of price), disabled, act, data}. Prices come from CFG only.
const LP={};
const heartRow=(it,sh=null)=>{const now=clock.now(),locked=it.level==null||s.cafe.level<it.level,c=S.heartUseCheck(s,it.id,sh?.id,now),walk=it.id==='walk';return {key:sh?'shiba-'+sh.id:it.id,face:sh?IMG.shiba(sh.breed):it.art,portrait:!!sh,name:sh?nameOf(sh):it.name,effect:locked?(it.level==null?'미정':lockedLine(it.level)):sh?`친밀도 ${sh.affinity??CFG.heartUse.affinity.start} · ${heartFx(it)}`:heartFx(it),locked,price:walk?CFG.walk.heartsPer10Min:it.cost,unit:'heart',label:c==='daily'?'오늘 사용 완료':null,disabled:s.hearts<(walk?CFG.walk.heartsPer10Min:it.cost)||(!walk&&!!c&&!(c==='pick'&&it.shiba)&&!(c==='menu'&&it.menu)),act:walk?'heartWalk':it.shiba&&!sh?'heartPick':it.menu?'heartMenu':'heartUse',data:{item:it.id,id:sh?.id??''}};};
LP.hearts=()=>{const now=clock.now(),a=S.heartAdStatus(s,now),active=S.activeHeartEffects(s,now),ad=S.heartItems().some(it=>it.level!=null&&it.level<=s.cafe.level&&it.cost>s.hearts)?`<button data-act="heartAd" ${a.left||!a.remaining?'disabled':''}>광고 보고 하트 ${CFG.heartUse.ads.grant}${a.left?' · '+mmss(a.left):!a.remaining?' · 오늘 완료':''}</button>`:'';return {title:'하트 쓰기',top:`<div data-heart-balance>하트 ${ico('heart')}${s.hearts}</div><div data-heart-active>${active.map(e=>`<div>${CFG.heartUse.items.find(x=>x.id===e.id).name}${e.shibaId?' · '+nameOf(S.byId(s,e.shibaId)||{name:'시바'}):''} ${mmss(Math.ceil((e.until-now)/1000))}</div>`).join('')}</div>${ad}`,rows:S.heartItems().map(it=>heartRow(it)),footer:`<button data-act="heartBuy" ${s.dia<CFG.heartUse.buy.dia?'disabled':''}>${CFG.heartUse.buy.hearts}하트 = ${priceText(CFG.heartUse.buy.dia,'dia')}</button><button data-act="friendsOpen">다른 카페 방문 · 하루 ${CFG.heartUse.visit.daily}회 · ${CFG.heartUse.visit.hearts}하트</button><button data-act="heartStub">초대 메시지 · 하루 ${CFG.heartUse.invite.daily}회 · ${CFG.heartUse.invite.hearts}하트</button>`};};
// Reuse the daycare list frame and portrait row, including the same existing shiba images.
LP.heartShiba=id=>({title:'시바 고르기',rows:s.shibas.map(sh=>heartRow(CFG.heartUse.items.find(x=>x.id===id),sh))});
LP.heartMenu=id=>({title:'추천 메뉴 고르기',rows:s.menus.map(key=>{const m=CFG.menu.items.find(x=>x.id===key);return {key,face:m?'assets/drive/'+m.img:null,name:L('menu.'+key),effect:menuPickFx(CFG.heartUse.items.find(x=>x.id===id)),price:CFG.heartUse.items.find(x=>x.id===id).cost,unit:'heart',disabled:s.hearts<CFG.heartUse.items.find(x=>x.id===id).cost,act:'heartUse',data:{item:id,menu:key}};})});

const ITEM_ICONS={incomeBoost4h:'income-boost',expBoost4h:'exp-boost',cooldownTicket:'cooldown-ticket'};
function itemIcon(k){return ITEM_ICONS[k]?`<img class="res-ico" src="assets/drive/ui/item-${ITEM_ICONS[k]}.png" alt="">`:'';}
const priceText=(p,unit='coin')=>p==null?L('app.unset'):ico(unit)+fmt(p); // unit = RES key: coin · dia · paw
const lockedLine=lv=>L('app.locked',{lv}); // 'Lv15 해금' — the real unlock level from CFG
// §17-4 exact short lines (수인님 2026-10-14); numbers inside come from CFG
const ALBA_SHORT=ALBA_FX;
const ALBA_DETAIL={daycare:A=>`놀아주기와 같음 · 친밀도 ×${A.intimacyMul} · 쿨타임 ${hm(A.cooldownSec)}`,walk:A=>L('walk.albaNote',{n:A.maxShibas}),trainer:A=>`하트 없이 훈련 1회 · 항상 성공 · 쿨타임 ${hm(A.cooldownSec)}`,manager:()=>L('shop.managerNote')};
LP.alba=()=>{const now=clock.now();
 return {title:'알바 고르기',rows:['daycare','walk','trainer','manager'].map(k=>{const A=CFG.alba[k],locked=!isUnset(A.unlock)&&s.cafe.level<A.unlock,active=k==='manager'&&S.managerActive(s,now);
  const gate=isUnset(A.cost)||isUnset(A.unlock)||locked||active||isUnset(s.coins)||s.coins<A.cost||(k==='manager'&&!!S.albaCheck(s,'manager',[],now));
  return {key:k,face:null,name:ALBA_NAME(k),effect:locked?lockedLine(A.unlock):active?`운영 중 ${tfmt((s.cafe.managerUntil-now)/1000)}`:ALBA_SHORT[k](A),locked,
   detail:`${ALBA_DETAIL[k](A)} · ${isUnset(A.unlock)?L('app.unset'):lockedLine(A.unlock)} · ${priceText(A.cost,'coin')}`,price:A.cost,unit:'coin',disabled:gate,
   act:k==='manager'?'manager':k==='walk'?'albaWalkOpen':'listOpen',data:k==='manager'||k==='walk'?{}:{list:'albaShiba',kind:k}};})};};
// second level for per-shiba helpers: 데이케어 hires here; 훈련사 needs a trick → that shiba's care screen (existing trainer buttons).
LP.albaShiba=kind=>{const now=clock.now(),A=CFG.alba[kind];return {title:ALBA_NAME(kind),rows:s.shibas.map(sh=>{const c=kind==='trainer'?(CFG.tricks.some(t=>!S.albaCheck(s,kind,[sh.id],now,t.id))?null:S.albaCheck(s,kind,[sh.id],now,CFG.tricks[0].id)):S.albaCheck(s,kind,[sh.id],now),cd=(sh.cd[kind]||0)-now;
 return {key:'shiba-'+sh.id,face:IMG.shiba(sh.breed),portrait:true,name:nameOf(sh)+' · '+L('app.lv',{lv:sh.level}),effect:cd>0?L('app.cooldown',{t:tfmt(cd/1000)}):statusText(sh,S.statusOf(s,sh)),price:A.cost,unit:'coin',disabled:!!c,
  act:kind==='daycare'?'daycare':'albaTrainerOpen',data:{id:sh.id}};})};};
// §17-4 menu card: name + '판매가 N멍' (or '개발 중 mm:ss', or 'Lv{N} 해금'); dev time / cost / unlock level only in the tapped detail
LP.menu=()=>{const now=clock.now();return {title:L('shop.menu'),rows:CFG.menu.items.map(m=>{const c=S.menuCheck(s,m.id),dev=s.menuDev?.id===m.id,owned=s.menus.includes(m.id),locked=!owned&&!dev&&!isUnset(m.unlockLevel)&&s.cafe.level<m.unlockLevel;
 const effect=locked?lockedLine(m.unlockLevel):dev?'개발 중 '+tfmt((s.menuDev.until-now)/1000):`판매가 ${isUnset(m.price)?L('app.unset'):fmt(m.price)+'멍'}`;
 const detail=`판매가 ${isUnset(m.price)?L('app.unset'):fmt(m.price)+'멍'} · 개발 ${isUnset(m.devSec)?L('app.unset'):hm(m.devSec)} · ${priceText(m.devCost,'coin')} · ${isUnset(m.unlockLevel)?L('app.unset'):lockedLine(m.unlockLevel)}`;
 if(dev){const left=S.skipLeftSec(s,{type:'menu'},now);return {key:m.id,face:'assets/drive/'+m.img,name:L('menu.'+m.id),effect,detail:detail+' · '+L('skip.note'),price:S.skipCost(left),unit:'dia',label:'즉시 완료 '+priceText(S.skipCost(left),'dia'),disabled:!!S.skipCheck(s,{type:'menu'},now),act:'skip',data:{type:'menu',id:''}};}
 return {key:m.id,face:'assets/drive/'+m.img,name:L('menu.'+m.id),effect,detail,locked,price:m.devCost,unit:'coin',label:owned?'개발 완료':isUnset(m.devCost)?null:'개발비 '+priceText(m.devCost,'coin'),disabled:!!c,act:'dev',data:{id:m.id}};})};};
// 가게 관리 업그레이드 (§17, answer 2026-10-14): three kinds from CFG.upgrades. Price null → 미정, disabled. Effect null → '효과 미정'.
const UPGRADES=Object.keys(CFG.upgrades),UPGRADE_NAME={interval:'손님 간격 단축',price:'판매가 인상',queue:'대기 줄 연장'};
const UPGRADE_SHORT={interval:'간격',price:'판매가',queue:'대기 줄'};
const UPGRADE_FX={interval:()=>'손님 오는 간격 단축',price:()=>'메뉴 판매가 인상',queue:e=>`대기 줄 +${e}칸`};
LP.upgrade=()=>({title:'가게 관리 업그레이드',rows:UPGRADES.map(k=>{const U=CFG.upgrades[k],lv=S.upgradeLevel(s,k),c=S.upgradeCheck(s,k),fx=Number.isFinite(U.effect);
 return {key:k,face:null,name:`${UPGRADE_NAME[k]} Lv${lv}`,effect:fx?UPGRADE_FX[k](U.effect):'효과 '+L('app.unset'),
  detail:`${fx?UPGRADE_FX[k](U.effect)+' (레벨마다)':UPGRADE_FX[k]()+' · 효과 '+L('app.unset')} · 가격 ${priceText(S.upgradePrice(s,k),'coin')} · 최고 레벨 ${Number.isFinite(U.maxLevel)?U.maxLevel:L('app.unset')}`,
  price:S.upgradePrice(s,k),unit:'coin',label:c==='max'?'최고 레벨':null,disabled:!!c,act:'upgrade',data:{kind:k}};})});
// §17-4: tapping a card body (face or text, not the button) toggles its detail line inline; one open card per list (ui.lpOpen)
function listPopupHtml(m){const v=LP[m.list](m.arg),openKey=ui.lpOpen?.[m.list+(m.arg||'')];
 const row=x=>{const open=openKey===x.key&&!!x.detail;return `<article class="lp-card${x.locked?' locked':''}${x.disabled?' disabled':''}${open?' open':''}" data-lp-row="${x.key}"><span class="lp-face${x.portrait?' portrait':''}" data-act="lpToggle" data-key="${x.key}">${x.face?img(x.face):''}</span><div class="lp-text" data-act="lpToggle" data-key="${x.key}" aria-expanded="${open}"><strong>${x.name}</strong><small class="lp-effect">${x.effect}</small>${open?`<small class="lp-detail">${x.detail}</small>`:''}</div>`
  +(x.locked?'<span class="lp-price-slot" aria-hidden="true"></span>':`<button class="lp-price" data-act="${x.act}" ${Object.entries(x.data||{}).map(([k,val])=>`data-${k}="${val}"`).join(' ')} ${x.price==null||x.disabled?'disabled':''}>${x.price==null?L('app.unset'):x.label||priceText(x.price,x.unit)}</button>`)+'</article>';};
const btn=x=>`<button class="lp-price" data-act="${x.act}" ${Object.entries(x.data||{}).map(([k,val])=>`data-${k}="${val}"`).join(' ')} ${x.price==null||x.disabled?'disabled':''}>${x.price==null?L('app.unset'):x.label||priceText(x.price,x.unit)}</button>`;
 // 메뉴 개발 (똑또기 09:42): big horizontal swipe cards like the furniture shop; locked = only 'LvN 해금'
 if(m.list==='menu')return `<div class="lp-ribbon"><h2>${v.title}</h2></div><button class="lp-close" data-act="modalOk" aria-label="닫기">×</button><div class="q17-swipe menu-swipe" data-list-popup="menu" data-menu-cards>${v.rows.map(x=>x.locked?`<article class="q17-product menu-card lp-card locked" data-lp-row="${x.key}"><strong class="lp-effect">${x.effect}</strong></article>`:`<article class="q17-product menu-card lp-card" data-lp-row="${x.key}"><span class="lp-face menu-card-img">${x.face?img(x.face):''}</span><strong>${x.name}</strong><small class="lp-effect">${x.effect}</small>${btn(x)}</article>`).join('')}</div>`;
 return `<div class="lp-ribbon"><h2>${v.title}</h2></div><button class="lp-close" data-act="modalOk" aria-label="닫기">×</button><div class="lp-list" data-list-popup="${m.list}">${v.top||''}${v.rows.length?v.rows.map(row).join(''):`<div class="lp-empty">${v.empty||L('app.unset')}</div>`}${v.footer?`<div class="heart-footer">${v.footer}</div>`:''}</div>`;}

// ───────── modals ─────────
let modalSig='';
function renderModal(){const m=ui.modals[0]||(!s.settings.language?{kind:'lang'}:!s.started?{kind:'start'}:s.walkResults.length?{kind:'walkResult',res:s.walkResults[0]}:null);
 if(!m){$('modal').hidden=true;modalSig='';return;}
 $('mbox').classList.toggle('list-popup',['list','itemget'].includes(m.kind));if($('modal').style)$('modal').style.background=m.kind==='itemget'&&Number.isFinite(CFG.itemGet.dim)?`rgba(0,0,0,${CFG.itemGet.dim})`:'';
 if(m.kind==='list'){const h=listPopupHtml(m);if(h===modalSig&&!$('modal').hidden)return;const _sl=$('mbox').querySelector('.lp-list,[data-menu-cards]'),sc=_sl?.scrollTop||0,scl=_sl?.scrollLeft||0,same=$('mbox').dataset.list===m.list+(m.arg||'');modalSig=h;$('mbox').classList.remove('ledger-paper');$('mbox').innerHTML=h;$('mbox').dataset.list=m.list+(m.arg||'');if(same){const l=$('mbox').querySelector('.lp-list,[data-menu-cards]');if(l){l.scrollTop=sc;l.scrollLeft=scl;}}$('modal').hidden=false;return;}const sig=JSON.stringify([m.kind,m.text,m.actor,m.variant,m.tasks,m.fixture,m.x,m.res,m.reward,m.kind==='ledger'?[m.day,S.ledgerStatement(s,clock.now(),m.day)]:m.kind==='spaceUnlock'?[s.cafe.level,s.dia,s.space]:null,ui.langPick,ui.startPick,ui.startBandana,s.settings.language,s.coins]);if(sig===modalSig)return;modalSig=sig;delete $('mbox').dataset.list;
 let h='';
 if(m.kind==='dialogue')h=Q1715.dialogueHtml(m);
 $('mbox').classList.toggle('ledger-paper',m.kind==='ledger');
 if(m.kind==='ledger'){
 const report=S.ledgerStatement(s,clock.now(),m.day),amount=n=>n.toLocaleString('ko-KR',{maximumFractionDigits:2});
 h=`<div class="ledger-title"><h2>손익계산서</h2><button data-act="modalOk" aria-label="손익계산서 닫기">×</button></div><div class="ledger-days">${[-1,0].map(day=>`<button data-act="ledgerDay" data-day="${day}" aria-pressed="${m.day===day}">${day===-1?'어제':'오늘'}</button>`).join('')}</div><small class="ledger-unit">단위: 멍코인</small>`;
 for(const kind of ['income','expense'])h+=`<section class="ledger-section"><h3>${kind==='income'?'수입':'지출'}</h3>${report.lines.filter(x=>x.kind===kind).map(x=>`<div class="ledger-row ${kind}" data-ledger-category="${x.id}"><span>${x.label}</span><span>${kind==='expense'?'('+amount(x.amount)+')':amount(x.amount)}</span></div>`).join('')}</section>`;
 h+=`<div class="ledger-row ledger-net"><strong>순이익</strong><strong>${amount(report.net)} 멍코인</strong></div>`;
 }
 if(m.kind==='itemget'){const r=m.reward,n=grantName(r.id);h=`<div class="lp-ribbon"><h2>${n}</h2></div><div class="q17-itemget" data-itemget>${CFG.itemGet.rays.src?`<img class="itemget-rays" src="${CFG.itemGet.rays.src}" alt="">`:''}${grantImage(r.id)}<strong>${fmt(r.n)}</strong><button data-act="modalOk">받기</button></div>`;}
 if(m.kind==='mailbox')h='<h2>우편함</h2>'+S.mailbox(s,clock.now()).map(x=>`<div class=card>${x.day}일차 · ${x.coins}멍 · ${x.dia}다이아 · ${Object.entries(x.items).map(([k,v])=>itemIcon(k)+({heartReset:'하트 리셋권',capsule:'시바뽑기 캡슐',hearts:'하트',expBoost4h:'경험치 부스트',incomeBoost4h:'수익 부스트',cooldownTicket:'쿨타임권',potionBig:'큰 물약'})[k]+' ×'+(v??'미정')).join(' · ')}<button data-act=claimMail data-day=${x.day} ${x.claimed?'disabled':''}>${x.claimed?'수령 완료':'받기'}</button></div>`).join('')+'<button data-act=modalOk>닫기</button>';
 if(m.kind==='lang')h=`<h2>${makeT(()=>ui.langPick||'ko')('lang.select.title')}</h2>${LANGS.map(c=>`<button class="${ui.langPick===c?'':'sec'}" data-act="langPick" data-lang="${c}">${makeT(()=>c)('lang.name.'+c)}</button>`).join('')}
  <div class="note">${makeT(()=>ui.langPick||'ko')('lang.select.hint')}</div><button data-act="langOk" ${ui.langPick?'':'disabled'}>${makeT(()=>ui.langPick||'ko')('lang.select.confirm')}</button>`;
 if(m.kind==='start')h=`<h2>${L('start.title')}</h2><div class="banner">${img(IMG.four)}</div><div class="note">${L('start.hint')}</div>
  <div class="choices">${CFG.breeds.map(b=>`<button class="choice${ui.startPick===b?' on':''}" data-act="startPick" data-breed="${b}">${img(IMG.shiba(b))}<span>${L('shiba.breed.'+b)}</span></button>`).join('')}</div>
  <div class="choices">${S.bandanaItems().filter(it=>it.type===CFG.accessory.bandana.types[0]).map(it=>`<button data-act="startBandana" data-item="${it.id}" aria-pressed="${ui.startBandana===it.id}">${bandHtml(it.id)}${CFG.accessory.bandana.colorNames[CFG.accessory.bandana.colors.indexOf(it.color)]}</button>`).join('')}</div><input type="text" id="startName" maxlength="12" placeholder="${L('start.name')}" value="${ui.startName||''}"><button data-act="startGo" ${ui.startPick&&ui.startBandana?'':'disabled'}>${L('start.go')}</button>`;
 if(m.kind==='offline'){const o=m.o,mins=Math.round(o.sec/60);h=`<h2>${L('off.title')}</h2><div class="note" style="font-size:14px">${L('off.body',{h:Math.floor(mins/60),m:mins%60,n:o.served,coins:fmt(o.coins),r0:Math.round(o.repFrom),r1:Math.round(o.repTo)})}</div>
  ${o.sec>CFG.offline.capHours*3600?`<div class="note">${L('off.cap')}</div>`:''}${m.closed?`<div class="note" style="font-size:13px;color:#9c4136">${L('off.closed')}</div>`:''}<button data-act="modalOk">${L('app.ok')}</button>`;}
 if(m.kind==='walkResult'){const sh=S.byId(s,m.res.shibaId);h=`<h2>${L('walk.back',{name:sh?nameOf(sh):'?'})}</h2><div class="big" style="width:120px;height:120px">${sh?img(IMG.shiba(sh.breed)):''}</div>
  <div class="note" style="text-align:center">${[m.res.paws?L('walk.paws',{n:m.res.paws}):'',...m.res.events.map(e=>L('walk.ev.'+e))].filter(Boolean).join(' · ')}</div><button data-act="walkResultOk">${L('app.ok')}</button>`;}
 if(m.kind==='odds'){const total=GACHA_TABLE.pool.reduce((n,x)=>n+x.w,0);h=`<h2>뽑기 확률</h2><div data-gacha-odds>${GACHA_TABLE.pool.map(x=>`<div class="li"><div class="pt">${img(IMG.shiba(x.id))}</div><span>${L('shiba.breed.'+x.id)} · ${x.w/total*100}%</span></div>`).join('')}</div><div class="note">버전 ${GACHA_TABLE.version} · 도장 ${GACHA_TABLE.pity.stampsForPick}개 → 시바 선택 · 중복 → 개인 발바닥 ${GACHA_TABLE.dupToPaw}개</div><button data-act="modalOk">닫기</button>`;}
 if(m.kind==='gacha')h=`<h2>${L('gacha.title')}</h2><div class="gres">${m.res.map(x=>`<div class="gi${x.dup?' dup':''}">${img(IMG.shiba(x.breed))}<span>${x.dup?L('gacha.dup',{name:nameOf(S.byId(s,x.toId)||{breed:x.breed}),p:x.paws}):L('gacha.new',{breed:L('shiba.breed.'+x.breed),lv:CFG.gacha.startLevel})}</span></div>`).join('')}</div><button data-act="modalOk">${L('app.ok')}</button>`;
 if(m.kind==='levelResult'){const sh=S.byId(s,m.id);h=`<h2>레벨업 완료!</h2><div class="big">${sh?img(IMG.shiba(sh.breed)):''}</div><div class="note">${sh?nameOf(sh):''} · Lv ${m.from} → ${m.to}</div><button data-act="modalOk">${L('app.ok')}</button>`;}
 if(m.kind==='spaceUnlock')h=`<h2>공간 해금</h2>${unlocks()}<button data-act=modalOk>닫기</button>`;
 if(m.kind==='confirm')h=`<div class="note confirm-text" style="font-size:14px">${m.text}</div><div class="btns"><button class="warn${m.short?' dim':''}" data-act="confirmYes">${L('app.ok')}</button><button class="sec" data-act="modalOk">${L('app.cancel')}</button></div>`;
 $('mbox').innerHTML=h;$('modal').hidden=false;}
if(L0.offline&&(L0.offline.sec>=60||L0.reopened))ui.modals.push({kind:'offline',o:L0.offline,closed:!!L0.reopened});

// ───────── actions ─────────
function showGrants(before){for(const reward of Q17.rewardDiff(before,s))ui.modals.unshift({kind:'itemget',reward});}
const act={
 questTab:d=>{ui.questTab=d.item;},questInstant:d=>{if(!S.questInstant(s,d.id,clock.now()))toast('다이아가 부족해요');},questGo:d=>{if(TABS.some(t=>t.id===d.item)){close();mainTab=d.item;menuSig='';}},
 donguOffer:()=>ui.modals.unshift({kind:'dialogue',variant:'quest',actor:'dongu',speech:'부탁이 있어요',text:'동구 이야기',tasks:Q1715.tasksFor(CFG.quests,'dongu',temp&&ui.questFixture),fixture:temp&&ui.questFixture}),
 guestRequest:d=>{const c=w.custs.find(c=>String(c.id)===d.id);if(!c?.request)return;const q=c.request,sh=S.byId(s,q.shibaId);ui.modals.unshift({kind:'dialogue',variant:c.rude?'rude':'normal',actor:c.kind==='girl'?'girl':'man',speech:'부탁해요',text:q.type==='meetShiba'?`${sh?nameOf(sh):'시바'} 만나기`:`${L('trick.'+q.trick)} 보여 주세요`});},
 shopTab:d=>{ui.shopTab=d.item;menuSig='';},shopSpecial:()=>{ui.shopTab='special';menuSig='';},shopTheme:d=>{ui.shopTab='theme';ui.selectedTheme=d.item;menuSig='';},
 furnitureStorage:()=>{close();mainTab='bag';menuSig='';requestAnimationFrame(()=>document.querySelector('.furniture-section')?.scrollIntoView({block:'start'}));},coupon:()=>toast('쿠폰을 확인할 수 없어요'),
 furnitureCategory:d=>{ui.furnitureCategory=d.item;menuSig='';},
 friendsOpen:()=>{ui.modals=[];open('friends');},friendAdd:()=>toast('준비 중'),
 friendVisit:d=>toast(Q17.visitFriend(s,d.id,clock.now())?'준비 중 · 하트를 받았어요':'오늘 방문 완료'),
 recipePick:d=>{ui.recipe=d.item;},craft:()=>Q17.craft(s,ui.recipe||CFG.cooking.recipes[0].id,clock.now()),
 ingredientBuy:d=>Q17.buyIngredient(s,d.item),feedDish:d=>Q17.feedDish(s,S.byId(s,+d.id),d.item),
 runPlay:()=>toast('준비 중'),runSkip:()=>Q17.skipRun(s),runShiba:d=>{const ids=s.run.shibas,id=+d.id;s.run.shibas=ids.includes(id)?ids.filter(x=>x!==id):[...ids,id];},

 hearts:()=>{S.heartState(s);ui.modals.unshift({kind:'list',list:'hearts'});},
 heartPick:d=>ui.modals.unshift({kind:'list',list:'heartShiba',arg:d.item}),
 heartMenu:d=>ui.modals.unshift({kind:'list',list:'heartMenu',arg:d.item}),
 heartUse:d=>{const before=Q17.rewardSnapshot(s);if(S.useHeartItem(s,d.item,d.id?+d.id:null,clock.now(),d.menu||null,w)){if(ui.modals[0].list!=='hearts')ui.modals.shift();toast('사용했어요');showGrants(before);}},
 heartAd:()=>{S.claimHeartAd(s,clock.now());},heartBuy:()=>{S.buyHearts(s);},heartStub:()=>toast('준비 중'),
 heartWalk:()=>{ui.modals=[];open('walk');},villageHospital:()=>{mainTab='shiba';menuSig='';renderMainMenu();},
 listOpen:d=>{if(d.list==='menu')ui.seen.menuDone=false;ui.lpOpen={};ui.modals.unshift({kind:'list',list:d.list,arg:d.kind||null});},
 lpToggle:d=>{const m=ui.modals[0];if(m?.kind!=='list')return;const k=m.list+(m.arg||'');ui.lpOpen[k]=ui.lpOpen[k]===d.key?null:d.key;},
 albaWalkOpen:()=>{ui.modals=ui.modals.filter(m=>m.kind!=='list');open('walk');},
 albaTrainerOpen:d=>{ui.modals=ui.modals.filter(m=>m.kind!=='list');open('care',+d.id);},
 close,resourceShop:()=>toast('상점 준비 중이에요'),income:()=>{if(CFG.ledger.openFromPill)ui.modals.unshift({kind:'ledger',day:0});},ledger:()=>ui.modals.unshift({kind:'ledger',day:0}),ledgerDay:d=>{ui.modals[0].day=+d.day;},care:d=>open('profile',+d.id),careOpen:d=>open('care',+d.id),
 shibaView:d=>{ui.shibaView={...(ui.shibaView||{breed:'all',sort:'levelDesc'}),[d.k]:d.v};menuSig='';renderMainMenu();},
 place:d=>{if(!S.setPlaced(s,+d.id,d.on==='1'))why(S.placeCheck(s,+d.id));},
 dongu:()=>{s.dongu.placed=!s.dongu.placed;},
 play:d=>{if(!S.playWith(s,+d.id,clock.now()))why(S.careCheck(s,+d.id,'play'));},
 train:d=>{const res=S.train(s,+d.id,d.trick,r,clock.now());if(res)toast(L(res.ok?'toast.trainOk':'toast.trainFail'));},
 trainer:d=>{S.hireAlba(s,'trainer',[+d.id],clock.now(),d.trick);},
 daycare:d=>{S.hireAlba(s,'daycare',[+d.id],clock.now());},
 hospital:d=>{if(!S.sendToHospital(s,+d.id,clock.now()))why(S.hospitalCheck(s,+d.id));},
 abandon:d=>{const sh=S.byId(s,+d.id);const now=clock.now(),I=CFG.intimacy,dd=s.lastAbandonAt!=null&&now-s.lastAbandonAt<I.abandonRepeatWithinH*3600e3?I.abandonShockRepeat:I.abandonShock;
  ui.modals.unshift({kind:'dialogue',variant:'warning',actor:'dongu',text:L('care.abandonQ',{name:nameOf(sh),d:dd}),yes:()=>{if(S.abandon(s,+d.id,clock.now()))open('shibas');}});},
 walkFor:d=>{ui.walkPick=+d.id;open('walk');},walkPick:d=>{ui.walkPick=+d.id;},
 walk:d=>{if(S.startWalk(s,ui.walkPick,+d.sec,clock.now(),r))S.tick(s,w,0,clock.now());else why(S.walkCheck(s,ui.walkPick,+d.sec,clock.now()));},
 albaPick:d=>{const id=+d.id;if(ui.walkAlba.has(id))ui.walkAlba.delete(id);else if(ui.walkAlba.size<CFG.alba.walk.maxShibas)ui.walkAlba.add(id);},
 albaWalk:()=>{if(S.hireAlba(s,'walk',[...ui.walkAlba],clock.now()))ui.walkAlba.clear();},
 wallBuy:()=>{S.buyWall(s,clock.now());menuSig='';},
 manager:()=>{S.hireAlba(s,'manager',[],clock.now());},
 skip:d=>{const t={type:d.type,id:d.id===''?null:+d.id};if(S.skipNow(s,t,clock.now())==null)why(S.skipCheck(s,t,clock.now()));},
 levelUp:d=>{const sh=S.byId(s,+d.id);if(S.levelUpCheck(s,+d.id))return;const lv=sh.level,need=S.pawsToNext(lv);ui.modals.unshift({kind:'confirm',text:`${nameOf(sh)} Lv ${lv} → ${lv+1} · 발바닥 ${fmt(need)}개를 사용할까요?`,yes:()=>{if(S.byId(s,+d.id)?.level!==lv||!S.levelUp(s,+d.id)){toast(L('toast.paws'));return;}ui.modals.unshift({kind:'levelResult',id:+d.id,from:lv,to:lv+1});}});},
 gachaOdds:()=>{ui.modals.push({kind:'odds'});},
 pityPick:d=>{const x=S.pityPick(s,d.breed,r,clock.now());if(x)ui.modals.push({kind:'gacha',res:[x]});else why(S.pityCheck(s,d.breed));},
 gacha:d=>{const res=S.gachaPull(s,+d.n,r,clock.now(),{ticket:!!d.ticket});if(res)ui.modals.push({kind:'gacha',res});else why(S.gachaCheck(s,+d.n,{ticket:!!d.ticket}));},
 accUnlock:d=>{if(!S.unlockAccSlot(s,+d.id,d.via))why(S.accUnlockCheck(s,+d.id,d.via));},
 accType:d=>{ui.accType=d.type;},buyAcc:d=>{if(S.buyAcc(s,d.item,clock.now()))toast(L('toast.accBought',{name:accName(d.item)}));else why(S.buyAccCheck(s,d.item));},
 equip:d=>{if(!S.equipAcc(s,+d.id,d.item))why(S.equipCheck(s,+d.id,d.item));},unequip:d=>{S.unequipAcc(s,+d.id);},
 dev:d=>{if(!S.developMenu(s,d.id,clock.now()))why(S.menuCheck(s,d.id));},
 startBandana:d=>{ui.startName=$('startName')?.value||'';ui.startBandana=d.item;},mailbox:()=>ui.modals.push({kind:'mailbox'}),claimMail:d=>{const before=Q17.rewardSnapshot(s);if(S.claimMail(s,+d.day,clock.now()))showGrants(before);},useItem:d=>S.useItem(s,d.item,clock.now()),buyFurniture:d=>S.buyFurniture(s,d.item,clock.now()),placeFurniture:d=>{const z=zonesForSpace(s.space)[0];let done=false;for(let j=0;j<z.rows&&!done;j++)for(let i=0;i<z.cols&&!done;i++)done=S.placeFurniture(s,d.item,[i,j]);S.syncRoutes(s,w);},unlockPopup:()=>ui.modals.unshift({kind:'spaceUnlock'}),spaceBuy:d=>S.unlockSpace(s,d.kind,d.id,d.via,clock.now()),upgrade:d=>{if(!S.buyUpgrade(s,d.kind,clock.now()))why(S.upgradeCheck(s,d.kind));},mission:()=>open('quests'),
 heartReset:()=>{S.useHeartReset(s,clock.now());},
 setLang:d=>{s.settings.language=d.lang;applyStatic();},toggle:d=>{s.settings[d.k]=!s.settings[d.k];},
 reset:()=>ui.modals.unshift({kind:'dialogue',variant:'warning',actor:'dongu',text:L('set.resetQ'),yes:()=>{localStorage.removeItem(CFG.saveKey);s=S.newState(clock.now());w=S.newWorld(s,r);close();}}),
 stain:()=>{if(S.cleanStain(s))toast(L('toast.cleaned'));},
 pickShiba:d=>{const id=+d.shiba;ui.sel=ui.sel===id?null:id;if(ui.sel!=null)toast(L('cafe.pick'));},
 seat:d=>{if(ui.sel==null)return;if(S.deliver(s,w,ui.sel,+d.cust,clock.now()))ui.sel=null;},
 langPick:d=>{ui.langPick=d.lang;},langOk:()=>{s.settings.language=ui.langPick;applyStatic();},
 startPick:d=>{ui.startName=$('startName')?.value||'';ui.startPick=d.breed;},
 startGo:()=>{const name=($('startName')?.value||'').trim();if(S.chooseStart(s,ui.startPick,name,r,clock.now(),ui.startBandana)){if(temp){for(const breed of ['red','white','kuro'].filter(b=>b!==ui.startPick).slice(0,2)){const sh=S.makeShiba(s,{breed,level:CFG.startShiba.level,now:clock.now()});sh.placed=true;s.shibas.push(sh);}}w=S.newWorld(s,r);}},
 modalOk:()=>{ui.modals.shift();},walkResultOk:()=>{s.walkResults.shift();}, // §17: the result stays in state (시바 red dot) until acknowledged
 confirmYes:()=>{const m=ui.modals[0];if(m?.short){toast('멍코인이 부족해요');return;}ui.modals.shift();m.yes?.();},
};
document.addEventListener('click',e=>{const opener=e.target.closest('[data-open]');if(opener){open(opener.dataset.open);refresh();return;}const nb=e.target.closest('[data-nav]');if(nb){const n=nb.dataset.nav;if(n==='cafe')close();else open(n);refresh();return;}
 const el=e.target.closest('[data-act]');if(!el||el.disabled)return;const f=act[el.dataset.act];if(f){f(el.dataset);refresh();}});
// drag a roaming shiba onto a guest (갱신 105)
let drag=null;
$('scene').addEventListener('pointerdown',e=>{const t=e.target.closest('[data-act=pickShiba]');if(t)drag={id:+t.dataset.shiba,x:e.clientX,y:e.clientY};});
addEventListener('pointerup',e=>{if(!drag)return;const d=drag;drag=null;if(Math.hypot(e.clientX-d.x,e.clientY-d.y)<12)return;
 const seat=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-cust]');if(seat&&S.deliver(s,w,d.id,+seat.dataset.cust,clock.now())){ui.sel=null;refresh();}});
function applyStatic(){document.documentElement.lang=s.settings.language||'ko';document.title=L('app.title');document.querySelectorAll('[data-i18n]').forEach(e=>e.textContent=L(e.dataset.i18n));sceneSig='';panelSig='';modalSig='';}
function refresh(){Q17.settleCraft(s,clock.now());for(const it of S.heartUnlocks(s))toast(it.name+' 해금');handleEvents();renderHUD();renderScene();renderPanel();renderModal();}

// ───────── loop ─────────
let last=performance.now(),saveT=0;
function step(dt){const now=clock.now();
 if(s.started&&s.settings.language){S.consumeElapsed(s,w,dt,now);S.settleHearts(s,now);}
 ageFloats(dt);handleEvents();if(ui.toastT>0&&(ui.toastT-=dt)<=0)$('toast').style.opacity=0;
 if(ui.sel!=null&&!w.sh[ui.sel])ui.sel=null;refresh();
 if((saveT+=dt)>=2){saveT=0;persist();}}
// a long frame gap means the tab was hidden: the player was away → same offline fast-forward as on launch (임시휴무 rule applies)
function catchUp(ms){const now=clock.now(),o=S.fastForward(s,w,now-ms,now,{offline:true});
 if(s.cafe.closed){const re=S.reopenCafe(s,now);ui.modals.push({kind:'offline',o,closed:!!re});w=S.newWorld(s,r);}else if(ms>=60e3)ui.modals.push({kind:'offline',o,closed:false});return o;}
function advance(ms,offline=false){clock.offset+=ms;if(offline)return catchUp(ms);const now=clock.now(),o=S.fastForward(s,w,now-ms,now,{offline:false});refresh();return o;}
function frame(t){let dt=(t-last)/1000;last=t;if(document.hidden){requestAnimationFrame(frame);return;}if(Q.get('still')){requestAnimationFrame(frame);return;}
 step(Math.max(0,dt));requestAnimationFrame(frame);}
let hiddenAt=null;
addEventListener('pagehide',()=>persist());
document.addEventListener('visibilitychange',()=>{if(document.hidden){hiddenAt=clock.now();persist();}else if(hiddenAt!=null){catchUp(clock.now()-hiddenAt);hiddenAt=null;last=performance.now();persist();refresh();}});
const game={CFG,S,iso,debugQuestFixture(enabled){if(!temp)return false;ui.questFixture=!!enabled;panelSig='';refresh();return true;},debugExpand(n){if(!temp||!Number.isSafeInteger(n)||n<0)return false;s.space.unlockedRows=n;S.syncRoutes(s,w);refresh();return true;},get characterPositions(){return [...w.custs,...w.queue,...Object.values(w.sh)].map(c=>({id:c.id,phase:c.phase,cell:c.cell&&[...c.cell]}));},get state(){return s;},get world(){return w;},step:(dt=.1)=>{step(dt);return {custs:w.custs.length,queue:w.queue.length,coins:s.coins};},advance,open,close,clock,ui,refresh};
function openExpand(){const cost=S.spacePrice('row',null,'coins',s),rows=s.space.unlockedRows;ui.modals.unshift({kind:'confirm',land:true,short:cost!=null&&s.coins<cost,text:`${rows+1}번째 땅 넓히기<br><span class="land-price"><img src="${RES.coin}" alt="">${cost==null?'미정':fmt(cost)} 멍코인</span>`,yes:()=>{if(s.space.unlockedRows!==rows)return;if(!S.unlockSpace(s,'row',null,'coins',clock.now()))toast('멍코인이 부족해요');else{S.syncRoutes(s,w);const m=iso.markers.find(x=>x.kind==='row'),cv=$('isomap');if(m)iso.easeBy(m.x-cv.clientWidth/2,m.y-cv.clientHeight/2);}}});renderModal();}
function furnitureShop(){const categories=[['all','전체'],...CFG.furniture.items.map(it=>[it.id,it.name])],selected=ui.furnitureCategory||'all';return `<section data-furniture-shop><div class="chips">${categories.map(([id,name])=>`<button data-act="furnitureCategory" data-item="${id}" aria-pressed="${id===selected}">${name}</button>`).join('')}</div><div class="q17-swipe">${CFG.furniture.items.filter(it=>selected==='all'||it.id===selected).map(it=>`<article class="q17-product"><img src="assets/drive/ui/ui-icon-${it.id}.png" alt=""><strong>${it.name}</strong><button class="furn-buy" data-act="buyFurniture" data-item="${it.id}" ${Number.isFinite(S.furniturePrice(s,it.id))?'':'disabled'}>${priceText(S.furniturePrice(s,it.id),'coin')}</button></article>`).join('')}</div></section>`;}
const grantName=id=>({coins:'멍코인',dia:'다이아',hearts:'하트',paws:'발바닥',expBoost4h:'경험치 부스트',incomeBoost4h:'수익 부스트',cooldownTicket:'쿨타임권',heartReset:'하트 리셋권',capsule:'시바뽑기 캡슐',potionBig:'큰 물약',potionSmall:'작은 물약'})[id]||'미정';
function grantImage(id){return ({coins:()=>img(RES.coin),dia:()=>img(RES.dia),hearts:()=>img(RES.heart),paws:()=>img(RES.paw),potionBig:()=>img(IMG.potion),potionSmall:()=>img(IMG.potionSmall)})[id]?.()||itemIcon(id)||slot('');}
P.friends=()=>({title:'친구',html:`<div class="card" data-friends><div class="btns"><strong>친구 ${s.friends.length}</strong><button data-act="friendAdd">친구 추가</button></div>${temp&&Q.get('fixture')==='friends'?'<small>TEST FIXTURE</small>':''}<div class="q17-swipe">${s.friends.map(f=>`<button class="q17-product" data-act="friendVisit" data-id="${f.id}">${f.breed?`<span class="friend-photo">${img(IMG.shiba(f.breed))}</span>`:slot('')}<strong>${f.name}</strong><span>Lv${f.level??'미정'}</span><small>놀러 가기</small></button>`).join('')||'<p>아직 친구가 없어요</p>'}</div></div>`});
P.profile=id=>{const sh=S.byId(s,id);if(!sh)return P.shibas();const p=sh.profile||CFG.profiles[sh.breed]||{};return {title:nameOf(sh),html:`<article class="card q17-profile" data-profile><h2>${nameOf(sh)}</h2><div class="big">${img(IMG.shiba(sh.breed))}</div>${p.intro?`<p>${p.intro}</p>`:''}${['favSnack','favPlay'].map(k=>p[k]?`<section><h3>${k==='favSnack'?'좋아하는 간식':'좋아하는 놀이'}</h3>${slot('')}<strong>${p[k].name}</strong>${p[k].text?`<p>${p[k].text}</p>`:''}</section>`:'').join('')}<div class="chips">${(sh.friends||[]).map(id=>S.byId(s,id)).filter(Boolean).map(f=>`<button data-act="care" data-id="${f.id}">${img(IMG.shiba(f.breed),nameOf(f))}</button>`).join('')}</div><strong>Lv${sh.level}</strong><button data-act="careOpen" data-id="${id}">돌봄</button></article>`};};
P.cooking=()=>{const recipes=CFG.cooking.recipes,r=recipes.find(r=>r.id===ui.recipe)||recipes[0];return {title:'요리 제작',html:`<section class="card q17-cooking" data-cooking><div class="q17-swipe">${recipes.map((r,i)=>`<button data-act="recipePick" data-item="${r.id}" aria-pressed="${r.id===(ui.recipe||recipes[0].id)}">${Q17.recipeUnlocked(s,r)?'':img('assets/drive/ui/ui-lock.png')}${Q17.recipeName(r,i)}</button>`).join('')}</div><h3>${Q17.recipeName(r,recipes.indexOf(r))}</h3><div class="q17-preview">${slot('')}</div><div>${r.ingredients?Object.entries(r.ingredients).map(([id,n])=>`${CFG.ingredients[id]?.name??'미정'} ${s.ingredients[id]||0}/${n}`).join(' · '):'재료 미정'}</div><p>${cookingFx(r)}</p><h3>재료</h3>${Object.entries(CFG.ingredients).map(([id,it])=>`<div>${slot('')}${it.name??'미정'} · ${s.ingredients[id]||0}<button data-act="ingredientBuy" data-item="${id}" ${it.price==null||s.coins==null||s.coins<it.price*CFG.cooking.ingredientBuyCount?'disabled':''}>${it.price==null?'미정':priceText(it.price*CFG.cooking.ingredientBuyCount,'coin')}</button></div>`).join('')}<button data-open="run">재료 달리기</button><div>${s.craft?'제작 중 '+tfmt((s.craft.until-clock.now())/1000):'제작 시간 '+(r.craftSec??'미정')}</div><button data-act="craft" ${Q17.craftCheck(s,r)?'disabled':''}>제작${Q17.craftCheck(s,r)?' · '+(!Q17.recipeUnlocked(s,r)?'Lv'+r.unlockLevel+' 해금':s.craft?'제작 중':'재료 부족'):''}</button></section>`};};
P.run=()=>({title:'재료 달리기',html:`<section class="card" data-run><div class="chips">${Object.entries(CFG.ingredients).map(([id,it])=>`<span>${slot('')}${it.name??'미정'} · ${Q17.runRewards(s)?.[id]??'미정'}</span>`).join('')}</div><div class="q17-preview">${slot('')}</div><p>Lv${s.run.level??'미정'} · 최고 점수 ${s.run.bestScore??'미정'}</p><div class="q17-swipe">${s.shibas.map(sh=>`<button data-act="runShiba" data-id="${sh.id}" aria-pressed="${s.run.shibas.includes(sh.id)}">${img(IMG.shiba(sh.breed))}${nameOf(sh)}</button>`).join('')}</div><p>${runFx()}</p><p>에너지 ${s.run.energy??'미정'}</p><div class="btns"><button data-act="runPlay">게임하기 · ${CFG.run.playEnergy}</button><button data-act="runSkip" ${!Q17.runRewards(s)||s.run.energy==null||s.run.energy<CFG.run.skipEnergy?'disabled':''}>스킵 · ${!Q17.runRewards(s)||s.run.energy==null?'미정':CFG.run.skipEnergy}</button></div></section>`});
game.openExpand=openExpand;document.addEventListener('change',e=>{const el=e.target.closest('[data-shiba-breed]');if(el)act.shibaView({k:'breed',v:el.value});});
window.__game=game;applyStatic();refresh();requestAnimationFrame(frame);window.__ready=true;

function consumables(){return `<div class=card data-consumables>${[['incomeBoost4h','수익 부스트'],['expBoost4h','경험치 부스트'],['cooldownTicket','쿨타임권']].map(([k,n])=>`<button data-act=useItem data-item=${k} ${s.items[k]>0&&(k==='cooldownTicket'?S.cooldownTarget(s,clock.now()):Number.isFinite(k==='incomeBoost4h'?CFG.itemIncome.boostMul:CFG.stub.expBoost.mul))?'':'disabled'}>${itemIcon(k)}${n} ×${s.items[k]||0}<small class=fx>${ITEM_FX[k]()}</small> · ${k!=='cooldownTicket'&&!Number.isFinite(k==='incomeBoost4h'?CFG.itemIncome.boostMul:CFG.stub.expBoost.mul)?'배율 미정':'사용'}</button>`).join('')}</div>`;}
function unlocks(){return `<div class=card data-unlocks>${[['floor2','', '2층'],...CFG.themes.filter(t=>t.locked).map(t=>['theme',t.id,t.name])].map(([kind,id,name])=>`<div>${name} · Lv${kind==='floor2'?CFG.cafe.expansion2FLevel:CFG.themes.find(t=>t.id===id).unlockLevel} 해금${['coins','dia'].map(via=>`<button data-act=spaceBuy data-kind=${kind} data-id="${id}" data-via=${via} ${S.spaceUnlockCheck(s,kind,id,via)?'disabled':''}>${S.spacePrice(kind,id,via)??'미정'} ${via==='dia'?'다이아':'멍코인'}</button>`).join('')}</div>`).join('')}</div>`;}

// 마을 (2026-10-15): place slots laid out on an empty map area. No village/building art yet → existing icons + labels only (art request).
function villageHtml(){const hurt=s.shibas.filter(sh=>sh.status==='injured'||sh.status==='sick'||sh.status==='hospital').length,V=CFG.village,[W,H]=V.size;
 const info={hospital:[hurt?`치료 필요 ${hurt}`:'','data-act="villageHospital"'],walk:[s.walkResults.length?'결과 도착':'','data-open="walk"'],ingredients:['','data-open="cooking"']};
 return `<button data-act="friendsOpen">친구</button><div class="village-map" data-village data-village-map style="aspect-ratio:${W}/${H};background-image:url(${V.background})">${V.places.filter(p=>p.art?.src).map(p=>{const l=V.lots[p.lot],a=p.art,k=a.scale??1;return `<img class="village-art" data-place-art="${p.id}" src="${a.src}" alt="" style="position:absolute;pointer-events:none;left:${(l.x-a.anchor[0]*k)/W*100}%;top:${(l.y-a.anchor[1]*k)/H*100}%;width:${a.size[0]*k/W*100}%">`;}).join('')}${V.lots.map((l,k)=>{const p=V.places.find(x=>x.lot===k);const st=`left:${l.x/W*100}%;top:${l.y/H*100}%;width:${l.w/W*100}%;height:${l.h/H*100}%`;if(!p)return `<span class="village-lot" data-lot="${k}" style="${st}"></span>`;const [sub,act]=info[p.id]||['',''];return `<button class="village-lot village-place" data-lot="${k}" data-place="${p.id}" ${act} style="${st}">${p.icon?`<img src="${p.icon}" alt="">`:''}<strong>${p.name}</strong>${sub?`<small>${sub}</small>`:''}</button>`;}).join('')}</div>`;}
function bagItems(){const it=s.items;return `<div class="card" data-bag-items><h3>아이템</h3><div class="li"><span class="ico reset" style="width:34px;height:34px"></span><div class="grow nm">${L('shop.heartReset',{n:it.heartReset})}<small class=fx>${ITEM_FX.heartReset()}</small></div><button data-act="heartReset" ${S.canUseHeartReset(s)?'':'disabled'}>${L('shop.use')}</button></div><div class="li">${img(IMG.potion)}<div class="grow nm">${L('dia.potionBig')} ×${it.potionBig} · ${L('dia.potionSmall')} ×${it.potionSmall}<small class=fx>${ITEM_FX.potionBig()} · ${ITEM_FX.potionSmall()}</small></div></div><div class="li"><div class="grow nm">${L('shop.capsule',{n:it.capsule})}</div></div></div>`;}
