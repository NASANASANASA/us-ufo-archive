/* Stream large official bundles with the filename used by the matching document bundle. */
(function () {
  const root = new URL('../', document.currentScript.src);
  let registrationPromise;

  async function prepareDownload() {
    if (!('serviceWorker' in navigator)) throw new Error('Service workers unavailable');
    const registration = await navigator.serviceWorker.register(new URL('bundle-download-worker.js', root), {
      scope: new URL('downloads/bundles/', root).pathname, updateViaCache: 'none'
    });
    const worker = registration.installing || registration.waiting || registration.active;
    if (!worker) throw new Error('Download worker unavailable');
    if (worker.state !== 'activated') await new Promise((resolve, reject) => {
      const timer = setTimeout(() => finish(new Error('Download worker activation timed out')), 15000);
      function finish(error) {
        clearTimeout(timer);
        worker.removeEventListener('statechange', changed);
        error ? reject(error) : resolve();
      }
      function changed() {
        if (worker.state === 'activated') finish();
        else if (worker.state === 'redundant') finish(new Error('Download worker failed'));
      }
      worker.addEventListener('statechange', changed);
      changed();
    });
  }

  document.addEventListener('click', async event => {
    const link = event.target.closest('a[data-video-bundle]');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (link.getAttribute('aria-busy') === 'true') return;
    link.setAttribute('aria-busy', 'true');
    try {
      registrationPromise ||= prepareDownload().catch(error => { registrationPromise = null; throw error; });
      await registrationPromise;
      const frame = document.createElement('iframe');
      frame.hidden = true;
      frame.src = new URL('downloads/bundles/' + encodeURIComponent(link.dataset.videoBundle), root);
      document.body.appendChild(frame);
    } catch (error) {
      // Preserve the official download on browsers without streaming-worker support.
      window.location.assign(link.href);
    } finally {
      link.removeAttribute('aria-busy');
    }
  });
})();
