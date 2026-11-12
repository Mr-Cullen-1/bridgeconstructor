import { expect, it, vi } from "vitest";
import { createLmsAdapter } from "../adapters/lmsAdapter.js";
const result = {
  gameId: "bridge-master",
  sessionId: "session",
  levelId: "bridge-01",
  classLevel: 5,
  status: "completed",
  score: 825,
  stars: 3,
  materialUsed: 56,
  stabilityScore: 1,
  durationSeconds: 12,
  attempts: 1,
  completedAt: "2026-11-12T00:00:00.000Z",
};
it("finishes exactly once per session, allowing a new replay session", () => {
  const received = [];
  const adapter = createLmsAdapter({ onFinished: (r) => received.push(r) });
  adapter.finish(result);
  adapter.finish({ ...result });
  adapter.finish({ ...result, sessionId: "replay" });
  expect(received.map((r) => r.sessionId)).toEqual(["session", "replay"]);
});
it("rejects invalid payload and failed attempts as completions", () => {
  const fn = vi.fn(),
    adapter = createLmsAdapter({ onFinished: fn });
  adapter.finish({ ...result, score: NaN });
  adapter.finish({ ...result, status: "failed" });
  expect(fn).not.toHaveBeenCalled();
  adapter.finish(result);
  expect(fn).toHaveBeenCalledTimes(1);
});
it("works without callbacks and isolates sync and async host failures", async () => {
  const a = createLmsAdapter();
  expect(() => a.finish(result)).not.toThrow();
  const b = createLmsAdapter({
    onFinished: () => {
      throw Error("host");
    },
    onExit: () => Promise.reject(Error("host")),
    onEvent: () => {
      throw Error("event");
    },
  });
  expect(() => b.finish(result)).not.toThrow();
  expect(() => b.exit({ sessionId: "s" })).not.toThrow();
  expect(() => b.emit("game_opened", {})).not.toThrow();
  await Promise.resolve();
});
it("emits metadata and exits only once per session", () => {
  const exits = [],
    events = [];
  const a = createLmsAdapter({
    onExit: (e) => exits.push(e),
    onEvent: (e) => events.push(e),
  });
  a.emit("level_started", {
    sessionId: "s",
    levelId: "bridge-01",
    attemptNumber: 0,
  });
  a.exit({ sessionId: "s" });
  a.exit({ sessionId: "s" });
  expect(exits).toHaveLength(1);
  expect(events[0]).toMatchObject({
    name: "level_started",
    gameId: "bridge-master",
    sessionId: "s",
    levelId: "bridge-01",
    attemptNumber: 0,
  });
  expect(Number.isNaN(Date.parse(events[0].timestamp))).toBe(false);
});
