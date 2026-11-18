(function(){
 const layer=document.getElementById('fame-cases-layer'),cards=[...document.querySelectorAll('[data-case]')],dialog=document.getElementById('case-dialog');
 const waste='https://www.who.int/tools/compendium-on-health-and-environment/solid-waste',unep='https://www.unep.org/interactives/beat-waste-pollution/';
 const cases=[
 ['TPA terbuka','Sampah yang ditumpuk tanpa pengelolaan memadai dapat mencemari lingkungan di sekitarnya.','Pencemaran tanah dan air, bau, serta tempat berkembangnya hewan pembawa penyakit menjadi risiko ketika sampah tidak ditangani dengan baik.',['Pisahkan sampah di rumah agar bahan yang bisa dimanfaatkan tidak tercampur.','Gunakan layanan pengumpulan resmi dan hindari membuang sampah di lahan terbuka.'],waste,'WHO · Sampah padat dan kesehatan'],
 ['Mikroplastik','Plastik dapat terpecah menjadi partikel kecil yang menyebar di lingkungan.','Sampah plastik yang masuk ke perairan sulit dikumpulkan kembali setelah terurai menjadi potongan-potongan kecil.',['Kurangi kemasan sekali pakai bila ada pilihan guna ulang.','Pisahkan plastik dan tanyakan jenis yang diterima pengelola setempat.'],unep,'UNEP · Pencemaran sampah'],
 ['Limbah elektronik','Perangkat bekas mengandung campuran logam, plastik, dan komponen yang memerlukan penanganan khusus.','Pembakaran atau pembongkaran yang tidak aman dapat melepaskan zat berbahaya dan mencemari lingkungan.',['Perbaiki atau gunakan kembali perangkat yang masih layak.','Serahkan perangkat kepada pengumpul elektronik resmi; jangan dibakar.'],'https://www.who.int/news-room/fact-sheets/detail/electronic-waste-(e-waste)','WHO · Limbah elektronik'],
 ['Limbah tekstil','Pakaian dan kain yang tidak lagi dipakai menjadi sampah ketika tidak digunakan kembali atau dikumpulkan secara terpisah.','Material yang masih bisa dipakai ikut terbuang dan menambah beban pengelolaan sampah.',['Rawat dan perbaiki pakaian sebelum menggantinya.','Donasikan hanya barang yang masih layak; cari pengumpul tekstil untuk bahan lainnya.'],unep,'UNEP · Pencemaran sampah'],
 ['Aliran sungai','Sampah di selokan dan sungai mengganggu aliran air dan dapat terbawa ke perairan yang lebih luas.','Saluran tersumbat dapat meningkatkan risiko genangan. Sampah juga mencemari ekosistem sungai dan laut.',['Jangan membuang sampah ke saluran air.','Laporkan tumpukan sampah pada pengelola wilayah dan ikuti kegiatan bersih sungai yang terorganisasi.'],waste,'WHO · Sampah padat dan kesehatan'],
 ['Penyebaran penyakit','Risiko penyakit berkaitan dengan air tercemar, sanitasi yang buruk, dan kebersihan yang tidak memadai. Sampah bukan penyebab semua infeksi virus.','Air minum yang terkontaminasi dapat menularkan penyakit. Jalur penularannya berbeda-beda sesuai jenis patogen.',['Gunakan air minum yang aman dan jaga kebersihan tangan.','Buang sampah pada tempatnya dan jaga saluran air serta fasilitas sanitasi.'],'https://www.who.int/news-room/fact-sheets/detail/drinking-water','WHO · Air minum'],
 ['Sisa pangan','Makanan yang dibeli atau disiapkan tetapi tidak dimanfaatkan akhirnya menambah aliran sampah.','Bahan organik tercampur lebih sulit dipilah kembali, sementara makanan yang sebenarnya masih bisa dimanfaatkan ikut terbuang.',['Rencanakan belanja dan porsi agar sesuai kebutuhan.','Pisahkan sisa organik untuk pengomposan atau layanan pengumpulan yang sesuai.'],unep,'UNEP · Pencemaran sampah'],
 ['Emisi pembakaran','Membakar sampah secara terbuka melepaskan asap dan polutan ke udara.','Asap pembakaran dapat membahayakan orang yang membakar sampah maupun masyarakat di sekitarnya.',['Jangan membakar sampah rumah tangga.','Pilah material dan gunakan layanan pengangkutan atau pengolahan yang sesuai.'],'https://www.who.int/publications/i/item/B09367','WHO · Pembakaran sampah terbuka']
 ];
 let index=0,opener=null,oldOverflow='',resumeSmooth=false;
 let smooth=null;try{smooth=lenis;}catch(e){}
 const get=id=>document.getElementById(id);
 function render(i){
  index=(i+cases.length)%cases.length;const [title,summary,impact,actions,url,source]=cases[index];
  get('case-title').textContent=title;get('case-summary').textContent=summary;get('case-impact').textContent=impact;
  get('case-actions').replaceChildren(...actions.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
  get('case-source').href=url;get('case-source').textContent='Sumber: '+source+' ↗';get('case-count').textContent=String(index+1).padStart(2,'0')+' / 08';
  const img=get('case-image'),original=cards[index].querySelector('img');img.hidden=false;img.alt=original.alt;img.src=original.currentSrc||original.src;
  dialog.querySelector('.case-dialog-scroll').scrollTop=0;
 }
 get('case-image').addEventListener('error',()=>get('case-image').hidden=true);
 function open(i,card){
  opener=card;render(i);oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
  if(smooth){resumeSmooth=!smooth.isStopped;smooth.stop();}
  dialog.showModal();
 }
 cards.forEach((card,i)=>card.addEventListener('click',()=>open(i,card)));
 get('case-close').addEventListener('click',()=>dialog.close());
 let outsideDown=false;
 function isOutside(e){const r=dialog.getBoundingClientRect();return e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom;}
 dialog.addEventListener('pointerdown',e=>{outsideDown=e.target===dialog&&isOutside(e)});
 dialog.addEventListener('click',e=>{if(outsideDown&&e.target===dialog&&isOutside(e))dialog.close();outsideDown=false;});
 dialog.addEventListener('close',()=>{
  document.body.style.overflow=oldOverflow;
  if(resumeSmooth&&smooth&&!window.macbookScrollState?.locked)smooth.start();
  opener?.focus({preventScroll:true});
 });
 get('case-prev').addEventListener('click',()=>render(index-1));get('case-next').addEventListener('click',()=>render(index+1));
 function syncCards(){const enabled=parseFloat(getComputedStyle(layer).opacity)>.7;layer.inert=!enabled;const value=enabled?'auto':'none';if(layer.style.pointerEvents!==value)layer.style.pointerEvents=value;}
 new MutationObserver(syncCards).observe(layer,{attributes:true,attributeFilter:['style','class']});syncCards();
})();