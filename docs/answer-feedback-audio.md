# Answer feedback audio (2026-10-29)

Original user files: 正解音.mp3 and 不正解音.mp3, copied unchanged to
`audio/se/answer_correct.mp3` and `audio/se/answer_incorrect.mp3`.
Both decode as stereo 44.1 kHz MP3: correct 1.056 s, incorrect 1.033 s.
Gains: correct 0.30, incorrect 0.40; both follow SE and master volume.
Audio validation is decoding/level analysis, not subjective listening.

## Trigger points

- Room 1: incorrect nonempty piano submission. Correct keeps the existing memory melody.
- Room 2: only a fresh valid guess, when the digital HIT/BLOW result appears (existing 340 ms timer). 5 HIT = correct; other results = incorrect. No sound for incomplete or duplicate guesses, and no sound from restored history.
- Room 3: correct Morse reply or incorrect nonempty reply. Final correct reply keeps the existing unlock sound.
- Room 4: word answers, completed rainbow order and completed projection. A fully mounted but incorrect projection plays incorrect; incomplete assembly is left silent.
- Room 5: four-digit incorrect keypad answer / correct keypad answer. Existing later unlock cue remains unchanged.
- Room 7: incorrect zodiac door selection / intermediate correct selection. The final door keeps its authored door and memory cues.
- Room 8: incorrect nonempty name only. All three accepted spellings preserve the final scene's quiet success.
- Room 6 movement and board operations retain their existing sounds; intermediate exploration actions are not classified as incorrect answers.

Feedback replaces opposite/repeated feedback and cancels the pending UI click. Other authored one-shots cancel feedback, while BGM/ambience loops continue. Requests delayed over 500 ms are discarded. Existing gesture unlock, page-hide cancellation and source/gain cleanup are reused. No new timers or waits change story progression.

Validation: 29 targeted audio/cache/answer tests pass. Full suite: 420 tests, 379 pass, 41 pre-existing failures; failure names match the pre-change baseline. Includes actual keypad and final-name handler execution, volume/mute, replacement, pending-load cancellation and authored melody priority.
Physical smartphone playback and subjective listening remain unverified.
