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
    // 视频用户后续自加，首页先聚焦图文栏目（技艺录为主）
    var arts=(d.articles||[]).filter(function(a){return a.status!=='draft' && a.category!=='video';});
    arts.sort(function(a,b){return (b.date||'').localeCompare(a.date||'');});
    // 每栏目前沿 1 篇，技艺录因发文频繁自然占多数
    var byCat={};
    arts.forEach(function(a){ if(!byCat[a.category]) byCat[a.category]=a; });
    var picked=Object.keys(byCat).map(function(k){return byCat[k];});
    var rest=arts.filter(function(a){return picked.indexOf(a)<0;});
    var top=picked.concat(rest).slice(0,5);
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
      var inner=thumb
        +'<div class="card-body">'
        +'<h3>'+esc(a.title||'')+'</h3>'
        +'<div class="card-meta"><span class="card-time">'+esc(a.date||'')+'</span><span class="card-cat">'+catName[cat]+'</span></div>'
        +'</div>';
      return '<a class="content-card" href="'+href+'">'+inner+'</a>';
    }
    grid.innerHTML = top.length ? top.map(function(a,i){return cardHTML(a,i===0);}).join('') : '';
  }).catch(function(e){console.warn('content.json 加载失败',e);});
}
renderLatest();

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
