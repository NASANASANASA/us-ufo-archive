const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

(async () => {
  const root = new URL('https://uap-archives.org/');
  const handlers = {};
  const calls = [];
  let mode = 'normal';
  const bytes = new Uint8Array([80, 75, 3, 4, 1, 2, 3, 4]);
  const self = {location: new URL('bundle-download-worker.js', root), skipWaiting: async () => {},
    addEventListener: (name, callback) => { handlers[name] = callback; }};
  const context = vm.createContext({self, URL, Request, Response, Headers,
    importScripts: () => vm.runInContext(fs.readFileSync('assets/release-bundles.js', 'utf8'), context),
    fetch: async (url, options) => {
      calls.push({url, options});
      if (mode === 'failure') throw new Error('Offline');
      return new Response(options.method === 'HEAD' ? null : bytes, {
        status: mode === 'range' ? 206 : 200,
        headers: {'Content-Length': String(bytes.length), 'Accept-Ranges': 'bytes',
          ...(mode === 'range' ? {'Content-Range': 'bytes 0-7/100'} : {})}
      });
    }});
  vm.runInContext(fs.readFileSync('bundle-download-worker.js', 'utf8'), context);
  async function request(filename, options) {
    let response;
    handlers.fetch({request: new Request(new URL('downloads/bundles/' + filename, root), options),
      respondWith: value => { response = value; }});
    return response;
  }
  const names = Array.from({length: 7}, (_, i) => [`release_${String(i + 1).padStart(2, '0')}_documents.zip`, ...(i < 6 ? [`release_${String(i + 1).padStart(2, '0')}_videos.zip`] : [])]).flat();
  assert.deepEqual(Object.keys(self.UAP_BUNDLES), names);
  const mirrors = JSON.parse(fs.readFileSync('assets/release-document-bundles.json', 'utf8'));
  assert.equal(Object.keys(mirrors).length, 7);
  for (let i = 1; i <= 7; i++) {
    const release = String(i).padStart(2, '0');
    const filename = `release_${release}_documents.zip`;
    assert.equal(mirrors[release].filename, filename);
    assert.equal(self.UAP_BUNDLES[filename], `https://media.uap-archives.org/bundles/${filename}`);
    assert(mirrors[release].multipartMd5Verified && mirrors[release].size > 0);
    assert.match(mirrors[release].sha256, /^[a-f0-9]{64}$/);
  }
  for (const name of names) {
    const response = await request(name);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Content-Disposition'), `attachment; filename="${name}"`);
    assert.equal(response.headers.get('Content-Length'), '8');
    assert(!response.bodyUsed, 'Download must remain a stream until the browser consumes it');
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes);
    assert.equal(calls.at(-1).url, self.UAP_BUNDLES[name]);
  }
  mode = 'range';
  const partial = await request(names[0], {headers: {Range: 'bytes=0-7'}});
  assert.equal(partial.status, 206);
  assert.equal(partial.headers.get('Content-Range'), 'bytes 0-7/100');
  assert.equal(calls.at(-1).options.headers.get('Range'), 'bytes=0-7');
  mode = 'normal';
  const head = await request(names[0], {method: 'HEAD'});
  assert.equal(head.body, null);
  assert.equal(head.headers.get('Content-Disposition'), `attachment; filename="${names[0]}"`);
  const count = calls.length;
  assert.equal((await request('not-a-bundle.zip')).status, 404);
  assert.equal((await request('__proto__')).status, 404);
  assert.equal((await request(names[0], {method: 'POST'})).status, 405);
  assert.equal(calls.length, count, 'Unlisted paths and methods must not reach upstream');
  let handled = false;
  handlers.fetch({request: new Request('https://uap-archives.org/zh-Hant/'), respondWith: () => { handled = true; }});
  assert(!handled, 'Normal website requests must remain outside the worker');
  mode = 'failure';
  assert.equal((await request(names[0])).headers.get('Location'), self.UAP_BUNDLES[names[0]]);
  for (const lang of ['en', 'zh-Hans', 'zh-Hant', 'ja', 'ko', 'es', 'pt', 'ru', 'fr', 'de', 'ar']) {
    const html = fs.readFileSync(`${lang}/downloads/index.html`, 'utf8');
    assert.deepEqual([...html.matchAll(/data-bundle="([^"]+)"/g)].map(m => m[1]), names);
    assert(html.includes('assets/bundle-download.js?v=20261117-uniform-bundles2'));
    for (const name of names) assert(html.includes(`download="${name}"`));
  }
  let clickHandler, registeredUrl, registeredOptions;
  const frames = [];
  vm.runInNewContext(fs.readFileSync('assets/bundle-download.js', 'utf8'), {
    URL, setTimeout, clearTimeout,
    document: {currentScript: {src: 'https://uap-archives.org/assets/bundle-download.js?v=20261117-uniform-bundles2'},
      addEventListener: (_, handler) => { clickHandler = handler; }, createElement: () => ({}),
      body: {appendChild: frame => frames.push(frame)}},
    navigator: {serviceWorker: {register: async (url, options) => {
      registeredUrl = url; registeredOptions = options; return {active: {state: 'activated'}};
    }}}, window: {location: {assign: () => assert.fail('Unexpected fallback')}}
  });
  const attributes = {};
  const link = {href: self.UAP_BUNDLES[names[0]], dataset: {bundle: names[0]},
    getAttribute: key => attributes[key], setAttribute: (key, value) => { attributes[key] = value; },
    removeAttribute: key => { delete attributes[key]; }};
  await clickHandler({target: {closest: () => link}, button: 0, preventDefault() {}});
  assert.equal(registeredUrl.href, 'https://uap-archives.org/bundle-download-worker.js?v=20261117-uniform-bundles2');
  assert.equal(registeredOptions.scope, '/downloads/bundles/');
  assert.equal(String(frames[0].src), 'https://uap-archives.org/downloads/bundles/' + names[0]);
  assert(!attributes['aria-busy']);
  console.log('PASS: 13 uniform bundle filenames across 11 languages; streamed bytes, download headers, range requests, HEAD, restricted scope, allowlist and official fallback.');
})().catch(error => { console.error(error); process.exitCode = 1; });
