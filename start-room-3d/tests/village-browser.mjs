// Place navigation must remove the full-screen village layer at 360×640.
export async function villageBrowser({ev,c,check,sleep}){
 await ev(`window.villageShibas=JSON.stringify(__game.state.shibas);__game.ui.modals=[];__game.close();__game.state.shibas[0].status='sick';__game.refresh();true`);
 for(const [place,panel,content] of [['hospital','hospital','.hosp-row'],['ingredients','cooking','.cook2-go'],['walk','walk','.card h3']]){
  await ev(`document.querySelector('[data-main-tab=village]').click();true`);
  const point=await ev(`(()=>{const r=document.querySelector('[data-place=${place}]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await c('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
  await c('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await sleep(200);
  await ev(`document.querySelector('#panel ${content}')?.scrollIntoView({block:'center'});true`);
  await check(`village ${place}: tap shows unobscured ${panel} content`, `(()=>{const p=document.getElementById('panel'),el=p.querySelector('${content}');if(!el)return false;const r=el.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;return innerWidth===360&&innerHeight===640&&!p.hidden&&p.dataset.panel==='${panel}'&&document.getElementById('app').dataset.tab==='manage'&&x>0&&x<innerWidth&&y>0&&y<innerHeight&&el.contains(document.elementFromPoint(x,y));})()`);
  const clip=await ev(`(()=>{const r=document.getElementById('pbody').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scale:1};})()`);
  const {data}=await c('Page.captureScreenshot',{format:'png',clip});
  // Inspect the rendered pixels, so a blank cream screen cannot pass on DOM alone.
  await check(`village ${place}: panel screenshot is not blank`, `(async()=>{const im=new Image();im.src='data:image/png;base64,${data}';await im.decode();const cv=document.createElement('canvas');cv.width=im.width;cv.height=im.height;const ctx=cv.getContext('2d');ctx.drawImage(im,0,0);const a=ctx.getImageData(0,0,cv.width,cv.height).data,colors=new Set();for(let i=0;i<a.length;i+=16)colors.add((a[i]>>4)+','+(a[i+1]>>4)+','+(a[i+2]>>4));return colors.size>30;})()`);
  await ev(`document.querySelector('#phead [data-act=close]').click();true`);
  await check(`village ${place}: close returns to usable management tab`, `document.getElementById('panel').hidden&&document.getElementById('app').dataset.tab==='manage'&&!!document.querySelector('#menuList [data-manage-tabs]')`);
 }
 await ev(`__game.state.shibas=JSON.parse(window.villageShibas);delete window.villageShibas;__game.refresh();true`);
}
