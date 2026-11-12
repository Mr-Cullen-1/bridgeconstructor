import { useEffect, useRef, useState } from "react";
import { canConnectNodes } from "../engine/buildRules.js";
import Vehicle from "./Vehicle.jsx";

function Tree({ x, y, scale = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M-4 0V-45h8V0" fill="#826545" />
      <path d="m0-95-25 40h12l-19 30h64L13-55h12Z" fill="#4d8270" />
      <path d="M0-95v70h32L13-55h12Z" fill="#3c7062" />
    </g>
  );
}
export default function BridgeScene({
  state,
  edges,
  dispatch,
  t,
  pose,
  broken = false,
  countdown = 0,
  tutorialNodeId,
  hintId,
}) {
  const { level } = state,
    ref = useRef(null),
    [size, setSize] = useState({ width: 800, height: 470 }),
    [hover, setHover] = useState(null);
  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ width: width || 800, height: height || 470 });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  const scale = Math.min(size.width / 800, size.height / 470),
    radius = 22 / scale;
  const selected = level.nodes.find((n) => n.id === state.selectedNodeId),
    target = level.nodes.find((n) => n.id === hover);
  const preview =
    selected && target && selected.id !== target.id
      ? canConnectNodes(
          level,
          edges,
          selected.id,
          target.id,
          state.activeEdgeType,
        )
      : null;
  const locked = state.phase !== "building",
    finish = level.nodes.find((n) => n.id === level.finishNodeId),
    start = level.nodes.find((n) => n.id === level.startNodeId);
  return (
    <div className="scene-wrap" ref={ref}>
      <svg
        className="bridge-scene"
        viewBox="0 0 800 470"
        aria-label={t.collection}
      >
        <defs>
          <linearGradient id="sky" x2="0" y2="1">
            <stop stopColor="#e8f3ed" />
            <stop offset="1" stopColor="#f5f6de" />
          </linearGradient>
          <linearGradient id="river" x2="0" y2="1">
            <stop stopColor="#8cc5bc" />
            <stop offset="1" stopColor="#bddee1" />
          </linearGradient>
          <pattern
            id="grid"
            width="35"
            height="35"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="1" fill="#9bb5a8" opacity=".18" />
          </pattern>
        </defs>
        <rect width="800" height="470" fill="url(#sky)" />
        <rect width="800" height="470" fill="url(#grid)" />
        <g aria-hidden="true">
          <circle cx="624" cy="96" r="34" fill="#faf0bb" />
          <path
            d="M0 265 90 130 230 270 350 130 490 290 600 150 800 276v194H0Z"
            fill="#d5e5d6"
          />
          <path
            d="m0 285 145-95 130 105 160-110 145 115 145-91 75 75v186H0Z"
            fill="#c4daca"
          />
          <path d="m600 150-33 50 33-12 30 16Z" fill="#edf3df" />
          <path d="m350 130-28 43 28-12 32 21Z" fill="#edf3df" />
          <g fill="#fff" opacity=".65">
            <path d="M58 98q-8-15 9-20 8-25 30-10 19-2 22 17 17 1 15 13Z" />
            <path d="M422 84q-5-11 6-15 8-17 22-8 16-3 20 13 15 2 12 10Z" />
            <path d="M707 160q-6-15 9-17 11-24 26-8 17-2 20 16 13 0 13 9Z" />
          </g>
          <path d="M0 360q180-25 350 0t450 0v110H0Z" fill="url(#river)" />
          <g fill="none" stroke="#e2f2e8" strokeWidth="3" opacity=".7">
            <path d="M245 403h61m60 28h84m71-35h38M164 446h64m310-2h90m-316-65h39" />
          </g>
          <path
            d={`M0 ${start.y - 5}H120l-8 42 22 39-40 58-94 21Z`}
            fill="#9b9974"
          />
          <path
            d={`M0 ${start.y - 5}h120l-8 42-24 1-13 45-31 13-15 41H0Z`}
            fill="#b6ac84"
          />
          <path d={`M0 ${start.y - 9}h123l-3 15H0Z`} fill="#81a977" />
          <path
            d={`M680 ${finish.y - 5}h120v245l-53-25-18-52-42-25 16-46-24-37Z`}
            fill="#9a9873"
          />
          <path
            d={`M710 ${finish.y - 5}h90v225l-35-26-6-58-24-20 7-50Z`}
            fill="#b8ad85"
          />
          <path d={`M676 ${finish.y - 9}h124v15H680Z`} fill="#81a977" />
          <path
            d={`M0 ${start.y}h120M680 ${finish.y}h120`}
            stroke="#73877e"
            strokeWidth="9"
          />
          <path
            d={`M0 ${start.y - 1}h120M680 ${finish.y - 1}h120`}
            stroke="#d3d9b9"
            strokeWidth="2"
            strokeDasharray="10 8"
          />
          <Tree x={40} y={start.y - 12} scale={0.8} />
          <Tree x={84} y={start.y - 12} scale={0.48} />
          <Tree x={762} y={finish.y - 12} scale={0.9} />
          <Tree x={717} y={finish.y - 12} scale={0.5} />
          <g transform={`translate(710 ${finish.y - 8})`}>
            <path d="M0 0v-58" stroke="#536e63" strokeWidth="3" />
            <path d="M1-58h25v20H1Z" fill="#f8f4dd" />
            <path
              d="M1-58h8v7H1m16-7h8v7h-8M9-51h8v7H9m-8 0h8v6H1m16-6h8v6h-8"
              fill="#375d51"
            />
          </g>
          <path
            d={`M${start.x} ${start.y} ${level.roadNodeIds
              .map((id) => {
                const n = level.nodes.find((n) => n.id === id);
                return `L${n.x} ${n.y}`;
              })
              .join(" ")}`}
            fill="none"
            stroke="#7c9c91"
            strokeWidth="2"
            strokeDasharray="5 9"
            opacity=".35"
          />
        </g>
        {edges.map((edge) => {
          const a = level.nodes.find((n) => n.id === edge.fromNodeId),
            b = level.nodes.find((n) => n.id === edge.toNodeId),
            weak = broken && edge.id === state.run?.outcome.weakEdgeId;
          const length = Math.hypot(b.x - a.x, b.y - a.y),
            nx = ((-(b.y - a.y) / length) * 14) / scale,
            ny = (((b.x - a.x) / length) * 14) / scale;
          const hitArea = `${a.x + nx},${a.y + ny} ${b.x + nx},${b.y + ny} ${b.x - nx},${b.y - ny} ${a.x - nx},${a.y - ny}`;
          return (
            <g key={edge.id} className={weak ? "broken-segment" : ""}>
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={
                  weak
                    ? "#d16e4f"
                    : state.selectedEdgeId === edge.id
                      ? "#efb74f"
                      : edge.type === "road"
                        ? "#556962"
                        : "#b7905e"
                }
                strokeWidth={edge.type === "road" ? 10 : 7}
                strokeLinecap="round"
              />
              <line
                x1={a.x}
                y1={a.y - 1}
                x2={b.x}
                y2={b.y - 1}
                stroke={edge.type === "road" ? "#d8decd" : "#ddbe8b"}
                strokeWidth="2"
                strokeDasharray={edge.type === "road" ? "12 9" : undefined}
                pointerEvents="none"
              />
              {edge.isPlayerBuilt && (
                <polygon
                  role="button"
                  tabIndex={locked ? -1 : 0}
                  aria-disabled={locked}
                  aria-label={t.edge(a.id, b.id)}
                  points={hitArea}
                  fill="transparent"
                  className="edge-hit"
                  onClick={() =>
                    dispatch({ type: "SELECT_EDGE", edgeId: edge.id })
                  }
                  onKeyDown={(e) => {
                    if (["Enter", " "].includes(e.key)) {
                      e.preventDefault();
                      dispatch({ type: "SELECT_EDGE", edgeId: edge.id });
                    }
                  }}
                />
              )}
            </g>
          );
        })}
        {preview && (
          <line
            x1={selected.x}
            y1={selected.y}
            x2={target.x}
            y2={target.y}
            stroke={preview.ok ? "#2e9378" : "#cd694c"}
            strokeWidth="5"
            strokeDasharray="8 6"
            pointerEvents="none"
          />
        )}
        {level.nodes.map((node) => (
          <g
            key={node.id}
            role="button"
            tabIndex={locked ? -1 : 0}
            aria-disabled={locked}
            aria-label={t.node(node.id)}
            aria-pressed={state.selectedNodeId === node.id}
            aria-describedby={tutorialNodeId === node.id ? hintId : undefined}
            className={`node-marker ${state.selectedNodeId === node.id ? "selected" : ""}`}
            onPointerEnter={() => setHover(node.id)}
            onPointerLeave={() => setHover(null)}
            onFocus={() => setHover(node.id)}
            onBlur={() => setHover(null)}
            onClick={() => dispatch({ type: "SELECT_NODE", nodeId: node.id })}
            onKeyDown={(e) => {
              if (["Enter", " "].includes(e.key)) {
                e.preventDefault();
                dispatch({ type: "SELECT_NODE", nodeId: node.id });
              }
            }}
          >
            <circle cx={node.x} cy={node.y} r={radius} fill="transparent" />
            {tutorialNodeId === node.id && (
              <g pointerEvents="none" aria-hidden="true">
                <circle cx={node.x} cy={node.y} r={24 / scale} fill="none" stroke="#ca8b21" strokeWidth={2 / scale} strokeDasharray={`${4 / scale} ${3 / scale}`} />
                <path d={`M${node.x - 6 / scale} ${node.y - 35 / scale}l${6 / scale} ${6 / scale} ${6 / scale} ${-6 / scale}`} fill="none" stroke="#9f6a10" strokeWidth={3 / scale} />
              </g>
            )}
            <circle
              className="node-halo"
              cx={node.x}
              cy={node.y}
              r="18"
              fill="none"
              stroke={state.selectedNodeId === node.id ? "#e6af46" : "#b0c4af"}
              strokeWidth="1.5"
              opacity={state.selectedNodeId === node.id ? 1 : 0.5}
            />
            <circle
              cx={node.x}
              cy={node.y}
              r={node.type === "anchor" ? 10 : 8}
              fill={
                state.selectedNodeId === node.id
                  ? "#efb84d"
                  : node.type === "anchor"
                    ? "#2d6959"
                    : "#fffdf2"
              }
              stroke="#3c7564"
              strokeWidth="3"
            />
            {node.type === "anchor" && (
              <circle cx={node.x} cy={node.y} r="3" fill="#f4edd3" />
            )}
            <text
              x={node.x}
              y={node.y + 34}
              textAnchor="middle"
              fontSize={Math.max(12, 11 / scale)}
              fontWeight="700"
              fill="#4c7063"
              pointerEvents="none"
            >
              {node.id.toUpperCase()}
            </text>
          </g>
        ))}
        <Vehicle pose={pose ?? { x: start.x - 40, y: start.y, angle: 0 }} />
      </svg>
      <div className="scene-status">
        <span
          className={`status-dot ${state.phase === "testing" ? "live" : ""}`}
        />
        {state.phase === "testing" ? t.testing : t.building}
      </div>
      <div className="scene-corner">
        {t.wood} <span>01</span>
      </div>
      {countdown > 0 && (
        <div className="countdown" aria-live="polite">
          {countdown}
        </div>
      )}
    </div>
  );
}
