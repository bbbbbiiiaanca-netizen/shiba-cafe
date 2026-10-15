// Pure, deterministic simulation. Coordinates are grid cells; no browser/Three dependency.
export const WIDTH = 10, HEIGHT = 12, CELL = .55;
export const ENTRY = { x: 5, z: 11 };
export function seededRandom(seed = 1) {
  let a = seed >>> 0;
  return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const key = (x, z) => `${x},${z}`;
const inside = (x, z) => x >= 0 && z >= 0 && x < WIDTH && z < HEIGHT;
export function footprint(item, x = item.x, z = item.z) {
  if (item.kind === 'table') return [{x,z},{x:x+1,z},{x,z:z+1},{x:x+1,z:z+1},{x,z:z+2}];
  return [{x,z}];
}
export function buildGrid(items) {
  const blocked = new Set();
  for (const item of items) for (const c of footprint(item)) blocked.add(key(c.x,c.z));
  return blocked;
}
export function findPath(blocked, start, goal) {
  const sx = Math.round(start.x), sz = Math.round(start.z);
  if (!inside(sx,sz) || !inside(goal.x,goal.z) || blocked.has(key(sx,sz)) || blocked.has(key(goal.x,goal.z))) return null;
  const queue = [{x:sx,z:sz}], parents = new Map([[key(sx,sz),null]]);
  for (let i=0;i<queue.length;i++) {
    const c=queue[i];
    if(c.x===goal.x && c.z===goal.z) {
      const path=[]; let p=c;
      while(p) { path.unshift(p); p=parents.get(key(p.x,p.z)); }
      return path;
    }
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const n={x:c.x+dx,z:c.z+dz}, k=key(n.x,n.z);
      if(inside(n.x,n.z) && !blocked.has(k) && !parents.has(k)) {parents.set(k,c);queue.push(n);}
    }
  }
  return null;
}
function reachableCells(blocked,start) {
  const seen=new Set(),queue=[];
  if(!inside(start.x,start.z)||blocked.has(key(start.x,start.z)))return seen;
  seen.add(key(start.x,start.z));queue.push(start);
  for(let i=0;i<queue.length;i++)for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
    const x=queue[i].x+dx,z=queue[i].z+dz,k=key(x,z);
    if(inside(x,z)&&!blocked.has(k)&&!seen.has(k)){seen.add(k);queue.push({x,z});}
  }
  return seen;
}
export const seatOf = t => ({x:t.x,z:t.z+2});
export const accessOf = t => ({x:t.x+1,z:t.z+2});
export function createSim({seed=1}={}) {
  const random=seededRandom(seed);
  const sim={time:0,gridVersion:0,stats:{arrivals:0,departures:0,visits:0},
    furniture:[{id:'table-0',kind:'table',x:1,z:2},{id:'table-1',kind:'table',x:6,z:2},{id:'table-2',kind:'table',x:2,z:7},{id:'plant',kind:'plant',x:0,z:0},{id:'moon',kind:'moon',x:9,z:1}],guests:[],dogs:[]};
  const tables=()=>sim.furniture.filter(f=>f.kind==='table');
  sim.grid=buildGrid(sim.furniture);
  let guestId=0, kind=0;
  const route=(entity,target)=>{const p=findPath(sim.grid,entity,target);entity.path=p?p.slice(1):[];return !!p;};
  const move=(entity,dt,speed)=>{
    let remaining=dt*speed;
    while(entity.path.length && remaining>0) {
      const next=entity.path[0], dx=next.x-entity.x,dz=next.z-entity.z,dist=Math.hypot(dx,dz);
      entity.heading=Math.atan2(dx,dz);
      if(dist<=remaining){entity.x=next.x;entity.z=next.z;entity.path.shift();remaining-=dist;}
      else {entity.x+=dx/dist*remaining;entity.z+=dz/dist*remaining;remaining=0;}
    }
    return entity.path.length===0;
  };
  function arrive(table) {
    const g={id:guestId++,kind:kind++%3,tableId:table.id,state:'entering',visits:0,x:ENTRY.x,z:ENTRY.z,path:[],heading:Math.PI,timer:0};
    route(g,accessOf(table)); sim.guests.push(g); sim.stats.arrivals++;
  }
  // Two guests leave one of the three sets available for furniture editing.
  for(const t of tables().slice(0,2)) arrive(t);
  for(let i=0;i<3;i++) sim.dogs.push({id:i,x:4+i,z:6,state:'roam',tableId:null,path:[],heading:0,timer:.3+i*.4,progress:0});
  function release(d) { d.tableId=null; d.state='roam';d.timer=.35+random()*.4;d.progress=0;d.path=[]; }
  function assign(d,g) {
    const t=sim.furniture.find(f=>f.id===g.tableId);
    if(!route(d,accessOf(t))) return false;
    d.tableId=t.id;d.state='approaching';d.progress=0; return true;
  }
  sim.step = dt => {
    dt=Math.max(0,Math.min(dt,.1));sim.time+=dt;
    for(const g of [...sim.guests]) {
      if(g.state==='entering' && move(g,dt,2.8)) {g.state='waiting';g.timer=.2;}
      else if(g.state==='leaving' && move(g,dt,2.8)) {
        const t=sim.furniture.find(f=>f.id===g.tableId);
        sim.guests.splice(sim.guests.indexOf(g),1);sim.stats.departures++;
        const vacant=tables().filter(t=>!sim.guests.some(g=>g.tableId===t.id));
        arrive(vacant.find(v=>v.id!==t.id)||t);
      }
      if(g.state==='waiting') g.timer=Math.max(0,g.timer-dt);
    }
    for(const d of sim.dogs) {
      if(d.state==='roam') {
        const g=sim.guests.find(g=>g.state==='waiting' && g.timer===0 && !sim.dogs.some(other=>other.tableId===g.tableId));
        if(g && assign(d,g)) continue;
        if(d.path.length) move(d,dt,2.6);
        else {d.timer-=dt;if(d.timer<=0) {route(d,{x:Math.floor(random()*WIDTH),z:Math.floor(random()*HEIGHT)});d.timer=.4+random()*.5;}}
      } else if(d.state==='approaching') {
        if(move(d,dt,3.2)) {d.state='jumping';d.progress=0;}
      } else if(d.state==='jumping') {
        d.progress+=dt/.55;
        if(d.progress>=1){d.state='petting';d.timer=3.7;d.progress=1;const g=sim.guests.find(g=>g.tableId===d.tableId);if(g)g.state='petting';}
      } else if(d.state==='petting') {
        d.timer-=dt;
        if(d.timer<=0){d.state='descending';d.progress=0;}
      } else if(d.state==='descending') {
        d.progress+=dt/.5;
        if(d.progress>=1) {
          const g=sim.guests.find(g=>g.tableId===d.tableId);
          if(g){g.visits++;sim.stats.visits++;if(g.visits>=2){g.state='leaving';route(g,ENTRY);}else{g.state='waiting';g.timer=.6;}}
          release(d);
        }
      }
    }
  };
  sim.validateMove = (id,x,z) => {
    const item=sim.furniture.find(f=>f.id===id);
    if(!item || !Number.isInteger(x) || !Number.isInteger(z))return {ok:false,reason:'올바른 칸을 선택해 주세요'};
    if(item.kind==='table' && (sim.guests.some(g=>g.tableId===id)||sim.dogs.some(d=>d.tableId===id)))return {ok:false,reason:'손님이 앉아 있어요'};
    const cells=footprint(item,x,z);
    if(cells.some(c=>!inside(c.x,c.z)))return {ok:false,reason:'방 안으로 옮겨 주세요'};
    const others=buildGrid(sim.furniture.filter(f=>f.id!==id));
    if(cells.some(c=>others.has(key(c.x,c.z))))return {ok:false,reason:'가구가 겹쳐요'};
    if(cells.some(c=>(c.x===4||c.x===5)&&c.z>=10))return {ok:false,reason:'입구 통로를 비워 주세요'};
    const proposed=sim.furniture.map(f=>f.id===id?{...f,x,z}:f), grid=buildGrid(proposed);
    const reachable=reachableCells(grid,ENTRY);
    if(!reachable.size || proposed.filter(f=>f.kind==='table').some(t=>{const a=accessOf(t);return !reachable.has(key(a.x,a.z));}))return {ok:false,reason:'자리로 가는 길이 막혀요'};
    if(reachable.size!==WIDTH*HEIGHT-grid.size)return {ok:false,reason:'통로가 막혀요'};
    if([...sim.dogs,...sim.guests].some(e=>grid.has(key(Math.round(e.x),Math.round(e.z)))))return {ok:false,reason:'잠깐, 지나가는 친구가 있어요'};
    return {ok:true};
  };
  sim.moveFurniture=(id,x,z)=>{
    const result=sim.validateMove(id,x,z);if(!result.ok)return result;
    Object.assign(sim.furniture.find(f=>f.id===id),{x,z});sim.grid=buildGrid(sim.furniture);sim.gridVersion++;
    for(const g of sim.guests)if(g.state==='entering'||g.state==='leaving')route(g,g.state==='leaving'?ENTRY:accessOf(sim.furniture.find(t=>t.id===g.tableId)));
    for(const d of sim.dogs){if(d.state==='roam')d.path=[];else if(d.state==='approaching')route(d,accessOf(sim.furniture.find(t=>t.id===d.tableId)));}
    return result;
  };
  sim.forceVisit=()=>{
    const d=sim.dogs.find(d=>d.tableId) || sim.dogs.find(d=>d.state==='roam') || sim.dogs[0];
    if(d.tableId){const old=sim.guests.find(g=>g.tableId===d.tableId);if(old?.state==='petting'){old.state='waiting';old.timer=.1;}release(d);}
    const g=sim.guests.find(g=>!sim.dogs.some(d=>d.tableId===g.tableId)&&g.state!=='leaving') || sim.guests.find(g=>!sim.dogs.some(d=>d.tableId===g.tableId));
    if(!g)return false;
    if(g.state==='leaving')g.visits=1;
    const t=sim.furniture.find(t=>t.id===g.tableId),a=accessOf(t);
    Object.assign(g,{x:a.x,z:a.z,path:[],state:'petting'});
    Object.assign(d,{x:a.x,z:a.z,path:[],tableId:t.id,state:'petting',timer:3.7,progress:1});return true;
  };
  sim.state=()=>JSON.parse(JSON.stringify({time:sim.time,stats:sim.stats,furniture:sim.furniture,guests:sim.guests,dogs:sim.dogs,gridVersion:sim.gridVersion}));
  return sim;
}
