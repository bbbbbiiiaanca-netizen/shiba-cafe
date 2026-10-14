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
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('/workspace/shiba-cafe-docs/spec-v3-build/align-v7')
OUT.mkdir(parents=True, exist_ok=True)
data = json.loads(subprocess.check_output(['node', '--input-type=module', '-e',
    "import {MAP,SPRITES,MAP_MARKERS,footprintCentre,footprintCells,compareDepth} from './map-data.js'; console.log(JSON.stringify({zone:MAP.zones[0],markers:MAP_MARKERS,sprites:SPRITES,items:[...MAP.zones[0].slots].sort(compareDepth).map(s=>({...s,cells:footprintCells(s),centre:footprintCentre(s)})),editItems:MAP.zones[0].slots.map(s=>s.id==='counter'?{...s,origin:[0,1],dir:1}:s).sort(compareDepth).map(s=>({...s,cells:footprintCells(s),centre:footprintCentre(s)}))}));"], cwd=ROOT))
z = data['zone']
ZOOM = 3
room = Image.open(ROOT / z['image']).convert('RGBA')
def centre(i, j):
    return (z['origin']['x'] + z['cell']['w'] / 2 * (i-j), z['origin']['y'] + z['cell']['h'] / 2 * (1+i+j))
def diamond(i, j):
    x, y = centre(i,j)
    hw, hh = z['cell']['w']/2, z['cell']['h']/2
    return [(x,y-hh),(x+hw,y),(x,y+hh),(x-hw,y)]
def render(items):
    canvas = Image.new('RGBA', (room.width * ZOOM, max(room.height, round(centre(z['cols']-1,z['rows'])[1]+64)) * ZOOM), '#202224')
    def stamp(meta, point):
        sprite = Image.open(ROOT / meta['file']).convert('RGBA')
        sprite = sprite.resize((sprite.width*ZOOM, sprite.height*ZOOM), Image.Resampling.LANCZOS)
        canvas.alpha_composite(sprite, (round((point[0]-meta['anchor'][0])*ZOOM), round((point[1]-meta['anchor'][1])*ZOOM)))
    for i in range(z['cols']):
        stamp(data['markers']['lockedTile'], centre(i,z['rows']))
    canvas.alpha_composite(room.resize((room.width*ZOOM, room.height*ZOOM), Image.Resampling.LANCZOS))
    stamp(data['markers']['expansion'], centre((z['cols']-1)/2,z['rows']))
    # Match browser order: outlines over the floor, followed by depth-sorted sprites.
    occupied = {tuple(c) for item in items for c in item['cells']}
    draw = ImageDraw.Draw(canvas)
    for i in range(z['cols']):
        for j in range(z['rows']+1):
            points = [(round(x*ZOOM),round(y*ZOOM)) for x,y in diamond(i,j)]
            draw.line(points+[points[0]], fill='#ffd36b' if (i,j) in occupied else '#7de7ff', width=4 if (i,j) in occupied else 2)
    for item in items:
        base = data['sprites'][item['type']]
        meta = base['back'] if item['dir'] >= 2 else base
        if not meta:
            continue
        sprite = Image.open(ROOT / meta['file']).convert('RGBA')
        mirrored = bool(item['dir'] % 2)
        # Browser mirror anchor: ax' = original image width - ax.
        ax = sprite.width - meta['anchor'][0] if mirrored else meta['anchor'][0]
        if mirrored:
            sprite = sprite.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        scale = meta['scale'] * ZOOM
        sprite = sprite.resize((round(sprite.width*scale), round(sprite.height*scale)), Image.Resampling.LANCZOS)
        x,y = centre(*item['centre'])
        canvas.alpha_composite(sprite, (round(x*ZOOM-ax*scale),round(y*ZOOM-meta['anchor'][1]*scale)))
    return canvas

canvas = render(data['items'])
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

# Full room composite of the screenshot's selected/flipped v7 edit layout.
edit_canvas = render(data['editItems'])
draw = ImageDraw.Draw(edit_canvas)
for cell in next(item for item in data['editItems'] if item['id'] == 'counter')['cells']:
    points = [(round(x*ZOOM),round(y*ZOOM)) for x,y in diamond(*cell)]
    draw.line(points+[points[0]], fill='#ffd36b', width=6)
path = OUT / 'align-counter-flipped.png'
edit_canvas.save(path)
print(path)

# Include all next-row diamonds and adjacent floor/rim, at 3x image scale.
points = [p for i in range(z['cols']) for p in diamond(i,z['rows'])]
bounds = (max(0,round((min(p[0] for p in points)-16)*ZOOM)),
          round((min(p[1] for p in points)-80)*ZOOM),
          min(canvas.width,round((max(p[0] for p in points)+16)*ZOOM)),
          min(canvas.height,round((max(p[1] for p in points)+16)*ZOOM)))
path = OUT / 'align-locked-row.png'
canvas.crop(bounds).save(path)
print(path)
