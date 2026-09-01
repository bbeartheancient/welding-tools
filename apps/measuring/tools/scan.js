// scan.js — inventory alias call sites + discover var re-aliases (S1 helper)
// usage: node tools/scan.js <file> <aliasId> <decoderId>
const fs = require('fs');
const [file, aliasId, decoderId] = process.argv.slice(2);
const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const s = fs.readFileSync(file, 'utf8');

// discover var X = <known> to fixpoint
const known = new Set([aliasId, decoderId]);
let added;
do {
  added = 0;
  const re = /var\s+([A-Za-z_$][\w$]*)\s*=\s*(?:([A-Za-z_$][\w$]*))\s*[),;}\s]/g;
  let m;
  while ((m = re.exec(s))) {
    const target = m[2];
    if (known.has(target) && m[1] !== target && !known.has(m[1])) {
      known.add(m[1]);
      added++;
      console.log(`realias: var ${m[1]} = ${target}  @ ${m.index}`);
    }
  }
} while (added);
console.log('known ids:', [...known].join(', '));

for (const id of known) {
  const pat = new RegExp(esc(id) + '\\(', 'g');
  let m, n = 0, oneHex = 0, twoArg = 0, other = 0, maxIdx = -1, samples = [];
  while ((m = pat.exec(s))) {
    n++;
    const after = s.slice(m.index + id.length + 1, m.index + id.length + 60);
    const hm = after.match(/^0x([0-9a-fA-F]+)/);
    if (hm) {
      const c = parseInt(hm[1], 16);
      maxIdx = Math.max(maxIdx, c);
      if (samples.length < 6) samples.push('0x' + hm[1]);
      const rest = after.slice(hm[0].length);
      if (/^,\s*['"]/.test(rest)) twoArg++;
      else oneHex++;
    } else {
      other++;
      if (other <= 4) console.log(`  [${id}] non-hex call @${m.index}: (${after.slice(0, 40)}...`);
    }
  }
  console.log(`id=${id} calls=${n} oneArgHex=${oneHex} twoArg=${twoArg} nonHex=${other} maxIdx=${maxIdx} sample=${samples.join(' ')}`);
}
