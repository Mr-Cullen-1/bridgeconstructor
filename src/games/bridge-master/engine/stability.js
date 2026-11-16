import { findPath, getEdgeKey } from "./graph.js";
import { calculateEdgeLength } from "./budget.js";

const clamp = (n) => Math.max(0, Math.min(1, n));
const roadPath = (level, edges) =>
  findPath(
    edges.filter((e) => e.type === "road"),
    level.startNodeId,
    level.finishNodeId,
    level.nodes,
  );
const connected = (level, edges, id) =>
  level.nodes.some(
    (n) => n.type === "anchor" && findPath(edges, id, n.id, level.nodes),
  );
export const validateRoadContinuity = (level, edges) =>
  roadPath(level, edges)
    ? { valid: true, reasonCode: null }
    : { valid: false, reasonCode: "roadGap" };
export function validateAnchorConnectivity(level, edges) {
  const path = roadPath(level, edges);
  if (!path) return { valid: false, reasonCode: "roadGap" };
  const support =
    level.supportPolicy === "braced"
      ? edges.filter((e) => e.type === "support")
      : edges;
  return path.every((id) => connected(level, support, id))
    ? { valid: true, reasonCode: null }
    : { valid: false, reasonCode: "noSupport" };
}

export function calculateTriangulationScore(nodes, edges) {
  const keys = new Map(
    edges.map((e) => [getEdgeKey(e.fromNodeId, e.toNodeId), e]),
  );
  const triangles = [];
  const ids = nodes.map((n) => n.id).sort();
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++)
      for (let k = j + 1; k < ids.length; k++) {
        const connections = [
          [ids[i], ids[j]],
          [ids[j], ids[k]],
          [ids[k], ids[i]],
        ].map(([a, b]) => keys.get(getEdgeKey(a, b)));
        if (
          connections.every(Boolean) &&
          connections.some((e) => e.type === "support")
        ) {
          const [a, b, c] = [ids[i], ids[j], ids[k]].map((id) =>
            nodes.find((n) => n.id === id),
          );
          if (
            Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) >
            1e-6
          )
            triangles.push([ids[i], ids[j], ids[k]]);
        }
      }
  return triangles;
}
export function calculateUnsupportedSpanPenalty(
  level,
  edges,
  path = roadPath(level, edges) ?? [],
) {
  if (level.supportPolicy === "connected") return 0;
  const inner = path.filter(
    (id) => level.nodes.find((n) => n.id === id).type !== "anchor",
  );
  if (!inner.length) return 0;
  const supports = edges.filter((e) => e.type === "support");
  return (
    inner.filter(
      (id) =>
        !connected(level, supports, id) ||
        path.some((next, i) => {
          if (i === 0 || ![path[i - 1], next].includes(id)) return false;
          return (
            calculateEdgeLength(
              level.nodes.find((n) => n.id === path[i - 1]),
              level.nodes.find((n) => n.id === next),
            ) > level.stabilityConfig.maxUnbracedSpan
          );
        }),
    ).length / inner.length
  );
}
function metrics(level, edges, path = roadPath(level, edges) ?? []) {
  if (!path.length)
    return {
      score: 0,
      connectivityScore: 0,
      triangulationScore: 0,
      unsupportedSpanPenalty: 1,
      vulnerabilityPenalty: 1,
    };
  const connectivityScore =
    path.filter((id) => connected(level, edges, id)).length / path.length;
  const triangles = calculateTriangulationScore(level.nodes, edges);
  const triangulationScore =
    path
      .slice(1)
      .filter((id, i) =>
        triangles.some((t) => t.includes(id) && t.includes(path[i])),
      ).length /
    (path.length - 1);
  const unsupportedSpanPenalty = calculateUnsupportedSpanPenalty(
    level, edges, path,
  );
  const inner = path.filter(
      (id) => level.nodes.find((n) => n.id === id).type !== "anchor",
    ),
    supports = edges.filter((e) => e.type === "support");
  const vulnerabilityPenalty =
    level.supportPolicy === "connected" || !inner.length
      ? 0
      : Math.max(
          0,
          ...supports.map(
            (removed) =>
              inner.filter(
                (id) =>
                  !connected(
                    level,
                    supports.filter((e) => e.id !== removed.id),
                    id,
                  ),
              ).length / inner.length,
          ),
        );
  const { wC, wT, wU, wV } = level.stabilityConfig;
  const score =
    Math.round(
      clamp(
        wC * connectivityScore +
          wT * triangulationScore -
          wU * unsupportedSpanPenalty -
          wV * vulnerabilityPenalty,
      ) * 1e6,
    ) / 1e6;
  return {
    score,
    connectivityScore,
    triangulationScore,
    unsupportedSpanPenalty,
    vulnerabilityPenalty,
  };
}
export function calculateStability(level, edges) {
  const result = metrics(level, edges);
  const path = roadPath(level, edges) ?? [];
  // Assess the load-bearing spans in travel order. Removing any road breaks
  // continuity, so removal impact cannot distinguish a sound span from a weak one.
  const spans = path.slice(1).map((id, i) => ({
    id: getEdgeKey(path[i], id),
    ...metrics(level, edges, [path[i], id]),
  }));
  const unstable = spans.filter(
    (span) =>
      span.score < level.stabilityThreshold || span.unsupportedSpanPenalty > 0,
  );
  const weakest =
    unstable[0] ??
    spans.reduce(
      (best, span) => (!best || span.score < best.score ? span : best),
      null,
    );
  return {
    ...result,
    weakEdgeId: weakest?.id ?? null,
    unstableEdgeIds: unstable.map((span) => span.id),
  };
}
