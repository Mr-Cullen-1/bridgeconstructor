// Where the tour card sits next to the spotlight. Pure geometry: rectangles are {x, y, w, h} in the
// same coordinate space as `view` ({w, h}). The card never covers the spotlight when it can avoid it.
export function placeCard(hole, size, view, { gap = 16, margin = 12 } = {}) {
  const clampX = (x) => Math.max(margin, Math.min(x, view.w - size.w - margin));
  const clampY = (y) => Math.max(margin, Math.min(y, view.h - size.h - margin));
  if (!hole) {
    return { left: clampX((view.w - size.w) / 2), top: clampY((view.h - size.h) / 2), side: "center", arrow: 0 };
  }
  const below = view.h - (hole.y + hole.h) - margin;
  const above = hole.y - margin;
  const need = size.h + gap;
  const left = clampX(hole.x + hole.w / 2 - size.w / 2);
  const arrow = Math.max(22, Math.min(size.w - 22, hole.x + hole.w / 2 - left));
  // Prefer the roomier side; the card goes there only if it really fits.
  const sides = below >= above ? ["bottom", "top"] : ["top", "bottom"];
  for (const side of sides) {
    if ((side === "bottom" ? below : above) >= need) {
      return {
        left,
        top: side === "bottom" ? hole.y + hole.h + gap : hole.y - gap - size.h,
        side: side === "bottom" ? "below" : "above",
        arrow,
      };
    }
  }
  // Tall spotlight or short screen: try beside it.
  const right = view.w - (hole.x + hole.w) - margin;
  const leftRoom = hole.x - margin;
  if (Math.max(right, leftRoom) >= size.w + gap) {
    const toRight = right >= leftRoom;
    return {
      left: toRight ? hole.x + hole.w + gap : hole.x - gap - size.w,
      top: clampY(hole.y + hole.h / 2 - size.h / 2),
      side: "beside",
      arrow: 0,
    };
  }
  // Last resort: the larger vertical side, clamped inside the screen.
  const top = below >= above ? hole.y + hole.h + gap : hole.y - gap - size.h;
  return { left, top: clampY(top), side: "overlap", arrow: 0 };
}
