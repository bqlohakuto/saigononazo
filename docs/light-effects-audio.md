# Room passage sparkle and constellation glow (2026-10-29)

User-selected mapping, originals preserved unchanged:
- sparkle-1.mp3 -> audio/se/room_sparkle.mp3: 4.727 s, gain 0.12.
- きらきら輝く2.mp3 -> audio/se/constellation_glow.mp3: 13.781 s, gain 0.40.
Both are non-looping and follow master/SE volume. Asset verification used decoding and level-envelope analysis; subjective listening remains unperformed.

The shared showRoomTravel helper requests the original door sound plus sparkle. At its unchanged arrival callback, sparkle fades out over 180 ms. A pending decode is cancelled by the existing fade helper. sound=false suppresses both sounds. Room 6 board travel and the direct accident-to-Room-8 transition do not use this helper and keep their original audio behavior.

Constellation glow replaces the generic correct sound only for Room 4's final constellation completion. Source lines r4ok1-8 keep one non-looping source across pagination, and natural completion does not restart it. Dialogue completion/entry into memory, scene changes and stopAll clear it. Existing memory cleanup, interruption/page-hide handling and mobile gesture unlock are reused. No story timing or transition duration is changed.

Validation: 52 targeted audio/cache/passage tests pass in the full suite. Whole suite: 447 tests, 406 pass, the same 41 pre-existing failures. New tests cover glow phase boundaries, repeated pages, pending-load cancellation, sparkle coexistence with door/BGM, SE volume and arrival fade at the unchanged time.
Physical smartphone playback and subjective listening remain unverified.
