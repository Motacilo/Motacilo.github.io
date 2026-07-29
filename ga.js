/**
 * Google Analytics 4 (GA4)
 * Measurement ID: G-WLVSDJQYXS
 */
(function () {
  const GA_ID = 'G-WLVSDJQYXS';

  // ローカル file:// では読み込まない
  if (window.location.protocol === 'file:') return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', GA_ID, { anonymize_ip: true });
})();
