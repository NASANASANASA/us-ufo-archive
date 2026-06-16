const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const siteUrl = (process.env.SITE_URL || 'https://nasanasanasa.github.io/us-ufo-archive').replace(/\/$/, '');
const generatedDirs = ['en', 'ja', 'es', 'zh-Hans', 'zh-Hant'];

const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const clean = value => String(value || '').replace(/\u00a0/g, ' ').trim();
const key = value => clean(value).toLowerCase().replace(/[^a-z0-9]/g, '');
const esc = value => clean(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug = value => clean(value).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'unspecified';
const assetCode = value => clean(value).split(',')[0].toUpperCase().replace(/[^A-Z0-9]/g, '');

function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (c === '"' && quoted && n === '"') {
      cell += '"';
      i++;
    } else if (c === '"') {
      quoted = !quoted;
    } else if (c === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((c === '\n' || c === '\r') && !quoted) {
      if (cell || row.length) {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
      }
      if (c === '\r' && n === '\n') i++;
    } else {
      cell += c;
    }
  }
  if (cell || row.length) rows.push([...row, cell]);
  const headers = (rows.shift() || []).map(key);
  return rows
    .filter(r => r.some(clean))
    .map(r => Object.fromEntries(headers.map((h, i) => [h, clean(r[i])])));
}

function field(row, names) {
  for (const name of names) {
    const value = row[key(name)];
    if (value) return clean(value);
  }
  return '';
}

function urls(value) {
  return clean(value).split('|').map(clean).filter(Boolean);
}

function absolute(value) {
  value = clean(value);
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (/^\/\//.test(value)) return `https:${value}`;
  if (value.startsWith('/')) return `https://www.war.gov${value}`;
  return value;
}

function normalize(row, index, zhCn, zhTw) {
  const releaseDate = field(row, ['release date', 'releaseDate']);
  const releaseMap = {
    '5/8/26': 'RELEASE 01',
    '5/8/2026': 'RELEASE 01',
    '05/08/2026': 'RELEASE 01',
    '5/22/26': 'RELEASE 02',
    '5/22/2026': 'RELEASE 02',
    '05/22/2026': 'RELEASE 02',
    '6/12/26': 'RELEASE 03',
    '6/12/2026': 'RELEASE 03',
    '06/12/2026': 'RELEASE 03'
  };
  const officialType = field(row, ['type']).trim().toUpperCase();
  const assetLink = absolute(field(row, ['pdf | image link', 'pdf image link']));
  const found = Object.values(row)
    .flatMap(urls)
    .filter(v => /^https?:\/\//i.test(v) || /^\/|^Portals\//i.test(v) || /\.(pdf|mp4|webm|mov|m4v|ogg|jpg|jpeg|png|gif|webp)(\?|$)/i.test(v))
    .map(v => absolute(v.startsWith('Portals/') ? `/${v}` : v));
  const pick = re => found.filter(v => re.test(v.split('?')[0]));
  const doc = (officialType === 'PDF' ? assetLink : '') ||
    absolute(field(row, ['document url', 'documentUrl', 'document link', 'download url', 'file url', 'document', 'download', 'file'])) ||
    pick(/\.pdf$/i)[0] || '';
  const dvidsId = field(row, ['dvids video id']);
  const dvidsPage = dvidsId ? `https://www.dvidshub.net/video/${dvidsId}` : '';
  const imageRaw = (officialType === 'IMG' ? assetLink : '') || field(row, ['modal image', 'image url', 'imageUrl', 'image link', 'thumbnail url', 'poster url', 'image', 'thumbnail', 'poster']);
  const imageUrl = imageRaw ? urls(imageRaw).map(absolute).join('|') : pick(/\.(jpg|jpeg|png|gif|webp)$/i).join('|');
  const ext = (doc.split('?')[0].match(/\.([a-z0-9]+)$/i)?.[1] || officialType || 'PDF').replace('.', '').toUpperCase();
  return {
    index,
    id: field(row, ['asset file name', 'title', 'assetFileName']),
    slug: slug(field(row, ['asset file name', 'title', 'assetFileName'])),
    agency: field(row, ['agency']) || 'U.S. Government',
    release: field(row, ['release']) || releaseMap[releaseDate] || releaseDate,
    releaseDate,
    incidentDate: field(row, ['incident date', 'incidentDate']) || 'N/A',
    incidentLocation: field(row, ['incident location', 'incidentLocation']) || 'N/A',
    type: officialType || (dvidsId ? 'VID' : (imageUrl && !doc ? 'IMG' : ext)),
    description: field(row, ['description blurb', 'description', 'video description', 'record description', 'caption']),
    sourceUrl: doc || dvidsPage || (officialType === 'IMG' ? assetLink : '') || imageUrl || found[0] || 'https://www.war.gov/UFO/',
    documentUrl: doc,
    imageUrl,
    dvidsId,
    virin: field(row, ['image virin', 'virin']),
    redaction: /^(true|yes)$/i.test(field(row, ['redaction'])),
    i18n: {
      'zh-Hans': zhCn[index] || {},
      'zh-Hant': zhTw[index] || {}
    }
  };
}

const text = {
  en: {
    lang: 'en',
    name: 'English',
    home: 'UAP Public Archive',
    archive: 'Archive',
    notice: 'This is an unofficial public mirror and research index. Official record text and media are sourced from public U.S. government releases.',
    summary: 'Structured Summary',
    official: 'Official Description',
    records: 'Records',
    agency: 'Agency',
    release: 'Release',
    date: 'Incident Date',
    location: 'Incident Location',
    type: 'Type',
    source: 'Open Official Source',
    all: 'All Records',
    byAgency: 'Records by agency',
    byYear: 'Records by year',
    byLocation: 'Records by location',
    byType: 'Records by type',
    indexes: 'Indexes',
    related: 'Related archive indexes',
    generated: 'Static SEO index generated from official U.S. government UAP release data.',
    descriptionPrefix: 'Official U.S. government UAP archive record'
  },
  ja: {
    lang: 'ja',
    name: '日本語',
    home: 'UAP公開アーカイブ',
    archive: 'アーカイブ',
    notice: 'このサイトは非公式の公開ミラーおよび調査用インデックスです。公式記録の本文とメディアは、米国政府の公開資料に基づいています。',
    summary: '構造化要約',
    official: '公式英語原文',
    records: '記録',
    agency: '公開機関',
    release: '公開回',
    date: '事件日',
    location: '事件場所',
    type: '種類',
    source: '公式ソースを開く',
    all: '全記録',
    byAgency: '機関別記録',
    byYear: '年別記録',
    byLocation: '場所別記録',
    byType: '種類別記録',
    indexes: '索引',
    related: '関連アーカイブ索引',
    generated: '米国政府のUAP公開データから生成した静的SEO索引です。',
    descriptionPrefix: '米国政府UAP公開アーカイブ記録'
  },
  es: {
    lang: 'es',
    name: 'Español',
    home: 'Archivo público UAP',
    archive: 'Archivo',
    notice: 'Este sitio es un espejo público no oficial y un índice de investigación. El texto oficial y los medios proceden de publicaciones públicas del Gobierno de Estados Unidos.',
    summary: 'Resumen estructurado',
    official: 'Descripción oficial en inglés',
    records: 'registros',
    agency: 'Agencia',
    release: 'Publicación',
    date: 'Fecha del incidente',
    location: 'Lugar del incidente',
    type: 'Tipo',
    source: 'Abrir fuente oficial',
    all: 'Todos los registros',
    byAgency: 'Registros por agencia',
    byYear: 'Registros por año',
    byLocation: 'Registros por lugar',
    byType: 'Registros por tipo',
    indexes: 'Índices',
    related: 'Índices relacionados',
    generated: 'Índice SEO estático generado a partir de datos oficiales de publicaciones UAP del Gobierno de Estados Unidos.',
    descriptionPrefix: 'Registro del archivo público UAP del Gobierno de Estados Unidos'
  },
  'zh-Hans': {
    lang: 'zh-CN',
    name: '简体中文',
    home: 'UAP 公开档案',
    archive: '档案库',
    notice: '本站为非官方公开镜像与研究索引。官方记录文字和媒体均来自美国政府公开发布资料，中文内容仅作翻译与信息整理。',
    summary: '结构化摘要',
    official: '美国官网原始说明',
    records: '条记录',
    agency: '发布机构',
    release: '公布批次',
    date: '事件日期',
    location: '事件地点',
    type: '类型',
    source: '查看美国官网档案',
    all: '全部记录',
    byAgency: '按机构浏览',
    byYear: '按年份浏览',
    byLocation: '按地点浏览',
    byType: '按类型浏览',
    indexes: '索引',
    related: '相关索引',
    generated: '根据美国政府 UAP 公开数据生成的静态 SEO 索引。',
    descriptionPrefix: '美国政府 UAP 公开档案记录'
  },
  'zh-Hant': {
    lang: 'zh-TW',
    name: '繁體中文',
    home: 'UAP 公開檔案',
    archive: '檔案庫',
    notice: '本站為非官方公開鏡像與研究索引。官方記錄文字和媒體均來自美國政府公開發布資料，中文內容僅作翻譯與資訊整理。',
    summary: '結構化摘要',
    official: '美國官網原始說明',
    records: '條記錄',
    agency: '發布機構',
    release: '公佈批次',
    date: '事件日期',
    location: '事件地點',
    type: '類型',
    source: '檢視美國官網檔案',
    all: '全部記錄',
    byAgency: '按機構瀏覽',
    byYear: '按年份瀏覽',
    byLocation: '按地點瀏覽',
    byType: '按類型瀏覽',
    indexes: '索引',
    related: '相關索引',
    generated: '根據美國政府 UAP 公開資料生成的靜態 SEO 索引。',
    descriptionPrefix: '美國政府 UAP 公開檔案記錄'
  }
};

const agencyNames = {
  ja: {
    'Department of War': '戦争省',
    'Department of State': '国務省',
    'Department of Energy': 'エネルギー省',
    'Central Intelligence Agency': '中央情報局',
    'Office of the Director of National Intelligence': '国家情報長官室',
    'Intelligence Community Agency': '情報コミュニティ機関',
    'U.S. Government': '米国政府'
  },
  es: {
    'Department of War': 'Departamento de Guerra',
    'Department of State': 'Departamento de Estado',
    'Department of Energy': 'Departamento de Energía',
    'Central Intelligence Agency': 'Agencia Central de Inteligencia',
    'Office of the Director of National Intelligence': 'Oficina del Director de Inteligencia Nacional',
    'Intelligence Community Agency': 'Agencia de la Comunidad de Inteligencia',
    'U.S. Government': 'Gobierno de Estados Unidos'
  }
};

function langTitle(doc, lang) {
  if (lang === 'zh-Hans') return doc.i18n['zh-Hans'].titleZh || doc.id;
  if (lang === 'zh-Hant') return doc.i18n['zh-Hant'].titleZh || doc.id;
  return doc.id;
}

function langLocation(doc, lang) {
  if (lang === 'zh-Hans') return doc.i18n['zh-Hans'].locZh || doc.incidentLocation || '未标示';
  if (lang === 'zh-Hant') return doc.i18n['zh-Hant'].locZh || doc.incidentLocation || '未標示';
  return doc.incidentLocation || 'N/A';
}

function langDescription(doc, lang) {
  if (lang === 'zh-Hans') return doc.i18n['zh-Hans'].descZh || doc.description;
  if (lang === 'zh-Hant') return doc.i18n['zh-Hant'].descZh || doc.description;
  return doc.description;
}

function agencyLabel(value, lang) {
  if (lang === 'ja' || lang === 'es') return agencyNames[lang][value] || value;
  if (lang === 'zh-Hans') {
    return ({
      'Department of War': '战争部',
      'Department of State': '国务院',
      'Department of Energy': '能源部',
      'Central Intelligence Agency': '中央情报局',
      'Office of the Director of National Intelligence': '国家情报总监办公室',
      'Intelligence Community Agency': '情报界机构',
      'U.S. Government': '美国政府'
    })[value] || value;
  }
  if (lang === 'zh-Hant') {
    return ({
      'Department of War': '戰爭部',
      'Department of State': '國務院',
      'Department of Energy': '能源部',
      'Central Intelligence Agency': '中央情報局',
      'Office of the Director of National Intelligence': '國家情報總監辦公室',
      'Intelligence Community Agency': '情報界機構',
      'U.S. Government': '美國政府'
    })[value] || value;
  }
  return value;
}

function releaseLabel(value, lang) {
  const n = clean(value).match(/(\d{2})$/)?.[1] || clean(value);
  if (lang === 'zh-Hans') return `第${Number(n)}批`;
  if (lang === 'zh-Hant') return `第${Number(n)}批`;
  if (lang === 'ja') return `第${Number(n)}回公開`;
  if (lang === 'es') return `Publicación ${n}`;
  return `Release ${n}`;
}

function yearOf(doc) {
  return clean(doc.incidentDate).match(/(19|20)\d{2}/)?.[0] || 'undated';
}

function metaDescription(doc, lang) {
  const l = text[lang];
  const title = langTitle(doc, lang);
  const location = langLocation(doc, lang);
  return `${l.descriptionPrefix}: ${title}. ${l.agency}: ${agencyLabel(doc.agency, lang)}. ${l.date}: ${doc.incidentDate || 'N/A'}. ${l.location}: ${location}.`;
}

function structuredSummary(doc, lang) {
  const agency = agencyLabel(doc.agency, lang);
  const release = releaseLabel(doc.release, lang);
  const location = langLocation(doc, lang);
  const date = doc.incidentDate || 'N/A';
  const type = doc.type || 'PDF';
  if (lang === 'ja') {
    return `この記録は、${agency}が${release}で公開した${type}形式のUAP関連資料です。事件日は${date}、事件場所は${location}として記録されています。ページには公式記録へのリンク、原文説明、主要メタデータを掲載しています。`;
  }
  if (lang === 'es') {
    return `Este registro es un material relacionado con UAP en formato ${type}, publicado por ${agency} en ${release}. La fecha del incidente figura como ${date} y el lugar como ${location}. La página conserva el enlace a la fuente oficial, la descripción original y los metadatos principales.`;
  }
  if (lang === 'en') {
    return `This record is a ${type} UAP-related asset released by ${agency} in ${release}. The incident date is listed as ${date}, and the incident location is listed as ${location}. This page preserves the official source link, original description, and structured metadata.`;
  }
  return langDescription(doc, lang) || `${agency}在${release}公开的${type}类型 UAP 相关档案。事件日期：${date}；事件地点：${location}。`;
}

function rel(fromLang, target) {
  const fromDepth = fromLang.split('/').filter(Boolean).length;
  return '../'.repeat(fromDepth) + target;
}

function pageShell({lang, title, description, canonicalPath, body, depth = 0, schema}) {
  const prefix = '../'.repeat(depth);
  const canonical = `${siteUrl}${canonicalPath}`;
  const alternates = Object.keys(text).map(code => {
    const pathName = canonicalPath.replace(/^\/(en|ja|es|zh-Hans|zh-Hant)\//, `/${code}/`);
    return `<link rel="alternate" hreflang="${code}" href="${siteUrl}${pathName}">`;
  }).join('\n  ');
  return `<!DOCTYPE html>
<html lang="${text[lang].lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${canonical}">
  ${alternates}
  <link rel="alternate" hreflang="x-default" href="${siteUrl}${canonicalPath.replace(/^\/(ja|es|zh-Hans|zh-Hant)\//, '/en/')}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600&family=Noto+Sans+TC:wght@400;500;600&family=Noto+Sans+JP:wght@400;500;600&family=Noto+Sans:wght@400;500;600&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${prefix}assets/style.css?v=20260616-seo2">
  ${schema ? `<script type="application/ld+json">${JSON.stringify(schema)}</script>` : ''}
</head>
<body class="static-page">
  <div class="scanlines" aria-hidden="true"></div>
  <header class="site-header">
    <a class="brand" href="${prefix}index.html"><span class="brand-mark"><i></i><i></i><i></i></span><span><b>${esc(text[lang].home)}</b><small>${esc(text[lang].name)}</small></span></a>
    <nav>
      <a href="${prefix}${lang}/archive/">${esc(text[lang].archive)}</a>
      <a href="${prefix}index.html#archive">Interactive</a>
      ${Object.keys(text).map(code => `<a href="${prefix}${code}${canonicalPath.replace(/^\/(en|ja|es|zh-Hans|zh-Hant)/, '')}">${esc(text[code].name)}</a>`).join('')}
    </nav>
  </header>
  ${body}
</body>
</html>
`;
}

function writeFile(file, content) {
  const full = path.join(root, file);
  fs.mkdirSync(path.dirname(full), {recursive: true});
  fs.writeFileSync(full, content);
}

function cardList(docs, lang, recordPrefix = '../records/') {
  const rows = docs.map(doc => `<a class="static-row" href="${recordPrefix}${doc.slug}/">
    <strong>${esc(langTitle(doc, lang))}</strong>
    <span>${esc(agencyLabel(doc.agency, lang))}</span>
    <span>${esc(doc.incidentDate || 'N/A')}</span>
    <span>${esc(langLocation(doc, lang))}</span>
    <em>.${esc(doc.type)}</em>
  </a>`).join('');
  return rows || `<p class="static-muted">No records.</p>`;
}

function indexGroups(docs, lang, kind, labeler) {
  const groups = new Map();
  for (const doc of docs) {
    const raw = labeler.raw(doc);
    const label = labeler.label(doc);
    if (!groups.has(raw)) groups.set(raw, {label, docs: []});
    groups.get(raw).docs.push(doc);
  }
  return [...groups.entries()].sort((a, b) => a[1].label.localeCompare(b[1].label)).map(([raw, group]) =>
    `<a class="static-index-card" href="../${kind}/${slug(raw)}/"><b>${esc(group.label)}</b><span>${group.docs.length} ${esc(text[lang].records)}</span></a>`
  ).join('');
}

function buildArchivePage(docs, lang, canonicalPath = `/${lang}/archive/`, depth = 2) {
  const l = text[lang];
  const body = `<main class="static-main">
    <section class="static-hero">
      <p class="system-line"><span></span> STATIC SEO ARCHIVE</p>
      <h1>${esc(l.home)}</h1>
      <p>${esc(l.notice)}</p>
    </section>
    <section class="static-panel">
      <h2>${esc(l.indexes)}</h2>
      <div class="static-index-grid">
        <a class="static-index-card" href="../agencies/"><b>${esc(l.byAgency)}</b><span>${docs.length} ${esc(l.records)}</span></a>
        <a class="static-index-card" href="../years/"><b>${esc(l.byYear)}</b><span>${docs.length} ${esc(l.records)}</span></a>
        <a class="static-index-card" href="../locations/"><b>${esc(l.byLocation)}</b><span>${docs.length} ${esc(l.records)}</span></a>
        <a class="static-index-card" href="../types/"><b>${esc(l.byType)}</b><span>${docs.length} ${esc(l.records)}</span></a>
      </div>
    </section>
    <section class="static-panel">
      <h2>${esc(l.all)}</h2>
      <div class="static-list">${cardList(docs, lang, '../records/')}</div>
    </section>
  </main>`;
  return pageShell({lang, title: `${l.home} · ${l.archive}`, description: l.generated, canonicalPath, body, depth});
}

function buildRecordPage(doc, lang) {
  const l = text[lang];
  const title = langTitle(doc, lang);
  const description = metaDescription(doc, lang);
  const canonicalPath = `/${lang}/records/${doc.slug}/`;
  const officialDescription = doc.description || '';
  const languageDescription = langDescription(doc, lang);
  const preview = doc.imageUrl ? `<img src="${esc(urls(doc.imageUrl)[0])}" alt="">` : `<div class="real-file"><b>.${esc(doc.type)}</b><span>${esc(title)}</span></div>`;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'DigitalDocument',
    name: title,
    description,
    inLanguage: text[lang].lang,
    isBasedOn: doc.sourceUrl,
    datePublished: doc.releaseDate,
    about: 'Unidentified Anomalous Phenomena',
    publisher: {'@type': 'Organization', name: agencyLabel(doc.agency, lang)}
  };
  const body = `<main class="static-main static-record">
    <section class="static-record-head">
      <p class="system-line"><span></span> ASSET RECORD</p>
      <h1>${esc(title)}</h1>
      <p>${esc(description)}</p>
    </section>
    <section class="static-record-grid">
      <article class="static-panel">
        <h2>${esc(l.summary)}</h2>
        <p>${esc(structuredSummary(doc, lang))}</p>
        ${(lang === 'zh-Hans' || lang === 'zh-Hant') && languageDescription ? `<h2>${esc(l.official)}</h2>${paragraphs(languageDescription)}` : ''}
        ${(lang === 'en' || lang === 'ja' || lang === 'es') && officialDescription ? `<h2>${esc(l.official)}</h2>${paragraphs(officialDescription)}` : ''}
        <a class="static-button" href="${esc(doc.sourceUrl)}" target="_blank" rel="noopener">${esc(l.source)} ↗</a>
      </article>
      <aside class="static-panel">
        <div class="static-preview">${preview}</div>
        <dl class="static-meta">
          <dt>${esc(l.agency)}</dt><dd>${esc(agencyLabel(doc.agency, lang))}</dd>
          <dt>${esc(l.release)}</dt><dd>${esc(releaseLabel(doc.release, lang))}</dd>
          <dt>${esc(l.date)}</dt><dd>${esc(doc.incidentDate || 'N/A')}</dd>
          <dt>${esc(l.location)}</dt><dd>${esc(langLocation(doc, lang))}</dd>
          <dt>${esc(l.type)}</dt><dd>.${esc(doc.type)}</dd>
          ${doc.virin ? `<dt>VIRIN</dt><dd>${esc(doc.virin)}</dd>` : ''}
        </dl>
      </aside>
    </section>
  </main>`;
  return pageShell({lang, title: `${title} · ${l.home}`, description, canonicalPath, body, depth: 3, schema});
}

function paragraphs(value) {
  const parts = clean(value).replace(/\r\n?/g, '\n').split(/\n+/).map(clean).filter(Boolean);
  return parts.map(p => `<p>${esc(p)}</p>`).join('');
}

function buildGroupLanding(docs, lang, kind, title, cards) {
  const l = text[lang];
  const body = `<main class="static-main">
    <section class="static-hero">
      <p class="system-line"><span></span> ${esc(kind.toUpperCase())}</p>
      <h1>${esc(title)}</h1>
      <p>${esc(l.generated)}</p>
    </section>
    <section class="static-panel"><div class="static-index-grid">${cards}</div></section>
  </main>`;
  return pageShell({lang, title: `${title} · ${l.home}`, description: l.generated, canonicalPath: `/${lang}/${kind}/`, body, depth: 2});
}

function buildGroupPage(docs, lang, kind, groupSlug, label) {
  const l = text[lang];
  const body = `<main class="static-main">
    <section class="static-hero">
      <p class="system-line"><span></span> ${esc(kind.toUpperCase())}</p>
      <h1>${esc(label)}</h1>
      <p>${docs.length} ${esc(l.records)} · ${esc(l.generated)}</p>
    </section>
    <section class="static-panel"><div class="static-list">${cardList(docs, lang, '../../records/')}</div></section>
  </main>`;
  return pageShell({lang, title: `${label} · ${l.home}`, description: `${label}: ${docs.length} ${l.records}. ${l.generated}`, canonicalPath: `/${lang}/${kind}/${groupSlug}/`, body, depth: 3});
}

function build() {
  const csv = parseCSV(read('assets/uap-data.csv'));
  const zhCn = JSON.parse(read('assets/i18n-zh-cn.json'));
  const zhTw = JSON.parse(read('assets/i18n-zh-tw.json'));
  const docs = csv.map((row, index) => normalize(row, index, zhCn, zhTw)).filter(doc => doc.id);
  const urlsForSitemap = [];

  for (const dir of generatedDirs) fs.rmSync(path.join(root, dir), {recursive: true, force: true});

  for (const lang of Object.keys(text)) {
    writeFile(`${lang}/index.html`, buildArchivePage(docs, lang, `/${lang}/`, 1));
    urlsForSitemap.push(`/${lang}/`);
    writeFile(`${lang}/archive/index.html`, buildArchivePage(docs, lang));
    urlsForSitemap.push(`/${lang}/archive/`);
    for (const doc of docs) {
      writeFile(`${lang}/records/${doc.slug}/index.html`, buildRecordPage(doc, lang));
      urlsForSitemap.push(`/${lang}/records/${doc.slug}/`);
    }

    const groups = [
      {kind: 'agencies', title: text[lang].byAgency, raw: doc => doc.agency, label: doc => agencyLabel(doc.agency, lang)},
      {kind: 'years', title: text[lang].byYear, raw: doc => yearOf(doc), label: doc => yearOf(doc)},
      {kind: 'locations', title: text[lang].byLocation, raw: doc => doc.incidentLocation || 'N/A', label: doc => langLocation(doc, lang)},
      {kind: 'types', title: text[lang].byType, raw: doc => doc.type, label: doc => `.${doc.type}`}
    ];

    for (const group of groups) {
      const map = new Map();
      for (const doc of docs) {
        const raw = group.raw(doc);
        const label = group.label(doc);
        if (!map.has(raw)) map.set(raw, {label, docs: []});
        map.get(raw).docs.push(doc);
      }
      const cards = [...map.entries()].sort((a, b) => a[1].label.localeCompare(b[1].label)).map(([raw, entry]) =>
        `<a class="static-index-card" href="./${slug(raw)}/"><b>${esc(entry.label)}</b><span>${entry.docs.length} ${esc(text[lang].records)}</span></a>`
      ).join('');
      writeFile(`${lang}/${group.kind}/index.html`, buildGroupLanding(docs, lang, group.kind, group.title, cards));
      urlsForSitemap.push(`/${lang}/${group.kind}/`);
      for (const [raw, entry] of map.entries()) {
        writeFile(`${lang}/${group.kind}/${slug(raw)}/index.html`, buildGroupPage(entry.docs, lang, group.kind, slug(raw), entry.label));
        urlsForSitemap.push(`/${lang}/${group.kind}/${slug(raw)}/`);
      }
    }
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${['/', ...urlsForSitemap].map(u => `  <url><loc>${siteUrl}${u}</loc></url>`).join('\n')}\n</urlset>\n`;
  writeFile('sitemap.xml', sitemap);
  writeFile('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`);
  console.log(`Generated ${docs.length} records across ${Object.keys(text).length} languages.`);
}

build();
