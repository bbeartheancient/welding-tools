# FACTS — extracted game facts (the only document the build steps read)

## shared
Filled from src/dial-caliper.html + src/ruler.html. Both games share the same UI shell pattern.

**Settings panel:** Gear icon (⚙) in top-right opens a settings box overlay. Each setting is a row with label + control (select dropdown or radio buttons). "Apply Settings" button at bottom closes the box and applies. Settings changes reset the current game (new question, reset score/strikes/level).

**Score display:** `#txtScore` element, updated via `drawScore()`. Ruler: 5-digit zero-padded string ("00010"). Caliper: raw number. Both use monospace font for fixed width.

**Strike board:** `#strikeBoard` — 3 circles (ruler) or 3 strike indicators (caliper). `drawStrike()` called on wrong answer. 3 strikes = game over. Strike board shown only after first strike.

**Level indicator:** Ruler: `#levelCanvas` — 10 squares drawn, filled black up to current level. Caliper: no visual level indicator (level shown in text during level-up cheer). Level-up cheer: ruler shows "Level N" banner for 1000ms.

**Timer:** Both use `#timerCanvas` — horizontal bar that depletes left-to-right over the time limit. Color changes: green (>6s), yellow (3-6s), red (<3s). Timer hidden when stgTimer="Off".

**Cheer board:** `#cheerBoard` — transient overlay shown for correct answers ("Correct!") and level-ups. Disappears after timeout.

**Sound toggle:** `#stgSounds` checkbox in settings. When off, no sound effects for correct/wrong/level-up.

**Game state machine:** New question → student interacts (click/drag/type) → student submits → checkGuess() → correct (score up, next question) or wrong (strike, feedback) → if 3 strikes, game over. Timer runs in parallel; timeout triggers forced submit.

**localStorage vs sessionStorage:** Ruler uses sessionStorage with prefix "new_english_ruler_" (no separator, no underscore after prefix). Caliper uses sessionStorage with prefix "dial_caliper" (no separator). Neither uses localStorage. Settings persist only for the current browser session.

**Key conventions:** Both games:
- Use jQuery for DOM manipulation
- Canvas for all game graphics (ruler, caliper)
- No external assets (no images) — all graphics drawn programmatically
- Responsive: adapt to window size
- No account system, no scoring submission to server

## caliper
Source: `src/dial_caliper.deobf.js` (157798 chars, single line). Offsets below are CHAR offsets (peek.js); `grep -bo` byte offsets run +509 (chars ~54k–113k) / +513 (past ~114k) higher due to multibyte Unicode fraction chars.

1. **Beam (main scale, cm + inch)** — DONE (`paint` @59855..67313; node-evaluated constants, tools/eval-paint.js)
- Geometry: `rulerWidthPixel=915`, `scaleOriginX=293`, `scaleOriginY=80`, `offsetOriginX=15`, `offsetOriginY=56`, `vernierOriginX=55`, `vernierOriginY=204` (bootstrap IIFE @5800). cm: 50 div × `msd_pixels=12` = 600px = 5.0cm (120px/cm, 0.1cm/div); inch: 20 div × `msd_pixels_inch=30.48` = 609.6px = 2.0in (304.8px/in, 0.1in/div). `stgRulerLength=10`/`stgRulerPrecision=10` are settings-side only (beam length is fixed by the config above, NOT derived from them).
- `paint` preamble: clear `fillRect(0,0,915,500)`; `scale=1` but if `imgBase.width>window.innerWidth` then `scale=window.innerWidth/imgBase.width`; `translate(xOffset,yOffset)`, `save()`, `drawImage(imgBase,0,0)`, `translate(scaleOriginX+offsetOriginX, scaleOriginY)`; `fillStyle=strokeStyle=scaleColor`; `lineWidth=1.5`.
- **cm loop** (`for i=0..mainScaleDivisions`): x starts `-msd_pixels*zeroError/vernierScaleDivisions - 11`, y = `scaleOriginY0-scaleOriginY + 1`; ticks point DOWN (`drawLine(x,y,x,y+len)`); `len = i%10==0 ? major : (i%5==0 ? (major+minor)/2 : minor)`; after each `x+=msd_pixels`. Labels when `i%10==0 && i*msdValue<=5`: `outString(x-7, y+len, i*msdValue, 1, 2)`; plus a `0` mark when `i>0`.
- **inch loop** — x starts `-msd_pixels_inch*zeroError/vsdInch - 11.5`, y=`0`; ticks point UP (`drawLine(x,y,x,y-len)`); `x+=msd_pixels_inch`.
  - `is64Inch` branch: `for i=0 .. mainScaleDivisionsForInch*0.8` (=16); `len = i%8==0 ? major : minor`; major → `font 12pt`, `outString(x-8, y-len+12, floor(i/8), 1, 3)` (whole inches); else → `font 14pt`, and if `i<20`: `frac=FractionReduce.reduce(i%8,8)`, `outString(x-12, y-len+10, getUnicodeFraction(frac[0],frac[1]), 1, 2)` (unicode fraction glyph for ⅛…⅞).
  - decimal-inch branch: `for i=0..mainScaleDivisionsForInch` (=20); `len = i%10==0 ? major : minor`; major → `outString(x-8, y-len+12, i/10, 1, 3)` (whole inches); else → `font 10pt`, if `i<50`: `outString(x-6, y-len+10, i%10, 1, 2)` (tenths digit).
- Tick pixel lengths (bootstrap @5800): `majorTickLengthPixels=22`, `minorTickLengthPixels=13` (cm mid-tick = (22+13)/2=17.5). `outString` defined @92573 (and 94067).
- Beam/scale is vector; dial/vernier are PNGs `vernier_base.png`,`vernier.png`,`vernier1_64.png`,`needle.png` (img vars @4461..4900, under `/dial-caliper/images/`).

2. **Dial per resolution** — PARTIAL
- `vernierScaleDivisions=100` (cm); `vernierScaleDivisionsForInch=100` for 0.001in, **64** for all fractional inch res (`initResolutionSettings` @39175: only vsdForInch changes 100→64 in the `is64Inch` branch). `is64Inch = stgResolution ∈ {1/8,1/16,1/32,1/64 in} && stgScale=="Inch"` (settings change handler; name is a misnomer).
- `initResolutionSettings` @39175 full decode (node-evaluated): **both branches** set `msdValueInch=0.1`, `mainScaleDivisionsForInch=20`, `mainScaleLengthPixelsForInch=609.6`; only `vernierScaleDivisionsForInch` differs: **64** in the `is64Inch` branch, **100** in the decimal branch.
- Decimal inch: `cr = (msr + vsr/100)*0.1` → 100 dial divisions per 0.1in main division = 0.001in/division (`getCorrectedReading` @89636). Fraction inch: `cr = (msr + vsr/64)*0.1*8` (factor is **8** — an earlier ×5 was an arithmetic slip; `-7480+9450-1962=8`).
- Rendering: dial face/vernier via images; needle.png rotated (vector rotate sites ~68824..77511 char). `vsd_pixels=11.88`, `vsd_pixels_inch=59.7408`, `vernierScaleLengthPixels=1288`.
- RESOLVED (session 2): dial tick loops/labels per resolution, rotation-per-division, needle pivot — see "S2 session 2" section.

3. **Value model** — MOSTLY DONE (`showNewQuestion` @148786)
- Generated Q (avoid 0 and repeat of previous; all `randomZeroError/randomMainScaleDivisions/randomVernierScaleDivision/randomObjectWidthPixel=true`; `objectWidthPixel=25`):
  - Inch 0.001: `randomInt(868,1950)/1000` → [0.868, 1.950] in, step 0.001.
  - Inch fraction: Q stored in 1/64-inch units, `Q=G*wq`, `wq=64/resDiv` (1/8→8, 1/16→4, 1/32→2, 1/64→1), `G∈[1,floor(128/wq)]` → 1/8: [0.125,2.0]in step 1/8; 1/16: [0.0625,2.0]; 1/32: [0.03125,2.0]; 1/64: [0.015625,2.0].
  - CM: base `randomInt(100,4950)`; mm sub-scale: `/100` → [1.00,49.50]mm (25% in Game/Trainer — `randomInt(1,4)==1`, 100% in Type); cm sub-scale: `/1000` → [0.100,4.950]cm (75% Game/Trainer, never Type).
- Q→caliper decomposition (tail of showNewQuestion): CM `msr=floor(Q/10/msdValue)`, `vsr=round((Q/10/msdValue-msr)*vernierScaleDivisions)`; Inch decimal `yrDC=Q/msdValueInch; msr=parseInt(yrDC); vsr=round((yrDC-msr)*vsdForInch)`; Inch fraction `yrDC=Q/64` (msr/vsr same pattern, vsdForInch=64). Then `update()`. `getDecimalPlacesForDialCaliper(res)` → 3 for all 5 resolutions.
- RESOLVED unit chain (node-eval of all hex arithmetic, tools/eval-fraction.js): showNewQuestion sets `msr+vsr/64 = Q/64` (inches) → `cr = (Q/64)*0.1*8 = 0.8×L_in`; btnSubmit then does `guess = Math.round(cr*1000)/1000*80 = cr*80 = L_in*64 = Q` exactly (verified Q∈{8,16,64,128,356} → guess/Q=1.0000). The "×80 conflict" was my ×5 mis-decode; with ×8 everything is consistent.
- RESOLVED (session 2): vernier pixel offset assigned @61006–61128 as `RlMrp=(x=−msd_pixels·zeroError/vernierScaleDivisions−11, y=scaleOriginY0−scaleOriginY)`; draw sites use it plus the msr·msd_pixels(+vsr·vsd_pixels) reading position (the obfuscated comma-assignment is spaghetti — port as `x = msr·msd_pixels + vsr·vsd_pixels + zeroError·msd_pixels/vsd`, jaw opening = reading in pixels).

4. **Find (Game) mode** — PARTIAL
- Display: `"<span class='questionInstruction'>Adjust Dial Caliper to select</span><br>"` + formatted target.
- Submit (`#btnSubmit` click handler @50887, fully decoded): `isProcessingAnswer||gameover` → bail; else disable button + spinner, then: Type→`checkGuess(get_total_value_v2())` (legacy V1 path decoded separately, see bullet 5); **Game/Trainer**: decimal → `checkGuess(Math.round(cr*1000)/1000)` (cr in inches, 3-dp rounded); fraction (`is64Inch`) → `checkGuess(Math.round(cr*1000)/1000*80)` (cr in 0.8-scaled inch units, ×80 restores 64ths). ×80 is consistent with the ×8 in getCorrectedReading (bullet 3): cr=0.8·L_in → guess=cr·80=L_in·64=Q.
- Comparison (`checkGuess` @114116, Game branch): `guess.toFixed(3)==Q.toFixed(3)` || (mm: `(guess*10).toFixed(2)==Q.toFixed(2)`) || (is64Inch: `guess.toFixed(0)==Q.toFixed(0)`). Debug `console.log` uses guess.toFixed(99)/Q.toFixed(3). Effective tolerance: ±0.0005 (3-dp rounding) decimal; ±0.005mm mm; ±0.5 (64ths) fraction. Runtime-verified: exact match → CORRECT, score 0→10 (diag harness, all 5 configs).
- RESOLVED (session 2): drag behavior fully decoded in "S2 session 2" (dragMode 0/1/2, accumulatedDx + per-resolution quantum snap, clamps). `getMouseClick` = legacy ruler click-guess path (clicksPerDivision=250 raw-eval) — do not port. Double-click auto-submit: none; the only programmatic `#btnSubmit` trigger is timer expiry (decoded earlier).

5. **Type mode** — PARTIAL
- `TYPE_MODE_V2=true`; `input_answer="00000"` (5-digit string). Submit → `checkGuess(get_total_value_v2())` (@16544; body not decoded).
- Comparison (`checkGuess` @114116, Type branch): `guess.toFixed(3)==randomQuestion.toFixed(3)` (symmetric; corrected from an earlier misread — Type mode is NOT dead). On strike: `doStrike(0)`.
- Keypad fns (char offsets, layout unread): `resetTypeInputV2` @9708, `resetTypeInputDecimalsV2` @10023, `typeV2AddDigit` @10156, `typeV2Space` @11330, `typeV2Slash` @11532, `typeV2Back` @11834, `getTypeV2FractionGuess` @14046 (returns value in 64ths per summary), `getTypeV2DecimalGuess` @15210, `get_total_value_v2` @16544, `set_input_answer_v2` @16658, `drawTypeV2Keypad` @21230, `drawTypeV2Fraction` @26861, `drawTypeV2Decimal` @32157, `getPointerOnTypeCanvas` @34793, `handleTypeCanvasPointer` @36073.
- Legacy path (TYPE_MODE_V2=false, non-default, decoded in btnSubmit): decimal `guess=round(input_answer)/1000`; fraction 5-digit parse: `[0]`=integer, `[1..2]`=numerator, `[3]`=denominator (default 64 if 0); `guess=(int+num/den)*64` (64ths).
- RESOLVED (session 2): V2 accepted formats + keypad layout decoded in "S2 session 2" (fraction → 64ths via `round((whole+num/den)·64)`; decimal capped at `getDecimalPlacesForDialCaliper()` dp; keypad = digits 0-9 row + Del/Space + `.` `/` row; `drawType()` @81251 raw-eval: Type-mode canvas 420×160 and hides `.number-input`; non-Type 600×0 (width 0.8·innerWidth when innerWidth≤1366) and shows it; Type-mode `txtQuestion` instruction e.g. "Enter the length as a fraction.").

6. **Trainer mode** — PARTIAL
- File tail (~156300+ char): `$("#verniersmallControl").click` = decrement by one per-resolution fine step (1/8, 1/16, 1/32, 1/64; else 0.001 decimal), then `translateVernier(-step); update(); $("#verniersmallControl").val(formatValue(cr))`; `$("#btnvernierincrement").click` = same with +step. So: DOM +/- buttons stepping the vernier, current value shown via `formatValue(cr)` (@87191) in the `#verniersmallControl` input.
- RESOLVED (session 2): target IS shown as text in Game AND Trainer: showNewQuestion tail (@~151962) `$("#txtQuestion").hide()` then Game/Trainer `html(instr + "<span class='questionMeasurement'>"+value+"</span>").fadeIn()` — cm: `Q + subScale(mm/cm)`; inch decimal: `Q in`; inch fraction: `formatValue(Q/80) in` (÷80 raw-eval; Q in 64ths → inches via ×0.8×10/64=÷80). Type mode shows an instruction string instead ("Enter the length as a fraction." etc.). `drawCorrection` overwrites with "Correct answer was …".

7. **Scoring** — DONE
- `newGame` @154239: score=0, level=1, strikes=0, levelcounter=0, pointvalue=10, gameover=false, new `gameSessionId = Date.now()+'_'+Math.random().toString(36).substr(2,15)`, then showNewQuestion().
- Correct: `score += pointvalue`, `levelcounter++`, `checklevel()` (@145760): if `levelcounter===5 && level<10` → level+1, levelcounter=0, pointvalue+=10 (→ 10..100 points over levels 1..10), drawLevelCanvas, `showCheerBoard("Level N", 1000ms)`.
- Strikes: `doStrike` @116418: pause, strikes++, strike.gif shown while strikes≤3, `drawCorrection(Q,guess)`, wrong-answer screenshot after 500ms, `hideStrikeLayer` after 2500ms. `hideStrikeLayer` @134611: `strikes<3` → showNewQuestion (retry, new question); else play "gameover", show "Game Over" text, sendScore, `endGame()` after 3000ms. Strikes cumulative across levels (reset only by newGame/settings change). → 3 strikes = game over, as planned.
- Timer: when `stgTimer==='On'`, each new question sets `secs = 22 − 2×level` clamped ≥0 (level 1→20s … level 10→2s) and calls `startTimer()` (@110992: ticks every 1000ms, secs−1; at secs===0 auto-triggers `#btnSubmit` click = forced submit). `drawTimer` @109198: 30×30 canvas, visible bar height = secs px; green, yellow when secs<10, red when secs<6. Timer Off → no secs/startTimer. endGame @142846: drawTimer(0), gameover=true, re-enable submit, show wrong-answers button if screenshots exist.
- Sounds (AudioEngine): assets `correct/incorrect/level-up/game-over-plastic-click.mp3`.

8. **Settings** — DONE except display text
- Defaults (`src/dial-caliper.html`): stgTimer=On, stgSounds=On, stgScale=Inch (Inch|Centimeter), stgResolution="0.001 in" (0.001|1/8|1/16|1/32|1/64 in), stgMode=Game with label "Find" (Game|Type|Trainer). `stgSubScaleForCM='cm'` init @2459.
- Storage: `sessionStorage[session_prefix+"stgX"]` with `session_prefix="dial_caliper"`, NO separator → keys `dial_caliperstgTimer` / `dial_caliperstgSounds` / `dial_caliperstgScale` / `dial_caliperstgMode` / `dial_caliperstgResolution`. localStorage unused. Settings-change handlers (region ~43k–48k char) reset strikes etc.
- RESOLVED (session 2): the settings text is the inline HUD in `paint` (see session-2 notes). `drawInfo` @83550 is dead code: `displayInfo` initialized false @8578 and never set true anywhere (only 2 refs). Skip in rebuild.

### S2 session state
Figured out: full game loop (newGame → showNewQuestion → checkGuess → doStrike/hideStrikeLayer → 3-strikes game over); question ranges/steps per mode; scoring/levels/timer formulas; checkGuess comparison per mode (toFixed digit counts verified by node eval of the hex arithmetic, and CORRECT outcomes verified in the vm harness `tools/facts-caliper.js`/`diag-type.js` after fixing the `pointvalue`-undefined NaN false-strike artifact); settings defaults + sessionStorage keys; config constants via headless vm dump (`tools/fc-env.js`). **DONE this session: fraction-mode unit chain fully resolved** (node-eval of btnSubmit F1/F2/F3 = 1000/1000/80, getCorrectedReading factor = 8 [earlier ×5 was an arithmetic slip], showNewQuestion FACTOR2=64, wq=64/resDiv, X=128, CkR=1; initResolutionSettings re-read: msdValueInch=0.1 in BOTH branches); runtime cross-check: harness `checkGuess(356.4)` in 1/64 mode → CORRECT (356.4.toFixed(0)=="356").
**S2 DIAL CALIPER: ALL 8 BULLETS DONE — FACTS COMPLETE.** build-ready summary in the 8 numbered sections + two session notes; only out-of-scope leftover: server screenshot/score upload (`captureScreenshotForWrongAnswer` @135253 char, `uploadScreenshot`, `sendScore` @144510) — deliberately not ported. `drawType` layout polish done (raw-eval dims 420×160 / 600×0 above).

### S2 session 2 — dial, drag/click, Type V2, checkGuess tolerances (verified by raw-source node eval; arithmetic evaluated verbatim from file, not transcribed)
- **Dial geometry** (inside `paint`): needle pivot on the vernier image at (58.9%·width, 39.7%·height) of `imgVernier1` (raw eval `pivotX=58.9`, `pivotY=39.7` at w=h=100). `translate(x,y)` to pivot, then `rotate(angle)`; needle drawn at `(-imgNeedle.width/2, -imgNeedle.height)` relative to pivot (needle extends upward; `−w/2` divisor raw-evaluated = 2). Rotation angle = `vsr × π(≈3.141592)/100` for decimal (full 360°/rev) and `vsr × π/50` for is64 (64 divs = 360°, raw evals 0.06283184 / 0.09817475 rad/div).
- **Dial ticks** (two loops, i=0..N-1, each tick rotated by same angle-per-div):
  - is64 loop: 3 tick lengths — long (`F_guZlUWMxXlsmWsJNVebujdO = imgNeedle.height/2`) every 8 divisions, medium (`dLImE$WIV_bKQYl`) every 4, short (`uD_UcI_tH`) every 1. Labels only at every 8th: `getUnicodeFraction` at i/8 (halves), i/16 (quarters), i/32 (eighths) via FractionReduce, plus special literal `'0'` at i=0; fonts 14pt/13.5pt; label anchor = sin/cos at (tickLen + needle.height/2 ± offsets) — for vector rebuild: reproduce labeled major ticks at halves/quarters, don't pixel-match.
  - decimal loop (0..99): labels every 10th at font 10pt with literal `'0'` special at i=0; medium tick at i%20==0 (no label); short otherwise.
  - Tick anchor after loop: `translate(-x,-y)` back, fillStyle fgColor.
- **HUD inline in paint** (after `let cr=getMeasuredReading(), cr2=getCorrectedReading()`; `if(displayInfo)drawInfo()`; Trainer mode: `$("#verniersmallControl").val(formatValue(cr))`): bottom-right `bold 10px Arial` black lines at canvas width − (84, 78, 72): `Timer: <stgTimer>`, `Unit: Metric|Inch|Centimeter` ("Metric" when Centimeter), `Mode: Training|Find|<stgMode>`; when stgScale=="Inch" also `Resolution: <stgResolution>`; `dateTimeStr` at top-right (w−40, y=0). Then `drawType()`.
- **Drag mechanics** (`mouseDragged` @100118, dragMode consts raw-eval: none=0, pan=1, vernier=2): returns early if stgMode=="Type" or dragMode==0. Delta = (pos−prev)/scale × unit-step: is64 uses px→msd_pixels_inch-ish divisor (raw-eval arithmetic gave 2; treat as px→inch-major-divisions conversion — rebuild can use `dx/msd_pixels_inch`), cm step −1, inch step +1 (sign flip = cm drag direction reversed relative to inch — keep cm dragging natural). prev_mx/prev_my updated each move.
  - dragMode==1 (pan): `xOffset+=dx; yOffset+=dy; paint()`.
  - dragMode==2 (vernier): `accumulatedDx += dx`; clamp: at `msr>=mainScaleDivisions(cm)` / `mainScaleDivisionsForInch` and accumulatedDx>0 → reset acc=0, return; at msr==0&&vsr==0&&accumulatedDx<0 → acc=0, return (bounds are exactly [0, max], acc reset 0 — raw-eval verified all bounds=0). When `|accumulatedDx| >= quantum`: step = round(acc/quantum)*quantum, acc−=step, `translateVernier(step)`. Quantums (raw-eval): cm=1 division; inch default=1; resolution 1/8→8, 1/16→4, 1/32→2, 1/64→1 (main-scale divisions = 1/8 in per major division, so 8 majors per inch).
- **`getMouseClick`** @106829: Type mode returns; pause/gameover return; `x=mousePos.x−offsetLeft`; `clicksPerDivision = 250` (raw eval; legacy ruler constant — in the caliper this maps a click to `round(x/250·L·P)` and calls `checkGuess(n)`, i.e. a leftover ruler click path; the caliper game modes primarily use Type/keypad + drag, so treat click-guess as legacy, do not port unless needed).
- **`translateVernier(delta)`** @56888: `msr += delta` (cm) with rollovers, clamp to [0, mainScaleDivisions] (vsr=0 at max); Inch: `vsr += delta`, carry `vsr±=vernierScaleDivisionsForInch ↔ msr∓1` loops, zero-clamp when corrected reading ≤0 (msr=vsr=0), max-clamp at `mainScaleDivisionsForInch*msdValue` (msr=max, vsr=0). Note inch delta is applied to VSR (subdivision steps), cm to MSR.
- **`checkGuess(guess)` @114629 (dp values raw-eval verified)**: first `allowMovement=false, timerRunning=false, clearTimeout(gameTimer)`; if gameover → re-enable submit, return false.
  - Type mode: correct iff `guess.toFixed(3) === randomQuestion.toFixed(3)`.
  - cm path: correct iff `guess.toFixed(3)===Q.toFixed(3)` OR (`stgSubScaleForCM=='mm'` && `(guess*10).toFixed(2)===Q.toFixed(2)` — guess entered in mm? no: cm Q stored at 3dp, mm-mode comparison multiplies guess ×10 and rounds 2dp).
  - 64-inch path: correct iff `guess.toFixed(0)===Q.toFixed(0)` (both already in whole 64ths? Q is 64ths integer; the earlier-verified 356.4→"356" CORRECT run confirms dp-0 integer compare).
  - Correct branch: showCheer, sound, score+=pointvalue, txtScore=padScore(score), levelcounter++, checklevel(), showNewQuestion(), submit re-enabled. Wrong: doStrike(guess).
- **Type V2** (re-read, char offsets 14046/15210/16544): `getTypeV2FractionGuess` → 64ths: `den` default 64; invalid fraction → `whole*64`; valid → `round((whole+num/den)*64)`. `getTypeV2DecimalGuess` → uses `getDecimalPlacesForDialCaliper()`, frac truncated to maxdp, value `whole + (hasDot&&frac ? parseInt(frac)/10^len : 0)`. `get_total_value_v2()` dispatches by fraction/decimal mode. `set_input_answer_v2`: fraction mode keys Back/Space/Slash/digits → typeV2Back/Space/Slash/AddDigit; decimal mode Back deletes frac→dot→whole, `.` sets hasDot (if maxdp>0), digits append (frac capped at maxdp, whole cap ~3 digits — obfuscated limit not raw-eval'd, low risk). `drawTypeV2Keypad` @21230: 2 rows — row1 digits 0-9 (10 keys), row2 special Del/Space + `.` and `/` buttons; `getPointerOnTypeCanvas` maps via getBoundingClientRect incl. touch; `handleTypeCanvasPointer` hit-tests → set_input_answer_v2.
- **`update()` @58345**: recomputes `LC=msdValue/vernierScaleDivisions`, `msd_pixels=mainScaleLengthPixels/mainScaleDivisions`, `vsd_pixels` (derived), `vernierScaleLengthPixels=max(imgVernier1.width, imgVernier2.width, imgNeedle.width)`, then `paint()`. Trainer: value string set into `#verniersmallControl` via `formatValue(cr)` (5-digit "thousandths" style per existing notes).
- Pointer/drag state consts: `dragMode` 0/1/2 (verified raw-eval); `yJVBqWHkRjLSRF_TuJEWPl` = trace/profiler hook called at fn entry (ignore in port).

## ruler
Source: `src/ruler.deobf.js` (158965 chars, single line). All hex arithmetic node-evaluated via tools/facts-ruler-1..5.js. Char offsets shown where available.

1. **Tick layout per precision** — DONE (tools/facts-ruler-4.js; tick table char 54609..55536)
- 256 pixels per inch (char 36781: constant 256 in canvas width calc)
- Tick height hierarchy (px): 1→48, 2→38, 4→28, 8→22, 16→16, 32→10, 64→6. Any precision not in this set (e.g. 3, 5) uses the next-lower height (3→38, 5→28).
- Tick height determined by `FractionReduce.reduce(numerator, denominator)` — the reduced denominator selects the tick height. Example: 2/16 reduces to 1/8 → 22px tick.
- Only whole-inch marks (0, 1, 2, ...) are labeled. Font "bold 24px Arial" for labels.
- Labels centered at tick position: x = tick_x - text_width/2. Y position varies by mode (Type: 8px above ruler; Find: 10px below).
- Canvas width = length_inches × 256 + 60 (30px left margin + 30px right margin).
- Marks drawn from left margin (x=30) to right edge of ruler.

2. **Question generation** — DONE (PcHNyNEtZfOzIUyIowzeLq char 134007)
- Target = random integer index in [0, length_inches × 64] (i.e. random multiple of 1/64-inch within ruler length).
- 0 is a valid target (index 0 = "0"). Previous target excluded to avoid repeats.
- Auto length behavior: if window width is too narrow for selected length, override to floor((innerWidth - 50) / 256), minimum 1 inch. Show message "Will display as N" based on your current browser size". If window is wide enough, use selected length.
- Measurement array built at game start: array[0]="0", then for each 64th mark: format as fraction (reduced or not per setting). See bullet 4.

3. **Find mode** — DONE (I$hcpxklfBUSvixWHreFzoevap char 103622)
- Target value shown as text above ruler (format: fraction or inch+fraction).
- Student moves mouse over ruler; green vertical bar follows mouse position.
- On click: click position (pixels) converted to ruler value via click_x - left_margin)/256 × 64 = index in 64ths.
- No explicit tolerance — click maps to nearest 64th (rounding). If click is closer to tick A than tick B, tick A is the guess.
- Correct: show cheer, update score, advance to next question.
- Wrong: red vertical line at correct position, show correct answer text, record strike.
- Timer: if on, counts down; forced submit on timeout (treat as wrong).

4. **Type mode** — DONE (c_jSQIrNC char 33857; PcHNyNEtZfOzIUyIowzeLq char 134007)
- Accepted formats depend on notation setting:
  - **Fractions**: "n" (integer), "n m/d" (mixed), or "m/d" (proper fraction). Whitespace flexible. Examples: "3", "2 1/4", "1/2".
  - **Decimals**: "n" or "n.ddd" (e.g. "3", "2.25").
- Reduced vs unsimplified rule (governed by `stgFractionStyle` setting):
  - "On" (reduced only): student must enter reduced fraction. "2/4" is wrong for 1/2 target; only "1/2" is accepted.
  - "Off" (unsimplified only): student must enter fraction with denominator matching question precision. For precision 8: "2/8" is correct for 1/4; "1/4" is wrong.
  - "Both": accepts any equivalent fraction that maps to the same 64ths value. "1/2", "2/4", "4/8" all accepted.
- Decimal cross-acceptance: in "Both" mode, "0.5" is accepted for 1/2 target. In reduced/unsimplified modes, decimal format is only accepted if it exactly represents the target value.
- Keypad layout: 10 keys (0-9), "Back" (delete), "Space" (for mixed fraction separator), "." (decimal point, fractions only), "/" (fraction slash, fractions only).
- Keypad hit-testing: buttons arranged in grid. 0-9 in row 1 (left to right). Back at bottom-right. Space below 0. . below 1. / below 2.

5. **Scoring** — DONE (sKvEqDqjhUmjfOtYjjixhofkf char 110336; I$hcpxklfBUSvixWHreFzoevap char 103622)
- Level starts at 1, point value starts at 10.
- Correct answer: score += point_value. Level counter increments.
- Every 10 correct answers: level up (max level 10), point value increases by 10 (so 10→20→...→100). Show "Level N" cheer for 1000ms.
- Strike board: 3 circles. Strike fills one circle. 3 strikes = game over.
- Strike resets level counter to 0 (but does not reset score or level).
- Timer: duration = 12 - 2×level seconds. Level 1: 10s, Level 5: 2s, Level 10: -8s (clamped to 1s).
- Timeout forced-submit counts as wrong answer (strike).
- Score display: 5-digit zero-padded ("00010").

6. **Settings** — DONE (src/ruler.html; folded region AwFc$BUXV_qYwXBiizpozANr char 111145)
- `stgRulerLength`: default 4 inches. Options: 1, 2, 3, 4, 6, 8, 12 (and "auto" which auto-fits to window).
- `stgQuestionPrecision`: default 16. Options: 1, 2, 4, 8, 16, 32, 64. Determines the denominators used in questions.
- `stgMarkPrecision`: default 16. Must be ≥ question precision. Determines tick mark granularity. Options: 1, 2, 4, 8, 16, 32, 64.
- `stgNotation`: default "Fractions". Options: "Fractions", "Decimals".
- `stgFractionStyle`: default "On". Options: "On" (reduced only), "Off" (unsimplified only), "Both". Only relevant for fractions notation.
- `stgMode`: default "Find". Options: "Find", "Type".
- `stgTimer`: default "On". Options: "On", "Off".
- Storage: sessionStorage with prefix "new_english_ruler_" (confirmed in folded artifact). Keys: "new_english_ruler_stgRulerLength", etc.
- Settings change rebuilds ruler and resets game (score, strikes, level).

## welding
(pending — S4: 13 parts, placement rules, symbol catalog, v1 scope)

## build-ready summary
Compact contracts for the build steps (S5-S8). Each module exports `{id, title, init(canvasHost, settingsHost, resultsHost, engine)}`.

### Tape Measure (S6)
| Setting | Default | Options | Notes |
|---------|---------|---------|-------|
| questionPrecision | 16 | 1,2,4,8,16,32,64 | Denominator for generated questions |
| markPrecision | 16 | 1,2,4,8,16,32,64 | Must be ≥ questionPrecision |
| length | 4 inches | 1,2,3,4,6,8,12,auto | Auto-fits to window width |
| notation | Fractions | Fractions, Decimals | |
| fractionStyle | On (reduced) | On, Off, Both | On=reduced only; Off=unsimplified at precision; Both=any equivalent |
| mode | Find | Find, Type | Find=click ruler; Type=use keypad |
| timer | On | On, Off | |

Tick heights (px): 1→48, 2→38, 4→28, 8→22, 16→16, 32→10, 64→6. Scale: 256px/inch. Margins: 30px each side.

Answer acceptance: index into measurement array (0 to length×64). Type mode: parse input → compute 64ths value → look up in array. Accept if array[guess_index] == array[target_index] (for On/Off) or if guess_index == target_index (for Both).

### Dial Caliper (S7)
| Setting | Default | Options | Notes |
|---------|---------|---------|-------|
| scale | Inch | Inch, Centimeter | |
| resolution | 0.001 in | 0.001, 1/8, 1/16, 1/32, 1/64 in; 0.01mm, 0.1mm, 1mm | Resolution options differ by scale |
| mode | Find (Game) | Find, Type, Trainer | Trainer=adjust and read |
| timer | On | On, Off | |

Question generation: random value within 0-2" (inch) or 0-5cm (metric) at appropriate resolution. Value decomposed into (beam_reading, dial_position). Beam has cm (top) and inch (bottom) scales. Dial has 100 divisions (0.001in) or 64 divisions (fractional inch).

Answer acceptance: Find mode — exact match of decimal value (to appropriate precision). Type mode — parse input, compare to target value. Trainer mode — no correct/wrong (practice only).

### Welding Symbols (S8)
| Mode | Description |
|------|-------------|
| Identify | Highlight a part of the symbol; student names it (from 13 parts) |
| Read | Show a complete symbol; student identifies all parts (type, size, side, etc.) |
| Build | Give a spec; student assembles the symbol from parts palette |

v1 scope: fillet welds only. Parts: arrow, reference line, basic symbol, weld size, weld length, pitch (intermittent), groove size, weld metal, all-welds-around circle, contour, finish, field flag, tail. Placement rules: below ref line = arrow side; above = far side; both = both sides. Weld size goes left of symbol on reference line.
