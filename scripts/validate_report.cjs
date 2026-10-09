/* Check visual findings and completeness of the optional source archive against the canonical transcription. */
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/survey.json'),'utf8'));
const context=vm.createContext({});
for(const name of ['insights','report','visuals'])vm.runInContext(fs.readFileSync(path.join(root,`assets/js/${name}.js`),'utf8'),context);
const report=context.SURVEY_REPORT.build(data,context.SURVEY_INSIGHTS);
const findings=context.SURVEY_VISUALS.build(data);
const template=fs.readFileSync(path.join(root,'index.html'),'utf8');
const markup=template+report.records+report.appendix+findings.html+findings.toc;
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
  const next=report.records.indexOf('<details class="reference-card question-card"',start);
  const card=report.records.slice(start,next===-1?undefined:next);
  const tag=report.records.slice(report.records.lastIndexOf('<details',start),report.records.indexOf('>',start)+1);
  assert(!/\sopen(?:\s|=|>)/.test(tag),`Question must start closed: ${r.id}`);
  assert.equal([...card.matchAll(/data-interpretation=/g)].length,1,`One theological interpretation: ${r.id}`);
  assert(card.includes(`data-interpretation="${r.id}"`));
  assert(card.includes('data-return-to-story'),`Return control: ${r.id}`);
  assert(card.includes('class="chart-reading"'),`Missing reading: ${r.id}`);
  assert(card.includes('class="bar-plot"'),`Missing chart: ${r.id}`);
  if(r.publication==='generations')assert(card.includes('<strong>Not published</strong>'),'Do not borrow a generational base');
}
assert.equal(expected,16749);
assert.equal(cells.size,expected);
for(const tag of [...report.appendix.matchAll(/<details[^>]*data-breakdown=[^>]*>/g),...report.records.matchAll(/<details class="response-detail"[^>]*>/g)])assert(!/\sopen(?:\s|=|>)/.test(tag[0]),'Individual tables and complete-response views start closed');
assert.equal([...report.records.matchAll(/name="question-references"/g)].length,91,'Each question belongs to the exclusive reference group');
assert.equal([...report.appendix.matchAll(/name="table-references"/g)].length,91,'Each original table is independently collapsible');
for(const [,id,keys] of report.records.matchAll(/data-interpretation="([^"]+)" data-evidence="([^"]+)"/g)){
 for(const key of keys.split(' ')){
  const [recordId,ri,ci]=key.split(':');
  assert.equal(recordId,id);
  const r=data.records.find(r=>r.id===recordId);
  assert.equal(Number(ci),0,'Interpretations refer to the published question total');
  assert.equal(typeof r.rows[Number(ri)].values[0],'number','Interpretations cite numeric source cells');
 }
}

assert(!/<(?:select|input|aside)\b/i.test(markup),'No selectors or split sidebar');
for(const id of ['question-archive','raw-data','methods']){
 const tag=template.match(new RegExp('<details[^>]*id="'+id+'"[^>]*>'))?.[0];
 assert(tag && !/\sopen(?:\s|=|>)/.test(tag),'Reference sections must be closed by default');
}
assert(template.indexOf('id="finding-charts"')<template.indexOf('id="question-archive"'));
assert(!/<(?:table|details)\b/.test(findings.html),'Main findings must be graphics with no hidden chart selectors');
assert(!/\shidden(?:\s|>|=)/i.test(markup),'No hidden data sections');
assert(template.includes('Developed by YIN Renlong · 2026'));
const ids=[...markup.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(ids.length,new Set(ids).size,'Every anchor must be unique');
const idSet=new Set(ids);
for(const m of markup.matchAll(/href="#([^"]+)"/g))assert(idSet.has(m[1]),`Broken internal link #${m[1]}`);
assert(report.wording.includes('47% incompatible, 41% compatible, 12% don\'t know'));
assert(report.wording.includes('57% incompatible, 30% compatible, 13% don\'t know'));
const rendered=[...findings.html.matchAll(/data-viz-cell="([^"]+)" data-viz-value="([^"]*)"/g)];
assert.equal(rendered.length,134);
assert.equal([...findings.html.matchAll(/data-finding=/g)].length,10);
assert.equal([...findings.html.matchAll(/<figure /g)].length,10);
assert.equal([...findings.html.matchAll(/class="takeaway"/g)].length,10);
assert.equal([...findings.html.matchAll(/class="waffle-cell /g)].length,100);
for(const [,key,value] of rendered){
 const [id,ri,ci]=key.split(':');
 const r=data.records.find(record=>record.id===id);
 assert(r,`Unrecognised record ${id}`);
 assert.equal(value,String(r.rows[Number(ri)].values[Number(ci)]??''),`Graphic must use the published value: ${key}`);
}
assert(findings.html.includes('49–52% don’t know'));
assert(findings.html.includes('Morality and consciousness produce almost even splits.'));
for(const name of ['composition-chart','paired-chart','heatmap','interval-chart','lollipop-chart','waffle'])assert(findings.html.includes('class="'+name),`Missing chart form ${name}`);
assert(findings.html.includes('data-viz-cell="q1_3__main:6:0" data-viz-value="29"'),'Use published net 29, not rounded components 30');
assert(report.appendix.includes('data-source-cell="q24_2__main:5:0" data-published-value="0%"'),'Keep a published zero in the archive');
const sourcePoint=(id,pattern)=>data.records.find(r=>r.id===id+'__main').rows.find(r=>pattern.test(r.label)).values[0];
const sciences=['1','2','3','5','6','7','8','9'];
for(const n of sciences){const a=sourcePoint('q8a_'+n,/^Net: Strongly agree/);for(const w of ['b','c','d'])assert(a>sourcePoint('q8'+w+'_'+n,/^Net: Strongly agree/),'Religious wording must have most agreement in each science');}
const differences=sciences.map(n=>sourcePoint('q8a_'+n,/^Net: Strongly agree/)-sourcePoint('q8a_'+n,/^Net: Disagree/));
assert.equal(differences.filter(d=>d>0).length,1);assert.equal(differences.filter(d=>d<0).length,6);assert.equal(differences.filter(d=>d===0).length,1);
assert.equal([...findings.html.matchAll(/class="waffle-cell positive"/g)].length,sourcePoint('q1_10',/^Net: Strongly agree/));
assert.equal([...findings.html.matchAll(/class="waffle-cell negative"/g)].length,sourcePoint('q1_10',/^Net: Disagree/));
assert(findings.html.includes('width:28%') && findings.html.includes('99% after source rounding'),'Do not rescale the 99% explanatory-limits distribution');
console.log(`PASS: 10 default visual figures, six chart forms, ${rendered.length} exact source values in the new comparisons, 91 contextual readings, individually closed sources, all 91 records / ${expected.toLocaleString('en-GB')} tokens preserved, and working anchors.`);
