(function(root){'use strict';
const C=root.BalanceConfig;
const DECOR=[
 {id:'lamp_paper',cat:'light',name:'종이 등',emoji:'🏮'},
 {id:'lamp_sakura',cat:'light',name:'벚꽃 등',emoji:'🌸'},
 {id:'bonsai',cat:'garden',name:'분재',emoji:'🪴'},
 {id:'stone_lamp',cat:'garden',name:'석등',emoji:'🪨'},
 {id:'vase',cat:'table',name:'테이블 꽃병',emoji:'💐'},
 {id:'sign_paw',cat:'sign',name:'발바닥 간판',emoji:'🐾'}
].map(d=>({...d,coins:C.decor.prices[d.id],art:`assets/decor/${d.id}.webp`}));
const SLOTS=[{id:'s_z1_light',cat:'light',zone:1,x:2030,y:2810},{id:'s_z1_table',cat:'table',zone:1,x:1650,y:2940},{id:'s_z2_prop',cat:'garden',zone:2,x:2370,y:2500},{id:'s_entry_sign',cat:'sign',zone:1,x:1850,y:3230}];
root.CafeDecor={DECOR,SLOTS};
})(this);
