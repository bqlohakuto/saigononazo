# Item placement audio (2026-10-29)

Original user asset 物を置く音.mp3 preserved unchanged as audio/se/item_place.mp3.
Stereo 44.1 kHz, 1.082 s, gain 0.30 multiplied by master and SE volume. Asset validation used decoding/level analysis; subjective listening remains unperformed.

Triggers:
- Room 2: accepted token placement, relocation, replacement or swap. Tray selection, removal, invalid drops and same-state drops do not request the placement sound. Touch and drag share the placement path; touch swaps also request one sound.
- Room 4: an owned glass pane is mounted for the first time. Rotation/reinspection stays unchanged.
- Room 5: a selected collected panel is committed to a free valid slot, after all existing placement gates pass. Selection, removal, full/locked/busy states and occupied targets do not request it.

The sound cancels pending common UI clicks; repeated placement requests replace the preceding placement source. Other authored one-shot effects take priority, BGM remains continuous. Requests delayed more than 200 ms are dropped. Existing gesture unlock, volume/mute, page-hide/stopAll and source cleanup are reused. Puzzle rules and story timing are unchanged.

Validation: 51 targeted audio/cache/placement tests pass within the full suite. Full suite: 451 tests, 410 pass, the same 41 pre-existing failures. Added coverage executes actual token, glass and panel placement handlers plus sound priority/gain behavior.
Physical smartphone playback and subjective listening remain unverified.
