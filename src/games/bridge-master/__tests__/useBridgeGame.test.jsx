// @vitest-environment jsdom
import { expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useBridgeGame } from "../hooks/useBridgeGame.js";
import level from "../levels/bridge-01.json";

it("preserves the render graph during clock ticks and rebuilds it after construction", () => {
  const { result, rerender } = renderHook(() => useBridgeGame({ level }));
  act(() => result.current.dispatch({ type: "START_BUILDING" }));
  const graph = result.current.derived.edges;
  act(() => result.current.dispatch({ type: "TICK", ms: 250 }));
  rerender();
  expect(result.current.derived.edges).toBe(graph);
  act(() => result.current.dispatch({ type: "SELECT_NODE", nodeId: "a" }));
  act(() => result.current.dispatch({ type: "SELECT_NODE", nodeId: "b" }));
  expect(result.current.derived.edges).not.toBe(graph);
  expect(result.current.derived.edges).toHaveLength(1);
});
