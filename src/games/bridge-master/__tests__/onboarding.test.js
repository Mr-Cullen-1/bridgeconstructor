import { describe, expect, it } from "vitest";
import { placeCard } from "../onboarding/placement.js";
import { lessonFor, tourIsOver } from "../onboarding/steps.js";
import { levels } from "../levels/index.js";
import { initialState, gameReducer } from "../engine/gameReducer.js";

const view = { w: 1366, h: 768 };
const size = { w: 360, h: 170 };
const inside = (p) => p.left >= 0 && p.top >= 0 && p.left + size.w <= view.w && p.top + size.h <= view.h;
const overlaps = (p, hole) =>
  p.left < hole.x + hole.w && p.left + size.w > hole.x && p.top < hole.y + hole.h && p.top + size.h > hole.y;

describe("tour card placement", () => {
  it("sits below a spotlight at the top of the screen and points at it", () => {
    const hole = { x: 500, y: 20, w: 360, h: 90 };
    const place = placeCard(hole, size, view);
    expect(place.side).toBe("below");
    expect(place.top).toBeGreaterThanOrEqual(hole.y + hole.h);
    expect(place.arrow).toBeCloseTo(hole.x + hole.w / 2 - place.left);
    expect(inside(place)).toBe(true);
  });
  it("sits above a spotlight at the bottom of the screen", () => {
    const hole = { x: 900, y: 660, w: 240, h: 80 };
    const place = placeCard(hole, size, view);
    expect(place.side).toBe("above");
    expect(place.top + size.h).toBeLessThanOrEqual(hole.y);
    expect(overlaps(place, hole)).toBe(false);
  });
  it("stays inside the screen when the spotlight hugs a corner", () => {
    for (const hole of [
      { x: 0, y: 0, w: 80, h: 60 },
      { x: 1286, y: 0, w: 80, h: 60 },
      { x: 0, y: 708, w: 80, h: 60 },
      { x: 1286, y: 708, w: 80, h: 60 },
    ])
      expect(inside(placeCard(hole, size, view))).toBe(true);
  });
  it("centres the card when there is no spotlight", () => {
    const place = placeCard(null, size, view);
    expect(place.side).toBe("center");
    expect(place.left).toBe((view.w - size.w) / 2);
  });
  it("never covers the spotlight on a phone when a free side exists", () => {
    const phone = { w: 360, h: 800 };
    const narrow = { w: 336, h: 190 };
    const hole = { x: 20, y: 690, w: 320, h: 100 };
    const place = placeCard(hole, narrow, phone);
    expect(place.side).toBe("above");
    expect(place.left).toBeGreaterThanOrEqual(12);
    expect(place.left + narrow.w).toBeLessThanOrEqual(phone.w - 12);
  });
  it("falls back to overlapping, still inside the screen, on a very short landscape view", () => {
    const short = { w: 800, h: 360 };
    const hole = { x: 100, y: 20, w: 600, h: 320 };
    const place = placeCard(hole, { w: 300, h: 150 }, short);
    expect(place.top).toBeGreaterThanOrEqual(12);
    expect(place.top + 150).toBeLessThanOrEqual(short.h - 12);
  });
});

const level = (n) => levels[n - 1];
const play = (lv, ...actions) => {
  let state = gameReducer(initialState(lv, "s"), { type: "START_BUILDING" });
  for (const action of actions) state = gameReducer(state, action);
  return state;
};
const connect = (a, b) => [
  { type: "SELECT_NODE", nodeId: a },
  { type: "SELECT_NODE", nodeId: b },
];
const supportTool = { type: "SET_EDGE_TYPE", edgeType: "support" };

describe("lessons", () => {
  it("teaches levels 1-3 in full and gives a short note to the levels that bring something new", () => {
    expect(lessonFor(level(1)).steps.map((s) => s.id)).toEqual([
      "goal", "level", "budget", "tools", "pickFirst", "pickSecond", "edit", "road", "controls", "test",
    ]);
    expect(lessonFor(level(2)).steps.map((s) => s.id)).toEqual(["new", "road", "tool", "supports", "triangles", "test"]);
    expect(lessonFor(level(3)).steps.map((s) => s.id)).toEqual(["idea", "road", "tool", "fan", "triangles", "star", "test"]);
    for (const n of [4, 7, 10, 12, 17]) expect(lessonFor(level(n)).fresh).toBe(true);
    for (const n of [1, 2, 3]) expect(lessonFor(level(n)).fresh).toBe(false);
    for (const n of [5, 6, 8, 9, 11, 13, 14, 15, 16, 18, 19, 20]) expect(lessonFor(level(n))).toBeNull();
  });
  it("only points at nodes the level really has", () => {
    for (const lv of levels) {
      const ids = new Set(lv.nodes.map((n) => n.id));
      for (const step of lessonFor(lv)?.steps ?? []) {
        for (const target of step.targets.filter((t) => t.startsWith("node-"))) expect(ids.has(target.slice(5))).toBe(true);
      }
    }
    // A custom level that reuses a lesson id but lacks its nodes gets no lesson instead of a broken one.
    expect(lessonFor({ ...level(2), nodes: level(2).nodes.filter((n) => n.id !== "f") })).toBeNull();
  });
  it("shows an example for every building step and a name for the thing to press", () => {
    for (const n of [1, 2, 3, 4]) {
      for (const step of lessonFor(level(n)).steps) {
        if (step.kind === "action") expect(["tap", "drag"]).toContain(step.hand);
        if (step.hand === "drag") expect(step.ghost.length).toBeGreaterThan(0);
      }
    }
  });

  describe("level one", () => {
    const steps = lessonFor(level(1)).steps;
    const byId = (id) => steps.find((s) => s.id === id);
    const ctx = (state, roadReady = false) => ({ state, roadReady });
    it("waits for the player to do each action", () => {
      expect(byId("pickFirst").done(ctx(play(level(1))))).toBe(false);
      expect(byId("pickFirst").done(ctx(play(level(1), { type: "SELECT_NODE", nodeId: "a" })))).toBe(true);
      const oneRoad = play(level(1), ...connect("a", "b"));
      expect(byId("pickSecond").done(ctx(oneRoad))).toBe(true);
      expect(byId("road").done(ctx(oneRoad))).toBe(false);
      expect(byId("road").done(ctx(oneRoad, true))).toBe(true);
      expect(byId("test").done(ctx(play(level(1))))).toBe(false);
      expect(byId("test").done({ state: { phase: "testing" } })).toBe(true);
    });
    it("goes back to the first point when the selection is dropped", () => {
      expect(byId("pickSecond").back(ctx(play(level(1), { type: "SELECT_NODE", nodeId: "a" })))).toBe(false);
      expect(byId("pickSecond").back(ctx(play(level(1))))).toBe(true);
      expect(byId("pickSecond").back(ctx(play(level(1), ...connect("a", "b"))))).toBe(false);
    });
  });

  describe("level two: the first support", () => {
    const steps = lessonFor(level(2)).steps;
    const byId = (id) => steps.find((s) => s.id === id);
    it("asks for the road, then the Support tool, then the three ropes from F", () => {
      const roads = play(level(2), ...connect("a", "b"), ...connect("b", "e"));
      expect(byId("road").done({ state: play(level(2), ...connect("a", "b")) })).toBe(false);
      expect(byId("road").done({ state: roads })).toBe(true);
      expect(byId("tool").done({ state: roads })).toBe(false);
      const tooled = gameReducer(roads, supportTool);
      expect(byId("tool").done({ state: tooled })).toBe(true);
      expect(byId("supports").back({ state: roads })).toBe(true);
      expect(byId("supports").back({ state: tooled })).toBe(false);
      const ropes = play(level(2), ...connect("a", "b"), ...connect("b", "e"), supportTool, ...connect("a", "f"), ...connect("b", "f"), ...connect("e", "f"));
      expect(byId("supports").done({ state: tooled })).toBe(false);
      expect(byId("supports").done({ state: ropes })).toBe(true);
    });
    it("draws the two triangles that appear", () => {
      expect(byId("triangles").shapes).toEqual([["a", "b", "f"], ["b", "e", "f"]]);
    });
  });

  describe("level three: a triangle under every piece", () => {
    const steps = lessonFor(level(3)).steps;
    const fan = steps.find((s) => s.id === "fan");
    it("wants F joined to all five road points and shows four triangles", () => {
      expect(fan.ghost.map((g) => [g.from, g.to])).toEqual(["a", "b", "c", "d", "e"].map((id) => [id, "f"]));
      expect(steps.find((s) => s.id === "triangles").shapes).toHaveLength(4);
      const partial = play(level(3), supportTool, ...connect("a", "f"), ...connect("b", "f"));
      expect(fan.done({ state: partial })).toBe(false);
    });
  });

  it("ends once a bridge test has begun", () => {
    expect(["testing", "success", "failed"].every(tourIsOver)).toBe(true);
    expect(["intro", "building", "paused"].some(tourIsOver)).toBe(false);
  });
});
