// Undo / redo of the player's edges. `history` holds earlier states (newest last), `future` the
// states that undo stepped back from (next redo first). Building anything new clears the future.
const copy = (edges) => edges.map((e) => ({ ...e }));
export const pushHistory = (history, edges, limit = 30) => [...history, copy(edges)].slice(-limit);
export const undo = (history, edges, future = []) =>
  history.length
    ? { history: history.slice(0, -1), playerEdges: copy(history.at(-1)), future: [copy(edges), ...future].slice(0, 30) }
    : { history, playerEdges: edges, future };
export const redo = (history, edges, future = []) =>
  future.length
    ? { history: pushHistory(history, edges), playerEdges: copy(future[0]), future: future.slice(1) }
    : { history, playerEdges: edges, future };
