"""Build both 11-page English/Chinese parallel editions of CIA-UAP-D027.
Usage: python build-cia-d027-chinese.py /path/to/official.pdf
Requires PyMuPDF and ReportLab; the original PDF is checked against its audited hash.
"""
import argparse, hashlib, html, io, json, pathlib
import fitz
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = json.loads((ROOT / 'docs/translations/CIA-UAP-D027_zh.json').read_text())
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('source', type=pathlib.Path)
parser.add_argument('--font', default='/System/Library/Fonts/STHeiti Light.ttc')
args = parser.parse_args()
assert hashlib.sha256(args.source.read_bytes()).hexdigest() == DATA['sourceSha256']
source = fitz.open(args.source)
assert len(source) == DATA['sourcePages'] == 11
pdfmetrics.registerFont(TTFont('Chinese', args.font, subfontIndex=0))
font_check = fitz.Font(fontfile=args.font)
W, H = 1190.55, 841.89
ORIGINAL = fitz.Rect(26, 94, 592, H - 40)
TX, TW = 626, W - 626 - 30
colors = {'ink': (.13, .18, .23), 'muted': (.36, .41, .46), 'rule': (.80, .84, .87)}


def draw_paragraph(c, text, x, top, width, size, leading, color, strike=False):
    escaped = html.escape(text).replace('\n', '<br/>')
    if strike:
        escaped = '<strike>' + escaped + '</strike>'
    style = ParagraphStyle('Chinese', fontName='Chinese', fontSize=size,
                           leading=leading, wordWrap='CJK', textColor=color,
                           splitLongWords=True)
    para = Paragraph(escaped, style)
    _, height = para.wrap(width, H)
    para.drawOn(c, x, top - height)
    return top - height


for lang, edition in DATA['languages'].items():
    all_text = ''.join(str(edition))
    assert all(font_check.has_glyph(ord(ch)) for ch in all_text if ord(ch) >= 0x3400), lang
    stream = io.BytesIO()
    c = canvas.Canvas(stream, pagesize=(W, H), pageCompression=1)
    c.setTitle('CIA-UAP-D027 | ' + edition['title'] + ' | ' + edition['languageLabel'])
    c.setAuthor('UAP Public Archive - 非官方翻译')
    layout = []
    for item in edition['pages']:
        c.setFillColorRGB(*colors['ink'])
        c.setFont('Chinese', 19)
        c.drawString(28, H - 31, edition['title'])
        c.setFont('Chinese', 9.5)
        c.setFillColorRGB(*colors['muted'])
        c.drawString(29, H - 50, 'CIA / OSI  |  1952-08-14  |  ' + edition['languageLabel'])
        c.drawRightString(W - 29, H - 31, f'{item["page"]:02d} / 11')
        c.setStrokeColorRGB(*colors['rule'])
        c.setLineWidth(.6)
        c.line(28, H - 62, W - 28, H - 62)
        c.setFont('Chinese', 10)
        c.drawString(28, H - 82, edition['sourceLabel'])
        c.drawString(TX, H - 82, edition['translationLabel'])
        c.line(609, H - 94, 609, 40)
        y = H - 111
        if item.get('heading'):
            y = draw_paragraph(c, item['heading'], TX, y, TW, 18, 27, colors['ink']) - 8
        if item.get('date'):
            y = draw_paragraph(c, item['date'], TX, y, TW, 11, 19, colors['muted']) - 8
        if item.get('status'):
            y = draw_paragraph(c, item['status'], TX, y, TW, 12.5, 22, (.58, .24, .10)) - 9
        for block in item['blocks']:
            strike = block['type'] == 'deleted'
            if strike:
                label = '【原文删除】' if lang == 'zh-Hans' else '【原文刪除】'
                y = draw_paragraph(c, label, TX, y, TW, 10, 17, colors['muted']) - 3
            y = draw_paragraph(c, block['text'], TX, y, TW, 12.5, 21, colors['ink'], strike) - 12
        if item.get('notes'):
            y -= 10
            c.setStrokeColorRGB(*colors['rule'])
            c.line(TX, y, W - 30, y)
            y -= 16
            y = draw_paragraph(c, edition['notesLabel'], TX, y, TW, 9, 15, colors['muted']) - 4
            for note in item['notes']:
                y = draw_paragraph(c, note, TX, y, TW, 9, 15, colors['muted']) - 6
        assert y > 48, (lang, item['page'], y)
        layout.append({'page': item['page'], 'translationBottom': round(H - y, 2)})
        c.setFillColorRGB(*colors['muted'])
        c.setFont('Chinese', 8.5)
        c.drawString(28, 19, 'CIA-UAP-D027  |  ' + edition['notice'])
        c.drawRightString(W - 28, 19, f'{item["page"]} / 11')
        c.showPage()
    c.save()
    overlay = fitz.open(stream=stream.getvalue(), filetype='pdf')
    result = fitz.open()
    for i in range(11):
        page = result.new_page(width=W, height=H)
        page.show_pdf_page(ORIGINAL, source, i)
        page.show_pdf_page(page.rect, overlay, i)
    result.set_metadata({'title': f'CIA-UAP-D027 - {edition["title"]} - {edition["languageLabel"]}',
                         'author': 'CIA / OSI (original); UAP Public Archive (translation)',
                         'subject': edition['notice'], 'keywords': 'CIA-UAP-D027, 1952, Flying Saucers, English-Chinese parallel edition',
                         'creator': 'UAP Public Archive'})
    result.subset_fonts()
    target = ROOT / 'assets/translations' / lang / f'CIA-UAP-D027_{lang}.pdf'
    target.parent.mkdir(parents=True, exist_ok=True)
    result.save(target, garbage=4, deflate=True)
    print(f'{lang}: {len(result)} pages, {target.stat().st_size:,} bytes, lowest translation baseline {min(x["translationBottom"] for x in layout):.1f} pt from top')
