// Presentation only: order events and payment logic stay in the simulation.
export function addOrderBubble(world,event,dur){
 if(!event.orderImg||!event.cell)return;
 world.orderBubbles=(world.orderBubbles||[]).filter(b=>b.guestId!==event.id);
 world.orderBubbles.push({guestId:event.id,img:event.orderImg,cell:[...event.cell],age:0,dur});
}
export function ageOrderBubbles(world,dt){
 if(world.orderBubbles)world.orderBubbles=world.orderBubbles.filter(b=>(b.age+=dt)<b.dur);
}
export function drawOrderBubble(ctx,image,p){
 ctx.save();ctx.fillStyle='#fff';ctx.strokeStyle='#d8cfc3';ctx.lineWidth=1;
 ctx.beginPath();ctx.roundRect(p.x-23,p.y-52,46,44,12);ctx.fill();ctx.stroke();
 ctx.beginPath();ctx.moveTo(p.x-5,p.y-9);ctx.lineTo(p.x,p.y);ctx.lineTo(p.x+6,p.y-9);ctx.fill();
 if(image.complete&&image.naturalWidth){const k=32/Math.max(image.naturalWidth,image.naturalHeight);ctx.drawImage(image,p.x-image.naturalWidth*k/2,p.y-30-image.naturalHeight*k/2,image.naturalWidth*k,image.naturalHeight*k);}
 ctx.restore();
}
