// Layout dimensions are presentation data, not economy values. Add grid rows to extend scrolling.
const grid=(rows,cols,id)=>Array.from({length:rows},()=>Array(cols).fill(id));
export const MAP={tileWidth:128,tileHeight:64,floors:[
 {id:1,locked:false,grid:grid(6,6,'tatami'),walls:{backLeft:true,backRight:true},objects:[
  {type:'counter',col:1,row:0,w:2,h:1,sprite:null,label:'카운터'},
  {type:'dongu',col:3,row:0,w:1,h:1,sprite:null,label:'동구'},
  {type:'table',col:1,row:2,w:1,h:1,sprite:null,label:'찻상'},
  {type:'cushion',col:0,row:3,w:1,h:1,sprite:null,label:'방석'},
  {type:'table',col:3,row:3,w:1,h:1,sprite:null,label:'찻상'},
  {type:'cushion',col:4,row:3,w:1,h:1,sprite:null,label:'방석'},
  {type:'stairs',col:5,row:0,w:1,h:2,sprite:null,label:'2층 계단',connects:[1,2]}],
  zones:[{id:'theme',col:4,row:4,w:2,h:2,locked:true,cost:null /* UNSET */,label:'잠김'}]},
 {id:2,locked:true,cost:null /* UNSET */,grid:grid(4,6,'plain'),walls:{backLeft:true,backRight:true},objects:[],zones:[]}
]};
export const SPRITES={table:{path:'assets/drive/furniture/furn-tea-table.png',anchor:[64,72]},cushion:{path:'assets/drive/furniture/furn-zabuton-a.png',anchor:[64,32]},counter:{path:'assets/drive/furniture/furn-counter.png',anchor:[96,136]},dongu:null,stairs:{path:'assets/drive/furniture/furn-stairs.png',anchor:[96,177]},expand:{path:'assets/drive/tiles/marker-expand-land.png',anchor:[64,72]},guest:null,red:null,white:null,kuro:null,sesame:null};
export const TILES={tatami:'tatami-approved.png',plain:'tile-floor-tatami.png',locked:'tile-floor-locked.png'};
