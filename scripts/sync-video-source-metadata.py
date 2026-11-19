#!/usr/bin/env python3
"""Import official poster and posting metadata without changing archive CSV data."""
import argparse
import datetime
import email.utils
import html
import json
import pathlib
import re
import xml.etree.ElementTree as ET
from zoneinfo import ZoneInfo

ROOT = pathlib.Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--pages', type=pathlib.Path, required=True)
parser.add_argument('--rss', type=pathlib.Path, required=True)
args = parser.parse_args()
dates = json.loads((ROOT / 'assets/record-detail-dates.json').read_text())['records']
ids = sorted({entry['dvidsId'] for entry in dates.values() if entry.get('dvidsId')})
source = {}
for identifier in ids:
    page = (args.pages / f'{identifier}.html').read_text()
    poster = re.search(r'<meta property="og:image" content="([^"]+)"', page)
    posted = re.search(r'<td>Date Posted:</td>\s*<td>(.*?)</td>', page, re.S)
    assert poster and posted, identifier
    raw = html.unescape(posted.group(1)).strip()
    timestamp = datetime.datetime.strptime(raw, '%m.%d.%Y %H:%M').replace(tzinfo=ZoneInfo('America/New_York'))
    source[identifier] = {'thumbnailUrl': html.unescape(poster.group(1)),
                          'uploadDate': timestamp.isoformat(), 'datePostedRaw': raw,
                          'sourceUrl': f'https://www.dvidshub.net/video/{identifier}'}
# Confirm the displayed posting-time convention against the official unit RSS,
# which publishes an explicit UTC offset. Source pages report minute precision.
verified = 0
for item in ET.parse(args.rss).findall('.//item'):
    match = re.search(r'/video/(\d+)', item.findtext('link', ''))
    if match and match[1] in source:
        rss_time = email.utils.parsedate_to_datetime(item.findtext('pubDate'))
        actual = datetime.datetime.fromisoformat(source[match[1]]['uploadDate'])
        assert actual == rss_time.replace(second=0, microsecond=0)
        assert actual.utcoffset() == rss_time.utcoffset()
        verified += 1
assert verified >= 3
result = {'postingTimeZone': 'America/New_York', 'postingTimePrecision': 'minute',
          'timeZoneEvidence': 'https://www.dvidshub.net/rss/unit/8597',
          'rssItemsVerified': verified, 'records': source}
(ROOT / 'assets/video-source-metadata.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(f'Imported {len(source)} official posters/posting dates; time convention verified against {verified} RSS items.')
