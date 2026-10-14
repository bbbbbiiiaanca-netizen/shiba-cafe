// §16-1 bottom tab row (수인님 확정 2026-10-14): one icon row at the very bottom, merging the big menus (가게 관리·알바·미션·가구·상점)
// with the old list-panel tabs (메뉴/시바/가구/가게). Mapping in SPEC-V3-NOTES.md '§16 tabs'.
// Icons are existing confirmed images only; icon:null → text label only (art request in SPEC-V3-NOTES.md '§16 art requests').
import {CFG,isUnset} from './config.js';
import * as S from './sim.js';

export const TABS=[
 {id:'shiba',label:'시바',icon:'shiba'}, // 'shiba' = portrait of the first owned shiba (assets/drive/shiba-<breed>.png)
 {id:'alba',label:'알바',icon:null},
 {id:'manage',label:'가게 관리',icon:'assets/drive/M-01-iced-americano_512.png',main:true}, // main item: menu development + café
 {id:'mission',label:'미션',icon:null}, // stub '준비 중'
 {id:'furniture',label:'가구',icon:'assets/drive/ui/ui-icon-tea-table.png'},
 {id:'shop',label:'상점',icon:null}];
export const DEFAULT_TAB='manage';

// 알바 can be hired right now (same checks as hireAlba; null cost never counts).
export function albaAvailable(s,now){
 for(const kind of ['manager','daycare','walk','trainer']){const A=CFG.alba[kind];if(!A||isUnset(A.cost))continue;
  if(kind==='manager'){if(!S.albaCheck(s,kind,[],now))return true;continue;}
  for(const sh of s.shibas){if(kind==='trainer'?CFG.tricks.some(t=>!S.albaCheck(s,kind,[sh.id],now,t.id)):!S.albaCheck(s,kind,[sh.id],now))return true;}}
 return false;}

// Red dots come only from real state. seen.menuDone = a development finished and the player has not opened 가게 관리 / 메뉴 개발 since.
export function tabBadges(s,now,seen={}){
 const manage=!!seen.menuDone||(!s.menuDev&&CFG.menu.items.some(m=>!S.menuCheck(s,m.id)));
 const shiba=s.shibas.some(sh=>sh.status==='injured'||sh.status==='sick'||!S.levelUpCheck(s,sh.id));
 return {shiba,alba:albaAvailable(s,now),manage,mission:false,furniture:false,shop:false};}
