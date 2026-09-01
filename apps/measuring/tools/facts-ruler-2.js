// tools/facts-ruler-2.js — dump core game-logic bodies + eval key globals
// Usage: node tools/facts-ruler-2.js
const fs = require('fs');
const s = fs.readFileSync('src/ruler.deobf.js', 'utf8');
const NL = String.fromCharCode(10);

function skipString(str, k) { const q = str[k]; let j = k + 1; while (j < str.length) { if (str[j] === '\\') j += 2; else if (str[j] === q) { j++; break; } else j++; } return j; }
function matchClose(str, open, o, c) { let d = 0; for (let k = open; k < str.length; k++) { const ch = str[k]; if (ch === '"' || ch === "'") { k = skipString(str, k) - 1; continue; } if (ch === o) d++; else if (ch === c) { d--; if (d === 0) return k; } } return str.length - 1; }
function funcBody(name) { const i = s.indexOf('function ' + name); if (i < 0) return null; const b = s.indexOf('{', i); const e = matchClose(s, b, '{', '}'); return { at: i, body: s.slice(b + 1, e) }; }
function varBody(name) { const i = s.indexOf(name + '=function'); if (i < 0) return null; const b = s.indexOf('{', i); const e = matchClose(s, b, '{', '}'); return { at: i, body: s.slice(b + 1, e) }; }

// known numeric globals (from R1 + HTML)
const G = { Math, parseInt, parseFloat, Number,
  ZFoehFl_CYGm: 4, ZV_tNKJL: 16, x_ZhSnf$Y: 16, iEAjkx: 30, zF_ANz: 30, qOuBeiiiM$lLesLdMdpXH: 64,
  JCDGU: 'Fractions', YelZG$LvL_RbL: 'Find', Z$P_ktz: 'Both',
  TLaOBEdXZcfPSSdwcYBsQRS: 'On', S_UxsjsRTpYwAO: 'On',
  ryRteHsq$p$nTpyCKHpaD: (x) => ({ 1: 'Wholes', 2: 'Halves', 4: 'Quarters', 8: 'Eighths', 16: 'Sixteenths', 32: 'Thirtysecondths', 64: 'Sixtyfourths' }[x] || String(x)),
  bfS_qCXDmue: { Both: 'Both', On: 'Simplified', Off: 'Unsimplified' },
};
function ev(expr) { const f = new Function('sb', 'with(sb){return (' + expr + ');}'); try { const v = f(G); return (typeof v === 'number' && isNaN(v)) ? 'NaN' : v; } catch (e) { return 'ERR:' + e.message; } }

const targets = [
  ['c_jSQIrNC', varBody],            // guess from typed input
  ['I$hcpxklfBUSvixWHreFzoevap', funcBody], // processAnswer (acceptance + scoring)
  ['sNxLk$MNBtFBSLXkg', funcBody],   // canvas click (Find) -> guess
  ['aSESJbjLTOcukKrIexHEUWAOS', funcBody], // keydown
  ['PcHNyNEtZfOzIUyIowzeLq', funcBody], // question list builder
  ['UOj__ki', funcBody],             // timer restart
  ['YpA_V$U', funcBody],
  ['ahnf_N', funcBody],
  ['AwFc$BUXV_qYwXBiizpozANr', funcBody], // newGame / start
  ['rajpRbkdBgGCNBsR$OGI', funcBody], // settings-change reset
  ['rgSbK$KbHlVGkMRBh', funcBody],   // guess string builder
];
for (const [name, fn] of targets) {
  const f = fn(name);
  if (!f) { console.log(NL + '########## ' + name + ' : NOT FOUND'); continue; }
  console.log(NL + '########## ' + name + '  (char ' + f.at + ', len ' + f.body.length + ')');
  console.log(f.body);
}
