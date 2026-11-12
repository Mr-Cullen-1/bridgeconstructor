import { getEdgeKey } from "./graph.js";
import { calculateEdgeLength, calculateEdgeCost } from "./budget.js";

export function validateLevel(level) {
  const errors = [];
  const check = (ok, code) => {
    if (!ok) errors.push(code);
  };
  if (
    !level ||
    !Array.isArray(level.nodes) ||
    !Array.isArray(level.fixedEdges) ||
    !level.buildRules ||
    !level.vehicle ||
    !level.stabilityConfig ||
    !level.scoreConfig
  )
    return { valid: false, errors: ["invalidConfig"] };
  check(typeof level.id === "string" && level.id.length > 0, "id");
  const positive = (n) => Number.isFinite(n) && n > 0;
  for (const key of ["budget", "parBudget", "costPerUnit"])
    check(positive(level[key]), key);
  check(level.parBudget <= level.budget, "parBudget");
  for (const key of ["stabilityThreshold", "threeStarStability"])
    check(
      Number.isFinite(level[key]) && level[key] >= 0 && level[key] <= 1,
      key,
    );
  check(positive(level.vehicle.speed), "speed");
  check(positive(level.buildRules.maxEdgeLength), "maxEdgeLength");
  check(
    Array.isArray(level.buildRules.allowedEdgeTypes) &&
      level.buildRules.allowedEdgeTypes.length > 0 &&
      level.buildRules.allowedEdgeTypes.every((t) =>
        ["road", "support"].includes(t),
      ),
    "edgeTypes",
  );
  check(["connected", "braced"].includes(level.supportPolicy), "supportPolicy");
  check(
    ["wC", "wT", "wU", "wV"].every(
      (k) =>
        Number.isFinite(level.stabilityConfig[k]) &&
        level.stabilityConfig[k] >= 0,
    ) && positive(level.stabilityConfig.maxUnbracedSpan),
    "stabilityConfig",
  );
  check(
    ["base", "savingBonus", "stabilityBonus"].every(
      (k) => Number.isFinite(level.scoreConfig[k]) && level.scoreConfig[k] >= 0,
    ),
    "scoreConfig",
  );
  const ids = new Set(),
    positions = new Set();
  for (const n of level.nodes) {
    if (!n) {
      errors.push("node");
      continue;
    }
    check(
      typeof n.id === "string" && n.id.length > 0 && !ids.has(n.id),
      "nodeId",
    );
    ids.add(n.id);
    check(Number.isFinite(n.x) && Number.isFinite(n.y), "coordinates");
    const position = JSON.stringify([n.x, n.y]);
    check(!positions.has(position), "duplicatePosition");
    positions.add(position);
    check(["anchor", "road", "joint", "optional"].includes(n.type), "nodeType");
  }
  check(
    ids.has(level.startNodeId) &&
      ids.has(level.finishNodeId) &&
      level.startNodeId !== level.finishNodeId,
    "endpoints",
  );
  check(
    level.nodes.some((n) => n?.type === "anchor"),
    "anchors",
  );
  check(
    Array.isArray(level.roadNodeIds) &&
      level.roadNodeIds.every((id) => ids.has(id)) &&
      level.roadNodeIds.includes(level.startNodeId) &&
      level.roadNodeIds.includes(level.finishNodeId),
    "roadNodes",
  );
  const keys = new Set();
  for (const e of level.fixedEdges) {
    const a = level.nodes.find((n) => n?.id === e?.fromNodeId),
      b = level.nodes.find((n) => n?.id === e?.toNodeId);
    if (!a || !b) {
      errors.push("fixedEndpoint");
      continue;
    }
    const key = getEdgeKey(a.id, b.id),
      length = calculateEdgeLength(a, b);
    check(
      a.id !== b.id &&
        !keys.has(key) &&
        length > 0 &&
        length <= level.buildRules.maxEdgeLength,
      "fixedEdge",
    );
    keys.add(key);
    check(
      ["road", "support"].includes(e.type) && e.isPlayerBuilt === false,
      "fixedType",
    );
    check(
      e.id === key &&
        e.length === length &&
        e.cost === calculateEdgeCost(level, { length }),
      "fixedCost",
    );
  }
  return { valid: errors.length === 0, errors };
}
