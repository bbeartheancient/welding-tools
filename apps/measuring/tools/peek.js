// peek.js — windowed inspector for one-line minified files (S1+ helper)
// usage:
//   node tools/peek.js <file> <start> <len>            print bytes [start, start+len)
//   node tools/peek.js <file> <start> fn               brace-match the function starting at/after <start>
//   node tools/peek.js <file> <start> call             a = "(function" offset; prints body+call extents of that IIFE
//   node tools/peek.js <file> <start> paren            a = an opening "(" offset; prints its matched extent
//   node tools/peek.js <file> fnlist                   list "function <name>("/"var <name>=" with offsets
const fs = require('fs');
const [file, a, b] = process.argv.slice(2);
const src = fs.readFileSync(file, 'utf8');

function fnEnd(s, openIdx) {
  let depth = 0, inStr = null, esc = false;
  for (let i = openIdx; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
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
  let depth = 0, inStr = null, esc = false;
  for (let i = openIdx; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
    if (ch === '(') depth++;
    else if (ch === ')') { depth--; if (depth === 0) return i + 1; }
  }
  throw new Error('unbalanced parens from offset ' + openIdx);
}

if (b === 'fn') {
  const start = parseInt(a, 10);
  const open = src.indexOf('{', start);
  const end = fnEnd(src, open);
  const sliceEnd = Math.min(end, open + 4000);
  console.log(`FN: ${start}..${end} (len ${end - start}); showing ${start}..${sliceEnd}`);
  console.log(src.slice(start, sliceEnd));
  if (end > sliceEnd) console.log(`... [truncated, ${end - sliceEnd} more chars; re-run with start=${sliceEnd} if needed]`);
} else if (b === 'call') {
  const iife = parseInt(a, 10);
  const bodyOpen = src.indexOf('{', iife);
  const bodyEnd = fnEnd(src, bodyOpen);
  if (src[bodyEnd] !== '(') console.log('no call paren after body (char:', JSON.stringify(src[bodyEnd]), ')');
  const callEnd = parenEnd(src, bodyEnd);
  console.log(`IIFE: open=${iife} body=${bodyOpen}..${bodyEnd} callEnd=${callEnd}`);
  console.log('around callEnd:', JSON.stringify(src.slice(callEnd - 6, callEnd + 10)));
} else if (b === 'paren') {
  const open = parseInt(a, 10);
  const end = parenEnd(src, open);
  console.log(`PAREN: ${open}..${end}`);
  console.log('before close:', JSON.stringify(src.slice(end - 40, end + 40)));
} else if (b === 'fnlist') {
  const re = /function\s+([A-Za-z_$][\w$]*)\s*\(|var\s+([A-Za-z_$][\w$]*)\s*=/g;
  let m, n = 0;
  while ((m = re.exec(src)) && n < 400) {
    const name = m[1] || m[2];
    console.log(m.index, m[1] ? 'function' : 'var', name);
    n++;
  }
} else {
  const start = parseInt(a, 10);
  const len = parseInt(b, 10);
  console.log(src.slice(start, start + len));
}
