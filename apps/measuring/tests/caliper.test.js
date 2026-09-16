const assert = require('assert');
const fs = require('fs');
const path = require('path');

eval(fs.readFileSync(path.join(__dirname, '..', 'caliper-logic.js'), 'utf8'));

let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); console.log('PASS: ' + name); passed++; }
  catch (e) { console.log('FAIL: ' + name + ' - ' + e.message); failed++; }
}

test('0.001 inch format', () => {
  assert.strictEqual(CaliperLogic.formatTarget(1234, { unit: 'inch', resolution: '0.001' }), '1.234 in');
});

test('1/64 inch format', () => {
  assert.strictEqual(CaliperLogic.formatTarget(65, { unit: 'inch', resolution: '1/64' }), '1 1/64 in');
});

test('1/32 inch format', () => {
  assert.strictEqual(CaliperLogic.formatTarget(66, { unit: 'inch', resolution: '1/32' }), '1 1/32 in');
});

test('metric 0.01mm format', () => {
  assert.strictEqual(CaliperLogic.formatTarget(1234, { unit: 'cm', resolution: '0.01' }), '12.34 mm');
});

test('parse inch decimal', () => {
  assert.strictEqual(CaliperLogic.parseAnswer('0.5 in', { unit: 'inch', resolution: '0.001' }), 500);
});

test('parse inch fraction', () => {
  assert.strictEqual(CaliperLogic.parseAnswer('1/4 in', { unit: 'inch', resolution: '1/64' }), 16);
});

test('parse mixed fraction', () => {
  assert.strictEqual(CaliperLogic.parseAnswer('1 1/2 in', { unit: 'inch', resolution: '1/64' }), 96);
});

test('parse metric', () => {
  assert.strictEqual(CaliperLogic.parseAnswer('5', { unit: 'cm', resolution: '0.1' }), 50);
});

test('generate target in valid range (0.001)', () => {
  for (let i = 0; i < 50; i++) {
    const t = CaliperLogic.generateTarget({ unit: 'inch', resolution: '0.001' });
    assert.ok(t >= 868 && t <= 1950, 'target ' + t + ' out of FACTS range 868..1950');
  }
});

test('generate target in valid range (1/64)', () => {
  for (let i = 0; i < 10; i++) {
    const t = CaliperLogic.generateTarget({ unit: 'inch', resolution: '1/64' });
    assert.ok(t >= 1 && t <= 128, 'target ' + t + ' out of range');
  }
});

test('toDecimalInches conversion', () => {
  assert.strictEqual(CaliperLogic.toDecimalInches(1234), 1.234);
  assert.strictEqual(CaliperLogic.toDecimalInches(64), 0.064);
  assert.strictEqual(CaliperLogic.toDecimalInches(1), 0.001);
});

test('dial needle mapping: fraction of one 0.1in revolution', () => {
  // Simulates the needle math in caliper.js: revs = inches/0.1, mod 1,
  // angle = revs*2PI - PI/2 (0 at top, clockwise)
  function needleRevs(target) {
    const inches = CaliperLogic.toDecimalInches(target);
    let revs = inches / 0.1;
    return revs - Math.floor(revs);
  }
  const EPS = 1e-9;
  // 0.300 in → exactly 3 revolutions → needle at 0 (top, modulo float error)
  assert.ok(Math.abs(needleRevs(300)) < EPS || Math.abs(needleRevs(300) - 1) < EPS,
            'got ' + needleRevs(300));
  // 0.350 in → half revolution → needle at 0.5
  assert.ok(Math.abs(needleRevs(350) - 0.5) < EPS, 'got ' + needleRevs(350));
  // 0.250 in → quarter revolution
  assert.ok(Math.abs(needleRevs(250) - 0.5) < EPS, 'got ' + needleRevs(250));
  // 1.234 in → 12 full revolutions + 0.34 → needle at 0.34
  const r = needleRevs(1234);
  assert.ok(Math.abs(r - 0.34) < EPS, 'got ' + r);
  // needle angle for 0.050 in (half a revolution = 180° from top)
  const halfAngle = needleRevs(50) * 2 * Math.PI - Math.PI / 2;
  assert.ok(Math.abs(halfAngle - Math.PI / 2) < EPS, 'half rev should point down, got ' + halfAngle);
});

test('dial display value matches user value', () => {
  // caliper.js draws formatTarget(round(userValue)) — roundtrip via parseAnswer
  for (const t of [1, 37, 500, 999, 1234]) {
    const s = { unit: 'inch', resolution: '0.001' };
    const str = CaliperLogic.formatTarget(t, s);
    assert.strictEqual(CaliperLogic.parseAnswer(str, s), t, 'roundtrip failed for ' + t);
  }
});

test('targetToUnits/unitsToTarget round-trip all resolutions', () => {
  const cfgs = [
    { unit: 'inch', resolution: '0.001' },
    { unit: 'inch', resolution: '1/8' },
    { unit: 'inch', resolution: '1/16' },
    { unit: 'inch', resolution: '1/32' },
    { unit: 'inch', resolution: '1/64' },
    { unit: 'cm', resolution: '0.1' },
    { unit: 'cm', resolution: '0.01' }
  ];
  for (const s of cfgs) {
    const t = CaliperLogic.generateTarget(s);
    const u = CaliperLogic.targetToUnits(t, s);
    assert.strictEqual(CaliperLogic.unitsToTarget(u, s), t,
      'round-trip failed for ' + JSON.stringify(s) + ' target ' + t);
  }
});

test('targetToUnits known values', () => {
  assert.strictEqual(CaliperLogic.targetToUnits(64, { unit: 'inch', resolution: '1/64' }), 1);
  assert.strictEqual(CaliperLogic.targetToUnits(1234, { unit: 'inch', resolution: '0.001' }), 1.234);
  assert.strictEqual(CaliperLogic.targetToUnits(1234, { unit: 'cm', resolution: '0.01' }), 12.34);
  assert.strictEqual(CaliperLogic.targetToUnits(50, { unit: 'cm', resolution: '0.1' }), 5);
});

test('stepInTargetUnits matches resolution', () => {
  assert.strictEqual(CaliperLogic.stepInTargetUnits({ unit: 'inch', resolution: '0.001' }), 1);
  assert.strictEqual(CaliperLogic.stepInTargetUnits({ unit: 'inch', resolution: '1/8' }), 8);
  assert.strictEqual(CaliperLogic.stepInTargetUnits({ unit: 'inch', resolution: '1/16' }), 4);
  assert.strictEqual(CaliperLogic.stepInTargetUnits({ unit: 'inch', resolution: '1/32' }), 2);
  assert.strictEqual(CaliperLogic.stepInTargetUnits({ unit: 'inch', resolution: '1/64' }), 1);
  assert.strictEqual(CaliperLogic.stepInTargetUnits({ unit: 'cm', resolution: '0.1' }), 1);
  assert.strictEqual(CaliperLogic.stepInTargetUnits({ unit: 'cm', resolution: '0.01' }), 1);
});

console.log('\nCaliper: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
