# UI click audio (2026-10-29)

Source: user attachment クリック音.mp3 from the referenced chat Hit andBlow確認.
`audio/se/ui_click.mp3` preserves the original bytes. Stereo, 48 kHz, 0.990 s; the main signal occupies approximately the first 0.16 s.

Gain: 0.22, multiplied by master and SE volume. Uses the existing AudioContext, mobile gesture unlock, end/disconnect cleanup and page-hide cancellation.
A single delegated click listener handles mouse, native Enter/Space and touch-generated clicks. No additional pointer/touch sound listener.
Disabled/hidden/inert controls, scene hotspots, dialogue advance/skip and piano controls are excluded. `data-ui-sound="off"` opts individual buttons out.
Rapid requests replace the preceding click. Authored one-shot sounds take priority over a click from the same gesture. BGM and ambient loops retain their existing behavior.
Clicks waiting over 200 ms for load/resume are discarded to avoid stale playback.

Validation: 24 audio/cache tests passed. Whole suite: 374 passed / 41 failed; baseline: 370 passed / the identical 41 failed. Four new tests, no new failures.
Browser: `node tests/ui-click.browser.cjs` uses Edge desktop and mobile touch emulation to check MP3 decoding, settings controls, Enter activation, one playback per gesture and excluded controls.

Audio verification used decoding and waveform/level analysis; subjective listening and physical iPhone/Safari/Android interruption tests remain outstanding.
