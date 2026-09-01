// evaleval.js — eval obfuscated constant sub-expressions in the ruler deobf file (S3 helper)
const fs = require('fs');
const s = fs.readFileSync('src/ruler.deobf.js', 'utf8');
function parenEnd(i0) {
  let d = 0, ins = null, esc = false;
  for (let k = i0; k < s.length; k++) {
    const c = s[k];
    if (ins) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === ins) ins = null; continue; }
    if (c === '"' || c === "'" || c === '`') { ins = c; continue; }
    if (c === '(') d++; else if (c === ')') { d--; if (!d) return k + 1; }
  }
  throw new Error('unbalanced from ' + i0);
}
function topSplit(expr, sep) {
  let d = 0, ins = null, esc = false, out = [], st = 0;
  for (let k = 0; k < expr.length; k++) {
    const c = expr[k];
    if (ins) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === ins) ins = null; continue; }
    if (c === '"' || c === "'" || c === '`') { ins = c; continue; }
    if (c === '(') d++; else if (c === ')') d--;
    else if (d === 0 && expr.startsWith(sep, k)) { out.push(expr.slice(st, k)); st = k + sep.length; }
  }
  out.push(expr.slice(st));
  return out;
}
let i = s.indexOf('while(MxfVPqSQ'); let op = s.indexOf('(', i); let e = parenEnd(op);
for (const c of topSplit(s.slice(op + 1, e - 1), '||')) {
  let j = c.lastIndexOf('!==');
  let op = '!==';
  if (j < 0) { j = c.lastIndexOf('==='); op = '==='; }
  const left = c.slice(0, j).trim();
  const right = c.slice(j + 3).trim();
  const isVar = /^[A-Za-z_$][\w$]*$/.test(right);
  console.log('WHILE test: ' + left + ' ' + op + (isVar ? ' <runtime var ' + right + '>' : ' const ' + eval(right)));
}
// index = round(random()*(MAX - A) + B), MAX = runtime ZFoehFl_CYGm*64
let i2 = s.indexOf('ByQD_KOGImWVkSSxrYswYB-(', s.indexOf('function M$rmeEYguMehncw_uniqncs'));
let pA = s.indexOf('(', i2);
let eA = parenEnd(pA);
let A = s.slice(pA + 1, eA - 1);
let pB = s.indexOf('(', eA); // the '(' that opens B
// B runs from that '(' to the '(' matching... it is '(expr)' at the end; find matching close of pB
let eB = parenEnd(pB);
let B = s.slice(pB + 1, eB - 1);
console.log('RANGE: index = round(random()*(MAX - A) + B);  A =', eval(A), ' B =', eval(B));
console.log('   => index in [' + eval(B) + ', MAX - ' + eval(A) + ' + ' + eval(B) + '] where MAX = len*64');
let i3 = s.indexOf('iNbeWMJgxK===', s.indexOf('function M$rmeEYguMehncw_uniqncs'));
let j3 = s.indexOf('&&(Rr_dTqKQHoYWVGw_pP', i3);
console.log('LEVELUP counter ===', eval(s.slice(i3, j3).replace(/^[^=]*?===/, '')));
let i5 = s.indexOf('jGGxGFUVfWLls(Rr_dTqKQHoYWVGw_pP,'); let j5 = s.indexOf('));', i5);
console.log('CHEER duration(ms) =', eval(s.slice(i5 + 'jGGxGFUVfWLls(Rr_dTqKQHoYWVGw_pP,'.length, j5)));
// setTimeout(expr) timings within named functions
function parenEndIn(seg, openIdx) {
  let d = 0, ins = null, esc = false;
  for (let k = openIdx; k < seg.length; k++) {
    const c = seg[k];
    if (ins) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === ins) ins = null; continue; }
    if (c === '"' || c === "'" || c === '`') { ins = c; continue; }
    if (c === '(') d++; else if (c === ')') { d--; if (!d) return k + 1; }
  }
  throw new Error('unbalanced');
}
function timeouts(fnName, span, label) {
  let k = s.indexOf('function ' + fnName);
  if (k < 0) { console.log(label, '(fn not found)'); return; }
  let seg = s.slice(k, k + span);
  let p = 0;
  while ((p = seg.indexOf('setTimeout(', p)) !== -1) {
    let open = p + 'setTimeout('.length;
    let close = parenEndIn(seg, open - 1);
    let args = topSplit(seg.slice(open, close - 1), ',');
    try { console.log(label, 'setTimeout(' + args[0].trim().slice(0, 30) + ') =>', eval(args[1]), 'ms'); }
    catch (err) { console.log(label, 'setTimeout(' + args[0].trim().slice(0, 30) + ') EVAL-ERR'); }
    p = close;
  }
}
timeouts('RG_usJZbuYLOf', 2200, 'STRIKE');
timeouts('mKZGuvSeAZfyfTzeqhTCk', 4000, 'HIDESTRIKE');
timeouts('gMHPMJkaHBWeBU$yMmK', 3000, 'GAMEOVER');
timeouts('uMnXVdtze$UFzA', 3000, 'UFUNCTION');
timeouts('sKvEqDqjhUmjfOtYjjixhofkf', 5000, 'SKVEQ');
