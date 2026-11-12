export const getNodeById = (nodes, id) => nodes.find((n) => n.id === id);
export const getEdgeKey = (a, b) => JSON.stringify([a, b].sort());
export const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

export function findPath(edges, start, finish, nodes = []) {
  const positions = new Map(nodes.map((n) => [n.id, n]));
  const adjacency = new Map();
  for (const e of edges) {
    const a = positions.get(e.fromNodeId),
      b = positions.get(e.toNodeId);
    const length = a && b ? Math.hypot(a.x - b.x, a.y - b.y) : (e.length ?? 1);
    for (const [from, to] of [
      [e.fromNodeId, e.toNodeId],
      [e.toNodeId, e.fromNodeId],
    ]) {
      if (!adjacency.has(from)) adjacency.set(from, []);
      adjacency.get(from).push({ id: to, length });
    }
  }
  const queue = [{ id: start, path: [start], distance: 0 }],
    visited = new Set();
  while (queue.length) {
    queue.sort(
      (a, b) =>
        a.distance - b.distance ||
        compare(JSON.stringify(a.path), JSON.stringify(b.path)),
    );
    const current = queue.shift();
    if (visited.has(current.id)) continue;
    if (current.id === finish) return current.path;
    visited.add(current.id);
    for (const next of adjacency.get(current.id) ?? []) {
      if (!visited.has(next.id))
        queue.push({
          id: next.id,
          path: [...current.path, next.id],
          distance: current.distance + next.length,
        });
    }
  }
  return null;
}

export function getConnectedComponents(nodes, edges) {
  const remaining = new Set(nodes.map((n) => n.id)),
    components = [];
  while (remaining.size) {
    const start = [...remaining].sort()[0];
    const component = [...remaining].filter((id) =>
      findPath(edges, start, id, nodes),
    );
    component.forEach((id) => remaining.delete(id));
    components.push(component.sort());
  }
  return components;
}
