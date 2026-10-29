# Epilogue hospital monitor (2026-10-29)

User asset 心電図1.mp3 preserved unchanged as audio/se/hospital_monitor.mp3.
Stereo 44.1 kHz, 6.705 s; loop enabled with gain 0.25 multiplied by master and SE volume. Decoding, levels and near-silent file edges were checked; subjective listening was not performed.

The existing source-line ambience selector starts the monitor at r8_epilogue_01 and retains the same source through hospital lines 01-04, including r8_epilogue_02_ceiling and paginated source descendants. It stops at r8_epilogue_05, the transition away from the hospital. Home/notebook scenes and ending credits do not request it.
Resuming inside the hospital starts one loop; resuming at home remains silent. Existing stopAll, dialogue completion, page-hide/interruption cleanup, gesture unlock and category volume handling are reused. Fast advance invalidates pending decoding. No dialogue, visual or transition timing changes.

Validation: 44 audio/cache tests pass. Full suite: 443 tests, 402 pass, the same 41 pre-existing failures. Coverage includes hospital boundaries, uninterrupted pagination, mid-hospital/home resume, SE mute, pending load cancellation, leaving and page hide.
Physical smartphone playback, audible loop cadence and subjective listening remain unverified.
