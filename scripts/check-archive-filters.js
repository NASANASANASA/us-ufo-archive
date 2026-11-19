const assert = require('node:assert/strict');
const filters = require('../assets/archive-filters.js');
const docs = [{release: 'RELEASE 04', agency: 'FBI', incidentLocation: 'Western United States', type: 'VID'}];
assert.deepEqual(filters.parse('?release=04&agency=FBI&location=Western+United+States&type=VID&year=2023', docs), {
  activeRelease: 'RELEASE 04', activeAgency: 'FBI', activeLocation: 'Western United States', activeType: 'VID', activeYear: '2023'
});
assert.deepEqual(filters.parse('?media=videos&year=undated', docs), {activeYear: 'undated', activeTypeGroup: 'videos'});
assert.deepEqual(filters.parse('?release=99&agency=unknown&location=unknown&type=bad&year=<script>', docs), {});
assert(filters.matchesYear('July, 2023', '2023'));
assert(!filters.matchesYear('2022', '2023'));
assert(filters.matchesYear('2023', '2020s'));
assert(filters.matchesYear('N/A', 'undated'));
assert(!filters.matchesYear('1955', 'undated'));
assert(filters.matchesYear('N/A', 'all'));
console.log('PASS: exact-year, decade, location, agency, release, type, media and invalid URL filters.');
