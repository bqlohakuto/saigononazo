#!/usr/bin/env python3
"""Normalize approved art and generated eye poses into a body-locked blink.

The character is never redrawn here. White connected to the canvas boundary is
the matte; opaque enclosed white fabric is preserved. Only two eye windows from
the single generated strip are composited over the approved master.
"""
from pathlib import Path
from io import BytesIO
import argparse, hashlib, json, os, uuid
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'images/characters/hana-hires'
EYE_BOXES = [(374, 160, 451, 220), (476, 180, 551, 239)]

def write_image(im, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    b = BytesIO()
    im.save(b, 'WEBP', lossless=True, exact=True, method=4)
    temp = path.with_name('.writing-' + uuid.uuid4().hex)
    temp.write_bytes(b.getvalue())
    os.replace(temp, path)
    return hashlib.sha256(path.read_bytes()).hexdigest()

def extract_matte(rgb):
    pixels = np.asarray(rgb).astype(np.float64)
    white = (pixels.min(2) >= 240) & ((pixels.max(2)-pixels.min(2)) < 20)
    seed = np.zeros(white.shape, bool)
    seed[0, :] = white[0, :]; seed[-1, :] = white[-1, :]
    seed[:, 0] = white[:, 0]; seed[:, -1] = white[:, -1]
    bg = ndi.binary_propagation(seed, mask=white)
    components, count = ndi.label(~bg)
    sizes = np.bincount(components.ravel()); sizes[0] = 0
    fg = components == sizes.argmax()
    alpha = fg.astype(np.float64)
    # Unmatte only a one-pixel external antialias band. Interior alpha is 255.
    core = ndi.binary_erosion(fg)
    boundary = fg & ~core
    _, nearest = ndi.distance_transform_edt(~core, return_indices=True)
    reference = pixels[nearest[0], nearest[1]]
    denominator = 255-reference.min(2)
    usable = boundary & (denominator > 45)
    alpha[usable] = np.clip((255-pixels.min(2)[usable])/denominator[usable], .05, 1)
    colors = pixels.copy()
    colors[usable] = np.clip(255+(pixels[usable]-255)/alpha[usable,None],0,255)
    colors[~fg] = 0
    rgba = np.dstack((np.rint(colors).astype('uint8'),np.rint(alpha*255).astype('uint8')))
    result = Image.fromarray(rgba)
    assert np.all(rgba[core,3] == 255), 'Character interiors must be opaque'
    return result

def eye_frames(base, strip):
    # The strip has exactly three 724px slots. Register its open-eye landmarks
    # once to the approved original, and reuse that transform for all eyelids.
    p1, p2 = complex(273.5,311.5), complex(472.5,345)
    q1, q2 = complex(412,187), complex(513.5,204.5)
    scale = (q2-q1)/(p2-p1)
    offset = q1-scale*p1
    inv = 1/scale
    coefficients = (inv.real,-inv.imag,(-offset*inv).real,
                    inv.imag,inv.real,(-offset*inv).imag)
    mask = Image.new('L',base.size)
    draw = ImageDraw.Draw(mask)
    for box in EYE_BOXES: draw.ellipse(box,fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(1.4))
    frames = [base.copy(),base.copy()]
    for slot in [1,2]:
        panel = strip.crop((slot*724,0,(slot+1)*724,724)).convert('RGB')
        registered = panel.transform(base.size,Image.Transform.AFFINE,coefficients,
                                     Image.Resampling.BICUBIC)
        frame = base.copy()
        colors = Image.composite(registered,base.convert('RGB'),mask)
        frame.paste(colors,(0,0)); frame.putalpha(base.getchannel('A'))
        frames.append(frame)
    return frames

def normalize(frames):
    box = frames[0].getbbox(); x0,y0,x1,y1 = box
    scale = 1888/(y1-y0)
    size = (round((x1-x0)*scale),1888)
    offset = ((1024-size[0])//2,112)
    output=[]
    for frame in frames:
        resized=frame.crop(box).resize(size,Image.Resampling.LANCZOS)
        canvas=Image.new('RGBA',(1024,2048));canvas.alpha_composite(resized,offset)
        output.append(canvas)
    return output,box,scale,offset

def quality(frames):
    arrays=[np.array(f) for f in frames]
    union=np.zeros(arrays[0].shape[:2],bool)
    for a in arrays[1:]:union |= np.any(a!=arrays[0],axis=2)
    ys,xs=np.where(union)
    diffbox=[int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)]
    assert diffbox[3] < 400, 'Blink changes body pixels'
    for a in arrays[1:]:
        assert np.array_equal(a[400:],arrays[0][400:]), 'Body must be byte-identical'
        assert np.array_equal(a[:,:,3],arrays[0][:,:,3]), 'Alpha must be invariant'
    alpha=arrays[0][:,:,3]
    interior=ndi.binary_erosion(alpha>=128,iterations=6)
    assert np.all(alpha[interior]==255), 'No translucent clothing interiors'
    return {'bodyPixelDifferences':0,'alphaPixelDifferences':0,
            'changedEyeBounds':diffbox,'interiorAlphaMin':int(alpha[interior].min()),
            'canvas':[1024,2048],'shoeBaseline':2000}

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--master');parser.add_argument('--blink-strip')
    args=parser.parse_args()
    if args.master:
        write_image(Image.open(args.master).convert('RGB'),OUT/'sources/approved-neutral.webp')
    if args.blink_strip:
        write_image(Image.open(args.blink_strip).convert('RGBA'),OUT/'sources/blink-strip.webp')
    rgb=Image.open(OUT/'sources/approved-neutral.webp').convert('RGB')
    strip=Image.open(OUT/'sources/blink-strip.webp')
    assert rgb.size==(887,1774) and strip.size==(2172,724)
    base=extract_matte(rgb)
    frames,box,scale,offset=normalize(eye_frames(base,strip))
    check=quality(frames)
    assets=[]
    for i,frame in enumerate(frames,1):
        name=f'idle/{i:02}.webp';sha=write_image(frame,OUT/name)
        assets.append({'path':name,'width':frame.width,'height':frame.height,'sha256':sha})
    portrait=base.crop((190,0,700,510)).resize((512,512),Image.Resampling.LANCZOS)
    sha=write_image(portrait,OUT/'portrait-neutral.webp')
    assets.append({'path':'portrait-neutral.webp','width':512,'height':512,'sha256':sha})
    manifest={'version':'20261015-hana-hires-idle-01','approvedSourceSize':list(rgb.size),
              'quality':check,'assets':assets,
              'eyeSourceBoxes':EYE_BOXES,'normalization':{'sourceBounds':box,'scale':scale,'offset':offset}}
    (OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    # Preview uses one palette for all frames so GIF quantization cannot shimmer.
    previews=[]
    for f in frames:
        bg=Image.new('RGBA',f.size,'#ded8ce');bg.alpha_composite(f)
        previews.append(bg.convert('RGB').resize((320,640),Image.Resampling.LANCZOS))
    palette=previews[0].quantize(colors=255)
    previews=[f.quantize(palette=palette,dither=Image.Dither.NONE) for f in previews]
    previews[0].save(OUT/'blink-preview.gif',save_all=True,
                    append_images=[previews[2],previews[3],previews[2],previews[0]],
                    duration=[3800,90,100,90,150],loop=0,optimize=False)
    print(json.dumps(check))

if __name__=='__main__':main()
