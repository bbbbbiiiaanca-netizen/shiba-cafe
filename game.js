/* 시바견 카페 - 방치형 프로토타입 (순수 HTML5/JS, 빌드 없음). 밸런스 상수·공식은 balance.js */
(function () {
'use strict';
const { BAL, F } = window.SC;
const { ZONES } = window.CafeZones;
const { DECOR, SLOTS } = window.CafeDecor;

/* ============================================================
 * [광고 연동 지점] showRewardedAd(cb)
 * 지금은 3초짜리 가짜 광고(테스트). 나중에 AdMob 보상형 광고로 이 함수만 교체.
 * cb(true) = 끝까지 시청(보상 지급), cb(false) = 실패/취소
 * 횟수·쿨다운 규칙은 adGate()/watchAd() (monetization.md §2~3)
 * ============================================================ */
let adShowing = false;
function showRewardedAd(cb) {
  if (adShowing) return;
  adShowing = true;
  const ad = $('#ad'), cnt = $('#adCount');
  let n = 3; cnt.textContent = n; ad.classList.remove('hidden');
  const iv = setInterval(() => {
    n--; cnt.textContent = n;
    if (n <= 0) { clearInterval(iv); ad.classList.add('hidden'); adShowing = false; cb(true); }
  }, 1000);
}
window.showRewardedAd = showRewardedAd;

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
  '장난꾸러기': '쓰다듬기 코인 2배',
  '새침데기': '행복도는 천천히, 입양 보상 1.5배',
  '먹보': '함께 있으면 손님 지출 +10%',
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
const ORDERS = ['☕','🧋','🍪','🍰','🍵','🧁','🍡'];

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
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      const old = !d.ver || d.ver < 2;
      S = Object.assign(newState(), d); S.up = Object.assign(newState().up, d.up);
      [...S.pups, ...S.adopted].forEach(p => { if (!COATS[p.coat]) p.coat = 'white'; });
      S.pups.forEach(p => { if (p.tapHappy == null) p.tapHappy = 0; });
      // Earlier game builds already used ver=2, so absence of zones also marks legacy.
      const legacyMap = !d.zones;
      if(legacyMap) {
        S.zones={z1_tatami:{state:'open'},z2_garden:{state:'open'}};
        const levels=Math.max(0,Math.min(4,Math.floor(Number(S.up.slots)||0)));
        for(let lv=0;lv<levels;lv++) S.coins+=F.upCost('slots',lv);
      }
      delete S.up.slots;
      for (const k in S.up) { if(!BAL.up[k]){delete S.up[k];continue;} S.up[k]=Math.max(0,Math.floor(Number(S.up[k])||0)); if(k!=='seats'||!legacyMap)S.up[k]=Math.min(S.up[k],upMax(k)); }
      // Grandfather old seat purchases on subsequent v2 reloads as well.
      if(d.up?.seats>2) S.up.seats=Math.min(6,Math.floor(d.up.seats));
      S.ver=SAVE_VER;
      if (old) {   // v1 세이브: 튜토리얼 완료로 간주, 탭 전부 해금, 도감 재구성
        S.ver = SAVE_VER; S.tut = TUT.length; S.freeTrain = false; S.firstWalk = false; S.playSec = 9999;
        S.dex = {}; S.adopted.forEach(a => { const k = a.coat + '_' + a.trait; S.dex[k] = (S.dex[k] || 0) + 1; });
      }
      if (!Array.isArray(S.queue)) S.queue = [];
      return true;
    }
  } catch (e) { console.warn('save load fail', e); }
  S = newState(); return false;
}
function save(preserveLast=false) { if(!preserveLast) S.last = Date.now(); try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }

function makePup() {
  const ws = Object.entries(COATS).flatMap(([k, c]) => Array(c.w).fill(k));
  const combo = F.pupCombo(S.dex);
  const cnt = S.nameCount || 0; S.nameCount = cnt + 1;
  const name = NAMES[(S.nameIdx + cnt) % NAMES.length] + (cnt >= NAMES.length ? Math.floor(cnt / NAMES.length) + 1 : '');
  return {
    id: S.nextId++, name, coat: combo.split("_")[0], trait: combo.split("_")[1],
    happy: 0, tapHappy: 0, skills: { sit: 0, paw: 0, wait: 0, down: 0, bang: 0 },
    x: rnd(24, 80), y: rnd(22, 58), sleep: false,
  };
}
const maxPups = () => ZONES.filter(z=>zoneOpen(z.no)).reduce((n,z)=>n+(z.adds.pupCap||0),0);
const walkCap = () => F.walkCap(S.up.course) + (zoneOpen(3)?1:0);
const isPlaying = p => S.plays.some(a=>a.id===p.id);
const seatCap = () => 2 + S.up.seats;
const skillScore = p => Object.values(p.skills).reduce((a, b) => a + b, 0);
const isWalking = p => S.walks.some(w => w.id === p.id);
const isTraining = p => S.train.some(t => t.id === p.id);
const isFilming = p => S.film && S.film.id === p.id;
const busy = p => isWalking(p) || isTraining(p) || isFilming(p) || isPlaying(p);
const boostOn = () => Date.now() < S.boostUntil;
const comboKey = p => p.coat + '_' + p.trait;
const isNewCombo = p => !S.dex[comboKey(p)];

/* ---------- 손님 (일시 상태, 저장 안 함) ---------- */
let custs = []; let custTimer = 0; let custSeq = 0; let rushUntil = 0;
const SEATS = ZONES[0].spots.seats.map(([x, y]) => ({ x, y }));
function seatedCount() { return custs.filter(c => c.state === 'sit').length; }
function custIncome() {
  const foodie = S.pups.some(p => p.trait === '먹보' && !isWalking(p)) ? BAL.foodie : 1;
  return F.perCust(S.up.menu) * (1 + S.rep * BAL.repIncome) * foodie;
}
function subsIncome() { return S.subs * BAL.subsIncome; }
/* 부스트는 손님·구독자 수익에만 적용 (쓰다듬기·산책·입양 제외) */
function ips() { return (seatedCount() * custIncome() + subsIncome()) * (boostOn() ? 2 : 1); }
function spawnInterval() { return F.spawnInterval(S.subs, S.rep, Date.now() < rushUntil); }
function spawnCustomer() {
  const used = new Set(custs.map(c => c.seat));
  const free = []; for (let i = 0; i < seatCap(); i++) if (!used.has(i)) free.push(i);
  if (!free.length) return false;
  const seat = pick(free);
  const c = { id: ++custSeq, seat, state: 'walk', t: 0, stay: rnd(BAL.stayMin, BAL.stayMax), order: pick(ORDERS), spr: pick(CUST_SRC) };
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
  const gain = F.tapCoin(seatedCount() * custIncome(), subsIncome(), p.trait);
  addCoins(gain);
  const add = Math.min(BAL.tapHappy, Math.max(0, BAL.tapHappyCap - (p.tapHappy || 0)));
  p.tapHappy = (p.tapHappy || 0) + add; p.happy = Math.min(100, p.happy + add);
  if (el) setTimeout(() => popAt(el, '+' + fmt(gain)), 120);
  tutEvent('pet');
}
function addCoins(n) { S.coins += n; S.total += n; }

/* ---------- 입양 ---------- */
function adoptReward(p) { return F.adoptReward(S.up.menu, seatCap(), S.adopted.length, skillScore(p), p.trait, isNewCombo(p)); }
function openAdoption(p) {
  if (!p.family) p.family = pick(FAMILIES);
  const r = adoptReward(p), rp = 1 + skillScore(p);   // 보상은 모달 연 시점 값으로 고정
  const sk = SKILLS.filter(s => p.skills[s.k] > 0).map(s => `${s.n} Lv${p.skills[s.k]}`).join(', ');
  const g = adGate('adopt'), showAd = S.adopted.length >= 1 && g.ok;
  modal(`<div class="pic">${pupImg(p.coat, p.trait)}</div>
    <h2>💌 입양 신청이 왔어요!</h2>
    <p><b>${p.family}</b>이(가)<br><b>${p.name}</b>(${COATS[p.coat].name} · ${p.trait})를 가족으로 맞이하고 싶대요.</p>
    ${sk ? `<p>🎓 배운 것: ${sk} <br>(교육 보너스 +${Math.round(skillScore(p) * BAL.adoptSkill * 100)}%)</p>` : '<p>💡 교육을 시키면 입양 보상이 올라가요</p>'}
    ${isNewCombo(p) ? `<p class="new">✨ 도감 첫 등록! 보상 +${Math.round(BAL.firstCombo * 100)}%</p>` : ''}
    <div class="big">🪙 ${fmt(r)} · ⭐ +${rp}</div>
    <div class="btns">
      ${showAd ? `<button class="btn pink" id="adAdopt">📺 광고 보고 코인 2배로 입양 보내기</button>` : ''}
      <button class="btn" id="okAdopt">입양 보내기</button>
      <button class="btn gray" id="noAdopt">조금만 더 함께 있을래요</button>
    </div>
    ${S.adopted.length >= 1 && !g.ok ? `<p class="small">📺 ${g.why}</p>` : ''}`);
  $('#okAdopt').onclick = () => { closeModal(); doAdopt(p, r, rp); };
  if (showAd) $('#adAdopt').onclick = () => { closeModal(); watchAd('adopt', () => doAdopt(p, r * 2, rp), () => doAdopt(p, r, rp)); };
  $('#noAdopt').onclick = closeModal;
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
  fillPups();
  tutEvent('adopt');
  renderPanel(); save();
}
const adoptedN = () => Math.max(S.adopted.length, S.adoptCount || 0);
/* 빈자리는 한 마리씩 5~15초 간격으로 도착 (첫 시작은 즉시) */
function fillPups(immediate, firstGap) {
  if (immediate) { while (S.pups.length < maxPups()) S.pups.push(makePup()); syncPupEls(); return; }
  while (S.pups.length + S.queue.length < maxPups()) {
    const last = S.queue.length ? S.queue[S.queue.length - 1] : S.playSec;
    S.queue.push(last + (firstGap != null && !S.queue.length ? firstGap : rnd(BAL.newPupMin, BAL.newPupMax)));
  }
}
function arrivePups() {
  let added = null;
  while (S.queue.length && S.queue[0] <= S.playSec) {
    S.queue.shift();
    if (S.pups.length < maxPups()) { const np = makePup(); S.pups.push(np); added = np; }
  }
  if (added) { syncPupEls(); toast(`🐶 새 아기 시바 ${added.name}(${COATS[added.coat].name} · ${added.trait})가 카페에 왔어요!`); renderPanel(); }
}

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
  tutEvent('train');
}
function walkReward() { return F.walkReward(S.up.menu, seatCap(), S.up.course); }
function walkTime() { return S.firstWalk ? BAL.walkFirstSec : BAL.walkSec; }
function startWalk(id) {
  const p = S.pups.find(q => q.id === id); if (!p || busy(p)) return;
  if (S.walks.length >= walkCap()) return toast(`지금은 동시에 ${walkCap()}마리까지 산책할 수 있어요`);
  const t = walkTime(); S.firstWalk = false;
  S.walks.push({ id, left: t, dur: t }); syncPupEls(); renderPanel();
  toast(`🦮 ${p.name} ${COURSES[S.up.course]}(으)로 산책 출발!`);
  tutEvent('walk');
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
  toast(`🦮 ${p.name} 산책 끝! +${fmt(r)} · 행복도 +${BAL.walkHappy} · 손님이 몰려와요!`);
}
const TOPICS = { '잠꾸러기': '방석 위 꿀잠 ASMR', '장난꾸러기': '보자기 창고 대소동', '새침데기': '만지지 마라 시바 거절', '먹보': '간식 기다려 챌린지', '애교쟁이': '손님 무릎 위 애교 폭발' };
function startFilm(id) {
  const p = S.pups.find(q => q.id === id); if (!p || busy(p)) return;
  if (S.film) return toast('이미 촬영 중이에요');
  const sk = SKILLS.filter(s => p.skills[s.k] > 0);
  const topic = sk.length && Math.random() < 0.5 ? `${pick(sk).n} 성공 영상` : TOPICS[p.trait];
  S.film = { id, left: BAL.filmSec, dur: BAL.filmSec, title: `아기시바 ${p.name}의 ${topic}` };
  p.sleep = false; renderPanel();
  tutEvent('film');
}
function finishFilm() {
  const f = S.film; S.film = null;
  const p = S.pups.find(q => q.id === f.id);
  const { subs, viral } = F.filmSubs(p ? skillScore(p) : 0, S.up.cam, p && p.trait === '잠꾸러기');
  const views = Math.floor(subs * rnd(20, 60));
  S.subs += subs;
  S.videos.unshift({ title: f.title, views, subs, viral }); S.videos = S.videos.slice(0, 8);
  toast(viral ? `🔥 떡상! "${f.title}" 구독자 +${fmt(subs)}` : `🎬 영상 업로드! 구독자 +${fmt(subs)}`);
  renderPanel();
}

/* ---------- 광고 규칙 (가짜 광고, 규칙만 실제와 동일) ---------- */
function today() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
function adState() {
  if (!S.ads || S.ads.day !== today()) S.ads = { day: today(), total: 0, adopt: 0, boost: 0, offline: 0, lastAt: S.ads ? S.ads.lastAt : 0 };
  return S.ads;
}
function adGate(pl) {
  const a = adState(), A = BAL.ads;
  if (a.total >= A.dailyTotal) return { ok: false, cap: true, why: '오늘 광고 보너스를 모두 받았어요 (내일 다시)' };
  if (a[pl] >= A[pl].daily) return { ok: false, cap: true, why: '오늘 이 보너스는 모두 받았어요 (내일 다시)' };
  if (pl === 'boost') {
    if (boostOn()) return { ok: false, why: '부스트 진행 중' };
    const r = (S.boostReadyAt - Date.now()) / 1000; if (r > 0) return { ok: false, wait: r, why: `다음 부스트까지 ${fmtTime(r)}` };
  }
  const gap = A.gapSec - (Date.now() - (a.lastAt || 0)) / 1000;
  if (gap > 0) return { ok: false, wait: gap, why: `${fmtTime(gap)} 뒤에 광고 보너스를 받을 수 있어요` };
  return { ok: true };
}
function watchAd(pl, onReward, onFail) {
  const g = adGate(pl); if (!g.ok) { toast(g.why); if (onFail) onFail(); return; }
  showRewardedAd(ok => {
    if (!ok) { if (onFail) onFail(); return; }   // 실패·취소는 횟수 소모 X
    const a = adState(); a.total++; a[pl]++; a.lastAt = Date.now();
    onReward(); save();
  });
}
const boostUnlocked = () => adoptedN() >= 1 && S.playSec >= BAL.ads.boost.minPlaySec && tutDone();

/* ---------- 튜토리얼 (동구 안내, 첫 3분) ---------- */
const TUT = [
  { ev: 'pet',   text: () => `어서 와요, 사장님! 저는 동구예요 🐾<br>아기 시바를 톡톡 쓰다듬어 주세요 (${Math.min(3, S.tutPets)}/3)`, target: '#floor .pup' },
  { ev: 'buy:menu', text: () => '잘했어요! 모은 코인으로<br><b>☕ 메뉴 개발</b>을 해볼까요?', target: '[data-act=buy][data-arg=menu]', tab: 'cafe' },
  { ev: 'train', text: () => '<b>🎓 교육</b> 탭이 열렸어요!<br>첫 교육은 무료예요. 하나 가르쳐 봐요', target: () => tab === 'train' ? '[data-act=train]:not([disabled])' : '#tabs [data-tab=train]', unlock: 'train' },
  { ev: 'walk',  text: () => `<b>🦮 산책</b> 탭이 열렸어요!<br>다녀오면 행복도 +${BAL.walkHappy}, 손님도 몰려와요 (첫 산책 20초)`, target: () => tab === 'walk' ? '[data-act=walk]:not([disabled])' : '#tabs [data-tab=walk]', unlock: 'walk' },
  { ev: 'adopt', text: () => '분홍 하트 막대가 가득 차면<br><b>입양 신청</b>이 와요. 💌를 눌러 보내 줘요!', target: () => S.pups.some(p => p.happy >= 100) ? '#floor .pup .adopt' : '#tabs [data-tab=cafe]', tab: 'cafe' },
  { ev: 'tab:book', text: () => '첫 입양 축하해요 🥹<br><b>📖 도감</b>이 열렸어요. 20칸을 다 모아봐요!', target: '#tabs [data-tab=book]', unlock: 'book' },
  { ev: 'film',  text: () => '<b>🎬 유튜브</b>도 열렸어요!<br>아기 시바 영상을 찍어 구독자를 모아봐요', target: () => tab === 'yt' ? '[data-act=film]:not([disabled])' : '#tabs [data-tab=yt]', unlock: 'yt' },
];
const TAB_UNLOCK = { cafe: 0, train: 2, walk: 3, book: 5, yt: 6 };
const TAB_HINT = { train: '메뉴 개발을 하면 열려요', walk: '첫 교육을 시키면 열려요', book: '첫 입양을 보내면 열려요', yt: '도감을 열어보면 열려요' };
const tutDone = () => S.tut >= TUT.length;
const tabOpen = t => S.tut >= TAB_UNLOCK[t];
function tutEvent(ev) {
  if (tutDone()) return;
  if (ev === 'pet') { S.tutPets++; if (S.tut === 0 && S.tutPets < 3) return renderTut(); }
  const step = TUT[S.tut];
  if (step && step.ev === ev) advanceTut();
}
function advanceTut() {
  S.tut++;
  if (S.tut === 1) $('#panel').classList.add('open');
  if (S.tut === 1 && S.up.menu > 0) S.tut++;            // 이미 메뉴를 샀으면 건너뜀
  if (S.tut === 4 && adoptedN() > 0) S.tut++;           // 이미 입양했으면 건너뜀
  const st = TUT[S.tut];
  if (st && st.tab && tab !== st.tab) switchTab(st.tab);
  renderTabs(); renderPanel(); save();
  if (tutDone()) {
    showBubble('이제 사장님 혼자서도 잘할 수 있어요! 🐾<br>모르는 게 있으면 저를 눌러요');
    setTimeout(() => { if (tutDone()) hideBubble(); }, 6000);
  }
}
function showBubble(html) { const b = $('#tut'); b.innerHTML = `<div class="av">${ownerImg()}</div><div class="tx">${html}</div>`; b.classList.remove('hidden'); }
function hideBubble() { $('#tut').classList.add('hidden'); }
function renderTut() {
  document.querySelectorAll('.tut-target').forEach(e => e.classList.remove('tut-target'));
  if (tutDone()) return;
  if (S.tut === 4 && adoptedN() > 0) { advanceTut(); return; }
  const st = TUT[S.tut]; showBubble(st.text());
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
    if (!tutDone() && adoptedN()===0) r=Math.max(.60,r);
    if (isWalking(p)) r *= BAL.walkHappyRate;
    p.happy = Math.min(100, p.happy + r * dt);
  }
  for (const t of S.train) { t.left -= dt; }
  const doneT = S.train.filter(t => t.left <= 0);
  for (const t of doneT) {
    const p = S.pups.find(q => q.id === t.id);
    if (p) { p.skills[t.k] = Math.min(SKILL_MAX, p.skills[t.k] + 1); toast(`🎓 ${p.name} "${SKILLS.find(s => s.k === t.k).n}" Lv${p.skills[t.k]} 성공!`); }
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
  if (doneT.length || doneW.length) { syncPupEls(); renderPanel(); }
}
let lastFrame = performance.now();
function loop() {
  const now = performance.now(); let real = Math.min(0.5, (now - lastFrame) / 1000); lastFrame = now;
  if (adShowing) return;                                   // 광고 중 게임 시간 정지
  const dt = real * speed;
  tick(dt);
  wanderT += real; if (wanderT > 2.6) { wanderT = 0; wander(); }
  saveT += real; if (saveT > 5 && !document.hidden) { saveT = 0; save(); }
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
function pupIcon(p) { return `<div class="ic">${pupImg(p.coat, p.trait)}</div>`; }
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
    h += ['menu', 'seats', 'toys'].map(upRow).join('');
    h += `<div class="h" style="margin-top:12px">우리 아기 시바들 <small>행복도 가득 차면 입양 신청!</small></div>`;
    h += S.pups.map(p => `<div class="row">${pupIcon(p)}<div class="tx"><b>${p.name}</b> <small class="chip">${COATS[p.coat].name}</small> <small class="chip">${p.trait}</small>${isNewCombo(p) ? ' <small class="chip new">도감 NEW</small>' : ''}
       <p>${TRAITS[p.trait]}</p><div class="bar"><i data-happy="${p.id}" style="width:${p.happy}%" class="pink"></i></div></div>
       ${p.happy >= 100 && !isWalking(p) ? `<button class="btn pink" data-act="adopt" data-arg="${p.id}">입양</button>` : `<span data-hp="${p.id}" class="hp">${Math.floor(p.happy)}%</span>`}</div>`).join('');
    if (S.queue.length) h += `<div class="row soft"><div class="ic">🚗</div><div class="tx"><b>새 아기 시바가 오는 중…</b><p data-queue>${fmtTime(S.queue[0] - S.playSec)} 뒤 도착</p></div></div>`;
  } else if (tab === 'train') {
    h += `<div class="h">🎓 시바 교육 <small>교육 1레벨마다 입양 보상 +${Math.round(BAL.adoptSkill * 100)}%</small></div>`;
    h += upRow('trainer');
    for (const t of S.train) { const p = S.pups.find(q => q.id === t.id); if (p) h += `<div class="row">${pupIcon(p)}<div class="tx"><b>${p.name} - "${SKILLS.find(s => s.k === t.k).n}" 연습 중</b><div class="bar"><i data-prog="train-${t.id}" style="width:${100 - t.left / t.dur * 100}%"></i></div><p data-timer="train-${t.id}">${fmtTime(t.left)} 남음</p></div></div>`; }
    h += S.pups.map(p => {
      const b = busy(p), cost = trainCost(p);
      return `<div class="row" style="flex-wrap:wrap">${pupIcon(p)}<div class="tx"><b>${p.name}</b> <small>${b ? (isWalking(p) ? '산책 중' : isFilming(p) ? '촬영 중' : '교육 중') : cost === 0 ? '🎁 첫 교육 무료!' : `교육비 🪙 ${fmt(cost)}`}</small><div class="chips">${skillChips(p)}</div></div>
        <div style="display:flex;gap:5px;flex-wrap:wrap;width:100%">${SKILLS.map(s => p.skills[s.k] >= SKILL_MAX ? '' : `<button class="btn sm" data-act="train" data-arg="${p.id}:${s.k}" data-cost="${cost}" ${b || S.train.length >= TRAIN_SLOTS ? 'data-lock="1" disabled' : ''}>${s.n}<br><small>${Math.round(trainTime(p, s.k))}초</small></button>`).join('')}</div></div>`;
    }).join('');
  } else if (tab === 'walk') {
    h += `<div class="h">🦮 산책시키기 <small>${COURSES[S.up.course]} · 동시 ${S.walks.length}/${walkCap()}</small></div>`;
    h += `<p class="note">산책 다녀오면 코인 + 행복도 +${BAL.walkHappy}, 그리고 동네 사람들이 보고 손님이 몰려와요! (산책 중에도 행복도는 절반 속도로 올라요)</p>`;
    h += upRow('course');
    if(zoneOpen(4)) h+=`<div id="playCard"><div class="h">🎾 놀이터 놀이</div><p class="note">${BAL.walkSec*.5}초 · 행복도 +${BAL.walkHappy*.7} · 코인 없음 · 재사용 ${BAL.walkSec*3}초</p>${S.pups.map(p=>`<div class="row">${pupIcon(p)}<div class="tx"><b>${p.name}</b><p>${isPlaying(p)?'놀이 중':Math.max(0,Math.ceil(((p.playReadyAt||0)-Date.now())/1000))+'초 뒤 사용 가능'}</p></div><button class="btn" data-act="play" data-arg="${p.id}" ${busy(p)||Date.now()<(p.playReadyAt||0)?'disabled':''}>놀기</button></div>`).join('')}</div>`;

    h += S.pups.map(p => {
      const w = S.walks.find(x => x.id === p.id);
      if (w) return `<div class="row">${pupIcon(p)}<div class="tx"><b>${p.name} 산책 중… 🐾</b><div class="bar"><i data-prog="walk-${p.id}" style="width:${100 - w.left / w.dur * 100}%"></i></div><p data-timer="walk-${p.id}">${fmtTime(w.left)} 남음</p></div></div>`;
      return `<div class="row">${pupIcon(p)}<div class="tx"><b>${p.name}</b><p>보상 🪙 ${fmt(walkReward())} · ${walkTime()}초</p></div><button class="btn" data-act="walk" data-arg="${p.id}" ${busy(p) || S.walks.length >= walkCap() ? 'disabled' : ''}>산책 가기</button></div>`;
    }).join('');
  } else if (tab === 'yt') {
    h += `<div class="h">🎬 동구네 시바TV <small>구독자 ${fmt(S.subs)}명</small></div>`;
    h += `<p class="note">구독자 1명당 초당 ${BAL.subsIncome} 코인 + 구독자가 많을수록 손님이 자주 와요. 교육받은 시바일수록 구독자가 더 늘어요!</p>`;
    h += upRow('cam');
    if (S.film) { const p = S.pups.find(q => q.id === S.film.id); h += `<div class="row">${p ? pupIcon(p) : ''}<div class="tx"><b>🔴 촬영 중: ${S.film.title}</b><div class="bar"><i data-prog="film" style="width:${100 - S.film.left / S.film.dur * 100}%" class="red"></i></div><p data-timer="film">${fmtTime(S.film.left)} 남음</p></div></div>`; }
    h += S.pups.map(p => `<div class="row">${pupIcon(p)}<div class="tx"><b>${p.name}</b><p>${p.trait} · 교육 ${skillScore(p)}레벨</p></div><button class="btn pink" data-act="film" data-arg="${p.id}" ${busy(p) || S.film ? 'disabled' : ''}>촬영하기</button></div>`).join('');
    if (S.videos.length) {
      h += `<div class="h" style="margin-top:12px">업로드한 영상</div>`;
      h += S.videos.map(v => `<div class="row"><div class="ic">${v.viral ? '🔥' : '▶️'}</div><div class="tx"><b style="font-size:13px">${v.title}</b><p>조회수 ${fmt(v.views)}회 · 구독자 +${fmt(v.subs)}</p></div></div>`).join('');
    }
  } else if (tab === 'book') {
    const got = Object.keys(S.dex).length;
    h += `<div class="h">📖 시바 도감 <small>${got}/20 · 입양 ${adoptedN()}마리</small></div>`;
    h += `<p class="note">털색 4가지 × 성격 5가지. 처음 보는 조합을 입양 보내면 보상 +${Math.round(BAL.firstCombo * 100)}%!</p>`;
    h += `<div class="dex"><div></div>${TRAIT_KEYS.map(t => `<div class="dh">${t}</div>`).join('')}`;
    for (const c of COAT_KEYS) {
      h += `<div class="dh side">${COATS[c].name}</div>`;
      h += TRAIT_KEYS.map(t => { const n = S.dex[c + '_' + t]; return `<div class="slot ${n ? 'got' : ''}">${pupImg(c, t)}${n ? `<span>×${n}</span>` : '<span>?</span>'}</div>`; }).join('');
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
  modal(`<div class="pic">${ownerImg()}</div><h2>📺 수익 2배 부스트</h2><p>광고를 끝까지 보면 <b>${BAL.ads.boost.durSec / 60}분 동안</b><br><b>손님·구독자 수익</b>이 2배가 돼요!<br><small>(쓰다듬기·산책·입양 보상은 그대로 · 오늘 ${left}번 남음)</small></p>
    <div class="btns"><button class="btn pink" id="bOk">광고 보고 2배 받기</button><button class="btn gray" id="bNo">다음에</button></div>`);
  $('#bOk').onclick = () => { closeModal(); watchAd('boost', () => {
    S.boostUntil = Date.now() + BAL.ads.boost.durSec * 1000;
    S.boostReadyAt = S.boostUntil + BAL.ads.boost.afterSec * 1000;
    toast(`🔥 ${BAL.ads.boost.durSec / 60}분간 손님·구독자 수익 2배!`);
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
  const earned = Math.floor((avgSeated * custIncome() + subsIncome()) * secs * BAL.offlineIncome);
  for (const p of S.pups) p.happy = Math.min(100, p.happy + F.happyRate(avgSeated, S.up.toys, p.trait, false, adoptedN()) * secs * BAL.offlineHappy);
  S.last = Date.now();
  if (earned < 1) return;
  const aw = Math.floor(away / 3600) ? fmtTime(away) : `${Math.floor(away / 60)}분`;
  const g = adGate('offline'), showAd = away >= BAL.ads.offline.minAwaySec && g.ok;
  modal(`<div class="pic">${ownerImg()}</div><h2>어서 와요, 사장님!</h2>
    ${completed.length ? `<p>🔨 ${completed.join(' · ')} 완공!</p>` : ''}<p>${aw} 동안 아기 시바들이<br>카페를 지키며 돈을 벌었어요 🐾</p>
    <div class="big">🪙 ${fmt(earned)}</div>
    <p class="small">자리 비움 보상은 최대 ${fmtTime(cap)}까지 쌓여요${adoptedN() < 5 ? ' (입양을 더 하면 늘어나요)' : ''}</p>
    <div class="btns">${showAd ? `<button class="btn pink" id="oAd">📺 광고 보고 2배 받기 (🪙 ${fmt(earned * 2)})</button>` : ''}<button class="btn" id="oOk">받기</button></div>`);
  $('#oOk').onclick = () => { closeModal(); addCoins(earned); toast(`🪙 +${fmt(earned)}`); };
  if (showAd) $('#oAd').onclick = () => { closeModal(); watchAd('offline', () => { addCoins(earned * 2); toast(`🪙 +${fmt(earned * 2)}`); }, () => addCoins(earned)); };
}

/* ---------- 확장: saved wall-clock construction, never reward ads ---------- */
const zoneState = z => S.zones[z.id]?.state || 'locked';
const zoneOpen = no => zoneState(ZONES[no-1]) === 'open';
const nextZone = () => ZONES.find(z => z.no > 1 && !z.placeholder && zoneState(z) !== 'open');
function renderZones() {
  const layer = $('#zoneLayer'); layer.innerHTML = '';
  const next = nextZone();
  for (const z of ZONES.slice(1)) {
    const state=zoneState(z), r=z.rect, el=document.createElement('div');
    el.className='zone '+state; el.dataset.zone=z.id;
    Object.assign(el.style,{left:r.x+'px',top:r.y+'px',width:r.w+'px',height:r.h+'px'});
    // Art is optional until delivered: avoid 404 requests for placeholder paths.
    el.innerHTML=`<div class="diamond"><span>${state==='open' ? (z.no===2?'🌿 🪨 🌱':z.no===3?'🐾 🪨 🐾':'🛝 🪵 🎾') : '🎋 🌳 🎋'}</span></div><b class="zone-label">${z.no} · ${z.name}</b>${z.placeholder?'<p>다음 업데이트</p>':''}`;
    if(state==='building') el.innerHTML+='<div class="scaffold">🚧 🏗️<span data-build="'+z.id+'"></span></div>';
    if(z===next) { const b=document.createElement('button');b.className='zone-sign';b.textContent='🔨 '+z.name;b.onclick=()=>openZone(z);el.appendChild(b); }
    layer.appendChild(el);
  }
  renderDecor();
  const opened=ZONES.filter(z=>zoneState(z)==='open');
  const left=Math.min(...opened.map(z=>z.rect.x)),top=Math.min(...opened.map(z=>z.rect.y));
  CafeMap.setBounds({x:left,y:top,w:Math.max(...opened.map(z=>z.rect.x+z.rect.w))-left,h:Math.max(...opened.map(z=>z.rect.y+z.rect.h))-top});
}
function renderZoneGoal() {
  const z=nextZone(),b=$('#nextGoal');
  if(!z) {b.textContent='두 번째 다다미방 · 다음 업데이트';return;}
  const building=zoneState(z)==='building',pct=Math.min(100,S.coins/z.unlock.coins*100);
  b.innerHTML=building ? `공사 중: ${z.name} · ${fmtTime((S.zones[z.id].endsAt-Date.now())/1000)}` : `다음: ${z.name} · ${fmt(S.coins)} / ${fmt(z.unlock.coins)} · 입양 ${adoptedN()}/${z.unlock.adoptions}<progress id="zoneProgress" max="100" value="${pct}"></progress>`;
  const sign=$(`[data-zone="${z.id}"] .zone-sign`);if(sign){sign.dataset.material=Math.floor(pct/25);sign.textContent=`🔨 ${z.name} ${Math.floor(pct/25)>0?'🪵'.repeat(Math.min(3,Math.floor(pct/25))):''}`;}
  document.querySelectorAll('[data-build]').forEach(el=>el.textContent=fmtTime((S.zones[el.dataset.build].endsAt-Date.now())/1000));
}
function openZone(z) {
  $('#panel').classList.remove('open');CafeMap.focus(z.rect.x+z.rect.w/2,z.rect.y+z.rect.h/2);
  if(zoneState(z)==='building') {toast('아직이야. 목수 아저씨들\n방석은 건드리지 마.');return;}
  const u=z.unlock,can=zoneOpen(z.no-1)&&S.coins>=u.coins&&adoptedN()>=u.adoptions;
  const pct=S.coins/u.coins;
  const line=pct>=.75?'거의 다 됐다.\n울타리 너머가 궁금하네.':pct>=.25?'자재가 조금 모였다.\n…아직 멀었어.':'울타리 너머에 새 자리를 만들자.';
  modal(`<h2>🔨 ${z.name}</h2><p>${line.replaceAll('\n','<br>')}</p><p>${z.feature}</p><p>🪙 ${fmt(u.coins)} · 입양 ${adoptedN()}/${u.adoptions} · 공사 ${fmtTime(z.buildSec)}</p><p>추천: 메뉴 개발로 손님 수입을 늘려요.</p><button class="btn" id="startBuild" ${can?'':'disabled'}>공사 시작</button> <button class="btn gray" id="zoneClose">닫기</button>`);
  CafeMap.focus(z.rect.x+z.rect.w/2,z.rect.y+z.rect.h/2);
  $('#startBuild').onclick=()=>startBuild(z);$('#zoneClose').onclick=closeModal;
}
function startBuild(z) {
  if(z!==nextZone() || zoneState(z)==='building' || !zoneOpen(z.no-1) || S.coins<z.unlock.coins || adoptedN()<z.unlock.adoptions)return;
  S.coins-=z.unlock.coins;S.zones[z.id]={state:'building',endsAt:Date.now()+z.buildSec*1000};save();closeModal();renderZones();toast('공사 시작이다.\n망치 소리는… 참아줄게.');
}
let celebrationTimer;
function updateZones(offline=false) {
  for(const z of ZONES) if(zoneState(z)==='building' && S.zones[z.id].endsAt<=Date.now()) {
    S.zones[z.id]={state:'open'};S.pendingGifts.push(z.id);renderZones();fillPups(false);save(offline);
    if(offline){(S.offlineZones ||= []).push(z.name);save(true);}
    else {const previous={...CafeMap.state};CafeMap.focus(z.rect.x+z.rect.w/2,z.rect.y+z.rect.h/2);toast(z.done+'\n'+z.feature);
      clearTimeout(celebrationTimer);celebrationTimer=setTimeout(()=>{CafeMap.focus((previous.vw/2-previous.x)/previous.s,(previous.vh/2-previous.y)/previous.s,previous.s);if(typeof offerGift==='function')offerGift();},3000);}
  }
}
$('#room').addEventListener('pointermove',()=>{if(celebrationTimer){clearTimeout(celebrationTimer);celebrationTimer=null;if(typeof offerGift==='function')offerGift();}});
$('#nextGoal').onclick=()=>{const z=nextZone();if(z)openZone(z);};

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
  S.slots[slot.id]=item.id;save();renderDecor();
}
function openDecor(slot) {
  $('#panel').classList.remove('open');CafeMap.focus(slot.x,slot.y);
  modal(`<h2>🎨 소품 고르기</h2><p>꾸미기는 외형만 바꿔요.</p>${DECOR.filter(d=>d.cat===slot.cat).map(d=>`<div class="row"><div class="ic">${d.emoji}</div><div class="tx"><b>${d.name}</b></div><button class="btn" data-decor="${d.id}" ${!S.ownedDecor.includes(d.id)&&S.coins<d.coins?'disabled':''}>${S.ownedDecor.includes(d.id)?'장착':'🪙 '+fmt(d.coins)}</button></div>`).join('')}<button class="btn gray" id="decorClose">닫기</button>`);
  CafeMap.focus(slot.x,slot.y);
  document.querySelectorAll('[data-decor]').forEach(b=>b.onclick=()=>{equipDecor(slot,DECOR.find(d=>d.id===b.dataset.decor));closeModal();});$('#decorClose').onclick=closeModal;
}
function offerGift() {
  if(!S.pendingGifts.length || !$('#modal').classList.contains('hidden'))return;
  const zone=S.pendingGifts[0],z=ZONES.find(z=>z.id===zone);
  const choices=z.no===2?DECOR.filter(d=>d.cat==='garden'):DECOR.filter(d=>d.cat==='light');
  modal(`<h2>${z.name} 완공 선물</h2><p>무료 소품 하나를 골라 주세요.</p>${choices.map(d=>`<button class="btn" data-gift="${d.id}">${d.emoji} ${d.name}</button>`).join(' ')}`);
  CafeMap.focus(z.rect.x+z.rect.w/2,z.rect.y+z.rect.h/2);
  document.querySelectorAll('[data-gift]').forEach(b=>b.onclick=()=>{const item=DECOR.find(d=>d.id===b.dataset.gift),slot=SLOTS.find(s=>s.cat===item.cat);equipDecor(slot,item,true);S.pendingGifts.shift();save();closeModal();});
}
$('#decorBtn').onclick=()=>{decorating=!decorating;$('#panel').classList.remove('open');renderDecor();toast(decorating?'점선 원을 눌러 소품을 골라요':'꾸미기 완료');};

/* ---------- 디버그 (?debug=1) ---------- */
function setupDebug() {
  if (params.get('bgcheck') === '1') document.documentElement.classList.add('bgcheck');
  const d = $('#debug'); d.classList.remove('hidden');
  d.innerHTML = `<button data-d="spd">⏩ 속도 x1</button><button data-d="coin">+10만 코인</button><button data-d="happy">행복도 가득</button><button data-d="off">오프라인 2시간</button><button data-d="skip">튜토 건너뛰기</button><button data-d="reset">초기화</button>`;
  d.addEventListener('click', e => {
    const k = e.target.dataset.d; if (!k) return;
    if (k === 'spd') { speed = speed === 1 ? 10 : speed === 10 ? 50 : 1; e.target.textContent = `⏩ 속도 x${speed}`; }
    if (k === 'coin') addCoins(100000);
    if (k === 'happy') S.pups.forEach(p => p.happy = 100);
    if (k === 'off') { S.last = Date.now() - 2 * 3600 * 1000; offlineEarnings(); }
    if (k === 'skip') { S.tut = TUT.length; S.playSec = Math.max(S.playSec, 200); hideBubble(); renderTabs(); }
    if (k === 'reset') { localStorage.removeItem(SAVE_KEY); location.reload(); }
    renderPanel();
  });
  window.__game = { BAL, F, TRAIT_FACE, spriteSrc, get S() { return S; }, setSpeed: v => speed = v, tick, ips, fmt, openAdoption, renderPanel, adGate, switchTab, debug: { setStage(n) { S.zones={};ZONES.forEach(z=>S.zones[z.id]={state:z.no<=n&&!z.placeholder?"open":"locked"});renderZones();syncPupEls();renderPanel(); }, advanceBuild(sec) { ZONES.forEach(z=>{if(zoneState(z)==="building")S.zones[z.id].endsAt-=sec*1000;});updateZones(); }, caps: () => ({pupCap:maxPups(),walkCap:walkCap()}), camera: CafeMap }, save };
}

/* ---------- 시작 ---------- */
$('#sheetClose').onclick = () => { $('#panel').classList.remove('open'); CafeMap.focus(); };
$('#settings').onclick = () => { modal('<h2>설정</h2><p>게임은 자동으로 저장돼요.</p><button class="btn" id="settingsClose">닫기</button>'); $('#settingsClose').onclick = closeModal; };
function start() {
  const had = load();
  $('#boss').innerHTML = `<div class="body">${ownerImg()}</div>`;
  $('#adDog').innerHTML = ownerImg();
  renderZones();
  fillPups(true);
  renderTabs(); renderPanel(); renderHUD(); CafeMap.measure(); CafeMap.focus();
  if (had) { updateZones(true); offlineEarnings(); }
  else { modal(`<div class="pic">${ownerImg()}</div><h2>시바견 카페에 오신 걸 환영해요!</h2>
    <p>저는 사장님 <b>동구</b>예요 🐾<br>아기 시바들을 돌보고, 손님을 맞고,<br>행복해진 아이들을 <b>새 가족</b>에게 보내 줘요.</p>
    <div class="btns"><button class="btn pink" id="go">카페 오픈하기</button></div>`); $('#go').onclick = () => { closeModal(); renderTut(); }; }
  for (let i = 0; i < 2; i++) setTimeout(spawnCustomer, 400 + i * 700);
  if (DEBUG) setupDebug();
  setInterval(loop, 100);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); else { lastFrame = performance.now(); if ($('#modal').classList.contains('hidden')) offlineEarnings(); } });
  window.addEventListener('pagehide', save);
}
start();
})();
