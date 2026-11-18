(() => {
    const scene = document.getElementById('top');
    const stage = scene?.querySelector('.bin-stage');
    const background = document.getElementById('bin-background');
    const homeButton = document.getElementById('bin-home');
    const pauseButton = document.getElementById('bin-pause');
    const status = document.getElementById('bin-status');
    const hotspots = [...(scene?.querySelectorAll('.bin-hotspot') ?? [])];

    if (!scene || !stage || !background || !homeButton || !pauseButton || !status) return;

    const forward = {
        red: document.getElementById('bin-red'),
        yellow: document.getElementById('bin-yellow'),
        green: document.getElementById('bin-green')
    };
    const reverse = {
        red: document.getElementById('bin-red-return'),
        yellow: document.getElementById('bin-yellow-return'),
        green: document.getElementById('bin-green-return')
    };
    const videos = [...Object.values(forward), ...Object.values(reverse)];
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const fadeDuration = reducedMotion.matches ? 0 : 450;

    let activeVideo = null;
    let activeColor = null;
    let activeKind = null;
    let pendingVideo = null;
    let selectedTrigger = null;
    let generation = 0;
    let resumeBackground = !background.paused;

    function setStatus(message = '') {
        status.textContent = message;
        status.hidden = !message;
    }

    function currentVideo() {
        return activeVideo ?? pendingVideo ?? background;
    }

    function updatePauseButton() {
        const isPaused = currentVideo().paused;
        const pauseIcon = pauseButton.querySelector('[data-pause]');
        const playIcon = pauseButton.querySelector('[data-play]');
        pauseButton.disabled = activeKind === 'returning';
        if (pauseIcon) pauseIcon.style.display = isPaused ? 'none' : '';
        if (playIcon) playIcon.style.display = isPaused ? '' : 'none';
        pauseButton.setAttribute('aria-label', isPaused ? 'Putar video' : 'Jeda video');
        pauseButton.title = isPaused ? 'Putar video' : 'Jeda video';
    }

    function waitForMetadata(video) {
        if (video.readyState >= HTMLMediaElement.HAVE_METADATA) return Promise.resolve();

        return new Promise((resolve, reject) => {
            const timeout = window.setTimeout(() => finish(new Error('Video tidak siap.')), 10000);
            const onLoaded = () => finish();
            const onError = () => finish(new Error('Video tidak dapat dimuat.'));

            function finish(error) {
                window.clearTimeout(timeout);
                video.removeEventListener('loadedmetadata', onLoaded);
                video.removeEventListener('error', onError);
                if (error) reject(error);
                else resolve();
            }

            video.addEventListener('loadedmetadata', onLoaded, { once: true });
            video.addEventListener('error', onError, { once: true });
        });
    }

    async function seekTo(video, time) {
        await waitForMetadata(video);
        if (Math.abs(video.currentTime - time) < 0.02) return;

        await new Promise((resolve, reject) => {
            const timeout = window.setTimeout(() => finish(new Error('Video tidak dapat diposisikan.')), 5000);
            const onSeeked = () => finish();
            const onError = () => finish(new Error('Video tidak dapat diposisikan.'));

            function finish(error) {
                window.clearTimeout(timeout);
                video.removeEventListener('seeked', onSeeked);
                video.removeEventListener('error', onError);
                if (error) reject(error);
                else resolve();
            }

            video.addEventListener('seeked', onSeeked, { once: true });
            video.addEventListener('error', onError, { once: true });
            try {
                video.currentTime = time;
            } catch (error) {
                finish(error);
            }
        });
    }

    function setPlayingState(state) {
        scene.dataset.state = state;
        hotspots.forEach((button) => {
            button.disabled = state !== 'idle';
        });
        homeButton.hidden = state === 'idle';
        updatePauseButton();
    }

    function finishHome(message = '') {
        generation += 1;
        activeVideo = null;
        activeColor = null;
        activeKind = null;
        pendingVideo = null;

        videos.forEach((video) => {
            video.pause();
            video.classList.remove('is-visible');
        });
        background.classList.add('is-visible');

        if (resumeBackground && !reducedMotion.matches) {
            background.play().catch(() => {});
        } else {
            background.pause();
        }

        setPlayingState('idle');
        setStatus(message);
        updatePauseButton();
        window.setTimeout(() => {
            if (scene.dataset.state === 'idle') selectedTrigger?.focus({ preventScroll: true });
        }, fadeDuration);
    }

    async function selectBin(color, trigger) {
        const video = forward[color];
        if (!video || activeVideo || pendingVideo) return;

        generation += 1;
        const token = generation;
        selectedTrigger = trigger;
        resumeBackground = !background.paused;
        pendingVideo = video;
        setStatus();
        setPlayingState('preparing');

        try {
            video.style.transitionDuration = `${fadeDuration}ms`;
            await seekTo(video, 0);
            if (token !== generation || pendingVideo !== video) return;
            await video.play();
            if (token !== generation || pendingVideo !== video) {
                video.pause();
                return;
            }

            pendingVideo = null;
            activeVideo = video;
            activeColor = color;
            activeKind = 'forward';
            video.classList.add('is-visible');
            scene.dataset.state = 'playing';
            window.setTimeout(() => {
                if (activeVideo === video) {
                    background.classList.remove('is-visible');
                    background.pause();
                }
            }, fadeDuration);
            updatePauseButton();
        } catch {
            if (token === generation) {
                finishHome('Animasi belum dapat diputar. Klik tong sampah untuk mencoba lagi.');
            }
        }
    }

    async function returnToIdle() {
        if (pendingVideo) {
            finishHome();
            return;
        }
        if (!activeVideo || !activeColor || activeKind !== 'forward') return;

        const from = activeVideo;
        const color = activeColor;
        const back = reverse[color];
        if (!back) {
            finishHome('Animasi kembali tidak tersedia.');
            return;
        }

        generation += 1;
        const token = generation;
        from.pause();
        background.pause();
        scene.dataset.state = 'returning';
        activeKind = 'returning';
        updatePauseButton();

        try {
            const fromLength = from.duration || 10;
            const backLength = back.duration || fromLength / 2;
            const target = Math.max(0, Math.min(backLength - 0.05, (fromLength - from.currentTime) / 2));
            await seekTo(back, target);
            if (token !== generation || activeVideo !== from) return;
            await back.play();
            if (token !== generation || activeVideo !== from) {
                back.pause();
                return;
            }

            activeVideo = back;
            activeKind = 'reverse';
            back.style.transitionDuration = `${fadeDuration}ms`;
            back.classList.add('is-visible');
            scene.dataset.state = 'returning';
            window.setTimeout(() => {
                if (activeVideo === back) {
                    from.classList.remove('is-visible');
                    from.pause();
                }
            }, fadeDuration);
            updatePauseButton();
        } catch {
            if (token === generation) {
                finishHome('Animasi kembali tidak dapat diputar.');
            }
        }
    }

    hotspots.forEach((button) => {
        button.addEventListener('click', () => {
            const color = button.dataset.bin;
            const video = color ? forward[color] : null;
            if (video instanceof HTMLVideoElement) void selectBin(color, button);
        });
    });

    function goHome() {
        if (activeKind === 'reverse' || activeKind === 'returning') finishHome();
        else void returnToIdle();
    }

    homeButton.addEventListener('click', goHome);

    pauseButton.addEventListener('click', () => {
        const video = currentVideo();
        if (video.paused) {
            video.play().then(updatePauseButton).catch(() => {
                setStatus('Video tidak dapat diputar. Silakan coba lagi.');
            });
        } else {
            video.pause();
        }
        updatePauseButton();
    });

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && scene.dataset.state !== 'idle') goHome();
    });

    Object.entries(forward).forEach(([color, video]) => {
        video.addEventListener('ended', () => {
            if (activeVideo === video && activeColor === color) void returnToIdle();
        });
        video.addEventListener('error', () => {
            if (activeVideo === video || pendingVideo === video) {
                finishHome('Animasi tidak dapat dimuat. Silakan coba lagi.');
            }
        });
    });

    Object.values(reverse).forEach((video) => {
        video.addEventListener('ended', () => {
            if (activeVideo === video) finishHome();
        });
        video.addEventListener('error', () => {
            if (activeVideo === video) finishHome('Animasi kembali tidak dapat dimuat.');
        });
    });

    background.addEventListener('error', () => {
        if (scene.dataset.state === 'idle') setStatus('Animasi utama tidak dapat dimuat.');
    });

    [background, ...videos].forEach((video) => {
        video.addEventListener('play', updatePauseButton);
        video.addEventListener('pause', updatePauseButton);
    });

    function positionHotspots() {
        const { width, height } = stage.getBoundingClientRect();
        if (!width || !height) return;

        const cover = matchMedia('(min-aspect-ratio: 16/10)').matches;
        const scale = Math[cover ? 'max' : 'min'](width / 1280, height / 720);
        const mediaWidth = 1280 * scale;
        const mediaHeight = 720 * scale;
        const offsetX = (width - mediaWidth) / 2;
        const offsetY = (height - mediaHeight) / 2;
        const bounds = [
            [0.13, 0.21],
            [0.39, 0.19],
            [0.65, 0.21]
        ];

        hotspots.forEach((button, index) => {
            const [left, buttonWidth] = bounds[index];
            button.style.left = `${offsetX + left * mediaWidth}px`;
            button.style.top = `${offsetY + 0.22 * mediaHeight}px`;
            button.style.width = `${buttonWidth * mediaWidth}px`;
            button.style.height = `${0.6 * mediaHeight}px`;
        });
    }

    new ResizeObserver(positionHotspots).observe(stage);
    positionHotspots();
    setPlayingState('idle');
    updatePauseButton();

    if (!reducedMotion.matches) background.play().catch(() => {});
})();
