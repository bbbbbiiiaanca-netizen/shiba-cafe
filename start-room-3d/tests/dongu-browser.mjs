// 동구 그림: en이면 _en(목걸이 DG), ko면 원본. 언어 전환은 새로고침 없이.
import {writeFileSync} from 'node:fs';
export async function donguBrowser({ev,check,c,shotDir=process.env.DONGU_SHOT_DIR}){
 const src=sel=>`[...document.querySelectorAll(${JSON.stringify(sel)})].map(i=>[i.getAttribute('src'),i.dataset.src].find(s=>/dongu/.test(s||''))).filter(Boolean)`;
 const shot=async n=>{if(!shotDir)return;await ev('new Promise(r=>setTimeout(r,400))');const {data}=await c('Page.captureScreenshot',{format:'png'});writeFileSync(shotDir+'/'+n,Buffer.from(data,'base64'));};
 for(const lang of ['ko','en']){
  const front=lang==='en'?'assets/drive/chars/dongu/dongu-front_en.png':'assets/drive/chars/dongu/dongu-front.png';
  const sprite=lang==='en'?'assets/drive/dongu_en.webp':'assets/drive/dongu.webp';
  await ev(`__game.ui.modals=[];__game.close();__game.state.settings.language=${JSON.stringify(lang)};__game.applyLang();__game.startTutorial();true`);
  await check(`dongu ${lang}: tutorial dialogue uses ${front} (no reload)`,`(a=>a.length===1&&a[0]===${JSON.stringify(front)})(${src('[data-dialogue=tutorial] img')})`);
  await shot(`dongu-${lang}.png`);
  await ev(`__game.ui.modals=[];__game.state.tutorialDone=true;__game.close();__game.refresh();document.querySelector('[data-main-tab=shiba]').click();new Promise(r=>setTimeout(()=>r(true),300))`);
  await check(`dongu ${lang}: shiba list card uses ${sprite}`,`(a=>a.length>=1&&a.every(s=>s===${JSON.stringify(sprite)}))(${src('.pt img')})`);
 }
 // en → ko 되돌리기도 새로고침 없이: 시바 목록과 동구 대화가 원본으로.
 await ev(`__game.ui.modals=[];__game.close();__game.state.settings.language="ko";__game.applyLang();document.querySelector('[data-main-tab=shiba]').click();new Promise(r=>setTimeout(()=>r(true),300))`);
 await check('dongu en→ko: shiba list back to dongu.webp without reload',`(a=>a.length>=1&&a.every(s=>s==='assets/drive/dongu.webp'))(${src('.pt img')})`);
 await ev(`document.querySelector('[data-main-tab=village]').click();__game.ui.modals=[];__game.close();__game.startTutorial();new Promise(r=>setTimeout(()=>r(true),300))`);
 await check('dongu en→ko: tutorial dialogue back to dongu-front.png without reload',`(a=>a.length===1&&a[0]==='assets/drive/chars/dongu/dongu-front.png')(${src('[data-dialogue=tutorial] img')})`);
 await ev(`__game.ui.modals=[];__game.state.tutorialDone=true;__game.close();__game.refresh();true`);

}

if(process.argv[1] && (await import('node:url')).pathToFileURL((await import('node:path')).resolve(process.argv[1])).href===import.meta.url){await (await import('./browser-runner.mjs')).runBrowser(donguBrowser);}
