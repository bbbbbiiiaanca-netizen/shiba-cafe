// 수인님·똑또기 2026-10-15 이동 규칙: 걷기 프레임이 있는 캐릭터만 위치를 옮긴다(프레임을 넘기며).
// 프레임이 없으면 위치 이동 없이 제자리 동작만 한다. 판단: config.characters.walkFrames → 없으면 probe 경로에 파일이 있는지(브라우저 런타임).
import {CFG} from './config.js';
const found=new Map(); // 'shiba/red' → pattern string (probe로 찾은 것)
const keyOf=(kind,key)=>key?`${kind}/${key}`:kind;
export function walkPattern(kind,key){const W=CFG.characters?.walkFrames||{},v=W[kind];const c=v&&typeof v==='object'?v[key]:v;return c||found.get(keyOf(kind,key))||null;}
export const canWalk=(kind,key)=>!!walkPattern(kind,key);
export function walkFrame(kind,key,dir,n){const p=walkPattern(kind,key);return p?p.replace('{dir}',dir).replace('{n}',n):null;}
// 프레임 목록 (보고·테스트용)
export function walkTable(){const W=CFG.characters?.walkFrames||{},out=[];for(const [kind,v] of Object.entries(W)){if(v&&typeof v==='object')for(const key of Object.keys(v))out.push({kind,key,walk:canWalk(kind,key)});else out.push({kind,key:null,walk:canWalk(kind)});}return out;}
export function _setFound(kind,key,pattern){if(pattern)found.set(keyOf(kind,key),pattern);else found.delete(keyOf(kind,key));}
// 브라우저: config에 없는 캐릭터는 probe 경로의 첫 프레임이 실제로 있으면 자동으로 걷기 켬
export function installWalkProbe(onFound=()=>{}){if(typeof Image==='undefined')return;const C=CFG.characters||{},W=C.walkFrames||{};
 for(const [kind,v] of Object.entries(W)){const keys=v&&typeof v==='object'?Object.keys(v):[null];for(const key of keys){if(canWalk(kind,key))continue;
  const folder=key?`${kind}-${key}`:kind,pattern=C.probe.replace('{key}',folder),im=new Image();im.onload=()=>{if(im.naturalWidth){_setFound(kind,key,pattern);onFound(kind,key);}};im.onerror=()=>{};im.src=pattern.replace('{dir}',C.probeDir).replace('{n}',1);}}}
