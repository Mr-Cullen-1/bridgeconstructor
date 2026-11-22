// Tiny synthesized sound effects (Web Audio). No audio files; every call is best-effort.
function tone(ctx, { freq, to = freq, dur = 0.12, type = "sine", gain = 0.05, delay = 0 }) {
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator(),
    amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
  amp.gain.setValueAtTime(gain, t);
  amp.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}
function burst(ctx, { dur = 0.15, cutoff = 900, gain = 0.08, delay = 0, type = "lowpass" }) {
  const t = ctx.currentTime + delay;
  const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * dur)), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const source = ctx.createBufferSource(),
    filter = ctx.createBiquadFilter(),
    amp = ctx.createGain();
  source.buffer = buffer;
  filter.type = type;
  filter.frequency.value = cutoff;
  amp.gain.setValueAtTime(gain, t);
  amp.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  source.connect(filter);
  filter.connect(amp);
  amp.connect(ctx.destination);
  source.start(t);
}

const sounds = {
  click: (c) => tone(c, { freq: 640, to: 520, dur: 0.06, type: "triangle", gain: 0.04 }),
  select: (c) => tone(c, { freq: 760, to: 900, dur: 0.07, type: "triangle", gain: 0.045 }),
  place: (c) => {
    burst(c, { dur: 0.09, cutoff: 1100, gain: 0.09 });
    tone(c, { freq: 170, to: 90, dur: 0.12, type: "sine", gain: 0.09 });
  },
  undo: (c) => tone(c, { freq: 460, to: 280, dur: 0.12, type: "triangle", gain: 0.05 }),
  error: (c) => {
    tone(c, { freq: 190, to: 130, dur: 0.16, type: "sawtooth", gain: 0.035 });
    tone(c, { freq: 150, to: 100, dur: 0.18, type: "sawtooth", gain: 0.035, delay: 0.1 });
  },
  tick: (c) => tone(c, { freq: 520, dur: 0.1, type: "square", gain: 0.03 }),
  go: (c) => {
    tone(c, { freq: 780, dur: 0.18, type: "square", gain: 0.035 });
    tone(c, { freq: 1170, dur: 0.26, type: "square", gain: 0.03, delay: 0.1 });
  },
  honk: (c) => {
    tone(c, { freq: 330, dur: 0.22, type: "sawtooth", gain: 0.03 });
    tone(c, { freq: 415, dur: 0.22, type: "sawtooth", gain: 0.025 });
  },
  crash: (c) => {
    burst(c, { dur: 0.7, cutoff: 700, gain: 0.16 });
    tone(c, { freq: 140, to: 38, dur: 0.6, type: "sawtooth", gain: 0.08 });
  },
  splash: (c) => burst(c, { dur: 0.45, cutoff: 3200, gain: 0.07, type: "highpass" }),
  success: (c) => {
    [523, 659, 784, 1047].forEach((freq, i) =>
      tone(c, { freq, dur: 0.22, type: "triangle", gain: 0.05, delay: i * 0.11 }),
    );
    tone(c, { freq: 1568, dur: 0.5, type: "sine", gain: 0.035, delay: 0.5 });
  },
  star: (c) => tone(c, { freq: 1175, to: 1480, dur: 0.18, type: "sine", gain: 0.05 }),
};

export function playSfx(context, name) {
  try {
    sounds[name]?.(context);
  } catch {
    /* Audio is optional. */
  }
}
