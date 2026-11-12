import Icon from "./Icon.jsx";
export default function GameToolbar({ state, dispatch, t, tutorialTestReady, hintId }) {
  const locked = state.phase !== "building";
  return (
    <div className="toolbar">
      <div className="tool-materials" aria-label={t.material}>
        {["road", "support"].map((type) => (
          <button
            key={type}
            className={`material-button ${state.activeEdgeType === type ? "active" : ""}`}
            disabled={locked}
            onClick={() => dispatch({ type: "SET_EDGE_TYPE", edgeType: type })}
            aria-pressed={state.activeEdgeType === type}
          >
            <Icon name={type} />
            <span>{t[type]}</span>
          </button>
        ))}
      </div>
      <div className="edit-tools">
        {[
          ["undo", "UNDO", !state.history.length],
          ["remove", "REMOVE_EDGE", !state.selectedEdgeId],
          ["reset", "RESET_BRIDGE", !state.playerEdges.length],
        ].map(([key, type, disabled]) => (
          <button
            key={key}
            className="icon-button"
            title={t[key]}
            aria-label={t[key]}
            disabled={locked || disabled}
            onClick={() => dispatch({ type })}
          >
            <Icon name={key === "remove" ? "trash" : key} />
          </button>
        ))}
      </div>
      <button
        className={`primary test-button ${tutorialTestReady ? "tutorial-ready" : ""}`}
        aria-describedby={tutorialTestReady ? hintId : undefined}
        disabled={locked}
        onClick={() => dispatch({ type: "START_TEST" })}
      >
        <Icon name="play" />
        <span>{t.test}</span>
        <span className="keycap" aria-hidden="true">
          ↵
        </span>
      </button>
    </div>
  );
}
