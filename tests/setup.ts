import "@testing-library/jest-dom/vitest";

/**
 * jsdom implements no layout and no real media playback. The scene's
 * controller and hotspot positioning rely on browser APIs that must
 * exist (and behave controllably) for the tests below.
 */

if (typeof window.matchMedia !== "function") {
  const query = (media: string): MediaQueryList =>
    ({
      matches: false,
      media,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
  window.matchMedia = query as typeof window.matchMedia;
}

if (typeof globalThis.ResizeObserver !== "function") {
  const observed = new Map<Element, Set<ResizeObserverCallback>>();
  class ResizeObserverStub implements ResizeObserver {
    constructor(private callback: ResizeObserverCallback) {}
    observe(target: Element): void {
      if (!observed.has(target)) observed.set(target, new Set());
      observed.get(target)!.add(this.callback);
    }
    unobserve(target: Element): void {
      observed.get(target)?.delete(this.callback);
    }
    disconnect(): void {
      for (const set of observed.values()) set.delete(this.callback);
    }
  }
  globalThis.ResizeObserver =
    ResizeObserverStub as unknown as typeof ResizeObserver;
  (globalThis as unknown as Record<string, unknown>).__triggerResize = (
    target: Element,
  ): void => {
    for (const callback of observed.get(target) ?? []) {
      callback([] as unknown as ResizeObserverEntry[], {
        } as unknown as ResizeObserver);
    }
  };
}

// jsdom's play() is unimplemented (returns undefined); the controller
// chains promises on it. Tests that need controlled playback override
// these per element.
HTMLMediaElement.prototype.play = function play(): Promise<void> {
  return Promise.resolve();
};
HTMLMediaElement.prototype.pause = function pause(): void {};
