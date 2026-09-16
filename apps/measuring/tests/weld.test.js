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

const vm = require('vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'weld.js'), 'utf8');

function runGame({ quizMode = 'read', randomSeq }) {
  const calls = [];
  let n = 0;
  const math = Object.create(Math);
  math.random = () => {
    assert.ok(n < randomSeq.length, 'Unexpected random draw');
    return randomSeq[n++];
  };
  const recorder = new Proxy({}, {
    get(t, key) {
      if (key === 'canvas') return { width: 900, height: 500 };
      if (['fillStyle', 'strokeStyle', 'lineWidth', 'font'].includes(key)) return t[key];
      return (...args) => {
        calls.push({ command: [key, ...args], stroke: t.strokeStyle, fill: t.fillStyle, width: t.lineWidth });
      };
    },
    set(t, key, value) { t[key] = value; return true; }
  });
  const els = {};
  const mkEl = () => ({
    value: '', textContent: '', placeholder: '', style: {},
    addEventListener(ev, fn) { this['on' + ev] = fn; },
    insertAdjacentElement() {},
    getContext: () => recorder
  });
  const panel = {
    innerHTML: '',
    querySelector(sel) {
      if (sel === '.game-area') return mkEl();
      if (!els[sel]) els[sel] = mkEl();
      return els[sel];
    }
  };
  const sandbox = {
    document: { createElement: () => ({ remove() {} }) },
    setTimeout: () => {},
    weldtrain: {
      loadSettings: () => ({ quizMode, weldType: 'all' }),
      saveSettings: () => {},
      createEngine: () => ({ bindEl() {}, isGameOver: () => false, recordCorrect() {}, recordStrike() {}, reset() {} }),
      buildSettingsPanel: () => ({ querySelector: () => ({ addEventListener() {} }) }),
      readSettingsFromForm: () => ({}),
      restorePanel: () => {}
    },
    window: { registerModule() {} }
  };
  vm.createContext(sandbox);
  sandbox.Math = math;
  vm.runInContext(source, sandbox);
  sandbox.WeldGame.init(panel);
  assert.strictEqual(n, randomSeq.length);
  return { calls, panel, els };
}

function assertCommands(calls, expected) {
  const commands = calls.map(call => call.command);
  const start = commands.findIndex((command, index) =>
    expected.every((entry, offset) => JSON.stringify(commands[index + offset]) === JSON.stringify(entry))
  );
  assert.ok(start >= 0, 'Missing canvas sequence: ' + JSON.stringify(expected));
  return calls.slice(start, start + expected.length);
}

for (const [type, index] of [['fillet', 0], ['groove', 1], ['plug', 2], ['slot', 3], ['seam', 4]]) {
  for (const [side, random, direction] of [['arrow', 0, 1], ['far', 0.9, -1]]) {
    test(type + ' geometry on ' + side + ' side', () => {
      const { calls } = runGame({ randomSeq: [(index + 0.5) / 5, 0, random, 0.9, 0.9, 0.9] });
      const y = 250 + direction * 30;
      const shapes = {
        fillet: [['beginPath'], ['moveTo', 380, 250], ['lineTo', 380, y], ['lineTo', 410, 250], ['closePath'], ['stroke']],
        groove: [['beginPath'], ['moveTo', 380, y], ['lineTo', 395, 250], ['lineTo', 410, y], ['stroke']],
        plug: [['beginPath'], ['rect', 380, 250, 40, direction * 22], ['stroke']],
        slot: [['beginPath'], ['rect', 380, 250, 40, direction * 22], ['stroke']],
        seam: [['beginPath'], ['arc', 395, 250, 18, 0, Math.PI * 2], ['moveTo', 368, 243], ['lineTo', 422, 243], ['moveTo', 368, 257], ['lineTo', 422, 257], ['stroke']]
      };
      assertCommands(calls, shapes[type]);
      assertCommands(calls, [['fillText', '1', 320, direction === 1 ? 285 : 230]]);
    });
  }
}

test('field flag starts at the arrow/reference junction', () => {
  const { calls } = runGame({ randomSeq: [0, 0, 0, 0.9, 0, 0.9] });
  assertCommands(calls, [['beginPath'], ['moveTo', 100, 250], ['lineTo', 100, 195], ['lineTo', 130, 205], ['lineTo', 100, 215], ['stroke']]);
});

test('tail forks from reference endpoint and process text follows it', () => {
  const { calls } = runGame({ randomSeq: [0, 0, 0, 0.9, 0.9, 0] });
  assertCommands(calls, [['beginPath'], ['moveTo', 790, 225], ['lineTo', 750, 250], ['lineTo', 790, 275], ['stroke'], ['fillText', '111', 795, 255]]);
});

test('shop weld omits field flag and optional tail', () => {
  const { calls } = runGame({ randomSeq: [0, 0, 0, 0.9, 0.9, 0.9] });
  assert.ok(!calls.some(call => JSON.stringify(call.command) === JSON.stringify(['lineTo', 100, 195])));
  assert.ok(!calls.some(call => call.command[0] === 'fillText' && call.command[1] === '111'));
  assert.ok(!calls.some(call => JSON.stringify(call.command) === JSON.stringify(['moveTo', 790, 225])));
});

test('identify highlights the reference line in red', () => {
  const { calls, els } = runGame({ quizMode: 'identify', randomSeq: [0.25, 0, 0, 0, 0.9, 0.9, 0.9] });
  assert.ok(els['#weld-question'].textContent.includes('#3'));
  const line = assertCommands(calls, [['beginPath'], ['moveTo', 100, 250], ['lineTo', 750, 250], ['stroke']]);
  assert.strictEqual(line[3].stroke, '#e74c3c');
  assert.strictEqual(line[3].width, 4);
});

console.log('\nWeld: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
