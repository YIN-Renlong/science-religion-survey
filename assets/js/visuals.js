/* Ten presentation figures. Positions, lengths and colours use published totals only. */
(function(root){
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=n=>n==null?'Not published':n.toLocaleString('en-GB');
  const agree=/^Net: Strongly agree/,disagree=/^Net: Disagree/;
  const subjects=[['1','Big Bang'],['2','Neuroscience'],['3','Medical science'],['5','Psychology'],['6','Astronomy & cosmology'],['7','Chemistry'],['8','Climate science'],['9','Geology']];
  const wordings=[['a','Religious'],['b','Christian'],['c','Muslim'],['d','Atheist']];
  function point(r,pattern){
    const ri=r.rows.findIndex(row=>pattern.test(row.label));
    if(ri<0)throw new Error(`Missing source row: ${r.id} / ${pattern}`);
    const value=r.rows[ri].values[0];
    if(value==null)throw new Error(`A source dash cannot be plotted as zero: ${r.id}`);
    return {r,ri,value,key:`${r.id}:${ri}:0`};
  }
  const audit=p=>`data-viz-cell="${p.key}" data-viz-value="${p.value}"`;
  const link=(r,label)=>`<a href="#q-${r.id}" title="Exact wording and full responses">${esc(label)}</a>`;
  const axis=()=>'<div class="plot-axis" aria-hidden="true"><span>0</span><span>25</span><span>50</span><span>75</span><span>100%</span></div>';
  const opinionLegend=()=>'<div class="viz-legend"><span><i class="dot-key"></i>Agree / strongly agree</span><span><i class="diamond-key"></i>Disagree / strongly disagree</span></div>';
  const parts=[['positive',agree,'Agree'],['negative',disagree,'Disagree'],['neutral',/^Neither/,'Neither'],['unknown',/^Don\x27t know$/,'Don’t know']];
  function paired(rows){
    return opinionLegend()+`<div class="paired-chart">${axis()}${rows.map(row=>{
      const a=point(row.r,agree),d=point(row.r,disagree);
      return `<div class="dot-row${row.focal?' focal':''}"><div class="viz-label">${link(row.r,row.label)}</div><div class="dot-track${a.value===d.value?' coincident':''}" role="img" aria-label="${esc(row.label)}: ${a.value}% agree, ${d.value}% disagree"><span class="dot-join" style="left:${Math.min(a.value,d.value)}%;width:${Math.abs(a.value-d.value)}%"></span><span class="plot-point agree-point" style="left:${a.value}%"></span><span class="plot-point disagree-point" style="left:${d.value}%"></span><span class="point-value agree-value" style="left:${a.value}%" ${audit(a)}>${a.value}%</span><span class="point-value disagree-value" style="left:${d.value}%" ${audit(d)}>${d.value}%</span></div></div>`;
    }).join('')}</div>`;
  }
  function source(records,data,extra=''){
    const unique=[...new Map(records.map(r=>[r.id,r])).values()];
    const pages=[...new Set(unique.flatMap(r=>r.source_pages))].sort((a,b)=>a-b);
    const ns=unique.map(r=>r.base_unweighted[0]);
    const n=Math.min(...ns)===Math.max(...ns)?fmt(ns[0]):fmt(Math.min(...ns))+'–'+fmt(Math.max(...ns));
    const pageText=pages.length>1&&pages.every((v,i)=>!i||v===pages[i-1]+1)?pages[0]+'–'+pages.at(-1):pages.join(', ');
    return `<p class="figure-source">Unweighted question ${unique.length===1?'base':'bases'}: n = ${n}. ${esc(extra)} <a href="${esc(data.sources.tables.url)}#page=${pages[0]}" target="_blank" rel="noopener">Source tables, ${pages.length===1?'p.':'pp.'} ${pageText}</a> · ${link(unique[0],'Full question details')}</p>`;
  }
  function build(data){
    const lookup=new Map(data.records.map(r=>[r.id,r]));
    const record=id=>{const r=lookup.get(id+'__main');if(!r)throw new Error('Missing record '+id);return r;};
    const panels=[];
    function add(id,short,chapter,title,intro,plot,note,takeaway,records,extra=''){
      const number=String(panels.length+1).padStart(2,'0');
      const html=`<article class="story-card" id="${id}" data-finding="${id}" aria-labelledby="${id}-title"><div class="story-meta"><span class="figure-number">${number}<span> / 10</span></span><span>${esc(chapter)}</span><a href="#contents" aria-label="Return to the ten-figure outline">↑ Outline</a></div><h2 id="${id}-title">${esc(title)}</h2><p class="story-intro">${esc(intro)}</p><figure aria-labelledby="${id}-title">${plot}<figcaption>${esc(note)}</figcaption></figure><div class="takeaway"><span>THE TAKEAWAY</span><p>${esc(takeaway)}</p></div>${source(records,data,extra)}</article>`;
      panels.push({id,short,number,html});
    }
    const comp=[['q3_1','Religion'],['q4a_1','Faith'],['q4b_1','Christianity'],['q4c_1','Islam']].map(([id,label])=>({r:record(id),label}));
    const compLegend='<div class="viz-legend"><span><i class="swatch negative"></i>Incompatible (1–5)</span><span><i class="swatch positive"></i>Compatible (6–10)</span><span><i class="swatch unknown"></i>Don’t know</span></div>';
    const compPlot=compLegend+`<div class="composition-chart">${comp.map(({r,label})=>{
      const ps=[point(r,/^Net: Incompatible$/),point(r,/^Net: Compatible$/),point(r,/^Don't know$/)];
      return `<div class="composition-row"><div class="composition-label">${link(r,label)}<small>n = ${fmt(r.base_unweighted[0])}</small></div><div class="composition-track" role="img" aria-label="${label}: ${ps[0].value}% incompatible, ${ps[1].value}% compatible, ${ps[2].value}% don't know">${ps.map((p,i)=>`<span class="${['negative','positive','unknown'][i]}" style="width:${p.value}%" ${audit(p)}>${p.value}%</span>`).join('')}</div></div>`;
    }).join('')}</div>`;
    add('compatibility','Compatibility','Words & perceptions','“Faith” is seen as more compatible with science than “religion”.','Begin with the broad question. The survey asked how compatible science is with four differently worded subjects.',compPlot,'Published nets on the 1–10 scale; there is no neutral midpoint. These are question wordings, not respondents’ religious identities.','41% choose the compatible half of the scale for “faith”, compared with 30% for “religion”. The 11-point difference is descriptive: the question bases differ.',comp.map(x=>x.r));

    const difficulty=subjects.map(([n,label])=>({r:record('q8a_'+n),label})).sort((a,b)=>point(b.r,agree).value-point(a.r,agree).value);
    difficulty[0].focal=true;
    add('difficulty-a','Particular sciences','From the general to the specific','The Big Bang stands out; most other sciences draw more disagreement.','Does each science make it harder to be religious? Compare agreement with disagreement for all eight statements.',paired(difficulty),'Each pair shares a 0–100% axis. Neutral and don’t-know responses are retained in the full question details.','The Big Bang is the only one of these eight statements with more agreement than disagreement (38% versus 31%). Six lean the other way; astronomy and cosmology is tied at 36%.',difficulty.map(x=>x.r));

    const heatRows=subjects.map(([n,label])=>({label,points:wordings.map(([letter])=>point(record(`q8${letter}_${n}`),agree))}));
    const heatColour=v=>{const t=v/50;return '#'+[232,244,240].map((start,i)=>Math.round(start+([5,91,82][i]-start)*t).toString(16).padStart(2,'0')).join('');};
    const heat=`<div class="heat-scale"><span>Agreement</span><span>0%</span><i></i><span>50%</span><small>Darker = more agreement</small></div><div class="heatmap" role="group" aria-label="Agreement that each science makes a position harder to hold"><div class="heat-head"><span>Science</span>${wordings.map(([,w])=>`<span>${w}</span>`).join('')}</div>${heatRows.map(row=>`<div class="heat-row"><span class="heat-label">${esc(row.label)}</span>${row.points.map((p,j)=>`<a class="heat-cell${j===0?' heat-focus':''}" href="#q-${p.r.id}" style="background:${heatColour(p.value)};color:${p.value>=37?'#fff':'#00100c'}" ${audit(p)} aria-label="${esc(row.label)}, harder to be ${wordings[j][1].toLowerCase()}: ${p.value}% agree. Full question.">${p.value}%</a>`).join('')}</div>`).join('')}</div>`;
    add('wording-comparison','Wording matters','Four ways to ask','“Being religious” draws the most agreement in every science.','Compare the same “makes it harder to be…” statement across religious, Christian, Muslim and atheist wordings.',heat,'Colour uses a fixed 0–50% scale. Each cell is a separate published question total; no questions are pooled or averaged.','The first column is darkest in all eight rows. But lower agreement can mean disagreement, neutrality or uncertainty. The next figure separates out “don’t know”.',heatRows.flatMap(row=>row.points.map(p=>p.r)),'The atheist items’ source base label says “faith”.');

    const ranges=wordings.map(([letter,label])=>{const ps=subjects.map(([n,science])=>({science,p:point(record(`q8${letter}_${n}`),/^Don't know$/)}));return {letter,label,ps,low:Math.min(...ps.map(x=>x.p.value)),high:Math.max(...ps.map(x=>x.p.value))};});
    const range=`<div class="interval-chart">${axis()}${ranges.map(g=>`<div class="interval-row${g.letter==='c'?' focal':''}"><div class="viz-label">${g.label}<strong>${g.low}–${g.high}% don’t know</strong></div><div class="interval-track"><span class="interval-band" style="left:${g.low}%;width:${g.high-g.low}%"></span>${g.ps.map((x,i)=>`<a class="interval-dot" style="left:${x.p.value}%;top:${7+i*4}px" href="#q-${x.p.r.id}" ${audit(x.p)} title="${esc(x.science)}: ${x.p.value}% don’t know" aria-label="${g.label}, ${esc(x.science)}: ${x.p.value}% don't know. Full question."></a>`).join('')}</div></div>`).join('')}</div>`;
    add('uncertainty','Uncertainty','What lower agreement can conceal','Around half answer “don’t know” to the Muslim wording.','Each row contains eight dots, one for each science. Their horizontal positions show the share choosing “don’t know”.',range,'Bands show the minimum–maximum across eight questions, not confidence intervals. Vertical spacing only separates the dots.','For statements about being a Muslim, 49–52% choose “don’t know”; the other wordings stay between 9% and 19%. Uncertainty is a major part of the response.',ranges.flatMap(g=>g.ps.map(x=>x.p.r)),'These are wording groups, not religious identity groups.');

    const names=[['q6_1','Evolution'],['q6_2','Big Bang'],['q6_3','Medical science'],['q6_5','Chemistry'],['q6_7','Psychology'],['q6_8','Neuroscience'],['q6_9','Ecology'],['q6_10','Geology']];
    const confidence=names.map(([id,label])=>({label,p:point(record(id),/^Net: Very \/ fairly confident$/)})).sort((a,b)=>b.p.value-a.p.value);
    const lollipop=`<div class="lollipop-chart">${axis()}${confidence.map((row,i)=>`<div class="lollipop-row${i===0||i===7?' focal':''}"><div class="viz-label">${link(row.p.r,row.label)}</div><div class="lollipop-track"><span class="lollipop-stem" style="width:${row.p.value}%"></span><span class="lollipop-dot" style="left:${row.p.value}%"></span><strong style="left:${row.p.value}%" ${audit(row.p)}>${row.p.value}%</strong></div></div>`).join('')}</div>`;
    add('confidence','Understanding','The knowledge people feel they have','Confidence is highest for evolution, lowest for neuroscience.','How confident are respondents that they understand the basics? Dots show the published “very / fairly confident” total.',lollipop,'All eight disciplines use the same 0–100% axis. Confidence is self-reported; this is not a test of scientific knowledge.','73% feel confident about evolution, compared with 40% for neuroscience: a 33-point spread. This describes perceived understanding, without establishing how knowledge relates to belief.',confidence.map(x=>x.p.r));

    const scope=[['q1_4','The dangers of science outweigh its benefits'],['q1_2','Science is the only way to reliable knowledge'],['q1_8','Some things science will never explain'],['q1_3','Science will explain everything one day']].map(([id,label])=>({r:record(id),label}));
    add('science-limits','Science’s reach','Value, knowledge & explanation','Science’s value and its explanatory reach draw different responses.','These statements ask about different things: the value of science, reliable knowledge, and the limits of explanation.',paired(scope),'Agree and disagree are published nets. Neutral and don’t-know responses are in the full question details. Labels are shortened.','65% reject the claim that science’s dangers outweigh its benefits. Meanwhile, 64% agree some things will never be explained by science. These aggregate totals do not identify who holds both views.',scope.map(x=>x.r));

    const evolution=[['q9_8','The Earth is billions of years old'],['q9_3','Humans developed from simpler life forms'],['q9_1','There is strong, reliable evidence for evolution'],['q9_9','God created the universe, Earth and all life within the past 10,000 years']].map(([id,label])=>({r:record(id),label}));
    add('evolution','Evolution & origins','What attracts broad agreement','Evolution and an ancient Earth attract broad agreement.','Place the evidence and origins questions together. Read each statement’s direction before comparing the dots.',paired(evolution),'Agreement and disagreement are shown; neutral and don’t-know responses remain in the question details. Question bases differ.','74% agree there is strong, reliable evidence for evolution; 81% agree the Earth is billions of years old. Keep the survey’s specific 10,000-year wording in mind when discussing the creation statement.',evolution.map(x=>x.r));

    const limits=[['q9_6','Evolution cannot explain morality'],['q9_12','Evolution cannot explain human consciousness']].map(([id,label])=>({r:record(id),label}));
    const responseLegend='<div class="viz-legend">'+parts.map(([cl,,label])=>`<span><i class="swatch ${cl}"></i>${label}</span>`).join('')+'</div>';
    const limitsPlot=responseLegend+`<div class="composition-chart limits-chart">${limits.map(({r,label})=>`<div class="composition-row"><div class="composition-label">${link(r,label)}</div><div class="composition-track" role="img" aria-label="${esc(label)}. ${parts.map(([,pattern,name])=>`${name} ${point(r,pattern).value}%`).join(', ')}">${parts.map(([cl,pattern])=>{const p=point(r,pattern);return `<span class="${cl}" style="width:${p.value}%" ${audit(p)}>${p.value}%</span>`;}).join('')}</div></div>`).join('')}</div>`;
    add('explanation','Explanatory limits','Evidence & explanation are different questions','Morality and consciousness produce almost even splits.','The survey separately asked whether evolution cannot explain morality or human consciousness. Here, all response categories are visible.',limitsPlot,'Agree/disagree include “strongly”. The morality row totals 99% after source rounding; it is not rescaled to 100%.','Agreement and disagreement are just one point apart on each statement. Neutral and don’t-know answers are substantial, so neither claim commands a majority. A one-point gap is not evidence of statistical significance.',limits.map(x=>x.r));

    const ethics=record('q1_10'),ethicsParts=parts.map(([cl,pattern,label])=>({cl,label,p:point(ethics,pattern)}));
    const waffle=`<div class="waffle" role="img" aria-label="Science has nothing to say about ethics: 24% agree, 38% disagree, 31% neither, 7% don't know">${ethicsParts.map(({cl,p})=>Array.from({length:p.value},()=>`<i class="waffle-cell ${cl}" aria-hidden="true"></i>`).join('')).join('')}</div><div class="waffle-key">${ethicsParts.map(({cl,label,p})=>`<span><i class="swatch ${cl}"></i><strong ${audit(p)}>${p.value}%</strong> ${label}</span>`).join('')}</div>`;
    add('ethics','Science & ethics','A question for the classroom','More reject a separation from ethics than endorse it.','Responses to the exact statement: “Science has nothing to say about ethics.”',waffle,'Each square represents one percentage point, not one respondent. Agree and disagree include their “strongly” categories.','38% disagree, compared with 24% who agree; 31% choose neither. The largest share gives science some role in ethics, but there is no majority for either side.',[ethics]);

    const religion=[['q2c_8','Humans are at heart spiritual beings'],['q2c_4','All religions have some element of truth'],['q2c_6','Religion is comparable to smallpox, but harder to eradicate']].map(([id,label])=>({r:record(id),label}));
    add('religion','Views of religion','Beyond a single conflict story','Half reject the survey’s comparison of religion to smallpox.','End with three different views of religion. They show how much a broad label can leave out.',paired(religion),'These are survey statements, including a provocative comparison. Neutral and don’t-know shares remain in the question details.','50% reject the smallpox comparison; 49% describe humans as spiritual and 46% see some truth in all religions. These separate totals add texture to the broad compatibility question we began with.',religion.map(x=>x.r));

    return {html:panels.map(p=>p.html).join(''),toc:panels.map(p=>`<li><a href="#${p.id}"><span>${p.number}</span>${esc(p.short)}</a></li>`).join('')};
  }
  root.SURVEY_VISUALS=Object.freeze({build});
})(typeof window==='undefined'?globalThis:window);
