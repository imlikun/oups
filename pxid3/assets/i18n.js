/**
 * PXID i18n — Language Switcher
 * Reads data-en / data-zh attributes and swaps visible text.
 * Persists choice in localStorage.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'pxid-lang';
  const SUPPORTED = ['en', 'zh'];
  const DEFAULT_LANG = 'en';

  // ── Detect saved lang ──
  function getSavedLang() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return SUPPORTED.includes(saved) ? saved : DEFAULT_LANG;
  }

  // ── Switch all elements ──
  function applyLang(lang) {
    document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en');
    document.documentElement.setAttribute('data-lang', lang);

    // Elements with data-en / data-zh
    document.querySelectorAll('[data-en][data-zh]').forEach(function (el) {
      var text = lang === 'zh' ? el.getAttribute('data-zh') : el.getAttribute('data-en');
      // Preserve child elements (like <br>, <span>), only replace top-level text
      if (el.childNodes.length <= 1 && el.childNodes[0] && el.childNodes[0].nodeType === 3) {
        el.textContent = text;
      } else {
        // Has child elements — replace text nodes carefully
        el.childNodes.forEach(function (node) {
          if (node.nodeType === 3) {
            node.textContent = '';
          }
        });
        // If no meaningful children remain, just set textContent
        var hasElementChildren = Array.from(el.children).length > 0;
        if (!hasElementChildren) {
          el.textContent = text;
        } else {
          // Insert text before first child element, clear other text nodes
          var firstChild = el.children[0];
          el.insertBefore(document.createTextNode(text), firstChild);
        }
      }
    });

    // Update toggle button text
    var toggleBtn = document.getElementById('lang-toggle');
    if (toggleBtn) {
      toggleBtn.textContent = lang === 'zh' ? 'EN' : '中文';
      toggleBtn.setAttribute('aria-label', lang === 'zh' ? 'Switch to English' : '切换到中文');
    }

    // Update active state on lang options (if dropdown exists)
    document.querySelectorAll('[data-lang-option]').forEach(function (opt) {
      opt.classList.toggle('lang-active', opt.getAttribute('data-lang-option') === lang);
    });

    localStorage.setItem(STORAGE_KEY, lang);

    // Dispatch custom event for other scripts
    document.dispatchEvent(new CustomEvent('pxid:langchange', { detail: { lang: lang } }));
  }

  // ── Toggle handler ──
  function toggleLang() {
    var current = getSavedLang();
    var next = current === 'en' ? 'zh' : 'en';
    applyLang(next);
  }

  // ── Initialize ──
  function init() {
    // Bind toggle button
    var toggleBtn = document.getElementById('lang-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        toggleLang();
      });
    }

    // Apply saved language on load (with small delay to ensure DOM is ready)
    var lang = getSavedLang();
    if (lang !== DEFAULT_LANG) {
      // Use requestAnimationFrame to apply after DOM paint
      requestAnimationFrame(function () {
        applyLang(lang);
      });
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for external use
  window.PXIDi18n = {
    switchTo: applyLang,
    current: getSavedLang,
    toggle: toggleLang
  };
})();
