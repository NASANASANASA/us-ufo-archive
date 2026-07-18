const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const siteUrl = (process.env.SITE_URL || 'https://uap-archives.org').replace(/\/$/, '');
const mediaBase = (process.env.UAP_MEDIA_BASE || 'https://media.uap-archives.org/').replace(/\/?$/, '/');
const mediaVersion = process.env.UAP_MEDIA_VERSION || '20260718-seo1';
const assetVersion = '20260718-releasecopy1';
const adsenseScript = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2222469808721720"
     crossorigin="anonymous"></script>`;
const adsenseClient = 'ca-pub-2222469808721720';
const adsenseSlot = '8548356239';
const analyticsScript = `<script async src="https://www.googletagmanager.com/gtag/js?id=G-ZND85JXQ6M"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-ZND85JXQ6M');
</script>`;
const generatedDirs = ['en', 'es', 'pt', 'fr', 'de', 'ru', 'ar', 'ja', 'ko', 'zh-Hans', 'zh-Hant'];
const extraStaticDirs = [];
const langPathPattern = new RegExp(`^/(${generatedDirs.join('|')})(/|$)`);
const langMenuCodes = {en: 'en', ja: 'ja', es: 'es', 'zh-Hans': 'cn', 'zh-Hant': 'tw', pt: 'pt', ru: 'ru', fr: 'fr', de: 'de', ko: 'ko', ar: 'ar'};

const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const clean = value => String(value || '').replace(/\u00a0/g, ' ').trim();
const key = value => clean(value).toLowerCase().replace(/[^a-z0-9]/g, '');
const esc = value => clean(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug = value => clean(value).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'unspecified';
const assetCode = value => clean(value).split(',')[0].toUpperCase().replace(/[^A-Z0-9]/g, '');
const mirroredAsset = value => {
  const m = clean(value).match(/\/071026\/Slideshow\/([^/?#]+)$/i);
  return m ? `assets/mirror/release-04/${m[1]}` : clean(value);
};
const r2Asset = value => {
  const m = clean(value).match(/\/071026\/Slideshow\/([^/?#]+)$/i);
  return m ? `${mediaBase}release-04/${m[1]}?v=${encodeURIComponent(mediaVersion)}` : clean(value);
};
const r2VideoAsset = value => {
  const m = clean(value).match(/\/071026\/Slideshow\/([^/?#]+)\.jpg$/i);
  return m ? `${mediaBase}release-04/videos/${m[1]}.mp4?v=${encodeURIComponent(mediaVersion)}` : '';
};
const r2Documents = (() => {
  try {
    const rows = read('assets/release-04-r2-document-manifest.tsv').trim().split(/\r?\n/).slice(1);
    return Object.fromEntries(rows.map(line => {
      const [type, title, r2Key] = line.split('\t');
      return [assetCode(title), {type, url: `${mediaBase}${r2Key}?v=${encodeURIComponent(mediaVersion)}`}];
    }).filter(([code, item]) => code && item.url));
  } catch (error) {
    return {};
  }
})();
const dvidsMp4 = (() => {
  try {
    const source = read('assets/dvids-map.js');
    return Object.fromEntries([...source.matchAll(/"(\d+)"\s*:\s*"([^"]+)"/g)].map(m => [m[1], m[2]]));
  } catch (error) {
    return {};
  }
})();
const relativePath = (value, depth) => /^https?:\/\//i.test(clean(value)) ? clean(value) : `${'../'.repeat(depth)}${clean(value)}`;

const seoText = {
  en: {
    release04Title: 'Release 04 UAP Records',
    release04Intro: 'Browse all 40 public UAP records from the fourth official release, including videos, images, PDFs, incident metadata, and official source links.',
    videosTitle: 'UAP Videos',
    videosIntro: 'Browse public U.S. government UAP video records with local playback when available, official descriptions, related records, and source downloads.',
    pdfsTitle: 'UAP PDF Records',
    pdfsIntro: 'Browse public U.S. government UAP PDF records, source documents, record metadata, related files, and official archive links.',
    imagesTitle: 'UAP Images',
    imagesIntro: 'Browse public U.S. government UAP image records, still frames, digital renderings, supporting metadata, and official archive links.',
    browseRelease04: 'Release 04 records',
    browseVideos: 'UAP videos',
    browsePdfs: 'PDF records',
    browseImages: 'Image records',
    mediaDetails: 'Media details',
    mediaDetailsIntro: 'This page indexes the record type, source agency, release batch, incident date, incident location, official source, and available public media for search and reference.',
    homeDescription: 'Search public U.S. government UAP records across official releases, agencies, years, locations, videos, images, and PDF source documents.'
  },
  es: {
    release04Title: 'Registros UAP de la publicación 04',
    release04Intro: 'Consulta los 40 registros UAP públicos de la cuarta publicación oficial, con videos, imágenes, PDF, metadatos del incidente y enlaces a la fuente oficial.',
    videosTitle: 'Videos UAP',
    videosIntro: 'Consulta videos UAP públicos del Gobierno de EE. UU. con reproducción local cuando está disponible, descripciones oficiales, registros relacionados y descargas de origen.',
    pdfsTitle: 'Registros PDF UAP',
    pdfsIntro: 'Consulta documentos PDF UAP públicos del Gobierno de EE. UU., metadatos, archivos relacionados y enlaces al archivo oficial.',
    imagesTitle: 'Imágenes UAP',
    imagesIntro: 'Consulta imágenes UAP públicas, fotogramas, recreaciones digitales, metadatos y enlaces al archivo oficial.',
    browseRelease04: 'Registros de publicación 04',
    browseVideos: 'Videos UAP',
    browsePdfs: 'Registros PDF',
    browseImages: 'Registros de imagen',
    mediaDetails: 'Detalles multimedia',
    mediaDetailsIntro: 'Esta página indexa el tipo de registro, agencia fuente, publicación, fecha, lugar, fuente oficial y medios públicos disponibles para búsqueda y referencia.',
    homeDescription: 'Busca registros UAP públicos del Gobierno de EE. UU. por publicaciones, agencias, años, lugares, videos, imágenes y documentos PDF.'
  },
  pt: {
    release04Title: 'Registros UAP da publicação 04',
    release04Intro: 'Explore os 40 registros UAP públicos da quarta publicação oficial, incluindo vídeos, imagens, PDFs, metadados do incidente e links oficiais.',
    videosTitle: 'Vídeos UAP',
    videosIntro: 'Explore vídeos UAP públicos do governo dos EUA com reprodução local quando disponível, descrições oficiais, registros relacionados e downloads.',
    pdfsTitle: 'Registros PDF UAP',
    pdfsIntro: 'Explore documentos PDF UAP públicos do governo dos EUA, metadados, arquivos relacionados e links oficiais.',
    imagesTitle: 'Imagens UAP',
    imagesIntro: 'Explore imagens UAP públicas, quadros de vídeo, renderizações digitais, metadados e links oficiais.',
    browseRelease04: 'Registros da publicação 04',
    browseVideos: 'Vídeos UAP',
    browsePdfs: 'Registros PDF',
    browseImages: 'Registros de imagem',
    mediaDetails: 'Detalhes da mídia',
    mediaDetailsIntro: 'Esta página indexa tipo de registro, agência, lote, data, local, fonte oficial e mídia pública disponível para pesquisa e referência.',
    homeDescription: 'Pesquise registros UAP públicos do governo dos EUA por publicações, agências, anos, locais, vídeos, imagens e PDFs.'
  },
  fr: {
    release04Title: 'Archives UAP de la publication 04',
    release04Intro: 'Parcourez les 40 archives UAP publiques de la quatrième publication officielle, avec vidéos, images, PDF, métadonnées et liens officiels.',
    videosTitle: 'Vidéos UAP',
    videosIntro: 'Parcourez les vidéos UAP publiques du gouvernement des États-Unis avec lecture locale lorsque disponible, descriptions officielles, archives liées et téléchargements.',
    pdfsTitle: 'Archives PDF UAP',
    pdfsIntro: 'Parcourez les documents PDF UAP publics du gouvernement des États-Unis, leurs métadonnées, fichiers liés et liens officiels.',
    imagesTitle: 'Images UAP',
    imagesIntro: 'Parcourez les images UAP publiques, captures, rendus numériques, métadonnées et liens officiels.',
    browseRelease04: 'Archives publication 04',
    browseVideos: 'Vidéos UAP',
    browsePdfs: 'Archives PDF',
    browseImages: 'Archives image',
    mediaDetails: 'Détails du média',
    mediaDetailsIntro: 'Cette page indexe le type, l’agence, la publication, la date, le lieu, la source officielle et les médias publics disponibles.',
    homeDescription: 'Rechercher les archives UAP publiques du gouvernement des États-Unis par publication, agence, année, lieu, vidéo, image et PDF.'
  },
  de: {
    release04Title: 'UAP-Unterlagen Veröffentlichung 04',
    release04Intro: 'Durchsuchen Sie alle 40 öffentlichen UAP-Unterlagen der vierten offiziellen Veröffentlichung mit Videos, Bildern, PDFs, Metadaten und Quellenlinks.',
    videosTitle: 'UAP-Videos',
    videosIntro: 'Durchsuchen Sie öffentliche UAP-Videos der US-Regierung mit lokaler Wiedergabe, offiziellen Beschreibungen, verwandten Unterlagen und Downloads.',
    pdfsTitle: 'UAP-PDF-Unterlagen',
    pdfsIntro: 'Durchsuchen Sie öffentliche UAP-PDF-Dokumente der US-Regierung, Metadaten, verwandte Dateien und offizielle Archivlinks.',
    imagesTitle: 'UAP-Bilder',
    imagesIntro: 'Durchsuchen Sie öffentliche UAP-Bilder, Standbilder, digitale Darstellungen, Metadaten und offizielle Archivlinks.',
    browseRelease04: 'Veröffentlichung 04',
    browseVideos: 'UAP-Videos',
    browsePdfs: 'PDF-Unterlagen',
    browseImages: 'Bildunterlagen',
    mediaDetails: 'Mediendetails',
    mediaDetailsIntro: 'Diese Seite indexiert Typ, Behörde, Veröffentlichung, Datum, Ort, offizielle Quelle und verfügbare öffentliche Medien.',
    homeDescription: 'Öffentliche UAP-Unterlagen der US-Regierung nach Veröffentlichung, Behörde, Jahr, Ort, Video, Bild und PDF durchsuchen.'
  },
  ru: {
    release04Title: 'Материалы UAP выпуска 04',
    release04Intro: 'Просмотрите все 40 публичных материалов UAP из четвертого официального выпуска: видео, изображения, PDF, метаданные и официальные ссылки.',
    videosTitle: 'Видео UAP',
    videosIntro: 'Просмотрите публичные видео UAP правительства США с локальным воспроизведением, официальными описаниями, связанными материалами и загрузками.',
    pdfsTitle: 'PDF-материалы UAP',
    pdfsIntro: 'Просмотрите публичные PDF-документы UAP правительства США, метаданные, связанные файлы и официальные ссылки.',
    imagesTitle: 'Изображения UAP',
    imagesIntro: 'Просмотрите публичные изображения UAP, кадры, цифровые реконструкции, метаданные и официальные ссылки.',
    browseRelease04: 'Материалы выпуска 04',
    browseVideos: 'Видео UAP',
    browsePdfs: 'PDF-материалы',
    browseImages: 'Изображения',
    mediaDetails: 'Сведения о медиа',
    mediaDetailsIntro: 'Страница индексирует тип записи, ведомство, выпуск, дату, место, официальный источник и доступные публичные медиа.',
    homeDescription: 'Поиск публичных материалов UAP правительства США по выпускам, ведомствам, годам, местам, видео, изображениям и PDF.'
  },
  ar: {
    release04Title: 'سجلات UAP الإصدار 04',
    release04Intro: 'تصفح جميع سجلات UAP العامة الأربعين من الإصدار الرسمي الرابع، بما في ذلك الفيديو والصور وملفات PDF والبيانات وروابط المصدر الرسمي.',
    videosTitle: 'فيديوهات UAP',
    videosIntro: 'تصفح فيديوهات UAP العامة من حكومة الولايات المتحدة مع تشغيل محلي عند توفره، وأوصاف رسمية وسجلات مرتبطة وتنزيلات.',
    pdfsTitle: 'سجلات PDF الخاصة بـ UAP',
    pdfsIntro: 'تصفح وثائق PDF العامة الخاصة بـ UAP من حكومة الولايات المتحدة مع البيانات والملفات المرتبطة والروابط الرسمية.',
    imagesTitle: 'صور UAP',
    imagesIntro: 'تصفح صور UAP العامة واللقطات والعروض الرقمية والبيانات والروابط الرسمية.',
    browseRelease04: 'سجلات الإصدار 04',
    browseVideos: 'فيديوهات UAP',
    browsePdfs: 'سجلات PDF',
    browseImages: 'سجلات الصور',
    mediaDetails: 'تفاصيل الوسائط',
    mediaDetailsIntro: 'تفهرس هذه الصفحة نوع السجل والجهة والإصدار والتاريخ والموقع والمصدر الرسمي والوسائط العامة المتاحة.',
    homeDescription: 'ابحث في سجلات UAP العامة للحكومة الأمريكية حسب الإصدار والجهة والسنة والموقع والفيديو والصورة وPDF.'
  },
  ja: {
    release04Title: '第4回公開UAP記録',
    release04Intro: '第4回公式公開に含まれる40件のUAP記録を、動画、画像、PDF、事件メタデータ、公式リンクとともに閲覧できます。',
    videosTitle: 'UAP動画',
    videosIntro: '米国政府が公開したUAP動画を、利用可能なローカル再生、公式説明、関連記録、ダウンロードとともに閲覧できます。',
    pdfsTitle: 'UAP PDF記録',
    pdfsIntro: '米国政府のUAP PDF資料、メタデータ、関連ファイル、公式アーカイブリンクを閲覧できます。',
    imagesTitle: 'UAP画像',
    imagesIntro: '公開UAP画像、静止画、デジタル再現、メタデータ、公式リンクを閲覧できます。',
    browseRelease04: '第4回公開記録',
    browseVideos: 'UAP動画',
    browsePdfs: 'PDF記録',
    browseImages: '画像記録',
    mediaDetails: 'メディア詳細',
    mediaDetailsIntro: 'このページは記録種別、機関、公開回、事件日、場所、公式ソース、利用可能な公開メディアを検索と参照のために整理しています。',
    homeDescription: '米国政府の公開UAP記録を公開回、機関、年、場所、動画、画像、PDF資料から検索できます。'
  },
  ko: {
    release04Title: '4차 공개 UAP 기록',
    release04Intro: '네 번째 공식 공개의 40개 UAP 기록을 영상, 이미지, PDF, 사건 메타데이터, 공식 출처 링크와 함께 볼 수 있습니다.',
    videosTitle: 'UAP 영상',
    videosIntro: '미국 정부 공개 UAP 영상을 가능한 경우 로컬 재생, 공식 설명, 관련 기록, 다운로드와 함께 볼 수 있습니다.',
    pdfsTitle: 'UAP PDF 기록',
    pdfsIntro: '미국 정부의 공개 UAP PDF 문서, 메타데이터, 관련 파일, 공식 아카이브 링크를 볼 수 있습니다.',
    imagesTitle: 'UAP 이미지',
    imagesIntro: '공개 UAP 이미지, 정지 프레임, 디지털 렌더링, 메타데이터, 공식 링크를 볼 수 있습니다.',
    browseRelease04: '4차 공개 기록',
    browseVideos: 'UAP 영상',
    browsePdfs: 'PDF 기록',
    browseImages: '이미지 기록',
    mediaDetails: '미디어 세부정보',
    mediaDetailsIntro: '이 페이지는 검색과 참조를 위해 기록 유형, 기관, 공개 회차, 날짜, 위치, 공식 출처, 사용 가능한 공개 미디어를 색인합니다.',
    homeDescription: '미국 정부 공개 UAP 기록을 공개 회차, 기관, 연도, 위치, 영상, 이미지, PDF 문서별로 검색합니다.'
  },
  'zh-Hans': {
    release04Title: '第四批 UAP 公开档案',
    release04Intro: '浏览第四批官方公开的 40 条 UAP 档案，包括视频、图片、PDF、事件元数据和美国官方来源链接。',
    videosTitle: 'UAP 视频档案',
    videosIntro: '浏览美国政府公开的 UAP 视频档案；可用时支持本地播放，并保留官方说明、相关档案和下载链接。',
    pdfsTitle: 'UAP PDF 档案',
    pdfsIntro: '浏览美国政府公开的 UAP PDF 原始文件、档案元数据、相关文件和官方来源链接。',
    imagesTitle: 'UAP 图片档案',
    imagesIntro: '浏览美国政府公开的 UAP 图片、视频截图、数字重绘、元数据和官方来源链接。',
    browseRelease04: '第四批档案',
    browseVideos: 'UAP 视频',
    browsePdfs: 'PDF 档案',
    browseImages: '图片档案',
    mediaDetails: '媒体信息',
    mediaDetailsIntro: '本页为搜索和查阅整理档案类型、发布机构、公开批次、事件日期、事件地点、官方来源以及可用的公开媒体。',
    homeDescription: '按公开批次、机构、年份、地点、视频、图片和 PDF 文件检索美国政府公开 UAP 档案。'
  },
  'zh-Hant': {
    release04Title: '第四批 UAP 公開檔案',
    release04Intro: '瀏覽第四批官方公開的 40 筆 UAP 檔案，包括影片、圖片、PDF、事件元資料和美國官方來源連結。',
    videosTitle: 'UAP 影片檔案',
    videosIntro: '瀏覽美國政府公開的 UAP 影片檔案；可用時支援本地播放，並保留官方說明、相關檔案和下載連結。',
    pdfsTitle: 'UAP PDF 檔案',
    pdfsIntro: '瀏覽美國政府公開的 UAP PDF 原始文件、檔案元資料、相關文件和官方來源連結。',
    imagesTitle: 'UAP 圖片檔案',
    imagesIntro: '瀏覽美國政府公開的 UAP 圖片、影片截圖、數位重繪、元資料和官方來源連結。',
    browseRelease04: '第四批檔案',
    browseVideos: 'UAP 影片',
    browsePdfs: 'PDF 檔案',
    browseImages: '圖片檔案',
    mediaDetails: '媒體資訊',
    mediaDetailsIntro: '本頁為搜尋和查閱整理檔案類型、發布機構、公開批次、事件日期、事件地點、官方來源以及可用的公開媒體。',
    homeDescription: '按公開批次、機構、年份、地點、影片、圖片和 PDF 文件檢索美國政府公開 UAP 檔案。'
  }
};

function manualAdSlot(name = 'inline') {
  return `<section class="uap-ad-slot uap-ad-slot-${name}" aria-label="Advertisement">
      <ins class="adsbygoogle"
           style="display:block"
           data-ad-client="${adsenseClient}"
           data-ad-slot="${adsenseSlot}"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
      <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
    </section>`;
}

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

function normalize(row, index, translations) {
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
    '06/12/2026': 'RELEASE 03',
    '7/10/26': 'RELEASE 04',
    '7/10/2026': 'RELEASE 04',
    '07/10/2026': 'RELEASE 04'
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
  const videoRaw = field(row, ['video url', 'videoUrl', 'video link', 'media url', 'video', 'media']);
  const derivedVideo = (officialType === 'VID' || officialType === 'AUD') && imageUrl ? r2VideoAsset(urls(imageUrl)[0]) : '';
  const dvidsVideo = dvidsId && dvidsMp4[dvidsId] ? dvidsMp4[dvidsId] : '';
  const videoUrl = [
    ...(dvidsVideo ? [dvidsVideo] : []),
    ...(videoRaw ? urls(videoRaw).map(absolute) : pick(/\.(mp4|webm|mov|m4v|ogg)$/i)),
    ...(derivedVideo ? [derivedVideo] : [])
  ].filter(Boolean).join('|');
  const recordId = field(row, ['asset file name', 'title', 'assetFileName']);
  const r2Document = r2Documents[assetCode(recordId)] || null;
  const ext = (doc.split('?')[0].match(/\.([a-z0-9]+)$/i)?.[1] || r2Document?.type || officialType || 'PDF').replace('.', '').toUpperCase();
  return {
    index,
    id: recordId,
    slug: slug(recordId),
    agency: field(row, ['agency']) || 'U.S. Government',
    release: field(row, ['release']) || releaseMap[releaseDate] || releaseDate,
    releaseDate,
    incidentDate: field(row, ['incident date', 'incidentDate']) || 'N/A',
    incidentLocation: (field(row, ['incident location', 'incidentLocation']) || 'N/A').replace(/\bWesten United States\b/g, 'Western United States'),
    type: officialType || (dvidsId ? 'VID' : (imageUrl && !doc ? 'IMG' : ext)),
    description: field(row, ['description blurb', 'description', 'video description', 'record description', 'caption']),
    sourceUrl: doc || dvidsPage || (officialType === 'IMG' ? assetLink : '') || imageUrl || videoUrl || found[0] || 'https://www.war.gov/UFO/',
    documentUrl: doc,
    r2DocumentUrl: r2Document?.url || '',
    videoUrl,
    imageUrl,
    videoPairing: field(row, ['video pairing']),
    pdfPairing: field(row, ['pdf pairing']),
    dvidsId,
    virin: field(row, ['image virin', 'virin']),
    redaction: /^(true|yes)$/i.test(field(row, ['redaction'])),
    i18n: Object.fromEntries(generatedDirs.filter(lang => lang !== 'en').map(lang => [lang, translations[lang]?.[index] || {}]))
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
    downloadCurrent: 'Download file ↓',
    backToList: 'Back to archive list',
    all: 'All Records',
    byAgency: 'Records by agency',
    byYear: 'Records by year',
    byLocation: 'Records by location',
    byType: 'Records by type',
    indexes: 'Indexes',
    related: 'Related archive indexes',
    relatedMedia: 'Related records',
    generated: 'Static SEO index generated from official U.S. government UAP release data.',
    descriptionPrefix: 'Official U.S. government UAP archive record',
    redactionNotice: "Redactions have been made to protect the identity of eyewitnesses, the location of government facilities, or potentially sensitive information about military sites not related to UAP. No redactions have been made to any files released under President Trump's directive concerning information about the nature or existence of any encounter reported as a UAP or related phenomena."
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
    downloadCurrent: 'ファイルをダウンロード ↓',
    backToList: 'アーカイブ一覧へ戻る',
    all: '全記録',
    byAgency: '機関別記録',
    byYear: '年別記録',
    byLocation: '場所別記録',
    byType: '種類別記録',
    indexes: '索引',
    related: '関連アーカイブ索引',
    relatedMedia: '関連記録',
    generated: '米国政府のUAP公開データから生成した静的SEO索引です。',
    descriptionPrefix: '米国政府UAP公開アーカイブ記録',
    redactionNotice: '目撃者の身元、政府施設の位置、またはUAPと無関係な軍事施設に関する機微情報を保護するため、黒塗り処理が行われています。UAPまたは関連現象として報告された遭遇の性質や存在に関する情報について、トランプ大統領の指令に基づき公開されたファイルには黒塗り処理は行われていません。'
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
    downloadCurrent: 'Descargar archivo ↓',
    backToList: 'Volver al listado',
    all: 'Todos los registros',
    byAgency: 'Registros por agencia',
    byYear: 'Registros por año',
    byLocation: 'Registros por lugar',
    byType: 'Registros por tipo',
    indexes: 'Índices',
    related: 'Índices relacionados',
    relatedMedia: 'Registros relacionados',
    generated: 'Índice SEO estático generado a partir de datos oficiales de publicaciones UAP del Gobierno de Estados Unidos.',
    descriptionPrefix: 'Registro del archivo público UAP del Gobierno de Estados Unidos',
    redactionNotice: 'Se han realizado censuras para proteger la identidad de testigos, la ubicación de instalaciones gubernamentales o información potencialmente sensible sobre sitios militares no relacionados con UAP. No se han realizado censuras en archivos publicados bajo la directiva del presidente Trump sobre información relativa a la naturaleza o existencia de cualquier encuentro reportado como UAP o fenómenos relacionados.'
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
    downloadCurrent: '下载本档案↓',
    backToList: '返回档案一览',
    all: '全部记录',
    byAgency: '按机构浏览',
    byYear: '按年份浏览',
    byLocation: '按地点浏览',
    byType: '按类型浏览',
    indexes: '索引',
    related: '相关索引',
    relatedMedia: '相关档案',
    generated: '根据美国政府 UAP 公开数据生成的静态 SEO 索引。',
    descriptionPrefix: '美国政府 UAP 公开档案记录',
    redactionNotice: '为保护目击者身份、政府设施位置，或与不明异常现象（UAP）无关的军事场所敏感信息，本文件已作涂黑处理。根据特朗普总统关于任何被报告为UAP或相关现象的事件之性质或存在信息的指令所发布的文件，均未作任何涂黑处理。'
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
    downloadCurrent: '下載本檔案↓',
    backToList: '返回檔案一覽',
    all: '全部記錄',
    byAgency: '按機構瀏覽',
    byYear: '按年份瀏覽',
    byLocation: '按地點瀏覽',
    byType: '按類型瀏覽',
    indexes: '索引',
    related: '相關索引',
    relatedMedia: '相關檔案',
    generated: '根據美國政府 UAP 公開資料生成的靜態 SEO 索引。',
    descriptionPrefix: '美國政府 UAP 公開檔案記錄',
    redactionNotice: '為保護目擊者身分、政府設施位置，或與不明異常現象（UAP）無關的軍事場所敏感資訊，本檔案已作塗黑處理。依據川普總統關於任何被報告為UAP或相關現象之事件性質或存在資訊之指令所發布的檔案，均未作任何塗黑處理。'
  },
  pt: {
    lang: 'pt',
    name: 'Português',
    home: 'Arquivo Público UAP',
    language: 'Idioma',
    archive: 'Arquivo',
    notice: 'Este site é um espelho público não oficial e índice de pesquisa. Textos e mídias oficiais vêm de divulgações públicas do governo dos EUA.',
    summary: 'Resumo estruturado',
    official: 'Descrição oficial',
    records: 'registros',
    agency: 'Agência',
    release: 'Lote',
    date: 'Data do incidente',
    location: 'Local do incidente',
    type: 'Tipo',
    source: 'Ver arquivo oficial dos EUA',
    downloadCurrent: 'Baixar este arquivo↓',
    backToList: 'Voltar à lista do arquivo',
    all: 'Todos os registros',
    byAgency: 'Registros por agência',
    byYear: 'Registros por ano',
    byLocation: 'Registros por local',
    byType: 'Registros por tipo',
    indexes: 'Índices',
    related: 'Índices relacionados',
    relatedMedia: 'Registros relacionados',
    generated: 'Índice SEO estático gerado a partir de dados oficiais de divulgações UAP do governo dos EUA.',
    descriptionPrefix: 'Registro do arquivo público UAP do governo dos EUA',
    redactionNotice: 'Redações foram feitas para proteger a identidade de testemunhas, a localização de instalações governamentais ou informações sensíveis sobre locais militares não relacionados a UAP. Nenhuma redação foi feita em arquivos divulgados sob a diretiva do Presidente Trump sobre informações relativas à natureza ou existência de encontros relatados como UAP ou fenômenos relacionados.'
  },
  ru: {
    lang: 'ru',
    name: 'Русский',
    home: 'Публичный архив UAP',
    language: 'Язык',
    archive: 'Архив',
    notice: 'Этот сайт является неофициальным публичным зеркалом и исследовательским индексом. Официальные тексты и медиа взяты из публичных релизов правительства США.',
    summary: 'Структурированное резюме',
    official: 'Официальное описание',
    records: 'записей',
    agency: 'Ведомство',
    release: 'Пакет',
    date: 'Дата события',
    location: 'Место события',
    type: 'Тип',
    source: 'Открыть официальный архив США',
    downloadCurrent: 'Скачать этот файл↓',
    backToList: 'Вернуться к списку архива',
    all: 'Все записи',
    byAgency: 'Записи по ведомствам',
    byYear: 'Записи по годам',
    byLocation: 'Записи по месту',
    byType: 'Записи по типу',
    indexes: 'Индексы',
    related: 'Связанные индексы',
    relatedMedia: 'Связанные записи',
    generated: 'Статический SEO-индекс, созданный по официальным данным релизов UAP правительства США.',
    descriptionPrefix: 'Запись публичного архива UAP правительства США',
    redactionNotice: 'Редактирование было выполнено для защиты личности очевидцев, местоположения государственных объектов или чувствительной информации о военных объектах, не связанных с UAP. В файлах, опубликованных в соответствии с директивой президента Трампа о сведениях, касающихся природы или существования встреч, заявленных как UAP или связанные явления, редактирование не выполнялось.'
  },
  fr: {
    lang: 'fr',
    name: 'Français',
    home: 'Archive publique UAP',
    language: 'Langue',
    archive: 'Archive',
    notice: 'Ce site est un miroir public non officiel et un index de recherche. Les textes et médias officiels proviennent de publications publiques du gouvernement des États-Unis.',
    summary: 'Résumé structuré',
    official: 'Description officielle',
    records: 'enregistrements',
    agency: 'Agence',
    release: 'Publication',
    date: "Date de l'incident",
    location: "Lieu de l'incident",
    type: 'Type',
    source: "Voir l'archive officielle des États-Unis",
    downloadCurrent: 'Télécharger ce fichier↓',
    backToList: "Retour à la liste d'archives",
    all: 'Tous les enregistrements',
    byAgency: 'Enregistrements par agence',
    byYear: 'Enregistrements par année',
    byLocation: 'Enregistrements par lieu',
    byType: 'Enregistrements par type',
    indexes: 'Index',
    related: 'Index connexes',
    relatedMedia: 'Enregistrements connexes',
    generated: 'Index SEO statique généré à partir des données officielles de publication UAP du gouvernement des États-Unis.',
    descriptionPrefix: "Enregistrement de l'archive publique UAP du gouvernement des États-Unis",
    redactionNotice: "Des occultations ont été effectuées pour protéger l'identité des témoins, l'emplacement des installations gouvernementales ou des informations sensibles sur des sites militaires sans rapport avec les UAP. Aucune occultation n'a été faite dans les fichiers publiés en vertu de la directive du président Trump concernant les informations relatives à la nature ou à l'existence de toute rencontre signalée comme UAP ou phénomène connexe."
  },
  de: {
    lang: 'de',
    name: 'Deutsch',
    home: 'Öffentliches UAP-Archiv',
    language: 'Sprache',
    archive: 'Archiv',
    notice: 'Diese Website ist ein inoffizieller öffentlicher Spiegel und Forschungsindex. Offizielle Texte und Medien stammen aus öffentlichen Veröffentlichungen der US-Regierung.',
    summary: 'Strukturierte Zusammenfassung',
    official: 'Offizielle Beschreibung',
    records: 'Einträge',
    agency: 'Behörde',
    release: 'Veröffentlichung',
    date: 'Ereignisdatum',
    location: 'Ereignisort',
    type: 'Typ',
    source: 'Offizielles US-Archiv ansehen',
    downloadCurrent: 'Diese Datei herunterladen↓',
    backToList: 'Zur Archivliste zurück',
    all: 'Alle Einträge',
    byAgency: 'Einträge nach Behörde',
    byYear: 'Einträge nach Jahr',
    byLocation: 'Einträge nach Ort',
    byType: 'Einträge nach Typ',
    indexes: 'Indexe',
    related: 'Verwandte Indexe',
    relatedMedia: 'Verwandte Einträge',
    generated: 'Statischer SEO-Index aus offiziellen UAP-Veröffentlichungsdaten der US-Regierung.',
    descriptionPrefix: 'Eintrag im öffentlichen UAP-Archiv der US-Regierung',
    redactionNotice: 'Schwärzungen wurden vorgenommen, um die Identität von Augenzeugen, den Standort von Regierungseinrichtungen oder potenziell sensible Informationen über nicht mit UAP verbundene Militärstandorte zu schützen. An Dateien, die gemäß der Anweisung von Präsident Trump zu Informationen über Art oder Existenz von als UAP oder verwandte Phänomene gemeldeten Begegnungen veröffentlicht wurden, wurden keine Schwärzungen vorgenommen.'
  },
  ko: {
    lang: 'ko',
    name: '한국어',
    home: 'UAP 공개 아카이브',
    language: '언어',
    archive: '아카이브',
    notice: '이 사이트는 비공식 공개 미러 및 연구 색인입니다. 공식 기록 텍스트와 미디어는 미국 정부의 공개 자료를 기반으로 합니다.',
    summary: '구조화 요약',
    official: '공식 설명',
    records: '개 기록',
    agency: '기관',
    release: '공개 배치',
    date: '사건 날짜',
    location: '사건 장소',
    type: '유형',
    source: '미국 공식 아카이브 보기',
    downloadCurrent: '이 파일 다운로드↓',
    backToList: '아카이브 목록으로 돌아가기',
    all: '전체 기록',
    byAgency: '기관별 기록',
    byYear: '연도별 기록',
    byLocation: '장소별 기록',
    byType: '유형별 기록',
    indexes: '색인',
    related: '관련 색인',
    relatedMedia: '관련 기록',
    generated: '미국 정부 UAP 공개 데이터로 생성한 정적 SEO 색인입니다.',
    descriptionPrefix: '미국 정부 UAP 공개 아카이브 기록',
    redactionNotice: '목격자의 신원, 정부 시설 위치 또는 UAP와 관련 없는 군사 시설에 대한 민감한 정보를 보호하기 위해 삭제 처리가 이루어졌습니다. UAP 또는 관련 현상으로 보고된 조우의 성격이나 존재에 관한 트럼프 대통령의 지시에 따라 공개된 파일에는 삭제 처리가 이루어지지 않았습니다.'
  },
  ar: {
    lang: 'ar',
    name: 'العربية',
    home: 'أرشيف UAP العام',
    language: 'اللغة',
    archive: 'الأرشيف',
    notice: 'هذا الموقع مرآة عامة غير رسمية وفهرس بحثي. النصوص والوسائط الرسمية مأخوذة من إصدارات عامة للحكومة الأمريكية.',
    summary: 'ملخص منظم',
    official: 'الوصف الرسمي',
    records: 'سجلات',
    agency: 'الجهة',
    release: 'دفعة الإصدار',
    date: 'تاريخ الحادثة',
    location: 'موقع الحادثة',
    type: 'النوع',
    source: 'عرض الأرشيف الرسمي الأمريكي',
    downloadCurrent: 'تنزيل هذا الملف↓',
    backToList: 'العودة إلى قائمة الأرشيف',
    all: 'جميع السجلات',
    byAgency: 'السجلات حسب الجهة',
    byYear: 'السجلات حسب السنة',
    byLocation: 'السجلات حسب الموقع',
    byType: 'السجلات حسب النوع',
    indexes: 'الفهارس',
    related: 'فهارس ذات صلة',
    relatedMedia: 'سجلات ذات صلة',
    generated: 'فهرس SEO ثابت تم إنشاؤه من بيانات إصدارات UAP الرسمية للحكومة الأمريكية.',
    descriptionPrefix: 'سجل من أرشيف UAP العام للحكومة الأمريكية',
    redactionNotice: 'تمت عمليات الحجب لحماية هوية شهود العيان وموقع المرافق الحكومية والمعلومات الحساسة المتعلقة بالمواقع العسكرية غير المرتبطة بـ UAP. لم تُجرَ أي عمليات حجب على الملفات الصادرة بموجب توجيه الرئيس ترامب بشأن المعلومات المتعلقة بطبيعة أو وجود لقاءات مُبلغ عنها كـ UAP أو ظواهر ذات صلة.'
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
  if (lang !== 'en') return doc.i18n?.[lang]?.titleZh || doc.id;
  return doc.id;
}

function langLocation(doc, lang) {
  if (lang === 'zh-Hans') return doc.i18n?.[lang]?.locZh || doc.incidentLocation || '未标示';
  if (lang === 'zh-Hant') return doc.i18n?.[lang]?.locZh || doc.incidentLocation || '未標示';
  if (lang !== 'en') return doc.i18n?.[lang]?.locZh || doc.incidentLocation || 'N/A';
  return doc.incidentLocation || 'N/A';
}

function langDescription(doc, lang) {
  if (lang !== 'en') return doc.i18n?.[lang]?.descZh || doc.description;
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
  if (lang === 'pt') return `Lote ${n}`;
  if (lang === 'ru') return `Пакет ${n}`;
  if (lang === 'fr') return `Publication ${n}`;
  if (lang === 'de') return `Veröffentlichung ${n}`;
  if (lang === 'ko') return `배치 ${n}`;
  if (lang === 'ar') return `الدفعة ${n}`;
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
  if (lang === 'zh-Hant') {
    return `${agency}在${release}公開的 ${type} 類型 UAP 相關檔案。事件日期：${date}；事件地點：${location}。本頁保留官方來源連結、翻譯說明與主要元資料。`;
  }
  return `${agency}在${release}公开的 ${type} 类型 UAP 相关档案。事件日期：${date}；事件地点：${location}。本页保留官方来源链接、翻译说明与主要元数据。`;
}

function seoRecordTitle(doc, lang, title) {
  const type = clean(doc.type) || 'PDF';
  if (lang === 'zh-Hans') return `${title} | ${type} UAP 档案`;
  if (lang === 'zh-Hant') return `${title} | ${type} UAP 檔案`;
  if (lang === 'ja') return `${title} | ${type} UAP記録`;
  if (lang === 'es') return `${title} | Registro UAP ${type}`;
  if (lang === 'pt') return `${title} | Registro UAP ${type}`;
  if (lang === 'fr') return `${title} | Archive UAP ${type}`;
  if (lang === 'de') return `${title} | UAP-Unterlage ${type}`;
  if (lang === 'ru') return `${title} | Материал UAP ${type}`;
  if (lang === 'ko') return `${title} | ${type} UAP 기록`;
  if (lang === 'ar') return `${title} | سجل UAP ${type}`;
  return `${title} | ${type} UAP record`;
}

function mediaDetailsText(doc, lang) {
  const s = seoText[lang] || seoText.en;
  const details = [
    s.mediaDetailsIntro,
    `${text[lang].agency}: ${agencyLabel(doc.agency, lang)}.`,
    `${text[lang].release}: ${releaseLabel(doc.release, lang)}.`,
    `${text[lang].date}: ${doc.incidentDate || 'N/A'}.`,
    `${text[lang].location}: ${langLocation(doc, lang)}.`,
    `${text[lang].type}: .${doc.type}.`
  ];
  return details.join(' ');
}

function rel(fromLang, target) {
  const fromDepth = fromLang.split('/').filter(Boolean).length;
  return '../'.repeat(fromDepth) + target;
}

function absoluteSitePath(pathName) {
  return `${siteUrl}${pathName}`;
}

function isoDate(value) {
  const raw = clean(value);
  if (!raw || /^N\/A$/i.test(raw)) return '';
  const yearOnly = raw.match(/^(19|20)\d{2}$/)?.[0];
  if (yearOnly) return yearOnly;
  const mdY = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (mdY) {
    const year = mdY[3].length === 2 ? `20${mdY[3]}` : mdY[3];
    return `${year}-${mdY[1].padStart(2, '0')}-${mdY[2].padStart(2, '0')}`;
  }
  const year = raw.match(/(19|20)\d{2}/)?.[0];
  return year || '';
}

function breadcrumbSchema(lang, items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteSitePath(item.path)
    }))
  };
}

function collectionSchema(lang, title, description, canonicalPath, docs = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    inLanguage: text[lang].lang,
    url: absoluteSitePath(canonicalPath),
    about: 'Unidentified Anomalous Phenomena',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: docs.length,
      itemListElement: docs.slice(0, 50).map((doc, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absoluteSitePath(`/${lang}/records/${doc.slug}/`),
        name: langTitle(doc, lang)
      }))
    }
  };
}

function mediaUrls(doc) {
  const image = urls(doc.imageUrl)[0] || '';
  const r2Image = image ? r2Asset(image) : '';
  const video = urls(doc.videoUrl || '')[0] || '';
  const download = currentRecordDownloadUrl(doc, {image, r2Image, localImage: image ? mirroredAsset(image) : '', video});
  return {image, r2Image, video, download};
}

function recordSchemas(doc, lang, title, description, canonicalPath) {
  const m = mediaUrls(doc);
  const base = {
    '@context': 'https://schema.org',
    '@type': 'DigitalDocument',
    name: title,
    description,
    inLanguage: text[lang].lang,
    url: absoluteSitePath(canonicalPath),
    isBasedOn: staticOfficialRecordPage(doc),
    datePublished: isoDate(doc.releaseDate) || doc.releaseDate,
    about: 'Unidentified Anomalous Phenomena',
    publisher: {'@type': 'Organization', name: agencyLabel(doc.agency, lang)}
  };
  const schemas = [base, breadcrumbSchema(lang, [
    {name: text[lang].home, path: `/${lang}/`},
    {name: text[lang].archive, path: `/${lang}/archive/`},
    {name: title, path: canonicalPath}
  ])];
  if (m.video) {
    const videoSchema = {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: title,
      description,
      inLanguage: text[lang].lang,
      uploadDate: isoDate(doc.releaseDate) || '2026-01-01',
      contentUrl: m.video,
      embedUrl: absoluteSitePath(canonicalPath),
      thumbnailUrl: m.r2Image || m.image || undefined,
      publisher: {'@type': 'Organization', name: agencyLabel(doc.agency, lang)}
    };
    schemas.push(Object.fromEntries(Object.entries(videoSchema).filter(([, value]) => value !== undefined && value !== '')));
  } else if (m.r2Image || m.image) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      name: title,
      description,
      inLanguage: text[lang].lang,
      contentUrl: m.r2Image || m.image,
      thumbnailUrl: m.r2Image || m.image,
      publisher: {'@type': 'Organization', name: agencyLabel(doc.agency, lang)}
    });
  }
  return schemas;
}

function homeSeoLinks(lang) {
  const alternates = generatedDirs.map(code => `<link rel="alternate" hreflang="${code}" href="${siteUrl}/${code}/">`).join('\n  ');
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: text[lang].home,
    description: (seoText[lang] || seoText.en).homeDescription,
    inLanguage: text[lang].lang,
    url: `${siteUrl}/${lang}/`
  };
  return `<link rel="canonical" href="${siteUrl}/${lang}/">
  ${alternates}
  <link rel="alternate" hreflang="x-default" href="${siteUrl}/en/">
  <script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

function footerHtml(prefix, lang) {
  const labels = Object.fromEntries(Object.entries(legalPages).map(([slug, pages]) => [slug, (pages[lang] || pages.en).title]));
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
    const page = pagesByLang[lang] || pagesByLang.en;
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
  const localPath = canonicalPath.replace(langPathPattern, '/');
  const schemas = schema ? (Array.isArray(schema) ? schema : [schema]) : [];
  const schemaHtml = schemas.map(item => `  <script type="application/ld+json">${JSON.stringify(item)}</script>\n`).join('');
  const langMenu = `<details class="lang-menu">
        <summary>${esc(text[lang].language || 'Language')}</summary>
        <div>
          ${generatedDirs.map(code => `<a data-dir="${esc(code)}" data-lang="${esc(langMenuCodes[code] || code)}" href="${prefix}${code}${localPath}">${esc(text[code].name)}</a>`).join('\n          ')}
        </div>
      </details>`;
  const alternates = generatedDirs.map(code => {
    const pathName = canonicalPath.replace(langPathPattern, `/${code}/`);
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
  <link rel="alternate" hreflang="x-default" href="${siteUrl}${canonicalPath.replace(langPathPattern, '/en/')}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600&family=Noto+Sans+TC:wght@400;500;600&family=Noto+Sans+JP:wght@400;500;600&family=Noto+Sans:wght@400;500;600&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${prefix}assets/style.css?v=${assetVersion}">
  ${analyticsScript}
  ${adsenseScript}
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
  <script src="${prefix}assets/release-04-r2-documents.js?v=${assetVersion}"></script>
  <script src="${prefix}assets/site.js?v=${assetVersion}"></script>
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

function releaseNumber(doc) {
  return clean(doc.release).match(/(\d{2})$/)?.[1] || '';
}

function releaseTopicMeta(lang, n, count) {
  const s = seoText[lang] || seoText.en;
  if (n === '04') {
    return {title: s.release04Title, intro: s.release04Intro, nav: s.browseRelease04};
  }
  const num = Number(n);
  const zhNum = {1: '一', 2: '二', 3: '三', 4: '四'}[num] || String(num);
  const title = {
    en: `Release ${n} UAP Records`,
    es: `Registros UAP de la publicación ${n}`,
    pt: `Registros UAP da publicação ${n}`,
    fr: `Archives UAP de la publication ${n}`,
    de: `UAP-Unterlagen Veröffentlichung ${n}`,
    ru: `Материалы UAP выпуска ${n}`,
    ar: `سجلات UAP الإصدار ${n}`,
    ja: `第${num}回公開UAP記録`,
    ko: `${num}차 공개 UAP 기록`,
    'zh-Hans': `第${zhNum}批 UAP 公开档案`,
    'zh-Hant': `第${zhNum}批 UAP 公開檔案`
  }[lang] || `Release ${n} UAP Records`;
  const intro = {
    en: `Browse all ${count} public UAP records from the Release ${n} official release, including videos, images, PDFs, incident metadata, and official source links.`,
    es: `Consulta los ${count} registros UAP públicos de la publicación oficial ${n}, con videos, imágenes, PDF, metadatos del incidente y enlaces a la fuente oficial.`,
    pt: `Explore os ${count} registros UAP públicos da publicação oficial ${n}, incluindo vídeos, imagens, PDFs, metadados do incidente e links oficiais.`,
    fr: `Parcourez les ${count} archives UAP publiques de la publication officielle ${n}, avec vidéos, images, PDF, métadonnées et liens officiels.`,
    de: `Durchsuchen Sie alle ${count} öffentlichen UAP-Unterlagen der offiziellen Veröffentlichung ${n} mit Videos, Bildern, PDFs, Metadaten und Quellenlinks.`,
    ru: `Просмотрите все ${count} публичных материалов UAP из официального выпуска ${n}: видео, изображения, PDF, метаданные и официальные ссылки.`,
    ar: `تصفح جميع سجلات UAP العامة البالغ عددها ${count} من الإصدار الرسمي ${n}، بما في ذلك الفيديو والصور وملفات PDF والبيانات وروابط المصدر الرسمي.`,
    ja: `第${num}回公式公開に含まれる${count}件のUAP記録を、動画、画像、PDF、事件メタデータ、公式リンクとともに閲覧できます。`,
    ko: `${num}차 공식 공개의 ${count}개 UAP 기록을 영상, 이미지, PDF, 사건 메타데이터, 공식 출처 링크와 함께 볼 수 있습니다.`,
    'zh-Hans': `浏览第${zhNum}批官方公开的 ${count} 条 UAP 档案，包括视频、图片、PDF、事件元数据和美国官方来源链接。`,
    'zh-Hant': `瀏覽第${zhNum}批官方公開的 ${count} 筆 UAP 檔案，包括影片、圖片、PDF、事件元資料和美國官方來源連結。`
  }[lang] || `Browse all ${count} public UAP records from the Release ${n} official release.`;
  const nav = {
    en: `Release ${n} records`,
    es: `Registros de publicación ${n}`,
    pt: `Registros da publicação ${n}`,
    fr: `Archives publication ${n}`,
    de: `Veröffentlichung ${n}`,
    ru: `Материалы выпуска ${n}`,
    ar: `سجلات الإصدار ${n}`,
    ja: `第${num}回公開記録`,
    ko: `${num}차 공개 기록`,
    'zh-Hans': `第${zhNum}批档案`,
    'zh-Hant': `第${zhNum}批檔案`
  }[lang] || `Release ${n} records`;
  return {title, intro, nav};
}

function topicConfigs(lang, allDocs = []) {
  const s = seoText[lang] || seoText.en;
  const releaseTopics = ['01', '02', '03', '04'].map(n => {
    const count = allDocs.filter(doc => releaseNumber(doc) === n).length;
    const meta = releaseTopicMeta(lang, n, count);
    return {key: `release-${n}`, path: `/${lang}/release/${n}/`, file: `${lang}/release/${n}/index.html`, depth: 3, title: meta.title, intro: meta.intro, nav: meta.nav, filter: doc => releaseNumber(doc) === n};
  });
  return [
    ...releaseTopics,
    {key: 'videos', path: `/${lang}/uap-videos/`, file: `${lang}/uap-videos/index.html`, depth: 2, title: s.videosTitle, intro: s.videosIntro, nav: s.browseVideos, filter: doc => /^(VID|AUD)$/i.test(doc.type)},
    {key: 'pdfs', path: `/${lang}/uap-pdf-records/`, file: `${lang}/uap-pdf-records/index.html`, depth: 2, title: s.pdfsTitle, intro: s.pdfsIntro, nav: s.browsePdfs, filter: doc => /^PDF$/i.test(doc.type)},
    {key: 'images', path: `/${lang}/uap-images/`, file: `${lang}/uap-images/index.html`, depth: 2, title: s.imagesTitle, intro: s.imagesIntro, nav: s.browseImages, filter: doc => /^IMG$/i.test(doc.type)}
  ];
}

function buildTopicPage(allDocs, lang, topic) {
  const docs = allDocs.filter(topic.filter);
  const recordPrefix = topic.depth === 3 ? '../../records/' : '../records/';
  const body = `<main class="static-main">
    <section class="static-hero">
      <p class="system-line"><span></span> UAP TOPIC INDEX</p>
      <h1>${esc(topic.title)}</h1>
      <p>${esc(topic.intro)}</p>
    </section>
    <section class="static-panel static-topic-nav">
      <h2>${esc(text[lang].related)}</h2>
      <div class="static-topic-links">
        ${topicConfigs(lang, allDocs).map(item => `<a href="${topic.depth === 3 ? '../../' : '../'}${item.path.replace(`/${lang}/`, '')}">${esc(item.nav)}</a>`).join('\n        ')}
      </div>
    </section>
    ${manualAdSlot(`${topic.key}-before-list`)}
    <section class="static-panel">
      <h2>${docs.length} ${esc(text[lang].records)}</h2>
      <div class="static-list">${cardList(docs, lang, recordPrefix)}</div>
    </section>
  </main>`;
  return pageShell({
    lang,
    title: `${topic.title} · ${text[lang].home}`,
    description: topic.intro,
    canonicalPath: topic.path,
    body,
    depth: topic.depth,
    schema: [
      collectionSchema(lang, topic.title, topic.intro, topic.path, docs),
      breadcrumbSchema(lang, [
        {name: text[lang].home, path: `/${lang}/`},
        {name: text[lang].archive, path: `/${lang}/archive/`},
        {name: topic.title, path: topic.path}
      ])
    ]
  });
}

function buildArchivePage(docs, lang, canonicalPath = `/${lang}/archive/`, depth = 2) {
  const l = text[lang];
  const topics = topicConfigs(lang, docs);
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
        ${topics.map(topic => `<a class="static-index-card" href="..${topic.path.replace(`/${lang}`, '')}"><b>${esc(topic.nav)}</b><span>${docs.filter(topic.filter).length} ${esc(l.records)}</span></a>`).join('\n        ')}
      </div>
    </section>
    ${manualAdSlot('archive-before-list')}
    <section class="static-panel">
      <h2>${esc(l.all)}</h2>
      <div class="static-list">${cardList(docs, lang, '../records/')}</div>
    </section>
  </main>`;
  return pageShell({
    lang,
    title: `${l.home} · ${l.archive}`,
    description: (seoText[lang] || seoText.en).homeDescription,
    canonicalPath,
    body,
    depth,
    schema: [
      collectionSchema(lang, `${l.home} · ${l.archive}`, (seoText[lang] || seoText.en).homeDescription, canonicalPath, docs),
      breadcrumbSchema(lang, [
        {name: l.home, path: `/${lang}/`},
        {name: l.archive, path: canonicalPath}
      ])
    ]
  });
}

function buildLegalPage(lang, slugName) {
  const page = legalPages[slugName][lang] || legalPages[slugName].en;
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
    .replace(/\s*<link rel="canonical" href="[^"]+">\s*/g, '\n')
    .replace(/\s*<link rel="alternate" hreflang="[^"]+" href="[^"]+">\s*/g, '\n')
    .replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, '\n')
    .replace(/\s*<script async src="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-2222469808721720"[\s\S]*?<\/script>\s*/g, '\n')
    .replace(/\s*<script async src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-ZND85JXQ6M"><\/script>\s*<script>[\s\S]*?gtag\('config', 'G-ZND85JXQ6M'\);[\s\S]*?<\/script>\s*/g, '\n')
    .replace(/<html[^>]*>/, `<html lang="${text[lang].lang}">`)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(text[lang].home)} · ${esc(text[lang].name)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc((seoText[lang] || seoText.en).homeDescription)}">`)
    .replace(/href="\.\/assets\//g, 'href="../assets/')
    .replace(/src="\.\/assets\//g, 'src="../assets/')
    .replace(/assets\/style\.css\?v=[^"]+/g, `assets/style.css?v=${assetVersion}`)
    .replace(/assets\/site\.js\?v=[^"]+/g, `assets/site.js?v=${assetVersion}`)
    .replace(/最近批次：2026\.06\.12/g, '最近批次：2026.07.10')
    .replace(/latest release: 2026\.06\.12/g, 'latest release: 2026.07.10')
    .replace(/最新公開: 2026\.06\.12/g, '最新公開: 2026.07.10')
    .replace(/última publicación: 2026\.06\.12/g, 'última publicación: 2026.07.10')
    .replace(/收录三个公开批次/g, '收录四个公开批次')
    .replace(/收錄三個公開批次/g, '收錄四個公開批次')
    .replace(/Includes three public releases/g, 'Includes four public releases')
    .replace(/3回分の公開資料を収録/g, '4回分の公開資料を収録')
    .replace(/Incluye tres publicaciones públicas/g, 'Incluye cuatro publicaciones públicas')
    .replace(/\s*<script src="\.\.\/assets\/release-04-r2-documents\.js\?v=[^"]+"><\/script>/g, '')
    .replace(/(\s*)<script src="\.\.\/assets\/site\.js/g, `$1<script src="../assets/release-04-r2-documents.js?v=${assetVersion}"></script>$1<script src="../assets/site.js`)
    .replace('</head>', `  ${analyticsScript}\n  ${adsenseScript}\n</head>`)
    .replace(/href="\.\/en\/"/g, 'href="../en/"')
    .replace(/href="\.\/ja\/"/g, 'href="../ja/"')
    .replace(/href="\.\/es\/"/g, 'href="../es/"')
    .replace('</head>', `  ${homeSeoLinks(lang)}\n</head>`)
    .replace(/href="\.\/"/g, 'href="../"')
    .replace(/<footer>[\s\S]*?<\/footer>/, footer);
}

function buildRecordPage(doc, lang, docs) {
  const l = text[lang];
  const title = langTitle(doc, lang);
  const description = metaDescription(doc, lang);
  const canonicalPath = `/${lang}/records/${doc.slug}/`;
  const officialDescription = doc.description || '';
  const languageDescription = langDescription(doc, lang);
  const descriptionBlocks = [
    lang !== 'en' && languageDescription
      ? `<h2>${esc(l.official)}</h2>${paragraphs(languageDescription, lang)}`
      : '',
    lang === 'en' && officialDescription ? `<h2>${esc(l.official)}</h2>${paragraphs(officialDescription, lang)}` : ''
  ].filter(Boolean).join('\n        ');
  const mediaPreview = staticMediaPreview(doc, lang, title, docs);
  const virinMeta = doc.virin ? `\n          <dt>VIRIN</dt><dd>${esc(doc.virin)}</dd>` : '';
  const backHref = `../../../${lang}/#archive`;
  const backHandler = "try{if(document.referrer&&new URL(document.referrer).origin===location.origin&&history.length>1){history.back();return false}}catch(e){}";
  const schema = recordSchemas(doc, lang, title, description, canonicalPath);
  const body = `<main class="static-main static-record">
    <section class="static-record-head">
      <a class="static-back-link" href="${esc(backHref)}" onclick="${backHandler}">← ${esc(l.backToList)}</a>
      <p class="system-line"><span></span> ASSET RECORD</p>
      <h1>${esc(title)}</h1>
      <p>${esc(description)}</p>
    </section>
    ${manualAdSlot('record-before-content')}
    <section class="static-record-grid">
      <article class="static-panel static-record-copy">
        <h2>${esc(l.summary)}</h2>
        <p>${esc(structuredSummary(doc, lang))}</p>
        ${descriptionBlocks}
        <h2>${esc((seoText[lang] || seoText.en).mediaDetails)}</h2>
        <p>${esc(mediaDetailsText(doc, lang))}</p>
        <dl class="static-meta">
          <dt>${esc(l.agency)}</dt><dd>${esc(agencyLabel(doc.agency, lang))}</dd>
          <dt>${esc(l.release)}</dt><dd>${esc(releaseLabel(doc.release, lang))}</dd>
          <dt>${esc(l.date)}</dt><dd>${esc(doc.incidentDate || 'N/A')}</dd>
          <dt>${esc(l.location)}</dt><dd>${esc(langLocation(doc, lang))}</dd>
          <dt>${esc(l.type)}</dt><dd>.${esc(doc.type)}</dd>${virinMeta}
        </dl>
      </article>
      <aside class="static-panel static-record-media">
        ${mediaPreview}
      </aside>
    </section>
  </main>`;
  return pageShell({lang, title: `${seoRecordTitle(doc, lang, title)} · ${l.home}`, description, canonicalPath, body, depth: 3, schema});
}

function staticOfficialRecordPage(doc) {
  const n = clean(doc.release).match(/(\d{2})$/)?.[1] || '04';
  const hash = clean(doc.id || '')
    .replace(/\s+/g, '-')
    .replace(/[^A-Za-z0-9\-_]/g, '')
    .replace(/-+/g, '-');
  return `https://www.war.gov/UFO/release/${n}/?releaseDate=Release+${n}#${hash}`;
}

function relatedRecords(doc, docs) {
  const explicitCodes = [
    ...urls(doc.videoPairing || ''),
    ...urls(doc.pdfPairing || '')
  ].map(assetCode).filter(Boolean);
  const seen = new Set();
  const out = [];
  const add = candidate => {
    if (!candidate || candidate === doc || seen.has(candidate.slug)) return;
    seen.add(candidate.slug);
    out.push(candidate);
  };

  for (const code of explicitCodes) {
    for (const candidate of docs) {
      const candidateCode = assetCode(candidate.id);
      if (candidateCode === code || candidateCode.endsWith(code) || code.endsWith(candidateCode)) add(candidate);
    }
  }

  return out.slice(0, 6);
}

function currentRecordDownloadUrl(doc, media) {
  const type = clean(doc.type).toUpperCase();
  if (type === 'VID' || type === 'AUD') return media.video || '';
  if (type === 'PDF') return doc.r2DocumentUrl || doc.documentUrl || '';
  if (type === 'IMG') return doc.r2DocumentUrl || media.r2Image || media.localImage || media.image || '';
  return doc.r2DocumentUrl || doc.documentUrl || media.video || media.r2Image || media.localImage || media.image || '';
}

function currentRecordDownloadName(doc, url) {
  const base = clean(doc.id).split(',')[0].replace(/[^A-Za-z0-9_-]/g, '-') || 'uap-record';
  const ext = clean(url).split('?')[0].match(/\.([a-z0-9]+)$/i)?.[1] || clean(doc.type).toLowerCase() || 'file';
  return `${base}.${ext.toLowerCase()}`;
}

function staticMediaPreview(doc, lang, title, docs) {
  const image = urls(doc.imageUrl)[0] || '';
  const r2Image = image ? r2Asset(image) : '';
  const localImage = image ? mirroredAsset(image) : '';
  const video = urls(doc.videoUrl || '')[0] || '';
  const blocked = {
    en: 'The official source blocks external previews. Open the official source or use the record download.',
    ja: '公式ソースが外部サイトでのプレビュー表示をブロックしています。公式ソースを開くか、この記録のファイルをダウンロードしてください。',
    es: 'La fuente oficial bloquea la vista previa externa. Abre la fuente oficial o descarga este registro.',
    'zh-Hans': '官方源站阻止外链预览。请打开官方来源或下载当前档案。',
    'zh-Hant': '官方來源網站阻止外連預覽。請開啟官方來源或下載目前檔案。'
  }[lang] || 'The official source blocks external previews. Open the official source or use the record download.';
  const fallback = `<div class="real-file media-fallback"><b>.${esc(doc.type)}</b><span>${esc(title)}</span><small>${esc(blocked)}</small></div>`;
  const officialUrl = staticOfficialRecordPage(doc);
  const downloadUrl = currentRecordDownloadUrl(doc, {image, r2Image, localImage, video});
  const downloadName = downloadUrl ? currentRecordDownloadName(doc, downloadUrl) : '';
  const downloadCurrent = downloadUrl ? `<a class="static-media-button" href="${esc(downloadUrl)}" data-download-url="${esc(downloadUrl)}" data-download-filename="${esc(downloadName)}" rel="noopener">${esc(text[lang].downloadCurrent)}</a>` : '';
  const openOfficial = `<a class="static-media-button" href="${esc(officialUrl)}" target="_blank" rel="noopener">${esc(text[lang].source)} ↗</a>`;
  const relatedLinks = relatedRecords(doc, docs)
    .map(related => `<a class="static-related-link" href="../${esc(related.slug)}/"><span>.${esc(related.type)}</span>${esc(langTitle(related, lang))}</a>`)
    .join('\n            ');
  const relatedBlock = relatedLinks ? `<div class="static-related-records">
            <b>${esc(text[lang].relatedMedia)}</b>
            ${relatedLinks}
          </div>` : '';
  let preview = '';
  if (video) {
    preview = `<video class="static-video-preview" controls playsinline${r2Image ? ` poster="${esc(r2Image)}"` : ''}><source src="${esc(video)}"></video>`;
  } else if (image) {
    const fallbackSrcs = [relativePath(localImage, 3), image].join('|');
    preview = `<img src="${esc(r2Image)}" data-fallback-srcs="${esc(fallbackSrcs)}" alt="${esc(doc.i18n?.[lang]?.altZh || title)}" onerror="const q=(this.dataset.fallbackSrcs||'').split('|').filter(Boolean);if(q.length){this.src=q.shift();this.dataset.fallbackSrcs=q.join('|')}else{this.parentNode.classList.add('broken')}">${fallback}`;
  } else {
    preview = `<div class="real-file"><b>.${esc(doc.type)}</b><span>${esc(title)}</span><small>${esc(blocked)}</small></div>`;
  }
  const actions = [downloadCurrent, openOfficial].filter(Boolean).join('\n          ');
  return `<div class="static-preview static-preview-${esc(doc.type.toLowerCase())}">
          ${preview}
        </div>
        <div class="static-media-actions">
          ${actions}
        </div>${relatedBlock ? `\n        ${relatedBlock}` : ''}`;
}

function normalizeDescriptionBreaks(value) {
  return clean(value)
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/(^|\n)(\d)\n+(\d{1,2}:\d{2}(?:-\d{1,2}:\d{2})?[:：])/g, '$1$2$3')
    .replace(/(\d{1,2}:\d{2})-\s*\n+\s*(\d{1,2}:\d{2})/g, '$1-$2')
    .replace(/\n{3,}/g, '\n\n');
}

function paragraphs(value, lang = 'en') {
  const parts = normalizeDescriptionBreaks(value).split(/\n{2,}/).map(clean).filter(Boolean);
  return parts.map(p => {
    const redaction = isRedactionParagraph(p);
    const rendered = redaction ? redactionTemplate(lang) : p;
    return `<p${redaction ? ' class="record-redaction-text"' : ''}>${descriptionHtml(rendered)}</p>`;
  }).join('');
}

function redactionTemplate(lang = 'en') {
  return (text[lang] && text[lang].redactionNotice) || text.en.redactionNotice;
}

function descriptionHtml(value) {
  return esc(value).replace(/\b\d{1,2}:\d{2}(?:-\d{1,2}:\d{2})?[:：]?/g, match => `<span class="record-timecode">${match}</span>`);
}

function isRedactionParagraph(value) {
  const text = clean(value).toLowerCase();
  return text.startsWith('redactions have been made') ||
    text.startsWith('為了保護') ||
    text.startsWith('为了保护') ||
    text.startsWith('為保護') ||
    text.startsWith('为保护') ||
    text.startsWith('se han realizado censuras') ||
    text.startsWith('se han hecho redacciones') ||
    text.includes('黒塗り処理') ||
    text.includes('編集が行われ');
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
    ${manualAdSlot(`${kind}-index-bottom`)}
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
    ${manualAdSlot(`${kind}-group-bottom`)}
  </main>`;
  return pageShell({lang, title: `${label} · ${l.home}`, description: `${label}: ${docs.length} ${l.records}. ${l.generated}`, canonicalPath: `/${lang}/${kind}/${groupSlug}/`, body, depth: 3});
}

function build() {
  const interactiveTemplate = read('zh-Hant/index.html');
  const csv = parseCSV(read('assets/uap-data.csv'));
  const translationFiles = {
    'zh-Hans': 'assets/i18n-zh-cn.json',
    'zh-Hant': 'assets/i18n-zh-tw.json',
    ja: 'assets/i18n-ja.json',
    es: 'assets/i18n-es.json',
    pt: 'assets/i18n-pt.json',
    ru: 'assets/i18n-ru.json',
    fr: 'assets/i18n-fr.json',
    de: 'assets/i18n-de.json',
    ko: 'assets/i18n-ko.json',
    ar: 'assets/i18n-ar.json'
  };
  const translations = Object.fromEntries(Object.entries(translationFiles).map(([lang, file]) => [
    lang,
    fs.existsSync(path.join(root, file)) ? JSON.parse(read(file)) : []
  ]));
  const docs = csv.map((row, index) => normalize(row, index, translations)).filter(doc => doc.id);
  const urlsForSitemap = [];

  for (const dir of generatedDirs) fs.rmSync(path.join(root, dir), {recursive: true, force: true});

  for (const lang of generatedDirs) {
    writeFile(`${lang}/index.html`, buildInteractiveHome(lang, interactiveTemplate));
    urlsForSitemap.push(`/${lang}/`);
    for (const slugName of Object.keys(legalPages)) {
      writeFile(`${lang}/${slugName}/index.html`, buildLegalPage(lang, slugName));
      urlsForSitemap.push(`/${lang}/${slugName}/`);
    }
    writeFile(`${lang}/archive/index.html`, buildArchivePage(docs, lang));
    urlsForSitemap.push(`/${lang}/archive/`);
    for (const topic of topicConfigs(lang, docs)) {
      writeFile(topic.file, buildTopicPage(docs, lang, topic));
      urlsForSitemap.push(topic.path);
    }
    for (const doc of docs) {
      writeFile(`${lang}/records/${doc.slug}/index.html`, buildRecordPage(doc, lang, docs));
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

  const sitemapLastmod = process.env.SITEMAP_LASTMOD || '2026-07-18';
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${['/', ...urlsForSitemap].map(u => `  <url><loc>${siteUrl}${u}</loc><lastmod>${sitemapLastmod}</lastmod></url>`).join('\n')}\n</urlset>\n`;
  writeFile('sitemap.xml', sitemap);
  writeFile('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`);
  console.log(`Generated ${docs.length} records across ${generatedDirs.length} languages.`);
}

build();
