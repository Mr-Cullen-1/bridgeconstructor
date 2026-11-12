// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useSimulation } from "../hooks/useSimulation.js";
let frames, id;
beforeEach(() => {
  frames = new Map();
  id = 0;
  vi.stubGlobal("requestAnimationFrame", (fn) => {
    frames.set(++id, fn);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (n) => frames.delete(n));
});
afterEach(() => vi.unstubAllGlobals());
const frame = (time) =>
  act(() => {
    const callbacks = [...frames.values()];
    frames.clear();
    callbacks.forEach((fn) => fn(time));
  });
const run = {
  path: [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ],
  durationMs: 4000,
  failureAtMs: 2000,
  outcome: { status: "completed" },
};
it("freezes time during pause and finishes once after resuming", () => {
  const onComplete = vi.fn();
  const { result, rerender } = renderHook(
    ({ phase }) => useSimulation({ run, phase, onComplete }),
    { initialProps: { phase: "testing" } },
  );
  frame(0);
  frame(3500);
  expect(result.current.progress).toBeCloseTo(0.125);
  rerender({ phase: "paused" });
  frame(50000);
  expect(result.current.progress).toBeCloseTo(0.125);
  rerender({ phase: "testing" });
  frame(51000);
  frame(55000);
  frame(56000);
  expect(onComplete).toHaveBeenCalledTimes(1);
});
it("cancels the previous run on replacement and unmount", () => {
  const onComplete = vi.fn();
  const { rerender, unmount } = renderHook(
    ({ active }) =>
      useSimulation({ run: active, phase: "testing", onComplete }),
    { initialProps: { active: run } },
  );
  frame(0);
  frame(2000);
  rerender({ active: { ...run } });
  frame(50000);
  expect(onComplete).not.toHaveBeenCalled();
  unmount();
  frame(60000);
  expect(frames.size).toBe(0);
  expect(onComplete).not.toHaveBeenCalled();
});
it("reduced motion shortens presentation without changing outcome", () => {
  const onComplete = vi.fn();
  renderHook(() =>
    useSimulation({ run, phase: "testing", onComplete, reducedMotion: true }),
  );
  frame(0);
  frame(800);
  expect(onComplete).toHaveBeenCalledTimes(1);
  expect(run.outcome.status).toBe("completed");
});
