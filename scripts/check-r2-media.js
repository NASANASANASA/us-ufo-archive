const https = require('https');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const manifestPath = process.argv[2] || path.join(root, 'assets/release-04-r2-manifest.tsv');
const mediaBase = (process.env.UAP_MEDIA_BASE || 'https://media.uap-archives.org/').replace(/\/?$/, '/');

const rows = fs.readFileSync(manifestPath, 'utf8').trim().split(/\r?\n/).slice(1)
  .map(line => {
    const [type, title, r2Key, officialPreviewUrl] = line.split('\t');
    return {type, title, r2Key, officialPreviewUrl};
  })
  .filter(row => row.r2Key);

function head(url) {
  return new Promise(resolve => {
    const req = https.request(url, {method: 'HEAD'}, res => {
      res.resume();
      resolve({url, status: res.statusCode, type: res.headers['content-type'] || '', size: res.headers['content-length'] || ''});
    });
    req.on('error', err => resolve({url, status: 'ERR', error: err.message}));
    req.setTimeout(15000, () => {
      req.destroy(new Error('timeout'));
    });
    req.end();
  });
}

(async () => {
  let ok = 0;
  const missing = [];
  for (const row of rows) {
    const url = `${mediaBase}${row.r2Key}`;
    const res = await head(url);
    const good = Number(res.status) >= 200 && Number(res.status) < 400;
    if (good) ok++;
    else missing.push({...row, status: res.status, error: res.error || ''});
    console.log(`${good ? 'OK' : 'MISS'}\t${res.status}\t${row.type}\t${row.r2Key}`);
  }
  console.log(`\n${ok}/${rows.length} R2 media objects are reachable at ${mediaBase}`);
  if (missing.length) process.exitCode = 1;
})();
