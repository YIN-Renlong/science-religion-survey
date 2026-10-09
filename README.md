# Science, Religion & Public Perception

Version 1.3.0 is a single-column visual report with optional source detail.

An independent, static visualisation of the published Theos–Faraday–YouGov survey tables. Created by YIN Renlong.

Fieldwork: 5 May–13 June 2021. Report: Nick Spencer and Hannah Waite, *‘Science and Religion’: Moving away from the shallow end* (Theos, 2022).

## Use

Open `index.html` directly. There are no external JavaScript, CSS, font, or API dependencies. For a local HTTP preview, run from this directory:

    python3 -m http.server 8000

Then visit http://localhost:8000. The data are loaded through a local classic script, so the report also works under `file://` without a development server.

For optional development only, `package.json` supplies a Vite preview server. Node/npm are not required for opening, serving, or publishing the website. The optional development packages are not loaded by visitors.

## Contents

- Thirteen visible figures lead with findings, including ranked bars, agreement–disagreement comparisons, uncertainty ranges and a comparison of qualifications.
- The main reading flow covers compatibility, all four science-question wordings, uncertainty, the limits of science, confidence in understanding, evolution, views of religion, technology, age and qualifications.
- Section anchors are optional. No dropdown, question selector or tab is needed to read the main findings.
- Two reference sections are closed by default: the full question-chart archive and the complete published tables. Clicking a chart label opens its exact question. Direct table links open the relevant source section automatically.
- All 75 main table records and 16 generational appendix records remain available, including all 16,749 published percentage cells and dashes. CSV/JSON downloads retain the complete transcription.
- Source links, methods, question-specific bases and developer attribution remain visible.

The default page is an editorial selection of comparisons, not an exhaustive sequence of every question. The complete source archive is retained for audit and reuse. Its 91 records include repeated questions and are not 91 distinct questionnaire items or respondent-level microdata.

## Structure

- `index.html`: semantic page structure and methods.
- `assets/css/styles.css`: responsive presentation.
- `assets/js/main.js`: document assembly, anchor compatibility and CSV exports.
- `assets/js/report.js`: complete question charts and source-table archive.
- `assets/js/visuals.js`: grouped comparisons and finding-led figures, derived from the same published data.
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

## Version 1.3 upgrade

Run the updated installer against the same project directory. Changed files receive timestamped backups, unchanged data files are left byte-identical, and existing Git history and the repository are reused. See `CHANGELOG.md`. The dashboard version is 1.3.0; the dataset remains 1.0.0.

The large tables shown by default in v1.2 are now closed reference sections. Previously shared question and group links still open the corresponding source record. Closing a reference section returns to the visual findings.

Every bar uses a common 0–100% scale. In the opposing-bar charts, both sides start at zero in the centre; they are separate percentages, not negative observations. Neutral and unknown responses remain separately labelled. Uncertainty bands span the minimum and maximum across eight published questions and are not confidence intervals. No values are normalised or reconstructed from rounded components.

Optional development checks use Node:

    node scripts/validate_insights.cjs
    node scripts/validate_report.cjs

The report check verifies the 13-figure default structure, every labelled source value in the new comparisons, closed reference sections, all 91 source records, all 16,749 exact published tokens and working internal links.

## Attribution and rights

Original research: Theos and The Faraday Institute for Science and Religion. Polling: YouGov. Authors: Nick Spencer and Hannah Waite. Visualisation and transcription: YIN Renlong. This is not an official site of any research organisation.

Source PDFs are linked, not bundled. This project does not assert an open licence over the source research, questionnaire, tables or branding. No blanket open-source licence is applied to those materials. Reuse must respect the respective rights holders' terms.

No visitor responses, analytics, or personal data are collected by the application. The chosen hosting provider may maintain ordinary access logs.
