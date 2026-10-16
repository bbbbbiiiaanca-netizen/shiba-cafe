export async function walkOrderBrowser({ev,check,c}){
 await c('Emulation.setDeviceMetricsOverride',{width:360,height:640,deviceScaleFactor:1,mobile:true});
 await ev(`__game.ui.modals=[];__game.close();document.querySelector('[data-main-tab=shiba]').click();true`);
 await check('walk entry removed from shiba panel',`!document.querySelector('#menuList [data-open=walk]')`);
 await ev(`document.querySelector('[data-main-tab=village]').click();document.querySelector('[data-place-art=walk]').decode().then(()=>true)`);
 await check('forest walk art and tap area fit 360x640',`(()=>{const a=document.querySelector('[data-place-art=walk]'),b=document.querySelector('[data-place=walk]'),r=b.getBoundingClientRect(),im=a.getBoundingClientRect();return a.naturalWidth===308&&r.left>=0&&r.right<=360&&r.top>=0&&r.bottom<=640&&im.left>=0&&im.right<=360&&document.documentElement.scrollWidth<=360})()`);
 await ev(`document.querySelector('[data-place=walk]').click();true`);
 await check('map walk opens existing walk screen',`(()=>{const b=document.querySelector('[data-act=walk]');if(__game.ui.panel!=='walk'||!b)return false;b.scrollIntoView({block:'center'});const r=b.getBoundingClientRect();return r.width>0&&r.height>0&&b.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2))})()`);
 for(const [place,panel] of [['hospital','hospital'],['ingredients','cooking']]){
  await ev(`__game.close();document.querySelector('[data-place=${place}]').click();true`);
  await check(`map ${place} opens tappable existing ${panel} screen`,`(()=>{const b=document.querySelector('#phead [data-act=close]'),body=document.getElementById('pbody'),r=b.getBoundingClientRect(),p=body.getBoundingClientRect();return __game.ui.panel==='${panel}'&&r.width>0&&r.height>0&&b.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2))&&body.contains(document.elementFromPoint(p.left+p.width/2,p.top+p.height/2))})()`);
 }
 await ev(`(()=>{const g=__game;g.close();document.querySelector('[data-act=villageClose]')?.click();g.world.events=[];g.world.orderBubbles=[];const ctx=document.getElementById('isomap').getContext('2d'),original=ctx.roundRect;window.__orderDraws=0;ctx.roundRect=function(x,y,w,h,r){if(w===46&&h===44)window.__orderDraws++;return original.call(this,x,y,w,h,r);};g.world.events.push({type:'order',id:987,order:'M-01',orderImg:g.CFG.menu.coffee.img,cell:[2,3]});g.refresh();return true;})()`);
 await check('order event creates only menu image bubble with configured duration',`(()=>{const b=__game.world.orderBubbles;return window.__orderDraws>0&&b.length===1&&b[0].guestId===987&&b[0].img===__game.CFG.menu.coffee.img&&b[0].dur===1.5&&!document.getElementById('toast').textContent.includes('주문')})()`);
 await ev(`__game.step(1.4);true`);
 await check('bubble remains before duration',`__game.world.orderBubbles.some(b=>b.guestId===987)`);
 await ev(`__game.step(.11);true`);
 await check('bubble expires after configured duration',`!__game.world.orderBubbles.some(b=>b.guestId===987)`);
 await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
}
