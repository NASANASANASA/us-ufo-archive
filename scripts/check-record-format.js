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

const browser = {};
vm.runInNewContext(fs.readFileSync(require.resolve('../assets/record-format.js'), 'utf8'), browser);
assert.equal(browser.UAP_RECORD_FORMAT.descriptionHtml(source), rendered);
console.log('PASS: shared browser/build formatting, timeline breaks, source timecodes, escaping, and date precision.');
