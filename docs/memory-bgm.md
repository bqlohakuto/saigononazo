# Shared memory BGM (2026-10-29)

User asset Afternoon_by_the_Window.mp3 preserved unchanged as audio/bgm/memories.mp3.
Stereo 44.1 kHz, 154.958 s, 3,725,127 bytes. Gain 0.22, loop enabled, BGM category. Decoding/levels were checked; subjective listening and audible loop-seam verification were not performed.

The source-line music selector uses memoryMusic for Room 2-7 recollections, including Room 7 short animal memories and Room 6 final-signal lines. Source pagination retains one source. The track fades in via existing loop playback and fades out over 450 ms on exit; returning during a fade safely replaces the fading source.

Preserved scenes:
- Room 1 piano and memory band remain unchanged and do not receive shared BGM.
- Room 7 accident recollection uses BGM through r7_mem_25, then fades it out at the intersection (26), before brake/impact/silence. Existing street ambience continues independently.
- Room 8 truth/farewell, hospital monitor and ending credits retain their existing audio choices.

The BGM follows BGM/master volume independently of SE. Existing page-hide/interruption cancellation and gesture-based music resume are reused. Leaving while loading prevents stale playback. No narration, puzzle state, AUTO timing or scene duration changes.

Validation: 51 audio/cache tests pass. Full suite: 454 tests, 413 pass, the same 41 existing failures. Tests cover shared source selection, no restart within memories, existing scene exceptions, BGM mute, interruption resume, re-entry during fade and pending-load cancellation.
Physical smartphone playback, subjective balance and audible loop cadence remain unverified.
