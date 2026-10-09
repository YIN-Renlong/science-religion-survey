/* Complete source archive. Individual records open on demand; published data are never filtered out. */
(function(root){
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number=n=>n==null?'Not published':n.toLocaleString('en-GB');
  const pct=n=>n==null?'—':n+'%';
  const topics=[
    ['compatibility','Compatibility','Compatibility in detail','Read the full 1–10 scales alongside the published net categories.'],
    ['views-of-science','Views of science','What science can explain','Published views on the scope, limits and value of science.'],
    ['views-of-religion','Views of religion','Views of religion','These statements measure respondents’ views; they are not conclusions of this report.'],
    ['scientific-confidence','Scientific confidence','Confidence in scientific knowledge','Self-reported confidence is distinct from demonstrated knowledge.'],
    ['specific-sciences','Specific sciences','Every science-and-wording question','The complete response distributions behind the science comparisons.'],
    ['evolution','Evolution','Evolution, origins & belief','Read each statement in its own terms. Question bases differ.'],
    ['technology','Technology & risk','Technology, benefits & risks','Benefits, risks, balance and unfamiliarity remain separate responses.'],
    ['background','Background & knowledge','Qualifications & religious affiliation','These are published outcomes, not joint filters for other questions.'],
    ['generations',null,'The generational appendix','A separate publication section. Its group bases are not supplied and some totals differ from the main tables.']
  ];
  function reading(note,interpretation=null,record=null){return `<div class="chart-reading" role="note"><p class="reading-title">${esc(note.title)}</p><p>${esc(note.body)}</p>${interpretation?`<div class="course-reading" data-interpretation="${record.id}" data-evidence="${interpretation.evidence.join(' ')}"><p class="meaning-label">Insights from the data</p><p>${esc(interpretation.meaning)}</p></div>`:''}</div>`;}
  function recordSummary(r,kind){return `<summary><span class="reference-code">${esc(r.question_id.toUpperCase())}<small>${r.publication==='main'?'Main tables':'Generational appendix'}</small></span><span class="reference-title" id="${kind==='question'?'title':'table-title'}-${r.id}">${kind==='question'?esc(r.title):'Original table · '+esc(r.title)}</span><span class="reference-toggle" aria-hidden="true">+</span></summary>`;}
  function colour(label,kind){
    if(/don't know|not sure|know what this is|not to say/i.test(label))return 'unknown';
    if(/neither|same|medium/i.test(label))return 'neutral';
    if(kind==='compatibility'&&/^\d/.test(label))return parseInt(label,10)<=5?'negative':'positive';
    return /disagree|not very|not at all|risks.*outweigh|incomp/i.test(label)?'negative':'positive';
  }
  function plot(rows,kind,highlight){
    return `<div class="bar-plot" role="group" aria-label="Published percentages on a shared zero to one hundred percent scale"><div class="axis" aria-hidden="true"><span></span><div><span>0</span><span>50</span><span>100%</span></div><span></span></div>${rows.map(row=>`<div class="bar-row"><div class="bar-label">${esc(row.label)}${highlight.includes(row.label)?'<span class="bar-flag">Highest share</span>':''}</div><div class="bar-track" aria-hidden="true"><span class="bar-fill ${colour(row.label,kind)}" style="width:${row.values[0]??0}%"></span></div><span class="bar-value" aria-label="${row.values[0]==null?'Source dash, not inferred as zero':row.values[0]+' percent'}">${pct(row.values[0])}</span></div>`).join('')}</div>`;
  }
  function source(data,page){return data.sources.tables.url+'#page='+page;}
  function recordCard(r,data,insights){
    const detail=r.rows.filter(row=>!row.is_net),nets=r.rows.filter(row=>row.is_net);
    const primary=nets.length?nets.slice(0,2):detail;
    const note=nets.length?insights.nets(r,0):insights.distribution(r,0);
    const context=insights.interpretation(r);
    const stem=r.prompt&&r.prompt.trim()!==r.title.trim()?`<p class="question-stem">${esc(r.prompt)}</p>`:'';
    const primaryChart=`${reading(note,context,r)}<h4>${nets.length?'Combined responses':'Published responses'}</h4>${plot(primary,r.kind,note.highlight)}`;
    let extra='';
    if(nets.length&&detail.length){
      const full=insights.distribution(r,0);
      extra=`<details class="response-detail"><summary>Show every response category<span>Strength of response, neutral answers and uncertainty</span></summary><div class="response-detail-body"><p class="small">These categories unpack the same question. Combined categories above overlap these responses; they are not additional respondents.</p>${reading(full)}${plot(detail,r.kind,full.highlight)}${nets.length>2?`<h4>Published endpoint categories</h4><p class="small">These narrower nets also overlap the scale above.</p>${plot(nets.slice(2),r.kind,[])}`:''}</div></details>`;
    }
    return `<details class="reference-card question-card" id="q-${r.id}" data-record="${r.id}" name="question-references" aria-labelledby="title-${r.id}">${recordSummary(r,'question')}<div class="reference-body">${stem}<p class="base-line">Unweighted n: <strong>${number(r.base_unweighted[0])}</strong> · weighted base: ${number(r.base_weighted[0])} · PDF ${r.source_pages.join(', ')}</p><p class="small">${esc(r.base_label)}. Source base label: “${esc(r.source_base_label)}”.</p>${r.notes.length?`<div class="source-note">${r.notes.map(n=>`<p>${esc(n)}</p>`).join('')}</div>`:''}${primaryChart}${extra}<p class="chart-note">${r.kind==='multiple'?'Multiple responses were allowed; these bars do not form a 100% total. ':''}Insights connect the published responses with questions for theological research. It is not a significance test or an additional finding attributed to the survey authors.</p><div class="record-links"><a href="${source(data,r.source_pages[0])}" target="_blank" rel="noopener">Source PDF</a><a href="#table-${r.id}">Open the original table</a><button type="button" data-download-record="${r.id}">Download this table</button><button type="button" data-return-to-story>Return to the presentation ↑</button><a href="#q-${r.id}" aria-label="Link to ${esc(r.question_id)} in ${r.publication}">Link to question</a></div></div></details>`;
  }
  function matrix(data,metric,insights){
    const lookup=new Map(data.records.map(r=>[r.id,r]));
    const subjects=[['1','Big Bang'],['2','Neuroscience'],['3','Medical science'],['5','Psychology'],['6','Astronomy & cosmology'],['7','Chemistry'],['8','Climate science'],['9','Geology']];
    const headings=['Be religious','Be a Christian','Be a Muslim','Be an atheist'];
    const [key,label,pattern,explanation]=metric;
    const cells=subjects.flatMap(([i,science])=>['a','b','c','d'].map((letter,j)=>{const r=lookup.get(`q8${letter}_${i}__main`);return {id:r.id,science,wording:headings[j],value:r.rows.find(row=>pattern.test(row.label)).values[0],r};}));
    const note=insights.matrix(cells,label);
    return `<article class="matrix-card" id="science-${key}"><p class="eyebrow">PARTICULAR SCIENCES / ${esc(label.toUpperCase())}</p><h3>${esc(label)}</h3><p>${esc(explanation)}</p>${reading(note)}<p class="small">Statements ask whether each science makes it harder to be religious, a Christian, a Muslim or an atheist. These wordings do not identify respondents’ religions.</p><table class="science-matrix"><caption>${esc(label)} · published weighted percentages</caption><thead><tr><th scope="col">Scientific discipline</th>${headings.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${subjects.map(([_,science],i)=>`<tr><th scope="row">${science}</th>${cells.slice(i*4,i*4+4).map(cell=>`<td data-label="${esc(cell.wording)}"><a class="matrix-cell ${note.highlight.includes(cell.id)?'cell-highlight':''}" style="background:rgba(8,120,108,${(.04+(cell.value??0)/100*.5).toFixed(3)})" href="#q-${cell.id}" aria-label="${esc(science)}, ${esc(cell.wording)}, ${esc(label)}: ${pct(cell.value)}. Unweighted n ${cell.r.base_unweighted[0]}. Full question below.">${pct(cell.value)}${note.highlight.includes(cell.id)?'<span class="cell-flag">Highest</span>':''}</a></td>`).join('')}</tr>`).join('')}</tbody></table><p class="chart-note">Darker shading indicates a larger share on a fixed 0–100% scale. Outlined values are the largest published share in this chart. Each value links to the complete question below.</p><p class="small">Question bases vary. These are descriptive comparisons; no significance test or causal interpretation is implied. <a href="${source(data,9)}" target="_blank" rel="noopener">Original science tables</a></p></article>`;
  }
  function breakdown(r,data){
    const small=r.columns.map((c,i)=>({c,n:r.base_unweighted[i]})).filter(x=>x.n!=null&&x.n<100);
    let currentDimension='';
    return `<details class="reference-card data-block" id="table-${r.id}" data-breakdown="${r.id}" name="table-references" aria-labelledby="table-title-${r.id}">${recordSummary(r,'table')}<div class="reference-body"><p class="small">Each row is a separately published group. Unweighted n is the actual respondent count; the weighted base is shown separately. ${r.publication==='generations'?'Group bases are not published.':'Group dimensions cannot be combined into new intersections.'}</p>${small.length?`<p class="sample-note">Small bases below 100: ${small.map(x=>`${esc(x.c.label)} (n = ${x.n})`).join('; ')}. This project’s caution convention is not a significance test.</p>`:''}${r.publication==='main'?'<p class="small">The source describes an 18+ population but labels its youngest age band 16–29. The original labels are retained.</p>':'<p class="small">The source describes an 18+ population but labels Gen Z 16–24. The original labels are retained.</p>'}<p class="key-heading">Response key for the table columns</p><ol class="response-key">${r.rows.map((row,i)=>`<li><span>R${i+1}</span> ${esc(row.label)}${row.is_net?' <em>(published net)</em>':''}</li>`).join('')}</ol><table class="breakdown-table"><caption>All published values · ${esc(r.question_id)} · PDF ${r.source_pages.join(', ')}</caption><thead><tr><th scope="col">Published group</th><th scope="col">n</th><th scope="col">Weighted base</th>${r.rows.map((row,i)=>`<th scope="col" title="${esc(row.label)}">R${i+1}</th>`).join('')}</tr></thead><tbody>${r.columns.map((column,ci)=>{let heading='';if(column.dimension!==currentDimension){currentDimension=column.dimension;heading=`<tr class="dimension-row"><th colspan="${r.rows.length+3}" scope="rowgroup">${esc(currentDimension)}</th></tr>`;}return heading+`<tr class="group-values"><th scope="row">${esc(column.label)}</th><td data-label="Unweighted n">${number(r.base_unweighted[ci])}</td><td data-label="Weighted base">${number(r.base_weighted[ci])}</td>${r.rows.map((row,ri)=>`<td class="${row.is_net?'net-value':''}" data-label="${esc(row.label)}" data-source-cell="${r.id}:${ri}:${ci}" data-published-value="${esc(row.raw[ci])}">${pct(row.values[ci])}</td>`).join('')}</tr>`;}).join('')}</tbody></table><p class="chart-note">A dash is reproduced as —, without inferring zero. Published 0% remains 0%. Net rows overlap their component categories.</p><p class="record-links"><a href="#q-${r.id}">Return to this question’s chart</a><a href="${source(data,r.source_pages[0])}" target="_blank" rel="noopener">Source PDF</a><button type="button" data-return-to-story>Return to the presentation ↑</button></p></div></details>`;
  }
  function build(data,insights){
    const lookup=new Map(data.records.map(r=>[r.id,r]));
    const wording=[['q3_1','Religion'],['q4a_1','Faith'],['q4b_1','Christianity'],['q4c_1','Islam']].map(([q,label])=>{
      const r=lookup.get(q+'__main');const values=[/^Net: Incompatible$/,/^Net: Compatible$/,/^Don't know$/].map(pattern=>r.rows.find(row=>pattern.test(row.label)).values[0]);
      return `<div class="wording-row"><div class="wording-label"><a href="#q-${r.id}">${label}</a>${q==='q4a_1'?'<span class="bar-flag">Highest compatible share</span>':''}<span class="sample-size">n = ${number(r.base_unweighted[0])}</span></div><div class="stack" role="img" aria-label="${label}: ${values[0]}% incompatible, ${values[1]}% compatible, ${values[2]}% don't know">${values.map((v,i)=>`<span class="${['negative','positive','unknown'][i]}" style="width:${v}%">${v}%</span>`).join('')}</div></div>`;
    }).join('');
    const metrics=[['agree','Agree / strongly agree',/^Net: Strongly agree/,'Agreement with the statement that a science makes the specified position harder to hold.'],['disagree','Disagree / strongly disagree',/^Net: Disagree/,'Disagreement with those statements. Disagreement does not itself establish a positive relationship.'],['unknown','Don’t know',/^Don't know$/,'Uncertainty is a separate answer and is shown in full.'],['neutral','Neither agree nor disagree',/^Neither/,'A neutral response is distinct from “don’t know”.']];
    let records='';
    const toc=topics.map(([id,topic,title,description],index)=>{
      const list=data.records.filter(r=>id==='generations'?r.publication==='generations':r.publication==='main'&&r.topic===topic);
      records+=`<section class="topic-section" id="topic-${id}" aria-labelledby="heading-${id}"><header class="section-intro"><p class="eyebrow">${String(index+3).padStart(2,'0')} / PUBLISHED QUESTION TABLES</p><h2 id="heading-${id}">${title}</h2><p>${description} Open any of the ${list.length} records below to read its responses and interpretation.</p></header>${list.map(r=>recordCard(r,data,insights)).join('')}<a class="back-link" href="#contents">Back to contents</a></section>`;
      return `<li><a href="#topic-${id}">${title}</a><span>${list.length} records</span></li>`;
    }).join('');
    return {wording,matrices:metrics.map(metric=>matrix(data,metric,insights)).join(''),records,toc,appendix:data.records.map(r=>breakdown(r,data)).join('')};
  }
  root.SURVEY_REPORT=Object.freeze({build,topics});
})(typeof window==='undefined'?globalThis:window);
