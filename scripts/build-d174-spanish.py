"""Rebuild the Spanish D174 PDF from the supplied Traditional Chinese edition.
Requires PyMuPDF. Original images and redaction panels are retained losslessly.
"""
import fitz,json,pathlib,re,html,collections,hashlib
root=pathlib.Path(__file__).resolve().parent.parent
data=json.loads((root/'docs/translations/DOW-UAP-D174_es.json').read_text())
source=root/data['source']
assert hashlib.sha256(source.read_bytes()).hexdigest()==data['sourceSha256']
target=root/'assets/translations/es/DOW-UAP-D174_es.pdf'
d=fitz.open(source);out=[];unique=[];lookup={}
def normalize(s):
 s=re.sub(r'\s+',' ',s).strip()
 return re.sub(r'(?<=[\u3400-\u9fff])\s+(?=[\u3400-\u9fff])','',s)
for i,page in enumerate(d):
 drawings=[v for v in page.get_drawings() if v['type']=='f' and v['rect'].get_area()>0]
 spans=[s for b in page.get_text('dict')['blocks'] if b['type']==0 for l in b['lines'] for s in l['spans']]
 groups={}
 for s in spans:
  r=fitz.Rect(s['bbox']);c=(r.tl+r.br)/2;matches=[(v['rect'].get_area(),n) for n,v in enumerate(drawings) if v['rect'].contains(c)]
  k=min(matches)[1] if matches else ('span',len(groups))
  groups.setdefault(k,[]).append(s)
 blocks=[]
 for k,ss in groups.items():
  rect=drawings[k]['rect'] if isinstance(k,int) else fitz.Rect(ss[0]['bbox'])
  txt=normalize(' '.join(s['text'] for s in ss))
  if txt not in lookup:lookup[txt]=len(unique);unique.append(txt)
  blocks.append({'id':lookup[txt],'bbox':list(rect),'text':txt,'fontsize':max(s['size'] for s in ss),'fill':drawings[k]['fill'] if isinstance(k,int) else None})
 out.append({'page':i+1,'width':page.rect.width,'height':page.rect.height,'blocks':blocks})

assert unique==[unit['source'] for unit in data['units']]
regions=out;texts={str(i):v['translation'] for i,v in enumerate(data['units'])};audit=[]
for i,page in enumerate(d):
 # Remove only editable Chinese text objects. Keep all original image streams,
 # redaction panels and the white masks supplied with the Chinese translation.
 contents=page.read_contents();stripped,n=re.subn(rb'BT\b.*?\bET',b'',contents,flags=re.S);assert n>0
 xref=d.get_new_xref();d.update_object(xref,'<<>>');d.update_stream(xref,stripped);page.set_contents(xref)
 for b in regions[i]['blocks']:
  if str(b['id']) in data['specialTables']:
   for cell in data['specialTables'][str(b['id'])]:
    rr=fitz.Rect(cell['bbox']);cs=7.2 if b['id']==236 else 9.2;align='center' if b['id']==236 else 'left';spare,scale=page.insert_htmlbox(rr,html.escape(cell['text']),css=f'body{{font-family:sans-serif;font-size:{cs}pt;line-height:1.05;text-align:{align};margin:0;}}',scale_low=0)
    assert spare>=0
    audit.append({'page':i+1,'id':b['id'],'rect':list(rr),'base_size':cs,'scale':scale,'effective_size':round(cs*scale,3)})
   continue
  s=texts[str(b['id'])];r=fitz.Rect(b['bbox']);size=min(b['fontsize'],10)
  if size>8 and r.width<80:size=8
  # Preserve centred cover labels, diagram labels and narrow table cells.
  align='center' if (i<2 or (i>=38 and r.width<100) or b['id'] in [136,235,253,295]) else 'left'
  if i<2 and b['id']==4:r.x0-=42;r.x1-=4;size=8;align='right'
  if i<2 and b['id']==0:size=23
  elif i<2 and b['id']==1:size=12
  elif i>=38 and r.width<100:size=7.3
  elif i>=38 and r.height<22:size=min(size,8)
  # Whole-page narrative regions contain headings and paragraph breaks.
  paragraphs=s.split('\n');parts=[]
  for k,line in enumerate(paragraphs):
   heading=(line.isupper() and len(line)>3 and not line.startswith('AAP '))
   tag='h3' if heading else 'p';parts.append(f'<{tag}>'+html.escape(line)+f'</{tag}>')
  color='white' if b['fill'] and sum(b['fill'])/3<.65 else 'black'
  css=f'*{{font-family:sans-serif;}}body{{color:{color};font-size:{size}pt;line-height:1.12;text-align:{align};margin:0;}}p{{margin:0 0 {"0" if r.width<100 else "0.38em"};}}h3{{font-size:1.05em;margin:0 0 .45em;font-weight:bold;}}'
  spare,scale=page.insert_htmlbox(r,''.join(parts),css=css,scale_low=0)
  assert spare>=0,(i+1,b['id'])
  audit.append({'page':i+1,'id':b['id'],'rect':list(r),'base_size':size,'scale':scale,'effective_size':round(size*scale,3)})
 # A short unobtrusive translation notice outside the original content area.
 footer='Traducción no oficial del chino tradicional. Consulte el original inglés. | DOW-UAP-D174'
 page.insert_text((48,page.rect.height-12),footer,fontsize=6.1,fontname='helv',color=(.35,.35,.35))
d.set_metadata({'title':'DOW-UAP-D174 - Investigación del rancho de Utah - Traducción al español','author':'BAASS (original); UAP Public Archive (traducción no oficial)','subject':'Traducción al español basada en la versión en chino tradicional; prevalece el original inglés.','keywords':'DOW-UAP-D174, Utah, BAASS, español, traducción no oficial','creator':'UAP Public Archive'})
d.subset_fonts();target.parent.mkdir(parents=True,exist_ok=True);d.save(target,garbage=4,deflate=True)
counts=collections.Counter(v['page'] for v in audit if v['effective_size']<6)
assert not counts, f'Text below 6 pt: {counts}'
print('Created',target,'pages',len(d),'bytes',target.stat().st_size,'regions',len(audit),'small text:',dict(counts))
