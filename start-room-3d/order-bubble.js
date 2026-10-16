// Presentation only: order events and payment logic stay in the simulation.
export function addOrderBubble(world,event,dur){
 if(!event.orderImg||!event.cell)return;
 world.orderBubbles=(world.orderBubbles||[]).filter(b=>b.guestId!==event.id);
 world.orderBubbles.push({guestId:event.id,img:event.orderImg,cell:[...event.cell],age:0,dur});
}
export function ageOrderBubbles(world,dt){
 if(world.orderBubbles)world.orderBubbles=world.orderBubbles.filter(b=>(b.age+=dt)<b.dur);
}
// 말풍선 테두리는 그림(request-bubble-empty_512.png)으로 그린다. 꼬리 끝이 p에 오고, 메뉴 아이콘은 몸통 가운데.
export function drawOrderBubble(ctx,image,p,bubble,cfg){
 if(!bubble?.complete||!bubble.naturalWidth)return;
 const k=cfg.drawHeight/cfg.opaqueHeight,ox=p.x-cfg.tip[0]*k,oy=p.y-cfg.tip[1]*k;
 ctx.drawImage(bubble,ox,oy,bubble.naturalWidth*k,bubble.naturalHeight*k);
 if(image?.complete&&image.naturalWidth){const cx=ox+cfg.center[0]*k,cy=oy+cfg.center[1]*k,f=cfg.iconSize/Math.max(image.naturalWidth,image.naturalHeight),w=image.naturalWidth*f,h=image.naturalHeight*f;ctx.drawImage(image,cx-w/2,cy-h/2,w,h);}
}
