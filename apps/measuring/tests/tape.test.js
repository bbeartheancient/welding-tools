const assert = require('assert');
const fs = require('fs');
const path = require('path');

eval(fs.readFileSync(path.join(__dirname, '..', 'tape-logic.js'), 'utf8'));

let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); console.log('PASS: ' + name); passed++; }
  catch (e) { console.log('FAIL: ' + name + ' - ' + e.message); failed++; }
}

test('reduce 2/4 to 1/2', () => {
  assert.strictEqual(TapeLogic.formatTarget(2, { questionPrecision: 4, notation: 'fraction', fractionStyle: 'reduced' }), '1/2"');
});
test('reduce 3/6 to 1/2', () => {
  assert.strictEqual(TapeLogic.formatTarget(3, { questionPrecision: 6, notation: 'fraction', fractionStyle: 'reduced' }), '1/2"');
});
test('unsimplified 2/8', () => {
  assert.strictEqual(TapeLogic.formatTarget(2, { questionPrecision: 8, notation: 'fraction', fractionStyle: 'unsimplified' }), '2/8"');
});
test('whole 4/4 = 1"', () => {
  assert.strictEqual(TapeLogic.formatTarget(4, { questionPrecision: 4, notation: 'fraction', fractionStyle: 'reduced' }), '1"');
});
test('mixed 5/4 = 1 1/4"', () => {
  assert.strictEqual(TapeLogic.formatTarget(5, { questionPrecision: 4, notation: 'fraction', fractionStyle: 'reduced' }), '1 1/4"');
});
test('decimal 1/4', () => {
  assert.strictEqual(TapeLogic.formatTarget(1, { questionPrecision: 4, notation: 'decimal' }), '0.25"');
});
test('parse 1/4', () => {
  assert.strictEqual(TapeLogic.parseAnswer('1/4', { questionPrecision: 4, notation: 'fraction' }), 1);
});
test('parse 1 1/4', () => {
  assert.strictEqual(TapeLogic.parseAnswer('1 1/4', { questionPrecision: 4, notation: 'fraction' }), 5);
});
test('parse 2', () => {
  assert.strictEqual(TapeLogic.parseAnswer('2', { questionPrecision: 4, notation: 'fraction' }), 8);
});
test('parse 0.5', () => {
  assert.strictEqual(TapeLogic.parseAnswer('0.5', { questionPrecision: 4, notation: 'decimal' }), 2);
});

console.log('\nTape: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
