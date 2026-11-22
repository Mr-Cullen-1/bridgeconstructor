import { useEffect, useId, useMemo, useRef, useState } from "react";
import { getEdgeKey } from "./engine/graph.js";
import { levels as defaultLevels } from "./levels/index.js";
import { validateLevel } from "./engine/levelValidation.js";
import { useBridgeGame } from "./hooks/useBridgeGame.js";
import { useGameInput } from "./hooks/useGameInput.js";
import { useSimulation } from "./hooks/useSimulation.js";
import { usePreferences } from "./hooks/usePreferences.js";
import { useLmsEvents } from "./hooks/useLmsEvents.js";
import { useAttemptReporting, MODE_ID } from "./hooks/useAttemptReporting.js";
import { getDictionary, normalizeLang, levelText } from "./i18n/index.js";
import BridgeScene from "./components/BridgeScene.jsx";
import GameToolbar from "./components/GameToolbar.jsx";
import Modal from "./components/Modal.jsx";
import Icon from "./components/Icon.jsx";
import ResultModal from "./components/ResultModal.jsx";
import LevelSelect from "./components/LevelSelect.jsx";
import IntroModal from "./components/IntroModal.jsx";
import { robotWave } from "./assets/introAssets.js";
import { SaveChip, SaveLine, SavePanel } from "./components/SaveStatus.jsx";
import "./styles/bridge-master.css";

const defaultConfig = {};
// Server progress (GameLab contract §8) → stars per level. A completed level counts for at least one star.
export function starsFromProgress(progress, scoreVersion = 1) {
  const stars = {};
  for (const id of progress?.completedLevelIds ?? []) stars[id] = 1;
  for (const scope of progress?.scopes ?? []) {
    if (scope.modeId !== MODE_ID || scope.scoreVersion !== scoreVersion || !scope.levelId) continue;
    const best = scope.bestResult?.metrics?.stars;
    if (Number.isInteger(best) && best > 0) stars[scope.levelId] = Math.min(3, best);
  }
  return stars;
}
export default function BridgeMaster({
  classLevel = 5,
  lang = "uz",
  config = defaultConfig,
  progress,
  saveState,
  onFinished,
  onExit,
  onAttemptStart,
  onAttemptEnd,
  onRetrySave,
}) {
  const levels = config.levels ?? defaultLevels;
  if (
    !Array.isArray(levels) ||
    !levels.length ||
    levels.some((l) => !validateLevel(l).valid)
  )
    return (
      <div role="alert" className="modal">
        {getDictionary(lang, config.translations).configError}
      </div>
    );
  return (
    <Game
      classLevel={
        Number.isInteger(classLevel) && classLevel >= 1 && classLevel <= 11
          ? classLevel
          : 5
      }
      lang={normalizeLang(lang)}
      config={config}
      levels={levels}
      progress={progress}
      saveState={saveState}
      onFinished={onFinished}
      onExit={onExit}
      onAttemptStart={onAttemptStart}
      onAttemptEnd={onAttemptEnd}
      onRetrySave={onRetrySave}
    />
  );
}
function Game({
  classLevel,
  lang,
  config,
  levels,
  progress,
  saveState,
  onFinished,
  onExit,
  onAttemptStart,
  onAttemptEnd,
  onRetrySave,
}) {
  const hintId = useId();
  const t = useMemo(
    () => getDictionary(lang, config.translations),
    [lang, config.translations],
  );
  const [showLevels, setShowLevels] = useState(false),
    [showSave, setShowSave] = useState(false),
    [exited, setExited] = useState(false),
    [localScores, setScores] = useState({});
  const { sound, toggleSound, reducedMotion, play } = usePreferences();
  const {
    state,
    dispatch: rawDispatch,
    derived,
  } = useBridgeGame({ level: levels[0], classLevel });
  const dispatch = (action) => {
    play(action.type === "UNDO" || action.type === "REMOVE_EDGE" || action.type === "RESET_BRIDGE" ? "undo" : action.type === "SELECT_NODE" || action.type === "SELECT_EDGE" ? "select" : "click");
    rawDispatch(action);
  };
  const adapter = useLmsEvents(state, {
    onFinished,
    onExit,
    onEvent: config.onEvent,
    edgeEvents: config.edgeEvents,
  });
  const reporting = useAttemptReporting(state, { onAttemptStart, onAttemptEnd });
  const simulation = useSimulation({
    run: state.run,
    phase: state.phase,
    reducedMotion,
    onComplete: () =>
      rawDispatch({
        type: "FINISH_TEST",
        runId: state.runId,
        completedAt: new Date().toISOString(),
      }),
  });
  // Sound effects follow what actually happened in the game, not just which button was pressed.
  const heard = useRef({ edges: 0, message: null, phase: state.phase, countdown: 0, broken: false });
  useEffect(() => {
    const before = heard.current;
    if (state.playerEdges.length > before.edges) play("place");
    if (state.message && state.message !== before.message) play("error");
    if (state.phase === "success" && before.phase !== "success") play("success");
    if (simulation.countdown > 0 && simulation.countdown !== before.countdown) play("tick");
    if (before.countdown > 0 && simulation.countdown === 0 && state.phase === "testing") {
      play("go");
      setTimeout(() => play("honk"), 120);
    }
    if (simulation.broken && !before.broken) {
      play("crash");
      setTimeout(() => play("splash"), 700);
    }
    heard.current = {
      edges: state.playerEdges.length,
      message: state.message,
      phase: state.phase,
      countdown: simulation.countdown,
      broken: simulation.broken,
    };
  }, [state.playerEdges.length, state.message, state.phase, simulation.countdown, simulation.broken, play]);
  const levelIndex = levels.findIndex((l) => l.id === state.level.id);
  const progressStart = Math.floor(levelIndex / 5) * 5;
  useEffect(() => {
    if (state.phase === "success")
      setScores((previous) => ({
        ...previous,
        [state.level.id]: Math.max(
          previous[state.level.id] ?? 0,
          state.result.stars,
        ),
      }));
  }, [state.phase, state.level.id, state.result]);
  // Saved server progress and this mount's fresh results are merged without clearing the running game.
  const scores = useMemo(() => {
    const merged = starsFromProgress(progress);
    for (const [id, stars] of Object.entries(localScores))
      merged[id] = Math.max(merged[id] ?? 0, stars);
    return merged;
  }, [progress, localScores]);
  const loadLevel = (level) => {
    reporting.abortActive("level_change");
    rawDispatch({
      type: "LOAD_LEVEL",
      level,
      sessionId: crypto.randomUUID(),
      classLevel,
    });
    setShowLevels(false);
    setExited(false);
  };
  const selectLevels = () => {
    rawDispatch({ type: "PAUSE" });
    setShowLevels(true);
  };
  const openSave = () => {
    rawDispatch({ type: "PAUSE" });
    setShowSave(true);
  };
  const closeSave = () => {
    setShowSave(false);
    rawDispatch({ type: "RESUME" });
  };
  const exitGame = () => {
    rawDispatch({ type: "PAUSE" });
    // Contract §6: a running attempt is closed once as `aborted` before the host is asked to exit.
    reporting.abortActive("player_exit");
    const metadata = {
      levelId: state.level.id,
      sessionId: state.sessionId,
      classLevel,
      attemptNumber: state.attempts,
    };
    adapter.emit("game_exited", metadata);
    adapter.exit(metadata);
    setExited(true);
  };
  const overlayOpen =
    showLevels ||
    showSave ||
    exited ||
    ["intro", "paused", "success", "failed"].includes(state.phase);
  // `inert` is set as a DOM attribute: React 18 ignores the boolean prop and React 19 reads "" as false.
  const shell = useRef(null);
  useEffect(() => {
    shell.current?.toggleAttribute("inert", overlayOpen);
  }, [overlayOpen]);
  const input = useGameInput({ state, dispatch });
  const tutorial = state.level.difficulty === 1 && state.phase === "building";
  const missingRoadIndex = state.level.roadNodeIds.findIndex(
    (id, i, ids) =>
      i < ids.length - 1 &&
      !derived.edges.some(
        (edge) =>
          edge.type === "road" && edge.id === getEdgeKey(id, ids[i + 1]),
      ),
  );
  const tutorialTestReady = tutorial && missingRoadIndex === -1;
  const tutorialNodeId =
    tutorial && missingRoadIndex >= 0
      ? state.level.roadNodeIds[
          missingRoadIndex +
            (state.selectedNodeId === state.level.roadNodeIds[missingRoadIndex]
              ? 1
              : 0)
        ]
      : null;
  const materialLeft = state.level.budget - derived.budgetUsed;
  const levelHint = t.levelHints?.[state.level.id];
  const names = levelText(state.level, t);
  const hint = state.message
    ? [t.messages[state.message], state.message === "budget" && levelHint]
        .filter(Boolean)
        .join(" ")
    : state.phase === "testing"
      ? t.testing
      : state.selectedNodeId
        ? t.chooseNext
        : state.selectedEdgeId
          ? t.selectedEdge
          : state.level.difficulty > 1
            ? levelHint || t.hintSupport
            : state.playerEdges.length >= 4
              ? t.hintTest
              : state.playerEdges.length
                ? t.hintNext
                : t.hintFirst;
  return (
    <main
      className={`bridge-app ${reporting.enabled ? "is-gamelab" : ""}`}
      lang={lang}
      tabIndex={-1}
      {...input}
    >
      <div className="game-shell" ref={shell}>
        <BridgeScene
          state={state}
          edges={derived.edges}
          dispatch={dispatch}
          t={t}
          pose={simulation.vehiclePose}
          broken={simulation.broken}
          collapseSeconds={simulation.collapseSeconds}
          countdown={simulation.countdown}
          tutorialNodeId={tutorialNodeId}
          hintId={hintId}
          reducedMotion={reducedMotion}
          hudTop={
            <>
              <div className="hud-left">
                <button type="button" className="hud-btn hud-levels" onClick={selectLevels}>
                  <Icon name="grid" />
                  <span>{t.levels}</span>
                </button>
                <div className="level-card">
                  <span className="level-number">{String(levelIndex + 1).padStart(2, "0")}</span>
                  <div className="level-copy">
                    <span className="eyebrow">
                      {t.level} {levelIndex + 1} / {levels.length}
                    </span>
                    <h1>{names.title}</h1>
                  </div>
                  <div className="level-progress" aria-label={t.levelProgress}>
                    {levels.slice(progressStart, progressStart + 5).map((level, offset) => (
                      <span
                        key={level.id}
                        className={`${progressStart + offset === levelIndex ? "current" : ""} ${scores[level.id] ? "complete" : ""}`}
                        aria-current={progressStart + offset === levelIndex ? "step" : undefined}
                        aria-label={t.levelLabel(progressStart + offset + 1, levelText(level, t).title)}
                      >
                        {scores[level.id] ? <Icon name="star" size={13} /> : progressStart + offset + 1}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="hud-center">
                <div className={`budget ${materialLeft <= state.level.budget * 0.15 ? "is-low" : ""}`} aria-label={t.materialLabel}>
                  <div className="budget-main">
                    <span className="budget-label">
                      <Icon name="bridge" size={18} />
                      {t.material}
                    </span>
                    <strong>
                      {derived.budgetUsed} / {state.level.budget}
                    </strong>
                  </div>
                  <div className="budget-track">
                    <span style={{ width: `${(derived.budgetUsed / state.level.budget) * 100}%` }} />
                  </div>
                  <div className="budget-footnote">
                    <span>{t.remaining}</span>
                    <b>{materialLeft}</b>
                  </div>
                </div>
                <span className="goal-target">
                  <Icon name="star" size={15} />
                  {t.target}: ≤ {state.level.parBudget}
                </span>
              </div>
              <div className="hud-right">
                {reporting.enabled && (
                  <SaveChip
                    attempts={reporting.attempts}
                    saveState={saveState}
                    t={t}
                    onRetrySave={onRetrySave}
                    onOpen={openSave}
                  />
                )}
                <button
                  type="button"
                  className="hud-btn hud-round"
                  aria-label={sound ? t.soundOff : t.soundOn}
                  onClick={toggleSound}
                >
                  <Icon name={sound ? "sound" : "muted"} />
                </button>
                <button
                  type="button"
                  className="hud-btn hud-round"
                  aria-label={t.pause}
                  disabled={!["building", "testing"].includes(state.phase)}
                  onClick={() => dispatch({ type: "PAUSE" })}
                >
                  <Icon name="pause" />
                </button>
              </div>
            </>
          }
          hudBottom={
            <>
              <div className={`hint-bar ${state.message ? "warning" : ""}`} role="status" id={hintId}>
                <img className="hint-avatar" src={robotWave} alt="" width="52" height="52" />
                <span className="hint-copy">
                  <b className="hint-label">{state.message ? t.buildFeedback : t.nextStep}</b>
                  <span className="hint-text">{hint}</span>
                </span>
              </div>
              <GameToolbar
                state={state}
                dispatch={dispatch}
                t={t}
                tutorialTestReady={tutorialTestReady}
                hintId={hintId}
              />
              <p className="keyboard-note">{t.keyboardHint}</p>
            </>
          }
        />
      </div>
      {!showLevels && !showSave && !exited && state.phase === "intro" && (
        <IntroModal
          t={t}
          level={state.level}
          levelIndex={levelIndex}
          total={levels.length}
          levelHint={levelHint}
          onStart={() => dispatch({ type: "START_BUILDING" })}
        />
      )}
      {!showLevels && !showSave && !exited && state.phase === "paused" && (
        <Modal title={t.paused} eyebrow={t.pause} className="pause-modal">
          <span className="modal-symbol"><Icon name="pause" size={32} /></span>
          <p>{t.pausedBody}</p>
          <div className="modal-actions">
            <button
              className="primary"
              onClick={() => dispatch({ type: "RESUME" })}
            >
              {t.resume}
              <Icon name="play" />
            </button>
            <button className="secondary" onClick={selectLevels}>
              {t.levels}
            </button>
            <button className="secondary" onClick={exitGame}>
              {t.exit}
            </button>
          </div>
        </Modal>
      )}
      {!showLevels &&
        !showSave &&
        !exited &&
        ["success", "failed"].includes(state.phase) && (
          <ResultModal
            result={state.result}
            reasonCode={state.run?.outcome.reasonCode}
            levelHint={levelHint}
            saveLine={
              reporting.enabled && (
                <SaveLine
                  attempt={reporting.attempts.at(-1)}
                  saveState={saveState}
                  t={t}
                  onRetrySave={onRetrySave}
                />
              )
            }
            t={t}
            onRetry={() => dispatch({ type: "RETRY" })}
            onReplay={() => loadLevel(state.level)}
            onNext={() => loadLevel(levels[levelIndex + 1])}
            onSelect={selectLevels}
            isLast={levelIndex === levels.length - 1}
          />
        )}
      {showLevels && !exited && (
        <LevelSelect
          levels={levels}
          t={t}
          scores={scores}
          currentLevelId={state.level.id}
          onSelect={loadLevel}
          onClose={() => {
            setShowLevels(false);
            if (state.phase === "paused") rawDispatch({ type: "RESUME" });
          }}
        />
      )}
      {showSave && !exited && (
        <SavePanel
          attempts={reporting.attempts}
          saveState={saveState}
          levels={levels}
          t={t}
          onRetrySave={onRetrySave}
          onClose={closeSave}
        />
      )}
      {exited && (
        <Modal title={t.exited} eyebrow={t.brand}>
          <p>{t.exitBody}</p>
          <button className="primary" onClick={() => loadLevel(state.level)}>
            {t.back}
          </button>
        </Modal>
      )}
    </main>
  );
}
