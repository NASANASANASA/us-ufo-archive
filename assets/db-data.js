/* 从美国政府 PURSUE 官方 CSV 提取的本地镜像，避免官网 CDN 拒绝跨域请求。 */
const UAP_ASSET_BASE = new URL('.', document.currentScript.src).href;
const UAP_LOCAL_CSV = `${UAP_ASSET_BASE}uap-data.csv`;
const UAP_MEDIA_BASE = "https://media.uap-archives.org/";
const UAP_OFFICIAL_CSV = "https://www.war.gov/Portals/1/Interactive/2026/UFO/uap-data.csv?release=4";
const UAP_SOURCE_URL = "https://www.war.gov/UFO/";
const DVIDS_API_KEY = "key-68bb60d16b35e";
let UAP_DOCS = [];
