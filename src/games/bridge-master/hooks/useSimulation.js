import { useEffect, useRef, useState } from "react";
import { getVehiclePose } from "../engine/simulation.js";

export function useSimulation({
  run,
  phase,
  onComplete,
  reducedMotion = false,
}) {
  const [elapsedMs, setElapsed] = useState(0),
    elapsed = useRef(0),
    callback = useRef(onComplete),
    done = useRef(false);
  useEffect(() => {
    callback.current = onComplete;
  }, [onComplete]);
  useEffect(() => {
    elapsed.current = 0;
    done.current = false;
    setElapsed(0);
  }, [run]);
  const countdownMs = reducedMotion ? 0 : 3000;
  const travelMs = reducedMotion ? 600 : (run?.durationMs ?? 0);
  const failureProgress = run?.durationMs
    ? run.failureAtMs / run.durationMs
    : 0.5;
  const end =
    run?.outcome.status === "failed"
      ? countdownMs + travelMs * failureProgress + (reducedMotion ? 150 : 1500)
      : countdownMs + travelMs;
  useEffect(() => {
    if (!run || phase !== "testing" || done.current) return;
    let frameId,
      last = null,
      cancelled = false;
    function frame(now) {
      if (cancelled) return;
      if (last !== null) elapsed.current += Math.max(0, now - last);
      last = now;
      setElapsed(Math.min(elapsed.current, end));
      if (elapsed.current >= end) {
        done.current = true;
        callback.current?.();
        return;
      }
      frameId = requestAnimationFrame(frame);
    }
    frameId = requestAnimationFrame(frame);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
    };
  }, [run, phase, end]);
  const limit = run?.outcome.status === "failed" ? failureProgress : 1;
  const progress = travelMs
    ? Math.max(0, Math.min(limit, (elapsedMs - countdownMs) / travelMs))
    : 0;
  const broken =
    !!run && run.outcome.status === "failed" &&
    elapsedMs >= countdownMs + travelMs * failureProgress;
  return {
    elapsedMs,
    progress,
    vehiclePose: getVehiclePose(run, progress),
    countdown:
      run && phase === "testing"
        ? Math.max(0, Math.ceil((countdownMs - elapsedMs) / 1000))
        : 0,
    broken,
    collapseSeconds: broken
      ? reducedMotion
        ? 0.7
        : Math.min(1.5, (elapsedMs - countdownMs - travelMs * failureProgress) / 1000)
      : 0,
  };
}
