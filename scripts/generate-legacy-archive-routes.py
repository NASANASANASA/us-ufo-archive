#!/usr/bin/env python3
"""Map deliberately removed archive indexes to the current archive filters."""
import csv
import io
import json
import pathlib
import re
import subprocess
from urllib.parse import urlencode

ROOT = pathlib.Path(__file__).resolve().parent.parent
REMOVAL = '237b3e249dd08393520b0fb67b82521292634d06'
LANGS = ['en', 'es', 'pt', 'fr', 'de', 'ru', 'ar', 'ja', 'ko', 'zh-Hans', 'zh-Hant']


def slug(value):
    return re.sub('[^a-z0-9]+', '-', value.replace('\u00a0', ' ').strip().lower().replace('&', ' and ')).strip('-')


rows = list(csv.DictReader(io.StringIO(subprocess.check_output(
    ['git', 'show', REMOVAL + '^:assets/uap-data.csv'], cwd=ROOT, text=True))))
values = {'agencies': {}, 'locations': {}, 'years': {}, 'types': {}}
for row in rows:
    year = re.search(r'(19|20)\d{2}', row['Incident Date'])
    fields = {'agencies': row['Agency'] or 'U.S. Government',
              'locations': row['Incident Location'] or 'N/A',
              'years': year.group() if year else 'undated', 'types': row['Type']}
    for kind, raw in fields.items():
        values[kind][slug(raw)] = raw.replace('\u00a0', ' ').strip()
values['locations']['westen-united-states'] = 'Westen United States'
values['locations']['western-united-states'] = 'Western United States'
removed = subprocess.check_output(['git', 'diff', '--name-only', '--diff-filter=D', REMOVAL + '^', REMOVAL], cwd=ROOT, text=True)
paths = {'/' + path[:-10] for path in removed.splitlines() if path.endswith('/index.html')}
for lang in LANGS:
    paths.update([f'/{lang}/archive/', f'/{lang}/locations/westen-united-states/'])
routes = {}
for path in sorted(paths):
    segments = path.strip('/').split('/')
    lang, kind = segments[:2]
    params = {}
    if kind in values and len(segments) > 2:
        raw = values[kind][segments[2]]
        params[{'agencies': 'agency', 'locations': 'location', 'years': 'year', 'types': 'type'}[kind]] = raw
    elif kind == 'release':
        params['release'] = segments[2]
    elif kind in ['uap-videos', 'uap-images', 'uap-pdf-records']:
        params.update({'media': 'videos'} if kind == 'uap-videos' else {'type': 'IMG' if kind == 'uap-images' else 'PDF'})
    routes[path] = f'/{lang}/' + ('?' + urlencode(params) if params else '') + '#releases'
(ROOT / 'assets/legacy-archive-routes.json').write_text(json.dumps(routes, ensure_ascii=False, indent=2) + '\n')
print(f'Generated {len(routes)} legacy index redirects.')
