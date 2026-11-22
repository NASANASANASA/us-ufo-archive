#!/usr/bin/env python3
"""Audit Release 08 coverage, official assets, localized pages and prior releases."""
import collections,csv,hashlib,html,io,json,pathlib,re,subprocess,urllib.parse
ROOT=pathlib.Path(__file__).resolve().parent.parent
BASELINE='78d5ae4cd562395f32bb8eb9746884eeef5cf6d1'
rows=list(csv.DictReader((ROOT/'assets/uap-data.csv').open(encoding='utf-8-sig')))
old=list(csv.DictReader(io.StringIO(subprocess.check_output(['git','show',BASELINE+':assets/uap-data.csv'],cwd=ROOT,text=True))))
assert len(rows)==521 and rows[:478]==old
new=rows[478:];assert collections.Counter(x['Type'] for x in new)=={'PDF':40,'VID':3}
assert {x['Release Date'] for x in new}=={'11/20/2026'}
audit=json.loads((ROOT/'docs/release-08-audit.json').read_text())
manifest=json.loads((ROOT/'assets/static-previews.json').read_text())
dates=json.loads((ROOT/'assets/record-detail-dates.json').read_text())['records']
clean=lambda x:re.sub(r'\s+',' ',x.replace('\u00a0',' ')).strip()
code=lambda x:re.match(r'^[A-Z]+-UAP-(?:D|PR)\d+',x)[0]
assert len(set(map(lambda x:code(x['Title']),new)))==43
pdfs={x['code']:x for x in audit['pdfFiles']};videos={x['record']:x for x in audit['videoFiles']}
langs={'en':None,'es':'es','pt':'pt','fr':'fr','de':'de','ru':'ru','ar':'ar','nl':'nl','pl':'pl','ja':'ja','ko':'ko','zh-Hans':'zh-cn','zh-Hant':'zh-tw'}
checked=0
for lang,tr in langs.items():
 entries=json.loads((ROOT/f'assets/i18n-{tr}.json').read_text()) if tr else None
 if entries:
  original=json.loads(subprocess.check_output(['git','show',BASELINE+f':assets/i18n-{tr}.json'],cwd=ROOT,text=True))
  assert len(entries)==521 and entries[:478]==original,(lang,'previous translations changed')
 for i,row in enumerate(new,478):
  title=clean(row['Title']);ident=code(title);slug=re.sub('[^a-z0-9]+','-',title.lower().replace('&',' and ')).strip('-')
  path=ROOT/lang/'records'/slug/'index.html';page=path.read_text()
  assert f'https://uap-archives.org/{lang}/records/{slug}/' in page
  assert 'releaseDate=Release+08' in page and 'release=08#' in page
  assert 'media.uap-archives.org' not in page and 'ZXQ' not in page and 'undefined' not in page
  if entries:
   assert entries[i] and entries[i]['i']==i
   assert ident in entries[i]['titleZh'],(lang,ident,'translated identifier')
   assert all(entries[i][k].strip() or not row[source].strip() for k,source in [('titleZh','Title'),('descZh','Description Blurb'),('locZh','Incident Location'),('altZh','Image Alt Text')])
  entry=manifest[title];assert entry['release']=='08'
  assert entry['preview'] in page
  for image in entry['images']:
   data=(ROOT/image['url'].lstrip('/')).read_bytes()
   assert hashlib.sha256(data).hexdigest()==image['sha256'] and len(data)==image['size']
  if row['Type']=='PDF':
   assert urllib.parse.unquote(urllib.parse.urlsplit(row['PDF | Image Link']).path).split('/')[-1].lower()==pdfs[ident]['filename'].lower()
   assert html.escape(row['PDF | Image Link'],quote=True) in page
   assert dates[title]['value']==row['Incident Date'].strip()
  else:
   assert row['DVIDS Video ID']==videos[ident]['dvidsId']
   assert dates[title]['value']==videos[ident]['dateTaken']
   assert videos[ident]['filename'] in page
   assert 'static-watch-player' not in page
   assert page.index('static-record-copy')<page.index('static-preview')
  for value in re.findall(r'(?:href|src|poster)="([^"]+)"',page):
   u=urllib.parse.urlsplit(html.unescape(value))
   if u.scheme or u.netloc or not u.path:continue
   target=(ROOT/u.path.lstrip('/') if u.path.startswith('/') else path.parent/u.path).resolve()
   assert target.exists(),(lang,ident,value)
  checked+=1
 downloads=(ROOT/lang/'downloads/index.html').read_text()
 assert downloads.count('class="release-download-card"')==8
 assert 'release_08_documents.zip' in downloads and 'release_08_videos.zip' in downloads
 # The seventh release's note remains after its document download, in every language.
 cards=downloads.split('class="release-download-card"')[1:]
 assert cards[6].index('release_07_documents.zip')<cards[6].index('release-no-videos')
assert '521' in (ROOT/'index.html').read_text()
print(f'PASS: 43 Release 08 records, 43 verified local previews, {checked} localized pages, eight download cards; Releases 01–07 data and translations unchanged.')
