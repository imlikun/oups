#!/usr/bin/env python3
"""
PXID v4.1: fix partial-match word-boundary issue + add missing product page entries
"""
import os, re, glob

BASE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "pxid")

CLEAN_SCRIPT = """<script>
(function() {
  var LANG_KEY = 'pxid-lang';
  var PRODUCT_IMAGES = {
    "antelope-p5": "antelope-p5.jpg", "mantis-p6": "mantis-p6.jpg",
    "light-p4": "light-p4.jpg", "light-p2": "light-p2.jpg",
    "e-motorcycle-p8": "e-motorcycle-p8.jpg", "e-motorcycle-p9": "e-motorcycle-p9.jpg",
    "offroad-emoto": "offroad-emoto.jpg", "urban-p1": "urban-p1.jpg",
    "urban-p3": "urban-p3.jpg", "bestride": "bestride.jpg", "bestride-pro": "bestride-pro.jpg"
  };
  
  var T = JSON.parse('T_DICT_PLACEHOLDER');
  
  function getImageBase() {
    var p = window.location.pathname.replace(/\\/$/,''), d = Math.max(0,(p.match(/\\//g)||[]).length-1);
    if (d<=0) return './images/products/';
    for(var i=1,a=[];i<=d;i++) a.push('..');
    return a.join('/')+'/images/products/';
  }
  function getCurrentSlug() {
    var p = window.location.pathname.replace(/\\/$/,'').split('/');
    return p[p.length-1];
  }

  function getLang() {
    var u = new URLSearchParams(window.location.search), l = u.get('lang');
    if(l==='zh'||l==='en'){localStorage.setItem(LANG_KEY,l);return l;}
    var s = localStorage.getItem(LANG_KEY);
    return (s==='zh'||s==='en')?s:'en';
  }
  function setLang(lang) {
    localStorage.setItem(LANG_KEY,lang);
    document.documentElement.lang = lang==='zh'?'zh-CN':'en';
    var u = new URL(window.location); u.searchParams.set('lang',lang);
    window.history.replaceState({},'',u); applyLang(lang);
  }

  function applyLang(lang) {
    // Update toggle button styles
    var btns = document.querySelectorAll('[aria-label="Toggle language"]');
    for(var b=0;b<btns.length;b++){
      var sp = btns[b].querySelectorAll('span');
      for(var s=0;s<sp.length;s++){
        var t = sp[s].textContent.trim();
        if(t==='EN') sp[s].className = lang==='en'?'font-bold text-brand-600':'text-navy-400';
        if(t==='\\u4e2d\\u6587') sp[s].className = lang==='zh'?'font-bold text-brand-600':'text-navy-400';
      }
    }
    
    // Fresh scan every time — never cache nodes
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT,
      {acceptNode:function(n){
        var t=n.textContent.trim(); if(!t||t.length>500||t.length<1) return NodeFilter.FILTER_REJECT;
        var p=n.parentElement; if(!p||p.tagName==='SCRIPT'||p.tagName==='STYLE') return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }}, false);
    
    var cnt=0, node;
    while(node=w.nextNode()){
      var text=node.textContent.trim(); if(!text) continue;
      
      if(lang==='zh'){
        if(T.hasOwnProperty(text) && T[text]!==text){
          node.textContent=node.textContent.replace(text,T[text]); cnt++;
        } else {
          // Substring match with word-boundary check (skip keys <4 chars)
          var bk='';
          for(var k in T){if(k.length<4)continue;
            var idx=text.indexOf(k); if(idx===-1)continue;
            var bo=idx===0||/[\\s\\u3000]/.test(text[idx-1]);
            var ao=idx+k.length===text.length||/[\\s\\u3000]/.test(text[idx+k.length]);
            if(bo&&ao&&k.length>bk.length) bk=k;
          }
          if(bk&&T[bk]!==bk){node.textContent=node.textContent.replace(bk,T[bk]);cnt++;}
        }
      } else {
        // ZH -> EN reverse lookup
        for(var k in T){if(T[k]===text){node.textContent=node.textContent.replace(text,k);cnt++;break;}}
      }
    }
    
    // data-en/data-zh attributes
    var dls=document.querySelectorAll('[data-en]');
    for(var j=0;j<dls.length;j++){
      var el=dls[j], t=lang==='zh'?el.getAttribute('data-zh'):el.getAttribute('data-en');
      if(t&&el.children.length===0){el.textContent=t;cnt++;}
    }
    return cnt;
  }

  function toggleLang(){var c=getLang();setLang(c==='zh'?'en':'zh');}

  function replaceImages(){
    var base=getImageBase(), r=0;
    var cards=document.querySelectorAll('a[href*="/products/"]');
    for(var i=0;i<cards.length;i++){
      var l=cards[i], h=l.getAttribute('href')||'', m=h.match(/products\\/([^\\/]+)\\/?$/);
      if(!m||!PRODUCT_IMAGES[m[1]]) continue;
      var gs=l.querySelectorAll('[class*="bg-gradient-to-br"]');
      for(var g=0;g<gs.length;g++){
        var d=gs[g]; if(d.querySelector('img')) continue;
        d.innerHTML=''; d.style.cssText='position:relative;overflow:hidden;';
        var img=document.createElement('img');
        img.src=base+PRODUCT_IMAGES[m[1]]; img.alt=m[1].toUpperCase();
        img.style.cssText='width:100%;height:100%;object-fit:cover;position:absolute;inset:0;';
        img.loading='lazy'; img.onerror=function(){this.style.display='none';};
        d.appendChild(img); r++;
      }
    }
    var hs=document.querySelectorAll('[class*="rounded-2xl"][class*="bg-gradient-to-br"]');
    for(var j=0;j<hs.length;j++){
      var d=hs[j]; if(d.querySelector('img')) continue;
      var cs=getCurrentSlug(); if(!PRODUCT_IMAGES[cs]) continue;
      d.innerHTML=''; d.style.cssText='position:relative;overflow:hidden;';
      var img=document.createElement('img');
      img.src=base+PRODUCT_IMAGES[cs]; img.alt=cs.toUpperCase();
      img.style.cssText='width:100%;height:100%;object-fit:cover;position:absolute;inset:0;';
      img.loading='lazy'; img.onerror=function(){this.style.display='none';};
      d.appendChild(img); r++;
    }
    return r;
  }

  var initLang=getLang();
  document.documentElement.lang=initLang==='zh'?'zh-CN':'en';
  
  document.addEventListener('click',function(e){
    var b=e.target.closest('[aria-label="Toggle language"]');
    if(b){e.preventDefault();e.stopPropagation();toggleLang();}
  },true);
  
  var _tTimer=null;
  function delayedApply(){
    if(_tTimer) clearTimeout(_tTimer);
    _tTimer=setTimeout(function(){applyLang(getLang());_tTimer=null;},150);
  }
  
  function init(){
    delayedApply();
    [600,1800,3500,6000,10000].forEach(function(d){setTimeout(delayedApply,d);});
    
    var obs=new MutationObserver(function(ms){
      var n=0; for(var m=0;m<ms.length;m++) n+=ms[m].addedNodes.length;
      if(n>3&&getLang()==='zh') delayedApply();
    });
    obs.observe(document.body,{childList:true,subtree:true});
    
    var ia=0;
    function tryImg(){
      if(replaceImages()>0&&ia===0){
        var io=new MutationObserver(function(){setTimeout(replaceImages,200);});
        io.observe(document.body,{childList:true,subtree:true});
      }
      ia++; if(ia<12) setTimeout(tryImg,ia===0?100:500);
    }
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',tryImg);
    else tryImg();
    setTimeout(function(){replaceImages();},6000);
  }
  init();
  
  window.__pxid_toggleLang=toggleLang;
  window.__pxid_getLang=getLang;
  window.__pxid_setLang=setLang;
  window.__pxid_applyLang=applyLang;
  window.__pxid_replaceImages=replaceImages;
})();
</script>"""

# Build the T dictionary as a proper JSON string (Python handles the encoding)
import json

T_DICT = {
    # Navigation
    "Home": "首页",
    "Products": "产品中心",
    "ODM Services": "ODM 服务",
    "About": "关于我们",
    "Insights": "新闻动态",
    "News": "新闻动态",
    "Contact": "联系我们",
    "Get a Quote": "获取报价",
    
    # Hero
    "OEM / ODM Manufacturer": "OEM / ODM 制造商",
    "Manufacturer": "制造商",
    "Electric Bike & Scooter OEM/ODM Manufacturer": "电动自行车 & 滑板车 OEM/ODM 制造商",
    "Request a Quote": "申请报价",
    "View Products": "查看产品",
    "View All Products": "查看全部产品",
    "All Products": "全部产品",
    "Learn More": "了解更多",
    "Get in Touch": "联系我们",
    "Contact Us": "联系我们",
    
    # CTA links
    "View Details": "查看详情",
    "View Details →": "查看详情 →",
    "All Articles": "全部文章",
    "All Articles →": "全部文章 →",
    "All Products →": "全部产品 →",
    "Learn More →": "了解更多 →",
    
    # Hero tagline
    "From concept to mass production — PXID delivers production-ready electric mobility solutions for global brands. E-bikes, e-motorcycles, and e-scooters with in-house tooling, MES quality control, and 200,000+ units annually.":
        "从设计到量产 — PXID 为全球品牌提供生产级电动出行解决方案。电动自行车、电动摩托车、电动滑板车，拥有自有工装、MES 质量控制，年产20万+台。",
    
    # Stats
    "Years Experience": "年行业经验",
    "Patents": "专利",
    "Units / Year": "台 / 年",
    "Export Countries": "出口国家",
    "Industry Awards": "行业奖项",
    "Copyright Patents": "著作权专利",
    "Production Area": "生产面积",
    "Units Annually": "年产量",
    "R&D Engineers": "研发工程师",
    
    # Sections
    "Product Portfolio": "产品系列",
    "Electric Mobility Solutions": "电动出行解决方案",
    "Electric Bikes": "电动自行车",
    "Electric Motorcycles": "电动摩托车",
    "Electric Scooters": "电动滑板车",
    "Off-Road E-Motorcycle": "越野电动摩托车",
    
    # Product descriptions
    "Fat tire, all-terrain, urban, and folding e-bikes for global markets.": "为全球市场定制的肥胎、全地形、城市及折叠电动自行车。",
    "Urban, performance, and off-road electric motorcycles for OEM/ODM.": "面向 OEM/ODM 的城市、性能及越野电动摩托车。",
    "Seated, off-road, lightweight, and sharing-ready e-scooters.": "座式、越野、轻量及共享型电动滑板车。",
    "OEM/ODM manufacturing for e-bikes, e-motorcycles, and e-scooters — tailored for global markets.":
        "OEM/ODM 电动自行车、电动摩托车、电动滑板车制造 — 为全球市场定制。",
    
    # Product card labels
    "US spec · Long-range battery · High-performance motor": "美规 · 长续航电池 · 高性能电机",
    "Fat tire · All-terrain · Off-road capable": "肥胎 · 全地形 · 越野能力",
    "Lightweight urban · CE certified · EU compliant": "轻量城市 · CE认证 · 欧盟合规",
    "Compact folding · 36V · CE certified · Portable": "紧凑折叠 · 36V · CE认证 · 便携",
    "Urban commuting · Smart display · City cruiser": "城市通勤 · 智能显示屏 · 城市巡航",
    "High performance · Long range · Premium design": "高性能 · 长续航 · 高端设计",
    "Dual suspension · Off-road tires · Adventure ready": "双减震 · 越野轮胎 · 探险就绪",
    "Seated comfort · 500W · 48V · Daily commuting": "座式舒适 · 500W · 48V · 日常通勤",
    "Upgraded power · Longer range · Enhanced comfort": "升级动力 · 更长续航 · 增强舒适",
    "Lightweight · Portable · App connected": "轻量 · 便携 · App连接",
    "Pro performance · GPS · Sharing ready": "专业性能 · GPS · 共享就绪",
    
    # Capabilities
    "Core Capabilities": "核心能力",
    "Manufacturing Excellence": "制造卓越",
    "Turning Concepts into Market-Ready Products": "将创意转化为市场就绪产品",
    "In-House Tooling & Engineering": "自有工装与工程",
    "T4/T6 Heat Treatment for Scalable ODM": "T4/T6 热处理——可规模化 ODM",
    "Coating Systems Built for Mass Production": "量产级涂装系统",
    "No Anti-Dumping Fee": "无反倾销关税",
    "MES-Driven Zero-Defect Manufacturing": "MES驱动零缺陷制造",
    
    # Capability descriptions
    "13+ years of global manufacturing experience and 200+ international patents. Production-oriented vehicle and structural design with industrial design, CMF, and engineering feasibility.":
        "13年+全球制造经验，200+国际专利。生产导向的车辆与结构设计，融合工业设计、CMF与工程可行性。",
    "Reduce time-to-market by 30% with in-house mold manufacturing and rapid prototyping, ensuring micron-level tolerance and design integrity.":
        "自有模具制造与快速原型将上市时间缩短30%，确保微米级公差与设计完整性。",
    "Standardized heat treatment enhances strength, toughness, and fatigue resistance of aluminum components for large-scale mobility manufacturing.":
        "标准化热处理提升铝合金部件的强度、韧性与疲劳抵抗力，适配大规模出行制造。",
    "Integrated painting and surface treatment lines covering pretreatment, e-coating, spraying, and curing with global environmental compliance.":
        "集成涂装与表面处理线，涵盖前处理、电泳、喷涂及固化，全球环保合规。",
    "High-performance batteries and motors manufactured in India, ensuring competitive pricing without anti-dumping fees for global exports.":
        "高性能电池与电机在印度制造，确保全球出口无反倾销关税的竞争力定价。",
    "100% component traceability with real-time MES tracking. ISO-compliant, high-performance fleet components with zero production variables.":
        "100%零部件追溯，实时MES跟踪。ISO合规，零生产变量的高性能车队零部件。",
    
    # ODM Process
    "ODM Process": "ODM 流程",
    "From Product Concept to Mass Production": "从产品概念到大规模生产",
    "A proven 9-step ODM workflow trusted by global electric mobility brands.":
        "经过验证的9步ODM工作流，备受全球电动出行品牌信赖。",
    
    # ODM Step titles
    "Product Design": "产品设计",
    "Structural Design": "结构设计",
    "Electrical Control System": "电气控制系统",
    "Engineering Prototype": "工程样机",
    "Mold Design & Fabrication": "模具设计与制造",
    "Frame Manufacturing": "车架制造",
    "Paint & Coating Line": "涂装与涂层线",
    "Testing & Quality Detection": "测试与质量检测",
    "Mass Production": "大规模生产",
    
    # ODM Step descriptions
    "Interpret your ideas through hand-drawing and 3D rendering, intuitively and accurately.":
        "通过手绘和3D渲染直观准确地转化您的想法。",
    "Turn ID design into components considering cost, material selection, processing, and maintainability.":
        "将ID设计转化为部件，考虑成本、材料选择、加工和可维护性。",
    "Battery management, assistive systems, brake control, safety and intelligent functions — all customizable.":
        "电池管理、辅助系统、刹车控制、安全与智能功能 — 全部可定制。",
    "Build a real, ride-able prototype to verify mechanical structure and component performance.":
        "打造真实可骑行样机，验证机械结构和部件性能。",
    "Independent tooling design, manufacturing and injection after prototype verification.":
        "样机验证后的独立工装设计、制造和注塑。",
    "CNC/EDM machines, injection machines, low-speed wire cutting and more.":
        "CNC/EDM机床、注塑机、低速线切割等。",
    "T4/T6 heat treatment, pretreatment ovens, primer curing, and cleanroom powder coating.":
        "T4/T6热处理、前处理烘箱、底漆固化和洁净室粉末涂装。",
    "Over 20 performance tests including road tests for the first batch, exceeding industry standards.":
        "20+项性能测试，包括首批次道路测试，超越行业标准。",
    "Three assembly lines to meet your various production needs at scale.":
        "三条装配线，满足您规模化的多样生产需求。",
    
    # ODM step "Next" labels
    "Next: Structural Design →": "下一步：结构设计 →",
    "Next: Electrical Control System →": "下一步：电气控制系统 →",
    "Next: Engineering Prototype →": "下一步：工程样机 →",
    "Next: Mold Design & Fabrication →": "下一步：模具设计与制造 →",
    "Next: Frame Manufacturing →": "下一步：车架制造 →",
    "Next: Paint & Coating Line →": "下一步：涂装与涂层线 →",
    "Next: Testing & Quality Detection →": "下一步：测试与质量检测 →",
    "Next: Mass Production →": "下一步：大规模生产 →",
    
    # Footer / bottom
    "Electric Mobility News": "电动出行新闻",
    "25,000m² production area, 3 assembly lines, scalable production for 30+ countries worldwide.":
        "25,000m²生产面积，3条装配线，面向30+国家的可扩展生产能力。",
    
    # Product detail pages
    "Specifications": "技术规格",
    "Features": "产品特点",
    "Description": "产品描述",
    "Related Products": "相关产品",
    "INQUIRY": "询价",
    "DETAIL": "详情",
    "Back to Products": "返回产品中心",
    "Technical Specifications": "技术规格",
    "Key Features": "核心特点",
    "Product Details": "产品详情",
    "About This Product": "关于本产品",
    "ODM Customization Services": "ODM 定制服务",
    "Why Global Brands Choose Us": "为什么全球品牌选择我们",
    "Certifications": "认证",
    "Design": "设计",
    "Performance": "性能",
    "Branding": "品牌",
    
    # Generic
    "Why Choose Us": "为什么选择我们",
    "Our Products": "我们的产品",
    "Services": "服务",
    "About Us": "关于我们",
    "Our Services": "我们的服务",
    "Our Story": "我们的故事",
    "Our Team": "我们的团队",
    "Careers": "加入我们",
    "Privacy Policy": "隐私政策",
    "Terms of Service": "服务条款",
}

# Replace placeholder with actual JSON
CLEAN_SCRIPT = CLEAN_SCRIPT.replace("'T_DICT_PLACEHOLDER'", json.dumps(json.dumps(T_DICT, ensure_ascii=False)))


def process_html_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()
    
    # Remove all old PXID scripts
    patterns = [
        r'__pxid_toggleLang', r'__pxid_getLang', r'__pxid_setLang',
        r'Product Image Replacement', r'Language Toggle System',
        r'PXID Enhancement', r'PXID v\d', r'var LANG_KEY = .pxid-lang',
        r'var PRODUCT_IMAGES =', r'PRODUCT_IMAGES\[', r'function getImageBase',
        r'window.__pxid_textNodes', r'__pxid_textNodes',
    ]
    
    script_re = re.compile(r'<script>(.*?)</script>', re.DOTALL)
    def should_remove(content):
        return any(re.search(p, content) for p in patterns)
    
    html = script_re.sub(lambda m: '' if should_remove(m.group(1)) else m.group(0), html)
    
    if 'PXID v4' in html:
        # Already v4.1 — update by removing old and injecting new
        html = script_re.sub(lambda m: '' if 'PXID v4:' in m.group(1) else m.group(0), html)
    
    body_end = html.rfind('</body>')
    if body_end == -1:
        print(f"  WARNING: No </body> in {os.path.basename(filepath)}")
        return
    
    html = html[:body_end] + '\n' + CLEAN_SCRIPT + '\n' + html[body_end:]
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html)
    
    print(f"  OK: {os.path.relpath(filepath, BASE_DIR)}")


def main():
    html_files = glob.glob(os.path.join(BASE_DIR, "**/*.html"), recursive=True)
    html_files = [f for f in html_files if '_next' not in f]
    print(f"PXID Fix v4.1 — Processing {len(html_files)} HTML files\n")
    for fp in sorted(html_files):
        process_html_file(fp)
    print(f"\nDone! Output: {BASE_DIR}/")

if __name__ == "__main__":
    main()
