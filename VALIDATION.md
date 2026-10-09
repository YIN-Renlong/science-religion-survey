# Release validation

Release 1.0.0 · 9 October 2026

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
