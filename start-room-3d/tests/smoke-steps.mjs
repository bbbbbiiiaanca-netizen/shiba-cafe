// Steps driven by smoke-browser.mjs. Each check is a JS expression evaluated in the page.
export default async function({ev,check,sleep,temp}){
 await ev('__game.step(.5);true');
 await check('HUD renders hearts','document.getElementById("hearts").textContent==="0"');
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
 await ev('__game.open("shiba");true');await check('shiba panel renders','document.querySelectorAll("#pbody .card").length>0');await ev('__game.close();true');
}
