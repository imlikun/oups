#!/usr/bin/env python3
"""
Enhance PXID static HTML files v2:
1. Replace SVG product placeholder with real <img> tags (using MutationObserver)
2. Add language toggle (EN/中文) functionality 
3. Handle both static HTML and Next.js hydrated content
"""
import os
import re
import glob

BASE_DIR = "/Users/likun/Desktop/PXID"

# Combined enhancement script
ENHANCE_SCRIPT = r"""<script>
(function() {
  // ============================================================
  // PXID Enhancement: Image Replacement + Language Toggle
  // ============================================================
  
  var LANG_KEY = 'pxid-lang';
  
  var PRODUCT_IMAGES = {
    "antelope-p5": "antelope-p5.jpg",
    "mantis-p6": "mantis-p6.jpg",
    "light-p4": "light-p4.jpg",
    "light-p2": "light-p2.jpg",
    "e-motorcycle-p8": "e-motorcycle-p8.jpg",
    "e-motorcycle-p9": "e-motorcycle-p9.jpg",
    "offroad-emoto": "offroad-emoto.jpg",
    "urban-p1": "urban-p1.jpg",
    "urban-p3": "urban-p3.jpg",
    "bestride": "bestride.jpg",
    "bestride-pro": "bestride-pro.jpg"
  };
  
  function getImageBase() {
    var path = window.location.pathname.replace(/\/$/, '');
    var depth = (path.match(/\//g) || []).length - 1;
    if (depth <= 0) return './images/products/';
    if (depth === 1) return '../images/products/';
    if (depth === 2) return '../../images/products/';
    return './images/products/';
  }
  
  function getCurrentSlug() {
    var parts = window.location.pathname.replace(/\/$/, '').split('/');
    return parts[parts.length - 1];
  }
  
  // --- Language System ---
  function getLang() {
    var urlParams = new URLSearchParams(window.location.search);
    var urlLang = urlParams.get('lang');
    if (urlLang === 'zh' || urlLang === 'en') {
      localStorage.setItem(LANG_KEY, urlLang);
      return urlLang;
    }
    var stored = localStorage.getItem(LANG_KEY);
    if (stored === 'zh' || stored === 'en') return stored;
    return 'en';
  }
  
  function setLang(lang) {
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    var url = new URL(window.location);
    url.searchParams.set('lang', lang);
    window.history.replaceState({}, '', url);
    updateLangUI(lang);
  }
  
  function updateLangUI(lang) {
    var buttons = document.querySelectorAll('[aria-label="Toggle language"]');
    for (var k = 0; k < buttons.length; k++) {
      var btn = buttons[k];
      var spans = btn.querySelectorAll('span');
      for (var s = 0; s < spans.length; s++) {
        var t = spans[s].textContent.trim();
        if (t === 'EN') {
          spans[s].className = lang === 'en' 
            ? 'font-bold text-brand-600' 
            : 'text-navy-400';
        }
        if (t === '中文') {
          spans[s].className = lang === 'zh' 
            ? 'font-bold text-brand-600' 
            : 'text-navy-400';
        }
      }
    }
  }
  
  function toggleLang() {
    var current = getLang();
    setLang(current === 'zh' ? 'en' : 'zh');
  }
  
  // --- Image Replacement System ---
  function replaceImagesInContainer(container) {
    var base = getImageBase();
    
    // 1. Product cards on index/products page
    var cards = container.querySelectorAll ? container.querySelectorAll('a[href*="/products/"]') : [];
    if (!cards.length && container.querySelectorAll) {
      cards = container.querySelectorAll('a[href*="/products/"]');
    }
    
    for (var i = 0; i < cards.length; i++) {
      var link = cards[i];
      var href = link.getAttribute('href') || '';
      var match = href.match(/products\/([^\/]+)\/?$/);
      if (!match) continue;
      var slug = match[1];
      if (!PRODUCT_IMAGES[slug]) continue;
      
      // Find gradient placeholder divs
      var gradDivs = link.querySelectorAll('[class*="bg-gradient-to-br"]');
      for (var g = 0; g < gradDivs.length; g++) {
        var div = gradDivs[g];
        if (div.querySelector('img')) continue;
        if (!div.querySelector('svg')) continue;
        
        div.innerHTML = '';
        div.style.cssText = 'position:relative;overflow:hidden;';
        var img = document.createElement('img');
        img.src = base + PRODUCT_IMAGES[slug];
        img.alt = slug.toUpperCase();
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;position:absolute;inset:0;';
        img.loading = 'lazy';
        div.appendChild(img);
      }
    }
    
    // 2. Product detail hero image
    var heroDivs = container.querySelectorAll ? container.querySelectorAll('[class*="rounded-2xl"][class*="bg-gradient-to-br"]') : [];
    for (var j = 0; j < heroDivs.length; j++) {
      var hero = heroDivs[j];
      if (!hero.querySelector('svg')) continue;
      if (hero.querySelector('img')) continue;
      
      var currentSlug = getCurrentSlug();
      if (!PRODUCT_IMAGES[currentSlug]) continue;
      
      hero.innerHTML = '';
      hero.style.cssText = 'position:relative;overflow:hidden;';
      var img = document.createElement('img');
      img.src = base + PRODUCT_IMAGES[currentSlug];
      img.alt = currentSlug.toUpperCase();
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;position:absolute;inset:0;';
      img.loading = 'lazy';
      hero.appendChild(img);
    }
  }
  
  // Initial replacement
  function initImages() {
    replaceImagesInContainer(document);
  }
  
  // MutationObserver to catch React/Next.js hydration
  var observer = new MutationObserver(function(mutations) {
    for (var m = 0; m < mutations.length; m++) {
      var mutation = mutations[m];
      if (mutation.addedNodes.length) {
        for (var n = 0; n < mutation.addedNodes.length; n++) {
          var node = mutation.addedNodes[n];
          if (node.nodeType === 1) {
            replaceImagesInContainer(node);
          }
        }
      }
    }
  });
  
  // --- Initialize ---
  var initialLang = getLang();
  document.documentElement.lang = initialLang === 'zh' ? 'zh-CN' : 'en';
  
  // Language toggle click handler (capture phase for fast response)
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('[aria-label="Toggle language"]');
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      toggleLang();
    }
  }, true);
  
  // DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      updateLangUI(initialLang);
      initImages();
      observer.observe(document.body, { childList: true, subtree: true });
    });
  } else {
    updateLangUI(initialLang);
    initImages();
    observer.observe(document.body, { childList: true, subtree: true });
  }
  
  // Extra passes for delayed React rendering
  setTimeout(function() { updateLangUI(getLang()); initImages(); }, 300);
  setTimeout(function() { updateLangUI(getLang()); initImages(); }, 800);
  setTimeout(function() { updateLangUI(getLang()); initImages(); }, 2000);
  
  // Expose API
  window.__pxid_toggleLang = toggleLang;
  window.__pxid_getLang = getLang;
  window.__pxid_setLang = setLang;
})();
</script>"""

def process_html_file(filepath):
    """Process a single HTML file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()
    
    # Remove any previously injected PXID enhancement scripts
    # Pattern: <script> that contains __pxid_toggleLang
    html = re.sub(
        r'<script>\s*\(function\(\)\s*\{[^}]*__pxid_toggleLang[\s\S]*?</script>',
        '',
        html
    )
    
    # Remove old standalone image scripts
    html = re.sub(
        r'<script>\s*\(function\(\)\s*\{[^}]*Product Image Replacement[\s\S]*?</script>',
        '',
        html
    )
    
    # Remove old standalone lang scripts
    html = re.sub(
        r'<script>\s*\(function\(\)\s*\{[^}]*Language Toggle System[\s\S]*?</script>',
        '',
        html
    )
    
    # Find the position before </body>
    body_end = html.rfind('</body>')
    if body_end == -1:
        print(f"  WARNING: No </body> found in {filepath}")
        return
    
    # Check if already has the new combined script
    if 'PXID Enhancement: Image Replacement + Language Toggle' in html:
        print(f"  SKIP: Already enhanced v2: {os.path.basename(filepath)}")
        return
    
    # Insert combined enhancement script before </body>
    html = html[:body_end] + ENHANCE_SCRIPT + html[body_end:]
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html)
    
    print(f"  OK: {os.path.basename(filepath)}")

def main():
    """Process all HTML files."""
    html_files = glob.glob(os.path.join(BASE_DIR, "**/*.html"), recursive=True)
    print(f"Found {len(html_files)} HTML files to process\n")
    
    for filepath in sorted(html_files):
        process_html_file(filepath)
    
    print(f"\nDone! Processed {len(html_files)} files.")
    
    # Verify
    print("\n--- Verification ---")
    for filepath in sorted(html_files)[:3]:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        has_enhance = 'PXID Enhancement' in content
        has_images = 'PRODUCT_IMAGES' in content
        has_lang = '__pxid_toggleLang' in content
        print(f"  {os.path.basename(filepath)}: enhance={has_enhance}, images={has_images}, lang={has_lang}")

if __name__ == "__main__":
    main()
