/* 시바견 카페 - 방치형 프로토타입 (순수 HTML5/JS, 빌드 없음). 밸런스 상수·공식은 balance.js */
(function () {
'use strict';
const { BAL, F } = window.SC;
const C = window.BalanceConfig, Core = window.CafeCore;
const { ZONES } = window.CafeZones;
const { DECOR, SLOTS } = window.CafeDecor;

/* ============================================================
 * [광고 연동 지점] showRewardedAd(cb)
 * 지금은 3초짜리 가짜 광고(테스트). 나중에 AdMob 보상형 광고로 이 함수만 교체.
 * cb(true) = 끝까지 시청(보상 지급), cb(false) = 실패/취소
 * 횟수·쿨다운 규칙은 adGate()/watchAd() (monetization.md §2~3)
 * ============================================================ */
let adShowing = false;
let rewardResolver;
function requestReward(type) {
  if (adShowing) return Promise.resolve('unavailable');
  adShowing = true;
  return new Promise(resolve => {
    rewardResolver = result => {
      if (!rewardResolver) return;
      rewardResolver = null; adShowing = false; closeModal(); resolve(result);
    };
    modal(`<h2>광고 테스트 · ${type}</h2><p>미리보기 · SDK 미연결</p><div class="btns">${['completed','cancelled','unavailable'].map(v=>`<button class="btn" data-reward-result="${v}">${v}</button>`).join('')}</div>`);
    document.querySelectorAll('[data-reward-result]').forEach(b=>b.onclick=()=>rewardResolver?.(b.dataset.rewardResult));
  });
}
window.requestReward = requestReward;
/* ---------- 유틸 ---------- */
const $ = s => document.querySelector(s);
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function fmt(n) {
  n = Math.floor(n);
  if (n < 10000) return n.toLocaleString('ko-KR');
  const units = [['경', 1e16], ['조', 1e12], ['억', 1e8], ['만', 1e4]];
  for (const [u, v] of units) if (n >= v) {
    const x = n / v;
    return (x < 100 ? (Math.floor(x * 10) / 10).toString() : Math.floor(x).toLocaleString('ko-KR')) + u;
  }
  return String(n);
}
function fmtTime(s) {
  s = Math.max(0, Math.ceil(s));
  const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), r = s % 60;
  return h > 0 ? `${h}시간 ${m}분` : m > 0 ? `${m}분 ${r}초` : `${r}초`;
}
const params = new URLSearchParams(location.search);
const DEBUG = params.get('debug') === '1';

/* ---------- 데이터 ---------- */
const COATS = {
  red:      { name: '레드',   w: 5 },
  sesame:   { name: '참깨',   w: 2 },
  blacktan: { name: '블랙탄', w: 2 },
  white:    { name: '흰색',   w: 1 },
};
const COAT_KEYS = Object.keys(COATS);
const TRAITS = {
  '잠꾸러기': '자는 시간이 많아요. 꿀잠 영상 구독자 +50%',
  '장난꾸러기': '장난치며 카페를 구경하는 걸 좋아해요',
  '새침데기': '조용히 자기만의 시간을 즐겨요',
  '먹보': '보리차 향이 나는 카페를 좋아해요',
  '애교쟁이': '행복도가 30% 빨리 올라요',
};
const TRAIT_KEYS = Object.keys(TRAITS);
/* 성격 → 표정 스프라이트 키: assets/{coat}_{face}.webp */
const TRAIT_FACE = { '잠꾸러기': 'sleepy', '장난꾸러기': 'grin', '새침데기': 'aloof', '먹보': 'drool', '애교쟁이': 'sparkle' };
const spriteSrc = (coat, trait) => `assets/${COATS[coat] ? coat : 'red'}_${TRAIT_FACE[trait] || 'sparkle'}.webp`;
const pupImg = (coat, trait, cls = '') => `<img class="spr ${cls}" src="${spriteSrc(coat, trait)}" alt="" draggable="false">`;
const OWNER_SRC = 'assets/owner_donggu.webp';   // 동구: 앉아 있는 성견 레드 시바(청록 목걸이·"동구" 은색 이름표) — 사장님 겸 튜토리얼 안내
const ownerImg = (cls = '') => `<img class="spr ${cls}" src="${OWNER_SRC}" alt="동구 사장님" draggable="false">`;
/* 손님: 1 라떼 든 여성, 2 모자 쓴 남성, 3 엄마+아이, 4 할아버지, 5 주스 든 여자아이, 6 강아지 간식 든 남자아이 */
const CUST_SRC = [1, 2, 3, 4, 5, 6].map(i => `assets/cust_${i}.webp`);
const KID_CUST = new Set(['assets/cust_5.webp', 'assets/cust_6.webp']);

const NAMES = ['콩이','보리','두부','마루','호두','밤이','깨순','라떼','모카','쿠키','달이','별이','유자','감자','찹쌀','인절미','누룽지','꿀떡','도토리','단추','몽실','솜이','짱구','하루','초코','율무','땅콩','깨비'];
const FAMILIES = ['서울 김씨네 가족','부산 신혼부부','자취하는 대학생','은퇴하신 할머니','초등학생 쌍둥이네','회사원 삼촌','제주 귤농장 가족','강아지 유튜버 언니','소방관 아저씨','그림 그리는 작가님','캠핑 좋아하는 부부','대전 빵집 사장님'];
const SKILLS = [
  { k: 'sit', n: '앉아' }, { k: 'paw', n: '손' }, { k: 'wait', n: '기다려' },
  { k: 'down', n: '엎드려' }, { k: 'bang', n: '빵야!' },
];
const SKILL_MAX = BAL.skillMax;
const MENU_NAMES = ['아메리카노','시바 라떼','발바닥 쿠키','멍푸치노','인절미 빙수','시바 케이크','꼬리 마카롱','황금 뼈다귀 와플','동구 시그니처 세트'];
const COURSES = ['동네 골목','근린 공원','한강 산책로','숲속 오솔길','바닷가 모래사장','제주 오름'];
const CAMS = ['스마트폰','짐벌','미러리스 카메라','조명 세트','촬영 스튜디오','방송국급 장비'];
const ORDERS = ['🍵'];

const UPGRADES = {
  menu:  { n: '메뉴 개발', ic: '☕',
           desc: lv => `손님 지출 ${fmt(F.perCust(lv))}→${fmt(F.perCust(lv + 1))}/초 · 신메뉴: ${MENU_NAMES[Math.min(lv, MENU_NAMES.length - 1)]}` },
  seats: { n: '좌석 늘리기', ic: '🪑', desc: lv => `최대 손님 ${2 + lv}→${3 + lv}명` },
  toys:  { n: '장난감·인테리어', ic: '🧸',
           desc: lv => `행복도 속도 +${Math.round(BAL.happyToy * 100 * lv)}%→+${Math.round(BAL.happyToy * 100 * (lv + 1))}%` },
  trainer: { n: '훈련사 고용', ic: '🎓',
           desc: lv => `교육 시간 -${Math.round((1 - F.trainMult(lv)) * 100)}%→-${Math.round((1 - F.trainMult(lv + 1)) * 100)}%` },
  course: { n: '산책 코스', ic: '🦮',
           desc: lv => `${COURSES[lv]} → ${COURSES[lv + 1] || '-'} (산책 보상 ↑, 동시 산책 ${F.walkCap(lv)}→${F.walkCap(lv + 1)})` },
  cam:   { n: '촬영 장비', ic: '🎥',
           desc: lv => `${CAMS[lv]} → ${CAMS[lv + 1] || '-'} (구독자 +${Math.round(BAL.camBonus * 100 * lv)}%→+${Math.round(BAL.camBonus * 100 * (lv + 1))}%)` },
};
const upMax = k => k === 'seats' ? 2 : BAL.up[k].max;
function upCost(k) { return F.upCost(k, S.up[k]); }

/* ---------- 상태 ---------- */
const SAVE_KEY = 'shibaCafe_v1';
const SAVE_VER = 2;
const saveService = new CafeSave.SaveService(new CafeSave.LocalStorageAdapter(localStorage), C.schemaVersion, {
  1: d => migrateLegacy(d),
  2: d => {
    const next=Core.init(migrateLegacy(d));next.firstPupGranted=true;
    const cap=C.initialPups+(next.zones.z2_garden?.state==='open'?C.gardenPups:0);
    if(next.pups.length>cap)next.waiting.push(...next.pups.splice(cap));
    next.plays=[];return next;
  }
});
let S;
function newState() {
  return {
    ver: SAVE_VER, coins: BAL.startCoins, rep: 0, subs: 0, total: 0,
    up: { menu: 0, seats: 0, toys: 0, trainer: 0, course: 0, cam: 0 },
    pups: [], adopted: [], nextId: 1, nameIdx: Math.floor(Math.random() * NAMES.length),
    plays: [], boostUntil: 0, boostReadyAt: 0, train: [], walks: [], film: null, videos: [],
    last: Date.now(), playSec: 0, queue: [], dex: {},
    tut: 0, tutPets: 0, freeTrain: true, firstWalk: true,
    ads: null, zones: {z1_tatami: {state:"open"}}, pendingGifts: [], slots: {}, ownedDecor: [],
  };
}
function migrateLegacy(d) {
  const old=!d.ver||d.ver<2,s=Object.assign(newState(),d);
  s.up=Object.assign(newState().up,d.up);
  [...s.pups,...s.adopted].forEach(p=>{if(!COATS[p.coat])p.coat='white';});
  s.pups.forEach(p=>{p.tapHappy ??= 0;});
  const legacyMap=!d.zones;
  if(legacyMap){
    s.zones={z1_tatami:{state:'open'},z2_garden:{state:'open'}};
    const levels=Math.max(0,Math.min(BAL.up.slots.max,Math.floor(Number(s.up.slots)||0)));
    for(let lv=0;lv<levels;lv++)s.coins+=F.upCost('slots',lv);
  }
  delete s.up.slots;
  for(const k in s.up){
    if(!BAL.up[k]){delete s.up[k];continue;}
    s.up[k]=Math.max(0,Math.floor(Number(s.up[k])||0));
    if(k!=='seats'||!legacyMap)s.up[k]=Math.min(s.up[k],upMax(k));
  }
  if(d.up?.seats>2)s.up.seats=Math.min(BAL.up.seats.max,Math.floor(d.up.seats));
  s.ver=SAVE_VER;
  if(old){s.tut=7;s.flow=5;s.freeTrain=false;s.firstWalk=false;s.playSec=9999;s.dex={};s.adopted.forEach(p=>{const key=p.coat+'_'+p.trait;s.dex[key]=(s.dex[key]||0)+1;});}
  return s;
}
function load() {
  const d=saveService.load();
  if(d){
    try {S=Core.init(Object.assign(newState(),d));return true;}
    catch(e){saveService.blocked=true;saveService.error=e.message;}
  }
  S=Core.init(newState());return false;
}
function save(preserveLast=false) {
  if(!preserveLast) S.last = Date.now();
  S.incomePerMin = (seatCap()*BAL.offlineSeatFill*custIncome()+subsIncome())*60;
  return saveService.save(S);
}

function makePup() {
  const combo = C.draw.identities[0];
  const cnt = S.nameCount || 0; S.nameCount = cnt + 1;
  const name = NAMES[(S.nameIdx + cnt) % NAMES.length] + (cnt >= NAMES.length ? Math.floor(cnt / NAMES.length) + 1 : '');
  return {
    id: S.nextId++, name, coat: combo.split("_")[0], trait: combo.split("_")[1],
    rarity:'N', level:1, happy: 0, tapHappy: 0, skills: { sit: 0, paw: 0, wait: 0, down: 0, bang: 0 },
    x: rnd(24, 80), y: rnd(22, 58), sleep: false,
  };
}
const maxPups = () => C.initialPups + (zoneOpen(2)?C.gardenPups:0);
const walkCap = () => 1;
const isPlaying = p => S.plays.some(a=>a.id===p.id);
const seatCap = () => C.seats;
const skillScore = p => Object.values(p.skills).reduce((a, b) => a + b, 0);
const isWalking = p => S.walks.some(w => w.id === p.id);
const isTraining = p => S.train.some(t => t.id === p.id);
const isFilming = p => S.film && S.film.id === p.id;
const busy = p => isWalking(p) || isTraining(p) || isFilming(p) || isPlaying(p);
const boostOn = () => Date.now() < S.boostUntil;
const comboKey = p => p.coat + '_' + p.trait;
const isNewCombo = p => !S.discovered[comboKey(p)];

/* ---------- 손님 (일시 상태, 저장 안 함) ---------- */
let custs = []; let custTimer = 0; let custSeq = 0; let rushUntil = 0;
const SEATS = ZONES[0].spots.seats.map(([x, y]) => ({ x, y }));
function seatedCount() { return custs.filter(c => c.state === 'sit').length; }
function custIncome() { return C.economy.teaPrice/C.economy.orderSec; }
function subsIncome() { return Math.min(S.subs*C.economy.subscriberPerMin/60, seatCap()*custIncome()*C.economy.subscriberIncomeCap); }
function ips() { return seatedCount()*custIncome()*(boostOn()?C.ads.boost.multiplier:1) + subsIncome(); }
function unboostedU() {
  const demand = C.economy.baseDemandPerMin*(1+visitorBonus())*(1+Core.decorEffect(S).demand);
  const throughput = C.seats*60/(C.economy.staySec*(1+Core.decorEffect(S).stay));
  return Math.min(throughput,demand)*C.economy.staySec*(1+Core.decorEffect(S).stay)/C.economy.orderSec*C.economy.teaPrice+subsIncome()*60;
}
function visitorBonus() {
  const bonus=S.pups.map(Core.multiplier).sort((a,b)=>b-a).slice(0,C.economy.topPups).reduce((n,m)=>n+C.economy.shibaBonus*m,0);
  return Math.min(C.economy.totalBonusMax,Math.min(C.economy.shibaBonusMax,bonus)+Math.min(C.economy.subscriberBonusMax,S.subs/C.economy.subscriberDiv));
}
function spawnInterval() {
  const ad=Date.now()<(S.demandUntil||0)?C.ads.demand.bonus:0;
  return 60/(C.economy.baseDemandPerMin*(1+visitorBonus())*(1+Core.decorEffect(S).demand+ad));
}
function spawnCustomer() {
  const used = new Set(custs.map(c => c.seat));
  const free = []; for (let i = 0; i < seatCap(); i++) if (!used.has(i)) free.push(i);
  if (!free.length) return false;
  const seat = pick(free);
  const c = { id: ++custSeq, seat, state: 'walk', t: 0, stay: C.economy.staySec*(1+Core.decorEffect(S).stay), order: pick(ORDERS), spr: pick(CUST_SRC) };
  custs.push(c);
  const el = document.createElement('div'); el.className = 'cust moving' + (KID_CUST.has(c.spr) ? ' kid' : ''); el.id = 'c' + c.id;
  el.innerHTML = `<div class="flipper"><img class="spr" src="${c.spr}" alt="" draggable="false"></div><div class="bubble">${c.order}</div>`;
  el.style.left = '-14%'; el.style.top = '8%';
  $('#floor').appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => { el.style.left = SEATS[seat].x + '%'; el.style.top = SEATS[seat].y + '%'; }));
  return true;
}
function updateCustomers(dt) {
  custTimer += dt;
  if (custTimer >= spawnInterval()) { custTimer = 0; spawnCustomer(); }
  for (const c of custs) {
    c.t += dt;
    const el = document.getElementById('c' + c.id);
    if (c.state === 'walk' && c.t > 1.3) { c.state = 'sit'; c.t = 0; if (el) el.classList.remove('moving'); }
    else if (c.state === 'sit') {
      if (Math.random() < dt * 0.25 && el) popAt(el, '+' + fmt(Math.max(1, custIncome() * 4)), 'coin');
      if (c.t > c.stay) { c.state = 'leave'; c.t = 0; if (el) { el.classList.add('moving', 'flip'); el.style.left = '112%'; el.style.top = '10%'; el.style.opacity = '0'; } }
    } else if (c.state === 'leave' && c.t > 1.4) { c.dead = true; if (el) el.remove(); }
  }
  custs = custs.filter(c => !c.dead);
}

/* ---------- 효과 ---------- */
function popAt(el, text, cls) {
  const room = $('#room').getBoundingClientRect(), r = el.getBoundingClientRect();
  const d = document.createElement('div'); d.className = 'pop ' + (cls || '');
  d.textContent = text; d.style.left = (r.left - room.left + r.width / 2 - 14 + rnd(-8, 8)) + 'px'; d.style.top = (r.top - room.top) + 'px';
  $('#fx').appendChild(d); setTimeout(() => d.remove(), 1000);
}
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.remove('hidden'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.add('hidden'), 2600); }
function hopEl(el) { const b = el.querySelector('.body') || el; b.classList.remove('hop'); void b.offsetWidth; b.classList.add('hop'); }

/* ---------- 강아지 렌더/행동 ---------- */
function syncPupEls() {
  const floor = $('#floor');
  const visible = new Set(S.pups.map(p => p.id));
  $('#world').querySelectorAll('.pup').forEach(el => { if (!visible.has(+el.dataset.id)) el.remove(); });
  for (const p of S.pups) {
    if (!visible.has(p.id)) continue;
    let el = $('#world').querySelector(`.pup[data-id="${p.id}"]`);
    if (!el) {
      el = document.createElement('div'); el.className = 'pup'; el.dataset.id = p.id;
      el.innerHTML = `<div class="body"><div class="flipper">${pupImg(p.coat, p.trait)}</div></div><div class="hb"><i></i></div><div class="nm">${p.name}</div><div class="zz">💤</div><div class="badge"></div>`;
      el.style.left = p.x + '%'; el.style.top = p.y + '%'; el.style.zIndex = 5 + Math.round(p.y);
      el.addEventListener('click', () => tapPup(p.id));
      floor.appendChild(el);
    }
    const zone = isWalking(p)&&zoneOpen(3)?ZONES[2]:isPlaying(p)?ZONES[3]:zoneOpen(2)&&p.id%3===0?ZONES[1]:ZONES[0];
    const parent = zone.no===1?floor:$(`[data-zone="${zone.id}"]`);
    if(parent && el.parentNode!==parent) parent.appendChild(el);
    p.zone=zone.no;const spot=zone.spots.pups[p.id%zone.spots.pups.length];p.x=spot[0];p.y=spot[1];el.style.left=p.x+'%';el.style.top=p.y+'%';el.style.zIndex=5+Math.round(p.y);
  }
}
function updatePupEls() {
  for (const p of S.pups) {
    const el = $(`#world .pup[data-id="${p.id}"]`); if (!el) continue;
    el.querySelector('.hb i').style.width = p.happy + '%';
    el.classList.toggle('sleep', !!p.sleep);
    el.dataset.rarity=p.rarity||'N';
    el.querySelector('.nm').textContent=p.name+' · '+(p.rarity||'N')+' 스카프';
    const b = el.querySelector('.badge');
    const badge = p.happy >= 100 ? '<div class="adopt">💌 입양 희망!</div>' :
      isTraining(p) ? '<div class="adopt blue">🎓 교육중</div>' :
      isFilming(p) ? '<div class="adopt red">🎥 촬영중</div>' : '';
    if (b.dataset.v !== badge) { b.innerHTML = badge; b.dataset.v = badge; }
  }
}
function wander() {
  for (const p of S.pups) {
    if (busy(p) || Math.random() < 0.35) continue;
    const sleepy = p.trait === '잠꾸러기' ? 0.5 : 0.18;
    p.sleep = !isTraining(p) && !isFilming(p) && p.happy < 100 && Math.random() < sleepy;
    if (!p.sleep) {
      const spot=pick(ZONES[(p.zone||1)-1].spots.pups);const nx=spot[0],ny=spot[1];
      const el = $(`#world .pup[data-id="${p.id}"]`);
      if (el) {
        el.classList.toggle('flip', nx < p.x); el.classList.add('moving');
        el.style.left = nx + '%'; el.style.top = ny + '%'; el.style.zIndex = 5 + Math.round(ny);
        clearTimeout(el._mv); el._mv = setTimeout(() => el.classList.remove('moving'), 2400);
      }
      p.x = nx; p.y = ny;
    }
  }
}
const lastTap = {};
function tapPup(id) {
  const p = S.pups.find(q => q.id === id); if (!p) return;
  const el = $(`#world .pup[data-id="${p.id}"]`);
  if (p.happy >= 100) { openAdoption(p); return; }
  p.sleep = false;
  if (el) { hopEl(el); popAt(el, '❤️', 'heart'); }
  const now = performance.now() / 1000;
  if (now - (lastTap[p.id] || -9) < BAL.tapCooldown) return;   // 시바별 0.4초: 하트만, 보상 없음
  lastTap[p.id] = now;
  const gain = F.tapCoin(seatedCount() * custIncome(), subsIncome());
  addCoins(gain);
  const add = Math.min(BAL.tapHappy, Math.max(0, BAL.tapHappyCap - (p.tapHappy || 0)));
  p.tapHappy = (p.tapHappy || 0) + add; p.happy = Math.min(100, p.happy + add);
  if (el) setTimeout(() => popAt(el, '+' + fmt(gain)), 120);
  tutEvent('pet'); save();
}
function addCoins(n) { S.coins += n; S.total += n; }

/* ---------- 입양 ---------- */
function adoptReward(p) { return Core.adoption(p); }
function openAdoption(p) {
  $('#panel').classList.remove('open');
  if(p.happy<100 || busy(p))return toast('행복도를 채우고 활동이 끝나면 입양할 수 있어요');
  if (!p.family) p.family = pick(FAMILIES);
  const r=adoptReward(p),rp=Math.round(C.adoption.reputation*C.rarity[p.rarity]*(1+C.adoption.reputationTraining*Core.training(p)));
  modal(`<div class="pic">${pupImg(p.coat,p.trait)}</div><h2>💌 입양 확인</h2>
  <p>${p.family} · <b>${p.name}</b><br>${COATS[p.coat].name} · ${p.trait} · ${p.rarity} 스카프 · Lv${p.level}</p>
  <p>교육 ${Core.training(p)}/${C.adoption.trainingMax} · 성장 계수 ${Core.multiplier(p).toFixed(2)}<br>이 시바는 카페에서 떠나요. 성장비·조각은 환급되지 않아요.<br>스타견 활동 없음 · 구독자와 발견 기록은 남아요.</p>
  <div class="big">🪙 ${fmt(r)} · ⭐ +${rp}</div><div class="btns"><button class="btn pink" id="okAdopt">확인 · 입양 보내기</button><button class="btn gray" id="noAdopt">조금 더 함께</button></div>`);
  let sent=false;
  $('#okAdopt').onclick=()=>{if(sent)return;sent=true;closeModal();doAdopt(p,r,rp);};$('#noAdopt').onclick=closeModal;
}
function doAdopt(p, reward, rp) {
  if (!S.pups.includes(p)) return;
  addCoins(reward); S.rep += rp;
  S.train = S.train.filter(t => t.id !== p.id); S.walks = S.walks.filter(w => w.id !== p.id); S.plays = S.plays.filter(a=>a.id!==p.id);
  if (S.film && S.film.id === p.id) S.film = null;
  const d = new Date(), k = comboKey(p), first = !S.dex[k];
  S.dex[k] = (S.dex[k] || 0) + 1;
  S.adopted.unshift({ name: p.name, coat: p.coat, trait: p.trait, family: p.family || pick(FAMILIES), skill: skillScore(p), date: `${d.getMonth() + 1}/${d.getDate()}` });
  S.adopted = S.adopted.slice(0, 200);
  S.adoptCount = (S.adoptCount || S.adopted.length - 1) + 1;
  S.pups = S.pups.filter(q => q !== p);
  syncPupEls();
  toast(`🏡 ${p.name}가 ${p.family}에게 입양됐어요! +${fmt(reward)}${first ? ' · 도감 등록!' : ''}`);
  S.lastAdoption={id:'adopt-'+S.adoptCount,coins:reward,claimed:false};
  dailyCareTicket();
  tutEvent('adopt');
  renderPanel(); save();
}
const adoptedN = () => Math.max(S.adopted.length, S.adoptCount || 0);
/* 빈자리는 한 마리씩 5~15초 간격으로 도착 (첫 시작은 즉시) */
function fillPups(immediate) {
  if(immediate && !S.firstPupGranted) {
    if(!S.pups.length && !adoptedN()){const p=makePup();S.pups.push(p);S.discovered[comboKey(p)]=1;S.scarves[comboKey(p)+'_N']=1;}
    S.firstPupGranted=true;
  }
  syncPupEls();
}
function arrivePups() {} // v0.6: 튜토리얼 이후에는 소원권으로만 획득.

/* ---------- 교육 / 산책 / 유튜브 ---------- */
function trainCost(p) { return S.freeTrain ? 0 : F.trainCost(S.up.menu, seatCap(), adoptedN(), skillScore(p)); }
function trainTime(p, k) { return F.trainTime(p.skills[k], S.up.trainer); }
const TRAIN_SLOTS = 1;
function startTrain(id, k) {
  const p = S.pups.find(q => q.id === id); if (!p || busy(p) || p.skills[k] >= SKILL_MAX) return;
  if (S.train.length >= TRAIN_SLOTS) return toast('교육장이 꽉 찼어요 (동시에 1마리)');
  const c = trainCost(p); if (S.coins < c) return toast('코인이 부족해요');
  S.coins -= c; S.freeTrain = false; const dur = trainTime(p, k);
  S.train.push({ id, k, left: dur, dur }); p.sleep = false; renderPanel();
  save();
}
function walkReward() { return F.walkReward(S.up.menu, seatCap(), S.up.course); }
function walkTime() { return S.firstWalk ? BAL.walkFirstSec : BAL.walkSec; }
function startWalk(id) {
  const p = S.pups.find(q => q.id === id); if (!p || busy(p)) return;
  if (S.walks.length >= walkCap()) return toast(`지금은 동시에 ${walkCap()}마리까지 산책할 수 있어요`);
  const t = walkTime(); S.firstWalk = false;
  S.walks.push({ id, left: t, dur: t }); syncPupEls(); renderPanel();
  toast(`🦮 ${p.name} ${COURSES[S.up.course]}(으)로 산책 출발!`);
  save();
}
function startPlay(id) {
  const p=S.pups.find(p=>p.id===id);if(!zoneOpen(4)||!p||busy(p)||Date.now()<(p.playReadyAt||0))return;
  const dur=BAL.walkSec*.5;S.plays.push({id,left:dur,dur});p.playReadyAt=Date.now()+BAL.walkSec*3*1000;syncPupEls();renderPanel();save();
}
function finishWalk(w) {
  const p = S.pups.find(q => q.id === w.id); if (!p) return;
  const r = walkReward(); addCoins(r);
  p.happy = Math.min(100, p.happy + F.activityHappy(BAL.walkHappy,adoptedN()));
  rushUntil = Date.now() + BAL.rushSec * 1000;    // 갱신(중첩 X)
  for (let i = 0; i < 2; i++) setTimeout(spawnCustomer, 600 + i * 900);
  dailyCareTicket(); tutEvent('care');
  toast(`🦮 ${p.name} 산책 끝! +${fmt(r)} · 행복도 +${BAL.walkHappy} · 손님이 몰려와요!`);
}
const TOPICS = { '잠꾸러기': '방석 위 꿀잠 ASMR', '장난꾸러기': '보자기 창고 대소동', '새침데기': '만지지 마라 시바 거절', '먹보': '간식 기다려 챌린지', '애교쟁이': '손님 무릎 위 애교 폭발' };
function startFilm(id) {
  const p = S.pups.find(q => q.id === id); if (!p || busy(p)) return;
  if (S.film) return toast('이미 촬영 중이에요');
  if(Date.now()<(S.filmReadyAt||0))return toast('촬영은 30분마다 할 수 있어요');
  S.filmReadyAt=Date.now()+C.economy.filmCooldownSec*1000;
  const sk = SKILLS.filter(s => p.skills[s.k] > 0);
  const topic = sk.length && Math.random() < 0.5 ? `${pick(sk).n} 성공 영상` : TOPICS[p.trait];
  S.film = { id, left: BAL.filmSec, dur: BAL.filmSec, title: `아기시바 ${p.name}의 ${topic}` };
  p.sleep = false; renderPanel();
  save();
}
function finishFilm() {
  const f = S.film; S.film = null;
  const p = S.pups.find(q => q.id === f.id);
  const subs = Math.round(C.economy.filmSubs*Core.multiplier(p||{rarity:"N",level:1})), viral=false;
  const views = Math.floor(subs * rnd(20, 60));
  S.subs += subs;
  S.videos.unshift({ title: f.title, views, subs, viral }); S.videos = S.videos.slice(0, 8); save();
  toast(viral ? `🔥 떡상! "${f.title}" 구독자 +${fmt(subs)}` : `🎬 영상 업로드! 구독자 +${fmt(subs)}`);
  renderPanel();
}

/* ---------- 광고 규칙 (가짜 광고, 규칙만 실제와 동일) ---------- */
function today() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
function adState() {
  if(!S.ads||S.ads.day!==today())S.ads={day:today(),total:0,...Object.fromEntries(Object.keys(C.ads).filter(k=>typeof C.ads[k]==='object').map(k=>[k,0]))};
  for(const k of ['adopt','boost','ticket','demand','offline']) S.ads[k] ||= 0;
  return S.ads;
}
function adGate(pl) {
  const a=adState(),slot=C.ads[pl];
  if(!slot)return {ok:false,why:'미지원 보상'};
  if(a.total>=C.ads.dailyTotal||a[pl]>=slot.daily)return {ok:false,cap:true,why:'오늘 보상 상한에 도달했어요'};
  if((pl==='boost'&&Date.now()<(S.demandUntil||0))||(pl==='demand'&&boostOn()))return {ok:false,why:'실시간 부스트는 동시에 사용할 수 없어요'};
  return {ok:true};
}
async function watchAd(pl,onReward,onFail) {
  const gate=adGate(pl);if(!gate.ok){toast(gate.why);onFail?.();return 'unavailable';}
  const day=today(),result=await requestReward(pl);
  if(result!=='completed'){onFail?.();return result;}
  if(day!==today()||!adGate(pl).ok)return 'unavailable';
  const a=adState();a.total++;a[pl]++;a.lastAt=Date.now();onReward();save();return result;
}
const boostUnlocked = () => adoptedN() >= 1 && S.playSec >= BAL.ads.boost.minPlaySec && tutDone();

/* ---------- 튜토리얼 (동구 안내, 첫 3분) ---------- */
const TUT = [
 {ev:'draw',text:()=>`소원권 ${S.tickets}장이 있어요.<br><b>소원권 뽑기</b>로 시바를 만나 주세요!`,target:'#drawBtn'},
 {ev:'care',text:()=>'<b>교육 또는 산책</b>을 한 번 마쳐 주세요.<br>쓰다듬으며 행복도도 채워요.',target:'#tabs [data-tab=train]'},
 {ev:'adopt',text:()=>'<b>행복도 100%</b>인 시바를 눌러<br>새 가족에게 입양을 확인해 주세요.',target:'#floor .pup'},
 {ev:'decor',text:()=>'<b>일본 정원 소품</b>을 하나 놓아 봐요.<br>이끼 정원은 입양 2회 후 열려요.',target:'#decorBtn'},
 {ev:'photo',text:()=>'<b>사진 저장</b>으로 내 카페를 남겨요.<br>9:16 미리보기 이미지가 내려받아져요.',target:'#photoBtn'}
];
const TAB_UNLOCK={cafe:0,train:1,walk:1,book:1,yt:1};
const TAB_HINT={train:'소원권 뽑기 후 열려요',walk:'소원권 뽑기 후 열려요',book:'소원권 뽑기 후 열려요',yt:'소원권 뽑기 후 열려요'};
const tutDone=()=>S.flow>=TUT.length;
const tabOpen=t=>S.flow>=TAB_UNLOCK[t];
function tutEvent(ev){
 if(tutDone())return;
 if(TUT[S.flow]?.ev===ev){S.flow++;S.tut=tutDone()?7:S.flow;renderTabs();renderPanel();renderHUD();save();if(tutDone())hideBubble();}
}
function showBubble(html) { const b = $('#tut'); b.innerHTML = `<div class="av">${ownerImg()}</div><div class="tx">${html}</div>`; b.classList.remove('hidden'); }
function hideBubble() { $('#tut').classList.add('hidden'); }
function renderTut() {
  document.querySelectorAll('.tut-target').forEach(e => e.classList.remove('tut-target'));
  if (tutDone()) return;
  const st = TUT[S.flow]; if(!st)return; showBubble(st.text());
  const sel = typeof st.target === 'function' ? st.target() : st.target;
  const el = sel && document.querySelector(sel); if (el) el.classList.add('tut-target');
}

/* ---------- 메인 틱 ---------- */
let speed = 1, wanderT = 0, saveT = 0, panelT = 0;
function tick(dt) {
  updateZones();
  S.playSec += dt;
  updateCustomers(dt);
  const income = ips(); addCoins(income * dt);
  const seated = seatedCount();
  for (const p of S.pups) {
    let r = F.happyRate(seated, S.up.toys, p.trait, p.sleep && !isWalking(p), adoptedN());
    if (!tutDone() && adoptedN()===0) r=Math.max(C.tutorial.minHappyRate,r);
    if (isWalking(p)) r *= BAL.walkHappyRate;
    p.happy = Math.min(100, p.happy + r * dt);
  }
  for (const t of S.train) { t.left -= dt; }
  const doneT = S.train.filter(t => t.left <= 0);
  for (const t of doneT) {
    const p = S.pups.find(q => q.id === t.id);
    if (p) { dailyCareTicket(); tutEvent('care'); p.skills[t.k] = Math.min(SKILL_MAX, p.skills[t.k] + 1); toast(`🎓 ${p.name} "${SKILLS.find(s => s.k === t.k).n}" Lv${p.skills[t.k]} 성공!`); }
  }
  for (const w of S.walks) w.left -= dt;
  const doneW = S.walks.filter(w => w.left <= 0);
  S.train = S.train.filter(t => t.left > 0); S.walks = S.walks.filter(w => w.left > 0);
  doneW.forEach(finishWalk);
  if (S.film) { S.film.left -= dt; if (S.film.left <= 0) finishFilm(); }
  S.plays.forEach(a=>a.left-=dt);const doneP=S.plays.filter(a=>a.left<=0);
  for(const a of doneP){const p=S.pups.find(p=>p.id===a.id);if(p)p.happy=Math.min(100,p.happy+F.activityHappy(BAL.walkHappy*.7,adoptedN()));}
  S.plays=S.plays.filter(a=>a.left>0);if(doneP.length){syncPupEls();renderPanel();}
  arrivePups();
  if (doneT.length || doneW.length) { syncPupEls(); renderPanel(); save(); }
}
let lastFrame = performance.now();
function loop() {
  const now = performance.now(); let real = Math.min(0.5, (now - lastFrame) / 1000); lastFrame = now;
  if (adShowing) return;                                   // 광고 중 게임 시간 정지
  const dt = real * speed;
  tick(dt);
  wanderT += real; if (wanderT > 2.6) { wanderT = 0; wander(); }
  saveT += real; if (saveT > C.saveIntervalSec && !document.hidden) { saveT = 0; save(); }
  panelT += real; if (panelT > 0.25) { panelT = 0; renderHUD(); refreshPanel(); updatePupEls(); renderTut(); }
}

/* ---------- HUD / 패널 ---------- */
function renderHUD() {
  renderZoneGoal();
  $('#coins').textContent = fmt(S.coins);
  $('#rep').textContent = fmt(S.rep);
  $('#subs').textContent = fmt(S.subs);
  const v = ips(); $('#ips').textContent = v < 10 ? v.toFixed(1) : fmt(v);
  const on = boostOn(), unlocked = boostUnlocked(), g = unlocked && !on ? adGate('boost') : null;
  const bb = $('#boostBtn');
  bb.classList.toggle('hidden', !!(on || !unlocked || (g && g.cap)));
  if (g) { bb.classList.toggle('wait', !g.ok); bb.textContent = g.ok ? '📺' : '⏳'; bb.title = g.ok ? '광고 보고 수익 2배' : g.why; }
  $('#boostTimer').classList.toggle('hidden', !on);
  if (on) $('#boostTimer').textContent = `🔥 ${fmtTime((S.boostUntil - Date.now()) / 1000)}`;
}
let tab = 'cafe';
function pupIcon(p) { return `<div class="ic scarf-${p.rarity||'N'}">${pupImg(p.coat, p.trait)}<small>${p.rarity||'N'}</small></div>`; }
function skillChips(p) { return SKILLS.map(s => `<span class="chip ${p.skills[s.k] ? 'on' : ''}">${s.n}${p.skills[s.k] ? ' ' + p.skills[s.k] : ''}</span>`).join(''); }
function upRow(k) {
  const u = UPGRADES[k], lv = S.up[k], max = lv >= upMax(k);
  return `<div class="row"><div class="ic">${u.ic}</div><div class="tx"><b>${u.n} <small>Lv${lv}</small></b><p>${max ? (k==='seats'?'두 번째 다다미방에서 더 늘릴 수 있어요':'최대 레벨!') : u.desc(lv)}</p></div>
    ${max ? '<button class="btn" disabled>MAX</button>' : `<button class="btn" data-act="buy" data-arg="${k}" data-cost="${upCost(k)}">🪙 ${fmt(upCost(k))}</button>`}</div>`;
}
function renderTabs() {
  document.querySelectorAll('#tabs button').forEach(b => { b.classList.toggle('locked', !tabOpen(b.dataset.tab)); b.classList.toggle('on', b.dataset.tab === tab); });
}
function renderPanel() {
  const P = $('#panel'); let h = '';
  if (tab === 'cafe') {
    h += `<div class="h">카페 업그레이드 <small>손님 <span data-seat>${seatedCount()}</span>/${seatCap()} · 아기 시바 ${S.pups.length}/${maxPups()}</small></div>`;
    h += `<p class="note">보리차 · 주문당 ${C.economy.teaPrice}코인 · 좌석 ${C.seats}</p><button class="btn" data-act="draw">소원권 뽑기 (${S.tickets})</button>`;
    h += `<div class="h" style="margin-top:12px">우리 아기 시바들 <small>행복도 가득 차면 입양 신청!</small></div>`;
    h += S.pups.map(p => `<div class="row">${pupIcon(p)}<div class="tx"><b>${p.name}</b> <small class="chip">${COATS[p.coat].name}</small> <small class="chip">${p.trait}</small>${isNewCombo(p) ? ' <small class="chip new">도감 NEW</small>' : ''}
       <p>${TRAITS[p.trait]}</p><div class="bar"><i data-happy="${p.id}" style="width:${p.happy}%" class="pink"></i></div></div>
       ${p.happy >= 100 && !isWalking(p) ? `<button class="btn pink" data-act="adopt" data-arg="${p.id}">입양</button>` : `<span data-hp="${p.id}" class="hp">${Math.floor(p.happy)}%</span>`}</div>`).join('');
    if (S.queue.length) h += `<div class="row soft"><div class="ic">🚗</div><div class="tx"><b>새 아기 시바가 오는 중…</b><p data-queue>${fmtTime(S.queue[0] - S.playSec)} 뒤 도착</p></div></div>`;
  } else if (tab === 'train') {
    h += `<div class="h">🎓 시바 교육 <small>교육 완료 단계마다 입양 보상 +${Math.round(C.adoption.training * 100)}% (최대 ${C.adoption.trainingMax}단계)</small></div>`;

    for (const t of S.train) { const p = S.pups.find(q => q.id === t.id); if (p) h += `<div class="row">${pupIcon(p)}<div class="tx"><b>${p.name} - "${SKILLS.find(s => s.k === t.k).n}" 연습 중</b><div class="bar"><i data-prog="train-${t.id}" style="width:${100 - t.left / t.dur * 100}%"></i></div><p data-timer="train-${t.id}">${fmtTime(t.left)} 남음</p></div></div>`; }
    h += S.pups.map(p => {
      const b = busy(p), cost = trainCost(p);
      return `<div class="row" style="flex-wrap:wrap">${pupIcon(p)}<div class="tx"><b>${p.name}</b> <small>${b ? (isWalking(p) ? '산책 중' : isFilming(p) ? '촬영 중' : '교육 중') : cost === 0 ? '🎁 첫 교육 무료!' : `교육비 🪙 ${fmt(cost)}`}</small><div class="chips">${skillChips(p)}</div></div>
        <div style="display:flex;gap:5px;flex-wrap:wrap;width:100%">${SKILLS.map(s => p.skills[s.k] >= SKILL_MAX ? '' : `<button class="btn sm" data-act="train" data-arg="${p.id}:${s.k}" data-cost="${cost}" ${b || S.train.length >= TRAIN_SLOTS ? 'data-lock="1" disabled' : ''}>${s.n}<br><small>${Math.round(trainTime(p, s.k))}초</small></button>`).join('')}</div></div>`;
    }).join('');
  } else if (tab === 'walk') {
    h += `<div class="h">🦮 산책시키기 <small>${COURSES[S.up.course]} · 동시 ${S.walks.length}/${walkCap()}</small></div>`;
    h += `<p class="note">산책 다녀오면 코인 + 행복도 +${BAL.walkHappy}, 그리고 동네 사람들이 보고 손님이 몰려와요! (산책 중에도 행복도는 절반 속도로 올라요)</p>`;

    if(zoneOpen(4)) h+=`<div id="playCard"><div class="h">🎾 놀이터 놀이</div><p class="note">${BAL.walkSec*.5}초 · 행복도 +${BAL.walkHappy*.7} · 코인 없음 · 재사용 ${BAL.walkSec*3}초</p>${S.pups.map(p=>`<div class="row">${pupIcon(p)}<div class="tx"><b>${p.name}</b><p>${isPlaying(p)?'놀이 중':Math.max(0,Math.ceil(((p.playReadyAt||0)-Date.now())/1000))+'초 뒤 사용 가능'}</p></div><button class="btn" data-act="play" data-arg="${p.id}" ${busy(p)||Date.now()<(p.playReadyAt||0)?'disabled':''}>놀기</button></div>`).join('')}</div>`;

    h += S.pups.map(p => {
      const w = S.walks.find(x => x.id === p.id);
      if (w) return `<div class="row">${pupIcon(p)}<div class="tx"><b>${p.name} 산책 중… 🐾</b><div class="bar"><i data-prog="walk-${p.id}" style="width:${100 - w.left / w.dur * 100}%"></i></div><p data-timer="walk-${p.id}">${fmtTime(w.left)} 남음</p></div></div>`;
      return `<div class="row">${pupIcon(p)}<div class="tx"><b>${p.name}</b><p>보상 🪙 ${fmt(walkReward())} · ${walkTime()}초</p></div><button class="btn" data-act="walk" data-arg="${p.id}" ${busy(p) || S.walks.length >= walkCap() ? 'disabled' : ''}>산책 가기</button></div>`;
    }).join('');
  } else if (tab === 'yt') {
    h += `<div class="h">🎬 동구네 시바TV <small>구독자 ${fmt(S.subs)}명</small></div>`;
    h += `<p class="note">구독자 1명당 초당 ${BAL.subsIncome} 코인 + 구독자가 많을수록 손님이 자주 와요. 교육받은 시바일수록 구독자가 더 늘어요!</p>`;

    if (S.film) { const p = S.pups.find(q => q.id === S.film.id); h += `<div class="row">${p ? pupIcon(p) : ''}<div class="tx"><b>🔴 촬영 중: ${S.film.title}</b><div class="bar"><i data-prog="film" style="width:${100 - S.film.left / S.film.dur * 100}%" class="red"></i></div><p data-timer="film">${fmtTime(S.film.left)} 남음</p></div></div>`; }
    h += S.pups.map(p => `<div class="row">${pupIcon(p)}<div class="tx"><b>${p.name}</b><p>${p.trait} · 교육 ${skillScore(p)}레벨</p></div><button class="btn pink" data-act="film" data-arg="${p.id}" ${busy(p) || S.film ? 'disabled' : ''}>촬영하기</button></div>`).join('');
    if (S.videos.length) {
      h += `<div class="h" style="margin-top:12px">업로드한 영상</div>`;
      h += S.videos.map(v => `<div class="row"><div class="ic">${v.viral ? '🔥' : '▶️'}</div><div class="tx"><b style="font-size:13px">${v.title}</b><p>조회수 ${fmt(v.views)}회 · 구독자 +${fmt(v.subs)}</p></div></div>`).join('');
    }
  } else if (tab === 'book') {
    const got = Object.keys(S.discovered).length;
    h += `<div class="h">📖 시바 도감 <small>${got}/20 · 입양 ${adoptedN()}마리</small></div>`;
    h += `<p class="note">털색 4가지 × 성격 5가지. 획득 시 발견 기록 · 첫 주 5종 · 스카프 ${Object.keys(S.scarves).length}/80</p>`;
    h += `<div class="dex"><div></div>${TRAIT_KEYS.map(t => `<div class="dh">${t}</div>`).join('')}`;
    for (const c of COAT_KEYS) {
      h += `<div class="dh side">${COATS[c].name}</div>`;
      h += TRAIT_KEYS.map(t => { const n = S.discovered[c + '_' + t]; return `<div class="slot ${n ? 'got' : ''}">${pupImg(c, t)}${n ? `<span>×${n}</span>` : '<span>?</span>'}</div>`; }).join('');
    }
    h += `</div>`;
    h += `<div class="h" style="margin-top:12px">새 가족을 찾은 아이들</div>`;
    h += S.adopted.length ? `<div class="book">${S.adopted.slice(0, 30).map(a => `<div class="bk">${pupImg(a.coat, a.trait)}<b>${a.name}</b>${COATS[a.coat].name} · ${a.trait}<br>🏡 ${a.family}<br><small>${a.date}</small></div>`).join('')}</div>`
      : `<div class="empty">아직 입양 간 아이가 없어요.<br>행복도를 가득 채우면 입양 신청이 와요! 💌</div>`;
  }
  P.innerHTML = h;
}
function refreshPanel() {
  const P = $('#panel');
  P.querySelectorAll('[data-cost]').forEach(b => { if (!b.dataset.lock) b.disabled = S.coins < +b.dataset.cost; });
  P.querySelectorAll('[data-happy]').forEach(i => { const p = S.pups.find(q => q.id === +i.dataset.happy); if (p) i.style.width = p.happy + '%'; });
  let re = false;
  P.querySelectorAll('[data-hp]').forEach(i => { const p = S.pups.find(q => q.id === +i.dataset.hp); if (p) { i.textContent = Math.floor(p.happy) + '%'; if (p.happy >= 100) re = true; } });
  P.querySelectorAll('[data-seat]').forEach(e => e.textContent = seatedCount());
  const q = P.querySelector('[data-queue]'); if (q) { if (S.queue.length) q.textContent = fmtTime(S.queue[0] - S.playSec) + ' 뒤 도착'; else re = true; }
  if (tab === 'cafe' && !q && S.queue.length) re = true;
  const tm = (key) => key === 'film' ? S.film : key.startsWith('train-') ? S.train.find(t => t.id === +key.slice(6)) : S.walks.find(w => w.id === +key.slice(5));
  P.querySelectorAll('[data-timer]').forEach(e => { const t = tm(e.dataset.timer); if (t) e.textContent = fmtTime(t.left) + ' 남음'; });
  P.querySelectorAll('[data-prog]').forEach(e => { const t = tm(e.dataset.prog); if (t) e.style.width = (100 - t.left / t.dur * 100) + '%'; });
  if (re) renderPanel();
}
$('#panel').addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  const a = b.dataset.act, arg = b.dataset.arg;
  if (a === 'draw') return openDraw();
  if (a === 'buy') {
    const c = upCost(arg); if (S.coins < c || S.up[arg] >= upMax(arg)) return;
    S.coins -= c; S.up[arg]++;
        toast(`✨ ${UPGRADES[arg].n} Lv${S.up[arg]}!`);
    renderPanel(); save();
    tutEvent('buy:' + arg);
  } else if (a === 'adopt') { const p = S.pups.find(q => q.id === +arg); if (p) openAdoption(p); }
  else if (a === 'train') { const [id, k] = arg.split(':'); startTrain(+id, k); }
  else if (a === 'walk') startWalk(+arg);
  else if (a === 'play') startPlay(+arg);
  else if (a === 'film') startFilm(+arg);
});
function switchTab(t) {
  $('#panel').classList.add('open'); tab = t; renderTabs(); renderPanel(); $('#panel').scrollTop = 0;
}
document.querySelectorAll('#tabs button').forEach(b => b.addEventListener('click', () => {
  const t = b.dataset.tab;
  if (!tabOpen(t)) { toast(`🔒 ${TAB_HINT[t]}`); return; }
  switchTab(t); tutEvent('tab:' + t);
}));

/* ---------- 모달 / 광고 부스트 / 오프라인 ---------- */
function modal(html) { CafeMap.stop(); $('#modalCard').innerHTML = html; $('#modal').classList.remove('hidden'); }
function closeModal() { $('#modal').classList.add('hidden'); setTimeout(offerGift, 50); }
$('#boostBtn').addEventListener('click', () => {
  const g = adGate('boost'); if (!g.ok) return toast(g.why);
  const left = BAL.ads.boost.daily - adState().boost;
  modal(`<div class="pic">${ownerImg()}</div><h2>📺 수익 2배 부스트</h2><p>광고를 끝까지 보면 <b>${BAL.ads.boost.durSec / 60}분 동안</b><br><b>손님 코인</b>이 2배가 돼요!<br><small>(쓰다듬기·산책·입양 보상은 그대로 · 오늘 ${left}번 남음)</small></p>
    <div class="btns"><button class="btn pink" id="bOk">광고 보고 2배 받기</button><button class="btn gray" id="bNo">다음에</button></div>`);
  $('#bOk').onclick = () => { closeModal(); watchAd('boost', () => {
    S.boostUntil = Math.max(Date.now(),S.boostUntil) + BAL.ads.boost.durSec * 1000;
    S.boostReadyAt = S.boostUntil + BAL.ads.boost.afterSec * 1000;
    toast(`🔥 ${BAL.ads.boost.durSec / 60}분간 손님 코인 2배!`);
  }); };
  $('#bNo').onclick = closeModal;
});
$('#boss').addEventListener('click', () => {
  hopEl($('#boss'));
  if (!tutDone()) { renderTut(); return; }
  const line = pick(['손님한테 친절하게 해라 멍!', '만지지 마라… 잠깐이면 된다.', '오늘은 다다미 낮잠 각이다…', '아기들아 입양 잘 가거라 🥹', `도감 ${Object.keys(S.dex).length}/20… 아직 멀었다 멍!`]);
  showBubble('동구 사장님: ' + line); clearTimeout(bossT); bossT = setTimeout(hideBubble, 3000);
});
let bossT;

function offlineEarnings() {
  updateZones(true);
  const completed = S.offlineZones || []; S.offlineZones = []; save(true);
  const away = Math.max(0, (Date.now() - S.last) / 1000);
  if (away < 60) { if (completed.length) modal(`<h2>공사 완료</h2><p>${completed.join(' · ')} 완공!</p><button class="btn" id="zoneSummaryOk">확인</button>`); if ($('#zoneSummaryOk')) $('#zoneSummaryOk').onclick=closeModal; return; }
  const cap = F.offlineCap(adoptedN()), secs = Math.min(cap, away);
  const avgSeated = seatCap() * BAL.offlineSeatFill;
  const earned = Math.floor((S.incomePerMin ?? (avgSeated*custIncome()+subsIncome())*60)/60 * secs * C.economy.offlineFraction);
  for (const p of S.pups) p.happy = Math.min(100, p.happy + F.happyRate(avgSeated, S.up.toys, p.trait, false, adoptedN()) * secs * BAL.offlineHappy);
  S.last = Date.now();
  if (earned < 1) return;
  const aw = Math.floor(away / 3600) ? fmtTime(away) : `${Math.floor(away / 60)}분`;
  const g = adGate('offline'), showAd = away >= BAL.ads.offline.minAwaySec && g.ok;
  modal(`<div class="pic">${ownerImg()}</div><h2>어서 와요, 사장님!</h2>
    ${completed.length ? `<p>🔨 ${completed.join(' · ')} 완공!</p>` : ''}<p>${aw} 동안 아기 시바들이<br>카페를 지키며 돈을 벌었어요 🐾</p>
    <div class="big">🪙 ${fmt(earned)}</div>
    <p class="small">자리 비움 보상은 최대 ${fmtTime(cap)}까지 쌓여요</p>
    <div class="btns">${showAd ? `<button class="btn pink" id="oAd">📺 광고 보고 2배 받기 (🪙 ${fmt(earned * 2)})</button>` : ''}<button class="btn" id="oOk">받기</button></div>`);
  let claimed=false;
  const claim=n=>{if(claimed)return;claimed=true;addCoins(n);S.lastOffline={id:'offline-'+Date.now(),coins:earned,claimed:n>earned};save();};
  $('#oOk').onclick = () => { closeModal(); claim(earned); };
  if (showAd) $('#oAd').onclick = () => { closeModal(); watchAd('offline', () => { claim(earned * C.ads.offline.multiplier); }, () => claim(earned)); };
}

/* ---------- 확장: saved wall-clock construction, never reward ads ---------- */
const zoneState = z => z && (S.zones[z.id]?.state || 'locked');
const zoneOpen = no => no<=C.maxZone && zoneState(ZONES[no-1]) === 'open';
const nextZone = () => ZONES.find(z => z.no > 1 && z.no<=C.maxZone && !z.placeholder && zoneState(z) !== 'open');
function renderZones() {
  const layer = $('#zoneLayer'); layer.innerHTML = '';
  const next = nextZone();
  for (const z of ZONES.slice(1)) {
    const state=z.no>C.maxZone?'locked':zoneState(z), r=z.rect, el=document.createElement('div');
    el.className='zone '+state; el.dataset.zone=z.id;
    Object.assign(el.style,{left:r.x+'px',top:r.y+'px',width:r.w+'px',height:r.h+'px'});
    // Art is optional until delivered: avoid 404 requests for placeholder paths.
    el.innerHTML=`<div class="diamond"><span>${state==='open' ? (z.no===2?'🌿 🪨 🌱':z.no===3?'🐾 🪨 🐾':'🛝 🪵 🎾') : '🎋 🌳 🎋'}</span></div><b class="zone-label">${z.no} · ${z.name}</b>${z.placeholder?'<p>다음 업데이트</p>':''}`;
    if(state==='building') el.innerHTML+='<div class="scaffold">🚧 🏗️<span data-build="'+z.id+'"></span></div>';
    if(z===next) { const b=document.createElement('button');b.className='zone-sign';b.textContent='🔨 '+z.name;b.onclick=()=>openZone(z);el.appendChild(b); }
    layer.appendChild(el);
  }
  renderDecor();
  const opened=ZONES.filter(z=>zoneOpen(z.no));
  const left=Math.min(...opened.map(z=>z.rect.x)),top=Math.min(...opened.map(z=>z.rect.y));
  CafeMap.setBounds({x:left,y:top,w:Math.max(...opened.map(z=>z.rect.x+z.rect.w))-left,h:Math.max(...opened.map(z=>z.rect.y+z.rect.h))-top});
}
function renderZoneGoal() {
  const z=nextZone(),b=$('#nextGoal');
  if(!tutDone()){b.textContent='다음: '+['소원권 뽑기','돌봄 완료','입양 확인','꾸미기','사진 저장'][S.flow];return;}
  if(!z) {b.textContent='카페 사진을 남겨 보세요 · ③ 이후 준비 중';return;}
  freezeZonePrice(z);
  const building=zoneState(z)==='building',pct=Math.min(100,S.coins/z.unlock.coins*100);
  b.innerHTML=building ? `공사 중: ${z.name} · ${fmtTime((S.zones[z.id].endsAt-Date.now())/1000)}` : `다음: ${z.name} · ${fmt(S.coins)} / ${fmt(z.unlock.coins)} · 입양 ${adoptedN()}/${z.unlock.adoptions}<progress id="zoneProgress" max="100" value="${pct}"></progress>`;
  const sign=$(`[data-zone="${z.id}"] .zone-sign`);if(sign){sign.dataset.material=Math.floor(pct/25);sign.textContent=`🔨 ${z.name} ${Math.floor(pct/25)>0?'🪵'.repeat(Math.min(3,Math.floor(pct/25))):''}`;}
  document.querySelectorAll('[data-build]').forEach(el=>el.textContent=fmtTime((S.zones[el.dataset.build].endsAt-Date.now())/1000));
  CafeMap.keepZoneInView();
}
function freezeZonePrice(z){if(z.no!==2)return;S.zonePrices ||= {};if(S.zonePrices[z.id]==null){S.zonePrices[z.id]=Math.round(unboostedU()*C.garden.minutes);save(true);}z.unlock.coins=S.zonePrices[z.id];}
function openZone(z) {
  if(z.no>C.maxZone)return toast('다음 업데이트에 열려요');
  freezeZonePrice(z);
  $('#panel').classList.remove('open');CafeMap.focus(z.rect.x+z.rect.w/2,z.rect.y+z.rect.h/2);
  if(zoneState(z)==='building') {toast('아직이야. 목수 아저씨들\n방석은 건드리지 마.');return;}
  const u=z.unlock,can=zoneOpen(z.no-1)&&S.coins>=u.coins&&adoptedN()>=u.adoptions;
  const pct=S.coins/u.coins;
  const line=pct>=.75?'거의 다 됐다.\n울타리 너머가 궁금하네.':pct>=.25?'자재가 조금 모였다.\n…아직 멀었어.':'울타리 너머에 새 자리를 만들자.';
  modal(`<h2>🔨 ${z.name}</h2><p>${line.replaceAll('\n','<br>')}</p><p>${z.feature}</p><p>🪙 ${fmt(u.coins)} · 입양 ${adoptedN()}/${u.adoptions} · 공사 ${fmtTime(z.buildSec)}</p><p>추천: 시바를 돌보고 입양해 자리를 마련해요.</p><button class="btn" id="startBuild" ${can?'':'disabled'}>공사 시작</button> <button class="btn gray" id="zoneClose">닫기</button>`);
  CafeMap.focus(z.rect.x+z.rect.w/2,z.rect.y+z.rect.h/2);
  $('#startBuild').onclick=()=>startBuild(z);$('#zoneClose').onclick=closeModal;
}
function startBuild(z) {
  if(z!==nextZone() || zoneState(z)==='building' || !zoneOpen(z.no-1) || S.coins<z.unlock.coins || adoptedN()<z.unlock.adoptions)return;
  S.coins-=z.unlock.coins;S.zones[z.id]={state:'building',endsAt:Date.now()+z.buildSec*1000};save();closeModal();renderZones();toast('공사 시작이다.\n망치 소리는… 참아줄게.');
}
let celebrationTimer;
function updateZones(offline=false) {
  for(const z of ZONES) if(z.no<=C.maxZone && zoneState(z)==='building' && S.zones[z.id].endsAt<=Date.now()) {
    S.zones[z.id]={state:'open'};S.pendingGifts.push(z.id);renderZones();fillPups(false);save(offline);
    if(offline){(S.offlineZones ||= []).push(z.name);save(true);}
    else {const previous={...CafeMap.state};CafeMap.focus(z.rect.x+z.rect.w/2,z.rect.y+z.rect.h/2);toast(z.done+'\n'+z.feature);
      clearTimeout(celebrationTimer);celebrationTimer=setTimeout(()=>{CafeMap.focus((previous.vw/2-previous.x)/previous.s,(previous.vh/2-previous.y)/previous.s,previous.s);if(typeof offerGift==='function')offerGift();},3000);}
  }
}
$('#room').addEventListener('pointermove',()=>{if(celebrationTimer){clearTimeout(celebrationTimer);celebrationTimer=null;if(typeof offerGift==='function')offerGift();}});
$('#nextGoal').onclick=()=>{if(!tutDone()){[openDraw,()=>switchTab('train'),()=>switchTab('cafe'),openGarden,createPhoto][S.flow]();return;}const z=nextZone();if(z)openZone(z);else createPhoto();};

/* ---------- Cosmetic slots: intentionally no balance effects ---------- */
let decorating=false;
function renderDecor() {
  document.querySelectorAll('.decor-slot').forEach(el=>el.remove());
  for(const slot of SLOTS) if(zoneOpen(slot.zone)) {
    const item=DECOR.find(d=>d.id===S.slots[slot.id]);
    if(!decorating&&!item)continue;
    const el=document.createElement(decorating?'button':'div');el.className='decor-slot'+(decorating?' editing':'');
    el.style.left=slot.x+'px';el.style.top=slot.y+'px';el.textContent=item?.emoji||'＋';el.title=slot.cat;
    if(decorating)el.onclick=()=>openDecor(slot);
    $('#world').appendChild(el);
  }
  $('#signBadge').textContent=DECOR.find(d=>d.id===S.slots.s_entry_sign)?.emoji||'';
}
function equipDecor(slot,item,free=false) {
  if(!S.ownedDecor.includes(item.id)){if(!free&&S.coins<item.coins)return; if(!free)S.coins-=item.coins;S.ownedDecor.push(item.id);}
  S.slots[slot.id]=item.id;tutEvent('decor');save();renderDecor();
}
function openDecor(slot) {
  $('#panel').classList.remove('open');CafeMap.focus(slot.x,slot.y);
  modal(`<h2>🎨 소품 고르기</h2><p>일본 정원 소품당 수요 +2% · 체류 +1% (4개 세트 +2%)</p>${DECOR.filter(d=>d.cat===slot.cat).map(d=>`<div class="row"><div class="ic">${d.emoji}</div><div class="tx"><b>${d.name}</b></div><button class="btn" data-decor="${d.id}" ${!S.ownedDecor.includes(d.id)&&S.coins<d.coins?'disabled':''}>${S.ownedDecor.includes(d.id)?'장착':'🪙 '+fmt(d.coins)}</button></div>`).join('')}<button class="btn gray" id="decorClose">닫기</button>`);
  CafeMap.focus(slot.x,slot.y);
  document.querySelectorAll('[data-decor]').forEach(b=>b.onclick=()=>{equipDecor(slot,DECOR.find(d=>d.id===b.dataset.decor));closeModal();});$('#decorClose').onclick=closeModal;
}
function offerGift() {
  if(!S.pendingGifts.length || !$('#modal').classList.contains('hidden'))return;
  const zone=S.pendingGifts[0],z=ZONES.find(z=>z.id===zone);
  const choices=DECOR.filter(d=>C.decor.ids.includes(d.id)&&(z.no===2?d.cat==='garden':d.cat==='light'));
  modal(`<h2>${z.name} 완공 선물</h2><p>무료 소품 하나를 골라 주세요.</p>${choices.map(d=>`<button class="btn" data-gift="${d.id}">${d.emoji} ${d.name}</button>`).join(' ')}`);
  CafeMap.focus(z.rect.x+z.rect.w/2,z.rect.y+z.rect.h/2);
  document.querySelectorAll('[data-gift]').forEach(b=>b.onclick=()=>{const item=DECOR.find(d=>d.id===b.dataset.gift),slot=SLOTS.find(s=>s.cat===item.cat);equipDecor(slot,item,true);S.pendingGifts.shift();save();closeModal();});
}
$('#decorBtn').onclick=openGarden;

/* ---------- v0.6 소원권·대기함·성장 ---------- */
function dailyVisit(){if(S.daily.day!==today()){S.daily={day:today(),coinTickets:0,care:false};S.tickets+=C.draw.dailyTickets;save(true);}}
function dailyCareTicket(){dailyVisit();if(!S.daily.care){S.daily.care=true;S.tickets+=C.draw.careTickets;save();}}
function receivePup(p){if(S.pups.length<maxPups())S.pups.push(p);else S.waiting.push(p);syncPupEls();}
function receiveWaiting(id){const i=S.waiting.findIndex(p=>p.id===id);if(i<0||S.pups.length>=maxPups())return;S.pups.push(S.waiting.splice(i,1)[0]);syncPupEls();save();openDraw();}
let drawRng=Math.random;
function draw(count,rng=drawRng){
  dailyVisit();if(![C.draw.single,C.draw.ten].includes(count)||S.tickets<count)return false;
  if(S.drawPending.length)return false;
  S.tickets-=count;const results=[];
  for(let i=0;i<count;i++){
    const result=Core.roll(S,rng),[coat,trait]=result.identity.split('_');
    const p={...makePup(),coat,trait,rarity:result.rarity,level:1};
    const held=[...S.pups,...S.waiting,...S.drawPending].some(q=>q.coat===coat&&q.trait===trait&&q.rarity===p.rarity);
    if(held)S.drawPending.push(p);else receivePup(p);
    results.push({...result,id:p.id,duplicate:held});
  }
  S.lastDraw=results;tutEvent('draw');save();renderPanel();openDraw();return results;
}
function resolveDuplicate(id,fragments){
  const i=S.drawPending.findIndex(p=>p.id===id);if(i<0)return false;
  const p=S.drawPending.splice(i,1)[0];if(fragments)S.fragments+=C.draw.fragments[p.rarity];else receivePup(p);
  save();openDraw();return true;
}
function levelUp(id){const p=S.pups.find(p=>p.id===id);if(!p||p.level>=C.level.max)return;const cost=Core.levelCost(p);if(S.fragments<cost.fragments||S.coins<cost.coins)return;S.fragments-=cost.fragments;S.coins-=cost.coins;p.level++;save();openDraw();}
function openDraw(){
  $('#panel').classList.remove('open');dailyVisit();const next=Core.distribution(S),rPlus=Core.distribution({pity:{R:C.draw.pity.R-1,SR:0,SSR:0}}),srPlus=Core.distribution({pity:{R:0,SR:C.draw.pity.SR-1,SSR:0}}),price=Math.round(unboostedU()*C.draw.coinMinutes);
  modal(`<h2>🌠 소원권 뽑기</h2><p>소원권 <b>${S.tickets}</b> · 성장 조각 ${S.fragments}</p>
  <p>기본 확률: ${Object.entries(C.draw.probabilities).map(([r,n])=>r+' '+n+'%').join(' / ')}<br>R+ 보장: R ${rPlus.R.toFixed(2)}% / SR ${rPlus.SR.toFixed(2)}% / SSR ${rPlus.SSR.toFixed(2)}%<br>SR+ 보장: SR ${srPlus.SR.toFixed(2)}% / SSR ${srPlus.SSR.toFixed(2)}%<br>SSR 보장: SSR 100%<br>이번 확률: ${Object.entries(next).map(([r,n])=>r+' '+n.toFixed(2)+'%').join(' / ')}</p>
  <p>중복 조각: ${Object.entries(C.draw.fragments).map(([r,n])=>r+' '+n).join(' / ')}<br>연속 미획득 R+ ${S.pity.R}/${C.draw.pity.R} · SR+ ${S.pity.SR}/${C.draw.pity.SR} · SSR ${S.pity.SSR}/${C.draw.pity.SSR}<br>SSR → SR+ → R+ 우선, 해당 등급 이상 카운터만 초기화</p>
  <p>첫 주 5종: ${C.draw.identities.map(k=>{const [c,t]=k.split('_');return COATS[c].name+'·'+t;}).join(', ')}<br>미발견 ${S.missedDiscovery}/9 · 9회 연속 미발견이면 다음은 새 정체성 보장. 모두 발견하면 대기.</p>
  <div class="btns"><button class="btn pink" id="drawOne" ${S.tickets<C.draw.single||S.drawPending.length?'disabled':''}>1회 · 1장</button><button class="btn" id="drawTen" ${S.tickets<C.draw.ten||S.drawPending.length?'disabled':''}>10회 · 10장</button>
  <button class="btn" id="buyTicket" ${S.daily.coinTickets>=C.draw.coinDaily||S.coins<price?'disabled':''}>하루 1장 구매 · 🪙 ${fmt(price)} (U×20분)</button></div>
  ${S.lastDraw?'<p>결과: '+S.lastDraw.map(r=>`${COATS[r.identity.split('_')[0]].name} ${r.rarity}${r.duplicate?' · 선택 대기':''}`).join(' / ')+'</p>':''}
  ${S.drawPending.map(p=>`<div class="row">${pupIcon(p)}<div class="tx">${p.name} · ${p.rarity}<br>보유 중인 조합</div><button class="btn" data-duplicate="${p.id}" data-fragments="1">조각 ${C.draw.fragments[p.rarity]}</button><button class="btn" data-duplicate="${p.id}">새 개체</button></div>`).join('')}
  <p>대기함 ${S.waiting.length}마리 · 수입·돌봄 불참</p>${S.waiting.map(p=>`<div class="row">${pupIcon(p)}<div class="tx">${p.name} · ${p.rarity}</div><button class="btn" data-waiting="${p.id}" ${S.pups.length>=maxPups()?'disabled':''}>카페로</button></div>`).join('')}
  ${S.pups.map(p=>{const cost=Core.levelCost(p);return `<div class="row">${pupIcon(p)}<div class="tx">${p.name} · ${p.rarity} · Lv${p.level}<br>M ${Core.multiplier(p).toFixed(2)}</div><button class="btn" data-level="${p.id}" ${p.level>=C.level.max||S.fragments<cost.fragments||S.coins<cost.coins?'disabled':''}>${p.level>=C.level.max?'MAX':`성장 · 조각 ${cost.fragments}<br>🪙 ${fmt(cost.coins)}`}</button></div>`;}).join('')}
  <button class="btn gray" id="drawClose">닫기</button>`);
  $('#drawOne').onclick=()=>draw(C.draw.single);$('#drawTen').onclick=()=>draw(C.draw.ten);$('#drawClose').onclick=closeModal;
  $('#buyTicket').onclick=()=>{if(S.daily.coinTickets>=C.draw.coinDaily||S.coins<price)return;S.coins-=price;S.tickets++;S.daily.coinTickets++;save();openDraw();};
  document.querySelectorAll('[data-duplicate]').forEach(b=>b.onclick=()=>resolveDuplicate(+b.dataset.duplicate,!!b.dataset.fragments));
  document.querySelectorAll('[data-waiting]').forEach(b=>b.onclick=()=>receiveWaiting(+b.dataset.waiting));
  document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>levelUp(+b.dataset.level));
}
function openGarden(){
  $('#panel').classList.remove('open');const effect=Core.decorEffect(S);
  modal(`<h2>🎨 일본 정원 · ${effect.count}/4</h2><p>소품당 수요 +${C.decor.demand*100}% · 체류 +${C.decor.stay*100}%<br>4개 세트 추가 +${C.decor.setBonus*100}% (두 효과)<br>현재 수요 +${Math.round(effect.demand*100)}% · 체류 +${Math.round(effect.stay*100)}%<br>상한 수요 +${C.decor.demandCap*100}% / 체류 +${C.decor.stayCap*100}%</p>
  ${C.decor.ids.map(id=>{const d=DECOR.find(d=>d.id===id),slot=SLOTS.find(s=>s.cat===d.cat),locked=!zoneOpen(slot.zone);return `<div class="row"><div class="ic">${d.emoji}</div><div class="tx"><b>${d.name}</b><p>${locked?'② 이끼 정원에서 설치':S.slots[slot.id]===id?'설치 완료':'고정 슬롯'}</p></div><button class="btn" data-garden="${id}" ${locked||S.slots[slot.id]===id||!S.ownedDecor.includes(id)&&S.coins<d.coins?'disabled':''}>${S.ownedDecor.includes(id)?'설치':'🪙 '+fmt(d.coins)}</button></div>`;}).join('')}
  <button class="btn" id="gardenExpand">이끼 정원 보기 · 입양 ${adoptedN()}/${C.garden.adoptions}</button><button class="btn gray" id="gardenClose">닫기</button>`);
  document.querySelectorAll('[data-garden]').forEach(b=>b.onclick=()=>{const d=DECOR.find(d=>d.id===b.dataset.garden);equipDecor(SLOTS.find(s=>s.cat===d.cat),d);openGarden();});
  $('#gardenClose').onclick=closeModal;$('#gardenExpand').onclick=()=>openZone(ZONES[1]);
}
/* ---------- 사진: 현재 카메라의 맵·에셋을 로컬 canvas에 합성 ---------- */
async function createPhoto(){
  $('#panel').classList.remove('open');
  const canvas=document.createElement('canvas');canvas.width=900;canvas.height=1600;const ctx=canvas.getContext('2d');
  const scale=canvas.width/innerWidth,offset=(canvas.height-innerHeight*scale)/2;
  ctx.fillStyle='#8fa775';ctx.fillRect(0,0,900,1600);ctx.save();ctx.translate(0,offset);ctx.scale(scale,scale);
  const camera=CafeMap.state;
  ctx.save();ctx.translate(camera.x,camera.y);ctx.scale(camera.s,camera.s);
  ctx.fillStyle='#8fa775';ctx.fillRect(0,0,camera.W,camera.H);
  const sky=ctx.createLinearGradient(0,0,0,950);sky.addColorStop(0,'#9bc8d3');sky.addColorStop(1,'#8fa775');ctx.fillStyle=sky;ctx.fillRect(0,0,camera.W,950);
  ctx.fillStyle='#b8aa88';ctx.fillRect(0,3600,camera.W,800);
  for(const el of document.querySelectorAll('.zone .diamond')){
    const zone=el.closest('.zone'),z=ZONES.find(z=>z.id===zone.dataset.zone),r=z.rect;
    ctx.fillStyle=zone.classList.contains('open')?'#c9c193':'#6f865c';ctx.strokeStyle='#b6ba82';ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(r.x+r.w/2,r.y+60);ctx.lineTo(r.x+r.w-40,r.y+r.h/2);ctx.lineTo(r.x+r.w/2,r.y+r.h-40);ctx.lineTo(r.x+40,r.y+r.h/2);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#f7f1dd';ctx.font='26px sans-serif';ctx.textAlign='center';ctx.fillText(z.name,r.x+r.w/2,r.y+r.h-20);
  }
  ctx.restore();
  const images=[...document.querySelectorAll('#world img')].filter(i=>i.complete&&i.naturalWidth);
  // DOM 페인트 순서: 배경 → 손님/시바/동구. 현재 화면 좌표를 그대로 사용한다.
  for(const i of images){const r=i.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth)continue;ctx.drawImage(i,r.left,r.top,r.width,r.height);}
  for(const el of document.querySelectorAll('.decor-slot:not(.editing)')){const r=el.getBoundingClientRect();ctx.font=`${r.height*.62}px sans-serif`;ctx.textAlign='center';ctx.fillText(el.textContent,r.left+r.width/2,r.top+r.height*.75);}
  ctx.restore();
  try {
    const room=$('#room').cloneNode(true);
    room.querySelectorAll('#mapControls,#tut,#fx,#toast').forEach(e=>e.remove());
    room.style.cssText=`position:relative;width:${innerWidth}px;height:${innerHeight}px;overflow:hidden;background:#91a777`;
    const cloned=[...room.querySelectorAll('img')],original=[...$('#room').querySelectorAll('img')];
    for(let n=0;n<cloned.length;n++){const image=original[n];if(!image.complete||!image.naturalWidth)continue;const asset=document.createElement('canvas');asset.width=image.naturalWidth;asset.height=image.naturalHeight;asset.getContext('2d').drawImage(image,0,0);cloned[n].src=asset.toDataURL();}
    let css='';for(const sheet of document.styleSheets)for(const rule of sheet.cssRules)css+=rule.cssText;
    const markup=new XMLSerializer().serializeToString(room);
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${innerWidth}" height="${innerHeight}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml"><style>${css}</style>${markup}</div></foreignObject></svg>`;
    const snapshot=new Image();snapshot.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await snapshot.decode();
    // Probe origin-clean status before touching the final canvas.
    const probe=document.createElement('canvas');probe.width=innerWidth;probe.height=innerHeight;const pc=probe.getContext('2d');pc.drawImage(snapshot,0,0);probe.toDataURL();
    ctx.drawImage(probe,0,offset,innerWidth*scale,innerHeight*scale);
  } catch(e) { /* WebView without foreignObject: retain the local-asset composition above. */ }
  ctx.fillStyle='#fdf6fae8';ctx.fillRect(0,0,900,110);ctx.fillStyle='#513f35';ctx.font='bold 36px sans-serif';ctx.textAlign='center';ctx.fillText('시바견 카페 · 동구',450,65);ctx.font='26px sans-serif';ctx.fillText('미리보기',450,1550);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('사진 생성 실패');
  const url=URL.createObjectURL(blob);modal(`<h2>📷 카페 사진</h2><p>9:16 · 시바견 카페 · 동구 · 미리보기</p><img id="photoPreview" src="${url}" width="180" height="320" alt="카페 사진"><div class="btns"><button class="btn pink" id="downloadPhoto">사진 다운로드</button><button class="btn gray" id="photoClose">닫기</button></div><p>공유 액자 보상은 실제 공유 연결 후 활성화돼요.</p>`);
  $('#downloadPhoto').onclick=()=>{const a=document.createElement('a');a.href=url;a.download='shiba-cafe-donggu.png';a.click();S.photoCount=(S.photoCount||0)+1;tutEvent('photo');save();};
  $('#photoClose').onclick=()=>{closeModal();URL.revokeObjectURL(url);};return {width:canvas.width,height:canvas.height,blob};
}
function shareHook(eventId,shared=false){
  // 다운로드만으로 공유 보상을 지급하지 않는다. 향후 실제 공유 완료 훅에서 사용.
  if(!shared||!eventId)return 'unavailable';const week=Math.floor(Date.now()/(C.share.weekDays*86400000));S.sharedFrames ||= [];S.shareEvents ||= [];
  if(S.shareWeek===week||S.shareEvents.includes(eventId)||S.sharedFrames.length>=C.share.frames)return 'cancelled';
  S.shareWeek=week;S.shareEvents.push(eventId);S.sharedFrames.push('photo_frame_'+(S.sharedFrames.length+1));save();return 'completed';
}
function purchaseHook(){return 'unavailable';}
function starHook(){return 'unavailable';}
async function rewardTest(type){
  if(type==='adopt'&&(!S.lastAdoption||S.lastAdoption.claimed))return toast('추가 보상을 받을 입양 기록이 없어요');
  if(type==='offline'&&(!S.lastOffline||S.lastOffline.claimed))return toast('추가 보상을 받을 복귀 기록이 없어요');
  const record=type==='adopt'?S.lastAdoption:type==='offline'?S.lastOffline:null;
  return watchAd(type,()=>{
    if(record){if(record.claimed)return;record.claimed=true;addCoins(record.coins*(C.ads[type].multiplier-1));}
    if(type==='ticket')S.tickets+=C.ads.ticket.tickets;
    if(type==='boost')S.boostUntil=Math.max(Date.now(),S.boostUntil)+C.ads.boost.durSec*1000;
    if(type==='demand')S.demandUntil=Math.max(Date.now(),S.demandUntil||0)+C.ads.demand.durSec*1000;
    toast('테스트 보상을 1회 받았어요');
  });
}
function openInvite(){
  S.inviteCode ||= (S.saveId||'local').replace('local-','').toUpperCase();save();
  modal(`<h2>친구 초대 · 미리보기</h2><p>내 코드: <b>${S.inviteCode}</b><br>서버 검증 미연결 · 실제 지급 없음<br>월 ${C.invite.monthlyMax}명 · 각 기념품 계정당 1회</p>${C.invite.stages.map(s=>`<p>${s.days}일 ${s.tutorial?'+ 튜토리얼 완료':''}${s.adoptions?'+ 입양 '+s.adoptions+'회':''}${s.zone?'+ ③ 해금':''}<br>${s.reward} · 외형 전용</p>`).join('')}<button class="btn" id="inviteClose">닫기</button>`);$('#inviteClose').onclick=closeModal;
}
function openSettings(){
  modal(`<h2>설정 · 미리보기</h2><p>30초마다 + 중요 행동 직후 로컬 저장<br>${saveService.error?'저장 오류: '+saveService.error:'클라우드 저장 준비 중'}</p><div class="btns"><button class="btn" id="bgmToggle">BGM ${S.settings.bgm?'켜짐':'꺼짐'} · 음원 미정</button><button class="btn" id="ambientToggle">환경음 ${S.settings.ambient?'켜짐':'꺼짐'} · 음원 미정</button><button class="btn" id="hideUI">UI 숨김 · 한 번 터치로 복원</button><button class="btn" id="cloudSave">클라우드 저장 · 준비 중</button><button class="btn" id="inviteOpen">초대 코드</button></div>
  <p>상품 · 미리보기, 결제 미연결</p>${C.products.map(p=>`<button class="btn" data-product="${p.id}">${p.name} · ₩${fmt(p.krw)}</button>`).join('')}<p>스타견 · 준비 중: R 이상 / Lv${C.star.level} / 교육 ${C.star.training} / 행복도 ${C.star.happiness}% / 촬영 구독자 ${C.star.subscribers}<br>${C.star.activities.map(a=>a.name+' '+a.hours+'시간 · '+fmt(a.coins)+'×M').join('<br>')}</p>
  <details><summary>광고 훅 테스트 · 실제 광고 없음</summary><p>하루 합 ${C.ads.dailyTotal}회 · 슬롯 이월 없음 · 취소/실패 차감 없음</p>${['adopt','boost','ticket','demand','offline'].map(k=>`<button class="btn" data-reward="${k}">${{adopt:'입양 추가 코인',boost:'5분 손님 코인 2배',ticket:'소원권 1장',demand:'10분 수요 +50%',offline:'복귀 추가 코인'}[k]} · ${adState()[k]}/${C.ads[k].daily}</button>`).join('')}</details><button class="btn" id="settingsClose">닫기</button>`);
  $('#bgmToggle').onclick=()=>{S.settings.bgm=!S.settings.bgm;save();openSettings();};$('#ambientToggle').onclick=()=>{S.settings.ambient=!S.settings.ambient;save();openSettings();};
  $('#hideUI').onclick=()=>{closeModal();$('#panel').classList.remove('open');document.body.classList.add('ui-hidden');};$('#cloudSave').onclick=()=>toast('준비 중');$('#inviteOpen').onclick=openInvite;
  document.querySelectorAll('[data-product]').forEach(b=>b.onclick=()=>{purchaseHook(b.dataset.product);toast('미리보기, 결제 미연결');});
  document.querySelectorAll('[data-reward]').forEach(b=>b.onclick=()=>rewardTest(b.dataset.reward));
  if(DEBUG&&debugPanel){debugPanel.classList.remove('hidden');$('#modalCard').append(debugPanel);}
  $('#settingsClose').onclick=closeModal;
}
$('#room').addEventListener('pointerdown',e=>{if(document.body.classList.contains('ui-hidden')){e.stopImmediatePropagation();e.preventDefault();document.body.classList.remove('ui-hidden');}},true);
$('#drawBtn').onclick=openDraw;$('#photoBtn').onclick=createPhoto;
window.CafeHooks={requestReward,purchase:purchaseHook,star:starHook,share:shareHook,cloudSave:()=> 'unavailable'};

/* ---------- 디버그 (?debug=1) ---------- */
let debugPanel;
function setupDebug() {
  if (params.get('bgcheck') === '1') document.documentElement.classList.add('bgcheck');
  const d = debugPanel = $('#debug');
  d.innerHTML = `<button data-d="spd">⏩ 속도 x1</button><button data-d="coin">+10만 코인</button><button data-d="happy">행복도 가득</button><button data-d="off">오프라인 2시간</button><button data-d="skip">튜토 건너뛰기</button><button data-d="reset">초기화</button>`;
  d.addEventListener('click', e => {
    const k = e.target.dataset.d; if (!k) return;
    if (k === 'spd') { speed = speed === 1 ? 10 : speed === 10 ? 50 : 1; e.target.textContent = `⏩ 속도 x${speed}`; }
    if (k === 'coin') addCoins(100000);
    if (k === 'happy') S.pups.forEach(p => p.happy = 100);
    if (k === 'off') { S.last = Date.now() - 2 * 3600 * 1000; offlineEarnings(); }
    if (k === 'skip') { S.tut = 7; S.flow=5; S.playSec = Math.max(S.playSec, 200); hideBubble(); renderTabs(); }
    if (k === 'reset') { saveService.blocked=true;localStorage.removeItem(SAVE_KEY); location.reload(); }
    renderPanel();
  });
  window.__game = { BAL, F, TRAIT_FACE, spriteSrc, get S() { return S; }, setSpeed: v => speed = v, tick, ips, fmt, openAdoption, renderPanel, adGate, switchTab, debug: { renderZoneGoal, setStage(n) { S.zones={};ZONES.forEach(z=>S.zones[z.id]={state:z.no<=n&&!z.placeholder?"open":"locked"});renderZones();syncPupEls();renderPanel(); }, advanceBuild(sec) { ZONES.forEach(z=>{if(zoneState(z)==="building")S.zones[z.id].endsAt-=sec*1000;});updateZones(); }, caps: () => ({pupCap:maxPups(),walkCap:walkCap()}), camera: CafeMap }, save, saveService, Core, C, openDraw, draw, resolveDuplicate, receiveWaiting, startTrain, startWalk, openGarden, createPhoto, rewardTest, purchaseHook, shareHook, requestReward, tapPup, unboostedU };
}

/* ---------- 시작 ---------- */
$('#sheetClose').onclick = () => { $('#panel').classList.remove('open'); CafeMap.focus(); };
$('#settings').onclick = openSettings;

function start() {
  const had = load();
  $('#boss').innerHTML = `<div class="body">${ownerImg()}</div>`;
  $('#adDog').innerHTML = ownerImg();
  renderZones();
  fillPups(true);
  dailyVisit();
  renderTabs(); renderPanel(); renderHUD(); CafeMap.measure(); CafeMap.focus();
  if (had) { updateZones(true); offlineEarnings(); }
  else { modal(`<div class="pic">${ownerImg()}</div><h2>시바견 카페에 오신 걸 환영해요!</h2>
    <p>저는 사장님 <b>동구</b>예요 🐾<br>아기 시바들을 돌보고, 손님을 맞고,<br>행복해진 아이들을 <b>새 가족</b>에게 보내 줘요.</p>
    <div class="btns"><button class="btn pink" id="go">카페 오픈하기</button></div>`); $('#go').onclick = () => { closeModal(); renderTut(); }; }
  for (let i = 0; i < 2; i++) setTimeout(spawnCustomer, 400 + i * 700);
  if (DEBUG) setupDebug();
  if(saveService.blocked){modal('<h2>저장 확인 필요</h2><p>기존 저장을 읽지 못해 원본을 보존했습니다. 현재 플레이는 저장되지 않아요.</p><button class="btn" id="saveErrorClose">확인</button>');$('#saveErrorClose').onclick=closeModal;}
  setInterval(loop, 100);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); else { lastFrame = performance.now(); if ($('#modal').classList.contains('hidden')) offlineEarnings(); } });
  window.addEventListener('pagehide', () => save());
}
start();
})();
