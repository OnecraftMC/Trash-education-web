import { render, cleanup } from "@testing-library/react";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";

const repoRoot = path.resolve(__dirname, "..");

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/**
 * Simulates the legacy page's scroll-driven state:
 * - `scrolled` navbar background activates only after 24 pixels,
 * - the active nav link is the last section whose top is at or above
 *   45% of the viewport height,
 * - the education panel follows the clamped scroll progress over
 *   `.pin-flow` (pin-flow height minus the viewport).
 */
function mockScrollGeometry(options: {
  scrollY: number;
  innerHeight: number;
  pinFlowTop: number;
  pinFlowHeight: number;
  sectionTops: Record<string, number>;
}) {
  vi.stubGlobal("scrollY", options.scrollY);
  vi.stubGlobal("innerHeight", options.innerHeight);
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(
    function (this: HTMLElement) {
      // jsdom performs no layout; the legacy flow height is supplied here.
      return this.classList.contains("pin-flow") ? options.pinFlowHeight : 0;
    },
  );
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
    function (this: Element) {
      if (this.classList.contains("pin-flow")) {
        return {
          top: options.pinFlowTop,
          height: options.pinFlowHeight,
          bottom: options.pinFlowTop + options.pinFlowHeight,
          left: 0,
          right: 0,
          width: 0,
          x: 0,
          y: options.pinFlowTop,
          toJSON: () => ({}),
        } as DOMRect;
      }
      if (this.id && this.id in options.sectionTops) {
        const top = options.sectionTops[this.id];
        return {
          top,
          height: options.innerHeight,
          bottom: top + options.innerHeight,
          left: 0,
          right: 0,
          width: 0,
          x: 0,
          y: top,
          toJSON: () => ({}),
        } as DOMRect;
      }
      return {
        top: 0,
        height: 0,
        bottom: 0,
        left: 0,
        right: 0,
        width: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } as DOMRect;
    },
  );
}

async function fireScroll() {
  window.dispatchEvent(new Event("scroll"));
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
}

describe("App", () => {
  it("App preserves the current navigation and CTA anchors", () => {
    render(<App />);
    const nav = document.querySelector(".site-nav");
    expect(nav).not.toBeNull();
    const hrefs = [
      ...nav!.querySelectorAll("a.link[data-section]"),
    ].map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(["#mulai", "#kenali", "#pilah-scene"]);
    for (const target of ["mulai", "kenali", "pilah-scene"]) {
      expect(
        document.getElementById(target),
        `anchor target #${target} exists`,
      ).not.toBeNull();
    }
    expect(document.querySelector(".brand")!.getAttribute("href")).toBe(
      "#mulai",
    );
  });

  it("App renders the existing hero and call to action", () => {
    render(<App />);
    const heading = document.querySelector("#hero-title");
    expect(heading).not.toBeNull();
    expect(heading!.textContent).toContain("Memilah itu gampang kalau tahu");
    expect(heading!.textContent).toContain("warnanya");

    const start = document.querySelector("a.start");
    expect(start!.textContent).toBe("Coba pilah sekarang");
    expect(start!.getAttribute("href")).toBe("#pilah-scene");

    // The hero keeps the category facts from the legacy page.
    const hero = document.querySelector(".hero")!;
    expect(hero.textContent).toContain("Hijau · organik");
    expect(hero.textContent).toContain("Biru · anorganik");
    expect(hero.textContent).toContain("Abu-abu · residu");

    const peek = document.querySelector("a.peek");
    expect(peek!.textContent).toBe("Kenali tongnya dulu");
    expect(peek!.getAttribute("href")).toBe("#kenali");

    // The closing call to action above the footer keeps its copy.
    const tryTitle = document.querySelector("#try-title");
    expect(tryTitle).not.toBeNull();
    expect(tryTitle!.textContent).toBe("Sudah hafal warnanya? Coba langsung.");
  });

  it("education renders the three existing categories and examples", () => {
    render(<App />);
    const headings = [
      ...document.querySelectorAll(".pin-copy h3"),
    ].map((h) => h.textContent);
    expect(headings).toEqual([
      "Sampah organik",
      "Sampah anorganik",
      "Sampah residu",
    ]);

    const text = document.body.textContent ?? "";
    const items = [
      "Sisa makanan",
      "Kulit buah",
      "Daun & ranting",
      "Cangkang telur",
      "Kertas & kardus",
      "Botol plastik",
      "Kaleng",
      "Botol & gelas kaca",
      "Bungkus makanan berminyak",
      "Styrofoam kotor",
      "Popok bekas",
      "Pembalut",
    ];
    let at = 0;
    for (const item of items) {
      const found = text.indexOf(item, at);
      expect(found, `${item} appears after the previous item`).toBeGreaterThanOrEqual(0);
      at = found + item.length;
    }

    // Original order of the three panels: green, blue, gray.
    const steps = [
      ...document.querySelectorAll(".pin-panel"),
    ].map((p) => p.getAttribute("data-step"));
    expect(steps).toEqual(["1", "2", "3"]);
    expect(document.body.textContent).toContain("Tiriskan dulu sebelum dibuang");
    expect(document.body.textContent).toContain("Bilas dan keringkan dulu");
    expect(document.body.textContent).toContain("Ikat kantongnya rapat");
  });

  it("scroll updates the active education panel and navigation state", async () => {
    const viewport = 1000;

    // At the top of the page the flow has not started: hero is active,
    // progress clamps to 0, and the navbar background is on after 24px.
    mockScrollGeometry({
      scrollY: 100,
      innerHeight: viewport,
      pinFlowTop: viewport,
      pinFlowHeight: 4000,
      sectionTops: { mulai: 0, kenali: viewport, "pilah-scene": 2 * viewport },
    });
    render(<App />);
    await fireScroll();

    const nav = document.querySelector(".site-nav")!;
    expect(nav.classList.contains("scrolled")).toBe(true);

    const activeLinks = [
      ...nav.querySelectorAll<HTMLElement>("a.link[data-section]"),
    ].filter((a) => a.classList.contains("on"));
    expect(activeLinks.map((a) => a.dataset.section)).toEqual(["mulai"]);

    const panels = [...document.querySelectorAll(".pin-panel")];
    expect(panels.map((p) => p.classList.contains("on"))).toEqual([
      true,
      false,
      false,
    ]);
    expect(document.querySelector("#pin-now")!.textContent).toBe("1");
    expect(
      (document.querySelector(".pin-bar-fill") as HTMLElement).style.transform,
    ).toBe("scaleX(0)");

    // Exactly at 24 pixels the navbar is not yet scrolled; after it is.
    mockScrollGeometry({
      scrollY: 24,
      innerHeight: viewport,
      pinFlowTop: viewport,
      pinFlowHeight: 4000,
      sectionTops: { mulai: 0, kenali: viewport, "pilah-scene": 2 * viewport },
    });
    await fireScroll();
    expect(nav.classList.contains("scrolled")).toBe(false);

    // Halfway through the flow: the middle panel is on and `kenali`
    // (the flow itself) has risen above the 45% viewport line.
    mockScrollGeometry({
      scrollY: 5000,
      innerHeight: viewport,
      pinFlowTop: -(0.5 * 4000 - 0.5 * viewport),
      pinFlowHeight: 4000,
      sectionTops: { mulai: -3000, kenali: 0, "pilah-scene": 3000 },
    });
    await fireScroll();
    const midPanels = [...document.querySelectorAll(".pin-panel")];
    expect(midPanels.map((p) => p.classList.contains("on"))).toEqual([
      false,
      true,
      false,
    ]);
    const midDots = [...document.querySelectorAll(".pin-dot")];
    expect(midDots.map((d) => d.classList.contains("on"))).toEqual([
      true,
      true,
      false,
    ]);
    expect(
      (document.querySelector(".pin-bar-fill") as HTMLElement).style.transform,
    ).toBe("scaleX(0.5)");
    expect(document.querySelector("#pin-now")!.textContent).toBe("2");
    const midActive = [
      ...nav.querySelectorAll<HTMLElement>("a.link[data-section]"),
    ].filter((a) => a.classList.contains("on"));
    expect(midActive.map((a) => a.dataset.section)).toEqual(["kenali"]);

    // Progress clamps: scrolling past the flow keeps the last panel,
    // and the scene becomes the active navigation section.
    mockScrollGeometry({
      scrollY: 10000,
      innerHeight: viewport,
      pinFlowTop: -99999,
      pinFlowHeight: 4000,
      sectionTops: { mulai: -99999, kenali: -99999, "pilah-scene": 0 },
    });
    await fireScroll();
    const lastPanels = [...document.querySelectorAll(".pin-panel")];
    expect(lastPanels.map((p) => p.classList.contains("on"))).toEqual([
      false,
      false,
      true,
    ]);
    expect(document.querySelector("#pin-now")!.textContent).toBe("3");
    const lastActive = [
      ...nav.querySelectorAll<HTMLElement>("a.link[data-section]"),
    ].filter((a) => a.classList.contains("on"));
    expect(lastActive.map((a) => a.dataset.section)).toEqual(["pilah-scene"]);
  });
});

describe("final entry", () => {
  it("the Vite production input is root index.html", () => {
    const config = readFileSync(path.join(repoRoot, "vite.config.ts"), "utf8");
    expect(config).toMatch(/input[\s\S]{0,80}index\.html/);
    expect(config).not.toMatch(/migration\.html/);
  });

  it("migration.html is absent", () => {
    expect(existsSync(path.join(repoRoot, "migration.html"))).toBe(false);
  });

  it("the React app renders the existing navigation anchors and interactive scene at /", () => {
    // The root document is the minimal Vite shell mounting the app —
    // with no second copy of the legacy page or its payloads.
    const shell = readFileSync(path.join(repoRoot, "index.html"), "utf8");
    expect(shell).toContain('<div id="root"></div>');
    expect(shell).toContain("/src/main.tsx");
    expect(shell).not.toContain("AAAAIGZ0eXBpc29t"); // no MP4 payload copy
    expect(shell.length).toBeLessThan(2000);

    render(<App />);
    expect(document.getElementById("mulai")).not.toBeNull();
    expect(document.getElementById("kenali")).not.toBeNull();
    expect(document.getElementById("pilah-scene")).not.toBeNull();
    for (const id of [
      "background",
      "animation-1",
      "animation-2",
      "animation-3",
      "animation-1r",
      "animation-2r",
      "animation-3r",
    ]) {
      expect(document.getElementById(id), `#${id} at /`).not.toBeNull();
    }
  });
});
