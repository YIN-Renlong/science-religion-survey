#!/usr/bin/env python3
"""Reproduce the published-table transcription; requires pdftotext and PyMuPDF.

Usage: python3 scripts/extract_data.py /path/to/Data-tables-combined.pdf
Published percentages and '-' symbols are preserved, never recalculated.
"""
from pathlib import Path
import csv, hashlib, io, json, re, subprocess, sys
import fitz

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[1]).resolve()
TEXT = subprocess.check_output(['pdftotext','-layout',str(SOURCE),'-'], text=True)
DOC = fitz.open(SOURCE)
COLS = [('total','All in question base','Total'),('male','Male','Gender'),('female','Female','Gender')]
COLS += [(f'age_{a}',a,'Age') for a in ['16–29','30–39','40–49','50–59','60–69','70+']]
COLS += [(f'eth_{a.lower()}',a,'Ethnicity') for a in ['White','Mixed','Asian','Black','Other']]
COLS += [(f'region_{i}',a,'Region') for i,a in enumerate(['North East','North West','Yorkshire and the Humber','East Midlands','West Midlands','East of England','London','South East','South West','Wales','Scotland','Northern Ireland'])]
GENS = [('total','All in question base','Total'),('gen_z','Gen Z (16–24)','Generation'),('millennial','Millennial (25–40)','Generation'),('gen_x','Gen X (41–56)','Generation'),('boomers','Boomers (57+)','Generation')]

Q10 = ["I find it difficult to believe that that humans and apes share a common ancestor", "I find it difficult to believe that humans evolved", "I find it difficult to believe that all life, including humans, has a common origin", "I find it difficult to believe because there are competing theories about evolution within science research communities", "I find it difficult to believe in the timescale of millions of years necessary for evolution", "I find it difficult to believe because evolutionary science isn't as scientific as other branches of science", "I find it difficult to believe what evolutionary science is/means", "I find it difficult to believe that animals evolved", "I find it difficult to believe that plants have evolved", "Other", "Don't know"]
PROFILE = ["No, I do not regard myself as belonging to any particular religion.", "Yes - Church of England/Anglican/Episcopal", "Yes - Roman Catholic", "Yes - Islam", "Yes - Other", "Yes - Presbyterian/Church of Scotland", "Yes - Methodist", "Yes - Baptist", "Yes - Pentecostal (e.g. Assemblies of God, Elim Pentecostal Church, New Testament Church of God, Redeemed Christian Church of God)", "Yes - Hinduism", "Yes - Evangelical – independent/non-denominational (e.g. FIEC, Pioneer, Vineyard, Newfrontiers)", "Yes – Orthodox Christian", "Yes - Buddhism", "Yes - Judaism", "Yes - Sikhism", "Yes - United Reformed Church", "Yes - Brethren", "Yes - Free Presbyterian", "Prefer not to say"]

records=[]
current=None
collect=False
for page_no,page in enumerate(TEXT.split('\f'),1):
    for line in page.splitlines():
        line=line.strip()
        match=re.match(r'^(q\d+[a-z]?(?:_\d+)?|profile_religion_pdl)[. ]+(.+)',line)
        score=line in ['Science Knowledge Score','Religion Knowledge Score','Confidence in science knowledge']
        if match or score:
            source_id=match[1] if match else re.sub(r'\W+','_',line.lower())
            title=match[2] if match else line
            publication='generations' if page_no>=26 else 'main'
            key=source_id
            if source_id=='q11_2' and 'Stem cell' in title: key='q11_1'
            current={'id':f'{key}__{publication}','question_id':key,'source_question_id':source_id,'publication':publication,'title':title,'source_pages':[page_no],'rows':[], 'notes':[]}
            records.append(current); collect=True
            continue
        if not current: continue
        n=5 if current['publication']=='generations' else 26
        tokens=list(re.finditer(r'(?<!\S)(?:\d{1,3}%|-)(?!\S)',line))
        if len(tokens)>=n and all(re.fullmatch(r'\d+%|-',v[0]) for v in tokens[-n:]):
            selected=tokens[-n:]
            label=line[:selected[0].start()].strip()
            if not all(re.fullmatch(r'\s*',line[selected[j].end():selected[j+1].start()]) for j in range(n-1)): continue
            current['rows'].append({'label':label,'raw':[v[0] for v in selected],'values':[int(v[0][:-1]) if v[0]!='-' else None for v in selected], 'page':page_no})
            if page_no not in current['source_pages']:current['source_pages'].append(page_no)
            collect=False
        elif collect and line and not re.fullmatch(r'\d+',line):
            if re.search(r'Unweighted|^Base',line) or re.search(r'\s{2,}\d+',line): collect=False
            else: current['title']+=' '+line

# Assign base counts using the PDF coordinates independently of line extraction.
# The columns have unequal widths. Their centres come from the table's first row.
centres=[]
first=next(w for w in DOC[0].get_text('words') if w[4]=='16%')
for w in DOC[0].get_text('words'):
    if abs(w[1]-first[1])<.5 and w[0]>164 and re.fullmatch(r'\d+%',w[4]):centres.append((w[0]+w[2])/2)
centres.sort(); assert len(centres)==26
bases=[]
for page in DOC:
    words=page.get_text('words')
    for w in sorted(words,key=lambda t:(t[1],t[0])):
        if w[0]>=164:continue
        if w[4] not in ('Unweighted','Base:','Base'): continue
        # Do not read the generational table's text or unrelated labels.
        y=(w[1]+w[3])/2
        groups=[[] for _ in centres]
        for v in words:
            if v[0]>=164 and abs((v[1]+v[3])/2-y)<8 and re.fullmatch(r'\d+|-',v[4]):
                idx=min(range(26),key=lambda i:abs((v[0]+v[2])/2-centres[i]))
                groups[idx].append(v)
        # A wrapped base label can sit above the data row: use closest full numeric row.
        if sum(bool(g) for g in groups)<25:
            candidates=[v for v in words if v[0]>=164 and y-14<(v[1]+v[3])/2<y+14 and re.fullmatch(r'\d+|-',v[4])]
            groups=[[] for _ in centres]
            for v in candidates:
                idx=min(range(26),key=lambda i:abs((v[0]+v[2])/2-centres[i])); groups[idx].append(v)
        if not all(groups):raise ValueError(('Incomplete base',page.number+1,w[4],y))
        vals=[''.join(v[4] for v in sorted(g,key=lambda v:(v[1],v[0]))) for g in groups]
        bases.append({'kind':'unweighted' if w[4]=='Unweighted' else 'weighted','page':page.number+1,'values':[int(v) if v!='-' else None for v in vals]})
main=[r for r in records if r['publication']=='main']
assert len(bases)==2*len(main),(len(bases),len(main))
for i,r in enumerate(main):
    assert bases[i*2]['kind']=='unweighted' and bases[i*2+1]['kind']=='weighted'
    r['base_unweighted']=bases[i*2]['values'];r['base_weighted']=bases[i*2+1]['values']
    r['columns']=[dict(id=c[0],label=c[1],dimension=c[2]) for c in COLS]
for r in records:
    q=r['question_id']; isgen=r['publication']=='generations'
    if isgen:
        r['columns']=[dict(id=c[0],label=c[1],dimension=c[2]) for c in GENS]
        r['base_unweighted']=[None]*5;r['base_weighted']=[None]*5
        r['notes'].append('The generational appendix does not publish subgroup bases. Its total is kept separately from the main tables; some published totals differ by one percentage point.')
    if q.startswith(('q3','q4')):r['topic']='Compatibility';r['kind']='compatibility'
    elif q.startswith('q8'):r['topic']='Specific sciences';r['kind']='agreement'
    elif q.startswith(('q9','q10')):r['topic']='Evolution';r['kind']='multiple' if q=='q10' else 'agreement'
    elif q.startswith('q11'):r['topic']='Technology & risk';r['kind']='risk'
    elif q.startswith('q6'):r['topic']='Scientific confidence';r['kind']='confidence'
    elif q.startswith('q2c'):r['topic']='Views of religion';r['kind']='agreement'
    elif q.startswith('q1_') or q.startswith('q5'):r['topic']='Views of science';r['kind']='agreement'
    else:r['topic']='Background & knowledge';r['kind']='categorical'
    r['source_base_label']='Base: All' if not isgen else 'Not supplied in generational appendix'
    r['prompt']='How far do you agree or disagree with the following statements?'
    if r['kind']=='compatibility':r['prompt']='Scores 1–10: 1 is completely incompatible; 10 is completely compatible. Not sure is a separate response.'
    if r['kind']=='confidence':r['prompt']='How confident are you that you understand the basics of the following areas of science?'
    if r['kind']=='risk':r['prompt']='For each of the following, do you think…? (Benefits and risks scale.)'
    if q.startswith('q9'):r['prompt']='To what extent do you agree or disagree with the following statements about evolution, the idea that different species developed from earlier forms of life?'
    if q.startswith('q24'):r['prompt']='What, if any, is the highest qualification you have in each of the following broad subjects?';r['source_base_label']='Base'
    if q.startswith(('q4','q8')):
        family=q[2] if q.startswith('q4') else q[2]
        label=({'a':'faith','b':'Christianity','c':'Islam'} if q.startswith('q4') else {'a':'religion','b':'Christianity','c':'Islam','d':'faith'}).get(family,'')
        r['source_base_label']='Base: Those answering about '+label
    if q=='q10':r['prompt']='Please tick all that apply.';r['source_base_label']='Base: those who have difficulty believing in the theory of evolution'
    if q=='profile_religion_pdl' or 'knowledge' in q:r['prompt']='Published response categories are shown below.'
    r['base_label']='All respondents in the published question base'
    if q.startswith('q4'):r['base_label']='Respondents answering this wording; not members of the religion named'
    if q.startswith('q8'):r['base_label']='Respondents answering this wording; bases vary by item'
    if q=='q10':
        r['base_label']='Respondents agreeing or strongly agreeing that they have difficulty believing in evolution'
        assert len(r['rows'])==len(Q10)
        for row,label in zip(r['rows'],Q10):row['label']=label
        r['notes'].append('Multiple answers allowed. Percentages must not be added as parts of a whole.')
    if q=='profile_religion_pdl':
        assert len(r['rows'])==len(PROFILE),(len(r['rows']),len(PROFILE))
        for row,label in zip(r['rows'],PROFILE):row['label']=label
    if q.startswith('q24'):
        labels=['No qualification','GCSE / Scottish Standard Grade','A Levels / Scottish Highers/ IB','Undergraduate Degree or technical qualification',"Master's Degree",'Doctorate (Ph.D)','Not sure']
        assert len(r['rows'])==7
        for row,label in zip(r['rows'],labels):row['label']=label
    if q=='q11_1':r['notes'].append('The tables label stem cell research q11_2, duplicating nuclear power. This explorer uses q11_1 from the questionnaire and preserves the printed identifier in the source data.')
    if q.startswith('q8d'):r['notes'].append('The statement is about being an atheist. The source base label says “Those answering about faith”; that inconsistency is retained and disclosed, not interpreted as respondent identity.')
    if q in ['science_knowledge_score','religion_knowledge_score','confidence_in_science_knowledge']:
        r['notes'].append('Low, medium and high are published derived categories. Scoring thresholds are not specified in these tables; this explorer does not recreate the scores.')
    for row in r['rows']:
        row['is_net']=bool(re.match(r'net',row['label'],re.I))
        row['label']=re.sub(r'^1 - 1 -','1 -',row['label']);row['label']=re.sub(r'^10 - 10 -','10 -',row['label'])
        assert len(row['values'])==len(r['columns'])
    if r['kind']=='agreement':assert len(r['rows'])==8,(q,len(r['rows']))
    if r['kind']=='confidence':assert len(r['rows'])==6
    if r['kind']=='risk':assert len(r['rows'])==8
    if r['kind']=='compatibility':assert len(r['rows'])==(4 if isgen else 15),(q,len(r['rows']))
    assert r['rows'],q

sources={
 'tables':{'title':'Published data tables','url':'https://www.theosthinktank.co.uk/cmsfiles/Data-tables-combined.pdf','sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest()},
 'questionnaire':{'title':'Survey questionnaire','url':'https://www.theosthinktank.co.uk/cmsfiles/1.Science-and-Religion-Theos-Faraday-YouGov-Questionnaire.pdf'},
 'summary':{'title':'Executive summary','url':'https://www.theosthinktank.co.uk/cmsfiles/Science-and-religion-2-Exective-summary.pdf'},
 'report':{'title':'Full report','url':'https://www.theosthinktank.co.uk/cmsfiles/Science-and-Religion-Moving-away-from-the-shallow-end_REPORT.pdf'},
 'project':{'title':'Theos report page','url':'https://www.theosthinktank.co.uk/research/2022/04/21/science-and-religion-moving-away-from-the-shallow-end'}
}
data={'version':'1.0.0','survey':{'fieldwork_start':'2021-05-05','fieldwork_end':'2021-06-13','publication_year':2022,'sample_size':5153,'population':'UK adults; source methodology states aged 18+','mode':'Online YouGov panel; published weighted percentages'},'sources':sources,'records':records}
out=ROOT/'data';out.mkdir(exist_ok=True)
(out/'survey.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
(ROOT/'assets/js/data.js').write_text('/* Generated from published tables. See data/survey.json and DATA_NOTES.md. */\nwindow.SURVEY_DATA = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n')
with (out/'survey.csv').open('w',newline='') as f:
    writer=csv.writer(f);writer.writerow(['record_id','question_id','source_question_id','publication','question','dimension','group','response','published_value','percent','unweighted_n','weighted_base','source_page','source_url'])
    for r in records:
        for row in r['rows']:
            for i,c in enumerate(r['columns']):writer.writerow([r['id'],r['question_id'],r['source_question_id'],r['publication'],r['title'],c['dimension'],c['label'],row['label'],row['raw'][i],row['values'][i],r['base_unweighted'][i],r['base_weighted'][i],row['page'],sources['tables']['url']+f'#page={row["page"]}'])
print(f'{len(records)} table records; {len(main)} main tables; {len(records)-len(main)} generational tables; {sum(len(r["rows"])*len(r["columns"]) for r in records)} published cells.')
