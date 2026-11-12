function safelyCall(callback, value) {
  try {
    const pending = callback?.(value);
    if (pending && typeof pending.catch === "function") pending.catch(() => {});
  } catch {
    /* Host failures must not interrupt gameplay. */
  }
}
export function isValidResult(r) {
  return (
    !!r &&
    r.gameId === "bridge-master" &&
    typeof r.sessionId === "string" &&
    r.sessionId.length > 0 &&
    typeof r.levelId === "string" &&
    r.levelId.length > 0 &&
    r.status === "completed" &&
    Number.isInteger(r.classLevel) &&
    r.classLevel >= 1 &&
    r.classLevel <= 11 &&
    Number.isInteger(r.stars) &&
    r.stars >= 1 &&
    r.stars <= 3 &&
    [
      "score",
      "materialUsed",
      "durationSeconds",
      "attempts",
      "stabilityScore",
    ].every((k) => Number.isFinite(r[k]) && r[k] >= 0) &&
    r.stabilityScore <= 1 &&
    Number.isInteger(r.attempts) &&
    r.attempts >= 1 &&
    Number.isFinite(Date.parse(r.completedAt))
  );
}
export function createLmsAdapter({ onFinished, onExit, onEvent } = {}) {
  const finished = new Set(),
    exited = new Set();
  return {
    emit(name, metadata) {
      safelyCall(onEvent, {
        ...metadata,
        name,
        gameId: "bridge-master",
        timestamp: new Date().toISOString(),
      });
    },
    finish(result) {
      if (!isValidResult(result) || finished.has(result.sessionId))
        return false;
      finished.add(result.sessionId);
      safelyCall(onFinished, { ...result });
      return true;
    },
    exit(metadata) {
      if (exited.has(metadata.sessionId)) return;
      exited.add(metadata.sessionId);
      safelyCall(onExit, { ...metadata });
    },
  };
}
