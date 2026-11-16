import { validateLevel } from "./levelValidation.js";
import { canConnectNodes, createEdge } from "./buildRules.js";
import { findPath, getNodeById, getEdgeKey, compare } from "./graph.js";
import {
  calculateStability,
  validateRoadContinuity,
  validateAnchorConnectivity,
} from "./stability.js";
import { calculateEdgeLength } from "./budget.js";

const invalid = (reasonCode) => ({
  valid: false,
  status: "failed",
  reasonCode,
  stabilityScore: 0,
  weakEdgeId: null,
  collapseEdgeIds: [],
});
function normalizeGraph(level, edges) {
  if (!validateLevel(level).valid) return { reasonCode: "invalidConfig" };
  if (!Array.isArray(edges)) return { reasonCode: "invalidGraph" };
  for (const edge of edges) {
    if (
      !edge ||
      typeof edge !== "object" ||
      typeof edge.isPlayerBuilt !== "boolean"
    )
      return { reasonCode: "invalidGraph" };
  }
  const normalized = [...level.fixedEdges];
  const suppliedFixed = edges.filter((e) => !e.isPlayerBuilt);
  const remainingFixed = new Map(level.fixedEdges.map((e) => [e.id, e]));
  for (const e of suppliedFixed) {
    const expected = remainingFixed.get(e.id);
    if (
      !expected ||
      e.type !== expected.type ||
      e.cost !== expected.cost ||
      e.length !== expected.length ||
      getEdgeKey(e.fromNodeId, e.toNodeId) !== expected.id
    )
      return { reasonCode: "invalidGraph" };
    remainingFixed.delete(e.id);
  }
  if (remainingFixed.size) return { reasonCode: "invalidGraph" };
  for (const e of edges.filter((e) => e.isPlayerBuilt)) {
    const valid = canConnectNodes(
      level,
      normalized,
      e.fromNodeId,
      e.toNodeId,
      e.type,
    );
    if (!valid.ok) return { reasonCode: valid.reasonCode };
    const rebuilt = createEdge(
      level,
      getNodeById(level.nodes, e.fromNodeId),
      getNodeById(level.nodes, e.toNodeId),
      e.type,
    );
    if (
      e.id !== rebuilt.id ||
      e.cost !== rebuilt.cost ||
      e.length !== rebuilt.length
    )
      return { reasonCode: "invalidGraph" };
    normalized.push(rebuilt);
  }
  return { edges: normalized };
}
function evaluateGraph(level, graph) {
  if (graph.reasonCode) return invalid(graph.reasonCode);
  const normalized = graph.edges;
  const road = validateRoadContinuity(level, normalized);
  // A bad construction is a playable failed attempt, not corrupt input.
  if (!road.valid) return { ...invalid(road.reasonCode), valid: true };
  const anchor = validateAnchorConnectivity(level, normalized);
  const stability = calculateStability(level, normalized);
  const failed = !anchor.valid || stability.score < level.stabilityThreshold;
  return {
    valid: true,
    status: failed ? "failed" : "completed",
    reasonCode: anchor.reasonCode,
    stabilityScore: stability.score,
    weakEdgeId: stability.weakEdgeId,
    collapseEdgeIds: failed
      ? stability.unstableEdgeIds.length
        ? stability.unstableEdgeIds
        : [stability.weakEdgeId].filter(Boolean)
      : [],
  };
}
export function getSimulationOutcome(level, edges) {
  return evaluateGraph(level, normalizeGraph(level, edges));
}
export const getVehiclePath = (level, edges) =>
  (
    findPath(
      edges.filter((e) => e.type === "road"),
      level.startNodeId,
      level.finishNodeId,
      level.nodes,
    ) ?? []
  ).map((id) => getNodeById(level.nodes, id));

function getPartialVehiclePath(level, edges) {
  const roads = edges.filter((e) => e.type === "road");
  const finish = getNodeById(level.nodes, level.finishNodeId);
  // Follow only reachable road segments toward the finish, never jump across a gap.
  const reachable = level.nodes
    .map((node) => ({
      node,
      path: findPath(roads, level.startNodeId, node.id, level.nodes),
    }))
    .filter((candidate) => candidate.path);
  reachable.sort(
    (a, b) =>
      calculateEdgeLength(a.node, finish) -
        calculateEdgeLength(b.node, finish) || compare(a.node.id, b.node.id),
  );
  const path = reachable[0].path.map((id) => getNodeById(level.nodes, id));
  if (path.length === 1) {
    const start = path[0];
    path.unshift({ ...start, id: `approach-${start.id}`, x: start.x - 48 });
  }
  return path;
}
export function createTestRun(level, edges) {
  const graph = normalizeGraph(level, edges);
  const outcome = evaluateGraph(level, graph);
  if (!outcome.valid)
    return { outcome, path: [], durationMs: 0, failureAtMs: 0 };
  const path =
    outcome.reasonCode === "roadGap"
      ? getPartialVehiclePath(level, graph.edges)
      : getVehiclePath(level, graph.edges);
  const distances = path.map((n, i) =>
    i === 0 ? 0 : calculateEdgeLength(path[i - 1], n),
  );
  const durationMs =
    (distances.reduce((a, b) => a + b, 0) / level.vehicle.speed) * 1000;
  let failureAtMs =
    outcome.reasonCode === "roadGap" ? durationMs : durationMs * 0.5;
  const index = path.findIndex((node, i) =>
    i > 0 && getEdgeKey(path[i - 1].id, node.id) === outcome.weakEdgeId,
  );
  if (index > 0) {
    // Trigger under the vehicle at the weak span's midpoint, even near the finish.
    const distance = distances.slice(0, index).reduce((sum, n) => sum + n, 0)
      + distances[index] / 2;
    failureAtMs = distance / level.vehicle.speed * 1000;
  }
  return { outcome, path, durationMs, failureAtMs };
}
export function getVehiclePose(run, progress) {
  if (!run?.path.length) return null;
  let remaining = (Math.max(0, Math.min(1, progress)) * run.durationMs) / 1000;
  const total = run.path
    .slice(1)
    .reduce((s, n, i) => s + calculateEdgeLength(run.path[i], n), 0);
  remaining = run.durationMs
    ? (remaining / (run.durationMs / 1000)) * total
    : 0;
  for (let i = 1; i < run.path.length; i++) {
    const a = run.path[i - 1],
      b = run.path[i],
      length = calculateEdgeLength(a, b);
    if (remaining <= length || i === run.path.length - 1) {
      const t = Math.min(1, remaining / length);
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
      };
    }
    remaining -= length;
  }
  return { ...run.path[0], angle: 0 };
}
