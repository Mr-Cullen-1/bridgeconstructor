import { useLayoutEffect, useRef, useState } from "react";
import Modal from "./Modal.jsx";
import PackIcon from "./PackIcon.jsx";
import Mascot from "./Mascot.jsx";
import { img, svg } from "../assets/design/index.js";
import { levelText } from "../i18n/index.js";

// The dialog is drawn at a fixed design size and scaled to fit the screen, so it never scrolls:
// wide (landscape) 1280 x 835, tall (portrait) 520 x 940, short (landscape phones) 1000 x 430.
const DESIGN = { wide: [1280, 835], tall: [520, 940], short: [1000, 430] };
const MARGIN = 24;

function useFit(sectionRef) {
  const [fit, setFit] = useState({ layout: "wide", scale: 1 });
  useLayoutEffect(() => {
    const backdrop = sectionRef.current?.parentElement;
    if (!backdrop) return;
    const measure = () => {
      const w = backdrop.clientWidth,
        h = backdrop.clientHeight;
      if (!w || !h) return;
      const layout = h < 500 ? "short" : w / h < 1.05 ? "tall" : "wide";
      const [dw, dh] = DESIGN[layout];
      const scale = Math.max(0.2, Math.min(1, (w - MARGIN) / dw, (h - MARGIN) / dh));
      setFit((prev) => (prev.layout === layout && Math.abs(prev.scale - scale) < 0.001 ? prev : { layout, scale }));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(backdrop);
    return () => observer.disconnect();
  }, [sectionRef]);
  return fit;
}

// The banner: a crop of the pack's backdrop with the truck, the robot, the flag and a bridge on it.
function Hero({ hello }) {
  return (
    <div className="gl-hero" style={{ "--hero": `url("${img("backdrop")}")` }} aria-hidden="true">
      <img className="gl-hero-truck" src={img("truck")} alt="" />
      <svg className="gl-hero-bridge" viewBox="0 0 470 180" focusable="false">
        <g stroke="#b66b24" strokeWidth="8" strokeLinecap="round" fill="none">
          <path d="M10 165H460M10 165 235 18 460 165M100 165 235 18 370 165M235 18V165" />
        </g>
        <g fill="#ffdc3c" stroke="#fff6a3" strokeWidth="3">
          {[10, 100, 235, 370, 460].map((x) => (
            <circle key={x} cx={x} cy="165" r="9" />
          ))}
          <circle cx="235" cy="18" r="11" />
        </g>
      </svg>
      <span className="gl-hello">{hello}</span>
      <Mascot pose="wave" className="gl-hero-mascot" />
      <img className="gl-hero-flag" src={img("flag")} alt="" />
    </div>
  );
}

export default function IntroModal({ t, level, levelIndex, total, levelHint, onStart }) {
  const first = level.difficulty === 1;
  const text = levelText(level, t);
  const { intro } = t;
  const sectionRef = useRef(null);
  const { layout, scale } = useFit(sectionRef);
  const [word, ...rest] = intro.title.split(" ");
  const stepIcons = ["connect", "support", "play"];
  return (
    <Modal
      custom
      title={first ? intro.title : text.title}
      className={`gl-intro gl-${layout} ${first ? "gl-intro-full" : "gl-intro-level"}`}
      backdropClassName="gl-backdrop"
      style={{ "--fit": scale }}
      sectionRef={sectionRef}
    >
      <Hero hello={intro.hello} />
      <div className="gl-body">
        <div className="gl-main">
          {!first && (
            <span className="gl-badge">
              <PackIcon name="star" size={28} />
              {intro.levelBadge(levelIndex + 1, total)}
            </span>
          )}
          <h2>
            {first ? (
              <>
                {word} <em>{rest.join(" ")}</em>
              </>
            ) : (
              text.title
            )}
          </h2>
          <p className="gl-lead">{first ? intro.lead : text.subtitle}</p>
          {first ? (
            <>
              <ul className="gl-facts">
                {intro.facts.map((fact, i) => (
                  <li key={fact.label}>
                    {i === 0 && <PackIcon name="layers" size={26} />}
                    {i === 1 && <PackIcon name="trophy" size={26} />}
                    {i === 2 && <PackIcon name="infinity" size={26} />}
                    {i === 2 ? "" : <b>{fact.value}</b>}
                    {fact.label}
                  </li>
                ))}
              </ul>
              <div className="gl-tips">
                <p className="gl-math">
                  <PackIcon name="bulb" size={36} />
                  {intro.mathLine}
                </p>
              </div>
            </>
          ) : (
            levelHint && (
              <div className="gl-tip">
                <PackIcon name="bulb" size={36} />
                <div>
                  <b>{intro.tip}</b>
                  <p>{levelHint}</p>
                </div>
              </div>
            )
          )}
        </div>
        <div className="gl-side">
          {first ? (
            <>
              <h3 className="gl-how">
                <img src={svg("sparkle")} alt="" />
                {intro.howTitle}
              </h3>
              <ol className="gl-steps">
                {intro.steps.map((step, i) => (
                  <li key={step.title} className={`gl-step gl-step-${i}`}>
                    <span className="gl-step-icon">
                      <PackIcon name={stepIcons[i]} size={42} />
                    </span>
                    <span className="gl-step-copy">
                      <b>{step.title}</b>
                      <small>{step.text}</small>
                    </span>
                    <em aria-hidden="true">{i + 1}</em>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <>
              <div className="gl-tiles">
                <div>
                  <span className="gl-tile-icon">
                    <img src={img("logs")} alt="" width="38" />
                  </span>
                  <small>{intro.budget}</small>
                  <b>{level.budget}</b>
                </div>
                <div>
                  <span className="gl-tile-icon gl-tile-star">
                    <PackIcon name="star" size={34} />
                  </span>
                  <small>{intro.starGoal}</small>
                  <b>≤ {level.parBudget}</b>
                </div>
              </div>
              <ul className="gl-tools">
                {["road", "support"].map((type) => (
                  <li key={type}>
                    <PackIcon name={type} size={28} />
                    <b>{t[type]}</b>
                    <small>{t.toolDescriptions[type]}</small>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
      <div className="gl-footer">
        <img className="gl-rock gl-rock-l" src={img("rock-large")} alt="" />
        <img className="gl-rock gl-rock-r" src={img("rock-large")} alt="" />
        <img className="gl-corner gl-corner-l" src={img("grass-tuft")} alt="" />
        <img className="gl-corner gl-corner-r" src={img("grass-tuft")} alt="" />
        <button type="button" className="gl-cta" onClick={onStart}>
          <PackIcon name="play" size={38} />
          {t.start}
          <PackIcon name="arrow-right" size={34} />
        </button>
      </div>
    </Modal>
  );
}
