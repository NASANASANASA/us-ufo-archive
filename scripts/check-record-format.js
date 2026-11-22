const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const format = require('../assets/record-format.js');

const source = 'Video Description:\n00:00-00:04: No content.\n00:05-00:10: Next.';
const rendered = format.descriptionHtml(format.normalizeDescription(source, source));
assert.match(rendered, /Video Description:<br>\n<span[^>]+>00:00-00:04:/);
assert.match(rendered, /No content\.<br>\n<span[^>]+>00:05-00:10:/);
assert.equal((rendered.match(/class="record-timecode"/g) || []).length, 2);
assert.equal(format.normalizeDescription('影片說明：00:00-00:04：無內容。00:05-00:10：下一段。'),
  '影片說明：\n00:00-00:04：無內容。\n00:05-00:10：下一段。');
assert.equal(format.normalizeDescription('00h00-00h04: Primeiro.\n00h05-00h10: Próximo.', source),
  '00:00-00:04: Primeiro.\n00:05-00:10: Próximo.');
assert.equal(format.normalizeDescription('00h48-13h: Fim.', '00:48-1:00: End.'), '00:48-1:00: Fim.');
assert.equal(format.normalizeDescription('説明：00:00～00:04：空白。00:05～00:10：次。', source),
  '説明：\n00:00-00:04：空白。\n00:05-00:10：次。');
assert.equal(format.normalizeDescription('Description: 00:05: First. 00:19: Second.'),
  'Description:\n00:05: First.\n00:19: Second.');
assert.equal(format.normalizeDescription('00h10 : Suite.\n00:57-01:05 : Fin.', '00:10: Next.\n00:57-01:05: End.'),
  '00:10 : Suite.\n00:57-01:05 : Fin.');
assert(!format.descriptionHtml('The observation is at 00:12 in the video.').includes('<br>'));
assert.match(format.descriptionHtml('<script>\n00:00-00:04: & test'), /&lt;script&gt;<br>/);
assert(!format.descriptionHtml('<script>alert(1)</script>').includes('<script>'));

const dates = {
  'Video, 2025': {kind: 'dateTaken', value: '2025-01-01'},
  'PDF, 1955': {kind: 'incidentDate', value: '1955'},
  'Month only': {kind: 'incidentDate', value: 'July, 2008'},
  'Unknown': {kind: 'incidentDate', value: 'N/A'}
};
for (const [id, expected] of Object.entries(dates))
  assert.deepEqual(format.detailDate({id, incidentDate: '2025'}, dates), expected);
assert.deepEqual(format.detailDate({id: 'No source', incidentDate: '2024'}, {}),
  {kind: 'incidentDate', value: '2024'});

const dateExamples = {pl: '1 kwietnia 2009', nl: '1 april 2009', en: 'April 1, 2009', 'zh-Hans': '2009年4月1日', 'zh-Hant': '2009年4月1日',
  ja: '2009年4月1日', ko: '2009년 4월 1일', es: '1 de abril de 2009', pt: '1 de abril de 2009',
  ru: '1 апреля 2009 г.', fr: '1 avril 2009', de: '1. April 2009', ar: '١ أبريل ٢٠٠٩'};
for (const [lang, expected] of Object.entries(dateExamples)) {
  assert.equal(format.formatDate('4/1/2009', lang), expected);
  assert.equal(format.formatDate('2009-04-01', lang), expected);
}
assert.equal(format.formatDate('July, 2008', 'zh-Hant'), '2008年7月');
assert.equal(format.formatDate('1955', 'zh-Hans'), '1955年');
assert.equal(format.formatDate('4/10/2025-4/11/2025', 'zh-Hant'), '2025年4月10日至2025年4月11日');
assert.equal(format.formatDate('June 3-7, 1965', 'ja'), '1965年6月3日～1965年6月7日');
assert.equal(format.formatDate('August 1952-1967', 'zh-Hant'), '1952年8月至1967年');
assert.equal(format.formatDate('September - December 1952', 'zh-Hant'), '1952年9月至1952年12月');
assert.equal(format.formatDate('March, April 2010', 'zh-Hant'), '2010年3月、2010年4月');
assert.equal(format.formatDate('2002, 2023-2024', 'zh-Hant'), '2002年、2023年至2024年');
assert.equal(format.formatDate('Late 2025', 'zh-Hant'), '2025年末');
assert.equal(format.formatDate('1970s', 'ko'), '1970년대');
assert.equal(format.formatDate('N/A', 'zh-Hant'), 'N/A');
assert.equal(format.formatDate('Undated', 'zh-Hant'), '日期不詳');
assert.equal(format.parseDate('2/30/2025'), null);
assert.equal(format.parseDate('2025-13-01'), null);
assert.equal(format.parseDate('2025-00-01'), null);
assert.deepEqual(format.parseDate('July, 2008'), {kind: 'date', year: 2008, month: 7});
assert.deepEqual(format.parseDate('1955'), {kind: 'date', year: 1955});
for (const entry of Object.values(JSON.parse(fs.readFileSync(require.resolve('../assets/record-detail-dates.json'))).records))
  assert(format.parseDate(entry.value), `Unsupported source date: ${entry.value}`);

const browser = {};
vm.runInNewContext(fs.readFileSync(require.resolve('../assets/record-format.js'), 'utf8'), browser);
assert.equal(browser.UAP_RECORD_FORMAT.descriptionHtml(source), rendered);
for (const [lang, expected] of Object.entries(dateExamples))
  assert.equal(browser.UAP_RECORD_FORMAT.formatDate('4/1/2009', lang), expected);
console.log('PASS: shared browser/build formatting, timeline breaks, source timecodes, escaping, and date precision.');
