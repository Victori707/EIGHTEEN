import { useSyncExternalStore } from 'react'

/**
 * Звуковые эффекты сайта (затвор, гача, бумага, печать…).
 * Синтезируются прямо в браузере через Web Audio — никаких файлов.
 * Музыки на сайте нет.
 */

let muted = false
let started = false
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

let ctx: AudioContext | null = null
let master: GainNode | null = null

function getCtx(): AudioContext | null {
  if (ctx) return ctx
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  try {
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.6
    master.connect(ctx.destination)
  } catch {
    ctx = null
  }
  return ctx
}

export const audio = {
  /** Разблокировать звук (вызывать из обработчика нажатия). */
  start() {
    if (!started) {
      started = true
      getCtx()?.resume().catch(() => {})
      emit()
    }
  },
  /** раньше приглушали музыку; оставлено пустым, чтобы сцены не менять */
  duck(_on: boolean) {},
  letter(_on: boolean) {},
  get muted() {
    return muted
  },
  setMuted(v: boolean) {
    muted = v
    emit()
  },
  subscribe(l: () => void) {
    listeners.add(l)
    return () => listeners.delete(l)
  },
}

export function useMuted() {
  return useSyncExternalStore(audio.subscribe, () => muted, () => false)
}

/* ───────────── SFX ───────────── */

function out(): { c: AudioContext; dest: GainNode } | null {
  if (muted) return null
  const c = getCtx()
  if (!c || !master) return null
  if (c.state === 'suspended') c.resume().catch(() => {})
  return { c, dest: master }
}

function noise(c: AudioContext, dur: number) {
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buf
  return src
}

function burst(o: { c: AudioContext; dest: GainNode }, at: number, dur: number, freq: number, q: number, gain: number, type: BiquadFilterType = 'bandpass') {
  const { c, dest } = o
  const n = noise(c, dur)
  const f = c.createBiquadFilter()
  f.type = type
  f.frequency.value = freq
  f.Q.value = q
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(gain, at + 0.004)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  n.connect(f).connect(g).connect(dest)
  n.start(at)
  n.stop(at + dur + 0.02)
}

function tone(o: { c: AudioContext; dest: GainNode }, at: number, freq: number, dur: number, gain: number, type: OscillatorType = 'sine') {
  const { c, dest } = o
  const osc = c.createOscillator()
  osc.type = type
  osc.frequency.value = freq
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(gain, at + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  osc.connect(g).connect(dest)
  osc.start(at)
  osc.stop(at + dur + 0.05)
}

export const sfx = {
  tap() {
    const o = out(); if (!o) return
    burst(o, o.c.currentTime, 0.05, 2400, 3, 0.25)
  },
  shutter() {
    const o = out(); if (!o) return
    const t = o.c.currentTime
    burst(o, t, 0.06, 3200, 2, 0.7)
    burst(o, t + 0.07, 0.09, 1800, 2, 0.5)
    // motor whirr of film ejection
    const osc = o.c.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(90, t + 0.25)
    osc.frequency.linearRampToValueAtTime(130, t + 1.1)
    const f = o.c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 600
    const g = o.c.createGain()
    g.gain.setValueAtTime(0.0001, t + 0.25)
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.35)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2)
    osc.connect(f).connect(g).connect(o.dest)
    osc.start(t + 0.25); osc.stop(t + 1.3)
  },
  ratchet(clicks = 6, span = 0.9) {
    const o = out(); if (!o) return
    const t = o.c.currentTime
    for (let i = 0; i < clicks; i++) burst(o, t + (i / clicks) * span, 0.035, 1400 + Math.random() * 500, 6, 0.45)
  },
  clunk() {
    const o = out(); if (!o) return
    const t = o.c.currentTime
    tone(o, t, 140, 0.18, 0.4, 'triangle')
    burst(o, t, 0.08, 500, 1, 0.3, 'lowpass')
  },
  bounce(i = 0) {
    const o = out(); if (!o) return
    const t = o.c.currentTime
    tone(o, t, 420 - i * 40, 0.12, 0.25 / (i + 1), 'triangle')
  },
  pop() {
    const o = out(); if (!o) return
    const t = o.c.currentTime
    const osc = o.c.createOscillator()
    osc.frequency.setValueAtTime(260, t)
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.08)
    const g = o.c.createGain()
    g.gain.setValueAtTime(0.4, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15)
    osc.connect(g).connect(o.dest); osc.start(t); osc.stop(t + 0.2)
    ;[880, 1108, 1318].forEach((f, i) => tone(o, t + 0.1 + i * 0.07, f, 0.6, 0.12))
  },
  paper() {
    const o = out(); if (!o) return
    const t = o.c.currentTime
    for (let i = 0; i < 5; i++) burst(o, t + i * 0.07 + Math.random() * 0.03, 0.12, 5000 + Math.random() * 2000, 0.8, 0.12, 'highpass')
  },
  seal() {
    const o = out(); if (!o) return
    const t = o.c.currentTime
    burst(o, t, 0.05, 900, 2, 0.6)
    burst(o, t + 0.03, 0.08, 2600, 1.5, 0.3)
  },
  shake() {
    const o = out(); if (!o) return
    const t = o.c.currentTime
    for (let i = 0; i < 9; i++) burst(o, t + i * 0.06, 0.04, 3000 + Math.random() * 1500, 5, 0.18)
  },
  whoosh() {
    const o = out(); if (!o) return
    const t = o.c.currentTime
    const n = noise(o.c, 0.7)
    const f = o.c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.7
    f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(1200, t + 0.5)
    const g = o.c.createGain()
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7)
    n.connect(f).connect(g).connect(o.dest); n.start(t); n.stop(t + 0.75)
  },
  puff() {
    const o = out(); if (!o) return
    burst(o, o.c.currentTime, 0.5, 700, 0.6, 0.35, 'lowpass')
  },
  chime() {
    const o = out(); if (!o) return
    const t = o.c.currentTime
    ;[587.3, 739.9, 880, 1174.7].forEach((f, i) => tone(o, t + i * 0.11, f, 1.6, 0.1))
  },
}
