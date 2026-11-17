/* This worker handles only the six allowlisted video bundle download paths.
 * It passes the official response stream through without buffering a ZIP. */
importScripts('./assets/release-video-bundles.js?v=20261117-bundle-names1');
const downloadPath = new URL('downloads/bundles/', self.location).pathname;
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(downloadPath)) return;
  event.respondWith(downloadBundle(event.request, url));
});

async function downloadBundle(request, url) {
  const filename = url.pathname.slice(downloadPath.length);
  if (!Object.prototype.hasOwnProperty.call(self.UAP_VIDEO_BUNDLES, filename))
    return new Response('Bundle not found', {status: 404});
  if (!['GET', 'HEAD'].includes(request.method))
    return new Response('Method not allowed', {status: 405, headers: {Allow: 'GET, HEAD'}});
  const source = self.UAP_VIDEO_BUNDLES[filename];
  try {
    const headers = new Headers();
    const range = request.headers.get('Range');
    if (range) headers.set('Range', range);
    const upstream = await fetch(source, {method: request.method, headers, mode: 'cors', credentials: 'omit'});
    if (!upstream.ok) return Response.redirect(source, 302);
    const output = new Headers({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    for (const header of ['Content-Length', 'Content-Range', 'Accept-Ranges', 'ETag', 'Last-Modified']) {
      if (upstream.headers.has(header)) output.set(header, upstream.headers.get(header));
    }
    return new Response(request.method === 'HEAD' ? null : upstream.body, {status: upstream.status, headers: output});
  } catch (error) {
    return Response.redirect(source, 302);
  }
}
