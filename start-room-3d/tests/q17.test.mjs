import {isDecor,decorEffectText} from '../decor.js';
import {FURN_CATEGORIES} from '../furniture-data.js';
import assert from 'node:assert/strict';
import {CFG} from '../config.js';
import * as S from '../sim.js';
import * as Q from '../q17.js';
import {cookingFx} from '../effects.js';
import {readFileSync} from 'node:fs';
const s=S.newState(0);S.chooseStart(s,'red','',S.rng(1),0);Q.initQ17(s);
assert.deepEqual(s.friends,[]);assert.deepEqual(s.shibas[0].friends,[]);
assert.equal(Q.visitFriend(s,'unknown',0),false);
s.friends=[{id:'test'}];const hearts=s.hearts;
for(let i=0;i<CFG.heartUse.visit.daily;i++)assert.equal(Q.visitFriend(s,'test',0),true);
assert.equal(s.hearts,hearts+CFG.heartUse.visit.daily*CFG.heartUse.visit.hearts);
assert.equal(Q.visitFriend(s,'test',0),false);assert.equal(Q.visitFriend(s,'test',CFG.ledger.periodMs),true);
const r=CFG.cooking.recipes[0];
// 임시 recipes (2026-10-15): names, ingredients, times and effects are set; no 미정.
assert.deepEqual(CFG.cooking.recipes.map(r=>[r.name,r.craftSec,r.effect.full,r.effect.happy]),[['단호박 시바 죽',30,20,10],['고구마 쿠키',60,15,15],['닭가슴살 미트볼',90,25,10]]);
assert.ok(CFG.cooking.recipes.every(r=>Number.isFinite(r.unlockLevel)&&Object.keys(r.ingredients).every(id=>Number.isFinite(CFG.ingredients[id]?.price))));
assert.doesNotMatch(cookingFx(r),/미정/);
s.coins=CFG.ingredients.rice.price+CFG.ingredients.carrot.price;assert.equal(Q.buyIngredient(s,'rice'),true);assert.equal(Q.buyIngredient(s,'carrot'),true);assert.equal(s.coins,0);assert.equal(Q.buyIngredient(s,'rice'),false);
assert.equal(Q.craft(s,r.id,1000),true);assert.equal(Q.craft(s,r.id,1000),false);assert.equal(s.ingredients.rice,0);
{const resumed=JSON.parse(JSON.stringify(s));assert.equal(Q.settleCraft(resumed,30999),false);assert.equal(Q.settleCraft(resumed,31000),true);assert.equal(resumed.dishes[r.id],1);
const sh=resumed.shibas[0];sh.g.full=95;sh.g.happy=30;assert.equal(Q.feedDish(resumed,sh,r.id),true);assert.equal(sh.g.full,100);assert.equal(sh.g.happy,40);assert.equal(Q.feedDish(resumed,sh,r.id),false);}
const before=Q.rewardSnapshot(s);s.items.expBoost4h++;assert.deepEqual(Q.rewardDiff(before,s),[{id:'expBoost4h',n:1}]);
const main=readFileSync(new URL('../main.js',import.meta.url),'utf8');assert.match(main,/temp&&Q.get\('fixture'\)==='friends'/);assert.match(main,/care:d=>\{ui.modals=\[\{kind:'book'/);assert.match(main,/careOpen:d=>\{ui.modals=ui.modals.filter\(m=>m.kind!=='book'\);open\('care'/);assert.match(main,/claimMail:d=>\{const before=Q17.rewardSnapshot/);assert.match(main,/heartUse:d=>\{const before=Q17.rewardSnapshot/);
console.log('q17: friends cap/reset; null gating; craft resume/idempotence; feeding; skip atomicity; grant diff; profile route passed');
// Execute the production renderers (no copied markup, Chrome-independent).
const {runInNewContext}=await import('node:vm');
const {makeT}=await import('../i18n.js'),koL=makeT(()=>'ko');
const renderSource=main.slice(main.indexOf('function furnitureShop(){'),main.indexOf('game.openExpand=openExpand;'));
const P={},ui={};
const renderers=runInNewContext(renderSource+';({shop:furnitureShop})',{isDecor,decorEffectText,FURN_CATEGORIES,RELEASE:false,
 L:koL,LF:(k,fb)=>{const v=koL(k);return v===k?fb:v;},temp:false,Q:new URLSearchParams(),P,ui,s,Q17:Q,CFG,S,clock:{now:()=>0},IMG:{shiba:b=>'assets/drive/shiba-'+b+'.png'},
 slot:()=>'<span class="slot"></span>',img:src=>`<img src="${src}">`,nameOf:sh=>sh.name||sh.breed,
 priceText:n=>n==null?'미정':String(n),cookingFx,fmt:String,itemIcon:()=>'',RES:{},tfmt:String,
});
const shop=renderers.shop();for(const it of CFG.furniture.items){if(it.category!=='floorwall'||it.art)assert.ok(shop.includes(it.front||'assets/drive/ui/ui-icon-'+it.id+'.png'));else assert.ok(!shop.includes('ui-icon-'+it.id+'.png'));assert.ok(shop.includes(it.price===null?'미정':String(S.furniturePrice(s,it.id))));}
ui.furnitureCategory='light';assert.equal((renderers.shop().match(/class="q17-product"/g)||[]).length,CFG.furniture.items.filter(it=>it.category==='light').length);
assert.match(P.cooking().html,/단호박 시바 죽/);assert.doesNotMatch(P.cooking().html.replace(/<button class="cook2-card locked preview"[^]*?<\/button>/g,""),/미정/);assert.match(P.cooking().html,/data-act="craft" disabled/);
assert.match(P.cooking().html,/data-act="ingredientBuy"[^>]+disabled/);
assert.match(P.run().html,/data-act="runSkip" disabled/);assert.doesNotMatch(P.run().html,/Lv미정|강화|에너지/);assert.match(P.run().html,/오늘 남은 판 5/);assert.doesNotMatch(P.run().html,/runAd/);
assert.doesNotMatch(P.profile(s.shibas[0].id).html,/undefined|null|미정/);assert.match(P.profile(s.shibas[0].id).html,new RegExp(CFG.profiles[s.shibas[0].breed].favSnack.name));assert.match(P.profile(s.shibas[0].id).html,/data-act="careOpen"/);
s.friends=[];assert.match(P.friends().html,/아직 친구가 없어요/);
console.log('q17 production renderers: placeholder cooking/run, null disabled buttons, empty friends, profile care link passed');
// Mail receipts represent successful grants only; duplicate claims have no delta.
const mailState=S.newState(0),mailBefore=Q.rewardSnapshot(mailState);
assert.equal(S.claimMail(mailState,1,0),true);assert.ok(Q.rewardDiff(mailBefore,mailState).some(r=>r.id==='heartReset'));
const claimed=Q.rewardSnapshot(mailState);assert.equal(S.claimMail(mailState,1,0),false);assert.deepEqual(Q.rewardDiff(claimed,mailState),[]);
// Execute actual common modal renderer for the new receipt kind.
const modalSource=main.slice(main.indexOf("let modalSig='';"),main.indexOf('if(L0.offline'));
const modalNodes={modal:{hidden:true},mbox:{classList:{toggle(){},remove(){}},dataset:{},innerHTML:''}};
const modalUi={modals:[{kind:'itemget',reward:{id:'expBoost4h',n:1}}]};mailState.started=true;mailState.settings.language='ko';
const modalRender=runInNewContext(modalSource+';renderModal',{isDecor,decorEffectText,FURN_CATEGORIES,RELEASE:false,
 L:koL,ui:modalUi,s:mailState,CFG,S,$:id=>modalNodes[id],grantName:()=> '경험치 부스트',grantImage:()=>'<img src="assets/drive/ui/item-exp-boost.png">',fmt:String,
});
modalRender();assert.equal(modalNodes.modal.hidden,false);assert.match(modalNodes.mbox.innerHTML,/data-itemget/);assert.match(modalNodes.mbox.innerHTML,/받기/);assert.match(modalNodes.mbox.innerHTML,/경험치 부스트/);assert.match(modalNodes.mbox.innerHTML,/data-itemget-count>×1</);
console.log('q17 receipts: actual mailbox grants/idempotence and production common popup renderer passed');
// Cookie's item result under explicit test-only odds is visible to the same receipt adapter.
const cookie=CFG.heartUse.items.find(it=>it.id==='cookie'),oldOdds=cookie.odds,oldRate=CFG.heartUse.incomeRatePerSec;
try{CFG.heartUse.incomeRatePerSec=1;cookie.odds={coins:0,paws:0,item:1};const cs=S.newState(0);S.chooseStart(cs,'red','',S.rng(1),0);cs.cafe.level=cookie.level;const before=Q.rewardSnapshot(cs);assert.equal(S.useHeartItem(cs,'cookie',null,0,null,{r:()=>.5}),true);assert.ok(Q.rewardDiff(before,cs).some(r=>r.id===cookie.rewards.item&&r.n===1));}finally{cookie.odds=oldOdds;CFG.heartUse.incomeRatePerSec=oldRate;}
console.log('q17 cookie: configured item grant enters receipt adapter; production odds restored to null');
