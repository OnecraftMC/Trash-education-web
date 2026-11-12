import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createVideoPlayerController,
  type BinColor,
  type PlaybackState,
  type VideoPlayerElements,
} from "../../src/components/interactive-scene/videoPlayer";

type ControlledVideo = HTMLVideoElement & { paused_: boolean };

/**
 * A video element whose playback is fully controllable: `play`
 * dispatches `playing` (so the legacy frame-ready path resolves), and
 * `paused`/`currentTime`/`duration` are controllable own properties.
 */
function controlledVideo(): ControlledVideo {
  const video = document.createElement("video") as ControlledVideo;
  let paused = true;
  let currentTime = 0;
  Object.defineProperty(video, "paused", {
    configurable: true,
    get: () => paused,
  });
  Object.defineProperty(video, "currentTime", {
    configurable: true,
    get: () => currentTime,
    set: (value: number) => {
      currentTime = value;
    },
  });
  Object.defineProperty(video, "duration", {
    configurable: true,
    get: () => NaN,
  });
  video.play = vi.fn(() => {
    paused = false;
    video.dispatchEvent(new Event("playing"));
    return Promise.resolve();
  }) as ControlledVideo["play"];
  video.pause = vi.fn(() => {
    paused = true;
  }) as ControlledVideo["pause"];
  video.load = vi.fn() as ControlledVideo["load"];
  return video;
}

interface Fixture {
  controller: ReturnType<typeof createVideoPlayerController>;
  elements: VideoPlayerElements;
  background: ControlledVideo;
  forward: Record<BinColor, ControlledVideo>;
  reverse: Record<BinColor, ControlledVideo>;
  triggers: HTMLButtonElement[];
  states: PlaybackState[];
  disposeVideoSources: ReturnType<typeof vi.fn>;
}

function fixture(reducedMotionMatches = false): Fixture {
  const background = controlledVideo();
  const forward = {
    blue: controlledVideo(),
    green: controlledVideo(),
    gray: controlledVideo(),
  };
  const reverse = {
    blue: controlledVideo(),
    green: controlledVideo(),
    gray: controlledVideo(),
  };
  // Legacy trigger order: the three hotspots, then the three chips.
  const triggers = (["blue", "green", "gray"] as const).flatMap((color) => [
    Object.assign(document.createElement("button"), { className: `hotspot ${color}` }),
    Object.assign(document.createElement("button"), { className: "chip" }),
  ]);
  const scene = document.createElement("div");
  scene.append(
    background,
    ...Object.values(forward),
    ...Object.values(reverse),
    ...triggers,
  );
  document.body.append(scene);

  const states: PlaybackState[] = [];
  const disposeVideoSources = vi.fn();
  const reducedMotion = {
    matches: reducedMotionMatches,
    media: "(prefers-reduced-motion: reduce)",
  } as unknown as MediaQueryList;
  const elements: VideoPlayerElements = {
    scene,
    background,
    forward,
    reverse,
    triggers,
  };
  const controller = createVideoPlayerController(
    elements,
    reducedMotion,
    disposeVideoSources,
    (state) => states.push(state),
  );
  return {
    controller,
    elements,
    background,
    forward,
    reverse,
    triggers,
    states,
    disposeVideoSources,
  };
}

/** The legacy seek listens for `seeked` before playback may continue. */
function seeked(video: HTMLVideoElement): void {
  video.dispatchEvent(new Event("seeked"));
}

/** Runs a full happy-path selection through seek, readiness, and reveal. */
async function completeSelection(f: Fixture, color: BinColor): Promise<void> {
  await vi.advanceTimersByTimeAsync(0);
  seeked(f.forward[color]);
  await vi.advanceTimersByTimeAsync(121); // frame-ready fallback after `playing`
  await vi.advanceTimersByTimeAsync(531); // background pause timer (450 + 80)
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
});

describe("video player controller", () => {
  it("each bin selects its paired forward and reverse video", async () => {
    for (const color of ["blue", "green", "gray"] as const) {
      const f = fixture();
      const selection = f.controller.selectBin(color, f.triggers[0]);
      await completeSelection(f, color);

      for (const key of ["blue", "green", "gray"] as const) {
        expect(
          f.forward[key].classList.contains("on"),
          `forward ${key} revealed state while ${color} is selected`,
        ).toBe(key === color);
        expect(
          f.forward[key].play,
          `forward ${key} play calls while ${color} is selected`,
        ).toHaveBeenCalledTimes(key === color ? 1 : 0);
      }
      expect(f.states.at(-1)).toEqual({ status: "forward", color });
      // The background pauses once the selected video fully covers it.
      expect(f.background.paused).toBe(true);
      await selection;
    }
  });

  it("forward completion and Escape preserve existing return behavior", async () => {
    // Animation 1 (blue) returns directly to the background on completion.
    const f = fixture();
    const blueSelection = f.controller.selectBin("blue", f.triggers[0]);
    await completeSelection(f, "blue");
    f.forward.blue.dispatchEvent(new Event("ended"));
    await vi.advanceTimersByTimeAsync(450);
    expect(f.background.paused).toBe(false); // background resumed
    expect(f.states.at(-1)).toEqual({ status: "idle" });
    expect(f.triggers.every((b) => !b.disabled)).toBe(true);
    await blueSelection;

    // The reveal's delayed background pause still applies when the same
    // color's reverse video has already taken over (forward ended into
    // smoothReturn before the FADE_IN + 80 timer fired).
    const fBg = fixture();
    const bgSelection = fBg.controller.selectBin("green", fBg.triggers[2]);
    await vi.advanceTimersByTimeAsync(0);
    seeked(fBg.forward.green);
    await vi.advanceTimersByTimeAsync(121); // reveal; pause timer now pending
    fBg.forward.green.dispatchEvent(new Event("ended")); // → smoothReturn
    await vi.advanceTimersByTimeAsync(0);
    seeked(fBg.reverse.green);
    await vi.advanceTimersByTimeAsync(121); // reverse becomes active
    expect(fBg.background.paused).toBe(false); // not yet: timer pending
    await vi.advanceTimersByTimeAsync(500); // the reveal pause timer fires
    expect(fBg.background.paused).toBe(true); // same-color reverse covers it
    fBg.reverse.green.dispatchEvent(new Event("ended"));
    await vi.advanceTimersByTimeAsync(450);
    await bgSelection;

    // Animations 2 and 3 return through their matching reverse videos.
    const f2 = fixture();
    const greenTrigger = f2.triggers[2];
    const greenSelection = f2.controller.selectBin("green", greenTrigger);
    await completeSelection(f2, "green");
    f2.forward.green.dispatchEvent(new Event("ended"));
    await vi.advanceTimersByTimeAsync(0);
    expect(f2.states.at(-1)).toEqual({ status: "reverse", color: "green" });
    seeked(f2.reverse.green); // smoothReturn seeks the reverse video
    await vi.advanceTimersByTimeAsync(121); // reverse video becomes active
    await vi.advanceTimersByTimeAsync(200); // forward video fades out (140 + 60)
    expect(f2.reverse.green.classList.contains("on")).toBe(true);
    expect(f2.forward.green.classList.contains("on")).toBe(false);
    f2.reverse.green.dispatchEvent(new Event("ended"));
    await vi.advanceTimersByTimeAsync(450);
    expect(f2.states.at(-1)).toEqual({ status: "idle" });
    expect(document.activeElement).toBe(greenTrigger);
    expect(f2.triggers.every((b) => !b.disabled)).toBe(true);
    await greenSelection;

    // Escape while preparing returns home immediately; focus follows.
    const f3 = fixture();
    const escapeTrigger = f3.triggers[4];
    const pending = f3.controller.selectBin("gray", escapeTrigger);
    await vi.advanceTimersByTimeAsync(0);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await vi.advanceTimersByTimeAsync(450);
    expect(f3.states.at(-1)).toEqual({ status: "idle" });
    expect(document.activeElement).toBe(escapeTrigger);
    expect(f3.triggers.every((b) => !b.disabled)).toBe(true);
    await vi.advanceTimersByTimeAsync(3000); // the aborted selection's seek fallback
    await pending;
  });

  it("play rejection and readiness timeout recover the player", async () => {
    // A rejected play() shows the actionable message and re-enables controls.
    const f = fixture();
    f.forward.blue.play = vi.fn(() =>
      Promise.reject(new Error("playback blocked")),
    ) as ControlledVideo["play"];
    const rejected = f.controller.selectBin("blue", f.triggers[0]);
    await vi.advanceTimersByTimeAsync(0);
    seeked(f.forward.blue);
    await vi.advanceTimersByTimeAsync(0);
    expect(f.states.at(-1)).toEqual({
      status: "error",
      color: "blue",
      message:
        "Animasi belum dapat diputar. Klik tong sampah untuk mencoba lagi.",
    });
    await vi.advanceTimersByTimeAsync(3000); // the aborted selection's seek fallback
    await rejected;
    await vi.advanceTimersByTimeAsync(450);
    expect(f.triggers.every((b) => !b.disabled)).toBe(true);

    // After recovery another selection can be attempted.
    const retry = f.controller.selectBin("green", f.triggers[2]);
    await completeSelection(f, "green");
    expect(f.states.at(-1)).toEqual({ status: "forward", color: "green" });
    await retry;

    // A video that never becomes ready recovers through the 10s timeout.
    const f2 = fixture();
    f2.forward.blue.play = vi.fn(
      () => new Promise<void>(() => {}),
    ) as ControlledVideo["play"];
    const hanging = f2.controller.selectBin("blue", f2.triggers[0]);
    void hanging; // the promise never settles (play() never resolves)
    await vi.advanceTimersByTimeAsync(3000); // seek fallback resolves the seek
    await vi.advanceTimersByTimeAsync(10000); // selection readiness timeout
    expect(f2.states.at(-1)).toEqual({
      status: "error",
      color: "blue",
      message: "Animasi belum siap. Silakan klik tong untuk mencoba lagi.",
    });
    await vi.advanceTimersByTimeAsync(450);
    expect(f2.triggers.every((b) => !b.disabled)).toBe(true);
    // The hung selection's promise never settles (play() never resolves).

    // ...and the recovered player accepts a working selection.
    f2.forward.blue.play = vi.fn(() => {
      f2.forward.blue.dispatchEvent(new Event("playing"));
      return Promise.resolve();
    }) as ControlledVideo["play"];
    const retry2 = f2.controller.selectBin("blue", f2.triggers[0]);
    await completeSelection(f2, "blue");
    expect(f2.states.at(-1)).toEqual({ status: "forward", color: "blue" });
    await retry2;
  });

  it("seek fallback continues playback", async () => {
    const f = fixture();
    const selection = f.controller.selectBin("blue", f.triggers[0]);
    await vi.advanceTimersByTimeAsync(0);
    expect(f.forward.blue.play).not.toHaveBeenCalled();
    // No `seeked` event arrives; the 3,000 ms fallback must resolve the seek.
    await vi.advanceTimersByTimeAsync(3000);
    expect(f.forward.blue.currentTime).toBe(0);
    expect(f.forward.blue.play).toHaveBeenCalledTimes(1);
    seeked(f.forward.blue); // seek resolves after playback began
    await completeSelection(f, "blue");
    expect(f.states.at(-1)).toEqual({ status: "forward", color: "blue" });
    await selection;
  });

  it("video error events show retry feedback", async () => {
    const f = fixture();
    const selection = f.controller.selectBin("blue", f.triggers[0]);
    await vi.advanceTimersByTimeAsync(0);
    f.forward.blue.dispatchEvent(new Event("error"));
    expect(f.states.at(-1)).toEqual({
      status: "error",
      color: "blue",
      message: "Animasi tidak dapat dimuat. Silakan coba lagi.",
    });
    await vi.advanceTimersByTimeAsync(450);
    expect(f.triggers.every((b) => !b.disabled)).toBe(true);
    await vi.advanceTimersByTimeAsync(3000); // the aborted selection's seek fallback
    await selection;

    // A background error surfaces its own message.
    const f2 = fixture();
    f2.background.dispatchEvent(new Event("error"));
    expect(f2.states.at(-1)).toEqual({
      status: "error",
      color: "gray",
      message: "Animasi utama tidak dapat dimuat.",
    });
  });

  it("reduced motion and Escape preserve a return path", async () => {
    const f = fixture(true);
    // Reduced motion pauses the background autoplay instead of playing it.
    expect(f.background.play).not.toHaveBeenCalled();
    expect(f.background.paused).toBe(true);
    expect(f.background.autoplay).toBe(false);

    const selection = f.controller.selectBin("blue", f.triggers[0]);
    await vi.advanceTimersByTimeAsync(0);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    // With reduced motion the controls re-enable immediately (no fade wait).
    await vi.advanceTimersByTimeAsync(0);
    expect(f.states.at(-1)).toEqual({ status: "idle" });
    expect(f.triggers.every((b) => !b.disabled)).toBe(true);
    expect(document.activeElement).toBe(f.triggers[0]);
    await vi.advanceTimersByTimeAsync(3000); // the aborted selection's seek fallback
    await selection;

    // An idle goHome() is a no-op that leaves nothing stuck.
    await f.controller.goHome();
    expect(f.states.at(-1)).toEqual({ status: "idle" });
    expect(f.triggers.every((b) => !b.disabled)).toBe(true);
  });

  it("dispose stops playback and releases the media URLs", async () => {
    const f = fixture();
    const pending = f.controller.selectBin("blue", f.triggers[0]);
    await vi.advanceTimersByTimeAsync(0);
    seeked(f.forward.blue);
    await vi.advanceTimersByTimeAsync(0);
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    f.disposeVideoSources.mockClear();
    f.controller.dispose();

    expect(vi.getTimerCount()).toBe(0);
    expect(f.disposeVideoSources).toHaveBeenCalledTimes(1);
    expect(f.background.pause).toHaveBeenCalled();
    expect(f.forward.blue.pause).toHaveBeenCalled();
    const statesAfter = f.states.length;
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(f.states.length).toBe(statesAfter);
    await pending;
  });
});
