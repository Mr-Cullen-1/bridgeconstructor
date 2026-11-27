import PackIcon from "./PackIcon.jsx";
import { svg } from "../assets/design/index.js";
export default function GameToolbar({ state, dispatch, t, tutorialTestReady, hintId }) {
  const locked = state.phase !== "building";
  return (
    <div className="toolbar">
      <span className="section-label tool-heading">{t.buildTools}</span>
      <div className="tool-materials" aria-label={t.material} data-tour="materials">
        {["road", "support"].map((type) => (
          <button
            key={type}
            data-tour={`tool-${type}`}
            className={`material-button ${state.activeEdgeType === type ? "active" : ""}`}
            disabled={locked}
            onClick={() => dispatch({ type: "SET_EDGE_TYPE", edgeType: type })}
            aria-pressed={state.activeEdgeType === type}
            aria-label={t[type]}
          >
            <PackIcon name={type} />
            <span>{t[type]}<small>{t.toolDescriptions[type]}</small></span>
            {state.activeEdgeType === type && <img className="material-check" src={svg("check-badge")} alt="" />}
          </button>
        ))}
      </div>
      <div className="edit-tools" data-tour="edit">
        {[
          ["undo", "UNDO", !state.history.length],
          ["remove", "REMOVE_EDGE", !state.selectedEdgeId],
          ["redo", "REDO", !state.future.length],
        ].map(([key, type, disabled]) => (
          <button
            key={key}
            className="icon-button"
            title={t[key]}
            aria-label={t[key]}
            disabled={locked || disabled}
            onClick={() => dispatch({ type })}
          >
            <PackIcon name={key === "remove" ? "trash" : key} />
            <span>{t.toolShort[key]}</span>
          </button>
        ))}
      </div>
      <button
        className={`primary test-button ${tutorialTestReady ? "tutorial-ready" : ""}`}
        data-tour="test"
        aria-describedby={tutorialTestReady ? hintId : undefined}
        disabled={locked}
        onClick={() => dispatch({ type: "START_TEST" })}
      >
        <PackIcon name="play" />
        <span>{t.test}</span>
        <span className="keycap" aria-hidden="true">
          ↵
        </span>
      </button>
    </div>
  );
}
