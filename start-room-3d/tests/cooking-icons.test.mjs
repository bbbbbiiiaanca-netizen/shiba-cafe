import assert from 'node:assert/strict';import {existsSync,readFileSync} from 'node:fs';import {runInNewContext} from 'node:vm';
import {CFG} from '../config.js';import * as S from '../sim.js';import * as Q from '../q17.js';import {cookingFx} from '../effects.js';
import {HD_FILES,hdPath} from '../hd-assets.js';import {makeT} from '../i18n.js';
// 요리 효과 아이콘(배고픔·행복)과 잠긴 카드 그림(Lv3·Lv5): config 경로 → 파일(@2x 포함) → HD 목록 → 실제 렌더 HTML
const ROOT=new URL('../',import.meta.url),has=p=>existsSync(new URL(p,ROOT));
const FX={full:'assets/drive/ui/icon-hunger.png',happy:'assets/drive/ui/icon-happy.png'};
const LOCKED=[[3,'assets/drive/cooking/dish-locked-lv3.png'],[5,'assets/drive/cooking/dish-locked-lv5.png']];
assert.deepEqual(CFG.cooking.fxIcons,FX);
assert.deepEqual(CFG.cooking.lockedPreview.map(x=>[x.unlockLevel,x.img]),LOCKED);
for(const p of [...Object.values(FX),...LOCKED.map(x=>x[1])]){assert.ok(has(p),p);assert.ok(has(hdPath(p)),hdPath(p));assert.ok(HD_FILES.has(p),'HD_FILES '+p);
 const b=readFileSync(new URL(p,ROOT)),b2=readFileSync(new URL(hdPath(p),ROOT));assert.equal(b.toString('latin1',1,4),'PNG');assert.equal(b2.readUInt32BE(16),b.readUInt32BE(16)*2,p+' @2x width');}
// production renderers + production img() (srcset 2x for HD_FILES)
const main=readFileSync(new URL('main.js',ROOT),'utf8'),koL=makeT(()=>'ko');
const imgSrc=main.match(/^const img=.*$/m)[0];
const renderSource=main.slice(main.indexOf('function furnitureShop(){'),main.indexOf('game.openExpand=openExpand;'));
const s=S.newState(0);S.chooseStart(s,'red','',S.rng(1),0);Q.initQ17(s);
const P={},ui={};
runInNewContext(imgSrc+';'+renderSource,{RELEASE:false,HD_FILES,hdPath,L:koL,LF:(k,fb)=>{const v=koL(k);return v===k?fb:v;},temp:false,Q:new URLSearchParams(),P,ui,s,Q17:Q,CFG,S,clock:{now:()=>0},
 IMG:{shiba:b=>'assets/drive/shiba-'+b+'.png'},slot:(l,w,h)=>`<span class="slot" style="width:${w}px;height:${h}px">${l}</span>`,nameOf:sh=>sh.name||sh.breed,priceText:n=>n==null?'미정':String(n),cookingFx,fmt:String,itemIcon:()=>'',RES:{},tfmt:String});
const fxOf=(html,k)=>html.match(new RegExp(`<span class="cook-fx-item" data-fx="${k}"[^>]*>(.*?)</span>`))?.[1];
const previews=html=>html.match(/<button class="cook2-card locked preview"[^]*?<\/button>/g)||[];
for(const r of CFG.cooking.recipes){ui.recipe=r.id;const html=P.cooking().html;
 for(const [k,w] of [['full','배고픔'],['happy','행복']]){const inner=fxOf(html,k);
  assert.equal(inner,`<img src="${FX[k]}" srcset="${hdPath(FX[k])} 2x" alt="${w}" draggable="false">+${r.effect[k]}`,r.id+' '+k);}
 const pv=previews(html);assert.equal(pv.length,2);
 pv.forEach((b,i)=>{assert.ok(b.includes(`<img src="${LOCKED[i][1]}" srcset="${hdPath(LOCKED[i][1])} 2x"`),b);assert.ok(!b.includes('class="slot"'),b);assert.ok(b.includes(`Lv${LOCKED[i][0]} 해금`),b);});}
// 그림이 없으면 기존 그대로: 효과는 글자+숫자, 잠긴 카드는 빈 그림 칸
{const fx0=CFG.cooking.fxIcons,lp0=CFG.cooking.lockedPreview;
 try{CFG.cooking.fxIcons={full:null,happy:null};CFG.cooking.lockedPreview=lp0.map(({img,...x})=>x);ui.recipe=null;const html=P.cooking().html,r=CFG.cooking.recipes[0];
  assert.equal(fxOf(html,'full'),'배고픔 +'+r.effect.full);assert.equal(fxOf(html,'happy'),'행복 +'+r.effect.happy);
  const pv=previews(html);assert.equal(pv.length,2);pv.forEach(b=>{assert.ok(b.includes('<span class="slot" style="width:42px;height:42px">'),b);assert.ok(!/<img src="assets\/drive\/cooking/.test(b),b);});}
 finally{CFG.cooking.fxIcons=fx0;CFG.cooking.lockedPreview=lp0;}}
console.log('cooking-icons ok: fx icon+number, locked Lv3/Lv5 art, @2x srcset, text/slot fallback');
