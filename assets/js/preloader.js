(function (global) {
    function createAssetLoadGate(total, options = {}) {
        const assetCount = Math.max(0, Math.floor(total));
        const onProgress = options.onProgress ?? (() => {});
        const onReady = options.onReady ?? (() => {});
        const onProblem = options.onProblem ?? (() => {});
        const settledAssets = new Set();
        let failed = 0;
        let finished = false;

        function settle(index, success) {
            if (finished || !Number.isInteger(index) || index < 0 || index >= assetCount || settledAssets.has(index)) {
                return;
            }

            settledAssets.add(index);
            if (!success) failed += 1;
            onProgress({
                completed: settledAssets.size,
                total: assetCount,
                failed
            });

            if (settledAssets.size !== assetCount) return;
            finished = true;
            if (failed) {
                onProblem({
                    completed: settledAssets.size,
                    total: assetCount,
                    failed
                });
            } else {
                onReady();
            }
        }

        if (assetCount === 0) {
            finished = true;
            onReady();
        }

        return { settle };
    }

    function startPreloader(doc, win) {
        const resourceErrors = new WeakSet();
        win.addEventListener('error', (event) => {
            const target = event.target;
            if (target?.tagName === 'SCRIPT' || target?.tagName === 'LINK') {
                resourceErrors.add(target);
            }
        }, true);

        function initialize() {
            const overlay = doc.getElementById('preloader-overlay');
            if (!overlay || !doc.body) return;

            const grid = doc.getElementById('lines-loader-grid');
            const status = doc.getElementById('preloader-status');
            const count = doc.getElementById('preloader-count');
            const progress = doc.getElementById('preloader-progress');
            const progressFill = doc.getElementById('preloader-progress-fill');
            const actions = doc.getElementById('preloader-actions');
            const retry = doc.getElementById('preloader-retry');
            const continueButton = doc.getElementById('preloader-continue');
            const reducedMotion = win.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const inertState = new Map();
            let closed = false;
            let appReady = false;
            let gate;
            let appIndex;

            for (let i = 0; i < 24; i += 1) {
                const cell = doc.createElement('span');
                const bar = doc.createElement('span');
                cell.className = 'lines-loader-cell';
                bar.className = 'lines-loader-bar';
                bar.style.animationDelay = `${i * 22}ms`;
                cell.appendChild(bar);
                grid.appendChild(cell);
            }

            Array.from(doc.body.children).forEach((element) => {
                if (element === overlay || element.tagName === 'SCRIPT') return;
                inertState.set(element, element.inert);
                element.inert = true;
            });
            overlay.focus({ preventScroll: true });

            function restorePage() {
                inertState.forEach((wasInert, element) => {
                    element.inert = wasInert;
                });
            }

            function closeOverlay() {
                if (closed) return;
                closed = true;
                global.MarpilahPreloader.ready = true;
                overlay.classList.add('is-leaving');
                win.setTimeout(() => {
                    overlay.hidden = true;
                    restorePage();
                    doc.body.classList.remove('overflow-hidden');
                    doc.dispatchEvent(new win.CustomEvent('marpilah:preloader-ready'));
                }, reducedMotion ? 0 : 260);
            }

            function showProblem(state) {
                if (closed) return;
                status.textContent = `Sebagian aset tidak berhasil dimuat (${state.failed}).`;
                count.textContent = `${state.completed} dari ${state.total} aset siap`;
                continueButton.textContent = 'Lanjut tanpa aset yang gagal';
                actions.hidden = false;
                retry.focus({ preventScroll: true });
            }

            function updateProgress(state) {
                status.textContent = 'Menyiapkan semua aset halaman';
                count.textContent = `${state.completed} dari ${state.total} aset siap`;
                progress.setAttribute('aria-valuemax', String(state.total));
                progress.setAttribute('aria-valuenow', String(state.completed));
                progress.setAttribute('aria-valuetext', `${state.completed} dari ${state.total} aset siap`);
                const percentage = state.total ? (state.completed / state.total) * 100 : 100;
                progressFill.style.width = `${percentage}%`;
            }

            function createGate(total) {
                gate = createAssetLoadGate(total, {
                    onProgress: updateProgress,
                    onReady: closeOverlay,
                    onProblem: showProblem
                });
            }

            function trackImage(image, index) {
                let settled = false;
                const settle = (success) => {
                    if (settled) return;
                    settled = true;
                    image.removeEventListener('load', onLoad);
                    image.removeEventListener('error', onError);
                    gate.settle(index, success);
                };
                const onLoad = () => settle(image.naturalWidth > 0);
                const onError = () => {
                    win.setTimeout(() => {
                        if (image.complete) settle(image.naturalWidth > 0);
                    }, 0);
                };

                image.addEventListener('load', onLoad);
                image.addEventListener('error', onError);
                image.loading = 'eager';
                if (image.complete) onLoad();
            }

            function trackVideo(video, index) {
                let settled = false;
                const settle = (success) => {
                    if (settled) return;
                    settled = true;
                    video.removeEventListener('loadeddata', onLoadedData);
                    video.removeEventListener('error', onError);
                    gate.settle(index, success);
                };
                const onLoadedData = () => settle(true);
                const onError = () => settle(false);

                video.addEventListener('loadeddata', onLoadedData);
                video.addEventListener('error', onError);
                video.preload = 'auto';
                if (video.readyState >= 2) onLoadedData();
                else if (video.networkState === 0) video.load();
            }

            function trackFrame(frame, index) {
                let settled = false;
                const timeoutMs = 3000;
                const timeoutId = win.setTimeout(() => {
                    settle(true);
                }, timeoutMs);
                const settle = (success) => {
                    if (settled) return;
                    settled = true;
                    win.clearTimeout(timeoutId);
                    frame.removeEventListener('load', onLoad);
                    frame.removeEventListener('error', onError);
                    gate.settle(index, success);
                };
                const onLoad = () => {
                    let frameLoaded = true;
                    try {
                        frameLoaded = !frame.contentWindow?.__assetErrors?.length;
                    } catch {
                        frameLoaded = false;
                    }
                    win.requestAnimationFrame(() => {
                        win.requestAnimationFrame(() => settle(frameLoaded));
                    });
                };
                const onError = () => settle(false);

                frame.addEventListener('load', onLoad);
                frame.addEventListener('error', onError);
                frame.loading = 'eager';
                if (frame.contentDocument?.readyState === 'complete') onLoad();
            }

            function trackFontStylesheet(link, index, fontIndex) {
                let settled = false;
                let fontLoadingFailed = false;
                const fontSet = doc.fonts;
                fontSet?.addEventListener('loadingerror', () => { fontLoadingFailed = true; }, { once: true });
                const settle = (success) => {
                    if (settled) return;
                    settled = true;
                    link.removeEventListener('load', onLoad);
                    link.removeEventListener('error', onError);
                    if (success) {
                        link.media = 'all';
                        win.requestAnimationFrame(() => {
                            Promise.resolve(doc.fonts?.ready).then(
                                () => gate.settle(fontIndex, !fontLoadingFailed),
                                () => gate.settle(fontIndex, false)
                            );
                        });
                    } else {
                        gate.settle(fontIndex, false);
                    }
                    gate.settle(index, success);
                };
                const onLoad = () => settle(true);
                const onError = () => settle(false);

                if (resourceErrors.has(link)) {
                    onError();
                } else if (link.sheet) {
                    onLoad();
                } else {
                    link.addEventListener('load', onLoad, { once: true });
                    link.addEventListener('error', onError, { once: true });
                }
            }

            const images = Array.from(doc.images);
            const videos = Array.from(doc.querySelectorAll('video'));
            const frames = Array.from(doc.querySelectorAll('iframe'));
            const fontStylesheet = doc.getElementById('site-fonts');
            let nextIndex = 0;
            const imageIndexes = images.map(() => nextIndex++);
            const videoIndexes = videos.map(() => nextIndex++);
            const frameIndexes = frames.map(() => nextIndex++);
            const documentIndex = nextIndex++;
            const fontStylesheetIndex = fontStylesheet ? nextIndex++ : null;
            const fontIndex = nextIndex++;
            appIndex = nextIndex++;
            createGate(nextIndex);
            updateProgress({ completed: 0, total: nextIndex });

            if (fontStylesheet) {
                trackFontStylesheet(fontStylesheet, fontStylesheetIndex, fontIndex);
            } else {
                Promise.resolve(doc.fonts?.ready).then(() => gate.settle(fontIndex, true));
            }

            images.forEach((image, index) => trackImage(image, imageIndexes[index]));
            videos.forEach((video, index) => trackVideo(video, videoIndexes[index]));
            frames.forEach((frame, index) => trackFrame(frame, frameIndexes[index]));

            win.addEventListener('load', () => {
                const hasFailedDependency = Array.from(doc.querySelectorAll('script, link'))
                    .some((element) => resourceErrors.has(element));
                gate.settle(documentIndex, !hasFailedDependency);
            }, { once: true });

            doc.addEventListener('keydown', (event) => {
                if (event.key !== 'Tab' || closed) return;
                const controls = Array.from(overlay.querySelectorAll('button:not([hidden])'));
                if (!controls.length) {
                    event.preventDefault();
                    overlay.focus({ preventScroll: true });
                    return;
                }
                const first = controls[0];
                const last = controls[controls.length - 1];
                if (event.shiftKey && doc.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && doc.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            });

            retry.addEventListener('click', () => win.location.reload());
            continueButton.addEventListener('click', closeOverlay);

            global.MarpilahPreloader.markAppReady = () => {
                if (appReady) return;
                appReady = true;
                gate.settle(appIndex, true);
            };
        }

        if (doc.readyState === 'loading') {
            doc.addEventListener('readystatechange', () => {
                if (doc.readyState === 'interactive') initialize();
            }, { once: true });
        } else {
            initialize();
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { createAssetLoadGate };
    }

    if (global.document) {
        global.MarpilahPreloader = {
            ready: false,
            markAppReady() {}
        };
        startPreloader(global.document, global);
    }
})(typeof window !== 'undefined' ? window : globalThis);
