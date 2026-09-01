// evalexpr.js — extract and eval the expression starting at the first occurrence of <anchor>
// in <file>; expression ends at the first , or ; seen at paren-depth 0 (strings respected).
// usage: node tools/evalexpr.js <file> <anchor>
const fs = require('fs');
const [file, anchor] = process.argv.slice(2);
const s = fs.readFileSync(file, 'utf8');
const i = s.indexOf(anchor);
if (i < 0) { console.error('anchor not found:', anchor); process.exit(1); }
let start;
if (s[i] === '(') { // anchor is the '(' — start inside
  start = i + 1;
} else {
  const eq = s.indexOf('=', i);
  start = eq + 1;
  while (s[start] === ' ') start++;
}
let depth = 0, inStr = null, esc = false, end = -1;
for (let k = start; k < s.length; k++) {
  const ch = s[k];
  if (inStr) {
    if (esc) esc = false;
    else if (ch === '\\') esc = true;
    else if (ch === inStr) inStr = null;
    continue;
  }
  if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
  if (ch === '(' || ch === '[' || ch === '{') depth++;
  else if (ch === ')' || ch === ']' || ch === '}') depth--;
  else if ((ch === ',' || ch === ';') && depth === 0) { end = k; break; }
  if (depth < 0) { end = k; break; }
}
if (end < 0) { console.error('no terminator found'); process.exit(1); }
const expr = s.slice(start, end);
console.log('EXPR:', expr.slice(0, 400));
try { console.log('VALUE:', eval(expr)); } catch (e) { console.error('EVAL FAILED:', e.message); process.exit(1); }
