// Steps driven by smoke-browser.mjs for the spec-v3 build. Each check is a JS expression evaluated in the page.
export default async function({ev,check,sleep,reload}){
 // 1.8 first run: language list, nothing pre-selected, OK disabled until a pick
 await check('language screen on first run, OK disabled','!document.getElementById("modal").hidden&&document.querySelectorAll("[data-act=langPick]").length===2&&document.querySelector("[data-act=langOk]").disabled');
 await ev('document.querySelector("[data-lang=en]").click();document.querySelector("[data-act=langOk]").click();true');
 // 갱신 109 start choice
 await check('start screen: 4 breeds, English text','document.querySelectorAll("[data-act=startPick]").length===4&&/Pick your first/.test(document.getElementById("mbox").textContent)');
 await ev('document.querySelector("[data-breed=kuro]").click();document.querySelector("[data-act=startGo]").click();true');
 await check('start shiba is Lv21 kuro with Sit/Wait 3','(s=>s.shibas.length===1&&s.shibas[0].breed==="kuro"&&s.shibas[0].level===21&&s.shibas[0].tricks.sit===3&&s.shibas[0].tricks.wait===3)(__game.state)');
 // café loop runs in the page
 await ev('for(let i=0;i<900;i++)__game.step(.1);true');
 await check('guests served and paid in the page','__game.state.stats.served>0&&__game.state.coins>0&&document.querySelectorAll(".seat").length===5');
 await check('no 도감 / dex button anywhere','!/도감|Collection|dex/i.test(document.getElementById("nav").textContent)');
 // screens
 for(const n of ['shibas','walk','shop','settings']){await ev(`document.querySelector("[data-nav=${n}]").click();true`);await check(`${n} screen opens`,'!document.getElementById("panel").hidden&&document.getElementById("pbody").children.length>0');}
 await ev('document.querySelector("[data-nav=shibas]").click();document.querySelector("[data-act=care]").click();true');
 await check('care: feed/snack/bath/sleep disabled (UNSET), play enabled','[...document.querySelectorAll("#pbody button[disabled]")].filter(b=>/Feed|Snack|Bath|Put to bed/.test(b.textContent)).length===4&&!document.querySelector("[data-act=play]").disabled');
 await ev('document.querySelector("[data-act=play]").click();true');await check('play costs 1 heart','__game.state.hearts===9');
 await ev('document.querySelector("[data-nav=walk]").click();true');
 await check('walk buttons ♥1/♥2/♥3, stop disabled','document.querySelectorAll("[data-act=walk]").length===3');
 await ev('document.querySelector("[data-act=walk][data-sec=\'600\']").click();true');
 await check('walk started, shiba left the café','!!__game.state.walk&&!__game.world.sh[__game.state.walk.shibaId]&&[...document.querySelectorAll("#pbody button")].some(b=>/Stop/.test(b.textContent)&&b.disabled)');
 await ev('document.querySelector("[data-nav=shop]").click();true');
 await check('shop: 14 menus with images (M-01 default), 13 dev buttons locked/unaffordable at start; diamond items payment stub; gacha 100/900 disabled with 0 diamonds (137)','document.querySelectorAll("[data-menu]").length===14&&document.querySelectorAll("[data-menu] img").length===14&&document.querySelectorAll("[data-act=dev][disabled]").length===13&&[...document.querySelectorAll("#pbody button")].some(b=>b.disabled&&/TBD/.test(b.textContent))&&[...document.querySelectorAll("[data-act=gacha]")].every(b=>b.disabled)&&/100💎/.test(document.querySelector("[data-gacha]").textContent)&&/900💎/.test(document.querySelector("[data-gacha]").textContent)');
 await ev('__game.state.dia=1000;__game.state.items.capsule=1;__game.refresh();document.querySelector("[data-act=gacha][data-n=\'1\']:not([data-ticket])").click();true');
 await check('red-team #1: gacha odds UNSET → all 3 pull buttons disabled "Odds TBD" even with diamonds and a ticket, nothing spent','[...document.querySelectorAll("[data-act=gacha]")].every(b=>b.disabled&&/Odds TBD/.test(b.textContent))&&__game.state.dia===1000&&__game.state.items.capsule===1&&__game.state.shibas.length===1');
 await ev('__game.state.dia=0;__game.state.items.capsule=0;__game.open("care",__game.state.shibas[0].id);true');
 await check('red-team #1: personality shown as "Odds TBD" (not drawn)','__game.state.shibas[0].personality===null&&/Personality: Odds TBD/.test(document.getElementById("pbody").textContent)');
 await ev('document.querySelector("[data-nav=shop]").click();true');
 await check('accessory shop: 4 bandana types, 9 colour cells from the sheet (CSS area), special = UNSET slot (140)','document.querySelectorAll("[data-act=accType]").length===4&&document.querySelectorAll("[data-accitem] .band").length===9&&getComputedStyle(document.querySelector("[data-accitem] .band")).backgroundImage.includes("bandana-triangle-sheet.webp")&&/300💎/.test(document.querySelector("[data-accshop]").textContent)');
 await ev('__game.state.coins=5000;__game.refresh();document.querySelector("[data-act=accType][data-type=loop]").click();document.querySelector("[data-act=buyAcc][data-item=bandana-loop-cell9]").click();true');
 await check('buy a loop bandana for 5,000 멍코인 → bag 1','__game.state.accInv["bandana-loop-cell9"]===1&&__game.state.coins===0&&/1/.test(document.querySelector("[data-accitem=bandana-loop-cell9]").textContent)');
 await ev('__game.open("care",__game.state.shibas[0].id);document.querySelector("[data-act=equip][data-item=bandana-loop-cell9]").click();true');
 await check('starter wears it; the starter bandana goes back to the bag (139-6·140-1)','__game.state.shibas[0].acc==="bandana-loop-cell9"&&__game.state.accInv["bandana-triangle-cell1"]===1&&!!document.querySelector("[data-acc] [data-band=bandana-loop-cell9]")');
 await ev('document.querySelector("[data-nav=shop]").click();true');
 await ev('__game.state.cafe.level=2;__game.state.coins=8500;__game.refresh();document.querySelector("[data-act=dev][data-id=M-02]").click();true');
 await check('developing M-02 at Lv2 costs 8,500 멍코인 and shows 30 min in progress (136)','__game.state.menuDev?.id==="M-02"&&!__game.state.menus.includes("M-02")&&__game.state.coins===0&&!!document.querySelector("[data-dev=M-02]")&&document.querySelector("[data-act=dev][data-id=M-05]")?.disabled');
 await ev('__game.state.dia=30;__game.refresh();document.querySelector("[data-act=skip][data-type=menu]").click();true');
 await check('finish now: 30 diamonds, M-02 developed (135-2)','__game.state.menus.includes("M-02")&&__game.state.dia===0&&!__game.state.menuDev');
 // language switch in settings applies at once
 await ev('document.querySelector("[data-nav=settings]").click();document.querySelector("[data-lang=ko]").click();true');
 await check('settings → 한국어 switches nav text','document.querySelector("[data-nav=walk]").textContent==="산책"&&document.getElementById("ptitle").textContent==="설정"');
 await ev('__game.close();true');
 // persisted across reload, offline report path
 await reload();await ev('__game.step(.2);true');
 await check('save kept after reload (language, shiba)','__game.state.settings.language==="ko"&&__game.state.shibas.length>=1&&__game.state.shibas[0].breed==="kuro"&&__game.state.started');
}
