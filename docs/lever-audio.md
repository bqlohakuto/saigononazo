# Lever audio (2026-10-29)

Source: user-supplied レバーを倒す.mp3, preserved unchanged as audio/se/lever_pull.mp3.
Decoded stereo 44.1 kHz, 1.008 seconds; active signal approximately 0.023-0.487 seconds. Gain 0.35 multiplied by SE and master volume. Validation used decoding/level analysis, not subjective listening.

- Room 2: play once after completeness and duplicate checks accept a fresh guess. Pending result/memo and exhausted challenge attempts are ignored. Existing result display stays at 340 ms; result sound cancels the lever tail and any pending lever playback.
- Room 6: play only after turn, move-limit and legal-placement checks pass, before existing board animation. Reduced-motion mode uses the same trigger. No new delays or animation changes.
- Lever buttons opt out of common UI click playback, so invalid moves are also silent.
- Repeated lever sounds replace their previous source. Authored one-shot effects take priority; BGM/ambience continue. Requests delayed over 200 ms are discarded. Existing mobile gesture unlock, page-hide stop, volume/mute and source cleanup are reused.

Validation: full Node suite 425 tests, 384 pass, 41 pre-existing failures; no new failing test names. Five added tests exercise accepted/rejected/busy operations, unchanged result timing, reduced motion, sound priority, gain/mute and pending-load cancellation.
Physical smartphone playback and subjective listening remain unverified.
