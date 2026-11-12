import { useEffect, useReducer } from "react";
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
  return {
    state,
    dispatch,
    derived: {
      edges: [...state.level.fixedEdges, ...state.playerEdges],
      budgetUsed: calculateTotalCost(state.playerEdges),
    },
  };
}
