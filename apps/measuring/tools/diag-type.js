'use strict';
// diag-type.js — trap toFixed in BOTH realms (host + vm) to see which digit
// counts checkGuess / display code actually use per settings combo.
const vm = require('vm');
const env = require('./fc-env');
const { b, say, ctx } = env;
if (env.evalErr) { say('eval failed'); process.exit(1); }

const log = [];
const Orig = Number.prototype.toFixed;
function trap(proto, tag) {
  const O = proto.toFixed;
  proto.toFixed = function (d) { log.push({ tag, v: this, d }); return O.call(this, d); };
}
trap(Number.prototype, 'host');
const vmNumber = vm.runInContext('Number', ctx);
if (vmNumber && vmNumber.prototype !== Number.prototype) trap(vmNumber.prototype, 'vm');
else say('NOTE: vm Number is the host one (single realm)');

function run(label, mode, scale, res, sub, Q, guess) {
  if (guess === undefined) guess = Q;
  b.stgMode = mode; b.stgScale = scale; b.stgResolution = res;
  b.stgSubScaleForCM = sub || 'cm'; b.is64Inch = (res === '1/64 in'); b.stgTimer = 'Off';
  b.gameover = false; b.strikes = 0; b.score = 0; b.level = 1; b.levelcounter = 0;
  b.isProcessingAnswer = false; b.pause = false; b.allowMovement = true;
  b.randomQuestion = Q; b.previousQuestion = null; b.zeroError = 0; b.zeroErrorInch = 0;
  b.pointvalue = 10; b.unit = (scale === 'Centimeter') ? (sub === 'mm' ? 'mm' : 'cm') : 'in';
  log.length = 0;
  let outcome = 'n/a';
  try { b.checkGuess(guess); outcome = (b.score > 0) ? 'CORRECT' : ((b.strikes > 0) ? 'STRIKE' : 'no-op'); }
  catch (e) { outcome = 'THROW ' + e.message; }
  say('--- ' + label + '  Q=' + Q + ' guess=' + guess + '  outcome=' + outcome + '  strikes=' + b.strikes + ' score=' + b.score + ' gameover=' + b.gameover);
  const seen = new Set();
  for (const e of log) {
    const key = e.tag + ':' + e.v + ':' + e.d;
    if (seen.has(key)) continue; seen.add(key);
    say('    [' + e.tag + '] toFixed(' + e.d + ') on ' + (typeof e.v === 'number' ? e.v : JSON.stringify(e.v)) + '  ->  ' + JSON.stringify(Orig.call(e.v, e.d)));
  }
  if (!log.length) say('    (no toFixed calls trapped)');
}

run('Type 0.001in', 'Type', 'Inch', '0.001 in', 'cm', 5);
run('Game 0.001in', 'Game', 'Inch', '0.001 in', 'cm', 5);
run('Game 1/64in (is64)', 'Game', 'Inch', '1/64 in', 'cm', 5);
run('Game cm subcm', 'Game', 'Centimeter', '0.001 in', 'cm', 5);
run('Game cm submm', 'Game', 'Centimeter', '0.001 in', 'mm', 5);
run('Trainer 0.001in', 'Trainer', 'Inch', '0.001 in', 'cm', 5);

// strike path: wrong guess -> formatting of the displayed correct answer
run('STRIKE Type 0.001in', 'Type', 'Inch', '0.001 in', 'cm', 5, 5.5);
run('STRIKE Game 1/64in', 'Game', 'Inch', '1/64 in', 'cm', 356, 356.4);
run('STRIKE cm submm', 'Game', 'Centimeter', '0.001 in', 'mm', 5, 5.1);

// restore
Number.prototype.toFixed = Orig;
if (vmNumber && vmNumber.prototype !== Number.prototype) vmNumber.prototype.toFixed = Orig;
say('done');
