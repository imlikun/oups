/* ════════════════════════════════════════════════════════════════
   FX ENGINE · appin.site · 1:1 复刻自 deepseek_html_20260719_c8248f.html
   逐项对应原文件 <script> 的动效模块，数值与行为完全一致：
   1 光晕追踪 / 2 网格偏移 / 3 心跳logo / 4 鼠标拖尾 /
   5 背景粒子 / 6 点击涟漪 / 7 打字机+glitch / 8 其它 [data-fx-glitch]
   说明：原蓝本【没有任何】prefers-reduced-motion 闸门，本引擎亦不加，
        以保证全站动效始终渲染（与蓝本一致）。
        动效层一律置于内容【之下】(z-index:0)，内容容器统一 z-index:1，
        绝不在正文之上绘制，避免长文页糊字。
        阅读型页面（随笔/技艺录）额外关闭网格/拖尾/粒子，仅留光晕(透出文字)+心跳+glitch+涟漪。
        蓝本中的系统日志 / 终端模拟器属于 demo 装饰，不属于本站，已移除。
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── 1. 鼠标追踪光晕（蓝本：mousemove 直接写 --mouse-x/--mouse-y）── */
  function initGlow() {
    var root = document.documentElement;
    document.addEventListener('mousemove', function (e) {
      var x = (e.clientX / window.innerWidth) * 100;
      var y = (e.clientY / window.innerHeight) * 100;
      root.style.setProperty('--mouse-x', x + '%');
      root.style.setProperty('--mouse-y', y + '%');
    });
  }

  /* ── 2. 动态网格偏移（蓝本：×12 写入 --grid-offset）── */
  function initGrid() {
    var grid = document.createElement('div');
    grid.className = 'fx-grid';
    grid.setAttribute('aria-hidden', 'true');
    document.body.appendChild(grid);
    var root = document.documentElement;
    document.addEventListener('mousemove', function (e) {
      var x = (e.clientX / window.innerWidth - 0.5) * 12;
      var y = (e.clientY / window.innerHeight - 0.5) * 12;
      root.style.setProperty('--grid-offset', x.toFixed(1) + 'px, ' + y.toFixed(1) + 'px');
    });
  }

  /* ── 3. 心跳指示灯（注入 .logo 首个子节点）── */
  function initHeartbeat() {
    var logos = document.querySelectorAll('.logo');
    Array.prototype.forEach.call(logos, function (logo) {
      if (logo.querySelector('.heartbeat-dot')) return;
      var dot = document.createElement('span');
      dot.className = 'heartbeat-dot';
      dot.setAttribute('aria-hidden', 'true');
      logo.insertBefore(dot, logo.firstChild);
    });
  }

  /* ── 4. 鼠标拖尾（蓝本：MAX_POINT_S=25 / alpha .05–.35 / r 1.5–3 / blur 12）── */
  function initTrail() {
    var trailCanvas = document.createElement('canvas');
    trailCanvas.id = 'fx-trail';
    document.body.appendChild(trailCanvas);
    var tCtx = trailCanvas.getContext('2d');
    var trailPoints = [];
    var MAX_POINT_S = 25;

    function resizeTrail() {
      trailCanvas.width = window.innerWidth;
      trailCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeTrail);
    resizeTrail();

    document.addEventListener('mousemove', function (e) {
      trailPoints.push({ x: e.clientX, y: e.clientY });
      if (trailPoints.length > MAX_POINT_S) trailPoints.shift();
    });
    document.addEventListener('mouseleave', function () {
      trailPoints = [];
      tCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
    });

    function drawTrail() {
      tCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
      var len = trailPoints.length;
      if (len === 0) { requestAnimationFrame(drawTrail); return; }
      trailPoints.forEach(function (p, i) {
        var alpha = (i / len) * 0.35 + 0.05;
        var radius = 1.5 + (i / len) * 2.5;
        tCtx.beginPath();
        tCtx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        tCtx.fillStyle = 'rgba(0, 255, 65, ' + alpha + ')';
        tCtx.shadowColor = '#00FF41';
        tCtx.shadowBlur = 12;
        tCtx.fill();
        tCtx.shadowBlur = 0;
      });
      requestAnimationFrame(drawTrail);
    }
    drawTrail();
  }

  /* ── 5. 背景粒子（蓝本：22 个 / size 1–3 / speed .25 / opacity .1–.4 / blur 12 / 画布 opacity .4）── */
  function initParticles() {
    var canvas = document.createElement('canvas');
    canvas.id = 'fx-particles';
    canvas.style.opacity = '0.4';
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var particles = [];
    var PARTICLE_COUNT = 44;

    function resizeParticleCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeParticleCanvas);
    resizeParticleCanvas();

    function Particle() { this.reset(); }
    Particle.prototype.reset = function () {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      // 大小更随机：右偏分布，多数偏小、偶尔偏大（约 0.6 ~ 5.6）
      this.size = Math.random() * Math.random() * 5 + 0.6;
      // 独立方向 + 缓慢转向，形成蜿蜒浮动
      this.angle = Math.random() * Math.PI * 2;
      this.angularSpeed = (Math.random() - 0.5) * 0.02;
      // 速度差异更大（0.1 ~ 0.7）
      this.speed = Math.random() * 0.6 + 0.1;
      // 垂直摆动，让轨迹更随机
      this.wobbleAmp = Math.random() * 0.5 + 0.05;
      this.wobbleFreq = Math.random() * 0.05 + 0.01;
      this.phase = Math.random() * Math.PI * 2;
      this.opacity = Math.random() * 0.5 + 0.1;
    };
    Particle.prototype.update = function () {
      this.angle += this.angularSpeed;
      this.phase += this.wobbleFreq;
      var wobX = Math.cos(this.phase) * this.wobbleAmp;
      var wobY = Math.sin(this.phase) * this.wobbleAmp;
      this.x += Math.cos(this.angle) * this.speed + wobX;
      this.y += Math.sin(this.angle) * this.speed + wobY;
      // 边界回绕，连续漂浮而非硬反弹
      if (this.x < -this.size) this.x = canvas.width + this.size;
      if (this.x > canvas.width + this.size) this.x = -this.size;
      if (this.y < -this.size) this.y = canvas.height + this.size;
      if (this.y > canvas.height + this.size) this.y = -this.size;
    };
    Particle.prototype.draw = function () {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 255, 65, ' + this.opacity + ')';
      ctx.shadowColor = '#00FF41';
      ctx.shadowBlur = this.size * 3;
      ctx.fill();
      ctx.shadowBlur = 0;
    };
    for (var i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

    function animateParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(function (p) { p.update(); p.draw(); });
      requestAnimationFrame(animateParticles);
    }
    animateParticles();
  }

  /* ── 6. 点击涟漪（蓝本：120px / 0.8s；交互元素不触发）── */
  function initRipple() {
    var layer = document.createElement('div');
    layer.className = 'ripple-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
    document.addEventListener('click', function (e) {
      if (e.target.closest('a, button, .nav-links, .blog-item, .navbar, nav, .content-card, input, textarea, select')) return;
      var ripple = document.createElement('div');
      ripple.className = 'ripple';
      ripple.style.left = e.clientX + 'px';
      ripple.style.top = e.clientY + 'px';
      layer.appendChild(ripple);
      setTimeout(function () { ripple.remove(); }, 800);
    });
  }

  /* ── 7. 打字机 + 周期性 glitch（蓝本机制：120ms/字，打完每 10000+random*8000 触发 glitch）
        文本取自站点 hero 的真实文案（data-fx-text），而非蓝本的 ./change ── */
  function initTypewriter() {
    var el = document.getElementById('slogan-text');
    if (!el) { console.warn('[typewriter] #slogan-text not found'); return; }
    var text = (el.getAttribute('data-fx-text') || el.textContent || '').trim() || './change';
    var ci = 0, timer = null;

    function typeLine() {
      el.textContent = '';
      ci = 0;
      timer = setInterval(function () {
        if (ci < text.length) {
          el.textContent += text.charAt(ci);
          ci++;
        } else {
          clearInterval(timer);
          timer = null;
          startRandomGlitch();
        }
      }, 120);
    }

    function startRandomGlitch() {
      setInterval(function () {
        el.classList.remove('fx-glitch');
        void el.offsetHeight;
        el.classList.add('fx-glitch');
        setTimeout(function () { el.classList.remove('fx-glitch'); }, 500);
      }, 10000 + Math.random() * 8000);
    }

    typeLine();
  }

  /* ── 8. 其它 [data-fx-glitch] 元素，周期闪烁 ── */
  function initGlitch() {
    var targets = document.querySelectorAll('[data-fx-glitch]');
    Array.prototype.forEach.call(targets, function (el) {
      setInterval(function () {
        el.classList.remove('fx-glitch');
        void el.offsetHeight;
        el.classList.add('fx-glitch');
        setTimeout(function () { el.classList.remove('fx-glitch'); }, 500);
      }, 9000 + Math.random() * 8000);
    });
  }

  /* ── 阅读型页面判定：随笔/技艺录等长文页，正文容器透明，
        网格/粒子/拖尾会穿透文字，故归类为「阅读页」并关闭重装饰 ── */
  function isReadingPage() {
    return !!document.querySelector('.toc-wrap, article.content, .article-body, .post-body');
  }

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var reading = isReadingPage();
    if (reading) document.body.classList.add('fx-reading');

    initHeartbeat();
    initGlow();
    if (!reading) initGrid();        // 阅读页关闭：网格穿透正文
    if (!reading) initTrail();       // 阅读页关闭：拖尾干扰阅读
    if (!reading) initParticles();   // 阅读页关闭：粒子穿透正文
    initRipple();
    initTypewriter();
    initGlitch();
  });
})();
