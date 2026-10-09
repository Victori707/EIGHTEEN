import { useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { RotateCcw } from 'lucide-react'
import { site } from '../content/siteContent'
import { RegMarks, Stamp } from '../components/ui'
import { OmikujiBox } from '../components/objects'
import { useGsap } from '../lib/useGsap'
import { createBag, prefersReducedMotion, vibrate } from '../lib/util'
import { sfx } from '../lib/audio'

type Fortune = (typeof site.fortunes)[number]
type Phase = 'idle' | 'drawing' | 'open'

export default function Omikuji() {
  const root = useRef<HTMLElement>(null)
  const bag = useMemo(() => createBag(site.fortunes.map((f, i) => ({ ...f, n: i + 1 }))), [])
  const [phase, setPhase] = useState<Phase>('idle')
  const [current, setCurrent] = useState<(Fortune & { n: number }) | null>(null)

  useGsap(root, () => {
    if (prefersReducedMotion()) return
    const st = { trigger: root.current, start: 'top 70%' }
    gsap.from('[data-otitle] [data-w]', { yPercent: 110, opacity: 0, duration: 0.8, stagger: 0.06, ease: 'power4.out', scrollTrigger: st })
    gsap.from('[data-ojp] > span', { opacity: 0, x: -30, duration: 0.6, stagger: 0.08, scrollTrigger: st })
    gsap.from('[data-hanko]', { scale: 2.4, rotate: -50, opacity: 0, duration: 0.45, ease: 'power3.in', delay: 0.7, scrollTrigger: st })
    gsap.from('[data-box]', { y: 80, opacity: 0, rotate: -14, duration: 1.3, ease: 'back.out(1.4)', scrollTrigger: { trigger: root.current, start: 'top 55%' } })
  })

  // height changes between box and slip → re-measure everything below

  const draw = () => {
    if (phase === 'drawing') return
    const f = bag.next()
    setCurrent(f)
    setPhase('drawing')
    sfx.shake()
    vibrate([15, 30, 15, 30, 15])
    const el = root.current!
    const box = el.querySelector('[data-box]')
    const stick = el.querySelector('[data-stick]')
    const done = () => {
      setPhase('open')
      sfx.paper()
    }
    if (prefersReducedMotion()) {
      done()
      return
    }
    gsap
      .timeline({ onComplete: done })
      .set(stick, { y: 0, opacity: 1 })
      .to(box, { rotate: 165, duration: 0.6, ease: 'power2.inOut' })
      .to(box, { rotate: '+=14', duration: 0.09, yoyo: true, repeat: 7, ease: 'sine.inOut' })
      .to(box, { y: -12, duration: 0.08, yoyo: true, repeat: 3 }, '<')
      .to(stick, { y: -78, duration: 0.45, ease: 'power3.out' })
      .to(box, { rotate: 180, duration: 0.3 }, '<')
      .add(() => vibrate(20))
      .to({}, { duration: 0.5 })
  }

  const again = () => {
    sfx.tap()
    const el = root.current!
    if (prefersReducedMotion()) {
      setPhase('idle')
      return
    }
    gsap.to(el.querySelector('[data-slip]'), {
      y: 60,
      opacity: 0,
      rotate: -4,
      duration: 0.45,
      ease: 'power2.in',
      onComplete: () => {
        setPhase('idle')
        requestAnimationFrame(() => {
          const box = el.querySelector('[data-box]')
          gsap.set(el.querySelector('[data-stick]'), { y: 0, opacity: 0 })
          gsap.fromTo(box, { rotate: 0, y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'back.out(1.6)', onComplete: draw })
        })
      },
    })
  }

  const words = site.omikuji.title.split(' ')
  return (
    <section ref={root} className="relative overflow-clip bg-paper pb-24 pt-24 text-ink wide:pb-28 wide:pt-28" aria-label="Омикудзи">
      <RegMarks className="text-ink/30" />
      {/* huge vertical おみくじ bleeding off the left edge */}
      <div data-ojp className="poster pointer-events-none absolute -left-[0.08em] top-10 flex flex-col text-[clamp(84px,17vw,260px)] leading-[0.98] text-wine" aria-hidden>
        {['お', 'み', 'く', 'じ'].map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>
      <div className="halftone pointer-events-none absolute right-0 top-0 h-[55%] w-[34%] text-verm/20 [mask-image:linear-gradient(225deg,#000,transparent_65%)]" aria-hidden />

      <div className="relative grid gap-10 pl-[calc(clamp(84px,17vw,260px)*0.95+20px)] pr-5 wide:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] wide:items-start wide:gap-[4vw] wide:pr-[5vw]">
        <div className="relative wide:pt-[4vh]">
          <div className="flex items-center gap-3 text-wine">
            <span className="label">No.03</span>
            <span className="hairline w-12" />
            <span className="jp text-[14px] tracking-[0.3em]">おみくじ</span>
          </div>
          <h2 data-otitle className="poster mt-5 text-[clamp(26px,7.4vw,44px)] leading-[1.12] wide:text-[min(4.1vw,72px)]">
            {words.map((w, i) => (
              <span key={i} className="mask mr-[0.22em] inline-block whitespace-nowrap align-top">
                <span data-w className={`inline-block ${i === words.length - 1 ? 'text-verm' : i === 1 ? 'text-wine' : ''}`}>
                  {w}
                </span>
              </span>
            ))}
          </h2>
          <div data-hanko className="mt-8 inline-block" style={{ rotate: '-8deg' }}>
            <Stamp className="relative h-[92px] w-[92px] wide:h-[112px] wide:w-[112px]">
              <span className="poster text-[40px] leading-none wide:text-[48px]">吉</span>
            </Stamp>
          </div>
        </div>

        <div className="relative flex min-h-[600px] flex-col items-center justify-start wide:min-h-[700px]">
          {phase !== 'open' ? (
            <div className="flex flex-col items-center pt-6">
              <div data-box className="relative w-[min(46vw,240px)]" style={{ transformOrigin: '50% 55%' }}>
                {/* the stick, hidden behind the box until it slides out of the hole */}
                <div
                  data-stick
                  className="absolute left-1/2 top-[14%] h-[54%] w-[7px] -translate-x-1/2 rounded-sm bg-[#d9c29a] opacity-0 shadow-[inset_-1px_0_0_rgba(0,0,0,.15)]"
                  aria-hidden
                >
                  <span className="label absolute left-1/2 top-2 -translate-x-1/2 text-[7px] text-wine [writing-mode:vertical-rl]">{current ? String(current.n).padStart(2, '0') : ''}</span>
                </div>
                <OmikujiBox className="relative block w-full" />
              </div>
              <button type="button" onClick={draw} disabled={phase === 'drawing'} className="btn-pill btn-verm mt-10 disabled:opacity-60">
                {phase === 'drawing' ? 'Трясём…' : site.omikuji.button}
              </button>
            </div>
          ) : (
            current && <Slip f={current} onAgain={again} />
          )}
        </div>
      </div>
    </section>
  )
}

const PANEL = 'w-full bg-paper-2 [backface-visibility:hidden] [-webkit-backface-visibility:hidden]'

function Slip({ f, onAgain }: { f: Fortune & { n: number }; onAgain: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const big = f.rank.length === 2 && f.rank.startsWith('大')

  useGsap(ref, () => {
    if (prefersReducedMotion()) return
    const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } })
    tl.from('[data-slip]', { y: 140, scale: 0.6, rotate: 6, opacity: 0, duration: 0.8, ease: 'power3.out' })
      .fromTo('[data-h2]', { rotateX: -178 }, { rotateX: 0, duration: 0.85 }, '-=0.1')
      .from('[data-ink]', { opacity: 0, y: 8, duration: 0.6, stagger: 0.08, ease: 'power2.out' }, '-=0.3')
      .fromTo('[data-bend]', { rotateX: 9, skewY: -1.2 }, { rotateX: 0, skewY: 0, duration: 1.2, ease: 'elastic.out(1, 0.45)' }, '-=0.5')
      .from('[data-after]', { opacity: 0, y: 12, duration: 0.6 }, '-=0.9')
  })

  return (
    <div ref={ref} className="flex flex-col items-center pt-2">
      <div data-slip className="relative w-full max-w-[340px] [container-type:inline-size] [perspective:1100px]">
        <div data-bend className="relative [transform-style:preserve-3d]">
          {/* panel 1 — header */}
          <div className={`${PANEL} relative h-[190px] border-x border-t border-wine/25 p-5 text-wine`}>
            <div className="absolute inset-[6px] border border-wine/30" />
            <div className="relative flex items-start justify-between" data-ink>
              <span className="jp text-[12px] tracking-[0.35em]">おみくじ</span>
              <span className="label text-[9px]">№ {String(f.n).padStart(2, '0')}</span>
            </div>
            <div className="relative mt-3 flex items-end gap-4" data-ink>
              <span className={`jp font-semibold leading-none ${big ? 'text-[clamp(48px,14vw,68px)]' : 'text-[clamp(52px,15vw,72px)]'}`}>{f.rank}</span>
              <div className="pb-2">
                <div className="label text-[9px] text-gold">Fortune</div>
                <div className="font-display text-[22px] italic leading-tight">{f.rankRu}</div>
              </div>
            </div>
          </div>
          {/* panel 2 — hinged */}
          <div data-h2 className="relative w-full origin-top [transform-style:preserve-3d]">
            <div className={`${PANEL} relative min-h-[190px] border-x border-b border-wine/25 px-[clamp(16px,7cqw,24px)] pb-7 pt-5 shadow-[inset_0_10px_14px_-12px_rgba(27,25,25,.35)]`}>
              <div className="absolute inset-x-[6px] bottom-[6px] top-0 border-x border-b border-wine/30" />
              <p className="relative font-display text-[clamp(15px,6.4cqw,21px)] font-medium italic leading-[1.25] text-ink" data-ink>
                {f.text}
              </p>
            </div>
            <div className={`${PANEL} absolute inset-0 [transform:rotateX(180deg)]`} style={{ background: '#ece3d4' }} />
          </div>
        </div>
      </div>

      <div data-after className="mt-8 flex flex-col items-center gap-3">
        <button type="button" onClick={onAgain} className="btn-pill border-ink/50 text-ink">
          <RotateCcw size={14} strokeWidth={1.5} /> Тянуть ещё
        </button>
      </div>
    </div>
  )
}
