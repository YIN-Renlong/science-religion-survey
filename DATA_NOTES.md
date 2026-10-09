# Data and transcription notes

## Source

[Published tables](https://www.theosthinktank.co.uk/cmsfiles/Data-tables-combined.pdf), 30 PDF pages, supplied by the user. The main demographic section runs through the first row of page 26; the generational appendix follows on pages 26–30. The source checksum is in `data/survey.json`.

[Questionnaire](https://www.theosthinktank.co.uk/cmsfiles/1.Science-and-Religion-Theos-Faraday-YouGov-Questionnaire.pdf), 18 pages. [Report](https://www.theosthinktank.co.uk/cmsfiles/Science-and-Religion-Moving-away-from-the-shallow-end_REPORT.pdf), Theos, 2022.

## Coverage

75 main table blocks and 16 generational appendix blocks; 16,749 published percentage cells or dash symbols. Repeated questions are stored as separate records by publication section. This release represents all the published table blocks in the supplied combined PDF, not all questionnaire questions and not the original microdata.

The main tables supply 26 columns: total, two gender categories, six age bands, five ethnicity categories, and twelve regions. These are separate marginal breakdowns. The appendix has five columns: total and four generations. Its subgroup bases are not published.

The questionnaire also contains questions on robots, souls, AI companionship, moral issues, religious practice and other topics absent from the supplied tables. No results are inferred for missing items.

## Numerical rules

- Percentages are integers transcribed as published. No smoothing, imputation, normalisation or reconstruction of respondent counts is performed.
- Source dashes are represented as `null` with raw value `-`, not as zero. A published `0%` remains numeric zero.
- Source net rows are preserved separately from component categories. Rounded parts can differ from the net by a percentage point and may not sum to exactly 100.
- Main table unweighted respondent counts and weighted bases are separately stored. Item bases vary: for example, the evolution evidence item has unweighted n = 4,754, even though the overall survey has 5,153 respondents.
- Displayed base counts refer to the published question and group. “All in question base” does not always mean all 5,153 participants.
- No confidence intervals or significance tests are computed without the required survey design information.
- The interface's n < 100 flag is a transparent project caution convention. It is not a rule supplied by the publisher and is not a test of significance.

## Wording and scales

Question statements reproduce the table text; line breaks and redundant endpoint numbering are regularised for readability. The duplicated “that that” in one multiple-response answer is retained. Both the printed and canonical question IDs are included where they differ.

The compatibility scale uses values 1–10 with a separate not-sure/don't-know response. The report combines 1–5 as incompatible and 6–10 as compatible. These groupings are disclosed. Scores 5 and 6 are not relabelled as a neutral response. Strong endpoints are the published 1–2 and 9–10 nets.

“This science makes it hard to be religious” is an agreement statement. It is not the same measure as general compatibility. The wording versions about Christianity, Islam and atheism are not respondent identity filters. No paired transition, causal wording effect or respondent-level belief profile is inferred from the aggregates.

Q10 permits multiple responses and is restricted to people agreeing/strongly agreeing with the difficulty-believing-in-evolution statement. Its bars must not be stacked as parts of a whole.

## Discrepancies disclosed

1. Population is described as 18+, but the age header says 16–29 and the generational header says Gen Z 16–24. Labels are retained and the discrepancy is visible. No inference is made about actual under-18 respondents.
2. Stem cell research is printed as q11_2, the same ID as nuclear power. We identify stem cells as q11_1 following the questionnaire, while preserving `source_question_id: q11_2`.
3. The q8d statements refer to being an atheist, but the printed base says “Those answering about faith”. Both are preserved.
4. Main and generational total nets can differ. Science explaining everything is 29% agreement in the main section and 30% in the appendix; the religion/smallpox comparison is 20% and 21%. Records remain separate; no corrected number is invented.
5. The generational appendix includes knowledge/confidence categories without the score thresholds needed to reproduce them. Only the published low/medium/high distributions are shown.
6. The generational appendix gives no unweighted or weighted base counts. `null` indicates “not published”; overall counts are not borrowed from other tables.
7. Some questionnaire and table statements have minor wording differences. For example, q9_7 is about “Only animals” in the questionnaire and “Only plants and animals” in the tables. The report displays the published table wording and links both sources.

## Provenance and verification

Each response row has its source PDF page. The CSV repeats the direct page URL for every cell. The dataset carries both base types, publication section, exact published value, group, and source question ID.

Percentages were extracted from the PDF text and independently matched against PDF-coordinate word tokens. Main table bases were extracted with column geometry and checked by reconciling unweighted demographic groups to each question total. Original 2021 categories are kept, without updating names or reclassifying people.

This is a descriptive visualisation of public opinion. The executive summary and the full report contain interpretations beyond the table values. The interface's reading notes are labelled explanations, not additional survey findings.

## Report reading notes (v1.4)

The main narrative contains ten course-focused figures. They cover broad compatibility; all eight sciences under the religious wording; agreement across all 32 science-and-wording statements; uncertainty across those statements; all eight confidence items; four statements on science’s value and reach; four evolution/origins statements; two explanatory-limit statements; science and ethics; and three views of religion. Figures may reuse a question to make a different comparison; they are not ten new survey measures.

Age, technology, qualifications, affiliation, conditional evolution reasons and generational records remain in the complete archive. The 91-record archive, all group tables and detailed methods are closed by default. Labels are sometimes shortened for readability; links retain the exact original question wording.

Paired dots use published agreement and disagreement nets on a shared 0–100% scale. Omitted neutral and don’t-know categories remain in the linked record and their omission is stated beside the chart. The heatmap uses published agreement totals with a fixed, labelled 0–50% colour scale. It does not average or pool the questions.

The uncertainty chart shows all eight published don’t-know percentages for each wording. The horizontal band spans their minimum and maximum, not a confidence interval. Vertical dot separation carries no numeric meaning. Each waffle square represents one percentage point, not one person. Stacks preserve source rounding: the morality response distribution totals 99%, with no normalisation.

Comparisons and takeaways are descriptive. Wording variants do not identify respondents by religion. The figures cannot establish an individual’s combination of beliefs, respondent-level correlations, paired wording effects or statistical significance. Reported percentage-point differences subtract the displayed rounded percentages.

The underlying data files remain unchanged from v1.0. The original reading engine in the archive retains source-rounded nets, ties, explicit zeroes, source dashes and publication-specific differences.
