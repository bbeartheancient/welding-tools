// eval-paint.js — evaluate the obfuscated hex arithmetic in dial_caliper.deobf.js
// paint region (char offsets 59855..67313) against the real built-ins, plus a
// re-verification of the fraction-mode x80 conversion bridge (cr -> guess).
'use strict';
const E = (label, expr) => {
  let v;
  try { v = eval(expr); } catch (e) { v = 'ERR ' + e.message; }
  console.log(`${label} = ${v}`);
  return v;
};
console.log('--- paint preamble / background ---');
E('lineWidth', "parseInt(0x1)*parseInt(0x12f1)+Number(-parseInt(0xd8a))*parseInt(0x1)+-0x566+0.5");
E('fillRect_x', "0x20e2+-0x1c0*Math.max(0x12,0x12)+Math.floor(-parseInt(0x162))");
E('fillRect_y', "-parseInt(0x31)*Math.ceil(parseInt(0x3d))+parseFloat(0x1142)+-0x1*parseInt(0x595)");
E('scale0', "-0x3*0x559+0x1*Math.trunc(parseInt(0x12d7))+-0x2cb");
E('rlmul_64inch', "parseInt(0x11e2)+parseFloat(-0x1a2f)*Math.floor(parseInt(0x1))+Number(-parseInt(0x1))*Number(-0x855)");
E('rlmul_decInch', "-0xb*parseInt(0x18)+-0x409+0x512");
E('imgBase_x', "Math.trunc(-0x1)*Math.ceil(-parseInt(0x26ae))+0xa2*-0x8+-parseInt(0x1a)*parseInt(0x14b)");
E('imgBase_y', "Number(-0x1238)+Math.trunc(-0x1d)*parseFloat(0x11a)+Number(0x322a)");
console.log('--- cm main scale loop ---');
E('cm_x0_off', "parseInt(parseInt(0x3de))+Math.ceil(0x1e23)*parseFloat(0x1)+parseInt(0x3f)*-parseInt(0x8a)");
E('cm_y_off', "-0x1466+parseInt(0x451)+0x1016");
E('ldE_init', "-parseInt(0x138f)+parseInt(0x2154)+Math.ceil(parseInt(0x2f))*parseInt(-parseInt(0x4b))");
E('cm_labelEvery', "0x2ed*-0xb+Math.ceil(-parseInt(0xf93))+parseInt(parseInt(0x2fcc))");
E('cm_loop_start', "0x1579+Math.floor(-parseInt(0xa8b))+-parseInt(0xaee)");
E('cm_mod1(major)', "Number(-0x243a)+0x44*parseInt(0x40)+parseInt(0x1344)");
E('cm_cmp1', "-0x88f*parseInt(parseInt(0x1))+parseInt(0xe77)+parseInt(-0x5e8)");
E('cm_mod2(mid)', "-parseInt(0x5)*0x12+parseInt(parseInt(0x3b7))+parseInt(0x4)*-parseInt(0xd6)");
E('cm_cmp2', "-parseInt(0x10)*Math.floor(-parseInt(0x100))+parseInt(0xbb8)+parseInt(-0x1bb8)");
E('cm_mid_denom', "0x2*parseInt(0x16f)+Math.trunc(0x550)+-0x416*parseInt(0x2)");
E('cm_lab_mod', "-0xa*-0x116+-parseInt(0x20bc)+parseFloat(0x28)*Math.max(parseInt(0x8c),parseInt(0x8c))");
E('cm_lab_valmax', "0xb2+parseFloat(-parseInt(0x180b))*Math.max(-parseInt(0x1),-0x1)+Math.trunc(-parseInt(0x1c4))*parseInt(0xe)");
E('cm_lab1_xoff', "0x1*0x119+parseInt(-parseInt(0x9d1))+0x8bf");
E('cm_lab1_yoff', "-parseInt(0x1)*Math.ceil(-0xc07)+Number(0xa)*Number(-parseInt(0x92))+-parseInt(0x652)");
E('cm_lab1_a3', "Math.floor(0x2513)+parseInt(0x1799)+-0x5*parseInt(0xc22)");
E('cm_lab2_cond(i>)', "Number(0x1aa7)+0x2511+-parseInt(0x2)*0x1fdc");
E('cm_lab2_xoff', "parseInt(0x1b93)+0x1c09+Math.ceil(parseInt(0x3795))*-parseInt(0x1)");
E('cm_lab2_text', "0xaa+0xe*-0x25f+-parseInt(0x2088)*Math.trunc(-parseInt(0x1))");
E('cm_lab2_a3', "-0xaaf*0x3+Number(-0x1cec)+Number(parseInt(0x3cfa))");
E('cm_lab2_a4', "-parseInt(0x20e5)+parseFloat(0x5)*0x138+parseInt(0x1)*parseInt(0x1acf)");
console.log('--- inch main scale setup ---');
E('in_x0_off', "-parseInt(0x1)*-0x1de8+Math.max(parseInt(0x1805),0x1805)+Math.max(parseInt(0x2),0x2)*-0x1af1+0.5");
E('in_y0', "Math.trunc(0x1873)+0x89e*-parseInt(0x3)+-0x167*Math.floor(-parseInt(0x1))");
E('ggZ(labelDivisor)', "Number(0x23d)*-parseInt(0x7)+0x1ae9*-parseInt(0x1)+Math.ceil(-0x886)*-0x5");
console.log('--- inch loop, 64th (fraction) branch ---');
E('i64_loop_start', "-0x251*Math.trunc(parseInt(0xb))+-0x1ad1+parseInt(0xd13)*Number(0x4)");
E('i64_loop_end_mul', "-0x10*parseInt(0xfb)+Number(0xb1e)+parseInt(0x2d)*Math.trunc(0x1a)+0.8");
E('i64_mod(major)', "0xc*-parseInt(0x1e5)+0x1*Math.floor(parseInt(0x944))+parseInt(parseInt(0xd80))");
E('i64_cmp', "parseInt(-0x35f)+-0x232a+-0x2689*Number(-0x1)");
E('i64_lab_mod', "Math.ceil(-parseInt(0x1d28))+parseInt(0x1f75)+parseInt(parseInt(0x53))*Math.max(-parseInt(0x7),-0x7)");
E('i64_lab_cmp', "Math.max(parseInt(0x4b),parseInt(0x4b))*0x73+parseFloat(parseInt(0x1e56))+parseFloat(-0x4007)");
E('i64_lab_xoff', "parseInt(0x122)+-parseInt(0x2611)*parseInt(0x1)+parseInt(-parseInt(0x1))*-0x24f7");
E('i64_lab_yoff', "parseInt(0x2)*parseInt(parseInt(0xf6a))+Math.max(parseInt(0x1a6a),0x1a6a)+parseInt(-0x3932)");
E('i64_lab_denom', "Math.ceil(parseInt(0x6ef))+Math.trunc(parseInt(0x1670))+-parseInt(0x1d57)");
E('i64_lab_a3', "0x429+-parseInt(0x2)*Math.ceil(parseInt(0x350))+parseFloat(parseInt(0x278))");
E('i64_lab_a4', "Math.max(-parseInt(0x110f),-parseInt(0x110f))*-parseInt(0x1)+Math.trunc(parseInt(0x6))*-0x144+-0x974");
E('i64_lab2_cond(i<)', "-parseInt(0x40d)*parseInt(0x1)+-parseInt(0x5b5)+0x9d6");
E('i64_frac_mod', "-0x699+parseInt(-parseInt(0x122c))+parseInt(-parseInt(0x38b))*-0x7");
E('i64_frac_denom', "parseInt(0x220c)+-0x1c49+Number(parseInt(0x5bb))*-0x1");
E('i64_frac_xoff', "-0x81c*Math.floor(-parseInt(0x2))+-parseInt(0x100d)+0x1*Math.max(-0x1f,-parseInt(0x1f))");
E('i64_frac_yoff', "0x78b*0x4+parseInt(0x4)*Math.ceil(-parseInt(0x8d2))+parseInt(-parseInt(0x2))*-parseInt(0x293)");
E('i64_frac_num_idx', "Number(0xf)*-parseInt(0x12c)+parseInt(0x891)+-0x1*Math.floor(-0x903)");
E('i64_frac_den_idx', "-parseInt(0x17b8)+Math.trunc(-0x1)*Math.ceil(0x7cd)+parseInt(0x1f86)");
E('i64_frac_a3', "Math.ceil(0x1597)+Math.max(-parseInt(0x9bf),-parseInt(0x9bf))*Math.ceil(-0x1)+-parseInt(0x1f55)");
E('i64_frac_a4', "0x771+parseInt(0x1)*parseInt(0xe7d)+Math.ceil(-0x15ec)");
console.log('--- inch loop, decimal branch ---');
E('idec_loop_start', "Math.floor(parseInt(0x2))*-parseInt(0x219)+Number(0x36)*Number(-parseInt(0x7b))+parseInt(parseInt(0x1e24))");
E('idec_mod', "Math.trunc(-0x2613)+-parseInt(0x6b)*parseInt(0xd)+-parseInt(0x4)*-0xae3");
E('idec_cmp', "Math.max(0x1c12,parseInt(0x1c12))+-parseInt(0x25)*Math.trunc(0x13)+-0x1953*Math.ceil(parseInt(0x1))");
E('idec_lab_mod', "Math.floor(0x299)+0x61a+Math.ceil(-parseInt(0x3))*parseInt(0x2e3)");
E('idec_lab_cmp', "Math.floor(-parseInt(0x14b8))+-0x256b+parseInt(0x1c3)*Math.max(parseInt(0x21),0x21)");
E('idec_lab_xoff', "Number(-0x1e)*parseInt(0x12b)+-parseInt(0x13)*-parseInt(0x47)+Math.floor(parseInt(0x1dcd))");
E('idec_lab_yoff', "parseInt(0x187c)+-parseInt(0x1ee0)+Math.ceil(-parseInt(0xce))*-parseInt(0x8)");
E('idec_lab_a3', "parseInt(0x1717)+Math.floor(0x3)*Math.trunc(-0x121)+-parseInt(0x13b3)");
E('idec_lab_a4', "0xb9c+-parseInt(0x2c3)*-parseInt(0x2)+-0x111f");
E('idec_lab2_cond(i<)', "-parseInt(0x9e)*-parseInt(0x1)+-parseInt(0x1)*Math.trunc(-0x21c)+parseFloat(-parseInt(0x2))*parseInt(0x144)");
E('idec_lab2_xoff', "-parseInt(0x61f)*Math.trunc(-parseInt(0x1))+Math.floor(-0x8b9)+Math.ceil(-parseInt(0x38))*Number(-0xc)");
E('idec_lab2_yoff', "parseInt(0x16de)+Math.max(-parseInt(0x2d3),-parseInt(0x2d3))*Number(-0x3)+parseFloat(0x3)*-parseInt(0xa6f)");
E('idec_lab2_text_mod', "Number(parseInt(0x1))*-parseInt(0xf51)+Math.trunc(-0x1b04)+parseInt(0x2a5f)*Math.max(parseInt(0x1),0x1)");
E('idec_lab2_a3', "parseInt(-parseInt(0x1))*parseInt(-parseInt(0xde6))+-0x32*parseInt(0xc)+Math.floor(-parseInt(0xb8d))");
console.log('--- x80 bridge re-verification (fraction mode) ---');
for (const Q of [8, 16, 64, 128, 356]) {
  const msr = Math.floor(Q / 64), vsr = Math.round((Q / 64 - msr) * 64);
  const cr = (msr + vsr / 64) * 0.1 * 8;
  const guess = Math.round(cr * 1000) / 1000 * 80;
  console.log(`Q=${Q} msr=${msr} vsr=${vsr} cr=${cr} guess=${guess} ${guess === Q ? 'BRIDGE OK' : '*** MISMATCH ***'}`);
}
let bad = 0;
for (let Q = 1; Q <= 128; Q++) {
  const msr = Math.floor(Q / 64), vsr = Math.round((Q / 64 - msr) * 64);
  const cr = (msr + vsr / 64) * 0.1 * 8;
  if (Math.round(cr * 1000) / 1000 * 80 !== Q) bad++;
}
console.log(`exhaustive Q=1..128: ${bad} mismatches`);
