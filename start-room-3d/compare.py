from PIL import Image, ImageDraw
from pathlib import Path
import sys
out=Path(sys.argv[1])
guide=Image.open('/workspace/shiba-cafe-docs/final-chars/pages/p-07.png').convert('RGB').crop((62,127,433,337))
render=Image.open(out/'still.png').convert('RGB')
# Preserve the entire portrait capture as a separate deliverable. Crop only cream margins for comparison.
pixels=render.load(); points=[]
for y in range(render.height):
    for x in range(render.width):
        r,g,b=pixels[x,y]
        if max(r,g,b)-min(r,g,b)>35 and r<240: points.append((x,y))
if not points: raise RuntimeError('No rendered scene found; comparison refused')
xs,ys=zip(*points); render=render.crop((max(0,min(xs)-12),max(0,min(ys)-12),min(render.width,max(xs)+13),min(render.height,max(ys)+13)))
canvas=Image.new('RGB',(1000,370),'#fff8ec'); draw=ImageDraw.Draw(canvas)
for img,x,title in [(guide,15,'GUIDE P07 — room + empty dirt'),(render,515,'THREE.JS — same elevated 3/4 view')]:
    img.thumbnail((470,300));canvas.paste(img,(x+(470-img.width)//2,45+(300-img.height)//2));draw.text((x,15),title,fill='#493022')
canvas.save(out/'compare-p07.png')
