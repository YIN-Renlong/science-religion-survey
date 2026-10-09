/* Descriptive readings of published, rounded percentages. No statistical inference or imputation. */
(function (root) {
  'use strict';
  const numeric = value => typeof value === 'number' && Number.isFinite(value);
  const quote = label => `“${label}”`;
  const list = items => items.length < 3 ? items.join(' and ') : items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
  const gapText = n => `${n} percentage point${n === 1 ? '' : 's'}`;
  const cleanNet = label => label.replace(/^net\s*:?\s*/i, '');
  const unknown = label => /don't know|not sure|know what this is/i.test(label);

  function distribution(record, index) {
    const rows = record.rows.filter(row => !row.is_net && numeric(row.values[index]));
    if (!rows.length) return { title: 'No numeric result to summarise', body: 'Source dashes are retained; no percentage is inferred.', highlight: [] };
    const highest = Math.max(...rows.map(row => row.values[index]));
    const leaders = rows.filter(row => row.values[index] === highest);
    const names = leaders.length <= 3 ? list(leaders.map(row => quote(row.label))) : `${leaders.length} response categories`;
    let body = leaders.length === 1 ? `${names} has the highest published share (${highest}%).` : `${names} share the highest published percentage (${highest}% each).`;
    const uncertain = rows.filter(row => unknown(row.label) && !leaders.includes(row));
    if (uncertain.length) body += ' ' + uncertain.map(row => `${quote(row.label)} is ${row.values[index]}%.`).join(' ');
    if (record.kind === 'multiple') body += ' Multiple responses were allowed; these shares overlap.';
    return { title: leaders.length > 1 ? `Joint highest: ${highest}%` : `Highest published share: ${highest}%`, body, highlight: leaders.map(row => row.label) };
  }

  function nets(record, index) {
    const rows = record.rows.filter(row => row.is_net);
    if (rows.length < 2 || !numeric(rows[0].values[index]) || !numeric(rows[1].values[index])) {
      return { title: 'Read the published net categories', body: 'A complete pair of numeric main nets is not available for this group. No gap is inferred.', highlight: [] };
    }
    const [a, b] = rows;
    const av = a.values[index], bv = b.values[index], gap = Math.abs(av - bv);
    const labels = record.kind === 'compatibility' ? ['Incompatible (scores 1–5)', 'Compatible (scores 6–10)'] : [cleanNet(a.label), cleanNet(b.label)];
    return {
      title: gap ? `Main net gap: ${gapText(gap)}` : 'The two main nets have equal published shares',
      body: `${quote(labels[0])}: ${av}%; ${quote(labels[1])}: ${bv}%. The gap uses the published nets; rounded component categories are not added together.`,
      highlight: gap ? [av > bv ? a.label : b.label] : []
    };
  }

  function comparison(record, rowIndex, indices) {
    const row = record.rows[rowIndex];
    const groups = indices.filter(i => record.columns[i].dimension !== 'Total');
    const present = groups.filter(i => numeric(row.values[i]));
    if (present.length < 2) return { title: 'Too few numeric group values for a range', body: 'At least two published numeric values are needed. Source dashes are not treated as zero.', highlight: [] };
    const lowest = Math.min(...present.map(i => row.values[i]));
    const highest = Math.max(...present.map(i => row.values[i]));
    const top = present.filter(i => row.values[i] === highest), bottom = present.filter(i => row.values[i] === lowest);
    const names = items => items.length <= 3 ? list(items.map(i => record.columns[i].label)) : `${items.length} groups`;
    let body = highest === lowest ? `All displayed numeric group values are ${highest}%.` : `${quote(row.label)} ranges from ${lowest}% (${names(bottom)}) to ${highest}% (${names(top)}), a span of ${gapText(highest - lowest)}.`;
    if (present.length < groups.length) body += ` ${groups.length - present.length} source-dash value(s) are excluded from this range.`;
    if (present.some(i => record.base_unweighted[i] == null)) body += ' Group base counts are not published.';
    else if (present.some(i => record.base_unweighted[i] < 100)) body += ' Some group bases are below 100; read the small-sample notice.';
    body += ' This is a descriptive comparison, not a significance test.';
    return { title: highest === lowest ? 'Equal published group percentages' : `Published group range: ${lowest}–${highest}%`, body, highlight: highest === lowest ? [] : top.map(i => record.columns[i].label) };
  }

  function matrix(cells, response) {
    const present = cells.filter(cell => numeric(cell.value));
    if (!present.length) return { title: 'No numeric result to summarise', body: 'No percentage is inferred for a source dash.', highlight: [] };
    const highest = Math.max(...present.map(cell => cell.value)), lowest = Math.min(...present.map(cell => cell.value));
    const top = present.filter(cell => cell.value === highest);
    const names = top.length <= 2 ? list(top.map(cell => `${cell.science} / ${cell.wording}`)) : `${top.length} science-and-wording combinations`;
    return { title: `${response}: ${lowest}–${highest}%`, body: `The highest published share is ${highest}% for ${names}. Outlined cells mark the highest share for this response; respondent bases differ across questions.`, highlight: top.map(cell => cell.id) };
  }

  // Editorial interpretations of published totals; theological implications are not additional survey findings.
  function interpretation(record) {
    const id=record.question_id;
    const netRows=record.rows.filter(row=>row.is_net);
    const first=netRows[0]?.values[0],second=netRows[1]?.values[0];
    const dk=record.rows.find(row=>/^don't know$/i.test(row.label))?.values[0];
    const refs=record.rows.filter(row=>numeric(row.values[0])).map(row=>`${record.id}:${record.rows.indexOf(row)}:0`);
    const make=meaning=>({meaning,evidence:refs});
    const scienceMatch=id.match(/^q8([abcd])_(\d+)$/);
    if(scienceMatch){
      const code=scienceMatch[2];
      const science={'1':'the Big Bang','2':'neuroscience','3':'medical science','5':'psychology','6':'astronomy and cosmology','7':'chemistry','8':'climate science','9':'geology'}[code];
      const verb=code==='6'?'make':'makes';
      const position={a:'religious belief',b:'Christian belief',c:'Muslim belief',d:'atheism'}[scienceMatch[1]];
      if(!science||!numeric(first)||!numeric(second))throw new Error('Missing science interpretation basis: '+record.id);
      const lens={
        '1':'The theological issue to investigate is whether a physical account of cosmic origins is being treated as competing with, or compatible with, belief in a creator. The item does not reveal that reasoning.',
        '2':'For theological research, this points to the need to distinguish an explanation of brain processes from claims about the soul, personal identity or free will. The item does not establish which claim respondents have in mind.',
        '3':'The relevant theological distinction is between explaining bodily processes and evaluating beliefs about divine action, healing or the meaning of illness. The item does not reveal whether respondents make those connections.',
        '5':'Theological research can distinguish explaining how religious experiences arise from judging their truth or significance. These are different claims; the survey does not show which one respondents are evaluating.',
        '6':'A relevant theological distinction is between describing the universe’s development and explaining its existence or purpose in relation to a creator. The item records perceived tension without identifying a disputed doctrine.',
        '7':'A chemical account of physical processes and a theological claim about divine action need to be specified before any contradiction can be assessed. These answers record an attitude toward that relationship, not such an assessment.',
        '8':'Theological research should separate acceptance of climate science from religious ideas about creation and human responsibility. This item concerns perceived conflict with a worldview; it does not measure environmental ethics or action.',
        '9':'Theological research needs to distinguish conflict with a particular creation chronology from rejection of divine creation as such. The question does not identify which understanding of creation, if any, respondents are assessing.'
      }[code];
      let finding;
      if(numeric(dk)&&dk>Math.max(first,second)){
        finding=`${dk}% answer “don’t know” about whether ${science} ${verb} ${position} harder to hold, making uncertainty the largest response. This cannot be counted as acceptance of compatibility; the figures do not isolate the views of that belief’s adherents.`;
      }else if(first===second){
        finding=`Agreement and disagreement are evenly balanced (${first}% each) over whether ${science} ${verb} ${position} harder to hold. There is no single public verdict on this perceived conflict.`;
      }else if(Math.abs(first-second)<=2){
        finding=`Views are almost evenly divided over whether ${science} ${verb} ${position} harder to hold (${first}% agree; ${second}% disagree). The small rounded gap gives no clear descriptive leaning.`;
      }else if(second>first){
        finding=`More reject than endorse the claim that ${science} ${verb} ${position} harder to hold (${second}% versus ${first}%).`;
        if(scienceMatch[1]==='d')finding+=' This does not amount to evidence against God: perceived compatibility with atheism and evidence for atheism are different claims.';
        else finding+=' Perceived tension is therefore not the leading judgment, but disagreement does not imply that science positively supports the belief.';
      }else{
        finding=`More endorse than reject the claim that ${science} ${verb} ${position} harder to hold (${first}% versus ${second}%). This locates a perceived difficulty; it does not establish a scientific refutation of the belief.`;
      }
      return make(finding+' '+lens);
    }
    if(record.kind==='compatibility'){
      const subject={q3_1:'religion',q4a_1:'faith',q4b_1:'Christianity',q4c_1:'Islam'}[id];
      const lens={
        q3_1:'This broad conflict perception does not identify a specific scientific finding or religious teaching. Theological research needs to separate judgments about institutions, personal faith and doctrines before claiming to know what is seen as incompatible.',
        q4a_1:'A substantial share therefore sees room for faith alongside science. Theological research must clarify whether “faith” means trust in God, assent to doctrines or something else; the survey does not establish which meaning explains these responses.',
        q4b_1:'A single judgment about Christianity leaves the disputed belief unspecified. Research should distinguish possible tensions over creation, miracles or human nature; these figures neither locate the disagreement nor establish that Christianity is scientifically incompatible.',
        q4c_1:`The ${dk}% don’t-know share also matters: an absence of judgment should not be read as compatibility. Research on Islam and science needs to establish what respondents know about the beliefs they assess. These are public perceptions, not a separate report of Muslims’ own views.`
      }[id];
      if(!subject||!lens)throw new Error('Missing compatibility interpretation: '+id);
      return make(`${first}% place science and ${subject} on the incompatible half of the scale, compared with ${second}% on the compatible half. ${lens}`);
    }
    if(record.kind==='confidence'){
      const lens={
        q6_1:'Understanding an evolutionary account and accepting or rejecting a theology of creation are separate questions. Research should establish both before describing a conflict.',
        q6_2:'Research on cosmology and creation needs to distinguish familiarity with the Big Bang from an interpretation of its significance for belief in a creator.',
        q6_3:'Understanding bodily processes does not itself specify a view of healing, suffering or divine action. Those theological interpretations require separate questions.',
        q6_5:'Understanding chemistry and judging whether physical explanations leave room for divine action are different issues. One measure should not substitute for the other.',
        q6_7:'In research on religious experience, familiarity with psychological explanations should be distinguished from accepting or rejecting the truth of a religious experience.',
        q6_8:'Claims about the brain, soul or free will should be studied alongside what participants understand about neuroscience. Disagreement may concern the scientific account, its theological interpretation or both.',
        q6_9:'Research on environmental theology should distinguish knowledge of ecological processes from beliefs about stewardship and responsibility. The confidence item measures neither moral commitment nor behaviour.',
        q6_10:'Knowing the basics of geology is distinct from holding a particular interpretation of creation. Research should separate understanding Earth’s history from the theological significance given to it.'
      }[id];
      if(!lens)throw new Error('Missing confidence interpretation: '+id);
      return make(`${first}% report confidence in the basics of this science, compared with ${second}% who report a lack of confidence. ${lens} Self-reported confidence is not tested knowledge and does not establish a religious commitment.`);
    }
    const meanings={
      q1_2:'A majority accepts science as the only route to reliable knowledge about the world. The theological issue is the authority granted to other possible sources of understanding, such as revelation, religious experience or moral reasoning. Agreement with this statement does not by itself show that respondents reject those sources or understand them in the same way.',
      q1_3:'More reject than accept the expectation that science will eventually explain everything. A limit to scientific explanation is not automatically an argument for God: respondents may regard some matters as permanently unanswered. Theological research should distinguish the scope assigned to science from any positive reason for religious belief.',
      q1_4:'Most reject the view that science’s dangers outweigh its benefits. This is a judgment about practical value, not a declaration that science provides a complete worldview. Theological research should therefore measure trust in scientific work separately from views about God, creation or the limits of scientific explanation.',
      q1_5:'A majority accepts that science explains only part of reality. This leaves the meaning of “reality” and the nature of the unexplained part unspecified. Theological research can investigate whether respondents mean moral value, subjective experience, God or something else; the result itself does not identify a religious explanation.',
      q1_8:'Most expect some things to remain beyond scientific explanation. This challenges the assumption that confidence in science necessarily includes belief in its unlimited reach. For theology, the crucial distinction is between admitting an explanatory limit and offering a reason to believe in God; the survey does not establish that respondents make the second move.',
      q1_10:'More reject than endorse excluding science from ethics. For theological ethics, evidence about consequences and judgments about what is right have distinct roles: estimating a treatment’s harms does not itself settle which harms are acceptable. The figures allow a perceived role for science without showing that respondents think it can supply moral values by itself.',
      q2c_3:'A majority rejects the claim that religion has no place in the modern world. This concerns religion’s perceived relevance, not the truth of any doctrine. Theological research should distinguish views of religion’s social role from assessments of its scientific compatibility; acceptance of one need not imply acceptance of the other.',
      q2c_4:'More endorse than reject the idea that all religions contain some truth. Theological research should therefore distinguish openness to truth in other traditions from adherence to one tradition or agreement with all its doctrines. This item does not reveal which truths respondents recognise or how they resolve disagreements between religions.',
      q2c_5:'A majority rejects the claim that religion has nothing helpful to say about ethics. This leaves room for a perceived moral contribution without granting religion final authority. Research in theological ethics should distinguish finding a teaching helpful, accepting its justification and believing it should govern public decisions.',
      q2c_6:'Rejection of the comparison between religion and smallpox outweighs endorsement. Hostility toward religion is therefore not the leading response to this statement. Research should not equate a perceived conflict with science with hostility to religion: the two claims concern different attitudes, and rejecting the analogy does not establish religious belief.',
      q2c_8:'Describing humans as spiritual attracts more agreement than disagreement. For theological research, this matters because a spiritual account of human life is distinct from affiliation, belief in God or belief in an immortal soul. The item leaves “spiritual” without a definition, so it cannot establish which of those commitments, if any, respondents hold.',
      q5_1:'Most reject the claim that someone cannot be both a good scientist and religious. This weakens a simple public conflict narrative at the level of personal identity and scientific practice. It does not mean that respondents regard every religious claim as compatible with science; those specific claims require separate investigation.',
      q5_4:'More reject than accept “Science has disproved religion”, but neither side has a majority. Theological research cannot treat the poll as a verdict on God or religion. A defensible conflict claim needs a specific scientific result, a specific religious proposition and an argument connecting them; the statement supplies none of those details.',
      q5_6:'Half reject the claim that science ultimately needs faith to work. The result cannot show whether they reject religious commitment, ordinary trust or reliance on basic assumptions, because “faith” is not defined. Theological comparisons between scientific trust and religious faith need to make those meanings explicit before treating the two as equivalent.',
      q5_12:'Agreement and disagreement are tied on whether science alone can solve climate change. Theological ethics can distinguish identifying effective interventions from deciding responsibilities, priorities and acceptable costs. The result shows no clear leading view of science’s sufficiency; it does not identify which moral or religious resources respondents would add.',
      q9_1:'Evolutionary evidence attracts broad agreement. Theological research should separate acceptance of that evidence from interpretations of divine creation, purpose or providence. This item supports a statement about attitudes to scientific evidence; it cannot identify whether acceptance is accompanied by theism, atheism or another worldview.',
      q9_2:'Most accept that plants and animals developed from simpler life forms. An account of how life developed and a theological account of its relation to God are different claims. Research should examine how people connect them, rather than infer rejection of creation or purpose from acceptance of evolution alone.',
      q9_3:'Most accept that humans developed from simpler life forms. Theological research must therefore distinguish biological ancestry from claims about human dignity, the soul or being made in God’s image. The item does not show whether respondents think evolutionary ancestry supports, challenges or leaves those theological claims untouched.',
      q9_4:'Most reject saying that they find evolution difficult to believe; a smaller group reports difficulty. Theological research should investigate the reasons for that difficulty before classifying it as religious opposition. This statement alone does not distinguish doctrinal disagreement, misunderstanding of the science or other concerns.',
      q9_6:'Agreement and disagreement about evolution’s inability to explain morality are almost even. Theological ethics should distinguish explaining how moral capacities arose from giving reasons why a moral obligation is binding. The figures do not reveal which question respondents understood, establish an actual limit to evolutionary explanation or show support for a divine source of morality.',
      q9_7:'Most reject the claim that only plants and animals evolve, not humans. The result concerns biological history, not every possible claim about human distinctiveness. Theological research should investigate separately whether people connect evolutionary continuity with beliefs about the soul, dignity or being made in God’s image.',
      q9_8:'An ancient Earth has broad acceptance. The relevant theological distinction is between accepting Earth’s scientific history and accepting a particular interpretation of creation. This result is directly relevant to recent-Earth chronologies, but cannot tell us whether respondents believe that an ancient Earth is nevertheless created by God.',
      q9_9:'Most reject the specific claim that God created the universe, Earth and all life within 10,000 years. This cannot be read as rejection of God or of all creation theology. Research must distinguish a recent-creation chronology from broader claims that the world depends on God; the survey item tests the former combination of claims.',
      q9_10:'More endorse than reject the possibility of believing in both God and evolution. This directly challenges a simple public opposition between evolutionary acceptance and theism. Theological research can investigate how such compatibility is understood, but the item measures its perceived possibility rather than proving that respondents personally hold both beliefs.',
      q9_12:'Agreement and disagreement about evolution’s inability to explain consciousness are almost even. Theological research should distinguish the emergence of consciousness from interpretations of subjective experience, the soul or human dignity. These opinions do not establish what science can explain or show that uncertainty leads respondents to a religious account of mind.',
      q10:'Human–ape common ancestry is the most frequently selected difficulty in this restricted group. This identifies human origins as an issue to investigate, but does not show that religious teaching causes the difficulty. Theological research needs respondents’ reasons and beliefs before making that connection; multiple answers overlap and cannot be generalised to the whole public.',
      q11_1:'Stem cell research is widely judged to offer benefits greater than risks. Theological bioethics should distinguish that practical judgment from views about the moral status of cells or embryos and the acceptability of particular research methods. A favourable benefit–risk judgment does not establish approval of every method, and the question gives no religious motivations.',
      q11_2:'Benefit and risk judgments about nuclear power are relatively close, with neither net reaching a majority. For theological ethics, estimating hazards is distinct from judging responsibilities to neighbours, future generations and the environment. The result locates a contested practical judgment; it does not show which moral or religious commitments explain either response.',
      q11_3:'Views of GM crops are divided, with benefits leading risks by a modest margin. Theological ethics can distinguish judgments about likely effects from judgments about stewardship, justice or acceptable intervention in nature. The poll does not identify those reasons, so neither support nor concern should be labelled religious on this evidence.',
      q11_4:'Most judge renewable energy’s benefits greater than its risks. This offers a shared practical topic for environmental theology, but a favourable judgment is not evidence of a belief in stewardship or a duty to act. Research needs to distinguish perceived benefits, moral motivation and actual behaviour.',
      q11_5:'Unfamiliarity with nanotechnology is substantial alongside a benefit-leading net. A theological or ethical assessment first needs a specified application and an understanding of what it does. The item does not distinguish caution due to unfamiliarity from a considered moral objection, and neither should be assigned a religious motivation.',
      q11_6:'73% say vaccination’s benefits far outweigh its risks, so strongly favourable judgments predominate. For theological bioethics, this provides a practical context for examining duties of care and responsibility to others. It does not measure religious motivations: approval of a medical application does not by itself establish a view about God or science’s wider explanatory authority.',
      q11_7:'More judge animal testing’s benefits greater than its risks than the reverse, although neither net is a majority. Theological ethics should distinguish assessing medical benefit from judging the moral status of animals and acceptable harm. The figures record the balance respondents choose, not the ethical or religious reasoning behind it.',
      q24_1:'This describes respondents’ formal science qualifications. Research on science and religion must distinguish educational credentials from tested understanding, trust in science and theological belief. A qualification does not specify a worldview, and the table does not establish a relationship between education and religion.',
      q24_2:'A majority reports no formal qualification in religion. This should not be treated as a measure of non-religiosity or theological ignorance: formal study, lived practice and personal faith are different characteristics. Research needs separate measures of what people know, what they believe and how they participate.',
      profile_religion_pdl:'A majority reports no religious affiliation. That does not identify them as atheists or show that they reject spiritual interpretations of life. Theological research should distinguish belonging, belief and practice; this affiliation table alone cannot establish which beliefs or experiences those without a religious label retain.',
      science_knowledge_score:'The publisher groups science knowledge as low, medium or high, but supplies no thresholds here. Theological research should not treat a higher category as a measure of secularism or a lower one as a reason for belief. The table provides no relationship between this score and religious commitments, and cannot reconstruct the underlying test.',
      religion_knowledge_score:'These are the publisher’s categories of knowledge about religion, with thresholds not supplied. Knowledge of doctrines or traditions is different from assenting to them or practising a religion. Theological research therefore needs separate measures of knowledge, belief and belonging; these totals do not show how they relate.',
      confidence_in_science_knowledge:'These categories summarise confidence in scientific knowledge, with thresholds not supplied. Confidence may differ from demonstrated understanding, so it cannot stand in for scientific literacy in an explanation of religious belief. The published totals do not establish whether confidence and religious commitment are related.'
    };
    if(!meanings[id])throw new Error('Missing theological interpretation: '+record.id);
    return make(meanings[id]);
  }

  root.SURVEY_INSIGHTS = Object.freeze({ distribution, nets, comparison, matrix, interpretation });
})(typeof window === 'undefined' ? globalThis : window);
