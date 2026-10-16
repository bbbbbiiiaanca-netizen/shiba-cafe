// 병원 화면 (2026-10-16): pure helpers for P.hospital in main.js. No new rules — status/kind/time come from sim.js state
// (status 'hospital' + hospitalUntil/hospitalKind, 'injured' + injury, 'sick'); costs/stays stay in CFG.hospital.
export const HOSP_KINDS=['light','snake','sick'];
// 입원 중 (admitted) first, then 치료 대기 (injured/sick, not yet admitted); state order kept inside each group.
export function hospitalPatients(s){const all=s?.shibas||[];
 return {admitted:all.filter(sh=>sh.status==='hospital'),waiting:all.filter(sh=>sh.status==='injured'||sh.status==='sick')};}
// injury kind or null when missing/unknown (→ '미정' on screen)
export function hospitalKindOf(sh){const k=sh.status==='hospital'?sh.hospitalKind:sh.status==='sick'?'sick':sh.injury;return HOSP_KINDS.includes(k)?k:null;}
// seconds left in hospital, or null when hospitalUntil is missing/invalid (never NaN)
export function hospitalLeftSec(sh,now){const u=sh?.hospitalUntil;return Number.isFinite(u)&&Number.isFinite(now)?Math.max(0,(u-now)/1000):null;}
// breed bandage pose (one pose for injured and sick); null when the breed has no art
export function hospitalArtFor(art,breed){const src=art?.sick?.[breed];return typeof src==='string'&&src?src:null;}
// cost/stay for a kind straight from CFG.hospital via the sim functions; null when unknown
export function hospitalNumbers(S,CFG,s,kind){if(!kind)return {cost:null,stay:null};const cost=S.hospitalCost(s,kind),stay=CFG.hospital?.stays?.[kind];
 return {cost:Number.isFinite(cost)?cost:null,stay:Number.isFinite(stay)?stay:null};}
