"""Approved room texture crop only; preserve the approved floor tile's alpha silhouette.
The source is the central floor cell, derived from MAP's 6×6 geometry.
No painting, colour correction, borders or generated art.
"""
from pathlib import Path
from PIL import Image
root = Path(__file__).resolve().parent / 'assets/drive'
room = Image.open(root / 'room-tatami-noline.png').convert('RGBA')
tile = Image.open(root / 'tiles/tatami-approved.png').convert('RGBA')
# MAP cell (3,3), image centre (429,405); measured spec geometry, not tuning.
centre = (429, 181 + (3 + 3 + 1) * tile.height // 2)
left, top = centre[0] - tile.width // 2, centre[1] - tile.height // 2
crop = room.crop((left, top, left + tile.width, top + tile.height))
crop.putalpha(tile.getchannel('A'))
crop.save(root / 'tiles/tatami-room-crop.png')

# Task B: remove the original front rim on expanded axes, using the spec's
# (429,181) floor vertex, 128x64 cells and 6x6 room. Only crop approved art.
for axis in ('j', 'ij'):
    merged = room.copy()
    pixels = merged.load()
    for y in range(room.height):
        for x in range(room.width):
            if ('i' in axis and y + (x - 429) / 2 > 181 + 6 * 64) or ('j' in axis and y - (x - 429) / 2 > 181 + 6 * 64):
                pixels[x, y] = (0, 0, 0, 0)
    merged.save(root / 'tiles' / f'room-merged-{axis}.png')
