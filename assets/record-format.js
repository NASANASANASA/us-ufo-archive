/* Shared by the static builder and the interactive archive. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.UAP_RECORD_FORMAT = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const time = '\\d{1,2}:\\d{2}(?::\\d{2})?';
  const range = `${time}[ \\t]*[-–—][ \\t]*${time}`;
  const timelineStart = new RegExp(`(^|[^\\d\\n:\\-–—])[ \\t]*(${range}[ \\t]*[:：]|${time}[ \\t]*[:：](?!\\d))`, 'g');
  const timecode = new RegExp(`\\b${time}(?:[ \\t]*[-–—][ \\t]*${time})?[ \\t]*[:：]?`, 'g');
  const translatedTime = '\\d{1,2}[ \\t]*[:：h][ \\t]*\\d{2}(?:[ \\t]*[:：][ \\t]*\\d{2})?';
  const rangeMarker = new RegExp(`${translatedTime}(?:[ \\t]*[-–—~～〜][ \\t]*(?:${translatedTime}|\\d{1,2}h))?`, 'g');
  const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);

  function basicDescription(value) {
    return String(value || '').replace(/\u00a0/g, ' ').trim()
      .replace(/\r\n?/g, '\n')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/(^|\n)(\d)\n+(\d{1,2}:\d{2}(?:-\d{1,2}:\d{2})?[:：])/g, '$1$2$3')
      .replace(/(\d{1,2}:\d{2})-\s*\n+\s*(\d{1,2}:\d{2})/g, '$1-$2');
  }

  function normalizeDescription(value, officialDescription) {
    let text = basicDescription(value);
    if (officialDescription !== undefined) {
      const sourceRanges = timelineRanges(basicDescription(officialDescription));
      const translatedRanges = timelineRanges(text);
      // Restore labels only when entries align one-to-one; never infer a time.
      if (sourceRanges.length && sourceRanges.length === translatedRanges.length) {
        let index = 0;
        text = text.replace(rangeMarker, (marker, offset) => isTimelineRange(text, offset, marker)
          ? sourceRanges[index++] : marker);
      }
    }
    return text
      // Some translations flattened timeline entries into one line.
      .replace(timelineStart, (_, prefix, marker) => prefix ? `${prefix.trimEnd()}\n${marker}` : marker)
      .replace(/\n{3,}/g, '\n\n');
  }

  function isTimelineRange(text, offset, marker) {
    const prefix = text.slice(0, offset).split('\n').pop();
    return !prefix.trim() || /^[ \t]*[:：]/.test(text.slice(offset + marker.length));
  }

  function timelineRanges(text) {
    return [...text.matchAll(rangeMarker)]
      .filter(match => isTimelineRange(text, match.index, match[0]))
      .map(match => match[0]);
  }

  function descriptionHtml(value) {
    return escapeHtml(normalizeDescription(value))
      .replace(timecode, marker => `<span class="record-timecode">${marker}</span>`)
      .replace(/\n/g, '<br>\n');
  }

  function titleKey(value) {
    return String(value || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function detailDate(record, sources) {
    const source = sources[titleKey(record.id)];
    return source || {kind: 'incidentDate', value: record.incidentDate || 'N/A'};
  }

  return {normalizeDescription, descriptionHtml, titleKey, detailDate};
});
