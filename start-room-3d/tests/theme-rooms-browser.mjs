// 테마 방 그림: 잠긴 테마는 적용 안 됨 → 기존 잠금 해제 버튼 → 후지산/대나무 선택 시 다다미와 같은 위치·크기로 방 그림 교체, 다시 다다미, 새로고침 유지, 땅 넓힌 방도 같음.
export async function themeRoomsBrowser({ev,check,reload}){
 const click=sel=>ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.disabled)throw Error('Missing '+${JSON.stringify(sel)});e.click();return true;})()`);
 // record actual canvas room draws (src + rect) for one redraw
 const ROOMS=`['room-tatami-noline.png','room-merged-j.png','room-merged-ij.png','bg-theme-fuji.png','bg-theme-bamboo.png']`;
 const roomDraw=`(()=>{const P=CanvasRenderingContext2D.prototype,orig=P.drawImage,hits=[];P.drawImage=function(im,...a){const f=(im.src||'').split('/').pop();if(${ROOMS}.includes(f)&&im.complete&&im.naturalWidth)hits.push({f,a:a.map(v=>Math.round(v*100)/100)});return orig.call(this,im,...a);};try{__game.refresh();}finally{P.drawImage=orig;}return hits;})()`;
 const settle=()=>ev(`Promise.all([...['assets/drive/themes/bg-theme-fuji.png','assets/drive/themes/bg-theme-bamboo.png','assets/drive/tiles/room-merged-ij.png'].map(s=>{const i=new Image();i.src=s;return i.decode().catch(()=>0);})]).then(()=>new Promise(r=>setTimeout(r,300))).then(()=>{__game.refresh();return true;})`);
 const openTheme=async()=>{await ev(`__game.ui.modals=[];__game.close();__game.refresh();true`);await click('[data-main-tab=shop]');await click('[data-act=shopTab][data-item=theme]');};
 await settle();await openTheme();
 const base=await ev(roomDraw);
 await check('theme rooms: default room draws tatami art once',`${JSON.stringify(base)}.length===1&&${JSON.stringify(base)}[0].f==='room-tatami-noline.png'&&__game.state.space.theme==='tatami'`);
 await check('theme rooms: shop cards show fuji/bamboo art in the existing art slot with lock, tatami logo kept',`(()=>{const b=[...document.querySelectorAll('[data-theme-logos] .theme-logo')];const art=x=>x.querySelector('.theme-logo-art img:not(.theme-lock)');return b.length===3&&art(b[0]).getAttribute('src').endsWith('ui-theme-logo-tatami.png')&&['fuji','bamboo'].every((id,k)=>{const x=b[k+1],i=art(x);return x.classList.contains('locked')&&!!x.querySelector('img.theme-lock')&&i.getAttribute('src')==='assets/drive/themes/bg-theme-'+id+'.png'&&i.complete&&i.naturalWidth===861&&i.getBoundingClientRect().width>0&&getComputedStyle(x.querySelector('img.theme-lock')).position==='absolute';})&&document.documentElement.scrollWidth<=innerWidth;})()`);
 await click('[data-act=shopTheme][data-item=fuji]');
 await check('theme rooms: tapping a locked theme does not apply it',`__game.state.space.theme==='tatami'&&(h=>h.length===1&&h[0].f==='room-tatami-noline.png')(${roomDraw})`);
 // unlock through the existing unlock buttons (prices/rules untouched)
 await ev(`__game.state.cafe.level=35;__game.state.coins=2e7;__game.refresh();true`);
 await click('[data-act=spaceBuy][data-kind=theme][data-id=fuji][data-via=coins]');
 await check('theme rooms: existing unlock button buys fuji at its configured price, not auto-applied',`__game.state.space.themes.includes('fuji')&&__game.state.coins===2e7-__game.S.spacePrice('theme','fuji','coins',__game.state)&&__game.state.space.theme==='tatami'&&!document.querySelector('[data-act=shopTheme][data-item=fuji]').classList.contains('locked')`);
 await click('[data-act=shopTheme][data-item=fuji]');
 await check('theme rooms: selecting fuji draws its art at the exact tatami rect',`(h=>__game.state.space.theme==='fuji'&&h.length===1&&h[0].f==='bg-theme-fuji.png'&&JSON.stringify(h[0].a)===${JSON.stringify(JSON.stringify(base[0]?.a))})(${roomDraw})`);
 await check('theme rooms: canvas pixels change from tatami to fuji art',`(()=>{const cv=document.getElementById('isomap'),g=cv.getContext('2d'),px=()=>{const d=g.getImageData(0,0,cv.width,cv.height).data;let h=0;for(let i=0;i<d.length;i+=997)h=(h*31+d[i])|0;return h;};__game.refresh();const a=px();__game.state.space.theme='tatami';__game.refresh();const b=px();__game.state.space.theme='fuji';__game.refresh();return a!==b;})()`);
 await click('[data-act=shopTheme][data-item=bamboo]');
 await check('theme rooms: locked bamboo still not applied',`__game.state.space.theme==='fuji'`);
 await click('[data-act=spaceBuy][data-kind=theme][data-id=bamboo][data-via=coins]');await click('[data-act=shopTheme][data-item=bamboo]');
 await check('theme rooms: bamboo applied at the exact tatami rect',`(h=>__game.state.space.theme==='bamboo'&&h.length===1&&h[0].f==='bg-theme-bamboo.png'&&JSON.stringify(h[0].a)===${JSON.stringify(JSON.stringify(base[0]?.a))})(${roomDraw})`);
 await reload();await settle();
 await check('theme rooms: applied bamboo survives reload',`__game.state.space.theme==='bamboo'&&(h=>h.length===1&&h[0].f==='bg-theme-bamboo.png')(${roomDraw})`);
 await openTheme();await click('[data-act=shopTheme][data-item=tatami]');
 await check('theme rooms: switching back to tatami restores the tatami room',`__game.state.space.theme==='tatami'&&(h=>h.length===1&&h[0].f==='room-tatami-noline.png')(${roomDraw})`);
 // expanded room: theme art replaces merged tatami art, same rect
 await ev(`__game.state.space.unlockedRows=3;__game.S.syncRoutes(__game.state,__game.world);__game.refresh();true`);await settle();
 const merged=await ev(roomDraw);
 await click('[data-act=shopTheme][data-item=fuji]');
 await check('theme rooms: expanded room keeps fuji art at the merged-room rect',`${JSON.stringify(merged)}.length===1&&${JSON.stringify(merged)}[0].f==='room-merged-ij.png'&&(h=>__game.state.space.theme==='fuji'&&h.length===1&&h[0].f==='bg-theme-fuji.png'&&JSON.stringify(h[0].a)===${JSON.stringify(JSON.stringify(merged[0]?.a))})(${roomDraw})`);
 await reload();await settle();
 await check('theme rooms: expanded fuji room survives reload',`__game.state.space.unlockedRows===3&&__game.state.space.theme==='fuji'&&(h=>h.length===1&&h[0].f==='bg-theme-fuji.png')(${roomDraw})`);
}
