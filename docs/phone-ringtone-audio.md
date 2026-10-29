# Room 3 phone ringtone (2026-10-29)

User asset スマホ着信.mp3 is preserved unchanged as audio/se/phone_ringtone.mp3.
Stereo 44.1 kHz, 2.125 s; gain 0.35 multiplied by master and SE volume.
Asset verification used decoding/level analysis; subjective listening was not performed.

One non-looping ringtone starts at room3_final_ringtone and stops at the next source line, room3_flashback_04_call (answering the call). Source phase tracking prevents replay on pagination, natural end, or app interruption. StopAll, leaving the memory and page hide use existing cleanup. Fast advance cancels pending decoding; playback requests delayed over 500 ms are discarded.
The source ringtone cue is explicitly classified as memory for music selection, preventing exploration BGM from briefly resuming between surrounding flashback lines.
No message-notification or phone-screen opening sounds were added; dialogue and scene timing are unchanged.

Validation: 39 audio/cache tests pass. Full suite: 436 tests, 395 pass, the same 41 pre-existing failures. Added coverage includes cue boundaries, pagination, natural end, interruption, memory exit, pending load cancellation, SE mute and continuous memory music selection.
Physical smartphone playback and subjective listening remain unverified.
