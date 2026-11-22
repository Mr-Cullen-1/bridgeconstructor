import Modal from "./Modal.jsx";
import Icon from "./Icon.jsx";
import { levelText } from "../i18n/index.js";
import { robotWave, coinStar, purpleGem, trophy } from "../assets/introAssets.js";

// Mini bridge that draws itself once, then a truck crosses it on a loop (see .gl-* in the CSS).
// The scene is drawn in a 560x220 box with generously overdrawn edges, so it can be letterboxed
// ("meet") into heroes of any aspect ratio without cropping the bridge.
const nodes = [120, 185, 250, 315, 380];
const apex = { x: 250, y: 52 };
// One wave period is 72 units, so shifting the path by 72 loops seamlessly.
const wave = `M-648 186q18-8 36 0${" t36 0".repeat(52)}`;
const star = "M0-10 3-3.4 10-2.8 4.6 2 6.2 9 0 5.3-6.2 9-4.6 2-10-2.8-3-3.4Z";

function HeroScene({ hello, compact }) {
  return (
    <svg className="gl-scene" viewBox={compact ? "30 16 500 150" : "20 -8 520 204"} preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="gl-sky" gradientUnits="userSpaceOnUse" x1="0" y1="-10" x2="0" y2="200">
          <stop offset="0" stopColor="#7FD0FF" />
          <stop offset="1" stopColor="#E3F6FF" />
        </linearGradient>
      </defs>
      <rect x="-700" y="-400" width="1960" height="900" fill="url(#gl-sky)" />
      <circle className="gl-sun" cx="74" cy="50" r="22" fill="#FFC93C" />
      <g className="gl-cloud gl-cloud-a" fill="#fff">
        <rect x="170" y="34" width="72" height="20" rx="10" />
        <rect x="186" y="24" width="38" height="20" rx="10" />
      </g>
      <g className="gl-cloud gl-cloud-b" fill="#fff" opacity=".85">
        <rect x="330" y="60" width="58" height="16" rx="8" />
        <rect x="344" y="51" width="30" height="16" rx="8" />
      </g>
      <path d="M-210 150-120 84-30 150Z" fill="#8FD96B" />
      <path d="M-10 150 80 78l62 72Z" fill="#8FD96B" />
      <path d="M380 150 458 70l92 80Z" fill="#74C95F" />
      <path d="M590 150 680 80l90 70Z" fill="#8FD96B" />
      <rect x="-700" y="168" width="1960" height="400" fill="#2BC0E0" />
      <path className="gl-wave" d={wave} fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".7" />
      <path d="M-700 128H120V560H-700Z" fill="#C98D5A" />
      <path d="M380 128H1260V560H380Z" fill="#C98D5A" />
      <rect x="-700" y="122" width="820" height="10" rx="3" fill="#79D957" />
      <rect x="380" y="122" width="880" height="10" rx="3" fill="#79D957" />
      <rect x="-700" y="132" width="820" height="4" fill="#00000012" />
      <rect x="380" y="132" width="880" height="4" fill="#00000012" />
      <g stroke="#8FA6BD" strokeWidth="5" strokeLinecap="round" fill="none">
        {nodes.map((x, i) => (
          <path key={x} className="gl-draw" style={{ "--d": `${1.5 + i * 0.16}s` }} pathLength="1" d={`M${x} 128 ${apex.x} ${apex.y}`} />
        ))}
      </g>
      <g stroke="#8A5A2B" strokeWidth="10" strokeLinecap="round" fill="none">
        {nodes.slice(1).map((x, i) => (
          <path key={x} className="gl-draw" style={{ "--d": `${0.3 + i * 0.25}s` }} pathLength="1" d={`M${nodes[i]} 128H${x}`} />
        ))}
      </g>
      <g fill="#fff" stroke="#5B351A" strokeWidth="3">
        {nodes.map((x, i) => (
          <circle key={x} className="gl-pop" style={{ "--d": `${0.2 + i * 0.25}s` }} cx={x} cy="128" r="6.5" />
        ))}
      </g>
      <circle className="gl-pop" style={{ "--d": "1.3s" }} cx={apex.x} cy={apex.y} r="8" fill="#FFD54A" stroke="#5B351A" strokeWidth="3" />
      <g className="gl-flag">
        <path d="M398 122V86" stroke="#5B351A" strokeWidth="3" strokeLinecap="round" />
        <path d="M398 86h20l-5 7 5 7h-20Z" fill="#FA4F28" />
      </g>
      <g className="gl-truck">
        <g transform="translate(0 123)">
          <rect x="-22" y="-19" width="26" height="13" rx="3" fill="#FA4F28" />
          <rect x="4" y="-17" width="16" height="11" rx="3" fill="#6C47FF" />
          <rect x="11" y="-15" width="7" height="5" rx="1.5" fill="#fff" />
          <g fill="#1E1B39">
            <circle cx="-13" cy="-4" r="4.5" />
            <circle cx="11" cy="-4" r="4.5" />
          </g>
          <g fill="#fff">
            <circle cx="-13" cy="-4" r="1.6" />
            <circle cx="11" cy="-4" r="1.6" />
          </g>
        </g>
      </g>
      <image className="gl-float gl-coin" href={coinStar} x="26" y="64" width="34" height="32" />
      <image className="gl-float gl-gem" href={purpleGem} x="296" y="14" width="28" height="28" />
      <g fill="#FFC93C" stroke="#E29A00" strokeWidth="1.2" strokeLinejoin="round">
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${462 + i * 28} ${i === 1 ? 17 : 26})`}>
            <path className="gl-star" style={{ "--s": `${i * 0.12}s` }} d={star} />
          </g>
        ))}
      </g>
      <image className="gl-robot" href={robotWave} x="433" y="21" width="118" height="118" />
      <g className="gl-pop gl-bubble" style={{ "--d": "0.7s" }}>
        <path d="M426 56 442 68 440 56Z" fill="#fff" stroke="#E4E3EE" strokeWidth="2" strokeLinejoin="round" />
        <rect x="384" y="34" width="56" height="24" rx="8" fill="#fff" stroke="#E4E3EE" strokeWidth="2" />
        <text x="412" y="51" textAnchor="middle" fontSize="12" fontWeight="800" fill="#1E1B39">{hello}</text>
      </g>
    </svg>
  );
}

export default function IntroModal({ t, level, levelIndex, total, levelHint, onStart }) {
  const first = level.difficulty === 1;
  const text = levelText(level, t);
  const { intro } = t;
  const stepIcons = ["road", "support", "play"];
  return (
    <Modal custom title={first ? intro.title : text.title} className={`gl-intro ${first ? "gl-intro-full" : "gl-intro-level"}`}>
      <div className="gl-hero">
        <HeroScene hello={intro.hello} compact={!first} />
      </div>
      <div className="gl-body">
        <div className="gl-main">
          <span className="gl-badge">
            <Icon name="star" size={13} />
            {first ? intro.badge : intro.levelBadge(levelIndex + 1, total)}
          </span>
          <h2>{first ? intro.title : text.title}</h2>
          <p className="gl-lead">{first ? intro.lead : text.subtitle}</p>
          {first ? (
            <>
              <ul className="gl-facts">
                {intro.facts.map((fact, i) => (
                  <li key={fact.label}>
                    {i === 1 && <img src={trophy} alt="" width="22" height="21" />}
                    <b>{fact.value}</b>
                    {fact.label}
                  </li>
                ))}
              </ul>
              <p className="gl-math">
                <Icon name="bulb" size={18} />
                {intro.mathLine}
              </p>
            </>
          ) : (
            levelHint && (
              <div className="gl-tip">
                <Icon name="bulb" size={22} />
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
              <h3 className="gl-how">{intro.howTitle}</h3>
              <ol className="gl-steps">
                {intro.steps.map((step, i) => (
                  <li key={step.title} className={`gl-step gl-step-${i}`}>
                    <span className="gl-step-icon">
                      <Icon name={stepIcons[i]} size={24} />
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
                    <Icon name="bridge" size={22} />
                  </span>
                  <small>{intro.budget}</small>
                  <b>{level.budget}</b>
                </div>
                <div>
                  <span className="gl-tile-icon gl-tile-star">
                    <img src={coinStar} alt="" width="28" height="27" />
                  </span>
                  <small>{intro.starGoal}</small>
                  <b>≤ {level.parBudget}</b>
                </div>
              </div>
              <ul className="gl-tools">
                {["road", "support"].map((type) => (
                  <li key={type}>
                    <Icon name={type} size={20} />
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
        <button type="button" className="gl-cta" onClick={onStart}>
          {t.start}
          <Icon name="arrow" size={20} />
        </button>
      </div>
    </Modal>
  );
}
