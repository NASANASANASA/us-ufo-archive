"""Check Dutch record coverage, language navigation, dates, media and local links."""
import collections,csv,html,json,pathlib,re,urllib.parse,xml.etree.ElementTree as ET,subprocess
ROOT=pathlib.Path(__file__).resolve().parent.parent
rows=list(csv.DictReader((ROOT/'assets/uap-data.csv').open(encoding='utf-8-sig')))
translations=json.loads((ROOT/'assets/i18n-nl.json').read_text())
assert len(translations)==len(rows)==478
sitemap=ET.parse(ROOT/'sitemap.xml');ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
urls={x.text for x in sitemap.findall('.//s:loc',ns)}
checked_links=0
for i,(row,tr) in enumerate(zip(rows,translations)):
 assert tr['i']==i
 for field,source in [('titleZh','Title'),('descZh','Description Blurb'),('locZh','Incident Location'),('altZh','Image Alt Text')]:
  assert not row[source].strip() or tr[field].strip(),(i,field)
  if field in ('titleZh','descZh'):
   numbers=lambda text:collections.Counter(re.findall(r'\b\d+(?:[.,]\d+)?\b',text))
   assert not numbers(row[source])-numbers(tr[field]),(i,field,'changed numbers')
  if field=='descZh':
   timecode=r'\b\d{1,2}:\d{2}(?::\d{2})?(?:\s*[-–—]\s*\d{1,2}:\d{2}(?::\d{2})?)?'
   assert re.findall(timecode,row[source])==re.findall(timecode,tr[field]),(i,'changed timeline')
  assert not re.search(r'ZXQ\s*\d+\s*QXZ',tr[field],re.I),(i,field)
 slug=re.sub('[^a-z0-9]+','-',row['Title'].replace('\u00a0',' ').strip().lower().replace('&',' and ')).strip('-')
 file=ROOT/'nl/records'/slug/'index.html';source=file.read_text()
 assert '<html lang="nl">' in source
 assert 'https://uap-archives.org/nl/records/'+slug+'/' in urls
 assert '<h1>'+html.escape(tr['titleZh'].strip().replace('\u00a0',' '),quote=True).replace('&#x27;','&#39;')+'</h1>' in source,(i,'heading')
 # The language change must retain the same media files and original download target.
 reference=(ROOT/'en/records'/slug/'index.html').read_text()
 for pattern in [r'<source src="([^"]+)"',r'data-download-url="([^"]+)"',r'<video[^>]*poster="([^"]+)"']:
  assert re.findall(pattern,source)==re.findall(pattern,reference),(i,'media')
 for menu in re.findall(r'<details class="lang-menu[^>]*>[\s\S]*?</details>',source):
  order=re.findall(r'data-dir="([^"]+)"',menu)
  assert order.count('nl')==1 and order.index('nl')+1==order.index('ja'),(file,'menu')
 for link in re.findall(r'(?:href|src)="([^"]+)"',source):
  u=urllib.parse.urlsplit(html.unescape(link))
  if u.scheme or u.netloc or not u.path:continue
  target=(ROOT/u.path.lstrip('/') if u.path.startswith('/') else file.parent/u.path).resolve()
  assert target.exists(),(file,link)
  checked_links+=1
 assert 'undefined' not in source and 'ZXQ' not in source
home=(ROOT/'nl/index.html').read_text()
assert '<html lang="nl">' in home and 'Nederlandstalig archief' in home
assert 'locale-nl.js' in home
for file in ROOT.glob('*/index.html'):
 if file.parent.name not in ['en','es','pt','fr','de','ru','ar','nl','ja','ko','zh-Hans','zh-Hant']:continue
 for menu in re.findall(r'<details class="lang-menu[^>]*>[\s\S]*?</details>',file.read_text()):
  order=re.findall(r'data-dir="([^"]+)"',menu)
  assert order.count('nl')==1 and order.index('nl')+1==order.index('ja'),(file,'menu')
assert len([u for u in urls if '/nl/' in u])==484
subprocess.run(['node','-e',"const f=require('./assets/record-format.js');for(const [s,t] of [['4/1/2009','1 april 2009'],['2025','2025'],['March 2010','maart 2010'],['Undated','Ongedateerd']])if(f.formatDate(s,'nl')!==t)throw Error(s+': '+f.formatDate(s,'nl'));"],cwd=ROOT,check=True)
print(f'PASS: 478 Dutch records, 484 Dutch canonical pages, language ordering, dates, unchanged media/downloads, {checked_links} local references.')
