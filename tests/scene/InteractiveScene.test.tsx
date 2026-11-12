import { afterEach, describe, expect, it, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import InteractiveScene from "../../src/components/InteractiveScene";

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("InteractiveScene", () => {
  it("InteractiveScene renders all seven videos and both hotspot control sets", () => {
    render(<InteractiveScene />);

    const ids = [
      "background",
      "animation-1",
      "animation-2",
      "animation-3",
      "animation-1r",
      "animation-2r",
      "animation-3r",
    ];
    for (const id of ids) {
      const video = document.getElementById(id);
      expect(video, `video element #${id} exists`).not.toBeNull();
      expect(video!.tagName).toBe("VIDEO");
      // Each video receives its embedded payload as a blob: URL.
      expect(
        (video as HTMLVideoElement).src.startsWith("blob:"),
        `#${id} uses a blob: URL`,
      ).toBe(true);
    }

    const hotspots = [
      ...document.querySelectorAll<HTMLButtonElement>(".hotspot"),
    ];
    expect(hotspots).toHaveLength(3);
    expect(hotspots.map((b) => b.getAttribute("data-video"))).toEqual([
      "1",
      "2",
      "3",
    ]);
    expect(hotspots.map((b) => b.getAttribute("aria-label"))).toEqual([
      "Tong sampah biru: mulai animasi",
      "Tong sampah hijau: mulai animasi",
      "Tong sampah abu-abu: mulai animasi",
    ]);

    const chips = [...document.querySelectorAll<HTMLButtonElement>(".chip")];
    expect(chips).toHaveLength(3);
    expect(chips.map((b) => b.getAttribute("data-video"))).toEqual([
      "1",
      "2",
      "3",
    ]);
    expect(chips.map((b) => b.getAttribute("aria-label"))).toEqual([
      "Putar animasi tong biru",
      "Putar animasi tong hijau",
      "Putar animasi tong abu-abu",
    ]);

    const status = document.querySelector("#status");
    expect(status).not.toBeNull();
    expect(status!.hasAttribute("hidden")).toBe(true);
    expect(sceneElement()).not.toBeNull();
  });
});

function sceneElement(): HTMLElement | null {
  return document.querySelector("#pilah-scene");
}
