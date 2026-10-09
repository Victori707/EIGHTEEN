import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Mic, RotateCcw } from 'lucide-react'
import { site } from '../content/siteContent'
import { RegMarks, Sprig, WithHeart } from '../components/ui'
import { useGsap } from '../lib/useGsap'
import { prefersReducedMotion, vibrate } from '../lib/util'
import { audio, sfx } from '../lib/audio'
import { confetti } from '../lib/confetti'

type MicState = 'off' | 'requesting' | 'calibrating' | 'listening' | 'denied' | 'unsupported' | 'error'

const MIC_TEXT: Record<MicState, string> = {
  off: 'Зажми красную кнопку и держи — или подуй в микрофон.',
  requesting: 'Разреши доступ к микрофону…',
  calibrating: 'Секунду тишины — подстраиваюсь под комнату…',
  listening: 'Дуй! Микрофон слышит громкость, а не дыхание. Не выходит — держи кнопку.',
  denied: 'Микрофон недоступен — не страшно. Зажми кнопку и держи.',
  unsupported: 'Этот браузер не даёт микрофон. Зажми кнопку и держи.',
  error: 'Микрофон не запустился. Зажми кнопку и держи.',
}

export default function Cake() {
  const root = useRef<HTMLElement>(null)
  const visible = useRef(false)
  const confettiBox = useRef<HTMLDivElement>(null)
  const [lit, setLit] = useState(true)
  const [revealed, setRevealed] = useState(false)
  const [mic, setMic] = useState<MicState>('off')

  // live values (no re-render per frame)
  const st = useRef({ progress: 0, holding: false, micLevel: 0, micBase: 0.01, micThr: 0.08, micOn: false, lit: true, raf: 0, last: 0 })
  const micRes = useRef<{ stream?: MediaStream; ctx?: AudioContext; analyser?: AnalyserNode; buf?: Float32Array<ArrayBuffer>; calibUntil?: number; samples?: number[] }>({})
  const cleanupConfetti = useRef<() => void>(() => {})

  useGsap(root, () => {
    if (prefersReducedMotion()) return
    const st = { trigger: root.current, start: 'top 65%' }
    gsap.from('[data-ctitle] [data-ch]', { yPercent: 120, opacity: 0, rotate: 6, stagger: 0.025, duration: 0.6, ease: 'power4.out', scrollTrigger: st })
    gsap.from('[data-csub]', { opacity: 0, x: -20, duration: 0.8, delay: 0.4, scrollTrigger: st })
    gsap.from('[data-cjp] > span', { opacity: 0, y: -24, stagger: 0.08, duration: 0.6, scrollTrigger: st })
    gsap.from('[data-cake]', { y: 80, opacity: 0, scale: 0.92, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: root.current, start: 'top 55%' } })
    gsap.from('[data-flame-wrap]', { scale: 0, duration: 0.7, stagger: 0.25, ease: 'back.out(2)', transformOrigin: '50% 100%', delay: 0.8, scrollTrigger: { trigger: root.current, start: 'top 55%' } })
  })

  // only listen / animate while the cake is on screen; release the mic when leaving
  useEffect(() => {
    const el = root.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        visible.current = e.isIntersecting
        if (!e.isIntersecting && st.current.micOn) {
          stopMicRef.current()
          setMic('off')
        }
      },
      { threshold: 0.05 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const stopMic = useCallback(() => {
    const r = micRes.current
    r.stream?.getTracks().forEach((t) => t.stop())
    r.ctx?.close().catch(() => {})
    micRes.current = {}
    st.current.micOn = false
    audio.duck(false)
  }, [])
  const stopMicRef = useRef(stopMic)

  /** Применить «силу дуновения» к пламени: наклон, сжатие, свечение. */
  const applyBlow = (p: number, t: number) => {
    const s = root.current
    if (!s || !st.current.lit) return
    const wob = p > 0.05 ? Math.sin(t / 45) * 6 * p : 0
    gsap.set(s.querySelectorAll('[data-flame]'), { skewX: -p * 28 + wob, scaleY: 1 - p * 0.4, scaleX: 1 + p * 0.12, x: p * 4, transformOrigin: '50% 100%' })
    gsap.set(s.querySelectorAll('[data-glow]'), { opacity: 1 - p * 0.55 })
    s.querySelectorAll<SVGCircleElement>('[data-ring]').forEach((r) => (r.style.strokeDashoffset = String(239 * (1 - Math.min(1, p)))))
  }

  const extinguish = useCallback(() => {
    const s = st.current
    if (!s.lit) return
    s.lit = false
    s.holding = false
    stopMic()
    setLit(false)
    sfx.puff()
    vibrate([20, 40, 30])
    const el = root.current!
    const reduced = prefersReducedMotion()
    const tl = gsap.timeline()
    tl.to(el.querySelectorAll('[data-flame]'), { skewX: -40, scaleY: 0.2, scaleX: 0.4, opacity: 0, duration: reduced ? 0.01 : 0.35, stagger: 0.12, ease: 'power2.in' })
      .to(el.querySelectorAll('[data-glow]'), { opacity: 0, duration: reduced ? 0.01 : 0.6 }, 0)
      .to(el.querySelector('[data-ambient]'), { opacity: 0.15, duration: reduced ? 0.01 : 0.9 }, 0)
      .to(el.querySelectorAll('[data-wick-ember]'), { opacity: 1, duration: 0.1 }, 0.3)
      .to(el.querySelectorAll('[data-wick-ember]'), { opacity: 0, duration: 1.6 }, 0.5)
    if (!reduced) {
      tl.fromTo(
        el.querySelectorAll('[data-smoke]'),
        { opacity: 0, y: 0, strokeDashoffset: 120 },
        { opacity: 0.7, y: -24, strokeDashoffset: 0, duration: 1.2, stagger: 0.1, ease: 'sine.out' },
        0.3,
      ).to(el.querySelectorAll('[data-smoke]'), { opacity: 0, y: -70, scaleX: 1.6, duration: 1.6, ease: 'sine.in' }, 1.4)
    }
    tl.add(() => {
      setRevealed(true)
      sfx.chime()
      if (confettiBox.current) cleanupConfetti.current = confetti(confettiBox.current, { count: 46 })
    }, reduced ? 0.3 : 2.1)
  }, [stopMic])

  // main loop: hold + mic → progress → flames
  useEffect(() => {
    const s = st.current
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - (s.last || t)) / 1000)
      s.last = t
      if (!visible.current) {
        s.raf = requestAnimationFrame(loop)
        return
      }
      let micSignal = 0
      const r = micRes.current
      if (s.micOn && r.analyser && r.buf) {
        r.analyser.getFloatTimeDomainData(r.buf)
        let sum = 0
        for (let i = 0; i < r.buf.length; i++) sum += r.buf[i] * r.buf[i]
        const rms = Math.sqrt(sum / r.buf.length)
        s.micLevel = s.micLevel * 0.75 + rms * 0.25
        if (r.calibUntil && t < r.calibUntil) {
          r.samples!.push(rms)
        } else if (r.calibUntil) {
          const avg = r.samples!.reduce((a, b) => a + b, 0) / Math.max(1, r.samples!.length)
          s.micBase = Math.max(0.004, avg)
          s.micThr = Math.min(0.3, Math.max(0.045, s.micBase * 4.5))
          r.calibUntil = 0
          setMic('listening')
        } else {
          micSignal = Math.max(0, (s.micLevel - s.micBase) / (s.micThr - s.micBase))
        }
        root.current?.querySelectorAll<HTMLElement>('[data-meter]').forEach((m) => (m.style.transform = `scaleX(${Math.min(1, s.micLevel / s.micThr)})`))
      }
      if (s.lit) {
        if (s.holding) s.progress += dt / 1.3
        else if (micSignal >= 1) s.progress += (dt / 0.75) * Math.min(2, micSignal)
        else s.progress = Math.max(0, s.progress - dt / 1.1)
        const visual = Math.max(s.progress, Math.min(0.6, micSignal * 0.6))
        applyBlow(Math.min(1, visual), t)
        if (s.progress >= 1) extinguish()
      }
      s.raf = requestAnimationFrame(loop)
    }
    s.raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(s.raf)
  }, [extinguish])

  useEffect(
    () => () => {
      stopMic()
      cleanupConfetti.current()
    },
    [stopMic],
  )

  const startMic = async () => {
    sfx.tap()
    if (!navigator.mediaDevices?.getUserMedia || !(window.AudioContext || (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext)) {
      setMic('unsupported')
      return
    }
    setMic('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })
      if (!st.current.lit) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AC()
      await ctx.resume().catch(() => {})
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 1024
      analyser.smoothingTimeConstant = 0.2
      ctx.createMediaStreamSource(stream).connect(analyser)
      micRes.current = { stream, ctx, analyser, buf: new Float32Array(analyser.fftSize), calibUntil: performance.now() + 700, samples: [] }
      st.current.micOn = true
      st.current.micLevel = 0
      audio.duck(true)
      setMic('calibrating')
    } catch (e) {
      const name = (e as DOMException)?.name
      setMic(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'error')
    }
  }

  const hold = (on: boolean) => {
    if (!st.current.lit) return
    if (on && !st.current.holding) vibrate(10)
    st.current.holding = on
  }

  const relight = () => {
    sfx.tap()
    cleanupConfetti.current()
    const s = st.current
    s.progress = 0
    s.lit = true
    setRevealed(false)
    setLit(true)
    setMic('off')
    const el = root.current!
    gsap.set(el.querySelectorAll('[data-flame]'), { skewX: 0, scaleY: 1, scaleX: 1, x: 0, opacity: 1 })
    gsap.fromTo(el.querySelectorAll('[data-flame-wrap]'), { scale: 0 }, { scale: 1, duration: 0.7, stagger: 0.2, ease: 'back.out(2)', transformOrigin: '50% 100%' })
    gsap.to(el.querySelectorAll('[data-glow]'), { opacity: 1, duration: 0.8 })
    gsap.to(el.querySelector('[data-ambient]'), { opacity: 1, duration: 1 })
  }

  const title = site.cake.title
  return (
    <section ref={root} className="relative overflow-clip bg-ink pb-24 pt-20 text-paper-2 wide:pb-28 wide:pt-24" aria-label="Загадай желание">
      {/* atmosphere: candle light + gold halftone + print marks */}
      <div data-ambient className="pointer-events-none absolute inset-0">
        <div className="glow absolute inset-0" style={{ background: 'radial-gradient(48% 46% at 66% 56%, rgba(215,130,70,.32), rgba(104,31,50,.25) 45%, transparent 75%)' }} />
      </div>
      <div className="halftone pointer-events-none absolute -left-10 bottom-0 h-[40%] w-[38%] text-gold/15 [mask-image:linear-gradient(45deg,#000,transparent_70%)]" aria-hidden />
      <RegMarks className="text-paper-2/25" />
      <div ref={confettiBox} className="pointer-events-none absolute inset-0 z-30 overflow-hidden" aria-hidden />

      {/* vertical 願い事 («желание») down the right edge */}
      <div data-cjp className="poster pointer-events-none absolute right-3 top-16 flex flex-col text-[clamp(40px,7vw,110px)] leading-[1.02] text-verm/90 wide:right-[3vw]" aria-hidden>
        {['願', 'い', '事'].map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>

      <div className="relative grid gap-6 px-5 wide:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] wide:grid-rows-[auto_1fr] wide:gap-x-[4vw] wide:gap-y-8 wide:px-[5vw]">
        <div className="wide:col-start-1 wide:row-start-1 wide:pt-[6vh]">
          <div className="flex items-center gap-3 text-gold">
            <span className="label">No.02 — wish</span>
            <span className="hairline w-12" />
          </div>
          <h2 data-ctitle className="poster mt-4 max-w-[12ch] pr-14 text-[clamp(38px,10.5vw,108px)] leading-[0.96] wide:pr-0 wide:text-[min(6.4vw,12vh)]">
            {title.split(' ').map((w, i) => (
              <span key={i} className="mr-[0.25em] inline-block whitespace-nowrap">
                {[...w].map((c, k) => (
                  <span key={k} data-ch className={`inline-block ${i === 1 ? 'text-verm' : ''}`}>
                    {c}
                  </span>
                ))}
              </span>
            ))}
          </h2>
          <p data-csub className="mt-4 font-display text-[clamp(20px,5vw,28px)] italic leading-snug text-gold">
            {site.cake.sub}
          </p>
        </div>

        <div
          data-cake
          className="relative mx-auto w-[min(92vw,600px)] touch-none select-none wide:col-start-2 wide:row-span-2 wide:row-start-1 wide:self-center"
          onPointerDown={(e) => {
            if (!lit) return
            ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
            hold(true)
          }}
          onPointerUp={() => hold(false)}
          onPointerCancel={() => hold(false)}
        >
          <CakeArt />
          <Sprig className="pointer-events-none absolute -left-2 bottom-[8%] h-[34%] -rotate-[18deg] text-gold/50" />
          <span className="label absolute bottom-[4%] right-0 text-[9px] text-paper-2/40">fig. 03 — 1 + 8</span>
        </div>

        <div className="min-h-[190px] wide:col-start-1 wide:row-start-2">{controls()}</div>
      </div>
    </section>
  )

  function controls() {
    return !revealed ? (
      <div className="flex flex-col items-start gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            disabled={!lit}
            className="relative grid h-[88px] w-[88px] shrink-0 touch-none place-items-center rounded-full bg-verm text-paper-2 shadow-[0_0_0_6px_rgba(215,76,56,.18)] disabled:opacity-40"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId)
              hold(true)
            }}
            onPointerUp={() => hold(false)}
            onPointerCancel={() => hold(false)}
            onPointerLeave={() => hold(false)}
            onKeyDown={(e) => {
              if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
                e.preventDefault()
                hold(true)
              }
            }}
            onKeyUp={() => hold(false)}
            onContextMenu={(e) => e.preventDefault()}
            aria-label="Зажми и держи, чтобы задуть свечи"
          >
            <svg viewBox="0 0 84 84" className="absolute inset-0 -rotate-90" aria-hidden>
              <circle cx="42" cy="42" r="38" fill="none" stroke="rgba(240,233,221,.15)" strokeWidth="2" />
              <circle data-ring cx="42" cy="42" r="38" fill="none" stroke="#f5f0e8" strokeWidth="2.5" strokeDasharray="239" strokeDashoffset="239" strokeLinecap="round" />
            </svg>
            <span className="label text-[9px] leading-tight">
              Зажми
              <br />и держи
            </span>
          </button>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={startMic}
              disabled={!lit || mic === 'requesting' || mic === 'calibrating' || mic === 'listening'}
              className="btn-pill border-paper-2/40 py-3 text-paper-2 disabled:opacity-60"
            >
              <Mic size={15} strokeWidth={1.5} />
              {mic === 'listening' ? 'Слушаю' : mic === 'calibrating' ? 'Калибрую' : 'Подуть'}
            </button>
            {(mic === 'listening' || mic === 'calibrating') && (
              <div className="h-[3px] w-full overflow-hidden rounded bg-paper/15" aria-hidden>
                <div data-meter className="h-full origin-left bg-gold transition-transform duration-75" style={{ transform: 'scaleX(0)' }} />
              </div>
            )}
          </div>
        </div>
        <p className="max-w-[360px] text-[15px] leading-snug text-paper-2/65" role="status" aria-live="polite">
          {MIC_TEXT[mic]}
        </p>
      </div>
    ) : (
      <Reveal onReplay={relight} />
    )
  }
}

function Reveal({ onReplay }: { onReplay: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useGsap(ref, () => {
    if (prefersReducedMotion()) return
    gsap.from('[data-w] > span', { yPercent: 110, duration: 1.2, stagger: 0.1, ease: 'power4.out' })
    gsap.from('[data-btn]', { opacity: 0, y: 10, duration: 0.8, delay: 1 })
  })
  return (
    <div ref={ref} className="flex flex-col items-start" role="status">
      <span data-w className="mask">
        <span className="label text-gold">Wish received</span>
      </span>
      <span data-w className="mask mt-2">
        <span className="poster text-[clamp(34px,9vw,64px)] leading-[1.02] text-paper-2">
          <WithHeart text={site.cake.accepted} />
        </span>
      </span>
      <button data-btn type="button" onClick={onReplay} className="btn-pill mt-6 border-paper-2/40 text-paper-2">
        <RotateCcw size={14} strokeWidth={1.5} /> Зажечь снова
      </button>
    </div>
  )
}

/** Торт: SVG-иллюстрация со свечами 1 и 8. */
function CakeArt() {
  const candles = [
    { ch: '1', x: 128, wick: [130, 142] },
    { ch: '8', x: 196, wick: [196, 142] },
  ]
  return (
    <svg viewBox="0 0 320 360" className="block w-full overflow-visible" role="img" aria-label="Торт со свечами 1 и 8">
      <defs>
        <linearGradient id="cakeSide" x1="0" x2="1">
          <stop offset="0" stopColor="#d9cfbf" />
          <stop offset=".35" stopColor="#faf6ef" />
          <stop offset=".7" stopColor="#efe6d8" />
          <stop offset="1" stopColor="#b8a798" />
        </linearGradient>
        <linearGradient id="candleFill" x1="0" x2="1">
          <stop offset="0" stopColor="#e9dfcf" />
          <stop offset=".5" stopColor="#faf6ef" />
          <stop offset="1" stopColor="#cdb99c" />
        </linearGradient>
        <linearGradient id="flameG" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#fff7dc" />
          <stop offset=".35" stopColor="#ffd88a" />
          <stop offset=".75" stopColor="#f19a43" />
          <stop offset="1" stopColor="#d9612c" stopOpacity=".2" />
        </linearGradient>
        <radialGradient id="glowG">
          <stop offset="0" stopColor="#ffcf7a" stopOpacity=".65" />
          <stop offset=".4" stopColor="#f0a050" stopOpacity=".22" />
          <stop offset="1" stopColor="#f0a050" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="drip" x1="0" x2="1">
          <stop offset="0" stopColor="#4a1525" />
          <stop offset=".4" stopColor="#7a2a3f" />
          <stop offset="1" stopColor="#4a1525" />
        </linearGradient>
        <filter id="blur6">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* glows */}
      {candles.map((c) => (
        <circle key={`g${c.ch}`} data-glow cx={c.wick[0]} cy={c.wick[1] - 16} r="80" fill="url(#glowG)" />
      ))}

      {/* stand */}
      <ellipse cx="160" cy="336" rx="120" ry="14" fill="#000" opacity=".45" filter="url(#blur6)" />
      <ellipse cx="160" cy="318" rx="132" ry="20" fill="#a77d4c" />
      <ellipse cx="160" cy="314" rx="132" ry="20" fill="#c89a63" />
      <ellipse cx="160" cy="312" rx="120" ry="15" fill="#d8b07d" opacity=".5" />

      {/* cake body */}
      <path d="M50 196 V296 A110 22 0 0 0 270 296 V196 Z" fill="url(#cakeSide)" />
      {/* ribbon */}
      <path d="M50 262 A110 22 0 0 0 270 262 V276 A110 22 0 0 1 50 276 Z" fill="#651f32" />
      <path d="M50 262 A110 22 0 0 0 270 262" fill="none" stroke="#c89a63" strokeWidth=".8" />
      <path d="M50 276 A110 22 0 0 0 270 276" fill="none" stroke="#c89a63" strokeWidth=".8" />
      {/* piping dots */}
      {Array.from({ length: 15 }).map((_, i) => {
        const a = Math.PI * (0.06 + (i / 14) * 0.88)
        const x = 160 - Math.cos(a) * 108
        const y = 296 + Math.sin(a) * 21.5
        return <circle key={i} cx={x} cy={y} r="3.4" fill="#faf6ef" stroke="#d6c8b4" strokeWidth=".6" />
      })}
      {/* top */}
      <ellipse cx="160" cy="196" rx="110" ry="22" fill="#faf6ef" />
      {/* burgundy glaze + drips */}
      <path
        d="M50 196 A110 22 0 0 0 270 196 A110 22 0 0 0 50 196 Z M50 196 C 52 214, 58 222, 62 206 C 66 214, 70 238, 78 214 C 84 222, 90 216, 96 214 C 102 232, 110 244, 116 218 C 124 222, 132 220, 140 218 C 146 234, 152 226, 158 219 C 166 222, 172 250, 182 218 C 190 220, 198 230, 204 216 C 212 214, 218 236, 228 211 C 236 214, 242 222, 248 206 C 254 210, 262 226, 270 196 Z"
        fill="url(#drip)"
      />
      <ellipse cx="160" cy="195" rx="108" ry="21" fill="#651f32" />
      <ellipse cx="150" cy="190" rx="70" ry="9" fill="#8a3a4f" opacity=".45" />

      {/* botanical decoration on top */}
      <g stroke="#c89a63" strokeWidth="1" fill="none" strokeLinecap="round">
        <path d="M76 198 q 14 -18 34 -22" />
        <path d="M86 192 q 4 -10 12 -12" />
        <path d="M244 200 q -14 -16 -30 -18" />
      </g>
      {[
        [92, 182],
        [100, 178],
        [108, 176],
        [232, 186],
        [224, 184],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.2" fill={i % 2 ? '#faf6ef' : '#c89a63'} />
      ))}

      {/* candles */}
      {candles.map((c) => (
        <g key={c.ch}>
          <text
            x={c.x}
            y="210"
            textAnchor="middle"
            fontFamily="Cormorant Garamond, Georgia, serif"
            fontWeight="600"
            fontSize="104"
            style={{ fontVariantNumeric: 'lining-nums', fontFeatureSettings: '"lnum" 1' }}
            fill="url(#candleFill)"
            stroke="#b48a57"
            strokeWidth="1.2"
          >
            {c.ch}
          </text>
          <line x1={c.wick[0]} y1={c.wick[1]} x2={c.wick[0] + 1} y2={c.wick[1] - 9} stroke="#2a2223" strokeWidth="2" strokeLinecap="round" />
          <circle data-wick-ember cx={c.wick[0] + 1} cy={c.wick[1] - 9} r="1.8" fill="#ff8a3c" opacity="0" />
          {/* smoke */}
          <path
            data-smoke
            d={`M${c.wick[0] + 1} ${c.wick[1] - 10} c -8 -12, 10 -20, 0 -34 s -10 -24, 4 -40`}
            fill="none"
            stroke="#d9cfc3"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray="120"
            opacity="0"
            filter="url(#blur6)"
          />
          {/* flame */}
          <g transform={`translate(${c.wick[0] + 1} ${c.wick[1] - 7})`}>
            <g data-flame-wrap>
              <g data-flame>
                <g className={c.ch === '8' ? 'flame flame-b' : 'flame'}>
                  <ellipse cx="0" cy="-2" rx="4" ry="3" fill="#6b80c4" opacity=".55" />
                  <path d="M0 -40 C 8 -26, 11 -12, 0 0 C -11 -12, -8 -26, 0 -40 Z" fill="url(#flameG)" />
                  <path d="M0 -20 C 4 -13, 5 -6, 0 -1 C -5 -6, -4 -13, 0 -20 Z" fill="#fffbea" opacity=".9" />
                </g>
              </g>
            </g>
          </g>
        </g>
      ))}
    </svg>
  )
}
