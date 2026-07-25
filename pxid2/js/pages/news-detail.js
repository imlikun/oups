(function () {
    var ARTICLES = [
        { id: 'india-manufacturing', titleEn: 'Why PXID Chose India for Electric Bike Manufacturing', titleZh: 'PXID 为何选择在印度制造电动自行车', tagEn: 'China R&D + India Production Strategy', tagZh: '中国研发 + 印度生产战略', date: '2026-06-27', image: 'news-1182.jpg' },
        { id: 'eurobike-2026', titleEn: 'EUROBIKE 2026 Frankfurt: Global E-bike & Mobility Trends', titleZh: 'EUROBIKE 2026 法兰克福：全球电动自行车与出行趋势', tagEn: 'EUROBIKE 2026 Frankfurt', tagZh: 'EUROBIKE 2026 法兰克福', date: '2026-06-17', image: 'news-1180.jpg' },
        { id: 'cargo-bike-apps', titleEn: '5 Key Urban Applications of Electric Cargo Bike Delivery', titleZh: '电动货运自行车配送的5大城市应用场景', tagEn: 'Urban Mobility', tagZh: '城市出行', date: '2026-05-29', image: 'news-067.jpg' },
        { id: 'india-supply-chain', titleEn: 'India\'s Evolving Manufacturing Ecosystem for E-Bikes', titleZh: '印度不断发展的电动自行车制造生态系统', tagEn: 'Global Manufacturing', tagZh: '全球制造', date: '2026-05-27', image: 'news-4261.jpg' },
        { id: 'freight-volatility', titleEn: '2026 Freight Volatility: Practical Packaging Strategies to Cut Logistics Costs', titleZh: '2026货运波动：降低物流成本的实用包装策略', tagEn: 'Supply Chain', tagZh: '供应链', date: '2026-05-25', image: 'news-4251.jpg' },
        { id: 'electric-mopeds-sea', titleEn: 'Electric Mopeds Reshape Urban Mobility Across Southeast Asia', titleZh: '电动助力车重塑东南亚城市出行', tagEn: 'Market Analysis', tagZh: '市场分析', date: '2026-05-22', image: 'news-062.jpg' },
        { id: 'china-design-manufacturing', titleEn: 'China Design + Manufacturing Excellence Reshapes Micromobility', titleZh: '中国设计+制造卓越重塑微出行格局', tagEn: 'Industry Insight', tagZh: '行业洞察', date: '2026-05-20', image: 'news-4281.jpg' },
        { id: 'circular-economy', titleEn: 'Circular Economy 2026: Recyclability of E-Bike Components', titleZh: '循环经济2026：电动自行车组件的可回收性', tagEn: 'Sustainable Mobility', tagZh: '可持续出行', date: '2026-05-17', image: 'news-4271.jpg' },
        { id: 'lithium-battery-range', titleEn: 'High Energy Density Lithium Batteries Extend Electric Scooter Range', titleZh: '高能量密度锂电池延长电动滑板车续航', tagEn: 'Electric Mobility', tagZh: '电动出行', date: '2026-05-14', image: 'news-4241.jpg' },
        { id: 'urban-mobility-guide', titleEn: '2026 Urban Two-Wheel Mobility: Market Access Model Guide', titleZh: '2026城市两轮出行：市场准入模式指南', tagEn: 'Electric Mobility Compliance', tagZh: '电动出行合规', date: '2026-05-11', image: 'news-4231.jpg' },
        { id: 'japan-ebike-surge', titleEn: 'Japan E-Bike Market Surge: Silver Age and Female Riders', titleZh: '日本电动自行车市场激增：银发族与女性骑手', tagEn: 'Urban Electric Mobility', tagZh: '城市电动出行', date: '2026-05-08', image: 'news-060.jpg' },
        { id: 'china-cycle-2026', titleEn: 'CHINA CYCLE 2026 Highlights Global E-bike Supply Chain', titleZh: 'CHINA CYCLE 2026 聚焦全球电动自行车供应链', tagEn: 'Exhibition', tagZh: '展会', date: '2026-05-05', image: 'news-059.jpg' },
        { id: 'bike-to-work', titleEn: 'Bike to Work Day 2026: E-Bike Commuting Solutions Rise', titleZh: '2026骑车上班日：电动自行车通勤方案兴起', tagEn: 'Industry Trends', tagZh: '行业趋势', date: '2026-05-03', image: 'news-056.jpg' },
        { id: 'canton-fair-139-phase3', titleEn: 'Canton Fair 139 Phase 3: PXID Booth Live & Visitor Guide', titleZh: '广交会139期第三阶段：PXID展位直击与参观指南', tagEn: 'Canton Fair', tagZh: '广交会', date: '2026-05-01', image: 'news-055.jpg' },
        { id: 'labor-day-lowcarbon', titleEn: 'Labor Day 2026: Low-Carbon Mobility and Manufacturing Value', titleZh: '2026劳动节：低碳出行与制造价值', tagEn: 'Electric Mobility', tagZh: '电动出行', date: '2026-04-29', image: 'news-054.jpg' },
        { id: 'canton-fair-139-preview', titleEn: 'Join PXID at Canton Fair 139: Explore New E-Bikes & Scooters', titleZh: '相约广交会139期：探索新款电动自行车与滑板车', tagEn: 'B2B Electric Mobility', tagZh: 'B2B 电动出行', date: '2026-04-27', image: 'news-057.jpg' },
        { id: 'cycle-mode-tokyo', titleEn: 'CYCLE MODE TOKYO 2026: Lightweight Commuters and E-Bike Highlights', titleZh: 'CYCLE MODE TOKYO 2026：轻量通勤与电动自行车亮点', tagEn: 'Urban Electric Mobility', tagZh: '城市电动出行', date: '2026-04-24', image: 'news-058.jpg' },
        { id: 'ebike-sharing-fail', titleEn: 'Why 80% of Global E-Bike Sharing Projects Fail by Year Three', titleZh: '为何80%全球电动自行车共享项目三年内失败', tagEn: 'Market Analysis', tagZh: '市场分析', date: '2026-04-23', image: 'news-061.jpg' },
        { id: 'earth-day-emobility', titleEn: 'World Earth Day 2026: E-Mobility Driving Low-Carbon Transportation', titleZh: '2026世界地球日：电动出行推动低碳交通', tagEn: 'Sustainable Transportation', tagZh: '可持续交通', date: '2026-04-22', image: 'news-066.jpg' }
    ];

    var ARTICLE_MAP = {};
    var ARTICLE_ORDER = [];
    for (var i = 0; i < ARTICLES.length; i++) {
        ARTICLE_MAP[ARTICLES[i].id] = ARTICLES[i];
        ARTICLE_ORDER.push(ARTICLES[i].id);
    }

    function getLang() {
        return localStorage.getItem('pxid-lang') || 'en';
    }

    function getArticleId() {
        var search = window.location.search || '';
        var match = search.match(/[?&]id=([^&]+)/);
        if (match) return match[1];
        return ARTICLE_ORDER[0];
    }

    function formatDate(dateStr, lang) {
        var parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        var y = parts[0], m = parseInt(parts[1], 10), d = parseInt(parts[2], 10);
        if (lang === 'zh') return y + '年' + m + '月' + d + '日';
        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return months[m - 1] + ' ' + d + ', ' + y;
    }

    function generateContent(title, tag, lang) {
        if (lang === 'zh') {
            return '<h2>' + title + '</h2>' +
                '<p>本文详细介绍了<strong>' + tag + '</strong>相关内容。PXID 作为全球领先的电动出行 OEM/ODM 制造商，致力于为全球品牌提供高品质的电动自行车、电动摩托车和电动滑板车产品。</p>' +
                '<h3>行业背景</h3>' +
                '<p>随着全球电动出行市场的快速发展，越来越多的品牌和企业开始关注' + tag + '领域的创新与应用。PXID 凭借多年的行业经验和技术积累，为客户提供从设计到量产的一站式解决方案。</p>' +
                '<h3>核心要点</h3>' +
                '<ul>' +
                '<li><strong>市场趋势</strong>：全球电动出行市场持续增长，新技术、新模式不断涌现</li>' +
                '<li><strong>技术创新</strong>：电池能量密度提升、智能互联功能增强、轻量化材料应用</li>' +
                '<li><strong>合规要求</strong>：各地区市场准入标准日益完善，合规能力成为核心竞争力</li>' +
                '<li><strong>供应链优化</strong>：多元化生产布局提升供应链韧性</li>' +
                '</ul>' +
                '<h3>PXID 优势</h3>' +
                '<table><thead><tr><th>能力</th><th>详情</th></tr></thead><tbody>' +
                '<tr><td><strong>研发设计</strong></td><td>12年+ 电动出行产品开发经验，完整的工业设计与工程能力</td></tr>' +
                '<tr><td><strong>智能制造</strong></td><td>约 25,000㎡ 智能制造基地，MES 数字化生产系统</td></tr>' +
                '<tr><td><strong>品质管控</strong></td><td>全流程质量检测，符合 CE、EN15194 等国际标准</td></tr>' +
                '<tr><td><strong>ODM/OEM 服务</strong></td><td>从概念到量产的一站式定制化解决方案</td></tr>' +
                '</tbody></table>' +
                '<h3>产品应用</h3>' +
                '<p>PXID 的产品广泛应用于城市通勤、休闲骑行、共享出行、物流配送等多个场景，为全球客户提供可靠的电动出行解决方案。</p>' +
                '<h3>结语</h3>' +
                '<p>如需了解更多关于' + tag + '的信息，或探讨 ODM/OEM 合作机会，欢迎联系 PXID 团队。</p>';
        } else {
            return '<h2>' + title + '</h2>' +
                '<p>This article provides detailed insights into <strong>' + tag + '</strong>. As a leading global electric mobility OEM/ODM manufacturer, PXID is committed to delivering high-quality e-bikes, e-motorcycles, and e-scooters for brands worldwide.</p>' +
                '<h3>Industry Background</h3>' +
                '<p>With the rapid development of the global electric mobility market, more and more brands and companies are focusing on innovation and applications in the ' + tag + ' field. With years of industry experience and technical accumulation, PXID provides one-stop solutions from design to mass production for our customers.</p>' +
                '<h3>Key Highlights</h3>' +
                '<ul>' +
                '<li><strong>Market Trends</strong>: The global e-mobility market continues to grow, with new technologies and models emerging</li>' +
                '<li><strong>Technology Innovation</strong>: Higher battery energy density, enhanced smart connectivity, lightweight materials</li>' +
                '<li><strong>Compliance</strong>: Market access standards are improving globally, making compliance a core competency</li>' +
                '<li><strong>Supply Chain Optimization</strong>: Diversified production layout improves supply chain resilience</li>' +
                '</ul>' +
                '<h3>PXID Advantages</h3>' +
                '<table><thead><tr><th>Capability</th><th>Details</th></tr></thead><tbody>' +
                '<tr><td><strong>R&D and Design</strong></td><td>12+ years of e-mobility product development, complete industrial design and engineering capabilities</td></tr>' +
                '<tr><td><strong>Smart Manufacturing</strong></td><td>Approx. 25,000 sqm smart manufacturing base with MES digital production systems</td></tr>' +
                '<tr><td><strong>Quality Control</strong></td><td>Full-process quality inspection, compliant with CE, EN15194 and other international standards</td></tr>' +
                '<tr><td><strong>ODM/OEM Services</strong></td><td>One-stop customized solutions from concept to mass production</td></tr>' +
                '</tbody></table>' +
                '<h3>Product Applications</h3>' +
                '<p>PXID products are widely used in urban commuting, leisure riding, shared mobility, logistics delivery, and many other scenarios, providing reliable electric mobility solutions for customers worldwide.</p>' +
                '<h3>Conclusion</h3>' +
                '<p>To learn more about ' + tag + ' or to discuss ODM/OEM partnership opportunities, please contact the PXID team.</p>';
        }
    }

    function renderArticle() {
        var container = document.getElementById('articleContainer');
        if (!container) return;

        var id = getArticleId();
        var article = ARTICLE_MAP[id];
        var lang = getLang();

        if (!article) {
            container.innerHTML = '<div class="article-header"><h1>Article not found</h1></div>' +
                '<p>The requested article could not be found. <a href="新闻页.html">&larr; Back to News</a></p>';
            return;
        }

        var idx = ARTICLE_ORDER.indexOf(id);
        var prevId = idx > 0 ? ARTICLE_ORDER[idx - 1] : null;
        var nextId = idx < ARTICLE_ORDER.length - 1 ? ARTICLE_ORDER[idx + 1] : null;

        var title = lang === 'zh' ? article.titleZh : article.titleEn;
        var tag = lang === 'zh' ? article.tagZh : article.tagEn;
        var dateStr = formatDate(article.date, lang);
        var bodyHtml = generateContent(title, tag, lang);

        var featureImg = '';
        if (article.image) {
            featureImg = '<div class="article-featured-img"><img src="' + article.image + '" alt="' + title + '" style="width:100%;height:100%;object-fit:cover;"></div>';
        } else {
            featureImg = '<div class="article-featured-img"></div>';
        }

        var html = '';
        html += '<div class="article-header">';
        html += '  <div class="article-date">' + dateStr + ' &middot; ' + tag + '</div>';
        html += '  <h1>' + title + '</h1>';
        html += '  <span class="article-tag">' + tag + '</span>';
        html += '</div>';
        html += featureImg;
        html += '<div class="article-body">' + bodyHtml + '</div>';
        html += '<div class="article-nav">';
        if (prevId) {
            html += '<a href="新闻详情.html?id=' + prevId + '">&larr; ' + (lang === 'zh' ? '上一篇' : 'Previous') + '</a>';
        } else {
            html += '<span></span>';
        }
        if (nextId) {
            html += '<a href="新闻详情.html?id=' + nextId + '">' + (lang === 'zh' ? '下一篇' : 'Next') + ' &rarr;</a>';
        } else {
            html += '<span></span>';
        }
        html += '</div>';
        html += '<div style="margin-top:40px;"><a href="新闻页.html" style="color:var(--brand-primary);text-decoration:none;font-weight:600;">&larr; ' + (lang === 'zh' ? '返回新闻列表' : 'Back to News') + '</a></div>';

        container.innerHTML = html;
        document.title = title + ' | PXID';
    }

    var origToggleLang = window.toggleLang;
    if (typeof origToggleLang === 'function') {
        window.toggleLang = function () {
            origToggleLang.apply(this, arguments);
            setTimeout(renderArticle, 0);
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderArticle);
    } else {
        renderArticle();
    }

    window.__PXID_NEWS__ = { renderArticle: renderArticle, ARTICLES: ARTICLES };
})();
