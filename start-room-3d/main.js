import {installCoinClean} from "./coin-clean.js";installCoinClean();
import {installWalkProbe,walkTable} from "./walk-frames.js";installWalkProbe();
import * as Q1715 from './q1715.js';
import {UI_ICONS} from './ui-icons.js';
// Spec v3 UI: DOM screens over the pure core in sim.js. Images are the confirmed Drive files in assets/drive/ (see MAP.md), shown
// unmodified (sub-regions via CSS only). A needed image that does not exist is a dashed placeholder slot.
// 갱신 50: no "sticker" sliding — without walk frames (frame data UNSET) characters change place as a cut, never by gliding.
import * as Q17 from './q17.js';
import {startRunScreen} from './run.js';
import {cookingFx,heartFx,menuPickFx,ITEM_FX,ALBA_FX} from './effects.js';
import {createIsoMap} from './isomap.js';
import {HD_FILES,hdPath} from './hd-assets.js';
import {CFG,GACHA_TABLE,pressureAt,isUnset} from './config.js';
import * as S from './sim.js';
import {makeT,LANGS,resolveLang,setLangSource,RELEASE,donguArt} from './i18n.js';
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
// Screen language: saved choice, else device language (1.8). Other modules read the same choice through i18n.js t().
const langNow=()=>resolveLang(s.settings.language,navigator.language);setLangSource(langNow);
const L=makeT(langNow);
if(RELEASE&&typeof document!=='undefined')document.documentElement.classList.add('shiba-release'); // 출시 빌드: 준비 중인 자원 상점 '+' 숨김
const LF=(k,fb)=>{const v=L(k);return v===k?fb:v;}; // config data names: STR text by key, config value as fallback
const ui={seen:{menuDone:false},knownMenus:null,nav:'cafe',panel:null,arg:null,sel:null,modals:[],toastT:0,walkPick:null,walkAlba:new Set(),trainPick:{},lpOpen:{}};

// ───────── images (assets/drive, MAP.md) ─────────
const IMG={shiba:b=>`assets/drive/shiba-${b}.png`,get dongu(){return donguArt('sprite',langNow());},four:'assets/drive/shiba-four.webp',
 guest:k=>`assets/drive/guest-sitting-${k}-final.png`,
 walkPose:{sesame:'assets/drive/pose-sesame-walk.png',kuro:'assets/drive/pose-kuro-walk.png'},sleepPose:{sesame:'assets/drive/pose-sesame-sleep.png',kuro:'assets/drive/pose-kuro-sleep.png'},
 reqShiba:'assets/drive/request-icon-shiba_256.png',reqTrick:'assets/drive/request-icon-trick_256.png',snack:'assets/drive/T-01-basic-snack_256.png',toy:'assets/drive/T-03-rope-toy_256.png',
 potion:'assets/drive/mung-potion_256.png',potionSmall:'assets/drive/mung-potion-small_256.png'};
// 그림이 resource icons (MAP.md '그림이 UI icons'): top bar, price buttons, floats. ico(k) = small inline icon before a number.
const RES={coin:'assets/drive/ui/res-coin.png',heart:'assets/drive/ui/res-heart.png',heartEmpty:'assets/drive/ui/res-heart-empty.png',dia:'assets/drive/ui/res-diamond.png',paw:'assets/drive/ui/res-paw.png'};
const ico=k=>`<img class="res-ico" data-res="${k}" src="${RES[k]}" alt="" draggable="false">`;
const slot=(label,wpx=54,hpx=54)=>`<span class="slot" style="width:${wpx}px;height:${hpx}px">${label}</span>`;
const islot=()=>`<span class="slot" style="width:20px;height:20px" title="${L('app.missingImg')}"></span>`;
const img=(src,alt='')=>`<img src="${src}"${HD_FILES.has(src)?` srcset="${hdPath(src)} 2x"`:''} alt="${alt}" draggable="false">`;
const shibaImg=sh=>{const st=S.statusOf(s,sh);if(st==='sleeping'&&IMG.sleepPose[sh.breed])return IMG.sleepPose[sh.breed];if(st==='walking'&&IMG.walkPose[sh.breed])return IMG.walkPose[sh.breed];return IMG.shiba(sh.breed);};

// ───────── formatting ─────────
// 금액·수량 표시는 모두 fmt 하나로: 언어와 상관없이 세 자리마다 쉼표(2,400). money = 코인 금액.
const fmt=n=>isUnset(n)?L('unset'):String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g,',');
// HUD-only short form so big balances fit the one-row top bar (exact value goes to the pill title/aria-label).
// ko: 9,999 · 3만 · 12.3만 · 1,234만 · 1.2억 / en: 9,999 · 30K · 12.3M · 1.2B — one decimal (cut, not rounded) only below 100 of the unit, '.0' dropped.
const fmtShort=n=>{if(isUnset(n))return fmt(n);const v=Math.floor(Math.abs(n)),sg=n<0?'-':'';if(v<1e4)return fmt(n);
 const U=langNow()==='ko'?[[1e8,'억'],[1e4,'만']]:[[1e9,'B'],[1e6,'M'],[1e3,'K']],[d,u]=U.find(([d])=>v>=d),t=Math.floor(v*10/d);return sg+fmt(Math.floor(t/10))+(t%10&&t<1000?'.'+t%10:'')+u;};
const COIN_HTML='<img class="ci" src="assets/drive/ui/res-coin.png" alt="">';const money=n=>isUnset(n)?L('unset'):COIN_HTML+fmt(n);
const f2=n=>n==null?L('unset'):(Math.round(n*100)/100).toString();
const tfmt=sec=>{sec=Math.max(0,Math.ceil(sec));const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),x=sec%60;return h?`${h}:${String(m).padStart(2,'0')}:${String(x).padStart(2,'0')}`:`${m}:${String(x).padStart(2,'0')}`;};
const nameOf=sh=>sh.name||L('shiba.breed.'+sh.breed);
const bar=(k,col)=>isUnset(k)?L('unset'):`<div class="bar"><i style="width:${Math.round(Math.max(0,Math.min(1,k))*100)}%${col?';background:'+col:''}"></i></div>`;
function toast(t){const e=$('toast');e.innerHTML=t;e.style.opacity=1;ui.toastT=2.2;}
const reason={slot:'toast.slot',none:'toast.none',ticket:'toast.ticket',owned:'toast.owned',fatigue:'toast.fatigue',busy:'toast.devBusy',coins:'toast.coins',hearts:'toast.hearts',slots:'toast.slots',unset:'toast.unset',last:'toast.last',dia:'toast.dia',odds:'toast.odds'};
function why(code){toast(L(reason[code]||'toast.unset'));}
// 갱신 135-2: 남은 시간 바로 완료 버튼 (1분당 1다이아, 1분 올림)
function skipBtn(t){const left=S.skipLeftSec(s,t,clock.now());if(!(left>0))return '';const cost=S.skipCost(left);
 return `<button class="sec" data-act="skip" data-type="${t.type}" data-id="${t.id??''}" ${s.dia<cost?'disabled':''}>${L('skip.btn',{n:ico('dia')+fmt(cost)})}</button>`;}
const mmss=sec=>{sec=Math.max(0,Math.ceil(sec));return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;}; // §17-1 '04:32'

// ───────── HUD ─────────
// §17-1: hearts as CFG.hearts.slots slots (filled/empty icons); hearts above the slot count → all slots filled + small '+N'; mm:ss to the next heart while below the regen cap
function renderHearts(now){const cap=CFG.hearts.slots,n=Math.max(0,Math.floor(s.hearts||0)),el=$('hearts'),sig=n+'/'+cap;
 if(el.dataset.sig!==sig){el.dataset.sig=sig;el.innerHTML=Array.from({length:cap},(_,i)=>`<img class="heart-slot" data-full="${i<n?1:0}" src="${i<n?RES.heart:RES.heartEmpty}" alt="" draggable="false">`).join('')+(n>cap?`<small class="heart-more">${n-cap>99?'99+':'+'+fmt(n-cap)}</small>`:'');}
 const nh=S.nextHeartInSec(s,now);$('heartT').hidden=nh==null;$('heartT').textContent=nh==null?'':mmss(nh);
 el.parentElement.setAttribute('aria-label',L('hud.heartsAria',{n:fmt(n)})+(nh==null?'':' · '+L('hud.nextHeart',{t:mmss(nh)})));el.parentElement.title=el.parentElement.getAttribute('aria-label');}
function renderHUD(){const now=clock.now();$('coins').textContent=fmtShort(s.coins);$('dia').textContent=fmtShort(s.dia);renderHearts(now);
 const C=s.cafe,need=S.cafeNeed(C.level);$('lvl').textContent=String(C.level);$('lvl').setAttribute('aria-label',L('hud.level',{lv:C.level}));$('expBar').style.width=(C.level>=CFG.cafe.maxLevel?100:need==null?0:Math.min(100,C.exp/need*100))+'%';
 $('expBar').parentElement.title=C.level>=CFG.cafe.maxLevel?L('app.maxLevel'):need==null?L('app.unset'):`${fmt(C.exp)} / ${fmt(need)}`;
 const exp=$('cafeExp');exp.setAttribute('aria-valuemin','0');exp.setAttribute('aria-valuemax',String(need??100));exp.setAttribute('aria-valuetext',exp.title=$('expBar').parentElement.title);if(need==null)exp.removeAttribute('aria-valuenow');else exp.setAttribute('aria-valuenow',String(Math.min(C.exp,need)));
 for(const [id,k,v] of [['coins','hud.aria.coinLedger',s.coins],['dia','hud.currency.dia',s.dia]]){const p=$(id).parentElement,t=L(k)+' '+fmt(v);p.title=t;p.setAttribute('aria-label',t);}
 $('paws').parentElement.title=L('hud.paws')+' '+$('paws').textContent;
 $('rep').textContent=L('hud.rep',{rep:Math.round(C.rep)});$('mgr').textContent=S.managerActive(s,now)?L('hud.manager',{t:tfmt((C.managerUntil-now)/1000)}):'';
 $('questDot').hidden=!Q1715.progress(S.questTasks(s,clock.now()))?.n;$('entryMailDot').hidden=!S.mailbox(s,now).some(m=>!m.claimed);const qp=Q1715.progress(S.questTasks(s,clock.now()));$('questGuide').hidden=!qp;$('questGuide').innerHTML=qp?L('hud.mission')+' '+qp.n+'/'+qp.m+`<progress aria-label="${L('hud.mission')}" value=${qp.n} max=${qp.m||1}></progress>`:'';
 $('boostChip').innerHTML=[[L('hud.boost.income'),'boostUntil'],[L('hud.boost.exp'),'expBoostUntil']].filter(([,k])=>C[k]>now).map(([n,k])=>itemIcon(k==='boostUntil'?'incomeBoost4h':'expBoost4h')+n+' '+tfmt((C[k]-now)/1000)).join(' · ');
 $('closed').hidden=!C.closed;$('closed').textContent=L('hud.closed');}

let sceneSig='';
const iso=createIsoMap($('isomap'),{onChange:()=>{S.syncRoutes(s,w);persist();},onExpand:()=>openExpand(),onBlocked:message=>toast(message||L('edit.blocked')),onEditChange:()=>{mainTab='bag';menuSig='';renderMainMenu();}});
function renderScene(){iso.draw(s,w);renderMainMenu();}
$('scene').append(iso.actions);
let menuSig='',mainTab=iso.edit?'bag':DEFAULT_TAB;
// §16-1 tab row: built once from TABS; icons only from existing images, red dots from tabBadges (real state).
$('mainTabs').innerHTML=TABS.map(t=>`<button data-main-tab="${t.id}" class="${t.main?'main':''}" aria-label="${t.label}" data-i18n-attr="aria-label:tab.${t.id}"><i class="tab-dot" aria-hidden="true" hidden></i><span class="tab-ico" style="${t.scaleKey?`transform:scale(${CFG.tabs.iconScale[t.scaleKey]})`:''}">${t.icon?img(t.icon):''}</span><span class="tab-label" data-i18n="tab.${t.id}">${t.label}</span></button>`).join('');
function renderTabs(now){
 // a development finished (any path: tick, fast-forward, instant finish) while 가게 관리 was not open → dot until it is opened
 if(ui.knownMenus!=null&&s.menus.length>ui.knownMenus&&mainTab!=='manage')ui.seen.menuDone=true;ui.knownMenus=s.menus.length;
 const b=tabBadges(s,now,ui.seen);
 $('app')?.setAttribute?.('data-tab',mainTab);document.querySelectorAll('[data-main-tab]').forEach(e=>{const on=!!b[e.dataset.mainTab],t=TABS.find(x=>x.id===e.dataset.mainTab);e.classList.toggle('active',e.dataset.mainTab===mainTab);e.querySelector('.tab-dot').hidden=!on;e.dataset.badge=on?'1':'0';e.setAttribute('aria-label',t.label+(on?' · '+L('tab.alert'):''));});}
function renderMainMenu(){
 const now=clock.now();renderTabs(now);
 $('paws').textContent=fmt(s.shibas.reduce((n,sh)=>n+(sh.paws||0),0));$('paws').parentElement.title=L('hud.paws')+' '+$('paws').textContent;
 const sig=JSON.stringify([mainTab,ui.seen.menuDone,s,w.custs.map(c=>[c.phase,c.request]),w.queue.length,w.recent,ui.accType,iso.edit,s.settings.language,CFG.itemIncome.boostMul,CFG.stub.expBoost.mul,Math.floor(now/1000)]);
 if(sig===menuSig)return;menuSig=sig;
 const [title,hint]=[L('tab.'+mainTab),L('mm.hint.'+mainTab)];// §17-4: 가게 관리 shows one short summary line instead of the hint ('착석 2 · 대기 2'; '결제 미정' only while the last payment is undecided)
 document.querySelector('.menu-heading').innerHTML=title+(mainTab==='manage'?` <small data-customer-status>${L('mm.custStatus',{seated:w.custs.filter(c=>c.phase==='seated').length,queue:w.queue.length})}${w.recent.at(-1)?.pending&&!RELEASE?' · '+L('mm.payUnset'):''}</small>`:mainTab==='bag'?'':' <small>'+hint+'</small>');
 $('menuList').classList.add('tab-list');
 // §17: 가게 관리 = café status + popup buttons only (the old menu card grid is gone; 메뉴 개발 lives in its popup)
 if(mainTab==='manage'){const scroll=$('menuList').scrollTop;$('menuList').innerHTML=manageTop(now)+`${Q17.runUnlocked(s)?`<button data-open="run">${L('run.title')}</button>`:`<button class="run-locked" data-run-locked disabled><img src="assets/drive/ui/ui-lock.png" alt=""><span>${L('run.title')} · ${L('app.locked',{lv:CFG.run.unlockLevel})}</span></button>`}<div class=chips>${w.custs.filter(c=>c.request&&!c.fulfilled).map(c=>`<button data-act=guestRequest data-id=${c.id}>${L('mm.guestRequest')}</button>`).join('')}</div>`;$('menuList').scrollTop=scroll;return;}
 if(mainTab==='village'){const scroll=$('menuList').scrollTop;$('menuList').innerHTML=`<button class="village-close" data-act="villageClose" aria-label="${L('app.close')}">${img(UI_ICONS.close)}</button>`+villageHtml();$('menuList').scrollTop=scroll;return;}
 $('app')?.classList?.toggle('editing',!!iso.edit);
 const content=iso.edit?editStorage():mainTab==='shiba'?P.shibas().html:mainTab==='shop'?P.shop().html:bagGrid();const scroll=$('menuList').scrollTop;$('menuList').innerHTML=content;$('menuList').scrollTop=scroll;$('menuList').querySelector('[data-wall-inventory-place]')?.addEventListener('click',()=>{iso.setEdit(true);iso.actions.querySelector('[data-wall-add]').click();});$('menuList').querySelector('[data-edit-toggle]')?.addEventListener('click',()=>{iso.setEdit(!iso.edit);});
}
document.querySelectorAll('[data-main-tab]').forEach(b=>b.addEventListener('click',()=>{close();mainTab=b.dataset.mainTab;if(mainTab==='manage')ui.seen.menuDone=false;menuSig='';renderMainMenu();}));
// 가게 관리 (§17): popup buttons (메뉴 개발 · 업그레이드), §15 ledger, café status (level, current development, upgrade levels).
// 수인님 10-15 UI: 위쪽은 카페 Lv 진행 막대 한 줄, 그 아래 상점처럼 큰 탭 3개(메뉴 개발·업그레이드·알바채용; 손익계산서는 위 코인 숫자 → 팝업). 글자만 있는 상자는 없앰.
function manageTop(now){const C=s.cafe,need=S.cafeNeed(C.level),max=C.level>=CFG.cafe.maxLevel;
 return `<div class="manage-top" data-manage-top><div class="manage-lv" data-cafe-level>${img(UI_ICONS.lvBadge)}<b>${L('mm.cafeLv',{lv:C.level})}</b>${bar(max?1:need==null?0:C.exp/need)}<small>${fmt(C.exp)} / ${max?L('app.max'):need==null?L('app.unset'):fmt(need)}</small></div>
 <div class="chips shop-tabs manage-tabs" data-manage-tabs><button class="big" data-act="listOpen" data-list="menu">${img(UI_ICONS.manageTab.menu)}${L('mm.menuDev')}${s.menuDev?`<small data-manage-dev data-dev="${s.menuDev.id}">${L('shop.developingShort')}</small>`:''}</button><button data-act="listOpen" data-list="upgrade">${img(UI_ICONS.manageTab.upgrade)}${L('mm.upgrade')}</button><button data-act="listOpen" data-list="alba" data-manage-hire>${img(UI_ICONS.manageTab.hire)}${L('mm.hire')}</button></div></div>`;}
function handleEvents(){for(const e of w.events.splice(0)){
 if(e.type==='menuDone')toast(L('toast.menuDone',{name:L('menu.'+e.id)}));
 if(e.type==='order')toast(L('toast.order',{name:L('menu.'+e.order)}));
 if(e.type==='leave')floatsFor(e);
 if(e.type==='angry')addFloat('angry',e.cell,0,e.id);
 if(e.type==='leave')toast(e.coins==null?`${L('menu.'+e.order)}${RELEASE?'':' · '+L('mm.payUnset')}`:L('toast.coinsPlus',{n:(langNow()==='ko'?'':ico('coin'))+f2(e.coins)}));
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
  <div class="shiba-tools" data-shiba-filter data-shiba-sort><select data-shiba-breed aria-label="${L('shibas.breedAria')}">${['all',...CFG.breeds].map(b=>`<option value="${b}" ${f.breed===b?'selected':''}>${b==='all'?L('app.all'):L('shiba.breed.'+b)}</option>`).join('')}</select><button class="chip" data-act="shibaView" data-k="sort" data-v="${f.sort==='levelAsc'?'levelDesc':'levelAsc'}" data-sort-toggle="${f.sort}">${L('shibas.level')} ${f.sort==='levelAsc'?'↑':'↓'}</button></div>
  <div class="shiba-grid" data-shiba-grid>${list.map(sh=>{const st=S.statusOf(s,sh),r=shibaRisk(sh,st);return `<div class="sq" data-shiba-cell="${sh.id}"><button class="sq-pic" data-act="care" data-id="${sh.id}">${img(shibaImg(sh),nameOf(sh))}<i class="risk ${r}" data-risk="${r}" title="${L('risk.'+r)}"></i><span class="sq-where">${sh.placed?L('shibas.placed'):L('shibas.home')}</span><span class="sq-lv">Lv${sh.level}</span></button><button class="sq-btn${sh.placed?' sec':''}" data-act="place" data-id="${sh.id}" data-on="${sh.placed?0:1}" ${!sh.placed&&S.placeCheck(s,sh.id)?'disabled':''}>${sh.placed?L('shibas.putIn'):L('shibas.takeOut')}</button></div>`;}).join('')||`<div class="note">${L('shibas.none')}</div>`}</div>`;
 h+=`</div><div class="card"><div class="li"><div class="pt">${img(IMG.dongu)}</div><div class="grow"><div class="nm">${L('char.dongu.name')}</div><div class="sub sub-wrap">${L('shibas.dongu')}</div></div>
  <button class="${s.dongu.placed?'sec':''}" data-act="dongu">${s.dongu.placed?L('dongu.unplace'):L('care.place')}</button></div></div>`;return {title:L('shibas.title'),html:h};};
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
 h+=RELEASE?'</div>':`</div><h3>${L('shop.accSpecial')}</h3><div class="li">${slot(L('app.unset'))}<div class="grow note">${L('shop.accSpecialNote',{dia:SP.priceDia})}</div><button disabled>${priceText(SP.priceDia,'dia')} · ${L('app.unset')}</button></div></div>`;
 return h;}
P.care=id=>{const sh=S.byId(s,id);if(!sh)return P.shibas();const st=S.statusOf(s,sh),now=clock.now(),need=S.pawsToNext(sh.level);
 let h=`<div class="card"><div class="big tama" data-tama>${img(shibaImg(sh),nameOf(sh))}<i class="risk ${shibaRisk(sh,st)}" data-risk="${shibaRisk(sh,st)}"></i></div><div style="text-align:center"><div class="nm" style="font-size:18px;font-weight:900">${nameOf(sh)}</div>
  <div class="note">${L('shiba.breed.'+sh.breed)} · ${RELEASE&&!sh.personality?'':`${L('care.personality')}: ${sh.personality?L('per.'+sh.personality):L('app.oddsUnset')} · `}${statusText(sh,st)}</div></div>
  <div class="g"><span>${L('care.level')} ${sh.level}</span>${bar(need?sh.paws/need:1)}${ico('paw')}</div><div class="btns"><span class="note grow">${need?L('care.paws',{n:fmt(sh.paws),need:fmt(need)}):L('care.pawsMax',{n:fmt(sh.paws)})} · ${L('care.levelEff',{m:f2(S.levelEffect(sh.level))})}</span>
   ${need?`<button data-act="levelUp" data-id="${id}" ${S.levelUpCheck(s,id)?'disabled':''}>${L('care.levelUp',{n:ico('paw')+fmt(need)})}</button>`:''}</div><div class="note">${L('care.pawsSrc')}</div>
  <div class="g"><span>${L('care.intimacy')}</span>${(()=>{const A=CFG.heartUse.affinity,v=sh.affinity??A.start;return `${bar(isUnset(v)||!A.max?null:v/A.max,'#e98aa0')}<span>${isUnset(v)?L('unset'):fmt(v)+' / '+A.max}</span>`;})()}</div>
  <div class="g"><span>${L('care.intel')}</span>${bar(S.intelligence(sh)/100,'#6aa5d8')}<span>${S.intelligence(sh)}</span></div></div>`;
 h+=`<div class="card"><button data-open="cooking">${L('cook.make')}</button>${CFG.cooking.recipes.map((r,i)=>`<button data-act="feedDish" data-id="${id}" data-item="${r.id}" ${Q17.feedCheck(s,sh,r.id)?'disabled':''}>${Q17.recipeName(r,i)} · ${r.effect.full==null||r.effect.happy==null||sh.g.full==null||sh.g.happy==null?L('app.unset'):L('cook.feed')}</button>`).join('')}</div>`;
 h+=`<div class="card"><div class="note">${L('care.affinity')} ${sh.affinity??CFG.heartUse.affinity.start} / ${CFG.heartUse.affinity.max}</div>${CFG.gauges.map(k=>`<div class="g"><span>${L('g.'+k)}</span>${bar(isUnset(sh.g[k])?null:sh.g[k]/100,(k==='dirt'||k==='fatigue'||k==='boredom')?'#b58a5a':'#7fbf6a')}<span>${f2(sh.g[k])}</span></div>`).join('')}
  <div class="note">${L('care.cond',{m:f2(S.conditionMul(sh))})}</div>
  <div class="btns"><button data-act="play" data-id="${id}" ${S.careCheck(s,id,'play')?'disabled':''}>${img(IMG.toy)}${L('care.play',{n:CFG.care.play.hearts})}</button>
   <button disabled>${islot()}${L('care.feed')} · ${L('app.unset')}</button><button disabled>${img(IMG.snack)}${L('care.snack')} · ${L('app.unset')}</button>
   <button disabled>${islot()}${L('care.bath')} · ${L('app.unset')}</button><button disabled>${L('care.sleep')} · ${L('app.unset')}</button>
   <button data-act="walkFor" data-id="${id}" ${st!=='ok'?'disabled':''}>${L('care.walk')}</button></div>${RELEASE?'':`<div class="note">${L('care.feed')}·${L('care.snack')}·${L('care.bath')}·${L('care.sleep')}: ${L('care.unsetNote')}</div>`}`;
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
   ${RELEASE?'':`<button disabled>${L('walk.stop')}</button>`}</div>`;}
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
P.alba=()=>{const now=clock.now(),G=CFG.alba.manager;let h=`<div class="card" data-alba><button data-act="listOpen" data-list="alba">${L('alba.pick')}</button><div class="note">${L('shop.manager')} · ${S.managerActive(s,now)?L('hud.manager',{t:tfmt((s.cafe.managerUntil-now)/1000)}):s.cafe.level<G.unlock?L('app.locked',{lv:G.unlock}):L('alba.idle')}</div></div>`;
 const cds=s.shibas.flatMap(sh=>['daycare','walk','trainer'].filter(k=>(sh.cd[k]||0)>now).map(k=>`<div class="li"><span class="grow note">${nameOf(sh)} · ${ALBA_NAME(k)} ${L('app.cooldown',{t:tfmt((sh.cd[k]-now)/1000)})}</span>${skipBtn({type:k,id:sh.id})}</div>`));
 return {title:L('alba.title'),html:h+`<div class="card"><h3>${L('alba.cooldown')}</h3>${cds.join('')||`<div class="note">${L('alba.noCooldown')}</div>`}</div>`};};
const ALBA_NAME=k=>L({daycare:'care.daycare',walk:'walk.alba',trainer:'care.trainer',manager:'shop.manager'}[k]);
const hm=sec=>{const h=Math.floor(sec/3600),m=Math.round(sec%3600/60);return h&&m?L('app.hm',{h,m}):h?L('app.h',{h}):L('app.m',{m});};
// 갱신 136: 개발 중인 메뉴 1개 — 남은 시간, 진행 막대, 바로 완료(135-2)
function devCard(now){const D=s.menuDev;if(!D)return `<div class="note">${L('shop.devIdle')}</div>`;const m=S.menuItem(D.id),left=(D.until-now)/1000;
 return `<div class="li dev" data-dev="${D.id}"><div class="pt">${img('assets/drive/'+m.img)}</div><div class="grow"><div class="nm">${L('shop.developing',{name:L('menu.'+D.id)})}</div>
  ${bar((now-D.startAt)/(D.until-D.startAt))}<div class="sub">${L('shop.devLeft',{t:tfmt(left)})}</div></div>${skipBtn({type:'menu'})}</div>`;}
// 갱신 137 시바뽑기 — 확률표 UNSET(질문 9(바))이면 버튼 3개 모두 비활성 '확률 미정'
function gachaCard(){const G=CFG.gacha;return `<div class="card" data-gacha><h3>${L('shop.gacha')}</h3><button class="sec" data-act="gachaOdds">${L('gacha.oddsBtn')}</button><div class="note">${G.startLevel==null?L('gacha.startUnset'):''} · ${L('gacha.stamp')} ${fmt(s.gachaStamps||0)}/${GACHA_TABLE.pity.stampsForPick}</div><div class="btns">${[1,G.tenCount].map(n=>`<button data-act="gacha" data-n="${n}" ${S.gachaCheck(s,n)?'disabled':''}>${priceText(S.gachaPrice(n),'dia')}</button>`).join('')}<button data-act="gacha" data-n="1" data-ticket="1" ${S.gachaCheck(s,1,{ticket:true})?'disabled':''}>${L('gacha.capsule',{n:s.items.capsule})}</button></div><div class="note">${L('gacha.pityNote',{n:GACHA_TABLE.pity.stampsForPick})}</div><div class="btns">${CFG.breeds.map(b=>`<button data-act="pityPick" data-breed="${b}" ${S.pityCheck(s,b)?'disabled':''}>${L('shiba.breed.'+b)}</button>`).join('')}</div></div>`;}

// §17-4 short: level + bar, one status line, one upgrade-level line
function cafeCard(){const C=s.cafe,need=S.cafeNeed(C.level);return `<div class="card" data-cafe-level><h3>${L('mm.cafeLv',{lv:C.level})} <small class="note">${fmt(C.exp)} / ${C.level>=CFG.cafe.maxLevel?L('app.max'):need==null?L('app.unset'):fmt(need)}</small></h3>${bar(need==null?0:C.exp/need)}<div class="note">${L('cafe.summary',{rep:Math.round(C.rep),slots:S.slotsOf(s),cap:S.capOf(s)})}</div><div class="note" data-upgrade-levels>${UPGRADES.map(k=>`${L('upgrade.short.'+k)} Lv${S.upgradeLevel(s,k)}`).join(' · ')}</div></div>`;}
function shopSlots(){return `<div class="card" data-shop-slots><h3>${L('acc.slotsTitle')}</h3>${s.shibas.map(sh=>`<div class="li"><div class="pt">${img(IMG.shiba(sh.breed))}</div><div class="grow"><b>${nameOf(sh)}</b><div class="note">${sh.accUnlocked?L('acc.slotOpen')+' · '+(sh.acc?accName(sh.acc):L('acc.slotEmpty')):L('acc.slotLocked')}</div><div class="btns">${sh.accUnlocked?`<button class="sec" data-act="care" data-id="${sh.id}">${L('acc.careBtn')}</button>`:`<button data-act="accUnlock" data-id="${sh.id}" data-via="paws" ${S.accUnlockCheck(s,sh.id,'paws')?'disabled':''}>${priceText(CFG.accessory.unlockPaws,'paw')}</button><button data-act="accUnlock" data-id="${sh.id}" data-via="dia" ${S.accUnlockCheck(s,sh.id,'dia')?'disabled':''}>${priceText(CFG.accessory.unlockDia,'dia')}</button>`}</div></div></div>`).join('')}</div>`;}
function inventoryCard(){const items=S.bandanaItems().filter(it=>S.accOwned(s,it.id)>0);return `<div class="card" data-inventory><h3>${L('acc.bagTitle')}</h3>${items.length?items.map(it=>`<div class="li">${bandHtml(it.id)}<div class="grow"><b>${accName(it.id)}</b><div class="note">${L('acc.counts',{own:S.accOwned(s,it.id),worn:S.accWorn(s,it.id),bag:s.accInv[it.id]||0})}</div>${s.shibas.map(sh=>`<button class="sec" data-act="${sh.acc===it.id?'unequip':'equip'}" data-id="${sh.id}" data-item="${it.id}" ${sh.acc===it.id?'':S.equipCheck(s,sh.id,it.id)?'disabled':''}>${nameOf(sh)} · ${sh.acc===it.id?L('acc.unequip'):sh.accUnlocked?L('acc.equip'):L('acc.slotLocked')}</button>`).join('')}</div></div>`).join(''):`<div class="note">${L('acc.none')}</div>`}</div>`;}
// §16-1 상점 tab: the old 가게 tab minus café level/ledger (→ 가게 관리) and manager (→ 알바). Only the bandana purchase works.
P.shopLegacy=()=>{let h=`<button data-act="unlockPopup">${L('space.unlock')}</button>${unlocks()}${accShop()}${shopSlots()}<div class="card" hidden data-old-bag><h3>${L('shop.bag')}</h3><div class="li"><span class="ico reset" style="width:34px;height:34px"></span><div class="grow nm">${L('shop.heartReset',{n:s.items.heartReset})}</div><button data-act="heartReset" ${S.canUseHeartReset(s)?'':'disabled'}>${L('shop.use')}</button></div>
   <div class="li">${slot(L('app.missingImg'),34,34)}<div class="grow nm">${L('shop.capsule',{n:s.items.capsule})}</div></div>
   <div class="li">${img(IMG.potion)}<div class="grow nm">${L('dia.potionBig')} ×${s.items.potionBig} · ${L('dia.potionSmall')} ×${s.items.potionSmall}</div></div></div>
  ${gachaCard()}
  <div class="card"><h3>${L('shop.dia')}</h3><div class="note">${langNow()==='ko'?L('shop.diaRate',{won:CFG.stub.diaPriceWon})+' · ':''}${L('app.payment')}</div>
   ${[['cooldown1',CFG.cooldownTicketDia.one],['cooldown5',CFG.cooldownTicketDia.five],['potionBig',CFG.potion.bigDia],['potionSmall',CFG.potion.smallDia],['boost',CFG.itemIncome.priceDia],['expBoost',CFG.stub.expBoost.priceDia],['slot',CFG.cafe.paidSlotUnlockDia]]
    .map(([k,p])=>`<div class="li">${ico('dia')}<div class="grow">${L('dia.'+k)}</div><button disabled>${priceText(p,'dia')}</button></div>`).join('')}</div>`;
 return {title:L('shop.title'),html:h};};
P.shop=()=>({title:L('shop.title'),html:Q1715.shopHtml(CFG,ui.shopTab,id=>S.furniturePrice(s,id))+(ui.shopTab==='cash'?P.shopLegacy().html:ui.shopTab==='theme'?unlocks():'')});
P.quests=()=>({title:L('hud.mission'),html:Q1715.questsHtml(CFG.quests,ui.questTab,S.questTasks(s,clock.now()),s.dia)});
P.settings=()=>{const h=`<div class="card"><h3>${L('settings.language')}</h3><div class="btns">${LANGS.map(c=>`<button class="${s.settings.language===c?'':'sec'}" data-act="setLang" data-lang="${c}">${makeT(()=>c)('lang.name.'+c)}</button>`).join('')}</div></div>
 <div class="card"><div class="btns"><button class="sec" data-act="toggle" data-k="sound">${L('set.sound')}: ${s.settings.sound?'ON':'OFF'}</button><button class="sec" data-act="toggle" data-k="music">${L('set.music')}: ${s.settings.music?'ON':'OFF'}</button></div></div>
 ${RELEASE?'':`<div class="card"><button data-act="income">${L('set.income')}</button></div>`}
 ${RELEASE?'':`<div class="card"><h3>${L('set.stubs')}</h3><div class="note">${L('stub.list')}</div></div>`}
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
 const sc=$('pbody').scrollTop;$('ptitle').textContent=v.title;$('pbody').innerHTML=v.html;$('pbody').scrollTop=sc;$('panel').dataset.panel=ui.panel;$('panel').style.setProperty('--cook-h',(CFG.cooking.popupHeightPct??0.75)*100+'%');$('panel').dataset.align=CFG.cooking.popupAlign||'center';$('panel').hidden=false;}
function open(name,arg=null){if(!P[name]){if(LP[name]){act.listOpen({list:name,kind:arg});refresh();}return;} // 'menu' = 메뉴 개발 목록 팝업 (P.menu 없음)
 ui.panel=name;ui.arg=arg;ui.nav=['shibas','care'].includes(name)?'shibas':name==='income'?ui.nav:name==='hospital'?'village':name;renderPanel(true);navState();}
function close(){ui.panel=null;$('pbody').innerHTML='';panelSig='';ui.nav='cafe';renderPanel();navState();}
function navState(){document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('on',b.dataset.nav===ui.nav));}

// ───────── §16-2 list popup ─────────
// Row: {key, face (existing image path or null → empty slot), portrait, name, effect (§17-4: ONE short line ~10 chars), detail (shown only after
//  tapping the card body), locked (→ effect 'Lv{N} 해금' only, no price button), price (config value; null → '미정' disabled),
//  unit 'coin'|'dia', label (button text instead of price), disabled, act, data}. Prices come from CFG only.
const LP={};
const heartRow=(it,sh=null)=>{const now=clock.now(),locked=it.level==null||s.cafe.level<it.level,c=S.heartUseCheck(s,it.id,sh?.id,now),walk=it.id==='walk';return {key:sh?'shiba-'+sh.id:it.id,face:sh?IMG.shiba(sh.breed):it.art,portrait:!!sh,name:sh?nameOf(sh):LF('heart.item.'+it.id,it.name),effect:locked?(it.level==null?L('app.unset'):lockedLine(it.level)):sh?`${L('care.affinity')} ${sh.affinity??CFG.heartUse.affinity.start} · ${heartFx(it)}`:heartFx(it),locked,price:walk?CFG.walk.heartsPer10Min:it.cost,unit:'heart',label:c==='daily'?L('heart.usedToday'):null,disabled:s.hearts<(walk?CFG.walk.heartsPer10Min:it.cost)||(!walk&&!!c&&!(c==='pick'&&it.shiba)&&!(c==='menu'&&it.menu)),act:walk?'heartWalk':it.shiba&&!sh?'heartPick':it.menu?'heartMenu':'heartUse',data:{item:it.id,id:sh?.id??''}};};
LP.hearts=()=>{const now=clock.now(),a=S.heartAdStatus(s,now),active=S.activeHeartEffects(s,now),ad=S.heartItems().some(it=>it.level!=null&&it.level<=s.cafe.level&&it.cost>s.hearts)?`<button data-act="heartAd" ${a.left||!a.remaining?'disabled':''}>${L('heart.ad',{n:CFG.heartUse.ads.grant})}${a.left?' · '+mmss(a.left):!a.remaining?' · '+L('heart.adDone'):''}</button>`:'';return {title:L('heart.title'),top:`<div data-heart-balance>${L('hud.currency.heart')} ${ico('heart')}${s.hearts}</div><div data-heart-active>${active.map(e=>`<div>${LF('heart.item.'+e.id,CFG.heartUse.items.find(x=>x.id===e.id).name)}${e.shibaId?' · '+nameOf(S.byId(s,e.shibaId)||{name:L('shiba.generic')}):''} ${mmss(Math.ceil((e.until-now)/1000))}</div>`).join('')}</div>${ad}`,rows:S.heartItems().map(it=>heartRow(it)),footer:`<button data-act="heartBuy" ${s.dia<CFG.heartUse.buy.dia?'disabled':''}>${L('heart.n',{n:CFG.heartUse.buy.hearts})} = ${priceText(CFG.heartUse.buy.dia,'dia')}</button>${RELEASE?'':`<button data-act="friendsOpen">${L('heart.visit',{n:CFG.heartUse.visit.daily,h:CFG.heartUse.visit.hearts})}</button><button data-act="heartStub">${L('heart.invite',{n:CFG.heartUse.invite.daily,h:CFG.heartUse.invite.hearts})}</button>`}`};};
// Reuse the daycare list frame and portrait row, including the same existing shiba images.
LP.heartShiba=id=>({title:L('heart.pickShiba'),rows:s.shibas.map(sh=>heartRow(CFG.heartUse.items.find(x=>x.id===id),sh))});
LP.heartMenu=id=>({title:L('heart.pickMenu'),rows:s.menus.map(key=>{const m=CFG.menu.items.find(x=>x.id===key);return {key,face:m?'assets/drive/'+m.img:null,name:L('menu.'+key),effect:menuPickFx(CFG.heartUse.items.find(x=>x.id===id)),price:CFG.heartUse.items.find(x=>x.id===id).cost,unit:'heart',disabled:s.hearts<CFG.heartUse.items.find(x=>x.id===id).cost,act:'heartUse',data:{item:id,menu:key}};})});

const ITEM_ICONS={incomeBoost4h:'income-boost',expBoost4h:'exp-boost',cooldownTicket:'cooldown-ticket'};
function itemIcon(k){return ITEM_ICONS[k]?`<img class="res-ico" src="assets/drive/ui/item-${ITEM_ICONS[k]}.png" alt="">`:'';}
const priceText=(p,unit='coin')=>p==null?L('app.unset'):ico(unit)+fmt(p); // unit = RES key: coin · dia · paw
const lockedLine=lv=>L('app.locked',{lv}); // 'Lv15 해금' — the real unlock level from CFG
// §17-4 exact short lines (수인님 2026-10-14); numbers inside come from CFG
const ALBA_SHORT=ALBA_FX;
const ALBA_DETAIL={daycare:A=>L('alba.detail.daycare',{m:A.intimacyMul,t:hm(A.cooldownSec)}),walk:A=>L('walk.albaNote',{n:A.maxShibas}),trainer:A=>L('alba.detail.trainer',{t:hm(A.cooldownSec)}),manager:()=>L('shop.managerNote')};
LP.alba=()=>{const now=clock.now();
 return {title:L('alba.pick'),rows:['daycare','walk','trainer','manager'].map(k=>{const A=CFG.alba[k],locked=!isUnset(A.unlock)&&s.cafe.level<A.unlock,active=k==='manager'&&S.managerActive(s,now);
  const gate=isUnset(A.cost)||isUnset(A.unlock)||locked||active||isUnset(s.coins)||s.coins<A.cost||(k==='manager'&&!!S.albaCheck(s,'manager',[],now));
  return {key:k,face:UI_ICONS.albaFace[k]||null,name:ALBA_NAME(k),effect:locked?lockedLine(A.unlock):active?L('alba.running',{t:tfmt((s.cafe.managerUntil-now)/1000)}):ALBA_SHORT[k](A),locked,
   detail:`${ALBA_DETAIL[k](A)} · ${isUnset(A.unlock)?L('app.unset'):lockedLine(A.unlock)} · ${priceText(A.cost,'coin')}`,price:A.cost,unit:'coin',disabled:gate,
   act:k==='manager'?'manager':k==='walk'?'albaWalkOpen':'listOpen',data:k==='manager'||k==='walk'?{}:{list:'albaShiba',kind:k}};})};};
// second level for per-shiba helpers: 데이케어 hires here; 훈련사 needs a trick → that shiba's care screen (existing trainer buttons).
LP.albaShiba=kind=>{const now=clock.now(),A=CFG.alba[kind];return {title:ALBA_NAME(kind),rows:s.shibas.map(sh=>{const c=kind==='trainer'?(CFG.tricks.some(t=>!S.albaCheck(s,kind,[sh.id],now,t.id))?null:S.albaCheck(s,kind,[sh.id],now,CFG.tricks[0].id)):S.albaCheck(s,kind,[sh.id],now),cd=(sh.cd[kind]||0)-now;
 return {key:'shiba-'+sh.id,face:IMG.shiba(sh.breed),portrait:true,name:nameOf(sh)+' · '+L('app.lv',{lv:sh.level}),effect:cd>0?L('app.cooldown',{t:tfmt(cd/1000)}):statusText(sh,S.statusOf(s,sh)),price:A.cost,unit:'coin',disabled:!!c,
  act:kind==='daycare'?'daycare':'albaTrainerOpen',data:{id:sh.id}};})};};
// §17-4 menu card: name + '판매가 N멍' (or '개발 중 mm:ss', or 'Lv{N} 해금'); dev time / cost / unlock level only in the tapped detail
LP.menu=()=>{const now=clock.now();return {title:L('shop.menu'),rows:CFG.menu.items.map(m=>{const c=S.menuCheck(s,m.id),dev=s.menuDev?.id===m.id,owned=s.menus.includes(m.id),locked=!owned&&!dev&&!isUnset(m.unlockLevel)&&s.cafe.level<m.unlockLevel;
 const effect=locked?lockedLine(m.unlockLevel):dev?L('shop.developingShort')+' '+tfmt((s.menuDev.until-now)/1000):`${L('menu.price')} ${isUnset(m.price)?L('app.unset'):money(m.price)}`;
 const detail=`${L('menu.price')} ${isUnset(m.price)?L('app.unset'):money(m.price)} · ${L('menu.dev')} ${isUnset(m.devSec)?L('app.unset'):hm(m.devSec)} · ${priceText(m.devCost,'coin')} · ${isUnset(m.unlockLevel)?L('app.unset'):lockedLine(m.unlockLevel)}`;
 if(dev){const left=S.skipLeftSec(s,{type:'menu'},now);return {key:m.id,face:'assets/drive/'+m.img,name:L('menu.'+m.id),effect,detail:detail+' · '+L('skip.note'),price:S.skipCost(left),unit:'dia',label:L('skip.instant')+' '+priceText(S.skipCost(left),'dia'),disabled:!!S.skipCheck(s,{type:'menu'},now),act:'skip',data:{type:'menu',id:''}};}
 return {key:m.id,face:'assets/drive/'+m.img,name:L('menu.'+m.id),effect,detail,locked,price:m.devCost,unit:'coin',label:owned?L('menu.devDone'):isUnset(m.devCost)?null:L('menu.devCost')+' '+priceText(m.devCost,'coin'),disabled:!!c,act:'dev',data:{id:m.id}};})};};
// 가게 관리 업그레이드 (§17, answer 2026-10-14): three kinds from CFG.upgrades. Price null → 미정, disabled. Effect null → '효과 미정'.
const UPGRADES=Object.keys(CFG.upgrades); /* names: upgrade.name.* / upgrade.short.* in i18n.js */
const UPGRADE_FX={interval:()=>L('upgrade.fx.interval'),price:()=>L('upgrade.fx.price'),queue:e=>L('upgrade.fx.queue',{n:e})};
LP.upgrade=()=>({title:L('upgrade.title'),rows:UPGRADES.map(k=>{const U=CFG.upgrades[k],lv=S.upgradeLevel(s,k),c=S.upgradeCheck(s,k),fx=Number.isFinite(U.effect);
 return {key:k,face:null,name:`${L('upgrade.name.'+k)} Lv${lv}`,effect:fx?UPGRADE_FX[k](U.effect):L('upgrade.effect')+' '+L('app.unset'),
  detail:`${fx?UPGRADE_FX[k](U.effect)+' '+L('upgrade.perLevel'):UPGRADE_FX[k]()+' · '+L('upgrade.effect')+' '+L('app.unset')} · ${L('upgrade.price')} ${priceText(S.upgradePrice(s,k),'coin')} · ${L('app.maxLevel')} ${Number.isFinite(U.maxLevel)?U.maxLevel:L('app.unset')}`,
  price:S.upgradePrice(s,k),unit:'coin',label:c==='max'?L('app.maxLevel'):null,disabled:!!c,act:'upgrade',data:{kind:k}};})});
// §17-4: tapping a card body (face or text, not the button) toggles its detail line inline; one open card per list (ui.lpOpen)
function listPopupHtml(m){const v=LP[m.list](m.arg),openKey=ui.lpOpen?.[m.list+(m.arg||'')];
 const row=x=>{const open=openKey===x.key&&!!x.detail;return `<article class="lp-card${x.locked?' locked':''}${x.disabled?' disabled':''}${open?' open':''}" data-lp-row="${x.key}"><span class="lp-face${x.portrait?' portrait':''}" data-act="lpToggle" data-key="${x.key}">${x.face?img(x.face):''}</span><div class="lp-text" data-act="lpToggle" data-key="${x.key}" aria-expanded="${open}"><strong>${x.name}</strong><small class="lp-effect">${x.effect}</small>${open?`<small class="lp-detail">${x.detail}</small>`:''}</div>`
  +(x.locked?'<span class="lp-price-slot" aria-hidden="true"></span>':`<button class="lp-price" data-act="${x.act}" ${Object.entries(x.data||{}).map(([k,val])=>`data-${k}="${val}"`).join(' ')} ${x.price==null||x.disabled?'disabled':''}>${x.price==null?L('app.unset'):x.label||priceText(x.price,x.unit)}</button>`)+'</article>';};
const btn=x=>`<button class="lp-price" data-act="${x.act}" ${Object.entries(x.data||{}).map(([k,val])=>`data-${k}="${val}"`).join(' ')} ${x.price==null||x.disabled?'disabled':''}>${x.price==null?L('app.unset'):x.label||priceText(x.price,x.unit)}</button>`;
 // 메뉴 개발 (똑또기 09:42): 2-column vertical grid like .furn-grid — square image, one-line name, price button; locked = grey card with lock + 'LvN 해금' in the button slot
 if(m.list==='menu')return `<div class="lp-ribbon"><h2>${v.title}</h2></div><button class="lp-close" data-act="modalOk" aria-label="${L('app.close')}">×</button><div class="menu-grid" data-list-popup="menu" data-menu-cards>${v.rows.map(x=>x.locked?`<article class="q17-product menu-card lp-card locked" data-lp-row="${x.key}"><span class="lp-face menu-card-img menu-lock">${img('assets/drive/ui/ui-lock.png')}</span><strong class="menu-name">${x.name}</strong><strong class="lp-effect menu-unlock">${x.effect}</strong></article>`:`<article class="q17-product menu-card lp-card" data-lp-row="${x.key}"><span class="lp-face menu-card-img">${x.face?img(x.face):''}</span><strong class="menu-name">${x.name}</strong><small class="lp-effect">${x.effect}</small>${btn(x)}</article>`).join('')}</div>`;
 return `<div class="lp-ribbon"><h2>${v.title}</h2></div><button class="lp-close" data-act="modalOk" aria-label="${L('app.close')}">×</button><div class="lp-list" data-list-popup="${m.list}">${v.top||''}${v.rows.length?v.rows.map(row).join(''):`<div class="lp-empty">${v.empty||L('app.unset')}</div>`}${v.footer?`<div class="heart-footer">${v.footer}</div>`:''}</div>`;}

// ───────── modals ─────────
let modalSig='';
function renderModal(){const m=ui.modals[0]||(!s.settings.language?{kind:'lang'}:!s.started?{kind:'start'}:s.walkResults.length?{kind:'walkResult',res:s.walkResults[0]}:null);
 if(!m){$('modal').hidden=true;modalSig='';return;}
 {const tt=m.kind==='dialogue'&&m.tutorial?m.tab:null;const mo=$('modal');if(mo?.querySelector){mo.querySelector('.tut-ring')?.remove();const b=tt&&document.querySelector?.(`[data-main-tab="${tt}"]`);if(b?.getBoundingClientRect){const r=b.getBoundingClientRect(),q=$('modal').getBoundingClientRect(),d=document.createElement('div');d.className='tut-ring';d.style.cssText=`left:${r.left-q.left}px;top:${r.top-q.top}px;width:${r.width}px;height:${r.height}px`;mo.appendChild(d);}}}$('mbox').classList.toggle('list-popup',['list','itemget'].includes(m.kind));$('mbox').classList.toggle('itemget-popup',m.kind==='itemget');$('modal').classList?.toggle('itemget-dim',m.kind==='itemget');$('mbox').classList.toggle('book-popup',m.kind==='book');$('mbox').classList.toggle('bag-popup',m.kind==='bagItem');$('mbox').classList.toggle('friend-cafe-popup',m.kind==='friendCafe');if($('modal').style)$('modal').style.background=m.kind==='itemget'&&Number.isFinite(CFG.itemGet.dimAlpha)?`rgba(0,0,0,${CFG.itemGet.dimAlpha})`:'';
 if(m.kind==='list'){const h=listPopupHtml(m);if(h===modalSig&&!$('modal').hidden)return;const _sl=$('mbox').querySelector('.lp-list,[data-menu-cards]'),sc=_sl?.scrollTop||0,scl=_sl?.scrollLeft||0,same=$('mbox').dataset.list===m.list+(m.arg||'');modalSig=h;$('mbox').classList.remove('ledger-paper');$('mbox').innerHTML=h;$('mbox').dataset.list=m.list+(m.arg||'');if(same){const l=$('mbox').querySelector('.lp-list,[data-menu-cards]');if(l){l.scrollTop=sc;l.scrollLeft=scl;}}$('modal').hidden=false;return;}const sig=JSON.stringify([m.kind,m.text,m.actor,m.variant,m.tasks,m.fixture,m.x,m.res,m.reward,m.kind==='ledger'?[m.day,S.ledgerStatement(s,clock.now(),m.day)]:m.kind==='spaceUnlock'?[s.cafe.level,s.dia,s.space]:m.kind==='bagItem'?[m.id,bagPopupHtml(m.id)]:null,ui.langPick,ui.startPick,ui.startBandana,s.settings.language,s.coins]);if(sig===modalSig)return;modalSig=sig;delete $('mbox').dataset.list;
 let h='';
 if(m.kind==='dialogue')h=Q1715.dialogueHtml(m);
 $('mbox').classList.toggle('ledger-paper',m.kind==='ledger');
 if(m.kind==='ledger'){
 const report=S.ledgerStatement(s,clock.now(),m.day),amount=n=>{const [i,d]=String(Math.round(n*100)/100).split('.');return fmt(+i)+(d?'.'+d:'');};
 h=`<div class="ledger-title"><h2>${L('ledger.title')}</h2><button data-act="modalOk" aria-label="${L('ledger.closeAria')}">×</button></div><div class="ledger-days">${[-1,0].map(day=>`<button data-act="ledgerDay" data-day="${day}" aria-pressed="${m.day===day}">${day===-1?L('ledger.yesterday'):L('ledger.today')}</button>`).join('')}</div><small class="ledger-unit">${L('ledger.unit')}</small>`;
 for(const kind of ['income','expense'])h+=`<section class="ledger-section"><h3>${kind==='income'?L('ledger.income'):L('ledger.expense')}</h3>${report.lines.filter(x=>x.kind===kind).map(x=>`<div class="ledger-row ${kind}" data-ledger-category="${x.id}"><span>${x.label}</span><span>${kind==='expense'?'('+amount(x.amount)+')':amount(x.amount)}</span></div>`).join('')}</section>`;
 h+=`<div class="ledger-row ledger-net"><strong>${L('ledger.net')}</strong><strong>${L('ledger.coins',{n:(langNow()==='ko'?'':ico('coin'))+amount(report.net)})}</strong></div>`;
 }
 if(m.kind==='book')h=bookHtml(m.id);if(m.kind==='bagItem')h=bagPopupHtml(m.id);
 if(m.kind==='friendCafe')h=friendCafeHtml(m.id);
 if(m.kind==='itemget'){const r=m.reward,n=grantName(r.id);h=`<div class="lp-ribbon"><h2>${n}</h2></div><div class="q17-itemget" data-itemget>${CFG.itemGet.rays.src?`<img class="itemget-rays" src="${CFG.itemGet.rays.src}" alt="" style="animation-duration:${CFG.itemGet.rays.spinSec}s">`:''}${grantImage(r.id)}<strong class="itemget-count" data-itemget-count>×${fmt(r.n)}</strong><button data-act="modalOk">${L('mail.claim')}</button></div>`;}
 if(m.kind==='mailbox')h=`<h2>${L('mail.title')}</h2>`+S.mailbox(s,clock.now()).map(x=>`<div class=card>${L('mail.day',{n:x.day})} · ${COIN_HTML}${x.coins} · ${L('mail.dia',{n:x.dia})} · ${Object.entries(x.items).map(([k,v])=>itemIcon(k)+L('grant.'+k)+' ×'+(v??L('app.unset'))).join(' · ')}<button data-act=claimMail data-day=${x.day} ${x.claimed?'disabled':''}>${x.claimed?L('mail.claimed'):L('mail.claim')}</button></div>`).join('')+`<button data-act=modalOk>${L('app.close')}</button>`;
 if(m.kind==='lang')h=`<h2>${makeT(()=>ui.langPick||langNow())('lang.select.title')}</h2>${LANGS.map(c=>`<button class="${ui.langPick===c?'':'sec'}" data-act="langPick" data-lang="${c}">${makeT(()=>c)('lang.name.'+c)}</button>`).join('')}
  <div class="note">${makeT(()=>ui.langPick||langNow())('lang.select.hint')}</div><button data-act="langOk" ${ui.langPick?'':'disabled'}>${makeT(()=>ui.langPick||langNow())('lang.select.confirm')}</button>`;
 if(m.kind==='start')h=`<h2>${L('start.title')}</h2><div class="banner">${img(IMG.four)}</div><div class="note">${L('start.hint')}</div>
  <div class="choices">${CFG.breeds.map(b=>`<button class="choice${ui.startPick===b?' on':''}" data-act="startPick" data-breed="${b}">${img(IMG.shiba(b))}<span>${L('shiba.breed.'+b)}</span></button>`).join('')}</div>
  <div class="choices">${S.bandanaItems().filter(it=>it.type===CFG.accessory.bandana.types[0]).map(it=>`<button data-act="startBandana" data-item="${it.id}" aria-pressed="${ui.startBandana===it.id}">${bandHtml(it.id)}${L('acc.color.'+it.color)}</button>`).join('')}</div><input type="text" id="startName" maxlength="12" placeholder="${L('start.name')}" value="${ui.startName||''}"><button data-act="startGo" ${ui.startPick&&ui.startBandana?'':'disabled'}>${L('start.go')}</button>`;
 if(m.kind==='offline'){const o=m.o,mins=Math.round(o.sec/60);h=`<h2>${L('off.title')}</h2><div class="note" style="font-size:14px">${L('off.body',{h:Math.floor(mins/60),m:mins%60,n:o.served,coins:fmt(o.coins),r0:Math.round(o.repFrom),r1:Math.round(o.repTo)})}</div>
  ${o.sec>CFG.offline.capHours*3600?`<div class="note">${L('off.cap')}</div>`:''}${m.closed?`<div class="note" style="font-size:13px;color:#9c4136">${L('off.closed')}</div>`:''}<button data-act="modalOk">${L('app.ok')}</button>`;}
 if(m.kind==='walkResult'){const sh=S.byId(s,m.res.shibaId);h=`<h2>${L('walk.back',{name:sh?nameOf(sh):'?'})}</h2><div class="big" style="width:120px;height:120px">${sh?img(IMG.shiba(sh.breed)):''}</div>
  <div class="note" style="text-align:center">${[m.res.paws?L('walk.paws',{n:m.res.paws}):'',...m.res.events.map(e=>L('walk.ev.'+e))].filter(Boolean).join(' · ')}</div><button data-act="walkResultOk">${L('app.ok')}</button>`;}
 if(m.kind==='odds'){const total=GACHA_TABLE.pool.reduce((n,x)=>n+x.w,0);h=`<h2>${L('gacha.oddsTitle')}</h2><div data-gacha-odds>${GACHA_TABLE.pool.map(x=>`<div class="li"><div class="pt">${img(IMG.shiba(x.id))}</div><span>${L('shiba.breed.'+x.id)} · ${x.w/total*100}%</span></div>`).join('')}</div><div class="note">${L('gacha.oddsNote',{v:GACHA_TABLE.version,n:GACHA_TABLE.pity.stampsForPick,p:GACHA_TABLE.dupToPaw})}</div><button data-act="modalOk">${L('app.close')}</button>`;}
 if(m.kind==='gacha')h=`<h2>${L('gacha.title')}</h2><div class="gres">${m.res.map(x=>`<div class="gi${x.dup?' dup':''}">${img(IMG.shiba(x.breed))}<span>${x.dup?L('gacha.dup',{name:nameOf(S.byId(s,x.toId)||{breed:x.breed}),p:x.paws}):L('gacha.new',{breed:L('shiba.breed.'+x.breed),lv:CFG.gacha.startLevel})}</span></div>`).join('')}</div><button data-act="modalOk">${L('app.ok')}</button>`;
 if(m.kind==='levelResult'){const sh=S.byId(s,m.id);h=`<h2>${L('levelUp.done')}</h2><div class="big">${sh?img(IMG.shiba(sh.breed)):''}</div><div class="note">${sh?nameOf(sh):''} · Lv ${m.from} → ${m.to}</div><button data-act="modalOk">${L('app.ok')}</button>`;}
 if(m.kind==='spaceUnlock')h=`<h2>${L('space.unlock')}</h2>${unlocks()}<button data-act=modalOk>${L('app.close')}</button>`;
 if(m.kind==='confirm')h=`<div class="note confirm-text" style="font-size:14px">${m.text}</div><div class="btns"><button class="warn${m.short?' dim':''}" data-act="confirmYes">${L('app.ok')}</button><button class="sec" data-act="modalOk">${L('app.cancel')}</button></div>`;
 $('mbox').innerHTML=h;$('modal').hidden=false;}
if(L0.offline&&(L0.offline.sec>=60||L0.reopened))ui.modals.push({kind:'offline',o:L0.offline,closed:!!L0.reopened});

// ───────── actions ─────────
function showGrants(before){for(const reward of Q17.rewardDiff(before,s))ui.modals.unshift({kind:'itemget',reward});}
const act={
 questTab:d=>{ui.questTab=d.item;},questInstant:d=>{if(!S.questInstant(s,d.id,clock.now()))toast(L('toast.diaShort'));},questGo:d=>{if(TABS.some(t=>t.id===d.item)){close();mainTab=d.item;menuSig='';}},
 donguOffer:()=>ui.modals.unshift({kind:'dialogue',variant:'quest',actor:'dongu',speech:L('dlg.dongu.speech'),text:L('quest.tab.dongu'),tasks:Q1715.tasksFor(CFG.quests,'dongu',temp&&ui.questFixture),fixture:temp&&ui.questFixture}),
 guestRequest:d=>{const c=w.custs.find(c=>String(c.id)===d.id);if(!c?.request)return;const q=c.request,sh=S.byId(s,q.shibaId);ui.modals.unshift({kind:'dialogue',variant:c.rude?'rude':'normal',actor:c.kind==='girl'?'girl':'man',speech:L('dlg.guest.speech'),text:q.type==='meetShiba'?L('dlg.meet',{name:sh?nameOf(sh):L('shiba.generic')}):L('dlg.trick',{trick:L('trick.'+q.trick)})});},
 shopTab:d=>{ui.shopTab=d.item;menuSig='';},shopSpecial:()=>{ui.shopTab='special';menuSig='';},shopTheme:d=>{ui.shopTab='theme';ui.selectedTheme=d.item;menuSig='';},
 furnitureStorage:()=>{close();mainTab='bag';ui.bagTab='furniture';menuSig='';requestAnimationFrame(()=>document.querySelector('.furniture-section')?.scrollIntoView({block:'start'}));},coupon:()=>toast(L('toast.coupon')),
 furnitureCategory:d=>{ui.furnitureCategory=d.item;menuSig='';},
 friendsOpen:()=>{ui.modals=[];open('friends');},friendAdd:()=>toast(L('app.stub')),
 friendGo:d=>{ui.modals=[{kind:'friendCafe',id:d.id}];},friendVisit:d=>toast(Q17.visitFriend(s,d.id,clock.now())?L('friend.visitOk'):L('friend.visitDone')),
 recipePick:d=>{ui.recipe=d.item;},craft:()=>Q17.craft(s,ui.recipe||CFG.cooking.recipes[0].id,clock.now()),
 ingredientBuy:d=>Q17.buyIngredient(s,d.item),feedDish:d=>Q17.feedDish(s,S.byId(s,+d.id),d.item),
 runPlay:()=>{const now=clock.now();if(!Q17.startRunPlay(s,now)){toast(L('run.noPlays'));return;}
 const sh=s.shibas.find(x=>s.run.shibas.includes(x.id))||s.shibas[0];ui.modals=[];refresh();
 game.run=startRunScreen({cfg:CFG.run,ingredients:CFG.ingredients,shibaSrc:IMG.walkPose[sh?.breed]||IMG.shiba(sh?.breed||'red'),sheet:CFG.run.runSheets[sh?.breed]||null,coinSrc:RES.coin,playsLeft:Q17.runPlaysLeft(s,now),
  onEnd:r=>{Q17.finishRun(s,r,clock.now());game.run=null;refresh();},resultExtra:()=>`<p>${L('run.best',{n:Q17.runDay(s,clock.now()).best??0})}</p>`});},
 runAd:()=>{if(Q17.claimRunAd(s,clock.now()))toast(L('run.adOk'));},runSkip:()=>{const r=Q17.skipRun(s,clock.now());if(r)toast(`${L('dlg.skip')} · ${COIN_HTML}${fmt(r.mung)}`+Object.entries(r.got).map(([k,n])=>` · ${LF('ingredient.'+k,CFG.ingredients[k].name)} ${n}`).join(''));},runShiba:d=>{const id=+d.id;s.run.shibas=s.run.shibas[0]===id?[]:[id];},

 hearts:()=>{S.heartState(s);ui.modals.unshift({kind:'list',list:'hearts'});},
 heartPick:d=>ui.modals.unshift({kind:'list',list:'heartShiba',arg:d.item}),
 heartMenu:d=>ui.modals.unshift({kind:'list',list:'heartMenu',arg:d.item}),
 heartUse:d=>{const before=Q17.rewardSnapshot(s);if(S.useHeartItem(s,d.item,d.id?+d.id:null,clock.now(),d.menu||null,w)){if(ui.modals[0].list!=='hearts')ui.modals.shift();toast(L('toast.used'));showGrants(before);}},
 heartAd:()=>{S.claimHeartAd(s,clock.now());},heartBuy:()=>{S.buyHearts(s);},heartStub:()=>toast(L('app.stub')),
 heartWalk:()=>{ui.modals=[];open('walk');},villageHospital:()=>open('hospital'),villageClose:()=>{mainTab='manage';menuSig='';renderMainMenu();},
 listOpen:d=>{if(d.list==='menu')ui.seen.menuDone=false;ui.lpOpen={};ui.modals.unshift({kind:'list',list:d.list,arg:d.kind||null});},
 lpToggle:d=>{const m=ui.modals[0];if(m?.kind!=='list')return;const k=m.list+(m.arg||'');ui.lpOpen[k]=ui.lpOpen[k]===d.key?null:d.key;},
 albaWalkOpen:()=>{ui.modals=ui.modals.filter(m=>m.kind!=='list');open('walk');},
 albaTrainerOpen:d=>{ui.modals=ui.modals.filter(m=>m.kind!=='list');open('care',+d.id);},
 close,resourceShop:()=>toast(L('toast.shopStub')),income:()=>{if(CFG.ledger.openFromPill)ui.modals.unshift({kind:'ledger',day:0});},ledger:()=>ui.modals.unshift({kind:'ledger',day:0}),ledgerDay:d=>{ui.modals[0].day=+d.day;},care:d=>{ui.modals=[{kind:'book',id:+d.id}];},careOpen:d=>{ui.modals=ui.modals.filter(m=>m.kind!=='book');open('care',+d.id);},
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
 levelUp:d=>{const sh=S.byId(s,+d.id);if(S.levelUpCheck(s,+d.id))return;const lv=sh.level,need=S.pawsToNext(lv);ui.modals.unshift({kind:'confirm',text:L('levelUp.confirm',{name:nameOf(sh),lv,next:lv+1,n:fmt(need)}),yes:()=>{if(S.byId(s,+d.id)?.level!==lv||!S.levelUp(s,+d.id)){toast(L('toast.paws'));return;}ui.modals.unshift({kind:'levelResult',id:+d.id,from:lv,to:lv+1});}});},
 gachaOdds:()=>{ui.modals.push({kind:'odds'});},
 pityPick:d=>{const x=S.pityPick(s,d.breed,r,clock.now());if(x)ui.modals.push({kind:'gacha',res:[x]});else why(S.pityCheck(s,d.breed));},
 gacha:d=>{const res=S.gachaPull(s,+d.n,r,clock.now(),{ticket:!!d.ticket});if(res)ui.modals.push({kind:'gacha',res});else why(S.gachaCheck(s,+d.n,{ticket:!!d.ticket}));},
 accUnlock:d=>{if(!S.unlockAccSlot(s,+d.id,d.via))why(S.accUnlockCheck(s,+d.id,d.via));},
 accType:d=>{ui.accType=d.type;},buyAcc:d=>{if(S.buyAcc(s,d.item,clock.now()))toast(L('toast.accBought',{name:accName(d.item)}));else why(S.buyAccCheck(s,d.item));},
 equip:d=>{if(!S.equipAcc(s,+d.id,d.item))why(S.equipCheck(s,+d.id,d.item));},unequip:d=>{S.unequipAcc(s,+d.id);},
 dev:d=>{if(!S.developMenu(s,d.id,clock.now()))why(S.menuCheck(s,d.id));},
 startBandana:d=>{ui.startName=$('startName')?.value||'';ui.startBandana=d.item;},mailbox:()=>ui.modals.push({kind:'mailbox'}),claimMail:d=>{const before=Q17.rewardSnapshot(s);if(S.claimMail(s,+d.day,clock.now()))showGrants(before);},useItem:d=>S.useItem(s,d.item,clock.now()),buyFurniture:d=>S.buyFurniture(s,d.item,clock.now()),placeFurniture:d=>{const z=zonesForSpace(s.space)[0];let done=false;for(let j=0;j<z.rows&&!done;j++)for(let i=0;i<z.cols&&!done;i++)done=S.placeFurniture(s,d.item,[i,j]);S.syncRoutes(s,w);},unlockPopup:()=>ui.modals.unshift({kind:'spaceUnlock'}),spaceBuy:d=>S.unlockSpace(s,d.kind,d.id,d.via,clock.now()),upgrade:d=>{if(!S.buyUpgrade(s,d.kind,clock.now()))why(S.upgradeCheck(s,d.kind));},mission:()=>open('quests'),
 heartReset:()=>{S.useHeartReset(s,clock.now());},bagTab:d=>{ui.bagTab=d.item;menuSig='';},bagCell:d=>{ui.modals.unshift({kind:'bagItem',id:d.item});},bagDone:()=>{if(ui.modals[0]?.kind==='bagItem')ui.modals.shift();menuSig='';},bagUse:d=>{S.useItem(s,d.item,clock.now());act.bagDone();},bagHeartReset:()=>{S.useHeartReset(s,clock.now());act.bagDone();},bagGacha:d=>{act.bagDone();act.gacha({n:1,ticket:1});},bagPlace:d=>{act.bagDone();act.placeFurniture(d);},bagWall:()=>{act.bagDone();iso.setEdit(true);iso.actions.querySelector('[data-wall-add]')?.click();},
 setLang:d=>{s.settings.language=d.lang;applyStatic();},toggle:d=>{s.settings[d.k]=!s.settings[d.k];},
 reset:()=>ui.modals.unshift({kind:'dialogue',variant:'warning',actor:'dongu',text:L('set.resetQ'),yes:()=>{localStorage.removeItem(CFG.saveKey);s=S.newState(clock.now());w=S.newWorld(s,r);close();}}),
 stain:()=>{if(S.cleanStain(s))toast(L('toast.cleaned'));},
 pickShiba:d=>{const id=+d.shiba;ui.sel=ui.sel===id?null:id;if(ui.sel!=null)toast(L('cafe.pick'));},
 seat:d=>{if(ui.sel==null)return;if(S.deliver(s,w,ui.sel,+d.cust,clock.now()))ui.sel=null;},
 langPick:d=>{ui.langPick=d.lang;},langOk:()=>{s.settings.language=ui.langPick;applyStatic();},
 startPick:d=>{ui.startName=$('startName')?.value||'';ui.startPick=d.breed;},
 startGo:()=>{const name=($('startName')?.value||'').trim();if(S.chooseStart(s,ui.startPick,name,r,clock.now(),ui.startBandana)){if(temp){for(const breed of ['red','white','kuro'].filter(b=>b!==ui.startPick).slice(0,2)){const sh=S.makeShiba(s,{breed,level:CFG.startShiba.level,now:clock.now()});s.shibas.push(sh);S.setPlaced(s,sh.id,true);/* 배치 칸 상한(S.slotsOf, config) 넘으면 집에 머묾 */}}w=S.newWorld(s,r);startTutorial();}},
 modalOk:()=>{ui.modals.shift();},walkResultOk:()=>{s.walkResults.shift();}, // §17: the result stays in state (시바 red dot) until acknowledged
 tutorialSkip:()=>{ui.modals=ui.modals.filter(m=>!m.tutorial);},confirmYes:()=>{const m=ui.modals[0];if(m?.short){toast(L('toast.coinsShort'));return;}ui.modals.shift();m.yes?.();},
};
document.addEventListener('click',e=>{if(e.target.id==='modal'&&ui.modals[0]?.kind==='bagItem'){ui.modals.shift();refresh();return;}const opener=e.target.closest('[data-open]');if(opener){open(opener.dataset.open);refresh();return;}const nb=e.target.closest('[data-nav]');if(nb){const n=nb.dataset.nav;if(n==='cafe')close();else open(n);refresh();return;}
 const el=e.target.closest('[data-act]');if(!el||el.disabled)return;const f=act[el.dataset.act];if(f){f(el.dataset);refresh();}});
// drag a roaming shiba onto a guest (갱신 105)
let drag=null;
$('scene').addEventListener('pointerdown',e=>{const t=e.target.closest('[data-act=pickShiba]');if(t)drag={id:+t.dataset.shiba,x:e.clientX,y:e.clientY};});
addEventListener('pointerup',e=>{if(!drag)return;const d=drag;drag=null;if(Math.hypot(e.clientX-d.x,e.clientY-d.y)<12)return;
 const seat=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-cust]');if(seat&&S.deliver(s,w,d.id,+seat.dataset.cust,clock.now())){ui.sel=null;refresh();}});
// index.html fixed text: data-i18n="key" → textContent; data-i18n-attr="attr:key;attr2:key2" → attributes.
function applyStatic(){document.documentElement.lang=langNow();document.title=L('app.title');document.querySelectorAll('[data-i18n]').forEach(e=>e.textContent=L(e.dataset.i18n));document.querySelectorAll('[data-i18n-attr]').forEach(e=>{for(const p of e.dataset.i18nAttr.split(';')){const [a,k]=p.split(':');e.setAttribute(a.trim(),L(k.trim()));}});sceneSig='';panelSig='';modalSig='';}
function refresh(){Q17.settleCraft(s,clock.now());for(const it of S.heartUnlocks(s))toast(L('toast.unlocked',{name:LF('heart.item.'+it.id,it.name)}));handleEvents();renderHUD();renderScene();renderPanel();renderModal();}

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
const game={CFG,S,iso,get walkTable(){return walkTable();},debugQuestFixture(enabled){if(!temp)return false;ui.questFixture=!!enabled;panelSig='';refresh();return true;},debugExpand(n){if(!temp||!Number.isSafeInteger(n)||n<0)return false;s.space.unlockedRows=n;S.syncRoutes(s,w);refresh();return true;},get characterPositions(){return [...w.custs,...w.queue,...Object.values(w.sh)].map(c=>({id:c.id,phase:c.phase,cell:c.cell&&[...c.cell]}));},get state(){return s;},get world(){return w;},step:(dt=.1)=>{step(dt);return {custs:w.custs.length,queue:w.queue.length,coins:s.coins};},advance,open,close,clock,ui,refresh};
function openExpand(){const cost=S.spacePrice('row',null,'coins',s),rows=s.space.unlockedRows;ui.modals.unshift({kind:'confirm',land:true,short:cost!=null&&s.coins<cost,text:`${L('land.title',{n:rows+1})} <small class="land-max">${L('land.max',{n:Number.isFinite(CFG.expansion.maxSteps)?CFG.expansion.maxSteps:L('app.unset')})}</small><br><span class="land-price"><img src="${RES.coin}" alt="">${L('ledger.coins',{n:cost==null?L('app.unset'):fmt(cost)})}</span>`,yes:()=>{if(s.space.unlockedRows!==rows)return;if(!S.unlockSpace(s,'row',null,'coins',clock.now()))toast(L('toast.coinsShort'));else{S.syncRoutes(s,w);const m=iso.markers.find(x=>x.kind==='row'),cv=$('isomap');if(m)iso.easeBy(m.x-cv.clientWidth/2,m.y-cv.clientHeight/2);}}});renderModal();}
// 배치 편집: 아래 패널은 접고 보관함만 한 줄(옆으로 넘김). 위에는 저장하기만(isomap bar).
const FURN_ID={table:'tea-table',cushion:'zabuton'},furnName=type=>LF('furn.'+(FURN_ID[type]||type),type),FURN_ART=type=>`assets/drive/furn-${type==='table'?'tea-table':type}-v4.png`;
function editStorage(){const inv=Object.entries(s.furnitureInv||{}),walls=(s.wallOwned??PARTITION.count)-s.placement.slots.filter(x=>x.type==='wall').length;
 return `<section class="edit-storage" data-edit-storage><div class="edit-strip">${inv.map(([type,n])=>`<article class="edit-card" data-edit-card="${type}"><img src="${FURN_ART(type)}" alt=""><span>${furnName(type)}</span><b>×${fmt(n)}</b><button data-act="placeFurniture" data-item="${type}" ${n>0?'':'disabled'}>${L('bag.put')}</button></article>`).join('')}<article class="edit-card" data-edit-card="wall"><span>${L('bag.wall')}</span><b>×${fmt(walls)}</b><button data-wall-inventory-place ${walls>0?'':'disabled'}>${L('bag.put')}</button></article></div></section>`;}
function furnitureShop(){const categories=[['all',L('app.all')],...CFG.furniture.items.map(it=>[it.id,LF('furn.'+it.id,it.name)])],selected=ui.furnitureCategory||'all';return `<section data-furniture-shop><div class="chips">${categories.map(([id,name])=>`<button data-act="furnitureCategory" data-item="${id}" aria-pressed="${id===selected}">${name}</button>`).join('')}</div><div class="furn-grid" data-furn-grid>${CFG.furniture.items.filter(it=>selected==='all'||it.id===selected).map(it=>{const p=S.furniturePrice(s,it.id),ok=Number.isFinite(p);return `<article class="q17-product" data-furn-card="${it.id}"><img class="furn-img" src="assets/drive/ui/ui-icon-${it.id}.png" alt=""><strong class="furn-name">${LF('furn.'+it.id,it.name)}</strong><button class="furn-buy" data-act="buyFurniture" data-item="${it.id}" ${ok?'':'disabled'}>${ok?priceText(p,'coin'):ico('coin')}</button></article>`;}).join('')}</div></section>`;}
const grantName=id=>LF('grant.'+id,L('app.unset'));
function grantImage(id){return ({coins:()=>img(RES.coin),dia:()=>img(RES.dia),hearts:()=>img(RES.heart),paws:()=>img(RES.paw),potionBig:()=>img(IMG.potion),potionSmall:()=>img(IMG.potionSmall)})[id]?.()||itemIcon(id)||slot('');}
P.friends=()=>({title:L('friend.title'),html:`<div class="card" data-friends><div class="btns"><strong>${L('friend.count',{n:s.friends.length})}</strong>${RELEASE?'':`<button data-act="friendAdd">${L('friend.add')}</button>`}</div><div class="q17-swipe friend-swipe">${s.friends.map(f=>`<button class="q17-product friend-card" data-act="friendGo" data-id="${f.id}">${f.breed?`<span class="friend-photo">${img(IMG.shiba(f.breed))}</span>`:slot('')}<strong>${f.name}</strong><span>Lv${f.level??L('app.unset')}</span><small>${L('friend.go')}</small></button>`).join('')||`<p>${L('friend.none')}</p>`}</div></div>`});
const friendCafeHtml=id=>{const f=s.friends.find(f=>String(f.id)===String(id));if(!f)return '';const C=CFG.friendCafe,[W,H]=C.roomSize,v=CFG.heartUse.visit,used=s.friendVisits?.day===Math.floor((clock.now()+CFG.ledger.dayOffsetMs)/CFG.ledger.periodMs)?s.friendVisits.count:0,left=Number.isFinite(v.daily)?Math.max(0,v.daily-used):null,pos=o=>`left:${o.x}%;top:${o.y}%;width:${o.w}%`;
 return `<section class="friend-cafe" data-friend-cafe="${f.id}"><div class="fc-title"><strong>${L('friend.cafe',{name:f.name})}</strong><span>Lv${f.level??L('app.unset')}</span></div><div class="fc-room" style="aspect-ratio:${W}/${H}"><img class="fc-bg" src="${C.room}" alt="">${C.furniture.map(o=>`<img class="fc-item" src="${o.src}" alt="" style="${pos(o)}">`).join('')}${f.breed?`<img class="fc-item fc-shiba" src="${IMG.shiba(f.breed)}" alt="" data-knockout style="${pos(C.shiba)}">`:''}</div><div class="fc-btns">${RELEASE?'':`<button data-act="friendVisit" data-id="${f.id}" ${left===0?'disabled':''}>${ico('heart')} ${L('friend.getHearts',{n:v.hearts??L('app.unset')})} <small>${L('friend.today',{left:left??L('app.unset'),n:v.daily??L('app.unset')})}</small></button>`}<button class="sec" data-act="modalOk">${L('app.back')}</button></div></section>`;};
P.friendVisit=id=>{const f=s.friends.find(f=>String(f.id)===String(id));if(!f)return P.friends();const v=CFG.heartUse.visit;return {title:L('friend.cafe',{name:f.name}),html:`<section class="card friend-visit" data-friend-visit="${f.id}">${f.breed?`<span class="friend-photo big">${img(IMG.shiba(f.breed))}</span>`:slot('')}<h2>${f.name}</h2><span>Lv${f.level??L('app.unset')}</span><p>${L('friend.visitNote',{n:v.hearts??L('app.unset'),d:v.daily??L('app.unset')})}</p>${RELEASE?'':`<button data-act="friendVisit" data-id="${f.id}">${L('friend.getHeart')}</button>`}<button class="sec" data-open="friends">${L('friend.list')}</button></section>`};};
const bookHtml=id=>{const sh=S.byId(s,id);if(!sh)return '';const p=sh.profile||CFG.profiles[sh.breed]||{},B=CFG.profileBook,[W,H]=B.size,box=k=>{const [x,y,w,h]=B.boxes[k];return `left:${x/W*100}%;top:${y/H*100}%;width:${w/W*100}%;height:${h/H*100}%`;};const boxU=(k1,k2)=>{const [x,y,w]=B.boxes[k1],[,y2,,h2]=B.boxes[k2];return `left:${x/W*100}%;top:${y/H*100}%;width:${w/W*100}%;height:${(y2+h2-y)/H*100}%`;};const friends=(sh.friends||[]).map(id=>S.byId(s,id)).filter(Boolean),PL=(k,fb)=>sh.profile?fb:LF('profile.'+sh.breed+'.'+k,fb);
 return `<article class="q17-profile profile-book${B.frame?' has-frame':''}" data-profile style="aspect-ratio:${W}/${H}${B.frame?`;background-image:url(${B.frame})`:''}"><button class="lp-close book-close" data-act="modalOk" aria-label="${L('app.close')}" style="right:${B.close.right}px;top:${B.close.top}px">×</button><div class="book-art" style="${box('art')}"><img data-knockout src="${IMG.shiba(sh.breed)}" alt="${nameOf(sh)}"></div><div class="book-box book-intro" style="${box('intro')}"><h2>${nameOf(sh)} <small>Lv${sh.level}</small></h2>${p.intro?`<p>${PL('intro',p.intro)}</p>`:''}</div><div class="book-box book-rows" style="${boxU('favs','friends')}"><div class="book-grid">${['favSnack','favPlay'].map(k=>p[k]?`<div class="book-row"><b>${k==='favSnack'?L('book.favSnack'):L('book.favPlay')}</b><span>${PL(k,p[k].name)}</span></div>`:'').join('')}<div class="book-row"><b>${L('book.friends')}</b><span class="book-friends">${friends.length?friends.map(f=>`<button data-act="care" data-id="${f.id}">${img(IMG.shiba(f.breed),nameOf(f))}</button>`).join(''):L('book.none')}</span></div></div></div></article><div class="book-care-out" style="margin-top:${B.careGap??16}px"><button data-act="careOpen" data-id="${id}">${L('book.care')}</button></div>`;};
P.profile=id=>{const sh=S.byId(s,id);if(!sh)return P.shibas();return {title:nameOf(sh),html:bookHtml(id)};};
// 병원 (갱신 58·111·111-1·112·131·135-2): 마을 → 진료실. 다친·앓아누운 시바를 보내고, 입원 중이면 남은 시간과 앞당기기.
// 비용 CFG.hospital.costs (카페 레벨 구간), 시간 CFG.hospital.stays. 아픈 포즈 그림은 CFG.hospitalArt.sick[breed]; 없으면 기존 시바 그림.
P.hospital=()=>{const H=CFG.hospitalArt||{},list=s.shibas.filter(sh=>['injured','sick','hospital'].includes(sh.status));
 const row=sh=>{const id=sh.id,kind=sh.status==='hospital'?sh.hospitalKind:sh.status==='sick'?'sick':sh.injury,art=H.sick?.[sh.breed]||IMG.shiba(sh.breed),cost=kind?S.hospitalCost(s,kind):null,stay=kind?CFG.hospital.stays[kind]:null,c=sh.status==='hospital'?null:S.hospitalCheck(s,id);
  return `<div class="hosp-row" data-hosp="${id}"><div class="hosp-art">${art?`<img src="${art}" alt="" ${H.sick?.[sh.breed]?'':'class="hosp-normal" data-knockout'}>`:''}</div><div class="hosp-info"><strong>${nameOf(sh)}</strong><span>${kind?L('inj.'+kind):L('app.unset')}</span>${sh.status==='hospital'?`<span>${L('st.hospital',{t:tfmt((sh.hospitalUntil-clock.now())/1000)})}</span><div class="btns">${skipBtn({type:'hospital',id})}</div>`:`<span>${L('hosp.treat',{t:stay!=null?tfmt(stay):L('app.unset'),cost:cost!=null?money(cost):L('app.unset')})}</span><button class="warn" data-act="hospital" data-id="${id}" ${c?'disabled':''}>${c==='coins'?L('care.hospitalNo',{cost:cost!=null?fmt(cost):L('app.unset')}):L('care.hospital',{cost:cost!=null?fmt(cost):L('app.unset')})}</button>`}</div></div>`;};
 return {title:L('place.hospital'),html:`<section class="hospital-room" data-hospital style="background-image:url(${H.background})"><div class="hosp-list">${list.length?list.map(row).join(''):`<p class="hosp-empty">${L('hosp.none')}</p>`}</div></section>`};};
P.cooking=()=>{const recipes=CFG.cooking.recipes,r=recipes.find(r=>r.id===ui.recipe)||recipes[0],c=Q17.craftCheck(s,r),open=Q17.recipeUnlocked(s,r),fxI=CFG.cooking.fxIcons||{},fx=(k,label)=>r.effect?.[k]!=null?`<span class="cook-fx-item" data-fx="${k}"${fxI[k]?` title="${label}"`:''}>${fxI[k]?img(fxI[k],label):label+' '}+${fmt(r.effect[k])}</span>`:`<span class="cook-fx-item">${label} ${L('app.unset')}</span>`;
 return {title:L('cook.title'),html:`<section class="cook2" data-cooking><div class="cook2-strip" data-cook-strip>${recipes.map((x,i)=>{const o=Q17.recipeUnlocked(s,x);return `<button class="cook2-card${o?'':' locked'}" data-act="recipePick" data-item="${x.id}" aria-pressed="${x.id===r.id}">${x.img?img(x.img):slot('',56,56)}<span>${Q17.recipeName(x,i)}</span>${o?'':`<small class="cook2-lock">${img('assets/drive/ui/ui-lock.png')}${L('app.locked',{lv:x.unlockLevel??L('app.unset')})}</small>`}</button>`;}).join('')}${(CFG.cooking.lockedPreview||[]).map(x=>`<button class="cook2-card locked preview" data-cook-preview disabled>${x.img?img(x.img):slot('',42,42)}<small class="cook2-lock">${img('assets/drive/ui/ui-lock.png')}${L('app.locked',{lv:x.unlockLevel??L('app.unset')})}</small></button>`).join('')}</div>
 <div class="cook2-main" data-cook-detail="${r.id}"><div class="cook2-dish">${r.img?img(r.img):slot('',160,160)}</div><div class="cook2-title" data-cook-title><h3>${Q17.recipeName(r,recipes.indexOf(r))}</h3><div class="cook2-fx" data-cook-fx>${fx('full',L('cook.full'))}<span class="cook2-dot">·</span>${fx('happy',L('cook.happy'))}</div></div>
 <div class="cook2-ings">${r.ingredients?Object.entries(r.ingredients).map(([id,n])=>{const it=CFG.ingredients[id]||{},have=s.ingredients?.[id]||0,cost=it.price!=null?it.price*CFG.cooking.ingredientBuyCount:null;return `<div class="cook2-ing${have>=n?' ok':''}" data-ing="${id}">${it.img?img(it.img):slot('',44,44)}<b>${fmt(have)}/${fmt(n)}</b><button data-act="ingredientBuy" data-item="${id}" ${cost==null||s.coins==null||s.coins<cost?'disabled':''}>${cost==null?L('app.unset'):priceText(cost,'coin')}</button></div>`;}).join(''):(RELEASE?'':`<p>${L('cook.ingUnset')}</p>`)}</div></div>
 <div class="cook2-foot"><span data-craft-time>${s.craft?L('cook.crafting')+' '+tfmt((s.craft.until-clock.now())/1000):L('cook.time')+' '+(r.craftSec!=null?tfmt(r.craftSec):L('app.unset'))}</span><button class="cook2-go" data-act="craft" ${c?'disabled':''}>${c?(!open?L('app.locked',{lv:r.unlockLevel??L('app.unset')}):s.craft?L('cook.crafting'):L('cook.short')):L('cook.make')}</button></div></section>`};};
P.run=()=>{const now=clock.now(),left=Q17.runPlaysLeft(s,now),sk=Q17.skipCheck(s,now),sr=Q17.skipReward(s,now),best=Q17.runDay(s,now).best;return {title:L('run.title'),html:`<section class="card run-start" data-run><p>${L('run.rewards')}</p><div class="run-rewards" data-run-rewards>${Object.entries(CFG.ingredients).filter(([,it])=>it.img).map(([id,it])=>`<span data-ing="${id}"><img src="${it.img}" alt="">${LF('ingredient.'+id,it.name)}</span>`).join('')}</div><p>${L('run.pickShiba')}</p><div class="q17-swipe">${s.shibas.map(sh=>`<button data-act="runShiba" data-id="${sh.id}" aria-pressed="${s.run.shibas[0]===sh.id}">${img(IMG.shiba(sh.breed))}${nameOf(sh)} Lv${sh.level}</button>`).join('')}</div><p data-run-bonus>${L('run.bonus',{n:Q17.runBonusPct(s)})}</p><p>${L('run.playsLeft',{n:left})} · ${L('run.best',{n:best??0})}</p><button class="run-go" data-act="runPlay" ${left&&Q17.runUnlocked(s)?'':'disabled'}>${L('run.start')}</button><div class="btns">${CFG.run.adsEnabled?`<button data-act="runAd" ${Q17.runAdsLeft(s,now)?'':'disabled'}>${L('run.ad')} · ${Q17.runAdsLeft(s,now)}/${CFG.run.daily.adMax}</button>`:''}<button data-act="runSkip" ${sk?'disabled':''}>${L('dlg.skip')}${sr?` · ${COIN_HTML}${fmt(sr.mung)}`:''}</button></div>${sk==='run'?`<p>${L('run.skipNote')}</p>`:''}</section>`};};
game.openExpand=openExpand;document.addEventListener('change',e=>{const el=e.target.closest('[data-shiba-breed]');if(el)act.shibaView({k:'breed',v:el.value});});
game.applyLang=()=>{applyStatic();refresh();};game.startTutorial=()=>{s.tutorialDone=false;startTutorial();refresh();};window.__game=game;applyStatic();refresh();requestAnimationFrame(frame);window.__ready=true;

function consumables(){return `<div class=card data-consumables>${[['incomeBoost4h',L('grant.incomeBoost4h')],['expBoost4h',L('grant.expBoost4h')],['cooldownTicket',L('grant.cooldownTicket')]].map(([k,n])=>`<button data-act=useItem data-item=${k} ${s.items[k]>0&&(k==='cooldownTicket'?S.cooldownTarget(s,clock.now()):Number.isFinite(k==='incomeBoost4h'?CFG.itemIncome.boostMul:CFG.stub.expBoost.mul))?'':'disabled'}>${itemIcon(k)}${n} ×${s.items[k]||0}<small class=fx>${ITEM_FX[k]()}</small>${k!=='cooldownTicket'&&!Number.isFinite(k==='incomeBoost4h'?CFG.itemIncome.boostMul:CFG.stub.expBoost.mul)?(L('bag.mulUnset')?' · '+L('bag.mulUnset'):''):' · '+L('shop.use')}</button>`).join('')}</div>`;}
function unlocks(){return `<div class=card data-unlocks>${[['floor2','', L('space.floor2')],...CFG.themes.filter(t=>t.locked).map(t=>['theme',t.id,LF('theme.'+t.id,t.name)])].map(([kind,id,name])=>`<div>${name} · ${L('app.locked',{lv:kind==='floor2'?CFG.cafe.expansion2FLevel:CFG.themes.find(t=>t.id===id).unlockLevel})}${['coins','dia'].map(via=>`<button data-act=spaceBuy data-kind=${kind} data-id="${id}" data-via=${via} ${S.spaceUnlockCheck(s,kind,id,via)?'disabled':''}>${S.spacePrice(kind,id,via)??L('app.unset')} ${via==='dia'?L('hud.currency.dia'):L('hud.currency.coin')}</button>`).join('')}</div>`).join('')}</div>`;}

// 마을 (2026-10-15): place slots laid out on an empty map area. No village/building art yet → existing icons + labels only (art request).
function villageHtml(){const hurt=s.shibas.filter(sh=>sh.status==='injured'||sh.status==='sick'||sh.status==='hospital').length,V=CFG.village,[W,H]=V.size;
 const info={hospital:[hurt?L('village.hurt',{n:hurt}):'','data-act="villageHospital"'],walk:[s.walkResults.length?L('village.walkDone'):'','data-open="walk"'],ingredients:['','data-open="cooking"']};
 return `<div class="village-map" data-village data-village-map style="aspect-ratio:${W}/${H};background-image:url(${V.background})">${V.places.filter(p=>p.art?.src).map(p=>{const l=V.lots[p.lot],a=p.art,k=a.scale??1;return `<img class="village-art" data-place-art="${p.id}" src="${a.src}" alt="" style="position:absolute;pointer-events:none;left:${(l.x-a.anchor[0]*k)/W*100}%;top:${(l.y-a.anchor[1]*k)/H*100}%;width:${a.size[0]*k/W*100}%">`;}).join('')}${V.lots.map((l,k)=>{const p=V.places.find(x=>x.lot===k);const st=`left:${l.x/W*100}%;top:${l.y/H*100}%;width:${l.w/W*100}%;height:${l.h/H*100}%`;if(!p)return `<span class="village-lot" data-lot="${k}" style="${st}"></span>`;const [sub,act]=info[p.id]||['',''];return `<button class="village-lot village-place" data-lot="${k}" data-place="${p.id}" ${act} style="${st}">${p.icon?`<img src="${p.icon}" alt="">`:''}<strong>${LF('place.'+p.id,p.name)}</strong>${sub?`<small>${sub}</small>`:''}</button>`;}).join('')}</div>`;}
// 가방 아이콘 UI (2026-10-16, 똑또기 확정): 상단 아이콘 탭 3개 + 4열 격자(큰 아이콘 + ×n 배지) + 칸 누르면 가운데 팝업. 아이콘 경로는 CFG.bagUi.
function bagCells(tab){const U=CFG.bagUi,it=s.items,now=clock.now();
 if(tab==='items'){const mulOk=k=>Number.isFinite(k==='incomeBoost4h'?CFG.itemIncome.boostMul:CFG.stub.expBoost.mul);
  return [...['incomeBoost4h','expBoost4h','cooldownTicket'].map(k=>({id:k,src:U.items[k],n:it[k]||0,name:L('grant.'+k),fx:ITEM_FX[k](),btn:`<button data-act="bagUse" data-item="${k}" ${(it[k]||0)>0&&(k==='cooldownTicket'?S.cooldownTarget(s,now):mulOk(k))?'':'disabled'}>${L('shop.use')}</button>`})),
   {id:'heartReset',src:U.items.heartReset,n:it.heartReset||0,name:L('grant.heartReset'),fx:ITEM_FX.heartReset(),btn:`<button data-act="bagHeartReset" ${S.canUseHeartReset(s)?'':'disabled'}>${L('shop.use')}</button>`},
   ...['potionBig','potionSmall'].map(k=>({id:k,src:U.items[k],n:it[k]||0,name:L('dia.'+k),fx:ITEM_FX[k](),btn:`<button disabled hidden>${L('shop.use')}</button><p class="bag-pop-note">${L('bag.potionNote')}</p>`})),
   {id:'capsule',src:U.items.capsule,n:it.capsule||0,name:L('grant.capsule'),fx:L('bag.fx.capsule'),btn:`<button data-act="bagGacha" ${(it.capsule||0)>0&&!S.gachaCheck(s,1,{ticket:true})?'':'disabled'}>${L('shop.use')}</button>`}];}
 if(tab==='furniture'){const walls=(s.wallOwned??PARTITION.count)-s.placement.slots.filter(x=>x.type==='wall').length;
  return [...Object.entries(s.furnitureInv||{}).map(([type,n])=>({id:'f-'+type,src:U.furniture[type],n,name:furnName(type),fx:L('bag.fx.furn'),btn:`<button data-act="bagPlace" data-item="${type}" ${n>0?'':'disabled'}>${L('bag.place')}</button>`})),
   {id:'f-wall',src:U.furniture.wall,n:Math.max(0,walls),name:L('bag.wall'),fx:L('bag.fx.furn'),btn:`<button data-act="bagWall" ${walls>0?'':'disabled'}>${L('bag.place')}</button>`}];}
 return S.bandanaItems().filter(x=>S.accOwned(s,x.id)>0).map(x=>({id:'a-'+x.id,html:bandHtml(x.id),n:S.accOwned(s,x.id),name:accName(x.id),fx:L('acc.counts',{own:S.accOwned(s,x.id),worn:S.accWorn(s,x.id),bag:s.accInv[x.id]||0}),btn:s.shibas.map(sh=>`<button class="sec" data-act="${sh.acc===x.id?'unequip':'equip'}" data-id="${sh.id}" data-item="${x.id}" ${sh.acc===x.id?'':S.equipCheck(s,sh.id,x.id)?'disabled':''}>${nameOf(sh)} · ${sh.acc===x.id?L('acc.unequip'):sh.accUnlocked?L('acc.equip'):L('acc.slotLocked')}</button>`).join('')}));}
function bagGrid(){const tab=ui.bagTab||'furniture',U=CFG.bagUi,cells=bagCells(tab);
 return `<nav class="bag-tabs" role="tablist">${['furniture','items','acc'].map(t=>`<button role="tab" data-act="bagTab" data-item="${t}" aria-selected="${t===tab}" aria-label="${t==='items'?L('bag.items'):L('bag.tab.'+t)}"><img src="${U.tabs[t]}" alt=""></button>`).join('')}</nav><div class="bag-grid" data-bag-grid="${tab}">${cells.map(c=>`<button class="bag-cell${c.n>0?'':' empty'}" data-act="bagCell" data-item="${c.id}" aria-label="${c.name}">${c.html||`<img src="${c.src}" alt="">`}${c.n>0?`<b class="bag-n">×${fmt(c.n)}</b>`:''}</button>`).join('')}</div>${cells.length?'':`<p class="bag-empty">${tab==='acc'?L('acc.none'):''}</p>`}${tab==='furniture'?`<div class="bag-extra"><button data-edit-toggle aria-pressed="${iso.edit}">${iso.edit?L('bag.editEnd'):L('bag.editStart')}</button>${furnitureShop()}<button data-act="wallBuy" ${s.coins<S.wallPrice(s)?'disabled':''}>${L('bag.wall')} ${COIN_HTML}${fmt(S.wallPrice(s))}</button></div>`:''}`;}
function bagPopupHtml(id){const tab=ui.bagTab||'furniture',c=bagCells(tab).find(x=>x.id===id);if(!c)return '';return `<div class="bag-pop${c.n>0?'':' empty'}" data-bag-pop="${id}"><div class="bag-pop-ico">${c.html||`<img src="${c.src}" alt="">`}${c.n>0?`<b class="bag-n">×${fmt(c.n)}</b>`:''}</div><h2>${c.name}</h2><p>${c.fx}</p><div class="bag-pop-btns">${c.n>0?c.btn:c.btn.replace(/<button(?![^>]*disabled)/g,'<button disabled')}</div></div>`;}
function bagItems(){const it=s.items;return `<div class="card" data-bag-items><h3>${L('bag.items')}</h3><div class="li"><span class="ico reset" style="width:34px;height:34px"></span><div class="grow nm">${L('shop.heartReset',{n:it.heartReset})}<small class=fx>${ITEM_FX.heartReset()}</small></div><button data-act="heartReset" ${S.canUseHeartReset(s)?'':'disabled'}>${L('shop.use')}</button></div><div class="li">${img(IMG.potion)}<div class="grow nm">${L('dia.potionBig')} ×${it.potionBig} · ${L('dia.potionSmall')} ×${it.potionSmall}<small class=fx>${ITEM_FX.potionBig()} · ${ITEM_FX.potionSmall()}</small></div></div><div class="li"><div class="grow nm">${L('shop.capsule',{n:it.capsule})}</div></div></div>`;}

// Runtime white-background knockout (원본 파일 unchanged): flood-fill from the image border over near-white pixels → alpha 0.
// Only white connected to the edge is removed, so white fur inside the outline stays. Threshold = CFG.profileBook.knockoutMin.
const knockCache=new Map();
function knockoutWhite(el){const src=el.getAttribute('src');if(el.dataset.knocked===src)return;const done=u=>{el.dataset.src=src;el.src=u;el.dataset.knocked=el.getAttribute('src');};if(knockCache.has(src)){const u=knockCache.get(src);if(u)done(u);return;}knockCache.set(src,null);
 const im=new Image();im.onload=()=>{try{const w=im.naturalWidth,h=im.naturalHeight,c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(im,0,0);const d=x.getImageData(0,0,w,h),a=d.data,T=CFG.profileBook.knockoutMin??240,seen=new Uint8Array(w*h),st=[];
  const white=i=>a[i*4+3]>0&&a[i*4]>=T&&a[i*4+1]>=T&&a[i*4+2]>=T;for(let i=0;i<w;i++){st.push(i,(h-1)*w+i);}for(let j=0;j<h;j++){st.push(j*w,j*w+w-1);}
  while(st.length){const i=st.pop();if(seen[i])continue;seen[i]=1;if(!white(i))continue;a[i*4+3]=0;const px=i%w,py=(i/w)|0;if(px>0)st.push(i-1);if(px<w-1)st.push(i+1);if(py>0)st.push(i-w);if(py<h-1)st.push(i+w);}
  x.putImageData(d,0,0);const u=c.toDataURL('image/png');knockCache.set(src,u);if(el.isConnected)done(u);}catch(e){knockCache.delete(src);}};im.src=src;}
// 상점 테마 카드 이름: 칸보다 길면 글자 크기를 줄여 한 줄에 맞춘다(최소 8px, 카드 크기 유지).
export function fitThemeNames(root=document){root.querySelectorAll('.theme-logo small').forEach(el=>{el.style.fontSize='';let fs=parseFloat(getComputedStyle(el).fontSize)||11;while(el.scrollWidth>el.clientWidth+0.5&&fs>8){fs-=0.5;el.style.fontSize=fs+'px';}});}
new MutationObserver(()=>{document.querySelectorAll('img[data-knockout]').forEach(knockoutWhite);fitThemeNames();}).observe(document.body,{childList:true,subtree:true});

// 첫 실행 동구 안내 (v3): dialogue modals in order; 확인 = 다음, 건너뛰기 = 전부 닫기. Shown once (s.tutorialDone).
function startTutorial(){if(s.tutorialDone||!CFG.tutorial?.steps?.length)return;s.tutorialDone=true;tutorialStep(0);}
function tutorialStep(i){const st=CFG.tutorial.steps[i];if(!st)return;if(st.tab&&TABS.some(t=>t.id===st.tab)){mainTab=st.tab;menuSig='';}
 ui.modals.unshift({kind:'dialogue',variant:'tutorial',tutorial:true,actor:'dongu',speech:`${i+1}/${CFG.tutorial.steps.length}`,text:LF('tutorial.'+(i+1),st.text),tab:st.tab||null,yes:()=>tutorialStep(i+1)});}
