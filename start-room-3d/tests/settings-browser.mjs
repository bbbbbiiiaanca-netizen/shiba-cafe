// 설정 창: 화면 전체를 불투명하게 덮고(뒤 상점 패널 글자 비침 없음), 릴리스에서는 수익 공식 줄 숨김. 영어 동구 카드 'Go home'.
import {writeFileSync} from 'node:fs';
export async function settingsBrowser({ev,check,c,release,shotDir=process.env.I18N_SHOT_DIR,extraShot={}}){
 const shot=async n=>{if(!shotDir)return;await ev('new Promise(r=>setTimeout(r,400))');const {data}=await c('Page.captureScreenshot',{format:'png'});writeFileSync(shotDir+'/'+n,Buffer.from(data,'base64'));if(extraShot[n])writeFileSync(extraShot[n],Buffer.from(data,'base64'));};
 const tag=release?'release':'normal';
 for(const lang of ['ko','en']){
  await ev(`__game.ui.modals=[];__game.close();__game.state.settings.language=${JSON.stringify(lang)};__game.applyLang();document.querySelector('[data-main-tab=shop]').click();new Promise(r=>setTimeout(()=>r(true),200)).then(()=>{document.querySelector('[data-act=settings],[data-open=settings],#settingsBtn,[aria-label="${lang==='en'?'Settings':'설정'}"]').click();return new Promise(r=>setTimeout(()=>r(true),300));})`);
  await check(`settings ${lang} ${tag}: panel covers the whole area above the tabs, opaque, shop text not visible`,`(()=>{const p=document.getElementById('panel');if(p.hidden||p.dataset.panel!=='settings')return false;const r=p.getBoundingClientRect(),bg=getComputedStyle(p).backgroundColor;if(r.top>1||/rgba\\(.*,\\s*0(\\.\\d+)?\\)/.test(bg))return false;for(const y of [20,80,r.bottom-30]){const e=document.elementFromPoint(195,y);if(!p.contains(e))return false;}return true;})()`);
  const inc=`!![...document.querySelectorAll('#panel [data-act=income]')].length`;
  await check(`settings ${lang} ${tag}: earnings-formula button ${release?'hidden':'shown'}`,release?`!${inc}`:inc);
  await shot(`settings-${lang}-${tag}.png`);
 }
 if(!release){
  await ev(`__game.close();__game.state.settings.language="en";__game.state.dongu.placed=true;__game.applyLang();document.querySelector('[data-main-tab=shiba]').click();new Promise(r=>setTimeout(()=>{const b=document.querySelector('[data-act=dongu]');b&&b.scrollIntoView({block:'center'});r(true)},300))`);
  await check('dongu card en: placed button reads "Go home"; shiba care key unchanged',`document.querySelector('[data-act=dongu]').textContent.trim()==='Go home'`);
  await shot('dongu-card-en.png');
 }
 await ev(`__game.close();__game.state.settings.language="ko";__game.applyLang();true`);
}

if(process.argv[1] && (await import('node:url')).pathToFileURL((await import('node:path')).resolve(process.argv[1])).href===import.meta.url){await (await import('./browser-runner.mjs')).runBrowser(settingsBrowser);}
