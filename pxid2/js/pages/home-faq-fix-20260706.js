/* ============================================================
   首页 - Hero 文字在视频播放 5 秒后逐渐淡出
   ============================================================ */
(function () {
    setTimeout(function () {
        const heroContent = document.getElementById('heroContent');
        const heroOverlay = document.querySelector('.hero-overlay');
        if (heroContent) {
            heroContent.classList.add('fade-out');
        }
        if (heroOverlay) {
            heroOverlay.classList.add('fade-out');
        }
    }, 5000); // 5秒后开始淡出
})();

/* ============================================================
   首页 - FAQ 手风琴展开/收起
   ============================================================ */
(function () {
    document.querySelectorAll('.faq-question').forEach(function (question) {
        question.removeAttribute('onclick');
        question.onclick = null;
        question.setAttribute('role', 'button');
        question.setAttribute('tabindex', '0');

        function toggleFaq() {
            const item = question.parentElement;
            if (!item) return;
            item.classList.toggle('active');
            question.setAttribute('aria-expanded', item.classList.contains('active') ? 'true' : 'false');
        }

        question.addEventListener('click', function () {
            toggleFaq();
        });

        question.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleFaq();
            }
        });
    });
})();
