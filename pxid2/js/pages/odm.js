/* ============================================================
   ODM 服务页 - 服务项手风琴 & FAQ 折叠
   ============================================================ */

/* ---------- 服务项手风琴 ---------- */
function toggleSvc(btn) {
    const item = btn.parentElement;
    const panel = item.querySelector('.svc-panel');
    const icon = btn.querySelector('.svc-icon');
    const isActive = item.classList.contains('active');
    document.querySelectorAll('.svc-item').forEach(other => {
        other.classList.remove('active');
        other.querySelector('.svc-panel').style.maxHeight = '0';
        other.querySelector('.svc-icon').textContent = '+';
    });
    if (!isActive) {
        item.classList.add('active');
        panel.style.maxHeight = panel.scrollHeight + 'px';
        icon.textContent = '−';
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const first = document.querySelector('.svc-item.active');
    if (first) {
        const panel = first.querySelector('.svc-panel');
        panel.style.maxHeight = panel.scrollHeight + 'px';
        first.querySelector('.svc-icon').textContent = '−';
    }
});

/* ---------- FAQ 折叠 ---------- */
function toggleFaq(btn) {
    const item = btn.parentElement;
    const panel = item.querySelector('.faq-panel');
    const isActive = item.classList.contains('active');
    document.querySelectorAll('.faq-item').forEach(other => {
        other.classList.remove('active');
        other.querySelector('.faq-panel').style.maxHeight = '0';
    });
    if (!isActive) {
        item.classList.add('active');
        panel.style.maxHeight = panel.scrollHeight + 'px';
    }
}

/* ---------- 研发流程 Tab 切换 ---------- */
document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('.rd-steps-nav');
    const tabs = document.querySelectorAll('.rd-step-tab');
    const contents = document.querySelectorAll('.rd-step-content');
    if (!nav) return;

    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            if (contents[index]) {
                contents[index].classList.add('active');
            }
            tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        });
        tab.style.cursor = 'pointer';
    });

    /* ---- 左右滚动按钮 ---- */
    const wrapper = nav.parentElement;
    const scrollStep = 320;

    const leftBtn = document.createElement('button');
    leftBtn.className = 'rd-scroll-btn left';
    leftBtn.setAttribute('aria-label', 'Scroll left');
    leftBtn.innerHTML = '&#8249;';
    leftBtn.addEventListener('click', () => {
        nav.scrollBy({ left: -scrollStep, behavior: 'smooth' });
    });

    const rightBtn = document.createElement('button');
    rightBtn.className = 'rd-scroll-btn right';
    rightBtn.setAttribute('aria-label', 'Scroll right');
    rightBtn.innerHTML = '&#8250;';
    rightBtn.addEventListener('click', () => {
        nav.scrollBy({ left: scrollStep, behavior: 'smooth' });
    });

    wrapper.insertBefore(leftBtn, nav);
    wrapper.appendChild(rightBtn);

    function updateBtnState() {
        const maxScroll = nav.scrollWidth - nav.clientWidth;
        leftBtn.disabled = nav.scrollLeft <= 2;
        rightBtn.disabled = nav.scrollLeft >= maxScroll - 2;
    }
    nav.addEventListener('scroll', updateBtnState, { passive: true });
    window.addEventListener('resize', updateBtnState);
    updateBtnState();
});
