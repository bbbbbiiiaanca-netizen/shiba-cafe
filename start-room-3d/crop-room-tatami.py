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
