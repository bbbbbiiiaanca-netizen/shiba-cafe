/* 시바견 카페 - 방치형 프로토타입 (순수 HTML5/JS, 빌드 없음) */
(function () {
'use strict';

/* ============================================================
 * [광고 연동 지점] showRewardedAd(cb)
 * 지금은 3초짜리 가짜 광고. 나중에 AdMob(Capacitor 플러그인
 * @capacitor-community/admob 등) 보상형 광고로 이 함수만 교체하면 됨.
 * cb(true) = 끝까지 시청(보상 지급), cb(false) = 실패/취소
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
  const m = Math.floor(s / 60), r = s % 60;
  return m > 0 ? `${m}분 ${r}초` : `${r}초`;
}
const params = new URLSearchParams(location.search);
const DEBUG = params.get('debug') === '1';

/* ---------- 데이터 ---------- */
const COATS = {
  red:      { name: '레드',   back: '#d9823b', dark: '#b8642a', white: '#fff8ee', w: 5 },
  sesame:   { name: '참깨',   back: '#c98d52', dark: '#5b3a24', white: '#fff4e6', w: 2 },
  blacktan: { name: '블랙탄', back: '#2f2724', dark: '#1d1715', white: '#fffaf2', tan: '#d39a5a', w: 2 },
  white:    { name: '흰색',   back: '#f7efe2', dark: '#e9dcc6', white: '#ffffff', w: 1 },
};
const TRAITS = {
  '잠꾸러기': '자는 시간이 많아요. 꿀잠 영상 구독자 +50%',
  '장난꾸러기': '쓰다듬기 보너스 2배',
  '새침데기': '행복도는 천천히, 입양 보상 1.5배',
  '먹보': '함께 있으면 손님 지출 +10%',
  '애교쟁이': '행복도가 30% 빨리 올라요',
};
const NAMES = ['콩이','보리','두부','마루','호두','밤이','깨순','라떼','모카','쿠키','달이','별이','유자','감자','찹쌀','인절미','누룽지','꿀떡','도토리','단추','몽실','솜이','짱구','하루','초코','율무','땅콩','깨비'];
const FAMILIES = ['서울 김씨네 가족','부산 신혼부부','자취하는 대학생 누나','은퇴하신 할머니','초등학생 쌍둥이네','회사원 삼촌','제주 귤농장 가족','강아지 유튜버 언니','소방관 아저씨','그림 그리는 작가님','캠핑 좋아하는 부부','대전 빵집 사장님'];
const SKILLS = [
  { k: 'sit', n: '앉아' }, { k: 'paw', n: '손' }, { k: 'wait', n: '기다려' },
  { k: 'down', n: '엎드려' }, { k: 'bang', n: '빵야!' },
];
const SKILL_MAX = 3;
const MENU_NAMES = ['아메리카노','시바 라떼','발바닥 쿠키','멍푸치노','인절미 빙수','시바 케이크','꼬리 마카롱','황금 뼈다귀 와플','동구 시그니처 세트'];
const COURSES = ['동네 골목','근린 공원','한강 산책로','숲속 오솔길','바닷가 모래사장','제주 오름'];
const CAMS = ['스마트폰','짐벌','미러리스 카메라','조명 세트','촬영 스튜디오','방송국급 장비'];
const ORDERS = ['☕','🧋','🍪','🍰','🥤','🧁','🍩'];
const SKIN = ['#f6d3b3','#eec29c','#f9dcc4','#d9a982'];
const HAIR = ['#3a2a20','#1f1a17','#7a4a2a','#c9a36b','#5a3a5a'];
const SHIRT = ['#7cb7ff','#ff9db5','#9ed69a','#ffd36b','#c7a6ff','#ff9f6b'];

const UPGRADES = {
  menu:  { n: '메뉴 개발', ic: '☕', base: 15,  mul: 1.75, max: 60,
           desc: lv => `손님 지출 ${fmt(perCust(lv))}→${fmt(perCust(lv + 1))}/초 · 신메뉴: ${MENU_NAMES[Math.min(lv, MENU_NAMES.length - 1)]}` },
  seats: { n: '좌석 늘리기', ic: '🪑', base: 60,  mul: 2.3,  max: 6,
           desc: lv => `최대 손님 ${2 + lv}→${3 + lv}명` },
  toys:  { n: '장난감·인테리어', ic: '🧸', base: 40,  mul: 1.9,  max: 30,
           desc: lv => `행복도 속도 ×${(1 + 0.25 * lv).toFixed(2)}→×${(1 + 0.25 * (lv + 1)).toFixed(2)}` },
  slots: { n: '강아지 방 넓히기', ic: '🏠', base: 150, mul: 3.2,  max: 4,
           desc: lv => `아기 시바 ${2 + lv}→${3 + lv}마리 (새 친구가 와요)` },
  trainer: { n: '훈련사 고용', ic: '🎓', base: 120, mul: 2.1, max: 10,
           desc: lv => `교육 시간 -${Math.round((1 - trainMult(lv)) * 100)}%→-${Math.round((1 - trainMult(lv + 1)) * 100)}%` },
  course: { n: '산책 코스', ic: '🦮', base: 100, mul: 2.4, max: COURSES.length - 1,
           desc: lv => `${COURSES[lv]} → ${COURSES[lv + 1] || '-'} (산책 보상 ↑, 동시 산책 ${walkCap(lv)}→${walkCap(lv + 1)})` },
  cam:   { n: '촬영 장비', ic: '🎥', base: 150, mul: 2.5, max: CAMS.length - 1,
           desc: lv => `${CAMS[lv]} → ${CAMS[lv + 1] || '-'} (구독자 획득 ↑)` },
};
function upCost(k) { const u = UPGRADES[k]; return Math.floor(u.base * Math.pow(u.mul, S.up[k])); }
function perCust(lv) { return 1 * Math.pow(1.55, lv); }        // 손님 1명 초당 지출 (menu lv 0 = 1/초)
function trainMult(lv) { return Math.pow(0.85, lv); }
function walkCap(lv) { return 1 + Math.floor(lv / 2); }
function camMult() { return 1 + S.up.cam * 0.7; }

/* ---------- 상태 ---------- */
const SAVE_KEY = 'shibaCafe_v1';
let S;
function newState() {
  return {
    coins: 30, rep: 0, subs: 0, total: 0,
    up: { menu: 0, seats: 0, toys: 0, slots: 0, trainer: 0, course: 0, cam: 0 },
    pups: [], adopted: [], nextId: 1, nameIdx: Math.floor(Math.random() * NAMES.length),
    boostUntil: 0, train: [], walks: [], film: null, videos: [],
    last: Date.now(), tut: true,
  };
}
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) { const d = JSON.parse(raw); S = Object.assign(newState(), d); S.up = Object.assign(newState().up, d.up);
      [...S.pups, ...S.adopted].forEach(p => { if (!COATS[p.coat]) p.coat = 'white'; }); return true; }
  } catch (e) { console.warn('save load fail', e); }
  S = newState(); return false;
}
function save() { S.last = Date.now(); try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }

function makePup() {
  const ws = Object.entries(COATS).flatMap(([k, c]) => Array(c.w).fill(k));
  const cnt = S.nameCount || 0; S.nameCount = cnt + 1;
  const name = NAMES[(S.nameIdx + cnt) % NAMES.length] + (cnt >= NAMES.length ? Math.floor(cnt / NAMES.length) + 1 : '');
  return {
    id: S.nextId++, name, coat: pick(ws), trait: pick(Object.keys(TRAITS)),
    happy: 0, skills: { sit: 0, paw: 0, wait: 0, down: 0, bang: 0 },
    x: rnd(10, 75), y: rnd(32, 58), sleep: false,
  };
}
const maxPups = () => 2 + S.up.slots;
const seatCap = () => 2 + S.up.seats;
const skillScore = p => Object.values(p.skills).reduce((a, b) => a + b, 0);
const isWalking = p => S.walks.some(w => w.id === p.id);
const isTraining = p => S.train.some(t => t.id === p.id);
const isFilming = p => S.film && S.film.id === p.id;
const busy = p => isWalking(p) || isTraining(p) || isFilming(p);
const boostOn = () => Date.now() < S.boostUntil;

/* ---------- 손님 (일시 상태, 저장 안 함) ---------- */
let custs = []; let custTimer = 0; let custSeq = 0; let rushUntil = 0;
const SEATS = (() => { const a = []; [8, 32, 56, 80].forEach(x => { a.push({ x: x - 7, y: 4 }); a.push({ x: x + 8, y: 4 }); }); return a; })();
function seatedCount() { return custs.filter(c => c.state === 'sit').length; }
function custIncome() {
  const foodie = S.pups.some(p => p.trait === '먹보' && !isWalking(p)) ? 1.1 : 1;
  return perCust(S.up.menu) * (1 + S.rep * 0.02) * foodie;
}
function subsIncome() { return S.subs * 0.02; }
function ips() { return (seatedCount() * custIncome() + subsIncome()) * (boostOn() ? 2 : 1); }
function spawnInterval() {
  let s = 7 / (1 + S.subs / 300) / (1 + S.rep * 0.01);
  if (Date.now() < rushUntil) s /= 3;
  return Math.max(1.2, s);
}
function spawnCustomer() {
  const used = new Set(custs.map(c => c.seat));
  const free = []; for (let i = 0; i < seatCap(); i++) if (!used.has(i)) free.push(i);
  if (!free.length) return false;
  const seat = pick(free);
  const c = { id: ++custSeq, seat, state: 'walk', t: 0, stay: rnd(18, 32), order: pick(ORDERS),
    skin: pick(SKIN), hair: pick(HAIR), shirt: pick(SHIRT) };
  custs.push(c);
  const el = document.createElement('div'); el.className = 'cust'; el.id = 'c' + c.id;
  el.innerHTML = custSVG(c) + `<div class="bubble">${c.order}</div>`;
  el.style.left = '-12%'; el.style.top = '60%';
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
    if (c.state === 'walk' && c.t > 1.3) { c.state = 'sit'; c.t = 0; }
    else if (c.state === 'sit') {
      if (Math.random() < dt * 0.25 && el) popAt(el, '+' + fmt(Math.max(1, custIncome() * 4)), 'coin');
      if (c.t > c.stay) { c.state = 'leave'; c.t = 0; if (el) { el.style.left = '110%'; el.style.top = '60%'; el.style.opacity = '0'; } }
    } else if (c.state === 'leave' && c.t > 1.4) { c.dead = true; if (el) el.remove(); }
  }
  custs = custs.filter(c => !c.dead);
}

/* ---------- SVG 그림 ---------- */
function shibaSVG(coat, o = {}) {
  const c = COATS[coat] || COATS.red;
  const collar = o.collar || '#ff8fb1';
  const brow = coat === 'blacktan' ? `<ellipse cx="40" cy="36" rx="3.2" ry="2.2" fill="${c.tan}"/><ellipse cx="60" cy="36" rx="3.2" ry="2.2" fill="${c.tan}"/>` :
    `<ellipse cx="40" cy="36" rx="3" ry="2" fill="${c.white}" opacity=".85"/><ellipse cx="60" cy="36" rx="3" ry="2" fill="${c.white}" opacity=".85"/>`;
  const sesame = coat === 'sesame' ? `<ellipse cx="50" cy="30" rx="22" ry="11" fill="${c.dark}" opacity=".55"/><ellipse cx="50" cy="62" rx="20" ry="8" fill="${c.dark}" opacity=".45"/>` : '';
  const tanCheek = coat === 'blacktan' ? `<ellipse cx="50" cy="54" rx="22" ry="14" fill="${c.tan}"/>` : '';
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="50" cy="96" rx="26" ry="4" fill="#0002"/>
  <path d="M70 70 q20 -2 16 -18 q-4 -12 -14 -6 q-6 5 0 10 q5 2 6 -3" fill="none" stroke="${c.back}" stroke-width="9" stroke-linecap="round"/>
  <path d="M73 56 q3 -4 6 0" fill="none" stroke="${c.white}" stroke-width="4" stroke-linecap="round"/>
  <ellipse cx="50" cy="74" rx="24" ry="20" fill="${c.back}"/>
  <ellipse cx="50" cy="79" rx="14" ry="15" fill="${c.white}"/>
  <ellipse cx="39" cy="92" rx="7" ry="5" fill="${c.white}"/><ellipse cx="61" cy="92" rx="7" ry="5" fill="${c.white}"/>
  <path d="M24 32 L28 8 L46 24 Z" fill="${c.back}"/><path d="M76 32 L72 8 L54 24 Z" fill="${c.back}"/>
  <path d="M29 27 L31 14 L41 24 Z" fill="#f7a8b8"/><path d="M71 27 L69 14 L59 24 Z" fill="#f7a8b8"/>
  <ellipse cx="50" cy="44" rx="29" ry="25" fill="${c.back}"/>
  ${sesame}${tanCheek}
  <path d="M50 38 C36 38 22 46 24 57 C27 68 40 70 50 70 C60 70 73 68 76 57 C78 46 64 38 50 38 Z" fill="${c.white}"/>
  ${brow}
  <rect x="32" y="66" width="36" height="6" rx="3" fill="${collar}"/><circle cx="50" cy="73" r="3" fill="#ffd36b"/>
  ${faceSVG(o.face || 'happy')}
  ${o.apron ? '<path d="M36 70 h28 l-3 22 h-22 z" fill="#fff" stroke="#e2b77c" stroke-width="1.5"/><text x="50" y="86" font-size="8" text-anchor="middle" fill="#d9823b" font-weight="900">사장</text>' : ''}
  </svg>`;
}
/* 성격별 표정 (스프라이트 생성 시 같은 키로 매핑: happy/sleepy/grin/aloof/drool/sparkle) */
const TRAIT_FACE = { '잠꾸러기': 'sleepy', '장난꾸러기': 'grin', '새침데기': 'aloof', '먹보': 'drool', '애교쟁이': 'sparkle' };
function faceSVG(f) {
  const K = '#1d1715';
  const closed = `<g class="eyes-c"><path d="M35 47 q5 4 10 0 M55 47 q5 4 10 0" stroke="${K}" stroke-width="2.2" fill="none" stroke-linecap="round"/></g>`;
  const dot = (cx, cy, r = 4, hx = 1.4) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${K}"/><circle cx="${cx + hx}" cy="${cy - 1.4}" r="1.4" fill="#fff"/>`;
  let eyes, mouth = `<path d="M50 57 v2 M45 59 q5 4 5 0 q0 4 5 0" stroke="${K}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  if (f === 'sleepy') {
    eyes = `<g class="eyes-o"><path d="M35 47 h10 M55 47 h10" stroke="${K}" stroke-width="2.4" stroke-linecap="round"/><path d="M36 48 q4 2.5 8 0 M56 48 q4 2.5 8 0" fill="${K}"/></g>`;
  } else if (f === 'grin') {
    eyes = `<g class="eyes-o">${dot(40, 47)}<path d="M55 47 q5 -4 10 0" stroke="${K}" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>`;
    mouth = `<path d="M43 58 q7 7 14 0" stroke="${K}" stroke-width="1.8" fill="#c94a5a"/><path d="M50 60 q4 7 7 1" fill="#ff8fa3" stroke="${K}" stroke-width="1"/>`;
  } else if (f === 'aloof') {
    eyes = `<g class="eyes-o"><circle cx="42" cy="47" r="3.6" fill="${K}"/><circle cx="62" cy="47" r="3.6" fill="${K}"/><path d="M35 44 h10 M55 44 h10" stroke="${K}" stroke-width="1.8" stroke-linecap="round"/></g>`;
    mouth = `<path d="M47 60 q3 -2 6 0" stroke="${K}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  } else if (f === 'drool') {
    eyes = `<g class="eyes-o">${dot(40, 47, 4.6)}${dot(60, 47, 4.6)}</g>`;
    mouth = `<path d="M44 58 q6 6 12 0 z" fill="#c94a5a" stroke="${K}" stroke-width="1.4"/><path d="M55 60 q1.5 5 0 7 q-1.5 -2 0 -7" fill="#bfe6ff"/>`;
  } else if (f === 'sparkle') {
    eyes = `<g class="eyes-o">${dot(40, 47, 5)}${dot(60, 47, 5)}<circle cx="38.6" cy="49" r=".9" fill="#fff"/><circle cx="58.6" cy="49" r=".9" fill="#fff"/></g>`;
    mouth = `<path d="M43 58 q7 8 14 0 z" fill="#c94a5a" stroke="${K}" stroke-width="1.4"/><path d="M47 61 q3 4 6 0" fill="#ff8fa3"/>`;
  } else {
    eyes = `<g class="eyes-o">${dot(40, 47)}${dot(60, 47)}</g>`;
  }
  return eyes + closed + `<ellipse cx="50" cy="54" rx="4" ry="3" fill="${K}"/>` + mouth;
}
function custSVG(c) {
  return `<svg viewBox="0 0 40 56" width="40" height="56"><ellipse cx="20" cy="54" rx="13" ry="2.5" fill="#0002"/>
  <rect x="7" y="26" width="26" height="26" rx="10" fill="${c.shirt}"/>
  <circle cx="20" cy="16" r="11" fill="${c.skin}"/><path d="M9 15 q2 -12 11 -12 q10 0 11 12 q-5 -6 -11 -6 q-7 0 -11 6z" fill="${c.hair}"/>
  <circle cx="16" cy="17" r="1.4" fill="#222"/><circle cx="24" cy="17" r="1.4" fill="#222"/><path d="M17 21 q3 2.5 6 0" stroke="#b55" stroke-width="1.2" fill="none"/></svg>`;
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

/* ---------- 강아지 렌더/행동 ---------- */
function syncPupEls() {
  const floor = $('#floor');
  const visible = new Set(S.pups.filter(p => !isWalking(p)).map(p => p.id));
  floor.querySelectorAll('.pup').forEach(el => { if (!visible.has(+el.dataset.id)) el.remove(); });
  for (const p of S.pups) {
    if (!visible.has(p.id)) continue;
    let el = floor.querySelector(`.pup[data-id="${p.id}"]`);
    if (!el) {
      el = document.createElement('div'); el.className = 'pup'; el.dataset.id = p.id;
      el.innerHTML = shibaSVG(p.coat, { face: TRAIT_FACE[p.trait] }) + `<div class="hb"><i></i></div><div class="nm">${p.name}</div><div class="zz">💤</div><div class="badge"></div>`;
      el.style.left = p.x + '%'; el.style.top = p.y + '%';
      el.addEventListener('click', () => tapPup(p.id));
      floor.appendChild(el);
    }
  }
}
function updatePupEls() {
  for (const p of S.pups) {
    const el = $(`#floor .pup[data-id="${p.id}"]`); if (!el) continue;
    el.querySelector('.hb i').style.width = p.happy + '%';
    el.classList.toggle('sleep', !!p.sleep);
    const b = el.querySelector('.badge');
    const badge = p.happy >= 100 ? '<div class="adopt">💌 입양 희망!</div>' :
      isTraining(p) ? '<div class="adopt" style="background:#7cb7ff">🎓 교육중</div>' :
      isFilming(p) ? '<div class="adopt" style="background:#ff4d4d">🎥 촬영중</div>' : '';
    if (b.dataset.v !== badge) { b.innerHTML = badge; b.dataset.v = badge; }
  }
}
function wander() {
  for (const p of S.pups) {
    if (isWalking(p) || Math.random() < 0.35) continue;
    const sleepy = p.trait === '잠꾸러기' ? 0.5 : 0.18;
    p.sleep = !isTraining(p) && !isFilming(p) && p.happy < 100 && Math.random() < sleepy;
    if (!p.sleep) {
      const nx = clamp(p.x + rnd(-30, 30), 2, 84), ny = clamp(p.y + rnd(-20, 20), 30, 60);
      const el = $(`#floor .pup[data-id="${p.id}"]`);
      if (el) { el.classList.toggle('flip', nx < p.x); el.style.left = nx + '%'; el.style.top = ny + '%'; el.style.zIndex = Math.round(ny); }
      p.x = nx; p.y = ny;
    }
  }
}
function tapPup(id) {
  const p = S.pups.find(q => q.id === id); if (!p) return;
  const el = $(`#floor .pup[data-id="${p.id}"]`);
  if (p.happy >= 100) { openAdoption(p); return; }
  p.sleep = false;
  const gain = Math.max(1, (seatedCount() * custIncome() + subsIncome()) * 1.5 + 1) * (p.trait === '장난꾸러기' ? 2 : 1) * (boostOn() ? 2 : 1);
  addCoins(gain);
  p.happy = Math.min(100, p.happy + 1.5);
  if (el) { el.classList.remove('hop'); void el.offsetWidth; el.classList.add('hop'); popAt(el, '❤️', 'heart'); setTimeout(() => popAt(el, '+' + fmt(gain)), 120); }
}
function addCoins(n) { S.coins += n; S.total += n; }

/* ---------- 입양 ---------- */
function adoptReward(p) {
  const base = 80 + perCust(S.up.menu) * seatCap() * 45 + S.adopted.length * 25;
  return Math.floor(base * (1 + skillScore(p) * 0.25) * (p.trait === '새침데기' ? 1.5 : 1));
}
function openAdoption(p) {
  if (!p.family) p.family = pick(FAMILIES);
  const r = adoptReward(p), rp = 1 + skillScore(p);
  const sk = SKILLS.filter(s => p.skills[s.k] > 0).map(s => `${s.n} Lv${p.skills[s.k]}`).join(', ');
  modal(`<div class="pic">${shibaSVG(p.coat, { face: TRAIT_FACE[p.trait] })}</div>
    <h2>💌 입양 신청이 왔어요!</h2>
    <p><b>${p.family}</b>이(가)<br><b>${p.name}</b>(${COATS[p.coat].name} · ${p.trait})를 가족으로 맞이하고 싶대요.</p>
    ${sk ? `<p>🎓 배운 것: ${sk} <br>(교육 보너스 +${skillScore(p) * 25}%)</p>` : '<p>💡 교육을 시키면 입양 보상이 올라가요</p>'}
    <div class="big">🪙 ${fmt(r)} · ⭐ +${rp}</div>
    <div class="btns">
      <button class="btn pink" id="adAdopt">📺 광고 보고 보상 2배로 입양 보내기</button>
      <button class="btn" id="okAdopt">입양 보내기</button>
      <button class="btn gray" id="noAdopt">조금만 더 함께 있을래요</button>
    </div>`);
  $('#okAdopt').onclick = () => { closeModal(); doAdopt(p, r, rp); };
  $('#adAdopt').onclick = () => { closeModal(); showRewardedAd(ok => doAdopt(p, ok ? r * 2 : r, rp)); };
  $('#noAdopt').onclick = closeModal;
}
function doAdopt(p, reward, rp) {
  if (!S.pups.includes(p)) return;
  addCoins(reward); S.rep += rp;
  S.train = S.train.filter(t => t.id !== p.id); S.walks = S.walks.filter(w => w.id !== p.id);
  if (S.film && S.film.id === p.id) S.film = null;
  const d = new Date();
  S.adopted.unshift({ name: p.name, coat: p.coat, trait: p.trait, family: p.family || pick(FAMILIES), skill: skillScore(p), date: `${d.getMonth() + 1}/${d.getDate()}` });
  S.pups = S.pups.filter(q => q !== p);
  syncPupEls();
  toast(`🏡 ${p.name}가 ${p.family}에게 입양됐어요! +${fmt(reward)}`);
  setTimeout(() => { fillPups(true); }, 1800);
  renderPanel(); save();
}
function fillPups(announce) {
  let added = null;
  while (S.pups.length < maxPups()) { const np = makePup(); S.pups.push(np); added = np; }
  syncPupEls();
  if (added && announce) { toast(`🐶 새 아기 시바 ${added.name}(${COATS[added.coat].name})가 카페에 왔어요!`); renderPanel(); }
}

/* ---------- 교육 / 산책 / 유튜브 ---------- */
function trainCost(p) { return Math.floor(30 * Math.pow(1.8, skillScore(p))); }
function trainTime(p, k) { return (15 + 15 * p.skills[k]) * trainMult(S.up.trainer); }
const TRAIN_SLOTS = 1;
function startTrain(id, k) {
  const p = S.pups.find(q => q.id === id); if (!p || busy(p) || p.skills[k] >= SKILL_MAX) return;
  if (S.train.length >= TRAIN_SLOTS) return toast('교육장이 꽉 찼어요 (동시에 1마리)');
  const c = trainCost(p); if (S.coins < c) return toast('코인이 부족해요');
  S.coins -= c; const dur = trainTime(p, k);
  S.train.push({ id, k, left: dur, dur }); p.sleep = false; renderPanel();
}
function walkReward() { return Math.floor((25 + perCust(S.up.menu) * seatCap() * 18) * (1 + S.up.course * 0.5)); }
function walkTime() { return 40 + S.up.course * 5; }
function startWalk(id) {
  const p = S.pups.find(q => q.id === id); if (!p || busy(p)) return;
  if (S.walks.length >= walkCap(S.up.course)) return toast(`지금은 동시에 ${walkCap(S.up.course)}마리까지 산책할 수 있어요`);
  S.walks.push({ id, left: walkTime(), dur: walkTime() }); syncPupEls(); renderPanel();
  toast(`🦮 ${p.name} ${COURSES[S.up.course]}(으)로 산책 출발!`);
}
function finishWalk(w) {
  const p = S.pups.find(q => q.id === w.id); if (!p) return;
  const r = walkReward() * (boostOn() ? 2 : 1); addCoins(r);
  p.happy = Math.min(100, p.happy + 20);
  rushUntil = Date.now() + 25000;
  for (let i = 0; i < 2; i++) setTimeout(spawnCustomer, 600 + i * 900);
  toast(`🦮 ${p.name} 산책 끝! +${fmt(r)} · 행복도 +20 · 산책 보고 손님이 몰려와요!`);
}
const TOPICS = { '잠꾸러기': '배까고 꿀잠 ASMR', '장난꾸러기': '휴지 파티 대참사', '새침데기': '만지지 마라 시바 거절', '먹보': '간식 먹방 눈치게임', '애교쟁이': '손님 무릎 위 애교 폭발' };
function filmTime() { return 30; }
function startFilm(id) {
  const p = S.pups.find(q => q.id === id); if (!p || busy(p)) return;
  if (S.film) return toast('이미 촬영 중이에요');
  const sk = SKILLS.filter(s => p.skills[s.k] > 0);
  const topic = sk.length && Math.random() < 0.5 ? `${pick(sk).n} 성공 영상` : TOPICS[p.trait];
  S.film = { id, left: filmTime(), dur: filmTime(), title: `아기시바 ${p.name}의 ${topic}` };
  p.sleep = false; renderPanel();
}
function finishFilm() {
  const f = S.film; S.film = null;
  const p = S.pups.find(q => q.id === f.id);
  const sc = p ? skillScore(p) : 0;
  let subs = (12 + sc * 8 + S.subs * 0.03) * camMult() * rnd(0.6, 1.5) * (p && p.trait === '잠꾸러기' ? 1.5 : 1);
  const viral = Math.random() < 0.12; if (viral) subs *= 5;
  subs = Math.max(1, Math.floor(subs));
  const views = Math.floor(subs * rnd(20, 60));
  S.subs += subs;
  S.videos.unshift({ title: f.title, views, subs, viral }); S.videos = S.videos.slice(0, 8);
  toast(viral ? `🔥 떡상! "${f.title}" 구독자 +${fmt(subs)}` : `🎬 영상 업로드! 구독자 +${fmt(subs)}`);
  renderPanel();
}

/* ---------- 메인 틱 ---------- */
let speed = 1, wanderT = 0, saveT = 0, panelT = 0;
function tick(dt) {
  updateCustomers(dt);
  const income = ips(); addCoins(income * dt);
  const seated = seatedCount(), toyM = 1 + 0.25 * S.up.toys;
  for (const p of S.pups) {
    if (isWalking(p)) continue;
    let r = (0.35 + 0.22 * seated) * toyM;
    if (p.trait === '애교쟁이') r *= 1.3; if (p.trait === '새침데기') r *= 0.75;
    if (p.sleep) r *= 0.6;
    r /= (1 + S.adopted.length * 0.12);   // 입양할수록 조금씩 느려짐
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
  if (doneT.length || doneW.length) { syncPupEls(); renderPanel(); }
}
let lastFrame = performance.now();
function loop() {
  const now = performance.now(); let real = Math.min(0.5, (now - lastFrame) / 1000); lastFrame = now;
  const dt = real * speed;
  tick(dt);
  wanderT += real; if (wanderT > 2.6) { wanderT = 0; wander(); }
  saveT += real; if (saveT > 5 && !document.hidden) { saveT = 0; save(); }
  panelT += real; if (panelT > 0.25) { panelT = 0; renderHUD(); refreshPanel(); updatePupEls(); }
}

/* ---------- HUD / 패널 ---------- */
function renderHUD() {
  $('#coins').textContent = fmt(S.coins);
  $('#rep').textContent = fmt(S.rep);
  $('#subs').textContent = fmt(S.subs);
  $('#ips').textContent = fmt(ips() * 10) === '0' ? '0' : (ips() < 10 ? ips().toFixed(1) : fmt(ips()));
  const on = boostOn();
  $('#boostBtn').classList.toggle('hidden', on);
  $('#boostTimer').classList.toggle('hidden', !on);
  if (on) $('#boostTimer').textContent = `🔥 수익 2배 ${fmtTime((S.boostUntil - Date.now()) / 1000)}`;
}
let tab = 'cafe';
function pupIcon(p) { return `<div class="ic">${shibaSVG(p.coat, { face: TRAIT_FACE[p.trait] })}</div>`; }
function skillChips(p) { return SKILLS.map(s => `<span class="chip ${p.skills[s.k] ? 'on' : ''}">${s.n}${p.skills[s.k] ? ' ' + p.skills[s.k] : ''}</span>`).join(''); }
function upRow(k) {
  const u = UPGRADES[k], lv = S.up[k], max = lv >= u.max;
  return `<div class="row"><div class="ic">${u.ic}</div><div class="tx"><b>${u.n} <small>Lv${lv}</small></b><p>${max ? '최대 레벨!' : u.desc(lv)}</p></div>
    ${max ? '<button class="btn" disabled>MAX</button>' : `<button class="btn" data-act="buy" data-arg="${k}" data-cost="${upCost(k)}">🪙 ${fmt(upCost(k))}</button>`}</div>`;
}
function renderPanel() {
  const P = $('#panel'); let h = '';
  if (tab === 'cafe') {
    h += `<div class="h">카페 업그레이드 <small>손님 <span data-seat>${seatedCount()}</span>/${seatCap()} · 아기 시바 ${S.pups.length}/${maxPups()}</small></div>`;
    h += ['menu', 'seats', 'toys', 'slots'].map(upRow).join('');
    h += `<div class="h" style="margin-top:12px">우리 아기 시바들 <small>행복도 가득 차면 입양 신청!</small></div>`;
    h += S.pups.map(p => `<div class="row">${pupIcon(p)}<div class="tx"><b>${p.name}</b> <small class="chip">${COATS[p.coat].name}</small> <small class="chip">${p.trait}</small>
       <p>${TRAITS[p.trait]}</p><div class="bar"><i data-happy="${p.id}" style="width:${p.happy}%;background:#ff7aa2"></i></div></div>
       ${p.happy >= 100 && !isWalking(p) ? `<button class="btn pink" data-act="adopt" data-arg="${p.id}">입양</button>` : `<span data-hp="${p.id}" style="font-size:12px;width:40px;text-align:right">${Math.floor(p.happy)}%</span>`}</div>`).join('');
  } else if (tab === 'train') {
    h += `<div class="h">🎓 시바 교육 <small>교육할수록 입양 보상 +25%/레벨</small></div>`;
    h += upRow('trainer');
    for (const t of S.train) { const p = S.pups.find(q => q.id === t.id); if (p) h += `<div class="row">${pupIcon(p)}<div class="tx"><b>${p.name} - "${SKILLS.find(s => s.k === t.k).n}" 연습 중</b><div class="bar"><i data-prog="train-${t.id}" style="width:${100 - t.left / t.dur * 100}%"></i></div><p data-timer="train-${t.id}">${fmtTime(t.left)} 남음</p></div></div>`; }
    h += S.pups.map(p => {
      const b = busy(p), cost = trainCost(p);
      return `<div class="row" style="flex-wrap:wrap">${pupIcon(p)}<div class="tx"><b>${p.name}</b> <small>${b ? (isWalking(p) ? '산책 중' : isFilming(p) ? '촬영 중' : '교육 중') : `교육비 🪙 ${fmt(cost)}`}</small><div class="chips">${skillChips(p)}</div></div>
        <div style="display:flex;gap:5px;flex-wrap:wrap;width:100%">${SKILLS.map(s => p.skills[s.k] >= SKILL_MAX ? '' : `<button class="btn" style="min-width:0;flex:1;padding:6px 4px" data-act="train" data-arg="${p.id}:${s.k}" data-cost="${cost}" ${b || S.train.length >= TRAIN_SLOTS ? 'data-lock="1" disabled' : ''}>${s.n}<br><small style="font-weight:500">${Math.round(trainTime(p, s.k))}초</small></button>`).join('')}</div></div>`;
    }).join('');
  } else if (tab === 'walk') {
    h += `<div class="h">🦮 산책시키기 <small>${COURSES[S.up.course]} · 동시 ${S.walks.length}/${walkCap(S.up.course)}</small></div>`;
    h += `<p style="font-size:12px;color:#8a5a33;margin:0 2px 8px">산책 다녀오면 코인 + 행복도 +20, 그리고 동네 사람들이 보고 손님이 몰려와요!</p>`;
    h += upRow('course');
    h += S.pups.map(p => {
      const w = S.walks.find(x => x.id === p.id);
      if (w) return `<div class="row">${pupIcon(p)}<div class="tx"><b>${p.name} 산책 중… 🐾</b><div class="bar"><i data-prog="walk-${p.id}" style="width:${100 - w.left / w.dur * 100}%"></i></div><p data-timer="walk-${p.id}">${fmtTime(w.left)} 남음</p></div></div>`;
      return `<div class="row">${pupIcon(p)}<div class="tx"><b>${p.name}</b><p>보상 🪙 ${fmt(walkReward())} · ${walkTime()}초</p></div><button class="btn" data-act="walk" data-arg="${p.id}" ${busy(p) || S.walks.length >= walkCap(S.up.course) ? 'disabled' : ''}>산책 가기</button></div>`;
    }).join('');
  } else if (tab === 'yt') {
    h += `<div class="h">🎬 동구네 시바TV <small>구독자 ${fmt(S.subs)}명</small></div>`;
    h += `<p style="font-size:12px;color:#8a5a33;margin:0 2px 8px">구독자 1명당 초당 0.02 코인 + 구독자가 많을수록 손님이 자주 와요. 교육받은 시바일수록 인기 폭발!</p>`;
    h += upRow('cam');
    if (S.film) { const p = S.pups.find(q => q.id === S.film.id); h += `<div class="row">${p ? pupIcon(p) : ''}<div class="tx"><b>🔴 촬영 중: ${S.film.title}</b><div class="bar"><i data-prog="film" style="width:${100 - S.film.left / S.film.dur * 100}%;background:#ff4d4d"></i></div><p data-timer="film">${fmtTime(S.film.left)} 남음</p></div></div>`; }
    h += S.pups.map(p => `<div class="row">${pupIcon(p)}<div class="tx"><b>${p.name}</b><p>${p.trait} · 교육 ${skillScore(p)}레벨</p></div><button class="btn pink" data-act="film" data-arg="${p.id}" ${busy(p) || S.film ? 'disabled' : ''}>촬영하기</button></div>`).join('');
    if (S.videos.length) {
      h += `<div class="h" style="margin-top:12px">업로드한 영상</div>`;
      h += S.videos.map(v => `<div class="row"><div class="ic">${v.viral ? '🔥' : '▶️'}</div><div class="tx"><b style="font-size:13px">${v.title}</b><p>조회수 ${fmt(v.views)}회 · 구독자 +${fmt(v.subs)}</p></div></div>`).join('');
    }
  } else if (tab === 'book') {
    h += `<div class="h">📖 입양 도감 <small>새 가족을 찾은 아이들 ${S.adopted.length}마리</small></div>`;
    h += S.adopted.length ? `<div class="book">${S.adopted.map(a => `<div class="bk">${shibaSVG(a.coat, { face: TRAIT_FACE[a.trait] })}<b>${a.name}</b>${COATS[a.coat].name} · ${a.trait}<br>🏡 ${a.family}<br><small>${a.date}</small></div>`).join('')}</div>`
      : `<div class="empty">아직 입양 간 아이가 없어요.<br>행복도를 가득 채우면 입양 신청이 와요! 💌</div>`;
  }
  P.innerHTML = h;
}
function refreshPanel() {
  const P = $('#panel');
  P.querySelectorAll('[data-cost]').forEach(b => { if (!b.dataset.lock) b.disabled = S.coins < +b.dataset.cost; });
  P.querySelectorAll('[data-happy]').forEach(i => { const p = S.pups.find(q => q.id === +i.dataset.happy); if (p) i.style.width = p.happy + '%'; });
  P.querySelectorAll('[data-hp]').forEach(i => { const p = S.pups.find(q => q.id === +i.dataset.hp); if (p) { i.textContent = Math.floor(p.happy) + '%'; if (p.happy >= 100) renderPanel(); } });
  P.querySelectorAll('[data-seat]').forEach(e => e.textContent = seatedCount());
  const tm = (key) => key === 'film' ? S.film : key.startsWith('train-') ? S.train.find(t => t.id === +key.slice(6)) : S.walks.find(w => w.id === +key.slice(5));
  P.querySelectorAll('[data-timer]').forEach(e => { const t = tm(e.dataset.timer); if (t) e.textContent = fmtTime(t.left) + ' 남음'; });
  P.querySelectorAll('[data-prog]').forEach(e => { const t = tm(e.dataset.prog); if (t) e.style.width = (100 - t.left / t.dur * 100) + '%'; });
}
$('#panel').addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  const a = b.dataset.act, arg = b.dataset.arg;
  if (a === 'buy') {
    const c = upCost(arg); if (S.coins < c || S.up[arg] >= UPGRADES[arg].max) return;
    S.coins -= c; S.up[arg]++;
    if (arg === 'slots') fillPups(true);
    toast(`✨ ${UPGRADES[arg].n} Lv${S.up[arg]}!`);
    renderPanel(); save();
  } else if (a === 'adopt') { const p = S.pups.find(q => q.id === +arg); if (p) openAdoption(p); }
  else if (a === 'train') { const [id, k] = arg.split(':'); startTrain(+id, k); }
  else if (a === 'walk') startWalk(+arg);
  else if (a === 'film') startFilm(+arg);
});
document.querySelectorAll('#tabs button').forEach(b => b.addEventListener('click', () => {
  tab = b.dataset.tab; document.querySelectorAll('#tabs button').forEach(x => x.classList.toggle('on', x === b)); renderPanel(); $('#panel').scrollTop = 0;
}));

/* ---------- 모달 / 광고 부스트 / 오프라인 ---------- */
function modal(html) { $('#modalCard').innerHTML = html; $('#modal').classList.remove('hidden'); }
function closeModal() { $('#modal').classList.add('hidden'); }
const BOOST_SEC = 300;
$('#boostBtn').addEventListener('click', () => {
  modal(`<h2>📺 수익 2배 부스트</h2><p>짧은 광고를 보면 <b>5분 동안</b><br>모든 수익이 2배가 돼요!</p>
    <div class="btns"><button class="btn pink" id="bOk">광고 보고 2배 받기</button><button class="btn gray" id="bNo">다음에</button></div>`);
  $('#bOk').onclick = () => { closeModal(); showRewardedAd(ok => { if (ok) { S.boostUntil = Date.now() + BOOST_SEC * 1000; toast('🔥 5분간 수익 2배!'); save(); } }); };
  $('#bNo').onclick = closeModal;
});
$('#boss').addEventListener('click', () => {
  toast(pick(['동구 사장님: 손님한테 친절하게 해라 멍!', '동구 사장님: 만지지 마라… 아빠만 된다.', '동구 사장님: 오늘도 배까고 자고 싶다…', '동구 사장님: 아기들아 입양 잘 가거라 🥹']));
  const el = $('#boss'); el.classList.remove('hop'); void el.offsetWidth; el.classList.add('hop');
});

function offlineEarnings() {
  const secs = Math.min(8 * 3600, Math.max(0, (Date.now() - S.last) / 1000));
  if (secs < 60) return;
  const avg = (seatCap() * 0.6 * custIncome() + subsIncome());
  const earned = Math.floor(avg * secs * 0.5);
  // 행복도도 조금 진행
  for (const p of S.pups) p.happy = Math.min(100, p.happy + secs * 0.15 * (1 + 0.25 * S.up.toys));
  if (earned < 1) return;
  const h = Math.floor(secs / 3600), m = Math.floor(secs % 3600 / 60);
  modal(`<div class="pic">${shibaSVG('red', { apron: true })}</div><h2>어서 와요, 사장님!</h2>
    <p>${h ? h + '시간 ' : ''}${m}분 동안 아기 시바들이<br>카페를 지키며 돈을 벌었어요 🐾</p>
    <div class="big">🪙 ${fmt(earned)}</div>
    <div class="btns"><button class="btn pink" id="oAd">📺 광고 보고 2배 받기 (🪙 ${fmt(earned * 2)})</button><button class="btn" id="oOk">그냥 받기</button></div>`);
  $('#oOk').onclick = () => { closeModal(); addCoins(earned); toast(`🪙 +${fmt(earned)}`); };
  $('#oAd').onclick = () => { closeModal(); showRewardedAd(ok => { addCoins(ok ? earned * 2 : earned); toast(`🪙 +${fmt(ok ? earned * 2 : earned)}`); }); };
}

/* ---------- 디버그 (?debug=1) ---------- */
function setupDebug() {
  const d = $('#debug'); d.classList.remove('hidden');
  d.innerHTML = `<button data-d="spd">⏩ 속도 x1</button><button data-d="coin">+10만 코인</button><button data-d="happy">행복도 가득</button><button data-d="off">오프라인 2시간</button><button data-d="reset">초기화</button>`;
  d.addEventListener('click', e => {
    const k = e.target.dataset.d; if (!k) return;
    if (k === 'spd') { speed = speed === 1 ? 10 : speed === 10 ? 50 : 1; e.target.textContent = `⏩ 속도 x${speed}`; }
    if (k === 'coin') addCoins(100000);
    if (k === 'happy') S.pups.forEach(p => p.happy = 100);
    if (k === 'off') { S.last = Date.now() - 2 * 3600 * 1000; offlineEarnings(); }
    if (k === 'reset') { localStorage.removeItem(SAVE_KEY); location.reload(); }
    renderPanel();
  });
  window.__game = { shibaSVG, TRAIT_FACE, get S() { return S; }, setSpeed: v => speed = v, tick, ips, fmt, openAdoption, renderPanel };
}

/* ---------- 시작 ---------- */
function start() {
  const had = load();
  $('#boss').innerHTML = shibaSVG('red', { apron: true });
  fillPups(false); syncPupEls();
  renderPanel(); renderHUD();
  if (had) offlineEarnings();
  else modal(`<div class="pic">${shibaSVG('red', { apron: true })}</div><h2>시바견 카페에 오신 걸 환영해요!</h2>
    <p>저는 사장님 <b>동구</b>예요 🐾<br>손님이 오면 코인이 쌓이고, 아기 시바를 톡톡 쓰다듬으면 보너스!<br>
    행복도가 가득 찬 아이에게는 <b>입양 신청</b>이 와요.<br>교육·산책·유튜브로 카페를 키워봐요!</p>
    <div class="btns"><button class="btn pink" id="go">카페 오픈하기</button></div>`), $('#go').onclick = closeModal;
  for (let i = 0; i < 2; i++) setTimeout(spawnCustomer, 400 + i * 700);
  if (DEBUG) setupDebug();
  setInterval(loop, 100);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); else { lastFrame = performance.now(); if ($('#modal').classList.contains('hidden')) offlineEarnings(); } });
  window.addEventListener('pagehide', save);
}
start();
})();
