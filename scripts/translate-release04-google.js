#!/usr/bin/env node
const fs = require('fs');
const https = require('https');
const path = require('path');

const root = path.resolve(__dirname, '..');
const targets = [
  ['assets/i18n-zh-cn.json', 'zh-CN'],
  ['assets/i18n-zh-tw.json', 'zh-TW'],
  ['assets/i18n-ja.json', 'ja'],
  ['assets/i18n-es.json', 'es']
];

function clean(value) {
  return String(value || '').replace(/\u00a0/g, ' ').trim();
}

function key(value) {
  return clean(value).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  text = text.replace(/^\uFEFF/, '');
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
  const headers = rows.shift().map(key);
  return rows
    .map((r, index) => ({index, row: Object.fromEntries(headers.map((h, i) => [h, clean(r[i])] ))}))
    .filter(({row}) => row.title);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function request(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {headers: {'User-Agent': 'Mozilla/5.0'}}, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 120)}`));
        else resolve(body);
      });
    }).on('error', reject);
  });
}

async function translateText(text, target) {
  text = clean(text);
  if (!text) return '';
  const paragraphs = text.replace(/\r\n?/g, '\n').split(/\n{2,}/).map(clean).filter(Boolean);
  const translated = [];
  for (const paragraph of paragraphs) {
    const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl='
      + encodeURIComponent(target) + '&dt=t&q=' + encodeURIComponent(paragraph);
    let parsed = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        parsed = JSON.parse(await request(url));
        break;
      } catch (error) {
        if (attempt === 2) throw error;
        await delay(500 * (attempt + 1));
      }
    }
    translated.push((parsed[0] || []).map(part => part[0]).join(''));
    await delay(120);
  }
  return translated.join('\n\n');
}

async function main() {
  const csv = parseCSV(fs.readFileSync(path.join(root, 'assets/uap-data.csv'), 'utf8'));
  const release04 = csv.filter(({row}) => row.releasedate === '7/10/26');
  for (const [file, target] of targets) {
    const filePath = path.join(root, file);
    const i18n = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`Translating ${release04.length} Release 04 records to ${target}`);
    for (const {index, row} of release04) {
      const entry = i18n[index] || {i: index};
      entry.i = index;
      entry.titleZh = await translateText(row.title, target);
      entry.descZh = await translateText(row.descriptionblurb, target);
      entry.locZh = await translateText(row.incidentlocation, target);
      entry.altZh = await translateText(row.imagealttext, target);
      entry.videoLengthRaw = entry.videoLengthRaw || '';
      i18n[index] = entry;
      console.log(`  ${target} ${index}: ${row.title.split(',')[0]}`);
    }
    fs.writeFileSync(filePath, JSON.stringify(i18n, null, 1) + '\n');
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
