let context;

function getContext() {
  if (!context) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    context = new AudioCtx();
  }
  if (context.state === 'suspended') {
    context.resume();
  }
  return context;
}

function tone(frequency, duration, type, gainValue) {
  const ctx = getContext();
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(gainValue, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);
}

export function toneKick() {
  tone(180, 0.12, 'triangle', 0.05);
}

export function toneResult(result) {
  if (result === 'goal') {
    tone(520, 0.18, 'sine', 0.06);
    tone(780, 0.22, 'sine', 0.04);
    return;
  }
  if (result === 'save') {
    tone(140, 0.16, 'square', 0.03);
    return;
  }
  tone(90, 0.14, 'sawtooth', 0.02);
}
