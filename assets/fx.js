/* ════════════════════════════════════════════════════════════════
   FX ENGINE · appin.site · 1:1 复刻自 deepseek_html_20260719_c8248f.html
   逐项对应原文件 <script> 的动效模块，数值与行为完全一致：
   1 光晕追踪 / 2 网格偏移 / 3 心跳logo / 4 鼠标拖尾 /
   5 背景粒子 / 6 点击涟漪 / 7 打字机+glitch / 8 其它 [data-fx-glitch]
   说明：原蓝本【没有任何】prefers-reduced-motion 闸门，本引擎亦不加，
        以保证全站动效始终渲染（与蓝本一致）。
        动效层 z-index 已抬到内容之上，使不透明 section 下依然可见。
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
    var PARTICLE_COUNT = 22;

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
      this.size = Math.random() * 2 + 1;
      this.speedX = (Math.random() - 0.5) * 0.25;
      this.speedY = (Math.random() - 0.5) * 0.25;
      this.opacity = Math.random() * 0.3 + 0.1;
    };
    Particle.prototype.update = function () {
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
      if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
    };
    Particle.prototype.draw = function () {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 255, 65, ' + this.opacity + ')';
      ctx.shadowColor = '#00FF41';
      ctx.shadowBlur = 12;
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
    var targets = [
      document.getElementById('slogan-text'),
      document.getElementById('typed')
    ].filter(Boolean);
    if (!targets.length) return;
    var texts = targets.map(function (el) {
      return (el.getAttribute('data-fx-text') || el.textContent || '').trim() || './change';
    });
    var li = 0, ci = 0, timer = null;

    function typeLine() {
      if (li >= targets.length) { startRandomGlitch(); return; }
      var el = targets[li];
      el.textContent = '';
      ci = 0;
      timer = setInterval(function () {
        if (ci < texts[li].length) {
          el.textContent += texts[li].charAt(ci);
          ci++;
        } else {
          clearInterval(timer);
          timer = null;
          li++;
          if (li < targets.length) typeLine();
          else startRandomGlitch();
        }
      }, 120);
    }

    function startRandomGlitch() {
      setInterval(function () {
        var el = targets[0];
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

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    initHeartbeat();
    initGlow();
    initGrid();
    initTrail();
    initParticles();
    initRipple();
    initTypewriter();
    initGlitch();
  });
})();
