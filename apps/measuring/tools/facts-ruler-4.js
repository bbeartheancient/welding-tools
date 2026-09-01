// tools/facts-ruler-4.js — decode the tick-height table: Cwl_...[idx]=val
const fs = require('fs');
const s = fs.readFileSync('src/ruler.deobf.js', 'utf8');
function skipString(str,k){const q=str[k];let j=k+1;while(j<str.length){if(str[j]==='\\')j+=2;else if(str[j]===q){j++;break;}else j++;}return j;}
function matchBracket(str,open,o,c){let d=0;for(let k=open;k<str.length;k++){const ch=str[k];if(ch==='"'||ch==="'"){k=skipString(str,k)-1;continue;}if(ch===o)d++;else if(ch===c){d--;if(d===0)return k;}}return str.length-1;}
function ev(expr){try{const f=new Function('return ('+expr+');');const v=f();return (typeof v==='number'&&isNaN(v))?'NaN':v;}catch(e){return 'ERR:'+e.message;}}

const NAME='Cwl_PEUjr_pIOFgumYhM';
let i=0, rows=[];
while(true){
  const at=s.indexOf(NAME+'[', i);
  if(at<0) break;
  const open=at+NAME.length;            // position of '['
  const close=matchBracket(s,open,'[',']');
  const idxExpr=s.slice(open+1,close);
  // after ']' expect '='
  const eq=s.indexOf('=',close+1);
  if(eq-close>2){ i=at+1; continue; }    // not an assignment
  // value runs from eq+1 to next top-level ',' or ';' (depth 0)
  let d=0, end=-1;
  for(let k=eq+1;k<s.length;k++){
    const ch=s[k];
    if(ch==='"'||ch==="'"){k=skipString(s,k)-1;continue;}
    if(ch==='['||ch==='('||ch==='{')d++;
    else if(ch===']'||ch===')'||ch==='}'){d--;if(d<0)break;}
    else if(d===0&&(ch===','||ch===';')){end=k;break;}
  }
  if(end<0)end=s.length;
  const valExpr=s.slice(eq+1,end);
  const idx=ev(idxExpr), val=ev(valExpr);
  rows.push({at, idx, val});
  i=end;
}
console.log('Cwl_ tick-height table  (index=precision, value=height):');
console.log('  MIN height = '+Math.min(...rows.map(r=>typeof r.val==='number'?r.val:NaN))
            +'   MAX height = '+Math.max(...rows.map(r=>typeof r.val==='number'?r.val:NaN))+'   (anchors)');
for(const r of rows){
  console.log('  ['+String(r.idx).padStart(2)+'] (char '+r.at+') = '+r.val);
}
console.log('\nSorted by height (anchors -> middle):');
rows.filter(r=>typeof r.val==='number').sort((a,b)=>b.val-a.val).forEach(r=>console.log('  prec '+String(r.idx).padEnd(4)+' -> height '+r.val));
