import Modal from "./Modal.jsx";
import Icon from "./Icon.jsx";
import PackIcon from "./PackIcon.jsx";
import Mascot from "./Mascot.jsx";
const confetti = Array.from({ length: 30 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  delay: (i % 10) * 0.07,
  fall: 1.7 + (i % 5) * 0.28,
  color: ["#ffd54a", "#ff6b4a", "#5fe08a", "#6c9bff", "#ff8bd0"][i % 5],
  spin: (i % 2 ? 1 : -1) * (240 + i * 23),
  size: 7 + (i % 4) * 2,
}));
export default function ResultModal({
  result,
  t,
  onRetry,
  onReplay,
  onNext,
  onSelect,
  isLast,
  reasonCode,
  levelHint,
  saveLine,
}) {
  const success = result.status === "completed";
  return (
    <Modal title={success ? t.success : t.failed} eyebrow={success ? t.levelComplete : t.tryAgain} className={`result-modal ${success ? "result-success" : "result-failed"}`}>
      {success && (
        <div className="confetti" aria-hidden="true">
          {confetti.map((c, i) => (
            <i key={i} style={{ left: `${c.left}%`, background: c.color, width: c.size, height: c.size * 1.6, "--delay": `${c.delay}s`, "--fall": `${c.fall}s`, "--spin": `${c.spin}deg` }} />
          ))}
        </div>
      )}
      <Mascot pose={success ? "success" : "retry"} className="modal-mascot" />
      <div className="stars" aria-label={t.stars(result.stars)}>
        {[1, 2, 3].map((n) => (
          <Icon
            key={n}
            name="star"
            size={40}
            className={n <= result.stars ? "earned" : "empty"}
            style={{ "--i": n }}
          />
        ))}
      </div>
      <p>
        {success
          ? t.successBody
          : (t.failureReasons?.[reasonCode] ?? t.failedBody)}
      </p>
      {!success && levelHint && <p>{levelHint}</p>}
      <div className="result-stats">
        <div>
          <strong>{result.score}</strong>
          <span>{t.score}</span>
        </div>
        <div>
          <strong>{result.materialUsed}</strong>
          <span>{t.used}</span>
        </div>
        <div>
          <strong>{Math.round(result.stabilityScore * 100)}%</strong>
          <span>{t.stability}</span>
        </div>
      </div>
      <p className="attempt-summary">{t.attempts}: <b>{result.attempts}</b> · {t.activeTime}: <b>{result.durationSeconds} {t.seconds}</b></p>
      {saveLine}
      <div className="modal-actions">
        {success ? (
          <>
            <button className="primary" onClick={isLast ? onSelect : onNext}>
              {isLast ? t.levels : t.next}
              <PackIcon name="arrow-right" />
            </button>
            <button className="secondary" onClick={onReplay}>
              {t.replay}
            </button>
          </>
        ) : (
          <button className="primary" onClick={onRetry}>
            {t.retry}
            <PackIcon name="restart" />
          </button>
        )}
        {(!success || !isLast) && <button className="text-button" onClick={onSelect}>{t.levels}</button>}
      </div>
    </Modal>
  );
}
