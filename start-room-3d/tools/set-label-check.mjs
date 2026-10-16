// 브라우저 검사 공용: 세트 라벨 사각형이 가구 그림 사각형(__game.iso.hits)·상단 HUD·평판 바와 겹치지 않는지.
// Runtime.evaluate에 넘길 식을 돌려준다. 결과 {ok,pos,label,overlaps}.
export const setLabelOverlapExpr=theme=>`(()=>{
 const el=document.querySelector('.${theme}-set-label');if(!el)return {ok:false,why:'label missing'};
 const c=document.getElementById('isomap').getBoundingClientRect(),L=el.getBoundingClientRect(),r=b=>({x:b.left,y:b.top,w:b.width,h:b.height});
 const others=[...__game.iso.hits.filter(h=>!h.footprint).map(h=>({name:'furniture:'+h.id,x:h.x+c.left,y:h.y+c.top,w:h.w,h:h.h})),
  ...['#hud','.hud-sub'].map(s=>[s,document.querySelector(s)?.getBoundingClientRect()]).filter(([,b])=>b&&b.height>0).map(([s,b])=>({name:s,...r(b)}))];
 const hit=(a,b)=>a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h;
 const label=r(L),overlaps=others.filter(o=>hit(label,o)).map(o=>o.name);
 return {ok:!overlaps.length&&!!others.some(o=>o.name.startsWith('furniture:'))&&L.bottom<=c.bottom,pos:el.dataset.setLabelPos,label,overlaps};
})()`;
export async function assertSetLabelClear(ev,theme){
 const r=await ev(setLabelOverlapExpr(theme));
 if(!r.ok)throw Error(theme+' set label overlaps/missing: '+JSON.stringify(r));
 if(!['top','bottom'].includes(r.pos))throw Error(theme+' set label pos: '+r.pos);
 return r;
}
