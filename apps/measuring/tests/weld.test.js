const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Stub window and registerModule for node
global.window = {
  registerModule: function(id, title, initFn) {
    global.window._registered = global.window._registered || {};
    global.window._registered[id] = { id, title, init: initFn };
  }
};

eval(fs.readFileSync(path.join(__dirname, '..', 'weld.js'), 'utf8'));

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log('PASS: ' + name); passed++; }
  catch (e) { console.log('FAIL: ' + name + ' - ' + e.message); failed++; }
}

test('has 13 parts', () => {
  assert.strictEqual(WeldGame.PARTS.length, 13);
});

test('part 1 is Arrow', () => {
  assert.strictEqual(WeldGame.PARTS[0].name, 'Arrow');
});

test('part 3 is Reference line', () => {
  assert.strictEqual(WeldGame.PARTS[2].name, 'Reference line');
});

test('part 7 is Weld symbol', () => {
  assert.strictEqual(WeldGame.PARTS[6].name, 'Weld symbol');
});

test('part 6 is Weld size', () => {
  assert.strictEqual(WeldGame.PARTS[5].name, 'Weld size');
});

test('part 5 is Shop/Field weld', () => {
  assert.strictEqual(WeldGame.PARTS[4].name, 'Shop/Field weld');
});

console.log('\nWeld: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
