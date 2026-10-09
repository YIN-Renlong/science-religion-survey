/* Comparisons built only from published percentages. No reconstructed nets. */
(function(root){
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=n=>n==null?'Not published':n.toLocaleString('en-GB');
  const pct=n=>n==null?'—':n+'%';
  const agree=/^Net: Strongly agree/;
  const disagree=/^Net: Disagree/;
  const subjects=[['1','Big Bang'],['2','Neuroscience'],['3','Medical science'],['5','Psychology'],['6','Astronomy & cosmology'],['7','Chemistry'],['8','Climate science'],['9','Geology']];
  function point(r,pattern,col=0){
    const ri=r.rows.findIndex(row=>pattern.test(row.label));
    if(ri<0)throw new Error(`Missing published response: ${r.id} / ${pattern}`);
    return {r,ri,col,value:r.rows[ri].values[col],label:r.rows[ri].label,key:`${r.id}:${ri}:${col}`};
  }
  const audit=p=>`data-viz-cell="${p.key}" data-viz-value="${p.value??''}"`;
  const exactLink=(r,label)=>`<a href="#q-${r.id}" title="Read the exact question and all responses">${esc(label)}</a>`;
  function rest(r,col=0,kind='opinion'){
    const definitions=kind==='risk'?[[/^The risks and benefits/,'About the same'],[/^I don't know what this is$/,'Not familiar']]:[[/^Neither/,'Neither'],[/^Don't know$/,'Don’t know']];
    return definitions.map(([pattern,label])=>{const p=point(r,pattern,col);return `<span ${audit(p)}>${label}: ${pct(p.value)}</span>`;}).join('');
  }
  function balance(rows,leftLabel='Agree / strongly agree',rightLabel='Disagree / strongly disagree',type='opinion'){
    return `<div class="balance-chart ${type==='compatibility'?'compatibility-balance':''}"><div class="balance-legend"><span><i class="swatch ${type==='compatibility'?'negative':'positive'}"></i>${esc(leftLabel)}</span><span><i class="swatch ${type==='compatibility'?'positive':'negative'}"></i>${esc(rightLabel)}</span></div><div class="balance-axis" aria-hidden="true"><div><span>100%</span><span>50%</span><span>0</span></div><div><span></span><span>50%</span><span>100%</span></div></div>${rows.map(row=>`<div class="balance-row${row.highlight?' focal':''}"><p class="comparison-label">${exactLink(row.r,row.label)}${row.tag?`<span class="finding-tag">${esc(row.tag)}</span>`:''}${row.n!=null?`<small>n = ${fmt(row.n)}</small>`:''}</p><div class="balance-lanes" role="group" aria-label="${esc(row.label)}"><div class="balance-lane left-lane"><span class="balance-fill" style="width:${row.left.value??0}%" aria-hidden="true"></span><span class="balance-value${row.left.value>88?' inside':''}" style="right:${row.left.value>88?4:row.left.value??0}%" ${audit(row.left)} aria-label="${esc(leftLabel)}: ${pct(row.left.value)}">${pct(row.left.value)}</span></div><div class="balance-lane right-lane"><span class="balance-fill" style="width:${row.right.value??0}%" aria-hidden="true"></span><span class="balance-value${row.right.value>88?' inside':''}" style="left:${row.right.value>88?4:row.right.value??0}%" ${audit(row.right)} aria-label="${esc(rightLabel)}: ${pct(row.right.value)}">${pct(row.right.value)}</span></div></div>${row.rest?`<p class="other-responses">${row.rest}</p>`:''}</div>`).join('')}</div>`;
  }
  function ranked(rows){
    return `<div class="rank-chart"><div class="rank-axis" aria-hidden="true"><span>0</span><span>25</span><span>50</span><span>75</span><span>100%</span></div>${rows.map((row,i)=>`<div class="rank-row${i===0?' focal':''}"><p class="comparison-label">${exactLink(row.r,row.label)}${i===0?'<span class="finding-tag">Highest share</span>':''}</p><div class="rank-track"><span class="rank-fill" style="width:${row.p.value??0}%" aria-hidden="true"></span><span class="rank-value" style="left:${Math.min(row.p.value??0,91)}%" ${audit(row.p)}>${pct(row.p.value)}</span></div></div>`).join('')}</div>`;
  }
  function references(records,data,extra='',labelLinks=true){
    const unique=[...new Map(records.map(r=>[r.id,r])).values()];
    const pages=[...new Set(unique.flatMap(r=>r.source_pages))].sort((a,b)=>a-b);
    const ns=unique.map(r=>r.base_unweighted[0]).filter(n=>n!=null);
    const pageText=pages.length>1&&pages.every((v,i)=>i===0||v===pages[i-1]+1)?pages[0]+'–'+pages[pages.length-1]:pages.join(', ');
    const nText=ns.length?(Math.min(...ns)===Math.max(...ns)?`Unweighted question base: n = ${fmt(ns[0])}.`:`Unweighted question bases: n = ${fmt(Math.min(...ns))}–${fmt(Math.max(...ns))}.`):'Bases are not published.';
    return `<p class="figure-source">${nText} ${esc(extra)} <a href="${data.sources.tables.url}#page=${pages[0]}" target="_blank" rel="noopener">Source: PDF ${pages.length===1?'page':'pages'} ${pageText}</a>. ${labelLinks?'Chart labels open the complete question details.':'<a href="#topic-specific-sciences">Full science questions and response distributions</a>.'}</p>`;
  }
  function card(id,kicker,title,deck,plot,note,source){
    return `<article class="finding-card" id="${id}" data-finding="${id}" aria-labelledby="${id}-title"><p class="eyebrow">${esc(kicker)}</p><h2 id="${id}-title">${esc(title)}</h2><p class="finding-deck">${esc(deck)}</p><figure aria-labelledby="${id}-title">${plot}<figcaption>${esc(note)}</figcaption></figure>${source}<a class="back-link" href="#contents">Back to contents</a></article>`;
  }
  function build(data){
    const byId=new Map(data.records.map(r=>[r.id,r]));
    const record=id=>byId.get(id+'__main');
    let html='';
    const menu=[];
    function add(id,label,markup){menu.push([id,label]);html+=markup;}

    const wordings=[['a','Be religious'],['b','Be a Christian'],['c','Be a Muslim'],['d','Be an atheist']];
    const rangeGroups=wordings.map(([letter,label])=>{
      const points=subjects.map(([i,science])=>({p:point(record(`q8${letter}_${i}`),/^Don't know$/),science}));
      const values=points.map(x=>x.p.value);
      return {label,letter,points,low:Math.min(...values),high:Math.max(...values)};
    });
    const uncertainty=`<div class="uncertainty-chart"><div class="rank-axis" aria-hidden="true"><span>0</span><span>25</span><span>50</span><span>75</span><span>100%</span></div>${rangeGroups.map(g=>`<div class="range-row${g.letter==='c'?' focal':''}"><p class="comparison-label">${esc(g.label)}<strong>${g.low}–${g.high}% don’t know</strong></p><div class="range-track" role="img" aria-label="${esc(g.label)}: don't-know responses range from ${g.low}% to ${g.high}% across eight sciences"><span class="range-band" style="left:${g.low}%;width:${g.high-g.low}%"></span>${g.points.map((x,i)=>`<span class="range-dot" style="left:${x.p.value}%;top:${5+i*4}px" ${audit(x.p)} title="${esc(x.science)}: ${pct(x.p.value)}"></span>`).join('')}</div></div>`).join('')}</div>`;
    add('uncertainty','Uncertainty changes with the wording',card('uncertainty','02 / UNCERTAINTY','Around half answered “don’t know” to questions about being a Muslim.','Across all eight sciences, statements about being a Muslim have a much higher don’t-know share. Each dot is one published science question.',uncertainty,'The band spans the lowest and highest published percentages; it is not a confidence interval. These are questions about different positions, not groups of respondents identified by religion.',references(rangeGroups.flatMap(g=>g.points.map(x=>x.p.r)),data,'',false)));

    let scienceCharts='';
    wordings.forEach(([letter,label],i)=>{
      let rows=subjects.map(([n,science])=>{const r=record(`q8${letter}_${n}`);return {r,label:science,left:point(r,agree),right:point(r,disagree),rest:rest(r)};}).sort((a,b)=>b.left.value-a.left.value);
      const moreDisagree=rows.filter(row=>row.right.value>row.left.value).length;
      const high=rows[0].left.value;
      rows=rows.map(row=>({...row,highlight:row.left.value===high,tag:row.left.value===high?'Most agreement':''}));
      const title=letter==='a'?'For “being religious”, the Big Bang draws the most agreement.':letter==='b'?`For “being a Christian”, disagreement is higher in ${moreDisagree} of 8 sciences.`:letter==='c'?'For “being a Muslim”, agreement stays between 8% and 17%.':'For “being an atheist”, disagreement reaches 54–56% across the sciences.';
      scienceCharts+=card(`difficulty-${letter}`,`03${String.fromCharCode(65+i)} / SCIENCE & “${label.toUpperCase()}”`,title,`Responses to statements that a particular science makes it harder to ${label.toLowerCase()}. Sciences are ordered by agreement.`,balance(rows),`Both bars start at zero in the centre and use a 0–100% scale. Neutral and don’t-know answers remain separate below each pair.${letter==='a'?' Six of the eight statements receive more disagreement than agreement; astronomy and cosmology is tied at 36%.':''}`,references(rows.map(x=>x.r),data,letter==='d'?'The source base label says “faith”, although these statements concern atheism.':''));
    });
    add('difficulty-a','Particular sciences: four wording comparisons',scienceCharts);

    const scienceIds=['q1_8','q1_5','q1_2','q1_3','q1_4','q1_10','q5_12','q5_6'];
    const scienceRows=scienceIds.map(id=>{const r=record(id);return {r,label:r.title,left:point(r,agree),right:point(r,disagree),rest:rest(r),highlight:['q1_8','q1_3'].includes(id)};});
    add('science-limits','The reach and limits of science',card('science-limits','04 / THE REACH OF SCIENCE','64% agree there are things science will never explain.','The survey also records broad confidence in science’s value. These separate statements reveal a more nuanced picture than a single “pro-science” score.',balance(scienceRows),'Published net agreement and disagreement are shown separately. These aggregate results do not reveal which individuals hold each combination of views.',references(scienceRows.map(x=>x.r),data)));

    const names={'q6_1':'Evolution','q6_2':'Big Bang','q6_3':'Medical science','q6_5':'Chemistry','q6_7':'Psychology','q6_8':'Neuroscience','q6_9':'Ecology','q6_10':'Geology'};
    const confidence=Object.entries(names).map(([id,label])=>{const r=record(id);return {r,label,p:point(r,/^Net: Very \/ fairly confident$/)};}).sort((a,b)=>b.p.value-a.p.value);
    add('confidence','Confidence in understanding science',card('confidence','05 / SELF-REPORTED UNDERSTANDING','Confidence is highest for evolution, lowest for neuroscience.','73% say they are very or fairly confident they understand the basics of evolution, compared with 40% for neuroscience.',ranked(confidence),'The bars show the published “very / fairly confident” net on a common 0–100% scale. This is a self-assessment, not a knowledge test.',references(confidence.map(x=>x.r),data)));

    const evolutionIds=['q9_2','q9_3','q9_1','q9_8','q9_4','q9_7','q9_9','q9_6','q9_12'];
    const evolution=evolutionIds.map(id=>{const r=record(id);return {r,label:r.title,left:point(r,agree),right:point(r,disagree),rest:rest(r),highlight:['q9_1','q9_6','q9_12'].includes(id),tag:id==='q9_6'||id==='q9_12'?'Near-even agree / disagree':''};});
    add('evolution','Evolution, origins and explanation',card('evolution','06 / EVOLUTION & ORIGINS','Strong support for evolutionary evidence; close splits on morality and consciousness.','74% agree there is strong, reliable evidence for evolution. Agreement and disagreement differ by only one percentage point on each of the two claims about explanatory limits.',balance(evolution),'Read each statement’s direction: agreeing that humans evolved is different from agreeing that evolution cannot explain morality. Question bases differ, and a one-point difference is not evidence of statistical significance.',references(evolution.map(x=>x.r),data)));

    const religion=['q2c_8','q2c_4','q2c_6'].map(id=>{const r=record(id);return {r,label:r.title,left:point(r,agree),right:point(r,disagree),rest:rest(r)};});
    add('religion','Views of religion',card('religion','07 / VIEWS OF RELIGION','Half disagree with comparing religion to smallpox.','50% disagree with that statement, compared with 20% who agree. Other questions ask about spiritual identity and elements of truth in religions.',balance(religion),'These are responses to the survey’s statements, including its provocative wording. The statements are not conclusions of this visualisation.',references(religion.map(x=>x.r),data)));

    const technology=Array.from({length:7},(_,i)=>{const r=record(`q11_${i+1}`);return {r,label:r.title,left:point(r,/^Net: Benefits outweigh risk$/),right:point(r,/^Net: Risks outweigh benefits$/),rest:rest(r,0,'risk')};}).sort((a,b)=>b.left.value-a.left.value);
    add('technology','Perceived benefits and risks',card('technology','08 / TECHNOLOGY & RISK','Vaccination and renewable energy have the clearest positive balance.','86% say vaccination’s benefits outweigh its risks; 82% say this of renewable energy. Perceptions of nuclear power and GM crops are much more closely divided.',balance(technology,'Benefits outweigh risks','Risks outweigh benefits'),'“Not familiar” reproduces “I don’t know what this is”; it is not a general don’t-know category. These are public perceptions in 2021, not assessments of actual safety.',references(technology.map(x=>x.r),data)));

    const ageRecord=record('q3_1');
    const ages=ageRecord.columns.map((c,i)=>({c,i})).filter(x=>x.c.dimension==='Age').map(({c,i})=>({r:ageRecord,label:c.label,left:point(ageRecord,/^Net: Incompatible$/,i),right:point(ageRecord,/^Net: Compatible$/,i),n:ageRecord.base_unweighted[i],rest:`<span ${audit(point(ageRecord,/^Don't know$/,i))}>Don’t know: ${pct(point(ageRecord,/^Don't know$/,i).value)}</span>`}));
    add('age','Compatibility across age groups',card('age','09 / AGE & COMPATIBILITY','Incompatibility exceeds compatibility in every published age band.','For the general science-and-religion question, the incompatible share ranges from 52% to 61%. The pattern does not increase steadily with age.',balance(ages,'Incompatible (1–5)','Compatible (6–10)','compatibility'),'These are age groups in the 2021 sample, not changes tracked over time. The source describes an 18+ population but labels its youngest band 16–29; that printed label is retained.',references([ageRecord],data,'Each group’s actual n is shown beside its age band.')));

    const qualificationScience=record('q24_1'),qualificationReligion=record('q24_2');
    const qualificationLabels=['No qualification','GCSE / Scottish Standard Grade','A Levels / Scottish Highers / IB','Undergraduate degree / technical qualification','Master’s degree','Doctorate (Ph.D)','Not sure'];
    const qualifications=`<div class="qualification-chart"><div class="legend"><span><i class="swatch positive"></i>Science qualifications</span><span><i class="swatch negative"></i>Religion qualifications</span></div><div class="rank-axis" aria-hidden="true"><span>0</span><span>25</span><span>50</span><span>75</span><span>100%</span></div>${qualificationLabels.map((label,i)=>`<div class="qualification-group${i===0?' focal':''}"><p class="comparison-label">${esc(label)}${i===0?'<span class="finding-tag">35-point gap</span>':''}</p>${[qualificationScience,qualificationReligion].map((r,j)=>{const row=r.rows[i],p={r,ri:i,col:0,value:row.values[0],key:`${r.id}:${i}:0`};return `<div class="qualification-lane"><span class="qualification-name">${j?'Religion':'Science'}</span><div class="rank-track"><span class="rank-fill ${j?'religion-fill':''}" style="width:${p.value??0}%" aria-hidden="true"></span><span class="rank-value" style="left:${Math.min(p.value??0,91)}%" ${audit(p)}>${pct(p.value)}</span></div></div>`;}).join('')}</div>`).join('')}</div>`;
    add('qualifications','Reported qualifications',card('qualifications','10 / EDUCATIONAL BACKGROUND','No qualification reported: 55% in religion, 20% in science.','Each pair compares the same qualification category. The pattern is clearest at the “no qualification” level.',qualifications,'Qualification levels are self-reported and use the source’s categories. Rounded percentages are not rescaled to sum to 100; a published 0% remains visible.',references([qualificationScience,qualificationReligion],data).replace('Chart labels open the complete question details.','')+`<p class="figure-source">Full questions: ${exactLink(qualificationScience,'science qualifications')} · ${exactLink(qualificationReligion,'religion qualifications')}.</p>`));

    return {html,toc:menu.map(([id,label])=>`<li><a href="#${id}">${esc(label)}</a></li>`).join('')};
  }
  root.SURVEY_VISUALS=Object.freeze({build});
})(typeof window==='undefined'?globalThis:window);
