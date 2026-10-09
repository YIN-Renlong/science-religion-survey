/* Descriptive readings of published, rounded percentages. No inference or imputation. */
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

  root.SURVEY_INSIGHTS = Object.freeze({ distribution, nets, comparison, matrix });
})(typeof window === 'undefined' ? globalThis : window);
