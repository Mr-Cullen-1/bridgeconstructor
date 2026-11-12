export const pushHistory = (history, edges, limit = 30) =>
  [...history, edges.map((e) => ({ ...e }))].slice(-limit);
export const undo = (history, edges) =>
  history.length
    ? {
        history: history.slice(0, -1),
        playerEdges: history.at(-1).map((e) => ({ ...e })),
      }
    : { history, playerEdges: edges };
