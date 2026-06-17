const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const siteUrl = (process.env.SITE_URL || 'https://uap-archives.org').replace(/\/$/, '');
const generatedDirs = ['en', 'ja', 'es', 'zh-Hans', 'zh-Hant'];
const extraStaticDirs = ['pt', 'ru', 'fr', 'de', 'ko', 'ar'];

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

function normalize(row, index, zhCn, zhTw, ja, es) {
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
      'zh-Hant': zhTw[index] || {},
      ja: ja[index] || {},
      es: es[index] || {}
    }
  };
}

const text = {
  en: {
    lang: 'en',
    name: 'English',
    home: 'UAP Public Archive',
    language: 'Language',
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
    language: '言語',
    archive: 'アーカイブ',
    notice: 'このサイトは非公式の公開ミラーおよび調査用インデックスです。公式記録の本文とメディアは、米国政府の公開資料に基づいています。',
    summary: '構造化要約',
    official: '公式説明',
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
    language: 'Idioma',
    archive: 'Archivo',
    notice: 'Este sitio es un espejo público no oficial y un índice de investigación. El texto oficial y los medios proceden de publicaciones públicas del Gobierno de Estados Unidos.',
    summary: 'Resumen estructurado',
    official: 'Descripción oficial',
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
    language: '语言',
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
    language: '語言',
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

const legalPages = {
  privacy: {
    en: {
      title: 'Privacy Policy',
      description: 'Privacy policy for the unofficial UAP Public Archive mirror.',
      body: [
        ['Overview', 'This site is an unofficial public mirror and research index for UAP-related records released through public U.S. government channels. We do not require user accounts and we do not ask visitors to submit personal information in order to browse the archive.'],
        ['Advertising and Cookies', 'This site may use Google AdSense or other third-party advertising services. Google and its partners may use cookies or similar technologies to serve ads, measure ad performance, limit repeated ads, and personalize advertising where permitted by law. Visitors can manage ad personalization through Google Ads Settings and browser cookie controls.'],
        ['Analytics and Logs', 'Hosting providers, content delivery networks, browsers, and security services may automatically process standard technical information such as IP address, browser type, device information, referring pages, requested URLs, and timestamps. This information is used for security, reliability, diagnostics, and aggregate traffic analysis.'],
        ['External Links', 'Archive records link to original U.S. government sources and other media hosts. Those external websites are governed by their own privacy policies and are not controlled by this site.'],
        ['Contact', 'For privacy questions, correction requests, or source-related issues, use the contact page linked in the footer.']
      ]
    },
    ja: {
      title: 'プライバシーポリシー',
      description: '非公式UAP公開アーカイブミラーのプライバシーポリシーです。',
      body: [
        ['概要', 'このサイトは、米国政府の公開資料に基づくUAP関連記録の非公式ミラーおよび調査用インデックスです。閲覧にユーザー登録は不要で、個人情報の入力も求めません。'],
        ['広告とCookie', 'このサイトではGoogle AdSenseなどの第三者広告サービスを使用する場合があります。Googleおよびそのパートナーは、広告配信、効果測定、表示回数制御、法令で認められる範囲でのパーソナライズのためにCookie等を使用することがあります。'],
        ['ログと解析', 'ホスティング事業者や配信ネットワークは、IPアドレス、ブラウザ、端末情報、参照元、URL、時刻などの技術情報を処理する場合があります。'],
        ['外部リンク', '記録ページは米国政府の原資料や外部メディアにリンクします。外部サイトにはそれぞれのプライバシーポリシーが適用されます。'],
        ['連絡', 'プライバシー、訂正、出典に関する連絡は、フッターの連絡ページをご利用ください。']
      ]
    },
    es: {
      title: 'Política de privacidad',
      description: 'Política de privacidad del espejo no oficial del Archivo público UAP.',
      body: [
        ['Resumen', 'Este sitio es un espejo público no oficial y un índice de investigación de registros relacionados con UAP publicados por canales públicos del Gobierno de Estados Unidos. No requiere cuentas de usuario ni solicita datos personales para navegar.'],
        ['Publicidad y cookies', 'Este sitio puede usar Google AdSense u otros servicios publicitarios de terceros. Google y sus socios pueden usar cookies o tecnologías similares para mostrar anuncios, medir rendimiento, limitar repeticiones y personalizar publicidad cuando la ley lo permita.'],
        ['Registros y análisis', 'Los proveedores de alojamiento y distribución pueden procesar información técnica estándar como dirección IP, navegador, dispositivo, páginas de referencia, URL solicitadas y hora de acceso.'],
        ['Enlaces externos', 'Los registros enlazan a fuentes oficiales del Gobierno de EE. UU. y otros sitios de medios. Esos sitios se rigen por sus propias políticas de privacidad.'],
        ['Contacto', 'Para preguntas de privacidad, correcciones o asuntos de fuentes, use la página de contacto enlazada en el pie de página.']
      ]
    },
    'zh-Hans': {
      title: '隐私政策',
      description: 'UAP 公开档案非官方镜像网站的隐私政策。',
      body: [
        ['概述', '本站是基于美国政府公开渠道资料建立的非官方 UAP 档案镜像与研究索引。浏览档案无需注册账号，本站也不会要求访问者提交个人信息。'],
        ['广告与 Cookie', '本站可能使用 Google AdSense 或其他第三方广告服务。Google 及其合作伙伴可能使用 Cookie 或类似技术用于广告投放、效果衡量、限制重复展示，以及在法律允许范围内进行个性化广告。访问者可通过 Google 广告设置和浏览器 Cookie 设置进行管理。'],
        ['日志与技术信息', '托管服务、内容分发网络、浏览器和安全服务可能自动处理标准技术信息，例如 IP 地址、浏览器类型、设备信息、来源页面、请求 URL 和访问时间。这些信息用于安全、稳定性、诊断和汇总流量分析。'],
        ['外部链接', '档案记录会链接到美国政府原始来源和外部媒体网站。外部网站由其自身隐私政策约束，本站无法控制。'],
        ['联系方式', '如有隐私、纠错或来源相关问题，请使用页脚中的联系方式页面。']
      ]
    },
    'zh-Hant': {
      title: '隱私政策',
      description: 'UAP 公開檔案非官方鏡像網站的隱私政策。',
      body: [
        ['概述', '本站是基於美國政府公開渠道資料建立的非官方 UAP 檔案鏡像與研究索引。瀏覽檔案無需註冊帳號，本站也不會要求訪問者提交個人資訊。'],
        ['廣告與 Cookie', '本站可能使用 Google AdSense 或其他第三方廣告服務。Google 及其合作夥伴可能使用 Cookie 或類似技術用於廣告投放、效果衡量、限制重複展示，以及在法律允許範圍內進行個人化廣告。訪問者可透過 Google 廣告設定和瀏覽器 Cookie 設定進行管理。'],
        ['日誌與技術資訊', '託管服務、內容分發網路、瀏覽器和安全服務可能自動處理標準技術資訊，例如 IP 位址、瀏覽器類型、裝置資訊、來源頁面、請求 URL 和訪問時間。這些資訊用於安全、穩定性、診斷和匯總流量分析。'],
        ['外部連結', '檔案記錄會連結到美國政府原始來源和外部媒體網站。外部網站由其自身隱私政策約束，本站無法控制。'],
        ['聯絡方式', '如有隱私、訂正或來源相關問題，請使用頁腳中的聯絡方式頁面。']
      ]
    }
  },
  about: {
    en: {title: 'About This Archive', description: 'About the unofficial UAP Public Archive mirror.', body: [['Purpose', 'This site organizes public U.S. government UAP-related records into searchable, multilingual archive pages. It is intended for research, reference, and source verification.'], ['Source Basis', 'Record titles, descriptions, metadata, files, images, and videos are based on public government releases. Each record keeps a link to the original source when available.'], ['Unofficial Status', 'This site is not operated by the U.S. government and does not represent any government agency. When translation or formatting differs from the official source, the English official source prevails.']]},
    ja: {title: 'このサイトについて', description: '非公式UAP公開アーカイブミラーについて。', body: [['目的', 'このサイトは、米国政府が公開したUAP関連記録を検索可能な多言語アーカイブとして整理するものです。'], ['出典', '記録名、説明、メタデータ、ファイル、画像、動画は公開された政府資料に基づきます。可能な限り各記録に原典リンクを残しています。'], ['非公式サイト', 'このサイトは米国政府によって運営されておらず、政府機関を代表しません。翻訳や整形に差異がある場合は英語の公式原文を優先します。']]},
    es: {title: 'Acerca del archivo', description: 'Acerca del espejo no oficial del Archivo público UAP.', body: [['Propósito', 'Este sitio organiza registros públicos del Gobierno de Estados Unidos relacionados con UAP en páginas de archivo buscables y multilingües.'], ['Base de fuentes', 'Los títulos, descripciones, metadatos, archivos, imágenes y videos se basan en publicaciones gubernamentales públicas. Cada registro conserva un enlace a la fuente original cuando está disponible.'], ['Estado no oficial', 'Este sitio no es operado por el Gobierno de EE. UU. ni representa a ninguna agencia gubernamental. Si existe discrepancia, prevalece la fuente oficial en inglés.']]},
    'zh-Hans': {title: '关于本站', description: '关于 UAP 公开档案非官方镜像。', body: [['网站目的', '本站将美国政府公开发布的 UAP 相关档案整理为可检索、多语言的档案页面，供研究、查阅和来源核验使用。'], ['资料来源', '档案标题、说明、元数据、文件、图片和视频均基于美国政府公开发布资料。每条记录在可用情况下保留原始来源链接。'], ['非官方声明', '本站并非美国政府运营，也不代表任何政府机构。翻译或排版与官方来源存在差异时，以英文官方原文为准。']]},
    'zh-Hant': {title: '關於本站', description: '關於 UAP 公開檔案非官方鏡像。', body: [['網站目的', '本站將美國政府公開發布的 UAP 相關檔案整理為可檢索、多語言的檔案頁面，供研究、查閱和來源核驗使用。'], ['資料來源', '檔案標題、說明、元資料、文件、圖片和影片均基於美國政府公開發布資料。每條記錄在可用情況下保留原始來源連結。'], ['非官方聲明', '本站並非美國政府營運，也不代表任何政府機構。翻譯或排版與官方來源存在差異時，以英文官方原文為準。']]}
  },
  contact: {
    en: {title: 'Contact', description: 'Contact information for corrections, source issues, and privacy questions.', body: [['Contact Method', 'For corrections, broken links, privacy questions, or source concerns, open a public issue on the project repository.'], ['Repository', 'GitHub: https://github.com/NASANASANASA/us-ufo-archive'], ['What to Include', 'Please include the page URL, record title, original source URL if relevant, and a concise explanation of the issue.']]},
    ja: {title: '連絡先', description: '訂正、出典、プライバシーに関する連絡先。', body: [['連絡方法', '訂正、リンク切れ、プライバシー、出典に関する連絡は、プロジェクトのGitHubリポジトリで公開Issueを作成してください。'], ['リポジトリ', 'GitHub: https://github.com/NASANASANASA/us-ufo-archive'], ['記載事項', 'ページURL、記録名、関連する原典URL、問題の簡潔な説明を含めてください。']]},
    es: {title: 'Contacto', description: 'Información de contacto para correcciones, fuentes y privacidad.', body: [['Método de contacto', 'Para correcciones, enlaces rotos, privacidad o asuntos de fuentes, abra un issue público en el repositorio del proyecto.'], ['Repositorio', 'GitHub: https://github.com/NASANASANASA/us-ufo-archive'], ['Qué incluir', 'Incluya la URL de la página, el título del registro, la fuente original si corresponde y una explicación breve del problema.']]},
    'zh-Hans': {title: '联系方式', description: '用于纠错、来源问题和隐私问题的联系方式。', body: [['联系渠道', '如需提交纠错、失效链接、隐私问题或来源问题，请在项目 GitHub 仓库创建公开 issue。'], ['项目仓库', 'GitHub: https://github.com/NASANASANASA/us-ufo-archive'], ['建议提供的信息', '请提供页面 URL、档案标题、相关原始来源链接，以及对问题的简明说明。']]},
    'zh-Hant': {title: '聯絡方式', description: '用於訂正、來源問題和隱私問題的聯絡方式。', body: [['聯絡渠道', '如需提交訂正、失效連結、隱私問題或來源問題，請在專案 GitHub 倉庫建立公開 issue。'], ['專案倉庫', 'GitHub: https://github.com/NASANASANASA/us-ufo-archive'], ['建議提供的資訊', '請提供頁面 URL、檔案標題、相關原始來源連結，以及對問題的簡明說明。']]}
  },
  disclaimer: {
    en: {title: 'Disclaimer', description: 'Disclaimer for the unofficial UAP Public Archive mirror.', body: [['No Government Affiliation', 'This site is not an official U.S. government website and is not affiliated with, endorsed by, or operated by any U.S. government agency.'], ['Informational Use', 'The archive is provided for informational, research, and reference purposes. It does not make analytical judgments, investigative conclusions, or factual determinations about the nature of any reported UAP event.'], ['Source Priority', 'All records should be verified against the original official source. If site text, translation, formatting, or metadata differs from the official source, the official English source controls.']]},
    ja: {title: '免責事項', description: '非公式UAP公開アーカイブミラーの免責事項。', body: [['政府との関係なし', 'このサイトは米国政府の公式サイトではなく、米国政府機関による運営、承認、提携を受けていません。'], ['情報提供目的', 'このアーカイブは情報提供、調査、参照目的で提供されます。報告されたUAP事象の性質について分析判断、調査結論、事実認定を行うものではありません。'], ['原典優先', 'すべての記録は公式原典で確認してください。翻訳、表示、メタデータに差異がある場合は英語の公式原文を優先します。']]},
    es: {title: 'Aviso legal', description: 'Aviso legal del espejo no oficial del Archivo público UAP.', body: [['Sin afiliación gubernamental', 'Este sitio no es un sitio oficial del Gobierno de Estados Unidos y no está afiliado, respaldado ni operado por ninguna agencia gubernamental estadounidense.'], ['Uso informativo', 'El archivo se ofrece con fines informativos, de investigación y referencia. No realiza juicios analíticos, conclusiones investigativas ni determinaciones fácticas sobre la naturaleza de eventos UAP reportados.'], ['Prioridad de la fuente', 'Todos los registros deben verificarse con la fuente oficial original. Si hay diferencias de texto, traducción, formato o metadatos, prevalece la fuente oficial en inglés.']]},
    'zh-Hans': {title: '免责声明', description: 'UAP 公开档案非官方镜像网站的免责声明。', body: [['非政府隶属', '本站不是美国政府官方网站，也不隶属于、代表或受任何美国政府机构运营或认可。'], ['信息用途', '本站档案仅供信息、研究和参考使用。本站不对任何被报告为 UAP 的事件性质作分析判断、调查结论或事实认定。'], ['来源优先', '所有记录均应以官方原始来源进行核验。如本站文字、翻译、格式或元数据与官方来源存在差异，以英文官方来源为准。']]},
    'zh-Hant': {title: '免責聲明', description: 'UAP 公開檔案非官方鏡像網站的免責聲明。', body: [['非政府隸屬', '本站不是美國政府官方網站，也不隸屬於、代表或受任何美國政府機構營運或認可。'], ['資訊用途', '本站檔案僅供資訊、研究和參考使用。本站不對任何被報告為 UAP 的事件性質作分析判斷、調查結論或事實認定。'], ['來源優先', '所有記錄均應以官方原始來源進行核驗。如本站文字、翻譯、格式或元資料與官方來源存在差異，以英文官方來源為準。']]}
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
  if (lang === 'ja') return doc.i18n.ja.titleZh || doc.id;
  if (lang === 'es') return doc.i18n.es.titleZh || doc.id;
  return doc.id;
}

function langLocation(doc, lang) {
  if (lang === 'zh-Hans') return doc.i18n['zh-Hans'].locZh || doc.incidentLocation || '未标示';
  if (lang === 'zh-Hant') return doc.i18n['zh-Hant'].locZh || doc.incidentLocation || '未標示';
  if (lang === 'ja') return doc.i18n.ja.locZh || doc.incidentLocation || 'N/A';
  if (lang === 'es') return doc.i18n.es.locZh || doc.incidentLocation || 'N/A';
  return doc.incidentLocation || 'N/A';
}

function langDescription(doc, lang) {
  if (lang === 'zh-Hans') return doc.i18n['zh-Hans'].descZh || doc.description;
  if (lang === 'zh-Hant') return doc.i18n['zh-Hant'].descZh || doc.description;
  if (lang === 'ja') return doc.i18n.ja.descZh || doc.description;
  if (lang === 'es') return doc.i18n.es.descZh || doc.description;
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

function footerHtml(prefix, lang) {
  const labels = Object.fromEntries(Object.entries(legalPages).map(([slug, pages]) => [slug, pages[lang].title]));
  return `<footer>
    <div><b>${esc(text[lang].home)}</b><span>${esc(text[lang].notice)}</span></div>
    <nav class="footer-links" aria-label="Site policies">
      <a href="${prefix}${lang}/about/" data-legal-open="about">${esc(labels.about)}</a>
      <a href="${prefix}${lang}/privacy/" data-legal-open="privacy">${esc(labels.privacy)}</a>
      <a href="${prefix}${lang}/contact/" data-legal-open="contact">${esc(labels.contact)}</a>
      <a href="${prefix}${lang}/disclaimer/" data-legal-open="disclaimer">${esc(labels.disclaimer)}</a>
      <a href="https://www.war.gov/UFO/" target="_blank" rel="noopener">SOURCE ↗</a>
    </nav>
  </footer>
  ${legalModalHtml(lang)}`;
}

function legalModalHtml(lang) {
  const pages = Object.entries(legalPages).map(([slugName, pagesByLang]) => {
    const page = pagesByLang[lang];
    return `<article class="legal-modal-page" data-legal-page="${esc(slugName)}" hidden>
        <h2>${esc(page.title)}</h2>
        <p class="legal-modal-desc">${esc(page.description)}</p>
        ${page.body.map(([heading, paragraph]) => `<h3>${esc(heading)}</h3><p>${linkifyText(paragraph)}</p>`).join('\n        ')}
        <p class="legal-modal-updated">Last updated: June 16, 2026</p>
      </article>`;
  }).join('\n      ');
  return `<div class="legal-modal-backdrop" id="legal-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="legal-modal-title" hidden>
    <section class="legal-modal">
      <header class="legal-modal-head">
        <span id="legal-modal-title">SITE POLICY</span>
        <button class="legal-modal-close" type="button" onclick="closeLegalModal()" aria-label="Close">×</button>
      </header>
      <div class="legal-modal-body">
      ${pages}
      </div>
    </section>
  </div>`;
}

function pageShell({lang, title, description, canonicalPath, body, depth = 0, schema}) {
  const prefix = '../'.repeat(depth);
  const canonical = `${siteUrl}${canonicalPath}`;
  const localPath = canonicalPath.replace(/^\/(en|ja|es|zh-Hans|zh-Hant)/, '');
  const schemaHtml = schema ? `  <script type="application/ld+json">${JSON.stringify(schema)}</script>\n` : '';
  const langMenu = `<details class="lang-menu">
        <summary>${esc(text[lang].language || 'Language')}</summary>
        <div>
          <a data-dir="en" data-lang="en" href="${prefix}en${localPath}">English</a>
          <a data-dir="ja" data-lang="ja" href="${prefix}ja${localPath}">日本語</a>
          <a data-dir="es" data-lang="es" href="${prefix}es${localPath}">Español</a>
          <a data-dir="zh-Hans" data-lang="cn" href="${prefix}zh-Hans${localPath}">简体中文</a>
          <a data-dir="zh-Hant" data-lang="tw" href="${prefix}zh-Hant${localPath}">繁體中文</a>
        </div>
      </details>`;
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
  <link rel="stylesheet" href="${prefix}assets/style.css?v=20260616-legalmodal1">
${schemaHtml}
</head>
<body class="static-page">
  <div class="scanlines" aria-hidden="true"></div>
  <header class="site-header">
    <a class="brand" href="${prefix}index.html"><span class="brand-mark"><i></i><i></i><i></i></span><span><b>${esc(text[lang].home)}</b><small>${esc(text[lang].name)}</small></span></a>
    <nav>
      <a href="${prefix}${lang}/archive/">${esc(text[lang].archive)}</a>
      <a href="${prefix}index.html#archive">Interactive</a>
      ${langMenu}
    </nav>
  </header>
  ${body}
  ${footerHtml(prefix, lang)}
  <script src="${prefix}assets/site.js?v=20260616-legalmodal1"></script>
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

function buildLegalPage(lang, slugName) {
  const page = legalPages[slugName][lang];
  const body = `<main class="static-main">
    <section class="static-hero">
      <p class="system-line"><span></span> SITE POLICY</p>
      <h1>${esc(page.title)}</h1>
      <p>${esc(page.description)}</p>
    </section>
    <section class="static-panel legal-panel">
      ${page.body.map(([heading, paragraph]) => `<h2>${esc(heading)}</h2><p>${linkifyText(paragraph)}</p>`).join('\n      ')}
      <p class="static-muted">Last updated: June 16, 2026</p>
    </section>
  </main>`;
  return pageShell({lang, title: `${page.title} · ${text[lang].home}`, description: page.description, canonicalPath: `/${lang}/${slugName}/`, body, depth: 2});
}

function linkifyText(value) {
  return esc(value).replace(/https:\/\/github\.com\/NASANASANASA\/us-ufo-archive/g, '<a href="https://github.com/NASANASANASA/us-ufo-archive" target="_blank" rel="noopener">https://github.com/NASANASANASA/us-ufo-archive</a>');
}

function buildInteractiveHome(lang, template) {
  const footer = footerHtml('../', lang)
    .replace(new RegExp(`href="../${lang}/`, 'g'), `href="./`)
    .replace(/href="\.\.\/"/g, 'href="../"');
  return template
    .replace(/\s*<div class="legal-modal-backdrop"[\s\S]*?<\/section>\s*<\/div>\s*/g, '\n')
    .replace(/<html[^>]*>/, `<html lang="${text[lang].lang}">`)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(text[lang].home)} · ${esc(text[lang].name)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(text[lang].notice)}">`)
    .replace(/href="\.\/assets\//g, 'href="../assets/')
    .replace(/src="\.\/assets\//g, 'src="../assets/')
    .replace(/assets\/style\.css\?v=[^"]+/g, 'assets/style.css?v=20260616-legalmodal1')
    .replace(/assets\/site\.js\?v=[^"]+/g, 'assets/site.js?v=20260616-legalmodal1')
    .replace(/href="\.\/en\/"/g, 'href="../en/"')
    .replace(/href="\.\/ja\/"/g, 'href="../ja/"')
    .replace(/href="\.\/es\/"/g, 'href="../es/"')
    .replace(/href="\.\/"/g, 'href="../"')
    .replace(/<footer>[\s\S]*?<\/footer>/, footer);
}

function buildRecordPage(doc, lang) {
  const l = text[lang];
  const title = langTitle(doc, lang);
  const description = metaDescription(doc, lang);
  const canonicalPath = `/${lang}/records/${doc.slug}/`;
  const officialDescription = doc.description || '';
  const languageDescription = langDescription(doc, lang);
  const descriptionBlocks = [
    (lang === 'zh-Hans' || lang === 'zh-Hant' || lang === 'ja' || lang === 'es') && languageDescription
      ? `<h2>${esc(l.official)}</h2>${paragraphs(languageDescription)}`
      : '',
    lang === 'en' && officialDescription ? `<h2>${esc(l.official)}</h2>${paragraphs(officialDescription)}` : ''
  ].filter(Boolean).join('\n        ');
  const preview = doc.imageUrl ? `<img src="${esc(urls(doc.imageUrl)[0])}" alt="">` : `<div class="real-file"><b>.${esc(doc.type)}</b><span>${esc(title)}</span></div>`;
  const virinMeta = doc.virin ? `\n          <dt>VIRIN</dt><dd>${esc(doc.virin)}</dd>` : '';
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
        ${descriptionBlocks}
        <a class="static-button" href="${esc(doc.sourceUrl)}" target="_blank" rel="noopener">${esc(l.source)} ↗</a>
      </article>
      <aside class="static-panel">
        <div class="static-preview">${preview}</div>
        <dl class="static-meta">
          <dt>${esc(l.agency)}</dt><dd>${esc(agencyLabel(doc.agency, lang))}</dd>
          <dt>${esc(l.release)}</dt><dd>${esc(releaseLabel(doc.release, lang))}</dd>
          <dt>${esc(l.date)}</dt><dd>${esc(doc.incidentDate || 'N/A')}</dd>
          <dt>${esc(l.location)}</dt><dd>${esc(langLocation(doc, lang))}</dd>
          <dt>${esc(l.type)}</dt><dd>.${esc(doc.type)}</dd>${virinMeta}
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
  const interactiveTemplate = read('zh-Hant/index.html');
  const csv = parseCSV(read('assets/uap-data.csv'));
  const zhCn = JSON.parse(read('assets/i18n-zh-cn.json'));
  const zhTw = JSON.parse(read('assets/i18n-zh-tw.json'));
  const ja = fs.existsSync(path.join(root, 'assets/i18n-ja.json')) ? JSON.parse(read('assets/i18n-ja.json')) : [];
  const es = fs.existsSync(path.join(root, 'assets/i18n-es.json')) ? JSON.parse(read('assets/i18n-es.json')) : [];
  const docs = csv.map((row, index) => normalize(row, index, zhCn, zhTw, ja, es)).filter(doc => doc.id);
  const urlsForSitemap = [];

  for (const dir of generatedDirs) fs.rmSync(path.join(root, dir), {recursive: true, force: true});

  for (const lang of Object.keys(text)) {
    writeFile(`${lang}/index.html`, buildInteractiveHome(lang, interactiveTemplate));
    urlsForSitemap.push(`/${lang}/`);
    for (const slugName of Object.keys(legalPages)) {
      writeFile(`${lang}/${slugName}/index.html`, buildLegalPage(lang, slugName));
      urlsForSitemap.push(`/${lang}/${slugName}/`);
    }
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

  for (const lang of extraStaticDirs) {
    if (!fs.existsSync(path.join(root, lang, 'index.html'))) continue;
    urlsForSitemap.push(`/${lang}/`);
    for (const slugName of Object.keys(legalPages)) {
      if (fs.existsSync(path.join(root, lang, slugName, 'index.html'))) {
        urlsForSitemap.push(`/${lang}/${slugName}/`);
      }
    }
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${['/', ...urlsForSitemap].map(u => `  <url><loc>${siteUrl}${u}</loc></url>`).join('\n')}\n</urlset>\n`;
  writeFile('sitemap.xml', sitemap);
  writeFile('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`);
  console.log(`Generated ${docs.length} records across ${Object.keys(text).length} languages.`);
}

build();
