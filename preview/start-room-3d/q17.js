// Pure, save-compatible §17 rules. No fixture data enters production state.
import {CFG} from './config.js';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
export function initQ17(s){s.friends??=[];s.ingredients??={};s.dishes??={};s.run??={energy:CFG.run.startEnergy,lastScore:null,bestScore:null,level:CFG.run.startLevel,shibas:[]};for(const sh of s.shibas)sh.friends??=[];return s;}
export function visitFriend(s,id,now){initQ17(s);if(!s.friends.some(f=>String(f.id)===String(id)))return false;const day=Math.floor((now+CFG.ledger.dayOffsetMs)/CFG.ledger.periodMs);if(s.friendVisits?.day!==day)s.friendVisits={day,count:0};const v=CFG.heartUse.visit;if(!finite(v.daily)||!finite(v.hearts)||s.friendVisits.count>=v.daily)return false;s.friendVisits.count++;s.hearts+=v.hearts;return true;}
export const recipeName=(r,i)=>r.name??`요리 ${i+1} 미정`;
export function recipeUnlocked(s,r){const i=CFG.cooking.recipes.indexOf(r);return i>=0&&(i<CFG.cooking.startUnlocked||(finite(r.unlockLevel)&&s.cafe.level>=r.unlockLevel));}
export function craftCheck(s,r){initQ17(s);return !r||!Number.isSafeInteger(CFG.cooking.dishesPerCraft)||CFG.cooking.dishesPerCraft<=0||!recipeUnlocked(s,r)||s.craft||!finite(r.craftSec)||r.craftSec<CFG.cooking.craftSecRange[0]||r.craftSec>CFG.cooking.craftSecRange[1]||!r.ingredients||!Object.keys(r.ingredients).length||Object.entries(r.ingredients).some(([id,n])=>!CFG.ingredients[id]||!finite(n)||n<=0||(s.ingredients[id]||0)<n);}
// starting value 2026-10-15, pending user confirm: a single active craft timer.
export function craft(s,id,now){const r=CFG.cooking.recipes.find(r=>r.id===id);if(craftCheck(s,r))return false;for(const [id,n] of Object.entries(r.ingredients))s.ingredients[id]-=n;s.craft={id,until:now+r.craftSec*1000};return true;}
export function settleCraft(s,now){initQ17(s);if(!s.craft||s.craft.until>now)return false;s.dishes[s.craft.id]=(s.dishes[s.craft.id]||0)+CFG.cooking.dishesPerCraft;s.craft=null;return true;}
export function buyIngredient(s,id){initQ17(s);const p=CFG.ingredients[id]?.price;const n=CFG.cooking.ingredientBuyCount;if(!finite(p)||p<0||!Number.isSafeInteger(n)||n<=0||!finite(s.coins)||s.coins<p*n)return false;s.coins-=p*n;s.ingredients[id]=(s.ingredients[id]||0)+n;return true;}
export function feedCheck(s,sh,id){const r=CFG.cooking.recipes.find(r=>r.id===id);return !sh||!r||!(s.dishes?.[id]>0)||!finite(r.effect.full)||!finite(r.effect.happy)||!finite(sh.g.full)||!finite(sh.g.happy);}
export function feedDish(s,sh,id){if(feedCheck(s,sh,id))return false;const e=CFG.cooking.recipes.find(r=>r.id===id).effect;s.dishes[id]--;for(const k of ['full','happy'])sh.g[k]=Math.max(0,Math.min(100,sh.g[k]+e[k]));return true;}
// scoreToReward is a score-threshold table: [{score,ingredients:{id:count}}]. No default curve.
export function runRewards(s){const t=CFG.run.scoreToReward;if(!finite(s.run?.lastScore)||!Array.isArray(t))return null;const row=[...t].filter(r=>finite(r.score)&&r.score<=s.run.lastScore).sort((a,b)=>b.score-a.score)[0];if(!row?.ingredients||!Object.keys(row.ingredients).length||Object.entries(row.ingredients).some(([id,n])=>!CFG.ingredients[id]||!finite(n)||n<0))return null;return row.ingredients;}
export function skipRun(s){initQ17(s);const rewards=runRewards(s);if(!rewards||!finite(s.run.energy)||s.run.energy<CFG.run.skipEnergy)return false;s.run.energy-=CFG.run.skipEnergy;for(const [id,n] of Object.entries(rewards))s.ingredients[id]=(s.ingredients[id]||0)+n;return true;}
export function rewardSnapshot(s){return {coins:s.coins,dia:s.dia,hearts:s.hearts,items:{...s.items},paws:Object.fromEntries(s.shibas.map(sh=>[sh.id,sh.paws]))};}
export function rewardDiff(before,s){const out=[];for(const k of ['coins','dia','hearts'])if(finite(before[k])&&s[k]>before[k])out.push({id:k,n:s[k]-before[k]});for(const [id,n] of Object.entries(s.items))if(n>(before.items[id]||0))out.push({id,n:n-(before.items[id]||0)});for(const sh of s.shibas)if(sh.paws>(before.paws[sh.id]||0))out.push({id:'paws',n:sh.paws-(before.paws[sh.id]||0)});return out;}

// §17-13 재료 달리기 (시작값 2026-10-15): 하루 무료 판 + 광고(스텁) 추가 판, 보상 지급, 오늘 최고 점수. Day = existing KST ledger day.
const runDayKey=now=>Math.floor((now+CFG.ledger.dayOffsetMs)/CFG.ledger.periodMs);
export function runDay(s,now=Date.now()){initQ17(s);const k=runDayKey(now);if(s.run.day?.key!==k)s.run.day={key:k,played:0,ads:0,best:null};return s.run.day;}
export function runPlaysLeft(s,now=Date.now()){const d=runDay(s,now),c=CFG.run.daily;return Math.max(0,c.free+d.ads*c.adExtra-d.played);}
export function runAdsLeft(s,now=Date.now()){if(!CFG.run.adsEnabled)return 0;return Math.max(0,CFG.run.daily.adMax-runDay(s,now).ads);}
export function claimRunAd(s,now=Date.now()){if(!runAdsLeft(s,now))return false;const d=runDay(s,now);d.ads++;s.run.adLog??={};s.run.adLog[d.key]=(s.run.adLog[d.key]||0)+CFG.run.daily.adExtra;return true;} // adLog: 날짜(KST ledger day)별 광고로 받은 판 수 // 광고 SDK 스텁: 시청 완료로 처리
export function startRunPlay(s,now=Date.now()){if(!runPlaysLeft(s,now))return false;runDay(s,now).played++;return true;}
export function finishRun(s,r,now=Date.now()){const c=CFG.run,d=runDay(s,now);if(finite(c.coinValue))s.coins=(s.coins||0)+r.coins*c.coinValue;
 if(c.grantIngredients)for(const [k,n] of Object.entries(r.got))s.ingredients[k]=(s.ingredients[k]||0)+n;
 s.run.lastScore=r.score;s.run.bestScore=Math.max(s.run.bestScore??0,r.score);d.best=Math.max(d.best??0,r.score);return d.best;}
