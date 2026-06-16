const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const csvFile = path.join(root, 'assets/uap-data.csv');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
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
  const headers = (rows.shift() || []).map(key);
  return rows
    .filter(r => r.some(clean))
    .map(r => Object.fromEntries(headers.map((h, i) => [h, clean(r[i])])));
}

function field(row, names) {
  for (const name of names) {
    const value = row[key(name)];
    if (value) return clean(value);
  }
  return '';
}

function inputRows() {
  return parseCSV(fs.readFileSync(csvFile, 'utf8')).map((row, i) => ({
    i,
    titleZh: field(row, ['asset file name', 'title', 'assetFileName']),
    descZh: field(row, ['description blurb', 'description', 'video description', 'record description', 'caption']),
    locZh: field(row, ['incident location', 'incidentLocation']),
    altZh: field(row, ['image alt text', 'alt text', 'altText']),
    type: field(row, ['type']).trim().toUpperCase(),
    videoLengthRaw: ''
  }));
}

async function translateOne(text, target) {
  text = clean(text);
  if (!text || text === 'N/A') return text;
  const params = new URLSearchParams({
    client: 'gtx',
    sl: 'en',
    tl: target,
    dt: 't',
    q: text
  });
  const url = `https://translate.googleapis.com/translate_a/single?${params}`;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 UAP archive translation build'
      }
    });
    if (response.ok) {
      const data = await response.json();
      return clean((data[0] || []).map(part => part[0]).join(''));
    }
    if (attempt === 4) throw new Error(`translate ${target} failed: ${response.status}`);
    await sleep(800 * attempt);
  }
}

function loadExisting(file) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) return [];
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

function save(file, rows) {
  fs.writeFileSync(path.join(root, file), `${JSON.stringify(rows, null, 1)}\n`);
}

async function build(target, file) {
  const rows = inputRows();
  const out = loadExisting(file);
  for (let i = 0; i < rows.length; i++) {
    if (out[i] && out[i].titleZh && out[i].descZh !== undefined) continue;
    const row = rows[i];
    out[i] = {
      i,
      titleZh: await translateOne(row.titleZh, target),
      descZh: await translateOne(row.descZh, target),
      locZh: await translateOne(row.locZh, target),
      altZh: await translateOne(row.altZh, target),
      type: row.type,
      videoLengthRaw: row.videoLengthRaw
    };
    if (i % 5 === 0) save(file, out);
    console.log(`${target} ${i + 1}/${rows.length}: ${row.titleZh}`);
    await sleep(120);
  }
  save(file, out);
}

async function main() {
  const targets = process.argv.slice(2);
  const plan = targets.length ? targets : ['ja', 'es'];
  for (const target of plan) {
    if (target === 'ja') await build('ja', 'assets/i18n-ja.json');
    else if (target === 'es') await build('es', 'assets/i18n-es.json');
    else throw new Error(`Unknown target: ${target}`);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
