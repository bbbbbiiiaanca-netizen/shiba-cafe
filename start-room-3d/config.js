// All tunables for the 시바견 카페 game skeleton live here.
export const CFG={
 saveKey:'shibaCafe.save.v2',
 start:{coins:500,hearts:0,paws:3,shibas:[{coat:'red',expr:'red_smile'},{coat:'white',expr:'white_smile'}]},
 coats:{red:'적색',sesame:'참깨',kuro:'쿠로',white:'백'},
 // catalog p7-8 expressions (적색 9, 참깨·쿠로·백 3) — images assets/<id>.png
 exprs:{red_smile:'해맑은 미소',red_laugh:'함박웃음',red_yawn:'하품',red_wow:'깜짝',red_wink:'윙크',red_yum:'냠냠',red_pout:'삐침',red_love:'하트 눈',red_sleepy:'졸림',
  sesame_smile:'헤헤',sesame_wow:'깜짝',sesame_grin:'싱글',kuro_calm:'도도',kuro_wink:'윙크',kuro_laugh:'웃음',white_smile:'방긋',white_happy:'반가움',white_sweet:'다정'},
 coatExprs(c){return Object.keys(this.exprs).filter(k=>k.startsWith(c+'_'));},
 // floor geometry (world units) — seats face the table (+1 = looking toward +x)
 tables:[{x:-2.7,z:-.3},{x:-.5,z:.4}],
 seats:[{x:-3.25,z:-.85,face:1,table:0,via:{x:-4.1,z:-.85}},{x:-1.35,z:.4,face:1,table:1},{x:-.5,z:-.45,face:0,table:1,via:{x:.6,z:-.45}}], // all seats sit behind their table (2D depth)
 door:{x:1.6,z:3.2},aisleZ:1.7,
 roam:{x0:-4,x1:.9,z0:1.15,z1:2.2,speed:.65,idleMin:1,idleMax:3},
 customer:{speed:.9,spawnEvery:6,firstSpawn:1,waitBeforeVisit:1.5,visits:2,happyPause:1.2,payBase:40,payPerShiba:6,paws:1},
 visit:{climb:.9,pet:3.5,descend:.9,cooldown:3,heartsPerPet:1},
 cafe:{maxShibas:6},
 upgrade:{base:300,grow:1.8,bonus:.25}, // 업그레이드: 방치 수입 +25%/단계
 idle:{perSec:.5,perShibaPerSec:.25},
 offline:{rate:.5,capHours:8,minSeconds:60},
 gacha:{cost:{paws:3},cost10:{paws:27},machineImg:'media/gacha-machine.jpg',firstFree:true,revealAt:6.7,video:'media/gacha-reveal.mp4',
  rarity:[{id:'N',w:70},{id:'R',w:25},{id:'SR',w:5}]}, // stub: label only, no stat effect yet
 sfx:{click:{slot:'sfx-button-click',sec:.12},knob:{slot:'sfx-knob-turn',sec:.5},drop:{slot:'sfx-capsule-drop',sec:.6},reveal:{slot:'sfx-gacha-reveal',sec:10},fanfare:{slot:'sfx-success-fanfare',sec:1.2}}, // slots only: no audio files given yet
 themes:[{id:'basic',name:'기본 다다미',price:0,wall:'#e2cba6',tatami:'#d3c08e',light:'#ffe6c8'},
  {id:'sakura',name:'벚꽃 테마',price:800,wall:'#f0d2cf',tatami:'#d9c6a0',light:'#ffe2dc'},
  {id:'summer',name:'여름 축제',price:1500,wall:'#d8d2b4',tatami:'#cdc48c',light:'#fff0c0'}],
 quests:[{id:'serve5',text:'손님 5명 모시기',goal:s=>s.served>=5,reward:{coins:200}},
  {id:'hearts20',text:'하트 20개 모으기',goal:s=>s.hearts>=20,reward:{paws:2}},
  {id:'own4',text:'시바 4마리 모으기',goal:s=>s.owned.length>=4,reward:{coins:300}},
  {id:'theme',text:'테마 하나 사기',goal:s=>s.themesOwned.length>=2,reward:{paws:3}}],
 tutorial:[
  {say:'어서 와요! 저는 동구예요. 오늘부터 이 작은 카페를 같이 키워 봐요.',next:true},
  {say:'곧 첫 손님이 와요. 손님은 자리에 앉아서 시바가 오길 기다려요. 시바가 두 번 놀러 가면 손님이 동전을 내고 가요.',done:s=>s.served>=1,reward:{coins:100}},
  {say:'첫 손님 성공! 이제 아래 [시바들]에서 뽑기를 눌러 새 시바를 데려와요. 첫 뽑기는 무료예요.',done:s=>s.gachaPulls>=1,highlight:'shiba'},
  {say:'새 친구가 카페에 왔어요! 앞으로 할 일은 [퀘스트]에서 제가 알려 줄게요.',next:true}],
};
