# AGENTS.md — welding-tools

## Mission
Build a timer-free classroom reimplementation of the rulergame.net games (Tape Measure, Dial Caliper) plus an AWS welding-symbol trainer. Everything lives in `apps/measuring/`: zero dependencies (vanilla JS + canvas in the browser; node built-ins only for tooling), no external assets, must work from `file://`.

## Objective
Work is driven by `apps/measuring/PLAN.md` (the single live plan). Per-turn protocol: read PLAN.md → take the next unchecked step → do minimal targeted reads → write outputs → check the box → commit + push (one commit per turn).
- A step is "done" only when its explicit gate in PLAN.md passes.
- This host has **no browser/X**: gates are node-based (`node --check`, pure-logic tests in `apps/measuring/tests/`). Final visual verification is the user's, in a real browser (S9).
- Current state: S0–S2 done (caliper facts complete). **S3 in progress** — the folded ruler analysis is already rescued into `ref/` (files untracked: commit them). What remains: transcribe the ruler 6 bullets + `## shared` + the build-ready table into `FACTS.md` (no TBD), then S4.

## Map
Two phases, one spine:

- **Extract (S0–S4)**: `src/*.orig.js` (obfuscated, one line each) → `tools/deobfuscate.js` → `src/*.deobf.js` + `src/*.strings.json` → windowed reads → `FACTS.md`. `src/*.html` are ground truth for settings defaults/UI. `ref/` holds the welding references (S4: `aws-weld-symbol.html` = the 13 parts, `weld-symbol-chart.html` = joint catalog) and the folded ruler analysis (`ruler-folded.txt`: 79 constant-evaluated regions; `ruler2.txt`: raw bodies).
- **Build (S5–S9)**: reads **only** `FACTS.md`. The app does not exist yet; it gets written at the `apps/measuring/` root: `index.html` (3 tabs) + `core.js` (shared engine: settings-panel builder + score/streak/Check/Next state machine — **no timer, no sound in v1** — that is the product's differentiator). Each module exports `{id, title, init(canvasHost, settingsHost, resultsHost, engine)}`: `tape-logic.js` + `tape.js` (S6), `caliper-logic.js` + `caliper.js` (S7), `weld.js` (S8). Logic modules are pure (zero DOM) and node-tested; render modules are thin canvas glue.

## Anchors
- Live plan: `apps/measuring/PLAN.md` · ground truth for builds: `apps/measuring/FACTS.md` · root `APP-PLAN.md` is a historical design doc — **never edit it**.
- `node tools/peek.js <file> <start> <len>` (also: `fn` = brace-matched function body, `fnlist` = all function/var offsets, `call`/`paren` = extent matching) — the window reader for the one-line minified files.
- Regenerators (deterministic): `node tools/deobfuscate.js all` rebuilds `.deobf.js` + `.strings.json`; `node tools/facts-ruler-5.js` rebuilds `ref/ruler-folded.txt`.
- Untracked, commit them: `ref/ruler-folded.txt`, `ref/ruler2.txt` (rescued from ephemeral /tmp; the `ref/` copies are canonical).
- Node v26. No npm, no node_modules, never add a package.

## Decision frames
- **Never read `*.orig.js`/`*.deobf.js` in full** — they are single lines of 137–158k chars. Locate with `grep -bo`, read via peek.js windows, each ≤ ~1.5k tokens.
- Offsets in FACTS.md are **char** offsets (peek.js); `grep -bo` byte offsets run +509/+513 higher (multibyte unicode fraction glyphs). Don't mix the two spaces.
- Reimplement, don't copy: no original images/CSS/audio in the app (the original draws dials from PNG assets; the rebuild draws vectors).
- Each module file ≤ 400 lines; split logic (a-step) from rendering (b-step).
- Copyright: the original forbids derivative works → keep everything local; **never publish** the `.deobf.js`, `.strings.json`, or the app.

## Obligations
- End of every turn: all gates for the touched step pass, then `git add -A && git commit && git push` — one commit per turn so inter-turn diffs review cleanly.
- S3 may be checked only when `FACTS.md` has: ruler 6/6 bullets + `## shared` + the build-ready summary table, zero TBD.
- Any build step (S6–S8) is done only when its node tests pass and its logic module contains no `document`/`window`.
- If deobf files are ever regenerated: `node --check src/*.deobf.js` passes and zero `alias(0x…` call sites remain.

## Evidence
- PLAN.md's Caveats block (lines 86–95) is the gotcha ledger: /tmp is ephemeral; no browser on host; a site redeploy makes the S0/S1 anchors fail loudly → the fix is a bounded re-scout turn, not a rewrite.
- FACTS.md bullets are tagged DONE / MOSTLY DONE / PARTIAL / RESOLVED — trust the tags ("RESOLVED" = arithmetic verified by node eval). "Do not port" items are flagged inline there (e.g. caliper `drawInfo` is dead code; `getMouseClick` is a legacy ruler click-guess path).
- Caliper runtime harness: `tools/fc-env.js` (vm DOM stub + config dump) and `tools/diag-type.js` (end-to-end checkGuess). Known artifact: an undefined `pointvalue` once produced NaN false-strikes — if a harness check misbehaves, suspect the stub before the game logic.
- Real ambiguities to resolve deliberately, not silently: the original caliper stores settings in `sessionStorage` with no separator (`dial_caliperstgTimer`) while PLAN S9 says localStorage; the caliper flag `is64Inch` is a misnomer — it means "fractional-inch mode", not "1/64 only".
