        gsap.registerPlugin(ScrollTrigger);

        // Shared state antara GSAP ScrollTrigger (Section 3) dan Three.js ES Module
        window.macbookScrollState = {
            targetProgress: 0, selected: false, locked: false
        };

        // 1. Inisialisasi Lenis Virtual Smooth Scroll
        const isMobile = window.innerWidth < 768;
        const lenis = (typeof Lenis !== 'undefined' && !isMobile)
            ? new Lenis({
                duration: 0.45,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                smoothWheel: true,
                wheelMultiplier: 1.2,
                touchMultiplier: 1.5
            })
            : { stop() {}, start() {}, on() {}, raf() {}, isStopped: false };

        lenis.stop();

        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(500, 33);

        // 1B. Start scrolling immediately — jangan blokir scroll menunggu preloader.
        // Preloader overlay tetap visible secara visual, tapi scroll tidak diblokir.
        document.body.classList.remove('overflow-hidden');
        function runLinesLoaderReveal() {
            lenis.start();
            ScrollTrigger.refresh();
        }
        if (window.MarpilahPreloader?.ready) runLinesLoaderReveal();
        else window.addEventListener('marpilah:preloader-ready', runLinesLoaderReveal, { once: true });
        // Fallback: jika preloader tidak fire dalam 3 detik, tetap start scroll
        setTimeout(runLinesLoaderReveal, 3000);

        // 2. Section 2: Koreografi Cipher Digital (Responsif Mobile & Desktop)
        let cipherTimeline = null;

        function initCipherTimeline() {
            if (cipherTimeline) {
                if (cipherTimeline.scrollTrigger) cipherTimeline.scrollTrigger.kill();
                cipherTimeline.kill();
            }

            const stage = document.getElementById('cipher-stage');
            const mediaBox = document.getElementById('cipher-media-box');
            const slotLeft = document.getElementById('cipher-slot-left');
            const slotRight = document.getElementById('cipher-slot-right');
            if (!stage || !mediaBox || !slotLeft || !slotRight) return;

            const stageRect = stage.getBoundingClientRect();
            const leftRect = slotLeft.getBoundingClientRect();
            const rightRect = slotRight.getBoundingClientRect();
            const isMobile = stageRect.width < 768;

            const mobileMediaTop = Math.min(86, stageRect.height * 0.11);
            const mobileMediaHeight = Math.min(stageRect.height * 0.36, (stageRect.width - 40) * 0.68);

            const startCoords = isMobile
                ? {
                    left: 20,
                    top: mobileMediaTop,
                    width: stageRect.width - 40,
                    height: mobileMediaHeight
                }
                : {
                    left: leftRect.left - stageRect.left,
                    top: leftRect.top - stageRect.top,
                    width: leftRect.width,
                    height: leftRect.height
                };

            const rightCoords = isMobile
                ? {
                    left: 28,
                    top: mobileMediaTop + 6,
                    width: stageRect.width - 56,
                    height: mobileMediaHeight * 1.06
                }
                : {
                    left: rightRect.left - stageRect.left,
                    top: rightRect.top - stageRect.top,
                    width: rightRect.width,
                    height: rightRect.height
                };

            gsap.set(mediaBox, {
                left: startCoords.left,
                top: startCoords.top,
                width: startCoords.width,
                height: startCoords.height,
                borderRadius: isMobile ? '16px' : '24px',
                force3D: true
            });
            gsap.set('#cipher-img-1', { opacity: 1 });
            gsap.set(['#cipher-img-2', '#cipher-img-3', '#cipher-img-4'], { opacity: 0 });
            gsap.set('#cipher-text-right', { opacity: 1, y: 0 });
            gsap.set('#cipher-text-left', { opacity: 0, y: 24 });
            gsap.set('#cipher-full-content', { opacity: 0 });
            gsap.set('#cipher-metrics-row', { y: 36 });
            gsap.set('#cipher-full-overlay', { opacity: 0 });

            cipherTimeline = gsap.timeline({
                scrollTrigger: {
                    trigger: '#cipher-stage',
                    start: 'top top',
                    end: '+=440%',
                    pin: true,
                    scrub: 0.25,
                    anticipatePin: 1
                }
            });

            cipherTimeline
                .to('#cipher-text-right', { opacity: 0, y: -18, duration: 0.75, ease: 'sine.inOut' }, 0.3)
                .to(mediaBox, {
                    left: rightCoords.left,
                    top: rightCoords.top,
                    width: rightCoords.width,
                    height: rightCoords.height,
                    duration: 1.45,
                    ease: 'power3.inOut'
                }, 0.45)
                .to('#cipher-img-2', { opacity: 1, duration: 1.05, ease: 'sine.inOut' }, 0.65)
                .to('#cipher-text-left', { opacity: 1, y: 0, duration: 0.85, ease: 'power2.out' }, 1.35);

            cipherTimeline.to('#cipher-img-3', { opacity: 1, duration: 1.05, ease: 'sine.inOut' }, 2.35);

            cipherTimeline
                .to('#cipher-text-left', { opacity: 0, y: -18, duration: 0.65, ease: 'sine.inOut' }, 3.55)
                .to('#cipher-img-4', { opacity: 1, duration: 0.95, ease: 'sine.inOut' }, 3.65)
                .to(mediaBox, {
                    left: 0,
                    top: 0,
                    width: stageRect.width,
                    height: stageRect.height,
                    borderRadius: '0px',
                    duration: 1.55,
                    ease: 'power3.inOut'
                }, 3.8)
                .to('#cipher-full-overlay', { opacity: 1, duration: 1.0 }, 4.15)
                .to('#cipher-full-content', { opacity: 1, duration: 0.85, ease: 'power2.out' }, 4.75)
                .to('#cipher-metrics-row', { y: 0, duration: 0.95, ease: 'power2.out' }, 4.85);
        }

        // 3. Section 3: Scroll Lock 3D MacBook Showcase -> Portal ke Section 4 (#krisis-hero)
        function initMacbookScrollLock() {
            const laptopSection = document.getElementById('tentang');
            const wordsEl = document.getElementById('laptop-words');
            const portalTargetEl = document.getElementById('krisis-hero');
            const portalInnerStage = document.getElementById('fame-tunnel-stage');

            if (!laptopSection) return;

            const smoothstep = (min, max, val) => {
                const x = Math.max(0, Math.min(1, (val - min) / (max - min)));
                return x * x * (3 - 2 * x);
            };
            const mobileMapFlow = window.matchMedia('(max-width: 767px)');

            const laptopTrigger = ScrollTrigger.create({
                trigger: laptopSection,
                start: 'top top',
                end: '+=300%',
                pin: true,
                scrub: 0.2,
                anticipatePin: 1,
                onUpdate: (self) => {
                    const p = self.progress;
                    const state = window.macbookScrollState;
                    if (state.selected && !mobileMapFlow.matches && self.direction < 0 && p < 0.95) restoreDesktop();
                    if (state.locked && p < 0.799) {
                        state.locked = false;
                        lenis.start();
                    }
                    state.targetProgress = state.selected ? p : Math.min(p, 0.80);
                    if (!state.selected && !state.navigationTarget && p >= 0.80 && !state.locked) {
                        state.locked = true;
                        lenis.stop();
                        window.scrollTo(0, self.start + (self.end - self.start) * 0.80);
                    }

                    if (wordsEl) {
                        const textFade = 1 - smoothstep(0.32, 0.6, p);
                        wordsEl.style.opacity = textFade.toFixed(3);
                        wordsEl.style.transform = `translate3d(0, ${-p * 45}px, 0)`;
                    }

                    if (portalTargetEl) {
                        const portalReveal = window.macbookScrollState.selected ? smoothstep(0.955, 0.995, p) : 0;
                        portalTargetEl.style.opacity = portalReveal.toFixed(3);
                        portalTargetEl.style.pointerEvents = portalReveal > 0.85 ? 'auto' : 'none';

                        if (portalInnerStage) {
                            if (portalReveal >= 0.995) {
                                portalInnerStage.style.transform = '';
                            } else {
                                const scaleVal = 0.99 + 0.01 * portalReveal;
                                portalInnerStage.style.transform = `scale(${scaleVal.toFixed(4)})`;
                            }
                        }
                    }
                }
            });
            const state = window.macbookScrollState;
            const desktop = document.getElementById('laptop-desktop');
            const back = document.getElementById('desktop-return');
            const desktopStatus = document.getElementById('desktop-status');
            function updateDesktopStatus() {
                desktopStatus.textContent = mobileMapFlow.matches
                    ? 'Pilih MAPS untuk menjelajah. Gunakan tombol Kembali ke desktop pada layar peta.'
                    : 'Pilih MAPS untuk menjelajah. Scroll ke atas untuk kembali.';
            }
            updateDesktopStatus();
            mobileMapFlow.addEventListener('change', updateDesktopStatus);
            function restoreDesktop() {
                const state = window.macbookScrollState;
                if (!state) return;
                state.selected = false;
                state.locked = false;
                window.__resetBankMap?.();
                window.__showLaptopDesktop?.();
                const back = document.getElementById('desktop-return');
                if (back) back.hidden = true;
                const frame = document.getElementById('bank-map-frame');
                if (frame && frame.style.pointerEvents === 'auto') {
                    const toggle = document.getElementById('bank-map-toggle');
                    if (toggle) toggle.click();
                }
                const desktop = document.getElementById('laptop-desktop');
                if (desktop) {
                    desktop.style.visibility = 'visible';
                    desktop.inert = false;
                }
                updateDesktopStatus();
            }
            let touchY = null;
            window.addEventListener('touchstart', e => {touchY = e.touches[0]?.clientY ?? null;}, {passive:true});
            function preventScroll(e) {
                if (e.target.closest?.('#mobile-nav-drawer')) return;
                let delta = 0;
                if (e.type === 'wheel') delta = e.deltaY;
                if (e.type === 'touchmove' && e.touches[0]) {
                    const y = e.touches[0].clientY;
                    delta = touchY === null ? 0 : touchY - y;
                    touchY = y;
                }
                if (!state.locked) return;
                if (e.type === 'keydown') {
                    if (!['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key)) return;
                    if (e.key === ' ' && e.target.closest('button')) return;
                    delta = ['ArrowUp','PageUp','Home'].includes(e.key) || (e.key === ' ' && e.shiftKey) ? -100 : 100;
                }
                if (delta < 0) {
                    state.locked = false;
                    lenis.start();
                    const stop = laptopTrigger.start + (laptopTrigger.end - laptopTrigger.start) * .80;
                    const destination = Math.max(laptopTrigger.start, stop - Math.max(32, Math.abs(delta)));
                    if (lenis.scrollTo) lenis.scrollTo(destination, {immediate:true, force:true});
                    else window.scrollTo(0, destination);
                    ScrollTrigger.update();
                }
                e.preventDefault();
            }
            window.addEventListener('wheel', preventScroll, {passive:false});
            window.addEventListener('touchmove', preventScroll, {passive:false});
            window.addEventListener('keydown', preventScroll);
            window.addEventListener('scroll', () => {
                if (state.locked) {
                    const stop = laptopTrigger.start + (laptopTrigger.end - laptopTrigger.start) * .80;
                    if (window.scrollY > stop + 2) window.scrollTo(0, stop);
                }
            }, {passive:true});
            document.getElementById('desktop-game').addEventListener('click', () => {
                document.getElementById('desktop-status').textContent = 'GAME segera hadir. Pilih MAPS untuk melanjutkan ke peta.';
            });
            document.getElementById('desktop-maps').addEventListener('click', () => {
                window.__resetBankMap?.();
                state.selected = true;
                state.locked = false;
                desktop.inert = true;
                desktop.style.visibility = 'hidden';
                window.__showLaptopMap?.();
                lenis.start();
                const destination = laptopTrigger.end;
                const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1.8;
                if (lenis.scrollTo) lenis.scrollTo(destination, {duration, force:true});
                else window.scrollTo({top:destination, behavior:duration ? 'smooth' : 'instant'});
                back.hidden = false;
                setTimeout(() => { if (state.selected) document.getElementById('bank-map-toggle').focus({preventScroll:true}); }, duration * 1000 + 100);
            });
            back.addEventListener('click', () => {
                restoreDesktop();
                lenis.start();
                const destination = laptopTrigger.start + (laptopTrigger.end - laptopTrigger.start) * .80;
                if (lenis.scrollTo) lenis.scrollTo(destination, {immediate:true, force:true});
                else window.scrollTo(0,destination);
                ScrollTrigger.update();
                setTimeout(() => document.getElementById('desktop-maps').focus({preventScroll:true}), 200);
            });
        }

        // 4. Section 4: Koreografi Fame Real Estate (Tirai Merah -> Tunnel Zoom -> Tirai Putih)
        function initFameTunnelTimeline() {
            const redCurtain = document.getElementById('fame-curtain-red');
            const whiteCurtain = document.getElementById('fame-curtain-white');
            if (!redCurtain || !whiteCurtain) return;

            const curtainState = {
                redInset: 50,
                whiteInset: 50
            };

            redCurtain.style.clipPath = 'inset(0% 50% 0% 50%)';
            whiteCurtain.style.clipPath = 'inset(0% 50% 0% 50%)';

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: '#fame-tunnel-stage',
                    start: 'top top',
                    end: '+=440%',
                    pin: true,
                    scrub: 0.2,
                    anticipatePin: 1
                }
            });

            tl.to(curtainState, {
                redInset: 49.8,
                duration: 0.2,
                ease: 'none',
                onUpdate: () => {
                    redCurtain.style.clipPath = `inset(0% ${curtainState.redInset}% 0% ${curtainState.redInset}%)`;
                }
            }, 0)
            .to(curtainState, {
                redInset: 0,
                duration: 1.15,
                ease: 'power2.inOut',
                onUpdate: () => {
                    redCurtain.style.clipPath = `inset(0% ${curtainState.redInset}% 0% ${curtainState.redInset}%)`;
                }
            }, 0.2);

            tl.to('#tunnel-img-1', { opacity: 1, duration: 0.15 }, 1.15)
              .to('#tunnel-img-1', { scale: 1.18, duration: 1.6, ease: 'power1.inOut' }, 1.15);

            tl.to('#tunnel-img-2', { opacity: 1, duration: 0.15 }, 1.85)
              .to('#tunnel-img-2', { scale: 1.18, duration: 1.6, ease: 'power1.inOut' }, 1.85);

            tl.to('#tunnel-red-card', { opacity: 1, duration: 0.15 }, 2.55)
              .to('#tunnel-red-card', { scale: 1.05, duration: 1.5, ease: 'power1.inOut' }, 2.55);

            tl.to(curtainState, {
                whiteInset: 49.8,
                duration: 0.2,
                ease: 'none',
                onUpdate: () => {
                    whiteCurtain.style.clipPath = `inset(0% ${curtainState.whiteInset}% 0% ${curtainState.whiteInset}%)`;
                }
            }, 4.25)
            .to(curtainState, {
                whiteInset: 0,
                duration: 1.3,
                ease: 'power2.inOut',
                onUpdate: () => {
                    whiteCurtain.style.clipPath = `inset(0% ${curtainState.whiteInset}% 0% ${curtainState.whiteInset}%)`;
                }
            }, 4.45);
        }

        // 5. Section 5: Pinned Odometer Stats + Background Crossfade + Staggered 8-Card Grid
        function initFameStatsAndCases() {
            const label1 = document.getElementById('odo-label-1');
            const label2 = document.getElementById('odo-label-2');
            const label3 = document.getElementById('odo-label-3');
            if (!label1 || !label2 || !label3) return;

            const labelsStep0 = [
                'MILIAR TON SAMPAH PADAT PERKOTAAN DIHASILKAN DUNIA SETIAP TAHUN',
                'SAMPAH GLOBAL TIDAK DIKELOLA SECARA AMAN BAGI LINGKUNGAN',
                'TON PLASTIK MASUK KE EKOSISTEM LAUTAN SETIAP TAHUNNYA'
            ];
            const labelsStep1 = [
                'SAMPAH PLASTIK KEMASAN BERAKHIR DI TPA ATAU LINGKUNGAN TERBUKA',
                'LIPAT PROYEKSI KENAIKAN LIMBAH PLASTIK GLOBAL PADA TAHUN 2060',
                'TAHUN WAKTU YANG DIBUTUHKAN BOTOL PLASTIK UNTUK TERURAI'
            ];
            const labelsStep2 = [
                'JUTA TON SAMPAH PLASTIK MENGANCAM BIOTA LAUT SETIAP TAHUN',
                'PERSEN TOTAL PLASTIK DUNIA YANG BENAR-BENAR PERNAH DIDAUR ULANG',
                'PERSEN TARGET PEMULIHAN MATERIAL PADA FASILITAS SIRKULAR MODERN'
            ];

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: '#fame-stats-cases-stage',
                    start: 'top top',
                    end: '+=380%',
                    pin: true,
                    scrub: 0.2,
                    anticipatePin: 1,
                    onUpdate: (self) => {
                        const p = self.progress;
                        if (p < 0.22) {
                            label1.textContent = labelsStep0[0];
                            label2.textContent = labelsStep0[1];
                            label3.textContent = labelsStep0[2];
                        } else if (p < 0.45) {
                            label1.textContent = labelsStep1[0];
                            label2.textContent = labelsStep1[1];
                            label3.textContent = labelsStep1[2];
                        } else {
                            label1.textContent = labelsStep2[0];
                            label2.textContent = labelsStep2[1];
                            label3.textContent = labelsStep2[2];
                        }
                    }
                }
            });

            tl.to(['#odo-col-1', '#odo-col-2', '#odo-col-3'], {
                yPercent: -33.333,
                duration: 1,
                ease: 'power2.inOut'
            }, 0.3)
            .to('#stats-bg-2', { opacity: 1, duration: 1 }, 0.3);

            tl.to(['#odo-col-1', '#odo-col-2', '#odo-col-3'], {
                yPercent: -66.666,
                duration: 1,
                ease: 'power2.inOut'
            }, 1.6)
            .to('#stats-bg-3', { opacity: 1, duration: 1 }, 1.6);

            tl.to('#fame-stats-layer', {
                opacity: 0,
                y: -40,
                duration: 0.7,
                ease: 'power2.in'
            }, 2.9)
            .to('#fame-cases-layer', {
                opacity: 1,
                duration: 0.3
            }, 3.2)
            .fromTo('.case-card',
                { opacity: 0, y: 55, scale: 0.94 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 1.1,
                    stagger: 0.12,
                    ease: 'power3.out'
                },
                3.25
            );
        }

        // 6. Interaksi Slider + Touch Swipe pada Bagian "Audit Limbah & Seleksi Material"
        function initServiceSlider() {
            const slides = [
                {
                    title: 'AUDIT LIMBAH & SELEKSI MATERIAL',
                    desc: 'PEMETAAN ARUS SAMPAH PERKOTAAN DAN PESISIR UNTUK MEMISAHKAN POLIMER BERNILAI TINGGI SEBELUM MENCEMARI EKOSISTEM LAUT.',
                    img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85'
                },
                {
                    title: 'INTERSEPSI SUNGAI & PESISIR',
                    desc: 'PEMASANGAN PENGHALANG SAMPAH OTOMATIS DI MUARA SUNGAI STRATEGIS UNTUK MENANGKAP LIMBAH MENGAPUNG SEBELUM MENCAPAI SAMUDRA.',
                    img: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1400&q=85'
                },
                {
                    title: 'REHABILITASI LAHAN BEKAS TPA',
                    desc: 'PENANGKAPAN GAS METANA DAN PEMULIHAN EKOLOGIS LAHAN PEMBUANGAN AKHIR MENJADI KAWASAN HIJAU PENYERAP KARBON.',
                    img: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1400&q=85'
                }
            ];

            let currentIndex = 0;
            const titleEl = document.getElementById('service-title');
            const descEl = document.getElementById('service-desc');
            const imgEl = document.getElementById('service-img');
            const counterEl = document.getElementById('service-counter');
            const prevBtn = document.getElementById('service-prev');
            const nextBtn = document.getElementById('service-next');
            if (!titleEl || !descEl || !imgEl || !counterEl || !prevBtn || !nextBtn) return;

            function updateSlide(idx) {
                currentIndex = (idx + slides.length) % slides.length;
                const item = slides[currentIndex];
                gsap.to([titleEl, descEl, imgEl], {
                    opacity: 0,
                    duration: 0.2,
                    onComplete: () => {
                        titleEl.textContent = item.title;
                        descEl.textContent = item.desc;
                        imgEl.src = item.img;
                        counterEl.textContent = `0${currentIndex + 1} / 0${slides.length}`;
                        gsap.to([titleEl, descEl, imgEl], { opacity: 1, duration: 0.3 });
                    }
                });
            }

            prevBtn.addEventListener('click', () => updateSlide(currentIndex - 1));
            nextBtn.addEventListener('click', () => updateSlide(currentIndex + 1));

            const swipeArea = document.getElementById('service-swipe-area');
            let touchStartX = 0;
            if (swipeArea) {
                swipeArea.addEventListener('touchstart', (e) => {
                    touchStartX = e.changedTouches[0].clientX;
                }, { passive: true });
                swipeArea.addEventListener('touchend', (e) => {
                    const deltaX = e.changedTouches[0].clientX - touchStartX;
                    if (Math.abs(deltaX) > 42) {
                        updateSlide(deltaX < 0 ? currentIndex + 1 : currentIndex - 1);
                    }
                }, { passive: true });
            }
        }

        // 7. Kontrol Menu Navigasi Mobile
        function initMobileNav() {
            const toggleBtn = document.getElementById('mobile-menu-toggle');
            const drawer = document.getElementById('mobile-nav-drawer');
            const bar1 = document.getElementById('menu-bar-1');
            const bar2 = document.getElementById('menu-bar-2');
            if (!toggleBtn || !drawer) return;

            let isOpen = false, menuOverflow = '', menuResume = false;
            const setMenuState = (open) => {
                if (open === isOpen) return;
                if (open) {
                    menuOverflow = document.body.style.overflow;
                    menuResume = !lenis.isStopped;
                    document.body.style.overflow = 'hidden';
                    lenis.stop();
                } else {
                    document.body.style.overflow = menuOverflow;
                    if (menuResume && !window.macbookScrollState?.locked) lenis.start();
                }
                isOpen = open;
                toggleBtn.setAttribute('aria-expanded', String(open));
                toggleBtn.setAttribute('aria-label', open ? 'Tutup menu navigasi' : 'Buka menu navigasi');
                drawer.inert = !open;
                drawer.style.opacity = open ? '1' : '0';
                drawer.style.pointerEvents = open ? 'auto' : 'none';
                bar1.style.transform = open ? 'translateY(3.5px) rotate(45deg)' : '';
                bar2.style.transform = open ? 'translateY(-3.5px) rotate(-45deg)' : '';
            };

            toggleBtn.addEventListener('click', () => setMenuState(!isOpen));
            document.addEventListener('keydown', e => {
                if (e.key === 'Escape' && isOpen) {setMenuState(false);toggleBtn.focus({preventScroll:true});}
                if(e.key === 'Tab' && isOpen){
                    const items=[toggleBtn,...drawer.querySelectorAll('a[href]')];
                    const first=items[0],last=items[items.length-1];
                    if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
                    else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
                }
            });
            window.matchMedia('(min-width:768px)').addEventListener('change', e => {if(e.matches) setMenuState(false);});
            const navigationLinks=[...drawer.querySelectorAll('.mobile-nav-link'),...document.querySelectorAll('#site-header a[href^="#"],#recovery-back-top')];
            navigationLinks.forEach((link) => {
                link.addEventListener('click', e => {
                    if(window.innerWidth>=768 && link.closest('#site-header'))return;
                    const target=document.querySelector(link.getAttribute('href'));
                    setMenuState(false);
                    if(!target)return;
                    e.preventDefault();
                    const state=window.macbookScrollState;
                    if(target.id==='krisis-hero'){
                        document.getElementById('desktop-return').click();
                        requestAnimationFrame(()=>document.getElementById('desktop-maps').click());
                        return;
                    }
                    if(state){state.locked=false;state.navigationTarget=true;}
                    lenis.start();
                    const done=()=>{if(state)state.navigationTarget=false;};
                    if(lenis.scrollTo)lenis.scrollTo(target,{duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:.8,force:true,onComplete:done});
                    else {target.scrollIntoView({behavior:'instant'});done();}
                    setTimeout(done,1200);
                });
            });
        }

        // 8. Animasi Parallax Antar-Section
        function initSectionTransitionsParallax() {
            gsap.fromTo('#cipher-full-content',
                { yPercent: 0 },
                {
                    yPercent: -16,
                    ease: 'none',
                    immediateRender: false,
                    scrollTrigger: {
                        trigger: '#infrastruktur',
                        start: 'bottom bottom',
                        end: 'bottom top',
                        scrub: 0.2
                    }
                }
            );

            gsap.fromTo('#fame-cases-layer',
                { yPercent: 0 },
                {
                    yPercent: -18,
                    ease: 'none',
                    immediateRender: false,
                    scrollTrigger: {
                        trigger: '#dampak',
                        start: 'bottom bottom',
                        end: 'bottom top',
                        scrub: 0.2
                    }
                }
            );

            gsap.fromTo('#stats-bg-3',
                { yPercent: 0 },
                {
                    yPercent: 12,
                    ease: 'none',
                    immediateRender: false,
                    scrollTrigger: {
                        trigger: '#dampak',
                        start: 'bottom bottom',
                        end: 'bottom top',
                        scrub: 0.2
                    }
                }
            );

            gsap.fromTo('#seleksi-left',
                { y: 42 },
                {
                    y: 0,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: '#seleksi',
                        start: 'top bottom',
                        end: 'center center',
                        scrub: 0.2
                    }
                }
            );

            gsap.fromTo('#seleksi-right',
                { y: 82 },
                {
                    y: 0,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: '#seleksi',
                        start: 'top bottom',
                        end: 'center center',
                        scrub: 0.2
                    }
                }
            );
        }

        // Jalankan semua dalam urutan DOM yang ketat (Section 1 -> 2 -> 3 -> 4 -> 5 -> 6)
        window.addEventListener('load', () => {
            initMobileNav();
            initCipherTimeline();
            initMacbookScrollLock();
            initFameTunnelTimeline();
            initFameStatsAndCases();
            initSectionTransitionsParallax();
            initServiceSlider();
            if (window.MarpilahPreloader?.markAppReady) {
                window.MarpilahPreloader.markAppReady();
            } else {
                document.getElementById('preloader-overlay')?.remove();
                runLinesLoaderReveal();
            }
        });

        let resizeTimer;
        let lastLayoutWidth = window.innerWidth;
        window.addEventListener('resize', () => {
            let typing = document.activeElement?.matches('input,textarea,[contenteditable="true"]');
            try { typing ||= document.getElementById('bank-map-frame')?.contentDocument?.activeElement?.matches('input,textarea,[contenteditable="true"]'); } catch(e) {}
            const sameWidth = window.innerWidth === lastLayoutWidth;
            lastLayoutWidth = window.innerWidth;
            if (sameWidth && typing) return;
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                initCipherTimeline();
                ScrollTrigger.refresh();
            }, 220);
        });
    