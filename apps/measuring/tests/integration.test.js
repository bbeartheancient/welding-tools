// Integration test: verify all modules load and interoperate
// Logic modules use require() (they have module.exports); render modules
// are eval'd in a sandbox to verify registration.

const fs = require('fs');
const path = require('path');
const base = path.resolve(__dirname, '..');

let passed = 0, failed = 0;
const results = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    results.push('PASS: ' + name);
  } catch (e) {
    failed++;
    results.push('FAIL: ' + name + ' — ' + e.message);
  }
}

// ---- Load logic modules (pure, node-compatible) ----
let TapeLogic, CaliperLogic;
try {
  TapeLogic = require('../tape-logic.js');
} catch (e) {
  results.push('FAIL: require tape-logic — ' + e.message);
}
try {
  CaliperLogic = require('../caliper-logic.js');
} catch (e) {
  results.push('FAIL: require caliper-logic — ' + e.message);
}

// ---- Tape logic integration ----
if (TapeLogic) {
  test('tape generates target', () => {
    const settings = { questionPrecision: 16, length: 12, notation: 'fraction', fractionStyle: 'reduced' };
    const target = TapeLogic.generateTarget(settings);
    if (typeof target !== 'number') throw new Error('not a number');
    if (target < 1 || target > 192) throw new Error('out of range: ' + target);
  });

  test('tape format/parse roundtrip', () => {
    const settings = { questionPrecision: 16, length: 12, notation: 'fraction', fractionStyle: 'reduced' };
    const target = TapeLogic.generateTarget(settings);
    const formatted = TapeLogic.formatTarget(target, settings);
    const parsed = TapeLogic.parseAnswer(formatted, settings);
    if (parsed !== target) {
      throw new Error('roundtrip failed: target=' + target + ' formatted="' + formatted + '" parsed=' + parsed);
    }
  });

  test('tape validate correct', () => {
    if (!TapeLogic.validateAnswer('4 1/16"', 65, 16)) {
      throw new Error('should accept correct answer');
    }
  });

  test('tape validate wrong', () => {
    if (TapeLogic.validateAnswer('4 1/8"', 65, 16)) {
      throw new Error('should reject wrong answer');
    }
  });

  test('tape tick generation', () => {
    const ticks = TapeLogic.generateTicks(1, 16);
    if (ticks.length !== 17) throw new Error('expected 17 ticks, got ' + ticks.length);
  });
}

// ---- Caliper logic integration ----
if (CaliperLogic) {
  test('caliper generates target', () => {
    const settings = { unit: 'inch', resolution: '0.001' };
    const target = CaliperLogic.generateTarget(settings);
    if (typeof target !== 'number' || target < 1) throw new Error('invalid target: ' + target);
  });

  test('caliper format/parse roundtrip', () => {
    const settings = { unit: 'inch', resolution: '0.001' };
    const target = CaliperLogic.generateTarget(settings);
    const formatted = CaliperLogic.formatTarget(target, settings);
    const parsed = CaliperLogic.parseAnswer(formatted, settings);
    if (parsed !== target) {
      throw new Error('roundtrip failed: target=' + target + ' formatted="' + formatted + '" parsed=' + parsed);
    }
  });

  test('caliper validation via parse', () => {
    const settings = { unit: 'inch', resolution: '0.001' };
    const target = 1234; // 1.234 inches
    const formatted = CaliperLogic.formatTarget(target, settings);
    const parsed = CaliperLogic.parseAnswer(formatted, settings);
    if (parsed !== target) {
      throw new Error('should accept correct: target=' + target + ' parsed=' + parsed);
    }
  });
}

// ---- Verify render modules register correctly (simulate browser) ----
// Use vm to create a browser-like environment with window.registerModule
const vm = require('vm');
const registeredModules = {};

function makeBrowserSandbox() {
  return {
    window: {
      registerModule: function(id, title, initFn) {
        registeredModules[id] = { id: id, title: title, initFn: initFn };
      }
    },
    document: { readyState: 'complete' },
    localstorage: {
      getItem: function(k) { return null; },
      setItem: function(k, v) {},
      removeItem: function(k) {}
    }
  };
}

function loadBrowserModule(name) {
  const code = fs.readFileSync(path.join(base, name), 'utf8');
  const sandbox = makeBrowserSandbox();
  try {
    vm.runInNewContext(code, sandbox);
    return true;
  } catch (e) {
    results.push('FAIL: load ' + name + ' — ' + e.message);
    return false;
  }
}

loadBrowserModule('core.js');
loadBrowserModule('tape.js');
loadBrowserModule('caliper.js');
loadBrowserModule('weld.js');

test('tape module registered', () => {
  if (!registeredModules['tape']) throw new Error('tape not registered');
});

test('caliper module registered', () => {
  if (!registeredModules['caliper']) throw new Error('caliper not registered');
});

test('weld module registered', () => {
  if (!registeredModules['weld']) throw new Error('weld not registered');
});

// ---- Report ----
for (const r of results) {
  console.log(r);
}
console.log('');
console.log(passed + ' passed, ' + failed + ' failed');
if (failed > 0) {
  process.exit(1);
}