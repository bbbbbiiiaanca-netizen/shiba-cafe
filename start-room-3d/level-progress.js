// Shared display formatting for the HUD level speech bubble.
export function levelProgressText(level,exp,need,maxLevel,L){
 const max=level>=maxLevel;
 const percent=max?100:need>0?Math.min(100,Math.floor(exp/need*100)):0;
 const number=n=>Math.floor(n).toLocaleString('en-US');
 return L('hud.levelProgress',{lv:level,percent,current:number(exp),needed:max?L('app.max'):need==null?L('app.unset'):number(need)});
}
