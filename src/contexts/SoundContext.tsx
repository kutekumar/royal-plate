import { createContext, useContext, useCallback, useState, ReactNode } from 'react';
import type { SoundType } from '@/hooks/useSound';

let audioContext: AudioContext | null = null;

const getCtx = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
};

const gain = (ctx: AudioContext, vol: number, ramp?: { end: number; dur: number }) => {
  const g = ctx.createGain();
  g.gain.value = vol;
  if (ramp) g.gain.exponentialRampToValueAtTime(ramp.end, ctx.currentTime + ramp.dur);
  g.connect(ctx.destination);
  return g;
};

const osc = (ctx: AudioContext, type: OscillatorType, freq: number, dur: number, vol: number, delay = 0) => {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  const g = gain(ctx, vol, { end: 0.001, dur });
  o.connect(g);
  o.start(ctx.currentTime + delay);
  o.stop(ctx.currentTime + delay + dur);
};

const players: Record<SoundType, () => void> = {
  tap: () => {
    const ctx = getCtx();
    const o = ctx.createOscillator();
    const g = gain(ctx, 0.1, { end: 0.001, dur: 0.05 });
    o.type = 'sine';
    o.frequency.setValueAtTime(900, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1300, ctx.currentTime + 0.03);
    o.connect(g);
    o.start();
    o.stop(ctx.currentTime + 0.05);
  },
  success: () => {
    const ctx = getCtx();
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => osc(ctx, 'sine', f, 0.4, 0.07, i * 0.12));
  },
  error: () => {
    const ctx = getCtx();
    const o = ctx.createOscillator();
    const g = gain(ctx, 0.08, { end: 0.001, dur: 0.3 });
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(350, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.25);
    o.connect(g);
    o.start();
    o.stop(ctx.currentTime + 0.3);
  },
  pageTransition: () => {
    const ctx = getCtx();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(2500, ctx.currentTime);
    f.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.2);
    const g = gain(ctx, 0.04);
    src.connect(f);
    f.connect(g);
    src.start();
    src.stop(ctx.currentTime + 0.2);
  },
  notification: () => {
    const ctx = getCtx();
    [880, 1108.73, 1318.51, 1567.98].forEach((f, i) => osc(ctx, 'triangle', f, 0.35, 0.05, i * 0.1));
  },
  checkout: () => {
    const ctx = getCtx();
    [440, 554.37, 659.25, 880, 1046.5].forEach((f, i) => {
      osc(ctx, 'sine', f, 0.6, 0.07, i * 0.08);
      osc(ctx, 'triangle', f * 2, 0.5, 0.03, i * 0.08);
    });
  },
  addToCart: () => {
    const ctx = getCtx();
    const o = ctx.createOscillator();
    const g = gain(ctx, 0.09, { end: 0.001, dur: 0.12 });
    o.type = 'sine';
    o.frequency.setValueAtTime(600, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
    o.connect(g);
    o.start();
    o.stop(ctx.currentTime + 0.12);
    const o2 = ctx.createOscillator();
    const g2 = gain(ctx, 0.05, { end: 0.001, dur: 0.08 });
    o2.type = 'sine';
    o2.frequency.setValueAtTime(1400, ctx.currentTime + 0.04);
    o2.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.1);
    o2.connect(g2);
    o2.start(ctx.currentTime + 0.04);
    o2.stop(ctx.currentTime + 0.12);
  },
  removeFromCart: () => {
    const ctx = getCtx();
    const o = ctx.createOscillator();
    const g = gain(ctx, 0.08, { end: 0.001, dur: 0.1 });
    o.type = 'sine';
    o.frequency.setValueAtTime(800, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);
    o.connect(g);
    o.start();
    o.stop(ctx.currentTime + 0.1);
  },
  select: () => {
    const ctx = getCtx();
    osc(ctx, 'sine', 1000, 0.06, 0.05);
    osc(ctx, 'sine', 1300, 0.08, 0.04, 0.03);
  },
  reserve: () => {
    const ctx = getCtx();
    [440, 554.37].forEach((f, i) => osc(ctx, 'sine', f, 0.3, 0.06, i * 0.12));
  },
  payment: () => {
    const ctx = getCtx();
    [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) => {
      osc(ctx, 'sine', f, 0.5, 0.06, i * 0.1);
      osc(ctx, 'triangle', f * 1.5, 0.4, 0.03, i * 0.1);
    });
  },
};

interface SoundContextType {
  play: (type: SoundType) => void;
  enabled: boolean;
  setEnabled: (v: boolean) => void;
}

const SoundContext = createContext<SoundContextType>({
  play: () => {},
  enabled: true,
  setEnabled: () => {},
});

export const SoundProvider = ({ children }: { children: ReactNode }) => {
  const [enabled, _setEnabled] = useState(() => {
    try { return localStorage.getItem('soundEnabled') !== 'false'; } catch { return true; }
  });

  const play = useCallback((type: SoundType) => {
    if (!enabled) return;
    try { players[type]?.(); } catch {}
  }, [enabled]);

  const setEnabled = useCallback((v: boolean) => {
    _setEnabled(v);
    try { localStorage.setItem('soundEnabled', String(v)); } catch {}
  }, []);

  return (
    <SoundContext.Provider value={{ play, enabled, setEnabled }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSoundContext = () => useContext(SoundContext);
