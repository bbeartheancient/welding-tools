// Load the app in Node using a minimal DOM shim and report errors
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Read files
const html = fs.readFileSync('index.html', 'utf8');
const coreJs = fs.readFileSync('core.js', 'utf8');
const tapeLogicJs = fs.readFileSync('tape-logic.js', 'utf8');
const tapeJs = fs.readFileSync('tape.js', 'utf8');
const caliperLogicJs = fs.readFileSync('caliper-logic.js', 'utf8');
const caliperJs = fs.readFileSync('caliper.js', 'utf8');
const weldJs = fs.readFileSync('weld.js', 'utf8');

// Minimal DOM shim
const elements = [];
let nextId = 1;

function createMockElement(tagName) {
  const el = {
    tagName: tagName.toUpperCase(),
    innerHTML: '',
    textContent: '',
    id: '',
    className: '',
    attributes: {},
    children: [],
    parentElement: null,
    style: {},
  };
  el.id = 'el' + (nextId++);
  elements.push(el);
  return el;
}

const doc = {
  createElement(tag) { return createMockElement(tag); },
  getElementById(id) { return elements.find(e => e.id === id) || null; },
  getElementsByTagName(tag) { return elements.filter(e => e.tagName === tag.toUpperCase()); },
  body: createMockElement('body'),
  readyState: 'complete',
};
// Make body the doc body
doc.body.id = 'body';

const mockWindow = {
  document: doc,
  addEventListener: () => {},
  dispatchEvent: () => {},
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  },
  atob: (s) => Buffer.from(s, 'base64').toString(),
  btoa: (s) => Buffer.from(s).toString('base64'),
  setTimeout: global.setTimeout,
  clearTimeout: global.clearTimeout,
  requestAnimationFrame: (cb) => global.setTimeout(cb, 16),
  alert: (msg) => console.log('[ALERT]', msg),
};

// Patch doc.body appendChild
doc.body.appendChild = function(child) {
  if (!this.children.includes(child)) {
    this.children.push(child);
    child.parentElement = this;
  }
};

let ctx = vm.createContext({
  window: mockWindow,
  document: doc,
  localStorage: mockWindow.localStorage,
  setTimeout: global.setTimeout,
  clearTimeout: global.clearTimeout,
  atob: global.atob,
  btoa: global.btoa,
  Math: global.Math,
  JSON: global.JSON,
  console: global.console,
  Error: global.Error,
  RangeError: global.RangeError,
  TypeError: global.TypeError,
  Object: global.Object,
  Array: global.Array,
  String: global.String,
  Number: global.Number,
});

// Add element prototype methods
for (const el of elements) {
  el.setAttribute = function(name, val) { this.attributes[name] = val; if (name === 'id') this.id = val; };
  el.getAttribute = function(name) { return this.attributes[name] || null; };
  el.querySelector = function(sel) {
    // Very basic: only supports #id and .class
    if (sel.startsWith('#')) {
      return doc.getElementById(sel.slice(1));
    }
    return null;
  };
  el.querySelectorAll = function(sel) { return []; };
  el.classList = {
    add: function(c) { if (!this.list) this.list = []; if (!this.list.includes(c)) this.list.push(c); },
    remove: function(c) { if (this.list) { this.list = this.list.filter(x => x !== c); } },
    contains: function(c) { return this.list && this.list.includes(c); },
    toggle: function(c, force) {
      if (!this.list) this.list = [];
      if (force === undefined) force = !this.list.includes(c);
      if (force) { if (!this.list.includes(c)) this.list.push(c); }
      else { this.list = this.list.filter(x => x !== c); }
    }
  };
  el.addEventListener = () => {};
  el.appendChild = function(child) {
    if (!this.children.includes(child)) {
      this.children.push(child);
      child.parentElement = this;
    }
  };
}

function evalFile(name, code) {
  console.log('Loading ' + name + '...');
  try {
    vm.runInContext(code, ctx);
    console.log('  OK');
  } catch (e) {
    console.log('  ERROR: ' + e.message);
    console.log('  at: ' + e.stack);
    return false;
  }
  return true;
}

let ok = true;
ok = evalFile('core.js', coreJs) && ok;
ok = evalFile('tape-logic.js', tapeLogicJs) && ok;
ok = evalFile('tape.js', tapeJs) && ok;
ok = evalFile('caliper-logic.js', caliperLogicJs) && ok;
ok = evalFile('caliper.js', caliperJs) && ok;
ok = evalFile('weld.js', weldJs) && ok;

console.log('\n' + (ok ? 'ALL LOADED OK' : 'LOAD ERRORS'));
