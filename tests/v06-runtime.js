/* 브라우저가 막힌 환경용 상태 통합 검사. DOM 페인트/터치를 대체하지 않는다. */
const vm=require('vm'),fs=require('fs'),assert=require('assert/strict');
const elements=new Map();
class Element{
 constructor(){this.dataset={};this.style={setProperty(){}};this.classList={add(){},remove(){},toggle(){},contains(){return true;}};this.children=[];this.offsetHeight=100;this.clientWidth=390;this.clientHeight=844;}
 set innerHTML(v){this.html=v;}get innerHTML(){return this.html||'';}
 querySelector(){return new Element();}querySelectorAll(){return [];}
 addEventListener(){}appendChild(e){e.parentNode=this;this.children.push(e);}append(e){this.appendChild(e);}remove(){}
 getBoundingClientRect(){return {left:0,top:0,right:100,bottom:100,width:100,height:100};}
}
const get=s=>{if(!elements.has(s))elements.set(s,new Element());return elements.get(s);};
const results=['completed','cancelled','unavailable'].map(result=>{const el=new Element();el.dataset.rewardResult=result;return el;});
const document={querySelector:get,querySelectorAll:s=>s==='[data-reward-result]'?results:[],createElement:()=>new Element(),getElementById:get,addEventListener(){},body:new Element(),documentElement:new Element()};
const storage=new Map();const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
const ctx=vm.createContext({document,localStorage,location:{search:'?debug=1'},URLSearchParams,Date,Math,performance:{now:()=>10000},setTimeout:()=>1,clearTimeout(){},setInterval(){},requestAnimationFrame(){},console,innerWidth:390,innerHeight:844});ctx.window=ctx;ctx.addEventListener=()=>{};
for(const f of ['balance-config.js','save-service.js','core-loop.js','balance.js','zones.js','decor.js'])vm.runInContext(fs.readFileSync(require('path').join(__dirname,'..',f),'utf8'),ctx,{filename:f});
ctx.CafeMap={stop(){},focus(){},measure(){},setBounds(){},state:{s:1,x:0,y:0,W:3600,H:4400}};
vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../game.js'),'utf8'),ctx,{filename:'game.js'});
const g=ctx.__game;
(async()=>{
 assert.equal(g.S.pups.length,1);assert.equal(g.S.tickets,4);
 g.draw(1,()=>.3);assert.equal(g.S.flow,1);assert.equal(g.S.pups.length,2);
 g.startTrain(g.S.pups[0].id,'sit');g.tick(16);assert.equal(g.S.flow,2);assert.equal(g.S.pups[0].skills.sit,1);
 for(let i=0;i<180;i++)g.tick(1);
 const p=g.S.pups[0],coins=g.S.coins,price=g.Core.adoption(p);g.openAdoption(p);get('#okAdopt').onclick();assert.equal(g.S.coins,coins+price);assert.equal(g.S.flow,3);assert.equal(g.S.pups.length,1);
 g.S.tickets=10;g.draw(10,()=>0);assert.equal(g.S.lastDraw.length,10);assert(g.S.drawPending.length);
 const f=g.S.fragments;g.resolveDuplicate(g.S.drawPending[0].id,true);assert.equal(g.S.fragments,f+5);
 while(g.S.drawPending.length)g.resolveDuplicate(g.S.drawPending[0].id,false);
 assert(g.S.waiting.length>0);const happy=g.S.waiting[0].happy;g.tick(30);assert.equal(g.S.waiting[0].happy,happy);
 const reward=async(type,result)=>{const promise=g.rewardTest(type);results.find(b=>b.dataset.rewardResult===result).onclick();return promise;};
 const tickets=g.S.tickets;await reward('ticket','cancelled');assert.equal(g.S.ads.ticket,0);assert.equal(g.S.tickets,tickets);
 await reward('ticket','completed');assert.equal(g.S.ads.ticket,1);assert.equal(g.S.tickets,tickets+1);results[0].onclick();assert.equal(g.S.tickets,tickets+1,'duplicate callback no reward');
 assert.equal(g.adGate('ticket').ok,false);
 g.S.ads=null;
 for(const [type,count] of [['adopt',2],['boost',2],['ticket',1],['demand',2],['offline',3]])for(let i=0;i<count;i++){
  g.S.boostUntil=0;g.S.demandUntil=0;g.S.lastAdoption={coins:5000,claimed:false};g.S.lastOffline={coins:50,claimed:false};await reward(type,'completed');
 }
 assert.equal(g.S.ads.total,10);assert.equal(g.adGate('boost').ok,false);
 assert(g.save());assert.equal(JSON.parse(localStorage.getItem('shibaCafe_v1')).schemaVersion,3);assert(localStorage.getItem('shibaCafe_v1_backup'));
 assert.equal(g.purchaseHook(), 'unavailable');assert.equal(g.shareHook('download'), 'unavailable');assert.equal(g.shareHook('share-1',true),'completed');assert.equal(g.shareHook('share-1',true),'cancelled');
 // Execute the actual migration callbacks through a new game session.
 localStorage.setItem('shibaCafe_v1',JSON.stringify({ver:1,coins:500,pups:[],adopted:[],up:{slots:3,seats:5},last:Date.now()}));
 vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../game.js'),'utf8'),ctx);
 assert.equal(ctx.__game.S.coins,2666);assert.equal(ctx.__game.S.up.slots,undefined);assert.equal(ctx.__game.S.up.seats,5);assert.equal(ctx.__game.S.flow,5);assert.equal(ctx.__game.S.tut,7);assert.equal(ctx.__game.S.schemaVersion,3);
 vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../game.js'),'utf8'),ctx);assert.equal(ctx.__game.S.coins,2666,'refund once after restart');
 localStorage.setItem('shibaCafe_v1','{broken');vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../game.js'),'utf8'),ctx);assert(ctx.__game.saveService.blocked);assert.equal(ctx.__game.save(),false);assert.equal(localStorage.getItem('shibaCafe_v1'),'{broken');
 console.log('ALL PASS (game.js state integration / v1 restart migration / failed save preservation; browser rendering still requires Playwright)');
})().catch(e=>{console.error(e);process.exitCode=1;});
