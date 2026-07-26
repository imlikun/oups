/* ═══ appin.site 首页脚本（从 index.html 内联抽离） ═══ */
'use strict';

/* —— 最新内容：动态读取 content.json 渲染 Bento 卡片 —— */
function esc(s){return (s||'').replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
// 封面图加载失败时降级为品牌占位带
function thumbFallback(img){
  var t=img.closest('.content-thumb'); if(!t) return;
  t.classList.add('placeholder');
  t.innerHTML='<span class="ph-glyph">✎</span><span class="ph-cat">'+ (img.getAttribute('data-label')||'') +'</span>';
}
function renderLatest(){
  var grid=document.getElementById('content-grid');
  if(!grid)return;
  fetch('/content.json').then(function(r){return r.json();}).then(function(d){
    // —— 统计各栏目数量，动态填充 Stats Ribbon 与 Hero posts ——
    var all=d.articles||[];
    var counts={craft:0,notes:0,video:0};
    all.forEach(function(a){ if(a.status==='draft')return; if(counts.hasOwnProperty(a.category))counts[a.category]++; });
    var total=all.filter(function(a){return a.status!=='draft';}).length;
    var statEls=document.querySelectorAll('[data-stat]');
    for(var i=0;i<statEls.length;i++){var k=statEls[i].getAttribute('data-stat');statEls[i].textContent=(k==='total')?total:(counts[k]!=null?counts[k]:statEls[i].textContent);}
    var hp=document.getElementById('hero-posts'); if(hp)hp.textContent=total;
    // 视频用户后续自加，首页先聚焦图文栏目（技艺录为主）
    var arts=all.filter(function(a){return a.status!=='draft' && a.category!=='video';});
    // 置顶优先，再按发布时间倒序（pinned 字段在 content.json 控制）
    arts.sort(function(a,b){
      var pa=a.pinned?1:0, pb=b.pinned?1:0;
      if(pa!==pb) return pb-pa;
      return (b.date||'').localeCompare(a.date||'');
    });
    var top=arts.slice(0,5);
    var catName={craft:'技艺录',notes:'随笔',video:'视频','daily-digest':'每日阅读','ai-radar':'AI雷达'};
    function cardHTML(a,isLead){
      var cat=a.category||'craft';
      var href='/'+cat+'/'+(a.slug||'')+'.html';
      var img=a.image?(a.image.startsWith('/')?a.image:'/'+a.image):'';
      var thumb=img
        ? '<div class="content-thumb"><img src="'+img+'" alt="" loading="lazy" data-label="'+catName[cat]+'" onerror="thumbFallback(this)"></div>'
        : '<div class="content-thumb placeholder"><span class="ph-glyph">✎</span><span class="ph-cat">'+catName[cat]+'</span></div>';
      if(isLead){
        var body='<div class="card-body">'
          +'<span class="card-cat-top">'+catName[cat]+'</span>'
          +'<h3>'+esc(a.title||'')+'</h3>'
          +(a.excerpt?'<p class="card-excerpt">'+esc(a.excerpt)+'</p>':'')
          +'<div class="card-meta"><span class="card-time">'+esc(a.date||'')+'</span><span class="card-cat">'+catName[cat]+'</span></div>'
          +'</div>';
        return '<a class="content-card lead" href="'+href+'">'+thumb+body+'</a>';
      }
      // 小卡片：标题覆盖在图片底部（与有图占位保持视觉统一）
      var overlay='<div class="thumb-overlay">'
        +'<h3>'+esc(a.title||'')+'</h3>'
        +'<div class="thumb-meta"><span class="card-time">'+esc(a.date||'')+'</span><span class="card-cat">'+catName[cat]+'</span></div>'
        +'</div>';
      var inner=thumb.replace('</div>', overlay+'</div>');
      return '<a class="content-card" href="'+href+'">'+inner+'</a>';
    }
    grid.innerHTML = top.length ? top.map(function(a,i){return cardHTML(a,i===0);}).join('') : '';
  }).catch(function(e){console.warn('content.json 加载失败',e);});
}
renderLatest();

/* —— AI 雷达：从 ai-radar/index.html 内嵌数据动态渲染首页卡片 ——
   数据源为 ai-radar 页内 <script id="ai-data"> JSON（自动更新流程写入），
   首页同源 fetch 后提取 JSON 渲染前 4 条，不再写死。失败时保留 HTML 内静态降级卡。 */
function renderRadar(){
  var grid=document.getElementById('radar-grid');
  if(!grid) return;
  fetch('/ai-radar/index.html').then(function(r){return r.text();}).then(function(html){
    var m=html.match(/<script id="ai-data"[^>]*>([\s\S]*?)<\/script>/);
    if(!m) return;
    var raw=m[1].trim();
    var data;
    try{ data=JSON.parse(raw); }
    catch(e){ try{ data=JSON.parse(raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g,'')); }catch(e2){ return; } }
    var items=(data&&data.items)||[];
    if(!items.length) return;
    items.sort(function(a,b){ return new Date(b.publishedAt)-new Date(a.publishedAt); });
    var top=items.slice(0,4);
    var html2=top.map(function(it){
      var src=it.source||'AI 雷达';
      var summary=(it.summary||'').replace(/\s+/g,' ');
      if(summary.length>90) summary=summary.slice(0,90)+'…';
      return '<a class="radar-card" href="'+(it.url||'/ai-radar/')+'" target="_blank" rel="noopener">'
        +'<div class="radar-head"><span class="radar-src">↗ '+esc(src)+'</span></div>'
        +'<h3>'+esc(it.title||'')+'</h3>'
        +'<p>'+esc(summary)+'</p>'
        +'</a>';
    }).join('');
    grid.innerHTML=html2;
  }).catch(function(e){console.warn('ai-radar 数据加载失败，保留静态降级卡片',e);});
}
renderRadar();

/* —— Hero 打字机 —— */
(function(){
  document.addEventListener('DOMContentLoaded', function(){
    var el = document.getElementById('typed');
    if (!el) { console.warn('[typewriter] #typed not found'); return; }

    var phrases = ['独立开发者', '把想法做成产品', '独立开发者 · 把想法做成产品'];
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
      el.textContent = phrases[phrases.length - 1];
      var caret = el.nextElementSibling;
      if (caret) caret.style.display = 'none';
      return;
    }

    var pi = 0, ci = 0, deleting = false, timer = null;

    function tick() {
      var full = phrases[pi];
      if (!deleting) {
        el.textContent = full.slice(0, ++ci);
        if (ci >= full.length) { deleting = true; timer = setTimeout(tick, 1700); return; }
      } else {
        el.textContent = full.slice(0, --ci);
        if (ci <= 0) { deleting = false; pi = (pi + 1) % phrases.length; timer = setTimeout(tick, 380); return; }
      }
      timer = setTimeout(tick, deleting ? 34 : 62);
    }

    tick();
    console.log('[typewriter] started');
  });
})();
