import { canConnectNodes, createEdge, removeEdge } from "./buildRules.js";
import { getNodeById } from "./graph.js";
import { calculateTotalCost } from "./budget.js";
import { pushHistory, undo } from "./history.js";
import { createTestRun } from "./simulation.js";
import { calculateScore, calculateStars } from "./scoring.js";

export const initialState = (level, sessionId, classLevel = 5) => ({
  level,
  sessionId,
  classLevel,
  phase: "intro",
  previousPhase: null,
  playerEdges: [],
  history: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  activeEdgeType: "road",
  message: null,
  attempts: 0,
  activeMs: 0,
  run: null,
  runId: 0,
  result: null,
});
const buildingActions = new Set([
  "SELECT_NODE",
  "SELECT_EDGE",
  "SET_EDGE_TYPE",
  "ADD_EDGE",
  "REMOVE_EDGE",
  "UNDO",
  "RESET_BRIDGE",
  "START_TEST",
  "CANCEL_SELECTION",
]);
export function gameReducer(state, action) {
  if (buildingActions.has(action.type) && state.phase !== "building")
    return state;
  switch (action.type) {
    case "START_BUILDING":
      return state.phase === "intro" ? { ...state, phase: "building" } : state;
    case "SELECT_NODE": {
      if (!getNodeById(state.level.nodes, action.nodeId))
        return { ...state, message: "unknownNode" };
      if (state.selectedNodeId === action.nodeId)
        return { ...state, selectedNodeId: null, message: null };
      if (!state.selectedNodeId)
        return {
          ...state,
          selectedNodeId: action.nodeId,
          selectedEdgeId: null,
          message: null,
        };
      return gameReducer(state, {
        type: "ADD_EDGE",
        from: state.selectedNodeId,
        to: action.nodeId,
      });
    }
    case "ADD_EDGE": {
      const { level } = state,
        edges = [...level.fixedEdges, ...state.playerEdges];
      const check = canConnectNodes(
        level,
        edges,
        action.from,
        action.to,
        state.activeEdgeType,
      );
      if (!check.ok)
        return { ...state, message: check.reasonCode, selectedNodeId: null };
      const edge = createEdge(
        level,
        getNodeById(level.nodes, action.from),
        getNodeById(level.nodes, action.to),
        state.activeEdgeType,
      );
      return {
        ...state,
        playerEdges: [...state.playerEdges, edge],
        history: pushHistory(state.history, state.playerEdges),
        selectedNodeId: null,
        selectedEdgeId: null,
        message: null,
      };
    }
    case "SELECT_EDGE":
      return {
        ...state,
        selectedEdgeId: action.edgeId,
        selectedNodeId: null,
        message: null,
      };
    case "SET_EDGE_TYPE":
      return ["road", "support"].includes(action.edgeType)
        ? {
            ...state,
            activeEdgeType: action.edgeType,
            selectedNodeId: null,
            selectedEdgeId: null,
            message: null,
          }
        : state;
    case "CANCEL_SELECTION":
      return {
        ...state,
        selectedNodeId: null,
        selectedEdgeId: null,
        message: null,
      };
    case "REMOVE_EDGE": {
      if (!state.playerEdges.some((e) => e.id === state.selectedEdgeId))
        return state;
      return {
        ...state,
        playerEdges: removeEdge(state.playerEdges, state.selectedEdgeId),
        history: pushHistory(state.history, state.playerEdges),
        selectedEdgeId: null,
        message: null,
      };
    }
    case "UNDO":
      return {
        ...state,
        ...undo(state.history, state.playerEdges),
        selectedNodeId: null,
        selectedEdgeId: null,
        message: null,
      };
    case "RESET_BRIDGE":
      return {
        ...state,
        playerEdges: [],
        history: [],
        selectedNodeId: null,
        selectedEdgeId: null,
        message: null,
      };
    case "START_TEST": {
      const run = createTestRun(state.level, [
        ...state.level.fixedEdges,
        ...state.playerEdges,
      ]);
      if (!run.outcome.valid)
        return { ...state, message: run.outcome.reasonCode };
      return {
        ...state,
        phase: "testing",
        attempts: state.attempts + 1,
        run,
        runId: state.runId + 1,
        selectedNodeId: null,
        selectedEdgeId: null,
        message: null,
      };
    }
    case "FINISH_TEST": {
      if (state.phase !== "testing" || action.runId !== state.runId)
        return state;
      const outcome = state.run.outcome;
      const result = {
        gameId: "bridge-master",
        sessionId: state.sessionId,
        levelId: state.level.id,
        classLevel: state.classLevel,
        status: outcome.status,
        materialUsed: calculateTotalCost(state.playerEdges),
        stabilityScore: outcome.stabilityScore,
        durationSeconds: Math.round(state.activeMs / 1000),
        attempts: state.attempts,
        completedAt: action.completedAt,
      };
      result.score = calculateScore(state.level, result);
      result.stars = calculateStars(state.level, result);
      return {
        ...state,
        phase: outcome.status === "completed" ? "success" : "failed",
        result,
      };
    }
    case "RETRY":
      return state.phase === "failed"
        ? {
            ...state,
            phase: "building",
            run: null,
            result: null,
            message: null,
          }
        : state;
    case "PAUSE":
      return ["building", "testing"].includes(state.phase)
        ? { ...state, previousPhase: state.phase, phase: "paused" }
        : state;
    case "RESUME":
      return state.phase === "paused"
        ? { ...state, phase: state.previousPhase, previousPhase: null }
        : state;
    case "TICK":
      return ["building", "testing"].includes(state.phase) &&
        Number.isFinite(action.ms) &&
        action.ms >= 0
        ? { ...state, activeMs: state.activeMs + action.ms }
        : state;
    case "LOAD_LEVEL":
      return initialState(
        action.level,
        action.sessionId,
        action.classLevel ?? state.classLevel,
      );
    default:
      return state;
  }
}
