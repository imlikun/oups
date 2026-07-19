/* ════════════════════════════════════════════════════════════════
   FX ENGINE · appin.site 全局动效引擎（提取自 deepseek c38eba 蓝本）
   鼠标光晕 / 心跳 logo / 点击涟漪 / 背景粒子 / 系统日志 / glitch / 入场
   全部尊重 prefers-reduced-motion
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isLight = function () {
    return document.body.classList.contains('light');
  };

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* ── 1. 鼠标追踪光晕（rAF 节流写 --mouse-x/--mouse-y）── */
  function initGlow() {
    var root = document.documentElement;
    var tx = 50, ty = 50, cx = 50, cy = 50, raf = null;
    function apply() {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      root.style.setProperty('--mouse-x', cx.toFixed(2) + '%');
      root.style.setProperty('--mouse-y', cy.toFixed(2) + '%');
      if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) {
        raf = requestAnimationFrame(apply);
      } else { raf = null; }
    }
    window.addEventListener('mousemove', function (e) {
      tx = (e.clientX / window.innerWidth) * 100;
      ty = (e.clientY / window.innerHeight) * 100;
      if (!raf) raf = requestAnimationFrame(apply);
    }, { passive: true });
  }

  /* ── 2. 心跳指示灯（注入到 .logo）── */
  function initHeartbeat() {
    var logos = document.querySelectorAll('.logo');
    logos.forEach(function (logo) {
      if (logo.querySelector('.heartbeat-dot')) return;
      var dot = document.createElement('span');
      dot.className = 'heartbeat-dot';
      dot.setAttribute('aria-hidden', 'true');
      logo.insertBefore(dot, logo.firstChild);
    });
  }

  /* ── 3. 点击涟漪 ── */
  function initRipple() {
    if (reduce) return;
    var layer = document.createElement('div');
    layer.className = 'ripple-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);

    document.addEventListener('click', function (e) {
      // 交互元素保留自身反馈，只在大面积空白区泛起涟漪
      if (e.target.closest('a, button, .nav-links, .blog-item, .navbar, nav, .content-card, input, textarea, select')) {
        return;
      }
      var r = document.createElement('div');
      r.className = 'ripple';
      r.style.left = e.clientX + 'px';
      r.style.top = e.clientY + 'px';
      layer.appendChild(r);
      requestAnimationFrame(function () {
        r.style.width = '120px';
        r.style.height = '120px';
        r.style.opacity = '0';
      });
      setTimeout(function () { r.remove(); }, 850);
    });
  }

  /* ── 4. 背景粒子（仅暗色 + 非 reduce）── */
  function initParticles() {
    if (reduce) return;
    if (isLight()) return; // 浅色主题下不可见，跳过以省性能

    var canvas = document.createElement('canvas');
    canvas.id = 'fx-particles';
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var particles = [];
    var COUNT = 16;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    function Particle() { this.reset(); }
    Particle.prototype.reset = function () {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 1.6 + 0.8;
      this.sx = (Math.random() - 0.5) * 0.3;
      this.sy = (Math.random() - 0.5) * 0.3;
      this.op = Math.random() * 0.35 + 0.1;
    };
    Particle.prototype.step = function () {
      this.x += this.sx; this.y += this.sy;
      if (this.x < 0 || this.x > canvas.width) this.sx *= -1;
      if (this.y < 0 || this.y > canvas.height) this.sy *= -1;
    };
    Particle.prototype.draw = function () {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,255,65,' + this.op + ')';
      ctx.shadowColor = '#00FF41';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    };
    for (var i = 0; i < COUNT; i++) particles.push(new Particle());

    function loop() {
      if (isLight()) { ctx.clearRect(0, 0, canvas.width, canvas.height); return; }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(function (p) { p.step(); p.draw(); });
      requestAnimationFrame(loop);
    }
    loop();

    // 切到浅色时移除画布
    var obs = window.MutationObserver && new MutationObserver(function () {
      if (isLight() && canvas.parentNode) canvas.remove();
      else if (!isLight() && !canvas.parentNode) document.body.appendChild(canvas);
    });
    if (obs) obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  /* ── 5. 系统日志（自动注入到 footer，周期轮换）── */
  function initSystemLog() {
    var logs = [
      '[OK] systemd-networkd.service - Network Configuration',
      '[INFO] appin.site: Server started on 0.0.0.0:443',
      '[WARN] 127.0.0.1 - GET / ./change 200 OK',
      '[OK] nginx.service - High-performance web server',
      '[INFO] kernel: Linux version 6.1.0-appin',
      '[OK] sshd.service - OpenSSH Daemon',
      '[INFO] cron: Running daily backup routine',
      '[OK] docker.service - Container Engine',
      '[INFO] appin: User logged in (pts/0)',
      '[OK] postfix.service - Mail Transport Agent',
      '[WARN] firewall: Allowed incoming on port 443',
      '[INFO] systemd[1]: Started Session 42 of user appin'
    ];

    var bar = document.querySelector('.fx-system-log');
    if (!bar) {
      var footer = document.querySelector('footer, .site-footer');
      if (!footer) return;
      bar = document.createElement('div');
      bar.className = 'fx-system-log';
      bar.setAttribute('aria-hidden', 'true');
      bar.innerHTML = '<span class="log-prompt">$</span><span class="log-msg"></span>';
      footer.appendChild(bar);
    }
    var msg = bar.querySelector('.log-msg') || bar;
    var idx = 0;
    function rotate() {
      msg.textContent = logs[idx % logs.length];
      idx++;
      if (!reduce) {
        msg.style.animation = 'none';
        void msg.offsetHeight; // 回流重播
        msg.style.animation = 'fx-log-slide .5s ease';
      }
    }
    rotate();
    setInterval(rotate, 8000 + Math.random() * 7000);
  }

  /* ── 6. Glitch（周期性故障闪烁 [data-fx-glitch]）── */
  function initGlitch() {
    if (reduce) return;
    var targets = document.querySelectorAll('[data-fx-glitch]');
    targets.forEach(function (el) {
      setInterval(function () {
        el.classList.remove('fx-glitch');
        void el.offsetHeight;
        el.classList.add('fx-glitch');
        setTimeout(function () { el.classList.remove('fx-glitch'); }, 500);
      }, 9000 + Math.random() * 8000);
    });
  }

  /* ── 7. 入场动画（[data-fx-rise] 与 .hero 子元素，错峰）── */
  function initEntrance() {
    if (reduce) return;
    var els = [];
    document.querySelectorAll('[data-fx-rise]').forEach(function (e) { els.push(e); });
    var hero = document.querySelector('.hero');
    if (hero) hero.children.forEach(function (e) { els.push(e); });
    els.forEach(function (el, i) {
      el.classList.add('fx-rise');
      el.style.animationDelay = (i * 90) + 'ms';
    });
  }

  ready(function () {
    initGlow();
    initHeartbeat();
    initRipple();
    initParticles();
    initSystemLog();
    initGlitch();
    initEntrance();
  });
})();
