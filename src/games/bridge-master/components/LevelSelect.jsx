import Modal from "./Modal.jsx";
import PackIcon from "./PackIcon.jsx";
import { useState } from "react";
import { levelText } from "../i18n/index.js";

const pageSize = 5;

export default function LevelSelect({ levels, t, onSelect, onClose, scores, currentLevelId }) {
  const [page, setPage] = useState(() =>
    Math.floor(Math.max(0, levels.findIndex((level) => level.id === currentLevelId)) / pageSize),
  );
  const pageCount = Math.ceil(levels.length / pageSize);
  const start = page * pageSize;
  return (
    <Modal title={t.chooseLevel} eyebrow={t.yourJourney} className="levels-modal">
      <p>{t.chooseLevelBody}</p>
      <div className="level-grid">
        {levels.slice(start, start + pageSize).map((level, index) => {
          const text = levelText(level, t);
          return (
          <button
            key={level.id}
            className={`level-choice ${currentLevelId === level.id ? "is-current" : ""} ${scores[level.id] ? "is-complete" : ""}`}
            aria-label={t.levelLabel(start + index + 1, text.title)}
            onClick={() => onSelect(level)}
          >
            <span>{String(start + index + 1).padStart(2, "0")}</span>
            <div>
              <b>{text.title}{currentLevelId === level.id && <em>{t.currentLevel}</em>}</b>
              <small>{text.subtitle}</small>
            </div>
            <span aria-label={t.stars(scores[level.id] ?? 0)}>
              {"★".repeat(scores[level.id] ?? 0)}
              {"☆".repeat(3 - (scores[level.id] ?? 0))}
            </span>
          </button>
          );
        })}
      </div>
      <div className="level-footer">
        {pageCount > 1 && (
          <nav className="level-pagination" aria-label={t.levelPages}>
            <button className="icon-button previous-page" aria-label={t.previousPage}
              disabled={page === 0} onClick={() => setPage(page - 1)}>
              <PackIcon name="arrow-right" size={22} />
            </button>
            <span aria-live="polite" aria-atomic="true">
              {start + 1}–{Math.min(start + pageSize, levels.length)} / {levels.length}
            </span>
            <button className="icon-button" aria-label={t.nextPage}
              disabled={page === pageCount - 1} onClick={() => setPage(page + 1)}>
              <PackIcon name="arrow-right" size={22} />
            </button>
          </nav>
        )}
        <button className="secondary" onClick={onClose}>{t.close}</button>
      </div>
    </Modal>
  );
}
