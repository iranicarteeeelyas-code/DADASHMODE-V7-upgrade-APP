# CHANGELOG · V7.0.0
- NEW js/v7/v7-engine.js: pure rules engine (Director Book V7 §1.3), Node+browser, 53 acceptance tests.
- NEW v7-core.js: state machine READY→…→END, permissions per role, idempotent exec(), all bank writes via v5 award(), journal kind 'v7', §9.5 event log + CSV.
- NEW v7-stage.js: subtitle engine, MrBeast-style moments, live HUDs (R2/R3/R4/shop/risk/vault/memory/riddle), ILL overrides; FIXED distance illustration.
- NEW v7-chroma.js: WebGL Chroma Studio (6-pass).
- NEW phone mode: tools/serve-v7.mjs (RFC6455 hub, rooms+PIN), v7-sync.js, remote.html, offline QR (v7-qr.js).
- NEW v7-panel.js: V7 drawer (game, subtitles, phones, case code, chroma, log/tests).
- NEW css/v7.css pro skin + responsive; css/v7-ctl.css controller.
- CHANGED (runtime, additive): R2 labels 2/3/4 m; new games registered; theme «بانک زمان V7» added; defaultEpisode → V7 episode; sw.js caches V7 and bypasses /api/.
- UNCHANGED: v5 persistence (IndexedDB, 25 versions, undo), journal, voice engines, v5 chroma mode, v5 keys.
