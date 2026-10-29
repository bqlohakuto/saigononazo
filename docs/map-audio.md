# Room 6 map audio (2026-10-29)

Original user files preserved unchanged:
- 地図を書く.mp3 -> audio/se/map_write.mp3: stereo 44.1 kHz, 7.390 s, gain 0.45.
- 地図を広げる.mp3 -> audio/se/map_unfold.mp3: stereo 44.1 kHz, 0.928 s, gain 0.30.
Gains follow master and SE settings. Assets were verified by decoding/level analysis; subjective listening was not performed.

Map writing plays once at source line r6_fullmap_draw. It is a non-looping sound and stops when leaving that source line, so the long asset never delays the dialogue or continues under the completed-map conversation. Pagination, natural completion and app resume do not replay it.
Map unfolding plays at r6_map_03, when Hana hands over the map, and when an accepted map toggle changes closed to open. Closing uses the common soft UI click. Toggle buttons bypass the delegated click to prevent double playback. Zoom, movement and re-rendering do not trigger unfolding.

Source changes, dialogue completion, stopAll and page hide cancel pending/active sounds through existing audio cleanup. Slow requests over 500 ms are dropped. Existing mobile gesture unlock is reused; no additional AudioContext or dialogue timer is introduced.

Validation: 36 targeted audio/cache/map tests pass. Full suite: 432 tests, 391 pass, the same 41 existing failures. New tests cover source-line boundaries, repeated pages, natural end, app hide/resume, pending decoding cancellation, volume/mute, busy operations, opening/closing and zoom.
Physical smartphone playback and subjective listening remain unverified.
