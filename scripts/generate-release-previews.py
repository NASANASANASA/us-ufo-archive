#!/usr/bin/env python3
"""Preserve verified official thumbnails and rebuild preview mappings.

Requires PyMuPDF. Download the official Release 06/07 document ZIPs first.
Usage: python3 scripts/generate-release-previews.py --bundle-dir ~/Downloads
Official thumbnail bytes and their provenance must be retained. Only records
without a usable official thumbnail receive a PDF-cover fallback. Video
thumbnails are obtained from their public DVIDS pages and retained as JPEGs.
"""
import argparse
import csv,zipfile,pathlib,re,json,fitz,hashlib
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--bundle-dir', type=pathlib.Path, required=True)
args=parser.parse_args()
root=pathlib.Path(__file__).resolve().parent.parent
records=list(csv.DictReader((root/'assets/uap-data.csv').open()))
manifest_path=root/'assets/release-06-07-media.json'
previous=json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
media={}
for release,date in [('06','9/18/2026'),('07','10/23/2026')]:
 zipname=args.bundle_dir/('documents_release_'+release+('_sept_18' if release=='06' else '_oct_23')+'_2026.zip')
 if not zipname.is_file():
  raise FileNotFoundError(f'Download the official document bundle first: {zipname}')
 selected=[r for r in records if r['Release Date']==date]
 if zipname.exists():
  with zipfile.ZipFile(zipname) as z:
   for r in selected:
    code=r['Title'].split(',')[0]; norm=re.sub('[^A-Z0-9]','',code.upper())
    if r['Type']=='PDF':
     verified=previous.get(norm,{})
     if verified.get('previewKind')=='official-thumbnail':
      target=root/'assets'/verified['url']
      assert hashlib.sha256(target.read_bytes()).hexdigest()==verified['sha256'],f'Official thumbnail changed: {code}'
      continue
     matches=[n for n in z.namelist() if pathlib.Path(n).name.startswith(code) and n.lower().endswith('.pdf') and not n.startswith('__MACOSX/')]
     assert len(matches)==1,(code,matches)
     with fitz.open(stream=z.read(matches[0]),filetype='pdf') as doc:
      pix=doc[0].get_pixmap(matrix=fitz.Matrix(1,1),alpha=False)
      target=root/f'assets/mirror/release-{release}/thumbnails/{code}.jpg';target.parent.mkdir(parents=True,exist_ok=True);pix.save(str(target),jpg_quality=85)
     print(release,code,flush=True)
 for r in selected:
  code=r['Title'].split(',')[0];file=f'mirror/release-{release}/thumbnails/{code}.jpg'
  if (root/'assets'/file).exists():
   norm=re.sub('[^A-Z0-9]','',code.upper())
   entry={**previous.get(norm,{}),'type':r['Type'],'url':file}
   if not entry.get('previewKind') and r['Type']=='PDF':
    entry.update(previewKind='pdf-cover',sourceUrl=r['PDF | Image Link'])
   entry['sha256']=hashlib.sha256((root/'assets'/file).read_bytes()).hexdigest()
   media[norm]=entry
(root/'assets/release-06-07-media.json').write_text(json.dumps(media,indent=2)+'\n')
(root/'assets/release-06-07-media.js').write_text('/* Verified official previews; see JSON manifest for provenance. */\n{const base=new URL(".",document.currentScript.src);window.UAP_R2_MEDIA=Object.assign(window.UAP_R2_MEDIA||{},Object.fromEntries(Object.entries('+json.dumps(media,indent=2)+').map(([code,entry])=>[code,{...entry,url:new URL(entry.url+"?v="+entry.sha256.slice(0,12),base).href}])));}\n')
print('Previews:',len(media))
