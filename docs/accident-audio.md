# Room 7 accident audio (2026-10-29)

User assets preserved unchanged:
- 車の急ブレーキ.mp3 -> audio/se/car_brake.mp3; stereo 44.1 kHz, 3.263 s, gain 0.50.
- 車の衝突.mp3 -> audio/se/car_crash.mp3; stereo 48 kHz, 1.523 s, gain 0.55.
Both follow SE and master volume. Verification used decoding/level analysis, not subjective listening.

Source-line synchronization uses the existing memory audio callback:
- r7_mem_01-25: existing city ambience.
- r7_mem_26-34: existing intersection ambience.
- r7_mem_32-34: one brake cue when the protagonist starts running; natural end does not replay it on later pages. Resuming inside this phase starts it once.
- r7_mem_35: stop ambience and brake, then play one impact as the view turns red.
- r7_mem_36 onward: stop any remaining impact for the text about sound receding, preserving the following silence.

No dialogue, visual, AUTO/SKIP delay or scene-transition timing changes. Cue state prevents pagination or a resumed AudioContext from replaying a completed one-shot. Fast advance, memory completion, stopAll and leaving the memory invalidate pending decoding and stop sources. Requests waiting over 500 ms are discarded. Existing mobile gesture unlock, hide/interruption behavior and source cleanup are reused.

Validation: 32 audio/cache tests pass. Full suite: 428 tests, 387 pass, the same 41 pre-existing failures. Tests cover ordered ambience/brake/impact/silence, repeated source pages, ended sources, page hide, pending decode cancellation, SE mute and leaving the scene.
Physical smartphone playback and subjective listening remain unverified.
