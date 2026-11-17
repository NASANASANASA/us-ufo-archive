# Video bundle filenames — 2026-11-17

All six video bundle filenames now follow the filename of the corresponding official document bundle. Release 07 has no video bundle.

| Release | Document bundle | Video bundle filename |
| --- | --- | --- |
| 01 | `Release_1.zip` | `Release_1_videos.zip` |
| 02 | `release_02_document_bundle.zip` | `release_02_video_bundle.zip` |
| 03 | `release_03_documents.zip` | `release_03_videos.zip` |
| 04 | `release_04_documents_071026.zip` | `release_04_videos_071026.zip` |
| 05 | `release_05_Aug_07_documents.zip` | `release_05_Aug_07_videos.zip` |
| 06 | `documents_release_06_sept_18_2026.zip` | `videos_release_06_sept_18_2026.zip` |

The builder derives the video filename from each document URL and generates `assets/release-video-bundles.js`, keeping the six source URLs and filenames together. All 11 download pages use those names.

Cross-origin `download` attributes alone cannot enforce a filename. `assets/bundle-download.js` registers a service worker scoped exclusively to `/downloads/bundles/`, then starts a download through that path. `bundle-download-worker.js` sets the attachment filename and passes through the official CDN response body as a stream. The largest ZIP exceeds 5GB; the implementation does not read the ZIP into a Blob or ArrayBuffer, cache it, or repack it. Range requests, length and range metadata are preserved. Unlisted filenames and methods are rejected. Normal site pages remain outside the worker's scope. Unsupported browsers or upstream failures retain the original official download as a fallback.

Validation:

- All six official video sources returned success and `Access-Control-Allow-Origin: *` when requested with the site's Origin header. The source also supports byte ranges; the tested prefix begins with the ZIP signature.
- `node scripts/check-bundle-downloads.js` verifies the six filenames on all 11 pages, filename response headers, streamed bytes, range requests, HEAD, the restricted path and filename allowlist, and the official fallback.
- Each of the six buttons was clicked in Chrome on the local download page. The browser's actual downloads list displayed the expected filename and an advancing download. Each test download was then canceled.
- JavaScript syntax checks, Release 06/07 regression checks and `git diff --check` passed.

Rebuild with `node scripts/build-static.js`. The download helper and worker import use version `20261117-bundle-names1`.
