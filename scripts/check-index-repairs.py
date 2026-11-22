#!/usr/bin/env python3
"""Verify every legacy redirect and video page against source data."""
import csv
import concurrent.futures
import datetime
import html
import json
import pathlib
import re
import sys
import xml.etree.ElementTree as ET
from urllib.parse import parse_qs, urljoin, urlsplit
from urllib.request import urlopen

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = 'https://uap-archives.org'
LANGS = ['en', 'es', 'pt', 'fr', 'de', 'ru', 'ar', 'nl', 'ja', 'ko', 'zh-Hans', 'zh-Hant']
rows = list(csv.DictReader((ROOT / 'assets/uap-data.csv').open(encoding='utf-8-sig')))
routes = json.loads((ROOT / 'assets/legacy-archive-routes.json').read_text())
reported = json.loads((ROOT / 'docs/search-console-404-2026-11-19.json').read_text())
assert len(reported) == 343
assert all(urlsplit(url).path in routes for url in reported)
sitemap = {x.text for x in ET.parse(ROOT / 'sitemap.xml').iter() if x.tag.endswith('}loc')}
assert len(sitemap) == 1 + (len(rows) + 6) * len(LANGS)
for path, destination in routes.items():
    source = (ROOT / path.strip('/') / 'index.html').read_text()
    refresh = html.unescape(re.search(r'<meta http-equiv="refresh" content="([^"]+)"', source)[1])
    assert refresh == '0; url=' + SITE + destination, path
    assert html.unescape(re.search(r'<link rel="canonical" href="([^"]+)"', source)[1]) == SITE + destination.split('#')[0]
    target = urlsplit(destination)
    assert target.path == '/' + path.split('/')[1] + '/', path
    assert (ROOT / target.path.strip('/') / 'index.html').exists()
    assert SITE + path not in sitemap, ('redirect in sitemap', path)
    params = parse_qs(target.query)
    if 'location' in params:
        assert any(r['Incident Location'].replace('\u00a0', ' ').strip() == params['location'][0] for r in rows), path
    if 'agency' in params:
        assert any(r['Agency'].replace('\u00a0', ' ').strip() == params['agency'][0] for r in rows), path
    if 'type' in params:
        assert any(r['Type'].strip() == params['type'][0] for r in rows), path
    if 'year' in params:
        assert any((re.search(r'\d{4}', r['Incident Date']).group() if re.search(r'\d{4}', r['Incident Date']) else 'undated') == params['year'][0] for r in rows), path

videos = 0
video_pages = set()
for row in rows:
    slug = re.sub('[^a-z0-9]+', '-', row['Title'].replace('\u00a0', ' ').lower().replace('&', ' and ')).strip('-')
    for lang in LANGS:
        path = ROOT / lang / 'records' / slug / 'index.html'
        source = path.read_text()
        schemas = [json.loads(block) for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', source, re.S)]
        objects = [entry for entry in schemas if isinstance(entry, dict) and entry.get('@type') == 'VideoObject']
        if row['Type'] != 'VID':
            assert not objects, (row['Title'], lang, 'non-video marked as video')
            continue
        assert len(objects) == 1, (row['Title'], lang)
        video = objects[0]
        assert video['thumbnailUrl'].count('https://') == 1 and urlsplit(video['thumbnailUrl']).netloc
        assert datetime.datetime.fromisoformat(video['uploadDate']).utcoffset() is not None
        sidebar = re.search(r'<aside class="static-panel static-record-media">(.*?)</aside>', source, re.S)
        assert sidebar and re.search(r'<(?:video|iframe)\b', sidebar[1]), 'player must be in the media sidebar'
        assert 'static-watch-player' not in source and 'static-video-record' not in source
        assert len(re.findall(r'<(?:video class="static-video-preview"|iframe class="youtube-embed")', source)) == 1
        poster = re.search(r' poster="([^"]+)"', source)
        if poster:
            assert urljoin(SITE, html.unescape(poster[1])) == video['thumbnailUrl']
        if video.get('contentUrl'):
            assert f'src="{html.escape(video["contentUrl"], quote=True)}"' in source
        assert video.get('embedUrl') != SITE + f'/{lang}/records/{slug}/'
        video_pages.add(SITE + f'/{lang}/records/{slug}/')
        videos += 1
ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9', 'v': 'http://www.google.com/schemas/sitemap-video/1.1'}
xml = ET.parse(ROOT / 'video-sitemap.xml')
entries = xml.findall('s:url', ns)
assert {entry.findtext('s:loc', namespaces=ns) for entry in entries} == video_pages
for entry in entries:
    assert entry.find('v:video/v:thumbnail_loc', ns).text.startswith('https://')
    assert entry.find('v:video/v:publication_date', ns).text
assert len(entries) == videos == sum(row['Type'] == 'VID' for row in rows) * len(LANGS)
print(f'PASS: all 343 reported 404s covered by {len(routes)} redirects; filter targets valid; '
      f'{videos} video pages and sitemap entries have sidebar players, local posters and valid timestamps; '
      f'{len(rows) * len(LANGS)} record schemas checked.')
if '--live' in sys.argv:
    def check_live(url):
        with urlopen(url, timeout=30) as response:
            assert response.status == 200, url
            source = response.read().decode()
        refresh = html.unescape(re.search(r'<meta http-equiv="refresh" content="([^"]+)"', source)[1])
        assert refresh == '0; url=' + SITE + routes[urlsplit(url).path], url
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
        list(executor.map(check_live, reported))
    print('PASS: all 343 Google-reported URLs serve the expected instant redirect on the live site.')
