# Google indexing repairs — 2026-11-20

Search Console baseline observed on November 19: the November 16 page report showed 1,050 indexed and 3,595 excluded URLs (2,959 discovered, 289 crawled, 343 not found, three redirects, one alternate canonical). The existing sitemap had last been read November 16 and reported 4,192 discovered URLs. These are delayed Google reports, not live counts.

The exported list of all 343 reported 404 URLs is preserved in `search-console-404-2026-11-19.json`. All now have exact historical-route mappings. A total of 1,430 historical URLs redirect to the corresponding language homepage and archive filters. GitHub Pages serves these as HTTP 200 with an immediate meta refresh; these are not HTTP 301 responses. They are excluded from the canonical sitemap. The interactive archive supports the old exact-year filters as well as its existing decade filters.

All 134 video records in eleven languages (1,474 pages) now present a single primary player before the description and advertising. VideoObject data includes an official thumbnail and a timezone-qualified publication timestamp; audio and document records are not described as videos. The three reported missing-thumbnail examples all concern FBI-UAP-PR003. Its official DVIDS poster is now present. Publication times preserve the minute precision shown by DVIDS; the America/New_York convention was checked against five official RSS timestamps. Event dates and source CSV/translations are unchanged.

The canonical sitemap contains 5,325 URLs. The new `video-sitemap.xml` contains 1,474 watch pages, and robots.txt advertises both sitemaps. Submission does not guarantee indexing or immediate report updates. The 319-page watch-page report also contains document/audio pages, so its entire issue group should not be marked fixed indiscriminately.

Validation passed: all 343 reported routes, all 1,430 redirect targets, all 5,258 detail-page schemas, all 1,474 video sitemap entries, archive filters, release 6/7 checks, localized official dates, timeline formatting, internal links, bundle naming, and whitespace checks. Chrome visual checks covered a restored exact-year filter and the primary FBI-UAP-PR003 player.

References: [Google redirects](https://developers.google.com/search/docs/crawling-indexing/301-redirects), [video structured data](https://developers.google.com/search/docs/appearance/structured-data/video), [video indexing guidance](https://developers.google.com/search/docs/appearance/video).
