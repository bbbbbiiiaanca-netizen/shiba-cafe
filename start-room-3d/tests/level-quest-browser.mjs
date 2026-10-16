export async function levelQuestBrowser({ev,check,c}){
 await c('Emulation.setDeviceMetricsOverride',{width:360,height:640,deviceScaleFactor:1,mobile:true});
 await ev(`window.levelQuestSave={cafe:{...__game.state.cafe},lang:__game.state.settings.language};__game.ui.modals=[];__game.close();__game.state.cafe.level=1;__game.state.cafe.exp=0;true`);
 for(const lang of ['ko','en']){
  await ev(`__game.state.settings.language='${lang}';__game.applyLang();document.getElementById('lvl').click();true`);
  await check('level bubble localized format '+lang,`!document.getElementById('levelPopover').hidden&&document.getElementById('levelPopover').textContent==='Lv 1 · 0% (0 / 7,187)'&&document.getElementById('lvl').getAttribute('aria-expanded')==='true'&&document.getElementById('levelPopover').getBoundingClientRect().top>document.getElementById('lvl').getBoundingClientRect().bottom`);
  await ev(`document.getElementById('scene').click();true`);
  await check('outside tap closes level bubble '+lang,`document.getElementById('levelPopover').hidden&&document.getElementById('lvl').getAttribute('aria-expanded')==='false'`);
 }
 await ev(`document.querySelector('[data-main-tab=manage]').click();true`);
 await check('management progress row removed',`!document.querySelector('#menuList [data-cafe-level],#menuList .manage-lv,#menuList .bar')`);
 await ev(`__game.open('quests');__game.refresh();(()=>{const q=document.querySelector('[data-quests]'),row=q.querySelector('.quest-row');for(let i=0;i<9;i++)q.append(row.cloneNode(true));})();true`);
 await check('360x640 shows at least four complete quest rows and scrolls overflow',`(()=>{const body=document.getElementById('pbody'),b=body.getBoundingClientRect(),rows=[...body.querySelectorAll('.quest-row')];return rows.filter(r=>{const x=r.getBoundingClientRect();return x.top>=b.top&&x.bottom<=b.bottom}).length>=4&&body.scrollHeight>body.clientHeight&&getComputedStyle(body).overflowY==='auto'&&(body.scrollTop=100)>0;})()`);
 await ev(`__game.close();Object.assign(__game.state.cafe,window.levelQuestSave.cafe);__game.state.settings.language=window.levelQuestSave.lang;__game.applyLang();true`);
 await c('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
}
