(function () {
    var STORAGE_KEY = 'stCookieConsent';
    if (localStorage.getItem(STORAGE_KEY)) return;
    var banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.innerHTML =
          '<div class="cookie-banner-inner">' +
            '<p>Tento web nepouziva zadne sledovaci ani analyticke cookies. Ukladame si pouze technicky nezbytnou volbu, abychom Vam tuto listu nezobrazovali opakovane. <a href="gdpr.html">Vice informaci</a>.</p>' +
            '<button type="button" id="cookie-accept">Rozumim</button>' +
          '</div>';
    document.body.appendChild(banner);
    document.getElementById('cookie-accept').addEventListener('click', function () {
          try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
          banner.remove();
    });
})();
