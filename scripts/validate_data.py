#!/usr/bin/env python3
"""Validate the shipped dataset. Optional --source-pdf uses independent PDF tokens."""
from pathlib import Path
import argparse, hashlib, json, re, sys

root=Path(__file__).resolve().parents[1]
data=json.loads((root/'data/survey.json').read_text())
parser=argparse.ArgumentParser()
parser.add_argument('--source-pdf',type=Path)
args=parser.parse_args()
records=data['records'];ids=set();cell_count=0
for record in records:
    assert record['id'] not in ids;ids.add(record['id'])
    n=len(record['columns'])
    assert n==(26 if record['publication']=='main' else 5)
    assert len(record['base_unweighted'])==len(record['base_weighted'])==n
    for row in record['rows']:
        assert len(row['values'])==len(row['raw'])==n
        assert row['label'].strip()
        for value,raw in zip(row['values'],row['raw']):
            assert value is None if raw=='-' else value==int(raw[:-1]) and 0<=value<=100
        cell_count+=n
    if record['publication']=='main':
        total=record['base_unweighted'][0]
        assert 0<total<=5153
        for dim in ['Gender','Age','Ethnicity','Region']:
            indices=[i for i,c in enumerate(record['columns']) if c['dimension']==dim]
            assert sum(record['base_unweighted'][i] or 0 for i in indices)==total,(record['id'],dim)
            assert abs(sum(record['base_weighted'][i] or 0 for i in indices)-record['base_weighted'][0])<=len(indices)
    elif record['publication']=='generations':assert all(x is None for x in record['base_unweighted'])

by_id={r['id']:r for r in records}
def find(q,label):return next(row['values'][0] for row in by_id[q]['rows'] if row['label']==label)
assert [find('q3_1__main',k) for k in ['Net: Incompatible','Net: Compatible',"Don't know"]]==[57,30,13]
assert [find('q4c_1__main',k) for k in ['Net: Incompatible','Net: Compatible',"Don't know"]]==[43,25,32]
assert find('q1_3__main','Net: Strongly agree / agree')==29
assert find('q1_3__generations','Net Agree')==30
assert find('q9_1__main','Net: Strongly agree / agree')==74
assert by_id['q11_1__main']['source_question_id']=='q11_2'
assert len(records)==91 and cell_count==16749
js=(root/'assets/js/data.js').read_text().split('window.SURVEY_DATA = ',1)[1].strip().removesuffix(';')
assert json.loads(js)==data,'Browser data differs from JSON'
print(f'PASS: {len(records)} tables, {cell_count:,} published cells, base counts, source-specific totals, browser/JSON parity.')

if args.source_pdf:
    import fitz
    assert hashlib.sha256(args.source_pdf.read_bytes()).hexdigest()==data['sources']['tables']['sha256']
    source=fitz.open(args.source_pdf)
    expected={}
    for r in records:
        for row in r['rows']:expected.setdefault(row['page'],[]).append(row['raw'])
    checked=0
    for pi,page in enumerate(source,1):
        tokens=[]
        for w in page.get_text('words'):
            limit=164 if pi<26 or (pi==26 and w[1]<100) else 300
            if w[0]>=limit and (pi!=1 or w[1]>320) and re.fullmatch(r'\d+%|-',w[4]):tokens.append(w)
        rows=[]
        for w in sorted(tokens,key=lambda t:(t[1],t[0])):
            if not rows or abs(w[1]-rows[-1][0][1])>1.5:rows.append([w])
            else:rows[-1].append(w)
        actual=[[w[4] for w in sorted(row,key=lambda t:t[0])] for row in rows]
        assert actual==expected[pi],f'Independent PDF-token comparison differs on page {pi}'
        checked+=sum(map(len,actual))
    print(f'PASS: all {checked:,} values and dash symbols independently match PDF coordinates across 30 pages.')
