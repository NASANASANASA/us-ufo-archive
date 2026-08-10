# Cloudflare R2 media hosting

This site expects mirrored media at:

```text
https://media.uap-archives.org/release-04/documents/<official-image-filename>.jpg
https://media.uap-archives.org/release-04/thumbnails/<pdf-preview-filename>.jpg
https://media.uap-archives.org/release-05/documents/<official-pdf-filename>.pdf
https://media.uap-archives.org/release-05/thumbnails/<pdf-preview-filename>.jpg
https://media.uap-archives.org/release-05/videos/<official-video-filename>.mp4
```

Recommended Cloudflare setup:

1. Create an R2 bucket, for example `uap-archives-media`.
2. Attach the custom domain `media.uap-archives.org` to the bucket.
3. Upload Release 04 documents using `assets/release-04-r2-document-manifest.tsv`.
4. Upload Release 04 images and PDF preview thumbnails using `assets/release-04-r2-manifest.tsv`.
5. Upload Release 05 PDFs using `assets/release-05-r2-document-manifest.tsv`.
6. Upload Release 05 PDF preview thumbnails using `assets/release-05-r2-media-manifest.tsv`.
7. Upload Release 05 videos using `assets/release-05-r2-video-manifest.tsv`.
8. Keep large binaries in R2 or another CDN, not in this GitHub repository.

Release 05 includes three true IMG records (`FBI-UAP-D025`, `FBI-UAP-D029`, and `FBI-UAP-D031`). They are excluded from the Release 05 R2 manifests until the original image bytes are available from a reliable source; the official `war.gov` media endpoint currently blocks direct non-browser fetches.

The browser fallback order is:

```text
Cloudflare R2 -> GitHub Pages local mirror -> official war.gov URL -> unavailable fallback
```

Regenerate Release 04/05 document and preview manifests after changing `assets/uap-data.csv`:

```sh
node scripts/generate-r2-media-assets.js
```

Check what is already public on R2:

```sh
node scripts/check-r2-media.js assets/release-05-r2-document-manifest.tsv
node scripts/check-r2-media.js assets/release-05-r2-media-manifest.tsv
```

Upload prepared files from `/private/tmp/uap-r2/upload` with Wrangler:

```sh
R2_BUCKET=uap-archives-media node scripts/upload-r2-media.js
```

The upload script expects each local file to match its manifest key and writes MIME metadata. Files under `/documents/`, plus manifest rows with type `IMG`, are uploaded with `Content-Disposition: attachment` so record download buttons download instead of opening in the browser.

Example local path:

```text
/private/tmp/uap-r2/upload/release-05/documents/DOW-UAP-D101_IIR_Unresolved-UAP-Report-Gulf-of-Oman_2021.pdf
```

Cloudflare manual requirements:

1. Create the `uap-archives-media` R2 bucket.
2. Bind the custom domain `media.uap-archives.org` to that bucket.
3. Authenticate Wrangler with an API token that can write to the bucket.
