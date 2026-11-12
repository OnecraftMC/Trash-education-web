import { afterEach, describe, expect, it, vi } from "vitest";
import { positionHotspots } from "../../src/components/interactive-scene/positionHotspots";

function stageWithSize(width: number, height: number): HTMLElement {
  const stage = document.createElement("div");
  stageWith(width, height)(stage);
  return stage;
}

function stageWith(width: number, height: number) {
  return (stage: HTMLElement) => {
    Object.defineProperty(stage, "clientWidth", {
      configurable: true,
      get: () => width,
    });
    Object.defineProperty(stage, "clientHeight", {
      configurable: true,
      get: () => height,
    });
  };
}

function hotspots(): HTMLButtonElement[] {
  return (["blue", "green", "gray"] as const).map((color) => {
    const button = document.createElement("button");
    button.className = `hotspot ${color}`;
    document.body.append(button);
    return button;
  });
}

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("positionHotspots", () => {
  it("hotspot positions recalculate after stage resize", () => {
    const buttons = hotspots();
    const stage = stageWithSize(854, 480);

    positionHotspots(stage, buttons);
    // Against the 854 x 480 reference frame the scale is exactly 1.
    const at854 = buttons.map((button) => [
      parseFloat(button.style.left),
      parseFloat(button.style.width),
      parseFloat(button.style.top),
      parseFloat(button.style.height),
    ]);
    expect(at854[0][0]).toBeCloseTo(0.13 * 854, 6);
    expect(at854[1][0]).toBeCloseTo(0.39 * 854, 6);
    expect(at854[2][0]).toBeCloseTo(0.65 * 854, 6);
    expect(at854[0][1]).toBeCloseTo(0.21 * 854, 6);
    expect(at854[1][1]).toBeCloseTo(0.19 * 854, 6);
    expect(at854[2][1]).toBeCloseTo(0.21 * 854, 6);
    for (const [left, , top, height] of at854) {
      expect(top).toBeCloseTo(0.22 * 480, 6);
      expect(height).toBeCloseTo(0.6 * 480, 6);
      expect(left).toBeGreaterThanOrEqual(0);
    }

    // After the stage doubles, the fractions hold against the new frame.
    stageWith(1708, 960)(stage);
    positionHotspots(stage, buttons);
    const at1708 = buttons.map((button) => [
      parseFloat(button.style.left),
      parseFloat(button.style.width),
      parseFloat(button.style.top),
      parseFloat(button.style.height),
    ]);
    expect(at1708[0][0]).toBeCloseTo(0.13 * 1708, 6);
    expect(at1708[1][0]).toBeCloseTo(0.39 * 1708, 6);
    expect(at1708[2][0]).toBeCloseTo(0.65 * 1708, 6);
    expect(at1708[0][1]).toBeCloseTo(0.21 * 1708, 6);
    expect(at1708[1][1]).toBeCloseTo(0.19 * 1708, 6);
    expect(at1708[2][1]).toBeCloseTo(0.21 * 1708, 6);
    for (const [, , top, height] of at1708) {
      expect(top).toBeCloseTo(0.22 * 960, 6);
      expect(height).toBeCloseTo(0.6 * 960, 6);
    }
  });

  it("letterboxes wider stages around the reference frame", () => {
    const buttons = hotspots();
    const stage = stageWithSize(1280, 480); // scale = 1280/854
    positionHotspots(stage, buttons);
    const scale = 1280 / 854;
    const renderedHeight = 480 * scale;
    const offsetY = (480 - renderedHeight) / 2;
    expect(parseFloat(buttons[0].style.left)).toBeCloseTo(0.13 * 1280, 6);
    expect(parseFloat(buttons[0].style.top)).toBeCloseTo(
      offsetY + 0.22 * renderedHeight,
      6,
    );
  });
});
