"""Extract the author's phone drawing without redrawing or changing RGB pixels.

Run from any directory with Python, Pillow and NumPy. The original stays intact.
This mask is for the supplied phone drawing, not a general background remover.
"""

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "images/items/source/phone-closed-original.jpg"
OUTPUT = ROOT / "images/items/phone-closed.png"


def main():
    original = Image.open(SOURCE).convert("RGB")
    rgb = np.asarray(original)
    height, width = rgb.shape[:2]
    # The dark outline encloses even the white highlights and display marks.
    eligible = rgb.min(axis=2) < 205
    seed_x, seed_y = 580, 450
    assert (width, height) == (1280, 840), "Unexpected source dimensions"
    assert eligible[seed_y, seed_x], "Seed must be inside the phone"
    core = np.zeros((height, width), dtype=bool)
    core[seed_y, seed_x] = True
    pending = deque([(seed_x, seed_y)])
    while pending:
        x, y = pending.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < width and 0 <= ny < height:
                if eligible[ny, nx] and not core[ny, nx]:
                    core[ny, nx] = True
                    pending.append((nx, ny))

    filled = Image.fromarray(core.astype("uint8") * 255).copy()
    ImageDraw.floodfill(filled, (0, 0), 128)
    # Keep all enclosed light pixels; never punch holes in the phone artwork.
    silhouette = np.asarray(filled) != 128
    opaque = Image.fromarray(silhouette.astype("uint8") * 255)
    rim = (np.asarray(opaque.filter(ImageFilter.MaxFilter(3))) > 0) & ~silhouette
    alpha = silhouette.astype("uint8") * 255
    # Only the one-pixel outer rim is partially transparent to avoid white edges.
    edge_alpha = np.clip((255.0 - rgb.min(axis=2)) / 50.0, 0, 1)
    alpha[rim] = np.round(edge_alpha[rim] * 255).astype("uint8")

    rgba = np.dstack((rgb, alpha))
    result = Image.fromarray(rgba)
    x0, y0, x1, y1 = Image.fromarray(alpha).getbbox()
    crop = (max(0, x0 - 2), max(0, y0 - 2), min(width, x1 + 2), min(height, y1 + 2))
    result = result.crop(crop)
    assert np.array_equal(np.asarray(result)[:, :, :3], np.asarray(original.crop(crop)))
    assert result.getchannel("A").getextrema() == (0, 255)
    assert silhouette[310, 600] and silhouette[430, 585], "Display must stay opaque"
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    result.save(OUTPUT, optimize=True)
    print(f"Saved {OUTPUT}")
    print(f"Size: {result.size}; source crop: {crop}; RGB unchanged; alpha: 0..255")


if __name__ == "__main__":
    main()
