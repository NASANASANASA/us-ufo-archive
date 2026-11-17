#!/usr/bin/env python3
"""Audit Release 06/07 data, translations, generated pages, and local previews."""
import collections
import csv
import json
import io
import pathlib
import re
import subprocess
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit

ROOT = pathlib.Path(__file__).resolve().parent.parent
# Last published Release 01–05 dataset, retained as a regression baseline.
BASELINE = '8d830f48e34c741af245ce3985a471350448c992'
LANGS = {'en': None, 'zh-Hans': 'zh-cn', 'zh-Hant': 'zh-tw', 'ja': 'ja',
         'es': 'es', 'pt': 'pt', 'ru': 'ru', 'fr': 'fr', 'de': 'de', 'ko': 'ko', 'ar': 'ar'}
rows = list(csv.DictReader((ROOT / 'assets/uap-data.csv').open(encoding='utf-8-sig')))
assert len(rows) == 478
assert collections.Counter(r['Release Date'] for r in rows[375:]) == {'9/18/2026': 75, '10/23/2026': 28}
assert collections.Counter(r['Type'] for r in rows[375:]) == {'PDF': 87, 'VID': 15, 'AUD': 1}
codes = [r['Title'].split(',')[0] for r in rows]
assert len(codes[375:]) == len(set(codes[375:]))
assert not set(codes[:375]) & set(codes[375:])
old = list(csv.DictReader(io.StringIO(subprocess.check_output(['git', 'show', BASELINE + ':assets/uap-data.csv'], cwd=ROOT, text=True))))
assert rows[:375] == old, 'Existing record data changed'
media = json.loads((ROOT / 'assets/release-06-07-media.json').read_text())
assert len(media) == 103
video_map = (ROOT / 'assets/dvids-map.js').read_text()
video_meta = json.loads((ROOT / 'assets/dvids-meta.json').read_text())
sitemap = {entry.text for entry in ET.parse(ROOT / 'sitemap.xml').iter() if entry.tag.endswith('}loc')}


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ('href', 'src', 'poster') and value:
                self.links.append(value)


def slug(title):
    value = title.lower().replace('&', ' and ')
    return re.sub('[^a-z0-9]+', '-', value).strip('-')


for lang, translation in LANGS.items():
    if translation:
        file = f'assets/i18n-{translation}.json'
        entries = json.loads((ROOT / file).read_text())
        original = json.loads(subprocess.check_output(['git', 'show', BASELINE + ':' + file], cwd=ROOT, text=True))
        assert entries[:375] == original, f'{lang}: existing translations changed'
        assert len(entries) == len(rows), (lang, len(entries))
        for index, entry in enumerate(entries[375:], 375):
            assert entry and entry['i'] == index, (lang, index)
            for source, target in [('Title', 'titleZh'), ('Description Blurb', 'descZh'),
                                   ('Incident Location', 'locZh'), ('Image Alt Text', 'altZh')]:
                assert not rows[index][source].strip() or entry[target].strip(), (lang, index, target)
            assert codes[index] in entry['titleZh'], (lang, index, 'record identifier changed')
    assert len(list((ROOT / lang / 'records').glob('*/index.html'))) == 478
    home = (ROOT / lang / 'index.html').read_text()
    for asset in ('db-data', 'dvids-map', 'i18n-ui', 'site'):
        assert f'{asset}.js?v=20261117-release67-audit1' in home, (lang, asset, 'stale cache version')
    downloads = (ROOT / lang / 'downloads/index.html').read_text()
    assert downloads.count('class="release-download-card"') == 7
    assert 'href=""' not in downloads and '[undefined]' not in downloads
    for row in rows[375:]:
        path = ROOT / lang / 'records' / slug(row['Title']) / 'index.html'
        source = path.read_text()
        assert f'https://uap-archives.org/{lang}/records/{slug(row["Title"])}/' in sitemap
        assert '/assets/mirror/release-' in source
        assert 'release-06-07-media.js' in source
        if row['Title'].startswith('DOW-UAP-D174,'):
            assert 'href="../dow-uap-d110-aawsap-statement-of-objectives-july-2008/"' in source
        if row['Title'].startswith('DOW-UAP-PR159,'):
            assert 'href="../dow-uap-d102-project-blue-book-file-on-tremonton-film-utah-1952/"' in source
        parser = Links()
        parser.feed(source)
        for link in parser.links:
            parsed = urlsplit(link)
            if parsed.scheme or parsed.netloc or not parsed.path:
                continue
            local = (ROOT / unquote(parsed.path).lstrip('/')) if parsed.path.startswith('/') else (path.parent / unquote(parsed.path))
            assert local.exists(), (path, link)

for row in rows[375:]:
    code = re.sub('[^A-Z0-9]', '', row['Title'].split(',')[0])
    preview = ROOT / 'assets' / media[code]['url']
    assert preview.read_bytes().startswith(b'\xff\xd8'), preview
    if row['DVIDS Video ID']:
        assert f'"{row["DVIDS Video ID"]}"' in video_map
        assert video_meta[row['DVIDS Video ID']]['duration'] > 0

print('PASS: 103 new records, 11 languages, 103 previews, 16 media URLs, generated links and sitemap; existing records preserved.')
