import { useEffect, useMemo, useRef, useState } from "react";
import { canConnectNodes } from "../engine/buildRules.js";
import { createCamera, projectNode } from "../scene/camera.js";
import { createWorld } from "../scene/world.js";

export default function BridgeScene({
  state,
  edges,
  dispatch,
  t,
  pose,
  broken = false,
  collapseSeconds = 0,
  countdown = 0,
  tutorialNodeId,
  hintId,
  reducedMotion = false,
}) {
  const container = useRef(null),
    canvas = useRef(null),
    world = useRef(null),
    frame = useRef({}),
    drag = useRef(null);
  const [size, setSize] = useState({ width: 800, height: 470 });
  const [view, setView] = useState("depth"),
    [yaw, setYaw] = useState(0.12),
    [hover, setHover] = useState(null);
  const [ready, setReady] = useState(false),
    [unavailable, setUnavailable] = useState(false);
  const camera = useMemo(
    () => createCamera(size.width, size.height, view, yaw),
    [size, view, yaw],
  );
  const { level } = state;
  const locked = state.phase !== "building";
  const selected = level.nodes.find((n) => n.id === state.selectedNodeId);
  const target = level.nodes.find((n) => n.id === hover);
  const preview = useMemo(
    () =>
      selected && target && selected.id !== target.id
        ? {
            a: selected,
            b: target,
            ...canConnectNodes(
              level,
              edges,
              selected.id,
              target.id,
              state.activeEdgeType,
            ),
          }
        : null,
    [selected, target, level, edges, state.activeEdgeType],
  );
  const projected = new Map(
    level.nodes.map((n) => [
      n.id,
      projectNode(n, camera, size.width, size.height),
    ]),
  );

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ width, height });
    });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (typeof WebGL2RenderingContext === "undefined") {
      setUnavailable(true);
      return;
    }
    const element = canvas.current;
    function lost(event) {
      event.preventDefault();
      setUnavailable(true);
      setReady(false);
    }
    try {
      world.current = createWorld(element, level);
      setReady(true);
      setUnavailable(false);
      element.addEventListener("webglcontextlost", lost);
    } catch {
      setReady(false);
      setUnavailable(true);
    }
    return () => {
      element.removeEventListener("webglcontextlost", lost);
      world.current?.dispose();
      world.current = null;
    };
  }, [level]);
  useEffect(() => {
    frame.current = {
      pose,
      broken,
      collapseSeconds,
      phase: state.phase,
      reducedMotion,
      collapseEdgeIds: state.run?.outcome.collapseEdgeIds ?? [],
    };
    world.current?.render(frame.current);
  }, [pose, broken, collapseSeconds, state.phase, reducedMotion, state.run]);
  useEffect(() => {
    world.current?.resize(camera, size.width, size.height);
    world.current?.render(frame.current);
  }, [camera, size, ready, level]);
  useEffect(() => {
    world.current?.setBridge(edges, state.selectedEdgeId, preview);
    world.current?.render(frame.current);
  }, [edges, state.selectedEdgeId, preview, ready, level]);
  useEffect(() => {
    if (
      !ready ||
      reducedMotion ||
      !["building", "testing"].includes(state.phase)
    )
      return;
    let raf,
      last = null;
    function tick(time) {
      if (!document.hidden)
        world.current?.render(
          frame.current,
          last === null ? 0 : Math.min(0.05, (time - last) / 1000),
        );
      last = time;
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready, reducedMotion, state.phase, level]);

  function setCamera(next) {
    setView(next);
    setYaw(next === "front" ? 0 : 0.12);
  }
  function activateNode(nodeId) {
    if (!locked) dispatch({ type: "SELECT_NODE", nodeId });
  }
  return (
    <div className="scene-wrap" ref={container}>
      <canvas
        ref={canvas}
        className="world-canvas"
        data-renderer={ready ? "webgl" : "pending"}
        aria-hidden="true"
      />
      <div className="scene-vignette" aria-hidden="true" />
      <svg
        className="bridge-scene scene-hitlayer"
        viewBox={`0 0 ${size.width} ${size.height}`}
        aria-label={t.collection}
        onPointerDown={(event) => {
          if (event.target.closest('[role="button"]')) return;
          drag.current = { x: event.clientX, yaw };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (drag.current)
            setYaw(
              Math.max(
                -0.35,
                Math.min(
                  0.35,
                  drag.current.yaw + (event.clientX - drag.current.x) / 600,
                ),
              ),
            );
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        {edges
          .filter((e) => e.isPlayerBuilt)
          .map((edge) => {
            const a = projected.get(edge.fromNodeId),
              b = projected.get(edge.toNodeId);
            const length = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y));
            const nx = (-(b.y - a.y) * 12) / length,
              ny = ((b.x - a.x) * 12) / length;
            return (
              <polygon
                key={edge.id}
                role="button"
                tabIndex={locked ? -1 : 0}
                aria-disabled={locked}
                aria-label={t.edge(edge.fromNodeId, edge.toNodeId)}
                points={`${a.x + nx},${a.y + ny} ${b.x + nx},${b.y + ny} ${b.x - nx},${b.y - ny} ${a.x - nx},${a.y - ny}`}
                className="edge-hit"
                fill="transparent"
                onClick={() => {
                  if (!locked)
                    dispatch({ type: "SELECT_EDGE", edgeId: edge.id });
                }}
                onKeyDown={(e) => {
                  if (["Enter", " "].includes(e.key)) {
                    e.preventDefault();
                    if (!locked)
                      dispatch({ type: "SELECT_EDGE", edgeId: edge.id });
                  }
                }}
              />
            );
          })}
        {preview && (
          <line
            x1={projected.get(selected.id).x}
            y1={projected.get(selected.id).y}
            x2={projected.get(target.id).x}
            y2={projected.get(target.id).y}
            stroke={preview.ok ? "#83ebba" : "#ff8c70"}
            strokeWidth="3"
            strokeDasharray="6 5"
            pointerEvents="none"
          />
        )}
        {level.nodes.map((node) => {
          const p = projected.get(node.id),
            active = state.selectedNodeId === node.id,
            cue = tutorialNodeId === node.id;
          return (
            <g
              key={node.id}
              role="button"
              tabIndex={locked ? -1 : 0}
              aria-disabled={locked}
              aria-label={t.node(node.id)}
              aria-pressed={active}
              aria-describedby={cue ? hintId : undefined}
              className={`node-marker ${active ? "selected" : ""} ${cue ? "tutorial-node" : ""}`}
              onPointerEnter={() => setHover(node.id)}
              onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(node.id)}
              onBlur={() => setHover(null)}
              onClick={() => activateNode(node.id)}
              onKeyDown={(e) => {
                if (["Enter", " "].includes(e.key)) {
                  e.preventDefault();
                  activateNode(node.id);
                }
              }}
            >
              <circle cx={p.x} cy={p.y} r="22" fill="transparent" />
              <circle
                className="node-halo"
                cx={p.x}
                cy={p.y}
                r="16"
                fill={active ? "#efb74755" : "#f9f7df25"}
                stroke={active || cue ? "#ffd475" : "#fff9df88"}
                strokeWidth={cue ? 2.5 : 1}
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={node.type === "anchor" ? 7 : 6}
                fill={active ? "#ffce68" : "#f5f1d5"}
                stroke="#29574d"
                strokeWidth="2.5"
              />
              {cue && (
                <path
                  d={`M${p.x - 5} ${p.y - 28}l5 5 5-5`}
                  fill="none"
                  stroke="#fff0ad"
                  strokeWidth="3"
                  pointerEvents="none"
                />
              )}
              <text
                className="node-label"
                x={p.x}
                y={p.y + 30}
                textAnchor="middle"
                pointerEvents="none"
              >
                {node.id.toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="scene-status">
        <span
          className={`status-dot ${state.phase === "testing" ? "live" : ""}`}
        />
        {state.phase === "testing" ? t.testing : t.building}
      </div>
      <div className="camera-controls" aria-label={t.camera}>
        <button
          aria-label={t.depthView}
          aria-pressed={view === "depth"}
          onClick={() => setCamera("depth")}
        >
          3D
        </button>
        <button
          aria-label={t.frontView}
          aria-pressed={view === "front"}
          onClick={() => setCamera("front")}
        >
          {t.frontShort}
        </button>
      </div>
      <div className="world-caption" aria-hidden="true">
        <span>{t.worldName}</span>
        <span>{t.orbitHint}</span>
      </div>
      {unavailable && (
        <div className="webgl-error" role="alert">
          {t.webglError}
        </div>
      )}
      {countdown > 0 && (
        <div className="countdown" aria-live="polite">
          <span>{countdown}</span>
          <small>{t.ready}</small>
        </div>
      )}
    </div>
  );
}
