/* ============================================================
   产品详情页 - 图片画廊切换
   适用: EB 系列产品页 (antelope-p5 / light-p2 / light-p4 / mantis-p6)
   用法: onclick="switchGallery(this, 'media/xxx.jpg')"
   ============================================================ */
function switchGallery(thumb, src) {
    const main = document.getElementById('galleryMain');
    if (main && src) {
        main.querySelector('img').src = src;
    }
    document.querySelectorAll('.gallery-thumb, .gallery-side-item').forEach(t => t.classList.remove('active'));
    if (thumb) thumb.classList.add('active');
}
