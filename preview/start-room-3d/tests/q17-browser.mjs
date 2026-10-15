// Shared real-DOM checks/capture sequence. Fixture mutations are TEMP-only.
export async function q17Browser({ev,c,check,shot=async()=>{}}){
 const click=sel=>ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)throw Error('Missing '+${JSON.stringify(sel)});e.click();return true;})()`);
 const snap=name=>shot('main-screen-q17-'+name+'.png');
 await ev(`__game.ui.modals=[];__game.close();__game.refresh();document.querySelector('[data-main-tab=bag]').click();document.querySelector('[data-furniture-shop]').scrollIntoView({block:'start'});true`);
 await check('q17 furniture horizontal cards and config prices',`(()=>{const el=document.querySelector('[data-furniture-shop]');return !!el&&getComputedStyle(el.querySelector('.q17-swipe')).scrollSnapType.includes('x')&&el.querySelectorAll('.q17-product').length===__game.CFG.furniture.items.length&&[...el.querySelectorAll('.furn-buy')].every(b=>b.textContent.replace(/,/g,'').includes(String(__game.S.furniturePrice(__game.state,b.dataset.item))));})()`);
 await snap('shop');await click('[data-act=furnitureCategory]:not([data-item=all])');await check('q17 furniture category filters cards',`document.querySelectorAll('[data-furniture-shop] .q17-product').length===1`);
 await click('[data-main-tab=manage]');await click('[data-list=menu]');
 await check('q17 menu rows use approved menu images',`[...document.querySelectorAll('[data-list-popup=menu] .lp-card')].every(r=>!!r.querySelector('img'))`);await snap('menu');
 await ev(`__game.ui.modals=[];__game.state.mailClaimed=[];__game.refresh();document.querySelector('[data-act=mailbox]').click();document.querySelector('[data-act=claimMail]').click();true`);
 await check('q17 mailbox grant uses common item-get frame',`!!document.querySelector('#mbox.list-popup [data-itemget]')&&document.querySelector('[data-itemget] button').textContent==='받기'`);await snap('itemget');
 // TEMP-only deterministic cookie reward; restore every config field immediately.
 await ev(`(()=>{const g=__game,it=g.CFG.heartUse.items.find(it=>it.id==='cookie');window.q17Cookie={odds:it.odds,rate:g.CFG.heartUse.incomeRatePerSec,level:g.state.cafe.level};it.odds={coins:0,paws:0,item:1};g.CFG.heartUse.incomeRatePerSec=1;g.state.cafe.level=it.level;g.state.hearts=g.CFG.hearts.regenCap;g.ui.modals=[{kind:'list',list:'hearts'}];g.refresh();document.querySelector('[data-act=heartUse][data-item=cookie]').click();return true;})()`);
 await check('q17 cookie item result opens receipt',`!!document.querySelector('[data-itemget]')&&document.querySelector('#mbox h2').textContent==='하트 리셋권'`);
 await ev(`(()=>{const g=__game;g.CFG.heartUse.items.find(it=>it.id==='cookie').odds=window.q17Cookie.odds;g.CFG.heartUse.incomeRatePerSec=window.q17Cookie.rate;g.state.cafe.level=window.q17Cookie.level;return true;})()`);
 await ev(`__game.ui.modals=[];__game.refresh();document.querySelector('[data-main-tab=village]').click();document.querySelector('[data-act=friendsOpen]').click();true`);
 await check('q17 real friends default empty',`__game.state.friends.length===0&&document.querySelector('[data-friends]').textContent.includes('아직 친구가 없어요')`);await snap('friends-empty');
 await ev(`__game.open('cooking');true`);
 await check('q17 three placeholder recipes and disabled craft/purchase',`document.querySelectorAll('[data-act=recipePick]').length===3&&document.querySelector('[data-act=craft]').disabled&&document.querySelector('[data-act=ingredientBuy]').disabled&&document.querySelector('[data-cooking]').textContent.includes('포만 미정')`);await snap('cook');
 await ev(`__game.open('run');window.q17Energy=__game.state.run.energy;true`);await click('[data-act=runPlay]');
 await check('q17 run stub keeps energy; unknown skip disabled',`__game.state.run.energy===window.q17Energy&&document.querySelector('[data-act=runSkip]').disabled&&document.querySelector('#toast').textContent==='준비 중'`);await snap('run');
 await ev(`__game.close();document.querySelector('[data-main-tab=shiba]').click();document.querySelector('#menuList [data-act=care]').click();true`);
 await check('q17 grid opens profile, not care',`!!document.querySelector('[data-profile]')&&!document.querySelector('[data-tama]')`);await snap('profile');await click('[data-act=careOpen]');
 await check('q17 profile care button opens existing gauges',`!!document.querySelector('[data-tama]')&&document.querySelectorAll('#panel .g').length>0`);
 await ev(`__game.close();__game.iso.setEdit(true);__game.iso.actions.querySelector('[data-wall-add]').click();__game.refresh();true`);
 await check('q17 edit round controls and top-right save',`__game.iso.gridCells>0&&getComputedStyle(document.querySelector('[data-furniture-cancel]')).borderRadius==='50%'&&!!document.querySelector('#scene [data-furniture-save]')`);await snap('edit-selected');
 // Move actual pointer from an opaque selected wall pixel to valid/invalid cells.
 const p=await ev(`(()=>{const h=__game.iso.hits.find(h=>h.id===__game.iso.selected),r=document.querySelector('#isomap').getBoundingClientRect();if(!h)throw Error('selected hit missing');return {x:r.left+h.x+h.w/2,y:r.top+h.y+h.h*.7,w:h.w,h:h.h};})()`);
 await c('Input.dispatchMouseEvent',{type:'mousePressed',x:p.x,y:p.y,button:'left',clickCount:1});
 await c('Input.dispatchMouseEvent',{type:'mouseMoved',x:p.x,y:p.y,button:'left'});
 await check('q17 valid target green',`document.querySelector('#isomap').dataset.placementValid==='true'`);await snap('edit-green');
 const d=await ev(`(()=>{const g=__game,a=g.state.placement.slots.find(s=>s.id===g.iso.selected),b=g.state.placement.slots.find(s=>s.id!==a.id),h=g.iso.hits.find(h=>h.id===a.id),di=b.origin[0]-a.origin[0],dj=b.origin[1]-a.origin[1];return {x:(di-dj)*h.zone.cell.w/2*h.view.scale,y:(di+dj)*h.zone.cell.h/2*h.view.scale};})()`);
 await c('Input.dispatchMouseEvent',{type:'mouseMoved',x:p.x+d.x,y:p.y+d.y,button:'left'});
 await check('q17 overlapping target red',`document.querySelector('#isomap').dataset.placementValid==='false'`);await snap('edit-red');
 await c('Input.dispatchMouseEvent',{type:'mouseReleased',x:p.x+d.x,y:p.y+d.y,button:'left',clickCount:1});await click('[data-furniture-save]');
 await check('q17 save hides edit grid',`!__game.iso.edit&&__game.iso.gridCells===0`);
}
