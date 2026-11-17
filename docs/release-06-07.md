# Release 06 and 07 import

Official source: https://www.war.gov/UFO/

The official CSV was downloaded through Chrome from
https://www.war.gov/Portals/1/Interactive/2026/UFO/uap-data.csv.
Direct command-line requests to war.gov returned HTTP 403.

| Release | Published | Records | PDF | Video | Audio |
| --- | --- | ---: | ---: | ---: | ---: |
| 06 | 2026-09-18 | 75 | 59 | 15 | 1 |
| 07 | 2026-10-23 | 28 | 28 | 0 | 0 |

The 103 new records are appended after the existing 375 entries to preserve
the array-index translation mappings. Original titles, descriptions, source
URLs, dates, redactions, and pairing fields are retained. Literal `\n` escapes
in the downloaded descriptions are converted to paragraph breaks.

All 87 PDFs were matched by record identifier against the two official
document ZIPs, and both ZIPs passed CRC validation. Verified official previews
are stored in `assets/mirror/release-06/` and `assets/mirror/release-07/`.
86 PDF previews are byte-identical official thumbnails. D148 uses a clearly
marked PDF-cover fallback because its official thumbnail could not be loaded.
The original PDF downloads continue to point to the official source.
The 16 media previews, direct MP4 URLs, durations, and dates come from DVIDS.
Release 07 has no video bundle.

Ten translated metadata files accompany the English source. Translations use
the same Google translation service as the existing translation helper;
Chinese terminology received a further correction pass. Official English
remains the source of record. `TAG:AAWSAP` is treated as a shared topic when
displaying related records. Release 06 has no featured flags in the CSV, so
its showcase uses a selection of four records.

The subsequent [per-record audit](release-06-07-audit.md) documents all 103
browser link checks, image provenance, original media stream comparisons,
translation corrections, and source-data exceptions.

Maintenance commands:

```sh
python3 scripts/translate-releases.py --dates 9/18/2026 10/23/2026 --workers 4
python3 scripts/generate-release-previews.py --bundle-dir ~/Downloads
node scripts/build-static.js
python3 scripts/check-release67.py
```

The preview generator requires PyMuPDF. Translation progress is saved after
each completed record; rerunning skips completed entries. Official document
bundles are linked from each language's Downloads page.
