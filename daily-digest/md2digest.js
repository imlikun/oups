const fs = require('fs');
const path = require('path');

// ---- Markdown parser (lightweight) ----
function parseDigest(md) {
  // Decode HTML entities (IMA sometimes stores chars as &#xHH; / &#DD;)
  md = md.replace(/&#x([0-9a-fA-F]+);/g, (m,h)=>{try{return String.fromCharCode(parseInt(h,16));}catch(e){return m;}})
         .replace(/&#(\d+);/g, (m,d)=>{try{return String.fromCharCode(parseInt(d,10));}catch(e){return m;}});
  const lines = md.split('\n');
  const result = { title: '', date: '', meta: '', sections: [] };
  let currentSection = null;
  
  // Parse header
  let i = 0;
  for (; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('# ')) {
      result.title = line.replace('# ', '').replace(/【WB】/, '').trim();
    } else if (line.startsWith('> ')) {
      result.meta += line.replace('> ', '') + '\n';
    } else if (line === '---' && i > 3) {
      i++; break;
    } else if (line.match(/^##\s+/)) {
      // No --- separator found; section heading marks end of header
      break;
    }
  }
  
  // Extract date from title
  const dateMatch = result.title.match(/(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) result.date = dateMatch[1];
  
  // Parse sections
  currentSection = { title: '', items: [], type: 'news' };
  for (; i < lines.length; i++) {
    const line = lines[i];
    
    // Section heading
    const secMatch = line.match(/^##\s+(.+)/);
    if (secMatch) {
      if (currentSection.items.length > 0 || currentSection.title) {
        if (currentSection._book && currentSection._book.title) currentSection.items.push(currentSection._book);
        result.sections.push(currentSection);
      }
      const secTitle = secMatch[1].trim();
      currentSection = { 
        title: secTitle, 
        items: [], 
        type: secTitle.includes('好书') ? 'book' : 'news',
        typeLabel: secTitle.includes('社会') ? 'social' : 
                  secTitle.includes('汽车') ? 'auto' :
                  secTitle.includes('科技') ? 'tech' :
                  secTitle.includes('养老') ? 'elderly' :
                  secTitle.includes('心理') ? 'psych' : 'book'
      };
      continue;
    }
    
    // Book section handling — placed before news because the legacy book
    // format `1. **《x》**— author` also matches the news regex.
    if (currentSection.type === 'book' || line.match(/^###\s+\d+\.\s+/)) {
      const bookNew = line.match(/^###\s+(\d+)\.\s+(.+)$/);
      const bookOld = line.match(/^(\d+)\.\s+\*\*(.+?)\*\*[—–-]\s*(.*)$/);
      if (bookNew || bookOld) {
        if (currentSection._book && currentSection._book.title) currentSection.items.push(currentSection._book);
        let num, title, author = '';
        if (bookNew) {
          num = parseInt(bookNew[1]);
          // Extract title and author from `### 1. 《title》｜ author` format
          const rawTitleAuthor = bookNew[2].trim().replace(/^\*\*|\*\*$/g, '');
          const splitMatch = rawTitleAuthor.match(/^(.+?)[｜|]\s*(.+)$/);
          if (splitMatch) {
            title = splitMatch[1].trim();
            author = splitMatch[2].trim();
          } else {
            title = rawTitleAuthor;
          }
        } else {
          num = parseInt(bookOld[1]);
          title = bookOld[2].trim();
          author = bookOld[3].trim();
        }
        currentSection._book = { num, title, author, doubanScore:'', wereadScore:'', wereadCount:'', doubanCount:'', desc:'', link:'', highlights:[] };
        continue;
      }
      if (currentSection._book && currentSection._book.title) {
        const cl = line.trim();
        if (!cl) continue;
        // Highlight / 金句:  > "text"（N人划线） or  - > "text"（N人划线）
        const hl = cl.match(/^>?\s*"?(.+?)"?\s*[（(](\d+)\s*人划线?[）)]$/);
        if (hl && (cl.startsWith('>') || cl.startsWith('- >'))) {
          currentSection._book.highlights.push({ text: hl[1].replace(/^["'"]|["'"]$/g, '').trim(), count: parseInt(hl[2]) });
          continue;
        }
        const mdLink = cl.match(/\[[^\]]*\]\((https?:\/\/[^\)]+)\)/);
        if (mdLink) { currentSection._book.link = mdLink[1]; continue; }
        if (cl.match(/^https?:\/\/\S+$/)) { currentSection._book.link = cl; continue; }
        const liStar = cl.match(/^\*\s+\*\*(.+?)\*\*[：:]\s*(.+)$/);
        const liDash = cl.match(/^-\s+(.+?)[：:]\s*\*\*(.+?)\*\*/);
        if (liStar) { applyBookField(currentSection._book, liStar[1], liStar[2]); continue; }
        if (liDash) { applyBookField(currentSection._book, liDash[1], liDash[2]); continue; }
        if (cl.length > 6 && !cl.startsWith('-') && !cl.startsWith('*') && !cl.startsWith('>')) {
          currentSection._book.desc = (currentSection._book.desc ? currentSection._book.desc + ' ' : '') + cl;
          continue;
        }
        continue;
      }
      continue;
    }

    // News item
    const newsMatch = line.match(/^(\d+)\.\s+\*\*(.+?)\*\*\s*(.*)$/);
    if (newsMatch && currentSection.type === 'news') {
      const item = {
        num: parseInt(newsMatch[1]),
        title: newsMatch[2].trim(),
        sourceTag: '',
        summary: '',
        link: ''
      };

      // 处理同一行剩余部分（兼容格式B：标题（来源）— 摘要 → [阅读原文](url) 全在一行）
      let restInline = newsMatch[3];
      const srcMatch = restInline.match(/（((?:来自[^）]*|[^）]*来源)）)/);
      if (srcMatch) { item.sourceTag = srcMatch[1].trim(); restInline = restInline.replace(srcMatch[0], ' '); }
      const inlineMd = restInline.match(/\[[^\]]*\]\((https?:\/\/[^\)]+)\)/);
      if (inlineMd) { item.link = inlineMd[1]; restInline = restInline.replace(inlineMd[0], ' '); }
      const inlineEmb = restInline.match(/[（(](https?:\/\/[^）)]+)[）)]/);
      if (!item.link && inlineEmb && /阅读原文|打开阅读|查看原文|来源/.test(restInline)) { item.link = inlineEmb[1]; restInline = restInline.replace(inlineEmb[0], ' '); }
      restInline = restInline.replace(/[｜|]\s*→\s*$/, '').replace(/\s*→\s*$/, '').replace(/^\s*[—–\-|｜]\s*/, '').trim();
      if (restInline && !/^[\|\s]*$/.test(restInline)) item.summary = restInline;

      // Next non-empty lines are summary + link (兼容格式A：摘要与链接各自独立成行)
      i++;
      while (i < lines.length) {
        const contentLine = lines[i].trim();
        if (!contentLine) { i++; continue; }
        if (contentLine.match(/^(\d+)\.\s+\*\*|^##\s|^###\s/)) break;

        // Markdown link [text](url)
        const mdLink = contentLine.match(/\[[^\]]*\]\((https?:\/\/[^\)]+)\)/);
        if (mdLink) {
          item.link = mdLink[1];
          const rest = contentLine.replace(mdLink[0], '').replace(/^\s*[\|｜]\s*/, '').replace(/作者[：:]\s*\S+\s*[\|｜]?/, '').trim();
          if (rest && !/^[\|\s]*$/.test(rest)) item.summary = (item.summary ? item.summary + ' ' : '') + rest;
          i++; continue;
        }
        // Raw url line
        if (contentLine.match(/^https?:\/\/\S+$/)) {
          item.link = contentLine; i++; continue;
        }
        // Pattern: 来源：https://...  or 来源：http://...
        const sourceUrl = contentLine.match(/来源[：:]\s*(https?:\/\/\S+)/);
        if (sourceUrl) {
          item.link = sourceUrl[1];
          const rest = contentLine.replace(sourceUrl[0], '').trim();
          if (rest && !/^[\|\s]*$/.test(rest)) item.summary = (item.summary ? item.summary + ' ' : '') + rest;
          i++; continue;
        }
        // Embedded url with keyword
        const embLink = contentLine.match(/\((https?:\/\/[^\)]+)\)/);
        if (embLink && /阅读原文|打开阅读|查看原文|来源/.test(contentLine)) {
          item.link = embLink[1]; i++; continue;
        }
        if (contentLine.length > 4) item.summary = (item.summary ? item.summary + ' ' : '') + contentLine;
        i++;
      }
      i--;

      if (item.title || item.summary) currentSection.items.push(item);
      continue;
    }
  }
  
  if (currentSection && (currentSection.items.length > 0 || currentSection.title)) {
    if (currentSection._book && currentSection._book.title) currentSection.items.push(currentSection._book);
    result.sections.push(currentSection);
  }
  
  return result;
}

// ---- Book field helper ----
function applyBookField(book, key, val) {
  val = val.trim();
  if (/作者/.test(key)) {
    book.author = val.replace(/^：|:/, '').trim();
  } else if (/微信读书/.test(key)) {
    const sc = val.match(/(\d+\.?\d*)\s*分?/); if (sc) book.wereadScore = sc[1];
    const cnt = val.match(/(\d+)\s*人评价/); if (cnt) book.wereadCount = cnt[1];
  } else if (/豆瓣/.test(key)) {
    const sc = val.match(/(\d+\.?\d*)/); if (sc) book.doubanScore = sc[1];
    const cnt = val.match(/(\d+)\s*人评价/); if (cnt) book.doubanCount = cnt[1];
  } else if (/简介/.test(key)) {
    book.desc = val;
  } else if (/打开阅读|阅读原文/.test(key)) {
    const u = val.match(/\(?(https?:\/\/[^)\s]+)\)?/); if (u) book.link = u[1];
  }
}

// ---- Source tag detector ----
function detectSourceTag(title, summary) {
  const text = title + ' ' + summary;
  if (text.includes('虎嗅')) return 'src-huxiu';
  if (text.includes('36氪')) return 'src-36kr';
  if (text.includes('钛媒体')) return 'src-tmtpost';
  if (text.includes('极客公园')) return 'src-geekpark';
  return 'src-other';
}

function getSourceLabel(tag) {
  const map = { 'src-huxiu':'虎嗅', 'src-36kr':'36氪', 'src-tmtpost':'钛媒体', 'src-geekpark':'极客公园' };
  return map[tag] || '来源';
}

// Prefer the parsed （来自X） tag; fall back to keyword detection on title+summary
function resolveSource(item) {
  let label = '', cls = 'src-other';
  if (item.sourceTag) {
    const raw = item.sourceTag.replace(/[（）]/g, '').replace(/来自/g, '').trim();
    label = raw;
    if (raw.includes('虎嗅')) cls = 'src-huxiu';
    else if (raw.includes('36氪')) cls = 'src-36kr';
    else if (raw.includes('钛媒体')) cls = 'src-tmtpost';
    else if (raw.includes('极客公园')) cls = 'src-geekpark';
  } else {
    const st = detectSourceTag(item.title, item.summary);
    label = getSourceLabel(st);
    cls = st;
  }
  return { label, cls };
}

// ---- Color config by section type (Liquid Glass palette) ----
const sectionConfig = {
  social:  { icon:'📰', color:'#2997ff', bg:'rgba(41,151,255,0.10)', grad:'linear-gradient(135deg,#2997ff,#5ac8fa)' },
  auto:    { icon:'🚗', color:'#f59e0b', bg:'rgba(245,158,11,0.10)', grad:'linear-gradient(135deg,#f59e0b,#f97316)' },
  tech:    { icon:'🔬', color:'#8b5cf6', bg:'rgba(139,92,246,0.10)', grad:'linear-gradient(135deg,#8b5cf6,#a855f7)' },
  elderly: { icon:'🏠', color:'#10b981', bg:'rgba(16,185,129,0.10)', grad:'linear-gradient(135deg,#10b981,#14b8a6)' },
  psych:   { icon:'🧠', color:'#ec4899', bg:'rgba(236,72,153,0.10)', grad:'linear-gradient(135deg,#ec4899,#f43f5e)' },
  book:    { icon:'📚', color:'#14b8a6', bg:'rgba(20,184,166,0.10)', grad:'linear-gradient(135deg,#14b8a6,#06b6d4)' }
};

const LABELS = { social:'社会商业', auto:'汽车', tech:'科技', elderly:'养老产业', psych:'心理学', book:'好书' };

// ---- Weekday helper ----
function getWeekday(dateStr) {
  const days = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
  const d = new Date(dateStr);
  return days[d.getDay()];
}

// ---- Total items counter ----
function countItems(sections) {
  return sections.reduce((sum, s) => sum + s.items.length, 0);
}

// ---- Generate HTML ----
function generateHTML(data, outputPath, allDates) {
  const weekday = getWeekday(data.date);
  const totalItems = countItems(data.sections);
  const subtitle = (data.meta || '').replace(/\n+/g, ' ').trim();

  // Hero: first news item of the first section
  let heroItem = null, heroType = 'social';
  const sections = data.sections;
  if (sections[0] && sections[0].type === 'news' && sections[0].items.length) {
    heroType = sections[0].typeLabel;
    heroItem = sections[0].items.shift();
  }
  const sectionsForRender = sections.filter(s => s.items.length > 0);

  // Header chips
  const chips = data.sections.map(s => {
    const cfg = sectionConfig[s.typeLabel] || sectionConfig.book;
    return `<span class="chip" style="background:${cfg.bg};color:${cfg.color}"><span class="chip-dot" style="background:${cfg.color}"></span>${LABELS[s.typeLabel]||s.title} · ${s.items.length}</span>`;
  }).join('');

  // Date navigator (latest 8)
  const dateNav = allDates.slice(0, 8).map(d => {
    const active = d === data.date;
    const wd = getWeekday(d).replace('星期', '');
    const md = d.slice(5).replace('-', '.');
    return `<a href="${d}.html" class="date-pill${active?' active':''}"><span class="dp-day">${md}</span><span class="dp-wd">${wd}</span></a>`;
  }).join('');

  // Hero
  let heroHtml = '';
  if (heroItem) {
    const cfg = sectionConfig[heroType] || sectionConfig.social;
    const srcInfo = resolveSource(heroItem);
    const srcTag = srcInfo.label ? `<span class="src-tag ${srcInfo.cls}">${srcInfo.label}</span>` : '';
    heroHtml = `
    <section class="hero-wrap">
      <article class="hero-card pinned-card">
        <div class="hero-top">
          <span class="hero-badge">⭐ 今日首推</span>
          <span class="hero-edit">编辑甄选</span>
        </div>
        <div class="hero-tags">
          <span class="cat-tag" style="background:${cfg.bg};color:${cfg.color}">${LABELS[heroType]||'热点'}</span>
          ${srcTag ? `<span class="src-line">🌐 来源：${srcInfo.label}</span>` : ''}
        </div>
        <h2 class="hero-title">${heroItem.title}</h2>
        ${heroItem.summary ? `<p class="hero-sum">${heroItem.summary}</p>` : ''}
        ${heroItem.link ? `<a href="${heroItem.link}" target="_blank" rel="noopener" class="hero-link">查看原文 →</a>` : ''}
      </article>
    </section>`;
  }

  // Sections
  const sectionsHtml = sectionsForRender.map(section => {
    const cfg = sectionConfig[section.typeLabel] || sectionConfig.book;
    const label = LABELS[section.typeLabel] || section.title;

    if (section.type === 'book') {
      const items = section.items.map(book => {
        const ratings = [];
        if (book.doubanScore) ratings.push(`<span class="rating r-douban">豆瓣 <b>${book.doubanScore}</b>${book.doubanCount?` <i>${book.doubanCount}人</i>`:''}</span>`);
        if (book.wereadScore) ratings.push(`<span class="rating r-weread">微信读书 <b>${book.wereadScore}</b>${book.wereadCount?` <i>${book.wereadCount}人</i>`:''}</span>`);
        const quotes = (book.highlights && book.highlights.length) ? `
        <div class="quotes">
          <div class="quotes-label">✨ 读者金句</div>
          ${book.highlights.map(h=>`<blockquote class="quote"><p>${h.text}</p><span class="qcount">${h.count}人划线</span></blockquote>`).join('')}
        </div>` : '';
        return `
        <article class="card book-card">
          <div class="book-cover" style="background:${cfg.grad}">
            <span class="bc-num">${book.num}</span>
            <span class="bc-icon">📖</span>
          </div>
          <div class="book-main">
            <h3 class="book-title"><em>${book.title}</em>${book.author?` <span class="book-author">— ${book.author}</span>`:''}</h3>
            ${ratings.length?`<div class="book-ratings">${ratings.join('')}</div>`:''}
            ${book.desc?`<p class="book-desc">${book.desc}</p>`:''}
            ${book.link?`<a href="${book.link}" target="_blank" rel="noopener" class="book-link">📖 打开阅读</a>`:''}
            ${quotes}
          </div>
        </article>`;
      }).join('');
      return `
    <section class="block">
      <div class="block-head"><span class="block-icon" style="background:${cfg.bg};color:${cfg.color}">${cfg.icon}</span><h2 class="block-title" style="color:${cfg.color}">${section.title}</h2><span class="block-count">${section.items.length}</span></div>
      <div class="book-list">${items}</div>
    </section>`;
    }

    // News
    const items = section.items.map(item => {
      const srcInfo = resolveSource(item);
      const srcTag = srcInfo.label ? `<span class="src-tag ${srcInfo.cls}">${srcInfo.label}</span>` : '';
      const linkText = srcInfo.label && srcInfo.cls !== 'src-other' ? `🌐 来源：${srcInfo.label} →` : '🌐 查看原文 →';
      return `
      <article class="card news-card" style="--accent:${cfg.color}">
        <div class="news-cover" style="background:${cfg.grad}"><span class="nc-icon">${cfg.icon}</span></div>
        <div class="news-body">
          <div class="news-top">
            <span class="cat-tag" style="background:${cfg.bg};color:${cfg.color}">${LABELS[section.typeLabel]||section.title}</span>
            ${srcTag}
          </div>
          <h3 class="news-title"><strong>${item.title}</strong></h3>
          ${item.summary?`<p class="news-sum">${item.summary}</p>`:''}
          <div class="news-foot">
            ${item.link?`<a href="${item.link}" target="_blank" rel="noopener" class="news-link">${linkText}</a>`:''}
          </div>
        </div>
      </article>`;
    }).join('');
    return `
    <section class="block">
      <div class="block-head"><span class="block-icon" style="background:${cfg.bg};color:${cfg.color}">${cfg.icon}</span><h2 class="block-title" style="color:${cfg.color}">${section.title}</h2><span class="block-count">${section.items.length}</span></div>
      <div class="news-list">${items}</div>
    </section>`;
  }).join('\n');

  // Prev/next
  const idx = allDates.indexOf(data.date);
  const prevDate = idx < allDates.length - 1 ? allDates[idx+1] : null;
  const nextDate = idx > 0 ? allDates[idx-1] : null;

  const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const descTitle = (heroItem && heroItem.title) ? heroItem.title : (data.sections[0]?.items[0]?.title || '每日阅读');

  const html = `<!DOCTYPE html>
<html lang="zh-CN" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>每日阅读 | ${data.date} — Appin</title>
<meta name="description" content="${esc(descTitle)}——${data.date}阅读简报。">
<meta name="theme-color" content="#6366f1">
<script>
(function(){try{var t=localStorage.getItem('appin-theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();
</script>
<style>
:root{
  --bg:#f6f7fb;
  --fg:#0f172a;
  --muted:#64748b;
  --card:rgba(255,255,255,0.72);
  --card-border:rgba(99,102,241,0.14);
  --glass-bg:rgba(255,255,255,0.6);
  --glass-strong:rgba(255,255,255,0.86);
  --glass-shadow:0 8px 32px rgba(15,23,42,0.06);
  --glass-shadow-hover:0 16px 46px rgba(99,102,241,0.16);
  --glass-border-soft:rgba(99,102,241,0.12);
  --primary:#4f46e5;
  --primary-500:#6366f1;
  --primary-700:#4338ca;
  --primary-50:#eef0ff;
  --radius:16px;
  --radius-sm:10px;
  --glow-indigo:radial-gradient(circle at center, rgba(99,102,241,0.30), transparent 70%);
  --glow-violet:radial-gradient(circle at center, rgba(139,92,246,0.24), transparent 70%);
  --glow-cyan:radial-gradient(circle at center, rgba(34,211,238,0.18), transparent 70%);
  --font-sans:'Inter','Noto Sans SC','PingFang SC','Microsoft YaHei',system-ui,-apple-system,'Segoe UI',sans-serif;
  --font-mono:'JetBrains Mono','SF Mono','Consolas',ui-monospace,monospace;
}
[data-theme="dark"]{
  --bg:#0b1020;
  --fg:#e2e8f0;
  --muted:#94a3b8;
  --card:rgba(30,41,59,0.55);
  --card-border:rgba(148,163,184,0.16);
  --glass-bg:rgba(30,41,59,0.5);
  --glass-strong:rgba(30,41,59,0.72);
  --glass-shadow:0 8px 32px rgba(0,0,0,0.35);
  --glass-shadow-hover:0 16px 46px rgba(99,102,241,0.22);
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
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:var(--font-sans);background:var(--bg);color:var(--fg);line-height:1.7;-webkit-font-smoothing:antialiased;transition:background .3s,color .3s;position:relative;z-index:0;min-height:100vh}
a{color:inherit;text-decoration:none}
.glow-bg{position:fixed;inset:0;z-index:-1;overflow:hidden;pointer-events:none}
.glow-bg .b1{position:absolute;top:-120px;left:-90px;width:420px;height:420px;border-radius:50%;opacity:.7;filter:blur(70px);background:var(--glow-indigo)}
.glow-bg .b2{position:absolute;top:30%;right:-130px;width:480px;height:480px;border-radius:50%;opacity:.6;filter:blur(80px);background:var(--glow-violet)}
.glow-bg .b3{position:absolute;bottom:-60px;left:18%;width:380px;height:380px;border-radius:50%;opacity:.45;filter:blur(70px);background:var(--glow-cyan)}
.app-wrap{position:relative;z-index:1}

/* Nav */
.nav{position:sticky;top:0;z-index:50;width:100%;border-bottom:1px solid var(--glass-border-soft);background:var(--glass-bg);backdrop-filter:blur(20px) saturate(160%);-webkit-backdrop-filter:blur(20px) saturate(160%)}
.nav-inner{max-width:1040px;margin:0 auto;padding:0 20px;height:62px;display:flex;align-items:center;justify-content:space-between;gap:12px}
.brand{display:flex;align-items:center;gap:9px;font-weight:800;font-size:17px;letter-spacing:-.3px}
.brand .logo{width:34px;height:34px;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:15px;background:linear-gradient(135deg,var(--primary-500),var(--primary-700));box-shadow:0 4px 14px rgba(79,70,229,.35)}
.nav-links{display:none;align-items:center;gap:2px}
.nav-links a{padding:8px 13px;border-radius:10px;font-size:13.5px;font-weight:500;color:var(--muted);transition:.2s;white-space:nowrap}
.nav-links a:hover{color:var(--fg);background:var(--glass-bg)}
.nav-links a.active{color:var(--primary);background:var(--primary-50);font-weight:600}
.nav-right{display:flex;align-items:center;gap:8px}
.nav-pill{display:inline-flex;align-items:center;gap:6px;padding:7px 13px;border-radius:10px;font-size:13px;font-weight:600;color:var(--primary);background:var(--primary-50);white-space:nowrap}
.theme-toggle{width:38px;height:38px;border-radius:10px;border:1px solid var(--glass-border-soft);background:var(--glass-bg);color:var(--fg);cursor:pointer;font-size:16px;display:inline-flex;align-items:center;justify-content:center;transition:.2s}
.theme-toggle:hover{background:var(--glass-strong);box-shadow:var(--glass-shadow)}
@media(min-width:860px){.nav-links{display:flex}}

/* Header */
.header{max-width:1040px;margin:0 auto;padding:42px 20px 18px}
.header .badge{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:9999px;font-size:11.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;background:var(--primary-50);color:var(--primary-700)}
.header .badge .dot{width:7px;height:7px;border-radius:50%;background:var(--primary-500);animation:pulse 2s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
.header h1{font-size:clamp(30px,5vw,46px);font-weight:800;letter-spacing:-1px;line-height:1.1;margin:16px 0 10px}
.header .sub{font-size:14.5px;color:var(--muted);max-width:680px;line-height:1.7}
.header .meta-row{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:14px;font-family:var(--font-mono);font-size:12.5px;color:var(--muted)}
.header .meta-row span{display:inline-flex;align-items:center;gap:5px}
.chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}
.chip{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:9999px;font-size:12px;font-weight:600}
.chip-dot{width:6px;height:6px;border-radius:50%}

/* Date navigator */
.date-nav{max-width:1040px;margin:8px auto 0;padding:0 20px 26px}
.date-scroll{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none}
.date-scroll::-webkit-scrollbar{display:none}
.date-pill{flex:none;display:flex;flex-direction:column;align-items:center;gap:1px;padding:9px 16px;border-radius:12px;background:var(--glass-bg);border:1px solid var(--glass-border-soft);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);transition:.2s}
.date-pill .dp-day{font-size:14px;font-weight:700;color:var(--fg)}
.date-pill .dp-wd{font-size:10px;color:var(--muted)}
.date-pill.active{background:var(--primary);border-color:var(--primary);box-shadow:0 6px 18px rgba(99,102,241,.3)}
.date-pill.active .dp-day,.date-pill.active .dp-wd{color:#fff}

/* Hero */
.hero-wrap{max-width:1040px;margin:0 auto;padding:0 20px 22px}
.hero-card{position:relative;overflow:hidden;border-radius:20px;background:var(--glass-strong);border:1px solid var(--glass-border-soft);backdrop-filter:blur(14px) saturate(160%);-webkit-backdrop-filter:blur(14px) saturate(160%);box-shadow:var(--glass-shadow);padding:22px 24px}
.hero-card::before{content:'';position:absolute;top:-45%;right:-14%;width:56%;height:160%;background:radial-gradient(circle at center,rgba(139,92,246,.22),transparent 70%);pointer-events:none}
.hero-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;position:relative}
.hero-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:9999px;font-size:12px;font-weight:700;color:#fff;background:linear-gradient(135deg,var(--primary-500),#8b5cf6);box-shadow:0 4px 14px rgba(99,102,241,.35);white-space:nowrap}
.hero-edit{font-family:var(--font-mono);font-size:11px;color:var(--muted)}
.hero-tags{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px;position:relative}
.hero-title{font-size:clamp(20px,3vw,28px);font-weight:800;line-height:1.3;letter-spacing:-.4px;position:relative;text-wrap:balance;word-break:keep-all;overflow-wrap:break-word}
.hero-sum{font-size:14.5px;color:var(--muted);line-height:1.75;margin-top:10px;position:relative}
.hero-link{display:inline-flex;align-items:center;gap:6px;margin-top:14px;padding:9px 18px;border-radius:12px;font-size:13.5px;font-weight:700;color:#fff;background:var(--primary);transition:.2s;position:relative}
.hero-link:hover{background:var(--primary-700);gap:10px}

/* Category / source tags */
.cat-tag{display:inline-flex;align-items:center;padding:3px 10px;border-radius:8px;font-size:11.5px;font-weight:600;white-space:nowrap}
.src-tag{display:inline-flex;align-items:center;padding:2px 9px;border-radius:7px;font-size:11px;font-weight:600;white-space:nowrap}
.src-huxiu{background:rgba(214,59,82,.12);color:#d63b52}
.src-36kr{background:rgba(0,194,146,.12);color:#00a878}
.src-tmtpost{background:rgba(0,160,233,.12);color:#0090d6}
.src-geekpark{background:rgba(0,200,168,.12);color:#00a08a}
.src-other{background:var(--primary-50);color:var(--primary)}
.src-line{font-size:12px;color:var(--muted);font-family:var(--font-mono)}

/* Sections */
.block{max-width:1040px;margin:0 auto;padding:14px 20px}
.block-head{display:flex;align-items:center;gap:11px;margin-bottom:14px}
.block-icon{width:34px;height:34px;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;font-size:17px;flex:none}
.block-title{font-size:19px;font-weight:800;letter-spacing:-.3px}
.block-count{margin-left:auto;font-family:var(--font-mono);font-size:12px;font-weight:600;color:var(--muted);background:var(--glass-bg);border:1px solid var(--glass-border-soft);padding:2px 10px;border-radius:9999px}

/* Cards */
.card{position:relative;background:var(--card);border:1px solid var(--card-border);border-radius:var(--radius);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:var(--glass-shadow);transition:transform .2s,box-shadow .2s,border-color .2s;overflow:hidden}
.card:hover{transform:translateY(-2px);box-shadow:var(--glass-shadow-hover);border-color:var(--glass-border-soft)}
.news-list,.book-list{display:flex;flex-direction:column;gap:12px}
.news-card{display:flex;align-items:stretch;overflow:hidden}
.news-cover{flex:none;width:78px;display:flex;align-items:center;justify-content:center;color:#fff}
.news-cover .nc-icon{font-size:30px;filter:drop-shadow(0 3px 8px rgba(0,0,0,.28))}
.news-body{flex:1;padding:15px 18px;min-width:0}
@media(max-width:640px){.news-card{flex-direction:column}.news-cover{width:100%;height:60px;flex-direction:row}}
.news-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:7px}
.news-title{font-size:15.5px;font-weight:700;line-height:1.5}
.news-title strong{font-weight:700}
.news-sum{font-size:13.5px;color:var(--muted);line-height:1.7;margin-top:7px}
.news-foot{margin-top:10px}
.news-link{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;font-weight:600;color:var(--primary)}
.news-link:hover{text-decoration:underline}

/* Book cards */
.book-card{display:flex;gap:0}
.book-cover{flex:none;width:96px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:#fff;position:relative}
.book-cover .bc-num{font-size:22px;font-weight:800;opacity:.95;text-shadow:0 2px 8px rgba(0,0,0,.25)}
.book-cover .bc-icon{font-size:24px;filter:drop-shadow(0 3px 8px rgba(0,0,0,.25))}
.book-main{flex:1;padding:16px 18px;min-width:0}
.book-title{font-size:16px;font-weight:800;line-height:1.45}
.book-title em{font-style:normal;color:var(--primary-700)}
[data-theme="dark"] .book-title em{color:#a5b4fc}
.book-author{font-size:13px;color:var(--muted);font-weight:500}
.book-ratings{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 8px}
.rating{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:8px;font-size:12px;font-weight:600}
.rating b{font-weight:800}
.rating i{font-style:normal;opacity:.7;font-weight:500}
.r-douban{background:rgba(41,151,255,.12);color:#4aa8ff}
.r-weread{background:rgba(139,92,246,.12);color:#a78bfa}
.book-desc{font-size:13.5px;color:var(--muted);line-height:1.72}
.book-link{display:inline-flex;align-items:center;gap:6px;margin-top:12px;padding:8px 16px;border-radius:10px;font-size:13px;font-weight:700;color:#fff;background:var(--primary);transition:.2s}
.book-link:hover{background:var(--primary-700);gap:9px}

/* Quotes */
.quotes{margin-top:14px;padding:13px 16px;border-left:3px solid var(--primary);background:linear-gradient(135deg,rgba(99,102,241,.05),rgba(139,92,246,.09));border-radius:0 var(--radius-sm) var(--radius-sm) 0}
.quotes-label{font-size:11.5px;font-weight:700;color:var(--primary);letter-spacing:.06em;margin-bottom:9px;text-transform:uppercase}
.quote{margin:0 0 9px}
.quote:last-child{margin-bottom:0}
.quote p{font-size:13px;color:var(--fg);line-height:1.7;font-style:italic;position:relative;padding-left:15px}
.quote p::before{content:'“';position:absolute;left:0;top:-3px;font-size:18px;color:var(--primary);opacity:.6;font-family:Georgia,serif}
.qcount{display:inline-block;margin-top:3px;font-size:10.5px;color:var(--primary);background:var(--primary-50);padding:1px 8px;border-radius:9999px;font-weight:600}

/* Footer */
.footer{margin-top:30px;border-top:1px solid var(--glass-border-soft);background:var(--glass-bg);backdrop-filter:blur(16px) saturate(160%);-webkit-backdrop-filter:blur(16px) saturate(160%)}
.footer-inner{max-width:1040px;margin:0 auto;padding:34px 20px}
.footer-top{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px}
.footer .fbrand{display:flex;align-items:center;gap:9px}
.footer .fbrand .logo{width:32px;height:32px;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:14px;background:linear-gradient(135deg,var(--primary-500),var(--primary-700))}
.footer .fbrand .ft{font-size:14px;font-weight:700}
.footer .fbrand .fs{font-size:12px;color:var(--muted)}
.footer-links{display:flex;flex-wrap:wrap;gap:6px 18px}
.footer-links a{font-size:13px;color:var(--muted);transition:.2s}
.footer-links a:hover{color:var(--primary)}
.footer-bottom{border-top:1px solid var(--glass-border-soft);margin-top:24px;padding-top:18px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px}
.footer-bottom span{font-size:12px;color:var(--muted);font-family:var(--font-mono)}
.footer-nav-row{max-width:1040px;margin:0 auto;padding:6px 20px 40px;display:flex;align-items:center;justify-content:space-between;gap:12px}
.footer-nav-row a{display:inline-flex;align-items:center;gap:6px;font-size:13.5px;font-weight:600;color:var(--primary);transition:.2s}
.footer-nav-row a:hover{gap:10px}
.footer-nav-row .disabled{color:var(--muted);pointer-events:none}

@media(max-width:640px){
  .book-card{flex-direction:column}
  .book-cover{width:100%;flex-direction:row;justify-content:flex-start;gap:12px;padding:14px 18px}
  .book-cover .bc-num{font-size:18px}
  .header{padding-top:30px}
}
</style>
</head>
<body>
<div class="glow-bg" aria-hidden="true"><div class="b1"></div><div class="b2"></div><div class="b3"></div></div>
<div class="app-wrap">
<nav class="nav"><div class="nav-inner">
  <a href="/" class="brand"><span class="logo">A</span>Appin</a>
  <div class="nav-links">
    <a href="/">首页</a>
    <a href="/craft/">技艺录</a>
    <a href="/notes/">随笔</a>
    <a href="/ai-radar/">AI雷达</a>
    <a href="index.html" class="active">每日阅读</a>
  </div>
  <div class="nav-right">
    <span class="nav-pill">📡 订阅</span>
    <button class="theme-toggle" data-theme-toggle aria-label="切换深浅色">🌓</button>
  </div>
</div></nav>

<header class="header">
  <span class="badge"><span class="dot"></span>每日阅读 / DAILY DIGEST</span>
  <h1>${data.title.replace(/\|.+$/,'')||'每日阅读'}</h1>
  ${subtitle?`<p class="sub">${subtitle}</p>`:`<p class="sub">每天从信息洪流里，挑出值得读的几条——社会商业、汽车、科技、养老、心理与好书，一日一阅。</p>`}
  <div class="meta-row">
    <span>📅 ${data.date} · ${weekday}</span>
    <span>🤖 自动生成于 12:00</span>
    <span>📚 共 ${totalItems} 条</span>
  </div>
  <div class="chips">${chips}</div>
</header>

<section class="date-nav"><div class="date-scroll">${dateNav}</div></section>

${heroHtml}

<main>
${sectionsHtml}
</main>

<div class="footer-nav-row">
  ${prevDate?`<a href="${prevDate}.html">← 上一篇（${prevDate.slice(5)}）</a>`:`<span class="disabled">← 上一篇</span>`}
  <a href="index.html">📑 返回列表</a>
  ${nextDate?`<a href="${nextDate}.html">下一篇（${nextDate.slice(5)}）→</a>`:`<span class="disabled">下一篇 →</span>`}
</div>

<footer class="footer"><div class="footer-inner">
  <div class="footer-top">
    <div class="fbrand">
      <span class="logo">A</span>
      <div><div class="ft">Appin</div><div class="fs">独立开发者 Li Kun 的个人站点</div></div>
    </div>
    <div class="footer-links">
      <a href="/">首页</a>
      <a href="/craft/">技艺录</a>
      <a href="/notes/">随笔</a>
      <a href="/ai-radar/">AI雷达</a>
      <a href="index.html">每日阅读</a>
    </div>
  </div>
  <div class="footer-bottom">
    <span>© ${data.date.slice(0,4)} Appin · 用代码与文字记录思考</span>
    <span>Built with Liquid Glass · 每日阅读自动生成</span>
  </div>
</div></footer>
</div>

<script>
function toggleTheme(){var cur=document.documentElement.getAttribute('data-theme');var next=cur==='dark'?'light':'dark';document.documentElement.setAttribute('data-theme',next);try{localStorage.setItem('appin-theme',next);}catch(e){}}
document.querySelectorAll('[data-theme-toggle]').forEach(function(b){b.addEventListener('click',toggleTheme);});
</script>
</body>
</html>`;

  fs.writeFileSync(outputPath, html, 'utf8');
  console.log(`✅ ${outputPath} (${data.date}, ${totalItems} items, ${data.sections.length} sections)`);
}

// ---- Main ----
const srcDir = '/Users/likun/WorkBuddy/2026-06-17-16-22-19/daily-digest/';
const outDir = '/Users/likun/Projects/appin-site/daily-digest/';

// Auto-discover all YYYY-MM-DD.md files (so the daily automation needs no manual edits)
const files = fs.readdirSync(srcDir)
  .filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
  .sort(); // ascending by date string (YYYY-MM-DD sorts lexicographically)

if (files.length === 0) {
  console.error('No daily-digest markdown files found in', srcDir);
  process.exit(1);
}

// Descending list (newest first) for prev/next navigation
const allDates = files.map(f => f.replace(/\.md$/, '')).sort().reverse();

for (const f of files) {
  const md = fs.readFileSync(path.join(srcDir, f), 'utf8');
  const data = parseDigest(md);
  const outPath = path.join(outDir, f.replace('.md', '.html'));
  generateHTML(data, outPath, allDates);
}
