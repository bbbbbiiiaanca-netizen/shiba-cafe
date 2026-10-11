/* 시바견 카페 레이아웃 테스트 - 공유 HUD 데이터 + 앰비언트 효과 */
(function () {
  'use strict';
  var W = 1280, H = 720;
  var HUD = { coins: 12450, hearts: 86, paws: 230 };
  var BUTTONS = [
    { k: 'quest', e: '📋', l: '퀘스트' },
    { k: 'shop', e: '🏪', l: '가게' },
    { k: 'shibas', e: '🐕', l: '시바들' },
    { k: 'upgrade', e: '📦', l: '업그레이드' },
    { k: 'event', e: '🎁', l: '이벤트' }
  ];
  // 이미지 비율 좌표 (0~1)
  var SPOTS = [
    { x: 0.115, y: 0.58 }, { x: 0.29, y: 0.62 }, { x: 0.48, y: 0.6 },
    { x: 0.84, y: 0.70, sleep: true }, { x: 0.33, y: 0.33 }, { x: 0.565, y: 0.33 }
  ];
  var COIN_GAIN = 12;

  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function $(id) { return document.getElementById(id); }

  function pill(key, icon, bg) {
    return '<div class="pill" data-cur="' + key + '"><span class="ic"' + (bg ? ' style="background:' + bg + '"' : '') + '>' + icon +
      '</span><span class="v">' + fmt(HUD[key]) + '</span><span class="plus">+</span></div>';
  }

  function mountHud() {
    var q = $('quest'), c = $('cur'), s = $('sign');
    if (q) q.innerHTML = '<span class="ic">🌸</span>카페를 발전시키세요! <span>🐾</span>';
    if (c) c.innerHTML = pill('coins', '🪙', '#f2c84b') + pill('hearts', '💗') + pill('paws', '🐾');
    if (s) s.innerHTML = '시바견<br>카페<div class="paw">🐾</div>';
    var pluses = document.querySelectorAll('.pill .plus');
    for (var i = 0; i < pluses.length; i++) {
      pluses[i].addEventListener('click', function () { toast('충전 (레이아웃 테스트)'); });
    }
  }

  var toastEl = null, toastTimer = 0;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'lt-toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 1400);
  }

  // container 안에 버튼 5개 생성. onTap(key, el, label) 이 true를 돌려주면 기본 토스트 생략
  function renderButtons(container, onTap) {
    var map = {};
    container.innerHTML = '';
    BUTTONS.forEach(function (b) {
      var el = document.createElement('button');
      el.type = 'button';
      el.className = 'btn';
      el.innerHTML = '<span class="e">' + b.e + '</span>' + b.l;
      el.addEventListener('click', function () {
        if (!(onTap && onTap(b.k, el, b.l) === true)) toast(b.l + ' (레이아웃 테스트)');
      });
      container.appendChild(el);
      map[b.k] = el;
    });
    return map;
  }

  function remove(el) { if (el && el.parentNode) el.parentNode.removeChild(el); }

  function popEffect(el) {
    el.addEventListener('animationend', function () { remove(el); });
    setTimeout(function () { remove(el); }, 2600);
  }

  // world: 1280x720 기준 좌표계를 가진 요소 (팬/줌과 함께 움직인다)
  function ambient(world) {
    function spawn() {
      if (document.hidden) return;
      if (world.querySelectorAll('.lt-fx').length >= 3) return;
      var sp = SPOTS[Math.floor(Math.random() * SPOTS.length)];
      var el = document.createElement('span');
      el.className = 'lt-fx';
      el.textContent = sp.sleep ? '💤' : '💗';
      el.style.left = ((sp.x + (Math.random() - 0.5) * 0.03) * W) + 'px';
      el.style.top = ((sp.y - 0.05) * H) + 'px';
      world.appendChild(el);
      popEffect(el);
    }
    setTimeout(spawn, 400);
    return setInterval(spawn, 750);
  }

  var bumpTimer = 0;
  function addCoins(n) {
    HUD.coins += n;
    var p = document.querySelector('.pill[data-cur="coins"]');
    if (!p) return;
    p.querySelector('.v').textContent = fmt(HUD.coins);
    p.classList.remove('bump');
    void p.offsetWidth;
    p.classList.add('bump');
    clearTimeout(bumpTimer);
    bumpTimer = setTimeout(function () { p.classList.remove('bump'); }, 400);
  }

  // 씬을 탭했을 때: 코인 팝 + 코인 증가
  function tap(clientX, clientY) {
    if (document.querySelectorAll('.lt-coin').length < 6) {
      var el = document.createElement('span');
      el.className = 'lt-coin';
      el.textContent = '🪙 +' + COIN_GAIN;
      el.style.left = clientX + 'px';
      el.style.top = clientY + 'px';
      document.body.appendChild(el);
      popEffect(el);
    }
    addCoins(COIN_GAIN);
  }

  // 탭 판정 (이동 8px 미만, 멀티터치 아님) - 랜드스케이프용
  function bindTap(el, cb) {
    var down = null, multi = false, count = 0;
    el.addEventListener('pointerdown', function (e) {
      count++;
      if (count > 1) multi = true;
      down = { x: e.clientX, y: e.clientY };
    });
    function up(e, cancelled) {
      count = Math.max(0, count - 1);
      if (!cancelled && down && !multi && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 8) cb(e);
      if (count === 0) { down = null; multi = false; }
    }
    el.addEventListener('pointerup', function (e) { up(e, false); });
    el.addEventListener('pointercancel', function (e) { up(e, true); });
  }

  window.LT = {
    W: W, H: H, HUD: HUD, SPOTS: SPOTS, fmt: fmt,
    mountHud: mountHud, toast: toast, renderButtons: renderButtons,
    ambient: ambient, addCoins: addCoins, tap: tap, bindTap: bindTap
  };
})();
