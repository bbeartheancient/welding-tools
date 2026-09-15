// Test loading the welding app modules in Node.js with mocked browser environment

// Mock window
global.window = {};
global.window.registerModule = function(id, title, init) {
  console.log('Registered module: ' + id + ' - ' + title);
};

// Mock document
global.document = {
  createDocumentFragment: function() { return { addEventListener: function() {} }; },
  createTextNode: function(text) { return { textContent: text, appendChild: function() {} }; },
  createComment: function(text) { return {}; },
  createElement: function(tag) {
    var el = {
      tag_name: tag.toUpperCase(),
      innerHTML: '',
      textContent: '',
      value: '',
      style: {},
      classList: { add: function() {}, remove: function() {}, contains: function() { return false; } },
      classListValue: '',
      set className(v) { this.classListValue = v; },
      get className() { return this.classListValue; },
      setAttribute: function(name, val) { this[name] = val; },
      getAttribute: function(name) { return this[name]; },
      hasAttribute: function(name) { return this[name] !== undefined; },
      addEventListener: function() {},
      removeEventListener: function() {},
      querySelector: function() { return null; },
      querySelectorAll: function() { return []; },
      appendChild: function(child) { return child; },
      removeChild: function(child) { return child; },
      insertBefore: function(newChild, refChild) { return newChild; },
      insertAdjacentElement: function() {},
      insertAdjacentHTML: function() {},
      insertAdjacentText: function() {},
      focus: function() {},
      blur: function() {},
      getBoundingClientRect: function() { return { left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100, x: 0, y: 0 }; }
    };
    return el;
  },
  getElementById: function(id) { return null; },
  querySelector: function(sel) {
    var parts = sel.split('#');
    if (parts.length > 1) {
      var id = parts[1];
      if (id) return { id: id };
    }
    return { id: 'root' };
  },
  querySelectorAll: function() { return []; },
  body: null,
  head: null,
  title: 'Test'
};
global.document.body = global.document.createElement('body');
global.document.head = global.document.createElement('head');

// Mock localStorage
global.localStorage = {
  getItem: function(key) { return null; },
  setItem: function(key, val) {},
  removeItem: function(key) {},
  clear: function() {},
  length: 0
};

// Load and test modules
var modules = [
  'core.js',
  'tape-logic.js',
  'tape.js',
  'caliper-logic.js',
  'caliper.js',
  'weld.js'
];

var allOk = true;
for (var i = 0; i < modules.length; i++) {
  var mod = modules[i];
  try {
    require('./' + mod);
    console.log(mod + ': OK');
  } catch (e) {
    console.log(mod + ': ERROR - ' + e.message);
    if (e.stack) {
      console.log('  Stack: ' + e.stack.split('\n')[1]);
    }
    allOk = false;
  }
}

console.log(allOk ? '\nAll modules loaded successfully!' : '\nSome modules failed to load.');
