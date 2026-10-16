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
 await check('PR-C 360×640: locked menu cards are the same size as other cards, grey, lock icon only + "LvN 해금" and no buy button',`(()=>{const cards=[...document.querySelectorAll('#mbox .menu-card')],lk=cards.filter(e=>e.classList.contains('locked')),op=cards.filter(e=>!e.classList.contains('locked'));
  const sz=e=>{const r=e.getBoundingClientRect();return Math.round(r.width)+'x'+Math.round(r.height);},bg=e=>getComputedStyle(e).backgroundColor;
  return lk.length>0&&op.length>0&&new Set(cards.map(sz)).size===1&&lk.every(e=>{const ims=[...e.querySelectorAll('.menu-card-img img')],im=ims[0],r=im?.getBoundingClientRect();return ims.length===1&&im.getAttribute('src').endsWith('ui-lock.png')&&r.width>=40&&/^Lv\\d+ 해금$/.test(e.querySelector('.menu-unlock').textContent.trim())&&!e.querySelector('[data-act]')&&bg(e)!==bg(op[0])&&(([r,g,b])=>Math.max(r,g,b)-Math.min(r,g,b)<=24)(bg(e).match(/\\d+/g).map(Number));});})()`);
 // 360×640 Lv1: 2-column vertical grid; first row of 2 fully visible inside the popup with no scroll; card = square image · one-line name · button; effect line hidden on unlocked cards
 await ev(`__game.state.cafe.level=1;__game.refresh();document.querySelector('#mbox [data-menu-cards]').scrollTop=0;true`);await sleep(150);
 await check('PR-C 360×640 Lv1: menu grid first row of 2 cards fully visible without scrolling; all cards same size; image · name · button',`(()=>{const l=document.querySelector('#mbox [data-menu-cards]'),L=l.getBoundingClientRect(),M=document.getElementById('mbox').getBoundingClientRect(),cs=[...l.querySelectorAll('.menu-card')],[a,b]=cs.map(e=>e.getBoundingClientRect());
  const sz=e=>{const r=e.getBoundingClientRect();return Math.round(r.width)+'x'+Math.round(r.height);};
  const ok=cs.every(e=>{const k=[...e.children].filter(x=>getComputedStyle(x).display!=='none'&&!x.classList.contains('new-badge')),im=e.querySelector('.menu-card-img').getBoundingClientRect(),n=e.querySelector('.menu-name'),ns=getComputedStyle(n);
   return k.length===3&&k[0].classList.contains('menu-card-img')&&k[1]===n&&(k[2].classList.contains('lp-price')||k[2].classList.contains('menu-unlock'))&&Math.abs(im.width-im.height)<1&&im.width>=60&&ns.whiteSpace==='nowrap'&&ns.textOverflow==='ellipsis'&&n.getBoundingClientRect().height<=22;});
  return innerWidth===360&&innerHeight===640&&cs.length>2&&ok&&l.scrollTop===0&&new Set(cs.map(sz)).size===1&&Math.abs(a.top-b.top)<1&&b.left>a.right&&cs.slice(2).every(e=>e.getBoundingClientRect().top>=a.bottom)&&${inside('a','L')}&&${inside('b','L')}&&${inside('L','M')}&&M.bottom<=innerHeight&&M.top>=0&&l.scrollWidth<=l.clientWidth&&l.scrollHeight>l.clientHeight;})()`);
 await ev(`document.querySelector('#mbox [data-act=modalOk]').click();__game.state.cafe.level=window.prcLv;__game.refresh();true`);
 await check(`PR-C: closing the menu popup after open('menu') leaves a working main screen`,`document.getElementById('modal').hidden&&!__game.ui.modals.length&&document.getElementById('panel').hidden`);
 // (4) furniture cards: 2 per row, image · one-line name · coin+number only
 const card=sel=>`(()=>{const cs=[...document.querySelectorAll('${sel} [data-furn-card]')],list=document.getElementById('menuList'),L=list.getBoundingClientRect();if(cs.length<2)return false;const [a,b]=cs.map(e=>e.getBoundingClientRect());
  const ok=cs.every(e=>{const k=[...e.children].filter(x=>!x.classList.contains('new-badge')),n=e.querySelector('.furn-name'),ns=getComputedStyle(n),btn=e.querySelector('.furn-buy'),r=e.getBoundingClientRect(),im=e.querySelector('.furn-img');
   return (e.closest('[data-shop-v1717]')?k.length===5&&k[1]===n&&k[2]===im&&k[4]===btn:k.length===3&&k[0]===im&&k[1]===n&&k[2]===btn)&&(im.dataset.src0||im.getAttribute('src')).endsWith('ui-icon-'+e.dataset.furnCard+'.png')&&ns.whiteSpace==='nowrap'&&ns.textOverflow==='ellipsis'&&ns.overflow==='hidden'&&n.getBoundingClientRect().height<=22&&(i=>!!i&&(i.dataset.src0||i.getAttribute('src')).endsWith('res-coin.png'))(btn.querySelector('img.ci,img.res-ico[data-res=coin]'))&&/^[\\d,]*$/.test(btn.textContent.trim())&&r.left>=L.left&&r.right<=L.right;});
  return ok&&Math.abs(a.top-b.top)<1&&Math.abs(a.width-b.width)<1&&b.left>a.right&&cs.slice(2).every(e=>e.getBoundingClientRect().top>=a.bottom)&&(cs[0].closest('[data-shop-v1717]')||(${inside('a','L')}&&${inside('b','L')}))&&list.scrollWidth<=list.clientWidth;})()`;
 await ev(`document.querySelector('[data-main-tab=shop]').click();document.querySelector('[data-act=shopTab][data-item=interior]').click();document.getElementById('menuList').scrollTop=0;true`);await sleep(200);
 await check('PR-C 360×640: 상점 인테리어 — vertical 2-column cards below logos; category, name, image, decor, price',`document.getElementById('menuList').scrollTop===0&&${card('[data-shop-v1717]')}`);
 await ev(`document.querySelector('[data-main-tab=bag]').click();document.querySelector('[data-act=bagTab][data-item=furniture]').click();document.querySelector('[data-furniture-shop] [data-furn-grid]').scrollIntoView({block:'start'});true`);await sleep(200);
 await check('PR-C 360×640: 가방 가구 상점 — same 2-column cards; a full first row fits inside the panel',card('[data-furniture-shop]'));
 await ev(`document.getElementById('menuList').scrollTop=0;__game.ui.modals=[];__game.close();__game.refresh();true`);
 await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await sleep(150);
}

if(process.argv[1] && (await import('node:url')).pathToFileURL((await import('node:path')).resolve(process.argv[1])).href===import.meta.url){await (await import('./browser-runner.mjs')).runBrowser(prcBrowser);}
