const assert = require('assert/strict');
const fs = require('fs');
const vm = require('vm');
const {fingerprint, nextEntry} = require('./sitemap-dates');
const source = fs.readFileSync('assets/site-services.js', 'utf8');

function run(url) {
  const location = new URL(url), nodes = [], window = {};
  const document = {createElement: tag => ({tag}), head: {appendChild: node => nodes.push(node)}};
  vm.runInNewContext(source, {location, document, window});
  return {nodes, window};
}
for (const url of ['http://localhost:9011/', 'http://127.0.0.1/', 'http://[::1]/', 'file:///tmp/index.html', 'https://preview.example.org/', 'http://uap-archives.org/']) {
  const {nodes, window} = run(url);
  assert.equal(nodes.filter(n => n.tag === 'script').length, 0, url);
  assert.equal(window.dataLayer, undefined, url);
}
for (const url of ['https://uap-archives.org/', 'https://www.uap-archives.org/zh-Hant/']) {
  const {nodes, window} = run(url);
  assert.equal(nodes.filter(n => n.tag === 'script').length, 2);
  assert.equal(nodes.find(n => /adsbygoogle/.test(n.src)).crossOrigin, 'anonymous');
  assert.equal(window.dataLayer.length, 2);
}
const html = '<html><head><title>Record</title><script src="a.js?v=1"></script></head><body><p>Official text</p></body></html>';
const previous = {hash: fingerprint(html), lastmod: '2026-11-17'};
assert.equal(nextEntry(html.replace('v=1', 'v=2'), previous, '2026-11-21').lastmod, '2026-11-17');
assert.equal(nextEntry(html.replace('Official text', 'Corrected text'), previous, '2026-11-21').lastmod, '2026-11-21');
assert.equal(nextEntry(html.replace('</head>', '<script type="application/ld+json">{"name":"New"}</script></head>'), previous, '2026-11-21').lastmod, '2026-11-21');
assert.equal(nextEntry(html, undefined, '2026-11-21').lastmod, '2026-11-21');
console.log('PASS: preview hosts make no ad/analytics requests; production loads both services; sitemap dates change for content/schema, not script versions.');
