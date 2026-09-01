// tools/facts-ruler-1.js — R1 globals, R2 auto-length, R3 ruler tick draw (verbatim + node-eval)
// Usage: node tools/facts-ruler-1.js
const fs = require('fs');
const s = fs.readFileSync('src/ruler.deobf.js', 'utf8');
const NL = String.fromCharCode(10);

function skipString(str, k) { const q = str[k]; let j = k + 1; while (j < str.length) { if (str[j] === '\\') j += 2; else if (str[j] === q) { j++; break; } else j++; } return j; }
function matchClose(str, open, o, c) { let d = 0; for (let k = open; k < str.length; k++) { const ch = str[k]; if (ch === '"' || ch === "'") { k = skipString(str, k) - 1; continue; } if (ch === o) d++; else if (ch === c) { d--; if (d === 0) return k; } } return str.length - 1; }
function funcBody(name) { const i = s.indexOf('function ' + name); if (i < 0) return null; const b = s.indexOf('{', i); const e = matchClose(s, b, '{', '}'); return { at: i, body: s.slice(b + 1, e) }; }
function extractToTop(str, i, stops) { let d = 0, k = i; while (k < str.length) { const ch = str[k]; if (ch === '"' || ch === "'") { k = skipString(str, k); continue; } if (ch === '(' || ch === '[' || ch === '{') { d++; k++; continue; } if (ch === ')' || ch === ']' || ch === '}') { d--; if (d < 0) break; k++; continue; } if (d === 0 && stops.includes(ch)) break; k++; } return str.slice(i, k); }
function splitTop(str) { const out = []; let d = 0, cur = '', k = 0; while (k < str.length) { const ch = str[k]; if (ch === '"' || ch === "'") { const j = skipString(str, k); cur += str.slice(k, j); k = j; continue; } if (ch === '(' || ch === '[' || ch === '{') d++; else if (ch === ')' || ch === ']' || ch === '}') d--; if (ch === ',' && d === 0) { out.push(cur); cur = ''; k++; continue; } cur += ch; k++; } if (cur !== '') out.push(cur); return out; }

const G = { Math, parseInt, parseFloat, Number, ZFoehFl_CYGm: 4, ZV_tNKJL: 16, x_ZhSnf$Y: 16, iEAjkx: 0, zF_ANz: 0, qOuBeiiiM$lLesLdMdpXH: 64, JCDGU: 'Fractions', YelZG$LvL_RbL: 'Find', Z$P_ktz: 'Both', TLaOBEdXZcfPSSdwcYBsQRS: 'On', S_UxsjsRTpYwAO: 'On', XBrSDXeJSt_KOdJJQEKWi: 'Sixteenths', ISGCSQjsPXiuEoTGiZiXoR: '', bfS_qCXDmue: { Both: 'Both', On: 'Simplified', Off: 'Unsimplified' }, ryRteHsq$p$nTpyCKHpaD: (x) => ({ 1: 'Wholes', 2: 'Halves', 4: 'Quarters', 8: 'Eighths', 16: 'Sixteenths', 32: 'Thirtysecondths', 64: 'Sixtyfourths' }[x] || String(x)), window: { innerWidth: 1200 } };
function ev(expr, extra) { const sb = Object.assign({}, G, extra || {}); try { const f = new Function('sb', 'with(sb){return (' + expr + ');}'); const v = f(sb); return (typeof v === 'number' && isNaN(v)) ? 'NaN' : v; } catch (e) { return 'ERR:' + e.message; } }
function P(h) { console.log(NL + '## ' + h); }

P('R1 globals (verbatim + eval)');
function globalInit(name) { const i = s.indexOf(name + '='); if (i < 0) { console.log(name + ': NOT FOUND'); return; } const expr = extractToTop(s, i + name.length + 1, ',;'); console.log(' ' + name + ' = ' + expr); console.log('   => ' + JSON.stringify(ev(expr))); }
globalInit('iEAjkx'); globalInit('zF_ANz'); globalInit('qOuBeiiiM$lLesLdMdpXH');
{ const i = s.indexOf('Wf$xJxKoSbtXIvntiDdgh='); console.log(' sessionStorage prefix = ' + JSON.stringify(s.slice(i, i + 30).split(';')[0])); }
for (const v of ['ZFoehFl_CYGm', 'ZV_tNKJL', 'x_ZhSnf$Y']) { const i = s.indexOf('!' + v + '&&('); if (i < 0) { console.log(' default ' + v + ': not found'); continue; } const j = s.indexOf(v + '=', i); const expr = extractToTop(s, j + v.length + 1, ',;'); console.log(' default ' + v + ' = ' + expr); console.log('   => ' + JSON.stringify(ev(expr))); }
{ G.iEAjkx = ev(extractToTop(s, s.indexOf('iEAjkx=') + 'iEAjkx='.length, ',')); G.zF_ANz = ev(extractToTop(s, s.indexOf('zF_ANz=') + 'zF_ANz='.length, ',')); G.qOuBeiiiM$lLesLdMdpXH = ev(extractToTop(s, s.indexOf('qOuBeiiiM$lLesLdMdpXH=') + 'qOuBeiiiM$lLesLdMdpXH='.length, ',')); console.log(' sandbox now: iEAjkx=' + G.iEAjkx + ' zF_ANz=' + G.zF_ANz + ' qOubi=' + G.qOuBeiiiM$lLesLdMdpXH); }

P('R2 dG$vYMAkseXM (auto-fit length)');
{
  const f = funcBody('dG$vYMAkseXM'); console.log('BODY:' + NL + f.body);
  const b = f.body;
  const i1 = b.indexOf('"innerWidth"'); const open1 = b.indexOf('(', i1); const close1 = matchClose(b, open1, '(', ')'); const C1 = b.slice(open1 + 1, close1);
  const open2 = b.indexOf('(', close1); const close2 = matchClose(b, open2, '(', ')'); const C2 = b.slice(open2 + 1, close2);
  const i3 = b.indexOf('h_Ezg$UxrUKs==='); const C3 = extractToTop(b, i3 + 'h_Ezg$UxrUKs==='.length, '&;');
  const i4 = b.indexOf('(h_Ezg$UxrUKs='); const C4 = extractToTop(b, i4 + '(h_Ezg$UxrUKs='.length, ';');
  console.log(' C1 (innerWidth - C1) = ' + C1 + '  => ' + ev(C1));
  console.log(' C2 ( / C2 = px/inch ) = ' + C2 + '  => ' + ev(C2));
  console.log(' C3 (h===C3 ?) = ' + C3 + '  => ' + ev(C3));
  console.log(' C4 (h := C4) = ' + C4 + '  => ' + ev(C4));
  const c1 = ev(C1), c2 = ev(C2), c3 = ev(C3), c4 = ev(C4);
  for (const w of [400, 600, 800, 1024, 1200, 2560]) { let h = Math.floor((w - c1) / c2); const forced = (h === c3); if (h === c3) h = c4; console.log(' innerWidth=' + w + ' => autoLen=' + h + (forced ? ' (0 forced to min)' : '')); }
}

P('R3 AedvQYb_RYzMubSY (rulerCanvas tick draw)');
{
  const f = funcBody('AedvQYb_RYzMubSY'); const b = f.body;
  console.log('BODY:' + NL + b);
  console.log(NL + '-- Cwl_PEUjr_pIOFgumYhM tick table --');
  let pos = b.indexOf('Cwl_PEUjr_pIOFgumYhM[');
  while (pos !== -1) {
    const br = pos + 'Cwl_PEUjr_pIOFgumYhM'.length; const close = matchClose(b, br, '[', ']'); const idx = b.slice(br + 1, close);
    if (/^[A-Za-z_$]/.test(idx)) { console.log(' [loop-usage, idx var=' + idx + ']'); pos = b.indexOf('Cwl_PEUjr_pIOFgumYhM[', pos + 1); continue; }
    const eq = b[close + 1] === '=';
    const val = eq ? extractToTop(b, close + 2, ',;') : '(read, not assign)';
    console.log(' [' + idx + '] = ' + val + '   => idx=' + ev(idx) + (eq ? ' val=' + ev(val) : ''));
    pos = b.indexOf('Cwl_PEUjr_pIOFgumYhM[', pos + 1);
  }
  console.log(NL + '-- loops (verbatim) --');
  { const oi = b.indexOf('for(var owvfxwf'); console.log(' outer: ' + b.slice(oi, oi + 130)); const ii = b.indexOf('for(var FrOGamsx'); console.log(' inner: ' + b.slice(ii, ii + 160)); }
  console.log(NL + '-- FractionReduce call --');
  { const rc = b.indexOf('FractionReduce["reduce"]('); const open = rc + 'FractionReduce["reduce"]'.length; const close = matchClose(b, open, '(', ')');
    const args = splitTop(b.slice(open + 1, close));
    console.log(' arg1 (position) : ' + args[0]);
    console.log(' arg2 (const)    : ' + args[1] + '   => ' + ev(args[1]));
    const bopen = b.indexOf('[', close); const bclose = matchClose(b, bopen, '[', ']');
    const idxExpr = b.slice(bopen + 1, bclose);
    console.log(' result-index expr: ' + idxExpr + '   => ' + ev(idxExpr));
  }
  for (const m of ['strokeRect', 'moveTo', 'lineTo', 'fillText']) {
    console.log(NL + '-- ' + m + ' --');
    const pre = '["' + m + '"]('
    let p = b.indexOf(pre); let n = 0;
    while (p !== -1 && n < 14) {
      const op = p + pre.length - 1; const cl = matchClose(b, op, '(', ')');
      const args = splitTop(b.slice(op + 1, cl));
      console.log(' (' + args.map(a => a.length > 75 ? a.slice(0, 75) + '...' : a).join(' , ') + ')');
      console.log('   => ' + args.map(a => ev(a)).join(' , '));
      p = b.indexOf(pre, p + 1); n++;
    }
  }
  console.log(NL + '-- canvas size/style --');
  for (const key of ['["width"]=', '["height"]=', '["lineWidth"]=', '["font"]=', '["strokeStyle"]=', '["fillStyle"]=', '["textBaseline"]=', '["textAlign"]=']) {
    let p = b.indexOf(key); let n = 0;
    while (p !== -1 && n < 12) { const expr = extractToTop(b, p + key.length, ',;'); console.log(' canvas' + key + ' ' + (expr.length > 130 ? expr.slice(0, 130) + '...' : expr) + '   => ' + JSON.stringify(ev(expr))); p = b.indexOf(key, p + 1); n++; }
  }
  const ca = b.indexOf('VUU_jwjsBwhWZllThCSu_i["style"]["height"]');
  console.log(' canvasArea.height ternary: ' + b.slice(ca - 25, ca + 95));
  const lc = b.indexOf('ZFoehFl_CYGm!==');
  console.log(' info-block condition: ' + b.slice(lc, lc + 85) + '   => RHS=' + ev(extractToTop(b, lc + 'ZFoehFl_CYGm!=='.length, ';')));
}
