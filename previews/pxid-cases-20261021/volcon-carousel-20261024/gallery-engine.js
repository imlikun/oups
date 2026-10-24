(function () {
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const key='pxid-volcon-gallery-variants-20261024-v2';
 const customModes=['accordion','mosaic','stepper','stack'];
 const tips={focus:'一张主图占满画面，文字叠在图上，左右切换。',split:'大图、下方缩略图和右侧介绍联动。',rail:'横向拖动画廊，下一张图片保持露出。',left:'左侧文字目录控制右侧画面，图片沿竖向切换。',right:'右侧竖排缩略图切换大图，方向与上一段形成变化。',accordion:'移入窄幅面板，画面横向展开；点击或键盘同样可选。',mosaic:'一张主图配细节小图，点击小图交换主次与说明。',stepper:'展开一道工序，阅读介绍，同时查看对应的工艺照片。',stack:'照片前后叠放，点击侧边照片或箭头，切换当前画面。'};
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 function button(cls,text){const n=el('button',cls,text);n.type='button';return n;}
 function image(item){const n=el('img');n.src=item.src;n.alt=item.title;n.loading='lazy';n.decoding='async';n.draggable=false;n.style.objectPosition=item.position;return n;}
 let prefs={};try{const value=JSON.parse(localStorage.getItem(key)||'{}');if(value&&typeof value==='object'&&!Array.isArray(value))prefs=value;}catch(_){}
 function save(id,mode,index){prefs[id]={mode,index};try{localStorage.setItem(key,JSON.stringify(prefs));}catch(_){}}
 const dialog=document.querySelector('.image-dialog');let opener=null;
 function openImage(item,trigger){opener=trigger;dialog.querySelector('img').src=item.src;dialog.querySelector('img').alt=item.title;dialog.querySelector('.dialog-toolbar p').textContent=item.title;dialog.showModal();}
 dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
 dialog.addEventListener('close',()=>{dialog.querySelector('img').removeAttribute('src');if(opener&&opener.isConnected)opener.focus({preventScroll:true});});
 const controllers=[];
 document.querySelectorAll('.case-section').forEach(section=>{
  const gallery=section.querySelector('.gallery'),viewport=gallery.querySelector('.gallery-viewport'),track=gallery.querySelector('.gallery-track');
  const slides=Array.from(track.children),options=Array.from(section.querySelectorAll('[data-layout]')),available=options.map(n=>n.dataset.layout);
  const items=slides.map(slide=>({src:slide.querySelector('img').getAttribute('src'),title:slide.querySelector('h3').textContent,copy:slide.querySelector('figcaption p').textContent,fit:slide.dataset.fit,position:slide.querySelector('img').style.objectPosition||'center'}));
  const counter=gallery.querySelector('.gallery-counter'),play=gallery.querySelector('.autoplay');
  const custom=el('div','gallery-custom');gallery.insertBefore(custom,viewport);
  const left=el('div','gallery-sidenav gallery-sidenav-left'),right=el('div','gallery-sidenav gallery-sidenav-right');
  left.setAttribute('role','group');left.setAttribute('aria-label','Select a scene from the left directory');
  right.setAttribute('role','group');right.setAttribute('aria-label','Select a scene from the right thumbnails');
  items.forEach((item,index)=>{
   const n=button('vertical-choice');n.dataset.imageIndex=index;
   n.append(el('span','choice-number',String(index+1).padStart(2,'0')),el('span','choice-title',item.title));left.append(n);
   const t=button('vertical-thumbnail');t.dataset.imageIndex=index;t.setAttribute('aria-label',item.title);t.append(image(item),el('span','',item.title));right.append(t);
  });gallery.insertBefore(left,viewport);gallery.insertBefore(right,viewport);
  const stored=prefs[section.id]||{};
  let current=Number.isInteger(stored.index)?Math.max(0,Math.min(items.length-1,stored.index)):0;
  let mode=available.includes(stored.mode)?stored.mode:section.dataset.defaultMode;
  let requested=null,drag=null,blockClick=false,queued=false,changing=false,surface=null;
  let playing=false,visible=false,pointer=false,timer=null,width=0;
  const isCustom=()=>customModes.includes(mode);
  const isVertical=()=>mode==='left'||mode==='right';
  function media(item){
   const box=el('div','custom-image'),photo=image(item),zoom=button('image-zoom','View image ↗');zoom.dataset.zoom='';box.dataset.fit=item.fit;box.append(photo,zoom);
   return {box,photo,zoom};
  }
  function caption(cls){const box=el('div','custom-caption '+cls),title=el('h3'),copy=el('p');box.append(title,copy);return {box,title,copy};}
  function updateImage(state,item){
   if(state.photo.getAttribute('src')!==item.src){state.photo.src=item.src;state.photo.classList.remove('media-enter');requestAnimationFrame(()=>state.photo.classList.add('media-enter'));}
   state.photo.alt=item.title;state.photo.style.objectPosition=item.position;state.box.dataset.fit=item.fit;state.zoom.setAttribute('aria-label','Enlarge: '+item.title);
  }
  function buildSurface(){
   custom.replaceChildren();surface=null;if(!isCustom())return;
   if(mode==='accordion'){
    const list=el('div','image-accordion');const panels=[];
    items.forEach((item,index)=>{
     const panel=el('article','accordion-panel');panel.dataset.fit=item.fit;
     const photo=image(item);photo.className='accordion-image';
     const select=button('accordion-select');select.dataset.imageIndex=index;select.setAttribute('aria-label','Expand: '+item.title);
     const label=el('div','panel-label');label.append(el('span','',String(index+1).padStart(2,'0')),el('h3','',item.title),el('p','',item.copy));
     const zoom=button('image-zoom','View image ↗');zoom.dataset.zoom='';zoom.dataset.zoomIndex=index;zoom.setAttribute('aria-label','Enlarge: '+item.title);
     panel.append(photo,select,label,zoom);list.append(panel);panels.push({panel,select,zoom});
     panel.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'&&matchMedia('(hover:hover) and (min-width:701px)').matches)show(index,false);});
     select.addEventListener('focus',()=>show(index,false));
    });custom.append(list);surface={panels};
   }else if(mode==='mosaic'){
    const layout=el('div','mosaic-layout'),main=media(items[current]),details=el('div','mosaic-details'),choices=[];
    items.forEach((item,index)=>{const n=button('mosaic-choice');n.dataset.imageIndex=index;n.dataset.fit=item.fit;n.setAttribute('aria-label','Show: '+item.title);n.append(image(item),el('span','',item.title));details.append(n);choices.push(n);});
    layout.append(main.box,details);const copy=caption('mosaic-caption');custom.append(layout,copy.box);surface={main,copy,choices};
   }else if(mode==='stepper'){
    const layout=el('div','stepper-layout'),list=el('div','stepper-list'),main=media(items[current]),steps=[];
    items.forEach((item,index)=>{
     const row=el('div','process-step'),select=button('stepper-select'),body=el('p','stepper-copy',item.copy),symbol=el('span','step-symbol','+');
     select.dataset.imageIndex=index;body.id=section.id+'-process-copy-'+index;select.setAttribute('aria-controls',body.id);
     select.append(el('span','step-index',String(index+1).padStart(2,'0')),el('span','',item.title),symbol);row.append(select,body);list.append(row);steps.push({select,body,symbol});
    });layout.append(list,main.box);custom.append(layout);surface={main,steps};
   }else if(mode==='stack'){
    const deck=el('div','photo-deck'),cards=items.map((item,index)=>{const n=button('deck-card');n.dataset.deckIndex=index;n.dataset.fit=item.fit;n.append(image(item));deck.append(n);return n;});
    const copy=caption('deck-caption');custom.append(deck,copy.box);surface={cards,copy};
   }
  }
  function paint(index){
   current=index;
   slides.forEach((slide,i)=>{const selected=i===index;slide.classList.toggle('is-current',selected);slide.setAttribute('aria-hidden',String(!selected));slide.querySelector('[data-zoom]').tabIndex=selected?0:-1;});
   gallery.querySelectorAll('[data-image-index]').forEach(n=>{const active=Number(n.dataset.imageIndex)===index;if(!n.classList.contains('stepper-select'))n.setAttribute('aria-pressed',String(active));});
   counter.textContent=String(index+1).padStart(2,'0')+' / '+String(items.length).padStart(2,'0');
   if(surface){
    const item=items[index];
    if(surface.main)updateImage(surface.main,item);
    if(surface.copy){surface.copy.title.textContent=item.title;surface.copy.copy.textContent=item.copy;}
    if(mode==='accordion')surface.panels.forEach((p,i)=>{const active=i===index;p.panel.classList.toggle('is-active',active);p.select.setAttribute('aria-expanded',String(active));p.zoom.tabIndex=active?0:-1;});
    if(mode==='mosaic')surface.choices.forEach((n,i)=>{const selected=i===index;if(selected&&document.activeElement===n)surface.main.zoom.focus({preventScroll:true});n.hidden=selected;});
    if(mode==='stepper')surface.steps.forEach((s,i)=>{const active=i===index;s.select.setAttribute('aria-expanded',String(active));s.body.hidden=!active;s.symbol.textContent=active?'−':'+';});
    if(mode==='stack')surface.cards.forEach((n,i)=>{const position=(i-index+items.length)%items.length;n.dataset.position=Math.min(position,3);n.tabIndex=position<3?0:-1;n.setAttribute('aria-hidden',String(position>=3));n.setAttribute('aria-label',(position===0?'Enlarge: ':'Show: ')+items[i].title);});
   }
   save(section.id,mode,current);
  }
  function position(index){return isVertical()?slides[index].offsetTop-slides[0].offsetTop:slides[index].offsetLeft-slides[0].offsetLeft;}
  function maximum(){return Math.max(0,isVertical()?track.scrollHeight-track.clientHeight:track.scrollWidth-track.clientWidth);}
  function coordinate(){return isVertical()?track.scrollTop:track.scrollLeft;}
  function nearest(){let result=0,distance=Infinity;slides.forEach((_,i)=>{const difference=Math.abs(coordinate()-Math.min(position(i),maximum()));if(difference<distance){distance=difference;result=i;}});return result;}
  function show(index,smooth=true){
   const next=(index+items.length)%items.length;paint(next);
   if(isCustom()){requested=null;return;}
   requested=Math.min(position(next),maximum());
   track.scrollTo({left:isVertical()?0:requested,top:isVertical()?requested:0,behavior:smooth&&!reduced.matches?'smooth':'instant'});
  }
  function setMode(next,preserve=true){
   mode=available.includes(next)?next:section.dataset.defaultMode;section.dataset.mode=mode;
   options.forEach(n=>n.setAttribute('aria-pressed',String(n.dataset.layout===mode)));section.querySelector('.layout-tip').textContent=tips[mode];
   gallery.querySelectorAll('[data-direction]').forEach(n=>{n.textContent=Number(n.dataset.direction)<0?(isVertical()?'↑':'←'):(isVertical()?'↓':'→');});
   const retained=preserve?current:0;changing=true;buildSurface();paint(retained);
   requestAnimationFrame(()=>{show(retained,false);changing=false;});
  }
  function schedule(){clearTimeout(timer);const focusPaused=gallery.contains(document.activeElement)&&document.activeElement!==play;const hoverPaused=pointer&&!play.matches(':hover');if(playing&&visible&&!focusPaused&&!hoverPaused&&!document.hidden&&!reduced.matches)timer=setTimeout(()=>{show(current+1);schedule();},4500);}
  function playback(value){playing=value&&!reduced.matches;play.setAttribute('aria-pressed',String(playing));play.setAttribute('aria-label',playing?'Pause automatic playback':'Start automatic playback');play.querySelector('.autoplay-label').textContent=playing?'Pause':'Play';play.querySelector('span').textContent=playing?'Ⅱ':'▷';schedule();}
  options.forEach(n=>n.addEventListener('click',()=>setMode(n.dataset.layout)));
  play.disabled=reduced.matches;play.addEventListener('click',()=>playback(!playing));
  gallery.addEventListener('mouseenter',()=>{pointer=true;schedule();});gallery.addEventListener('mouseleave',()=>{pointer=false;schedule();});gallery.addEventListener('focusin',schedule);gallery.addEventListener('focusout',()=>requestAnimationFrame(schedule));
  gallery.addEventListener('click',event=>{
   if(blockClick){event.preventDefault();event.stopPropagation();return;}
   const zoom=event.target.closest('[data-zoom]');if(zoom){openImage(items[zoom.dataset.zoomIndex===undefined?current:Number(zoom.dataset.zoomIndex)],zoom);return;}
   const card=event.target.closest('[data-deck-index]');if(card){const index=Number(card.dataset.deckIndex);if(index===current)openImage(items[index],card);else show(index);return;}
   const choice=event.target.closest('[data-image-index]');if(choice){show(Number(choice.dataset.imageIndex));schedule();return;}
   const arrow=event.target.closest('[data-direction]');if(arrow){show(current+Number(arrow.dataset.direction));schedule();}
  },true);
  gallery.addEventListener('keydown',event=>{
   if(dialog.open||event.altKey||event.ctrlKey||event.metaKey)return;let next;
   if(event.key==='ArrowRight'||((isVertical()||mode==='stepper'||mode==='accordion')&&event.key==='ArrowDown'))next=current+1;
   if(event.key==='ArrowLeft'||((isVertical()||mode==='stepper'||mode==='accordion')&&event.key==='ArrowUp'))next=current-1;
   if(event.key==='Home')next=0;if(event.key==='End')next=items.length-1;
   if(next!==undefined){event.preventDefault();show(next);schedule();}
  });
  track.addEventListener('scroll',()=>{if(queued||drag||changing||isCustom())return;queued=true;requestAnimationFrame(()=>{queued=false;if(isCustom())return;if(requested!==null&&Math.abs(coordinate()-requested)>2)return;requested=null;paint(nearest());});},{passive:true});
  track.addEventListener('scrollend',()=>{if(!drag&&!changing&&!isCustom()){requested=null;paint(nearest());}});
  track.addEventListener('pointerdown',event=>{if(isCustom())return;requested=null;if(event.pointerType!=='mouse'||event.button!==0||event.target.closest('button'))return;drag={start:isVertical()?event.clientY:event.clientX,scroll:coordinate(),distance:0};track.classList.add('is-dragging');track.setPointerCapture(event.pointerId);event.preventDefault();});
  track.addEventListener('pointermove',event=>{if(!drag)return;const point=isVertical()?event.clientY:event.clientX;drag.distance=Math.max(drag.distance,Math.abs(point-drag.start));if(isVertical())track.scrollTop=drag.scroll+drag.start-point;else track.scrollLeft=drag.scroll+drag.start-point;});
  function release(){if(!drag)return;const moved=drag.distance>6,next=nearest();drag=null;track.classList.remove('is-dragging');blockClick=moved;show(next);setTimeout(()=>{blockClick=false;},0);}
  track.addEventListener('pointerup',release);track.addEventListener('pointercancel',release);
  const resize=new ResizeObserver(()=>{if(!isCustom()&&viewport.clientWidth>0&&Math.abs(viewport.clientWidth-width)>1){width=viewport.clientWidth;const index=current;requestAnimationFrame(()=>show(index,false));}});resize.observe(viewport);
  const visibility=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();},{threshold:.15});visibility.observe(gallery);
  setMode(mode);controllers.push({section,setMode,playback,schedule,play});
 });
 document.querySelector('#reset-layouts').addEventListener('click',()=>controllers.forEach(c=>{c.setMode(c.section.dataset.defaultMode,false);c.playback(false);}));
 document.querySelector('#toggle-comparison').addEventListener('click',event=>{const hidden=document.body.classList.toggle('hide-comparison');event.currentTarget.setAttribute('aria-pressed',String(!hidden));event.currentTarget.textContent=hidden?'显示对比按钮':'隐藏对比按钮';});
 document.addEventListener('visibilitychange',()=>controllers.forEach(c=>c.schedule()));reduced.addEventListener('change',()=>controllers.forEach(c=>{c.play.disabled=reduced.matches;if(reduced.matches)c.playback(false);}));
 const links=Array.from(document.querySelectorAll('.chapter-nav a')),sections=Array.from(document.querySelectorAll('.case-section,.project-invitation'));
 const groups={'frame-manufacturing':'tooling',finishing:'tooling',production:'assembly','wheel-building':'assembly'};
 const observer=new IntersectionObserver(()=>{let selected=sections[0];sections.forEach(s=>{if(s.getBoundingClientRect().top<innerHeight*.42)selected=s;});const id=groups[selected.id]||selected.id;links.forEach(a=>{const active=a.hash==='#'+id;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});},{rootMargin:'-120px 0px -48% 0px',threshold:0});sections.forEach(s=>observer.observe(s));
}());
