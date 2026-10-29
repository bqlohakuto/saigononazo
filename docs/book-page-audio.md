# Room 7 book page sound (2026-10-29)

User asset 本のページをめくる.mp3 is preserved unchanged as audio/se/book_page_turn.mp3.
Stereo 44.1 kHz, 0.876 s, gain 0.30 multiplied by master and SE volume.
Asset verification used decoding/level analysis; subjective listening was not performed.

The existing reader opens a fixed bookmark spread, rather than navigating multiple pages. The sound accompanies opening this spread; no new paging controls were added.
- First book: sound at r7_first_open_02 (the cover opens). The subsequent reader transition explicitly suppresses a second sound.
- Later openings/reopenings: one sound when the valid book reader is created.
- Invalid/unplaced/locked books, zoom, shelf return and redraw do not trigger it.

Existing UI click is cancelled when the page sound is requested. Repeated page sounds replace each other, authored one-shot effects take priority, BGM remains unchanged. Pending requests expire after 200 ms. Existing mobile gesture unlock, page-hide/stopAll cancellation and node cleanup are reused. Dialogue and visual timing are unchanged.

Validation: 43 targeted audio/cache/book tests pass. Full suite: 440 tests, 399 pass, the same 41 existing failures. Tests cover first-opening timing, no double playback, reader gates, zoom/return, sound priority, gain and pending decoding cancellation. Two existing source-extraction test anchors now accept the optional sound argument; their spoiler/clue assertions are unchanged.
Physical smartphone playback and subjective listening remain unverified.
