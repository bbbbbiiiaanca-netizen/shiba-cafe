// 테마 방 그림(후지산·대나무): 경로·크기, 보유 확인, 저장/이전 저장, 다다미와 같은 위치·크기 그리기, 상점 카드 그림.
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
if(!globalThis.crypto)Object.defineProperty(globalThis,'crypto',{value:webcrypto});
import {readFileSync} from 'node:fs';
import {CFG} from '../config.js';
import {restoreSpace,roomFile,zonesForSpace,ROOM_BG} from '../map-data.js';
import * as S from '../sim.js';
import * as Q from '../q1715.js';
const size=f=>{const png=readFileSync(new URL('../'+f,import.meta.url));return [png.readUInt32BE(16),png.readUInt32BE(20)];};

// approved art: paths and same 861×615 as the tatami room
const art=Object.fromEntries(CFG.themes.map(t=>[t.id,t.art]));
assert.deepEqual(art,{tatami:'assets/drive/room-tatami-noline.png',fuji:'assets/drive/themes/bg-theme-fuji.png',bamboo:'assets/drive/themes/bg-theme-bamboo.png'});
for(const f of Object.values(art))assert.deepEqual(size(f),[861,615],f);
// prices / unlock rules unchanged
assert.deepEqual(CFG.themes.map(t=>[t.id,t.locked,t.unlockCost,t.unlockDia??null,t.unlockLevel??null]),[['tatami',false,null,null,null],['fuji',true,2400000,1500,20],['bamboo',true,5400000,3000,35]]);

// restore / migration: old saves → tatami; unowned or unknown theme falls back to tatami
assert.equal(restoreSpace(null).theme,'tatami');
assert.equal(restoreSpace({themes:['tatami']}).theme,'tatami');
assert.equal(restoreSpace({themes:['tatami'],theme:'fuji'}).theme,'tatami','unowned theme is not applied');
assert.equal(restoreSpace({themes:['tatami','fuji'],theme:'fuji'}).theme,'fuji');
assert.equal(restoreSpace({themes:['tatami','nope'],theme:'nope'}).theme,'tatami');
assert.equal(restoreSpace({themes:['fuji'],theme:'fuji',flooring:'tatami'}).flooring,'tatami','room theme kept separate from flooring');

// selection: locked themes cannot be applied; existing unlock flow then select
const s=S.newState(0);
assert.equal(S.selectTheme(s,'fuji'),false);assert.equal(s.space.theme,'tatami');
assert.equal(S.selectTheme(s,'nope'),false);
s.cafe.level=35;s.coins=1e8;
assert.equal(S.unlockSpace(s,'theme','fuji','coins'),true);assert.equal(s.coins,1e8-S.spacePrice('theme','fuji','coins',s));
assert.equal(s.space.theme,'tatami','unlocking does not auto-apply');
assert.equal(S.selectTheme(s,'fuji'),true);assert.equal(s.space.theme,'fuji');
assert.equal(S.selectTheme(s,'bamboo'),false);assert.equal(s.space.theme,'fuji');
assert.equal(S.unlockSpace(s,'theme','bamboo','coins'),true);assert.equal(S.selectTheme(s,'bamboo'),true);
// persistence through save/load
const store=new Map(),storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
S.save(storage,s,0);assert.equal(S.load(storage,0).state.space.theme,'bamboo');
assert.equal(S.selectTheme(s,'tatami'),true);S.save(storage,s,0);assert.equal(S.load(storage,0).state.space.theme,'tatami');

// room bitmap: theme art replaces tatami (incl. expanded branch); tatami keeps merged expansion art; 2F untouched
const zone=(space)=>zonesForSpace(space)[0];
assert.equal(roomFile(zone({themes:['tatami']}),0),ROOM_BG);
assert.equal(roomFile(zone({themes:['tatami'],unlockedRows:1}),1),'assets/drive/tiles/room-merged-j.png');
assert.equal(roomFile(zone({themes:['tatami'],unlockedRows:2}),2),'assets/drive/tiles/room-merged-ij.png');
for(const id of ['fuji','bamboo'])for(const rows of [0,1,3])assert.equal(roomFile(zone({themes:['tatami',id],theme:id,unlockedRows:rows}),rows),art[id]);
const z2=zonesForSpace({themes:['tatami','fuji'],theme:'fuji'}).find(z=>z.floor===2);if(z2)assert.equal(roomFile(z2,0),z2.image);

// renderer: theme art drawn at exactly the tatami room rect
const draws=[];
const ctx={fill(){},translate(){},scale(){},setTransform(){},fillRect(){},drawImage(im,...args){draws.push({file:im.file,args});},save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},stroke(){},createRadialGradient(){return {addColorStop(){}};},getImageData(x,y,w,h){return {width:w,height:h,data:new Uint8ClampedArray(w*h*4).fill(255)};}};
globalThis.location={search:''};globalThis.devicePixelRatio=1;globalThis.ResizeObserver=class{observe(){}};
globalThis.Image=class{set src(path){const hd=path.includes('/@2x/'),k=hd?2:1;path=path.replace('/@2x/','/');this.file=path;const png=readFileSync(new URL('../'+(hd?path.replace(/\/([^/]+)$/,'/@2x/$1'):path),import.meta.url));this.naturalWidth=png.readUInt32BE(16)/k;this.naturalHeight=png.readUInt32BE(20)/k;this.complete=true;}};
globalThis.document={createElement(){return {getContext:()=>ctx,classList:{toggle(){}},style:{setProperty(){}},setAttribute(){},querySelector:()=>({disabled:false}),querySelectorAll:()=>[]};}};
const {createIsoMap}=await import('../isomap.js');
const canvas={dataset:{},clientWidth:390,clientHeight:300,getContext:()=>ctx,addEventListener(){},getBoundingClientRect:()=>({left:0,top:0}),setPointerCapture(){}};
const iso=createIsoMap(canvas,{});
const rect=(state)=>{draws.length=0;iso.draw(state,{});const d=draws.filter(x=>Object.values(art).includes(x.file)||x.file.includes('room-merged-'));assert.equal(d.length,1);return d[0];};
for(const rows of [0,3]){
 const st=S.newState(0);st.space.unlockedRows=rows;st.space.themes.push('fuji','bamboo');
 const base=rect(st);assert.equal(base.file,rows?'assets/drive/tiles/room-merged-ij.png':ROOM_BG);
 for(const id of ['fuji','bamboo']){st.space.theme=id;const d=rect(st);assert.equal(d.file,art[id]);assert.deepEqual(d.args,base.args,'same anchor/size as tatami');}
}

// shop theme cards: existing art slot shows theme art (tatami keeps its logo); lock follows ownership
const row=h=>h.split('data-theme-logos>')[1].split('</div>')[0];
const cards=row(Q.shopHtml(CFG,'theme',()=>null,restoreSpace(null)));
assert.match(cards,/ui-theme-logo-tatami\.png/);
for(const id of ['fuji','bamboo'])assert.match(cards,new RegExp(`data-item="${id}"[^>]*><span class="theme-logo-art"[^>]*><img src="assets/drive/themes/bg-theme-${id}\\.png" alt=""><img class="theme-lock"`));
assert.equal((cards.match(/class="theme-logo locked"/g)||[]).length,2);
const owned=row(Q.shopHtml(CFG,'theme',()=>null,restoreSpace({themes:['tatami','fuji']})));
assert.equal((owned.match(/class="theme-logo locked"/g)||[]).length,1);assert.match(owned,/class="theme-logo locked" data-act="shopTheme" data-item="bamboo"/);
assert.doesNotMatch(cards+owned,/coat|rare/i);
console.log('Theme rooms: approved art, ownership, persistence, tatami-aligned draw, shop card art passed');
