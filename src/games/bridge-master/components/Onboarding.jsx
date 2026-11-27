import { useEffect, useRef, useState } from "react";
import { placeCard } from "../onboarding/placement.js";
import { robotWave } from "../assets/introAssets.js";
import Icon from "./Icon.jsx";

const PAD = 8;
const round = Math.round;
const same = (a, b) => a === b || (a && b && a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h);

// A pointing hand. Its fingertip is at (22, 2) in the 46 x 58 box.
function Hand() {
  return (
    <svg className="tour-hand-art" width="46" height="58" viewBox="0 0 46 58" aria-hidden="true" focusable="false">
      <path
        d="M16 8a6 6 0 0 1 12 0v18l9.5-2.6a5 5 0 0 1 6 5.3l-1.4 15.6A12 12 0 0 1 30.2 55H23a12 12 0 0 1-9.6-4.8L5.4 39.5a4.6 4.6 0 0 1 7-5.8L16 38Z"
        fill="#fff"
        stroke="#4a2a12"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M22 28v8m6-8v8" stroke="#4a2a12" strokeWidth="2.4" strokeLinecap="round" opacity=".45" />
    </svg>
  );
}

// Follows the target elements on every frame: the 3D camera moves, the layout reflows and the HUD
// animates, and the spotlight has to stay glued to them.
function useLayout(rootRef, cardRef, step) {
  const [layout, setLayout] = useState({ hole: null, card: null, view: { w: 0, h: 0 }, art: null });
  const key = step.targets.join("|");
  useEffect(() => {
    let frame;
    const measure = () => {
      const root = rootRef.current;
      if (root) {
        const base = root.getBoundingClientRect();
        let box = null;
        for (const name of key.split("|")) {
          const el = root.querySelector(`[data-tour="${name}"]`);
          const r = el?.getBoundingClientRect();
          if (!r || (!r.width && !r.height)) continue;
          box = box
            ? { l: Math.min(box.l, r.left), t: Math.min(box.t, r.top), r: Math.max(box.r, r.right), b: Math.max(box.b, r.bottom) }
            : { l: r.left, t: r.top, r: r.right, b: r.bottom };
        }
        const hole = box && {
          x: round(box.l - base.left - PAD),
          y: round(box.t - base.top - PAD),
          w: round(box.r - box.l + PAD * 2),
          h: round(box.b - box.t + PAD * 2),
        };
        // The middle of a node's dot, not of its label, is where lines start and fingers point.
        const core = (id) => {
          const r = root.querySelector(`[data-tour="node-${id}"] .node-core`)?.getBoundingClientRect();
          return r && { x: round(r.left + r.width / 2 - base.left), y: round(r.top + r.height / 2 - base.top) };
        };
        const lines = (step.ghost ?? []).flatMap((g) => {
          const a = core(g.from),
            b = core(g.to);
          return a && b ? [{ x1: a.x, y1: a.y, x2: b.x, y2: b.y, type: g.type }] : [];
        });
        const shapes = (step.shapes ?? []).map((ids) => ids.map(core)).filter((pts) => pts.every(Boolean));
        let hand = null;
        if (step.kind === "action" && step.hand === "drag" && lines[0]) {
          hand = { x: lines[0].x1, y: lines[0].y1, dx: lines[0].x2 - lines[0].x1, dy: lines[0].y2 - lines[0].y1, drag: true };
        } else if (step.kind === "action" && hole) {
          const one = step.targets.length === 1 && step.targets[0].startsWith("node-") ? core(step.targets[0].slice(5)) : null;
          hand = one
            ? { ...one, drag: false }
            : { x: round(hole.x + hole.w / 2 + Math.min(hole.w / 5, 28)), y: round(hole.y + hole.h / 2), drag: false };
        }
        const art = JSON.stringify({ lines, shapes, hand });
        const el = cardRef.current;
        const card = el ? { w: el.offsetWidth, h: el.offsetHeight } : null;
        const view = { w: round(base.width), h: round(base.height) };
        setLayout((prev) =>
          same(prev.hole, hole) &&
          prev.art === art &&
          prev.card?.w === card?.w &&
          prev.card?.h === card?.h &&
          prev.view.w === view.w &&
          prev.view.h === view.h
            ? prev
            : { hole, card, view, art },
        );
      }
      frame = requestAnimationFrame(measure);
    };
    frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
    // The step object is rebuilt only when the lesson changes; its id and targets are the real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootRef, cardRef, key, step.id]);
  return { ...layout, ...(layout.art ? JSON.parse(layout.art) : { lines: [], shapes: [], hand: null }) };
}

export default function Onboarding({ rootRef, lessonId, fresh, step, index, total, t, onNext, onSkip }) {
  const cardRef = useRef(null);
  const nextRef = useRef(null);
  const { hole, card, view, lines, shapes, hand } = useLayout(rootRef, cardRef, step);
  const copy = t.tour.lessons?.[lessonId]?.[step.id];
  const action = step.kind === "action";
  const width = Math.min(360, Math.max(240, view.w - 24));
  const place = card && view.w ? placeCard(hole, { w: width, h: card.h }, view) : null;

  // Keyboard players land on the button that moves the tour forward.
  useEffect(() => {
    if (!action) nextRef.current?.focus({ preventScroll: true });
  }, [action, step.id]);

  if (!copy) return null;
  return (
    <div className="tour" data-step={step.id} data-lesson={lessonId}>
      {hole ? (
        <>
          <div className="tour-block" style={{ left: 0, top: 0, right: 0, height: Math.max(0, hole.y) }} />
          <div className="tour-block" style={{ left: 0, right: 0, top: hole.y + hole.h, bottom: 0 }} />
          <div className="tour-block" style={{ left: 0, top: hole.y, width: Math.max(0, hole.x), height: hole.h }} />
          <div className="tour-block" style={{ left: hole.x + hole.w, right: 0, top: hole.y, height: hole.h }} />
          {/* Reading steps freeze the spotlit element too; action steps leave it clickable. */}
          {!action && <div className="tour-block" style={{ left: hole.x, top: hole.y, width: hole.w, height: hole.h }} />}
          <div key={step.id} className="tour-hole" style={{ left: hole.x, top: hole.y, width: hole.w, height: hole.h }} />
        </>
      ) : (
        <div className="tour-block tour-dim" />
      )}
      {(lines.length > 0 || shapes.length > 0) && (
        <svg key={step.id} className="tour-art" width={view.w} height={view.h} aria-hidden="true" focusable="false">
          {shapes.map((points, i) => (
            <polygon key={i} className="tour-shape" style={{ animationDelay: `${i * 0.35}s` }} points={points.map((p) => `${p.x},${p.y}`).join(" ")} />
          ))}
          {lines.map((l, i) => (
            <g key={i} className={`tour-ghost is-${l.type}`}>
              <line className="tour-ghost-shadow" x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} pathLength="1" />
              <line className="tour-ghost-line" x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} pathLength="1" />
            </g>
          ))}
        </svg>
      )}
      {hand && (
        <div
          key={`${step.id}-${hand.drag}`}
          className={`tour-hand ${hand.drag ? "is-drag" : "is-tap"}`}
          style={{ left: hand.x, top: hand.y, "--dx": `${hand.dx ?? 0}px`, "--dy": `${hand.dy ?? 0}px` }}
        >
          <Hand />
        </div>
      )}
      <section
        ref={cardRef}
        className={`tour-card ${place ? `is-${place.side}` : ""}`}
        aria-label={t.tour.label}
        aria-live="polite"
        style={{ width, left: place?.left ?? 0, top: place?.top ?? 0, opacity: place ? 1 : 0, "--arrow": `${place?.arrow ?? 0}px` }}
      >
        <header className="tour-head">
          <img className="tour-avatar" src={robotWave} alt="" width="52" height="52" />
          <div className="tour-title">
            <span className={`tour-count ${fresh ? "is-new" : ""}`}>{fresh ? t.tour.fresh : t.tour.stepOf(index + 1, total)}</span>
            <h3>{copy.title}</h3>
          </div>
        </header>
        <p className="tour-text">{copy.text}</p>
        {action && (
          <p className="tour-do">
            <Icon name="play" size={14} />
            {copy.cta}
          </p>
        )}
        <footer className="tour-foot">
          <button type="button" className="tour-skip" onClick={onSkip}>
            {t.tour.skip}
          </button>
          {!action && (
            <button type="button" ref={nextRef} className="tour-next" onClick={onNext}>
              {t.tour.next}
              <Icon name="arrow" size={18} />
            </button>
          )}
        </footer>
        {!fresh && (
          <div className="tour-dots" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => (
              <i key={i} className={i < index ? "past" : i === index ? "now" : ""} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
