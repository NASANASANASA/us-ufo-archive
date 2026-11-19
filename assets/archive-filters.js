/* URL filters used by the interactive archive and legacy index redirects. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.UAP_ARCHIVE_FILTERS = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function parse(query, docs) {
    const params = new URLSearchParams(query);
    const out = {};
    const release = params.get('release');
    if (release && docs.some(d => d.release === `RELEASE ${release}`)) out.activeRelease = `RELEASE ${release}`;
    for (const [param, field, target] of [['agency', 'agency', 'activeAgency'], ['location', 'incidentLocation', 'activeLocation'], ['type', 'type', 'activeType']]) {
      const value = params.get(param);
      if (value && docs.some(d => d[field] === value)) out[target] = value;
    }
    const year = params.get('year');
    if (year && (/^(19|20)\d{2}s?$/.test(year) || year === 'undated')) out.activeYear = year;
    if (params.get('media') === 'videos') out.activeTypeGroup = 'videos';
    return out;
  }
  function matchesYear(date, selected) {
    if (selected === 'all') return true;
    const year = (String(date || '').match(/\d{4}/) || [''])[0];
    if (selected === 'undated') return !year;
    return /^\d{4}$/.test(selected) ? year === selected : !!year && `${Math.floor(Number(year) / 10) * 10}s` === selected;
  }
  return {parse, matchesYear};
});
