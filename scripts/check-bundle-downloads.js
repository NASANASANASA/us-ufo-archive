const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
(async () => {
  const handlers = {};
  const self = {location: new URL('https://uap-archives.org/bundle-download-worker.js'),
    skipWaiting: async () => {}, addEventListener: (name, fn) => {handlers[name] = fn;}};
  const context = vm.createContext({self, URL, Request, Response, Headers,
    importScripts: () => vm.runInContext(fs.readFileSync('assets/release-bundles.js', 'utf8'), context),
    fetch: () => assert.fail('Official downloads must not be proxied')});
  vm.runInContext(fs.readFileSync('bundle-download-worker.js', 'utf8'), context);
  const names = Array.from({length: 7}, (_, i) => [`release_0${i + 1}_documents.zip`, ...(i < 6 ? [`release_0${i + 1}_videos.zip`] : [])]).flat();
  assert.deepEqual(Object.keys(self.UAP_BUNDLES), names);
  async function request(name, method = 'GET') {
    let response;
    handlers.fetch({request: new Request('https://uap-archives.org/downloads/bundles/' + name, {method}),
      respondWith: value => {response = value;}});
    return response;
  }
  const sources = JSON.parse(fs.readFileSync('assets/release-document-bundles.json', 'utf8'));
  for (const name of names) {
    const url = self.UAP_BUNDLES[name];
    assert(['www.war.gov', 'd34w7g4gy10iej.cloudfront.net'].includes(new URL(url).hostname));
    const response = await request(name);
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('Location'), url);
    assert.equal((await request(name, 'HEAD')).headers.get('Location'), url);
    if (name.includes('documents')) {
      const source = sources[name.slice(8, 10)];
      assert.equal(url, source.officialSourceUrl);
      assert.equal(source.url, url);
    }
  }
  assert.equal((await request('unknown.zip')).status, 404);
  assert.equal((await request('__proto__')).status, 404);
  assert.equal((await request(names[0], 'POST')).status, 405);
  let handled = false;
  handlers.fetch({request: new Request('https://uap-archives.org/en/'), respondWith: () => {handled = true;}});
  assert(!handled);
  for (const lang of ['en', 'zh-Hans', 'zh-Hant', 'nl', 'ja', 'ko', 'es', 'pt', 'ru', 'fr', 'de', 'ar']) {
    const html = fs.readFileSync(`${lang}/downloads/index.html`, 'utf8');
    const links = [...html.matchAll(/<a class="download-bundle" href="([^"]+)" data-bundle="([^"]+)"/g)];
    assert.deepEqual(links.map(m => m[2]), names);
    for (const link of links) assert.equal(link[1], self.UAP_BUNDLES[link[2]]);
    assert(html.includes('bundle-download.js?v=20261121-official-source1'));
  }
  const helper = fs.readFileSync('assets/bundle-download.js', 'utf8');
  assert(!helper.includes('preventDefault'));
  assert(!helper.includes('fetch('));
  console.log('PASS: all 13 bundle links across 12 languages use official sources; legacy URLs redirect safely without proxying or requiring CORS.');
})().catch(error => {console.error(error); process.exitCode = 1;});
