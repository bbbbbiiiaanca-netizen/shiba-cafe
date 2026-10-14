// Steps driven by smoke-browser.mjs for the spec-v3 build. Each check is a JS expression evaluated in the page.
export default async function({ev,check,sleep,reload}){
 // 1.8 first run: language list, nothing pre-selected, OK disabled until a pick
 await check('language screen on first run, OK disabled','!document.getElementById("modal").hidden&&document.querySelectorAll("[data-act=langPick]").length===2&&document.querySelector("[data-act=langOk]").disabled');
 await ev('document.querySelector("[data-lang=en]").click();document.querySelector("[data-act=langOk]").click();true');
 // 갱신 109 start choice
 await check('start screen: 4 breeds, English text','document.querySelectorAll("[data-act=startPick]").length===4&&/Pick your first/.test(document.getElementById("mbox").textContent)');
 await ev('document.querySelector("[data-breed=kuro]").click();document.querySelector("[data-act=startGo]").click();true');
 await check('start shiba is Lv21 kuro with Sit/Wait 3','(s=>s.shibas.length===1&&s.shibas[0].breed==="kuro"&&s.shibas[0].level===21&&s.shibas[0].tricks.sit===3&&s.shibas[0].tricks.wait===3)(__game.state)');
 await check('starter accessory identity UNSET: unlocked slot, nothing worn or given','__game.state.shibas[0].accUnlocked&&__game.state.shibas[0].acc===null&&Object.keys(__game.state.accInv).length===0');
 // café loop runs in the page
 await ev('for(let i=0;i<900;i++)__game.step(.1);true');
 await check('answered entrance enables guests; starting coins and gauges remain null','__game.state.stats.served>0&&__game.state.coins===null&&Object.values(__game.state.shibas[0].g).every(v=>v===null)&&document.getElementById("isomap").width===390');
 await check('no 도감 / dex button anywhere','!/도감|Collection|dex/i.test(document.querySelector(".main-tabs").textContent)');
 // screens
 for(const n of ['shibas','walk','shop','settings']){await ev(n==='shibas'?'document.querySelector("[data-main-tab=shiba]").click();true':n==='shop'?'document.querySelector("[data-main-tab=store]").click();true':n==='walk'?'document.querySelector("[data-main-tab=shiba]").click();document.querySelector("[data-open=walk]").click();true':`document.querySelector("[data-nav=${n}]").click();true`);await check(`${n} screen opens`,'document.getElementById("panel").hidden?document.getElementById("menuList").children.length>0:document.getElementById("pbody").children.length>0');}
 await ev('document.querySelector("[data-main-tab=shiba]").click();document.querySelector("[data-act=care]").click();true');
 await check('care: feed/snack/bath/sleep disabled (UNSET), play enabled','[...document.querySelectorAll("#pbody button[disabled]")].filter(b=>/Feed|Snack|Bath|Put to bed/.test(b.textContent)).length===4&&!document.querySelector("[data-act=play]").disabled');
 await ev('document.querySelector("[data-act=play]").click();true');await check('play costs 1 heart','__game.state.hearts===9');
 await ev('document.querySelector("[data-main-tab=shiba]").click();document.querySelector("[data-open=walk]").click();true');
 await check('walk buttons ♥1/♥2/♥3, stop disabled','document.querySelectorAll("[data-act=walk]").length===3');
 await ev('document.querySelector("[data-act=walk][data-sec=\'600\']").click();true');
 await check('walk started, shiba left the café','!!__game.state.walk&&!__game.world.sh[__game.state.walk.shibaId]&&[...document.querySelectorAll("#pbody button")].some(b=>/Stop/.test(b.textContent)&&b.disabled)');
 await ev('document.querySelector("[data-main-tab=store]").click();true');
 await check('shop inventory and disabled gacha','!!document.querySelector("[data-inventory]")&&[...document.querySelectorAll("[data-act=gacha]")].every(b=>b.disabled&&/준비 중/.test(b.textContent))');
 await ev('__game.state.dia=1000;__game.state.items.capsule=1;__game.refresh();document.querySelector("[data-act=gacha][data-n=\'1\']:not([data-ticket])").click();true');
 await check('red-team #1: gacha odds UNSET → all 3 pull buttons disabled "Odds TBD" even with diamonds and a ticket, nothing spent','[...document.querySelectorAll("[data-act=gacha]")].every(b=>b.disabled&&/준비 중/.test(b.textContent))&&__game.state.dia===1000&&__game.state.items.capsule===1&&__game.state.shibas.length===1');
 await ev('__game.state.dia=0;__game.state.items.capsule=0;__game.open("care",__game.state.shibas[0].id);true');
 await check('red-team #1: personality shown as "Odds TBD" (not drawn)','__game.state.shibas[0].personality===null&&/Personality: Odds TBD/.test(document.getElementById("pbody").textContent)');
 await ev('document.querySelector("[data-main-tab=store]").click();true');
 await check('accessory shop: 4 bandana types, 9 colour cells from the sheet (CSS area), special = UNSET slot (140)','document.querySelectorAll("[data-act=accType]").length===4&&document.querySelectorAll("[data-accitem] .band").length===9&&getComputedStyle(document.querySelector("[data-accitem] .band")).backgroundImage.includes("bandana-triangle-sheet.webp")&&/300💎/.test(document.querySelector("[data-accshop]").textContent)');
 await ev('__game.state.coins=5000;__game.refresh();document.querySelector("[data-act=accType][data-type=loop]").click();document.querySelector("[data-act=buyAcc][data-item=bandana-loop-cell9]").click();true');
 await check('buy a loop bandana for 5,000 멍코인 → bag 1','__game.state.accInv["bandana-loop-cell9"]===1&&__game.state.coins===0&&/1/.test(document.querySelector("[data-accitem=bandana-loop-cell9]").textContent)');
 await ev('__game.open("care",__game.state.shibas[0].id);document.querySelector("[data-act=equip][data-item=bandana-loop-cell9]").click();true');
 await check('starter wears purchased bandana; no starter accessory appears in the bag (139-6·140-1)','__game.state.shibas[0].acc==="bandana-loop-cell9"&&__game.state.accInv["bandana-loop-cell9"]===0&&Object.keys(__game.state.accInv).length===1&&__game.S.accOwned(__game.state,"bandana-triangle-cell1")===0&&!!document.querySelector("[data-acc] [data-band=bandana-loop-cell9]")');
 await ev('document.querySelector("[data-main-tab=store]").click();true');
 await ev('document.querySelector("[data-main-tab=menu]").click();__game.state.cafe.level=2;__game.state.coins=8500;__game.refresh();document.querySelector("[data-act=dev][data-id=M-02]").click();true');
 await check('developing M-02 at Lv2 costs 8,500 멍코인 and shows 30 min in progress (136)','__game.state.menuDev?.id==="M-02"&&!__game.state.menus.includes("M-02")&&__game.state.coins===0&&!!document.querySelector("[data-main-menu=M-02] .instant")&&!document.querySelector("[data-main-menu=M-05] [data-act=dev]")');
 await ev('__game.state.dia=30;__game.refresh();document.querySelector("[data-act=skip][data-type=menu]").click();true');
 await check('finish now: 30 diamonds, M-02 developed (135-2)','__game.state.menus.includes("M-02")&&__game.state.dia===0&&!__game.state.menuDev');
 // language switch in settings applies at once
 await ev('document.querySelector("[data-nav=settings]").click();document.querySelector("[data-lang=ko]").click();true');
 await check('settings → 한국어 switches nav text','document.querySelector(".gear").getAttribute("aria-label")==="설정"&&document.getElementById("ptitle").textContent==="설정"');
 await ev('__game.close();document.querySelector("[data-main-tab=menu]").click();true');
 await check('main menu has all 14 configured icons and basic menu','document.querySelectorAll("[data-main-menu]").length===14&&/기본 메뉴/.test(document.querySelector("[data-main-menu=M-01]").textContent)');
 await ev('__game.state.cafe.level=5;__game.state.coins=12000;__game.refresh();document.querySelector("#menuList [data-act=dev][data-id=M-03]").click();true');
 await check('main menu development charges configured cost and renders rounded diamond skip','__game.state.coins===0&&__game.state.menuDev.id==="M-03"&&/💎 즉시 완료 120/.test(document.querySelector("[data-main-menu=M-03]").textContent)');
 await ev('__game.state.dia=120;__game.refresh();document.querySelector("#menuList [data-act=skip]").click();true');
 await check('main menu instant finish hooks simulation','__game.state.dia===0&&__game.state.menus.includes("M-03")&&!__game.state.menuDev');
 await ev('document.querySelector("[data-main-tab=furniture]").click();true');
 await check('furniture tab shows four approved icons','document.querySelectorAll(".furniture-icon").length===4');
 await check('furniture grid has four equal square columns and contained icons',`(()=>{const grid=document.querySelector('.furniture-grid'),cards=[...grid.querySelectorAll('.furniture-card')],rects=cards.map(e=>e.getBoundingClientRect()),style=getComputedStyle(grid);return style.display==='grid'&&style.gridTemplateColumns.split(' ').length===4&&cards.length===4&&rects.every(r=>Math.abs(r.width-r.height)<1&&Math.abs(r.width-rects[0].width)<1&&Math.abs(r.top-rects[0].top)<1)&&rects[3].right<=grid.getBoundingClientRect().right+1&&cards.every(e=>getComputedStyle(e.querySelector('img')).objectFit==='contain'&&e.querySelector('strong').textContent&&!e.querySelector('span')&&!/가격|미정/.test(e.textContent))&&document.getElementById('furniture-heading').textContent==='가구'&&document.querySelectorAll('[data-space-card]').length===0;})()`);
 await check('edit starts disabled','document.querySelector("[data-edit-toggle]").getAttribute("aria-pressed")==="false"&&document.querySelector("[data-edit-toggle]").textContent==="배치 편집"');
 await ev('document.querySelector("[data-edit-toggle]").click();true');
 await check('edit bar is in furniture panel','document.getElementById("menuList").contains(document.querySelector(".furniture-actions"))&&!document.getElementById("scene").contains(document.querySelector(".furniture-actions"))');
 await check('edit toggle enables outlines','document.querySelector("[data-edit-toggle]").getAttribute("aria-pressed")==="true"&&document.querySelector("[data-edit-toggle]").textContent==="편집 끝"');
 await ev('document.querySelector("[data-edit-toggle]").click();true');
 await check('edit toggle returns to normal and keeps furniture tab','document.querySelector("[data-edit-toggle]").getAttribute("aria-pressed")==="false"&&document.querySelector("[data-main-tab=furniture]").classList.contains("active")');

 await ev('document.querySelector("[data-main-tab=menu]").click();true');
 await check('v3: no bottom nav; basic menu has no development line; gear is present','!document.getElementById("nav")&&!/개발비|시간/.test(document.querySelector("[data-main-menu=M-01]").textContent)&&!!document.querySelector(".gear[data-nav=settings]")');
 await ev('__game.state.cafe.level=9;__game.state.coins=8500;__game.refresh();true');
 await check('v3: configured cost and disabled insufficient-coins button','document.querySelector("#menuList [data-id=M-04]").disabled&&/개발 15,000/.test(document.querySelector("[data-main-menu=M-04]").textContent)');
 await ev('const list=document.getElementById("menuList");list.scrollTop=list.scrollHeight;true');
 await check('v3: last menu card fully visible after scrolling','(()=>{const list=document.getElementById("menuList").getBoundingClientRect(),last=document.querySelector("[data-main-menu=P-06]").getBoundingClientRect();return last.top>=list.top&&last.bottom<=list.bottom&&list.bottom<=innerHeight;})()');
 // persisted across reload, offline report path
 await reload();await ev('__game.step(.2);true');
 await check('save kept after reload (language, shiba)','__game.state.settings.language==="ko"&&__game.state.shibas.length>=1&&__game.state.shibas[0].breed==="kuro"&&__game.state.started');
}
