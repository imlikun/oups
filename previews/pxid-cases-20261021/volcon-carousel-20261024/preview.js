(function () {
 'use strict';
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 const storageKey = 'pxid-volcon-carousel-layouts-20261024';
 const allowed = ['focus','split','rail'];
 const tips = {
  focus:'一张主图占满画面，介绍在图上，适合连续看过程。',
  split:'大图、缩略图与右侧介绍联动，适合看工程细节。',
  rail:'左右拖动查看下一张，保留相邻图片，适合展示连续工序。'
 };
 let preferences = {};
 try { const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');if(saved && typeof saved==='object' && !Array.isArray(saved))preferences=saved; } catch (_) {}
 function persist(id,mode,index) {
  preferences[id] = {mode,index};
  try { localStorage.setItem(storageKey,JSON.stringify(preferences)); } catch (_) {}
 }
 const dialog = document.querySelector('.image-dialog');
 let zoomTrigger = null;
 document.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
 dialog.addEventListener('close',()=>{
  dialog.querySelector('img').removeAttribute('src');
  if(zoomTrigger)zoomTrigger.focus({preventScroll:true});
 });
 const controllers = [];
 document.querySelectorAll('.case-section').forEach(section=>{
  const gallery = section.querySelector('.gallery');
  const viewport = gallery.querySelector('.gallery-viewport');
  const track = gallery.querySelector('.gallery-track');
  const slides = Array.from(track.children);
  const options = Array.from(section.querySelectorAll('[data-layout]'));
  const choices = Array.from(gallery.querySelectorAll('[data-image-index]'));
  const counter = gallery.querySelector('.gallery-counter');
  const play = gallery.querySelector('.autoplay');
  const saved = preferences[section.id] || {};
  let current = Number.isInteger(saved.index) ? Math.max(0,Math.min(slides.length-1,saved.index)) : 0;
  let mode = allowed.includes(saved.mode) ? saved.mode : section.dataset.defaultMode;
  let requested = null,drag = null,blockClick = false,queued = false,changingLayout = false;
  let playing = false,onScreen = false,pointerInside = false,timer = null,lastWidth = 0;
  function paint(index) {
   current = index;
   slides.forEach((slide,i)=>{
    const active = i===index;
    slide.classList.toggle('is-current',active);
    slide.setAttribute('aria-hidden',String(!active));
    slide.querySelector('[data-zoom]').tabIndex = active ? 0 : -1;
   });
   choices.forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.imageIndex)===index)));
   counter.textContent = String(index+1).padStart(2,'0')+' / '+String(slides.length).padStart(2,'0');
   persist(section.id,mode,current);
  }
  function left(index) {return slides[index].offsetLeft-slides[0].offsetLeft;}
  function nearest() {
   let best = 0,distance = Infinity;
   slides.forEach((slide,index)=>{
    const possible = Math.min(left(index),Math.max(0,track.scrollWidth-track.clientWidth));
    const difference = Math.abs(track.scrollLeft-possible);
    if(difference<distance){distance=difference;best=index;}
   });
   return best;
  }
  function show(index,smooth=true) {
   const next = (index+slides.length)%slides.length;
   requested = Math.min(left(next),Math.max(0,track.scrollWidth-track.clientWidth));
   paint(next);
   track.scrollTo({left:requested,behavior:smooth&&!reduced.matches?'smooth':'instant'});
  }
  function setMode(next,preserve=true) {
   mode = allowed.includes(next)?next:section.dataset.defaultMode;
   section.dataset.mode = mode;
   options.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.layout===mode)));
   section.querySelector('.layout-tip').textContent = tips[mode];
   const retainedIndex=preserve?current:0;
   changingLayout=true;paint(retainedIndex);
   requestAnimationFrame(()=>{show(retainedIndex,false);changingLayout=false;});
  }
  function schedulePlayback() {
   clearTimeout(timer);
   const focusPaused = gallery.contains(document.activeElement) && document.activeElement!==play;
   const hoverPaused = pointerInside && !play.matches(':hover');
   if(playing && onScreen && !focusPaused && !hoverPaused && !document.hidden && !reduced.matches){
    timer=setTimeout(()=>{show(current+1);schedulePlayback();},4500);
   }
  }
  function playback(value) {
   playing=value&&!reduced.matches;
   play.setAttribute('aria-pressed',String(playing));
   play.setAttribute('aria-label',playing?'Pause automatic playback':'Start automatic playback');
   play.querySelector('.autoplay-label').textContent=playing?'Pause':'Play';
   play.querySelector('span').textContent=playing?'Ⅱ':'▷';
   schedulePlayback();
  }
  play.disabled=reduced.matches;
  play.addEventListener('click',()=>playback(!playing));
  gallery.addEventListener('mouseenter',()=>{pointerInside=true;schedulePlayback();});
  gallery.addEventListener('mouseleave',()=>{pointerInside=false;schedulePlayback();});
  gallery.addEventListener('focusin',schedulePlayback);
  gallery.addEventListener('focusout',()=>requestAnimationFrame(schedulePlayback));
  options.forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.layout)));
  gallery.querySelectorAll('[data-direction]').forEach(button=>button.addEventListener('click',()=>{show(current+Number(button.dataset.direction));schedulePlayback();}));
  choices.forEach(button=>button.addEventListener('click',()=>{show(Number(button.dataset.imageIndex));schedulePlayback();}));
  gallery.addEventListener('keydown',event=>{
   if(dialog.open||event.altKey||event.ctrlKey||event.metaKey)return;
   let next;
   if(event.key==='ArrowRight')next=current+1;
   if(event.key==='ArrowLeft')next=current-1;
   if(event.key==='Home')next=0;
   if(event.key==='End')next=slides.length-1;
   if(next!==undefined){event.preventDefault();show(next);schedulePlayback();}
  });
  track.addEventListener('scroll',()=>{
   if(queued||drag||changingLayout)return;
   queued=true;
   requestAnimationFrame(()=>{
    queued=false;
    if(requested!==null&&Math.abs(track.scrollLeft-requested)>2)return;
    requested=null;paint(nearest());
   });
  },{passive:true});
  track.addEventListener('scrollend',()=>{if(!drag&&!changingLayout){requested=null;paint(nearest());}});
  track.addEventListener('pointerdown',event=>{
   requested=null;
   if(event.pointerType!=='mouse'||event.button!==0||event.target.closest('button'))return;
   drag={x:event.clientX,left:track.scrollLeft,distance:0};
   track.classList.add('is-dragging');track.setPointerCapture(event.pointerId);event.preventDefault();
  });
  track.addEventListener('pointermove',event=>{
   if(!drag)return;
   drag.distance=Math.max(drag.distance,Math.abs(event.clientX-drag.x));
   track.scrollLeft=drag.left+drag.x-event.clientX;
  });
  function release() {
   if(!drag)return;
   const shifted=drag.distance>6;
   const next=nearest();drag=null;track.classList.remove('is-dragging');
   blockClick=shifted;show(next);
   setTimeout(()=>{blockClick=false;},0);
  }
  track.addEventListener('pointerup',release);track.addEventListener('pointercancel',release);
  track.addEventListener('click',event=>{
   if(blockClick){event.preventDefault();event.stopPropagation();return;}
   const zoom=event.target.closest('[data-zoom]');
   if(!zoom)return;
   const slide=zoom.closest('.gallery-slide'),image=slide.querySelector('img');
   zoomTrigger=zoom;dialog.querySelector('img').src=image.currentSrc||image.src;
   dialog.querySelector('img').alt=image.alt;
   dialog.querySelector('.dialog-toolbar p').textContent=slide.querySelector('h3').textContent;
   dialog.showModal();
  },true);
  slides.forEach(slide=>{
   const image=slide.querySelector('.slide-image>img');
   image.addEventListener('error',()=>{slide.querySelector('.image-error').hidden=false;});
  });
  const resize=new ResizeObserver(()=>{
   if(Math.abs(viewport.clientWidth-lastWidth)>1){lastWidth=viewport.clientWidth;requestAnimationFrame(()=>show(current,false));}
  });resize.observe(viewport);
  const visibility=new IntersectionObserver(entries=>{onScreen=entries[0].isIntersecting;schedulePlayback();},{threshold:.15});visibility.observe(gallery);
  setMode(mode);
  controllers.push({section,setMode,show,schedulePlayback,playback,play});
 });
 document.querySelector('#reset-layouts').addEventListener('click',()=>controllers.forEach(c=>{c.setMode(c.section.dataset.defaultMode,false);c.playback(false);}));
 document.querySelector('#toggle-comparison').addEventListener('click',event=>{
  const hide=document.body.classList.toggle('hide-comparison');
  event.currentTarget.setAttribute('aria-pressed',String(!hide));
  event.currentTarget.textContent=hide?'显示对比按钮':'隐藏对比按钮';
 });
 document.addEventListener('visibilitychange',()=>controllers.forEach(c=>c.schedulePlayback()));
 reduced.addEventListener('change',()=>controllers.forEach(c=>{c.play.disabled=reduced.matches;if(reduced.matches)c.playback(false);}));
 const chapterLinks=Array.from(document.querySelectorAll('.chapter-nav a'));
 const chapterMap={'frame-manufacturing':'tooling',finishing:'tooling',production:'assembly','wheel-building':'assembly'};
 const chapters=Array.from(document.querySelectorAll('.case-section,.project-invitation'));
 const chapterObserver=new IntersectionObserver(()=>{
  let current=chapters[0];
  chapters.forEach(section=>{if(section.getBoundingClientRect().top<innerHeight*.42)current=section;});
  const id=chapterMap[current.id]||current.id;
  chapterLinks.forEach(link=>{
   const active=link.hash==='#'+id;link.classList.toggle('active',active);
   if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');
  });
 },{rootMargin:'-120px 0px -48% 0px',threshold:0});
 chapters.forEach(section=>chapterObserver.observe(section));
}());
