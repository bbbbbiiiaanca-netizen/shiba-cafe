// Shared real-DOM checks/capture sequence. Fixture mutations are TEMP-only.
export async function q17Browser({ev,c,check,shot=async()=>{}}){
 const click=sel=>ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)throw Error('Missing '+${JSON.stringify(sel)});e.click();return true;})()`);
 const snap=name=>shot('main-screen-q17-'+name+'.png');
 await ev(`__game.ui.modals=[];__game.close();__game.refresh();document.querySelector('[data-main-tab=bag]').click();document.querySelector('[data-furniture-shop]').scrollIntoView({block:'start'});true`);
 await check('q17 furniture horizontal cards and config prices',`(()=>{const el=document.querySelector('[data-furniture-shop]');return !!el&&getComputedStyle(el.querySelector('.q17-swipe')).scrollSnapType.includes('x')&&el.querySelectorAll('.q17-product').length===__game.CFG.furniture.items.length&&[...el.querySelectorAll('.furn-buy')].every(b=>b.textContent.replace(/,/g,'').includes(String(__game.S.furniturePrice(__game.state,b.dataset.item))));})()`);
 await snap('shop');await click('[data-act=furnitureCategory]:not([data-item=all])');await check('q17 furniture category filters cards',`document.querySelectorAll('[data-furniture-shop] .q17-product').length===1`);
 await click('[data-main-tab=manage]');await click('[data-list=menu]');
 await check('q17 menu rows use approved menu images',`[...document.querySelectorAll('[data-list-popup=menu] .lp-card:not(.locked)')].every(r=>!!r.querySelector('img'))`);await snap('menu');
 await ev(`__game.ui.modals=[];__game.state.mailClaimed=[];__game.refresh();document.querySelector('[data-act=mailbox]').click();document.querySelector('[data-act=claimMail]').click();true`);
 await check('q17 mailbox grant uses common item-get frame',`!!document.querySelector('#mbox.list-popup [data-itemget]')&&document.querySelector('[data-itemget] button').textContent==='받기'`);await snap('itemget');
 // TEMP-only deterministic cookie reward; restore every config field immediately.
 await ev(`(()=>{const g=__game,it=g.CFG.heartUse.items.find(it=>it.id==='cookie');window.q17Cookie={odds:it.odds,rate:g.CFG.heartUse.incomeRatePerSec,level:g.state.cafe.level};it.odds={coins:0,paws:0,item:1};g.CFG.heartUse.incomeRatePerSec=1;g.state.cafe.level=it.level;g.state.hearts=g.CFG.hearts.regenCap;g.ui.modals=[{kind:'list',list:'hearts'}];g.refresh();document.querySelector('[data-act=heartUse][data-item=cookie]').click();return true;})()`);
 await check('q17 cookie item result opens receipt',`!!document.querySelector('[data-itemget]')&&document.querySelector('#mbox h2').textContent==='하트 리셋권'`);
 await ev(`(()=>{const g=__game;g.CFG.heartUse.items.find(it=>it.id==='cookie').odds=window.q17Cookie.odds;g.CFG.heartUse.incomeRatePerSec=window.q17Cookie.rate;g.state.cafe.level=window.q17Cookie.level;return true;})()`);
 await ev(`__game.ui.modals=[];__game.refresh();document.querySelector('[data-main-tab=village]').click();document.querySelector('[data-act=friendsOpen]').click();true`);
 await check('q17 real friends default empty',`__game.state.friends.length===0&&document.querySelector('[data-friends]').textContent.includes('아직 친구가 없어요')`);await snap('friends-empty');
 await ev(`__game.open('cooking');true`);
 await check('q17 three 임시 recipes, no 미정',`document.querySelectorAll('[data-act=recipePick]').length===3&&document.querySelector('[data-cooking]').textContent.includes('시바 죽')&&!document.querySelector('[data-cooking]').textContent.includes('미정')`);await snap('cook');
 await ev(`(()=>{window.q17Lv=__game.state.cafe.level;__game.state.cafe.level=2;__game.ui.modals=[];document.querySelector('[data-main-tab=manage]').click();__game.refresh();return true})()`);
 await check('run locked before Lv3 with lock art',`!!document.querySelector('[data-run-locked] img[src$="ui-lock.png"]')&&document.querySelector('[data-run-locked]').textContent.includes('Lv3 해금')&&!document.querySelector('[data-open=run]')`);
 await ev(`__game.state.cafe.level=Math.max(3,window.q17Lv);__game.refresh();__game.open('run');true`);await click('[data-act=runPlay]');
  await check('q17 run opens full-screen run; uses a daily play',`!!document.querySelector('#runScreen canvas')&&__game.state.run.day.played===1`);
  await ev(`(()=>{const k=e=>dispatchEvent(new KeyboardEvent('keydown',{key:e}));const l=__game.run.state.lane;k('ArrowLeft');window.q17Lane=[l,__game.run.state.lane];return true})()`);
  await check('run arrow key changes lane',`window.q17Lane[0]===1&&window.q17Lane[1]===0`);
  await ev(`(()=>{const r=__game.run.state;r.objs.push({type:'coin',lane:r.lane,y:__game.CFG.run.shibaY},{type:'obstacle',kind:'bicycle',lane:r.lane,y:__game.CFG.run.shibaY});window.q17Coins=__game.state.coins;return true})()`);await new Promise(r=>setTimeout(r,200));
  await check('run survives first hit',`!document.querySelector('#runScreen .run-card')&&__game.run.state.hitsTaken===1`);
  await ev(`(()=>{const r=__game.run.state;r.objs.push({type:'obstacle',kind:'cat',lane:r.lane,y:__game.CFG.run.shibaY});return true})()`);await new Promise(r=>setTimeout(r,300));
  await check('run second hit pays 10멍 per coin, shows today best',`__game.state.coins===window.q17Coins+10&&document.querySelector('#runScreen .run-card').textContent.includes('오늘 최고 점수 1')`);
  await check('run hit shows centred result',`getComputedStyle(document.querySelector('#runScreen .run-card')).textAlign==='center'`);
  await click('[data-act=runClose]');await check('run closes, score recorded',`!document.querySelector('#runScreen')&&__game.state.run.lastScore!=null`);
 await ev(`__game.close();document.querySelector('[data-main-tab=shiba]').click();document.querySelector('#menuList [data-act=care]').click();true`);
 await check('q17 grid opens centered book popup (1080:1600), contain art, all rows visible without scroll, 돌봄 inside',`(()=>{const b=document.querySelector('#mbox.book-popup [data-profile]');if(!b||document.querySelector('[data-tama]'))return false;const r=b.getBoundingClientRect(),ok=x=>{const q=x.getBoundingClientRect();return q.top>=r.top-1&&q.bottom<=r.bottom+1&&q.bottom<=innerHeight;};return Math.abs(r.width/r.height-1080/1600)<0.02&&Math.abs((r.left+r.right)/2-innerWidth/2)<4&&getComputedStyle(b.querySelector('.book-art img')).objectFit==='contain'&&[...b.querySelectorAll('.book-box')].every(x=>x.scrollHeight<=x.clientHeight+1&&ok(x))&&(()=>{const c=document.querySelector('.book-care-out [data-act=careOpen]').getBoundingClientRect();return c.top>=r.bottom+15&&c.bottom<=innerHeight&&Math.abs((c.left+c.right)/2-(r.left+r.right)/2)<3;})();})()`);await snap('profile');await click('[data-act=careOpen]');
 await check('q17 profile care button opens existing gauges',`!!document.querySelector('[data-tama]')&&document.querySelectorAll('#panel .g').length>0`);
 await ev(`__game.close();__game.iso.setEdit(true);__game.iso.actions.querySelector('[data-wall-add]').click();__game.refresh();true`);
 await check('q17 edit round controls and top-right save',`__game.iso.gridCells>0&&getComputedStyle(document.querySelector('[data-furniture-cancel]')).borderRadius==='50%'&&!!document.querySelector('#scene [data-furniture-save]')`);await snap('edit-selected');
 // Move actual pointer from an opaque selected wall pixel to valid/invalid cells.
 for(let i=0;i<20&&!(await ev('!!__game.iso.hits.find(h=>h.id===__game.iso.selected)'));i++)await new Promise(r=>setTimeout(r,100));
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
