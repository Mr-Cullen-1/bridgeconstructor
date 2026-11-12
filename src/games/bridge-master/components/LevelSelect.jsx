import Modal from "./Modal.jsx";
export default function LevelSelect({ levels, t, onSelect, onClose, scores }) {
  return (
    <Modal title={t.chooseLevel}>
      <p>{t.chooseLevelBody}</p>
      <div className="level-grid">
        {levels.map((level, index) => (
          <button
            key={level.id}
            className="level-choice"
            aria-label={t.levelLabel(index + 1, level.title)}
            onClick={() => onSelect(level)}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <b>{level.title}</b>
              <small>{level.subtitle}</small>
            </div>
            <span aria-label={t.stars(scores[level.id] ?? 0)}>
              {"★".repeat(scores[level.id] ?? 0)}
              {"☆".repeat(3 - (scores[level.id] ?? 0))}
            </span>
          </button>
        ))}
      </div>
      <button className="secondary" onClick={onClose}>
        {t.close}
      </button>
    </Modal>
  );
}
