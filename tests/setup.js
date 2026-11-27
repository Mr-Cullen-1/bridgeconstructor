if (typeof document !== "undefined") {
  await import("@testing-library/jest-dom/vitest");
  const { cleanup } = await import("@testing-library/react");
  const { afterEach } = await import("vitest");
  afterEach(cleanup);
  // jsdom has no canvas: the scene draws its particles on one, so say plainly that there is none.
  HTMLCanvasElement.prototype.getContext = () => null;
}
