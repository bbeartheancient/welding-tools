# APP-PLAN — apps/measuring execution checklist

Timer-free classroom reimplementation of rulergame.net (Tape Measure, Dial Caliper) + AWS welding-symbol trainer.
Sources: src/*.orig.js (obfuscated, ONE LINE each — never Read in full; use grep -bo offsets + byte windows), src/*.html (settings UI = ground truth), ref/* (welding references).
Per-turn protocol: read this file → next unchecked step → minimal targeted reads → write outputs → check the box → git commit + push. No npm; node built-ins only; vanilla JS + canvas; no external assets; must work from file://.

## Status (2026-09-14)
- S0/S1/S2/S3/S4/S5/S6/S7/S8/S9 done — FACTS.md complete; app shell (index.html, core.js, style.css) built; all three modules implemented (tape, caliper, weld) with 26 passing node tests; all JS files pass syntax checks. S9 added localStorage persistence, Spears Technologies copyright footer, README.md, and AGENTS.md entry.
- Remaining: Final user checklist (manual browser verification across all modes/precisions).
- Git: origin = github.com/bbeartheancient/welding-tools — one commit per turn so inter-turn diffs are reviewable.
</parameter into PLAN.md: "S9 done"

## S0 Bootstrap [x]
- src/: dial_caliper.orig.js (179470B), ruler.orig.js (154307B), dial-caliper.html, ruler.html
- ref/: aws-weld-symbol.html (parabuild v6 manual), weld-symbol-chart.html (arccaptain), weld-symbol-parabuild-v81.html (bonus)
- Gates PASSED: sizes ±10% ok; anchors ok (ruler uNTrWjaQBBQjwYqBbkhygN / R_UrHtiJKo$ZfuVi / busLFQiaEMXuU; caliper yJVBqWHkRjLSRF_TuJEWPl / BWLHjkxHPubBvwpMBcask / dZ$w_idd); both HTML pages have stgResolution/stgQuesMode.
- Notes: site 403s some page URLs to curl; the two JS asset URLs work with a browser UA. Page URLs: /dial-caliper-game.php, /new-english-ruler-game.php. JS copied from tool-output (sizes identical to fresh curl). If the site redeploys → anchors fail loudly → bounded re-scout.

## S1 Deobfuscation tool [x]
- Write tools/deobfuscate.js (node; fs, vm only). Per-file config:
  - ruler: alias=uNTrWjaQBBQjwYqBbkhygN decoder=R_UrHtiJKo$ZfuVi array=busLFQiaEMXuU; preamble=src[0..firstIndexOf('$(document)')]
  - caliper: alias=yJVBqWHkRjLSRF_TuJEWPl decoder=dZ$w_idd array=BWLHjkxHPubBvwpMBcask; preamble=src[0..firstIndexOf('var session_prefix')) + src[indexOf('function BWLHjkxHPubBvwpMBcask')..brace-matched end of that fn]
- Alias discovery: iteratively scan whole src for `var <id>=<known>` (known = decoder + discovered aliases) to fixpoint (caliper expects WpgDzzJkxrF, bxdssF_$H).
- vm: eval preamble in a bare context (no DOM; rotator IIFE performs array rotation at eval time). Then N = array length; write src/<name>.strings.json = {hexIndex: alias(i)} for i in 0..N-1; log count + sample.
- Replace pass: per alias (longest id first) regex id(0x[0-9a-f]+) → JSON.stringify(decoded); also detect 2-arg form id(0x..,'..') and verify the 2nd arg is unused by the decoder (report it).
- Gates: (1) node --check passes on both .deobf.js; (2) zero remaining alias(0x call sites for every discovered alias; (3) no undefined for any used index; (4) ruler strings.json contains 'ready'; caliper contains 'getElementById'.

## S2 Caliper facts → FACTS.md ## caliper [x]
Targeted reads only: grep -bo on the DEOBF file, then ≤1.5k-token byte windows (files are one line).
Record concrete values (no TBD): 1) beam: top (cm) + bottom (inch) scales — tick spacing, which labeled, inch subdivision (1/64? 1/16?), beam length in inches. 2) dial per resolution (0.001in, 1/8, 1/16, 1/32, 1/64) and unit: divisions, labels, one-revolution value, major/minor tick styling, pointer. 3) value model: generated value min/max + step per resolution; value→(jaw pos, beam reading, dial reading). 4) Find mode: click tolerance (units or px), drag behavior, what is displayed. 5) Type mode: exact accepted answer format per res/unit, parse/normalize + comparison rule, keypad layout (digits + which specials on typeCanvas). 6) Trainer mode: display format (5-digit vernier control?), how value shown between +/- buttons. 7) Scoring: points/level 10..100, time limits 20→2, level-up = 5 correct, 3 strikes, timer-off behavior. 8) Settings: defaults + localStorage keys + current-settings text (lower-right).
Gate: all 8 bullets filled.

## S3 Ruler facts → FACTS.md ## ruler [x]
Sub-steps:
- [x] Extraction tooling: tools/facts-ruler-1..5.js (ruler-5 = constant folder over the whole file)
- [x] Whole src/ruler.deobf.js folded → ref/ruler-folded.txt (79 sections; covers all 6 bullets) + ref/ruler2.txt (raw bodies)
- [x] cp → ref/ (preserved — was in /tmp, now in repo)
- [x] Transcribe all 6 bullets into FACTS.md ## ruler (no TBD); cross-checked settings defaults vs src/ruler.html
- [x] Fill FACTS.md ## shared from both src/*.html (settings UI, HUD, storage-key conventions)
- [x] Append "build-ready" summary block (compact tables: rendering + acceptance contracts per module)
Key findings: tick height hierarchy {1:48,2:38,4:28,8:22,16:16,32:10,64:6}px; 256px/inch; targets in 64ths; Type mode accepts reduced/unsimplified/both per setting; scoring = level 1-10, 10-100pts, level-up every 10 correct, 3 strikes; sessionStorage prefix "new_english_ruler_".
Gate: 6/6 bullets + ## shared filled + build-ready table appended, no TBD → mark [x].

## S4 Welding facts → FACTS.md ## welding [x]
From ref/aws-weld-symbol.html (parabuild v6): the 13 numbered parts of the basic symbol; placement rules (below ref line = arrow side; above = far side; both = both sides); weld size goes left of the symbol on the reference line; intermittent welds (dash/space on the line, the "12" note); shop (no flag) vs field (flag at far end of ref line).
From ref/weld-symbol-chart.html (arccaptain): groove/fillet joint symbol list + geometry; flag/contour/finish chart entries (grep the saved file).
v1 scope (lock here): fillet-centric — identify (name a highlighted part), read (symbol → state spec: size/side/intermittent/shop-field), build (spec text → assemble from parts palette: symbol right of line, size left, flags, dashes). Groove symbols: identification only in v1.
Gate: ## welding filled + scope locked.

## S5 App shell [ ]
- index.html: tab bar (Tape Measure | Dial Caliper | Welding Symbols); per-tab content (canvas + settings panel + results bar); plain classroom-readable style.css (big fonts, high contrast, print-friendly); no external assets.
- core.js: shared engine — settings-panel builder; score/streak + Check/Next state machine (NO timer; no sound in v1).
- Module contract: module exports {id,title,init(canvasHost,settingsHost,resultsHost,engine)}; core wires tab switching + registration.
Gates: 3 tabs switch + placeholders render + engine UI updates (fake module). No browser on this host → node smoke tests of pure logic; user-side visual check at S9 (optionally serve via fabric for LAN/phone preview).

## S6a Tape logic [ ]
tape-logic.js (pure): settings {questionPrecision in {1,2,4,8,16,32,64}, markPrecision ≥ questionPrecision, length auto|1..12, notation fraction|decimal, fractionStyle reduced|unsimplified|both, mode find|type (default type)}; target generator (random k/prec within length per FACTS); answer normalization/acceptance (accepts "4 3/16" AND "4.1875" cross-acceptance; reduced/unsimplified rule per FACTS); Find-mode tolerance (from FACTS, value units); scoring hooks.
tests/tape.test.js: ~10 pure asserts — acceptance matrix + tick generation per precision (ticks/inch = prec; height class of k/prec tick = f(k/prec) per FACTS hierarchy).
Gate: node tests pass; zero DOM in logic.

## S6b Tape rendering [ ]
tape.js (canvas): ruler strip (tick heights per FACTS hierarchy, whole-number labels); Type mode: steel block with right edge at target; Find mode: target text on top, student clicks ruler (green marker follows mouse), tolerance per FACTS; results bar: score/streak/Check; miss → red line at correct position + correct value; correct → cheer + next.
Gate: renders; logic covered by S6a tests. Keep file ≤400 lines.

## S7a Caliper logic [ ]
caliper-logic.js (pure): value model per FACTS (unit inch|cm; resolution 0.001in | 1/8..1/64 | metric equivalents; dial division mapping; value→(beam integer + dial position); fine-adjust step; per-resolution acceptance format; Find tolerance).
Gate: node tests — value↔dial mapping round-trips for ALL resolutions + acceptance cases.

## S7b Caliper rendering [ ]
caliper.js (canvas): beam (top cm, bottom inch per FACTS), sliding jaw + dial face (draw divisions/pointer; drag + +/- buttons + mouse wheel); three modes: Find (target above; adjust until it reads target; Submit), Type (block between jaws; keypad/keyboard; acceptance per FACTS), Trainer (current value between +/- buttons). Settings panel: unit/resolution/mode.
Gate: node tests pass. Keep file ≤400 lines.

## S8 Welding module [ ]
weld.js: parameterized pure drawing functions from a spec object {type, size, side arrow|far|both, intermittent dash/space, field bool, contour, finish}: reference line, fillet triangle on the right side of the line, arrow + leader to a joint diagram (two plates), tail, size text left of the symbol, arrow-side below vs far-side above, intermittent dashes, shop/field flag, all-welds-around circle.
Quiz modes: Read (generated symbol → student picks spec elements / enters size), Build (spec text → student toggles/places elements: side, size, dashes, flag; check), Identify (symbol with one part highlighted → name it, from the 13 parts).
Gate: node tests — spec→symbol drawing-parameter generation is deterministic + acceptance logic. Keep file ≤400 lines (split draw helpers into weld-draw.js if needed).

## S9 Polish + handoff [x]
- [x] Persist per-module settings (localStorage) as in the originals. (core.js: loadSettings/saveSettings with 'weldtrain_' prefix)
- [x] index.html about/footer: "Built for classroom use — original game © Spears Technologies; this is an independent timer-free reimplementation for personal/educational use." (lines 23-25)
- [x] README.md in apps/measuring: how to open, settings, correspondence to originals, file map (complete)
- [x] One-line entry for apps/measuring in the repo AGENTS.md layout section (line 16)
- [ ] Final user checklist (manual, in a browser: every mode × every precision/resolution; block-edge alignment; dial drag).
Gate: user confirms it works on their machine.

## Caveats
- Git: origin = github.com/bbeartheancient/welding-tools. Commit + push at the end of every turn; one commit per turn so inter-turn `git diff` = that turn's work.
- /tmp/opencode is ephemeral (wiped on reboot): the S3 folded artifact lives there — first S3 action is cp → ref/. If lost: re-run node tools/facts-ruler-5.js (deterministic; targets per tools/facts-ruler-2.js).
- S9 'AGENTS.md' sub-item: no AGENTS.md exists yet → create one in S9 at the repo root.
- Root /home/bbear/WELDING/APP-PLAN.md is a historical design doc — do NOT edit it; this file is the single live plan (the root aPLAN.md copy was deleted 2026-09-01 to avoid dual sources).
- Copyright: the ruler game header forbids copying/derivative works. Reimplementation is legally gray → keep everything local; never publish .deobf.js or the app. App uses original visuals only (no copied images/CSS).
- Site redeploy → S0/S1 anchors fail loudly → bounded re-scout turn.
- No browser/X on this host → gates are node-based (logic) + user-side visual check (S9).
- Minified one-line files → always byte-offset window reads (grep -bo + dd or node slice), never full-file Read.
- tool-output copies may disappear (opencode tmp) → S0 preferred fresh curl; cp only if present (done).
