/* Load production advertising and analytics only on the public site. */
(function () {
  const production = location.protocol === 'https:' &&
    ['uap-archives.org', 'www.uap-archives.org'].includes(location.hostname.toLowerCase());
  if (!production) {
    const style = document.createElement('style');
    style.textContent = '.uap-ad-slot{display:none!important}';
    document.head.appendChild(style);
    return;
  }
  function load(src, anonymous) {
    const script = document.createElement('script');
    script.async = true;
    script.src = src;
    if (anonymous) script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
  }
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', 'G-ZND85JXQ6M');
  load('https://www.googletagmanager.com/gtag/js?id=G-ZND85JXQ6M');
  load('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2222469808721720', true);
})();
