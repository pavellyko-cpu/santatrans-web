function switchLang(lang) {
  if (lang === 'cs') {
    // Zpět na originál
    window.location.href = window.location.href
      .replace(/^https:\/\/translate\.google\.com.*?u=/, '')
      .replace(/^.*santatrans/, 'https://santatrans');
    return;
  }
  var url = 'https://translate.google.com/translate?sl=cs&tl=' + lang + '&u=' + encodeURIComponent(window.location.href);
  window.location.href = url;
}
