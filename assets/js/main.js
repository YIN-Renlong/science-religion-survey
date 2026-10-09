/* Visual findings first; source detail opens only on request or a direct source link. */
(function(){
  'use strict';
  const data=window.SURVEY_DATA;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const $=id=>document.getElementById(id);
  if(!data||!window.SURVEY_INSIGHTS||!window.SURVEY_REPORT||!window.SURVEY_VISUALS){
    $('wording-chart').textContent='The report could not load. Please check that the assets folder is beside index.html, or use the source and data links below.';
    return;
  }
  const report=window.SURVEY_REPORT.build(data,window.SURVEY_INSIGHTS);
  const findings=window.SURVEY_VISUALS.build(data);
  for(const [id,html] of [['wording-chart',report.wording],['finding-charts',findings.html],['question-charts',report.records],['topic-links',findings.toc],['all-breakdowns',report.appendix]])$(id).innerHTML=html;
  $('source-links').innerHTML=Object.values(data.sources).map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>`).join('');

  function csv(r){
    const lines=[['record_id','question_id','source_question_id','publication','question','dimension','group','response','published_value','percent','unweighted_n','weighted_base','source_page','source_url']];
    for(const row of r.rows)r.columns.forEach((c,i)=>lines.push([r.id,r.question_id,r.source_question_id,r.publication,r.title,c.dimension,c.label,row.label,row.raw[i],row.values[i],r.base_unweighted[i],r.base_weighted[i],row.page,data.sources.tables.url+'#page='+row.page]));
    return '\uFEFF'+lines.map(line=>line.map(cell=>'"'+String(cell??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
  }
  document.addEventListener('click',e=>{
    const button=e.target.closest('button[data-download-record]');
    if(!button)return;
    const r=data.records.find(record=>record.id===button.dataset.downloadRecord);
    if(!r)return;
    const url=URL.createObjectURL(new Blob([csv(r)],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=`science-religion-${r.id}.csv`;document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
    $('download-status').textContent=`CSV download requested for ${r.question_id}, ${r.publication==='main'?'main tables':'generational appendix'}.`;
  });
  document.querySelector('.skip').addEventListener('click',e=>{e.preventDefault();$('main').focus();$('main').scrollIntoView();});

  // Keep previously shared explorer URLs useful after removing selection controls.
  function resolveAnchor(){
    let hash;
    try{hash=decodeURIComponent(location.hash.slice(1));}catch(_){return;}
    if(!hash)return;
    const aliases={sciences:'difficulty-a',questions:'question-archive','science-agree':'difficulty-a','science-disagree':'difficulty-a','science-unknown':'uncertainty','science-neutral':'difficulty-a'};
    let id=aliases[hash]||hash;
    if(hash==='explorer'||hash.startsWith('explorer?')){
      const params=new URLSearchParams(location.hash.split('?')[1]||'');
      const requested=params.get('q')||(!params.has('topic')&&!params.has('publication')?'q3_1__main':null);
      const r=data.records.find(record=>record.id===requested);
      if(r){id=(params.get('mode')==='compare'||(params.has('group')&&!['0','total'].includes(params.get('group')))?'table-':'q-')+r.id;}
      else if(params.get('publication')==='generations'){id='topic-generations';}
      else {const topic=window.SURVEY_REPORT.topics.find(t=>t[1]===params.get('topic'));id=topic?'topic-'+topic[0]:'questions';}
      history.replaceState(null,'','#'+id);
    }
    const target=document.getElementById(id);
    if(target){reveal(target);target.scrollIntoView({block:'start'});}
  }
  function reveal(target){
    if(target.tagName==='DETAILS')target.open=true;
    for(let parent=target.parentElement;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
  }
  document.addEventListener('click',e=>{
    const close=e.target.closest('button[data-close-detail]');
    if(close){$(close.dataset.closeDetail).open=false;location.hash='findings';$('findings').scrollIntoView();$('findings').focus({preventScroll:true});return;}
    const link=e.target.closest('a[href^="#"]');
    if(!link)return;
    let target;
    try{target=document.getElementById(decodeURIComponent(link.getAttribute('href').slice(1)));}catch(_){return;}
    if(target)reveal(target);
  });
  window.addEventListener('hashchange',resolveAnchor);
  requestAnimationFrame(resolveAnchor);
})();
