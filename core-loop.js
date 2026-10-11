/* RNG 주입 가능한 뽑기/성장 순수 로직. */
(function(root){'use strict';
const C=typeof module!=='undefined'&&module.exports?require('./balance-config'):root.BalanceConfig;
const ranks=['N','R','SR','SSR'];
function init(s){
 s.tickets ??= C.draw.tutorialTickets;s.fragments ??= 0;s.waiting ||= [];s.drawPending ||= [];
 s.pity ||= {R:0,SR:0,SSR:0};s.discovered ||= {...s.dex};s.scarves ||= {};s.missedDiscovery ??= 0;s.drawCount ??= 0;
 s.daily ||= {};s.settings ||= {bgm:false,ambient:false};s.flow ??= s.tut>=7?5:0;s.queue=[];
 for(const p of [...s.pups,...s.waiting]){if(p.coat==='cream')p.coat='white';p.rarity ||= 'N';p.level ||= 1;s.discovered[p.coat+'_'+p.trait]=1;s.scarves[p.coat+'_'+p.trait+'_'+p.rarity]=1;}
 return s;
}
function distribution(s){let floor=0;if(s.pity.SSR>=C.draw.pity.SSR-1)floor=3;else if(s.pity.SR>=C.draw.pity.SR-1)floor=2;else if(s.pity.R>=C.draw.pity.R-1)floor=1;
 const allowed=ranks.slice(floor),sum=allowed.reduce((n,r)=>n+C.draw.probabilities[r],0);
 return Object.fromEntries(ranks.map(r=>[r,allowed.includes(r)?C.draw.probabilities[r]/sum*100:0]));
}
function roll(s,rng=Math.random){
 const probs=distribution(s);let x=rng()*100,rarity='SSR';for(const r of ranks){x-=probs[r];if(x<0){rarity=r;break;}}
 const rank=ranks.indexOf(rarity);for(const r of ['R','SR','SSR'])s.pity[r]=rank>=ranks.indexOf(r)?0:s.pity[r]+1;
 const missing=C.draw.identities.filter(k=>!s.discovered[k]);const pool=missing.length&&s.missedDiscovery>=C.draw.discoveryPity-1?missing:C.draw.identities;
 const identity=pool[Math.min(pool.length-1,Math.floor(rng()*pool.length))],fresh=!s.discovered[identity];
 s.missedDiscovery=fresh?0:(missing.length?s.missedDiscovery+1:s.missedDiscovery);s.discovered[identity]=1;s.scarves[identity+'_'+rarity]=1;s.drawCount++;
 return {identity,rarity,fresh};
}
const multiplier=p=>C.rarity[p.rarity||'N']*(1+C.level.growth*((p.level||1)-1));
const training=p=>Math.min(C.adoption.trainingMax,Object.values(p.skills||{}).filter(v=>v>0).length);
const adoption=p=>Math.floor(C.adoption.base*multiplier(p)*(1+C.adoption.training*training(p)));
const levelCost=p=>({fragments:C.level.fragmentCoefficient*(p.level||1),coins:C.level.coinCoefficient*(p.level||1)**2});
function decorEffect(s){const count=new Set(Object.values(s.slots||{}).filter(id=>C.decor.ids.includes(id))).size,bonus=count===C.decor.ids.length?C.decor.setBonus:0;return {count,demand:Math.min(C.decor.demandCap,count*C.decor.demand+bonus),stay:Math.min(C.decor.stayCap,count*C.decor.stay+bonus)};}
const api={init,distribution,roll,multiplier,training,adoption,levelCost,decorEffect};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CafeCore=api;
})(this);
