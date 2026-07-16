function googleTranslateElementInit(){new google.translate.TranslateElement({pageLanguage:'cs',autoDisplay:false},'google_translate_element');}
function gtranslateFireEvent(el,e){try{var ev=document.createEvent('HTMLEvents');ev.initEvent(e,true,true);el.dispatchEvent(ev);}catch(x){el.fireEvent('on'+e);}}
function switchLang(lang){var n=0;var t=setInterval(function(){var c=document.querySelector('.goog-te-combo');n++;if(c){c.value=lang;gtranslateFireEvent(c,'change');clearInterval(t);}else if(n>40){clearInterval(t);}},200);}
(function(){var s=document.createElement('script');s.src='https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';document.head.appendChild(s);})();
