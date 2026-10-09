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

  // Editorial course interpretations of the published totals, kept separate from statistical inference.
  function interpretation(record) {
    const id=record.question_id;
    const nets=record.rows.filter(row=>row.is_net);
    const first=nets[0]?.values[0],second=nets[1]?.values[0];
    const dk=record.rows.find(row=>/^don't know$/i.test(row.label))?.values[0];
    const evidence=record.rows;
    const refs=evidence.filter(row=>numeric(row.values[0])).map(row=>`${record.id}:${record.rows.indexOf(row)}:0`);
    const make=meaning=>({meaning,evidence:refs});
    const scienceMatch=id.match(/^q8([abcd])_(\d+)$/);
    if(scienceMatch){
      const science={'1':'the Big Bang','2':'neuroscience','3':'medical science','5':'psychology','6':'astronomy and cosmology','7':'chemistry','8':'climate science','9':'geology'}[scienceMatch[2]];
      const verb=scienceMatch[2]==='6'?'make':'makes';
      const position={a:'religious belief',b:'Christian belief',c:'Muslim belief',d:'atheism'}[scienceMatch[1]];
      if(!science||!numeric(first)||!numeric(second))throw new Error('Missing science interpretation basis: '+record.id);
      if(numeric(dk)&&dk>Math.max(first,second)){
        return make(`${dk}% answer “don’t know” about whether ${science} ${verb} ${position} harder to hold, making uncertainty the largest response. Many respondents do not take a position on this perceived conflict; these figures do not isolate the views of that belief’s adherents.`);
      }
      if(first===second)return make(`Respondents are evenly divided on whether ${science} ${verb} ${position} harder to hold. For science and religion, this is a divided perception of conflict, not evidence that the scientific account itself rules the belief in or out.`);
      if(Math.abs(first-second)<=2)return make(`Views are almost evenly divided over whether ${science} ${verb} ${position} harder to hold. The small rounded gap gives no clear descriptive leaning; it should not be presented as a decisive judgment about their compatibility.`);
      if(second>first){
        return make(scienceMatch[1]==='d'
          ?`More reject than endorse the idea that ${science} ${verb} atheism harder to hold. This concerns perceived tension with atheism; disagreement is not a scientific argument against God.`
          :`More reject than endorse the idea that ${science} ${verb} ${position} harder to hold. This leans away from a simple conflict account, without showing that respondents think science positively supports the belief.`);
      }
      return make(`More endorse than reject the idea that ${science} ${verb} ${position} harder to hold. This identifies perceived tension for discussion; the response does not establish a logical contradiction between the science and the belief.`);
    }
    if(record.kind==='compatibility'){
      const subject={q3_1:'religion',q4a_1:'faith',q4b_1:'Christianity',q4c_1:'Islam'}[id];
      if(!subject)throw new Error('Missing compatibility subject: '+id);
      return make(`More place science and ${subject} on the incompatible half of the scale than on the compatible half.${id==='q4c_1'?' A substantial don’t-know share also matters.':''} This is a broad perception of their relationship; understanding a specific conflict requires identifying particular scientific and religious claims.`);
    }
    if(record.kind==='confidence'){
      const lens={q6_1:'evolution and origins',q6_2:'the origins of the universe',q6_3:'the body and health',q6_5:'explanations of the physical world',q6_7:'the mind and human identity',q6_8:'the brain and consciousness',q6_9:'the environment and human responsibility',q6_10:'Earth’s history and creation'}[id];
      if(!lens)throw new Error('Missing confidence subject: '+id);
      const lead=first===second?'Confidence and lack of confidence are evenly balanced.':first>second?'More feel confident than unconfident about the basics of this science.':'More feel unconfident than confident about the basics of this science.';
      return make(`${lead} For discussion of ${lens}, this describes perceived familiarity, not tested knowledge or an established link with religious belief.`);
    }
    const meanings={
      q1_2:'A majority grants science exclusive authority over reliable knowledge. This raises an epistemological question for the course: whether religious, moral or experiential understanding can also count as knowledge.',
      q1_3:'More reject than accept the expectation that science will eventually explain everything. This concerns the scope of scientific explanation; it does not show that unexplained matters require a religious explanation.',
      q1_4:'Most reject the view that science’s dangers outweigh its benefits. Distinguish judgments about science’s practical value from the separate question of its compatibility with religion.',
      q1_5:'A majority sees scientific explanation as covering only part of reality. This raises a question about different kinds of explanation without showing that religion is respondents’ preferred answer to what remains unexplained.',
      q1_8:'Most expect some enduring limits to scientific explanation. This helps distinguish the use of scientific methods from the stronger claim that science can explain all reality.',
      q1_10:'More reject than endorse the claim that science has nothing to say about ethics. For the course, distinguish a role for scientific evidence in moral reasoning from deciding moral values through science alone.',
      q2c_3:'A majority rejects excluding religion from the modern world. This concerns religion’s perceived social relevance, which is a different question from the scientific assessment of particular religious claims.',
      q2c_4:'More see some truth across religions than reject that idea. This is an attitude toward religious plurality, adding a different dimension to a broad science-and-religion compatibility question.',
      q2c_5:'A majority rejects the claim that religion has nothing helpful to say about ethics. This suggests room for a perceived moral contribution, without implying agreement that religious teachings should settle every ethical issue.',
      q2c_6:'Rejection of the smallpox analogy outweighs endorsement. This measures a hostile comparison with religion; such attitudes should be distinguished from judgments about conflicts between specific scientific and religious claims.',
      q2c_8:'Spiritual language attracts more agreement than disagreement. This concerns how people understand human nature; it does not identify their religious affiliation or commitment to a particular doctrine.',
      q5_1:'Most reject the claim that religious commitment prevents someone from being a good scientist. This challenges a simple conflict account at the level of personal identity and scientific practice.',
      q5_4:'More reject than accept the claim that science has disproved religion, although neither response forms a majority. For the course, ask which scientific finding and which religious claim would be involved in such an argument.',
      q5_6:'Half reject the claim that science needs faith to work. The course can examine possible meanings of “faith”, such as religious commitment, trust or methodological assumptions; this item does not establish which meaning respondents used.',
      q5_12:'Neither side leads on whether science alone can solve climate change. The course question is how scientific knowledge relates to moral priorities, collective decisions and action.',
      q9_1:'Evolutionary evidence attracts broad agreement. A separate philosophical and theological question is whether accepting that evidence conflicts with particular religious beliefs.',
      q9_2:'Most accept that plants and animals developed from simpler life forms. The course can distinguish acceptance of the scientific account from interpretations of purpose, creation or providence.',
      q9_3:'Most accept that humans developed from simpler life forms. This makes human distinctiveness and interpretations of creation relevant discussion points, without treating acceptance of evolution as a measure of atheism.',
      q9_4:'Most reject the statement that they find evolution difficult to believe. The item identifies a smaller group for whom acceptance is an issue; it does not establish that their reasons are religious.',
      q9_6:'Respondents are almost evenly divided about evolution’s ability to explain morality. For discussion, distinguish the evolutionary origins of moral behaviour from the justification of moral values.',
      q9_7:'Most reject exempting humans from evolution. This is relevant to debates about human distinctiveness, while leaving open how respondents interpret theological claims about human beings.',
      q9_8:'An ancient Earth has broad acceptance. The result is relevant to creation accounts that require a recent Earth; it does not address every possible understanding of divine creation.',
      q9_9:'Most reject this specifically recent-creation claim. Rejecting a universe, Earth and life created within 10,000 years cannot be read as rejection of God or of all creation theology.',
      q9_10:'More endorse than reject the compatibility of belief in God and evolution. This directly challenges the assumption that accepting evolution necessarily means abandoning theism, at the level of respondents’ perceptions.',
      q9_12:'Respondents are almost evenly divided about evolution’s ability to explain consciousness. The course can distinguish how consciousness developed from philosophical questions about subjective experience and its significance.',
      q10:'Human ancestry is the most frequently selected difficulty within this restricted question base. These overlapping answers describe people who already report difficulty with evolution; they cannot establish how common these reasons are in the whole public or whether religion caused them.',
      q11_1:'Stem cell research is widely viewed as beneficial. This offers a case for discussing expected medical benefits and moral judgments together; the item does not identify respondents’ ethical or religious reasons.',
      q11_2:'Benefit and risk judgments about nuclear power are relatively close, with neither net reaching a majority. This invites discussion of how scientific assessment relates to moral responsibility and acceptable risk; religious motivations are not measured here.',
      q11_3:'Views of GM crops are divided, with benefits leading risks by a modest margin. This is an applied ethical question about technology; the item does not establish a religious explanation for either response.',
      q11_4:'Most see renewable energy’s benefits as greater than its risks. This provides a case for discussing science, stewardship and environmental responsibility, without identifying which worldview motivates support.',
      q11_5:'Unfamiliarity is substantial alongside a benefit-leading net. For discussion of emerging technology, understanding what it is and judging its moral acceptability are separate questions; this item does not identify religious motives.',
      q11_6:'73% say vaccination’s benefits far outweigh its risks, so strongly favourable judgments predominate. For science and religion, distinguish confidence in a medical application from views about science’s wider relationship with religious belief; this item does not measure religious motivations.',
      q11_7:'Views on animal testing are divided, with benefits more often favoured than risks. This offers a case for examining scientific benefit alongside moral judgments about animals; the figures do not identify respondents’ religious reasons.',
      q24_1:'This describes the formal science education respondents bring to the discussion. Qualifications, tested knowledge and religious belief are different characteristics; this table does not establish how they are related.',
      q24_2:'A majority reports no formal qualification in religion. Formal study, personal faith and lived religious experience are distinct; a lack of qualifications should not be treated as a measure of non-religiosity.',
      profile_religion_pdl:'A majority reports no religious affiliation. That does not identify them as atheists: affiliation, belief and spirituality are distinct dimensions in science-and-religion research.',
      science_knowledge_score:'This uses the publisher’s low, medium and high science-knowledge categories. The thresholds are not supplied, so the result cannot be used to reconstruct a knowledge test or establish how knowledge relates to religious belief.',
      religion_knowledge_score:'These are the publisher’s categories of religious knowledge, with thresholds not supplied. Knowledge about religion should be distinguished from religious affiliation or personal faith.',
      confidence_in_science_knowledge:'These categories summarise the publisher’s measure of confidence in scientific knowledge, with thresholds not supplied. Perceived confidence is distinct from demonstrated knowledge and from a position on religion.'
    };
    if(!meanings[id])throw new Error('Missing course interpretation: '+record.id);
    return make(meanings[id]);
  }

  root.SURVEY_INSIGHTS = Object.freeze({ distribution, nets, comparison, matrix, interpretation });
})(typeof window === 'undefined' ? globalThis : window);
