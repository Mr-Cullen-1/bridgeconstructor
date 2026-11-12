import { useEffect, useMemo, useReducer } from "react";
import { gameReducer, initialState } from "../engine/gameReducer.js";
import { calculateTotalCost } from "../engine/budget.js";
export function useBridgeGame({ level, classLevel = 5 }) {
  const [state, dispatch] = useReducer(gameReducer, null, () =>
    initialState(level, crypto.randomUUID(), classLevel),
  );
  useEffect(() => {
    if (!["building", "testing"].includes(state.phase)) return;
    let previous = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      dispatch({ type: "TICK", ms: now - previous });
      previous = now;
    }, 250);
    const visibility = () => {
      if (document.hidden) dispatch({ type: "PAUSE" });
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [state.phase]);
  const edges = useMemo(
    () => [...state.level.fixedEdges, ...state.playerEdges],
    [state.level.fixedEdges, state.playerEdges],
  );
  return {
    state,
    dispatch,
    derived: {
      edges,
      budgetUsed: calculateTotalCost(state.playerEdges),
    },
  };
}
