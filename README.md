# Science, Religion & Public Perception

Version 1.2.0 is a single-column scrolling report.

An independent, static visualisation of the published Theos–Faraday–YouGov survey tables. Created by YIN Renlong.

Fieldwork: 5 May–13 June 2021. Report: Nick Spencer and Hannah Waite, *‘Science and Religion’: Moving away from the shallow end* (Theos, 2022).

## Use

Open `index.html` directly. There are no external JavaScript, CSS, font, or API dependencies. For a local HTTP preview, run from this directory:

    python3 -m http.server 8000

Then visit http://localhost:8000. The data are loaded through a local classic script, so the report also works under `file://` without a development server.

For optional development only, `package.json` supplies a Vite preview server. Node/npm are not required for opening, serving, or publishing the website. The optional development packages are not loaded by visitors.

## Contents

- One continuous, single-column report with optional section anchors; no dropdowns, question picker, tabs or collapsed content.
- A compatibility wording comparison, followed by four separate science-by-wording matrices for agreement, disagreement, don't know and neutral responses.
- All 75 main table records and 16 generational appendix records, each with an overall-response chart and a short descriptive reading. Published nets are shown separately from their components.
- A visible appendix containing every group value and its published base. Tables become vertical group cards on narrow screens, without horizontal scrolling.
- Visible methodology, source-page links, CSV/JSON downloads and developer attribution beside the logo.

The 91 records contain 16,749 published percentage cells and dash symbols. They are not 91 distinct questionnaire items and do not represent the complete respondent-level dataset. All are included on the page; the long appendix follows the question charts.

## Structure

- `index.html`: semantic page structure and methods.
- `assets/css/styles.css`: responsive presentation.
- `assets/js/main.js`: document assembly, anchor compatibility and CSV exports.
- `assets/js/report.js`: complete chart and table markup, with no display filters.
- `assets/js/insights.js`: deterministic descriptive chart readings.
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

## Version 1.2 upgrade

Run the updated installer against the same project directory. Changed files receive timestamped backups, unchanged data files are left byte-identical, and the existing Git history and repository are reused. See `CHANGELOG.md`. The dashboard version is 1.2.0; the unchanged dataset remains 1.0.0.

Previously shared explorer links lead to the corresponding question or its full group table. New links use ordinary question, topic and table anchors. They do not change which content appears.

Chart notes report maxima, ties and percentage-point gaps at the published precision. They do not imply statistical significance or causation. No group intersections are invented and a dash is never treated as zero.

Optional development checks use Node:

    node scripts/validate_insights.cjs
    node scripts/validate_report.cjs

The report check verifies all 91 charts, four matrices, all 16,749 exact published tokens, working internal anchors, and absence of selection controls.

## Attribution and rights

Original research: Theos and The Faraday Institute for Science and Religion. Polling: YouGov. Authors: Nick Spencer and Hannah Waite. Visualisation and transcription: YIN Renlong. This is not an official site of any research organisation.

Source PDFs are linked, not bundled. This project does not assert an open licence over the source research, questionnaire, tables or branding. No blanket open-source licence is applied to those materials. Reuse must respect the respective rights holders' terms.

No visitor responses, analytics, or personal data are collected by the application. The chosen hosting provider may maintain ordinary access logs.
