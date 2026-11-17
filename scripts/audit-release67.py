#!/usr/bin/env python3
"""Compare every new record with the downloaded official CSV and bundles.

Requires PyMuPDF. Example:
python3 scripts/audit-release67.py --official-csv ~/Downloads/uap-data.csv \
    --bundle-dir ~/Downloads --saved-previews /tmp/uap-official-previews.json

Run the static build first. Browser click results and media stream comparisons
are recorded separately; this script combines them with the source audit.
"""
import argparse
import csv
import hashlib
import json
import pathlib
import re
import subprocess
import unicodedata
import zipfile
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit

import fitz

ROOT = pathlib.Path(__file__).resolve().parent.parent
LANGS = {'en': None, 'zh-Hans': 'zh-cn', 'zh-Hant': 'zh-tw', 'ja': 'ja',
         'es': 'es', 'pt': 'pt', 'ru': 'ru', 'fr': 'fr', 'de': 'de', 'ko': 'ko', 'ar': 'ar'}


def clean(value):
    return re.sub(r'\s+', ' ', str(value or '').replace('\\n', '\n').replace('\u00a0', ' ')).strip()


def digest(data):
    return hashlib.sha256(data).hexdigest()


def timecodes(value):
    value = unicodedata.normalize('NFKC', value).translate(str.maketrans('٠١٢٣٤٥٦٧٨٩', '0123456789'))
    value = value.replace('–', '-').replace('—', '-')
    return re.findall(r'\d{1,2}:\d{2}-\d{1,2}:\d{2}', value)


class Detail(HTMLParser):
    def __init__(self):
        super().__init__()
        self.active = False
        self.heading = 0
        self.description = []
        self.sources = []
        self.h1 = []
        self.in_h1 = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'article' and 'static-record-copy' in attrs.get('class', ''):
            self.active = True
        if self.active and tag == 'h2':
            self.heading += 1
        if self.active and self.heading == 2 and tag == 'br':
            self.description.append(' ')
        if tag == 'h1':
            self.in_h1 = True
        if tag in ('img', 'source') and attrs.get('src'):
            self.sources.append(attrs['src'])
        if tag == 'video' and attrs.get('poster'):
            self.sources.append(attrs['poster'])

    def handle_endtag(self, tag):
        if self.active and self.heading == 2 and tag in ('p', 'h2'):
            self.description.append(' ')
        if tag == 'article':
            self.active = False
        if tag == 'h1':
            self.in_h1 = False

    def handle_data(self, data):
        if self.active and self.heading == 2:
            self.description.append(data)
        if self.in_h1:
            self.h1.append(data)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--official-csv', type=pathlib.Path, required=True)
    parser.add_argument('--bundle-dir', type=pathlib.Path, required=True)
    parser.add_argument('--saved-previews', type=pathlib.Path)
    args = parser.parse_args()
    rows = list(csv.DictReader((ROOT / 'assets/uap-data.csv').open(encoding='utf-8-sig')))
    official = list(csv.DictReader(args.official_csv.open(encoding='utf-8-sig')))
    by_code = {row['Title'].split(',')[0]: row for row in official}
    media = json.loads((ROOT / 'assets/release-06-07-media.json').read_text())
    videos = {entry['code']: entry for entry in json.loads((ROOT / 'docs/release-06-video-audit.json').read_text())}
    clicks = {entry['code']: entry for entry in json.loads((ROOT / 'docs/release-06-07-browser-audit.json').read_text())['records']}
    saved = json.loads(args.saved_previews.read_text()) if args.saved_previews else {}
    translations = {lang: json.loads((ROOT / f'assets/i18n-{short}.json').read_text())
                    for lang, short in LANGS.items() if short}
    descriptions = [[(translations[lang][index]['descZh'] if short else row['Description Blurb']),
                     row['Description Blurb']]
                    for index, row in enumerate(rows[375:], 375) for lang, short in LANGS.items()]
    normalized = json.loads(subprocess.check_output([
        'node', '-e', "const f=require('./assets/record-format.js');let s='';process.stdin.on('data',x=>s+=x);process.stdin.on('end',()=>process.stdout.write(JSON.stringify(JSON.parse(s).map(([value,source])=>f.normalizeDescription(value,source)))));"
    ], input=json.dumps(descriptions), text=True, cwd=ROOT))
    bundles = {}
    for release, suffix in [('06', 'sept_18'), ('07', 'oct_23')]:
        bundle = zipfile.ZipFile(args.bundle_dir / f'documents_release_{release}_{suffix}_2026.zip')
        assert bundle.testzip() is None
        bundles[release] = bundle

    results = []
    for index, row in enumerate(rows[375:], 375):
        code = row['Title'].split(',')[0]
        release = '06' if row['Release Date'] == '9/18/2026' else '07'
        original = by_code[code]
        differences = [field for field in original if not field.startswith('Column')
                       and clean(row.get(field)) != clean(original.get(field))]
        assert not differences, (code, differences)
        key = re.sub('[^A-Z0-9]', '', code)
        preview = media[key]
        preview_bytes = (ROOT / 'assets' / preview['url']).read_bytes()
        assert digest(preview_bytes) == preview['sha256']
        result = {'code': code, 'release': release, 'type': row['Type'],
                  'officialFieldsMatch': True, 'previewKind': preview['previewKind'],
                  'previewSha256': preview['sha256'], 'previewSource': preview['sourceUrl'],
                  'browserListToDetail': clicks[code]['listToDetail'], 'languagesChecked': []}
        assert result['browserListToDetail']
        if preview['previewKind'] == 'official-thumbnail':
            assert preview['sourceUrl'] == original['Modal Image']
            if saved:
                assert digest(pathlib.Path(saved[code]['file']).read_bytes()) == digest(preview_bytes)
                result['officialThumbnailBytesMatch'] = True
        if row['Type'] == 'PDF':
            bundle = bundles[release]
            filename = unquote(urlsplit(row['PDF | Image Link']).path.rsplit('/', 1)[-1])
            names = [name for name in bundle.namelist() if not name.startswith('__MACOSX/')
                     and pathlib.Path(name).name == filename]
            assert len(names) == 1, (code, names)
            pdf_bytes = bundle.read(names[0])
            with fitz.open(stream=pdf_bytes, filetype='pdf') as document:
                assert len(document) > 0
                result.update(pdfFilename=filename, pdfSha256=digest(pdf_bytes), pdfPages=len(document))
                if preview['previewKind'] == 'pdf-cover':
                    image = document[0].get_pixmap(matrix=fitz.Matrix(1, 1), alpha=False)
                    assert digest(image.tobytes('jpeg', jpg_quality=85)) == digest(preview_bytes)
                    result['originalPdfCoverVerified'] = True
        else:
            video = videos[code]
            for field in ('decodePassed', 'remote206', 'remotePrefixMatchesOfficialBundle',
                          'onlineEncodedStreamsMatchBundle', 'onlineStreamPropertiesMatchBundle'):
                assert video[field], (code, field)
            result.update(dvidsId=video['dvidsId'], mediaStreamHashMatch=True,
                          mediaDecodePassed=True, mediaDuration=video['duration'])
            fresh = pathlib.Path('/tmp/uap-official-' + key + '.jpg')
            if fresh.exists():
                assert digest(fresh.read_bytes()) == digest(preview_bytes)
                result['officialThumbnailBytesMatch'] = True
        slug = re.sub('[^a-z0-9]+', '-', row['Title'].lower().replace('&', ' and ')).strip('-')
        for lang_index, (lang, short) in enumerate(LANGS.items()):
            file = ROOT / lang / 'records' / slug / 'index.html'
            detail = Detail()
            html = file.read_text()
            detail.feed(html)
            entry = translations[lang][index] if short else None
            title = entry['titleZh'] if entry else row['Title']
            description = entry['descZh'] if entry else row['Description Blurb']
            assert clean(''.join(detail.h1)) == clean(title), (code, lang, 'title')
            expected_description = normalized[(index - 375) * len(LANGS) + lang_index]
            assert re.sub(r'\s+', '', expected_description) in re.sub(r'\s+', '', ''.join(detail.description)), (code, lang, 'description')
            assert timecodes(description) == timecodes(row['Description Blurb']), (code, lang, 'timecodes')
            assert any(urlsplit(src).path == '/assets/' + preview['url'] for src in detail.sources), (code, lang, 'preview')
            if row['Type'] in ('VID', 'AUD'):
                assert videos[code]['url'] in detail.sources, (code, lang, 'media source')
            result['languagesChecked'].append(lang)
        results.append(result)
    for bundle in bundles.values():
        bundle.close()
    report = {'officialCsvSha256': digest(args.official_csv.read_bytes()), 'records': results}
    (ROOT / 'docs/release-06-07-record-audit.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(f'PASS: {len(results)} records compared against the official source; '
          f'{len(results) * len(LANGS)} detail pages checked; all original media streams match.')


if __name__ == '__main__':
    main()
