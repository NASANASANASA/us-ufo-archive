# Uniform bundle filenames — 2026-11-17

All document and video packages use two-digit release numbers:

- `release_01_documents.zip` through `release_07_documents.zip`
- `release_01_videos.zip` through `release_06_videos.zip`

Release 07 contains no video bundle. All 11 language download pages use the same filenames.

The builder generates `assets/release-bundles.js` from the release links and verified document mirrors. `assets/release-document-bundles.json` records each document package's original official filename, byte length, SHA-256 and R2 multipart ETag. Every uploaded part's MD5 and the completed object's multipart ETag and length are compared with the original download. The original ZIPs are copied without extracting or repacking them.

Official document endpoints restrict cross-origin requests, preventing a static site from overriding their native download names. The seven original ZIP files are mirrored in the existing `uap-archives-media` R2 bucket at `bundles/release_XX_documents.zip`, with the standardized attachment filename in object metadata. Their links therefore retain the uniform filename even without the page's download helper.

`assets/bundle-download.js` registers a service worker scoped only to `/downloads/bundles/`. `bundle-download-worker.js` sets the requested attachment filename and passes the response body through as a stream. Document bundles come from the verified mirror; video bundles retain the official CDN URLs. The implementation never buffers a whole ZIP, caches it or repacks it. The worker accepts only the 13 allowlisted packages and GET/HEAD methods, preserves range metadata and leaves normal website requests outside its scope. Unsupported clients retain a direct source link.

Validation:

- `node scripts/check-bundle-downloads.js`: all 13 filenames on all 11 language pages, response headers, streamed bytes, range requests, HEAD, restricted scope, allowlist and direct-source fallback.
- R2 upload verification: original ZIP validity, source SHA-256, per-part MD5, completed-object ETag and byte length.
- Browser download checks: actual filenames in Chrome's download list; test transfers canceled after confirming the name.
- JavaScript syntax checks, Release 06/07 regression checks and `git diff --check`.

Rebuild with `node scripts/build-static.js`. The helper and worker import use version `20261117-uniform-bundles2`.
