/* Downloads use native official links; refresh legacy download URL redirects. */
(function () {
  if (!('serviceWorker' in navigator)) return;
  const script = new URL(document.currentScript.src);
  const root = new URL('../', script);
  const worker = new URL('bundle-download-worker.js', root);
  worker.search = script.search;
  navigator.serviceWorker.register(worker, {
    scope: new URL('downloads/bundles/', root).pathname, updateViaCache: 'none'
  }).catch(() => {}); // Direct official links also work without a service worker.
})();
