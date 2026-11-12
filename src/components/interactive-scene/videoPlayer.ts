export type BinColor = "blue" | "green" | "gray";

export type PlaybackState =
  | { status: "idle" }
  | { status: "preparing" | "forward" | "reverse"; color: BinColor }
  | { status: "error"; color: BinColor; message: string };

export interface VideoPlayerElements {
  scene: HTMLElement;
  background: HTMLVideoElement;
  forward: Record<BinColor, HTMLVideoElement>;
  reverse: Record<BinColor, HTMLVideoElement>;
  triggers: HTMLButtonElement[];
}

export interface VideoPlayerController {
  selectBin(color: BinColor, trigger: HTMLButtonElement): Promise<void>;
  goHome(): Promise<void>;
  dispose(): void;
}

const COLORS: BinColor[] = ["blue", "green", "gray"];

// Timing constants carried over from the legacy page unchanged.
const FADE_IN = 450;
const FADE_OUT = 450;
const FADE_MID = 140;
const SEEK_FALLBACK = 3000;
const FRAME_READY_FALLBACK = 1500;
const READINESS_TIMEOUT = 10000;

/**
 * The interactive bin-scene playback controller, ported from the legacy
 * page's inline script without changing its sequencing, timing, or
 * user-facing messages.
 */
export function createVideoPlayerController(
  elements: VideoPlayerElements,
  reducedMotion: MediaQueryList,
  disposeVideoSources: () => void,
  onStateChange: (state: PlaybackState) => void,
): VideoPlayerController {
  const { scene, background, forward, reverse, triggers } = elements;

  let generation = 0;
  let pending: HTMLVideoElement | null = null;
  let pendingColor: BinColor | null = null;
  let active: HTMLVideoElement | null = null;
  let activeColor: BinColor | null = null;
  let activeIsReverse = false;
  let pendingTimeout: ReturnType<typeof setTimeout> | undefined;
  let trigger: HTMLButtonElement | null = null;
  let resumeBackground = true;
  let disposed = false;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const cancelWaits = new Set<() => void>();

  function scheduleTimeout(callback: () => void, delay: number) {
    let timer: ReturnType<typeof setTimeout>;
    timer = setTimeout(() => {
      timers.delete(timer);
      callback();
    }, delay);
    timers.add(timer);
    return timer;
  }

  function clearScheduledTimeout(timer: ReturnType<typeof setTimeout> | undefined) {
    if (timer === undefined) return;
    clearTimeout(timer);
    timers.delete(timer);
  }

  function clearTimers(): void {
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
  }

  const idle = () => onStateChange({ status: "idle" });

  /* Navbar disembunyikan selama animasi tong berjalan, dan muncul lagi saat kembali ke tampilan awal */
  function setPlaying(on: boolean): void {
    scene.classList.toggle("playing", on);
    document.body.classList.toggle("playing", on);
  }

  /* Pudar-masuk / pudar-keluar lewat CSS opacity pada elemen video (tanpa canvas) */
  function setFade(video: HTMLVideoElement, ms: number): void {
    video.style.transitionDuration = reducedMotion.matches ? "0ms" : `${ms}ms`;
  }
  function fadeIn(video: HTMLVideoElement, ms: number): void {
    setFade(video, ms);
    video.classList.add("on");
  }
  function fadeOut(video: HTMLVideoElement, ms: number): void {
    setFade(video, ms);
    video.classList.remove("on");
  }

  /* Tunggu sampai frame pertama benar-benar tampil, agar tidak ada kedipan kosong */
  function frameReady(video: HTMLVideoElement): Promise<void> {
    return new Promise((resolve) => {
      let done = false;
      let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
      let playingTimer: ReturnType<typeof setTimeout> | undefined;
      const onPlaying = () => {
        playingTimer = scheduleTimeout(finish, 120);
      };
      const finish = () => {
        if (done) return;
        done = true;
        clearScheduledTimeout(fallbackTimer);
        clearScheduledTimeout(playingTimer);
        video.removeEventListener("playing", onPlaying);
        cancelWaits.delete(finish);
        resolve();
      };
      if ("requestVideoFrameCallback" in video)
        (video as HTMLVideoElement & {
          requestVideoFrameCallback: (cb: () => void) => void;
        }).requestVideoFrameCallback(finish);
      video.addEventListener("playing", onPlaying, { once: true });
      fallbackTimer = scheduleTimeout(finish, FRAME_READY_FALLBACK);
      cancelWaits.add(finish);
    });
  }

  function seek(video: HTMLVideoElement, time: number): Promise<void> {
    return new Promise((resolve) => {
      if (Math.abs(video.currentTime - time) < 0.02 && video.readyState >= 2)
        return resolve();
      const done = () => {
        clearScheduledTimeout(timer);
        video.removeEventListener("seeked", done);
        cancelWaits.delete(done);
        resolve();
      };
      const timer = scheduleTimeout(done, SEEK_FALLBACK);
      cancelWaits.add(done);
      video.addEventListener("seeked", done);
      video.currentTime = time;
    });
  }

  function returnHome(): void {
    generation++;
    clearScheduledTimeout(pendingTimeout);
    pendingTimeout = undefined;
    pending?.pause();
    pending = null;
    pendingColor = null;
    const previous = active;
    active = null;
    activeColor = null;
    activeIsReverse = false;
    if (resumeBackground) background.play().catch(() => {});
    for (const color of COLORS) {
      for (const video of [forward[color], reverse[color]]) {
        if (video.classList.contains("on") || video === previous) {
          fadeOut(video, FADE_OUT);
          video.pause();
        }
      }
    }
    setPlaying(false);
    idle();
    scheduleTimeout(
      () => {
        if (!active && !pending) {
          triggers.forEach((button) => (button.disabled = false));
          /* Fokus kembali ke pemicu setelah tombol diaktifkan kembali;
             memanggil focus() pada tombol yang masih disabled tidak
             ber efek di browser, jadi urutannya dijaga di sini. */
          trigger?.focus({ preventScroll: true });
        }
      },
      reducedMotion.matches ? 0 : FADE_OUT,
    );
  }

  function returnHomeWithError(color: BinColor, message: string): void {
    returnHome();
    onStateChange({ status: "error", color, message });
  }

  function reveal(video: HTMLVideoElement, color: BinColor, token: number): void {
    if (token !== generation || pending !== video) return;
    clearScheduledTimeout(pendingTimeout);
    pendingTimeout = undefined;
    active = video;
    activeColor = color;
    activeIsReverse = false;
    pending = null;
    fadeIn(video, FADE_IN);
    onStateChange({ status: "forward", color });
    // Latar dihentikan selama tertutup penuh, supaya hanya satu video yang diputar (lebih ringan, tidak patah-patah)
    scheduleTimeout(() => {
      // Matches the legacy guard: pause when the revealed forward video is
      // active, or when the same color's reverse video has already taken
      // over (forward ended into smoothReturn before this timer fired).
      if (active === video || (activeIsReverse && activeColor === color))
        background.pause();
    }, FADE_IN + 80);
  }

  /* Kembali mulus: putar mundur dari frame yang sedang tampil (video mundur sudah 2x di dalam file) */
  async function smoothReturn(): Promise<void> {
    const from = active;
    const color = activeColor;
    if (!from || !color) return;
    if (activeIsReverse) return;
    const back = reverse[color];
    const token = ++generation;
    from.pause();
    onStateChange({ status: "reverse", color });
    const fromLength = from.duration || 10;
    const backLength = back.duration || fromLength / 2;
    const target = Math.max(
      0,
      Math.min(backLength - 0.05, (fromLength - from.currentTime) / 2),
    );
    await seek(back, target);
    if (token !== generation || active !== from) return;
    const ready = frameReady(back);
    try {
      await back.play();
    } catch {
      returnHome();
      return;
    }
    await ready;
    if (token !== generation || active !== from) return;
    active = back;
    activeIsReverse = true;
    fadeIn(back, FADE_MID);
    scheduleTimeout(() => {
      if (active === back) {
        setFade(from, 0);
        from.classList.remove("on");
      }
    }, FADE_MID + 60);
  }

  /* HOME (atau Esc): kembali ke adegan utama dengan mulus */
  async function goHome(): Promise<void> {
    if (pending) {
      returnHome();
      return;
    }
    if (active) await smoothReturn();
  }

  async function selectBin(
    color: BinColor,
    button: HTMLButtonElement,
  ): Promise<void> {
    if (active || pending) return;
    trigger = button;
    resumeBackground = !background.paused;
    const video = forward[color];
    const token = ++generation;
    pending = video;
    pendingColor = color;
    triggers.forEach((item) => (item.disabled = true));
    setPlaying(true);
    onStateChange({ status: "preparing", color });
    setFade(video, 0);
    video.classList.remove("on");
    await seek(video, 0);
    if (token !== generation || pending !== video) return;
    pendingTimeout = scheduleTimeout(() => {
      if (token !== generation || pending !== video) return;
      returnHome();
      onStateChange({
        status: "error",
        color,
        message: "Animasi belum siap. Silakan klik tong untuk mencoba lagi.",
      });
    }, READINESS_TIMEOUT);
    const ready = frameReady(video);
    try {
      await video.play();
    } catch {
      if (token !== generation) return;
      returnHomeWithError(
        color,
        "Animasi belum dapat diputar. Klik tong sampah untuk mencoba lagi.",
      );
      return;
    }
    await ready;
    reveal(video, color, token);
  }

  const cleanups: Array<() => void> = [];

  for (const color of COLORS) {
    const chosen = forward[color];
    const back = reverse[color];
    const onChosenEnded = () => {
      if (active !== chosen) return;
      // Video 1 berakhir di tampilan tiga tong; video 2 dan 3 berakhir zoom, jadi diputar mundur.
      if (color === "blue") returnHome();
      else void smoothReturn();
    };
    const onBackEnded = () => {
      if (active === back) returnHome();
    };
    const onVideoError = () => {
      if (active === chosen || pending === chosen) {
        returnHomeWithError(
          color,
          "Animasi tidak dapat dimuat. Silakan coba lagi.",
        );
      } else if (active === back || pending === back) {
        returnHomeWithError(
          color,
          "Animasi tidak dapat dimuat. Silakan coba lagi.",
        );
      }
    };
    chosen.addEventListener("ended", onChosenEnded);
    back.addEventListener("ended", onBackEnded);
    chosen.addEventListener("error", onVideoError);
    back.addEventListener("error", onVideoError);
    cleanups.push(() => {
      chosen.removeEventListener("ended", onChosenEnded);
      back.removeEventListener("ended", onBackEnded);
      chosen.removeEventListener("error", onVideoError);
      back.removeEventListener("error", onVideoError);
    });
  }

  const onBackgroundError = () => {
    onStateChange({
      status: "error",
      color: pendingColor ?? activeColor ?? "gray",
      message: "Animasi utama tidak dapat dimuat.",
    });
  };
  background.addEventListener("error", onBackgroundError);
  cleanups.push(() => {
    background.removeEventListener("error", onBackgroundError);
  });

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") void goHome();
  };
  window.addEventListener("keydown", onKeyDown);
  cleanups.push(() => {
    window.removeEventListener("keydown", onKeyDown);
  });

  if (reducedMotion.matches) {
    background.autoplay = false;
    background.pause();
  } else {
    background.play().catch(() => {});
  }

  return {
    selectBin,
    goHome,
    dispose() {
      if (disposed) return;
      disposed = true;
      generation++; // invalidate in-flight selection callbacks
      for (const cancelWait of [...cancelWaits]) cancelWait();
      clearTimers();
      pendingTimeout = undefined;
      for (const cleanup of cleanups) cleanup();
      cleanups.length = 0;
      pending?.pause();
      active?.pause();
      background.pause();
      for (const color of COLORS) {
        forward[color].pause();
        reverse[color].pause();
      }
      setPlaying(false);
      disposeVideoSources();
    },
  };
}
