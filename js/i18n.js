/* ============================================================
   JRN BEETLE — i18n (Internationalization) System
   Lightweight language switching for static site
   Supports: English (default), Thai, Chinese
   ============================================================ */

(function () {
  'use strict';

  const SUPPORTED_LANGS = ['en', 'th', 'zh'];
  const LANG_LABELS = { en: 'EN', th: 'ไทย', zh: '中文' };
  const cache = {}; // cached translation JSON per language

  /**
   * Get the current language from localStorage (default: 'en').
   */
  function getLang() {
    const saved = localStorage.getItem('lang');
    return SUPPORTED_LANGS.includes(saved) ? saved : 'en';
  }

  /**
   * Fetch a language JSON file, with caching.
   * Returns a Promise that resolves to the translations object.
   */
  function fetchLang(lang) {
    if (cache[lang]) return Promise.resolve(cache[lang]);

    // Resolve path relative to the page (works from any HTML file location)
    const base = document.querySelector('script[src*="i18n.js"]');
    let jsonPath = 'data/lang-' + lang + '.json';

    // If the page is in a subfolder, adjust path
    if (base) {
      const src = base.getAttribute('src');
      const depth = (src.match(/\.\.\//g) || []).length;
      jsonPath = '../'.repeat(depth) + jsonPath;
    }

    return fetch(jsonPath)
      .then(function (res) {
        if (!res.ok) throw new Error('Language file not found: ' + jsonPath);
        return res.json();
      })
      .then(function (data) {
        cache[lang] = data;
        return data;
      })
      .catch(function (err) {
        console.warn('[i18n] ' + err.message);
        return {};
      });
  }

  /**
   * Apply translations to the page.
   * For 'en', revert to original English text stored in data attributes.
   */
  function applyTranslations(lang) {
    if (lang === 'en') {
      // Restore original English text
      document.querySelectorAll('[data-i18n]').forEach(function (el) {
        var original = el.getAttribute('data-i18n-original');
        if (original != null) {
          if (el.getAttribute('data-i18n-html') === 'true') {
            el.innerHTML = original;
          } else {
            el.textContent = original;
          }
        }
      });
      document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
        var original = el.getAttribute('data-i18n-placeholder-original');
        if (original != null) el.placeholder = original;
      });
      document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
        var original = el.getAttribute('data-i18n-title-original');
        if (original != null) el.title = original;
      });
      updateDropdownUI(lang);
      document.documentElement.lang = 'en';
      return Promise.resolve();
    }

    return fetchLang(lang).then(function (translations) {
      // textContent / innerHTML translations
      document.querySelectorAll('[data-i18n]').forEach(function (el) {
        var key = el.getAttribute('data-i18n');

        // Save original English text on first pass
        if (!el.hasAttribute('data-i18n-original')) {
          if (el.getAttribute('data-i18n-html') === 'true') {
            el.setAttribute('data-i18n-original', el.innerHTML);
          } else {
            el.setAttribute('data-i18n-original', el.textContent);
          }
        }

        if (translations[key]) {
          if (el.getAttribute('data-i18n-html') === 'true') {
            el.innerHTML = translations[key];
          } else {
            el.textContent = translations[key];
          }
        }
        // If key missing, keep English (do nothing)
      });

      // Placeholder translations
      document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
        var key = el.getAttribute('data-i18n-placeholder');
        if (!el.hasAttribute('data-i18n-placeholder-original')) {
          el.setAttribute('data-i18n-placeholder-original', el.placeholder);
        }
        if (translations[key]) {
          el.placeholder = translations[key];
        }
      });

      // Title attribute translations
      document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
        var key = el.getAttribute('data-i18n-title');
        if (!el.hasAttribute('data-i18n-title-original')) {
          el.setAttribute('data-i18n-title-original', el.title);
        }
        if (translations[key]) {
          el.title = translations[key];
        }
      });

      updateDropdownUI(lang);
      document.documentElement.lang = lang === 'th' ? 'th' : lang === 'zh' ? 'zh-Hant' : lang;
    });
  }

  /**
   * Update the dropdown button text and active state.
   */
  function updateDropdownUI(lang) {
    var codeEl = document.querySelector('.lang-code');
    if (codeEl) codeEl.textContent = LANG_LABELS[lang] || lang.toUpperCase();

    document.querySelectorAll('.lang-option').forEach(function (opt) {
      opt.classList.toggle('active', opt.getAttribute('data-lang') === lang);
    });
  }

  /**
   * Set language, save to localStorage, and apply translations.
   */
  function setLang(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) return;
    localStorage.setItem('lang', lang);
    applyTranslations(lang);
  }

  /**
   * Build and inject the language switcher dropdown into the nav.
   */
  function injectSwitcher() {
    var navContainer = document.querySelector('.nav-container');
    if (!navContainer) return;

    // Don't inject twice
    if (navContainer.querySelector('.lang-switcher')) return;

    var currentLang = getLang();

    var switcher = document.createElement('div');
    switcher.className = 'lang-switcher';

    // Button
    var btn = document.createElement('button');
    btn.className = 'lang-btn';
    btn.setAttribute('aria-label', 'Switch language');
    btn.innerHTML =
      '<span class="lang-globe">🌐</span>' +
      '<span class="lang-code">' + (LANG_LABELS[currentLang] || 'EN') + '</span>';

    // Dropdown
    var dropdown = document.createElement('div');
    dropdown.className = 'lang-dropdown';

    var options = [
      { lang: 'en', label: 'English' },
      { lang: 'th', label: 'ไทย' },
      { lang: 'zh', label: '中文' }
    ];

    options.forEach(function (opt) {
      var optBtn = document.createElement('button');
      optBtn.className = 'lang-option' + (opt.lang === currentLang ? ' active' : '');
      optBtn.setAttribute('data-lang', opt.lang);
      optBtn.textContent = opt.label;
      optBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        setLang(opt.lang);
        dropdown.classList.remove('open');
      });
      dropdown.appendChild(optBtn);
    });

    switcher.appendChild(btn);
    switcher.appendChild(dropdown);
    navContainer.appendChild(switcher);

    // Toggle dropdown on button click
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });

    // Close dropdown when clicking elsewhere
    document.addEventListener('click', function () {
      dropdown.classList.remove('open');
    });
  }

  /**
   * Initialize on DOM ready.
   */
  function init() {
    injectSwitcher();
    var lang = getLang();
    if (lang !== 'en') {
      applyTranslations(lang);
    } else {
      updateDropdownUI('en');
    }
  }

  // Expose setLang globally
  window.setLang = setLang;

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
