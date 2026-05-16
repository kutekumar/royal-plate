import { useCallback, useRef } from 'react';

type SoundType = 'tap' | 'success' | 'error' | 'pageTransition' | 'notification' | 'checkout' | 'addToCart' | 'removeFromCart' | 'select' | 'reserve' | 'payment';

let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
};

const createGain = (ctx: AudioContext, volume: number, ramp?: { end: number; duration: number }) => {
  const gain = ctx.createGain();
  gain.gain.value = volume;
  if (ramp) {
    gain.gain.exponentialRampToValueAtTime(ramp.end, ctx.currentTime + ramp.duration);
  }
  gain.connect(ctx.destination);
  return gain;
};

const playTap = () => {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = createGain(ctx, 0.08, { end: 0.001, duration: 0.05 });
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.03);
  osc.connect(gain);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.05);
};

const playSuccess = () => {
  const ctx = getAudioContext();
  const notes = [523.25, 659.25, 783.99];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = createGain(ctx, 0.06, { end: 0.001, duration: 0.3 });
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    osc.start(ctx.currentTime + i * 0.1);
    osc.stop(ctx.currentTime + i * 0.1 + 0.3);
  });
};

const playError = () => {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = createGain(ctx, 0.08, { end: 0.001, duration: 0.25 });
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2);
  osc.connect(gain);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.25);
};

const playPageTransition = () => {
  const ctx = getAudioContext();
  const bufferSize = ctx.sampleRate * 0.15;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(2000, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
  const gain = createGain(ctx, 0.03);
  source.connect(filter);
  filter.connect(gain);
  source.start(ctx.currentTime);
  source.stop(ctx.currentTime + 0.15);
};

const playNotification = () => {
  const ctx = getAudioContext();
  [880, 1108.73, 1318.51].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = createGain(ctx, 0.05, { end: 0.001, duration: 0.4 });
    osc.type = 'triangle';
    osc.frequency.value = freq;
    osc.connect(gain);
    osc.start(ctx.currentTime + i * 0.12);
    osc.stop(ctx.currentTime + i * 0.12 + 0.4);
  });
};

const playCheckout = () => {
  const ctx = getAudioContext();
  [440, 554.37, 659.25, 880].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = createGain(ctx, 0.06, { end: 0.001, duration: 0.5 });
    osc.type = 'sine';
    osc.frequency.value = freq;
    const gain2 = ctx.createGain();
    gain2.gain.value = 0.03;
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = freq * 2;
    osc2.connect(gain2);
    gain2.connect(gain);
    osc.connect(gain);
    osc.start(ctx.currentTime + i * 0.08);
    osc.stop(ctx.currentTime + i * 0.08 + 0.5);
    osc2.start(ctx.currentTime + i * 0.08);
    osc2.stop(ctx.currentTime + i * 0.08 + 0.5);
  });
};

const playAddToCart = () => {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = createGain(ctx, 0.09, { end: 0.001, duration: 0.12 });
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
  osc.connect(gain);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.12);
  const osc2 = ctx.createOscillator();
  const gain2 = createGain(ctx, 0.05, { end: 0.001, duration: 0.08 });
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(1400, ctx.currentTime + 0.04);
  osc2.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.1);
  osc2.connect(gain2);
  osc2.start(ctx.currentTime + 0.04);
  osc2.stop(ctx.currentTime + 0.12);
};

const playRemoveFromCart = () => {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = createGain(ctx, 0.08, { end: 0.001, duration: 0.1 });
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);
  osc.connect(gain);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.1);
};

const playSelect = () => {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = createGain(ctx, 0.05, { end: 0.001, duration: 0.06 });
  osc.type = 'sine';
  osc.frequency.value = 1000;
  osc.connect(gain);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.06);
  const osc2 = ctx.createOscillator();
  const gain2 = createGain(ctx, 0.04, { end: 0.001, duration: 0.08 });
  osc2.type = 'sine';
  osc2.frequency.value = 1300;
  osc2.connect(gain2);
  osc2.start(ctx.currentTime + 0.03);
  osc2.stop(ctx.currentTime + 0.11);
};

const playReserve = () => {
  const ctx = getAudioContext();
  [440, 554.37].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = createGain(ctx, 0.06, { end: 0.001, duration: 0.3 });
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    osc.start(ctx.currentTime + i * 0.12);
    osc.stop(ctx.currentTime + i * 0.12 + 0.3);
  });
};

const playPayment = () => {
  const ctx = getAudioContext();
  [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = createGain(ctx, 0.06, { end: 0.001, duration: 0.5 });
    osc.type = 'sine';
    osc.frequency.value = freq;
    const osc2 = ctx.createOscillator();
    const gain2 = createGain(ctx, 0.03, { end: 0.001, duration: 0.4 });
    osc2.type = 'triangle';
    osc2.frequency.value = freq * 1.5;
    osc.connect(gain);
    osc2.connect(gain2);
    osc.start(ctx.currentTime + i * 0.1);
    osc.stop(ctx.currentTime + i * 0.1 + 0.5);
    osc2.start(ctx.currentTime + i * 0.1);
    osc2.stop(ctx.currentTime + i * 0.1 + 0.4);
  });
};

const players: Record<SoundType, () => void> = {
  tap: playTap,
  success: playSuccess,
  error: playError,
  pageTransition: playPageTransition,
  notification: playNotification,
  checkout: playCheckout,
  addToCart: playAddToCart,
  removeFromCart: playRemoveFromCart,
  select: playSelect,
  reserve: playReserve,
  payment: playPayment,
};

export function useSound() {
  const enabledRef = useRef(true);

  const play = useCallback((type: SoundType) => {
    if (!enabledRef.current) return;
    try {
      players[type]?.();
    } catch {}
  }, []);

  const setEnabled = useCallback((val: boolean) => {
    enabledRef.current = val;
  }, []);

  return { play, setEnabled };
}

export type { SoundType };
