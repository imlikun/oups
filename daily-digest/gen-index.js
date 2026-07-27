#!/usr/bin/env node
/**
 * gen-index.js — 扫描 daily-digest 源 markdown，从零生成 index.html 列表页。
 * 液态玻璃现代风（与 md2digest.js 单日页视觉一致），不依赖任何 CDN：
 *   - 顶部导航（品牌 + 栏目链接 + 每日阅读 active + 订阅）
 *   - 环境光晕背景
 *   - 最新一期放大的「今日首推」卡片
 *   - 日期横向切换器（近 N 期，最新高亮，可点跳转）
 *   - 下方历史期次玻璃卡列表
 *   - 深色模式（data-theme + prefers-color-scheme + 🌓 切换）
 */
const fs = require('fs');
const path = require('path');

const SRC_DIR = '/Users/likun/WorkBuddy/2026-06-17-16-22-19/daily-digest/';
const OUT_DIR = '/Users/likun/Projects/appin-site/daily-digest/';
const INDEX_PATH = path.join(OUT_DIR, 'index.html');

function mapSection(name) {
  if (/社会|商业/.test(name)) return { label: '社会商业', color: '#2997ff' };
  if (/汽车/.test(name)) return { label: '汽车', color: '#ff9f0a' };
  if (/科技/.test(name)) return { label: '科技', color: '#bf5af2' };
  if (/养老/.test(name)) return { label: '养老产业', color: '#c87a1e' };
  if (/心理/.test(name)) return { label: '心理学', color: '#e54d66' };
  if (/书|好书/.test(name)) return { label: '好书', color: '#2ea043' };
  const clean = name.replace(/[^一-龥a-zA-Z]/g, '');
  return { label: clean || '其他', color: '#888888' };
}

function cleanTitle(t) {
  return t
    .replace(/\*\*/g, '')
    .replace(/[（(]来自[^）)]*[）)]/g, '')
    .replace(/【[^】]*】/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getAccentIndex(date) {
  const d = new Date(date + 'T00:00:00');
  const start = new Date(d.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((d - start) / (1000 * 60 * 60 * 24));
  return dayOfYear % 7;
}

function parseDigest(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const dateMatch = path.basename(filePath).match(/^(\d{4}-\d{2}-\d{2})\.md$/);
  const date = dateMatch ? dateMatch[1] : null;
  if (!date) return null;

  const blocks = content.split(/^##\s+/m).slice(1);
  const sections = [];
  const topHeadlines = [];

  blocks.forEach((block) => {
    const lines = block.split('\n');
    const name = lines[0].trim();
    const body = lines.slice(1).join('\n');
    const m = mapSection(name);
    const count = (body.match(/^\s*(?:\d+\.|###\s*\d+\.)\s/gm) || []).length;
    const fm = body.match(/(?:^\d+\.|###\s*\d+\.)\s+\*\*(.+?)\*\*/m);
    if (fm) topHeadlines.push(cleanTitle(fm[1]));
    sections.push({ label: m.label, color: m.color, count });
  });

  const d = new Date(date + 'T00:00:00');
  const wd = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][d.getDay()];

  const sumMatch = content.match(/^> 今日速览[：:]\s*(.+)$/m);
  const summary = sumMatch ? sumMatch[1].trim() : '';

  return { date, weekday: wd, sections, topHeadlines, summary };
}

// 回退解析：当某日期缺 .md 源、但 OUT_DIR 已有对应单日页 .html 时，从 HTML 提取板块与计数。
function parseHtml(filePath, date) {
  const html = fs.readFileSync(filePath, 'utf8');
  const secRe = /(社会商业|汽车|科技|养老产业|心理学|好书)\s*×(\d+)/g;
  const sections = [];
  let m;
  while ((m = secRe.exec(html))) {
    const mm = mapSection(m[1]);
    sections.push({ label: mm.label, color: mm.color, count: parseInt(m[2], 10) });
  }
  if (sections.length === 0) return null;
  const fm = html.match(/class="news-item"[^>]*>[\s\S]*?<h3><strong>(.*?)<\/strong>/);
  const topHeadlines = fm ? [cleanTitle(fm[1])] : [];
  const d = new Date(date + 'T00:00:00');
  const wd = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][d.getDay()];
  return { date, weekday: wd, sections, topHeadlines, summary: '' };
}

function sectionTagsHtml(sections) {
  return sections
    .map(
      (s) =>
        `<span class="cat-tag" style="background:${s.color}1a;color:${s.color}">${esc(s.label)} ×${s.count}</span>`
    )
    .join('');
}

function featuredHtml(item) {
  const headlines = (item.topHeadlines || []).slice(0, 4)
    .map((h, i) => `<li><span class="hl-num">${i + 1}</span>${esc(h)}</li>`)
    .join('');
  const desc = item.summary
    ? `<p class="feature-desc">${esc(item.summary)}</p>`
    : (item.topHeadlines[0] ? `<p class="feature-desc">${esc(item.topHeadlines[0])}</p>` : '');
  return `    <!-- 最新一期 · 顶部放大 -->
    <article class="pinned-card feature-card">
      <div class="feature-top">
        <span class="pinned-badge">⭐ 今日首推</span>
        <span class="feature-edit">编辑甄选</span>
      </div>
      <div class="feature-tags">
        ${sectionTagsHtml(item.sections)}
      </div>
      <h2 class="feature-title">每日阅读 · ${item.date} <span class="feature-wd">${item.weekday}</span></h2>
${desc}
      <ul class="feature-headlines">${headlines}</ul>
      <a href="${item.date}.html" class="feature-link">阅读本期全文 →</a>
    </article>`;
}

function dateNavHtml(items) {
  const recent = items.slice(0, 10);
  const chips = recent
    .map((it, i) => {
      const mm = it.date.slice(5);
      const active = i === 0 ? ' active' : '';
      return `<a href="${it.date}.html" class="date-chip${active}"><span class="dc-date">${mm}</span><span class="dc-wd">${
        it.weekday
      }</span></a>`;
    })
    .join('');
  return `      <div class="date-nav no-scrollbar">${chips}</div>`;
}

function listHtml(items) {
  const rest = items.slice(1);
  if (rest.length === 0) return '';
  const cards = rest
    .map((it) => {
      const accentIdx = getAccentIndex(it.date);
      const preview =
        (it.topHeadlines || []).slice(0, 2).map((h) => `<div class="li-hl">${esc(h)}</div>`).join('') ||
        '';
      return `      <a href="${it.date}.html" class="list-card reveal accent-${accentIdx}">
        <div class="li-date"><span class="li-date-d">${it.date}</span><span class="li-date-w">${it.weekday}</span></div>
        <div class="li-body">
          <div class="li-tags">${sectionTagsHtml(it.sections)}</div>
          ${preview}
          <div class="li-arrow">阅读全文 →</div>
        </div>
      </a>`;
    })
    .join('\n');
  return cards;
}

function buildPage(items) {
  const latest = items[0];
  const count = items.length;
  const navLinks = [
    { t: '技艺录', h: '/craft/' },
    { t: '随笔', h: '/notes/' },
    { t: '每日阅读', h: '/daily-digest/', active: true },
    { t: 'AI 雷达', h: '/ai-radar/' },
    { t: '视频', h: '/video-lab/' },
  ]
    .map(
      (l) =>
        `<a href="${l.h}"${
          l.active
            ? ' class="nav-link active"'
            : ' class="nav-link" onmouseover="this.style.color=\'var(--appin-foreground)\';this.style.background=\'var(--appin-muted)\'" onmouseout="this.style.color=\'\';this.style.background=\'transparent\'"'
        }>${l.t}</a>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="zh-CN" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>每日阅读 — Appin</title>
<meta name="description" content="社会商业热点、汽车科技动态、养老产业观察、心理学好书推荐——每天一份，最新一期置顶。">
<meta name="theme-color" content="#6366f1">
<link rel="icon" href="/favicon.ico">
<meta property="og:type" content="website">
<meta property="og:title" content="每日阅读 — Appin">
<meta property="og:description" content="社会商业热点、汽车科技动态、养老产业观察、心理学好书推荐——每天一份，最新一期置顶。">
<meta property="og:url" content="https://www.appin.site/daily-digest/">
<meta property="og:site_name" content="Appin.site">
<meta name="twitter:card" content="summary_large_image">
<script>
(function(){try{var t=localStorage.getItem('appin-theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();
</script>
<style>
:root{
  --bg:#f6f7fb; --fg:#0f172a; --muted:#64748b;
  --card:rgba(255,255,255,0.72); --card-border:rgba(99,102,241,0.14);
  --glass-bg:rgba(255,255,255,0.6); --glass-strong:rgba(255,255,255,0.86);
  --glass-shadow:0 8px 32px rgba(15,23,42,0.06); --glass-shadow-hover:0 16px 46px rgba(99,102,241,0.16);
  --glass-border-soft:rgba(99,102,241,0.12);
  --primary:#4f46e5; --primary-500:#6366f1; --primary-700:#4338ca; --primary-50:#eef0ff;
  --radius:16px; --radius-sm:10px;
  --glow-indigo:radial-gradient(circle at center, rgba(99,102,241,0.30), transparent 70%);
  --glow-violet:radial-gradient(circle at center, rgba(139,92,246,0.24), transparent 70%);
  --glow-cyan:radial-gradient(circle at center, rgba(34,211,238,0.18), transparent 70%);
  --font-sans:'Inter','Noto Sans SC','PingFang SC','Microsoft YaHei',system-ui,-apple-system,'Segoe UI',sans-serif;
  --font-mono:'JetBrains Mono','SF Mono','Consolas',ui-monospace,monospace;
}
[data-theme="dark"]{
  --bg:#0b1020; --fg:#e2e8f0; --muted:#94a3b8;
  --card:rgba(30,41,59,0.55); --card-border:rgba(148,163,184,0.16);
  --glass-bg:rgba(30,41,59,0.5); --glass-strong:rgba(30,41,59,0.72);
  --glass-shadow:0 8px 32px rgba(0,0,0,0.35); --glass-shadow-hover:0 16px 46px rgba(99,102,241,0.22);
  --glass-border-soft:rgba(129,140,248,0.18);
  --glow-indigo:radial-gradient(circle at center, rgba(99,102,241,0.22), transparent 70%);
  --glow-violet:radial-gradient(circle at center, rgba(139,92,246,0.18), transparent 70%);
  --glow-cyan:radial-gradient(circle at center, rgba(34,211,238,0.12), transparent 70%);
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --bg:#0b1020; --fg:#e2e8f0; --muted:#94a3b8;
    --card:rgba(30,41,59,0.55); --card-border:rgba(148,163,184,0.16);
    --glass-bg:rgba(30,41,59,0.5); --glass-strong:rgba(30,41,59,0.72);
    --glass-shadow:0 8px 32px rgba(0,0,0,0.35); --glass-shadow-hover:0 16px 46px rgba(99,102,241,0.22);
    --glass-border-soft:rgba(129,140,248,0.18);
    --glow-indigo:radial-gradient(circle at center, rgba(99,102,241,0.22), transparent 70%);
    --glow-violet:radial-gradient(circle at center, rgba(139,92,246,0.18), transparent 70%);
    --glow-cyan:radial-gradient(circle at center, rgba(34,211,238,0.12), transparent 70%);
  }
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{font-family:var(--font-sans);background:var(--bg);color:var(--fg);line-height:1.6;-webkit-font-smoothing:antialiased;position:relative;overflow-x:hidden}
.glow-bg{position:fixed;inset:0;z-index:-1;overflow:hidden;pointer-events:none}
.glow-bg .b1{position:absolute;top:-120px;left:-90px;width:420px;height:420px;border-radius:50%;opacity:.7;filter:blur(70px);background:var(--glow-indigo)}
.glow-bg .b2{position:absolute;top:30%;right:-130px;width:480px;height:480px;border-radius:50%;opacity:.6;filter:blur(80px);background:var(--glow-violet)}
.glow-bg .b3{position:absolute;bottom:-40px;left:20%;width:380px;height:380px;border-radius:50%;opacity:.4;filter:blur(70px);background:var(--glow-cyan)}
.nav{position:sticky;top:0;z-index:50;background:var(--glass-bg);backdrop-filter:blur(20px) saturate(160%);-webkit-backdrop-filter:blur(20px) saturate(160%);border-bottom:1px solid var(--glass-border-soft)}
.nav-inner{max-width:1080px;margin:0 auto;padding:0 20px;height:64px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.nav-brand{display:flex;align-items:center;gap:8px;text-decoration:none;color:var(--fg);font-weight:700;font-size:18px}
.nav-logo{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:10px;color:#fff;font-weight:800;background:linear-gradient(135deg,var(--primary-500),var(--primary-700));box-shadow:0 4px 14px rgba(99,102,241,.35)}
.nav-links{display:none;gap:4px}
@media(min-width:768px){.nav-links{display:flex}}
.nav-link{padding:8px 12px;border-radius:10px;font-size:14px;font-weight:500;text-decoration:none;color:var(--muted);transition:.2s;white-space:nowrap}
.nav-link.active{color:var(--primary);background:var(--primary-50);font-weight:600}
.nav-sub{display:none;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;font-size:14px;font-weight:500;text-decoration:none;color:#fff;background:var(--primary)}
@media(min-width:768px){.nav-sub{display:inline-flex}}
.nav-mobile{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:8px;font-size:12px;font-weight:600;color:var(--primary);background:var(--primary-50)}
@media(min-width:768px){.nav-mobile{display:none}}
.theme-btn{position:fixed;right:18px;bottom:18px;z-index:60;width:44px;height:44px;border-radius:50%;border:1px solid var(--glass-border-soft);background:var(--glass-strong);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);font-size:20px;cursor:pointer;box-shadow:var(--glass-shadow);display:flex;align-items:center;justify-content:center}
.wrap{max-width:1080px;margin:0 auto;padding:0 20px 80px}
.page-head{padding:40px 0 20px}
.head-pill{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:9999px;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;background:var(--primary-50);color:var(--primary-700)}
.head-h1{font-size:clamp(28px,5vw,44px);font-weight:800;letter-spacing:-.02em;margin:14px 0 10px}
.head-desc{color:var(--muted);max-width:640px;font-size:15px}
.head-date{display:inline-flex;align-items:center;gap:6px;margin-top:10px;font-family:var(--font-mono);font-size:13px;color:var(--muted)}
.date-nav{display:flex;gap:8px;overflow-x:auto;padding:18px 0 6px;scrollbar-width:none}
.date-nav::-webkit-scrollbar{display:none}
.date-chip{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 16px;border-radius:12px;text-decoration:none;background:var(--glass-bg);border:1px solid var(--glass-border-soft);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);transition:.2s}
.date-chip .dc-date{font-size:14px;font-weight:700;color:var(--fg)}
.date-chip .dc-wd{font-size:10px;color:var(--muted)}
.date-chip.active{background:var(--primary);border-color:transparent;box-shadow:0 6px 18px rgba(99,102,241,.28)}
.date-chip.active .dc-date,.date-chip.active .dc-wd{color:#fff}
.pinned-card{position:relative;overflow:hidden;border-radius:20px;background:var(--glass-strong);border:1px solid var(--glass-border-soft);backdrop-filter:blur(14px) saturate(160%);-webkit-backdrop-filter:blur(14px) saturate(160%);box-shadow:var(--glass-shadow)}
.pinned-card::before{content:'';position:absolute;top:-45%;right:-18%;width:62%;height:150%;background:radial-gradient(circle at center, rgba(139,92,246,.20), transparent 70%);pointer-events:none;z-index:0}
.pinned-card>*{position:relative;z-index:1}
.feature-card{margin:10px 0 28px;padding:28px}
.feature-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
.pinned-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:9999px;font-size:12px;font-weight:700;color:#fff;background:linear-gradient(135deg,var(--primary-500),#8b5cf6);box-shadow:0 4px 14px rgba(99,102,241,.35);white-space:nowrap}
.feature-edit{font-family:var(--font-mono);font-size:12px;color:var(--muted)}
.feature-tags{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
.cat-tag{display:inline-flex;align-items:center;padding:5px 11px;border-radius:8px;font-size:12px;font-weight:600;white-space:nowrap}
.feature-title{font-size:clamp(22px,3.5vw,30px);font-weight:800;letter-spacing:-.01em;margin-bottom:10px}
.feature-wd{font-size:14px;font-weight:500;color:var(--muted);margin-left:8px}
.feature-desc{color:var(--muted);font-size:15px;line-height:1.7;margin-bottom:14px}
.feature-headlines{list-style:none;display:flex;flex-direction:column;gap:8px;margin-bottom:18px}
.feature-headlines li{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:var(--fg)}
.hl-num{flex:0 0 auto;width:20px;height:20px;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:var(--primary);background:var(--primary-50)}
.feature-link{display:inline-flex;align-items:center;gap:6px;padding:11px 22px;border-radius:12px;font-size:14px;font-weight:600;text-decoration:none;color:#fff;background:var(--primary);transition:.2s}
.feature-link:hover{background:var(--primary-700)}
.section-label{display:flex;align-items:center;gap:12px;margin:8px 0 16px}
.section-label h2{font-size:14px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--fg);white-space:nowrap}
.section-label .line{flex:1;height:1px;background:var(--glass-border-soft)}
.cards{display:flex;flex-direction:column;gap:12px}
.list-card{display:flex;gap:16px;padding:18px 20px;border-radius:16px;text-decoration:none;background:var(--glass-bg);border:1px solid var(--glass-border-soft);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);transition:.2s}
.list-card:hover{box-shadow:var(--glass-shadow-hover);transform:translateY(-2px)}
.li-date{flex:0 0 auto;display:flex;flex-direction:column;gap:2px;padding-right:16px;border-right:1px solid var(--glass-border-soft)}
.li-date-d{font-family:var(--font-mono);font-size:13px;font-weight:600;color:var(--fg)}
.li-date-w{font-size:11px;color:var(--muted)}
.li-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:8px}
.li-tags{display:flex;flex-wrap:wrap;gap:6px}
.li-hl{font-size:13px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.li-arrow{font-size:13px;font-weight:600;color:var(--primary)}
footer{border-top:1px solid var(--glass-border-soft);background:var(--glass-bg);backdrop-filter:blur(16px) saturate(160%);-webkit-backdrop-filter:blur(16px) saturate(160%)}
.foot-inner{max-width:1080px;margin:0 auto;padding:40px 20px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:24px}
.foot-brand{display:flex;align-items:center;gap:10px}
.foot-links{display:flex;flex-wrap:wrap;gap:20px}
.foot-links a{font-size:14px;color:var(--muted);text-decoration:none;transition:.2s}
.foot-links a:hover{color:var(--primary)}
.foot-copy{width:100%;padding-top:24px;margin-top:8px;border-top:1px solid var(--glass-border-soft);font-size:12px;color:var(--muted);display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px}
.no-scrollbar{scrollbar-width:none}.no-scrollbar::-webkit-scrollbar{display:none}
</style>
</head>
<body>
<div class="glow-bg" aria-hidden="true"><div class="b1"></div><div class="b2"></div><div class="b3"></div></div>
<nav class="nav"><div class="nav-inner">
  <a href="/" class="nav-brand"><span class="nav-logo">A</span><span>Appin</span></a>
  <div class="nav-links">${navLinks}</div>
  <a href="/daily-digest/" class="nav-sub">📡 订阅</a>
  <span class="nav-mobile">📡 每日阅读</span>
</div></nav>
<main class="wrap">
  <section class="page-head">
    <span class="head-pill"><span class="dot" style="width:6px;height:6px;border-radius:50%;background:var(--primary-500);display:inline-block"></span>每日阅读 / DAILY DIGEST</span>
    <h1 class="head-h1">每天一份精选</h1>
    <p class="head-desc">社会商业热点、汽车科技动态、养老产业观察、心理学好书——每日阅读，自动汇总。最新一期已置顶。</p>
    <span class="head-date">📅 共 ${count} 期 · 更新于 ${latest.date} ${latest.weekday}</span>
  </section>
  ${dateNavHtml(items)}
  ${featuredHtml(latest)}
  <div class="section-label"><h2>更多期次 / ARCHIVE</h2><div class="line"></div></div>
  <div class="cards">
${listHtml(items)}
  </div>
</main>
<footer><div class="foot-inner">
  <div class="foot-brand"><span class="nav-logo">A</span><div><p style="font-weight:700;color:var(--fg)">Appin</p><p style="font-size:12px;color:var(--muted)">独立开发者 Li Kun 的个人站点</p></div></div>
  <div class="foot-links">${navLinks.replace(/class="nav-link[^"]*"/g, 'class="foot-raw"')}</div>
  <div class="foot-copy"><span>© 2026 appin.site · 用代码与文字记录思考</span><span style="font-family:var(--font-mono)">Built with Liquid Glass</span></div>
</div></footer>
<button class="theme-btn" id="themeToggle" aria-label="切换深色模式">🌓</button>
<script>
(function(){
  var btn=document.getElementById('themeToggle');
  if(!btn)return;
  btn.addEventListener('click',function(){
    var cur=document.documentElement.getAttribute('data-theme');
    var next=cur==='dark'?'light':'dark';
    document.documentElement.setAttribute('data-theme',next);
    try{localStorage.setItem('appin-theme',next);}catch(e){}
  });
})();
</script>
</body>
</html>`;
}

function main() {
  const mdDates = fs
    .readdirSync(SRC_DIR)
    .filter((f) => /^(\d{4}-\d{2}-\d{2})\.md$/.test(f))
    .map((f) => f.replace(/\.md$/, ''));
  const htmlDates = fs
    .readdirSync(OUT_DIR)
    .filter((f) => /^(\d{4}-\d{2}-\d{2})\.html$/.test(f) && f !== 'index.html')
    .map((f) => f.replace(/\.html$/, ''));
  const allDates = Array.from(new Set([...mdDates, ...htmlDates]));

  const items = allDates
    .map((date) => {
      const mdPath = path.join(SRC_DIR, date + '.md');
      if (fs.existsSync(mdPath)) return parseDigest(mdPath);
      const htmlPath = path.join(OUT_DIR, date + '.html');
      if (fs.existsSync(htmlPath)) return parseHtml(htmlPath, date);
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  if (items.length === 0) {
    console.error('❌ 未找到任何 YYYY-MM-DD.md');
    process.exit(1);
  }

  const html = buildPage(items);
  fs.writeFileSync(INDEX_PATH, html, 'utf8');
  console.log(`✅ index.html 已重新生成（${items.length} 期，最新 ${items[0].date} 置顶放大）`);
}

main();
