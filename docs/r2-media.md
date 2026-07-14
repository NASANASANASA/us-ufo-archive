# Cloudflare R2 media hosting

This site expects mirrored media at:

```text
https://media.uap-archives.org/release-04/<official-preview-filename>.jpg
```

Recommended Cloudflare setup:

1. Create an R2 bucket, for example `uap-archives-media`.
2. Attach the custom domain `media.uap-archives.org` to the bucket.
3. Upload Release 04 preview images using the keys listed in `assets/release-04-r2-manifest.tsv`.
4. Keep large videos in R2 or another video-capable CDN, not in this GitHub repository.

The browser fallback order is:

```text
Cloudflare R2 -> GitHub Pages local mirror -> official war.gov URL -> unavailable fallback
```

Regenerate the upload manifest after changing `assets/uap-data.csv`:

```sh
node scripts/generate-r2-manifest.js
```

Check what is already public on R2:

```sh
node scripts/check-r2-media.js
```

Upload prepared files from `/private/tmp/uap-r2/upload` with Wrangler:

```sh
R2_BUCKET=uap-archives-media node scripts/upload-r2-media.js
```

The upload script expects each local file to match its manifest key, for example:

```text
/private/tmp/uap-r2/upload/release-04/DOW-UAP-PR101_Unresolved-UAP-Report_South-China-Sea_2024.jpg
```

Cloudflare manual requirements:

1. Create the `uap-archives-media` R2 bucket.
2. Bind the custom domain `media.uap-archives.org` to that bucket.
3. Authenticate Wrangler with an API token that can write to the bucket.
