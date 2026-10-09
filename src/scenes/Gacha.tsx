import { useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { site, type GachaPrize } from '../content/siteContent'
import { RegMarks, SmartImage, Sprig, Stamp } from '../components/ui'
import { useGsap } from '../lib/useGsap'
import { createSequence, prefersReducedMotion, rand, vibrate } from '../lib/util'
import { sfx } from '../lib/audio'
import { confetti } from '../lib/confetti'

type Phase = 'ready' | 'turning' | 'dropped' | 'opening' | 'revealed'
const CAP_COLORS = ['#681f32', '#c89a63', '#b8a798', '#171517', '#f5f0e8']

// capsule pile inside the window (viewBox coords)
const PILE: [number, number][] = [
  [86, 196], [130, 200], [174, 198], [218, 196],
  [106, 162], [150, 166], [196, 160], [238, 168],
  [126, 128], [172, 130], [216, 132], [80, 138],
]

export default function Gacha() {
  const root = useRef<HTMLElement>(null)
  const capsule = useRef<HTMLButtonElement>(null)
  // prizes come out in the order of the list, so the personal ones are never lost to randomness
  const bag = useMemo(() => createSequence(site.gacha), [])
  const [phase, setPhase] = useState<Phase>('ready')
  const [prize, setPrize] = useState<GachaPrize | null>(null)
  const [capColor, setCapColor] = useState(CAP_COLORS[0])
  const [left, setLeft] = useState(site.gacha.length)
  const [pulls, setPulls] = useState(0)
  const angle = useRef(0)
  const drag = useRef<{ a0: number; acc: number; last: number; clicks: number } | null>(null)
  const confettiBox = useRef<HTMLDivElement>(null)

  useGsap(root, () => {
    if (prefersReducedMotion()) return
    const st = { trigger: root.current, start: 'top 65%' }
    gsap.from('[data-gjp] > span', { yPercent: 40, opacity: 0, stagger: 0.08, duration: 0.7, ease: 'power4.out', scrollTrigger: st })
    gsap.from('[data-gphoto]', { x: 80, rotate: 18, opacity: 0, duration: 1, ease: 'back.out(1.4)', scrollTrigger: st })
    const mt = { trigger: '[data-machine]', start: 'top 85%' }
    gsap.from('[data-machine]', { y: 90, opacity: 0, duration: 1.1, ease: 'back.out(1.2)', scrollTrigger: mt })
    gsap.from('[data-cap]', { y: -120, opacity: 0, duration: 0.9, stagger: 0.04, ease: 'bounce.out', delay: 0.4, scrollTrigger: mt })
  })

  const setHandle = (deg: number) => {
    angle.current = deg
    const h = root.current?.querySelector('[data-handle]')
    if (h) gsap.set(h, { rotation: deg, svgOrigin: '200 318' })
  }

  const jiggle = (amt = 1) => {
    root.current?.querySelectorAll('[data-cap]').forEach((c) => {
      gsap.to(c, { x: rand(-3, 3) * amt, y: rand(-4, 1) * amt, rotation: rand(-14, 14) * amt, duration: 0.18, ease: 'power1.out', overwrite: 'auto' })
    })
  }

  /** Довернуть ручку до конца оборота с «механическим сопротивлением». */
  const finishTurn = () => {
    setPhase('turning')
    const reduced = prefersReducedMotion()
    const start = angle.current
    const target = 360
    const steps = Math.max(1, Math.ceil((target - start) / 90))
    const tl = gsap.timeline({ onComplete: dispense })
    const obj = { a: start }
    for (let i = 1; i <= steps; i++) {
      const to = Math.min(target, start + ((target - start) * i) / steps)
      tl.to(obj, {
        a: to,
        duration: reduced ? 0.01 : 0.38,
        ease: 'power2.inOut',
        onStart: () => {
          sfx.ratchet(4, 0.3)
          vibrate(8)
          jiggle()
        },
        onUpdate: () => setHandle(obj.a),
      }).to({}, { duration: reduced ? 0 : 0.08 })
    }
  }

  const dispense = () => {
    setHandle(0)
    const p = bag.next()
    setPrize(p)
    setCapColor(p.kind === 'prize' && p.accent ? p.accent : CAP_COLORS[Math.floor(Math.random() * CAP_COLORS.length)])
    setLeft(bag.left)
    setPulls((n) => n + 1)
    setPhase('dropped')
    sfx.clunk()
    jiggle(0.4)
    requestAnimationFrame(() => {
      const c = capsule.current
      if (!c) return
      if (prefersReducedMotion()) {
        gsap.set(c, { x: 0, y: 0, rotation: 0, opacity: 1 })
        return
      }
      gsap
        .timeline()
        .set(c, { x: -70, y: -150, rotation: -60, opacity: 0, scale: 0.85 })
        .to(c, { opacity: 1, duration: 0.05 })
        .to(c, { y: 0, scale: 1, duration: 0.9, ease: 'bounce.out' }, '<')
        .to(c, { x: 0, rotation: 300, duration: 1.1, ease: 'power2.out' }, '<')
        .add(() => sfx.bounce(0), 0.35)
        .add(() => sfx.bounce(1), 0.68)
        .add(() => sfx.bounce(2), 0.86)
    })
  }

  const openCapsule = () => {
    if (phase !== 'dropped') return
    setPhase('opening')
    sfx.pop()
    vibrate([10, 30, 20])
    const c = capsule.current!
    const done = () => {
      setPhase('revealed')
      if (confettiBox.current && prize?.kind === 'prize') confetti(confettiBox.current, { count: 30, from: 'center' })
    }
    if (prefersReducedMotion()) return done()
    gsap
      .timeline({ onComplete: done })
      .to(c, { rotation: 360, duration: 0.25, ease: 'power2.out' })
      .to(c, { scale: 1.15, duration: 0.12, yoyo: true, repeat: 1 })
      .to(c.querySelector('[data-top]'), { y: -46, x: -18, rotation: -38, duration: 0.5, ease: 'power3.out' })
      .to(c.querySelector('[data-bottom]'), { y: 18, x: 8, rotation: 12, duration: 0.5, ease: 'power3.out' }, '<')
      .fromTo(c.querySelector('[data-rays]'), { scale: 0.2, opacity: 0 }, { scale: 1.4, opacity: 1, duration: 0.5, ease: 'power2.out' }, '<')
  }

  const again = () => {
    sfx.tap()
    setPhase('ready')
    setPrize(null)
    if (bag.left === 0) {
      // the machine gets refilled and starts from the top of the list again
      bag.reset()
      setLeft(site.gacha.length)
      requestAnimationFrame(() => {
        if (!prefersReducedMotion()) gsap.from('[data-cap]', { y: -120, opacity: 0, duration: 0.9, stagger: 0.04, ease: 'bounce.out' })
      })
    }
  }

  // ---- handle: tap = auto turn, drag clockwise = manual turn ----
  const center = (el: Element) => {
    const svg = el.closest('svg')!.getBoundingClientRect()
    return { cx: svg.left + (200 / 300) * svg.width, cy: svg.top + (318 / 440) * svg.height }
  }
  const angAt = (e: React.PointerEvent) => {
    const { cx, cy } = center(e.currentTarget)
    return (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI
  }
  const onHandleDown = (e: React.PointerEvent) => {
    if (phase !== 'ready') return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { a0: angAt(e), acc: 0, last: angAt(e), clicks: 0 }
  }
  const onHandleMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const a = angAt(e)
    let delta = a - d.last
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360
    d.last = a
    // only clockwise, with resistance
    d.acc = Math.max(0, Math.min(359, d.acc + Math.max(-2, delta) * 0.85))
    setHandle(d.acc)
    const c = Math.floor(d.acc / 45)
    if (c > d.clicks) {
      d.clicks = c
      sfx.ratchet(1, 0.01)
      vibrate(6)
      jiggle(0.6)
    }
  }
  const onHandleUp = () => {
    const d = drag.current
    drag.current = null
    if (!d || phase !== 'ready') return
    if (d.acc >= 250 || d.acc < 12) finishTurn()
    else {
      const o = { a: d.acc }
      gsap.to(o, { a: 0, duration: 0.5, ease: 'back.out(2)', onUpdate: () => setHandle(o.a) })
    }
  }

  const visibleCaps = Math.min(PILE.length, left)

  return (
    <section ref={root} className="relative overflow-clip bg-paper pb-24 pt-24 text-ink wide:pb-28 wide:pt-28" aria-label="Гачапон">
      <div ref={confettiBox} className="pointer-events-none absolute inset-0 z-30 overflow-hidden" aria-hidden />
      <RegMarks className="text-ink/30" />
      <div className="halftone pointer-events-none absolute -right-10 bottom-0 h-[60%] w-[46%] text-wine/10 [mask-image:linear-gradient(315deg,#000,transparent_70%)]" aria-hidden />

      {/* poster header: giant ガチャ + the instruction */}
      <div className="relative px-5 wide:px-[5vw]">
        <div className="flex items-center gap-3">
          <span className="label">No.05 — gachapon</span>
          <span className="hairline w-12" />
          <span className="label">¥18 / 1 play</span>
        </div>
        <div className="mt-2 flex flex-wrap items-end gap-x-[3vw] gap-y-2 wide:flex-nowrap">
          <div data-gjp className="poster flex shrink-0 text-[clamp(84px,21vw,300px)] leading-[0.95] text-wine wide:text-[15vw]" aria-label="Гача (по-японски)">
            {['ガ', 'チ', 'ャ'].map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="relative mt-10 grid gap-10 px-5 wide:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] wide:items-start wide:gap-[5vw] wide:px-[6vw]">
        <Sprig className="pointer-events-none absolute left-1 top-[10%] h-40 -rotate-[24deg] text-gold/60" />
        <div className="relative flex flex-col items-center">
          <div data-machine className="relative w-[min(80vw,340px)] wide:w-[min(30vw,440px)]">
            <svg viewBox="0 0 300 440" className="block w-full overflow-visible" role="img" aria-label="Автомат с капсулами">
              <defs>
                <linearGradient id="gBody" x1="0" x2="1">
                  <stop offset="0" stopColor="#4e1626" />
                  <stop offset=".18" stopColor="#651f32" />
                  <stop offset=".8" stopColor="#651f32" />
                  <stop offset="1" stopColor="#3f1220" />
                </linearGradient>
                <linearGradient id="gGlass" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#ffffff" stopOpacity=".55" />
                  <stop offset=".5" stopColor="#faf6ef" stopOpacity=".18" />
                  <stop offset="1" stopColor="#b8a798" stopOpacity=".3" />
                </linearGradient>
                <radialGradient id="gKnob" cx=".35" cy=".3">
                  <stop offset="0" stopColor="#ffffff" />
                  <stop offset="1" stopColor="#e3d8c6" />
                </radialGradient>
                <filter id="gShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" />
                </filter>
              </defs>

              <ellipse cx="150" cy="430" rx="126" ry="9" fill="#1b1919" opacity=".25" filter="url(#gShadow)" />
              {/* cap */}
              <rect x="34" y="14" width="232" height="46" rx="10" fill="url(#gBody)" />
              <rect x="56" y="27" width="188" height="20" fill="#f0e9dd" />
              <text x="150" y="41" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" letterSpacing="4" fill="#651f32">
                GACHAPON · 18
              </text>
              {/* window */}
              <rect x="44" y="60" width="212" height="168" fill="#efe7da" />
              <g>
                {PILE.slice(0, visibleCaps).map(([x, y], i) => (
                  <g key={i} data-cap style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
                    <circle cx={x} cy={y} r="22" fill="#faf6ef" fillOpacity=".75" stroke="#b8a798" strokeWidth=".8" />
                    <path d={`M${x - 22} ${y} a22 22 0 0 1 44 0z`} fill={CAP_COLORS[i % CAP_COLORS.length]} transform={`rotate(${(i * 47) % 360} ${x} ${y})`} />
                    <circle cx={x - 8} cy={y - 9} r="4" fill="#fff" opacity=".5" />
                  </g>
                ))}
              </g>
              <rect x="44" y="60" width="212" height="168" fill="url(#gGlass)" stroke="#b8a798" strokeWidth="1" />
              <rect x="56" y="70" width="10" height="148" rx="5" fill="#fff" opacity=".45" />
              <rect x="72" y="70" width="4" height="148" rx="2" fill="#fff" opacity=".3" />
              {/* body */}
              <rect x="30" y="228" width="240" height="196" rx="8" fill="url(#gBody)" />
              <rect x="30" y="228" width="240" height="6" fill="#3f1220" />
              {/* label panel */}
              <rect x="50" y="252" width="96" height="84" fill="#f0e9dd" />
              <rect x="54" y="256" width="88" height="76" fill="none" stroke="#651f32" strokeWidth=".6" />
              <text x="98" y="284" textAnchor="middle" fontFamily="Noto Serif JP, serif" fontSize="20" fill="#651f32">ガチャ</text>
              <line x1="64" y1="296" x2="132" y2="296" stroke="#651f32" strokeWidth=".5" />
              <text x="98" y="312" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8" letterSpacing="1.5" fill="#651f32">1 PLAY</text>
              <text x="98" y="326" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontSize="13" fill="#c89a63">¥18</text>
              {/* coin slot */}
              <rect x="226" y="252" width="22" height="30" rx="3" fill="#3f1220" />
              <rect x="235" y="257" width="4" height="20" rx="2" fill="#1b1919" />
              {/* handle base */}
              <circle cx="200" cy="318" r="40" fill="#3f1220" />
              <circle cx="200" cy="318" r="36" fill="url(#gKnob)" />
              <circle cx="200" cy="318" r="36" fill="none" stroke="#c89a63" strokeWidth="1" />
              {/* rotating handle */}
              <g data-handle>
                <rect x="166" y="310" width="68" height="16" rx="8" fill="#c89a63" />
                <rect x="166" y="310" width="68" height="6" rx="3" fill="#fff" opacity=".35" />
                <circle cx="200" cy="318" r="6" fill="#a77d4c" />
              </g>
              <text x="200" y="372" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="7" letterSpacing="2" fill="#f0e9dd" opacity=".7">
                TURN ⟳
              </text>
              {/* outlet */}
              <rect x="56" y="356" width="84" height="50" rx="8" fill="#1b1919" />
              <path d="M60 362 h76 v14 a6 6 0 0 1 -6 6 h-64 a6 6 0 0 1 -6 -6z" fill="#3f1220" />
              <text x="98" y="398" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="6" letterSpacing="2" fill="#b8a798">OUT</text>
              {/* hit area for the handle */}
              <circle
                cx="200"
                cy="318"
                r="44"
                fill="transparent"
                className={phase === 'ready' ? 'cursor-grab' : ''}
                style={{ touchAction: 'none' }}
                onPointerDown={onHandleDown}
                onPointerMove={onHandleMove}
                onPointerUp={onHandleUp}
                onPointerCancel={onHandleUp}
              />
            </svg>
            {phase === 'ready' && (
              <button
                type="button"
                onClick={finishTurn}
                className="sr-only focus:not-sr-only focus:absolute focus:right-0 focus:top-[70%] focus:rounded-full focus:bg-paper focus:px-3 focus:py-2 focus:text-wine"
              >
                Повернуть ручку
              </button>
            )}
          </div>

          {/* tray */}
          <div className="relative -mt-2 h-[96px] w-[min(80vw,340px)] wide:w-[min(30vw,440px)]">
            <div className="absolute inset-x-[6%] bottom-0 h-[2px] bg-wine/25" />
            {(phase === 'dropped' || phase === 'opening') && (
              <button
                ref={capsule}
                type="button"
                onClick={openCapsule}
                className="absolute bottom-[2px] left-[38%] h-[78px] w-[78px] touch-manipulation"
                aria-label="Открыть капсулу"
              >
                <span data-rays className="pointer-events-none absolute inset-[-40px] opacity-0" style={{ background: 'repeating-conic-gradient(from 0deg, rgba(200,154,99,.35) 0 8deg, transparent 8deg 22deg)', maskImage: 'radial-gradient(circle, #000 25%, transparent 70%)', WebkitMaskImage: 'radial-gradient(circle, #000 25%, transparent 70%)' }} />
                <span data-bottom className="absolute inset-x-0 bottom-0 h-1/2 rounded-b-full border border-taupe bg-[#faf6ef]/90" />
                <span data-top className="absolute inset-x-0 top-0 h-1/2 rounded-t-full" style={{ background: capColor, boxShadow: 'inset 6px 6px 10px rgba(255,255,255,.25)' }} />
                <span className="pointer-events-none absolute left-[22%] top-[14%] h-3 w-3 rounded-full bg-white/50" />
              </button>
            )}
          </div>
          {/* two clear steps, the current one is highlighted */}
          <ol className="mt-4 flex flex-wrap justify-center gap-2" role="status" aria-live="polite">
            {[
              ['1', 'крути ручку', phase === 'ready' || phase === 'turning'],
              ['2', 'жми на капсулу', phase === 'dropped' || phase === 'opening'],
            ].map(([n, t, on]) => (
              <li
                key={n as string}
                className={`flex items-center gap-2 rounded-full border-[1.5px] px-3 py-1.5 text-[13px] transition-colors ${on ? 'border-ink bg-ink text-paper-2' : 'border-ink/30 text-ink/50'}`}
              >
                <span className="poster text-[12px]">{n}</span>
                {t}
              </li>
            ))}
          </ol>

          <div className="label mt-4 flex w-[min(80vw,340px)] justify-between text-[9px] text-ink/60 wide:w-[min(30vw,440px)]">
            <span>Pulls · {String(pulls).padStart(2, '0')}</span>
            <span>
              В автомате · {String(left).padStart(2, '0')} / {String(site.gacha.length).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* the prize appears right here, next to the machine */}
        <div className="relative min-h-[300px] wide:min-h-[560px] wide:pt-16">
          {phase === 'revealed' && prize ? (
            <PrizeCard key={pulls} prize={prize} color={capColor} onAgain={again} lastOne={left === 0} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-6 wide:items-start">
              <figure data-gphoto className="relative w-[min(74vw,420px)] wide:w-[min(30vw,420px)] bg-paper-2 p-2 pb-3 shadow-[0_30px_50px_-24px_rgba(0,0,0,.55)]" style={{ rotate: '4deg' }}>
                <div className="aspect-[4/3] overflow-hidden">
                  <SmartImage src={site.photos.gacha.src} alt={site.photos.gacha.alt} className="h-full w-full object-cover" />
                </div>
                <span className="tape -left-5 top-4 -rotate-[30deg]" />
                <figcaption className="label mt-2 text-[9px] text-ink/50">{site.photos.gacha.caption}</figcaption>
                <div className="absolute -bottom-8 -right-4 wide:-right-8" style={{ rotate: '-10deg' }}>
                  <Stamp color="verm" className="relative h-[96px] w-[96px] bg-paper-2">
                    <span className="poster text-[13px] leading-tight">
                      RARE
                      <br />
                      INSIDE
                    </span>
                  </Stamp>
                </div>
              </figure>
              <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 wide:justify-start">
                <span className="poster text-[56px] leading-none tabular-nums text-wine">{String(left).padStart(2, '0')}</span>
                <span className="label text-ink/70">капсул в автомате · одна редкая</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function PrizeCard({ prize, color, onAgain, lastOne }: { prize: GachaPrize; color: string; onAgain: () => void; lastOne: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useGsap(ref, () => {
    if (prefersReducedMotion()) return
    gsap.from('[data-card]', { scale: 0.5, rotate: -10, x: -80, y: 60, opacity: 0, duration: 0.8, ease: 'back.out(1.5)' })
    gsap.from('[data-c]', { opacity: 0, y: 10, stagger: 0.07, duration: 0.5, delay: 0.35 })
  })

  return (
    <div ref={ref} className="flex flex-col items-start" role="status" aria-live="polite" aria-label={prize.title}>
      <div data-card className="relative w-full max-w-[420px]">
        {prize.kind === 'prize' ? (
          <div
            className="relative bg-wine px-6 pb-6 pt-5 text-paper"
            style={{
              maskImage: 'radial-gradient(circle 12px at 0 62%, transparent 98%, #000), radial-gradient(circle 12px at 100% 62%, transparent 98%, #000)',
              maskComposite: 'intersect',
              WebkitMaskImage: 'radial-gradient(circle 12px at 0 62%, transparent 98%, #000), radial-gradient(circle 12px at 100% 62%, transparent 98%, #000)',
              WebkitMaskComposite: 'source-in',
            }}
          >
            {prize.accent && <div className="absolute inset-y-0 left-0 w-[6px]" style={{ background: prize.accent }} />}
            <div className="flex items-center justify-between" data-c>
              <span className="label flex items-center gap-2 text-gold">
                {prize.accent && <span className="inline-block h-2 w-2 rounded-full" style={{ background: prize.accent }} />}
                {prize.rarity ?? 'Prize'}
              </span>
              <span className="label text-[9px] opacity-60">№ 0018</span>
            </div>
            <div className="display mt-3 text-[clamp(64px,18vw,96px)] italic text-gold" data-c>
              {prize.label}
            </div>
            <div className="mt-2 font-display text-[24px] font-medium leading-tight opacity-85" data-c>
              {prize.title}
            </div>
            <p className="mt-1 font-display text-[clamp(28px,7.6vw,36px)] font-medium italic leading-tight" data-c>
              {prize.text}
            </p>
            <div className="my-4 border-t border-dashed border-paper/40" />
            {prize.note && (
              <p className="label text-[10px] normal-case tracking-[0.06em] opacity-70" data-c>
                {prize.note}
              </p>
            )}
          </div>
        ) : prize.kind === 'photo' ? (
          <div className="bg-paper-2 p-3 pb-5 shadow-2xl" style={{ rotate: '-2deg' }}>
            <div className="aspect-square overflow-hidden" data-c>
              <SmartImage src={prize.image} alt={prize.title} className="h-full w-full object-cover" />
            </div>
            <div className="mt-3 flex items-center justify-between px-1" data-c>
              <span className="label text-wine">{prize.label}</span>
              <span className="font-display text-[22px] italic">{prize.title}</span>
            </div>
            <p className="mt-1 px-1 font-display text-[16px] italic text-ink/60" data-c>
              {prize.text}
            </p>
          </div>
        ) : (
          <div className="relative overflow-hidden bg-paper-2 px-6 pb-7 pt-5 shadow-2xl">
            <div className="absolute inset-x-0 top-0 h-2" style={{ background: color }} />
            {prize.kind === 'wish' && <Sprig className="absolute -right-3 bottom-0 h-40 rotate-[18deg] text-gold/60" />}
            <div className="flex items-center gap-3 text-wine" data-c>
              <span className="label">{prize.label}</span>
              <span className="hairline flex-1" />
              <span className="jp text-[11px] tracking-[0.3em]">ガチャ</span>
            </div>
            <div className="display mt-4 text-[clamp(32px,9vw,48px)] italic leading-[0.95] text-wine" data-c>
              {prize.title}
            </div>
            <p className="relative mt-4 font-display text-[24px] font-medium leading-snug text-ink" data-c>
              {prize.text}
            </p>
            {prize.note && <p className="relative mt-3 font-display text-[16px] italic text-ink/55">{prize.note}</p>}
          </div>
        )}
      </div>
      <button type="button" onClick={onAgain} className="btn-pill btn-solid mt-8" data-c>
        {lastOne ? 'Перезаправить автомат' : 'Ещё капсулу'}
      </button>
    </div>
  )
}
