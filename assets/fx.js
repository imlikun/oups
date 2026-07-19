/* ════════════════════════════════════════════════════════════════
   FX ENGINE · appin.site · 1:1 复刻自 deepseek_html_20260719_c8248f.html
   逐项对应原文件 <script> 的 11 个模块，数值与行为完全一致：
   1 光晕追踪 / 2 网格偏移 / 3 心跳logo / 4 鼠标拖尾 /
   5 背景粒子 / 6 点击涟漪 / 7 系统日志 / 8 ./change 打字机+glitch /
   9 其它 [data-fx-glitch] / 10 终端模拟器
   仅保留 prefers-reduced-motion 兜底（不改变正常观感）
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(s) {
    return String(s).replace(/[&<>]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c];
    });
  }

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
    if (reduce) return;
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
    logos.forEach(function (logo) {
      if (logo.querySelector('.heartbeat-dot')) return;
      var dot = document.createElement('span');
      dot.className = 'heartbeat-dot';
      dot.setAttribute('aria-hidden', 'true');
      logo.insertBefore(dot, logo.firstChild);
    });
  }

  /* ── 4. 鼠标拖尾（蓝本：MAX_POINT_S=25 / alpha .05–.35 / r 1.5–3 / blur 12）── */
  function initTrail() {
    if (reduce) return;
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
    if (reduce) return;
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
    if (reduce) return;
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

  /* ── 7. 系统日志（蓝本：每 8000+random*7000 轮换）── */
  function initSystemLog() {
    var logs = [
      '[OK] systemd-networkd.service - Network Configuration',
      '[INFO] appin.site: Server started on 0.0.0.0:443',
      '[WARN] 127.0.0.1 - GET /./change 200 OK',
      '[OK] nginx.service - High-performance web server',
      '[INFO] kernel: Linux version 6.1.0-rc5',
      '[OK] sshd.service - OpenSSH Daemon',
      '[INFO] cron: Running daily backup routine',
      '[OK] docker.service - Docker Container Engine',
      '[INFO] appin: User logged in (pts/0)',
      '[OK] postfix.service - Mail Transport Agent',
      '[WARN] firewall: Allowed incoming traffic on port 443',
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
    var logIndex = 0;
    function rotateLog() {
      msg.textContent = logs[logIndex % logs.length];
      if (!reduce) {
        msg.style.animation = 'none';
        void msg.offsetHeight;
        msg.style.animation = 'fx-log-slide 0.5s ease';
      }
      logIndex++;
    }
    setInterval(rotateLog, 8000 + Math.random() * 7000);
    rotateLog();
  }

  /* ── 8. ./change 打字机 + 周期性 glitch（蓝本：#slogan-text 打 './change'，120ms；打完每 10000+random*8000 触发 glitch）── */
  function initTypewriter() {
    var el = document.getElementById('slogan-text');
    if (!el) return;
    if (reduce) { el.textContent = './change'; return; }
    var sloganText = './change';
    var typeInterval = null;
    var currentCharIndex = 0;

    function typeSlogan() {
      if (typeInterval) { clearInterval(typeInterval); typeInterval = null; }
      el.textContent = '';
      currentCharIndex = 0;
      typeInterval = setInterval(function () {
        if (currentCharIndex < sloganText.length) {
          el.textContent += sloganText.charAt(currentCharIndex);
          currentCharIndex++;
        } else {
          clearInterval(typeInterval);
          typeInterval = null;
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
    typeSlogan();
  }

  /* ── 9. 其它 [data-fx-glitch] 元素，周期闪烁 ── */
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

  /* ── 10. 终端模拟器（蓝本：help / whoami / ./change / date / echo / clear）── */
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
    function appendTerminal(text, isOutput) {
      var line = document.createElement('div');
      line.style.fontFamily = 'var(--font-mono)';
      line.style.fontSize = '13px';
      line.style.padding = '2px 0';
      if (isOutput) {
        line.innerHTML = '<span style="color:var(--accent-green)">→</span> ' + text;
      } else {
        line.innerHTML = '<span style="color:var(--text-secondary)">&gt;</span> ' + text;
      }
      out.appendChild(line);
      out.scrollTop = out.scrollHeight;
      while (out.children.length > 50) out.removeChild(out.firstChild);
    }
    input.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var cmd = input.value.trim();
      input.value = '';
      if (!cmd) return;
      appendTerminal(cmd, false);
      var lower = cmd.toLowerCase();
      var reply;
      if (lower === 'help') {
        reply = '可用命令: <span style="color:var(--accent-cyan)">whoami</span>, <span style="color:var(--accent-cyan)">date</span>, <span style="color:var(--accent-cyan)">./change</span>, <span style="color:var(--accent-cyan)">clear</span>, <span style="color:var(--accent-cyan)">echo &lt;text&gt;</span>';
      } else if (lower === 'whoami') {
        reply = '你是 appin，一个用代码改变世界的极客。';
      } else if (lower === './change') {
        reply = '正在执行变革... 请稍候 (其实已经改变了)。';
      } else if (lower === 'date') {
        reply = new Date().toString();
      } else if (lower === 'clear') {
        out.innerHTML = '';
        return;
      } else if (lower.indexOf('echo ') === 0) {
        reply = cmd.slice(5);
      } else {
        reply = '命令 "<span style="color:var(--accent-cyan)">' + esc(cmd) + '</span>" 未找到，输入 <span style="color:var(--accent-cyan)">help</span> 查看帮助。';
      }
      appendTerminal(reply, true);
    });
    box.addEventListener('click', function () { input.focus(); });
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
    initSystemLog();
    initTypewriter();
    initGlitch();
    initTerminal();
  });
})();
