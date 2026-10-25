# Ending credits — こたえあわせ

The unchanged room-eight epilogue calls `EndingCredits.start` after its final line. An `ended + epilogueSeen` save replays the credits from the beginning. Save schema and scenario text are unchanged.

Source: user attachment gemini_music.mp3; stored without transcoding at audio/bgm/kotaeawase.mp3 (166.243208 seconds). SHA-256: 2dbf8a12f61bc2fb1a40dbb1dcc66acf883ba5049e0b11c322f1480d020e1338.

Only the nine explicitly approved staff roles are included; earlier assistant suggestions for other roles were not treated as confirmed credits.

Song-relative cues: individual staff cards 0–132 seconds; title fades in at 135; delete `るまで` at 144–146; type `ても` at 147–148; hold through 156; THANKS FOR PLAYING from 158 to the piano tail. Return to title only after the actual media `ended` event. These cues use the media clock and freeze while buffering. Exact alignment to sung phrases still requires a listening review; the schedule is not a word-level transcript.

Existing BGM fades out over 1.6 seconds before playback. The song never loops. The shared BGM and master volume setters update the track. Loading/autoplay failures offer retry or explicit silent playback. Backgrounding pauses the track; returning resumes it or offers a gesture prompt. Silent playback uses the same duration and pauses while hidden. Leaving the scene cancels its animation and releases its media.

Validation: `node --test tests/ending-credits.test.cjs tests/game-audio.test.cjs tests/cache-version.test.cjs`; `JSDOM_PATH=... node tests/room8-flow.test.cjs` and `tests/late-game-flow.test.cjs`. Browser: `BASE_URL=... node tests/ending-credits.browser.cjs`; optionally set CHROMIUM_PATH for a system Chromium binary. The browser test plays the full song at normal speed, checks the exact rewritten title and title return, tests live BGM mute, landscape proportions, completed-save replay, and missing-audio recovery.

Platform limit: iOS hardware-volume behavior for HTMLAudio should be checked on a physical device. Browser emulation does not establish audible output or word-level lyric alignment.

## Epilogue PC transition

The last epilogue line now opens a 7.5-second transition using the same bedroom-v4 background. A black screen overlay follows the measured laptop display corners and fades in the original game title. After a 2.4-second opening, the photograph and overlay zoom together for five seconds; the title fades away and the display fills the frame with black before the credits start. The song and its clock remain unchanged and begin after this transition. Reduced-motion preference uses a stationary dissolve. Hidden pages pause the transition and leaving the scene cancels its callback. Completed saves replay this transition before the credits.
