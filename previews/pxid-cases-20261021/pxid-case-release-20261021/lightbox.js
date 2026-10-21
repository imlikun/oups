(function(){
 const dialog=document.querySelector('#photo-dialog'),image=document.querySelector('#photo-dialog-image'),caption=document.querySelector('#photo-dialog-caption');
 document.querySelectorAll('[data-zoom]').forEach(button=>button.addEventListener('click',()=>{const source=button.querySelector('img');image.src=source.currentSrc||source.src;image.alt=source.alt;caption.textContent=source.alt;dialog.showModal();}));
 document.querySelector('.lightbox-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
}());
