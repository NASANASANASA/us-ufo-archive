"""Check that display mirrors cannot leak across release batches."""
import csv,re,html,urllib.parse,collections
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
release_dates={'5/8/26':'01','5/22/26':'02','6/12/26':'03','7/10/26':'04','8/7/26':'05','9/18/2026':'06','10/23/2026':'07'}
summary=collections.defaultdict(collections.Counter)
count=0
for row in csv.DictReader((ROOT/'assets/uap-data.csv').open(encoding='utf-8-sig')):
 release=release_dates[row['Release Date']]
 title=row['Title'].replace('\u00a0',' ').strip()
 slug=re.sub('[^a-z0-9]+','-',title.lower().replace('&',' and ')).strip('-')
 for lang in ['en','es','pt','fr','de','ru','ar','nl','ja','ko','zh-Hans','zh-Hant']:
  source=(ROOT/lang/'records'/slug/'index.html').read_text()
  preview=re.search(r'<div class="static-preview[^>]*>(.*?)</div>',source,re.S)[1]
  urls=[html.unescape(u) for u in re.findall(r'(?:src|poster)="([^"]+)"',preview)]
  for url in urls:
   match=re.search(r'/release-(\d{2})/',url)
   if 'media.uap-archives.org' in url or url.startswith('/assets/'):
    assert match and match[1]==release,(title,lang,release,url)
  image_urls=[html.unescape(u) for pair in re.findall(r'<img[^>]+src="([^"]+)"|<video[^>]+poster="([^"]+)"',preview) for u in pair if u]
  for url in image_urls:
   assert url.startswith('/assets/mirror/'),(title,lang,url)
   if lang=='en':summary[release]['website static assets']+=1
  count+=1
print('PASS:',count,'record previews scoped to the correct release; all available images/posters use website static assets.')
for release,counts in sorted(summary.items()):print(release,dict(counts))
