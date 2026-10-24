(function(){
 'use strict';
 const $=s=>document.querySelector(s),all=s=>Array.from(document.querySelectorAll(s));
 const assets=new URL('../pxid-p6-oem-preview-20261021/assets/',document.currentScript.src).href;
 const colours={green:{file:'绿',name:'Green'},black:{file:'黑',name:'Black'},beige:{file:'米',name:'Beige'}};
 const state={colour:'green',battery:'20',motor:'750'};
 function selection(){
  const c=colours[state.colour];
  $('#colour-name').textContent=c.name;
  $('#selection-text').textContent=`${c.name} / 48V ${state.battery}Ah / ${state.motor}W`;
  $('#spec-config-title').replaceChildren(document.createTextNode(state.motor+'W'),document.createElement('br'),document.createTextNode('48V '+state.battery+'Ah'));
  $('#spec-colour').textContent=c.name+' finish';$('#spec-motor').textContent=state.motor+'W';$('#spec-battery').textContent='48V '+state.battery+'Ah';
  $('#inquiry-link').href='mailto:inquiry@pxid.com?subject='+encodeURIComponent('MANTIS P6 OEM enquiry')+'&body='+encodeURIComponent(`I am interested in MANTIS P6.\nPreferred finish: ${c.name}\nBattery option: 48V ${state.battery}Ah\nMotor option: ${state.motor}W\n\nTarget market:\nEstimated quantity:\nBranding requirements:\n`);
 }
 all('[data-colour]').forEach(button=>button.addEventListener('click',()=>{
  state.colour=button.dataset.colour;const c=colours[state.colour];const img=$('#colour-image');
  img.src=assets+'colour-'+c.file+'.webp';img.alt='MANTIS P6 in '+c.name.toLowerCase();img.classList.remove('image-enter');requestAnimationFrame(()=>img.classList.add('image-enter'));
  all('[data-colour]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));selection();
 }));
 ['battery','motor'].forEach(key=>all('[data-'+key+']').forEach(button=>button.addEventListener('click',()=>{
  state[key]=button.dataset[key];all('[data-'+key+']').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));selection();
 })));
 const specDialog=$('#configuration-spec-dialog'),specTrigger=$('#view-configuration-specs'),specClose=specDialog.querySelector('.configuration-dialog-close');
 let specReturnFocus=null;
 specTrigger.addEventListener('click',()=>{
  specReturnFocus=document.activeElement;
  $('#configuration-dialog-finish').textContent=colours[state.colour].name;
  $('#configuration-dialog-battery').textContent='48V '+state.battery+'Ah';
  $('#configuration-dialog-motor').textContent=state.motor+'W';
  const image=$('#colour-image'),dialogImage=$('#configuration-dialog-image');
  dialogImage.src=image.src;dialogImage.alt=image.alt;
  const table=$('#specifications table').cloneNode(true);
  table.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));
  table.querySelectorAll('tr').forEach(row=>row.lastElementChild.remove());
  table.querySelector('thead th:last-child').textContent='Selected specification';
  table.querySelector('caption').textContent='Specifications for your selected MANTIS P6 configuration';
  $('#configuration-dialog-table').replaceChildren(table);
  specDialog.querySelector('.configuration-dialog-body').scrollTop=0;
  specDialog.showModal();specClose.focus({preventScroll:true});
 });
 specClose.addEventListener('click',()=>specDialog.close());
 specDialog.addEventListener('click',event=>{
  if(event.target!==specDialog)return;
  const box=specDialog.getBoundingClientRect();
  if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)specDialog.close();
 });
 specDialog.addEventListener('keydown',event=>{
  if(event.key!=='Tab')return;
  const body=specDialog.querySelector('.configuration-dialog-body');
  if(event.shiftKey&&document.activeElement===specClose){event.preventDefault();body.focus({preventScroll:true});}
  else if(!event.shiftKey&&document.activeElement===body){event.preventDefault();specClose.focus({preventScroll:true});}
 });
 specDialog.addEventListener('close',()=>{if(specReturnFocus&&specReturnFocus.isConnected)specReturnFocus.focus({preventScroll:true});});
 all('.stage-gallery').forEach(gallery=>{
  const article=gallery.closest('.process-stage'),main=article.querySelector('.stage-photo img'),mainButton=article.querySelector('.stage-photo'),error=article.querySelector('.gallery-error');
  let requestNumber=0;
  gallery.querySelectorAll('button').forEach(button=>{
   button.addEventListener('click',()=>{
    const serial=++requestNumber,preload=new Image();mainButton.setAttribute('aria-busy','true');error.hidden=true;
    preload.onload=()=>{if(serial!==requestNumber)return;main.classList.remove('image-enter');main.src=button.dataset.full;main.alt=button.dataset.caption;mainButton.setAttribute('aria-label','Enlarge '+button.dataset.caption.toLowerCase());mainButton.removeAttribute('aria-busy');requestAnimationFrame(()=>main.classList.add('image-enter'));gallery.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));};
    preload.onerror=()=>{if(serial!==requestNumber)return;error.hidden=false;mainButton.removeAttribute('aria-busy');};
    preload.src=button.dataset.full;
   });
  });
 });
 const root=document.documentElement,nav=$('.product-nav'),module=$('.process-module'),hero=$('.hero'),index=$('.process-top'),stageLinks=all('.process-numbers a'),sections=all('main>section[id]'),sectionLinks=all('.product-nav>div a');
 stageLinks.forEach(a=>a.addEventListener('click',()=>{root.classList.add('process-reading');root.style.setProperty('--anchor-clearance',index.offsetHeight+'px');}));
 let pending=false;
 function update(){
  pending=false;const height=nav.offsetHeight,m=module.getBoundingClientRect();
  root.style.setProperty('--process-belt-height',index.offsetHeight+'px');
  root.classList.toggle('product-navigation-active',hero.getBoundingClientRect().bottom<=72);
  const reading=m.top<=height&&m.bottom>height;
  root.classList.toggle('process-reading',reading);
  root.style.setProperty('--anchor-clearance',(reading?index.offsetHeight:height+16)+'px');
  let chosen=sections[0];sections.forEach(section=>{if(section.getBoundingClientRect().top<=innerHeight*.35)chosen=section;});
  sectionLinks.forEach(a=>{if(a.hash==='#'+chosen.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
  let stage=all('.process-stage')[0];all('.process-stage').forEach(article=>{if(article.getBoundingClientRect().top<=innerHeight*.32)stage=article;});
  stageLinks.forEach(a=>{if(a.hash==='#'+stage.id)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});
 }
 function schedule(){if(!pending){pending=true;requestAnimationFrame(update);}}
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);selection();update();
}());
