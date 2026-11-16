import Modal from "./Modal.jsx";
import Icon from "./Icon.jsx";
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
}) {
  const success = result.status === "completed";
  return (
    <Modal title={success ? t.success : t.failed} eyebrow={success ? t.levelComplete : t.tryAgain} className={`result-modal ${success ? "result-success" : "result-failed"}`}>
      <div className="stars" aria-label={t.stars(result.stars)}>
        {[1, 2, 3].map((n) => (
          <Icon
            key={n}
            name="star"
            size={40}
            className={n <= result.stars ? "earned" : "empty"}
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
      <div className="modal-actions">
        {success ? (
          <>
            <button className="primary" onClick={isLast ? onSelect : onNext}>
              {isLast ? t.levels : t.next}
              <Icon name="arrow" />
            </button>
            <button className="secondary" onClick={onReplay}>
              {t.replay}
            </button>
          </>
        ) : (
          <button className="primary" onClick={onRetry}>
            {t.retry}
            <Icon name="reset" />
          </button>
        )}
        {(!success || !isLast) && <button className="text-button" onClick={onSelect}>{t.levels}</button>}
      </div>
    </Modal>
  );
}
