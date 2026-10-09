/* Check completeness of the visible report against the canonical transcription. */
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/survey.json'),'utf8'));
const context=vm.createContext({});
for(const name of ['insights','report'])vm.runInContext(fs.readFileSync(path.join(root,`assets/js/${name}.js`),'utf8'),context);
const report=context.SURVEY_REPORT.build(data,context.SURVEY_INSIGHTS);
const template=fs.readFileSync(path.join(root,'index.html'),'utf8');
const markup=template+Object.values(report).join('');
const decode=s=>s.replace(/&(amp|lt|gt|quot|#39);/g,(_,k)=>({amp:'&',lt:'<',gt:'>',quot:'"','#39':"'"}[k]));
const records=[...report.records.matchAll(/data-record="([^"]+)"/g)].map(m=>m[1]);
const breakdowns=[...report.appendix.matchAll(/data-breakdown="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(records).size,91);
assert.deepEqual([...records].sort(),data.records.map(r=>r.id).sort());
assert.deepEqual(breakdowns,data.records.map(r=>r.id));
assert.equal([...report.matrices.matchAll(/class="matrix-card"/g)].length,4);
assert.equal([...report.matrices.matchAll(/class="matrix-cell /g)].length,128);
const cells=new Map();
for(const m of report.appendix.matchAll(/data-source-cell="([^"]+)" data-published-value="([^"]+)"/g)){
  assert(!cells.has(m[1]),`Duplicate cell ${m[1]}`);
  cells.set(m[1],decode(m[2]));
}
let expected=0;
for(const r of data.records){
  for(const [ri,row] of r.rows.entries())for(const [ci,raw] of row.raw.entries()){
    assert.equal(cells.get(`${r.id}:${ri}:${ci}`),raw,`Published token ${r.id}:${ri}:${ci}`);
    expected++;
  }
  const start=report.records.indexOf(`id="q-${r.id}"`);
  const end=report.records.indexOf('</article>',start);
  const card=report.records.slice(start,end);
  assert(card.includes('class="chart-reading"'),`Missing reading: ${r.id}`);
  assert(card.includes('class="bar-plot"'),`Missing chart: ${r.id}`);
  if(r.publication==='generations')assert(card.includes('<strong>Not published</strong>'),'Do not borrow a generational base');
}
assert.equal(expected,16749);
assert.equal(cells.size,expected);
assert(!/<(?:select|input|aside|details)\b/i.test(markup),'No selectors, split sidebar or collapsed sections');
assert(!/\shidden(?:\s|>|=)/i.test(markup),'No hidden data sections');
assert(template.includes('Developed by YIN Renlong · 2026'));
const ids=[...markup.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(ids.length,new Set(ids).size,'Every anchor must be unique');
const idSet=new Set(ids);
for(const m of markup.matchAll(/href="#([^"]+)"/g))assert(idSet.has(m[1]),`Broken internal link #${m[1]}`);
assert(report.wording.includes('47% incompatible, 41% compatible, 12% don\'t know'));
assert(report.wording.includes('57% incompatible, 30% compatible, 13% don\'t know'));
console.log(`PASS: 91 visible record charts, 4 matrices / 128 cells, 91 group tables, all ${expected.toLocaleString('en-GB')} exact source tokens, unique working anchors, and no selection controls.`);
