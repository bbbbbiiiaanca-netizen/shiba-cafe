#!/usr/bin/env python3
"""Offline alignment crops: python3 align-crops.py [OUTDIR]. Requires Pillow and Node.
Reads the renderer's map-data.js directly; no browser or duplicated placement metadata.
"""
import json
import subprocess
import sys
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('/workspace/shiba-cafe-docs/spec-v3-build/align-v5')
OUT.mkdir(parents=True, exist_ok=True)
data = json.loads(subprocess.check_output(['node', '--input-type=module', '-e',
    "import {MAP,SPRITES,footprintCentre,compareDepth} from './map-data.js'; console.log(JSON.stringify({zone:MAP.zones[0],sprites:SPRITES,items:[...MAP.zones[0].slots].sort(compareDepth).map(s=>({...s,centre:footprintCentre(s)}))}));"], cwd=ROOT))
z = data['zone']
ZOOM = 3
room = Image.open(ROOT / z['image']).convert('RGBA')
canvas = room.resize((room.width * ZOOM, room.height * ZOOM), Image.Resampling.LANCZOS)
def centre(i, j):
    return (z['origin']['x'] + z['cell']['w'] / 2 * (i-j), z['origin']['y'] + z['cell']['h'] / 2 * (1+i+j))
def diamond(i, j):
    x, y = centre(i,j)
    hw, hh = z['cell']['w']/2, z['cell']['h']/2
    return [(x,y-hh),(x+hw,y),(x,y+hh),(x-hw,y)]
# Match browser order: outlines over the floor, followed by depth-sorted sprites.
occupied = {tuple(c) for item in data['items'] for c in item['cells']}
draw = ImageDraw.Draw(canvas)
for i in range(z['cols']):
    for j in range(z['rows']):
        points = [(round(x*ZOOM),round(y*ZOOM)) for x,y in diamond(i,j)]
        draw.line(points+[points[0]], fill='#ffd36b' if (i,j) in occupied else '#7de7ff', width=4 if (i,j) in occupied else 2)
for item in data['items']:
    meta = data['sprites'][item['type']]
    sprite = Image.open(ROOT / meta['file']).convert('RGBA')
    scale = meta['scale'] * ZOOM
    sprite = sprite.resize((round(sprite.width*scale), round(sprite.height*scale)), Image.Resampling.LANCZOS)
    x,y = centre(*item['centre'])
    canvas.alpha_composite(sprite, (round(x*ZOOM-meta['anchor'][0]*scale),round(y*ZOOM-meta['anchor'][1]*scale)))
for item in data['items']:
    points = [p for c in item['cells'] for p in diamond(*c)]
    # Include the full sprite above the contact footprint, plus breathing room.
    meta = data['sprites'][item['type']]
    sprite = Image.open(ROOT / meta['file'])
    x,y = centre(*item['centre'])
    left = min(min(p[0] for p in points),x-meta['anchor'][0]*meta['scale'])-24
    top = min(min(p[1] for p in points),y-meta['anchor'][1]*meta['scale'])-24
    right = max(max(p[0] for p in points),x+(sprite.width-meta['anchor'][0])*meta['scale'])+24
    bottom = max(max(p[1] for p in points),y+(sprite.height-meta['anchor'][1])*meta['scale'])+24
    bounds = (max(0,round(left*ZOOM)),max(0,round(top*ZOOM)),min(canvas.width,round(right*ZOOM)),min(canvas.height,round(bottom*ZOOM)))
    path = OUT / f"align-{item['id']}.png"
    canvas.crop(bounds).save(path)
    print(path)
