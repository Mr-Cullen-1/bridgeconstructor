import { useCallback, useEffect, useRef, useState } from "react";
import { playSfx } from "../scene/sfx.js";

export function usePreferences() {
  const [reducedMotion, setReduced] = useState(false),
    [sound, setSound] = useState(false),
    audio = useRef(null),
    soundOn = useRef(false);
  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!media) return;
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(
    () => () => {
      audio.current?.close().catch(() => {});
    },
    [],
  );
  useEffect(() => {
    soundOn.current = sound;
  }, [sound]);
  // Sound starts muted and is only created after the player taps the sound button.
  const play = useCallback((name = "click") => {
    if (!audio.current || !soundOn.current) return;
    playSfx(audio.current, name);
  }, []);
  function toggleSound() {
    if (!sound) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      try {
        if (Audio && !audio.current) audio.current = new Audio();
        audio.current?.resume().catch(() => {});
      } catch {
        /* Unsupported audio stays silent. */
      }
    }
    setSound((v) => !v);
  }
  return { reducedMotion, sound, toggleSound, play };
}
