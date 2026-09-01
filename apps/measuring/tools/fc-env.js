'use strict';
// fc-env.js — headless sandbox for a deobfuscated rulergame script.
// Usage: require('./fc-env')  (reads process.argv[2] as the file to eval)
// Exports { b, win, ctxP, say, evalErr, dump(names) }
const fs = require('fs'), vm = require('vm');
const file = process.argv[2] || 'src/dial_caliper.deobf.js';
const src = fs.readFileSync(file, 'utf8');
const say = (s) => process.stdout.write(s + '\n');
const noop = () => {};

// callable proxy that absorbs any unknown DOM/global: reads -> soft child,
// sets -> stored, calls -> soft child, arithmetic -> 0/'' via toPrimitive
function soft(label) {
  const f = function () {};
  const subs = new Map();
  return new Proxy(f, {
    get(t, p) {
      if (p === Symbol.toPrimitive) return (h) => (h === 'number' ? 0 : '');
      if (p === 'then') return undefined;
      if (p in t) return t[p];
      if (typeof p === 'symbol') return undefined;
      const k = String(p);
      if (!subs.has(k)) subs.set(k, soft(label + '.' + k));
      return subs.get(k);
    },
      set(t, p, v) { t[p] = v; return true; },
      has() { return true; },
      apply() { return soft(label + '()'); },
      construct(t) { return soft(label + '.inst'); },
  });
}

const store = () => {
  const m = new Map();
  return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), clear: () => m.clear(), key: i => [...m.keys()][i] || null, get length() { return m.size; }, _dump: () => Object.fromEntries(m) };
};

const win = soft('window');
win.innerWidth = 1920; win.innerHeight = 1080; win.devicePixelRatio = 1;
win.pageXOffset = 0; win.pageYOffset = 0;
win.location = { href: 'file:///app/page.html', search: '', hash: '', origin: 'file://', protocol: 'file:' };
win.addEventListener = noop; win.removeEventListener = noop; win.scrollTo = noop;
win.setTimeout = () => 0; win.clearTimeout = noop; win.setInterval = () => 0; win.clearInterval = noop;
win.requestAnimationFrame = () => 0; win.cancelAnimationFrame = noop;
win.sessionStorage = store(); win.localStorage = store();
win.navigator = { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36', language: 'en-US' };
win.window = win;

const doc = soft('document');
doc.readyState = 'complete'; doc.title = 'x';
doc.body = soft('body'); doc.head = soft('head');

const base = {
  Math, JSON, Date, parseInt, parseFloat, Number, String, Array, Object, RegExp, Boolean,
  Promise, Map, Set, WeakMap, Symbol, Error, TypeError, RangeError,
  console: { log: noop, error: noop, warn: noop, info: noop, debug: noop },
  TextDecoder, Uint8Array, Uint16Array, Int32Array, Float32Array,
  ArrayBuffer, DataView, encodeURIComponent, decodeURIComponent, isNaN, isFinite, eval,
  window: win, self: win, top: win, parent: win,
  document: doc, navigator: win.navigator,
  sessionStorage: win.sessionStorage, localStorage: win.localStorage,
  Image: class { constructor() { this.onload = null; this.onerror = null; this.width = 0; this.height = 0; this.src = ''; } },
  Audio: class { constructor() { this.play = noop; this.pause = noop; } },
  $: soft('$'), jQuery: soft('$'),
  admin_settings: {},
  setTimeout: () => 0, clearTimeout: noop, setInterval: () => 0, clearInterval: noop,
  requestAnimationFrame: () => 0, cancelAnimationFrame: noop,
  alert: noop, confirm: () => false, prompt: () => null,
  performance: { now: () => 0 },
  history: { pushState: noop, replaceState: noop, state: null },
  location: win.location,
  fetch: async () => ({ ok: false, status: 404, arrayBuffer: async () => new ArrayBuffer(0), text: async () => '', json: async () => ({}) }),
};
const gproxy = new Proxy(base, {
  get(t, p) {
    if (p in t) return t[p];
    if (typeof p === 'symbol' || p === '__proto__' || p === 'constructor') return undefined;
    return soft('G.' + String(p));
  },
  set(t, p, v) { t[p] = v; return true; },
  has() { return true; },
});
base.globalThis = gproxy;

const ctxP = soft('ctx');
ctxP.measureText = () => ({ width: 12, height: 10, boundingBox: { left: 0, right: 12, top: -8, bottom: 2 } });
ctxP.createLinearGradient = () => ({ addColorStop: noop });
ctxP.createRadialGradient = () => ({ addColorStop: noop });
ctxP.createPattern = () => ({});
ctxP.getImageData = (x, y, w, h) => ({ data: new Uint8ClampedArray(4), width: w || 1, height: h || 1 });

const context = vm.createContext(gproxy);
let evalErr = null;
try { vm.runInContext(src, context, { filename: file }); say('[env] evaluated OK (' + src.length + ' chars)\n'); }
catch (e) { evalErr = e; say('[env] EVAL ERROR: ' + String(e).split('\n').slice(0, 4).join(' | ') + '\n'); }

if (!base.canvas) base.canvas = soft('canvas');
if (!base.ctx) base.ctx = ctxP;

module.exports = { b: base, win, ctxP, ctx: context, say, evalErr,
  dump(names) { const o = {}; for (const n of names) { const v = base[n]; o[n] = v === undefined ? '<undef>' : (typeof v === 'function' ? 'fn' : v); } return o; } };
