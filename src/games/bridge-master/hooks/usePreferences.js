import { useEffect, useRef, useState } from "react";
export function usePreferences() {
  const [reducedMotion, setReduced] = useState(false),
    [sound, setSound] = useState(false),
    audio = useRef(null);
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
  function beep(frequency = 520) {
    if (!audio.current || !sound) return;
    try {
      const context = audio.current,
        oscillator = context.createOscillator(),
        gain = context.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.025, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.09);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.1);
    } catch {
      /* Audio is optional. */
    }
  }
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
  return { reducedMotion, sound, toggleSound, beep };
}
