const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/site.js'), 'utf8').split('(function(){')[0];

function runtime(fetch, extra = {}) {
  const context = vm.createContext({
    document:{addEventListener(){}}, fetch, setTimeout, clearTimeout, AbortController,
    UAP_ASSET_BASE:'https://example.test/assets/', UAP_DATA_VERSION:'test',
    UAP_LOCAL_CSV:'https://example.test/assets/uap-data.csv', ...extra
  });
  Object.defineProperty(context, 'localStorage', {get(){throw new Error('Storage denied')}});
  vm.runInContext(source, context);
  return context;
}

async function main() {
  const context = runtime(async () => ({ok:true,text:async () => 'csv',json:async () => ({ok:true})}));
  assert.equal(vm.runInContext("uapStorage.get('test')", context), null);
  vm.runInContext("uapStorage.set('test','value')", context);
  assert.equal(await context.uapFetchResource('/ok', 'text'), 'csv');
  assert.equal((await context.uapFetchResource('/ok', 'json')).ok, true);

  const unavailable = runtime(async () => ({ok:false,status:503}));
  assert.equal(await unavailable.uapFetchResource('/optional', 'json', 'fallback'), 'fallback');
  await assert.rejects(unavailable.uapFetchResource('/critical', 'text'), /503/);
  for (const fetch of [() => new Promise(() => {}), async () => ({ok:true,json:() => new Promise(() => {})})]) {
    // Both a stalled connection and a stalled response body must time out.
    const stalled = runtime(fetch);
    assert.equal(await stalled.uapFetchResource('/slow', 'json', 'timeout', 5), 'timeout');
    const withoutAbort = runtime(fetch, {AbortController:undefined});
    await assert.rejects(withoutAbort.uapFetchResource('/slow', 'json', undefined, 5), /timeout/);
  }

  const locales = {cn:'zh-cn',tw:'zh-tw',ja:'ja',es:'es',pt:'pt',ru:'ru',fr:'fr',de:'de',ko:'ko',ar:'ar',pl:'pl',nl:'nl'};
  for (const lang of ['en', ...Object.keys(locales)]) {
    const requested = [];
    const loader = runtime(async url => {
      requested.push(url);
      return {ok:true,text:async () => 'csv',json:async () => url.includes('i18n-') ? [{title:lang}] : url.includes('record-detail-dates') ? {records:{}} : {}};
    });
    const result = await loader.uapLoadArchiveResources(lang);
    assert.equal(result.csvText, 'csv');
    assert.equal(requested.length, lang === 'en' ? 4 : 5);
    const translations = requested.filter(url => url.includes('i18n-'));
    assert.equal(translations.length, lang === 'en' ? 0 : 1);
    if (lang !== 'en') {
      assert.match(translations[0], new RegExp(`i18n-${locales[lang]}\\.json`));
      assert.equal(result.translation[0].title, lang);
    }
    assert.ok(requested.every(url => url.startsWith('https://example.test/assets/')));
  }
  const optionalFailure = runtime(async url => {
    if (url.endsWith('.csv')) return {ok:true,text:async () => 'csv'};
    throw new Error('Network unavailable');
  });
  const fallback = await optionalFailure.uapLoadArchiveResources('cn');
  assert.equal(fallback.csvText, 'csv');
  assert.equal(fallback.translation.length, 0);
  assert.equal(Object.keys(fallback.recordDates.records).length, 0);

  const languageDirs = ['en','es','pt','fr','de','ru','ar','nl','pl','ja','ko','zh-Hans','zh-Hant'];
  for (const lang of languageDirs) {
    const home = fs.readFileSync(path.join(root, lang, 'index.html'), 'utf8');
    assert.equal((home.match(/data-static-fallback="true"/g) || []).length, 20, lang);
    assert.equal((home.match(/id="archive-load-fallback"/g) || []).length, 1, lang);
    assert.ok(home.includes('href="./archive-text/"'), lang);
    assert.ok(!home.includes('fonts.googleapis.com'), lang);
    for (const match of home.matchAll(/data-record-url="\.\/([^"]+)"/g)) assert.ok(fs.existsSync(path.join(root, lang, match[1], 'index.html')));
    const directory = fs.readFileSync(path.join(root, lang, 'archive-text/index.html'), 'utf8');
    const links = [...directory.matchAll(/class="static-row" href="\.\.\/(records\/[^"]+)"/g)];
    assert.equal(links.length, 521, lang);
    for (const match of links) assert.ok(fs.existsSync(path.join(root, lang, match[1], 'index.html')));
    assert.ok(!directory.includes('fonts.googleapis.com'), lang);
  }
  console.log('Network loading checks passed: storage restrictions, HTTP failures, connection/body timeouts, current-language loading, 13 static fallbacks and 6,773 directory links.');
}

main().catch(error => {console.error(error);process.exitCode=1});
