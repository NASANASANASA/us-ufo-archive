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
