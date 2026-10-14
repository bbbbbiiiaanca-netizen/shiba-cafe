import assert from 'node:assert/strict';
import * as S from '../sim.js';import {CFG} from '../config.js';
const s=S.newState(0);S.chooseStart(s,'red','',S.rng(1),0,S.bandanaItems()[0].id);
assert.equal(s.dia,300);assert.equal(S.seatCount(s),2);assert.equal(Object.values(s.furnitureInv).reduce((a,b)=>a+b),5);assert.ok(s.shibas[0].acc);
assert.equal(S.buyUpgrade(s,'seat'),false);assert.deepEqual(Object.keys(CFG.upgrades),['interval','price','queue']);
assert.equal(S.mailbox(s,0).length,1);assert.ok(S.claimMail(s,1,0));assert.equal(S.claimMail(s,1,0),false);assert.equal(s.coins,45000);assert.equal(s.items.heartReset,1);
assert.equal(S.useItem(s,'expBoost4h',0),false);assert.equal(s.items.expBoost4h,1);CFG.stub.expBoost.mul=1.2;assert.ok(S.useItem(s,'expBoost4h',0));const xp=s.cafe.exp;S.addCafeExp(s,10);assert.equal(s.cafe.exp-xp,12);CFG.stub.expBoost.mul=null;
assert.equal(S.useItem(s,'cooldownTicket',0),false);s.items.cooldownTicket=1;s.shibas[0].cd.daycare=100;assert.ok(S.useItem(s,'cooldownTicket',0));assert.equal(s.shibas[0].cd.daycare,0);
s.cafe.level=50;S.grantSeatRewards(s);assert.equal(s.furnitureInv.cushion,20);assert.ok(S.placeFurniture(s,'cushion',[1,1]));assert.equal(S.seatCount(s),3);assert.equal(S.placeFurniture(s,'cushion',[1,1]),false);
s.dia=9999;s.cafe.level=1;assert.equal(S.unlockSpace(s,'theme','fuji','dia'),false);s.cafe.level=20;assert.ok(S.unlockSpace(s,'theme','fuji','dia'));assert.equal(S.spaceUnlockCheck(s,'floor2','','dia'),'unset');
const m=S.mailbox(s,13*CFG.ledger.periodMs);assert.equal(m.find(x=>x.day===8).items.incomeBoost4h,1);assert.equal(m.find(x=>x.day===14).items.incomeBoost4h,1);


const oldLevel=s.seatRewardLevel;S.grantSeatRewards(s);assert.equal(s.seatRewardLevel,oldLevel);
const persisted=new Map(),storage={getItem:k=>persisted.get(k)??null,setItem:(k,v)=>persisted.set(k,v)};S.save(storage,s,0);const loaded=S.load(storage,0).state;assert.equal(S.claimMail(loaded,1,0),false);assert.equal(loaded.firstLaunch,0);
const all=S.mailbox(S.newState(0),13*CFG.ledger.periodMs);assert.equal(all.reduce((n,m)=>n+(m.items.incomeBoost4h||0),0),2);assert.equal(all.reduce((n,m)=>n+(m.items.cooldownTicket||0),0),5);assert.equal(all.reduce((n,m)=>n+(m.items.potionBig||0),0),2);assert.equal(all.reduce((n,m)=>n+(m.items.heartReset||0),0),7);
assert.equal(S.mailbox(S.newState(Date.UTC(2026,9,15,14,59)),Date.UTC(2026,9,15,15)).at(-1).day,2);

const boostState=S.newState(0);boostState.items.incomeBoost4h=1;assert.equal(S.useItem(boostState,'incomeBoost4h',0),false);assert.equal(boostState.items.incomeBoost4h,1);CFG.itemIncome.boostMul=1.2;assert.ok(S.useItem(boostState,'incomeBoost4h',0));assert.equal(S.itemIncomeMul(boostState,0),CFG.itemIncome.boostMul);assert.equal(S.itemIncomeMul(boostState,CFG.itemIncome.boostHours*3600000),1);CFG.itemIncome.boostMul=null;boostState.items.cooldownTicket=1;assert.equal(S.useItem(boostState,'cooldownTicket',0),false);assert.equal(boostState.items.cooldownTicket,1);
const purchase=S.newState(0),price=CFG.furniture.items[1].price;try{CFG.furniture.items[1].price=CFG.start.coins;assert.ok(S.buyFurniture(purchase,'zabuton',0));assert.equal(purchase.coins,0);assert.equal(S.ledgerStatement(purchase,0).lines.find(x=>x.id==='furniture').amount,CFG.start.coins);}finally{CFG.furniture.items[1].price=price;}
// Calibration validation uses measured throughput and integrates the first 14 days separately.
const {readFileSync}=await import('node:fs');const measured=JSON.parse(readFileSync(new URL('./balance-results.json',import.meta.url)));
let days=0;for(let lv=1;lv<50;lv++){let exp=CFG.cafe.expToNext[lv-1],rate=measured[lv-1]['served/hour']*20*1.1;if(days<14){const early=Math.min(exp,(14-days)*rate*1.5);days+=early/(rate*1.5);exp-=early;}days+=exp/rate;const target={10:10,20:80,30:215,40:425,50:735}[lv+1];if(target)assert.ok(Math.abs(days-target)<.01,`Lv${lv+1} ${days} days`);}

console.log("Final: mailbox, calendar, save, item totals, bandana, physical seats, boosts, gates and calibrated target days passed");

// Run the actual modal renderer without Chrome: cached HTML must react to bandana picks.
const {runInNewContext}=await import('node:vm');
const mainSource=readFileSync(new URL('../main.js',import.meta.url),'utf8');
const modalSource=mainSource.slice(mainSource.indexOf("let modalSig='';"),mainSource.indexOf('if(L0.offline'));
const nodes={modal:{hidden:true},mbox:{classList:{toggle(){},remove(){}},dataset:{},innerHTML:''}};
const ui={modals:[],startPick:null,startBandana:null},state=S.newState(0);state.settings.language='en';
const render=runInNewContext(modalSource+';renderModal',{
 ui,s:state,S,CFG,$:id=>nodes[id],L:key=>key,img:()=>'',IMG:{four:'',shiba:()=>''},bandHtml:()=>'',accName:x=>x,
});
const startDisabled=()=>/data-act="startGo" disabled/.test(nodes.mbox.innerHTML);
render();assert.ok(startDisabled());
ui.startPick='kuro';render();assert.ok(startDisabled());
ui.startBandana=S.bandanaItems()[0].id;render();assert.equal(startDisabled(),false);
assert.ok(nodes.mbox.innerHTML.includes(`data-item="${ui.startBandana}" aria-pressed="true"`));
ui.startBandana=S.bandanaItems().at(-1).id;render();
assert.ok(nodes.mbox.innerHTML.includes(`data-item="${ui.startBandana}" aria-pressed="true"`));
S.chooseStart(state,ui.startPick,'',S.rng(1),0,ui.startBandana);render();
assert.ok(nodes.modal.hidden);assert.equal(state.shibas[0].breed,'kuro');assert.equal(state.shibas[0].level,21);
assert.equal(state.shibas[0].acc,ui.startBandana);for(const [trick,level] of Object.entries(CFG.startShiba.tricks))assert.equal(state.shibas[0].tricks[trick],level);
console.log('Starter modal: breed + bandana gating, selection refresh, chosen Lv21 accessory and dismissal passed');

// Production cache must react to multiplier edits within the same clock second.
const menuNodes={paws:{parentElement:{}},menuList:{classList:{add(){}},innerHTML:'',querySelector(){return null;}},heading:{innerHTML:''}};
const menuState=S.newState(0);menuState.items.expBoost4h=1;menuState.items.incomeBoost4h=1;
const menuContext={s:menuState,w:{custs:[],queue:[],recent:[]},ui:{seen:{}},CFG,S,iso:{edit:false},clock:{now:()=>0},renderTabs(){},fmt:String,$:id=>menuNodes[id],document:{querySelector:()=>menuNodes.heading}};
const consumablesSource=mainSource.slice(mainSource.indexOf('function consumables()'),mainSource.indexOf('\n',mainSource.indexOf('function consumables()')));
const menuSource=mainSource.slice(mainSource.indexOf('function renderMainMenu()'),mainSource.indexOf("document.querySelectorAll('[data-main-tab]').forEach(b=>b.addEventListener"));
const renderMenu=runInNewContext("let menuSig='',mainTab='shop';"+consumablesSource+";const P={shop:()=>({html:consumables()})};"+menuSource+';renderMainMenu',menuContext);
const disabledItem=k=>new RegExp(`data-item=${k} disabled`).test(menuNodes.menuList.innerHTML);
const oldExp=CFG.stub.expBoost.mul,oldIncome=CFG.itemIncome.boostMul;
try{
 CFG.stub.expBoost.mul=null;CFG.itemIncome.boostMul=null;renderMenu();assert.ok(disabledItem('expBoost4h'));assert.ok(disabledItem('incomeBoost4h'));
 CFG.stub.expBoost.mul=1.2;renderMenu();assert.equal(disabledItem('expBoost4h'),false);assert.ok(disabledItem('incomeBoost4h'));
 CFG.itemIncome.boostMul=1.2;renderMenu();assert.equal(disabledItem('incomeBoost4h'),false);
 assert.ok(S.useItem(menuState,'expBoost4h',0));renderMenu();assert.ok(disabledItem('expBoost4h'));assert.equal(menuState.items.expBoost4h,0);assert.ok(menuState.cafe.expBoostUntil>0);
 CFG.itemIncome.boostMul=null;renderMenu();assert.ok(disabledItem('incomeBoost4h'));assert.equal(menuState.items.incomeBoost4h,1);
}finally{CFG.stub.expBoost.mul=oldExp;CFG.itemIncome.boostMul=oldIncome;}
console.log('Consumables renderer: same-second CFG activation, consumption and null gating passed');
