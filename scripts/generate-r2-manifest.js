const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const csvPath = path.join(root, 'assets/uap-data.csv');
const outPath = path.join(root, 'assets/release-04-r2-manifest.tsv');

const clean = value => String(value || '').replace(/\u00a0/g, ' ').trim();
const key = value => clean(value).toLowerCase().replace(/[^a-z0-9]/g, '');

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

const rows = parseCSV(fs.readFileSync(csvPath, 'utf8'));
const headers = rows.shift() || [];
const idx = Object.fromEntries(headers.map((name, i) => [key(name), i]));

const records = rows
  .filter(row => clean(row[idx.releasedate]) === '7/10/26')
  .map(row => {
    const title = clean(row[idx.assetfilename] || row[idx.title]);
    const type = clean(row[idx.type]);
    const previewUrl = clean(row[idx.modalimage] || row[idx.imageurl] || row[idx.thumbnailurl]);
    const file = (previewUrl.match(/\/071026\/Slideshow\/([^/?#]+)$/i) || [])[1] || '';
    return {
      title,
      type,
      file,
      r2Key: file ? `release-04/${file}` : '',
      officialPreviewUrl: previewUrl
    };
  })
  .filter(row => row.file);

const output = [
  ['type', 'title', 'r2Key', 'officialPreviewUrl'].join('\t'),
  ...records.map(row => [row.type, row.title, row.r2Key, row.officialPreviewUrl].join('\t'))
].join('\n') + '\n';

fs.writeFileSync(outPath, output);
console.log(`Wrote ${records.length} Release 04 media rows to ${path.relative(root, outPath)}`);
