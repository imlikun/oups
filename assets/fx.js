/* ════════════════════════════════════════════════════════════════
   FX ENGINE · appin.site 全局动效引擎（提取自 deepseek c38eba / c8248f 蓝本）
   鼠标光晕 / 网格偏移 / 心跳 logo / 拖尾 / 点击涟漪 / 背景粒子 /
   系统日志 / glitch / 入场 / 页面切换 / 打字机 / 终端模拟器
   全部尊重 prefers-reduced-motion
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isLight = function () {
    return document.body.classList.contains('light');
  };
  function esc(s) {
    return String(s).replace(/[&<>]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c];
    });
  }

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

  /* ── 2. 动态网格偏移（写 --grid-offset）── */
  function initGrid() {
    var grid = document.createElement('div');
    grid.className = 'fx-grid';
    grid.setAttribute('aria-hidden', 'true');
    document.body.appendChild(grid);
    if (reduce) return;
    var root = document.documentElement;
    window.addEventListener('mousemove', function (e) {
      var x = (e.clientX / window.innerWidth - 0.5) * 12;
      var y = (e.clientY / window.innerHeight - 0.5) * 12;
      root.style.setProperty('--grid-offset', x.toFixed(1) + 'px, ' + y.toFixed(1) + 'px');
    }, { passive: true });
  }

  /* ── 3. 心跳指示灯（注入到 .logo）── */
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

  /* ── 4. 鼠标拖尾光点 ── */
  function initTrail() {
    if (reduce) return;
    var canvas = document.createElement('canvas');
    canvas.id = 'fx-trail';
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var pts = [];
    var MAX = 36;
    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    window.addEventListener('resize', resize);
    resize();
    window.addEventListener('mousemove', function (e) {
      pts.push({ x: e.clientX, y: e.clientY });
      if (pts.length > MAX) pts.shift();
    }, { passive: true });
    document.addEventListener('mouseleave', function () { pts = []; ctx.clearRect(0, 0, canvas.width, canvas.height); });
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var n = pts.length;
      for (var i = 0; i < n; i++) {
        var a = (i / n) * 0.65 + 0.08;
        var r = 2.5 + (i / n) * 4;
        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,255,65,' + a + ')';
        ctx.shadowColor = '#00FF41';
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      requestAnimationFrame(draw);
    }
    draw();
  }

  /* ── 5. 点击涟漪 ── */
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

  /* ── 6. 背景粒子（仅暗色 + 非 reduce）── */
  function initParticles() {
    if (reduce) return;
    if (isLight()) return; // 浅色主题下不可见，跳过以省性能

    var canvas = document.createElement('canvas');
    canvas.id = 'fx-particles';
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var particles = [];
    var COUNT = 40;

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
      this.size = Math.random() * 2.6 + 1.4;
      this.sx = (Math.random() - 0.5) * 0.5;
      this.sy = (Math.random() - 0.5) * 0.5;
      this.op = Math.random() * 0.4 + 0.3;
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
      ctx.shadowBlur = 16;
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

  /* ── 7. 系统日志（自动注入到 footer，周期轮换）── */
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

  /* ── 8. Glitch（周期性故障闪烁 [data-fx-glitch]）── */
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

  /* ── 9. 入场动画（[data-fx-rise] 与 .hero 子元素，错峰）── */
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

  /* ── 10. 页面切换：内容上浮 + 淡入 + 缩放（每次加载即入场）── */
  function initPageEnter() {
    if (reduce) return;
    var nodes = document.querySelectorAll(
      'body > main, body > .container, body > .page, body > section, body > footer, body > .site-footer'
    );
    if (!nodes.length) {
      var alt = document.querySelector('main, .page, .container, section, footer');
      if (alt) nodes = [alt];
    }
    nodes.forEach(function (n) { n.classList.add('fx-page-enter'); });
  }

  /* ── 11. 打字机（[data-fx-typewriter]，文本来自 data-text）── */
  function initTypewriter() {
    var els = document.querySelectorAll('[data-fx-typewriter]');
    els.forEach(function (el) {
      var text = el.getAttribute('data-text') || el.textContent;
      if (reduce) { el.textContent = text; return; }
      el.textContent = '';
      var i = 0;
      function tick() {
        if (i <= text.length) {
          el.textContent = text.slice(0, i);
          i++;
          setTimeout(tick, 120);
        }
      }
      setTimeout(tick, 700);
    });
  }

  /* ── 12. 终端模拟器（注入 footer，支持 help/whoami/date/./change/echo/clear）── */
  function initTerminal() {
    var footer = document.querySelector('footer, .site-footer');
    if (!footer) return;
    var box = document.createElement('div');
    box.className = 'fx-terminal';
    box.setAttribute('aria-hidden', 'true');
    box.innerHTML =
      '<div class="fx-terminal-output">&gt; 欢迎来到 appin 终端，输入 <span style="color:var(--accent-cyan)">help</span> 查看命令。</div>' +
      '<div class="fx-terminal-input-row"><span class="prompt">$</span>' +
      '<input class="fx-terminal-input" type="text" placeholder="输入命令..." autocomplete="off" spellcheck="false"></div>';
    var sl = footer.querySelector('.fx-system-log');
    if (sl) sl.after(box); else footer.appendChild(box);

    var input = box.querySelector('.fx-terminal-input');
    var out = box.querySelector('.fx-terminal-output');
    function append(text, isOut) {
      var line = document.createElement('div');
      line.className = 'line';
      line.innerHTML = isOut
        ? '<span style="color:var(--accent-green)">→</span> ' + text
        : '<span style="color:var(--fg-muted)">&gt;</span> ' + text;
      out.appendChild(line);
      out.scrollTop = out.scrollHeight;
      while (out.children.length > 50) out.removeChild(out.firstChild);
    }
    input.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var cmd = input.value.trim();
      input.value = '';
      if (!cmd) return;
      append(esc(cmd), false);
      var lower = cmd.toLowerCase();
      var reply;
      if (lower === 'help') {
        reply = '可用命令: <span style="color:var(--accent-cyan)">whoami</span>, <span style="color:var(--accent-cyan)">date</span>, <span style="color:var(--accent-cyan)">./change</span>, <span style="color:var(--accent-cyan)">echo &lt;text&gt;</span>, <span style="color:var(--accent-cyan)">clear</span>';
      } else if (lower === 'whoami') {
        reply = '你是 appin，一个用代码改变世界的极客。';
      } else if (lower === './change') {
        reply = '正在执行变革... 其实已经改变了。';
      } else if (lower === 'date') {
        reply = esc(new Date().toString());
      } else if (lower === 'clear') {
        out.innerHTML = '';
        return;
      } else if (lower.indexOf('echo ') === 0) {
        reply = esc(cmd.slice(5));
      } else {
        reply = '命令 "<span style="color:var(--accent-cyan)">' + esc(cmd) + '</span>" 未找到，输入 <span style="color:var(--accent-cyan)">help</span> 查看帮助。';
      }
      append(reply, true);
    });
    box.addEventListener('click', function () { input.focus(); });
  }

  ready(function () {
    initGlow();
    initGrid();
    initHeartbeat();
    initTrail();
    initRipple();
    initParticles();
    initSystemLog();
    initGlitch();
    initEntrance();
    initPageEnter();
    initTypewriter();
    initTerminal();
  });
})();
