from PIL import Image, ImageDraw
from pathlib import Path
import sys
out=Path(sys.argv[1]); sfx=sys.argv[2] if len(sys.argv)>2 else ''
guide=Image.open('/workspace/shiba-cafe-docs/final-chars/pages/p-07.png').convert('RGB').crop((62,127,433,337))
still=Image.open(out/f'still{sfx}.png').convert('RGB')
H=520; g=guide.resize((round(guide.width*H/guide.height*0.62),round(H*0.62)))
s=still.resize((round(still.width*H/still.height),H))
canvas=Image.new('RGB',(g.width+s.width+60,H+50),'#fff8ec'); d=ImageDraw.Draw(canvas)
canvas.paste(g,(20,40+(H-g.height)//2)); canvas.paste(s,(g.width+40,40))
d.text((20,14),'GUIDE v1.1 p07',fill='#493022'); d.text((g.width+40,14),f'THREE.JS render {sfx} (390x844, full phone screen)',fill='#493022')
canvas.save(out/f'compare-p07{sfx}.png')
