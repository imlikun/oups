(function(){
 'use strict';
 document.querySelectorAll('[data-tabs]').forEach(group=>{
  const list=group.querySelector('[role=tablist]'),tabs=Array.from(list.querySelectorAll('[role=tab]'));
  if(list.hasAttribute('data-responsive-orientation')){const orientation=()=>list.setAttribute('aria-orientation',matchMedia('(max-width:850px)').matches?'horizontal':'vertical');orientation();addEventListener('resize',orientation);}
  function activate(tab,focus){
   tabs.forEach(item=>{const selected=item===tab;item.setAttribute('aria-selected',String(selected));item.tabIndex=selected?0:-1;const panel=document.getElementById(item.getAttribute('aria-controls'));panel.hidden=!selected;if(selected){panel.classList.remove('image-enter');requestAnimationFrame(()=>panel.classList.add('image-enter'));}});
   document.getElementById(tab.getAttribute('aria-controls')).dispatchEvent(new Event('tab-shown'));
   if(focus)tab.focus({preventScroll:true});
   if(list.scrollWidth>list.clientWidth)list.scrollLeft=Math.max(0,tab.offsetLeft-list.offsetLeft-(list.clientWidth-tab.offsetWidth)/2);
  }
  tabs.forEach((tab,index)=>{
   tab.addEventListener('click',()=>activate(tab,false));
   tab.addEventListener('keydown',event=>{const vertical=list.getAttribute('aria-orientation')==='vertical';let next;if(event.key===(vertical?'ArrowDown':'ArrowRight'))next=tabs[(index+1)%tabs.length];if(event.key===(vertical?'ArrowUp':'ArrowLeft'))next=tabs[(index+tabs.length-1)%tabs.length];if(event.key==='Home')next=tabs[0];if(event.key==='End')next=tabs[tabs.length-1];if(next){event.preventDefault();activate(next,true);}});
  });
 });
 document.querySelectorAll('[data-carousel]').forEach(panel=>{
  const track=panel.querySelector('.discipline-track'),slides=Array.from(track.children),dots=Array.from(panel.querySelectorAll('[data-slide-index]')),counter=panel.querySelector('.discipline-counter');
  let current=0,scrollPending=false,drag=null,target=null;
  function paint(index){
   current=index;dots.forEach((dot,i)=>dot.setAttribute('aria-pressed',String(i===index)));
   slides.forEach((slide,i)=>slide.setAttribute('aria-hidden',String(i!==index)));
   counter.textContent=String(index+1).padStart(2,'0')+' / '+String(slides.length).padStart(2,'0');
  }
  function show(index,smooth=true){
   const next=(index+slides.length)%slides.length;
   target=next;
   track.scrollTo({left:next*track.clientWidth,behavior:smooth&&!matchMedia('(prefers-reduced-motion: reduce)').matches?'smooth':'instant'});
   paint(next);
  }
  panel.querySelectorAll('[data-slide-change]').forEach(button=>button.addEventListener('click',()=>show(current+Number(button.dataset.slideChange))));
  dots.forEach(dot=>dot.addEventListener('click',()=>show(Number(dot.dataset.slideIndex))));
  panel.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();show(current+(event.key==='ArrowRight'?1:-1));}});
  track.addEventListener('scroll',()=>{if(scrollPending||drag)return;scrollPending=true;requestAnimationFrame(()=>{scrollPending=false;if(!track.clientWidth)return;if(target!==null&&Math.abs(track.scrollLeft-target*track.clientWidth)>1)return;target=null;paint(Math.round(track.scrollLeft/track.clientWidth));});},{passive:true});
  track.addEventListener('scrollend',()=>{if(track.clientWidth&&!drag){target=null;paint(Math.round(track.scrollLeft/track.clientWidth));}});
  track.addEventListener('pointerdown',event=>{
   target=null;if(event.pointerType!=='mouse'||event.button!==0)return;
   drag={x:event.clientX,left:track.scrollLeft,index:current};track.classList.add('is-dragging');track.setPointerCapture(event.pointerId);event.preventDefault();
  });
  track.addEventListener('pointermove',event=>{if(drag)track.scrollLeft=drag.left+drag.x-event.clientX;});
  function release(){if(!drag)return;const index=Math.round(track.scrollLeft/track.clientWidth);drag=null;track.classList.remove('is-dragging');show(index);}
  track.addEventListener('pointerup',release);track.addEventListener('pointercancel',release);
  panel.addEventListener('tab-shown',()=>requestAnimationFrame(()=>show(current,false)));
  const resize=new ResizeObserver(()=>{if(!panel.hidden&&track.clientWidth)show(current,false);});resize.observe(track);
  paint(0);
 });
 document.querySelectorAll('.production-thumbnails').forEach(gallery=>{
  const main=gallery.closest('.production-media').querySelector('.production-main-photo'),image=main.querySelector('img');let serial=0;
  gallery.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{
   const request=++serial,preload=new Image();main.setAttribute('aria-busy','true');
   preload.onload=()=>{if(request!==serial)return;image.src=button.dataset.full;image.alt=button.dataset.caption;main.setAttribute('aria-label','Enlarge '+button.dataset.caption.toLowerCase());main.classList.toggle('portrait-selected',preload.naturalHeight>preload.naturalWidth*1.1);main.removeAttribute('aria-busy');image.classList.remove('image-enter');requestAnimationFrame(()=>image.classList.add('image-enter'));gallery.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));};
   preload.onerror=()=>{if(request===serial)main.removeAttribute('aria-busy');};preload.src=button.dataset.full;
  }));
 });
 const menu=document.querySelector('.menu-toggle'),mainNav=document.querySelector('#main-nav');
 menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));mainNav.classList.toggle('is-open',open);});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){menu.setAttribute('aria-expanded','false');mainNav.classList.remove('is-open');menu.focus();}});
 const nav=document.querySelector('.case-nav'),links=Array.from(nav.querySelectorAll('a[href^="#"]'));let pending=false;
 function update(){pending=false;document.documentElement.classList.toggle('case-reading',nav.getBoundingClientRect().top<=1);let chosen=links[0];links.forEach(a=>{const target=document.getElementById(a.hash.slice(1));if(target&&target.getBoundingClientRect().top<=innerHeight*.36)chosen=a;});links.forEach(a=>{const current=a===chosen;a.classList.toggle('active',current);if(current)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}
 function schedule(){if(!pending){pending=true;requestAnimationFrame(update);}}
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);update();
}());
