import { useEffect, useId, useState } from "react";
import { getEdgeKey } from "./engine/graph.js";
import { levels as defaultLevels } from "./levels/index.js";
import { validateLevel } from "./engine/levelValidation.js";
import { useBridgeGame } from "./hooks/useBridgeGame.js";
import { useGameInput } from "./hooks/useGameInput.js";
import { useSimulation } from "./hooks/useSimulation.js";
import { usePreferences } from "./hooks/usePreferences.js";
import { useLmsEvents } from "./hooks/useLmsEvents.js";
import { uz } from "./i18n/uz.js";
import BridgeScene from "./components/BridgeScene.jsx";
import GameToolbar from "./components/GameToolbar.jsx";
import Modal from "./components/Modal.jsx";
import Icon from "./components/Icon.jsx";
import ResultModal from "./components/ResultModal.jsx";
import LevelSelect from "./components/LevelSelect.jsx";
import "./styles/bridge-master.css";

const defaultConfig = {};
export default function BridgeMaster({
  classLevel = 5,
  lang = "uz",
  config = defaultConfig,
  onFinished,
  onExit,
}) {
  const levels = config.levels ?? defaultLevels;
  if (
    !Array.isArray(levels) ||
    !levels.length ||
    levels.some((l) => !validateLevel(l).valid)
  )
    return (
      <div role="alert" className="modal">
        {uz.configError}
      </div>
    );
  return (
    <Game
      classLevel={
        Number.isInteger(classLevel) && classLevel >= 1 && classLevel <= 11
          ? classLevel
          : 5
      }
      lang={lang}
      config={config}
      levels={levels}
      onFinished={onFinished}
      onExit={onExit}
    />
  );
}
function Game({ classLevel, lang, config, levels, onFinished, onExit }) {
  const hintId = useId();
  const t = { ...uz, ...config.translations?.[lang] },
    [showLevels, setShowLevels] = useState(false),
    [exited, setExited] = useState(false),
    [scores, setScores] = useState({});
  const { sound, toggleSound, reducedMotion, beep } = usePreferences();
  const {
    state,
    dispatch: rawDispatch,
    derived,
  } = useBridgeGame({ level: levels[0], classLevel });
  const dispatch = (action) => {
    beep();
    rawDispatch(action);
  };
  const adapter = useLmsEvents(state, {
    onFinished,
    onExit,
    onEvent: config.onEvent,
    edgeEvents: config.edgeEvents,
  });
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
  const levelIndex = levels.findIndex((l) => l.id === state.level.id);
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
  const loadLevel = (level) => {
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
  const exitGame = () => {
    rawDispatch({ type: "PAUSE" });
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
    exited ||
    ["intro", "paused", "success", "failed"].includes(state.phase);
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
  const hint = state.message
    ? t.messages[state.message]
    : state.phase === "testing"
      ? t.testing
      : state.selectedNodeId
        ? t.chooseNext
        : state.selectedEdgeId
          ? t.selectedEdge
          : state.level.difficulty > 1
            ? t.hintSupport
            : state.playerEdges.length >= 4
              ? t.hintTest
              : state.playerEdges.length
                ? t.hintNext
                : t.hintFirst;
  return (
    <main className="bridge-app" lang={lang} tabIndex={-1} {...input}>
      <div className="game-shell" inert={overlayOpen}>
        <header className="site-header">
          <a className="brand" href="./">
            <span className="brand-icon">
              <Icon name="bridge" size={29} />
            </span>
            <span>
              {t.brand}
              <small>{t.academy}</small>
            </span>
          </a>
          <div className="edition">{t.edition}</div>
          <button className="header-levels" onClick={selectLevels}>
            <Icon name="grid" />
            {t.levels}
          </button>
        </header>
        <div className="game-content">
          <section className="game-card" aria-label={t.brand}>
            <div className="game-header">
              <div className="level-title">
                <span className="level-number">
                  {String(levelIndex + 1).padStart(2, "0")}
                </span>
                <div>
                  <span className="eyebrow">
                    {t.level} {levelIndex + 1} / {levels.length}
                  </span>
                  <h2>{state.level.title}</h2>
                </div>
              </div>
              <div className="budget" aria-label={t.materialLabel}>
                <div>
                  <span>{t.material}</span>
                  <strong>
                    {derived.budgetUsed} / {state.level.budget}
                  </strong>
                </div>
                <div className="budget-track">
                  <span
                    style={{
                      width: `${(derived.budgetUsed / state.level.budget) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div className="header-tools">
                <button
                  className="icon-button"
                  aria-label={sound ? t.soundOff : t.soundOn}
                  onClick={toggleSound}
                >
                  <Icon name={sound ? "sound" : "muted"} />
                </button>
                <button
                  className="icon-button"
                  aria-label={t.pause}
                  disabled={!["building", "testing"].includes(state.phase)}
                  onClick={() => dispatch({ type: "PAUSE" })}
                >
                  <Icon name="pause" />
                </button>
              </div>
            </div>
            <BridgeScene
              state={state}
              edges={derived.edges}
              dispatch={dispatch}
              t={t}
              pose={simulation.vehiclePose}
              broken={simulation.broken}
              countdown={simulation.countdown}
              tutorialNodeId={tutorialNodeId}
              hintId={hintId}
              reducedMotion={reducedMotion}
            />
            <div
              className={`hint-bar ${state.message ? "warning" : ""}`}
              role="status"
              id={hintId}
            >
              <span className="hint-icon">
                <Icon name="bulb" size={18} />
              </span>
              <span>{hint}</span>
              <span className="hint-counter">
                {t.target}: ≤ {state.level.parBudget}
              </span>
            </div>
            <GameToolbar
              state={state}
              dispatch={dispatch}
              t={t}
              tutorialTestReady={tutorialTestReady}
              hintId={hintId}
            />
          </section>
        </div>
      </div>
      {!showLevels && !exited && state.phase === "intro" && (
        <Modal
          title={
            state.level.difficulty === 1 ? t.introTitle : state.level.title
          }
          className="intro-modal"
        >
          <span className="modal-symbol">
            <Icon name="bridge" size={42} />
          </span>
          <p>
            {state.level.difficulty === 1 ? t.introBody : state.level.subtitle}
          </p>
          <ol className="intro-steps">
            {t.introSteps.map((step, i) => (
              <li key={step}>
                <b>{i + 1}</b>
                {step}
              </li>
            ))}
          </ol>
          <button
            className="primary"
            onClick={() => dispatch({ type: "START_BUILDING" })}
          >
            {t.start}
            <Icon name="arrow" />
          </button>
        </Modal>
      )}
      {!showLevels && !exited && state.phase === "paused" && (
        <Modal title={t.paused}>
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
        !exited &&
        ["success", "failed"].includes(state.phase) && (
          <ResultModal
            result={state.result}
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
          onSelect={loadLevel}
          onClose={() => {
            setShowLevels(false);
            if (state.phase === "paused") rawDispatch({ type: "RESUME" });
          }}
        />
      )}
      {exited && (
        <Modal title={t.exited}>
          <p>{t.exitBody}</p>
          <button className="primary" onClick={() => loadLevel(state.level)}>
            {t.back}
          </button>
        </Modal>
      )}
    </main>
  );
}
