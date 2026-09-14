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
  for (let i = 0; i < 10; i++) {
    const t = CaliperLogic.generateTarget({ unit: 'inch', resolution: '0.001' });
    assert.ok(t >= 1 && t <= 1000, 'target ' + t + ' out of range');
  }
});

test('generate target in valid range (1/64)', () => {
  for (let i = 0; i < 10; i++) {
    const t = CaliperLogic.generateTarget({ unit: 'inch', resolution: '1/64' });
    assert.ok(t >= 1 && t <= 128, 'target ' + t + ' out of range');
  }
});

console.log('\nCaliper: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
