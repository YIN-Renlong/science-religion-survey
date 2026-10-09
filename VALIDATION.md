# Release validation

Release 1.2.0 · 9 October 2026

## Version 1.2 checks

- All three dataset files remain byte-identical to v1.1. Structural validation passes for 91 records and 16,749 published cells.
- Report coverage checks confirm 91 question charts, four matrices with 128 values, 91 group tables and every exact published token. All internal anchors are unique and have a destination.
- The report contains no selectors, search inputs, sidebars or collapsed details. Each chart has a reading note. All publication records and group values are present in the document simultaneously.
- The unchanged reading engine passes 6,661 data-driven cases and its targeted edge cases.
- Browser QA checked the single-column desktop layout and a 390px iframe viewport. Question and appendix links arrive at their targets; older question URLs still work. Source dashes, explicit zeroes and unpublished generational bases remain distinct.
- The narrow-screen appendix stacks responses under each group. No horizontal overflow was observed in the checked views.
- A CSV downloaded through the browser reproduced all 40 cells of q1_3 in the generational appendix, retained missing bases and included source-page provenance.
- No report-script errors were observed during browser checks; browser-extension errors were unrelated to the report.

- An isolated v1.1-to-v1.2 upgrade preserved Git history, unrelated files and data modification times; every changed existing file had an exact timestamped backup. A second installation changed nothing.
- A real local Git remote with a mock GitHub CLI confirmed one descendant update commit, the new report assets, a main push and Pages configuration update. A second publication created no empty commit.

## Previous version 1.1 checks (retained)

- All three published-data files remain byte-identical to v1.0. Structural validation still passes for 91 records and 16,749 source cells.
- Reading logic passes 6,661 data-driven cases, plus targeted tests of source-rounded nets, ties, zero versus dash, total exclusion, multiple-response language and missing group values.
- Browser checks confirmed simultaneous visibility of all dashboard sections, updated matrix notes, question and demographic readings, retained selection across section navigation, and expandable methodology.
- Desktop and 390px responsive views were inspected. The developer credit is visible under the logo. Mobile controls, notes, bars and highlights fit their containers.
- Existing question URLs retain their meaning and scroll to the corresponding chart. No site-script errors were observed during these interactions.
- Dataset v1.0.0 is unchanged; dashboard v1.1.0 adds presentation and descriptive calculations only.
- An isolated v1.0-to-v1.1 installer test preserved Git history, unrelated files and unchanged data modification times. Every changed existing file had an exact backup; a second run changed nothing.
- The iterative publishing test used a real local remote and a mock GitHub CLI. It created one descendant commit, pushed main, included the new insight assets, updated Pages configuration, and created no extra commit on rerun.

## Original data validation (v1.0, retained)

## Data

- All 91 table records and all 16,749 published percentage/dash cells were extracted from the supplied 30-page PDF.
- A second PDF-coordinate extraction matched every percentage and dash to the structured data.
- Main-section unweighted group counts reconcile to each question total; weighted groups reconcile within rounding tolerance.
- The browser data and canonical JSON agree. Source dashes, zeroes, distinct publication totals and missing generational bases remain distinct.
- JSON and CSV include source-page provenance and both base types where published.

## Interface

- Inspected the overview and explorer in Chromium at desktop width and in a 390px iframe viewport.
- Exercised distribution/group comparison, ethnicity small-base notices, generational missing-base notices, exact-value table expansion, search/reset and conditional multiple-response questions.
- Switched the science matrix to the don't-know response and checked the displayed values.
- Downloaded a question CSV through the live browser; verified its 40 cells, missing bases and page references.
- Verified JavaScript syntax. Browser error logs contained extension errors, with no observed site-script error.
- Plain local script loading and relative asset paths support direct file opening and GitHub Pages subdirectory hosting. No production build is needed.

## Installer and publishing checks

- Clean installation, byte-identical rerun, ZIP/installed-file parity, timestamped backups and preservation of unrelated folders passed in an isolated local fixture.
- A symbolic-link target was rejected before modifying the external file.
- Publishing was exercised with a real local bare Git remote and an explicit mock `gh`: repository creation, HTTPS origin rewriting, main push, Pages creation/update and no extra commit on a clean rerun passed.
- These checks do not substitute for actual GitHub authentication or a live Pages deployment.

## Publishing scope

This release is prepared for the user's Mac and GitHub account. Actual GitHub authentication, repository creation, push, and Pages deployment must run on the user's machine; this workspace has no authenticated GitHub CLI. The installer and publisher report failures instead of asserting that a live site exists.

This is a descriptive transcription, not a statistical reanalysis or a claim of certification by the research organisations.
