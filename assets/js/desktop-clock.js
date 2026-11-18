(function(){
 document.querySelectorAll('[data-desktop-open]').forEach(button=>button.addEventListener('click',()=>document.getElementById(button.dataset.desktopOpen).click()));
 function updateDesktopClock(){
  const now=new Date();
  document.getElementById('desktop-time').textContent=new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit'}).format(now);
  document.getElementById('desktop-time').dateTime=now.toISOString();
  document.getElementById('desktop-date').textContent=new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'short'}).format(now);
 }
 updateDesktopClock();setInterval(updateDesktopClock,30000);
})();
