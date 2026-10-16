// 병원 화면 (2026-10-16) browser checks, driven by smoke-browser.mjs at 360×640. State is restored at the end.
export async function hospitalBrowser({ev,check,sleep}){
 await ev(`window.hospBak=JSON.stringify({sh:__game.state.shibas,coins:__game.state.coins,lang:__game.state.settings.language});__game.ui.modals=[];__game.close();
  const s=__game.state;s.settings.language='ko';for(const sh of s.shibas){sh.status='ok';delete sh.hospitalUntil;delete sh.hospitalKind;}__game.applyLang();true`);
 // village map: hospital sticker art over lot 0, tap opens the clinic
 await ev(`document.querySelector('[data-main-tab=village]').click();Promise.all([...document.querySelectorAll('.village-art')].map(i=>i.decode().catch(()=>0))).then(()=>true)`);
 await check('병원: village map shows place-hospital.png over the 병원 lot',`(()=>{const a=document.querySelector('img[data-place-art=hospital]'),b=document.querySelector('[data-place=hospital]'),m=document.querySelector('[data-village-map]');if(!a||!b||!m)return false;const r=a.getBoundingClientRect(),q=b.getBoundingClientRect(),M=m.getBoundingClientRect(),cx=(r.left+r.right)/2,cy=(r.top+r.bottom)/2;
  return a.getAttribute('src')==='assets/drive/village/place-hospital.png'&&a.complete&&a.naturalWidth===308&&cx>q.left&&cx<q.right&&cy>q.top&&cy<q.bottom&&r.left>=M.left&&r.right<=M.right&&getComputedStyle(a).pointerEvents==='none';})()`);
 await ev(`document.querySelector('[data-place=hospital]').click();true`);
 await check('병원: tapping the village 병원 opens the hospital panel with the clinic background',`!document.getElementById('panel').hidden&&__game.ui.panel==='hospital'&&document.getElementById('ptitle').textContent==='병원'&&document.querySelector('[data-hospital]').style.backgroundImage.includes('assets/drive/bg-hospital-clinic.png')`);
 await check('병원: no patients → empty-state text only',`document.querySelector('[data-hosp-empty]')?.textContent==='아픈 시바가 없어요'&&!document.querySelector('.hosp-row')`);
 // four breeds: 2 admitted, 2 waiting
 await ev(`(()=>{const g=__game,s=g.state,base=s.shibas[0],now=g.clock.now();s.shibas=['red','sesame','kuro','white'].map((breed,i)=>({...structuredClone(base),id:900+i,breed,name:'',status:'ok'}));
  const [a,b,c,d]=s.shibas;a.status='hospital';a.hospitalKind='snake';a.hospitalUntil=now+5000e3;d.status='hospital';d.hospitalKind='sick';d.hospitalUntil=now+60e3;b.status='injured';b.injury='light';c.status='sick';s.coins=1e6;g.refresh();
  return Promise.all([...document.querySelectorAll('.hosp-art img')].map(i=>i.decode().catch(()=>0))).then(()=>true);})()`);
 await check('병원: admitted group first, then waiting; each breed drawn with its own bandage pose',`(()=>{const rows=[...document.querySelectorAll('.hosp-row')],A=__game.CFG.hospitalArt.sick;return JSON.stringify(rows.map(r=>r.dataset.hospState+':'+r.dataset.hosp))===JSON.stringify(['admitted:900','admitted:903','waiting:901','waiting:902'])
  &&document.querySelector('[data-hosp-group=admitted]').textContent==='입원 중'&&document.querySelector('[data-hosp-group=waiting]').textContent==='치료 대기'
  &&rows.every(r=>{const i=r.querySelector('img[data-hosp-pose]'),br=__game.state.shibas.find(x=>x.id===+r.dataset.hosp).breed;return i&&i.getAttribute('src')===A[br]&&i.complete&&i.naturalWidth===1024;});})()`);
 await check('병원: waiting rows show stay + cost from CFG.hospital and the existing 병원 보내기 button',`(()=>{const S=__game.S,s=__game.state,b=document.querySelector('[data-hosp="901"]'),c=document.querySelector('[data-hosp="902"]');
  return b.textContent.includes('가벼운 부상')&&b.textContent.includes('치료 30:00')&&b.querySelector('[data-act=hospital]').textContent.includes(S.hospitalCost(s,'light').toLocaleString('en-US'))&&!b.querySelector('[data-act=hospital]').disabled
  &&c.textContent.includes('앓아누움')&&c.textContent.includes('4:00:00')&&c.querySelector('[data-act=hospital]').textContent.includes(S.hospitalCost(s,'sick').toLocaleString('en-US'));})()`);
 // Check the actual seconds delta, independent of the wall-clock second at render time.
 const leftSeconds=`(()=>{const t=document.querySelector('[data-hosp="900"] [data-hosp-left]').textContent,m=t.match(/(\\d+):(\\d\\d):(\\d\\d)$/);return m?+m[1]*3600 + +m[2]*60 + +m[3]:null;})()`;
 const before=await ev(leftSeconds);
 await ev(`__game.clock.offset+=3000;__game.refresh();true`);
 const after=await ev(leftSeconds);
 await check('병원: remaining time counts down live',`${Number.isFinite(before)&&Number.isFinite(after)&&before-after>=3&&before-after<=4}`);
 await ev(`__game.advance(70e3);true`);
 await check('병원: a finished stay leaves the list (existing recovery)',`__game.state.shibas.find(x=>x.id===903).status!=='hospital'&&!document.querySelector('[data-hosp="903"]')&&!!document.querySelector('[data-hosp="900"]')`);
 // admission with the existing logic + not enough coins
 await ev(`window.hospC=__game.state.coins;document.querySelector('[data-hosp="901"] [data-act=hospital]').click();__game.refresh();true`);
 await check('병원: 병원 보내기 admits with the exact existing cost and stay',`(sh=>sh.status==='hospital'&&sh.hospitalKind==='light'&&__game.state.coins===window.hospC-__game.S.hospitalCost(__game.state,'light')&&Math.abs(sh.hospitalUntil-__game.clock.now()-__game.CFG.hospital.stays.light*1000)<5000&&document.querySelector('[data-hosp="901"]').dataset.hospState==='admitted')(__game.state.shibas.find(x=>x.id===901))`);
 await ev(`__game.state.coins=0;__game.refresh();true`);
 await check('병원: not enough coins → button disabled with 코인이 모자라요',`(b=>b.disabled&&b.textContent.includes('코인이 모자라요'))(document.querySelector('[data-hosp="902"] [data-act=hospital]'))`);
 // missing values → 미정, never NaN
 await ev(`(()=>{const sh=__game.state.shibas.find(x=>x.id===900);sh.hospitalKind='?';delete sh.hospitalUntil;sh.breed='nobody';__game.refresh();return true;})()`);
 await check('병원: missing kind / time / breed art show 미정 (no NaN, no raw key)',`(r=>{const t=r.textContent;return t.includes('입원 중 미정')&&(t.match(/미정/g)||[]).length>=3&&!/NaN|undefined|inj\\.|shiba\\.breed/.test(t);})(document.querySelector('[data-hosp="900"]'))`);
 // 360×640: header + close visible, nothing clipped sideways, list scrolls and keeps its position
 await ev(`(()=>{const s=__game.state,base=s.shibas[1];for(let i=0;i<4;i++)s.shibas.push({...structuredClone(base),id:910+i,status:'sick',name:'아주아주긴이름의시바'+i});s.coins=123456789;__game.refresh();return true;})()`);
 const fit=`(()=>{const p=document.getElementById('pbody'),P=p.getBoundingClientRect(),x=document.querySelector('#phead [data-act=close]').getBoundingClientRect();
  return innerWidth===360&&innerHeight===640&&x.right<=360&&x.top>=0&&x.bottom<=640&&p.scrollWidth<=p.clientWidth&&document.documentElement.scrollWidth<=360
  &&[...document.querySelectorAll('.hosp-row')].every(r=>{const b=r.getBoundingClientRect();return b.left>=P.left-.5&&b.right<=P.right+.5&&[...r.querySelectorAll('img,strong,span,button')].every(e=>{const v=e.getBoundingClientRect();return v.left>=b.left-.5&&v.right<=b.right+.5&&e.scrollWidth<=e.clientWidth+1;});});})()`;
 await check('병원 360×640 (ko): header/close on screen, rows and buttons inside, no horizontal overflow',fit);
 await ev(`(p=>{p.scrollTop=200;__game.state.coins+=1;__game.refresh();return true;})(document.getElementById('pbody'))`);
 await check('병원 360×640: long list scrolls vertically and refresh keeps the scroll position',`(p=>p.scrollHeight>p.clientHeight&&p.scrollTop===200)(document.getElementById('pbody'))`);
 await ev(`__game.state.settings.language='en';__game.applyLang();true`);
 await check('병원 360×640 (en): English title/groups/buttons, still no overflow',`document.getElementById('ptitle').textContent==='Hospital'&&document.querySelector('[data-hosp-group=admitted]').textContent==='In hospital'&&document.querySelector('[data-hosp-group=waiting]').textContent==='Waiting for care'&&document.querySelector('[data-hosp="902"]').textContent.includes('Sick')&&document.querySelector('[data-hosp="900"]').textContent.includes('TBD')&&!/[가-힣]{2}/.test(document.querySelector('[data-hosp="902"] .hosp-info span').textContent)&&${fit}`);
 await ev(`(()=>{const b=JSON.parse(window.hospBak),s=__game.state;s.shibas=b.sh;s.coins=b.coins;s.settings.language=b.lang;__game.close();__game.applyLang();return true;})()`);
 await check('병원: empty state in English too',`(()=>{const s=__game.state,l=s.settings.language,st=s.shibas.map(x=>x.status);s.settings.language='en';s.shibas.forEach(x=>x.status='ok');__game.applyLang();__game.open('hospital');const ok=document.querySelector('[data-hosp-empty]')?.textContent==='No sick shibas';__game.close();s.shibas.forEach((x,i)=>x.status=st[i]);s.settings.language=l;__game.applyLang();return ok;})()`);
}
