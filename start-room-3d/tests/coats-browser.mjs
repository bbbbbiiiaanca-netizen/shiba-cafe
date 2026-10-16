// §17-16 희귀 털색 (PR-B) in the real page: canvas recolour, cafe map / list card / book use the same tinted art,
// small coat mark (colour dot, aria-label/title only), reset to normal, cache reuse. Needs a temp=1 page after startFlow.
export async function coatsBrowser({ev,check,sleep}){
 const wait=async(expr,ms=4000)=>{for(let t=0;t<ms;t+=100){if(await ev(expr))return true;await sleep(100);}return false;};
 await ev(`(()=>{const g=__game;g.ui.modals=[];g.close();document.querySelector('[data-main-tab=shiba]').click();g.refresh();return true;})()`);
 await check('coats: every shiba starts normal (coat null), no coat mark on cards',`__game.state.shibas.every(sh=>sh.coat===null)&&!document.querySelector('.coat-mark')`);
 await check('coats: dev helper rejects unknown coats and ids',`__game.debugCoat(__game.state.shibas[0].id,'gold')===false&&__game.debugCoat(-1,'pink')===false&&__game.state.shibas[0].coat===null`);
 const before=await ev('__game.coatStats.tinted');
 await ev(`window.coatId=__game.state.shibas[0].id;__game.debugCoat(coatId,'pink')`);
 const cardSel=`document.querySelector('[data-shiba-cell="'+coatId+'"] .sq-pic img')`;
 await wait(`(${cardSel}?.getAttribute('src')||'').startsWith('blob:')`);
 await check('coats: list card portrait becomes the recoloured image (async load + blob → repaint)',`(${cardSel}?.getAttribute('src')||'').startsWith('blob:')&&__game.state.shibas[0].coat==='pink'`);
 await check('coats: card shows one small coloured dot (config swatch) with aria-label/title, no visible coat/breed-name text',`(async()=>{const {coatSwatch}=await import('./coat-art.js'),cell=document.querySelector('[data-shiba-cell="'+coatId+'"]'),m=cell.querySelector('.coat-mark');if(!m)return false;const r=m.getBoundingClientRect(),bg=getComputedStyle(m).backgroundColor;
  const hex='#'+bg.match(/[0-9]+/g).slice(0,3).map(v=>(+v).toString(16).padStart(2,'0')).join('');window.coatCardSrc=${cardSel}.getAttribute('src');
  return document.querySelectorAll('.coat-mark').length===1&&m.textContent===''&&r.width>0&&r.width<=12&&r.height<=12&&m.getAttribute('aria-label')==='희귀 털색'&&m.title==='희귀 털색'&&m.dataset.coat==='pink'&&hex===coatSwatch('pink')&&!/pink|cream|silver|핑크|분홍|크림|은색|희귀/i.test(cell.innerText);})()`);
 await check('coats: real canvas recolour — orange fur changed, whites/darks/alpha identical to the source',`(async()=>{const ld=src=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=src;});
  const a=await ld('assets/drive/shiba-'+__game.state.shibas[0].breed+'.png'),b=await ld(${cardSel}.getAttribute('src'));if(a.naturalWidth!==b.naturalWidth||a.naturalHeight!==b.naturalHeight)return false;
  const px=im=>{const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const x=c.getContext('2d');x.drawImage(im,0,0);return x.getImageData(0,0,c.width,c.height).data;};
  const A=px(a),B=px(b),{furMask}=await import('./coat-art.js');let fur=0,changed=0,keep=0,bad=0;
  for(let i=0;i<A.length;i+=4){if(A[i+3]!==B[i+3]){bad++;continue;}if(A[i+3]<255)continue;const w=furMask(A[i]/255,A[i+1]/255,A[i+2]/255);
   if(w===0){keep++;if(A[i]!==B[i]||A[i+1]!==B[i+1]||A[i+2]!==B[i+2])bad++;}else if(w===1){fur++;if(A[i]!==B[i]||A[i+1]!==B[i+1]||A[i+2]!==B[i+2])changed++;}}
  return bad===0&&fur>500&&changed/fur>0.99&&keep>500;})()`);
 await ev(`(()=>{const g=__game;document.querySelector('[data-main-tab=manage]').click();g.refresh();return true;})()`);
 await check('coats: cafe map draws the placed coated shiba from a tinted canvas (once, cached across frames)',`(async()=>{const g=__game,sh=g.state.shibas[0];if(!sh.placed)return false;for(let i=0;i<20&&g.coatStats.tinted<=${before};i++){g.iso.draw(g.state,g.world);await new Promise(r=>setTimeout(r,100));}
  const n=g.coatStats.tinted;for(let i=0;i<5;i++)g.iso.draw(g.state,g.world);return n>${before}&&g.coatStats.tinted===n;})()`);
 await ev(`(()=>{const g=__game;g.ui.modals=[{kind:'book',id:coatId}];g.refresh();return true;})()`);
 const bookSel=`document.querySelector('#modal .book-art img')`;
 await wait(`(i=>i&&(i.dataset.src||i.getAttribute('src')).startsWith('blob:'))(${bookSel})`);
 await check('coats: profile book art uses the same recoloured image as the card',`(i=>!!i&&(i.dataset.src||i.getAttribute('src'))===window.coatCardSrc)(${bookSel})`);
 await check('coats: another (normal) shiba in the book keeps the original art',`(()=>{const g=__game,o=g.state.shibas.find(x=>x.id!==coatId);if(!o)return true;g.ui.modals=[{kind:'book',id:o.id}];g.refresh();const i=document.querySelector('#modal .book-art img');return (i.dataset.src||i.getAttribute('src'))==='assets/drive/shiba-'+o.breed+'.png';})()`);
 await ev(`(()=>{const g=__game;g.ui.modals=[];g.refresh();document.querySelector('[data-main-tab=shiba]').click();g.refresh();return true;})()`);
 await check('coats: second coat on the same art is a separate cache entry; same coat reused',`(async()=>{const g=__game,src=()=>${cardSel}.getAttribute('src'),until=async f=>{for(let i=0;i<40&&!f();i++)await new Promise(r=>setTimeout(r,100));return f();};
  const pink=src(),n=g.coatStats.tinted;g.debugCoat(coatId,'cream');if(!await until(()=>src().startsWith('blob:')&&src()!==pink))return false;const cream=src(),n1=g.coatStats.tinted;
  g.debugCoat(coatId,'pink');const back=src();g.debugCoat(coatId,'cream');return n1>n&&back===pink&&src()===cream&&g.coatStats.tinted===n1&&document.querySelector('.coat-mark').dataset.coat==='cream';})()`);
 await check('coats: reset to normal → original art, no mark; coat saved in state JSON',`(()=>{const g=__game,j=JSON.parse(JSON.stringify(g.state)).shibas[0].coat==='cream';g.debugCoat(coatId,null);return j&&g.state.shibas[0].coat===null&&${cardSel}.getAttribute('src')==='assets/drive/shiba-'+g.state.shibas[0].breed+'.png'&&!document.querySelector('.coat-mark');})()`);
}
