/**
 * PXID SEO & Geo Optimization Engine
 * 统一管理全站SEO meta标签、结构化数据、Geo地理位置信息
 * 只需在每个HTML页面引入此文件并设置 data-seo-page 属性即可
 *
 * 用法：<script src="js/seo.js" data-seo-page="home" defer></script>
 */
(function () {
    'use strict';

    var BASE_URL = 'https://www.pxid.com';
    var SITE_NAME = 'PXID';
    var SITE_LOGO = BASE_URL + '/logo.png';
    var DEFAULT_IMAGE = BASE_URL + '/media/home/og-default.jpg';
    var TWITTER_HANDLE = '@pxidofficial';
    var SUPPORTED_LOCALES = ['en-US', 'zh-CN'];

    // 站点级结构化数据（Organization）
    var ORGANIZATION_SCHEMA = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "PXID",
        "legalName": "PXID Smart Mobility Co., Ltd.",
        "alternateName": "PXID 品向制造",
        "url": BASE_URL,
        "logo": SITE_LOGO,
        "description": "PXID is a global electric mobility OEM/ODM manufacturer specializing in e-bikes, e-motorcycles, and e-scooters. 13+ years of manufacturing experience, 40+ R&D engineers, 200+ international patents, 200K+ units/year capacity.",
        "foundingDate": "2011",
        "slogan": "Your Brand, Our Factory",
        "email": "inquiry@pxid.com",
        "telephone": "+86-189-3638-1099",
        "address": {
            "@type": "PostalAddress",
            "addressLocality": "Changzhou",
            "addressRegion": "Jiangsu",
            "addressCountry": "CN"
        },
        "contactPoint": [{
            "@type": "ContactPoint",
            "telephone": "+86-189-3638-1099",
            "contactType": "sales",
            "email": "inquiry@pxid.com",
            "areaServed": ["Worldwide", "Europe", "North America", "Asia-Pacific"],
            "availableLanguage": ["English", "Chinese"]
        }],
        "sameAs": [
            "https://pxid.en.alibaba.com",
            "https://wa.me/8618936381099"
        ]
    };

    // 站点级 WebSite 结构化数据
    var WEBSITE_SCHEMA = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "PXID - Smart Mobility OEM/ODM Manufacturer",
        "alternateName": "PXID 电动出行 OEM/ODM 制造商",
        "url": BASE_URL,
        "description": "Global electric mobility OEM/ODM manufacturer. E-bikes, e-motorcycles, and e-scooters for brands worldwide.",
        "inLanguage": ["en", "zh"],
        "publisher": {
            "@type": "Organization",
            "name": "PXID"
        }
    };

    // 页面级SEO配置
    var PAGE_CONFIG = {
        'home': {
            title: 'PXID – Smart Mobility OEM/ODM Manufacturer | E-Bikes, E-Scooters, E-Motorcycles',
            description: 'PXID is a leading OEM/ODM manufacturer of electric bikes, scooters, and motorcycles since 2011. 40+ R&D engineers, 200+ patents, 200K+ units/year. MOQ from 50 units. Get a quote in 24 hours.',
            keywords: 'electric bike manufacturer, e-bike OEM, e-scooter ODM, electric motorcycle factory, OEM ODM manufacturer China, PXID, custom e-bike, electric mobility, mobility OEM, electric vehicle manufacturing',
            type: 'website',
            schema: 'home'
        },
        'products': {
            title: 'Products – PXID Electric Mobility OEM/ODM | E-Bikes, E-Motorcycles, E-Scooters',
            description: 'Explore 13+ OEM/ODM ready electric mobility products: fat tire e-bikes, e-motorcycles, e-scooters. 200+ patents, certified for EU/NA/Asia markets. Customizable designs for your brand.',
            keywords: 'electric bike models, e-bike products, electric scooter models, e-motorcycle products, OEM electric vehicles, ODM e-bikes, fat tire e-bike, folding e-bike, electric mobility products',
            type: 'website',
            schema: 'products'
        },
        'odm': {
            title: 'ODM & OEM Services – PXID Smart Mobility Manufacturing | From Concept to Mass Production',
            description: 'Full-cycle ODM/OEM services for electric mobility: industrial design, engineering, prototyping, testing, mass production. 25,000㎡ smart factory, MES system, CE/UL/EN15194 certified.',
            keywords: 'ODM services, OEM services, electric bike manufacturing, e-bike design, product development, prototyping, mass production, electric mobility OEM, contract manufacturing, private label e-bike',
            type: 'website',
            schema: 'odm'
        },
        'news': {
            title: 'News & Insights – PXID Smart Mobility | Industry Trends & Product Updates',
            description: 'Latest news, industry insights, and product stories from PXID. E-bike market trends, manufacturing insights, trade show updates, and electric mobility industry analysis.',
            keywords: 'e-bike news, electric mobility insights, electric bike industry trends, OEM manufacturing news, PXID updates, trade show reports, electric vehicle market analysis',
            type: 'website',
            schema: 'news'
        },
        'about': {
            title: 'About PXID – Factory, R&D, Certifications | Electric Mobility OEM/ODM Manufacturer Since 2011',
            description: 'Learn about PXID: 13+ years OEM/ODM experience, 40+ R&D engineers, 200+ patents, 25,000㎡ smart factory. ISO 9001, CE, UL, EN15194 certified. Trusted by 30+ global brands.',
            keywords: 'about PXID, electric bike factory, OEM manufacturer history, R&D team, manufacturing certifications, ISO 9001, CE UL certified, electric mobility company, Changzhou manufacturer',
            type: 'website',
            schema: 'about'
        },
        'quote': {
            title: 'Get a Quote – PXID Electric Mobility OEM/ODM | Custom E-Bike, Scooter, Motorcycle',
            description: 'Request a custom quote for electric bikes, scooters, or motorcycles. Tell us your requirements and get a detailed quote within 24 hours. MOQ from 50 units. Worldwide shipping.',
            keywords: 'e-bike quote, electric scooter quote, OEM quote, ODM quote, custom electric bike price, electric motorcycle quote, manufacturing quote, bulk e-bike order',
            type: 'website',
            schema: 'quote'
        },
        'news-detail': {
            title: 'News Article – PXID Smart Mobility',
            description: 'Read the latest news and insights from PXID about electric mobility industry trends, manufacturing, and product updates.',
            keywords: 'PXID news, electric mobility news, e-bike industry news',
            type: 'article',
            schema: 'article'
        }
    };

    // 产品页SEO配置
    var PRODUCT_CONFIG = {
        'mantis-p6': {
            title: 'Mantis P6 Fat Tire E-Bike | 750W/1200W Motor, 115km Range | PXID OEM',
            description: 'Mantis P6: high-performance fat tire electric bike with 750W/1200W motor, 48V 20/35Ah battery, 115km max range, 20×4.0" fat tires. All-terrain e-bike for OEM/ODM customization.',
            keywords: 'Mantis P6, fat tire e-bike, 750W e-bike, 1200W electric bike, all-terrain e-bike, 115km range e-bike, OEM fat tire bike, PXID Mantis P6',
            category: 'E-Bikes',
            image: BASE_URL + '/media/mantis-p6/DM_20260704084032_002.PNG'
        },
        'antelope-p5': {
            title: 'Antelope P5 Award-Winning E-Bike | Golden Pin Design Award | PXID OEM',
            description: 'Antelope P5: award-winning electric bike with Golden Pin Design Award. IoT controller, GPS connectivity, modular battery. Full ODM support from concept to mass production.',
            keywords: 'Antelope P5, award winning e-bike, Golden Pin Design Award, IoT e-bike, GPS electric bike, smart e-bike, PXID Antelope P5, ODM e-bike',
            category: 'E-Bikes',
            image: BASE_URL + '/antelope-p5.jpg'
        },
        'urban-p1': {
            title: 'Urban P1 Folding E-Bike | Compact City Commuter | PXID OEM',
            description: 'Urban P1: compact folding electric bike designed for city commuting. Lightweight, portable, smart-connected. Ideal for urban mobility and shared bike programs.',
            keywords: 'Urban P1, folding e-bike, city e-bike, commuter electric bike, portable e-bike, urban mobility, PXID Urban P1, OEM folding bike',
            category: 'E-Bikes',
            image: BASE_URL + '/media/products/urban-p1.jpg'
        },
        'urban-p3': {
            title: 'Urban P3 Smart E-Bike | IoT Connected City Bike | PXID OEM',
            description: 'Urban P3: smart connected electric bike with IoT features. GPS tracking, app control, anti-theft. Perfect for urban commuting and bike-sharing programs.',
            keywords: 'Urban P3, smart e-bike, IoT electric bike, GPS e-bike, connected bike, city commuter, PXID Urban P3, OEM smart bike',
            category: 'E-Bikes',
            image: BASE_URL + '/media/products/urban-p3.jpg'
        },
        'px-4': {
            title: 'PX-4 Electric Motorcycle | High-Performance E-Moto | PXID OEM',
            description: 'PX-4: high-performance electric motorcycle with powerful motor, long-range battery, advanced BMS. Street-legal e-moto for urban and recreational riding. OEM/ODM customizable.',
            keywords: 'PX-4, electric motorcycle, e-moto, high performance e-motorcycle, electric street bike, PXID PX-4, OEM electric motorcycle',
            category: 'E-Motorcycles',
            image: BASE_URL + '/media/px-4/DM_20260704094013_001.PNG'
        },
        'm2': {
            title: 'M2 Electric Motorcycle | Power & Performance | PXID OEM',
            description: 'M2: powerful electric motorcycle designed for performance and durability. Advanced motor, long-range battery, premium components. OEM/ODM customization available.',
            keywords: 'M2, electric motorcycle, e-motorcycle, powerful e-moto, PXID M2, OEM electric motorcycle, performance e-bike',
            category: 'E-Motorcycles',
            image: BASE_URL + '/m2.jpg'
        },
        'mota-z1': {
            title: 'Mota Z1 Electric Motorcycle | Urban E-Moto | PXID OEM',
            description: 'Mota Z1: stylish urban electric motorcycle with efficient motor, smart display, and modern design. Perfect for city commuting. OEM/ODM manufacturing by PXID.',
            keywords: 'Mota Z1, electric motorcycle, urban e-moto, city electric bike, PXID Mota Z1, OEM e-motorcycle',
            category: 'E-Motorcycles',
            image: BASE_URL + '/media/mota-z1/DM_20260704094533_001.JPEG'
        },
        'mota-z3': {
            title: 'Mota Z3 Electric Motorcycle | Premium E-Moto | PXID OEM',
            description: 'Mota Z3: premium electric motorcycle with high-performance motor, advanced battery system, and cutting-edge design. OEM/ODM customizable for global brands.',
            keywords: 'Mota Z3, electric motorcycle, premium e-moto, high performance e-motorcycle, PXID Mota Z3, OEM electric bike',
            category: 'E-Motorcycles',
            image: BASE_URL + '/media/mota-z3/DM_20260704094258_001.JPEG'
        },
        'bestride-f1': {
            title: 'Bestride F1 Electric Scooter | Urban Commuter | PXID OEM',
            description: 'Bestride F1: sleek electric scooter designed for urban commuting. Lightweight, foldable, powerful motor, long battery life. OEM/ODM manufacturing by PXID.',
            keywords: 'Bestride F1, electric scooter, e-scooter, urban commuter scooter, folding e-scooter, PXID Bestride F1, OEM e-scooter',
            category: 'E-Scooters',
            image: BASE_URL + '/bestride-f1.jpg'
        },
        'bestride-pro-f2': {
            title: 'Bestride Pro F2 Electric Scooter | High-Performance | PXID OEM',
            description: 'Bestride Pro F2: high-performance electric scooter with powerful motor, extended range, premium build quality. Ideal for last-mile delivery and urban mobility. OEM/ODM.',
            keywords: 'Bestride Pro F2, electric scooter, high performance e-scooter, delivery scooter, PXID Bestride Pro F2, OEM electric scooter',
            category: 'E-Scooters',
            image: BASE_URL + '/bestride-pro-f2.jpg'
        },
        'bestride-pro-w2': {
            title: 'Bestride Pro W2 Electric Scooter | All-Terrain | PXID OEM',
            description: 'Bestride Pro W2: all-terrain electric scooter with robust motor, durable construction, and off-road capabilities. OEM/ODM manufacturing by PXID.',
            keywords: 'Bestride Pro W2, electric scooter, all-terrain e-scooter, off-road scooter, PXID Bestride Pro W2, OEM scooter',
            category: 'E-Scooters',
            image: BASE_URL + '/bestride-pro-w2.jpg'
        },
        'light-p2': {
            title: 'Light P2 Electric Scooter | Lightweight Commuter | PXID OEM',
            description: 'Light P2: ultra-lightweight electric scooter for effortless urban commuting. Portable, efficient, and stylish. OEM/ODM manufacturing by PXID.',
            keywords: 'Light P2, electric scooter, lightweight e-scooter, portable scooter, commuter e-scooter, PXID Light P2, OEM scooter',
            category: 'E-Scooters',
            image: BASE_URL + '/media/light-p2/DM_20260704093613_001.JPEG'
        },
        'light-p4': {
            title: 'Light P4 Electric Scooter | Compact City Scooter | PXID OEM',
            description: 'Light P4: compact and efficient electric scooter for city riding. Smart features, reliable performance, sleek design. OEM/ODM manufacturing by PXID.',
            keywords: 'Light P4, electric scooter, compact e-scooter, city scooter, PXID Light P4, OEM electric scooter',
            category: 'E-Scooters',
            image: BASE_URL + '/media/light-p4/DM_20260704093831_001.JPEG'
        }
    };

    // 辅助函数：创建并插入meta标签
    function createMeta(attr, name, content) {
        if (!content) return;
        var meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
    }

    function createLink(rel, href, attrs) {
        if (!href) return;
        var link = document.createElement('link');
        link.setAttribute('rel', rel);
        link.setAttribute('href', href);
        if (attrs) {
            for (var key in attrs) {
                if (attrs.hasOwnProperty(key)) {
                    link.setAttribute(key, attrs[key]);
                }
            }
        }
        document.head.appendChild(link);
    }

    function createJsonLd(data) {
        var script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        script.textContent = JSON.stringify(data);
        document.head.appendChild(script);
    }

    function getCurrentUrl() {
        var path = window.location.pathname.split('/').pop() || '首页.html';
        return BASE_URL + '/' + path;
    }

    function getPageSlug() {
        var path = window.location.pathname.split('/').pop().replace('.html', '');
        // 中文文件名映射
        var map = {
            '首页': 'home',
            '产品': 'products',
            'odm 服务': 'odm',
            '新闻页': 'news',
            '新闻详情': 'news-detail',
            'about us': 'about',
            '报价页面': 'quote'
        };
        if (map[path]) return map[path];
        return path;
    }

    function getPageImage(config) {
        if (config && config.image) return config.image;
        if (document.querySelector('meta[property="og:image"]')) {
            return document.querySelector('meta[property="og:image"]').getAttribute('content');
        }
        var firstImg = document.querySelector('img');
        if (firstImg && firstImg.src) {
            return firstImg.src;
        }
        return DEFAULT_IMAGE;
    }

    // 注入所有SEO标签
    function injectSEO() {
        var pageSlug = getPageSlug();
        var scriptTag = document.currentScript || document.querySelector('script[data-seo-page]');
        var seoPage = (scriptTag && scriptTag.getAttribute('data-seo-page')) || pageSlug;

        var config = PAGE_CONFIG[seoPage] || PRODUCT_CONFIG[seoPage] || PAGE_CONFIG['home'];
        var isProduct = !!PRODUCT_CONFIG[seoPage];
        var isArticle = config.type === 'article';
        var currentUrl = getCurrentUrl();
        var pageImage = getPageImage(config);

        // 1. 修正 html lang 属性（产品页错误设置为 zh-CN）
        if (isProduct) {
            document.documentElement.setAttribute('lang', 'en');
        }

        // 2. Meta Description
        if (!document.querySelector('meta[name="description"]')) {
            createMeta('name', 'description', config.description);
        }

        // 3. Meta Keywords
        if (!document.querySelector('meta[name="keywords"]')) {
            createMeta('name', 'keywords', config.keywords);
        }

        // 4. Canonical URL
        createLink('canonical', currentUrl);

        // 5. Geo 标签
        createMeta('name', 'geo.region', 'CN-JS');
        createMeta('name', 'geo.placename', 'Changzhou, Jiangsu, China');
        createMeta('name', 'geo.position', '31.7739;119.9776');
        createMeta('name', 'ICBM', '31.7739, 119.9776');

        // 6. hreflang 多语言标签
        SUPPORTED_LOCALES.forEach(function(locale) {
            createLink('alternate', currentUrl, {
                'hreflang': locale
            });
        });
        createLink('alternate', currentUrl, { 'hreflang': 'x-default' });

        // 7. Open Graph 标签
        createMeta('property', 'og:type', isArticle ? 'article' : (isProduct ? 'product' : 'website'));
        createMeta('property', 'og:site_name', SITE_NAME);
        createMeta('property', 'og:title', config.title || document.title);
        createMeta('property', 'og:description', config.description);
        createMeta('property', 'og:url', currentUrl);
        createMeta('property', 'og:image', pageImage);
        createMeta('property', 'og:image:width', '1200');
        createMeta('property', 'og:image:height', '630');
        createMeta('property', 'og:locale', 'en_US');
        createMeta('property', 'og:locale:alternate', 'zh_CN');

        // 8. Twitter Card 标签
        createMeta('name', 'twitter:card', 'summary_large_image');
        createMeta('name', 'twitter:site', TWITTER_HANDLE);
        createMeta('name', 'twitter:title', config.title || document.title);
        createMeta('name', 'twitter:description', config.description);
        createMeta('name', 'twitter:image', pageImage);

        // 9. robots meta
        createMeta('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
        createMeta('name', 'googlebot', 'index, follow');

        // 10. 作者和发布者
        createMeta('name', 'author', 'PXID');
        createMeta('name', 'publisher', 'PXID');

        // 11. 结构化数据 (JSON-LD)
        // 站点级数据（所有页面都注入）
        createJsonLd(ORGANIZATION_SCHEMA);
        createJsonLd(WEBSITE_SCHEMA);

        // 12. 面包屑导航结构化数据
        var breadcrumbs = { "@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [] };
        breadcrumbs.itemListElement.push({
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": BASE_URL
        });

        if (isProduct) {
            breadcrumbs.itemListElement.push({
                "@type": "ListItem",
                "position": 2,
                "name": "Products",
                "item": BASE_URL + '/产品.html'
            });
            breadcrumbs.itemListElement.push({
                "@type": "ListItem",
                "position": 3,
                "name": config.category,
                "item": BASE_URL + '/产品.html#' + seoPage
            });
            breadcrumbs.itemListElement.push({
                "@type": "ListItem",
                "position": 4,
                "name": document.title,
                "item": currentUrl
            });

            // 产品结构化数据
            var productSchema = {
                "@context": "https://schema.org",
                "@type": "Product",
                "name": document.title.split('|')[0].trim(),
                "description": config.description,
                "image": pageImage,
                "brand": { "@type": "Brand", "name": "PXID" },
                "manufacturer": {
                    "@type": "Organization",
                    "name": "PXID",
                    "url": BASE_URL
                },
                "category": config.category,
                "url": currentUrl
            };
            createJsonLd(productSchema);
        } else if (seoPage !== 'home') {
            breadcrumbs.itemListElement.push({
                "@type": "ListItem",
                "position": 2,
                "name": config.title.split('–')[0].trim() || config.title.split('|')[0].trim(),
                "item": currentUrl
            });
        }
        createJsonLd(breadcrumbs);

        // 13. 特定页面的结构化数据
        if (seoPage === 'home') {
            // LocalBusiness 结构化数据
            createJsonLd({
                "@context": "https://schema.org",
                "@type": "LocalBusiness",
                "@id": BASE_URL + "#localbusiness",
                "name": "PXID - Smart Mobility OEM/ODM Manufacturer",
                "image": SITE_LOGO,
                "url": BASE_URL,
                "telephone": "+86-189-3638-1099",
                "email": "inquiry@pxid.com",
                "priceRange": "$$",
                "address": {
                    "@type": "PostalAddress",
                    "addressLocality": "Changzhou",
                    "addressRegion": "Jiangsu",
                    "postalCode": "213000",
                    "addressCountry": "CN"
                },
                "geo": {
                    "@type": "GeoCoordinates",
                    "latitude": 31.7739,
                    "longitude": 119.9776
                },
                "openingHoursSpecification": [{
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                    "opens": "09:00",
                    "closes": "18:00"
                }],
                "areaServed": ["Worldwide", "Europe", "North America", "Asia-Pacific"]
            });
        }

        if (seoPage === 'odm') {
            createJsonLd({
                "@context": "https://schema.org",
                "@type": "Service",
                "serviceType": "OEM/ODM Manufacturing Services",
                "provider": {
                    "@type": "Organization",
                    "name": "PXID",
                    "url": BASE_URL
                },
                "areaServed": "Worldwide",
                "description": config.description,
                "url": currentUrl
            });
        }

        if (seoPage === 'quote') {
            createJsonLd({
                "@context": "https://schema.org",
                "@type": "ContactPage",
                "name": config.title,
                "description": config.description,
                "url": currentUrl,
                "mainEntity": {
                    "@type": "Organization",
                    "name": "PXID",
                    "email": "inquiry@pxid.com",
                    "telephone": "+86-189-3638-1099"
                }
            });
        }

        if (isArticle) {
            createJsonLd({
                "@context": "https://schema.org",
                "@type": "Article",
                "headline": document.title,
                "image": pageImage,
                "datePublished": new Date().toISOString(),
                "dateModified": new Date().toISOString(),
                "author": { "@type": "Organization", "name": "PXID" },
                "publisher": {
                    "@type": "Organization",
                    "name": "PXID",
                    "logo": { "@type": "ImageObject", "url": SITE_LOGO }
                },
                "description": config.description,
                "mainEntityOfPage": {
                    "@type": "WebPage",
                    "@id": currentUrl
                }
            });
        }

        // 14. 更新页面标题（如果配置了更好的标题）
        if (config.title && config.title.length > document.title.length) {
            document.title = config.title;
        }

        // 15. 性能优化：添加 preconnect / DNS-prefetch（仅添加缺失的）
        var preconnects = [
            'https://cdnjs.cloudflare.com',
            'https://fonts.gstatic.com'
        ];
        preconnects.forEach(function(url) {
            if (!document.querySelector('link[rel="preconnect"][href="' + url + '"]')) {
                createLink('preconnect', url, { 'crossorigin': '' });
            }
        });

        // 16. 添加 theme-color meta
        if (!document.querySelector('meta[name="theme-color"]')) {
            createMeta('name', 'theme-color', '#0059FF');
        }

        // 17. 添加 apple-mobile-web-app 标签
        createMeta('name', 'apple-mobile-web-app-capable', 'yes');
        createMeta('name', 'apple-mobile-web-app-status-bar-style', 'black-translucent');
        createMeta('name', 'apple-mobile-web-app-title', 'PXID');

        // 18. 添加 format-detection
        if (!document.querySelector('meta[name="format-detection"]')) {
            createMeta('name', 'format-detection', 'telephone=no, email=no, address=no');
        }
    }

    // DOM ready 后执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectSEO);
    } else {
        injectSEO();
    }

    // 暴露给全局以便外部调用
    window.PXID_SEO = {
        inject: injectSEO,
        config: PAGE_CONFIG,
        products: PRODUCT_CONFIG,
        baseUrl: BASE_URL
    };
})();
