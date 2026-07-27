const fs = require('fs');
const path = require('path');

const SRC = 'C:/Users/Kun.li/Desktop/候选一黄色传统设计antaisolar-pxid - 副本';
const P = (f) => path.join(SRC, 'src/partials', f);

const headTpl   = fs.readFileSync(P('head.html'), 'utf8');
const headerTpl = fs.readFileSync(P('header.html'), 'utf8');
const footerTpl = fs.readFileSync(P('footer.html'), 'utf8');
const scriptTpl = fs.readFileSync(P('script.html'), 'utf8');
const homeBody  = fs.readFileSync(P('home-body.html'), 'utf8');
const newsBody  = fs.readFileSync(P('news-body.html'), 'utf8');
const aboutBody = fs.readFileSync(P('about-body.html'), 'utf8');
const articleBody = fs.readFileSync(P('article-body.html'), 'utf8');
const aIndiaChoice = fs.readFileSync(P('article-india-choice.html'), 'utf8');
const aFrankfurt  = fs.readFileSync(P('article-eurobike-frankfurt.html'), 'utf8');
const aCargo      = fs.readFileSync(P('article-cargo-urban.html'), 'utf8');
const aIndiaSupply= fs.readFileSync(P('article-india-supply.html'), 'utf8');
const aFreight    = fs.readFileSync(P('article-freight-volatility.html'), 'utf8');
const aMopeds     = fs.readFileSync(P('article-mopeds-sea.html'), 'utf8');
const processBody = fs.readFileSync(P('process-body.html'), 'utf8');
const contactBody = fs.readFileSync(P('contact-body.html'), 'utf8');

function build({ file, title, desc, active, body }) {
  let head = headTpl.replace('{{TITLE}}', title).replace('{{DESC}}', desc);
  // 根据输出目录深度调整 CSS 相对路径
  const depth = (file.match(/\//g) || []).length;
  const cssPrefix = '../'.repeat(depth);
  head = head.replace('assets/css/base.css', cssPrefix + 'assets/css/base.css');
  const header = active
    ? headerTpl.replace(`data-nav="${active}"`, `data-nav="${active}" class="active"`)
    : headerTpl;
  const html =
`<!doctype html>
<html lang="zh-CN">
<head>
${head}</head>
<body>
${header}
${body}
${footerTpl}
<a class="to-top" href="#top" aria-label="回到顶部" title="回到顶部">↑</a>
${scriptTpl}
<noscript><style>.reveal{opacity:1!important;transform:none!important}</style></noscript>
</body>
</html>
`;
  fs.writeFileSync(path.join(SRC, file), html, 'utf8');
  console.log('built', file, '-', html.length, 'bytes');
}

const pages = [
  {
    file: 'index.html',
    title: 'PXID 品向智造 | 小件设计·打样·制造·生产一站式服务平台',
    desc: '源自PXID，专注小件产品设计、快速打样、精密制造与批量生产，数字化平台一站式智造服务。',
    active: null,
    body: homeBody,
  },
  {
    file: 'news/news.html',
    title: '新闻动态 | PXID 品向智造 · 智能设计制造',
    desc: 'PXID 品向智造新闻动态：持续追踪产品设计、快速打样与精密制造的新方法、新实践。',
    active: 'news',
    body: newsBody,
  },
  // 新增页面只需在此加一项 + 提供对应 body partial，例如 about
  {
    file: 'about.html',
    title: '关于我们 | PXID 品向智造 · 小件精密制造',
    desc: '源自PXID，专注小件产品设计、快速打样与精密制造。了解我们的故事、价值观与全球布局。',
    active: 'about',
    body: aboutBody,
  },
  {
    file: 'news/news-detail.html',
    title: 'EUROBIKE 2026 趋势报告：电助力车与智能出行洞察 | PXID 品向智造',
    desc: '从法兰克福 EUROBIKE 2026 看全球电助力车与轻出行行业的五大趋势。',
    active: 'news',
    body: articleBody,
  },
  {
    file: 'news/news-india-choice.html',
    title: '为什么 PXID 选择印度制造电助力车 | PXID 品向智造',
    desc: '中国研发 + 印度生产的双引擎战略，如何兼顾创新速度与本地化交付。',
    active: 'news',
    body: aIndiaChoice,
  },
  {
    file: 'news/news-eurobike-frankfurt.html',
    title: 'EUROBIKE 2026 法兰克福：全球电助力车、货运车与出行产业趋势 | PXID 品向智造',
    desc: '直击 EUROBIKE 2026 法兰克福展，解读电助力车、货运自行车与城市出行设备的最新走向。',
    active: 'news',
    body: aFrankfurt,
  },
  {
    file: 'news/news-cargo-urban.html',
    title: '电动货运自行车的 5 大城市场景应用 | PXID 品向智造',
    desc: '从最后一公里配送到家庭出行，电动货运自行车正在城市物流与生活中找到五个关键落地点。',
    active: 'news',
    body: aCargo,
  },
  {
    file: 'news/news-india-supply.html',
    title: '印度制造正在重塑全球电助力车供应链 | PXID 品向智造',
    desc: '印度制造能力崛起，正在改变全球电助力车的设计、采购与交付格局。',
    active: 'news',
    body: aIndiaSupply,
  },
  {
    file: 'news/news-freight-volatility.html',
    title: '2026 全球货运波动：用包装策略降低物流成本 | PXID 品向智造',
    desc: '面对 2026 年国际物流不确定性，制造企业通过 CBU/SKD/CKD 与包装优化有效压降成本。',
    active: 'news',
    body: aFreight,
  },
  {
    file: 'news/news-mopeds-sea.html',
    title: '电动摩托在东南亚出行市场崛起 | PXID 品向智造',
    desc: '东南亚城市出行升级，轻型电动摩托凭借低成本与政策红利快速渗透。',
    active: 'news',
    body: aMopeds,
  },
  {
    file: 'services/process.html',
    title: '服务流程 | PXID 品向智造 · 一站式智造平台',
    desc: '从概念设计到批量交付的九步全流程服务，设计制造一体化协同，让产品开发更高效。',
    active: 'process',
    body: processBody,
  },
  {
    file: 'contact.html',
    title: '联系报价 | PXID 品向智造 · 获取即时报价',
    desc: '提交您的项目需求，获取即时报价。无论设计、打样还是量产，项目顾问24小时内与您对接。',
    active: 'contact',
    body: contactBody,
  },
];

pages.forEach(build);
console.log('BUILD DONE');
