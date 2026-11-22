import Modal from "./Modal.jsx";
import Icon from "./Icon.jsx";
import { levelText } from "../i18n/index.js";

// Worst state wins: a queued result is never reported as saved (GameLab contract §7).
const rank = { saved: 0, idle: 1, saving: 2, queued: 3, error: 4 };
const icons = { saved: "check", idle: "bulb", saving: "reset", queued: "pause", error: "close" };

export function operations(attempt, saveState) {
  const ops = saveState?.attempts?.[attempt.attemptId];
  const start = ops?.start?.status ?? "idle";
  if (attempt.outcome === null) return { start, end: null };
  // A start that never saved blocks the end as well.
  return { start, end: start === "error" ? "error" : (ops?.end?.status ?? "idle") };
}

export function summarize(attempts, saveState) {
  let worst = null;
  const failed = [],
    unsaved = [];
  for (const attempt of attempts) {
    const { start, end } = operations(attempt, saveState);
    for (const [op, status] of [["start", start], ["result", end]]) {
      if (!status) continue;
      // Equal severity: a newer attempt wins, but within one attempt the start (the root cause) wins.
      if (
        !worst ||
        rank[status] > rank[worst.status] ||
        (rank[status] === rank[worst.status] && worst.attempt !== attempt)
      )
        worst = { op, status, attempt };
    }
    if (start === "error" || end === "error") failed.push(attempt.attemptId);
    if (start !== "saved" || (end && end !== "saved")) unsaved.push(attempt);
  }
  return { worst, failed, unsaved };
}

function RetryButton({ t, ids, onRetrySave, className = "" }) {
  return (
    <button
      type="button"
      className={`save-retry ${className}`}
      onClick={() => ids.forEach((id) => onRetrySave?.(id))}
    >
      <Icon name="reset" size={14} />
      {t.save.retry}
    </button>
  );
}

export function SaveChip({ attempts, saveState, t, onRetrySave, onOpen }) {
  const { worst, failed } = summarize(attempts, saveState);
  if (!worst) return null;
  const latest = attempts.at(-1);
  if (worst.status === "saved" && latest?.outcome === null) return null;
  const text = `${worst.op === "start" ? t.save.start : t.save.result}: ${t.save[worst.status]}`;
  return (
    <div className="save-chip-group" role="status" aria-label={t.save.label}>
      <button
        type="button"
        className={`save-chip is-${worst.status}`}
        onClick={onOpen}
        title={text}
      >
        <Icon name={icons[worst.status]} size={15} className={`save-icon is-${worst.status}`} />
        <span>{text}</span>
      </button>
      {failed.length > 0 && (
        <RetryButton t={t} ids={failed} onRetrySave={onRetrySave} />
      )}
    </div>
  );
}

export function SaveLine({ attempt, saveState, t, onRetrySave }) {
  if (!attempt) return null;
  const { start, end } = operations(attempt, saveState);
  const status = end ?? start;
  const failed = start === "error" || end === "error";
  return (
    <div className={`save-line is-${status}`} role="status">
      <Icon name={icons[status]} size={15} className={`save-icon is-${status}`} />
      <span>
        {start === "error" ? `${t.save.start}: ${t.save.error}` : `${t.save.result}: ${t.save[status]}`}
      </span>
      {failed && (
        <RetryButton t={t} ids={[attempt.attemptId]} onRetrySave={onRetrySave} />
      )}
    </div>
  );
}

export function SavePanel({ attempts, saveState, levels, t, onRetrySave, onClose }) {
  const rows = [...attempts].reverse().slice(0, 12);
  return (
    <Modal title={t.save.panelTitle} eyebrow={t.save.label} className="save-modal">
      <p>{t.save.panelBody}</p>
      <ul className="save-list">
        {rows.map((attempt) => {
          const { start, end } = operations(attempt, saveState);
          const level = levels.find((l) => l.id === attempt.levelId);
          return (
            <li key={attempt.attemptId}>
              <b>
                {t.save.attemptRow(attempt.number, level ? levelText(level, t).title : attempt.levelId)}
              </b>
              <small>{t.save.outcomes[attempt.outcome ?? "active"]}</small>
              <span className={`save-state is-${start}`}>
                <Icon name={icons[start]} size={13} /> {t.save.start}: {t.save[start]}
              </span>
              {end && (
                <span className={`save-state is-${end}`}>
                  <Icon name={icons[end]} size={13} /> {t.save.result}: {t.save[end]}
                </span>
              )}
              {(start === "error" || end === "error") && (
                <RetryButton t={t} ids={[attempt.attemptId]} onRetrySave={onRetrySave} />
              )}
            </li>
          );
        })}
      </ul>
      <button type="button" className="secondary" onClick={onClose}>
        {t.close}
      </button>
    </Modal>
  );
}
