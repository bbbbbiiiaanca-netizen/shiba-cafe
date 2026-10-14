// Drive the real onboarding UI. TEMP may add companions; the chosen starter is first.
export async function startFlow(ev,{language='ko',breed='red',bandana='bandana-triangle-cell1',beforeGo}={}){
 const click=selector=>ev(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled)throw Error('Onboarding control unavailable: '+${JSON.stringify(selector)});e.click();return true;})()`);
 await click(`[data-act=langPick][data-lang=${language}]`);
 await click('[data-act=langOk]');
 await click(`[data-act=startPick][data-breed=${breed}]`);
 await click(`[data-act=startBandana][data-item=${bandana}]`);
 if(beforeGo)await beforeGo();
 await click('[data-act=startGo]');
 if(!await ev(`(()=>{const g=__game,sh=g.state.shibas[0];return g.state.started&&sh?.breed===${JSON.stringify(breed)}&&sh.level===g.CFG.startShiba.level&&sh.acc===${JSON.stringify(bandana)}&&sh.accUnlocked&&document.getElementById('modal').hidden;})()`))throw Error('Onboarding did not finish with the chosen starter and bandana');
}
