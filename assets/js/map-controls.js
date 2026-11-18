        (function(){
            var f=document.getElementById('bank-map-frame'),b=document.getElementById('bank-map-toggle'),on=false;
            function set(v){on=v;f.style.pointerEvents=v?'auto':'none';b.textContent=v?'Selesai \u2014 lanjut scroll halaman':'Klik untuk menjelajah peta';}
            const mapActions = document.getElementById('map-actions');
            function syncMapActionSpace() {
                const space = mapActions.offsetHeight + (parseFloat(getComputedStyle(mapActions).bottom) || 0);
                f.contentDocument?.documentElement.style.setProperty('--map-actions-space', space + 'px');
            }
            new ResizeObserver(syncMapActionSpace).observe(mapActions);
            var mapVisible = false;
            function syncMapRendering() {
                f.contentWindow?.__setMapRendering?.(mapVisible);
            }
            var mapVisibilityObserver = new IntersectionObserver(function(entries) {
                mapVisible = entries.some(function(entry) { return entry.isIntersecting; });
                syncMapRendering();
            });
            mapVisibilityObserver.observe(f);
            f.addEventListener('load', function() {
                syncMapActionSpace();
                syncMapRendering();
            });
            window.addEventListener('resize', syncMapActionSpace);
            window.__resetBankMap = function () {
                set(false);
                f.contentWindow?.resetBankMap?.();
            };
            b.addEventListener('click',function(){set(!on)});
            document.addEventListener('keydown',function(e){if(e.key==='Escape'&&on)set(false)});
            // Ambil tampilan awal peta (termasuk titik hijau dan label) untuk layar MacBook 3D
            function capture(){
                try{
                    var win=f.contentWindow,doc=win.document,src=doc.getElementById('c');
                    if(!src||!src.width)return false;
                    var W=1920,H=1282,P=W/H,c=document.createElement('canvas');c.width=W;c.height=H;
                    var x=c.getContext('2d');
                    var sw=src.width,sh=src.height,A=sw/sh;
                    // latar: peta diperbesar dan diburamkan untuk mengisi area di luar bingkai
                    var kc=Math.max(W/sw,H/sh);
                    x.save();x.filter='blur(18px)';x.drawImage(src,(W-sw*kc)/2,(H-sh*kc)/2,sw*kc,sh*kc);x.restore();
                    // bingkai: area yang tepat memenuhi tampilan saat zoom selesai
                    var dw,dh;if(A>=P){dw=W;dh=W/A}else{dh=H;dw=H*A}
                    var ox=(W-dw)/2,oy=(H-dh)/2;
                    x.drawImage(src,ox,oy,dw,dh);
                    if(x.getImageData(W/2,H/2,1,1).data[3]===0)return false;
                    var cw=doc.documentElement.clientWidth||1,ks=dw/cw;
                    var tr=/translate\(\s*(-?[\d.]+)px,\s*(-?[\d.]+)px/;
                    var els=doc.querySelectorAll('#ov > *');
                    for(var i=0;i<els.length;i++){
                        var el=els[i];
                        if(el.style.display==='none')continue;
                        var m=tr.exec(el.style.transform||'');if(!m)continue;
                        var px=ox+parseFloat(m[1])*ks,py=oy+parseFloat(m[2])*ks;
                        if(px<0||px>W||py<0||py>H)continue;
                        if(el.classList.contains('pin')){
                            x.save();x.shadowColor='rgba(20,232,122,.8)';x.shadowBlur=14*ks;
                            x.fillStyle='rgba(20,232,122,.25)';x.beginPath();x.arc(px,py,11*ks,0,6.2832);x.fill();
                            x.fillStyle='#14e87a';x.beginPath();x.arc(px,py,7*ks,0,6.2832);x.fill();x.restore();
                        }else if(el.classList.contains('il')){
                            x.save();x.font='600 '+(11*ks)+'px sans-serif';x.textBaseline='top';
                            x.shadowColor='#04100b';x.shadowBlur=6*ks;x.fillStyle='#c4ccc6';
                            x.fillText((el.textContent||'').toUpperCase(),px,py);x.restore();
                        }
                    }
                    if(typeof window.__setLaptopScreen==='function'){window.__setLaptopScreen(c);return true;}
                    return false;
                }catch(e){return false}
            }
            var tries=0,done=0,iv=null;
            function startCapturePolling(){
                if(iv||done>=2)return;
                iv=setInterval(function(){
                    tries++;
                    if(tries>40||done>=2){clearInterval(iv);iv=null;return}
                    if(tries>3&&capture())done++;
                },1500);
            }
            var frameDocument=f.contentDocument;
            if(frameDocument?.readyState==='complete'&&frameDocument.getElementById('c'))startCapturePolling();
            else f.addEventListener('load',startCapturePolling,{once:true});
        })();
        