#!/usr/bin/env python3
"""Keep official detail dates distinct from the archive's incident-date column.

The source portal uses DVIDS Date Taken for VID/AUD detail views, and the
CSV Incident Date for other records. Dates are copied at the source's precision.
No month/day is inferred from a year or from a title.
"""
import argparse
import collections
import csv
import datetime
import hashlib
import html
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent


def key(value):
    return re.sub(r'\s+', ' ', value.replace('\u00a0', ' ')).strip()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--official-csv', type=pathlib.Path, required=True)
    parser.add_argument('--dvids-pages', type=pathlib.Path, required=True)
    args = parser.parse_args()
    local = list(csv.DictReader((ROOT / 'assets/uap-data.csv').open(encoding='utf-8-sig')))
    official = list(csv.DictReader(args.official_csv.open(encoding='utf-8-sig')))
    titles = {key(row['Title']): row for row in official}
    codes = collections.defaultdict(list)
    for row in official:
        codes[(row['Title'].split(',')[0], row['Type'])].append(row)
    dates = {}
    for row in local:
        source = titles.get(key(row['Title']))
        if source is None:
            candidates = codes[(row['Title'].split(',')[0], row['Type'])]
            assert len(candidates) == 1, row['Title']
            source = candidates[0]
        entry = {'kind': 'incidentDate', 'value': source['Incident Date'].strip() or 'N/A',
                 'officialTitle': source['Title'], 'sourceUrl': 'https://www.war.gov/Portals/1/Interactive/2026/UFO/uap-data.csv'}
        if source['Type'] in ('VID', 'AUD'):
            identifier = source['DVIDS Video ID']
            assert identifier, source['Title']
            page = (args.dvids_pages / f'{identifier}.html').read_text()
            match = re.search(r'<td>Date Taken:</td>\s*<td>(.*?)</td>', page, re.S)
            assert match, (identifier, 'Date Taken missing')
            raw = html.unescape(re.sub('<[^>]+>', '', match[1])).strip()
            # DVIDS exposes a complete calendar date; PURSUE renders it as ISO.
            value = datetime.datetime.strptime(raw, '%m.%d.%Y').strftime('%Y-%m-%d')
            entry.update(kind='dateTaken', value=value, dvidsId=identifier,
                         sourceUrl=f'https://www.dvidshub.net/video/{identifier}', sourceDateText=raw)
        dates[key(row['Title'])] = entry
    assert len(dates) == len(local)
    output = {'officialCsvSha256': hashlib.sha256(args.official_csv.read_bytes()).hexdigest(), 'records': dates}
    (ROOT / 'assets/record-detail-dates.json').write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n')
    print(f'Synchronized {len(dates)} official detail dates: '
          f'{sum(x["kind"] == "dateTaken" for x in dates.values())} Date Taken; '
          f'{sum(x["kind"] == "incidentDate" for x in dates.values())} Incident Date.')


if __name__ == '__main__':
    main()
