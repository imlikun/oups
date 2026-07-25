/* ============================================================
   PXID 公共脚本 - 全站共享
   包含: 多语言切换、蓝/绿配色、移动端菜单、导航高亮
   依赖: 无
   挂载: <body> 上的 data-lang / data-scheme 属性
   存储: localStorage (pxid-lang / pxid-scheme)
   ============================================================ */

/* ---------- 多语言切换 ---------- */
function setLang(lang) {
    document.body.setAttribute('data-lang', lang);
    localStorage.setItem('pxid-lang', lang);
}
function toggleLang() {
    const c = document.body.getAttribute('data-lang');
    setLang(c === 'en' ? 'zh' : 'en');
}
(function () {
    const saved = localStorage.getItem('pxid-lang') || 'en';
    setLang(saved);
})();

/* ---------- 蓝/绿 配色切换 ---------- */
function setScheme(scheme) {
    document.body.setAttribute('data-scheme', scheme);
    localStorage.setItem('pxid-scheme', scheme);
    const icon = document.querySelector('.scheme-switch i');
    if (icon) icon.style.color = scheme === 'blue' ? '' : 'var(--brand-primary)';
}
function toggleScheme() {
    const current = document.body.getAttribute('data-scheme') || 'blue';
    setScheme(current === 'blue' ? 'green' : 'blue');
}
(function () {
    const saved = localStorage.getItem('pxid-scheme') || 'blue';
    setScheme(saved);
})();

/* ---------- 导航当前页高亮 ---------- */
(function () {
    const page = decodeURIComponent(window.location.pathname.split('/').pop()) || '首页.html';
    document.querySelectorAll('.nav-links a').forEach(function (a) {
        if (a.getAttribute('href') === page) a.classList.add('active');
    });
})();

/* ---------- 移动端抽屉菜单 ---------- */
(function () {
    var menuToggle = document.querySelector('.menu-toggle');
    var menuPanel = document.querySelector('.mobile-menu-panel');
    var menuClose = document.querySelector('.mobile-menu-close');

    // 将移动端菜单提升到 body 末尾，避免被产品页局部堆叠上下文遮住
    if (menuPanel && menuPanel.parentElement !== document.body) {
        document.body.appendChild(menuPanel);
    }

    function openMenu() {
        if (menuPanel) {
            menuPanel.classList.add('open');
            menuPanel.setAttribute('aria-hidden', 'false');
        }
        document.body.classList.add('mobile-menu-open');
        if (menuToggle) {
            var icon = menuToggle.querySelector('i');
            if (icon) icon.className = 'fas fa-times';
            menuToggle.setAttribute('aria-expanded', 'true');
            menuToggle.setAttribute('aria-label', 'Close menu');
        }
    }

    function closeMenu() {
        if (menuPanel) {
            menuPanel.classList.remove('open');
            menuPanel.setAttribute('aria-hidden', 'true');
        }
        document.body.classList.remove('mobile-menu-open');
        if (menuToggle) {
            var icon = menuToggle.querySelector('i');
            if (icon) icon.className = 'fas fa-bars';
            menuToggle.setAttribute('aria-expanded', 'false');
            menuToggle.setAttribute('aria-label', 'Open menu');
        }
    }

    window.closeMobileMenu = closeMenu;

    if (menuToggle && menuPanel) {
        menuToggle.addEventListener('click', function () {
            if (menuPanel.classList.contains('open')) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        if (menuClose) {
            menuClose.addEventListener('click', closeMenu);
        }

        menuPanel.addEventListener('click', function (event) {
            if (event.target === menuPanel) {
                closeMenu();
            }
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && menuPanel.classList.contains('open')) {
                closeMenu();
            }
        });

        // 点击菜单链接后自动关闭
        var menuLinks = menuPanel.querySelectorAll('a');
        menuLinks.forEach(function (link) {
            link.addEventListener('click', closeMenu);
        });

        // 移动端菜单当前页高亮
        var page = decodeURIComponent(window.location.pathname.split('/').pop()) || '首页.html';
        var activeFound = false;
        menuPanel.querySelectorAll('.mobile-menu-item').forEach(function (a) {
            if (a.getAttribute('href') === page) {
                a.classList.add('active');
                activeFound = true;
            }
        });
        if (!activeFound) {
            var productPages = [
                'antelope-p5.html', 'bestride-f1.html', 'bestride-pro-f2.html', 'bestride-pro-w2.html',
                'light-p2.html', 'light-p4.html', 'm2.html', 'mantis-p6.html', 'mota-z1.html',
                'mota-z3.html', 'px-4.html', 'urban-p1.html', 'urban-p3.html'
            ];
            var mappedHref = productPages.indexOf(page) > -1 ? '产品.html' : (page === '新闻详情.html' ? '新闻页.html' : '');
            if (mappedHref) {
                var mappedLink = menuPanel.querySelector('.mobile-menu-item[href="' + mappedHref + '"]');
                if (mappedLink) mappedLink.classList.add('active');
            }
        }
    }
})();

/* ---------- 导航栏滚动效果 ---------- */
/* 全站统一：滚动超过 50px 时为 .navbar 添加 .scrolled 类 */
(function () {
    var nav = document.querySelector('.navbar');
    if (!nav) return;
    function onScroll() {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
})();

/* ---------- PXID Mobile Optimization Spec Interactions ---------- */
(function () {
    // Footer Contact 折叠
    document.querySelectorAll('.footer-grid > .footer-col:nth-child(4) h4').forEach(function (title) {
        title.setAttribute('role', 'button');
        title.setAttribute('tabindex', '0');
        function toggleFooter() {
            var col = title.closest('.footer-col');
            if (col) col.classList.toggle('open');
        }
        title.addEventListener('click', toggleFooter);
        title.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleFooter();
            }
        });
    });

    // 首页 Factory 文案折叠
    document.querySelectorAll('.factory-read-more').forEach(function (button) {
        button.addEventListener('click', function () {
            var info = button.nextElementSibling;
            if (!info || !info.classList.contains('factory-info')) {
                info = button.parentElement ? button.parentElement.querySelector('.factory-info') : null;
            }
            if (info) info.classList.toggle('open');
            button.classList.toggle('open');
        });
    });

    // ODM Pain Points 手风琴
    document.querySelectorAll('.pain-grid').forEach(function (grid) {
        grid.classList.add('swipe-accordion');
    });
    document.querySelectorAll('.pain-card').forEach(function (card) {
        card.style.position = 'relative';
        card.style.cursor = 'pointer';
        card.addEventListener('click', function () {
            card.classList.toggle('open');
        });
    });
})();

/* ---------- 视频懒加载 (IntersectionObserver) ---------- */
(function () {
    // 非 hero 视频：滚动进入视口才加载播放（首屏 hero 视频用 autoplay 立即播放，配合 faststart + 服务器 Range 实现边下边播）
    var lazyVideos = document.querySelectorAll('video[preload="none"]:not(#heroVideo)');
    if (lazyVideos.length && 'IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.play().catch(function () {});
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.25 });
        lazyVideos.forEach(function (video) { observer.observe(video); });
    }
})();

/* ---------- 背景图懒加载 (IntersectionObserver) ---------- */
(function () {
    var lazyBg = document.querySelectorAll('[data-bg]');
    if (!lazyBg.length) return;
    if (!('IntersectionObserver' in window)) {
        // 不支持 IO 时直接加载，保证降级可用
        lazyBg.forEach(function (el) { el.style.backgroundImage = el.dataset.bg; });
        return;
    }
    var bgObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                var el = entry.target;
                el.style.backgroundImage = el.dataset.bg;
                bgObserver.unobserve(el);
            }
        });
    }, { rootMargin: '200px' });   // 提前 200px 加载，避免滚动白屏
    lazyBg.forEach(function (el) { bgObserver.observe(el); });
})();

