'use strict';
// resolve the fraction-mode unit chain by evaluating the exact obfuscated
// arithmetic from btnSubmit / getCorrectedReading / showNewQuestion.
const E = (s) => { try { return eval(s); } catch (e) { return 'ERR ' + e.message; } };

console.log('== btnSubmit (Game/Trainer) ==');
console.log('is64 F1 (x for round)   =', E("parseInt(-parseInt(0x19))+parseInt(-parseInt(0x1c34))+parseInt(0x55)*Math.trunc(0x61)"));
console.log('is64 F2 (/ for round)    =', E("Math.trunc(-parseInt(0x23f0))+parseInt(0x1c5e)*Number(0x1)+parseInt(0x1)*0xb7a"));
console.log('is64 F3 (* scale)        =', E("parseInt(0x85d)*Math.trunc(0x2)+parseInt(0x27)*-parseInt(0xe7)+parseInt(0xd1)*parseInt(0x17)"));
console.log('dec  F4 (x for round)    =', E("Math.trunc(-0x305)*Math.trunc(parseInt(0x1))+0x2201+0x6c5*-parseInt(0x4)"));
console.log('dec  F5 (/ for round)    =', E("Math.ceil(-0x1f)*parseInt(0xfb)+0x15f+Math.trunc(parseInt(0x20ee))"));

console.log('\n== getCorrectedReading ==');
console.log('is64 factor               =', E("parseInt(0x176)*parseFloat(-0x14)+parseInt(0x24ea)+Math.trunc(-0x7aa)"));

console.log('\n== showNewQuestion ==');
console.log('is64 yrDC divisor (FACT2) =', E("-parseInt(0x1f83)+parseInt(0x14d7)+parseInt(0xaec)"));
console.log('is64 wq C1                =', E("parseInt(0x1)*parseFloat(-parseInt(0x12c8))+Number(-parseInt(0x79a))+-0x7*Math.max(-parseInt(0x3ce),-parseInt(0x3ce))"));
console.log('  div 1/8                 =', E("-parseInt(0x113)+-0x175*parseFloat(0x10)+0x186b"));
console.log('  div 1/16                =', E("-parseInt(0x1195)+parseFloat(-parseInt(0xc))*Math.floor(-parseInt(0x253))+Number(-parseInt(0xa3f))"));
console.log('  div 1/32                =', E("-0x4*parseInt(0x141)+parseFloat(parseInt(0x86f))*Number(0x1)+parseFloat(parseInt(0x1))*-parseInt(0x34b)"));
console.log('  div 1/64                =', E("0x7*0xc7+parseInt(0x1857)+Math.ceil(-0x1d88)"));
console.log('is64 X (A1*B1)            =', E("(-parseInt(0x2)*-0xe14+-parseInt(0x20e8)+-parseInt(0x2)*-0x280)*(0x2520+-parseInt(0x3)*-0x13d+-parseInt(0x1)*0x28d5)"));
console.log('  A1                       =', E("-parseInt(0x2)*-0xe14+-parseInt(0x20e8)+-parseInt(0x2)*-0x280"));
console.log('  B1                       =', E("0x2520+-parseInt(0x3)*-0x13d+-parseInt(0x1)*0x28d5"));
console.log('is64 CkR (randInt lo)     =', E("parseInt(-parseInt(0x163))*Math.ceil(-parseInt(0x1c))+parseFloat(parseInt(0x1467))+Math.trunc(-parseInt(0x3b3a))"));

console.log('\n== consistency: does guess come back to Q (64ths)? ==');
// model: showNewQuestion sets msr+vsr/64 = Q/64 (inches). getCorrectedReading
// cr = (msr+vsr/64)*msdValueInch*factor. btnSubmit guess = round(cr*F1)/F2*F3.
const msdInch = 0.1, factor = 8, F1 = 1000, F2 = 1000, F3 = 80;
for (const Q of [8, 16, 64, 128, 356]) {
  const L = Q / 64;                 // physical length in inches
  const cr = L * msdInch * factor;  // (msr+vsr/64)~L ; cr = L*0.1*8
  const guess = Math.round(cr * F1) / F2 * F3;
  console.log(`Q=${Q} (64ths)  L=${L}in  cr=${cr}  guess=${guess}  guess/Q=${(guess/Q).toFixed(4)}`);
}
