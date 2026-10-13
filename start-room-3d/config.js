// All tunables for the 시바견 카페 game skeleton live here.
export const CFG={
 saveKey:'shibaCafe.save.v1',
 start:{coins:500,hearts:0,paws:3,shibas:[{coat:'red',expr:'smile'},{coat:'white',expr:'smile'}]},
 coats:{red:'적색',sesame:'참깨',kuro:'쿠로',white:'백'},
 exprs:{smile:'기본 미소',joy:'큰 기쁨',expect:'기대',tired:'피곤',pout:'삐침'},
 // floor geometry (world units) — seats face the table (+1 = looking toward +x)
 tables:[{x:-2.8,z:.15},{x:-.65,z:.7}],
 seats:[{x:-3.75,z:.15,face:1,table:0},{x:-1.6,z:.7,face:1,table:1},{x:.3,z:.7,face:-1,table:1}],
 door:{x:.95,z:3.4},aisleZ:1.95,
 roam:{x0:-4.1,x1:.85,z0:1.45,z1:2.25,speed:.65,idleMin:1,idleMax:3},
 customer:{speed:.9,spawnEvery:6,firstSpawn:1,waitBeforeVisit:1.5,visits:2,happyPause:1.2,payBase:40,payPerShiba:6,paws:1},
 visit:{climb:.9,pet:3.5,descend:.9,cooldown:3,heartsPerPet:1},
 cafe:{maxShibas:6},
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
  {say:'첫 손님 성공! 이제 아래 [뽑기]를 눌러 새 시바를 데려와요. 첫 뽑기는 무료예요.',done:s=>s.gachaPulls>=1,highlight:'gacha'},
  {say:'새 친구가 카페에 왔어요! 앞으로 할 일은 [퀘스트]에서 제가 알려 줄게요.',next:true}],
};
