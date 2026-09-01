// tools/facts-ruler-3.js — find every [ ... ] array literal in the deobf source,
// eval it, and print the MIN / MAX anchors plus each value on its own line.
// Strategy (per user): find min & max first (anchors), then read what's in between.
const fs = require('fs');
const s = fs.readFileSync('src/ruler.deobf.js', 'utf8');

// ---- string-aware bracket matcher ----
function skipString(str, k) {
  const q = str[k]; let j = k + 1;
  while (j < str.length) {
    if (str[j] === '\\') j += 2;
    else if (str[j] === q) { j++; break; }
    else j++;
  }
  return j;
}
function matchBracket(str, open, o, c) {
  let d = 0;
  for (let k = open; k < str.length; k++) {
    const ch = str[k];
    if (ch === '"' || ch === "'") { k = skipString(str, k) - 1; continue; }
    if (ch === o) d++;
    else if (ch === c) { d--; if (d === 0) return k; }
  }
  return str.length - 1;
}

// find all top-level-ish array literals that START a line/segment with '['
// (heuristic: '[' immediately followed by 'parseInt' or 'Math' or a digit or '-')
const out = [];
let i = 0;
while (i < s.length) {
  if (s[i] === '[') {
    const nxt = s.slice(i + 1, i + 12);
    if (/^(parseInt|Math\.|Number|-\d|-\[|0x|\d)/.test(nxt)) {
      const close = matchBracket(s, i, '[', ']');
      const expr = s.slice(i, close + 1);
      if (expr.length < 4000 && !expr.includes('function')) {
        out.push({ at: i, expr });
        i = close + 1;
        continue;
      }
    }
  }
  i++;
}

console.log('Found', out.length, 'candidate array literals.\n');
for (const { at, expr } of out) {
  let vals, err = null;
  try { vals = eval(expr); } catch (e) { err = e.message; }
  console.log('========== @char ' + at + '  (raw len ' + expr.length + ') ==========');
  console.log('RAW   : ' + expr.slice(0, 160) + (expr.length > 160 ? ' ...' : ''));
  if (err) { console.log('EVAL  : ERR ' + err); console.log(); continue; }
  if (!Array.isArray(vals)) { console.log('EVAL  : not an array -> ' + typeof vals + ' ' + JSON.stringify(vals)); console.log(); continue; }
  // numeric analysis
  const nums = vals.filter(v => typeof v === 'number');
  console.log('LEN   : ' + vals.length + '  (numeric: ' + nums.length + ')');
  if (nums.length) {
    console.log('MIN   : ' + Math.min(...nums) + '   MAX : ' + Math.max(...nums) + '   (anchors)');
  }
  // print each element on its own line (index: value)
  for (let k = 0; k < vals.length; k++) {
    const v = vals[k];
    if (typeof v === 'number') console.log('  [' + k + '] = ' + v);
    else console.log('  [' + k + '] = ' + JSON.stringify(v));
  }
  console.log();
}
