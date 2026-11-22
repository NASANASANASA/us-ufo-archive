/* Legacy bundle URLs redirect to official downloads without proxying file bytes. */
importScripts('./assets/release-bundles.js?v=20261121-official-source1');
const downloadPath = new URL('downloads/bundles/', self.location).pathname;
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(downloadPath)) return;
  const filename = url.pathname.slice(downloadPath.length);
  let response;
  if (!Object.prototype.hasOwnProperty.call(self.UAP_BUNDLES, filename)) response = new Response('Bundle not found', {status: 404});
  else if (!['GET', 'HEAD'].includes(event.request.method)) response = new Response('Method not allowed', {status: 405, headers: {Allow: 'GET, HEAD'}});
  else response = Response.redirect(self.UAP_BUNDLES[filename], 302);
  event.respondWith(Promise.resolve(response));
});
