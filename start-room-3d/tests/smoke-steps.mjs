// Steps driven by smoke-browser.mjs. Each check is a JS expression evaluated in the page.
export default async function({ev,check,sleep,temp,reload}){
 // D-11 first run: vertical list, nothing pre-selected, OK disabled until a pick
 await ev('__game.step(.2);true');
 await check('language screen on first run, no default, OK disabled','!document.getElementById("lang").hidden&&document.querySelectorAll("#langList button").length===2&&!document.querySelector("#langList button.on")&&document.getElementById("langOk").disabled');
 await ev('document.querySelector("[data-lang=en]").click();document.getElementById("langOk").click();true');await sleep(50);
 await check('English applied to the main screen','document.getElementById("lang").hidden&&document.querySelector("[data-i18n=\'ui.nav.build.quest\']").textContent==="Quests"&&/Donggu|café/i.test(document.getElementById("qpill").textContent)');
 await reload();await ev('__game.step(.2);true');
 await check('language kept after restart','document.getElementById("lang").hidden&&document.querySelector("[data-i18n=\'ui.nav.build.shop\']").textContent==="Shop"');
 await ev('__game.open("settings");document.querySelector("[data-setlang=ko]").click();window.__t0=performance.now();true');
 await ev('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
 await check('settings → 한국어 switches the main screen within 1 s','document.querySelector("[data-i18n=\'ui.nav.build.quest\']").textContent==="퀘스트"&&document.getElementById("ptitle").textContent==="설정"&&performance.now()-window.__t0<1000');
 await ev('__game.close();true');
 // D-12
 await ev('__game.open("shop");true');
 await check('3 themes; Fuji/bamboo show 가격 미정 and are disabled','document.querySelectorAll("[data-th]").length===3&&document.querySelector("[data-th=fuji]").disabled&&/가격 미정/.test(document.querySelector("[data-th=bamboo]").textContent)');
 await ev('__game.close();true');
 // the cafe floor must keep running (customers served, idle income accrues)
 await ev('window.__c0=__game.state.coins;window.__s0=__game.state.served;__game.step(90);true');
 await check('cafe loop runs: guests served and coins grow','__game.state.served>window.__s0&&__game.state.coins>window.__c0');
 await ev('__game.step(.5);true');
 await check('HUD renders hearts','document.getElementById("hearts").textContent===String(__game.state.hearts)');
 // D-01/D-02
 await ev('__game.open("gacha");true');await sleep(100);
 await check(temp?'gacha enabled with TEMP':'gacha blocked while N/R undecided',temp?'!document.getElementById("pull1").disabled':'document.getElementById("pull1").disabled&&!document.getElementById("gpNote").hidden');
 await ev('document.getElementById("gpull").classList.remove("on");true');
 await ev('__game.gachaShow("kuro","kuro_calm",6.95,"S")');await sleep(300);
 await check('S result card is gold class and shows S only','document.querySelector("#gcard .rc.S")!==null&&/^S · Lv\\.21/.test(document.querySelector("#gcard .rc i").textContent)');
 await ev('document.getElementById("gok").click();true');
 // D-05/D-06
 await ev('__game.state.hearts=3;__game.state.items.heartReset=1;__game.open("bag");true');await sleep(50);
 await check('reset button enabled at 3 hearts','!document.getElementById("useReset").disabled');
 await ev('document.getElementById("useReset").click();true');
 await check('reset → 10 hearts, ticket consumed','__game.state.hearts===10&&__game.state.items.heartReset===0');
 await ev('__game.state.items.heartReset=1;__game.ui.tick();true');await sleep(50);
 await check('reset button disabled at ≥10','document.getElementById("useReset").disabled');
 await ev('__game.close();true');
 await ev('__game.open("shiba");true');await check('shiba panel renders','document.querySelectorAll("#pbody .card").length>0');
 // D-03: two N red_smile Lv10 + Lv5
 await ev('__game.close();const st=__game.state;st.owned.push({id:501,coat:"red",expr:"red_smile",lv:10},{id:502,coat:"red",expr:"red_smile",lv:5},{id:503,coat:"red",expr:"red_smile",lv:3});__game.open("shiba");true');
 await ev('document.querySelector("[data-sel=\'501\']").click();document.querySelector("[data-sel=\'502\']").click();true');
 await check(temp?'merge button enabled (TEMP rule)':'merge disabled: rule undecided',temp?'!document.getElementById("mergeBtn").disabled':'document.getElementById("mergeBtn").disabled&&/준비 중/.test(document.getElementById("mergeWhy").textContent)');
 if(temp){await ev('document.getElementById("mergeBtn").click();true');
  await check('merged → R Lv15, material gone','__game.state.owned.find(o=>o.id===501).lv===15&&!__game.state.owned.some(o=>o.id===502)&&!__game.world.shibas.some(o=>o.id===502)');
  await ev('document.querySelector("[data-sel=\'501\']").click();document.querySelector("[data-sel=\'503\']").click();true');
  await check('then N duplicate → merge blocked','document.getElementById("mergeBtn").disabled');}
 await ev('__game.close();true');
 // D-08
 await ev('__game.open("shiba");document.querySelector("[data-walk=\'1\']").click();true');
 await check(temp?'walk buttons enabled (TEMP free)':'walk buttons show 미정 and are disabled',temp?'!document.querySelector("[data-walkgo=\'1:600\']").disabled':'document.querySelector("[data-walkgo=\'1:600\']").disabled&&/미정/.test(document.querySelector("[data-walkgo=\'1:600\']").textContent)');
 if(temp){await ev('document.querySelector("[data-walkgo=\'1:600\']").click();true');await check('walker leaves the cafe floor','!!__game.state.walk&&!__game.world.shibas.some(x=>x.id===1)');
  await ev('__game.state.walk.walkStartAt-=601e3;__game.step(.1);true');await check('walk over → back on the floor, settled','__game.state.walk===null&&__game.world.shibas.some(x=>x.id===1)');}
 await ev('__game.close();true');
 // D-04: card plays once and tap skips (feature switched on only inside this check)
 await ev('__game.CFG.FEATURES.promotionCard=true;const o=__game.state.owned[0];o.lv=10;__game.S.setLevel(__game.state,o,11,"levelup");true');
 await ev('__game.ui.frame();true');await check('promotion card shown','!document.getElementById("promo").hidden&&__game.state.promoQueue.length===0');
 await ev('document.getElementById("promo").click();__game.ui.frame();true');await check('tap skips immediately','document.getElementById("promo").hidden');
 await ev('__game.CFG.FEATURES.promotionCard=false;true');
 // D-07
 await ev('__game.open("event");true');await sleep(50);
 await check('28 day cells, null days say 준비 중','document.querySelectorAll(".obd").length===28&&/준비 중/.test(document.querySelector("[data-ob=\'17\']").textContent)');
 await check(temp?'day 1 claimable (TEMP)':'nothing claimable (dayMode 미정)',temp?'document.querySelector("[data-ob=\'1\']").classList.contains("claimable")':'document.querySelectorAll(".obd.claimable").length===0');
 if(temp){await ev('window.__r0=__game.state.items.heartReset;document.querySelector("[data-ob=\'1\']").click();true');await check('day 1 → +1 ticket, claimed once','__game.state.items.heartReset===window.__r0+1&&document.querySelector("[data-ob=\'1\']").classList.contains("claimed")');}
 await ev('__game.close();true');
}
