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
          title = bookNew[2].trim().replace(/^\*\*|\*\*$/g, '').replace(/^《|》$/g, '');
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

// ---- Color config by section type ----
const sectionConfig = {
  social: { icon:'📰', color:'#2997ff', bg:'rgba(41,151,255,0.1)' },
  auto:  { icon:'🚗', color:'#e08600', bg:'rgba(255,159,10,0.1)' },
  tech:  { icon:'🔬', color:'#bf5af2', bg:'rgba(191,90,242,0.1)' },
  elderly:{ icon:'🏠', color:'#c87a1e', bg:'rgba(200,122,30,0.1)' },
  psych: { icon:'🧠', color:'#e54d66', bg:'rgba(255,69,89,0.1)' },
  book:  { icon:'📚', color:'#2ea043', bg:'rgba(90,200,120,0.1)' }
};

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
  
  // Build section tags for header
  const sectionTagsHtml = data.sections.map(s => {
    const cfg = sectionConfig[s.typeLabel] || sectionConfig.book;
    const count = s.items.length;
    const labels = { social:'社会商业', auto:'汽车', tech:'科技', elderly:'养老产业', psych:'心理学', book:'好书' };
    return `<span class="tag-${s.typeLabel}" style="${s.typeLabel==='book'?'background:rgba(90,200,120,0.08);color:#2ea043':s.typeLabel==='tech'?'background:rgba(191,90,242,0.08);color:#bf5af2':s.typeLabel==='auto'?'background:rgba(255,159,10,0.08);color:#e08600':'background:rgba(41,151,255,0.08);color:#2997ff'}"><span class="tag-dot" style="background:${cfg.color}"></span> ${labels[s.typeLabel]||s.title} ×${count}</span>`;
  }).join('\n        ');
  
  // Build section bodies
  const sectionsHtml = data.sections.map(section => {
    const cfg = sectionConfig[section.typeLabel] || sectionConfig.book;
    
    if (section.type === 'book') {
      const itemsHtml = section.items.map(book => `
    <div class="book-item">
      <div class="book-header">
        <span class="book-num">${book.num}</span>
        <div class="book-info">
          <h3><em>${book.title}</em>${book.author ? ` — ${book.author}` : ''}</h3>
          ${book.author ? `<div class="book-author">${book.author.replace(/[—–-][^—–-]+$/, '').includes(book.author) ? '' : ''}</div>` : ''}
        </div>
      </div>
      <div class="book-ratings">
        ${book.doubanScore ? `<span class="rating-pill rating-douban">豆瓣 <span class="rating-score">${book.doubanScore}</span>${book.doubanCount ? ` <small>(${book.doubanCount}人)</small>` : ''}</span>` : ''}
        ${book.wereadScore ? `<span class="rating-pill rating-weread">微信读书 <span class="rating-score">${book.wereadScore}</span>${book.wereadCount ? ` <small>(${book.wereadCount}人)</small>` : ''}</span>` : ''}
      </div>
      ${book.desc ? `<div class="book-desc">${book.desc}</div>` : ''}
      ${book.link ? `<div style="padding:12px 0 0 36px"><a href="${book.link}" target="_blank" rel="noopener" style="display:inline-block;padding:7px 16px;border-radius:9px;background:#30d158;color:#fff;font-size:13px;font-weight:600;text-decoration:none;">🔗 打开阅读</a></div>` : ''}
      ${book.highlights && book.highlights.length > 0 ? `
      <div class="book-highlights">
        <div class="highlights-label">✨ 读者金句</div>
        ${book.highlights.map(hl => `
        <blockquote class="highlight-quote">
          <p class="highlight-text">"${hl.text}"</p>
          <span class="highlight-count">${hl.count}人划线</span>
        </blockquote>`).join('')}
      </div>` : ''}
    </div>`).join('\n');
      
      return `
<section class="section-block">
  <div class="section-head">
    <div class="section-icon" style="background:${cfg.bg};color:${cfg.color};">${cfg.icon}</div>
    <div class="section-title" style="color:${cfg.color};">${section.title}</div>
  </div>
${itemsHtml}
</section>`;
    }
    
    // News items
    const itemsHtml = section.items.map(item => {
      const srcTag = detectSourceTag(item.title, item.summary);
      const srcLabel = getSourceLabel(srcTag);
      const srcTagHtml = srcTag !== 'src-other' ? `<span class="news-source-tag ${srcTag}">${srcLabel}</span>` : '';
      
      return `
  <div class="news-item">
    <div class="item-header"><span class="num" style="background:${cfg.color};">${item.num}</span><h3><strong>${item.title}</strong>${srcTagHtml}</h3></div>
    ${item.summary ? `<div class="news-summary">${item.summary}</div>` : ''}
    ${item.link ? `<a href="${item.link}" target="_blank" rel="noopener" class="news-link">查看原文 →</a>` : ''}
  </div>`;
    }).join('\n');
    
    return `
<section class="section-block">
  <div class="section-head">
    <div class="section-icon" style="background:${cfg.bg};color:${cfg.color};">${cfg.icon}</div>
    <div class="section-title" style="color:${cfg.color};">${section.title}</div>
  </div>
${itemsHtml}
</section>`;
  }).join('\n\n');
  
  // Find prev/next dates from discovered file list (passed in)
  const idx = allDates.indexOf(data.date);
  const prevDate = idx < allDates.length - 1 ? allDates[idx+1] : null;
  const nextDate = idx > 0 ? allDates[idx-1] : null;

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>每日阅读 | ${data.date} — 李坤</title>
<meta name="description" content="${data.sections[0]?.items[0]?.title || '每日阅读'}——${data.date}阅读简报。">
<style>
:root{
  --bg:#f7faf7;--text:#1a1a1a;--text-secondary:#555;--text-muted:#888;
  --accent:#30d158;--accent-light:rgba(48,209,88,0.08);--border:rgba(0,0,0,0.07);
  --card-bg:#fff;--radius:14px;--radius-sm:10px;
}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',-apple-system,sans-serif;
  background:var(--bg);color:var(--text);line-height:1.7;-webkit-font-smoothing:antialiased}
.nav{position:fixed;top:0;left:0;right:0;z-index:100;background:rgba(247,250,247,0.92);
  backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--border)}
.nav-inner{max-width:860px;margin:0 auto;padding:0 32px;display:flex;align-items:center;justify-content:space-between;height:58px}
.nav-back{font-size:15px;color:var(--accent);text-decoration:none;font-weight:600;display:flex;align-items:center;gap:6px;transition:gap .2s}
.nav-back:hover{gap:10px}
.nav-links{display:flex;gap:20px;align-items:center;font-size:13px}
.nav-links a{color:var(--text-muted);text-decoration:none;transition:color .2s}
.nav-links a:hover{color:var(--accent)}

.article-header{max-width:860px;margin:0 auto;padding:100px 32px 40px;text-align:center}
.article-date-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 16px;border-radius:20px;
  background:var(--accent-light);color:var(--accent);font-size:12px;font-weight:600;letter-spacing:.06em;margin-bottom:18px}
.article-date-badge .dot{width:6px;height:6px;border-radius:50%;background:var(--accent);animation:pulse-dot 2s ease-in-out infinite}
@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:.4}}
.article-header h1{font-size:clamp(24px,4vw,36px);font-weight:800;letter-spacing:-.5px;line-height:1.25;margin-bottom:14px;color:var(--text)}
.article-header h1 .hl{color:var(--accent)}
.article-meta{font-size:13px;color:var(--text-muted);margin-top:12px}
.section-tags{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:20px}
.section-tags span{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:8px;font-size:11px;font-weight:600}
.tag-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}

.article-body{max-width:860px;margin:0 auto;padding:0 32px 80px}
.section-block{margin-bottom:36px}
.section-head{display:flex;align-items:center;gap:10px;margin-bottom:18px;padding-bottom:12px;border-bottom:2px solid var(--border)}
.section-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0}
.section-title{font-size:17px;font-weight:700;letter-spacing:.02em}

.news-item{padding:16px 18px;border:1px solid var(--border);border-radius:var(--radius-sm);
  background:var(--card-bg);margin-bottom:12px;transition:all .2s ease;position:relative}
.news-item:hover{box-shadow:0 4px 16px rgba(0,0,0,.05);transform:translateY(-1px)}
.news-item:last-child{margin-bottom:0}
.news-item .num{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;
  border-radius:6px;font-size:11px;font-weight:700;color:#fff;flex-shrink:0;margin-right:12px}
.news-item .item-header{display:flex;align-items:flex-start;gap:0}
.news-item h3{font-size:15px;font-weight:700;line-height:1.55;color:var(--text);flex:1}
.news-item h3 strong{color:var(--text)}
.news-source-tag{display:inline-block;font-size:10.5px;font-weight:600;padding:1px 7px;border-radius:4px;
  margin-left:8px;vertical-align:middle;white-space:nowrap}
.src-huxiu{background:rgba(255,107,129,.08);color:#d63b52}.src-36kr{background:rgba(0,194,146,.08);color:#00c292}
.src-tmtpost{background:rgba(0,160,233,.08);color:#00a0e9}.src-geekpark{background:rgba(0,200,168,.08);color:#00c8a8}
.src-other{background:var(--accent-light);color:var(--accent)}
    .news-summary{font-size:13.5px;color:var(--text-secondary);line-height:1.65;margin-top:8px;padding-left:34px}
.news-link{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#fff;text-decoration:none;
  font-weight:600;margin-top:10px;margin-left:34px;padding:6px 14px;border-radius:20px;background:var(--accent);
  box-shadow:0 1px 2px rgba(48,209,88,.25);transition:all .2s}
.news-link:hover{background:#26b94a;gap:10px;box-shadow:0 3px 8px rgba(48,209,88,.35)}

.book-item{padding:20px 22px;border:1px solid var(--border);border-radius:var(--radius-sm);
  background:linear-gradient(135deg,#fff,#f8fdf8);margin-bottom:12px;transition:all .2s ease}
.book-item:hover{box-shadow:0 4px 20px rgba(48,209,88,.08);transform:translateY(-1px)}
.book-item:last-child{margin-bottom:0}
.book-header{display:flex;align-items:flex-start;gap:14px;margin-bottom:10px}
.book-num{display:flex;align-items:center;justify-content:center;min-width:22px;height:22px;
  border-radius:6px;font-size:11px;font-weight:700;color:#fff;background:var(--accent);flex-shrink:0}
.book-info{flex:1}
.book-info h3{font-size:15.5px;font-weight:700;line-height:1.45}
.book-info h3 em{font-style:normal;color:var(--accent)}
.book-author{font-size:12.5px;color:var(--text-muted);margin-top:2px}
.book-ratings{display:flex;gap:10px;flex-wrap:wrap;margin:10px 0 8px;padding-left:36px}
.rating-pill{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:6px;font-size:11.5px;font-weight:600}
.rating-douban{background:rgba(41,151,255,.08);color:#2997ff}
.rating-weread{background:rgba(48,209,88,.08);color:#30d158}
.rating-score{font-weight:800}
.book-desc{font-size:13.5px;color:var(--text-secondary);line-height:1.68;padding-left:36px}
/* Book Highlights / 金句区 */
.book-highlights{margin-top:14px;padding:14px 18px 14px 36px;border-left:3px solid var(--accent);background:linear-gradient(135deg,rgba(48,209,88,.03),rgba(48,209,88,.06));border-radius:0 var(--radius-sm) var(--radius-sm) 0}
.highlights-label{font-size:11.5px;font-weight:700;color:var(--accent);letter-spacing:.06em;margin-bottom:10px;text-transform:uppercase}
.highlight-quote{margin:0 0 10px;padding:0}
.highlight-quote:last-child{margin-bottom:0}
.highlight-text{font-size:13px;color:var(--text-secondary);line-height:1.7;font-style:italic;position:relative;padding-left:16px}
.highlight-text::before{content:'\"';position:absolute;left:0;top:-2px;font-size:20px;color:var(--accent);opacity:.5;font-family:Georgia,serif}
.highlight-count{display:inline-block;font-size:10px;color:var(--accent);background:rgba(48,209,88,.1);padding:1px 8px;border-radius:10px;margin-top:4px;font-weight:600}
.divider{text-align:center;padding:30px 0 10px;color:var(--text-muted);font-size:11.5px;letter-spacing:.1em;opacity:.5}
.footer-nav{max-width:860px;margin:0 auto;padding:0 32px 60px;display:flex;justify-content:space-between;align-items:center}
.footer-nav a{color:var(--accent);text-decoration:none;font-size:14px;font-weight:600;display:flex;align-items:center;gap:6px;transition:gap .2s}
.footer-nav a:hover{gap:10px}
.footer-nav .disabled{color:var(--text-muted);pointer-events:none}
@media(max-width:640px){
  .nav-inner{padding:0 16px}.article-header{padding:90px 16px 28px}.article-body{padding:0 16px 60px}
  .footer-nav{padding:0 16px 48px}.news-summary,.news-link,.book-ratings,.book-desc{padding-left:0}
  .news-item .num{display:none}.section-tags{justify-content:flex-start}
}
</style>
</head>
<body>
<nav class="nav"><div class="nav-inner">
  <a href="index.html" class="nav-back">← 返回列表</a>
  <div class="nav-links"><a href="/">首页</a><a href="/craft/">技艺录</a></div>
</div></nav>

<header class="article-header">
  <div class="article-date-badge"><span class="dot"></span>DAILY DIGEST · ${data.date} ${weekday}</div>
  <h1>每日阅读</h1>
  <p class="article-meta">自动生成于 12:00<span class="sep">·</span>共 ${totalItems} 条</p>
  <div class="section-tags">
        ${sectionTagsHtml}
  </div>
</header>

<article class="article-body">
${sectionsHtml}
<div class="divider">— END OF DIGEST —</div>
</article>

<div class="footer-nav">
  ${prevDate ? `<a href="${prevDate}.html">← 上一篇（${prevDate.slice(5)}）</a>` : '<span></span>'}
  <a href="index.html">返回列表</a>
  ${nextDate ? `<a href="${nextDate}.html">下一篇（${nextDate.slice(5)}）→</a>` : '<span class="disabled">下一篇 →</span>'}
</div>

<script>
window.addEventListener('scroll',()=>{document.querySelector('.nav').classList.toggle('scrolled',window.scrollY>20)},{passive:true})
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
