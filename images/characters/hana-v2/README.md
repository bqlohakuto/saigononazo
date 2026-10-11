# Hana v2 character PNG assets

UI code already supports `images/characters/hana-v2/` with fallback to the old 6-frame atlas.
This folder needs the ten transparent PNG files from the approved `hana-assets-ready.zip` package:

- full.png (standing full body)
- neutral.png, gentle.png, happy.png, thought.png, surprise.png
- concern.png, serious.png, sleepy.png, excited.png

The exact 1024×1536 originals are in the packaged files. Do not substitute generated images.
The nine cropped-at-the-waist expressions are used in dialogue. The full-body image is used in room exploration.
If files are absent, the game continues using the old atlas; it must not render a broken portrait.

Deploy the PNG files with a normal Git binary upload to main. Check mobile landscape and PC and ensure each expression is aligned correctly. No story, puzzle or save flags are modified.
