/* Jazykový přepínač webu přes Google Translate (klientská integrace, zdarma) */

function googleTranslateElementInit() {
  new google.translate.TranslateElement(
    { pageLanguage: 'cs', autoDisplay: false },
    'google_translate_element'
  );
}

function gtranslateFireEvent(el, eventName) {
  try {
    var evt = document.createEvent('HTMLEvents');
    evt.initEvent(eventName, true, true);
    el.dispatchEvent(evt);
  } catch (e) {
    el.fireEvent('on' + eventName);
  }
}

function switchLang(lang) {
  var attempts = 0;
  var checkCondition = setInterval(function () {
    var combo = document.querySelector('.goog-te-combo');
    attempts++;
    if (combo) {
      combo.value = lang;
      gtranslateFireEvent(combo, 'change');
      clearInterval(checkCondition);
    } else if (attempts > 40) {
      clearInterval(checkCondition);
    }
  }, 200);
}

(function () {
  var s = document.createElement('script');
  s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  document.head.appendChild(s);
})();
