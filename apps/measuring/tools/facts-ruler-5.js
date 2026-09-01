// tools/facts-ruler-5.js — constant folder: per 0x-seed find the maximal pure-constant
// extent (leftmost parse success = MIN, its parse end = MAX), eval what's between, replace.
const fs = require('fs');
const s = fs.readFileSync('src/ruler.deobf.js', 'utf8');
const W = fs.createWriteStream('/tmp/opencode/ruler-folded.txt', { flags: 'w' });
const isId = c => /[A-Za-z0-9_$]/.test(c || '');
const isOpEnd = c => /[0-9A-Za-z_$)\]"'`]/.test(c || '');
const HARD = ';{}=,|!<>?:[]"\x27`';
const CALLS = [
  ['Math.pow', 2, 2, a => Math.pow(a[0], a[1])],
  ['Math.max', 1, 4, a => Math.max(...a)],
  ['Math.min', 1, 4, a => Math.min(...a)],
  ['Math.ceil', 1, 1, a => Math.ceil(a[0])],
  ['Math.floor', 1, 1, a => Math.floor(a[0])],
  ['Math.trunc', 1, 1, a => Math.trunc(a[0])],
  ['Math.round', 1, 1, a => Math.round(a[0])],
  ['Math.abs', 1, 1, a => Math.abs(a[0])],
  ['parseInt', 1, 2, a => parseInt(a[0], a[1] || 10)],
  ['parseFloat', 1, 1, a => parseFloat(a[0])],
  ['Number', 1, 1, a => Number(a[0])],
];

// discover function definitions (both forms)
const defs = new Map();
let m;
const reDecl = /function\s+([A-Za-z0-9_$]+)/g;
while ((m = reDecl.exec(s))) if (!defs.has(m[1])) defs.set(m[1], { form: 'decl', at: m.index });
const reVar = /([A-Za-z0-9_$]+)\s*=\s*function/g;
while ((m = reVar.exec(s))) if (!defs.has(m[1])) defs.set(m[1], { form: 'var', at: m.index });
function resolve(pref) {
  if (defs.has(pref)) return { name: pref, ...defs.get(pref) };
  const hits = [...defs.keys()].filter(k => k.startsWith(pref));
  if (hits.length === 1) return { name: hits[0], ...defs.get(hits[0]) };
  return null;
}
function skipStr(str, k) { const q = str[k]; let j = k + 1; while (j < str.length) { if (str[j] === '\\') j += 2; else if (str[j] === q) { j++; break; } else j++; } return j; }
function matchBrace(str, open) { let d = 0; for (let k = open; k < str.length; k++) { const ch = str[k]; if (ch === '"' || ch === "'" || ch === '`') { k = skipStr(str, k) - 1; continue; } if (ch === '{') d++; else if (ch === '}') { d--; if (d === 0) return k; } } return str.length - 1; }
function bodyOf(def) { const i = s.indexOf('{', def.at); if (i < 0) return null; return { at: def.at, body: s.slice(i + 1, matchBrace(s, i)) }; }

// per-string analysis
function analyze(body) {
  const n = body.length, inStr = new Uint8Array(n), strEnd = new Int32Array(n).fill(-1);
  for (let k = 0; k < n; k++) {
    const c = body[k];
    if (c === '"' || c === "'" || c === '`') {
      const q = c; let j = k + 1;
      while (j < n) { if (body[j] === '\\') j += 2; else if (body[j] === q) { j++; break; } else j++; }
      if (j > n) j = n;
      for (let t = k; t < j; t++) { inStr[t] = 1; strEnd[t] = j; }
      k = j;
    }
  }
  const lvl = new Int32Array(n);
  let d = 0;
  for (let i = 0; i < n; i++) { lvl[i] = d; if (!inStr[i]) { if (body[i] === '(') d++; else if (body[i] === ')') d--; } }
  const matchParen = open => { let dd = 0; for (let k = open; k < n; k++) { if (inStr[k]) { k = strEnd[k] - 1; continue; } if (body[k] === '(') dd++; else if (body[k] === ")") { dd--; if (!dd) return k; } } return -1; };
  const atom = (p, base) => {
    let q = p, sig = 1;
    if (body[p] === '+' || body[p] === '-') { if (p > 0 && isOpEnd(body[p - 1])) return null; if (body[p] === '-') sig = -1; q = p + 1; }
    const c = body[q];
    if (inStr[q]) return null;
    if (c === '0' && (body[q + 1] === 'x' || body[q + 1] === 'X')) {
      let e = q + 2; while (e < n && /[0-9a-fA-F]/.test(body[e])) e++;
      if (e <= q + 2) return null;
      return { end: e, value: sig * parseInt(body.slice(q + 2, e), 16) };
    }
    if (c >= '0' && c <= '9') {
      let e = q; while (e < n && body[e] >= '0' && body[e] <= '9') e++;
      if (body[e] === '.' && e + 1 < n && body[e + 1] >= '0' && body[e + 1] <= '9') { e++; while (e < n && body[e] >= '0' && body[e] <= '9') e++; return { end: e, value: sig * parseFloat(body.slice(q, e)) }; }
      if (body[e] === '.') return null;
      return { end: e, value: sig * parseInt(body.slice(q, e), 10) };
    }
    if (c === '(') {
      if (q > 0 && isId(body[q - 1])) return null;
      const close = matchParen(q); if (close < 0) return null;
      const r = parse(q + 1, base + 1, close); if (!r) return null;
      return { end: close + 1, value: sig * r.value };
    }
    for (const [name, amin, amax, fn] of CALLS) {
      if (!body.startsWith(name, q) || body[q + name.length] !== '(') continue;
      if (q > 0 && isId(body[q - 1])) return null;
      const open = q + name.length, close = matchParen(open); if (close < 0) return null;
      const args = []; let dd = 0, st = open + 1;
      for (let e = open + 1; e < close; e++) {
        if (inStr[e]) { e = strEnd[e] - 1; continue; }
        const ch = body[e];
        if (ch === '(' || ch === '[' || ch === '{') dd++;
        else if (ch === ')' || ch === ']' || ch === '}') dd--;
        else if (ch === ',' && dd === 0) { args.push([st, e]); st = e + 1; }
      }
      args.push([st, close]);
      if (args[0][0] === args[0][1]) args.shift();
      if (args.length < amin || args.length > amax) return null;
      const vals = [];
      for (const [a0, a1] of args) { const r = parse(a0, base + 1, a1); if (!r) return null; vals.push(r.value); }
      return { end: close + 1, value: sig * fn(vals) };
    }
    return null;
  };
  const term = (p, base) => {
    let p2 = p, acc = 0, first = true, op = '*';
    for (;;) {
      const f = atom(p2, base); if (!f) return null;
      acc = first ? f.value : (op === '*' ? acc * f.value : acc / f.value); first = false; p2 = f.end;
      if ((body[p2] === '*' || body[p2] === '/') && lvl[p2] === base) { op = body[p2]; p2++; continue; }
      break;
    }
    return { end: p2, value: acc };
  };
  const parseSum = (p, base) => {
    let p2 = p, acc = 0, first = true, op = '+';
    for (;;) {
      const t = term(p2, base); if (!t) return null;
      acc = first ? t.value : (op === '+' ? acc + t.value : acc - t.value); first = false; p2 = t.end;
      if ((body[p2] === '+' || body[p2] === '-') && lvl[p2] === base) { op = body[p2]; p2++; continue; }
      break;
    }
    return { end: p2, value: acc };
  };
  const parse = (p, base, hardEnd, mode) => {
    let r;
    if (mode === 'mul') {
      let p2 = p, acc = 0, first = true, op = '*';
      for (;;) {
        const f = atom(p2, base); if (!f) return null;
        acc = first ? f.value : (op === '*' ? acc * f.value : acc / f.value); first = false; p2 = f.end;
        if ((body[p2] === '*' || body[p2] === '/') && lvl[p2] === base) { op = body[p2]; p2++; continue; }
        break;
      }
      r = { end: p2, value: acc };
    } else {
      r = parseSum(p, base);
    }
    if (!r) return null;
    if (hardEnd !== undefined && r.end !== hardEnd) return null;
    if (!isFinite(r.value)) return null;
    return r;
  };
  return { n, inStr, strEnd, lvl, parse };
}

function fold(body) {
  let cur = body, changed = 1, passes = 0;
  while (changed && passes < 4) {
    passes++;
    const { n, inStr, lvl, parse } = analyze(cur);
    const extents = [];
    for (let i = 0; i + 1 < n; i++) {
      if (inStr[i] || cur[i] !== '0' || (cur[i + 1] !== 'x' && cur[i + 1] !== 'X')) continue;
      if (i > 0 && isId(cur[i - 1])) continue;
      let best = null;
      for (let L = i; L >= 0 && L > i - 500; L--) {
        if (inStr[L] || HARD.includes(cur[L])) break;
        if (L > 0 && isOpEnd(cur[L - 1])) continue;
        const ctx = L > 0 ? cur[L - 1] : '';
        const r = parse(L, lvl[L], undefined, ctx === '*' || ctx === '/' || ctx === '%' ? 'mul' : 'sum');
        if (r && r.end > i) best = { L, end: r.end, value: r.value };
      }
      if (best) extents.push(best);
    }
    extents.sort((a, b) => a.L - b.L);
    const keep = [];
    for (const e of extents) {
      if (keep.length && e.L < keep[keep.length - 1].end) continue;
      keep.push(e);
    }
    changed = keep.length;
    for (let k = keep.length - 1; k >= 0; k--) {
      const e = keep[k];
      if (keep[k + 1] && e.end > keep[k + 1].L) continue;
      cur = cur.slice(0, e.L) + String(e.value) + cur.slice(e.end + 1);
    }
  }
  const A2 = analyze(cur);
  let out = '';
  for (let i = 0; i < cur.length; i++) {
    out += cur[i];
    if (!A2.inStr[i] && (';,{}'.includes(cur[i]))) out += '\n';
  }
  W.write('// size ' + body.length + ' -> ' + cur.length + '\n');
  return out;
}

const targets = process.argv.slice(2);
if (!targets.length) {
  const rows = [...defs.entries()];
  rows.sort((a, b) => a[1].at - b[1].at);
  for (const [name, d] of rows) {
    const bi = s.indexOf('{', d.at);
    const len = bi >= 0 ? matchBrace(s, bi) - bi : -1;
    console.log(String(d.at).padStart(7), d.form, String(len).padStart(6), name);
  }
  process.exit(0);
}
for (const pref of targets) {
  if (pref.startsWith('R:')) {
    const parts = pref.split(':');
    const a = +parts[1], b = +parts[2];
    W.write(`\n########## REGION char ${a}..${b}\n`);
    W.write(fold(s.slice(a, b)));
    continue;
  }
  const def = resolve(pref);
  if (!def) { W.write(`\n########## ${pref} : NOT FOUND\n`); continue; }
  const b = bodyOf(def);
  if (!b) { W.write(`\n########## ${pref} : NO BODY\n`); continue; }
  W.write(`\n########## ${def.name}  (char ${b.at}, len ${b.body.length})\n`);
  W.write(fold(b.body));
}
W.end();
