#!/usr/bin/env node
/**
 * reverse-md.js — 从单日页 HTML 反解出符合 gen-index.js parseDigest 格式的 .md 源。
 *
 * 用途：跨设备场景下，源 .md 在另一台机器（如 Windows 端），本机只有 ECS 同步下来的
 *       单日页 HTML。运行本脚本可重建出 .md，让 gen-index.js 能正确解析（特别是
 *       "今日速览"摘要行）。
 *
 * 用法：node reverse-md.js [YYYY-MM-DD ...]   （不传日期则处理所有 缺失 .md 的单日页）
 */
const fs = require('fs');
const path = require('path');

const SRC_DIR = '/Users/likun/WorkBuddy/2026-06-17-16-22-19/daily-digest/';
const OUT_DIR = '/Users/likun/Projects/appin-site/daily-digest/';

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function stripTags(s) {
  return decodeEntities(s.replace(/<[^>]+>/g, ''));
}

// 提取一个 news-item: 返回 { title, summary, link }
function parseNewsItem(html) {
  const t = html.match(/<h3><strong>([\s\S]*?)<\/strong><\/h3>/);
  if (!t) return null;
  const title = stripTags(t[1]).trim();
  // news-summary: "摘要 [https://...]" 或 "摘要 https://..."
  const sm = html.match(/<div class="news-summary">([\s\S]*?)<\/div>/);
  let summary = '';
  let link = '';
  if (sm) {
    const raw = stripTags(sm[1]).trim();
    // 末尾链接（在 [...] 或裸 https:// 形式）
    const lm = raw.match(/\[?(https?:\/\/\S+?)\]?\s*$/);
    if (lm) {
      link = lm[1].replace(/[)\].,，。]+$/, '');
      summary = raw.slice(0, lm.index).trim().replace(/[\s\[]+$/, '');
    } else {
      summary = raw;
    }
  }
  return { title, summary, link };
}

// 提取一个 book-item: 返回 { title, author, desc }
function parseBookItem(html) {
  const t = html.match(/<h3><em>([\s\S]*?)<\/em>([\s\S]*?)<\/h3>/);
  if (!t) return null;
  const title = stripTags(t[1]).trim();
  // " — 作者" 部分
  const rest = stripTags(t[2]).trim();
  const am = rest.match(/^[—\-–\s]+(.+)$/);
  const author = am ? am[1].trim() : '';
  const dm = html.match(/<div class="book-desc">([\s\S]*?)<\/div>/);
  const desc = dm ? stripTags(dm[1]).trim() : '';
  return { title, author, desc };
}

// 切分 HTML 中各 section-block（顶层平衡匹配）
function splitSections(html) {
  const out = [];
  const re = /<section class="section-block"[^>]*>/g;
  const starts = [];
  let m;
  while ((m = re.exec(html))) starts.push(m.index);
  for (let i = 0; i < starts.length; i++) {
    const end = i + 1 < starts.length ? starts[i + 1] : html.length;
    out.push(html.slice(starts[i], end));
  }
  return out;
}

// 自动生成"今日速览"摘要：从各板块首条新闻标题里挑 3-4 个拼接
function autoSummary(secNews) {
  // secNews: { label, firstTitle }[]
  const picks = [];
  const order = ['社会商业', '汽车', '科技', '养老产业', '心理学'];
  for (const lab of order) {
    const s = secNews.find((x) => x.label === lab && x.firstTitle);
    if (s) picks.push(s.firstTitle);
    if (picks.length >= 4) break;
  }
  // 限制总长
  let s = picks.join('、');
  if (s.length > 80) s = s.slice(0, 80) + '…';
  return s || '今日热点 + 好书精选';
}

function parseHtmlToMd(html, date) {
  // H1 标准化为【WB】每日阅读 | YYYY-MM-DD（HTML 渲染时往往简化，但 .md 源需要完整）
  const h1 = `【WB】每日阅读 | ${date}`;

  const sections = splitSections(html);
  const lines = [];
  const secNews = []; // 用于自动生成今日速览

  // H1 与今日速览在循环结束后统一 unshift 到顶部（避免重复 push）

  let newsIdx = 0;
  for (const sec of sections) {
    const tm = sec.match(/<div class="section-title"[^>]*>([\s\S]*?)<\/div>/);
    if (!tm) continue;
    const title = stripTags(tm[1]).trim();
    lines.push(`## ${title}`);
    lines.push('');

    // news items
    const newsItems = [];
    const newsRe = /<div class="news-item"[^>]*>[\s\S]*?(?=<div class="news-item"|<div class="book-item"|<\/section>)/g;
    let nm;
    while ((nm = newsRe.exec(sec))) {
      const item = parseNewsItem(nm[0]);
      if (item) newsItems.push(item);
    }
    // book items
    const bookItems = [];
    const bookRe = /<div class="book-item"[^>]*>[\s\S]*?(?=<div class="news-item"|<div class="book-item"|<\/section>)/g;
    let bm;
    while ((bm = bookRe.exec(sec))) {
      const item = parseBookItem(bm[0]);
      if (item) bookItems.push(item);
    }

    if (newsItems.length && !title.includes('好书')) {
      secNews.push({ label: title, firstTitle: newsItems[0].title });
      newsItems.forEach((it, i) => {
        const linkPart = it.link ? ` [${it.link}](${it.link})` : '';
        const sumPart = it.summary ? ` ${it.summary}` : '';
        lines.push(`${i + 1}. **${it.title}**${sumPart}${linkPart}`);
      });
      lines.push('');
    } else if (bookItems.length) {
      // 好书板块：HTML 中 <em>《书名》</em> 已含《》，不要再包
      bookItems.forEach((it, i) => {
        // 书名去重书名号
        const t = it.title.replace(/^《|》$/g, '');
        lines.push(`### ${i + 1}. **《${t}》** | ${it.author}`);
        if (it.desc) {
          lines.push(it.desc);
        }
        lines.push('');
      });
    } else {
      // 兜底：保留标题段
      secNews.push({ label: title, firstTitle: title });
    }
    newsIdx++;
  }

  // 在 H1 之前插入今日速览（按 md 解析约定位置）
  const summary = autoSummary(secNews);
  // 最终结构：H1 → 空行 → 今日速览 → 空行 → 各板块
  lines.unshift(`> 今日速览：${summary}`);
  lines.unshift('');
  lines.unshift(`# ${h1}`);

  return lines.join('\n');
}

function main() {
  const args = process.argv.slice(2);
  let dates = args;
  if (dates.length === 0) {
    // 自动找缺 .md 的单日页
    const htmls = fs.readdirSync(OUT_DIR).filter((f) => /^\d{4}-\d{2}-\d{2}\.html$/.test(f));
    dates = htmls
      .map((f) => f.replace('.html', ''))
      .filter((d) => !fs.existsSync(path.join(SRC_DIR, d + '.md')));
  }

  if (dates.length === 0) {
    console.log('无需反解：所有单日页均已有 .md 源');
    return;
  }

  for (const date of dates) {
    const htmlPath = path.join(OUT_DIR, date + '.html');
    if (!fs.existsSync(htmlPath)) {
      console.warn(`⚠️  ${date}: 缺单日页 HTML，跳过`);
      continue;
    }
    const html = fs.readFileSync(htmlPath, 'utf8');
    const md = parseHtmlToMd(html, date);
    const mdPath = path.join(SRC_DIR, date + '.md');
    fs.writeFileSync(mdPath, md, 'utf8');
    console.log(`✅ ${date}.md 重建完成 (${md.length} 字节)`);
  }
}

main();
