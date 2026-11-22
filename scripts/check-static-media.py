"""Check local image integrity and official playback/download sources on every page."""
import csv,hashlib,html,json,pathlib,re,urllib.parse,xml.etree.ElementTree as ET
ROOT=pathlib.Path(__file__).resolve().parent.parent
manifest=json.loads((ROOT/'assets/static-previews.json').read_text())
rows=list(csv.DictReader((ROOT/'assets/uap-data.csv').open(encoding='utf-8-sig')))
langs=['en','es','pt','fr','de','ru','ar','nl','ja','ko','zh-Hans','zh-Hant']
files={};pages=0;videos=0
for row in rows:
 title=row['Title'].replace('\u00a0',' ').strip();entry=manifest[title]
 for image in entry['images']:
  file=ROOT/image['url'].lstrip('/');data=file.read_bytes()
  assert hashlib.sha256(data).hexdigest()==image['sha256']
  assert len(data)==image['size'] and data.startswith((b'\xff\xd8\xff',b'\x89PNG',b'GIF8',b'RIFF'))
  files[str(file)]=len(data)
 slug=re.sub('[^a-z0-9]+','-',title.lower().replace('&',' and ')).strip('-')
 for lang in langs:
  page=(ROOT/lang/'records'/slug/'index.html').read_text()
  assert 'media.uap-archives.org' not in page and 'release-r2-media.js' not in page
  preview=re.search(r'<div class="static-preview[^>]*>(.*?)</div>',page,re.S)[1]
  images=[html.unescape(a or b) for a,b in re.findall(r'<img[^>]*src="([^"]+)"|<video[^>]*poster="([^"]+)"',preview)]
  if entry['preview']:assert images==[entry['preview']],(title,lang,images)
  for image in images:assert image.startswith('/assets/mirror/') and (ROOT/image.lstrip('/').split('?')[0]).is_file()
  sources=re.findall(r'<source src="([^"]+)"',preview)
  if row['Type'] in ('VID','AUD'):
   assert len(sources)==1,(title,lang,'no player')
   assert urllib.parse.urlsplit(sources[0]).hostname=='d34w7g4gy10iej.cloudfront.net'
   assert 'preload="none"' in preview
   download=html.unescape(re.search(r'data-download-url="([^"]+)"',page)[1])
   assert download==sources[0],(title,lang,'playback and official download differ')
   videos+=1
  pages+=1
for lang in langs:
 home=(ROOT/lang/'index.html').read_text()
 assert home.count('assets/static-previews.js?')==1
 assert not re.search(r'<script[^>]*src="[^"]*(?:release-04-r2-documents|release-r2-media|release-06-07-media)',home)
for file in ['assets/site.js','assets/db-data.js','assets/dvids-map.js']:
 assert 'media.uap-archives.org' not in (ROOT/file).read_text(),file
print(f'PASS: {pages} detail pages; {videos} official video/audio players; {len(files)} valid static image files ({sum(files.values())} bytes); no active R2 media dependency.')
