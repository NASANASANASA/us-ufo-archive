const crypto = require('crypto');

// Visible content, metadata, links and structured data affect modification dates.
// Build versions, tracking scripts, styles and formatting alone do not.
function fingerprint(html) {
  const content = html
    .replace(/<script\b([^>]*)>[\s\S]*?<\/script>/gi, (block, attrs) =>
      /type=["']application\/ld\+json["']/i.test(attrs) ? block : '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<link\b[^>]*rel=["'](?:stylesheet|preconnect|icon|apple-touch-icon|manifest)["'][^>]*>/gi, '')
    .replace(/<!--[^]*?-->/g, '')
    .replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();
  return crypto.createHash('sha256').update(content).digest('hex');
}

function nextEntry(html, previous, changedDate) {
  const hash = fingerprint(html);
  return {hash, lastmod: previous?.hash === hash ? previous.lastmod : changedDate};
}

module.exports = {fingerprint, nextEntry};
