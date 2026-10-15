/* Fixed prices: 30-run seeded idle eligibility medians (S6).
 * R2=875.47 ×8 →7004; R3=3889.73 ×20 →77795; R4=12789.77 ×35 →447642.
 * Anchors leave northern terrain available for zones 6–9 later. */
(function(root){
'use strict';
const C=typeof module!=='undefined'?require('./balance-config'):root.BalanceConfig;
const ZONES = [
 {id:'z1_tatami',no:1,name:'시작 다다미방',rect:{x:1420,y:2700,w:760,h:480},buildSec:0,adds:{seatCap:C.seats,pupCap:C.initialPups},spots:{seats:[[4,2],[16,6],[28,1],[40,5],[56,2],[68,6],[80,1],[88,7]],pups:[[30,35],[60,45],[45,25]]}},
 {id:'z2_garden',no:2,name:'이끼 정원',rect:{x:2000,y:2320,w:620,h:420},unlock:{after:'z1_tatami',coins:0,adoptions:C.garden.adoptions,nMin:C.garden.minutes},buildSec:C.garden.buildSec,adds:{pupCap:C.gardenPups},done:'이끼가 폭신해.\n아기들, 뛰어도 돼.',feature:'아기 시바를 3마리까지 돌볼 수 있어요'},
 {id:'z3_walk',no:3,name:'산책로',rect:{x:1160,y:1990,w:620,h:420},unlock:{after:'z2_garden',coins:77795,adoptions:2,nMin:20},buildSec:60,adds:{walkCap:1},done:'길이 생겼다.\n이제 둘이 같이 걸어도 돼.',feature:'동시에 두 마리와 산책할 수 있어요'},
 {id:'z4_play',no:4,name:'놀이터',rect:{x:2000,y:1630,w:620,h:420},unlock:{after:'z3_walk',coins:447642,adoptions:4,nMin:35},buildSec:120,adds:{activity:'play'},done:'터널이다. 나는 안 들어가.\n…한 번만.',feature:'산책 탭에서 놀이터 놀이를 해보세요'},
 {id:'z5_tatami',no:5,name:'두 번째 다다미방',rect:{x:1160,y:1250,w:620,h:420},placeholder:true,adds:{}}
];
for(const z of ZONES){z.art={locked:`assets/zones/z${z.no}_locked.webp`,open:z.no===1?'assets/zones/z1_open.jpg':`assets/zones/z${z.no}_open.webp`};z.spots ||= {pups:[[30,35],[60,45],[45,25]]};}
const api={ZONES};if(typeof module!=='undefined')module.exports=api;else root.CafeZones=api;
})(this);
