import { getNodeById, getEdgeKey } from "./graph.js";
import {
  calculateEdgeLength,
  calculateEdgeCost,
  canAffordEdge,
} from "./budget.js";

export function createEdge(level, from, to, type) {
  const length = calculateEdgeLength(from, to);
  return {
    id: getEdgeKey(from.id, to.id),
    fromNodeId: from.id,
    toNodeId: to.id,
    type,
    length,
    cost: calculateEdgeCost(level, { length }),
    isPlayerBuilt: true,
  };
}
export function canConnectNodes(level, edges, fromId, toId, type) {
  const fail = (reasonCode) => ({ ok: false, reasonCode });
  const from = getNodeById(level.nodes, fromId),
    to = getNodeById(level.nodes, toId);
  if (!from || !to) return fail("unknownNode");
  if (fromId === toId) return fail("sameNode");
  if (!level.buildRules.allowedEdgeTypes.includes(type))
    return fail("invalidType");
  if (
    edges.some(
      (e) => getEdgeKey(e.fromNodeId, e.toNodeId) === getEdgeKey(fromId, toId),
    )
  )
    return fail("duplicate");
  if (
    type === "road" &&
    (!level.roadNodeIds.includes(fromId) || !level.roadNodeIds.includes(toId))
  )
    return fail("roadOnly");
  const edge = createEdge(level, from, to, type);
  if (!Number.isFinite(edge.length) || edge.length <= 0)
    return fail("zeroLength");
  if (edge.length > level.buildRules.maxEdgeLength) return fail("tooLong");
  if (!canAffordEdge(level, edges, edge)) return fail("budget");
  return { ok: true, reasonCode: null };
}
export const removeEdge = (edges, id) =>
  edges.filter((e) => e.id !== id || !e.isPlayerBuilt);
