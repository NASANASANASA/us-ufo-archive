# Release 06 / 07 逐档案核对报告

核对日期：2026-11-17。范围：新增 103 条档案，11 种语言，共 1,133 个详情页。

## 结果

- 103 条英文标题、说明、日期、机构、地点、配对字段及来源地址与重新下载的官方 CSV 一致。仅统一空白及 CSV 中的换行表示。
- 在 Chrome 中逐一搜索并点击全部 103 条英文一览链接，核对详情标题及返回一览行为，全部通过；其余语言的详情路径、标题、原文／译文呈现、媒体绑定、内部链接和站点地图另行全量检查。
- 修复后 103 张本地图片在浏览器中全部载入成功。其中 86 张逐字节匹配官方 CSV 对应缩略图，16 张逐字节匹配对应 DVIDS 官方预览图。
- DOW-UAP-D148 的官方缩略图本次未能载入，使用同一官方 PDF 的首页，已验证生成来源，并在全部语言页面注明。该项属于明确标注的替代预览，不宣称与官网缩略图相同。
- 87 份 PDF 均与官方文件包中的文件名一一匹配；两个官方 PDF 包均通过 CRC 校验，逐文件记录了 SHA-256 与页数。
- 16 个官方影音文件全部完整解码通过。在线 DVIDS 版均返回 HTTP 206、支持分段读取；与官方 ZIP 版逐流 SHA-256、编码参数及时间参数一致。在线文件比 ZIP 版多出的少量容器数据不影响音视频内容。
- 多语言检查覆盖档案编号、配对编号、全部视频时码、正文完整呈现及关键术语。中文进行了原文语义复核；其余语言重点修正检测到的关键技术术语、单位、时码和漏译。该结果不等同于十种语言逐句专业审校。

## 本次修复

1. 将 PDF 首页替代图改为 86 张官网实际选用的原图；为全部图片保存来源与 SHA-256，并使用内容校验值刷新图片缓存。
2. 对确实无法取得官方缩略图的 D148 保留原 PDF 首页，增加替代预览说明；生成脚本会保留已核验的官方图片，避免再次覆盖。
3. 修正“非中子聚变”漏译否定成分、“天文现象”误译为“天文数字”、雷达回波、报告者、未来评估时间范围等术语；修复日文速度单位及韩文、阿拉伯文相关技术术语。
4. 恢复葡萄牙文、法文被改成钟点格式的时码，包括一处被误写成 13h 的 1:00；补回两条法文遗漏的“无声、红蓝绿闪光”描述。
5. 将弹窗遮蔽提示同步为官网当前措辞，并统一详情页、数据及翻译文件缓存版本。

逐语言修订索引见 [translation-corrections.json](release-06-07-translation-corrections.json)。

## 官方源数据自身的差异

- D148：本次无法载入官方缩略图。原 PDF 的标签结构树也触发了 PyMuPDF 解析提示，但文件校验、页面读取和首页预览生成均通过；未修改官方 PDF。
- PR133：标题和事件年份为 2025，说明首段写 2024。本站保留官方原文。
- D174：标题为犹他州牧场调查，官方事件地点字段为 Las Vegas, Nevada。本站保留官方字段。
- PR133 说明还含有 “does indicate a physical change” 和 “requires the area of contrast” 等原文表述；未以推测替官方改写。

## 逐条结果

“原图一致”指与官方图片逐字节一致；“原文一致”指英文元数据与官方 CSV 一致；详情链接列对应已实际点击核对的一览入口。

| 档案 | 批次 | 类型 | 图片 | 原文 | 详情链接 | 原始媒体 |
| --- | --- | --- | --- | --- | --- | --- |
| DOW-UAP-D155 | 07 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d155-air-intelligence-information-report-saudi-arabia-1957/index.html) | PDF 5 页，文件匹配 |
| DOW-UAP-D174 | 07 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d174-utah-ranch-investigation-report-april-2010/index.html) | PDF 60 页，文件匹配 |
| DOW-UAP-D176 | 07 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d176-triangular-uap-aaro-memorandum-for-record-2026/index.html) | PDF 3 页，文件匹配 |
| DOW-UAP-D177 | 07 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d177-unresolved-uap-report-catalina-island-1955/index.html) | PDF 4 页，文件匹配 |
| DOW-UAP-D178 | 07 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d178-unresolved-uap-report-catalina-island-1953/index.html) | PDF 5 页，文件匹配 |
| DOW-UAP-D179 | 07 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d179-air-intelligence-information-report-catalina-island-1952/index.html) | PDF 2 页，文件匹配 |
| DOW-UAP-D181 | 07 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d181-unresolved-uap-report-catalina-island-1949/index.html) | PDF 3 页，文件匹配 |
| FBI-UAP-D043 | 07 | PDF | 官网原图一致 | 一致 | [通过](../en/records/fbi-uap-d043-fd-302-unidentified-aerial-object-observation-report-2026/index.html) | PDF 11 页，文件匹配 |
| DOW-UAP-D102 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d102-project-blue-book-file-on-tremonton-film-utah-1952/index.html) | PDF 156 页，文件匹配 |
| DOW-UAP-D103 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d103-project-blue-book-photo-file-relating-to-tremonton-film-utah-1952/index.html) | PDF 5 页，文件匹配 |
| DOW-UAP-D104 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d104-final-personnel-record-for-newhouse-delbert-c-u-s-navy-1957/index.html) | PDF 585 页，文件匹配 |
| DOW-UAP-D105 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d105-u-s-air-force-flying-discs-file-1952/index.html) | PDF 253 页，文件匹配 |
| DOW-UAP-D106 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d106-mission-report-iraq-2022/index.html) | PDF 6 页，文件匹配 |
| DOW-UAP-D107 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d107-mission-report-middle-east-2025/index.html) | PDF 8 页，文件匹配 |
| DOW-UAP-D108 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d108-mission-report-middle-east-2025/index.html) | PDF 8 页，文件匹配 |
| DOW-UAP-D109 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d109-mission-report-middle-east-2022/index.html) | PDF 6 页，文件匹配 |
| DOW-UAP-D110 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d110-aawsap-statement-of-objectives-july-2008/index.html) | PDF 4 页，文件匹配 |
| DOW-UAP-D111 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d111-aawsap-solicitation-and-original-order-september-2008/index.html) | PDF 59 页，文件匹配 |
| DOW-UAP-D112 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d112-aawsap-contract-modification-p00001-september-2009/index.html) | PDF 4 页，文件匹配 |
| DOW-UAP-D113 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d113-aawsap-contract-modification-p00002-february-2010/index.html) | PDF 5 页，文件匹配 |
| DOW-UAP-D114 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d114-aawsap-contract-modification-p00003-may-2010/index.html) | PDF 3 页，文件匹配 |
| DOW-UAP-D115 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d115-aawsap-contract-modification-p00004-may-2010/index.html) | PDF 1 页，文件匹配 |
| DOW-UAP-D116 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d116-aawsap-contract-modification-p00005-september-2010/index.html) | PDF 5 页，文件匹配 |
| DOW-UAP-D117 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d117-aawsap-dird-metallic-glasses-for-aerospace-applications-december-2009/index.html) | PDF 30 页，文件匹配 |
| DOW-UAP-D118 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d118-aawsap-dird-aerospace-applications-of-programmable-matter-december-2009/index.html) | PDF 20 页，文件匹配 |
| DOW-UAP-D119 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d119-aawsap-dird-biomaterials-january-2010/index.html) | PDF 32 页，文件匹配 |
| DOW-UAP-D120 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d120-aawsap-dird-materials-for-advanced-aerospace-platforms-january-2010/index.html) | PDF 27 页，文件匹配 |
| DOW-UAP-D121 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d121-aawsap-dird-pulsed-high-power-microwave-source-technology-january-2010/index.html) | PDF 37 页，文件匹配 |
| DOW-UAP-D122 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d122-aawsap-dird-invisibility-cloaking-theory-and-experiments-march-2010/index.html) | PDF 29 页，文件匹配 |
| DOW-UAP-D123 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d123-aawsap-dird-positron-aerospace-propulsion-march-2010/index.html) | PDF 35 页，文件匹配 |
| DOW-UAP-D124 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d124-aawsap-dird-space-access-where-we-ve-been-and-where-we-could-go-march-2010/index.html) | PDF 56 页，文件匹配 |
| DOW-UAP-D125 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d125-aawsap-dird-inertial-electrostatic-confinement-fusion-march-2010/index.html) | PDF 72 页，文件匹配 |
| DOW-UAP-D126 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d126-aawsap-dird-advanced-nuclear-propulsion-for-manned-deep-space-missions-march-2010/index.html) | PDF 37 页，文件匹配 |
| DOW-UAP-D127 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d127-aawsap-dird-an-introduction-to-the-statistical-drake-equation-march-2010/index.html) | PDF 55 页，文件匹配 |
| DOW-UAP-D128 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d128-aawsap-dird-anomalous-acute-and-subacute-field-effects-on-human-biological-tissues-march-2010/index.html) | PDF 38 页，文件匹配 |
| DOW-UAP-D129 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d129-aawsap-dird-metallic-spintronics-march-2010/index.html) | PDF 27 页，文件匹配 |
| DOW-UAP-D130 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d130-aawsap-dird-technological-approaches-to-controlling-external-devices-march-2010/index.html) | PDF 36 页，文件匹配 |
| DOW-UAP-D131 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d131-aawsap-dird-the-role-of-superconductors-in-gravity-research-march-2010/index.html) | PDF 16 页，文件匹配 |
| DOW-UAP-D132 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d132-aawsap-dird-advanced-space-propulsion-based-on-vacuum-spacetime-metric-engineering-march-2010/index.html) | PDF 17 页，文件匹配 |
| DOW-UAP-D133 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d133-aawsap-dird-the-space-communication-implications-of-quantum-entanglement-and-nonlocality-march-2010/index.html) | PDF 32 页，文件匹配 |
| DOW-UAP-D134 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d134-aawsap-dird-maverick-inventor-versus-corporate-inventor-where-will-the-next-major-innovations-arise-march-2010/index.html) | PDF 19 页，文件匹配 |
| DOW-UAP-D135 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d135-aawsap-dird-antigravity-for-aerospace-applications-march-2010/index.html) | PDF 44 页，文件匹配 |
| DOW-UAP-D136 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d136-aawsap-dird-biosensors-and-biomems-a-survey-of-the-present-field-march-2010/index.html) | PDF 45 页，文件匹配 |
| DOW-UAP-D137 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d137-aawsap-dird-state-of-the-art-and-evolution-of-high-energy-lasers-march-2010/index.html) | PDF 31 页，文件匹配 |
| DOW-UAP-D138 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d138-aawsap-dird-warp-drive-dark-energy-and-the-manipulation-of-extra-dimensions-april-2010/index.html) | PDF 33 页，文件匹配 |
| DOW-UAP-D139 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d139-aawsap-dird-traversable-wormholes-stargates-and-negative-energy-april-2010/index.html) | PDF 42 页，文件匹配 |
| DOW-UAP-D140 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d140-aawsap-dird-high-frequency-gravitational-wave-communications-april-2010/index.html) | PDF 57 页，文件匹配 |
| DOW-UAP-D141 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d141-aawsap-dird-metamaterials-for-aerospace-applications-april-2010/index.html) | PDF 38 页，文件匹配 |
| DOW-UAP-D142 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d142-aawsap-dird-concepts-for-extracting-energy-from-the-quantum-vacuum-april-2010/index.html) | PDF 57 页，文件匹配 |
| DOW-UAP-D143 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d143-aawsap-dird-laser-lightcraft-nanosatellites-november-2010/index.html) | PDF 77 页，文件匹配 |
| DOW-UAP-D144 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d144-aawsap-dird-cockpits-in-the-era-of-breakthrough-flight-november-2010/index.html) | PDF 57 页，文件匹配 |
| DOW-UAP-D145 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d145-aawsap-dird-aneutronic-fusion-propulsion-i-november-2010/index.html) | PDF 50 页，文件匹配 |
| DOW-UAP-D146 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d146-aawsap-dird-aneutronic-fusion-propulsion-ii-november-2010/index.html) | PDF 36 页，文件匹配 |
| DOW-UAP-D147 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d147-aawsap-dird-ultracapacitors-as-energy-and-power-storage-devices-november-2010/index.html) | PDF 34 页，文件匹配 |
| DOW-UAP-D148 | 06 | PDF | 原 PDF 首页（已标注） | 一致 | [通过](../en/records/dow-uap-d148-aawsap-dird-detection-and-high-resolution-tracking-of-vehicles-at-hypersonic-velocities-november-2010/index.html) | PDF 46 页，文件匹配 |
| DOW-UAP-D149 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d149-aawsap-dird-mhd-air-breathing-propulsion-and-power-for-aerospace-applications-november-2010/index.html) | PDF 32 页，文件匹配 |
| DOW-UAP-D150 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d150-aawsap-dird-quantum-computing-and-utilizing-organic-molecules-in-automation-technology-december-2010/index.html) | PDF 54 页，文件匹配 |
| DOW-UAP-D151 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d151-aawsap-dird-cognitive-limits-on-simultaneous-control-of-multiple-unmanned-spacecraft-december-2010/index.html) | PDF 31 页，文件匹配 |
| DOW-UAP-D152 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d152-aawsap-dird-negative-mass-propulsion-january-2011/index.html) | PDF 43 页，文件匹配 |
| DOW-UAP-D153 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d153-aawsap-dird-quantum-tomography-of-negative-energy-states-in-the-vacuum-january-2011/index.html) | PDF 51 页，文件匹配 |
| DOW-UAP-D154 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d154-transcript-of-a-presentation-by-captain-edward-j-ruppelt-1952/index.html) | PDF 19 页，文件匹配 |
| DOW-UAP-D156 | 07 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d156-air-intelligence-information-report-guam-1956/index.html) | PDF 5 页，文件匹配 |
| DOW-UAP-D157 | 07 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d157-air-intelligence-information-report-italy-1952/index.html) | PDF 5 页，文件匹配 |
| DOW-UAP-D158 | 07 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d158-flying-object-report-canada-1953/index.html) | PDF 4 页，文件匹配 |
| DOW-UAP-D159 | 07 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d159-air-intelligence-information-report-germany-1953/index.html) | PDF 2 页，文件匹配 |
| DOW-UAP-D160 | 07 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d160-air-intelligence-information-report-morocco-1953/index.html) | PDF 3 页，文件匹配 |
| DOW-UAP-D161 | 07 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d161-air-intelligence-information-report-alaska-1953/index.html) | PDF 4 页，文件匹配 |
| DOW-UAP-D162 | 07 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d162-air-intelligence-information-report-alaska-1953/index.html) | PDF 4 页，文件匹配 |
| DOW-UAP-D163 | 07 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d163-air-intelligence-information-report-sweden-1953/index.html) | PDF 3 页，文件匹配 |
| DOW-UAP-D164 | 07 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d164-flying-object-report-indiana-1953/index.html) | PDF 6 页，文件匹配 |
| DOW-UAP-D166 | 07 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d166-mufon-reports-prepared-for-baass-november-2008/index.html) | PDF 26 页，文件匹配 |
| DOW-UAP-D167 | 07 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d167-project-capella-december-2008/index.html) | PDF 42 页，文件匹配 |
| DOW-UAP-D168 | 07 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d168-baass-project-management-plan-december-2008/index.html) | PDF 49 页，文件匹配 |
| DOW-UAP-D169 | 07 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d169-baass-monthly-report-march-2009/index.html) | PDF 42 页，文件匹配 |
| DOW-UAP-D170 | 07 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d170-baass-monthly-report-april-2009/index.html) | PDF 50 页，文件匹配 |
| DOW-UAP-D171 | 07 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d171-baass-monthly-report-june-2009/index.html) | PDF 134 页，文件匹配 |
| DOW-UAP-D173 | 07 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d173-baass-monthly-report-november-2009/index.html) | PDF 155 页，文件匹配 |
| DOW-UAP-D175 | 07 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d175-baass-self-assessment-of-uap-analysis-capabilities-november-2010/index.html) | PDF 141 页，文件匹配 |
| DOW-UAP-D180 | 07 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-d180-final-personnel-record-for-mccoy-howard-m-u-s-air-force-1954/index.html) | PDF 298 页，文件匹配 |
| DOW-UAP-PR130 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-pr130-unresolved-uap-report-iraq-2022/index.html) | PDF 1 页，文件匹配 |
| DOW-UAP-PR131 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/dow-uap-pr131-unresolved-uap-report-iraq-2022/index.html) | PDF 1 页，文件匹配 |
| DOW-UAP-PR133 | 06 | VID | DVIDS 原图一致 | 一致 | [通过](../en/records/dow-uap-pr133-unresolved-uap-report-middle-east-2025/index.html) | 流一致；解码通过 |
| DOW-UAP-PR135 | 06 | VID | DVIDS 原图一致 | 一致 | [通过](../en/records/dow-uap-pr135-unresolved-uap-report-middle-east-2025/index.html) | 流一致；解码通过 |
| DOW-UAP-PR140 | 06 | VID | DVIDS 原图一致 | 一致 | [通过](../en/records/dow-uap-pr140-unresolved-uap-report-middle-east-2022/index.html) | 流一致；解码通过 |
| DOW-UAP-PR141 | 06 | VID | DVIDS 原图一致 | 一致 | [通过](../en/records/dow-uap-pr141-unresolved-uap-report-middle-east-2022/index.html) | 流一致；解码通过 |
| DOW-UAP-PR143 | 06 | VID | DVIDS 原图一致 | 一致 | [通过](../en/records/dow-uap-pr143-unresolved-uap-report-yellow-sea-2023/index.html) | 流一致；解码通过 |
| DOW-UAP-PR144 | 06 | VID | DVIDS 原图一致 | 一致 | [通过](../en/records/dow-uap-pr144-unresolved-uap-report-yellow-sea-2023/index.html) | 流一致；解码通过 |
| DOW-UAP-PR148 | 06 | VID | DVIDS 原图一致 | 一致 | [通过](../en/records/dow-uap-pr148-unresolved-uap-report-east-china-sea-2023/index.html) | 流一致；解码通过 |
| DOW-UAP-PR150 | 06 | VID | DVIDS 原图一致 | 一致 | [通过](../en/records/dow-uap-pr150-unresolved-uap-report-yellow-sea-2023/index.html) | 流一致；解码通过 |
| DOW-UAP-PR151 | 06 | VID | DVIDS 原图一致 | 一致 | [通过](../en/records/dow-uap-pr151-unresolved-uap-report-yellow-sea-2023/index.html) | 流一致；解码通过 |
| DOW-UAP-PR152 | 06 | VID | DVIDS 原图一致 | 一致 | [通过](../en/records/dow-uap-pr152-unresolved-uap-report-yellow-sea-2023/index.html) | 流一致；解码通过 |
| DOW-UAP-PR159 | 06 | VID | DVIDS 原图一致 | 一致 | [通过](../en/records/dow-uap-pr159-historical-film-of-reported-ufos-utah-1952/index.html) | 流一致；解码通过 |
| DOW-UAP-PR160 | 06 | AUD | DVIDS 原图一致 | 一致 | [通过](../en/records/dow-uap-pr160-presentation-by-captain-edward-j-ruppelt-1952/index.html) | 流一致；解码通过 |
| EOP-UAP-D002 | 07 | PDF | 官网原图一致 | 一致 | [通过](../en/records/eop-uap-d002-memorandum-on-interagency-coordination-for-the-recovery-of-foreign-materiel-may-1963/index.html) | PDF 1 页，文件匹配 |
| LLE-UAP-D001 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/lle-uap-d001-transcript-of-an-unresolved-uap-report-colorado-october-2023/index.html) | PDF 1 页，文件匹配 |
| LLE-UAP-D002 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/lle-uap-d002-transcript-of-an-unresolved-uap-report-colorado-october-2023/index.html) | PDF 2 页，文件匹配 |
| LLE-UAP-D003 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/lle-uap-d003-transcript-of-an-unresolved-uap-report-colorado-october-2023/index.html) | PDF 1 页，文件匹配 |
| LLE-UAP-D004 | 06 | PDF | 官网原图一致 | 一致 | [通过](../en/records/lle-uap-d004-transcript-of-an-unresolved-uap-report-colorado-january-2024/index.html) | PDF 1 页，文件匹配 |
| LLE-UAP-PR001 | 06 | VID | DVIDS 原图一致 | 一致 | [通过](../en/records/lle-uap-pr001-unresolved-uap-report-colorado-2023/index.html) | 流一致；解码通过 |
| LLE-UAP-PR002 | 06 | VID | DVIDS 原图一致 | 一致 | [通过](../en/records/lle-uap-pr002-unresolved-uap-report-colorado-october-2023/index.html) | 流一致；解码通过 |
| LLE-UAP-PR003 | 06 | VID | DVIDS 原图一致 | 一致 | [通过](../en/records/lle-uap-pr003-unresolved-uap-report-colorado-october-2023/index.html) | 流一致；解码通过 |
| LLE-UAP-PR004 | 06 | VID | DVIDS 原图一致 | 一致 | [通过](../en/records/lle-uap-pr004-unresolved-uap-report-colorado-january-2024/index.html) | 流一致；解码通过 |
| USG-UAP-D002 | 07 | PDF | 官网原图一致 | 一致 | [通过](../en/records/usg-uap-d002-interagency-correspondence-concerning-space-fragments-1962-1964/index.html) | PDF 72 页，文件匹配 |

## 可追溯记录

- [逐档案数据与文件校验结果](release-06-07-record-audit.json)
- [103 次浏览器一览到详情核对记录](release-06-07-browser-audit.json)
- [16 个影音文件的解码、分段请求及逐流校验](release-06-video-audit.json)
- [图片来源与 SHA-256](../assets/release-06-07-media.json)

官方 CSV SHA-256：`92b3ec7dd87286ea7092a33b476566b4416d3bb02970b02757b237d8322fe81a`。

本文记录发布前完成的检查与修复结果。
