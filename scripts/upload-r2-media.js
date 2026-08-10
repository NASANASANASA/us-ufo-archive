const fs = require('fs');
const path = require('path');
const {spawnSync} = require('child_process');

const root = path.resolve(__dirname, '..');
const manifestPath = process.env.R2_MANIFEST || path.join(root, 'assets/release-04-r2-manifest.tsv');
const uploadDir = process.env.R2_UPLOAD_DIR || '/private/tmp/uap-r2/upload';
const bucket = process.env.R2_BUCKET || 'uap-archives-media';

const dryRun = process.argv.includes('--dry-run');
const contentTypeByExt = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  mp4: 'video/mp4'
};

const rows = fs.readFileSync(manifestPath, 'utf8').trim().split(/\r?\n/).slice(1)
  .map(line => {
    const [type, title, r2Key] = line.split('\t');
    return {type, title, r2Key};
  })
  .filter(row => row.r2Key);

const missing = [];
const present = [];

for (const row of rows) {
  const source = path.join(uploadDir, row.r2Key);
  if (fs.existsSync(source)) present.push({...row, source});
  else missing.push({...row, source});
}

console.log(`Upload directory: ${uploadDir}`);
console.log(`Bucket: ${bucket}`);
console.log(`Present: ${present.length}/${rows.length}`);

if (missing.length) {
  console.log('\nMissing local files:');
  for (const row of missing) console.log(`${row.type}\t${row.r2Key}\t${row.source}`);
}

if (dryRun || missing.length) {
  if (dryRun) console.log('\nDry run only; no uploads performed.');
  process.exitCode = missing.length ? 1 : 0;
  return;
}

for (const row of present) {
  const dest = `${bucket}/${row.r2Key}`;
  const ext = path.extname(row.r2Key).replace('.', '').toLowerCase();
  const contentType = contentTypeByExt[ext];
  const shouldAttach = row.r2Key.includes('/documents/') || row.type === 'IMG';
  const filename = path.basename(row.r2Key);
  const args = ['wrangler', 'r2', 'object', 'put', dest, '--file', row.source, '--remote'];
  if (contentType) args.push('--content-type', contentType);
  if (shouldAttach) args.push('--content-disposition', `attachment; filename="${filename}"`);
  console.log(`Uploading ${row.source} -> ${dest}`);
  const result = spawnSync('npx', args, {
    stdio: 'inherit'
  });
  if (result.status !== 0) process.exit(result.status || 1);
}
