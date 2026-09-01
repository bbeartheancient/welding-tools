// strhits.js — find quoted-string occurrences in a one-line minified file with byte offsets
// usage: node tools/strhits.js <file> <needle> [<needle2> ...]
// prints every occurrence of "<needle>" (as it appears in source) with ±ctx context
const fs = require('fs');
const [file, ...needles] = process.argv.slice(2);
const src = fs.readFileSync(file, 'utf8');
const ctx = 110;
for (const needle of needles) {
  const hay = JSON.stringify(needle); // exact quoted form, e.g. "stgTimer"
  let i = -1, n = 0;
  console.log(`== "${needle}" ==`);
  while ((i = src.indexOf(hay, i + 1)) !== -1 && n < 40) {
    n++;
    console.log(`  @${i}: ...${src.slice(Math.max(0, i - ctx), i + hay.length + ctx).replace(/\n/g, '⏎')}...`);
  }
  if (n === 0) console.log('  (none)');
}
