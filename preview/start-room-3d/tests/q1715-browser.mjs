// Same assertions drive smoke and DPR2 captures. No normal-save fixture data.
export async function q1715Browser({ev,check,shot=async()=>{},mode='all'}){
 const click=sel=>ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)throw Error('Missing '+${JSON.stringify(sel)});e.click();return true;})()`);
 const snap=(mode,name)=>shot(`main-screen-${mode}-${name}.png`);
 await ev('__game.ui.modals=[];__game.close();__game.refresh();true');
 if(mode!=='q1717'){
 await check('q1715 compact HUD and approved scene entry icons',`document.getElementById('hud').getBoundingClientRect().height<=72&&document.querySelectorAll('.scene-entries img').length===2&&document.getElementById('questGuide').hidden`);
 await snap('q1715','main');
 await ev(`(()=>{const g=__game;window.q1715Guests=g.world.custs;g.world.custs=[{id:'test-guest',kind:'girl',rude:false,request:{type:'meetShiba',shibaId:g.state.shibas[0].id}}];document.querySelector('[data-main-tab=manage]').click();document.querySelector('[data-act=guestRequest]').click();return true;})()`);
 await check('q1715 normal guest request uses approved guest art',`document.querySelector('[data-dialogue=normal] img').getAttribute('src')==='assets/cust_girl.png'`);await click('[data-act=modalOk]');
 await ev(`__game.world.custs[0].rude=true;__game.refresh();document.querySelector('[data-act=guestRequest]').click();true`);
 await check('q1715 rude request shares the same dialogue component',`!!document.querySelector('[data-dialogue=rude] .dialogue-box')`);await click('[data-act=confirmYes]');
 await ev(`__game.world.custs=window.q1715Guests;__game.refresh();true`);

 await ev(`__game.ui.modals=[{kind:'dialogue',variant:'warning',actor:'dongu',text:'확인해 주세요'}];__game.refresh();true`);
 await check('q1715 shared warning displays exact approved full-body sprite',`document.querySelector('[data-dialogue=warning] img').getAttribute('src')==='assets/drive/chars/dongu/dongu-front.png'&&document.querySelector('[data-act=confirmYes]').textContent==='확인'`);await snap('q1715','dialogue-warning');
 await click('[data-act=modalOk]');await click('#hud [data-act=mission]');
 await check('q1715 production quests remain empty and progress unset',`!!document.querySelector('[data-quests-empty]')&&document.querySelector('[data-quests]').textContent.includes('보상 미정')&&!document.querySelector('[data-quests]').textContent.includes('TEST FIXTURE')`);await snap('q1715','quests-empty');
 await ev(`__game.debugQuestFixture(true);__game.refresh();true`);
 await check('q1715 TEMP fixture has real navigation and disabled instant completion',`document.querySelectorAll('.quest-row').length===3&&document.querySelector('[data-quests]').textContent.includes('TEST FIXTURE')&&document.querySelector('[data-act=questInstant]').disabled`);await snap('q1715','quests-fixture');
 await click('[data-act=donguOffer]');await check('q1715 quest offer uses shared dialogue and three task slots',`document.querySelector('[data-dialogue=quest] .offer-tasks').children.length===3&&document.querySelector('[data-dialogue=quest]').textContent.includes('TEST FIXTURE')`);await snap('q1715','dialogue-quest');await click('[data-act=confirmYes]');
 await click('[data-act=questGo]');await check('q1715 shortcut opens furniture bag',`document.querySelector('[data-main-tab=bag]').classList.contains('active')&&document.getElementById('panel').hidden`);
 await ev('__game.debugQuestFixture(false);__game.close();__game.refresh();true');
 }
 if(mode!=='q1715'){
 await click('[data-main-tab=shop]');await check('q1717 portrait shop categories and existing interior cards',`document.querySelectorAll('.shop-tabs button').length===5&&document.querySelectorAll('[data-shop-v1717] .q17-product').length===3&&document.querySelector('[data-shop-v1717]').textContent.includes('장식 점수 미정')`);await snap('q1717','shop-tabs');
 await check('q1717 missing logos stay empty',`document.querySelectorAll('[data-theme-logos] .art-slot').length===__game.CFG.themes.length&&!document.querySelector('[data-theme-logos] img')`);await snap('q1717','theme-logos');
 await click('[data-act=shopTab][data-item=kitchen]');await check('q1717 counter is kitchen',`document.querySelectorAll('[data-shop-v1717] .q17-product').length===1&&document.querySelector('[data-shop-v1717] .furn-buy').dataset.item==='counter'`);
 await click('[data-act=shopTab][data-item=cash]');await snap('q1717','cash-coupon');await ev(`window.q1717Before=JSON.stringify(__game.state);document.getElementById('couponCode').value='TEST';true`);await click('[data-act=coupon]');await check('q1717 coupon never grants anything',`document.getElementById('toast').textContent==='쿠폰을 확인할 수 없어요'&&JSON.stringify(__game.state)===window.q1717Before`);
 await click('[data-act=shopSpecial]');await check('q1717 lucky boxes unset and disabled',`document.querySelectorAll('[data-shop-v1717] .q17-product button:disabled').length===3&&[...document.querySelectorAll('[data-shop-v1717] .q17-product button')].every(b=>b.textContent.includes('미정'))`);await snap('q1717','special');
 await click('[data-act=furnitureStorage]');await check('q1717 storage opens existing inventory',`document.querySelector('[data-main-tab=bag]').classList.contains('active')&&!!document.querySelector('.furniture-section')`);
 }
}
