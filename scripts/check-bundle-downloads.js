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
    importScripts: () => vm.runInContext(fs.readFileSync('assets/release-video-bundles.js', 'utf8'), context),
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
  const names = ['Release_1_videos.zip', 'release_02_video_bundle.zip', 'release_03_videos.zip',
    'release_04_videos_071026.zip', 'release_05_Aug_07_videos.zip', 'videos_release_06_sept_18_2026.zip'];
  assert.deepEqual(Object.keys(self.UAP_VIDEO_BUNDLES), names);
  for (const name of names) {
    const response = await request(name);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Content-Disposition'), `attachment; filename="${name}"`);
    assert.equal(response.headers.get('Content-Length'), '8');
    assert(!response.bodyUsed, 'Download must remain a stream until the browser consumes it');
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes);
    assert.equal(calls.at(-1).url, self.UAP_VIDEO_BUNDLES[name]);
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
  assert.equal((await request(names[0])).headers.get('Location'), self.UAP_VIDEO_BUNDLES[names[0]]);
  for (const lang of ['en', 'zh-Hans', 'zh-Hant', 'ja', 'ko', 'es', 'pt', 'ru', 'fr', 'de', 'ar']) {
    const html = fs.readFileSync(`${lang}/downloads/index.html`, 'utf8');
    assert.deepEqual([...html.matchAll(/data-video-bundle="([^"]+)"/g)].map(m => m[1]), names);
    assert(html.includes('assets/bundle-download.js?v=20261117-bundle-names1'));
    for (const name of names) assert(html.includes(`download="${name}"`));
  }
  console.log('PASS: 6 paired video filenames across 11 languages; streamed bytes, download headers, range requests, HEAD, restricted scope, allowlist and official fallback.');
})().catch(error => { console.error(error); process.exitCode = 1; });
