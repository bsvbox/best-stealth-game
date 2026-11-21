// The Quiet Gallery — all sounds are synthesized live with WebAudio. No audio files.

// Lazily created on the first user gesture, so browsers allow playback.
let audioCtx = null;
let muted = false;

export function ensureAudio() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (err) {
      audioCtx = null;
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') void audioCtx.resume();
  return audioCtx;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

// A short filtered-noise burst, like a soft footstep on stone.
function noiseBurst(ctx, when, duration, volume, frequency) {
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = frequency;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, when);
  gain.gain.exponentialRampToValueAtTime(0.001, when + duration);
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start(when);
}

// A pure tone with a quick fade, used for chimes and alert stings.
function tone(ctx, when, frequency, duration, volume, type = 'sine') {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = frequency;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, when);
  gain.gain.exponentialRampToValueAtTime(0.001, when + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(when);
  osc.stop(when + duration + 0.02);
}

export function playFootstep(loud, distanceVolume = 1) {
  if (muted) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  noiseBurst(ctx, ctx.currentTime, 0.07, (loud ? 0.16 : 0.05) * distanceVolume, loud ? 900 : 500);
}

export function playGuardStep(distanceVolume) {
  if (muted) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  // Guards wear heavier boots: lower, thuddier steps, so the player hears them coming.
  noiseBurst(ctx, ctx.currentTime, 0.09, 0.1 * distanceVolume, 320);
}

export function playPickup() {
  if (muted) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(ctx, now, 660, 0.12, 0.12);
  tone(ctx, now + 0.09, 880, 0.16, 0.12);
  tone(ctx, now + 0.18, 1320, 0.22, 0.08);
}

export function playCoinToss() {
  if (muted) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  tone(ctx, ctx.currentTime, 1560, 0.06, 0.07, 'triangle');
}

export function playCoinLand() {
  if (muted) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(ctx, now, 1180, 0.05, 0.09, 'triangle');
  tone(ctx, now + 0.07, 940, 0.08, 0.07, 'triangle');
}

export function playSuspicious() {
  if (muted) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(ctx, now, 392, 0.14, 0.1, 'triangle');
  tone(ctx, now + 0.12, 466, 0.18, 0.1, 'triangle');
}

export function playAlarm() {
  if (muted) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(ctx, now, 220, 0.22, 0.14, 'sawtooth');
  tone(ctx, now + 0.2, 277, 0.22, 0.14, 'sawtooth');
  tone(ctx, now + 0.4, 220, 0.3, 0.12, 'sawtooth');
}

export function playCaught() {
  if (muted) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(ctx, now, 110, 0.5, 0.16, 'sawtooth');
  tone(ctx, now + 0.1, 104, 0.5, 0.14, 'sawtooth');
}

export function playLevelClear() {
  if (muted) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const now = ctx.currentTime;
  [523, 659, 784, 1046].forEach((freq, i) => {
    tone(ctx, now + i * 0.11, freq, 0.2, 0.1);
  });
}

export function playWin() {
  if (muted) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const now = ctx.currentTime;
  [523, 659, 784, 1046, 784, 1046, 1318].forEach((freq, i) => {
    tone(ctx, now + i * 0.13, freq, 0.24, 0.1);
  });
}
