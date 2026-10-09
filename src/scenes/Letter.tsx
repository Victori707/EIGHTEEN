import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { site } from '../content/siteContent'
import { SmartImage, Sprig } from '../components/ui'
import { useGsap } from '../lib/useGsap'
import { prefersReducedMotion, vibrate } from '../lib/util'
import { audio, sfx } from '../lib/audio'

type Phase = 'sealed' | 'opening' | 'reading'

export default function Letter() {
  const root = useRef<HTMLElement>(null)
  const [phase, setPhase] = useState<Phase>('sealed')

  useGsap(root, () => {
    // the music gets quieter while the letter is on screen
    ScrollTrigger.create({
      trigger: '[data-letter]',
      start: 'top 70%',
      end: 'bottom 30%',
      onToggle: (self) => audio.letter(self.isActive),
    })
    if (prefersReducedMotion()) return
    // calm: one slow reveal, nothing else moves
    gsap.from('[data-ltitle] > span', { yPercent: 110, stagger: 0.12, duration: 1.3, ease: 'power4.out', scrollTrigger: { trigger: '[data-letter]', start: 'top 65%' } })
    gsap.from('[data-lphoto]', { clipPath: 'inset(0 0 100% 0)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: '[data-letter]', start: 'top 60%' } })
    gsap.from('[data-env]', { y: 60, opacity: 0, duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: '[data-letter]', start: 'top 50%' } })
  })

  useEffect(() => () => audio.letter(false), [])

  const open = () => {
    if (phase !== 'sealed') return
    setPhase('opening')
    const el = root.current!
    const q = (s: string) => el.querySelector(s)
    if (prefersReducedMotion()) {
      setPhase('reading')
      return
    }
    sfx.seal()
    vibrate(20)
    gsap
      .timeline({ onComplete: () => setPhase('reading') })
      .to(q('[data-seal]'), { scale: 1.12, duration: 0.15, ease: 'power2.out' })
      .to(q('[data-seal-l]'), { x: -26, y: 90, rotation: -50, opacity: 0, duration: 0.8, ease: 'power2.in' })
      .to(q('[data-seal-r]'), { x: 30, y: 110, rotation: 40, opacity: 0, duration: 0.8, ease: 'power2.in' }, '<')
      .to(q('[data-flap]'), { rotateX: 180, duration: 0.8, ease: 'power2.inOut' }, '-=0.55')
      .set(q('[data-flap]'), { zIndex: 1 }, '-=0.4')
      .add(() => sfx.paper(), '-=0.1')
      .to(q('[data-sheet]'), { yPercent: -62, duration: 0.9, ease: 'power3.inOut' })
      .to(q('[data-env]'), { y: 60, duration: 0.9, ease: 'power3.inOut' }, '<')
      .to(q('[data-env-body]'), { y: 260, opacity: 0, duration: 0.6, ease: 'power2.in' }, '+=0.1')
      .to(q('[data-sheet]'), { scale: 1.08, opacity: 0, duration: 0.5, ease: 'power2.in' }, '<0.15')
  }

  const close = () => {
    sfx.paper()
    const el = root.current!
    const finish = () => {
      setPhase('sealed')
      const top = el.querySelector<HTMLElement>('[data-letter]')
      if (top) window.scrollTo({ top: top.getBoundingClientRect().top + window.scrollY - 40 })
    }
    if (prefersReducedMotion()) return finish()
    gsap.to(el.querySelector('[data-read]'), { y: 60, opacity: 0, duration: 0.5, ease: 'power2.in', onComplete: finish })
  }

  return (
    <section ref={root} className="relative bg-paper-2 text-ink" aria-label="Письмо">
      <div data-letter className="relative px-5 pb-32 pt-28 wide:px-[6vw] wide:pb-40 wide:pt-32">
        <div className="grid gap-12 wide:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] wide:gap-[5vw]">
          {/* left: a quiet title and one photograph */}
          <div className="relative">
            <div className="flex items-center gap-3 text-wine">
              <span className="label">No.06</span>
              <span className="hairline w-12" />
              <span className="jp text-[14px]">手紙</span>
            </div>
            <h2 data-ltitle className="display mt-5 text-wine">
              <span className="mask">
                <span className="text-[clamp(48px,11vw,104px)] italic">Письмо</span>
              </span>
              <span className="mask">
                <span className="text-[clamp(48px,11vw,104px)] italic text-ink">для тебя.</span>
              </span>
            </h2>
            <p className="mt-5 max-w-[300px] text-[15px] leading-snug text-ink/55">
              {phase === 'reading' ? 'Можно не торопиться.' : 'Нажми на сургучную печать.'}
            </p>
            <figure data-lphoto className="relative mt-10 hidden w-[min(22vw,300px)] bg-white p-2 pb-8 shadow-[0_20px_40px_-24px_rgba(0,0,0,.45)] wide:block" style={{ rotate: '-3deg' }}>
              <div className="aspect-[3/4] overflow-hidden">
                <SmartImage src={site.photos.letter.src} alt={site.photos.letter.alt} className="h-full w-full object-cover" />
              </div>
              <figcaption className="absolute bottom-2 left-3 font-display text-[15px] italic text-ink/60">{site.recipient.nickname}</figcaption>
            </figure>
          </div>

          {/* right: envelope → letter, in place */}
          <div className="relative flex min-h-[340px] justify-center wide:justify-start">
            {phase !== 'reading' ? <Envelope onOpen={open} disabled={phase !== 'sealed'} /> : <Reading onClose={close} />}
          </div>
        </div>
      </div>
    </section>
  )
}

function Envelope({ onOpen, disabled }: { onOpen: () => void; disabled: boolean }) {
  return (
    <div data-env className="relative w-[min(88vw,520px)] wide:mt-10">
      <div data-env-body className="relative aspect-[1.45] [perspective:1200px]">
        {/* back of the envelope */}
        <div className="absolute inset-0 bg-[#e9e0d1] shadow-[0_30px_60px_-24px_rgba(0,0,0,.6)]" />
        {/* the letter sheet inside */}
        <div data-sheet className="absolute inset-x-[6%] top-[6%] z-[2] h-[90%] bg-paper-2 px-5 pt-4 text-wine">
          <div className="flex items-center justify-between">
            <span className="label text-[8px]">A letter for you</span>
            <span className="jp text-[10px]">手紙</span>
          </div>
          <div className="mt-3 font-display text-[22px] italic">{site.letter.greeting}</div>
          <div className="mt-2 space-y-[7px]">
            {[90, 76, 84, 60].map((w, i) => (
              <div key={i} className="h-[2px] bg-ink/10" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
        {/* front pocket */}
        <svg viewBox="0 0 290 200" preserveAspectRatio="none" className="absolute inset-0 z-[3] h-full w-full" aria-hidden>
          <path d="M0 0 L145 112 L290 0 V200 H0 Z" fill="#faf6ef" />
          <path d="M0 200 L120 96 M290 200 L170 96" stroke="#b8a798" strokeWidth=".7" fill="none" />
          <path d="M0 0 L145 112 L290 0" stroke="#d6c9b6" strokeWidth=".7" fill="none" />
          <text x="22" y="184" fontFamily="JetBrains Mono, monospace" fontSize="7" letterSpacing="2" fill="#b8a798">
            TO: {site.recipient.nickname.toUpperCase()} · PAR AVION · 10.10
          </text>
        </svg>
        {/* flap */}
        <div data-flap className="absolute inset-x-0 top-0 z-[4] h-[60%] origin-top [transform-style:preserve-3d]">
          <svg viewBox="0 0 290 120" preserveAspectRatio="none" className="absolute inset-0 h-full w-full [backface-visibility:hidden]" aria-hidden>
            <path d="M0 0 H290 L152 114 Q145 120 138 114 Z" fill="#f3ecdf" stroke="#d6c9b6" strokeWidth=".7" />
          </svg>
          <svg viewBox="0 0 290 120" preserveAspectRatio="none" className="absolute inset-0 h-full w-full [backface-visibility:hidden] [transform:rotateX(180deg)]" aria-hidden>
            <path d="M0 0 H290 L152 114 Q145 120 138 114 Z" fill="#e2d7c6" />
          </svg>
        </div>
        {/* wax seal */}
        {/* wrapper owns the centering transform; GSAP only animates the inner button (the seal used to jump) */}
        <div className="absolute left-1/2 top-[60%] z-[5] h-[76px] w-[76px] -translate-x-1/2 -translate-y-1/2">
          <button type="button" data-seal onClick={onOpen} disabled={disabled} className="relative h-full w-full rounded-full" aria-label="Сломать печать и открыть письмо">
            <WaxHalf side="l" />
            <WaxHalf side="r" />
          </button>
        </div>
      </div>
    </div>
  )
}

function WaxHalf({ side }: { side: 'l' | 'r' }) {
  const clip = side === 'l' ? 'polygon(0 0, 52% 0, 46% 30%, 55% 52%, 44% 74%, 50% 100%, 0 100%)' : 'polygon(52% 0, 100% 0, 100% 100%, 50% 100%, 44% 74%, 55% 52%, 46% 30%)'
  return (
    <span {...{ [`data-seal-${side}`]: true }} className="absolute inset-0" style={{ clipPath: clip }}>
      <svg viewBox="-40 -40 80 80" className="h-full w-full drop-shadow-[0_4px_6px_rgba(0,0,0,.35)]">
        <defs>
          <radialGradient id={`wax-${side}`} cx=".38" cy=".32">
            <stop offset="0" stopColor="#8f3248" />
            <stop offset=".6" stopColor="#651f32" />
            <stop offset="1" stopColor="#3f1220" />
          </radialGradient>
        </defs>
        <path d="M0 -36 C14 -38 24 -30 30 -20 C38 -12 37 4 33 14 C30 26 18 36 4 35 C-8 38 -22 33 -30 22 C-38 12 -37 -6 -32 -16 C-26 -30 -14 -35 0 -36Z" fill={`url(#wax-${side})`} />
        <circle r="22" fill="none" stroke="#3f1220" strokeWidth="1.2" opacity=".8" />
        <circle r="19" fill="none" stroke="#a54a60" strokeWidth=".6" opacity=".6" />
        <text y="8" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="600" fontSize="24" fill="#c89a63">
          18
        </text>
      </svg>
    </span>
  )
}

function Reading({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const L = site.letter
  useGsap(ref, () => {
    if (prefersReducedMotion()) return
    gsap.from('[data-read]', { y: 80, opacity: 0, rotate: 1.5, duration: 1, ease: 'power3.out' })
    gsap.from('[data-p]', { y: 14, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power2.out', delay: 0.4 })
  })
  return (
    <div ref={ref} className="relative w-full max-w-[680px]">
      <article data-read className="relative bg-white px-6 pb-12 pt-6 text-ink shadow-[0_30px_70px_-34px_rgba(23,21,23,.4)] wide:px-14 wide:pt-10">
        <div className="pointer-events-none absolute inset-[8px] border border-wine/15" />
        <div className="flex items-center gap-3 text-wine">
          <span className="label">A letter for you</span>
          <span className="hairline flex-1" />
          <span className="jp text-[12px]">手紙</span>
        </div>
        <div className="label mt-2 text-[9px] text-ink/45">{site.recipient.birthday}</div>
        <h2 className="display mt-6 text-[clamp(48px,14vw,72px)] italic text-wine" data-p>
          {L.greeting}
        </h2>
        <div className="mt-5 space-y-5">
          {L.paragraphs.map((p, i) => (
            <p key={i} data-p className={`font-display text-[clamp(19px,5.4vw,22px)] font-medium leading-[1.45] ${i === 0 ? 'text-wine' : ''}`}>
              {p}
            </p>
          ))}
        </div>
        <div className="mt-10 flex items-end justify-between" data-p>
          <Sprig className="h-28 -rotate-12 text-gold" />
          <div className="text-right">
            <div className="font-display text-[20px] italic text-ink/70">{L.signoff}</div>
            <div className="display mt-1 text-[44px] italic text-wine">{L.signature}</div>
          </div>
        </div>
      </article>
      <div className="mt-8 flex justify-center wide:justify-start">
        <button type="button" onClick={onClose} className="btn-pill border-wine/40 text-wine">
          Сложить обратно в конверт
        </button>
      </div>
    </div>
  )
}
