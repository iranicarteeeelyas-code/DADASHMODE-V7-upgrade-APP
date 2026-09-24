# V7 research notes (sources)
**Show graphics / pacing (MrBeast, Beast Games):** bold condensed type, white/yellow on black, huge numerals; slam-in 180–240 ms with 8–12% overshoot; reveal flash 60–100 ms then hold 0.7–1.2 s; countdown emphasis on final ticks. Tubefilter coverage of MrBeast's production memo & editing pace. Safe areas: ITU-R BT.1848, EBU R95 (action 3.5%, graphics 5%).
**Chroma keying:** OBS Studio chroma_key_filter shader (github.com/obsproject/obs-studio, plugins/obs-filters/data/chroma_key_filter.effect): 3×3 box-filtered CbCr distance, similarity/smoothness/spill with pow 1.5. Boris FX keying/light-wrap papers for light wrap & choke practice. Compositing in linear light (sRGB ≈ gamma 2.2).
**Subtitles:** Netflix Timed Text Style Guide (min 5/6 s, max 7 s, 2 lines, 42 chars/line; Arabic 20 cps → Persian ≤20 cps); BBC Subtitle Guidelines (160–180 wpm); W3C WebVTT; Library of Congress SRT format description; MDN (TextTrack/VTTCue).
**Motion:** Material Design 3 motion (durations 50–600 ms, emphasized easing), easeOutBack c1=1.70158; Apple HIG (44 pt touch targets, reduced motion).
**Networking:** RFC 6455 (WebSocket), MDN BroadcastChannel, Screen Wake Lock API, Vibration API.
**QR:** ISO/IEC 18004 (encoder structure after Nayuki's reference implementation).
