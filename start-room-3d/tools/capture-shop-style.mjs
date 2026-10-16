// Portrait DPR2 capture, using the same isolated CDP setup as the browser tests.
import {runBrowser} from '../tests/browser-runner.mjs';
import {fileURLToPath} from 'node:url';
const local=fileURLToPath(new URL('../docs/screens/shop-style/',import.meta.url));
await runBrowser(async({ev,shot,check})=>{
 await ev(`__game.ui.modals=[];__game.close();__game.refresh();document.querySelector('[data-main-tab=shop]').click();true`);
 for(const tab of ['kitchen','interior','exterior','theme','cash','special']){
  await ev(`document.querySelector('[data-act=${tab==='special'?'shopSpecial':'shopTab'}]${tab==='special'?'':'[data-item='+tab+']'}').click();document.getElementById('menuList').scrollTop=0;true`);
  await check(tab+' safe text',`!/null|undefined|NaN/.test(document.querySelector('[data-shop-v1717]').textContent)`);
  await shot('shop-'+(tab==='cash'?'cash-coupon':tab)+'.png');
 }
},{captureDirs:['/workspace/compare/shop-style',local]});
