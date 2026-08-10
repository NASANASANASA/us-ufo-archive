const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const csvPath = path.join(root, 'assets/uap-data.csv');
const mediaVersion = process.env.UAP_MEDIA_VERSION || '20260718-seo1';
const mediaBase = (process.env.UAP_MEDIA_BASE || 'https://media.uap-archives.org/').replace(/\/?$/, '/');

const clean = value => String(value || '').replace(/\u00a0/g, ' ').trim();
const key = value => clean(value).toLowerCase().replace(/[^a-z0-9]/g, '');
const assetCode = value => clean(value).split(',')[0].toUpperCase().replace(/[^A-Z0-9]/g, '');
const filename = value => clean(value).split('?')[0].split('/').pop();
const isRelease = (value, release) => {
  const normalized = clean(value).replace(/^0/, '');
  return release === '04'
    ? ['7/10/26', '7/10/2026', '07/10/2026'].includes(normalized)
    : ['8/7/26', '8/7/2026', '08/07/2026', '8/8/26', '8/8/2026', '08/08/2026'].includes(normalized);
};

function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (c === '"' && quoted && n === '"') {
      cell += '"';
      i++;
    } else if (c === '"') {
      quoted = !quoted;
    } else if (c === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((c === '\n' || c === '\r') && !quoted) {
      if (cell || row.length) {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
      }
      if (c === '\r' && n === '\n') i++;
    } else {
      cell += c;
    }
  }
  if (cell || row.length) rows.push([...row, cell]);
  return rows;
}

function csvCell(value) {
  value = String(value || '');
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function writeCSV(rows) {
  return rows.map(row => row.map(csvCell).join(',')).join('\n') + '\n';
}

function manifestLine(row) {
  return [row.type, row.title, row.r2Key, row.sourceFile || row.officialUrl || ''].join('\t');
}

const rows = parseCSV(fs.readFileSync(csvPath, 'utf8'));
const headers = rows[0] || [];
const idx = Object.fromEntries(headers.map((name, i) => [key(name), i]));
const dataRows = rows.slice(1);

const release04Media = [];
const release05Docs = [];
const release05Media = [];

for (const row of dataRows) {
  const type = clean(row[idx.type]).toUpperCase();
  const title = clean(row[idx.title] || row[idx.assetfilename]);
  const assetUrl = clean(row[idx.pdfimagelink]);
  const modalIndex = idx.modalimage;
  const modalUrl = clean(row[modalIndex]);

  if (isRelease(row[idx.releasedate], '04') && ['PDF', 'IMG'].includes(type)) {
    const assetFile = filename(assetUrl);
    if (type === 'PDF' && assetFile) {
      const thumbFile = assetFile.replace(/\.pdf$/i, '.jpg');
      const officialUrl = assetUrl.replace('/documents/', '/thumbnails/').replace(/\.pdf$/i, '.jpg');
      row[modalIndex] = officialUrl;
      release04Media.push({type, title, r2Key: `release-04/thumbnails/${thumbFile}`, officialUrl});
    } else if (type === 'IMG' && assetFile) {
      row[modalIndex] = assetUrl;
      release04Media.push({type, title, r2Key: `release-04/documents/${assetFile}`, officialUrl: assetUrl});
    } else if (modalUrl) {
      const file = filename(modalUrl);
      release04Media.push({type, title, r2Key: `release-04/${file}`, officialUrl: modalUrl});
    }
  }

  // Release 05 IMG originals are not included here until their bytes are
  // available from a reliable source; war.gov blocks direct non-browser fetches.
  if (isRelease(row[idx.releasedate], '05') && type === 'PDF') {
    const assetFile = filename(assetUrl);
    if (assetFile) {
      const dir = type === 'PDF' ? 'documents' : 'images';
      release05Docs.push({type, title, r2Key: `release-05/${dir}/${assetFile}`, sourceFile: assetFile});
    }
    const modalFile = filename(modalUrl);
    if (modalFile) release05Media.push({type, title, r2Key: `release-05/thumbnails/${modalFile}`, officialUrl: modalUrl});
  }
}

fs.writeFileSync(csvPath, writeCSV(rows));

fs.writeFileSync(
  path.join(root, 'assets/release-04-r2-manifest.tsv'),
  ['type\ttitle\tr2Key\tofficialPreviewUrl', ...release04Media.map(manifestLine)].join('\n') + '\n'
);
fs.writeFileSync(
  path.join(root, 'assets/release-05-r2-document-manifest.tsv'),
  ['type\ttitle\tr2Key\tsourceFile', ...release05Docs.map(manifestLine)].join('\n') + '\n'
);
fs.writeFileSync(
  path.join(root, 'assets/release-05-r2-media-manifest.tsv'),
  ['type\ttitle\tr2Key\tofficialPreviewUrl', ...release05Media.map(manifestLine)].join('\n') + '\n'
);

const docRows = [
  ...readManifest('assets/release-04-r2-document-manifest.tsv'),
  ...readManifest('assets/release-05-r2-document-manifest.tsv')
];
const mediaRows = [
  ...readManifest('assets/release-04-r2-manifest.tsv'),
  ...readManifest('assets/release-05-r2-media-manifest.tsv')
];

function readManifest(file) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) return [];
  return fs.readFileSync(fullPath, 'utf8').trim().split(/\r?\n/).slice(1)
    .map(line => {
      const [type, title, r2Key] = line.split('\t');
      return {type, title, r2Key};
    })
    .filter(row => row.title && row.r2Key);
}

function mapObject(manifestRows) {
  return Object.fromEntries(manifestRows.map(row => [
    assetCode(row.title),
    {type: row.type, url: `${mediaBase}${row.r2Key}?v=${encodeURIComponent(mediaVersion)}`}
  ]));
}

const js = [
  `window.UAP_R2_DOCUMENTS=Object.assign(window.UAP_R2_DOCUMENTS||{},${JSON.stringify(mapObject(docRows), null, 2)});`,
  `window.UAP_R2_MEDIA=${JSON.stringify(mapObject(mediaRows), null, 2)};`
].join('\n');
fs.writeFileSync(path.join(root, 'assets/release-r2-media.js'), js + '\n');

console.log(`Updated Release 04 media rows: ${release04Media.length}`);
console.log(`Wrote Release 05 document rows: ${release05Docs.length}`);
console.log(`Wrote Release 05 media rows: ${release05Media.length}`);
