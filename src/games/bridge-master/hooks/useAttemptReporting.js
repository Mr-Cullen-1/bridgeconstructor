import { useCallback, useEffect, useRef, useState } from "react";
import { calculateTotalCost } from "../engine/budget.js";

// GameLab contract v1: one bridge test = one attempt. Retry inside a session gets a new attemptId.
export const MODE_ID = "default";
const reasons = { roadGap: "road_gap", noSupport: "no_support" };
const seconds = (ms) => Number((Math.max(0, ms) / 1000).toFixed(3));

export function useAttemptReporting(state, { onAttemptStart, onAttemptEnd }) {
  const enabled = typeof onAttemptStart === "function";
  const callbacks = useRef({ onAttemptStart, onAttemptEnd }),
    latest = useRef(state),
    registry = useRef(new Map());
  const [attempts, setAttempts] = useState([]);
  useEffect(() => {
    callbacks.current = { onAttemptStart, onAttemptEnd };
    latest.current = state;
  });

  const finish = useCallback((entry, snapshot) => {
    entry.ended = true;
    setAttempts((previous) =>
      previous.map((attempt) =>
        attempt.attemptId === entry.attemptId
          ? { ...attempt, outcome: snapshot.outcome }
          : attempt,
      ),
    );
    callbacks.current.onAttemptEnd?.(snapshot);
  }, []);

  useEffect(() => {
    if (!enabled || state.phase !== "testing" || !state.runId) return;
    const key = `${state.sessionId}:${state.runId}`;
    if (registry.current.has(key)) return;
    const entry = {
      attemptId: crypto.randomUUID(),
      levelId: state.level.id,
      startActiveMs: latest.current.activeMs,
      ended: false,
    };
    registry.current.set(key, entry);
    setAttempts((previous) => [
      ...previous,
      {
        attemptId: entry.attemptId,
        levelId: entry.levelId,
        number: previous.length + 1,
        outcome: null,
      },
    ]);
    callbacks.current.onAttemptStart({
      attemptId: entry.attemptId,
      modeId: MODE_ID,
      levelId: entry.levelId,
      startedAt: new Date().toISOString(),
    });
  }, [enabled, state.phase, state.runId, state.sessionId, state.level.id]);

  useEffect(() => {
    if (!enabled || !state.result) return;
    if (state.phase !== "success" && state.phase !== "failed") return;
    const entry = registry.current.get(`${state.sessionId}:${state.runId}`);
    if (!entry || entry.ended) return;
    const { result } = state;
    const success = result.status === "completed";
    finish(entry, {
      attemptId: entry.attemptId,
      outcome: success ? "success" : "failure",
      ...(success
        ? {}
        : { reason: reasons[state.run?.outcome.reasonCode] ?? "unstable" }),
      endedAt: result.completedAt,
      durationSeconds: seconds(state.activeMs - entry.startActiveMs),
      metrics: {
        stars: result.stars,
        score: result.score,
        materialUsed: result.materialUsed,
        stabilityScore: result.stabilityScore,
      },
      data: {
        attemptNumber: result.attempts,
        edgesBuilt: state.playerEdges.length,
      },
    });
  }, [enabled, state, finish]);

  // The player leaves (exit or another level) while a test is still running: only known metrics.
  const abortActive = useCallback(
    (reason = "player_exit") => {
      const entry = [...registry.current.values()].find((e) => !e.ended);
      if (!entry) return;
      const current = latest.current;
      finish(entry, {
        attemptId: entry.attemptId,
        outcome: "aborted",
        reason,
        endedAt: new Date().toISOString(),
        durationSeconds: seconds(current.activeMs - entry.startActiveMs),
        metrics: { materialUsed: calculateTotalCost(current.playerEdges) },
        data: { attemptNumber: current.attempts },
      });
    },
    [finish],
  );
  return { attempts, abortActive, enabled };
}
