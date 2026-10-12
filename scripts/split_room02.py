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
# Follow the tray tops and the actual rear tabletop edge, not a bounding box.
DESK_OUTLINE = [
    (330, 749), (432, 625), (432, 611), (438, 604), (689, 604),
    (689, 617), (984, 617), (984, 604), (1224, 604), (1231, 611),
    (1231, 625), (1326, 749), (1326, 786), (1301, 786),
    (1301, 941), (351, 941), (351, 786), (330, 786),
]

def masked_layer(original, alpha):
    # Clear hidden RGB too: no wall-colored pixels in transparent margins.
    layer = Image.new("RGBA", original.size, (0, 0, 0, 0))
    layer.paste(original, (0, 0), alpha)
    return layer


def main():
    original = Image.open(SOURCE).convert("RGBA")
    if original.size != (1672, 941):
        raise ValueError(f"Unexpected adopted room 2 dimensions: {original.size}")
    mask = Image.new("L", original.size, 0)
    ImageDraw.Draw(mask).polygon(DESK_OUTLINE, fill=255)
    backdrop = masked_layer(original, ImageChops.invert(mask))
    foreground = masked_layer(original, mask)

    assert Image.alpha_composite(backdrop, foreground).tobytes() == original.tobytes()
    assert mask.getpixel((830, 750)) == 255
    assert mask.getpixel((830, 420)) == 0
    assert mask.getpixel((1450, 620)) == 0

    bg = FOLDER / "room02_bg_nodesk.png"
    fg = FOLDER / "room02_desk_foreground.png"
    backdrop.save(bg, "PNG", optimize=True)
    foreground.save(fg, "PNG", optimize=True)
    check_bg = Image.open(bg).convert("RGBA")
    check_fg = Image.open(fg).convert("RGBA")
    assert check_bg.getchannel("A").tobytes() == ImageChops.invert(mask).tobytes()
    assert check_fg.getchannel("A").tobytes() == mask.tobytes()
    assert Image.alpha_composite(check_bg, check_fg).convert("RGB").tobytes() == original.convert("RGB").tobytes(), "Decoded image pixels changed"

    for point in [(426, 595), (500, 600), (700, 607), (950, 607), (1250, 640), (1400, 750), (1600, 650)]:
        assert check_fg.getpixel(point) == (0, 0, 0, 0), f"Background residue at {point}"
    print(f"Room02 desk alpha split: pixel-perfect 1672x941; bg={bg.stat().st_size}, fg={fg.stat().st_size}")
    print(f"Front table alpha center={mask.getpixel((830,750))}, wall alpha={mask.getpixel((830,420))}")

if __name__ == "__main__":
    main()
