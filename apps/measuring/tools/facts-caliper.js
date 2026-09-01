'use strict';
// facts-caliper.js — extract S2 facts from the deobfuscated dial caliper.
// Usage: node tools/facts-caliper.js [src/dial_caliper.deobf.js]
const env = require('./fc-env');
const { b, win, say, dump } = env;
if (env.evalErr) { say('skipping probes: eval failed'); process.exit(1); }

say('=== A. top-level config (defaults Inch / 0.001 in / Game):');
const CORE = ['stgRulerLength', 'stgRulerPrecision', 'mainScaleDivisions', 'mainScaleDivisionsForInch',
  'mainScaleLengthPixels', 'mainScaleLengthPixelsForInch', 'msdValue', 'msdValueInch',
  'vernierScaleDivisions', 'vernierScaleDivisionsForInch', 'vernierScaleLengthPixels',
  'msd_pixels', 'vsd_pixels', 'msd_pixels_inch', 'vsd_pixels_inch', 'precision', 'LC',
  'objectWidthPixel', 'zeroError', 'zeroErrorInch', 'msr', 'vsr', 'msrInch', 'vsrInch',
  'is64Inch', 'isMobileDevice', 'windowWidth', 'scale', 'xOffset', 'yOffset',
  'scaleOriginX', 'scaleOriginY', 'offsetOriginX', 'bgColor', 'fgColor', 'scaleColor',
  'cr', 'unit', 'displayInfo', 'drawSubDivision', 'randomZeroError', 'randomMainScaleDivisions',
  'randomVernierScaleDivision', 'randomObjectWidthPixel', 'pointvalue', 'input_answer',
  'TYPE_MODE_V2', 'loadedItems', 'itemsToLoad'];
say(JSON.stringify(dump(CORE), null, 1));

say('\n=== B. decimals per resolution (getDecimalPlacesForDialCaliper):');
for (const r of ['0.001 in', '1/8 in', '1/16 in', '1/32 in', '1/64 in']) {
  try { say('  ' + r + ' -> ' + b.getDecimalPlacesForDialCaliper(r)); } catch (e) { say('  ' + r + ' -> ERR ' + e.message); }
}

say('\n=== C. initResolutionSettings(is64Inch=true) [1/64 branch]:');
b.stgResolution = '1/64 in'; b.stgScale = 'Inch'; b.is64Inch = true;
try { b.initResolutionSettings();
say(JSON.stringify(dump(['mainScaleDivisionsForInch', 'mainScaleLengthPixelsForInch', 'vernierScaleDivisionsForInch', 'msdValueInch', 'msd_pixels_inch', 'vsd_pixels_inch']), null, 1));
} catch (e) { say('ERR ' + e.message); }
b.stgResolution = '0.001 in'; b.stgScale = 'Inch'; b.stgSubScaleForCM = 'cm'; b.is64Inch = false; b.initResolutionSettings();

function resetGuess(scale, res, sub, Q) {
  b.stgMode = 'Game'; b.stgScale = scale; b.stgResolution = res;
  b.stgSubScaleForCM = sub || 'cm'; b.is64Inch = (res === '1/64 in'); b.stgTimer = 'Off';
  b.gameover = false; b.strikes = 0; b.score = 0; b.level = 1; b.levelcounter = 0;
  b.isProcessingAnswer = false; b.pause = false; b.allowMovement = true;
  b.randomQuestion = Q; b.previousQuestion = null; b.zeroError = 0; b.zeroErrorInch = 0;
  b.pointvalue = 10; b.unit = (scale === 'Centimeter') ? (sub === 'mm' ? 'mm' : 'cm') : 'in';
}
function probeTolerance(label, scale, res, sub, Q, deltas) {
  const out = { cfg: label, Q, display: (typeof b.question2HtmlString === 'function') ? String(b.question2HtmlString(Q)).replace(/<[^>]+>/g, '') : '<no-fn>' };
  for (const d of deltas) for (const s of (d === 0 ? [1] : [1, -1])) {
    resetGuess(scale, res, sub, Q);
    const before = b.score;
    let r;
    try { b.checkGuess(Q + d * s); r = b.score > before ? 'PASS' : 'strike'; } catch (e) { r = 'ERR:' + e.message; }
    out[(s > 0 ? '+' : '-') + d] = r;
  }
  say('\n=== D.' + label + ' (Q=' + Q + ', display="' + out.display + '"):');
  say(JSON.stringify(out, null, 1));
}
const fine = [0, 0.0004, 0.0006, 0.001, 0.01, 0.1, 0.5, 1];
probeTolerance('in-0001', 'Inch', '0.001 in', 'cm', 5, fine);
probeTolerance('in-1/8', 'Inch', '1/8 in', 'cm', 5, fine);
probeTolerance('in-1/64-Q5', 'Inch', '1/64 in', 'cm', 5, [0, 0.2, 0.49, 0.51, 1]);
probeTolerance('in-1/64-Q356', 'Inch', '1/64 in', 'cm', 356, [0, 0.2, 0.49, 0.51, 1, 64]);
probeTolerance('cm-subcm', 'Centimeter', '0.001 in', 'cm', 5, fine);
probeTolerance('cm-submm', 'Centimeter', '0.001 in', 'mm', 5, fine);

say('\n=== D.type (Type mode, Q=5, exact + near misses):');
const tout = { cfg: 'type-0001', Q: 5 };
for (const d of [0, 0.0001, 0.001, 0.01]) for (const s of (d === 0 ? [1] : [1, -1])) {
  resetGuess('Inch', '0.001 in', 'cm', 5); b.stgMode = 'Type';
  const before = b.score;
  let r;
  try { b.checkGuess(5 + d * s); r = b.score > before ? 'PASS' : 'strike'; } catch (e) { r = 'ERR:' + e.message; }
  tout[(s > 0 ? '+' : '-') + d] = r;
}
say(JSON.stringify(tout, null, 1));

say('\n=== E. question ranges (showNewQuestion xN):');
function probeQuestions(label, scale, res, sub, n) {
  let min = Infinity, max = -Infinity, mnMs = Infinity, mxMs = -Infinity, mnVs = Infinity, mxVs = -Infinity, errs = 0;
  const samples = [];
  for (let i = 0; i < n; i++) {
    b.stgMode = 'Game'; b.stgScale = scale; b.stgResolution = res; b.stgSubScaleForCM = sub || 'cm';
    b.is64Inch = (res === '1/64 in'); b.level = 1; b.levelcounter = 0; b.score = 0; b.strikes = 0; b.gameover = false; b.pause = false;
    b.pointvalue = 10; b.unit = (scale === 'Centimeter') ? (sub === 'mm' ? 'mm' : 'cm') : 'in';
    try {
      b.showNewQuestion();
      const q = b.randomQuestion;
      if (typeof q === 'number' && isFinite(q)) {
        if (q < min) min = q; if (q > max) max = q;
        if (typeof b.msr === 'number') { if (b.msr < mnMs) mnMs = b.msr; if (b.msr > mxMs) mxMs = b.msr; }
        if (typeof b.vsr === 'number') { if (b.vsr < mnVs) mnVs = b.vsr; if (b.vsr > mxVs) mxVs = b.vsr; }
        if (samples.length < 3) samples.push({ q, msr: b.msr, vsr: b.vsr, ze: b.zeroError, zei: b.zeroErrorInch, html: String(b.question2HtmlString(q)).replace(/<[^>]+>/g, '') });
      } else if (samples.length < 3) { samples.push({ q: typeof q, html: String(b.question2HtmlString(q)).replace(/<[^>]+>/g, '') }); }
    } catch (e) { errs++; if (errs <= 2) say('  ERR ' + e.message); }
  }
  say('  ' + label + ': ' + (isFinite(min) ? 'Q[' + min + '..' + max + ']' : 'Q=<non-numeric>') + (isFinite(mnMs) ? ' msr[' + mnMs + '..' + mxMs + ']' : '') + (isFinite(mnVs) ? ' vsr[' + mnVs + '..' + mxVs + ']' : '') + (errs ? ' errs=' + errs : ''));
  for (const s of samples) say('     e.g. Q=' + s.q + ' msr=' + (s.msr ?? '') + ' vsr=' + (s.vsr ?? '') + ' ze=' + (s.ze ?? '') + '/' + (s.zei ?? '') + ' display="' + s.html + '"');
}
probeQuestions('Inch 0.001', 'Inch', '0.001 in', 'cm', 400);
probeQuestions('Inch 1/8', 'Inch', '1/8 in', 'cm', 200);
probeQuestions('Inch 1/16', 'Inch', '1/16 in', 'cm', 200);
probeQuestions('Inch 1/32', 'Inch', '1/32 in', 'cm', 200);
probeQuestions('Inch 1/64', 'Inch', '1/64 in', 'cm', 200);
probeQuestions('CM subcm', 'Centimeter', '0.001 in', 'cm', 200);
probeQuestions('CM submm', 'Centimeter', '0.001 in', 'mm', 200);

say('\n=== F. timer per level (stgTimer=On):');
for (let lv = 1; lv <= 10; lv++) {
  b.stgMode = 'Game'; b.stgTimer = 'On'; b.stgScale = 'Inch'; b.stgResolution = '0.001 in'; b.stgSubScaleForCM = 'cm';
  b.level = lv; b.levelcounter = 0; b.gameover = false; b.strikes = 0; b.pause = false;
  try { b.startTimer(); say('  level ' + lv + ': secs=' + b.secs); } catch (e) { say('  level ' + lv + ': ERR ' + e.message); }
}

say('\n=== G. checklevel / strikes:');
b.stgMode = 'Game'; b.stgScale = 'Inch'; b.stgResolution = '0.001 in'; b.stgSubScaleForCM = 'cm';
for (const lc of [0, 4, 5, 6, 9, 10]) {
  b.level = 1; b.levelcounter = lc; b.score = lc * 10; b.strikes = 0; b.gameover = false; b.pointvalue = 10;
  try { b.checklevel(); say('  lc=' + lc + ' -> level=' + b.level + ' pointvalue=' + b.pointvalue + ' lcAfter=' + b.levelcounter + ' gameover=' + b.gameover + ' secs=' + b.secs); } catch (e) { say('  lc=' + lc + ': ERR ' + e.message); }
}
b.strikes = 3; b.gameover = false; b.level = 1;
try { b.doStrike(1); say('  after 4th strike: gameover=' + b.gameover + ' strikes=' + b.strikes); } catch (e) { say('  doStrike ERR ' + e.message); }

say('\n=== H. persisted settings after load:');
say('  sessionStorage=' + JSON.stringify(win.sessionStorage._dump()));
say('  localStorage=' + JSON.stringify(win.localStorage._dump()));
