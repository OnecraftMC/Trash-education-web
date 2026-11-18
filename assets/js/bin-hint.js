(function(){
 const stage=document.querySelector('#top .bin-stage'),hint=document.getElementById('bin-click-hint');
 function positionBinHint(){
  const {width,height}=stage.getBoundingClientRect();
  const cover=matchMedia('(min-aspect-ratio:16/10)').matches;
  const scale=Math[cover?'max':'min'](width/1280,height/720);
  const mediaWidth=1280*scale,mediaHeight=720*scale;
  hint.style.left=((width-mediaWidth)/2+mediaWidth*.4825)+'px';
  hint.style.top=(Math.min(height-hint.offsetHeight-16,(height-mediaHeight)/2+mediaHeight*.87)-12)+'px';
 }
 new ResizeObserver(positionBinHint).observe(stage);
 positionBinHint();
})();
