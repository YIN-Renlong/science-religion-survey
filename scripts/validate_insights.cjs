#!/usr/bin/env node
/* Optional development checks for descriptive reading logic. No browser or build required. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const context = {};
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/insights.js'), 'utf8'), context);
const read = context.SURVEY_INSIGHTS;
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/survey.json'), 'utf8'));
const record = id => data.records.find(r => r.id === id);

// Published nets are independent of rounded components: 8 + 22 is not the net 29.
const science = read.nets(record('q1_3__main'), 0);
assert.match(science.title, /11 percentage points/);
assert.match(science.body, /29%/);
assert.match(read.nets(record('q1_3__generations'), 0).body, /30%/);
assert.match(read.nets(record('q3_1__main'), 0).title, /27 percentage points/);
assert.equal(read.distribution(record('q3_1__main'), 0).highlight.length, 3);
assert.match(read.distribution(record('q10__main'), 0).body, /Multiple responses were allowed/);

// A synthetic fixture isolates zero, missingness, ties, and the total exclusion rule.
const fixture = {
  kind:'categorical',
  columns:[{label:'Total',dimension:'Total'},{label:'A',dimension:'Group'},{label:'B',dimension:'Group'},{label:'C',dimension:'Group'}],
  base_unweighted:[1000,200,200,200],
  rows:[{label:'Selected response',values:[99,0,10,null],is_net:false}]
};
const range=read.comparison(fixture,0,[0,1,2,3]);
assert.match(range.title,/0–10%/);
assert.match(range.body,/1 source-dash/);
assert.deepEqual(Array.from(range.highlight),['B']);
fixture.rows[0].values=[99,0,0,null];
assert.match(read.comparison(fixture,0,[0,1,2,3]).title,/Equal/);
fixture.rows[0].values=[99,null,null,null];
assert.match(read.comparison(fixture,0,[0,1,2,3]).title,/Too few/);
assert.match(read.distribution(fixture,1).title,/No numeric/);
assert.equal(read.matrix([{id:'zero',science:'X',wording:'Y',value:0},{id:'missing',science:'X',wording:'Z',value:null}], 'Response').highlight[0],'zero');

let checked=0;
for(const r of data.records){
  for(let index=0;index<r.columns.length;index++){
    for(const note of [read.distribution(r,index),read.nets(r,index)]){
      assert.ok(note.title && note.body);
      assert.doesNotMatch(note.title+' '+note.body,/undefined|NaN|Infinity/);
      checked++;
    }
  }
  for(const dimension of new Set(r.columns.map(c=>c.dimension).filter(d=>d!=='Total'))){
    const indices=r.columns.map((c,i)=>i===0||c.dimension===dimension?i:-1).filter(i=>i>=0);
    r.rows.forEach((_,index)=>{
      const note=read.comparison(r,index,indices);
      assert.ok(note.title && note.body);
      assert.doesNotMatch(note.title+' '+note.body,/undefined|NaN|Infinity/);
      checked++;
    });
  }
}
console.log(`PASS: source-rounded nets, ties, zero vs dash, totals excluded from ranges, and ${checked} data-driven reading cases.`);
