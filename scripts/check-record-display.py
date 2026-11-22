#!/usr/bin/env python3
"""Audit detail dates and visible timeline line breaks across all 478 records."""
import argparse
import csv
import datetime
import html
import json
import pathlib
import re
import subprocess
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit

ROOT = pathlib.Path(__file__).resolve().parent.parent
LANGS = {'en': None, 'zh-Hans': 'zh-cn', 'zh-Hant': 'zh-tw', 'pl': 'pl', 'nl': 'nl', 'ja': 'ja',
         'es': 'es', 'pt': 'pt', 'ru': 'ru', 'fr': 'fr', 'de': 'de', 'ko': 'ko', 'ar': 'ar'}
RANGE = r'\d{1,2}:\d{2}(?::\d{2})?\s*[-–—]\s*\d{1,2}:\d{2}(?::\d{2})?'
LABEL = re.compile(r'^\s*(\d{1,2}:\d{2}(?::\d{2})?(?:[ \t]*[-–—][ \t]*\d{1,2}:\d{2}(?::\d{2})?)?)(?=[ \t]*[:：]|[ \t]+[^\d]|$)', re.M)


def labels(text):
    # The official CSV itself wraps a few labels mid-number / after the dash.
    text = re.sub(r'(^|\n)(\d)\n+(\d{1,2}:\d{2}(?:-\d{1,2}:\d{2})?[:：])', r'\1\2\3', text)
    text = re.sub(r'(\d{1,2}:\d{2})-\s*\n+\s*(\d{1,2}:\d{2})', r'\1-\2', text)
    text = re.sub(r'([^\d\n:–—-])[ \t]*(\d{1,2}:\d{2}(?::\d{2})?(?:[ \t]*[-–—][ \t]*\d{1,2}:\d{2}(?::\d{2})?)?[ \t]*[:：](?!\d))', r'\1\n\2', text)
    return [re.sub(r'\s+', '', match.group(1)) for match in LABEL.finditer(text)]


def key(value):
    return re.sub(r'\s+', ' ', value.replace('\u00a0', ' ')).strip()


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.active = False
        self.heading = 0
        self.description = []
        self.date_kind = None
        self.date_raw = None
        self.date = []
        self.in_date = False
        self.links = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for name in ('href', 'src', 'poster'):
            if attrs.get(name):
                self.links.append(attrs[name])
        if tag == 'article' and 'static-record-copy' in attrs.get('class', ''):
            self.active = True
        if self.active and tag == 'h2':
            self.heading += 1
        if self.active and self.heading == 2 and tag == 'br':
            self.description.append('\n')
        if tag == 'dd' and 'data-record-date-kind' in attrs:
            self.date_kind = attrs['data-record-date-kind']
            self.date_raw = attrs.get('data-record-date-raw')
            self.in_date = True

    def handle_endtag(self, tag):
        if self.active and self.heading == 2 and tag in ('p', 'h2'):
            self.description.append('\n')
        if tag == 'article':
            self.active = False
        if tag == 'dd':
            self.in_date = False

    def handle_data(self, value):
        if self.active and self.heading == 2:
            self.description.append(value)
        if self.in_date:
            self.date.append(value)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--official-csv', type=pathlib.Path, required=True)
    parser.add_argument('--dvids-pages', type=pathlib.Path, required=True)
    args = parser.parse_args()
    rows = list(csv.DictReader((ROOT / 'assets/uap-data.csv').open(encoding='utf-8-sig')))
    official = list(csv.DictReader(args.official_csv.open(encoding='utf-8-sig')))
    by_title = {key(row['Title']): row for row in official}
    dates = json.loads((ROOT / 'assets/record-detail-dates.json').read_text())['records']
    assert len(rows) == len(dates) == 478
    displays = json.loads(subprocess.check_output([
        'node', '-e', "const f=require('./assets/record-format.js');let s='';process.stdin.on('data',x=>s+=x);process.stdin.on('end',()=>{const {values,langs}=JSON.parse(s);process.stdout.write(JSON.stringify(values.map(v=>langs.map(l=>f.formatDate(v,l)))))});"
    ], input=json.dumps({'values': [dates[key(row['Title'])]['value'] for row in rows], 'langs': list(LANGS)}), text=True, cwd=ROOT))
    checked = 0
    timeline_entries = 0
    local_links = 0
    issues = []
    for index, row in enumerate(rows):
        title = row['Title']
        source = by_title.get(key(title))
        if source is None:
            candidates = [entry for entry in official if entry['Title'].split(',')[0] == title.split(',')[0]
                          and entry['Type'] == row['Type']]
            assert len(candidates) == 1
            source = candidates[0]
        expected = dates[key(title)]
        if source['Type'] in ('VID', 'AUD'):
            identifier = source['DVIDS Video ID']
            page = (args.dvids_pages / f'{identifier}.html').read_text()
            value = re.search(r'<td>Date Taken:</td>\s*<td>(.*?)</td>', page, re.S).group(1).strip()
            date = datetime.datetime.strptime(html.unescape(value), '%m.%d.%Y').strftime('%Y-%m-%d')
            assert expected['kind'] == 'dateTaken' and expected['value'] == date, title
        else:
            assert expected['kind'] == 'incidentDate'
            assert expected['value'] == (source['Incident Date'].strip() or 'N/A'), title
        slug = re.sub('[^a-z0-9]+', '-', title.lower().replace('&', ' and ')).strip('-')
        for lang_index, lang in enumerate(LANGS):
            path = ROOT / lang / 'records' / slug / 'index.html'
            rendered = Page()
            rendered.feed(path.read_text())
            for link in rendered.links:
                parsed = urlsplit(link)
                if parsed.scheme or parsed.netloc or not parsed.path:
                    continue
                target = (ROOT / unquote(parsed.path).lstrip('/')) if parsed.path.startswith('/') else (path.parent / unquote(parsed.path))
                assert target.exists(), (path, 'broken internal link', link)
                local_links += 1
            assert rendered.date_kind == expected['kind'], (title, lang, 'date label')
            assert rendered.date_raw == expected['value'], (title, lang, 'source date value')
            assert ''.join(rendered.date).strip() == displays[index][lang_index], (title, lang, 'localized date value')
            text = ''.join(rendered.description)
            assert labels(text) == labels(row['Description Blurb']), (title, lang, 'missing or altered time labels', labels(text), labels(row['Description Blurb']))
            for match in re.finditer(RANGE + r'\s*[:：]', text):
                timeline_entries += 1
                prefix = text[:match.start()].rsplit('\n', 1)[-1]
                if prefix.strip():
                    issues.append((title.split(',')[0], lang, 'timeline shares previous line', prefix[-60:]))
            checked += 1
    assert not issues, issues[:20]
    print(f'PASS: {checked} detail pages; all 478 official dates preserved and localized; '
          f'{timeline_entries} range entries start on separate lines; '
          f'all timeline labels match the source; {local_links} internal links resolve.')


if __name__ == '__main__':
    main()
