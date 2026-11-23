/* Independently captured official Related Media results, checked for every language. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const api = require('../assets/record-relations.js');
const metadata = require('../assets/record-relations.json');
const audit = require('../docs/record-relations-audit.json');
const docs = audit.reference.map(r => ({id: r.title, slug: r.slug}));
const browser = {};
vm.runInNewContext(fs.readFileSync('assets/record-relations.js', 'utf8'), browser);
let pages = 0, links = 0;
for (const [i, doc] of docs.entries()) {
  const expected = audit.reference[i].related;
  assert.deepEqual(api.related(doc, docs, metadata).map(r => r.slug), expected, doc.id);
  assert.deepEqual(Array.from(browser.UAP_RECORD_RELATIONS.related(doc, docs, metadata), r => r.slug), expected, 'browser: ' + doc.id);
  for (const lang of ['en','es','pt','fr','de','ru','ar','nl','pl','ja','ko','zh-Hans','zh-Hant']) {
    const html = fs.readFileSync(`${lang}/records/${doc.slug}/index.html`, 'utf8');
    const actual = [...html.matchAll(/class="static-related-link" href="\.\.\/([^/]+)\/"/g)].map(m => m[1]);
    assert.deepEqual(actual, expected, `${lang}: ${doc.id}`);
    for (const target of actual) assert(fs.existsSync(`${lang}/records/${target}/index.html`), target);
    links += actual.length; pages++;
  }
}
const d174 = docs.find(d => d.id.startsWith('DOW-UAP-D174,'));
assert.equal(api.related(d174, docs, metadata).length, 60);
for (const lang of ['en','es','pt','fr','de','ru','ar','nl','pl','ja','ko','zh-Hans','zh-Hant']) {
  const html = fs.readFileSync(`${lang}/index.html`, 'utf8');
  assert.equal((html.match(/assets\/record-relations\.js\?v=/g) || []).length, 1);
  assert(html.indexOf('assets/record-relations.js') < html.indexOf('assets/site.js'));
}
console.log(`PASS: ${docs.length} official relation lists, browser/build parity, ${pages} pages and ${links} related links; D174 includes all 60 records.`);
