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

  const locales = {en: 'en-US', 'zh-Hans': 'zh-CN', 'zh-Hant': 'zh-TW', cn: 'zh-CN', tw: 'zh-TW',
    nl: 'nl-NL', ja: 'ja-JP', ko: 'ko-KR', es: 'es-ES', pt: 'pt-BR', ru: 'ru-RU', fr: 'fr-FR', de: 'de-DE', ar: 'ar-EG'};
  const months = 'January February March April May June July August September October November December'.split(' ');
  const monthNumber = name => months.findIndex(month => month.toLowerCase() === name.toLowerCase()) + 1;
  const formatters = new Map();

  // Parse only explicit source components, retaining each endpoint's precision.
  function parseDate(value) {
    const text = String(value || '').trim();
    let m;
    const date = (year, month, day) => {
      year = Number(year);
      if (year < 100) year += year > 26 ? 1900 : 2000;
      const result = {kind: 'date', year};
      if (month !== undefined) result.month = Number(month);
      if (day !== undefined) result.day = Number(day);
      if ((month !== undefined && (result.month < 1 || result.month > 12))
          || (day !== undefined && (result.day < 1 || result.day > 31))) return null;
      const check = new Date(Date.UTC(year, (result.month || 1) - 1, result.day || 1));
      return check.getUTCFullYear() === year && (!result.month || check.getUTCMonth() + 1 === result.month)
        && (!result.day || check.getUTCDate() === result.day) ? result : null;
    };
    const pair = (a, b, kind = 'range') => a && b ? {kind, values: [a, b]} : null;
    if (!text || text === 'N/A') return {kind: 'unknown'};
    if (/^Undated$/i.test(text)) return {kind: 'undated'};
    if ((m = text.match(/^(\d{4})s$/))) return {kind: 'decade', year: Number(m[1])};
    if ((m = text.match(/^Late\s+(\d{4})$/i))) return {kind: 'late', year: Number(m[1])};
    if ((m = text.match(/^(\d{1,2}\/\d{1,2}\/\d{2,4})\s*-\s*(\d{1,2}\/\d{1,2}\/\d{2,4})$/)))
      return pair(parseDate(m[1]), parseDate(m[2]));
    if ((m = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/))) return date(m[3], m[1], m[2]);
    if ((m = text.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/))) return date(m[1], m[2], m[3]);
    if ((m = text.match(/^(\d{4})$/))) return date(m[1]);
    if ((m = text.match(/^(\d{4})\s*-\s*(\d{4})$/))) return pair(date(m[1]), date(m[2]));
    if ((m = text.match(/^([A-Za-z]+),?\s+(\d{4})(?:-(\d{4}))?$/)) && monthNumber(m[1]))
      return m[3] ? pair(date(m[2], monthNumber(m[1])), date(m[3])) : date(m[2], monthNumber(m[1]));
    if ((m = text.match(/^([A-Za-z]+)\s+(\d{1,2})\s*-\s*(\d{1,2}),\s*(\d{4})$/)) && monthNumber(m[1]))
      return pair(date(m[4], monthNumber(m[1]), m[2]), date(m[4], monthNumber(m[1]), m[3]));
    if ((m = text.match(/^([A-Za-z]+)\s+(\d{1,2})\s*-\s*([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/)) && monthNumber(m[1]) && monthNumber(m[3]))
      return pair(date(m[5], monthNumber(m[1]), m[2]), date(m[5], monthNumber(m[3]), m[4]));
    if ((m = text.match(/^([A-Za-z]+)\s*([-]|,)\s*([A-Za-z]+)\s+(\d{4})$/)) && monthNumber(m[1]) && monthNumber(m[3]))
      return pair(date(m[4], monthNumber(m[1])), date(m[4], monthNumber(m[3])), m[2] === ',' ? 'list' : 'range');
    if (text.includes(',')) {
      const values = text.split(',').map(part => parseDate(part.trim()));
      if (values.every(Boolean)) return {kind: 'list', values};
    }
    return null;
  }

  function formatDate(value, language = 'en') {
    const lang = {cn: 'zh-Hans', tw: 'zh-Hant'}[language] || language;
    const locale = locales[lang] || locales.en;
    const number = year => new Intl.NumberFormat(locale, {useGrouping: false}).format(year);
    const dateText = entry => {
      const precision = entry.day ? 'day' : entry.month ? 'month' : 'year';
      const key = `${locale}-${precision}`;
      if (!formatters.has(key)) formatters.set(key, new Intl.DateTimeFormat(locale, {
        calendar: 'gregory', timeZone: 'UTC', year: 'numeric',
        ...(entry.month ? {month: 'long'} : {}), ...(entry.day ? {day: 'numeric'} : {})
      }));
      return formatters.get(key).format(new Date(Date.UTC(entry.year, (entry.month || 1) - 1, entry.day || 1)));
    };
    const render = entry => {
      if (entry.kind === 'date') return dateText(entry);
      if (entry.kind === 'unknown') return 'N/A';
      if (entry.kind === 'undated') return ({nl: 'Ongedateerd', en: 'Undated', 'zh-Hans': '日期不详', 'zh-Hant': '日期不詳',
        ja: '日付不明', ko: '날짜 미상', es: 'Sin fecha', pt: 'Sem data', ru: 'Без даты', fr: 'Sans date', de: 'Undatiert', ar: 'غير مؤرخ'})[lang] || 'Undated';
      if (entry.kind === 'range' || entry.kind === 'list') return entry.values.map(render).join(entry.kind === 'list'
        ? (['zh-Hans', 'zh-Hant', 'ja'].includes(lang) ? '、' : ', ')
        : ({'zh-Hans': '至', 'zh-Hant': '至', ja: '～', ko: ' ~ '})[lang] || ' – ');
      const year = number(entry.year);
      if (entry.kind === 'decade') return ({nl: `jaren ${year}`, en: `${year}s`, 'zh-Hans': `${year}年代`, 'zh-Hant': `${year}年代`,
        ja: `${year}年代`, ko: `${year}년대`, es: `década de ${year}`, pt: `década de ${year}`,
        ru: `${year}-е годы`, fr: `années ${year}`, de: `${year}er Jahre`, ar: `عقد ${year}`})[lang] || `${year}s`;
      if (entry.kind === 'late') return ({nl: `eind ${year}`, en: `Late ${year}`, 'zh-Hans': `${year}年末`, 'zh-Hant': `${year}年末`,
        ja: `${year}年末`, ko: `${year}년 말`, es: `finales de ${year}`, pt: `final de ${year}`,
        ru: `конец ${year} года`, fr: `fin ${year}`, de: `Ende ${year}`, ar: `أواخر ${year}`})[lang] || `Late ${year}`;
    };
    const parsed = parseDate(value);
    return parsed ? render(parsed) : String(value || '').trim();
  }

  return {normalizeDescription, descriptionHtml, titleKey, detailDate, parseDate, formatDate};
});
