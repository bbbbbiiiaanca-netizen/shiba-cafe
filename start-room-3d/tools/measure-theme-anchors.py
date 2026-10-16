"""Measure alpha contact bands in source sprite pixels (Pillow required).
Bands isolate supports from bodies/foliage; noren includes both staggered feet.
Run from repo root after sync-furniture-art.mjs. Prints measured anchor entries.
"""
import glob,json
from PIL import Image
bands={'shelf':162,'low-table-cushion':170,'stone-lantern':170,'chochin':178,'bonsai':180,'bamboo-fence':160,'noren':150,'entrance-sign':170}
anchors={}
for theme in ['momiji','snow']:
    for kind,start in bands.items():
        version=5 if kind=='low-table-cushion' and theme=='momiji' else 4
        name=f'furn-{kind}-{theme}-v{version}.png'
        im=Image.open('assets/drive/furniture-v4/'+name)
        contact=im.getchannel('A').crop((0,start,im.width,im.height)).point(lambda v:255 if v>=128 else 0).getbbox()
        anchors[name]=[round((contact[0]+contact[2]-1)/2),round(start+(contact[1]+contact[3]-1)/2)]
print(json.dumps(anchors,indent=2))
