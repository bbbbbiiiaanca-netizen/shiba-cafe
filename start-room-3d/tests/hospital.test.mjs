// 병원 화면 (2026-10-16): pure helpers, config art, unchanged costs/stays, i18n, P.hospital wiring.
import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';
import {CFG} from '../config.js';import * as S from '../sim.js';import * as H from '../hospital.js';import {STR,makeT} from '../i18n.js';
const root=new URL('../',import.meta.url),main=readFileSync(new URL('main.js',root),'utf8');
const sh=(id,o)=>({id,breed:'red',name:'',...o});

// patients: admitted first, then injured/sick; healthy left out; state order kept
const s={shibas:[sh(1,{status:'ok'}),sh(2,{status:'sick'}),sh(3,{status:'hospital',hospitalKind:'snake',hospitalUntil:5000}),sh(4,{status:'injured',injury:'light'}),sh(5,{status:'hospital',hospitalKind:'sick',hospitalUntil:9000})]};
const p=H.hospitalPatients(s);
assert.deepEqual(p.admitted.map(x=>x.id),[3,5]);assert.deepEqual(p.waiting.map(x=>x.id),[2,4]);
assert.deepEqual(H.hospitalPatients({shibas:[sh(1,{status:'ok'})]}),{admitted:[],waiting:[]});assert.deepEqual(H.hospitalPatients(null),{admitted:[],waiting:[]});

// kind / time / art guards (missing → null → '미정' on screen)
assert.equal(H.hospitalKindOf(s.shibas[1]),'sick');assert.equal(H.hospitalKindOf(s.shibas[2]),'snake');assert.equal(H.hospitalKindOf(s.shibas[3]),'light');
assert.equal(H.hospitalKindOf(sh(9,{status:'hospital'})),null);assert.equal(H.hospitalKindOf(sh(9,{status:'injured',injury:'bogus'})),null);
assert.equal(H.hospitalLeftSec(s.shibas[2],2000),3);assert.equal(H.hospitalLeftSec(s.shibas[2],9000),0);
for(const u of [undefined,null,NaN,'x'])assert.equal(H.hospitalLeftSec(sh(9,{status:'hospital',hospitalUntil:u}),0),null);
assert.equal(H.hospitalLeftSec(s.shibas[2],undefined),null);

// four breeds → their own bandage pose (one pose for injured and sick); files exist; unknown breed → null
const A=CFG.hospitalArt;assert.equal(A.background,'assets/drive/bg-hospital-clinic.png');assert.ok(existsSync(new URL(A.background,root)));
for(const b of ['red','sesame','kuro','white']){const src=H.hospitalArtFor(A,b);assert.equal(src,`assets/drive/hospital/sick-${b}-bandage.png`);assert.ok(existsSync(new URL(src,root)),src);}
assert.equal(H.hospitalArtFor(A,'cream'),null);assert.equal(H.hospitalArtFor({},'red'),null);assert.equal(H.hospitalArtFor(undefined,'red'),null);

// numbers come from CFG.hospital unchanged
assert.deepEqual(CFG.hospital.stays,{light:1800,snake:7200,sick:14400});
assert.deepEqual(CFG.hospital.costs,[[1,400,1200,2400],[10,500,1500,3000],[20,800,2400,4700],[30,1000,3000,6100],[40,1100,3400,6800]]);
const g=S.newState(0);for(const [lv,light,snake,sick] of [[1,400,1200,2400],[25,800,2400,4700],[40,1100,3400,6800]]){g.cafe.level=lv;
 assert.deepEqual(H.hospitalNumbers(S,CFG,g,'light'),{cost:light,stay:1800});assert.deepEqual(H.hospitalNumbers(S,CFG,g,'snake'),{cost:snake,stay:7200});assert.deepEqual(H.hospitalNumbers(S,CFG,g,'sick'),{cost:sick,stay:14400});}
assert.deepEqual(H.hospitalNumbers(S,CFG,g,null),{cost:null,stay:null});assert.deepEqual(H.hospitalNumbers(S,CFG,g,'bogus'),{cost:null,stay:null});
// admission still uses the existing sim logic (cost taken, stay set)
{const t=S.newState(0);S.chooseStart(t,'red','',S.rng(1),0);const d=t.shibas[0];d.status='injured';d.injury='snake';t.coins=1200;
 assert.ok(S.sendToHospital(t,d.id,1000));assert.equal(t.coins,0);assert.equal(d.hospitalKind,'snake');assert.equal(H.hospitalLeftSec(d,1000),7200);
 const e=S.newState(0);S.chooseStart(e,'kuro','',S.rng(1),0);e.shibas[0].status='sick';e.coins=10;assert.equal(S.hospitalCheck(e,e.shibas[0].id),'coins');}

// village: hospital sticker art on lot 0, file exists, size matches the PNG header
const V=CFG.village,hp=V.places.find(x=>x.id==='hospital');
assert.equal(hp.lot,0);assert.equal(hp.art.src,'assets/drive/village/place-hospital.png');
const png=readFileSync(new URL(hp.art.src,root));assert.deepEqual([png.readUInt32BE(16),png.readUInt32BE(20)],hp.art.size);
assert.ok(hp.art.anchor.length===2&&hp.art.scale>0);const l=V.lots[0],k=hp.art.scale;
assert.ok(l.x-hp.art.anchor[0]*k>=0&&l.x+(hp.art.size[0]-hp.art.anchor[0])*k<=V.size[0]&&l.y-hp.art.anchor[1]*k>=0,'art stays on the map');
assert.ok(V.places.filter(x=>x.id!=='hospital').every(x=>x.art===null),'other places unchanged');

// i18n: ko + en for every hospital screen key; '미정' / 'TBD'
const ko=makeT(()=>'ko'),en=makeT(()=>'en');
for(const k of ['place.hospital','hosp.none','hosp.treat','hosp.admitted','hosp.waiting','st.hospital','care.hospital','care.hospitalNo','inj.light','inj.snake','inj.sick','app.unset']){assert.ok(STR.ko[k]&&STR.en[k],k);}
assert.equal(ko('hosp.admitted'),'입원 중');assert.equal(ko('hosp.waiting'),'치료 대기');assert.equal(en('hosp.admitted'),'In hospital');assert.equal(en('hosp.waiting'),'Waiting for care');
assert.equal(ko('app.unset'),'미정');

// P.hospital wiring: pure helpers + existing sim functions, no hard-coded numbers, no rare coats
const ph=main.slice(main.indexOf('P.hospital='),main.indexOf('\n',main.indexOf("return {title:L('place.hospital')")));
for(const f of ['hospitalPatients','hospitalKindOf','hospitalLeftSec','hospitalArtFor','hospitalNumbers','S.hospitalCheck','data-act="hospital"',"L('app.unset')","L('hosp.none')"])assert.ok(ph.includes(f),f);
assert.doesNotMatch(ph,/\b(1800|7200|14400|400|1200|2400)\b|coats|rare/);
assert.match(main,/villageHospital:\(\)=>open\('hospital'\)/);
console.log('hospital ok');
