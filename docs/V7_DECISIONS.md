# V7 decisions (Decision Memory)
1. **Additive plugin, not a rewrite** — book code targets the old app; user asked to keep the current architecture. V7 = js/v7/* + installer (same convention as apply-phase345.mjs). Reversible (--uninstall). 
2. **One bank writer** — every award goes through v5 `award()` so VAR, undo and journal keep working.
3. **Engine is pure** — numbers live only in v7-engine.js so they are unit-testable; UI/phones never compute scores.
4. **Computer = source of truth** — phones send commands; host validates role + state + idempotency id and timestamps. Case code never leaves the desktop (sealed SHA-256, 6 hex).
5. **Overlays on the recorded canvas** via a wrapper around global draw(); V7 owns subtitles (legacy caption blanked only during v5 draw, restored after).
6. **Chroma Studio is a separate DOM window** with its own recorder, so the main recording is unaffected.
7. **R2 fix** — distance lines are distances *from* the basket; farther = more seconds (2m +5, 3m +10, 4m +20).
Superseded: v5 ILL.distance (inverted: +20 nearest the basket).
