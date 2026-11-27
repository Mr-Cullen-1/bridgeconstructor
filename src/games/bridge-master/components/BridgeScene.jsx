import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { canConnectNodes } from "../engine/buildRules.js";
import { getEdgeKey } from "../engine/graph.js";
import { createView, projectNode } from "../scene/view.js";
import { createScene } from "../scene/scene2d.js";
import { svg } from "../assets/design/index.js";

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
  hudTop,
  hudBottom,
}) {
  const container = useRef(null),
    canvas = useRef(null),
    world = useRef(null),
    frame = useRef({}),
    topRef = useRef(null),
    bottomRef = useRef(null),
    previousEdges = useRef(null),
    projectedRef = useRef(null);
  const [size, setSize] = useState({ width: 800, height: 470 });
  const [insets, setInsets] = useState({ top: 0, bottom: 0 });
  const [hover, setHover] = useState(null),

    [pops, setPops] = useState([]);
  const [ready, setReady] = useState(false);
  const camera = useMemo(
    () => createView(size.width, size.height, insets),
    [size, insets],
  );
  const { level } = state;
  // Compact markers that follow the scale of the scene (40 px on desktop, ~32 px on phones). Only the
  // picture shrinks: the invisible touch target keeps a 48 px diameter.
  const nodeSize = Math.round(Math.max(30, Math.min(40, 24 + 16 * camera.k)));
  const tag = Math.round(nodeSize * 0.64);
  const locked = state.phase !== "building";
  const selected = level.nodes.find((n) => n.id === state.selectedNodeId);
  const target = level.nodes.find((n) => n.id === hover);
  const preview = useMemo(
    () =>
      selected && target && selected.id !== target.id
        ? {
            a: selected,
            b: target,
            ...canConnectNodes(level, edges, selected.id, target.id, state.activeEdgeType),
          }
        : null,
    [selected, target, level, edges, state.activeEdgeType],
  );
  const projected = new Map(
    level.nodes.map((n) => [n.id, projectNode(n, camera)]),
  );

  useEffect(() => {
    projectedRef.current = projected;
  });
  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ width, height });
    });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  // The HUD covers the top and bottom of the screen; the bridge is framed in the free band between.
  useLayoutEffect(() => {
    const measure = () =>
      setInsets((previous) => {
        const next = {
          top: topRef.current?.offsetHeight ?? 0,
          bottom: bottomRef.current?.offsetHeight ?? 0,
        };
        return previous.top === next.top && previous.bottom === next.bottom ? previous : next;
      });
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    [topRef.current, bottomRef.current].forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    world.current = createScene(canvas.current, level);
    setReady(true);
    return () => {
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
    if (!ready || reducedMotion || !["building", "testing"].includes(state.phase)) return;
    let raf,
      last = null;
    function tick(time) {
      if (!document.hidden)
        world.current?.render(frame.current, last === null ? 0 : Math.min(0.05, (time - last) / 1000));
      last = time;
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready, reducedMotion, state.phase, level]);

  // Floating "-14" / "+14" labels when material is spent or returned.
  useEffect(() => {
    const before = previousEdges.current;
    previousEdges.current = { edges, levelId: level.id };
    if (!before || before.levelId !== level.id || before.edges === edges) return;
    const known = new Set(before.edges.map((e) => e.id)),
      current = new Set(edges.map((e) => e.id));
    const changes = [
      ...edges.filter((e) => e.isPlayerBuilt && !known.has(e.id)).map((e) => [e, "-"]),
      ...before.edges.filter((e) => e.isPlayerBuilt && !current.has(e.id)).map((e) => [e, "+"]),
    ];
    if (!changes.length) return;
    const points = projectedRef.current;
    setPops((list) =>
      [
        ...list,
        ...changes.map(([edge, sign]) => {
          const a = points.get(edge.fromNodeId),
            b = points.get(edge.toNodeId);
          return {
            key: `${edge.id}:${sign}:${list.length}:${edges.length}`,
            x: (a.x + b.x) / 2,
            y: (a.y + b.y) / 2 - 18,
            text: `${sign}${edge.cost}`,
            gain: sign === "+",
          };
        }),
      ].slice(-6),
    );
  }, [edges, level.id]);
  // Floating labels belong to building; clear them when a test starts or a dialog opens.
  useEffect(() => {
    if (state.phase !== "building") setPops([]);
  }, [state.phase]);
  useEffect(() => {
    if (!pops.length) return;
    const timer = setTimeout(() => setPops([]), 1100);
    return () => clearTimeout(timer);
  }, [pops]);

  function activateNode(nodeId) {
    if (!locked) dispatch({ type: "SELECT_NODE", nodeId });
  }
  return (
    <div
      className="scene-wrap"
      ref={container}
      style={{ "--inset-top": `${insets.top}px`, "--inset-bottom": `${insets.bottom}px` }}
    >
      <div ref={canvas} className="world-canvas" data-renderer={ready ? "layered" : "pending"} aria-hidden="true" />
      <div className="scene-vignette" aria-hidden="true" />
      <svg
        className="bridge-scene scene-hitlayer"
        viewBox={`0 0 ${size.width} ${size.height}`}
        aria-label={t.collection}
      >
        {!locked &&
          level.roadNodeIds.slice(1).map((id, i) => {
            const from = level.roadNodeIds[i];
            if (edges.some((e) => e.id === getEdgeKey(from, id))) return null;
            const a = projected.get(from),
              b = projected.get(id);
            return <line key={`guide-${from}-${id}`} className="road-guide" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
          })}
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
                  if (!locked) dispatch({ type: "SELECT_EDGE", edgeId: edge.id });
                }}
                onKeyDown={(e) => {
                  if (["Enter", " "].includes(e.key)) {
                    e.preventDefault();
                    if (!locked) dispatch({ type: "SELECT_EDGE", edgeId: edge.id });
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
            stroke={preview.ok ? "#5fe08a" : "#ff6b4a"}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="2 9"
            pointerEvents="none"
          />
        )}
        {level.nodes.map((node) => {
          const p = projected.get(node.id),
            active = state.selectedNodeId === node.id,
            cue = tutorialNodeId === node.id;
          const hovered = preview?.b.id === node.id;
          const skin = active || cue ? "node-selected" : hovered ? (preview.ok ? "node-valid" : "node-invalid") : node.type === "anchor" ? "node-anchor" : "node-idle";
          return (
            <g
              key={node.id}
              role="button"
              tabIndex={locked ? -1 : 0}
              aria-disabled={locked}
              aria-label={t.node(node.id)}
              data-tour={`node-${node.id}`}
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
              <circle cx={p.x} cy={p.y} r="24" fill="transparent" />
              {(active || cue) && !locked && <circle className="node-ring" cx={p.x} cy={p.y} r={nodeSize * 0.42} fill="none" stroke={active ? "#43eaff" : "#ffffff"} strokeWidth="2.5" />}
              <image
                className={`node-skin ${cue ? "node-cue" : ""}`}
                href={svg(skin)}
                x={p.x - nodeSize / 2}
                y={p.y - nodeSize / 2}
                width={nodeSize}
                height={nodeSize}
                pointerEvents="none"
              />
              <circle className="node-core" cx={p.x} cy={p.y} r="6" fill="transparent" pointerEvents="none" />
              {cue && <path d={`M${p.x - 5} ${p.y - nodeSize * 0.62 - 8}l5 5 5-5`} fill="none" stroke="#ffc736" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" pointerEvents="none" />}
              <image href={svg("node-label")} x={p.x - tag / 2} y={p.y + nodeSize * 0.5 - 1} width={tag} height={tag * 1.07} pointerEvents="none" />
              <text className="node-label" x={p.x} y={p.y + nodeSize * 0.5 - 1 + (tag * 1.07) / 2} fontSize={Math.round(tag * 0.52)} textAnchor="middle" dominantBaseline="central" pointerEvents="none">
                {node.id.toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>
      {pops.map((pop) => (
        <span key={pop.key} className={`cost-pop ${pop.gain ? "gain" : ""}`} style={{ left: pop.x, top: pop.y }} aria-hidden="true">
          {pop.text}
        </span>
      ))}
      <div className="hud-top" ref={topRef}>
        {hudTop}
      </div>
      <div className="hud-bottom" ref={bottomRef}>
        {hudBottom}
      </div>
      {countdown > 0 && (
        <div className="countdown" aria-live="polite">
          <span key={countdown}>{countdown}</span>
          <small>{t.ready}</small>
        </div>
      )}
    </div>
  );
}
