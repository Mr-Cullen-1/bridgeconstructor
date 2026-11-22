// Mock GameLab host for local QA (contract §13). It simulates callbacks and saveState only:
// it never talks to a backend and must not be mistaken for a production integration.
import React from "react";
import { createRoot } from "react-dom/client";
import { createManifest } from "../../src/gamelab/manifest.js";
import { levels } from "../../src/games/bridge-master/levels/index.js";

const params = new URLSearchParams(location.search);
const mod = params.has("artifact")
  ? await import("/delivery/gamelab/Game.jsx")
  : await import("../../src/gamelab/Game.jsx");
const Game = mod.default;
const manifest = mod.gameCenterManifest ?? createManifest(levels.map((l) => l.id));

const store = {
  lang: params.get("lang") ?? "uz",
  mode: params.get("save") ?? "normal", // normal | offline | error
  mountKey: 0,
  progress: { completedLevelIds: [], scopes: [] },
  saveState: { attempts: {} },
  attempts: new Map(),
  calls: [],
  exited: false,
  listeners: new Set(),
};
const emit = () => store.listeners.forEach((listener) => listener());
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const statusOf = (id, op) => store.saveState.attempts[id]?.[op]?.status ?? "idle";
function setOp(id, op, status, errorCode = null) {
  const current = store.saveState.attempts[id] ?? {};
  store.saveState = {
    attempts: { ...store.saveState.attempts, [id]: { ...current, [op]: { status, errorCode } } },
  };
  emit();
}
async function sendOp(id, op) {
  if (store.mode === "offline") {
    setOp(id, op, "queued", "OFFLINE");
    return "queued";
  }
  setOp(id, op, "saving");
  await wait(30);
  if (store.mode === "error") {
    setOp(id, op, "error", "SERVER");
    return "error";
  }
  setOp(id, op, "saved");
  return "saved";
}
function keepProgress(attempt) {
  const { start, end } = attempt;
  if (end.outcome !== "success") return;
  const stored = {
    attemptId: end.attemptId, gameId: manifest.gameId, revisionId: "mock-revision", sessionId: "mock-session",
    modeId: start.modeId, levelId: start.levelId, scoreVersion: manifest.scoreVersion,
    startedAt: start.startedAt, endedAt: end.endedAt, receivedAt: new Date().toISOString(),
    outcome: end.outcome, reason: end.reason ?? null, durationSeconds: end.durationSeconds,
    metrics: end.metrics, data: end.data ?? null,
  };
  const scopes = store.progress.scopes.filter((s) => s.levelId !== start.levelId);
  const previous = store.progress.scopes.find((s) => s.levelId === start.levelId);
  const better = !previous?.bestResult ||
    stored.metrics.stars > previous.bestResult.metrics.stars ||
    (stored.metrics.stars === previous.bestResult.metrics.stars && stored.metrics.score > previous.bestResult.metrics.score);
  scopes.push({
    modeId: start.modeId, levelId: start.levelId, scoreVersion: manifest.scoreVersion,
    attemptsCount: (previous?.attemptsCount ?? 0) + 1, lastResult: stored,
    bestResult: better ? stored : previous.bestResult,
  });
  store.progress = {
    completedLevelIds: [...new Set([...store.progress.completedLevelIds, start.levelId])],
    scopes,
  };
}
// Start is always delivered before end; a start that did not save blocks the end (contract §7).
async function deliver(id) {
  const attempt = store.attempts.get(id);
  if (statusOf(id, "start") !== "saved") {
    const started = await sendOp(id, "start");
    if (started !== "saved") {
      if (attempt.end)
        started === "error" ? setOp(id, "end", "error", "START_NOT_SAVED") : setOp(id, "end", "queued", "OFFLINE");
      return;
    }
  }
  if (attempt.end && statusOf(id, "end") !== "saved") {
    if ((await sendOp(id, "end")) === "saved") {
      keepProgress(attempt);
      emit();
    }
  }
}
const enqueue = (id) => {
  const attempt = store.attempts.get(id);
  attempt.chain = attempt.chain.then(() => deliver(id));
};
const host = {
  store,
  manifest,
  get calls() { return store.calls; },
  setMode(mode) {
    store.mode = mode;
    if (mode === "normal")
      for (const [id] of store.attempts)
        if (["start", "end"].some((op) => statusOf(id, op) === "queued")) enqueue(id);
  },
  setLang(lang) { store.lang = lang; emit(); },
  setProgress(progress) { store.progress = progress; emit(); },
  remount() { store.mountKey += 1; emit(); },
};
window.__host = host;

function Host() {
  const [, force] = React.useReducer((n) => n + 1, 0);
  React.useEffect(() => {
    store.listeners.add(force);
    return () => store.listeners.delete(force);
  }, []);
  return (
    <Game
      key={store.mountKey}
      context={{
        gameId: manifest.gameId, revisionId: "mock-revision", sessionId: "mock-session",
        studentId: null, ageGroup: null, classLevel: 5, environment: "preview",
      }}
      lang={store.lang}
      content={null}
      progress={store.progress}
      saveState={store.saveState}
      onAttemptStart={(payload) => {
        store.calls.push({ type: "start", payload });
        store.attempts.set(payload.attemptId, { start: payload, end: null, chain: Promise.resolve() });
        enqueue(payload.attemptId);
      }}
      onAttemptEnd={(result) => {
        store.calls.push({ type: "end", result });
        const attempt = store.attempts.get(result.attemptId);
        if (!attempt) return;
        attempt.end = result;
        enqueue(result.attemptId);
      }}
      onRetrySave={(attemptId) => {
        store.calls.push({ type: "retry", attemptId });
        if (store.attempts.has(attemptId)) enqueue(attemptId);
      }}
      onExit={() => {
        store.calls.push({ type: "exit" });
        store.exited = true;
      }}
      onEvent={(event) => store.calls.push({ type: "event", event })}
    />
  );
}
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Host />
  </React.StrictMode>,
);
