// One visit only: approach, climb, receive affection, descend, return.
export function visitAt(t) {
  t=Math.max(0,Math.min(10,t));
  const ease=k=>k*k*(3-2*k), mix=(a,b,k)=>a+(b-a)*k;
  let x=-.85,z=1.85,y=0,phase='approach';
  if(t<2){z=mix(1.85,1.35,ease(t/2));}
  else if(t<3){const k=ease(t-2);z=mix(1.35,.7,k);y=.45*k+Math.sin(k*Math.PI)*.25;phase='climb';}
  else if(t<7){z=.7;y=.45;phase='petting';}
  else if(t<8){const k=ease(t-7);z=mix(.7,1.35,k);y=.45*(1-k)+Math.sin(k*Math.PI)*.22;phase='descend';}
  else {z=mix(1.35,1.85,ease((t-8)/2));phase='return';}
  return {x,y,z,phase,hearts:phase==='petting'};
}
