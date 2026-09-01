// deobfuscate.js — extract the string tables from rulergame.net's obfuscated JS and
// rewrite every `alias(0x..)` call site into a plain string literal.
// Node built-ins only (fs, vm). No network, no npm.
//
// Obfuscator pattern (both files):
//   var ALIAS = DECODER;
//   function DECODER(a,b){ var arr = ARRAYFN(); return DECODER = function(idx,key){
//        idx -= OFFSET;  // static shift (ruler: -358; caliper: +3026)
//        ...hex-decode arr[idx] with a constant XOR key; memoize on args... }
//        , DECODER(a,b); }
//   function ARRAYFN(){ var data=[...hex...]; return ARRAYFN=function(){return data;},ARRAYFN(); }
//   (rotation IIFE: spins push/shift on the array until a computed check matches)
// The call-site index space is offset from the array positions; the IIFE performs the
// runtime rotation, so the preamble MUST be eval'd (in a VM) before decoding.
//
// Preamble shapes:
//   ruler:   [0 .. endOfIIFECall) + ')'   (IIFE is the 1st member of a big comma-expression
//                                            that wraps the whole app bootstrap; we cut the
//                                            comma expression and close its outer paren)
//   caliper: [0 .. indexOf('var session_prefix')) + [indexOf('function ARRAYFN') .. endOf(DECODER)]
//            (function declarations for ARRAYFN/DECODER live at the END of the file and are
//             hoisted; the leading block holds alias + rotation IIFE as a complete statement)
//
// usage: node tools/deobfuscate.js [ruler|caliper|all]

'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const CONFIGS = {
  ruler: {
    file: 'src/ruler.orig.js',
    out: 'src/ruler.deobf.js',
    strings: 'src/ruler.strings.json',
    alias: 'uNTrWjaQBBQjwYqBbkhygN',
    decoder: 'R_UrHtiJKo$ZfuVi',
    array: 'busLFQiaEMXuU',
    style: 'ruler', // comma-expression wrapper: cut at IIFE call end, append ')'
    marker: '$(document)',
    expect: ['ready'],
  },
  caliper: {
    file: 'src/dial_caliper.orig.js',
    out: 'src/dial_caliper.deobf.js',
    strings: 'src/dial_caliper.strings.json',
    alias: 'yJVBqWHkRjLSRF_TuJEWPl',
    decoder: 'dZ$w_idd',
    array: 'BWLHjkxHPubBvwpMBcask',
    style: 'caliper', // leading block is a complete statement; tail = arrayFn..endOfDecoder
    marker: 'var session_prefix',
    expect: ['getElementById'],
  },
};

function fnEnd(s, openIdx) {
  let depth = 0, inStr = null, esc_ = false;
  for (let i = openIdx; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc_) esc_ = false;
      else if (ch === '\\') esc_ = true;
      else if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) return i + 1; }
  }
  throw new Error('unbalanced braces from offset ' + openIdx);
}
function parenEnd(s, openIdx) {
  let depth = 0, inStr = null, esc_ = false;
  for (let i = openIdx; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc_) esc_ = false;
      else if (ch === '\\') esc_ = true;
      else if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
    if (ch === '(') depth++;
    else if (ch === ')') { depth--; if (depth === 0) return i + 1; }
  }
  throw new Error('unbalanced parens from offset ' + openIdx);
}

function extractPreamble(src, cfg) {
  if (cfg.style === 'ruler') {
    const arrAt = src.indexOf('function ' + cfg.array);
    if (arrAt < 0) throw new Error('array fn not found');
    const iife = src.indexOf('(function(', arrAt);
    if (iife < 0) throw new Error('rotation IIFE not found after array fn');
    const bodyOpen = src.indexOf('{', iife);
    const bodyEnd = fnEnd(src, bodyOpen);
    if (src[bodyEnd] !== '(') throw new Error('no call paren after IIFE body (char=' + JSON.stringify(src[bodyEnd]) + ')');
    const callEnd = parenEnd(src, bodyEnd);
    if (src[callEnd] !== ',' || src.indexOf(cfg.marker) !== callEnd + 1) {
      throw new Error('IIFE call not followed by ","+' + cfg.marker + ' (char=' + JSON.stringify(src[callEnd]) + ', marker at ' + src.indexOf(cfg.marker) + ', callEnd ' + callEnd + ')');
    }
    return src.slice(0, callEnd) + ')'; // drop the dangling comma; close the outer comma-expression paren
  }
  const a = src.indexOf(cfg.marker);
  if (a < 0) throw new Error('marker not found: ' + cfg.marker);
  if (src[a - 1] !== ';') throw new Error('preamble head must end with ";" (clean statement boundary); got ' + JSON.stringify(src[a - 1]));
  const b = src.indexOf('function ' + cfg.array);
  if (b < 0 || b <= a) throw new Error('tail array fn not found after marker');
  const d = src.indexOf('function ' + cfg.decoder);
  if (d < 0 || d < b) throw new Error('tail decoder fn not found after array fn');
  const end = fnEnd(src, src.indexOf('{', d));
  return src.slice(0, a) + src.slice(b, end);
}

// discover `var X = <known>` re-aliases to a fixpoint (local scoping copies of the decoder)
function discoverAliases(src, cfg) {
  const known = [cfg.alias, cfg.decoder];
  const set = new Set(known);
  let added;
  do {
    added = 0;
    const re = /var\s+([A-Za-z_$][\w$]*)\s*=\s*([A-Za-z_$][\w$]*)\s*[),;}\s]/g;
    let m;
    while ((m = re.exec(src))) {
      if (set.has(m[2]) && m[1] !== m[2] && !set.has(m[1])) {
        set.add(m[1]);
        known.push(m[1]);
        added++;
      }
    }
  } while (added);
  return known;
}

function run(name) {
  const cfg = CONFIGS[name];
  const src = fs.readFileSync(path.join(ROOT, cfg.file), 'utf8');
  console.log(`\n[${name}] source ${src.length} chars`);

  const known = discoverAliases(src, cfg);
  console.log(`[${name}] ${known.length} alias ids (1 primary + 1 decoder + ${known.length - 2} local re-aliases)`);

  const pre = extractPreamble(src, cfg);
  console.log(`[${name}] preamble ${pre.length} chars`);

  const sandbox = {
    Math, parseInt, parseFloat, Number, String, Array, Object, JSON, console,
    TextDecoder, Uint8Array,
  };
  const ctx = vm.createContext(sandbox);
  vm.runInContext(pre, ctx, { filename: cfg.file });

  const fn = ctx[cfg.alias];
  if (typeof fn !== 'function') throw new Error('alias is not a function after preamble eval');
  const arr = ctx[cfg.array]();
  if (!Array.isArray(arr)) throw new Error('array fn did not return the string array');
  console.log(`[${name}] string array N=${arr.length} (post-rotation); sample arr[0]=${JSON.stringify(arr[0] && arr[0].slice(0, 20))}`);

  // collect used call indices (hex-literal 1-arg calls) per alias id
  const used = new Map();
  let twoArgSites = 0;
  for (const id of known) {
    const re = new RegExp(esc(id) + '\\(0x([0-9a-fA-F]+)', 'g');
    const map = new Map();
    let m;
    while ((m = re.exec(src))) {
      const c = parseInt(m[1], 16);
      map.set(c, (map.get(c) || 0) + 1);
    }
    const re2 = new RegExp(esc(id) + '\\(0x[0-9a-fA-F]+,\\s*[\'"]', 'g');
    twoArgSites += (src.match(re2) || []).length;
    if (map.size) used.set(id, map);
  }
  if (twoArgSites) console.log(`[${name}] WARNING: ${twoArgSites} two-arg call sites (2nd arg is unused by the XOR decoder; will decode 1-arg)`);

  // decode every used index through the (post-rotation) alias
  const table = {};
  let distinct = 0, total = 0;
  for (const [id, map] of used) {
    for (const [c, n] of map) {
      total += n;
      if (table[c.toString(16)] === undefined) {
        const s = fn(c);
        if (typeof s !== 'string') throw new Error(`gate3 FAIL: alias ${id} index 0x${c.toString(16)} decoded to ${typeof s} (${s})`);
        table[c.toString(16)] = s;
        distinct++;
      }
    }
  }
  console.log(`[${name}] ${used.size} ids with call sites; ${total} calls; ${distinct} distinct indices decoded`);
  const vals = Object.values(table);
  console.log(`[${name}] sample strings: ` + JSON.stringify(vals.slice(0, 8)));
  for (const tok of cfg.expect) {
    if (!vals.includes(tok)) throw new Error(`gate4 FAIL: expected decoded token ${JSON.stringify(tok)} not found`);
    console.log(`[${name}] gate4 OK: contains ${JSON.stringify(tok)}`);
  }
  fs.writeFileSync(path.join(ROOT, cfg.strings), JSON.stringify(table));

  // replacement: single pass over the ORIGINAL source, longest id first,
  // lookbehind guards against matching a suffix of a longer identifier.
  const ids = [...known].sort((x, y) => y.length - x.length);
  const pat = new RegExp('(?<![A-Za-z0-9_$])(?:' + ids.map(esc).join('|') + ')\\(0x([0-9a-fA-F]+)\\)', 'g');
  let replaced = 0;
  const deobf = src.replace(pat, (whole, hex) => {
    replaced++;
    return JSON.stringify(table[hex.toLowerCase()]);
  });
  console.log(`[${name}] replaced ${replaced} call sites (expected ${total})`);
  if (replaced !== total) throw new Error(`gate2 FAIL: replaced ${replaced} of ${total} call sites`);

  for (const id of known) {
    const left = (deobf.match(new RegExp(esc(id) + '\\(0x', 'g')) || []).length;
    if (left) throw new Error(`gate2 FAIL: ${left} unreplaced call sites remain for ${id}`);
  }
  console.log(`[${name}] gate2 OK: zero remaining alias(0x sites`);

  fs.writeFileSync(path.join(ROOT, cfg.out), deobf);
  console.log(`[${name}] wrote ${cfg.out} (${deobf.length} chars)`);
}

const which = process.argv[2] || 'all';
if (which === 'all') Object.keys(CONFIGS).forEach(run);
else if (CONFIGS[which]) run(which);
else throw new Error('unknown target ' + which + ' (use ruler|caliper|all)');
console.log('\nall gates for requested targets passed');
