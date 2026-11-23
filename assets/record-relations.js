/* Match the official PURSUE Related Media rules; preserve official list order. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.UAP_RECORD_RELATIONS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const titleKey = value => String(value || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  const normalizeKey = value => String(value || '').toLowerCase().replace(/\s+/g, '').replace(/-/g, '');
  const splitPairings = value => String(value || '').split('|').map(s => s.trim()).filter(Boolean);
  const tagName = value => (String(value).match(/^TAG\s*:\s*(.+)$/i)?.[1] || '').trim().toLowerCase();
  const cache = new WeakMap();
  function related(record, records, metadata) {
    let prepared = cache.get(records);
    if (!prepared || prepared.metadata !== metadata) {
      const entries = new Map(records.map(item => {
        const entry = metadata.records[titleKey(item.id || item.title)];
        if (!entry) throw new Error('Official relation metadata missing: ' + (item.id || item.title));
        return [item, entry];
      }));
      prepared = {metadata, entries, ordered: records.slice().sort((a, b) => entries.get(a).order - entries.get(b).order)};
      cache.set(records, prepared);
    }
    const getPairings = item => {const entry = prepared.entries.get(item);return [...splitPairings(entry.videoPairing), ...splitPairings(entry.pdfPairing)];};
    const pairings = [...new Set(getPairings(record))], tags = new Set(pairings.map(tagName).filter(Boolean));
    const out = [], seen = new Set();
    const add = item => {if (item !== record && !seen.has(item)) {seen.add(item);out.push(item);}};
    for (const pair of pairings) {
      if (/^TAG\s*:/i.test(pair)) continue;
      const key = normalizeKey(pair);
      for (const item of prepared.ordered) {
        const entry = prepared.entries.get(item);
        if (normalizeKey(entry.title).includes(key) || normalizeKey(entry.documentUrl).includes(key) || normalizeKey(entry.videoUrl) === key) add(item);
      }
    }
    if (tags.size) {
      for (const item of prepared.ordered) if (getPairings(item).some(pair => tags.has(tagName(pair)))) add(item);
      out.sort((a, b) => String(prepared.entries.get(a).title || '').trim().localeCompare(String(prepared.entries.get(b).title || '').trim(), 'en', {sensitivity: 'base', numeric: true}));
    }
    return out;
  }
  return {related};
});
