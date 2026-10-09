/* No external dependencies. All figures come from the published-table dataset. */
(() => {
  'use strict';
  const data = window.SURVEY_DATA;
  if (!data || !Array.isArray(data.records)) {
    document.getElementById('main').innerHTML = '<p class="panel">The data file could not be loaded. Keep the assets folder beside index.html, then reload.</p>';
    return;
  }
  const records = data.records;
  const byId = new Map(records.map(r => [r.id, r]));
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number = n => n == null ? 'Not published' : n.toLocaleString('en-GB');
  const percent = n => n == null ? '—' : n + '%';
  const sourceLink = page => data.sources.tables.url + '#page=' + page;
  let state = {};
  const defaultState = {view:'overview',q:'q3_1__main',topic:'',publication:'',search:'',mode:'distribution',group:'total',dimension:'Gender',metric:''};
  const colours = {negative:'#b45124',positive:'#08786c',unknown:'#a6b5be',neutral:'#758996'};

  function rowColour(label) {
    if (/don't know|not sure|know what this is|not to say/i.test(label)) return colours.unknown;
    if (/neither|same|medium/i.test(label)) return colours.neutral;
    if (/disagree|not very|not at all|risks.*outweigh|incomp/i.test(label)) return colours.negative;
    return colours.positive;
  }
  function net(r, pattern) { return r.rows.find(row => pattern.test(row.label)); }
  function questionLabel(r) {
    if (r.kind === 'compatibility') return 'Science and ' + ({q3_1:'religion',q4a_1:'faith',q4b_1:'Christianity',q4c_1:'Islam'}[r.question_id] || 'religion') + ': compatibility';
    return r.title;
  }
  function routeString(next) {
    const p = new URLSearchParams();
    if (next.view === 'explorer') for (const k of ['q','topic','publication','search','mode','group','dimension','metric']) if (next[k] && next[k] !== defaultState[k]) p.set(k,next[k]);
    const query = p.toString();
    return '#' + next.view + (query ? '?' + query : '');
  }
  function questionHref(r) { return routeString({...state,view:'explorer',q:r.id,mode:'distribution',group:'total',metric:''}); }
  function readRoute() {
    const previousView=state.view;
    const [v,query=''] = location.hash.slice(1).split('?');
    const params = new URLSearchParams(query);
    state = {...defaultState,view:['overview','explorer','methods'].includes(v)?v:'overview'};
    for (const k of ['q','topic','publication','search','mode','group','dimension','metric']) if (params.has(k)) state[k] = params.get(k);
    if (!byId.has(state.q)) state.q=defaultState.q;
    if (!['distribution','compare'].includes(state.mode)) state.mode='distribution';
    renderView();
    if(previousView && previousView!==state.view)window.scrollTo(0,0);
  }
  function update(patch,{pick=false}={}) {
    const activeId = document.activeElement?.id;
    Object.assign(state,patch);
    if (pick) { const filtered = getFiltered(); if (!filtered.some(r=>r.id===state.q) && filtered.length) state.q=filtered[0].id; }
    history.replaceState(null,'',routeString(state));
    renderExplorer();
    if (activeId && $(activeId) && activeId!=='search') $(activeId).focus({preventScroll:true});
  }
  function renderView() {
    for (const el of document.querySelectorAll('.view')) el.hidden=el.id!==state.view;
    for (const a of document.querySelectorAll('[data-nav]')) {
      if(a.dataset.nav===state.view)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
    }
    if(state.view==='explorer')renderExplorer();
    document.title=(state.view==='explorer'?'Explore the tables':state.view==='methods'?'Methods & sources':'Science, Religion & Public Perception')+' · Survey Explorer';
  }

  function renderWording() {
    $('wording-chart').innerHTML = [['q3_1','Religion'],['q4a_1','Faith'],['q4b_1','Christianity'],['q4c_1','Islam']].map(([q,label])=>{
      const r=byId.get(q+'__main');
      const values=[net(r,/^Net: Incompatible$/).values[0],net(r,/^Net: Compatible$/).values[0],net(r,/^Don't know$/).values[0]];
      return `<div class="wording-row"><div class="wording-label"><a href="#explorer?q=${r.id}">${label}</a></div><div class="stack" role="img" aria-label="${label}: ${values[0]}% incompatible, ${values[1]}% compatible, ${values[2]}% don't know"><span class="incompatible" style="width:${values[0]}%">${values[0]}%</span><span class="compatible" style="width:${values[1]}%">${values[1]}%</span><span class="unknown" style="width:${values[2]}%">${values[2]}%</span></div><div class="sample-size">n = ${number(r.base_unweighted[0])}</div></div>`;
    }).join('');
  }
  function renderMatrix() {
    const selected=$('matrix-metric').value;
    const regex={agree:/^Net: Strongly agree/,disagree:/^Net: Disagree/,unknown:/^Don't know$/,neutral:/^Neither/}[selected];
    const subjects=[['1','Big Bang'],['2','Neuroscience'],['3','Medical science'],['5','Psychology'],['6','Astronomy & cosmology'],['7','Chemistry'],['8','Climate science'],['9','Geology']];
    const headings=['Be religious','Be a Christian','Be a Muslim','Be an atheist'];
    const stem={agree:'Agree / strongly agree',disagree:'Disagree / strongly disagree',unknown:'Don’t know',neutral:'Neither agree nor disagree'}[selected];
    $('science-matrix').innerHTML=`<caption class="small">${stem}: this science makes it harder to… (weighted %)</caption><thead><tr><th scope="col">Scientific discipline</th>${headings.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${subjects.map(([i,label])=>`<tr><th scope="row">${label}</th>${['a','b','c','d'].map((letter,j)=>{
      const r=byId.get(`q8${letter}_${i}__main`);const value=net(r,regex).values[0];
      const alpha=.06+value/100*.8;
      return `<td><a class="matrix-cell" style="background:rgba(8,120,108,${alpha.toFixed(3)})" href="#explorer?q=${r.id}" aria-label="${esc(label)}, ${headings[j]}, ${esc(stem)}: ${percent(value)}. Unweighted n ${r.base_unweighted[0]}. Open full results." title="${esc(r.title)} · n = ${number(r.base_unweighted[0])}">${percent(value)}</a></td>`;
    }).join('')}</tr>`).join('')}</tbody>`;
  }
  function getFiltered() {
    const q=state.search.toLocaleLowerCase().trim();
    return records.filter(r=>(!state.topic||state.topic===r.topic)&&(!state.publication||state.publication===r.publication)&&(!q||(r.title+' '+r.question_id+' '+r.topic).toLocaleLowerCase().includes(q)));
  }
  function renderExplorer() {
    $('search').value=state.search;$('topic').value=state.topic;$('publication').value=state.publication;
    const filtered=getFiltered();
    if(!filtered.some(r=>r.id===state.q)&&filtered.length)state.q=filtered[0].id;
    $('result-count').textContent=`${filtered.length} of ${records.length} published table records`;
    $('question-list').innerHTML=filtered.length?filtered.map(r=>`<a class="question-link ${r.id===state.q?'active':''}" href="${esc(questionHref(r))}" ${r.id===state.q?'aria-current="true"':''}><span>${esc(r.question_id.toUpperCase())} · ${r.publication==='main'?'MAIN TABLES':'GENERATIONS'}</span>${esc(questionLabel(r))}</a>`).join(''):'<p class="empty">No matching tables. Try another search or topic.</p>';
    if(!filtered.length){$('question-panel').innerHTML='<h2>No matching tables</h2><p>Try a broader search, or show all topics and published sections.</p><button id="reset-filters" class="button secondary">Reset filters</button>';$('reset-filters').onclick=()=>update({topic:'',search:'',publication:''},{pick:true});return;}
    const r=byId.get(state.q);
    if(!r.columns.some(c=>c.id===state.group))state.group='total';
    const dims=[...new Set(r.columns.map(c=>c.dimension))].filter(d=>d!=='Total');
    if(!dims.includes(state.dimension))state.dimension=dims[0];
    const defaultMetric=r.rows.findIndex(row=>row.is_net);
    let metricIndex=Number.parseInt(state.metric,10);
    if(!Number.isInteger(metricIndex)||metricIndex<0||metricIndex>=r.rows.length)metricIndex=defaultMetric>=0?defaultMetric:0;
    state.metric=String(metricIndex);
    renderQuestion(r,metricIndex,dims);
  }
  function options(items,current) {return items.map(([v,l])=>`<option value="${esc(v)}" ${String(v)===String(current)?'selected':''}>${esc(l)}</option>`).join('');}
  function groupOptions(r) {
    const dims=[...new Set(r.columns.map(c=>c.dimension))];
    return dims.map(dim=>`<optgroup label="${dim}">${options(r.columns.filter(c=>c.dimension===dim).map(c=>[c.id,c.label]),state.group)}</optgroup>`).join('');
  }
  function plot(items) {
    return `<div class="bar-plot" role="group" aria-label="Horizontal bars on a shared zero to one hundred percent scale"><div class="axis" aria-hidden="true"><span></span><div class="axis-ticks"><span>0</span><span>50</span><span>100%</span></div><span></span></div>${items.map(item=>`<div class="bar-row"><div class="bar-label">${esc(item.label)}${item.detail?`<small>${esc(item.detail)}</small>`:''}</div><div class="bar-track" aria-hidden="true"><div class="bar-fill" style="width:${item.value??0}%;background:${item.colour||rowColour(item.label)}"></div></div><span class="bar-value" aria-label="${item.value==null?'Source dash, not inferred as zero':item.value+' percent'}">${percent(item.value)}</span></div>`).join('')}</div>`;
  }
  function renderQuestion(r,metricIndex,dims) {
    const compare=state.mode==='compare';
    const groupIndex=r.columns.findIndex(c=>c.id===state.group);
    const displayedIndices=compare?[0,...r.columns.map((c,i)=>c.dimension===state.dimension?i:-1).filter(i=>i>=0)]:[groupIndex];
    const actualN=r.base_unweighted[groupIndex],weightedN=r.base_weighted[groupIndex];
    const notes=[...r.notes];
    if((compare&&['Age','Generation'].includes(state.dimension))||(!compare&&['Age','Generation'].includes(r.columns[groupIndex].dimension)))notes.push('The population description says 18+, but the published youngest age labels begin at 16. Labels are reproduced without inferring participation below age 18.');
    let charts='';
    if(compare){
      const row=r.rows[metricIndex];
      charts=`<div class="chart-heading"><div><h3>${esc(row.label)}</h3><p class="small">${esc(state.dimension)} · weighted percentages · actual respondent n below each label</p></div></div>${plot(displayedIndices.map(i=>({label:r.columns[i].label,value:row.values[i],detail:'n = '+number(r.base_unweighted[i]),colour:i===0?'#112d3a':rowColour(row.label)})))}`;
    }else{
      const detail=r.rows.filter(row=>!row.is_net),nets=r.rows.filter(row=>row.is_net);
      charts=`<div class="chart-heading"><div><h3>${esc(r.columns[groupIndex].label)}</h3><p class="small">Unweighted n: ${number(actualN)} · weighted base: ${number(weightedN)}</p></div></div>`;
      if(detail.length)charts+=plot(detail.map(row=>({label:row.label,value:row.values[groupIndex],colour:r.kind==='compatibility'&&/^\d/.test(row.label)?(parseInt(row.label,10)<=5?colours.negative:colours.positive):undefined})));
      if(nets.length)charts+=`<h3>${detail.length?'Combined categories':'Published combined categories'}</h3><p class="small">These are the source’s net percentages${detail.length?', shown separately from the individual responses':''}.</p>${plot(nets.map(row=>({label:row.label,value:row.values[groupIndex]})))}`;
    }
    const smallGroups=displayedIndices.filter(i=>r.base_unweighted[i]!=null&&r.base_unweighted[i]<100);
    const caution=smallGroups.length?`<div class="base-alert"><strong>Small sample:</strong> ${smallGroups.map(i=>`${esc(r.columns[i].label)} (n = ${r.base_unweighted[i]})`).join(', ')}. Values may be unstable. The n &lt; 100 flag is this project’s caution convention, not a statistical significance test.</div>`:'';
    const sectionName=r.publication==='main'?'Main demographic tables':'Generational appendix';
    const idNote=r.source_question_id!==r.question_id?` · printed as ${esc(r.source_question_id)}`:'';
    $('question-panel').innerHTML=`<div class="question-meta"><span class="tag">${esc(r.question_id.toUpperCase())}${idNote}</span><span class="tag">${sectionName}</span><span class="tag">PDF ${r.source_pages.length>1?'pages':'page'} ${r.source_pages.join(', ')}</span></div><p class="question-stem">${esc(r.prompt)}</p><h2>${esc(r.title)}</h2><p class="question-context">${esc(r.base_label)}. <span>Source base label: “${esc(r.source_base_label)}”.</span></p>${notes.length?`<div class="question-notes">${notes.map(n=>`<p>${esc(n)}</p>`).join('')}</div>`:''}<div class="controls"><label>View<select id="view-mode">${options([['distribution','Response distribution'],['compare','Compare published groups']],state.mode)}</select></label>${compare?`<label>Compare by<select id="dimension">${options(dims.map(d=>[d,d]),state.dimension)}</select></label><label class="full">Response to compare<select id="metric">${options(r.rows.map((row,i)=>[i,row.label]),metricIndex)}</select></label>`:`<label>Published group<select id="group">${groupOptions(r)}</select></label>`}</div>${caution}${charts}<p class="chart-table-note">Published rounded percentages. No rescaling or significance testing. A source dash is not converted to zero.${r.kind==='multiple'?' Multiple responses were allowed; the bars do not form a 100% total.':''}</p><div class="question-actions"><a class="button" href="${sourceLink(r.source_pages[0])}" target="_blank" rel="noopener">Open source PDF</a><button class="button secondary" id="download-table">Download this table</button><button class="button secondary" id="copy-link">Copy view link</button></div><p id="action-status" class="small" role="status"></p><details class="table-details"><summary>Exact values & base counts</summary><div class="data-scroll">${dataTable(r,displayedIndices)}</div><p class="small">This table includes every published response and net row for the displayed group(s). Net rows overlap their component categories.</p></details>`;
    $('view-mode').onchange=e=>update({mode:e.target.value});
    if(compare){$('dimension').onchange=e=>update({dimension:e.target.value});$('metric').onchange=e=>update({metric:e.target.value});}
    else $('group').onchange=e=>update({group:e.target.value});
    $('download-table').onclick=()=>download(`science-religion-${r.id}.csv`,csv([r]),'text/csv;charset=utf-8');
    $('copy-link').onclick=async()=>{
      history.replaceState(null,'',routeString(state));
      try{if(location.protocol==='file:'||!navigator.clipboard)throw new Error('local');await navigator.clipboard.writeText(location.href);$('action-status').textContent='View link copied.';}
      catch{$('action-status').textContent=location.protocol==='file:'?'This view is ready to share after the site is hosted. Its current address refers to your local file.':'Copy this view’s address from your browser: '+location.href;}
    };
  }
  function dataTable(r,indices) {
    return `<table class="data-table"><thead><tr><th scope="col">Published category</th>${indices.map(i=>`<th scope="col">${esc(r.columns[i].label)}</th>`).join('')}</tr></thead><tbody><tr><th scope="row">Unweighted n</th>${indices.map(i=>`<td>${number(r.base_unweighted[i])}</td>`).join('')}</tr><tr><th scope="row">Weighted base</th>${indices.map(i=>`<td>${number(r.base_weighted[i])}</td>`).join('')}</tr>${r.rows.map(row=>`<tr class="${row.is_net?'net-row':''}"><th scope="row">${esc(row.label)}</th>${indices.map(i=>`<td>${row.values[i]==null?'— (source dash)':percent(row.values[i])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }
  function csv(selected) {
    const lines=[['record_id','question_id','source_question_id','publication','question','dimension','group','response','published_value','percent','unweighted_n','weighted_base','source_page','source_url']];
    for(const r of selected)for(const row of r.rows)r.columns.forEach((c,i)=>lines.push([r.id,r.question_id,r.source_question_id,r.publication,r.title,c.dimension,c.label,row.label,row.raw[i],row.values[i],r.base_unweighted[i],r.base_weighted[i],row.page,sourceLink(row.page)]));
    return '\uFEFF'+lines.map(line=>line.map(cell=>'"'+String(cell??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
  }
  function download(filename,text,type) {
    const objectURL=URL.createObjectURL(new Blob([text],{type}));
    const a=document.createElement('a');a.href=objectURL;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(objectURL),30000);
  }
  $('topic').insertAdjacentHTML('beforeend',[...new Set(records.map(r=>r.topic))].sort().map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join(''));
  $('search').oninput=e=>update({search:e.target.value},{pick:true});
  $('topic').onchange=e=>update({topic:e.target.value},{pick:true});
  $('publication').onchange=e=>update({publication:e.target.value},{pick:true});
  $('matrix-metric').onchange=renderMatrix;
  $('source-links').innerHTML=Object.values(data.sources).map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>`).join('');
  $('download-json').onclick=()=>download('science-religion-survey.json',JSON.stringify(data,null,2)+'\n','application/json');
  $('download-all-csv').onclick=()=>download('science-religion-survey.csv',csv(records),'text/csv;charset=utf-8');
  document.querySelector('.skip').addEventListener('click',e=>{e.preventDefault();$('main').focus();$('main').scrollIntoView();});
  window.addEventListener('hashchange',readRoute);
  renderWording();renderMatrix();readRoute();
})();
