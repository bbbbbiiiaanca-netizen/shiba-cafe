// Steps driven by smoke-browser.mjs for the spec-v3 build. Each check is a JS expression evaluated in the page.
export default async function({ev,check,sleep,reload}){
 // 1.8 first run: language list, nothing pre-selected, OK disabled until a pick
 await check('language screen on first run, OK disabled','!document.getElementById("modal").hidden&&document.querySelectorAll("[data-act=langPick]").length===2&&document.querySelector("[data-act=langOk]").disabled');
 await ev('document.querySelector("[data-lang=en]").click();document.querySelector("[data-act=langOk]").click();true');
 // 갱신 109 start choice
 await check('start screen: 4 breeds, English text','document.querySelectorAll("[data-act=startPick]").length===4&&/Pick your first/.test(document.getElementById("mbox").textContent)');
 await check('start requires both breed and bandana','document.querySelector("[data-act=startGo]").disabled');
 await ev('document.querySelector("[data-act=startPick][data-breed=kuro]").click();true');
 await check('breed alone does not enable start','document.querySelector("[data-act=startGo]").disabled');
 await ev('document.getElementById("startName").value="Smoke";document.querySelector("[data-act=startBandana][data-item=bandana-triangle-cell1]").click();true');
 await check('bandana selection rerenders and enables start, preserving the name','!document.querySelector("[data-act=startGo]").disabled&&document.querySelector("[data-item=bandana-triangle-cell1]").getAttribute("aria-pressed")==="true"&&document.getElementById("startName").value==="Smoke"');
 await ev('document.querySelector("[data-act=startGo]").click();true');
 await check('start modal closes','__game.state.started&&document.getElementById("modal").hidden');
 await check('start shiba is Lv21 kuro with Sit/Wait 3','(s=>s.shibas.length===1&&s.shibas[0].breed==="kuro"&&s.shibas[0].level===21&&s.shibas[0].tricks.sit===3&&s.shibas[0].tricks.wait===3)(__game.state)');
 await check('starter chosen approved bandana equipped','__game.state.shibas[0].accUnlocked&&__game.state.shibas[0].acc==="bandana-triangle-cell1"&&Object.keys(__game.state.accInv).length===0');
 // café loop runs in the page
 await ev('for(let i=0;i<900;i++)__game.step(.1);true');
 await check('answered entrance enables guests; coins start at 30,000 (밸런스_2년.md §5) and only grow from payments; gauges remain null','__game.state.stats.served>0&&__game.state.coins>=__game.CFG.start.coins&&Object.values(__game.state.shibas[0].g).every(v=>v===null)&&document.getElementById("isomap").width===390');
 await check('no 도감 / dex button anywhere','!/도감|Collection|dex/i.test(document.querySelector(".main-tabs").textContent)');
 // screens
 for(const n of ['shibas','walk','shop','settings']){await ev(n==='shibas'?'document.querySelector("[data-main-tab=shiba]").click();true':n==='shop'?'document.querySelector("[data-main-tab=shop]").click();true':n==='walk'?'document.querySelector("[data-main-tab=shiba]").click();document.querySelector("[data-open=walk]").click();true':`document.querySelector("[data-nav=${n}]").click();true`);await check(`${n} screen opens`,'document.getElementById("panel").hidden?document.getElementById("menuList").children.length>0:document.getElementById("pbody").children.length>0');}
 // §16-1: every bottom tab fills the list panel above the single tab row
 for(const tab of ['manage','shiba','alba','furniture','shop']){await ev(`document.querySelector("[data-main-tab=${tab}]").click();true`);await check(`§16 tab ${tab} opens content above the tab row`,`document.querySelector("[data-main-tab=${tab}]").classList.contains("active")&&document.querySelectorAll(".main-tabs .active").length===1&&document.getElementById("menuList").children.length>0&&document.getElementById("menuList").getBoundingClientRect().bottom<=document.querySelector(".main-tabs").getBoundingClientRect().top+1`);}
 await ev('document.querySelector("[data-main-tab=shiba]").click();document.querySelector("[data-act=care]").click();true');
 await check('care: feed/snack/bath/sleep disabled (UNSET), play enabled','[...document.querySelectorAll("#pbody button[disabled]")].filter(b=>/Feed|Snack|Bath|Put to bed/.test(b.textContent)).length===4&&!document.querySelector("[data-act=play]").disabled');
 await ev('document.querySelector("[data-act=play]").click();true');await check('play costs 1 heart','__game.state.hearts===9');
 await ev('document.querySelector("[data-main-tab=shiba]").click();document.querySelector("[data-open=walk]").click();true');
 await check('walk buttons ♥1/♥2/♥3, stop disabled','document.querySelectorAll("[data-act=walk]").length===3');
 await ev('document.querySelector("[data-act=walk][data-sec=\'600\']").click();true');
 await check('walk started, shiba left the café','!!__game.state.walk&&!__game.world.sh[__game.state.walk.shibaId]&&[...document.querySelectorAll("#pbody button")].some(b=>/Stop/.test(b.textContent)&&b.disabled)');
 await ev('document.querySelector("[data-main-tab=shop]").click();true');
 await ev('document.querySelector("[data-act=gachaOdds]").click();true');
 await check('141: odds popup reads JSON',`(async()=>{const t=await import('./gacha-table.json',{with:{type:'json'}});return t.default.pool.every(x=>document.querySelector('[data-gacha-odds]').textContent.includes(x.w/t.default.pool.reduce((n,y)=>n+y.w,0)*100+'%'));})()`);
 await ev('document.querySelector("[data-act=modalOk]").click();true');
 // TEMP fixture supplies an explicit test-only level; restore state/config afterwards.
 await ev('window.u141Before=JSON.stringify(__game.state);window.u141Start=__game.CFG.gacha.startLevel;__game.CFG.gacha.startLevel=1;__game.state.dia=__game.CFG.gacha.priceDia;__game.refresh();true');
 await ev('window.u141Level=__game.state.shibas[0].level;window.u141Paws=__game.state.shibas[0].paws;__game.state.gachaStamps=50;__game.refresh();document.querySelector("[data-act=pityPick][data-breed="+__game.state.shibas[0].breed+"]").click();true');
 await check('141: choosing owned shiba gives personal paws, keeps level and spends stamps','__game.state.gachaStamps===0&&__game.state.shibas[0].paws===window.u141Paws+__game.CFG.gacha.dupPaws&&__game.state.shibas[0].level===window.u141Level&&!!document.querySelector("[data-act=modalOk]")');
 await ev('document.querySelector("[data-act=modalOk]").click();const old=JSON.parse(window.u141Before);Object.assign(__game.state,old);__game.CFG.gacha.startLevel=window.u141Start;__game.refresh();true');
 await check('shop inventory and disabled gacha','!!document.querySelector("[data-inventory]")&&[...document.querySelectorAll("[data-act=gacha]")].every(b=>b.disabled)');
 await ev('__game.state.dia=1000;__game.state.items.capsule=1;__game.refresh();document.querySelector("[data-act=gacha][data-n=\'1\']:not([data-ticket])").click();true');
 await check('red-team #1: gacha start level UNSET → all 3 pull buttons disabled for unknown start level even with diamonds and a ticket, nothing spent','[...document.querySelectorAll("[data-act=gacha]")].every(b=>b.disabled)&&__game.state.dia===1000&&__game.state.items.capsule===1&&__game.state.shibas.length===1');
 await ev('__game.state.dia=0;__game.state.items.capsule=0;__game.open("care",__game.state.shibas[0].id);true');
 await check('red-team #1: personality shown as "Odds TBD" (not drawn)','__game.state.shibas[0].personality===null&&/Personality: Odds TBD/.test(document.getElementById("pbody").textContent)');
 await ev('document.querySelector("[data-main-tab=shop]").click();true');
 await check('accessory shop: 4 bandana types, 9 colour cells from the sheet (CSS area), special = UNSET slot (140)','document.querySelectorAll("[data-act=accType]").length===4&&document.querySelectorAll("[data-accitem] .band").length===9&&getComputedStyle(document.querySelector("[data-accitem] .band")).backgroundImage.includes("bandana-triangle-sheet.webp")&&[...document.querySelectorAll("[data-accshop] button")].some(b=>/^300 · /.test(b.textContent)&&b.querySelector("img.res-ico[src$=\'res-diamond.png\']"))');
 await ev('__game.state.coins=5000;__game.refresh();document.querySelector("[data-act=accType][data-type=loop]").click();document.querySelector("[data-act=buyAcc][data-item=bandana-loop-cell9]").click();true');
 await check('buy a loop bandana for 5,000 멍코인 → bag 1','__game.state.accInv["bandana-loop-cell9"]===1&&__game.state.coins===0&&/1/.test(document.querySelector("[data-accitem=bandana-loop-cell9]").textContent)');
 await ev('__game.open("care",__game.state.shibas[0].id);document.querySelector("[data-act=equip][data-item=bandana-loop-cell9]").click();true');
 await check('starter wears purchased bandana; chosen starter accessory returns to bag (139-6·140-1)','__game.state.shibas[0].acc==="bandana-loop-cell9"&&__game.state.accInv["bandana-loop-cell9"]===0&&Object.keys(__game.state.accInv).length===2&&__game.S.accOwned(__game.state,"bandana-triangle-cell1")===1&&!!document.querySelector("[data-acc] [data-band=bandana-loop-cell9]")');
 await ev('document.querySelector("[data-main-tab=shop]").click();true');
 await ev('document.querySelector("[data-main-tab=manage]").click();__game.state.cafe.level=2;__game.state.coins=15000;__game.refresh();document.querySelector("[data-act=listOpen][data-list=menu]").click();document.querySelector("[data-lp-row=M-02] .lp-price").click();true');
 await check('developing M-02 at Lv2 costs 15,000 멍코인 and shows 30 min in progress (136)','__game.state.menuDev?.id==="M-02"&&!__game.state.menus.includes("M-02")&&__game.state.coins===0&&/즉시 완료 30/.test(document.querySelector("[data-lp-row=M-02] .lp-price").textContent)&&!document.querySelector("[data-lp-row=M-05] .lp-price")&&/Lv3/.test(document.querySelector("[data-lp-row=M-05] .lp-effect").textContent)&&!!document.querySelector("#menuList [data-manage-dev] [data-dev=M-02]")');
 await ev('__game.state.dia=30;__game.refresh();document.querySelector("[data-lp-row=M-02] .lp-price").click();document.querySelector("#mbox .lp-close").click();true');
 await check('finish now: 30 diamonds, M-02 developed (135-2)','__game.state.menus.includes("M-02")&&__game.state.dia===0&&!__game.state.menuDev');
 // language switch in settings applies at once
 await ev('document.querySelector("[data-nav=settings]").click();document.querySelector("[data-lang=ko]").click();true');
 await check('settings → 한국어 switches nav text','document.querySelector(".gear").getAttribute("aria-label")==="설정"&&document.getElementById("ptitle").textContent==="설정"');
 await ev('__game.close();document.querySelector("[data-main-tab=manage]").click();true');
 await check('§17: 가게 관리 has no menu card grid, only café status + 메뉴 개발 / 업그레이드 / 손익계산서 buttons','!document.querySelector("[data-main-menu],.menu-card")&&!!document.querySelector("#menuList [data-cafe-level]")&&["menu","upgrade"].every(k=>document.querySelector(`#menuList [data-act=listOpen][data-list=${k}]`))&&!!document.querySelector("#menuList [data-act=ledger]")');
 await ev('__game.state.cafe.level=5;__game.state.coins=180000;__game.refresh();document.querySelector("#menuList [data-act=listOpen][data-list=menu]").click();document.querySelector("[data-lp-row=M-03] .lp-price").click();true');
 await check('menu popup development charges configured cost and offers the diamond skip','__game.state.coins===0&&__game.state.menuDev.id==="M-03"&&/즉시 완료 120/.test(document.querySelector("[data-lp-row=M-03] .lp-price").textContent)');
 await ev('__game.state.dia=120;__game.refresh();document.querySelector("[data-lp-row=M-03] .lp-price").click();document.querySelector("#mbox .lp-close").click();true');
 await check('main menu instant finish hooks simulation','__game.state.dia===0&&__game.state.menus.includes("M-03")&&!__game.state.menuDev');
 await ev('document.querySelector("[data-main-tab=furniture]").click();true');
 await check('furniture tab shows four approved icons','document.querySelectorAll(".furniture-icon").length===4');
 await check('furniture grid has four equal square columns and contained icons',`(()=>{const grid=document.querySelector('.furniture-grid'),cards=[...grid.querySelectorAll('.furniture-card')].filter(e=>e.dataset.furnitureCard!=='wall'),rects=cards.map(e=>e.getBoundingClientRect()),style=getComputedStyle(grid);return style.display==='grid'&&style.gridTemplateColumns.split(' ').length===4&&cards.length===4&&rects.every(r=>Math.abs(r.width-r.height)<1&&Math.abs(r.width-rects[0].width)<1&&Math.abs(r.top-rects[0].top)<1)&&rects[3].right<=grid.getBoundingClientRect().right+1&&cards.every(e=>getComputedStyle(e.querySelector('img')).objectFit==='contain'&&e.querySelector('strong').textContent&&!e.querySelector('span'))&&document.getElementById('furniture-heading').textContent==='가구 · 좌석 '+__game.S.seatCount(__game.state)&&document.querySelectorAll('[data-space-card]').length===0;})()`);
 await check('edit starts disabled','document.querySelector("[data-edit-toggle]").getAttribute("aria-pressed")==="false"&&document.querySelector("[data-edit-toggle]").textContent==="배치 편집"');
 await ev('document.querySelector("[data-edit-toggle]").click();true');
 await check('edit bar is in furniture panel','document.getElementById("menuList").contains(document.querySelector(".furniture-actions"))&&!document.getElementById("scene").contains(document.querySelector(".furniture-actions"))');
 await check('edit toggle enables outlines','document.querySelector("[data-edit-toggle]").getAttribute("aria-pressed")==="true"&&document.querySelector("[data-edit-toggle]").textContent==="편집 끝"');
 await ev('document.querySelector("[data-edit-toggle]").click();true');
 await check('edit toggle returns to normal and keeps furniture tab','document.querySelector("[data-edit-toggle]").getAttribute("aria-pressed")==="false"&&document.querySelector("[data-main-tab=furniture]").classList.contains("active")');

 await ev('document.querySelector("[data-main-tab=manage]").click();true');
 await check('v3: no bottom nav; gear and 미션 buttons are present','!document.getElementById("nav")&&!!document.querySelector(".gear[data-nav=settings]")&&!!document.querySelector("#hud [data-act=mission]")');
 await ev('__game.state.cafe.level=9;__game.state.coins=224999;__game.refresh();document.querySelector("#menuList [data-act=listOpen][data-list=menu]").click();true');
 await check('v3: configured cost and disabled insufficient-coins button (popup)','document.querySelector("[data-lp-row=M-04] .lp-price").disabled&&/225,000/.test(document.querySelector("[data-lp-row=M-04] .lp-price").textContent)');
 await ev('const list=document.querySelector("#mbox .lp-list");list.scrollTop=list.scrollHeight;true');
 await check('v3: last menu row fully visible after scrolling the popup','(()=>{const list=document.querySelector("#mbox .lp-list").getBoundingClientRect(),last=document.querySelector("[data-lp-row=P-06]").getBoundingClientRect();return last.top>=list.top-1&&last.bottom<=list.bottom+1&&list.bottom<=innerHeight;})()');
 await ev('document.querySelector("#mbox .lp-close").click();true');
 // §17-7/8: real edit actions and rejected placement, then manager hire using configured values.
 await ev('__game.close();__game.iso.setEdit(true);document.querySelector("[data-wall-add]").click();true');
 await check('wall placed with grid footprint and no sprite art','__game.state.placement.slots.some(s=>s.type==="wall")&&__game.iso.gridCells>0');
 await ev('window.wallBefore=JSON.stringify(__game.state.placement);__game.iso.placeWall([0,5]);true');
 await check('entrance blocked toast and rollback','document.getElementById("toast").textContent==="입구가 막혔어요!"&&JSON.stringify(__game.state.placement)===window.wallBefore');
 await ev('document.querySelector("[data-wall-remove]").click();__game.iso.setEdit(false);__game.state.cafe.level=__game.CFG.alba.manager.unlock;__game.state.coins=__game.CFG.alba.manager.cost;__game.S.hireAlba(__game.state,"manager",[],__game.clock.now());__game.step(__game.CFG.navigation.cellStepSec);true');
 await check('only manager has staff navigation presence','__game.world.manager?.role==="manager"&&!__game.world.daycare&&!__game.world.trainer&&!__game.world.walk');
 // §17-9: real HUD → reusable popup → portrait picker → same popup, plus ad countdown.
 await ev('__game.ui.modals=[];__game.state.cafe.level=1;__game.S.heartState(__game.state).seenLevel=1;__game.state.shibas[0].affinity=0;__game.state.hearts=__game.CFG.hearts.regenCap;__game.refresh();document.querySelector("#hud [data-act=hearts]").click();true');
 await check('§17-9 empty art, locked levels, order and live balance','document.querySelectorAll("[data-list-popup=hearts] .lp-card").length===__game.CFG.heartUse.items.length&&!document.querySelector("[data-lp-row=call] .lp-face img")&&document.querySelector("[data-lp-row=praise] .lp-effect").textContent==="Lv5 해금"&&document.querySelector("[data-lp-row=wish] .lp-effect").textContent==="Lv40 해금"');
 await ev('document.querySelector("[data-lp-row=call] .lp-price").click();true');
 await check('§17-9 use stays open and shows active mm:ss','__game.ui.modals[0].list==="hearts"&&__game.state.hearts===__game.CFG.hearts.regenCap-__game.CFG.heartUse.items[0].cost&&/\\d+:\\d+/.test(document.querySelector("[data-heart-active]").textContent)');
 await ev('document.querySelector("[data-lp-row=pet] .lp-price").click();true');
 await check('§17-9 daycare portrait picker reused','__game.ui.modals[0].list==="heartShiba"&&!!document.querySelector(".lp-face.portrait img")');
 await ev('document.querySelector("[data-list-popup=heartShiba] .lp-price").click();true');
 await check('§17-9 selected shiba affinity updates','__game.state.shibas[0].affinity===__game.CFG.heartUse.items.find(x=>x.id==="pet").affinity&&__game.ui.modals[0].list==="hearts"');
 await ev('for(let i=0;i<__game.CFG.heartUse.ads.burst;i++)__game.S.claimHeartAd(__game.state,__game.clock.now());__game.state.hearts=0;__game.state.heartRegenAt=__game.clock.now();__game.refresh();true');
 await check('§17-9 insufficient heart dim and ad cooldown','document.querySelector("[data-lp-row=call] .lp-price").disabled&&document.querySelector("[data-act=heartAd]").disabled&&document.querySelector("[data-act=heartAd]").textContent.includes(":")');
 await ev('__game.state.cafe.level=5;__game.refresh();true');
 await check('§17-9 level unlock toast','document.getElementById("toast").textContent.includes("칭찬해 주기 해금")');
 await ev('__game.ui.modals=[];__game.refresh();true');
 // persisted across reload, offline report path
 await reload();await ev('__game.step(.2);true');
 await check('save kept after reload (language, shiba)','__game.state.settings.language==="ko"&&__game.state.shibas.length>=1&&__game.state.shibas[0].breed==="kuro"&&__game.state.started');

 await ev('__game.ui.modals=[];__game.refresh();document.querySelector("[data-act=mailbox]").click();true');
 await check('final mailbox reachable with unclaimed mail','document.getElementById("mbox").textContent.includes("우편함")&&!!document.querySelector("[data-act=claimMail]:not(:disabled)")');
 await ev('document.querySelector("[data-act=claimMail]:not(:disabled)").click();true');
 await check('final mail claim saved once','__game.state.mailClaimed.length===1&&!!document.querySelector("[data-act=claimMail]:disabled")');
 await ev('document.querySelector("[data-act=modalOk]").click();document.querySelector("[data-main-tab=shop]").click();true');
 await check('final unknown boost multiplier disables use without consumption', 'document.querySelector("[data-item=expBoost4h][data-act=useItem]").disabled&&document.querySelector("[data-item=expBoost4h][data-act=useItem]").textContent.includes("미정")&&__game.state.items.expBoost4h>0');
 // Test-only legacy multiplier; production remains null.
 await ev('__game.CFG.stub.expBoost.mul=1.2;__game.refresh();true');
 await check('final configured boost enables use immediately', '!document.querySelector("[data-item=expBoost4h][data-act=useItem]").disabled');
 await ev('document.querySelector("[data-item=expBoost4h][data-act=useItem]").click();true');
 await check('final boost use shows remaining time', '__game.state.items.expBoost4h===0&&document.getElementById("boostChip").textContent.includes("경험치")');
 await check('final 2F diamond price stays disabled', 'document.querySelector("[data-kind=floor2][data-via=dia]").disabled&&document.querySelector("[data-kind=floor2][data-via=dia]").textContent.includes("미정")');
 await ev('document.querySelector("[data-main-tab=furniture]").click();true');
 await check('final furniture inventory preserves wall controls', '!!document.querySelector("[data-wall-inventory-place]")&&!!document.querySelector("[data-act=placeFurniture]")');

 await ev(`(()=>{const g=__game;g.ui.modals=[];const before=g.state.items.expBoost4h;Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));g.clock.offset+=60000;Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));delete document.hidden;return true;})()`);
 await check('final background return catches up once and uses offline accounting', '__game.ui.modals.some(m=>m.kind==="offline"&&m.o.sec===60&&m.o.simSec<=__game.CFG.offline.capHours*3600)');

}
