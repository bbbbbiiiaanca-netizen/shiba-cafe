import numpy as np, colorsys
from PIL import Image, ImageDraw, ImageFont
# Fur mask = orange hue band with enough saturation; whites/creams (low sat), black/dark outlines (low V) untouched.
TARGETS={'cream':dict(h=38/360,smul=0.30,vadd=0.10),'silver':dict(h=210/360,smul=0.06,vadd=0.02),'pink':dict(h=345/360,smul=0.55,vadd=0.06)}
def rgb2hsv(a):
    r,g,b=[a[...,i] for i in range(3)];mx=a.max(-1);mn=a.min(-1);d=mx-mn+1e-9
    h=np.where(mx==r,((g-b)/d)%6,np.where(mx==g,(b-r)/d+2,(r-g)/d+4))/6;s=np.where(mx>0,d/(mx+1e-9),0);return h,s,mx
def hsv2rgb(h,s,v):
    i=np.floor(h*6).astype(int)%6;f=h*6-np.floor(h*6);p=v*(1-s);q=v*(1-f*s);t=v*(1-(1-f)*s)
    out=np.zeros(h.shape+(3,))
    for k,(R,G,B) in enumerate([(v,t,p),(q,v,p),(p,v,t),(p,q,v),(t,p,v),(v,p,q)]):
        m=i==k;out[m]=np.stack([R[m],G[m],B[m]],-1)
    return out
def recolor(img,t):
    a=np.asarray(img.convert('RGB')).astype(float)/255;h,s,v=rgb2hsv(a)
    w=np.clip((s-0.25)/0.15,0,1)*np.clip((v-0.2)/0.15,0,1)*((h>=8/360)&(h<=48/360))  # soft fur mask
    nh=np.full_like(h,t['h']);ns=s*t['smul'];nv=np.clip(v+t['vadd']*(1-v),0,1)
    o=hsv2rgb(nh,ns,nv);out=a*(1-w[...,None])+o*w[...,None]
    return Image.fromarray((out*255).round().astype('uint8')),w
import sys
for src,name in [('/workspace/shiba-cafe/start-room-3d/assets/drive/shiba-red.png','red'),('/workspace/prompts/s/dongu-sheet-v2.png','dongu-sheet')]:
    im=Image.open(src).convert('RGB');im.thumbnail((600,900))
    tiles=[im]+[recolor(im,TARGETS[k])[0] for k in TARGETS]
    W=sum(t.width for t in tiles);H=im.height+40;sheet=Image.new('RGB',(W,H),'white');d=ImageDraw.Draw(sheet)
    try:f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',22)
    except:f=None
    x=0
    for lab,t in zip(['original','cream','silver','pink'],tiles):sheet.paste(t,(x,40));d.text((x+10,8),lab,fill='black',font=f);x+=t.width
    sheet.save(f'recolor-{name}.png')
print('ok')
