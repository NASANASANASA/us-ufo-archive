#!/usr/bin/env python3
"""Translate selected releases, preserving existing CSV-indexed translations.

Usage: python3 scripts/translate-releases.py --dates 9/18/2026 10/23/2026
Uses the same public Google translation endpoint as translate-release04-google.js.
Completed records are saved incrementally so interrupted runs can be resumed.
"""
import argparse
import concurrent.futures
import csv
import json
import pathlib
import re
import threading
import time
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
TARGETS = {'zh-cn': 'zh-CN', 'zh-tw': 'zh-TW', 'ja': 'ja', 'es': 'es',
           'pt': 'pt', 'ru': 'ru', 'fr': 'fr', 'de': 'de', 'ko': 'ko', 'ar': 'ar'}
FIELDS = {'titleZh': 'Title', 'descZh': 'Description Blurb',
          'locZh': 'Incident Location', 'altZh': 'Image Alt Text'}
CACHE = {}
CACHE_LOCK = threading.Lock()


def translate(value, target):
    if not value.strip():
        return ''
    # Keep paragraph boundaries and requests below URL length limits.
    paragraphs = re.split(r'\n\s*\n', value.strip())
    output = []
    for paragraph in paragraphs:
        chunks = re.findall(r'.{1,2400}(?:\s|$)|.{1,2400}', paragraph, re.S)
        translated = []
        for chunk in chunks:
            cache_key = (target, chunk)
            with CACHE_LOCK:
                cached = CACHE.get(cache_key)
            if cached is not None:
                translated.append(cached)
                continue
            query = urllib.parse.urlencode({'client': 'dict-chrome-ex', 'sl': 'en', 'tl': target,
                                            'dt': 't', 'q': chunk})
            for attempt in range(6):
                try:
                    req = urllib.request.Request('https://translate.googleapis.com/translate_a/single?' + query,
                                                 headers={'User-Agent': 'Mozilla/5.0'})
                    with urllib.request.urlopen(req, timeout=60) as response:
                        result = json.load(response)
                    value = ''.join(part[0] or '' for part in result[0])
                    translated.append(value)
                    with CACHE_LOCK:
                        CACHE[cache_key] = value
                    time.sleep(0.6)
                    break
                except Exception:
                    if attempt == 5:
                        raise
                    time.sleep(2 ** attempt)
        output.append(' '.join(translated))
    return '\n\n'.join(output)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dates', nargs='+', required=True)
    parser.add_argument('--workers', type=int, default=8)
    args = parser.parse_args()
    records = list(csv.DictReader((ROOT / 'assets/uap-data.csv').open(encoding='utf-8-sig')))
    lock = threading.Lock()
    datasets = {}
    for name in TARGETS:
        file = ROOT / f'assets/i18n-{name}.json'
        datasets[name] = json.loads(file.read_text())
        while len(datasets[name]) < len(records):
            datasets[name].append(None)

    def work(task):
        name, index, row = task
        entry = {'i': index, 'videoLengthRaw': ''}
        for field, source in FIELDS.items():
            entry[field] = translate(row[source], TARGETS[name])
        with lock:
            datasets[name][index] = entry
            file = ROOT / f'assets/i18n-{name}.json'
            file.write_text(json.dumps(datasets[name], ensure_ascii=False, indent=1) + '\n')
            print(f'{name} {index}: {row["Title"].split(",")[0]}', flush=True)

    tasks = [(name, index, row) for name in TARGETS for index, row in enumerate(records)
             if row['Release Date'] in args.dates and not datasets[name][index]]
    print(f'Translating {len(tasks)} records', flush=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as executor:
        for result in executor.map(work, tasks):
            pass


if __name__ == '__main__':
    main()
