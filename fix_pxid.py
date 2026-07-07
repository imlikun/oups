#!/usr/bin/env python3
"""
PXID 修复脚本 v3
1. 移除所有旧的重复 v1/v2 脚本
2. 注入单一干净脚本：图片替换 + 中英文切换（带 UI 翻译字典）
3. 处理所有 19 个 HTML 文件
"""
import os
import re
import glob

BASE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "pxid")

# ============================================================
# 统一增强脚本（单次注入，无重复）
# ============================================================
CLEAN_SCRIPT = r"""<script>
(function() {
  // ============================================================
  // PXID v3: Image Replacement + Language Toggle
  // Single clean script — no duplicates, no conflicts
  // ============================================================
  
  var LANG_KEY = 'pxid-lang';
  
  // --- Product Image Mapping ---
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
  
  // --- UI Translation Dictionary ---
  var T = {
    en: {
      "Home": "Home",
      "Products": "Products",
      "ODM Services": "ODM Services",
      "About": "About",
      "Contact": "Contact",
      "News": "News",
      "View All Products": "View All Products",
      "Get in Touch": "Get in Touch",
      "Learn More": "Learn More",
      "INQUIRY": "INQUIRY",
      "DETAIL": "DETAIL",
      "Specifications": "Specifications",
      "Features": "Features",
      "Description": "Description",
      "Related Products": "Related Products",
      "Contact Us": "Contact Us",
      "Our Products": "Our Products",
      "Why Choose Us": "Why Choose Us",
      "Services": "Services"
    },
    zh: {
      "Home": "首页",
      "Products": "产品中心",
      "ODM Services": "ODM 服务",
      "About": "关于我们",
      "Contact": "联系我们",
      "News": "新闻动态",
      "View All Products": "查看全部产品",
      "Get in Touch": "联系我们",
      "Learn More": "了解更多",
      "INQUIRY": "询价",
      "DETAIL": "详情",
      "Specifications": "技术规格",
      "Features": "产品特点",
      "Description": "产品描述",
      "Related Products": "相关产品",
      "Contact Us": "联系我们",
      "Our Products": "产品中心",
      "Why Choose Us": "为什么选择我们",
      "Services": "服务"
    }
  };
  
  // --- Helper Functions ---
  function getImageBase() {
    var path = window.location.pathname.replace(/\/$/, '');
    var depth = Math.max(0, (path.match(/\//g) || []).length - 1);
    if (depth <= 0) return './images/products/';
    var parts = [];
    for (var i = 1; i <= depth; i++) parts.push('..');
    return parts.join('/') + '/images/products/';
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
    applyLang(lang);
  }
  
  function applyLang(lang) {
    // 1. Update toggle button styles
    var buttons = document.querySelectorAll('[aria-label="Toggle language"]');
    for (var b = 0; b < buttons.length; b++) {
      var btn = buttons[b];
      var spans = btn.querySelectorAll('span');
      for (var s = 0; s < spans.length; s++) {
        var t = spans[s].textContent.trim();
        if (t === 'EN') {
          spans[s].className = lang === 'en' ? 'font-bold text-brand-600' : 'text-navy-400';
        }
        if (t === '中文') {
          spans[s].className = lang === 'zh' ? 'font-bold text-brand-600' : 'text-navy-400';
        }
      }
    }
    
    // 2. Translate text nodes using T dictionary
    var dict = T[lang] || T.en;
    var walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    // First collect all text nodes with their original English text
    if (!window.__pxid_textNodes) {
      window.__pxid_textNodes = [];
      var node;
      while (node = walker.nextNode()) {
        var text = node.textContent.trim();
        if (text && text.length > 0 && text.length < 100) {
          // Store reference to text nodes that match translatable strings
          for (var key in T.en) {
            if (text === T.en[key] || text === T.zh[key]) {
              window.__pxid_textNodes.push({ node: node, key: key });
              break;
            }
          }
        }
      }
    }
    
    // Apply translations
    for (var i = 0; i < window.__pxid_textNodes.length; i++) {
      var item = window.__pxid_textNodes[i];
      var translated = dict[item.key];
      if (translated && item.node.textContent.trim() !== translated) {
        item.node.textContent = item.node.textContent.replace(item.node.textContent.trim(), translated);
      }
    }
    
    // 3. Update data-en/data-zh attributes if present
    var dataEls = document.querySelectorAll('[data-en]');
    for (var j = 0; j < dataEls.length; j++) {
      var el = dataEls[j];
      var text = lang === 'zh' ? el.getAttribute('data-zh') : el.getAttribute('data-en');
      if (text !== null && el.children.length === 0) {
        el.textContent = text;
      }
    }
  }
  
  function toggleLang() {
    var current = getLang();
    setLang(current === 'zh' ? 'en' : 'zh');
  }
  
  // --- Image Replacement System ---
  function replaceImages() {
    var base = getImageBase();
    var replaced = false;
    
    // 1. Product cards (index & products listing pages)
    var cards = document.querySelectorAll('a[href*="/products/"]');
    for (var i = 0; i < cards.length; i++) {
      var link = cards[i];
      var href = link.getAttribute('href') || '';
      var match = href.match(/products\/([^\/]+)\/?$/);
      if (!match) continue;
      var slug = match[1];
      if (!PRODUCT_IMAGES[slug]) continue;
      
      var gradDivs = link.querySelectorAll('[class*="bg-gradient-to-br"]');
      for (var g = 0; g < gradDivs.length; g++) {
        var div = gradDivs[g];
        if (div.querySelector('img')) continue;
        
        div.innerHTML = '';
        div.style.position = 'relative';
        div.style.overflow = 'hidden';
        
        var img = document.createElement('img');
        img.src = base + PRODUCT_IMAGES[slug];
        img.alt = slug.toUpperCase();
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.position = 'absolute';
        img.style.inset = '0';
        img.loading = 'lazy';
        img.onerror = function() { this.style.display = 'none'; };
        div.appendChild(img);
        replaced = true;
      }
    }
    
    // 2. Product detail hero image
    var heroDivs = document.querySelectorAll('[class*="rounded-2xl"][class*="bg-gradient-to-br"]');
    for (var j = 0; j < heroDivs.length; j++) {
      var hero = heroDivs[j];
      if (hero.querySelector('img')) continue;
      
      var currentSlug = getCurrentSlug();
      if (!PRODUCT_IMAGES[currentSlug]) continue;
      
      hero.innerHTML = '';
      hero.style.position = 'relative';
      hero.style.overflow = 'hidden';
      
      var img2 = document.createElement('img');
      img2.src = base + PRODUCT_IMAGES[currentSlug];
      img2.alt = currentSlug.toUpperCase();
      img2.style.width = '100%';
      img2.style.height = '100%';
      img2.style.objectFit = 'cover';
      img2.style.position = 'absolute';
      img2.style.inset = '0';
      img2.loading = 'lazy';
      img2.onerror = function() { this.style.display = 'none'; };
      hero.appendChild(img2);
      replaced = true;
    }
    
    return replaced;
  }
  
  // --- Initialize ---
  var initialLang = getLang();
  document.documentElement.lang = initialLang === 'zh' ? 'zh-CN' : 'en';
  
  // Language toggle — capture phase for fast click handling
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('[aria-label="Toggle language"]');
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      toggleLang();
    }
  }, true);
  
  function init() {
    applyLang(initialLang);
    
    // Image replacement — try multiple times for React hydration
    var attempts = 0;
    var maxAttempts = 10;
    
    function tryReplace() {
      if (replaceImages()) {
        // Success — keep observing for late renders
        if (attempts === 0) {
          var obs = new MutationObserver(function() {
            setTimeout(function() { replaceImages(); }, 200);
          });
          obs.observe(document.body, { childList: true, subtree: true });
        }
      }
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(tryReplace, attempts === 0 ? 100 : 500);
      }
    }
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', tryReplace);
    } else {
      tryReplace();
    }
    
    // Extra delayed passes for slow React renders
    setTimeout(function() { applyLang(getLang()); replaceImages(); }, 1000);
    setTimeout(function() { replaceImages(); }, 2500);
  }
  
  init();
  
  // Expose API
  window.__pxid_toggleLang = toggleLang;
  window.__pxid_getLang = getLang;
  window.__pxid_setLang = setLang;
  window.__pxid_replaceImages = replaceImages;
})();
</script>"""

def process_html_file(filepath):
    """处理单个 HTML 文件：移除旧脚本，注入新脚本"""
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()
    
    original_len = len(html)
    
    # ============================================================
    # 步骤 1：移除所有旧的 PXID 脚本块
    # ============================================================
    
    # 移除任何包含 __pxid_toggleLang 或 __pxid_getLang 或 __pxid_setLang 的 script 块
    # 通过查找 <script> 标签对来精确移除
    patterns_to_remove = [
        r'__pxid_toggleLang',
        r'__pxid_getLang',
        r'__pxid_setLang',
        r'Product Image Replacement',
        r'Language Toggle System',
        r'PXID Enhancement: Image Replacement \+ Language Toggle',
        r'PXID Enhancement v2',
        r'var LANG_KEY = .pxid-lang',
        r'var PRODUCT_IMAGES =',
        r'PRODUCT_IMAGES\[',
        r'function getImageBase',
    ]
    
    # 找到所有 <script>...</script> 块
    script_pattern = re.compile(r'<script>(.*?)</script>', re.DOTALL)
    
    def should_remove(script_content):
        for pat in patterns_to_remove:
            if re.search(pat, script_content):
                return True
        return False
    
    html = script_pattern.sub(
        lambda m: '' if should_remove(m.group(1)) else m.group(0),
        html
    )
    
    # ============================================================
    # 步骤 2：检查是否已注入
    # ============================================================
    if 'PXID v3: Image Replacement + Language Toggle' in html:
        print(f"  SKIP (already v3): {os.path.basename(filepath)}")
        return
    
    # ============================================================
    # 步骤 3：在 </body> 前注入统一脚本
    # ============================================================
    body_end = html.rfind('</body>')
    if body_end == -1:
        print(f"  WARNING: No </body> in {filepath}")
        return
    
    html = html[:body_end] + '\n' + CLEAN_SCRIPT + '\n' + html[body_end:]
    
    removed_bytes = original_len - len(html) + len(CLEAN_SCRIPT)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html)
    
    rel = os.path.relpath(filepath, BASE_DIR)
    print(f"  OK: {rel} ({removed_bytes:+d} bytes)")


def main():
    html_files = glob.glob(os.path.join(BASE_DIR, "**/*.html"), recursive=True)
    # Exclude 404 and _next directory
    html_files = [f for f in html_files if '_next' not in f]
    
    print(f"PXID Fix v3 — Processing {len(html_files)} HTML files\n")
    
    for filepath in sorted(html_files):
        process_html_file(filepath)
    
    print(f"\n{'='*60}")
    print(f"Done! Processed {len(html_files)} files.")
    print(f"Output: {BASE_DIR}/")

if __name__ == "__main__":
    main()
