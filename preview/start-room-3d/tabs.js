// §16-1 bottom tab row (수인님 확정 2026-10-14): one icon row at the very bottom, merging the big menus with the old list-panel tabs
// (메뉴/시바/가구/가게). §17 (2026-10-14): five tabs with 가게 관리 in the centre; 미션 moved to a small top-right button.
// Mapping in SPEC-V3-NOTES.md '§16 tabs' / '§17'.
// Icons are existing confirmed images only; icon:null → text label only (art request in SPEC-V3-NOTES.md '§16 art requests').
import {CFG,isUnset} from './config.js';
import * as S from './sim.js';

export const TABS=[
 {id:'shiba',label:'시바',icon:'shiba'}, // 'shiba' = portrait of the first owned shiba (assets/drive/shiba-<breed>.png)
 {id:'alba',label:'알바',icon:'assets/drive/ui/tab-alba.png'},
 {id:'manage',label:'가게 관리',icon:'assets/drive/M-01-iced-americano_512.png',main:true}, // main item (centre): café status + 메뉴 개발 / 업그레이드 / 손익계산서
 {id:'furniture',label:'가구',icon:'assets/drive/ui/ui-icon-tea-table.png'},
 {id:'shop',label:'상점',icon:'assets/drive/ui/tab-shop.png'}];
export const DEFAULT_TAB='manage';

// 알바 can be hired right now (same checks as hireAlba; null cost never counts).
export function albaAvailable(s,now){
 for(const kind of ['manager','daycare','walk','trainer']){const A=CFG.alba[kind];if(!A||isUnset(A.cost))continue;
  if(kind==='manager'){if(!S.albaCheck(s,kind,[],now))return true;continue;}
  for(const sh of s.shibas){if(kind==='trainer'?CFG.tricks.some(t=>!S.albaCheck(s,kind,[sh.id],now,t.id)):!S.albaCheck(s,kind,[sh.id],now))return true;}}
 return false;}

// Red dots come only from real state. seen.menuDone = a development finished and the player has not opened 가게 관리 / 메뉴 개발 since.
// 시바 also lights for a returned walk whose result is still waiting (s.walkResults).
export function tabBadges(s,now,seen={}){
 const manage=!!seen.menuDone||(!s.menuDev&&CFG.menu.items.some(m=>!S.menuCheck(s,m.id)))||Object.keys(CFG.upgrades).some(k=>!S.upgradeCheck(s,k));
 const shiba=s.shibas.some(sh=>sh.status==='injured'||sh.status==='sick'||!S.levelUpCheck(s,sh.id))||s.walkResults.length>0;
 return {shiba,alba:albaAvailable(s,now),manage,furniture:false,shop:false};}
