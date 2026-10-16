// PR-C (2026-10-16) real-DOM checks at 360×640: cooking button, locked menu cards, open('menu'), furniture 2-column cards.
export async function prcBrowser({ev,c,check,sleep}){
 await c('Emulation.setDeviceMetricsOverride',{width:360,height:640,deviceScaleFactor:1,mobile:true});await sleep(150);
 const inside=(a,b)=>`(${a}.top>=${b}.top-.5&&${a}.bottom<=${b}.bottom+.5&&${a}.left>=${b}.left-.5&&${a}.right<=${b}.right+.5)`;
 // (1) 요리 제작: 만들기 버튼 in the popup without scrolling, every recipe
 await ev(`__game.ui.modals=[];__game.close();__game.open('cooking');__game.refresh();true`);await sleep(200);
 await check('PR-C 360×640: 요리 제작 버튼 is fully visible without scrolling for every recipe',`(async()=>{const g=__game,res=[];for(const r of g.CFG.cooking.recipes){g.ui.recipe=r.id;g.refresh();await new Promise(f=>setTimeout(f,60));
  const pb=document.getElementById('pbody'),P=document.getElementById('panel').getBoundingClientRect(),B=pb.getBoundingClientRect(),go=document.querySelector('.cook2-go').getBoundingClientRect();
  res.push(innerWidth===360&&innerHeight===640&&pb.scrollTop===0&&pb.scrollHeight<=pb.clientHeight+1&&go.height>0&&${inside('go','B')}&&${inside('go','P')});}return res.length>0&&res.every(Boolean);})()`);
 await ev(`__game.ui.recipe=null;__game.close();__game.refresh();true`);
 // (3) open('menu') no longer throws → menu list modal; (2) locked cards = same frame with lock + LvN 해금
 await ev(`window.prcLv=__game.state.cafe.level;__game.state.cafe.level=5;__game.open('menu');true`);await sleep(150);
 await check(`PR-C: __game.open('menu') opens the 메뉴 개발 list popup (no throw)`,`__game.ui.modals[0]?.kind==='list'&&__game.ui.modals[0].list==='menu'&&!document.getElementById('modal').hidden&&!!document.querySelector('#mbox [data-menu-cards]')`);
 await check('PR-C 360×640: locked menu cards are the same size as other cards, with lock icon + "LvN 해금" and no buy button',`(()=>{const cards=[...document.querySelectorAll('#mbox .menu-card')],lk=cards.filter(e=>e.classList.contains('locked')),op=cards.filter(e=>!e.classList.contains('locked'));
  const sz=e=>{const r=e.getBoundingClientRect();return Math.round(r.width)+'x'+Math.round(r.height);};
  return lk.length>0&&op.length>0&&new Set(cards.map(sz)).size===1&&lk.every(e=>{const im=e.querySelector('.menu-lock img'),r=im?.getBoundingClientRect();return im&&im.getAttribute('src').endsWith('ui-lock.png')&&r.width>=40&&/^Lv\\d+ 해금$/.test(e.querySelector('strong').textContent.trim())&&!e.querySelector('[data-act]');});})()`);
 await ev(`document.querySelector('#mbox [data-act=modalOk]').click();__game.state.cafe.level=window.prcLv;__game.refresh();true`);
 await check(`PR-C: closing the menu popup after open('menu') leaves a working main screen`,`document.getElementById('modal').hidden&&!__game.ui.modals.length&&document.getElementById('panel').hidden`);
 // (4) furniture cards: 2 per row, image · one-line name · coin+number only
 const card=sel=>`(()=>{const cs=[...document.querySelectorAll('${sel} [data-furn-card]')],list=document.getElementById('menuList'),L=list.getBoundingClientRect();if(cs.length<2)return false;const [a,b]=cs.map(e=>e.getBoundingClientRect());
  const ok=cs.every(e=>{const k=[...e.children].filter(x=>!x.classList.contains('new-badge')),n=e.querySelector('.furn-name'),ns=getComputedStyle(n),btn=e.querySelector('.furn-buy'),r=e.getBoundingClientRect(),im=e.querySelector('.furn-img');
   return k.length===3&&k[0]===im&&k[1]===n&&k[2]===btn&&(im.dataset.src0||im.getAttribute('src')).endsWith('ui-icon-'+e.dataset.furnCard+'.png')&&ns.whiteSpace==='nowrap'&&ns.textOverflow==='ellipsis'&&ns.overflow==='hidden'&&n.getBoundingClientRect().height<=22&&(i=>!!i&&(i.dataset.src0||i.getAttribute('src')).endsWith('res-coin.png'))(btn.querySelector('img.ci,img.res-ico[data-res=coin]'))&&/^[\\d,]*$/.test(btn.textContent.trim())&&!/장식 점수|미정/.test(e.textContent)&&r.left>=L.left&&r.right<=L.right;});
  return ok&&Math.abs(a.top-b.top)<1&&Math.abs(a.width-b.width)<1&&b.left>a.right&&cs.slice(2).every(e=>e.getBoundingClientRect().top>=a.bottom)&&${inside('a','L')}&&${inside('b','L')}&&list.scrollWidth<=list.clientWidth;})()`;
 await ev(`document.querySelector('[data-main-tab=shop]').click();document.querySelector('[data-act=shopTab][data-item=interior]').click();document.getElementById('menuList').scrollTop=0;true`);await sleep(200);
 await check('PR-C 360×640: 상점 인테리어 — first row of 2 furniture cards fully visible without scrolling; image, one-line name, coin + price only',`document.getElementById('menuList').scrollTop===0&&${card('[data-shop-v1717]')}`);
 await ev(`document.querySelector('[data-main-tab=bag]').click();document.querySelector('[data-act=bagTab][data-item=furniture]').click();document.querySelector('[data-furniture-shop] [data-furn-grid]').scrollIntoView({block:'start'});true`);await sleep(200);
 await check('PR-C 360×640: 가방 가구 상점 — same 2-column cards; a full first row fits inside the panel',card('[data-furniture-shop]'));
 await ev(`document.getElementById('menuList').scrollTop=0;__game.ui.modals=[];__game.close();__game.refresh();true`);
 await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await sleep(150);
}
