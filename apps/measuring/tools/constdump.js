'use strict';
// dump every pure-arithmetic parenthesized expression in a source region,
// evaluated, with offset + short context — to decode obfuscated constants
// without manual hex arithmetic.
const fs = require('fs');
const file = process.argv[2] || 'src/dial_caliper.deobf.js';
const start = parseInt(process.argv[3] || '0', 10);
const end = parseInt(process.argv[4] || '999999', 10);
const src = fs.readFileSync(file, 'utf8');
const f = src.slice(start, end);

// match balanced groups whose content is pure arithmetic / known helpers
const seen = new Map();
let i = 0;
while (i < f.length) {
  if (f[i] !== '(') { i++; continue; }
  // find matching close paren
  let depth = 0, j = i, inStr = null, esc = false;
  for (; j < f.length; j++) {
    const ch = f[j];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
    if (ch === '(') depth++;
    else if (ch === ')') { depth--; if (depth === 0) { j++; break; } }
  }
  if (depth !== 0) break;
  const expr = f.slice(i + 1, j - 1);
  const clean = expr.replace(/\s+/g, '');
  const isArith = /^[0-9a-fA-FxX+\-*/.,()]*$/.test(clean.replace(/\b(parseInt|parseFloat|Number|Math\w*|Math)\b/g, '')) && /0x[0-9a-f]/i.test(clean);
  if (isArith && clean.length > 3 && clean.length < 300) {
    if (!seen.has(clean)) {
      let v; try { v = eval(clean); } catch (e) { v = 'ERR'; }
      seen.set(clean, { off: start + i, v: typeof v === 'number' ? v : v, ctx: f.slice(Math.max(0, i - 26), i) });
    }
  }
  i = j;
}
for (const [e, m] of [...seen.entries()].sort((a, b) => a[1].off - b[1].off)) {
  console.log(String(m.off).padEnd(7), String(m.v).padEnd(10), '|', m.ctx.replace(/\s+/g, ' ').slice(-26), '||', e.length > 70 ? e.slice(0, 70) + '…' : e);
}
console.log('total distinct:', seen.size);
