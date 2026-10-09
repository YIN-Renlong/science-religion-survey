# Science, Religion & Public Perception

Version 1.5.0 is a ten-figure, single-column visual story for a 10–15 minute Science and Religion presentation.

An independent, static visualisation of the published Theos–Faraday–YouGov survey tables. Created by YIN Renlong.

Fieldwork: 5 May–13 June 2021. Report: Nick Spencer and Hannah Waite, *‘Science and Religion’: Moving away from the shallow end* (Theos, 2022).

## Use

Open `index.html` directly. There are no external JavaScript, CSS, font, or API dependencies. For a local HTTP preview, run from this directory:

    python3 -m http.server 8000

Then visit http://localhost:8000. The data are loaded through a local classic script, so the report also works under `file://` without a development server.

For optional development only, `package.json` supplies a Vite preview server. Node/npm are not required for opening, serving, or publishing the website. The optional development packages are not loaded by visitors.

## The presentation

Read straight down. Each of the ten figures follows **introduction → graphic → takeaway**, with source links and question-specific bases. There are no dropdowns, tabs or required selections. The outline provides optional jumps.

Suggested pace: 30–60 seconds for the opening, about one minute per figure, then 1–3 minutes for the final course discussion. This is a pacing guide, not an automatic timer.

| Figure | Question | Graphic |
| --- | --- | --- |
| 01 | Does the broad compatibility picture depend on the wording? | Stacked composition bars |
| 02 | Which particular sciences are seen as making religion harder? | Paired agreement/disagreement dots |
| 03 | How do religious, Christian, Muslim and atheist wordings compare? | Agreement heatmap |
| 04 | Where is uncertainty concentrated? | Dot-and-range plot across eight sciences |
| 05 | Which sciences do people feel they understand? | Ranked lollipop plot |
| 06 | What are science’s value and explanatory limits? | Paired dots |
| 07 | How widely are evolution and an ancient Earth accepted? | Paired dots |
| 08 | Can evolution explain morality and consciousness? | Complete response compositions |
| 09 | Does science have something to say about ethics? | 100-square waffle |
| 10 | What else do people think about religion? | Paired dots |

The figures describe public perceptions in 2021. They do not answer the scientific or theological questions themselves. Repeated chart forms maintain consistent encodings; chart variety is used where the comparison benefits from it.

## Supporting evidence

The full question archive, raw tables and detailed methods are all closed by default. Click a chart label or source link to open the exact supporting question. Each question and original table is also closed individually; opening a question keeps its full response categories behind a separate disclosure. Repeated titles identify the chart and its original evidence, not extra findings. A source link opens only the matching record, and “Return to the presentation” closes the references and returns to the originating figure.

All 75 main table records and 16 generational records remain available, including all 16,749 published percentage cells and dashes. These 91 records are not 91 distinct survey questions.

Age, technology, qualifications, affiliation, conditional evolution reasons and the generational appendix remain in the archive. Every original data file is byte-identical to v1.4. CSV/JSON downloads include the complete transcription.

Every source record has a brief “What this suggests for science & religion” note alongside its numerical reading. These are labelled editorial interpretations for the course, not new survey-author findings. They distinguish perceived conflict, uncertainty, affiliation, belief, formal study and technological judgments. Main-figure takeaways also state the course relevance.

The page uses the full available width with responsive gutters, larger figure headings and a single vertical reading path.

The developer credit, survey date and source attribution remain visible. No respondent-level correlations, pooled rates, causal estimates or significance tests are added.

## Structure

- `index.html`: semantic page structure and methods.
- `assets/css/styles.css`: responsive presentation.
- `assets/js/main.js`: document assembly, anchor compatibility and CSV exports.
- `assets/js/report.js`: complete question charts and source-table archive.
- `assets/js/visuals.js`: grouped comparisons and finding-led figures, derived from the same published data.
- `assets/js/insights.js`: deterministic numerical readings and evidence-linked course interpretations.
- `assets/js/data.js`: browser-ready copy of the structured data.
- `data/survey.json`: canonical transcription with provenance.
- `data/survey.csv`: the same published values in long format.
- `scripts/validate_data.py`: standard-library checks; optional independent PDF verification.
- `scripts/extract_data.py`: reproducible extraction from the source PDF.
- `scripts/publish.sh`: safe GitHub/main/root Pages workflow.
- `DATA_NOTES.md`: limitations and transcription rules.
- `VALIDATION.md`: verification performed for this release.

## Validate or reproduce

The website itself needs no Python libraries or build process. To validate the supplied data, use Python 3.9 or later:

    python3 scripts/validate_data.py

To regenerate from the original PDF, install PyMuPDF and Poppler (`pdftotext`) in your preferred environment, obtain the source PDF, then run:

    python3 scripts/extract_data.py /absolute/path/Data-tables-combined.pdf
    python3 scripts/validate_data.py --source-pdf /absolute/path/Data-tables-combined.pdf

The optional PDF validation compares all published percentage and dash cells using a second extraction method based on PDF word coordinates. The source SHA-256 is recorded in `data/survey.json`.

## Publish

The supplied installer defaults to `/Users/Renlong/Projects/GitHub/YIN-Renlong/science-religion-survey`. It creates timestamped backups before overwriting changed project files and uses explicit file paths when staging. It does not force-push or overwrite unrelated history.

To publish from this project directory:

    bash scripts/publish.sh

The publishing script uses your authenticated `gh` CLI, an HTTPS origin, `main`, and GitHub Pages from `/`. A new repository is public. An existing private repository stays private. The script reports Pages configuration failures rather than claiming a successful deployment.

Intended repository: https://github.com/YIN-Renlong/science-religion-survey

Expected Pages address after publication: https://yin-renlong.github.io/science-religion-survey/

## Version 1.5 upgrade

Run the updated installer against the same project directory. Changed files receive timestamped backups, unchanged data files keep their content and modification times, and existing Git history and the repository are reused. See `CHANGELOG.md`. Dashboard version: 1.5.0. Dataset version: 1.0.0.

Old question and table links still open their source record. Earlier main-topic links either lead to the current figure or the relevant reference section. The return button closes both source sections and returns to the figure that opened the reference.

The dot and lollipop axes run from 0 to 100%. The heatmap uses a clearly labelled 0–50% colour scale. Uncertainty bands show the minimum and maximum of eight published question values, not confidence intervals. Waffle squares represent percentage points, not individual respondents. Stacks are never rescaled; the 99% morality row retains its rounding gap. Published nets are read directly from the tables.

Optional development checks use Node:

    node scripts/validate_insights.cjs
    node scripts/validate_report.cjs

The report check verifies ten default figures, six chart forms, 134 exact source values, the waffle’s cell counts, major comparison claims, 91 contextual readings, individually closed reference records, all 91 source records, all 16,749 published tokens and working internal links.

## Attribution and rights

Original research: Theos and The Faraday Institute for Science and Religion. Polling: YouGov. Authors: Nick Spencer and Hannah Waite. Visualisation and transcription: YIN Renlong. This is not an official site of any research organisation.

Source PDFs are linked, not bundled. This project does not assert an open licence over the source research, questionnaire, tables or branding. No blanket open-source licence is applied to those materials. Reuse must respect the respective rights holders' terms.

No visitor responses, analytics, or personal data are collected by the application. The chosen hosting provider may maintain ordinary access logs.
