export const calculateEdgeLength = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const calculateEdgeCost = (level, edge) =>
  Math.ceil(edge.length * level.costPerUnit);
export const calculateTotalCost = (edges) =>
  edges.reduce((sum, e) => sum + e.cost, 0);
export const canAffordEdge = (level, edges, candidate) =>
  calculateTotalCost(edges.filter((e) => e.isPlayerBuilt)) + candidate.cost <=
  level.budget;
