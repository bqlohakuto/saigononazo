"""Normalize the approved sleep drawing without changing its proportions."""
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'images/characters/hana-hires'
source = BASE / 'sources/sleep-approved.webp'
pixels = np.array(Image.open(source).convert('RGBA'))
labels, _ = ndi.label(pixels[:, :, 3] >= 128)
sizes = np.bincount(labels.ravel()); sizes[0] = 0
mask = labels == sizes.argmax()
# Preserve the connected silhouette, suppress disconnected generated specks,
# and replace only the narrow colored edge with the nearest interior color.
core = ndi.binary_erosion(mask, iterations=3)
_, nearest = ndi.distance_transform_edt(~core, return_indices=True)
edge = mask & ~core
rgb = pixels[:, :, :3].copy()
rgb[edge] = rgb[nearest[0][edge], nearest[1][edge]]
alpha = np.where(mask, 255, 0).astype(np.uint8)
out = Image.fromarray(np.dstack([rgb, alpha]), 'RGBA')
ys, xs = np.where(mask)
box = (max(0, int(xs.min())-8), max(0, int(ys.min())-8),
       min(out.width, int(xs.max())+9), min(out.height, int(ys.max())+9))
out = out.crop(box)
target = BASE / 'poses/sleeping.webp'
target.parent.mkdir(parents=True, exist_ok=True)
out.save(target, lossless=True, method=6)
manifest = {
    'approvedSource': 'sources/sleep-approved.webp',
    'sourceSize': list(Image.open(source).size), 'crop': list(box),
    'assets': [{'path': 'poses/sleeping.webp', 'width': out.width, 'height': out.height,
                'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}],
    'interiorAlphaMin': int(np.array(out)[:, :, 3][np.array(out)[:, :, 3] > 0].min()),
    'motion': {'durationSeconds': 4.8, 'rotationDegrees': 0.07,
               'origin': '99% 81%', 'scaling': False,
               'sourceFrameCount': 1}
}
(BASE / 'sleep-manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
print(json.dumps(manifest))
