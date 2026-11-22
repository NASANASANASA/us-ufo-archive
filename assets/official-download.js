/* Download from official sources independently of display mirrors. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.UAP_OFFICIAL_DOWNLOAD = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function first(value) { return String(value || '').split('|').map(v => v.trim()).find(Boolean) || ''; }
  function official(url) {
    try {
      const host = new URL(url).hostname.toLowerCase();
      return host.endsWith('.gov') || host === 'd34w7g4gy10iej.cloudfront.net' || host === 'www.dvidshub.net';
    } catch (_) { return false; }
  }
  function select(doc, dates, videos) {
    const title = String(doc.id || '').replace(/\u00a0/g, ' ').trim();
    const id = doc.dvidsId || dates?.[title]?.dvidsId;
    let url = '';
    if (doc.type === 'PDF') url = first(doc.documentUrl);
    else if (doc.type === 'IMG') url = first(doc.imageUrl);
    else if (doc.type === 'VID' || doc.type === 'AUD') {
      url = (typeof UAP_OFFICIAL_VIDEO_DOWNLOADS === 'object' ? UAP_OFFICIAL_VIDEO_DOWNLOADS[id] : '') || videos?.[id] || String(doc.videoUrl || '').split('|').find(official) || '';
    }
    return official(url) ? url : '';
  }
  return {select, official};
});
