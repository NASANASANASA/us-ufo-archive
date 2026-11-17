# Detail dates and description line breaks — 2026-11-17

Scope: all 478 records in Releases 01–07, across all 11 languages (5,258 detail pages), including the interactive archive's detail dialog.

## Dates

The official portal uses DVIDS **Date Taken** for its 150 video/audio records, and **Incident Date** for the remaining 328 records. Static detail pages previously displayed the CSV incident-date field for every type, losing the video's complete capture date.

`assets/record-detail-dates.json` records the exact source value, field kind, official title and source URL for each record. All 149 distinct DVIDS pages were fetched for verification; their Date Taken fields were compared independently with every generated page. Non-video dates are copied from the current official CSV, retaining year-only, month-only, ranges and unknown values without inventing precision. The source CSV's SHA-256 is retained in the date manifest. The one changed official title (DOW-UAP-D042) is matched by its unique record code and type when importing its date.

Examples checked in Chrome: PR135 displays **2025年1月1日** and the capture-date label in Traditional Chinese; CIA-UAP-D020 displays **1955年**, retaining year-only precision. DOW-UAP-D170 displays **2009年4月1日** instead of the source’s US-formatted `4/1/2009`. The archive detail dialog and independent detail page use the same date manifest and locale formatter. The formatter uses Gregorian `Intl.DateTimeFormat` with an explicit UTC time zone and each language’s conventions for date order, month names and digits. It separately handles years, months, complete dates, ranges, lists, decades, late-year dates and undated records; source precision is never expanded. The original source value remains in the manifest and in `data-record-date-raw` for auditing. The interactive archive’s list dates and release dates use the same formatter.

## Descriptions

The static builder and interactive dialog share `assets/record-format.js`. It preserves official single line breaks, gives flattened timeline entries their own lines, repairs wrapped time labels, and restores time-label notation from the English source when entries align one-to-one. Labels with a single timestamp and labels without a trailing colon are included. Time labels are never translated or inferred.

The audit also found legacy placeholder summaries without the official timeline for 23 videos in Portuguese, Russian, French, German, Korean and Arabic. Those 138 descriptions were regenerated from the complete English source using the project's existing Google translation endpoint; source time labels and line boundaries were retained outside translation. `record-description-repairs.json` logs each changed description's before/after SHA-256. All other pre-existing translation fields and the source CSV are preserved, enforced by the Release 06/07 regression check.

## Validation

- `node scripts/check-record-format.js`: shared Node/browser behavior, line breaks, single/range labels, localized notation, HTML escaping, 11-language date examples, range/list parsing, source precision and invalid-date rejection.
- `python3 scripts/check-record-display.py --official-csv <downloaded CSV> --dvids-pages <downloaded DVIDS pages>`: all 478 source dates, all 5,258 localized date fields and their unchanged original source values, all timeline label sequences, 5,205 separately displayed range entries and 239,415 resolving internal links.
- `python3 scripts/check-release67.py`: source data preserved; only hash-logged legacy descriptions changed; all new records, language pages, previews, asset versions, related links and sitemap entries verified.
- `scripts/audit-release67.py` using the PyMuPDF environment and official bundles: 103 records, 1,133 translated detail pages, official previews and original media stream evidence passed. MuPDF emits an existing structure-tree diagnostic for an official PDF; the audit completes successfully.
- JavaScript syntax checks and `git diff --check` passed.
- Chrome checks confirmed PR135’s visible line breaks and complete date, the preserved year-only date on CIA-UAP-D020, D170’s localized Chinese date in both the page and dialog, and PR135’s Korean date in the dialog.

Reproduction: `scripts/sync-detail-dates.py` imports the official dates offline from the downloaded CSV and DVIDS HTML files. `node scripts/build-static.js` rebuilds the complete multilingual site. The cache version is `20261117-local-dates1`.
