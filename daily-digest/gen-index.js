#!/usr/bin/env node
/**
 * gen-index.js — 自动扫描 daily-digest 源 markdown，重新生成 index.html 列表页。
 * 与 md2digest.js 配套使用：md2digest 生成单日页面，本脚本生成列表页。
 * 设计原则：读取现有 index.html 的 <head>/<style>/<footer> 模板，只替换 #digestList 内部与 countLabel。
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
  return t.replace(/\*\*/g, '').replace(/[（(]来自[^）)]*[）)]/g, '').replace(/\s+/g, ' ').trim();
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

  const blocks = content.split(/^##\s+/m).slice(1); // 跳过 H1
  const sections = [];
  let firstTitles = [];

  blocks.forEach((block) => {
    const lines = block.split('\n');
    const name = lines[0].trim();
    const body = lines.slice(1).join('\n');
    const m = mapSection(name);
    // 计数：板块内有序列表项（N. ** ）或好书三级标题（### N. ** ）
    const count = (body.match(/^\s*(?:\d+\.|###\s*\d+\.)\s/gm) || []).length;
    // 首条标题
    const fm = body.match(/(?:^\d+\.|###\s*\d+\.)\s+\*\*(.+?)\*\*/m);
    const firstTitle = fm ? cleanTitle(fm[1]) : '';
    if (['社会商业', '汽车', '科技', '养老产业'].includes(m.label) && firstTitle) {
      firstTitles.push(firstTitle.slice(0, 14));
    }
    sections.push({ label: m.label, color: m.color, count });
  });

  let title = firstTitles.slice(0, 4).join('、');
  if (title.length > 44) title = title.slice(0, 44) + '…';

  const d = new Date(date + 'T00:00:00');
  const wd = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][d.getDay()];

  return { date, weekday: wd, sections, title: title || date };
}

function cardHtml(item, isLatest) {
  const accentIdx = getAccentIndex(item.date);
  const tags = item.sections
    .map(
      (s) =>
        `        <div class="digest-preview-tag"><span class="tag-dot" style="background:${s.color}"></span> ${s.label} ×${s.count}</div>`
    )
    .join('\n');
  const latestBadge = isLatest
    ? `\n          <span class="digest-status status-latest">最新</span>`
    : '';
  return `    <!-- ${item.date} -->
    <a href="${item.date}.html" class="digest-item reveal accent-${accentIdx}">
      <div class="digest-date-row">
        <div>
          <span class="digest-date">${item.date}</span>
          <span class="digest-weekday">${item.weekday}</span>
        </div>${latestBadge}
      </div>
      <div class="digest-title">${item.title}</div>
      <div class="digest-preview">
${tags}
      </div>
      <div class="digest-arrow">阅读全文 →</div>
    </a>
`;
}

function main() {
  const files = fs
    .readdirSync(SRC_DIR)
    .filter((f) => /^(\d{4}-\d{2}-\d{2})\.md$/.test(f))
    .map((f) => path.join(SRC_DIR, f));

  const items = files.map(parseDigest).filter(Boolean).sort((a, b) => (a.date < b.date ? 1 : -1));

  if (items.length === 0) {
    console.error('❌ 未找到任何 YYYY-MM-DD.md');
    process.exit(1);
  }

  const cards = items.map((it, i) => cardHtml(it, i === 0)).join('\n');
  const count = items.length;

  const tmpl = fs.readFileSync(INDEX_PATH, 'utf8');
  const listRe = /<div id="digestList">[\s\S]*?<\/div>\n<\/section>/;
  const cardsBlock = `<div id="digestList">\n\n${cards}\n</div>\n</section>`;
  let newHtml = tmpl.replace(listRe, cardsBlock);
  newHtml = newHtml.replace(/<span id="countLabel">\(\d+\)<\/span>/, `<span id="countLabel">(${count})</span>`);

  fs.writeFileSync(INDEX_PATH, newHtml, 'utf8');
  console.log(`✅ index.html 已重新生成（${count} 期，最新 ${items[0].date}）`);
}

main();
