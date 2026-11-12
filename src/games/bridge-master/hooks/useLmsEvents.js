import { useEffect, useRef, useState } from "react";
import { createLmsAdapter } from "../adapters/lmsAdapter.js";
export function useLmsEvents(
  state,
  { onFinished, onExit, onEvent, edgeEvents = false },
) {
  const callbacks = useRef({ onFinished, onExit, onEvent }),
    sent = useRef(new Set()),
    previous = useRef(null);
  useEffect(() => {
    callbacks.current = { onFinished, onExit, onEvent };
  }, [onFinished, onExit, onEvent]);
  const [adapter] = useState(() =>
    createLmsAdapter({
      onFinished: (r) => callbacks.current.onFinished?.(r),
      onExit: (r) => callbacks.current.onExit?.(r),
      onEvent: (r) => callbacks.current.onEvent?.(r),
    }),
  );
  useEffect(() => {
    const meta = {
      levelId: state.level.id,
      sessionId: state.sessionId,
      classLevel: state.classLevel,
      attemptNumber: state.attempts,
    };
    const once = (key, name) => {
      if (sent.current.has(key)) return;
      sent.current.add(key);
      adapter.emit(name, meta);
    };
    once("open", "game_opened");
    if (state.phase === "building") {
      once(`${state.sessionId}:start`, "level_started");
      if (state.level.difficulty === 1)
        once(`${state.sessionId}:tutorial`, "tutorial_started");
    }
    if (state.phase === "testing")
      once(`${state.sessionId}:test:${state.attempts}`, "bridge_test_started");
    if (state.phase === "failed")
      once(`${state.sessionId}:fail:${state.attempts}`, "bridge_test_failed");
    if (state.phase === "success") {
      once(
        `${state.sessionId}:success:${state.attempts}`,
        "bridge_test_succeeded",
      );
      once(`${state.sessionId}:completed`, "level_completed");
      if (state.level.difficulty === 1)
        once(`${state.sessionId}:tutorialDone`, "tutorial_completed");
      adapter.finish(state.result);
    }
    if (edgeEvents && previous.current?.sessionId === state.sessionId) {
      const before = previous.current.playerEdges,
        after = state.playerEdges;
      after
        .filter((e) => !before.some((p) => p.id === e.id))
        .forEach(() => adapter.emit("bridge_edge_added", meta));
      before
        .filter((e) => !after.some((p) => p.id === e.id))
        .forEach(() => adapter.emit("bridge_edge_removed", meta));
    }
    previous.current = state;
  }, [state, adapter, edgeEvents]);
  return adapter;
}
