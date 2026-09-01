'use strict';
// eval-digits.js — evaluate the integer toFixed-digit expressions from checkGuess
// (pure arithmetic; realm-independent, so no vm prototype issues).
// Prints the exact digit counts each branch uses for guess vs question.
const E = (s) => eval(s);

const cases = {
  'TYPE guess      ': "Math.max(-parseInt(0x1f96),-0x1f96)+parseInt(0x1)*-0x296+parseInt(0x222f)",
  'TYPE question   ': "-parseInt(0x7)*Math.floor(0x1c1)+Number(-parseInt(0x190e))+0x2558",
  'LOG  guess      ': "parseInt(0x178d)+-0x3f1+Math.ceil(parseInt(0x1399))*Math.max(-0x1,-0x1)",
  'LOG  question   ': "0x7*0x1d6+-parseInt(0xe97)+Math.floor(parseInt(0x1c0))",
  'FIND guess      ': "Math.trunc(-parseInt(0x15c3))*parseInt(0x1)+parseInt(0xd5)*parseInt(0x2d)+0x15*Math.ceil(-0xbf)",
  'FIND question   ': "Math.floor(-0x1818)+Math.max(parseInt(0xc88),0xc88)+Math.ceil(parseInt(0x1))*0xb93",
  'MM   factor x   ': "parseInt(0x2324)+Math.max(parseInt(0x8d3),0x8d3)+parseInt(0x8c9)*-0x5",
  'MM   guess      ': "parseInt(0x3)*Math.trunc(-parseInt(0x423))+parseInt(0x2)*Math.ceil(-parseInt(0x8c9))+0x1*parseInt(0x1dfd)",
  'MM   question   ': "parseInt(0x12c3)+Math.ceil(-0x36)*Math.trunc(0x2f)+Math.floor(-0x8d7)",
  'IN64 guess      ': "Math.floor(-0x2f)*-parseInt(0x62)+Math.floor(0x2568)+-parseInt(0x3766)",
  'IN64 question   ': "Math.trunc(-parseInt(0x2))*-0x82b+-0x26e8+0x1692",
  'STRIKE arg      ': "Math.ceil(0xcfb)+Math.floor(-parseInt(0x1717))+parseFloat(parseInt(0x4))*parseInt(0x287)",
  'LC   incr (Type)': "parseInt(0x4c1)+0x1e54*-0x1+-0xcca*-0x2",
  'LC   incr (Game)': "parseInt(-0x45f)*Math.floor(parseInt(0x1))+-parseInt(0x62f)+Math.trunc(parseInt(0xa8f))",
};
for (const [k, v] of Object.entries(cases)) {
  let r; try { r = E(v); } catch (e) { r = 'ERR ' + e.message; }
  console.log(k + ' = ' + r);
}
