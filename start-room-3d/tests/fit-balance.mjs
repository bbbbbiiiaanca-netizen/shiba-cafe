// Offline calibration utility; run balance-sim.mjs first. All fitted values are
// starting value 2026-10-15, pending user confirm.
import {readFileSync,writeFileSync} from 'node:fs';
import {CFG} from '../config.js';
const rows=JSON.parse(readFileSync(new URL('./balance-results.json',import.meta.url)));
const targets=[[1,0],[10,10],[20,80],[30,215],[40,425],[50,735]];
const table=[];let day=0;
for(let lv=1;lv<50;lv++){
 const a=targets.findLast(x=>x[0]<=lv),b=targets.find(x=>x[0]>lv);
 const next=a[1]+(b[1]-a[1])*(lv+1-a[0])/(b[0]-a[0]);
 const boostedDays=Math.max(0,Math.min(next,14)-Math.min(day,14));
 const rate=rows[lv-1]['served/hour']*20*1.1;
 table.push(Math.round(rate*(next-day+boostedDays*.5)));day=next;
}
const config=new URL('../config.js',import.meta.url);
let source=readFileSync(config,'utf8');
source=source.replace(/\/\/ 카페 레벨 경험치[\s\S]*?(?=export const CFG)/,`// Café EXP fitted from tests/balance-results.json, 20h/day, mean XP 1.1, ×1.5 first 14 days.\n// starting value 2026-10-15, pending user confirm: seat schedule 2→20; target days 10/80/215/425/735.\nconst CAFE_EXP=${JSON.stringify(table)};\n\n`);
writeFileSync(config,source);
let elapsed=0;const days=[0];
for(let lv=1;lv<50;lv++){let amount=table[lv-1],rate=rows[lv-1]['served/hour']*20*1.1;if(elapsed<14){const early=Math.min(amount,rate*1.5*(14-elapsed));elapsed+=early/(rate*1.5);amount-=early;}elapsed+=amount/rate;days.push(elapsed);}
let notes='# 2026-10-15 좌석 성장 반영 EXP 보정\n\n외부 `시바카페_밸런스_2년.md`에 추가할 섹션. 기존 문서는 보존한다.\n\n모든 보정 수치: starting value 2026-10-15, pending user confirm. 하루 20시간, 평균 EXP 1.1, 첫 14일 ×1.5. 보상 좌석은 round(2+18×(L−1)/49). 기본 가구를 유지하고 8줄 확장한 측정 배치에 보상 좌석을 배치했다. 모든 해금 시바 칸을 채웠으며, 15분 × 1 seed, dt 1초로 생산 시뮬레이터를 측정했다. 짧은 단일 시드 표본의 시간당 환산이며 장시간 또는 여러 시드의 검증은 아직 하지 않았다. 플레이어의 실제 배치·관리·구매에 따라 기간은 달라진다.\n\n이전 90/hour per cap 가정은 폐기한다. 아래 served/hour per seat는 좌석당 실측 처리량이며 고정 90을 가정하지 않는다.\n\n|Lv|좌석|served/hour|served/hour per seat|다음 EXP|누적 일수|\n|---|---|---|---|---|---|\n';
for(const r of rows)notes+=`|${r.Lv}|${r.seats}|${r['served/hour'].toFixed(2)}|${r['served per seat-hour'].toFixed(2)}|${table[r.Lv-1]??'최고 레벨'}|${days[r.Lv-1].toFixed(3)}|\n`;
notes=notes.replace('15분 × 1 seed',`${rows[0].hours*60}분 × ${rows[0].seeds} seed`);
notes+='\nEXP 전체 표: `'+JSON.stringify(table)+'`\n';
writeFileSync(new URL('../BALANCE-2Y-2026-10-15.md',import.meta.url),notes);
console.log(targets.slice(1).map(([lv,target])=>({lv,target,days:days[lv-1]})));
