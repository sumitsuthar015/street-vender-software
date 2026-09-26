// A short "ding-ding" made with the Web Audio API (no sound file needed).
// Browsers only allow sound after the user has clicked the page once, so we unlock on first click.
let ctx = null;

function getContext() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', getContext, { once: true });
}

export function playDing() {
  const audio = getContext();
  if (!audio) return;
  [0, 0.25].forEach((delay, i) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'sine';
    osc.frequency.value = i === 0 ? 880 : 1175;
    const start = audio.currentTime + delay;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.4, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
    osc.connect(gain).connect(audio.destination);
    osc.start(start);
    osc.stop(start + 0.55);
  });
}
