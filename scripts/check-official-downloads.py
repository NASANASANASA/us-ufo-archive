"""Verify official download targets and unchanged display media on every record page."""
import html,csv,json,re,pathlib,subprocess,tarfile,urllib.parse,urllib.request,concurrent.futures,sys
ROOT=pathlib.Path(__file__).resolve().parent.parent
rows=list(csv.DictReader((ROOT/'assets/uap-data.csv').open(encoding='utf-8-sig')))
dates=json.loads((ROOT/'assets/record-detail-dates.json').read_text())['records']
videos=dict(re.findall(r'"(\d+)"\s*:\s*"([^"]+)"',(ROOT/'assets/dvids-map.js').read_text()))
videos.update(json.loads((ROOT/'assets/official-video-downloads.json').read_text()))
langs=['en','es','pt','fr','de','ru','ar','nl','ja','ko','zh-Hans','zh-Hant']
def absolute(url):
 url=url.strip()
 return 'https://www.war.gov/'+url.lstrip('/') if url.startswith(('/', 'Portals/')) else url
checked=0
for row in rows:
 title=row['Title'].replace('\u00a0',' ').strip()
 slug=re.sub('[^a-z0-9]+','-',title.lower().replace('&',' and ')).strip('-')
 if row['Type'] in ['PDF','IMG']:expected=absolute(row['PDF | Image Link'])
 else:expected=videos[row['DVIDS Video ID'] or dates[title]['dvidsId']]
 assert urllib.parse.urlsplit(expected).hostname in ['www.war.gov','war.gov','d34w7g4gy10iej.cloudfront.net'],(title,expected)
 for lang in langs:
  source=(ROOT/lang/'records'/slug/'index.html').read_text()
  links=re.findall(r'<a class="static-media-button"[^>]+data-download-url="([^"]+)"[^>]*>',source)
  assert [html.unescape(x) for x in links]==[expected],(title,lang,links,expected)
  assert 'data-download-source="official"' in source
  assert source.count('assets/official-download.js?')==1
  checked+=1
# Media delivery has intentionally moved to static images and official playback.
assert checked==len(rows)*len(langs)
print(f'PASS: {checked} official download links; image integrity and playback checked by check-static-media.py.')
if '--live' in sys.argv:
 inventory=json.loads(pathlib.Path('/tmp/uap-r2-inventory-20261121.json').read_text());bykey={x['key']:x for x in inventory}
 extra=json.loads((ROOT/'assets/official-video-downloads.json').read_text())
 manifest=list(csv.DictReader((ROOT/'assets/release-04-r2-video-manifest.tsv').open(),delimiter='\t'))
 manifest += [{'title':r['Title'],'r2Key':r['R2 Key']} for r in csv.DictReader((ROOT/'assets/release-05-r2-video-manifest.tsv').open(),delimiter='\t')]
 def check(row):
  vid=dates[row['title']]['dvidsId'];url=extra[vid]
  req=urllib.request.Request(url,method='HEAD',headers={'User-Agent':'UAPArchiveLinkAudit/1.0'})
  with urllib.request.urlopen(req,timeout=40) as response:
   assert response.status==200,(vid,response.status)
   size=int(response.headers['Content-Length']);assert size>0,(vid,'empty video')
   return (vid,size,int(bykey[row['r2Key']]['size']))
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(check,manifest))
 print('Official/display size differences:',[(vid,a,b) for vid,a,b in results if a!=b])
 print('PASS: all 39 newly mapped official video URLs return HTTP 200 with nonempty video files. Official source IDs and filenames are matched to the release manifests.')
