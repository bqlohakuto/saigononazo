#!/usr/bin/env python3
"""Split the approved Room 2 image into transparent background and desk foreground.

No approved illustration pixels are repainted. The two images composite exactly
back to the original, so Hana can be placed in between without changing the art.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "images/background/room02/room02_adopted.webp"
FOLDER = SOURCE.parent
DESK_OUTLINE = [
    (323, 738), (426, 595), (683, 595), (683, 602), (970, 602),
    (970, 595), (1213, 595), (1317, 738), (1317, 941), (323, 941),
]

def main():
    original = Image.open(SOURCE).convert("RGBA")
    if original.size != (1672, 941):
        raise ValueError(f"Unexpected adopted room 2 dimensions: {original.size}")
    mask = Image.new("L", original.size, 0)
    ImageDraw.Draw(mask).polygon(DESK_OUTLINE, fill=255)
    backdrop = original.copy()
    backdrop.putalpha(ImageChops.invert(mask))
    foreground = original.copy()
    foreground.putalpha(mask)

    assert Image.alpha_composite(backdrop, foreground).tobytes() == original.tobytes()
    assert mask.getpixel((830, 750)) == 255
    assert mask.getpixel((830, 420)) == 0
    assert mask.getpixel((1450, 620)) == 0

    bg = FOLDER / "room02_bg_nodesk.webp"
    fg = FOLDER / "room02_desk_foreground.webp"
    backdrop.save(bg, "WEBP", lossless=True, method=6)
    foreground.save(fg, "WEBP", lossless=True, method=6)
    check_bg = Image.open(bg).convert("RGBA")
    check_fg = Image.open(fg).convert("RGBA")
    assert check_bg.getchannel("A").tobytes() == ImageChops.invert(mask).tobytes()
    assert check_fg.getchannel("A").tobytes() == mask.tobytes()
    assert Image.alpha_composite(check_bg, check_fg).convert("RGB").tobytes() == original.convert("RGB").tobytes(), "Decoded image pixels changed"

    print(f"Room02 desk alpha split: pixel-perfect 1672x941; bg={bg.stat().st_size}, fg={fg.stat().st_size}")
    print(f"Front table alpha center={mask.getpixel((830,750))}, wall alpha={mask.getpixel((830,420))}")

if __name__ == "__main__":
    main()
