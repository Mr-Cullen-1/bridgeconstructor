import { useEffect, useState } from "react";
import { tourIsOver } from "../onboarding/steps.js";

// Lessons a player finished or skipped are not shown again for the rest of this page load. The game
// itself never touches browser storage (the GameLab export forbids it): lasting memory comes from
// the host through `config.onboardingSeen` (lesson ids; "*" means all) and `config.onOnboardingDone`.
const seenInPage = new Set();
export const resetOnboardingMemory = () => seenInPage.clear();

const isSeen = (seen, id) => seen.has("*") || seen.has(id);

export function useOnboarding({ lesson, enabled, seen: hostSeen = [], ctx, onFinish }) {
  const [finished, setFinished] = useState(() => new Set(seenInPage));
  const [pos, setPos] = useState({ id: null, index: 0 });
  const running = Boolean(
    enabled && lesson && !isSeen(finished, lesson.id) && !isSeen(new Set(hostSeen), lesson.id),
  );
  // Each lesson starts from its first step, whatever the previous lesson left behind.
  const index = running && pos.id === lesson.id ? pos.index : 0;
  const steps = lesson?.steps ?? [];
  const step = running ? steps[index] : null;
  const phase = ctx.state.phase;
  const done = Boolean(step?.kind === "action" && step.done(ctx));
  const stepBack = Boolean(step?.back?.(ctx)) && index > 0;
  const over = running && tourIsOver(phase);

  // A finished lesson reports its own id; skipping reports "*" and silences every lesson.
  const finish = (id = lesson.id) => {
    seenInPage.add(id);
    setFinished(new Set(seenInPage));
    onFinish?.(id);
  };
  const go = (to) => setPos({ id: lesson.id, index: to });
  const next = () => (index + 1 >= steps.length ? finish() : go(index + 1));

  // Every state change below goes through a timer: action steps pause briefly so the player sees
  // the result of what they just did (the new road, the selected point) before the tour moves on.
  useEffect(() => {
    if (!running) return;
    if (over) {
      const id = setTimeout(() => finish(), 0);
      return () => clearTimeout(id);
    }
    if (stepBack) {
      const id = setTimeout(() => go(index - 1), 0);
      return () => clearTimeout(id);
    }
    if (done) {
      const id = setTimeout(next, step.delay ?? 400);
      return () => clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- finish/go/next only close over lesson and index
  }, [running, over, stepBack, done, index, lesson?.id]);

  return { running, step, index, total: steps.length, next, skip: () => finish("*") };
}
