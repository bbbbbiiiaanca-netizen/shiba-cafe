// Steps driven by smoke-browser.mjs for the spec-v3 build. Each check is a JS expression evaluated in the page.
export default async function({ev,check,sleep,reload}){
 // 1.8 first run: language list, nothing pre-selected, OK disabled until a pick
 await check('language screen on first run, OK disabled','!document.getElementById("modal").hidden&&document.querySelectorAll("[data-act=langPick]").length===2&&document.querySelector("[data-act=langOk]").disabled');
 await ev('document.querySelector("[data-lang=en]").click();document.querySelector("[data-act=langOk]").click();true');
 // 갱신 109 start choice
 await check('start screen: 4 breeds; English chosen → English text (똑또기 초안), breed names in English','__game.state.settings.language==="en"&&document.documentElement.lang==="en"&&document.querySelectorAll("[data-act=startPick]").length===4&&/Pick your first shiba/.test(document.getElementById("mbox").textContent)&&/Shiru/.test(document.getElementById("mbox").textContent)');
 await ev('__game.state.settings.language="ko";__game.applyLang();true'); // rest of the smoke run checks the Korean screens
 await check('switch to Korean on start screen: Korean title, Korean breed names, no reload','document.documentElement.lang==="ko"&&/첫 시바를 골라 주세요/.test(document.getElementById("mbox").textContent)&&!/Shiru/.test(document.getElementById("mbox").textContent)');
 await check('start requires both breed and bandana','document.querySelector("[data-act=startGo]").disabled');
 await ev('document.querySelector("[data-act=startPick][data-breed=kuro]").click();true');
 await check('breed alone does not enable start','document.querySelector("[data-act=startGo]").disabled');
 await ev('document.getElementById("startName").value="Smoke";document.querySelector("[data-act=startBandana][data-item=bandana-triangle-cell1]").click();true');
 await check('starter: 9 bandanas (one type per colour), Korean colour name only, guide text one line',`(()=>{const B=__game.CFG.accessory.bandana,bs=[...document.querySelectorAll("[data-act=startBandana]")];return bs.length===B.colors.length&&bs.every(b=>b.dataset.item.startsWith("bandana-"+B.types[0]+"-")&&b.textContent.trim()===B.colorNames[B.colors.indexOf(b.dataset.item.split("-").at(-1))])&&!/Lv21/.test(document.getElementById("mbox").textContent)&&/고르지 않은 시바도 나중에 만날 수 있어요|You can meet the others later/.test(document.getElementById("mbox").textContent);})()`);
 await check('bandana selection rerenders and enables start, preserving the name','!document.querySelector("[data-act=startGo]").disabled&&document.querySelector("[data-item=bandana-triangle-cell1]").getAttribute("aria-pressed")==="true"&&document.getElementById("startName").value==="Smoke"');
 await ev('document.querySelector("[data-act=startGo]").click();true');
 await check('first-run 동구 tutorial: dongu dialogue 1/N with 다음 and 건너뛰기','(i=>!!i&&/dongu-front\\.png$/.test(i.dataset.src||i.getAttribute("src")))(document.querySelector("[data-dialogue=tutorial] .dialogue-character img"))&&document.querySelector("[data-act=confirmYes]").textContent==="다음"&&!!document.querySelector("[data-act=tutorialSkip]")');
 await ev('document.querySelector("[data-act=confirmYes]").click();true');await check('tutorial 다음 advances to step 2','/^2\\//.test(document.querySelector("[data-dialogue=tutorial] .tut-step").textContent)');
 await ev('document.querySelector("[data-act=tutorialSkip]").click();true');
 await check('village 병원 opens the clinic panel with interior background','(()=>{__game.open("hospital");const h=document.querySelector("[data-hospital]");const ok=!!h&&h.style.backgroundImage.includes("bg-hospital-clinic.png")&&!/debug|undefined|NaN/.test(h.textContent);__game.close();return ok})()');
 await check('start modal closes','__game.state.started&&document.getElementById("modal").hidden');
 await check('start shiba is Lv21 kuro with Sit/Wait 3','(s=>s.shibas.length===1&&s.shibas[0].breed==="kuro"&&s.shibas[0].level===21&&s.shibas[0].tricks.sit===3&&s.shibas[0].tricks.wait===3)(__game.state)');
 await check('starter chosen approved bandana equipped','__game.state.shibas[0].accUnlocked&&__game.state.shibas[0].acc==="bandana-triangle-cell1"&&Object.keys(__game.state.accInv).length===0');
 // café loop runs in the page
 await ev('for(let i=0;i<900;i++)__game.step(.1);true');
 await check('answered entrance enables guests; coins start at 30,000 (밸런스_2년.md §5) and only grow from payments; gauges remain null','__game.state.stats.served>0&&__game.state.coins>=__game.CFG.start.coins&&Object.values(__game.state.shibas[0].g).every(v=>v===null)&&document.getElementById("isomap").width===390');
 await check('no 도감 / dex button anywhere','!/도감|Collection|dex/i.test(document.querySelector(".main-tabs").textContent)');
 // screens
 for(const n of ['shibas','walk','shop','settings']){await ev(n==='shibas'?'document.querySelector("[data-main-tab=shiba]").click();true':n==='shop'?'document.querySelector("[data-main-tab=shop]").click();document.querySelector("[data-act=shopTab][data-item=cash]").click();true':n==='walk'?'document.querySelector("[data-main-tab=shiba]").click();document.querySelector("[data-open=walk]").click();true':`document.querySelector("[data-nav=${n}]").click();true`);await check(`${n} screen opens`,'document.getElementById("panel").hidden?document.getElementById("menuList").children.length>0:document.getElementById("pbody").children.length>0');}
 // §16-1: every bottom tab fills the list panel above the single tab row
 for(const tab of ['manage','shiba','village','bag','shop']){await ev(`document.querySelector("[data-main-tab=${tab}]").click();true`);await check(`§16 tab ${tab} opens content above the tab row (마을 = 꽉 찬 팝업)`,`document.querySelector("[data-main-tab=${tab}]").classList.contains("active")&&document.querySelectorAll(".main-tabs .active").length===1&&document.getElementById("menuList").children.length>0&&(${tab==="village"}?!!document.querySelector("[data-act=villageClose]"):document.getElementById("menuList").getBoundingClientRect().bottom<=document.querySelector(".main-tabs").getBoundingClientRect().top+1)`);}
 await ev('document.querySelector("[data-main-tab=shiba]").click();document.querySelector("[data-act=care]").click();document.querySelector("[data-act=careOpen]").click();true');
 await check('care: feed/snack/bath/sleep disabled (UNSET), play enabled','[...document.querySelectorAll("#pbody button[disabled]")].filter(b=>/밥 주기|간식|목욕|재우기/.test(b.textContent)).length===4&&!document.querySelector("[data-act=play]").disabled');
 await ev('document.querySelector("[data-act=play]").click();true');await check('play costs 1 heart','__game.state.hearts===9');
 await ev('document.querySelector("[data-main-tab=shiba]").click();document.querySelector("[data-open=walk]").click();true');
 await check('walk buttons ♥1/♥2/♥3, stop disabled','document.querySelectorAll("[data-act=walk]").length===3');
 await ev('document.querySelector("[data-act=walk][data-sec=\'600\']").click();true');
 await check('walk started, shiba left the café','!!__game.state.walk&&!__game.world.sh[__game.state.walk.shibaId]&&[...document.querySelectorAll("#pbody button")].some(b=>/멈추기/.test(b.textContent)&&b.disabled)');
 await ev('document.querySelector("[data-main-tab=shop]").click();document.querySelector("[data-act=shopTab][data-item=cash]").click();true');
 await ev('document.querySelector("[data-act=gachaOdds]").click();true');
 await check('141: odds popup reads JSON',`(async()=>{const t=await import('./gacha-table.json',{with:{type:'json'}});return t.default.pool.every(x=>document.querySelector('[data-gacha-odds]').textContent.includes(x.w/t.default.pool.reduce((n,y)=>n+y.w,0)*100+'%'));})()`);
 await ev('document.querySelector("[data-act=modalOk]").click();true');
 // TEMP fixture supplies an explicit test-only level; restore state/config afterwards.
 await ev('window.u141Before=JSON.stringify(__game.state);window.u141Start=__game.CFG.gacha.startLevel;__game.CFG.gacha.startLevel=1;__game.state.dia=__game.CFG.gacha.priceDia;__game.refresh();true');
 await ev('window.u141Level=__game.state.shibas[0].level;window.u141Paws=__game.state.shibas[0].paws;__game.state.gachaStamps=50;__game.refresh();document.querySelector("[data-act=pityPick][data-breed="+__game.state.shibas[0].breed+"]").click();true');
 await check('141: choosing owned shiba gives personal paws, keeps level and spends stamps','__game.state.gachaStamps===0&&__game.state.shibas[0].paws===window.u141Paws+__game.CFG.gacha.dupPaws&&__game.state.shibas[0].level===window.u141Level&&!!document.querySelector("[data-act=modalOk]")');
 await ev('document.querySelector("[data-act=modalOk]").click();const old=JSON.parse(window.u141Before);Object.assign(__game.state,old);__game.CFG.gacha.startLevel=window.u141Start;__game.refresh();true');
 await ev('__game.state.dia=0;__game.state.items.capsule=0;__game.refresh();true');
 await check('shop inventory; gacha (unlocked Lv1) disabled only when unaffordable','__game.CFG.gacha.startLevel===1&&[...document.querySelectorAll("[data-act=gacha]")].every(b=>b.disabled)');
 await ev('document.querySelector("[data-main-tab=bag]").click();true');await check('가방 holds inventory + consumables','!!document.querySelector(".bag-tabs")&&document.querySelectorAll(".bag-tabs [data-act=bagTab]").length===3&&document.querySelectorAll(".bag-grid .bag-cell").length>0');await ev('document.querySelector("[data-main-tab=shop]").click();document.querySelector("[data-act=shopTab][data-item=cash]").click();true');
 await ev('__game.state.dia=1000;__game.state.items.capsule=1;__game.refresh();document.querySelector("[data-act=gacha][data-n=\'1\']:not([data-ticket])").click();true');
 await check('gacha unlocked from Lv1: an affordable single pull spends diamonds and adds a Lv1 shiba or paws','__game.state.dia<1000&&__game.state.items.capsule===1&&(__game.state.shibas.length===2?__game.state.shibas[1].level===1:true)');
 await ev('__game.state.shibas.length=1;__game.ui.modals=[];__game.refresh();true');
 await ev('__game.state.dia=0;__game.state.items.capsule=0;__game.open("care",__game.state.shibas[0].id);true');
 await check('red-team #1: personality shown as "확률 미정" (not drawn; English falls back to Korean)','__game.state.shibas[0].personality===null&&/성격: 확률 미정/.test(document.getElementById("pbody").textContent)');
 await ev('document.querySelector("[data-main-tab=shop]").click();document.querySelector("[data-act=shopTab][data-item=cash]").click();true');
 await check('accessory shop: 4 bandana types, 9 colour cells from the sheet (CSS area), special = UNSET slot (140)','document.querySelectorAll("[data-act=accType]").length===4&&document.querySelectorAll("[data-accitem] .band").length===9&&getComputedStyle(document.querySelector("[data-accitem] .band")).backgroundImage.includes("bandana-triangle-sheet.webp")&&[...document.querySelectorAll("[data-accshop] button")].some(b=>/^300 · /.test(b.textContent)&&b.querySelector("img.res-ico[src$=\'res-diamond.png\']"))');
 await ev('__game.state.coins=5000;__game.refresh();document.querySelector("[data-act=accType][data-type=loop]").click();document.querySelector("[data-act=buyAcc][data-item=bandana-loop-cell9]").click();true');
 await check('buy a loop bandana for 5,000 멍코인 → bag 1','__game.state.accInv["bandana-loop-cell9"]===1&&__game.state.coins===0&&/1/.test(document.querySelector("[data-accitem=bandana-loop-cell9]").textContent)');
 await ev('__game.open("care",__game.state.shibas[0].id);document.querySelector("[data-act=equip][data-item=bandana-loop-cell9]").click();true');
 await check('starter wears purchased bandana; chosen starter accessory returns to bag (139-6·140-1)','__game.state.shibas[0].acc==="bandana-loop-cell9"&&__game.state.accInv["bandana-loop-cell9"]===0&&Object.keys(__game.state.accInv).length===2&&__game.S.accOwned(__game.state,"bandana-triangle-cell1")===1&&!!document.querySelector("[data-acc] [data-band=bandana-loop-cell9]")');
 await ev('document.querySelector("[data-main-tab=shop]").click();document.querySelector("[data-act=shopTab][data-item=cash]").click();true');
 await ev('document.querySelector("[data-main-tab=manage]").click();__game.state.cafe.level=2;__game.state.coins=15000;__game.refresh();document.querySelector("[data-act=listOpen][data-list=menu]").click();document.querySelector("[data-lp-row=M-02] .lp-price").click();true');
 await check('developing M-02 at Lv2 costs 15,000 멍코인 and shows 30 min in progress (136)','__game.state.menuDev?.id==="M-02"&&!__game.state.menus.includes("M-02")&&__game.state.coins===0&&/즉시 완료 30/.test(document.querySelector("[data-lp-row=M-02] .lp-price").textContent)&&!document.querySelector("[data-lp-row=M-05] .lp-price")&&/Lv3/.test(document.querySelector("[data-lp-row=M-05] .lp-effect").textContent)&&!!document.querySelector("#menuList [data-manage-dev][data-dev=M-02]")');
 await ev('__game.state.dia=30;__game.refresh();document.querySelector("[data-lp-row=M-02] .lp-price").click();document.querySelector("#mbox .lp-close").click();true');
 await check('finish now: 30 diamonds, M-02 developed (135-2)','__game.state.menus.includes("M-02")&&__game.state.dia===0&&!__game.state.menuDev');
 // language switch in settings applies at once
 await ev('document.querySelector("[data-nav=settings]").click();document.querySelector("[data-lang=ko]").click();true');
 await check('settings → 한국어 switches nav text','document.querySelector(".gear").getAttribute("aria-label")==="설정"&&document.getElementById("ptitle").textContent==="설정"');
 await ev('__game.close();document.querySelector("[data-main-tab=manage]").click();true');
 await check('§17: 가게 관리 has no menu card grid, only café status + 메뉴 개발 / 업그레이드 / 손익계산서 buttons','!document.querySelector("[data-main-menu],#menuList .menu-card")&&!!document.querySelector("#menuList [data-cafe-level]")&&["menu","upgrade"].every(k=>document.querySelector(`#menuList [data-act=listOpen][data-list=${k}]`))&&!!document.querySelector("#menuList [data-act=listOpen][data-list=alba]")&&!document.querySelector("#menuList [data-act=ledger]")');
 await ev('__game.state.cafe.level=5;__game.state.coins=180000;__game.refresh();document.querySelector("#menuList [data-act=listOpen][data-list=menu]").click();document.querySelector("[data-lp-row=M-03] .lp-price").click();true');
 await check('menu popup development charges configured cost and offers the diamond skip','__game.state.coins===0&&__game.state.menuDev.id==="M-03"&&/즉시 완료 120/.test(document.querySelector("[data-lp-row=M-03] .lp-price").textContent)');
 await ev('__game.state.dia=120;__game.refresh();document.querySelector("[data-lp-row=M-03] .lp-price").click();document.querySelector("#mbox .lp-close").click();true');
 await check('main menu instant finish hooks simulation','__game.state.dia===0&&__game.state.menus.includes("M-03")&&!__game.state.menuDev');
 await ev('document.querySelector("[data-main-tab=bag]").click();true');
 await ev("document.querySelector('[data-act=bagTab][data-item=furniture]').click();true");await check('furniture tab shows four approved icons','[...document.querySelectorAll(".bag-grid[data-bag-grid=furniture] .bag-cell img")].filter(i=>/ui-icon-/.test(i.src)).length===4');
 await ev("document.querySelector('[data-act=bagTab][data-item=furniture]').click();true");await check('furniture grid has four equal square columns and contained icons',`(()=>{const grid=document.querySelector('.bag-grid'),cards=[...grid.querySelectorAll('.bag-cell')].slice(0,4),rects=cards.map(e=>e.getBoundingClientRect()),style=getComputedStyle(grid);return style.display==='grid'&&style.gridTemplateColumns.split(' ').length===4&&cards.length===4&&rects.every(r=>Math.abs(r.width-r.height)<1&&Math.abs(r.width-rects[0].width)<1&&Math.abs(r.top-rects[0].top)<1)&&rects[3].right<=grid.getBoundingClientRect().right+1&&cards.every(e=>getComputedStyle(e.querySelector('img')).objectFit==='contain'&&!e.querySelector('strong'));})()`);
 await check('edit starts disabled','document.querySelector("[data-edit-toggle]").getAttribute("aria-pressed")==="false"&&document.querySelector("[data-edit-toggle]").textContent==="배치 편집"');
 await ev('document.querySelector("[data-edit-toggle]").click();true');
 await check('edit bar is in furniture panel','document.getElementById("scene").contains(document.querySelector(".furniture-actions"))');
 await check('edit mode: panel folds to one storage strip, top shows only 저장하기','__game.iso.edit===true&&document.getElementById("app").classList.contains("editing")&&!!document.querySelector("[data-edit-storage] .edit-strip")&&getComputedStyle(document.getElementById("hud")).display==="none"&&getComputedStyle(document.getElementById("mainTabs")).display==="none"&&getComputedStyle(document.getElementById("questGuide")).display==="none"&&getComputedStyle(document.querySelector("[data-furniture-save]")).display!=="none"&&document.getElementById("scene").getBoundingClientRect().height>innerHeight*0.6');
 await ev('document.querySelector("[data-furniture-save]").click();true');
 await check('edit toggle returns to normal and keeps furniture tab','document.querySelector("[data-edit-toggle]").getAttribute("aria-pressed")==="false"&&document.querySelector("[data-main-tab=bag]").classList.contains("active")');

 await ev('document.querySelector("[data-main-tab=manage]").click();true');
 await check('v3: no bottom nav; gear and 미션 buttons are present','!document.getElementById("nav")&&!!document.querySelector(".gear[data-nav=settings]")&&!!document.querySelector(".scene-entries [data-act=mission]")');
 await ev('__game.state.cafe.level=9;__game.state.coins=224999;__game.refresh();document.querySelector("#menuList [data-act=listOpen][data-list=menu]").click();true');
 await check('v3: configured cost and disabled insufficient-coins button (popup)','document.querySelector("[data-lp-row=M-04] .lp-price").disabled&&/225,000/.test(document.querySelector("[data-lp-row=M-04] .lp-price").textContent)');
 await ev('const list=document.querySelector("#mbox [data-menu-cards]");list.scrollLeft=list.scrollWidth;true');
 await check('v3: last menu row fully visible after scrolling the popup','(()=>{const list=document.querySelector("#mbox [data-menu-cards]").getBoundingClientRect(),last=document.querySelector("[data-lp-row=P-06]").getBoundingClientRect();return last.top>=list.top-1&&last.bottom<=list.bottom+1&&list.bottom<=innerHeight;})()');
 await ev('document.querySelector("#mbox .lp-close").click();true');
 // §17-7/8: real edit actions and rejected placement, then manager hire using configured values.
 await ev('__game.close();__game.iso.setEdit(true);document.querySelector("[data-wall-add]").click();true');
await new Promise(r=>setTimeout(r,500));await ev('__game.refresh&&__game.refresh(),true');
 await check('wall placed with one-cell footprint and approved sprite hit','__game.state.placement.slots.some(s=>s.type==="wall"&&__game.iso.hits.some(h=>h.id===s.id&&!h.footprint))&&__game.iso.gridCells>0');
 // 똑또기 10-16: 벽은 뒷모습 없이 4방향 돌리기 — 방향마다 그림이 그려지고, 2·3은 0·1의 맞은편 모서리에 선다
 await ev('window.wallTurns=[];true');for(let n=0;n<4;n++){await new Promise(r=>setTimeout(r,300));await ev(`(()=>{__game.refresh&&__game.refresh();const w=__game.state.placement.slots.find(s=>s.type==="wall"),h=__game.iso.hits.find(h=>h.id===w.id&&!h.footprint);window.wallTurns.push({dir:w.dir,x:h&&h.x+h.w/2,y:h&&h.y+h.h});document.querySelector("[data-furniture-rotate]").click();window.wallDirAfter=w.dir;return true;})()`);}
 await check('wall rotates through 4 directions with a sprite each','(()=>{const t=window.wallTurns;return t.map(o=>o.dir).join()==="0,1,2,3"&&window.wallDirAfter===0&&t.every(o=>Number.isFinite(o.x))&&t[2].x<t[0].x&&t[2].y>t[0].y&&t[3].x>t[1].x&&t[3].y>t[1].y;})()');
 await ev('window.wallBefore=JSON.stringify(__game.state.placement);__game.iso.placeWall([0,5]);true');
 await check('entrance blocked toast and rollback','document.getElementById("toast").textContent==="입구가 막혔어요!"&&JSON.stringify(__game.state.placement)===window.wallBefore');
 await ev('document.querySelector("[data-furniture-store]").click();window.wallGone=!__game.state.placement.slots.some(s=>s.type==="wall");__game.iso.setEdit(false);__game.state.cafe.level=__game.CFG.alba.manager.unlock;__game.state.coins=__game.CFG.alba.manager.cost;__game.S.hireAlba(__game.state,"manager",[],__game.clock.now());__game.step(__game.CFG.navigation.cellStepSec);true');
 await check('17-12 wall removed through round 보관 button','window.wallGone===true');
 await check('only manager has staff navigation presence','__game.world.manager?.role==="manager"&&!__game.world.daycare&&!__game.world.trainer&&!__game.world.walk');
 // §17-9: real HUD → reusable popup → portrait picker → same popup, plus ad countdown.
 await ev('__game.ui.modals=[];__game.state.cafe.level=1;__game.S.heartState(__game.state).seenLevel=1;__game.state.shibas[0].affinity=0;__game.state.hearts=__game.CFG.hearts.regenCap;__game.refresh();document.querySelector("#hud [data-act=hearts]").click();true');
 await check('§17-9 approved card art, locked levels, order and live balance','document.querySelectorAll("[data-list-popup=hearts] .lp-card").length===__game.CFG.heartUse.items.length&&document.querySelector("[data-lp-row=call] .lp-face img").getAttribute("src")==="assets/drive/ui/card-call.png"&&document.querySelector("[data-lp-row=praise] .lp-effect").textContent==="Lv5 해금"&&document.querySelector("[data-lp-row=wish] .lp-effect").textContent==="Lv40 해금"');
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
 for(let i=0;i<20&&!(await ev('!!document.querySelector("#mbox img[src=\'assets/drive/ui/item-exp-boost.png\']")?.complete'));i++)await new Promise(r=>setTimeout(r,100));
 await check('Task A mailbox boost icon', 'document.querySelector("#mbox img[src=\'assets/drive/ui/item-exp-boost.png\']").complete');
 await check('final mailbox reachable with unclaimed mail','document.getElementById("mbox").textContent.includes("우편함")&&!!document.querySelector("[data-act=claimMail]:not(:disabled)")');
 await ev('document.querySelector("[data-act=claimMail]:not(:disabled)").click();true');
 await check('final mail claim saved once','__game.state.mailClaimed.length===1&&(!!document.querySelector("[data-act=claimMail]:disabled")||!!document.querySelector("#mbox [data-itemget]"))');
 await ev('document.querySelector("[data-act=modalOk]").click();document.querySelector("[data-main-tab=bag]").click();true');
 await ev('__game.CFG.stub.expBoost.mul=null;__game.refresh();document.querySelector("[data-act=bagTab][data-item=items]").click();document.querySelector("[data-act=bagCell][data-item=expBoost4h]").click();true');
 await check('final unknown boost multiplier disables use without consumption', 'document.querySelector("#mbox [data-item=expBoost4h][data-act=bagUse]").disabled&&document.querySelector("#mbox .bag-pop").textContent.includes("미정")&&__game.state.items.expBoost4h>0');
 // Check null gating as an explicit test fixture, then restore the approved starting value.
 await ev('__game.CFG.stub.expBoost.mul=1.5;__game.refresh();true');
 await check('final configured boost enables use immediately', '!document.querySelector("#mbox [data-item=expBoost4h][data-act=bagUse]").disabled');
 await ev('document.querySelector("#mbox [data-item=expBoost4h][data-act=bagUse]").click();true');
 await check('Task A boost chip approved image', 'document.querySelector("#boostChip img").getAttribute("src")=="assets/drive/ui/item-exp-boost.png"');
 await check('final boost use shows remaining time', '__game.state.items.expBoost4h===0&&document.getElementById("boostChip").textContent.includes("경험치")');
await ev('document.querySelector("[data-main-tab=shop]").click();document.querySelector("[data-act=shopTab][data-item=cash]").click();true');
 await check('final 2F diamond price stays disabled', 'document.querySelector("[data-kind=floor2][data-via=dia]").disabled&&document.querySelector("[data-kind=floor2][data-via=dia]").textContent.includes("미정")');
 await ev('document.querySelector("[data-main-tab=bag]").click();true');
 await ev("document.querySelector('[data-act=bagTab][data-item=furniture]').click();true");await check('final furniture inventory preserves wall controls', '!!document.querySelector("[data-act=bagCell][data-item=f-wall]")&&!!document.querySelector("[data-act=bagCell][data-item=f-table]")&&!!document.querySelector("[data-act=wallBuy]")');

 await ev(`(()=>{const g=__game;g.ui.modals=[];const before=g.state.items.expBoost4h;Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));g.clock.offset+=60000;Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));delete document.hidden;return true;})()`);
 await check('final background return catches up once and uses offline accounting', '__game.ui.modals.some(m=>m.kind==="offline"&&m.o.sec===60&&m.o.simSec<=__game.CFG.offline.capHours*3600)');

}
