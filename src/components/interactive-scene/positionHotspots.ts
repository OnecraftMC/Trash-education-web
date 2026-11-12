/**
 * Positions the desktop hotspots over the bin scene using the legacy
 * 854 x 480 reference frame, keeping them aligned when the stage is
 * resized. Unchanged from the legacy page's formula.
 */
export function positionHotspots(
  stage: HTMLElement,
  hotspots: readonly HTMLButtonElement[],
): void {
  const width = stage.clientWidth;
  const height = stage.clientHeight;
  const scale = Math.max(width / 854, height / 480);
  const renderedWidth = 854 * scale;
  const renderedHeight = 480 * scale;
  const offsetX = (width - renderedWidth) / 2;
  const offsetY = (height - renderedHeight) / 2;
  const bounds: Array<[left: number, widthFraction: number]> = [
    [0.13, 0.21],
    [0.39, 0.19],
    [0.65, 0.21],
  ];
  hotspots.forEach((button, index) => {
    button.style.left = `${offsetX + bounds[index][0] * renderedWidth}px`;
    button.style.top = `${offsetY + 0.22 * renderedHeight}px`;
    button.style.width = `${bounds[index][1] * renderedWidth}px`;
    button.style.height = `${0.6 * renderedHeight}px`;
  });
}
