// i18n: language choice (resolveLang), fallback order (STR[lang] → STR.ko → key), confirmed-only English,
// config data names mirrored in STR, every literal key used by the screen code exists in STR.ko.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {STR,LANGS,makeT,resolveLang,t,tf,setLangSource,formatPrice} from '../i18n.js';
import {CFG} from '../config.js';
const root=new URL('../',import.meta.url);

// resolveLang: saved 'ko'/'en' wins; otherwise device language 'ko…' → ko, anything else → en
assert.equal(resolveLang('ko','en-US'),'ko');
assert.equal(resolveLang('en','ko-KR'),'en');
for(const saved of [null,undefined,'','fr','KO'])assert.equal(resolveLang(saved,'ko-KR'),'ko');
for(const dev of ['ko','ko-KR','KO-kr'])assert.equal(resolveLang(null,dev),'ko');
for(const dev of ['en-US','ja-JP','fr','',undefined,null])assert.equal(resolveLang(null,dev),'en');
assert.deepEqual(LANGS,['ko','en']);

// English holds only confirmed strings: language names + breed names
assert.deepEqual(Object.keys(STR.en).sort(),['lang.name.en','lang.name.ko','shiba.breed.kuro','shiba.breed.red','shiba.breed.sesame','shiba.breed.white']);
assert.equal(STR.en['shiba.breed.red'],'Shiru');assert.equal(STR.en['shiba.breed.sesame'],'Chamkkae');
assert.equal(STR.en['shiba.breed.kuro'],'Kuro');assert.equal(STR.en['shiba.breed.white'],'Yuki');
for(const k of Object.keys(STR.en))assert.ok(k in STR.ko,'en key also in ko: '+k);

// fallback: STR[lang][key] → STR.ko[key] → key; {vars} filled in either language
const en=makeT(()=>'en'),ko=makeT(()=>'ko');
assert.equal(en('shiba.breed.red'),'Shiru');assert.equal(ko('shiba.breed.red'),STR.ko['shiba.breed.red']);
assert.equal(en('app.close'),STR.ko['app.close'],'untranslated key falls back to Korean');
assert.equal(en('app.locked',{lv:15}),'Lv15 해금');
assert.equal(en('no.such.key'),'no.such.key');assert.equal(ko('no.such.key'),'no.such.key');
assert.equal(makeT(()=>null)('app.close'),STR.ko['app.close'],'no language → Korean');
assert.equal(makeT(()=>'fr')('app.close'),STR.ko['app.close'],'unknown language → Korean');
// shared translator: Korean until main.js points it at the player's language
assert.equal(t('app.close'),STR.ko['app.close']);
setLangSource(()=>'en');assert.equal(t('shiba.breed.kuro'),'Kuro');assert.equal(t('app.ok'),STR.ko['app.ok']);setLangSource(()=>'ko');
assert.equal(tf('no.such.key','fallback'),'fallback');assert.equal(tf('app.ok','x'),STR.ko['app.ok']);

// config.js keeps its Korean names as data; the screen text by key must be identical
const same=(key,v)=>assert.equal(STR.ko[key],v,key);
CFG.cooking.recipes.forEach(r=>{if(r.name!=null)same('recipe.'+r.id,r.name);});
for(const [id,it] of Object.entries(CFG.ingredients))same('ingredient.'+id,it.name);
for(const q of CFG.quests.daily.tasks)same('quest.task.'+q.id,q.name);
for(const [breed,p] of Object.entries(CFG.profiles)){same(`profile.${breed}.intro`,p.intro);same(`profile.${breed}.favSnack`,p.favSnack.name);same(`profile.${breed}.favPlay`,p.favPlay.name);}
CFG.tutorial.steps.forEach((st,i)=>same('tutorial.'+(i+1),st.text));
for(const it of CFG.heartUse.items){same('heart.item.'+it.id,it.name);same(`heart.item.${it.id}.line`,it.line);}
for(const th of CFG.themes)same('theme.'+th.id,th.name);
for(const it of CFG.furniture.items)same('furn.'+it.id,it.name);
CFG.accessory.bandana.colors.forEach((c,i)=>same('acc.color.'+c,CFG.accessory.bandana.colorNames[i]));
for(const p of CFG.village.places)same('place.'+p.id,p.name);

// every literal key the screen code asks for exists in STR.ko
const files=['main.js','tabs.js','effects.js','q1715.js','q17.js','sim.js','run.js','isomap.js','figures.js'];
const missing=[];
for(const f of files){const src=readFileSync(new URL(f,root),'utf8');
 for(const m of src.matchAll(/\b(?:L|t|tx|tf|LF)\('([A-Za-z][\w.\-]*)'[,)]/g))if(!(m[1] in STR.ko))missing.push(f+': '+m[1]);}
const html=readFileSync(new URL('index.html',root),'utf8');
for(const m of html.matchAll(/data-i18n="([^"]+)"/g))if(!(m[1] in STR.ko))missing.push('index.html: '+m[1]);
for(const m of html.matchAll(/data-i18n-attr="([^"]+)"/g))for(const p of m[1].split(';')){const k=p.split(':')[1];if(!(k in STR.ko))missing.push('index.html: '+k);}
assert.deepEqual(missing,[]);
// index.html fixed text lives in STR (comments aside, no Hangul left in the markup body)
assert.doesNotMatch(html.slice(html.indexOf('</style>')),/[가-힣]/);

// formatPrice: Intl currency text only (no price is wired to it)
assert.match(formatPrice(1000,'KRW','ko-KR'),/1,000/);
assert.match(formatPrice(4.99,'USD','en-US'),/^\$4\.99$/);
assert.equal(typeof formatPrice(1,'USD'),'string');

console.log(`i18n: resolveLang, fallback ko→key, en confirmed-only (${Object.keys(STR.en).length}), config names in sync, ${Object.keys(STR.ko).length} ko keys, used keys present, formatPrice passed`);
