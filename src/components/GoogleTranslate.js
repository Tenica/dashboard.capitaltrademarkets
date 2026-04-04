import React, { useEffect } from 'react';

const GoogleTranslate = () => {
  useEffect(() => {
    // Check if script is already injected
    if (document.getElementById('google-translate-script')) {
      // Re-initialize if already loaded but div was destroyed (React nav)
      if (window.google && window.google.translate && window.google.translate.TranslateElement) {
        document.getElementById('google_translate_element').innerHTML = '';
        new window.google.translate.TranslateElement(
          { pageLanguage: 'en' },
          'google_translate_element'
        );
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    
    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        { pageLanguage: 'en' },
        'google_translate_element'
      );
    };

    document.body.appendChild(script);
  }, []);

  return (
    <div id="google_translate_element" style={{ display: 'flex', justifyContent: 'center' }}></div>
  );
};

export default GoogleTranslate;
