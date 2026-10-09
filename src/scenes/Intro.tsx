import { useRef } from 'react'
import gsap from 'gsap'
import { site } from '../content/siteContent'
import { RegMarks, SmartImage, Stamp } from '../components/ui'
import { useGsap } from '../lib/useGsap'
import { prefersReducedMotion } from '../lib/util'

export function CircleText({ text, size = 104, className = '' }: { text: string; size?: number; className?: string }) {
  const r = size / 2 - 10
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className={className} aria-hidden>
      <defs>
        <path id={`c${size}`} d={`M ${size / 2},${size / 2} m -${r},0 a ${r},${r} 0 1,1 ${r * 2},0 a ${r},${r} 0 1,1 -${r * 2},0`} />
      </defs>
      <text fontFamily="JetBrains Mono, monospace" fontSize="8.4" letterSpacing="2.2" fill="currentColor">
        <textPath href={`#c${size}`}>{text}</textPath>
      </text>
    </svg>
  )
}

/** Разбивает строку на буквы для кинетической типографики. */
function Chars({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={`inline-block whitespace-nowrap ${className}`} aria-label={text}>
      {[...text].map((c, i) => (
        <span key={i} data-ch className="inline-block" aria-hidden>
          {c === ' ' ? ' ' : c}
        </span>
      ))}
    </span>
  )
}

export default function Intro() {
  const root = useRef<HTMLElement>(null)
  const { recipient, intro, photos, tenTen } = site

  useGsap(root, () => {
    if (prefersReducedMotion()) return
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } })
    tl.from('[data-block]', { scaleX: 0, transformOrigin: '100% 50%', duration: 0.9, ease: 'expo.inOut' })
      .from('[data-photo]', { clipPath: 'inset(100% 0 0 0)', duration: 1.2, ease: 'expo.inOut' }, 0.2)
      .from('[data-photo] img', { scale: 1.25, duration: 2, ease: 'power3.out' }, 0.2)
      .from('[data-h] [data-ch]', { yPercent: 110, rotate: 8, opacity: 0, duration: 0.7, stagger: 0.03 }, 0.55)
      .from('[data-jpv] > span', { opacity: 0, y: -20, duration: 0.5, stagger: 0.06 }, 0.9)
      .from('[data-polaroid]', { y: 80, rotate: -30, opacity: 0, duration: 0.9, ease: 'back.out(1.6)' }, 1.1)
      .from('[data-stamp10]', { scale: 2.6, rotate: -60, opacity: 0, duration: 0.45, ease: 'power3.in' }, 1.45)
      .add(() => gsap.fromTo(root.current, { x: -4 }, { x: 0, duration: 0.25, ease: 'elastic.out(3, 0.3)' }), 1.9)
      .from('[data-note]', { opacity: 0, x: -14, duration: 0.6 }, 1.95)
      .from('[data-top], [data-big18]', { opacity: 0, y: 14, duration: 0.8, stagger: 0.08 }, 1.2)
  })


  return (
    <section
      ref={root}
      className="relative isolate flex min-h-[100dvh] flex-col overflow-clip bg-paper text-ink wide:block"
      aria-label="С днём рождения, Лиса!"
    >
      {/* ink block on the right — the poster's second colour field */}
      <div data-block className="absolute inset-y-0 right-0 -z-10 w-full bg-ink wide:w-[44%]" style={{ height: 'min(100%, 38svh)' }} />
      <div data-block className="absolute inset-y-0 right-0 -z-10 hidden w-[44%] bg-ink wide:block" />
      <RegMarks className="text-paper-2/40 wide:text-ink/30" inset={6} />

      {/* outlined 18 — a graphic, not the message */}
      <div
        data-big18
        className="poster pointer-events-none absolute -right-[0.06em] bottom-[-0.12em] -z-10 hidden text-[clamp(160px,26vw,420px)] leading-none text-transparent [-webkit-text-stroke:1.5px_rgba(245,240,232,.22)] wide:block"
        aria-hidden
      >
        18
      </div>

      {/* masthead */}
      <div data-top className="relative z-20 flex items-center justify-between gap-3 px-5 pt-[calc(var(--safe-t)+14px)] text-paper-2 wide:px-[4vw] wide:text-ink">
        <span className="label">Eighteen · {intro.edition}</span>
        <span className="label hidden wide:inline">{intro.issue}</span>
        <span className="label text-verm">{recipient.birthday}</span>
      </div>

      {/* hero photo */}
      <figure
        data-photo
        className="relative z-10 mx-5 mt-4 h-[42svh] min-h-[240px] overflow-hidden bg-paper-2 p-[5px] shadow-[0_30px_60px_-30px_rgba(0,0,0,.7)] wide:absolute wide:right-[8vw] wide:top-[7vh] wide:mx-0 wide:mt-0 wide:h-[min(80vh,62vw)] wide:w-auto wide:p-2"
        style={{ rotate: '1.5deg', aspectRatio: '3 / 4' }}
      >
        <SmartImage eager src={photos.hero.src} alt={photos.hero.alt} className="h-full w-full object-cover" />
        <span className="tape -left-4 top-3 -rotate-[28deg]" />
        <span className="tape -right-5 bottom-8 rotate-[24deg]" />
        <figcaption className="label absolute bottom-3 left-3 rounded-sm bg-ink/70 px-2 py-1 text-[9px] text-paper-2">fig. 01 — {recipient.latin}</figcaption>

        {/* 10/10 stamp, slammed onto the corner of the photo */}
        <div data-stamp10 className="absolute right-2 top-2 wide:right-4 wide:top-4" style={{ rotate: '-12deg' }}>
          <Stamp className="relative h-[86px] w-[86px] bg-paper-2/85 wide:h-[118px] wide:w-[118px]">
            <div className="leading-none">
              <div className="poster text-[26px] wide:text-[36px]">{tenTen.stamp}</div>
              <div className="label mt-1 text-[7px] wide:text-[8px]">official</div>
            </div>
          </Stamp>
        </div>
      </figure>

      {/* little polaroid stuck to the composition */}
      <figure
        data-polaroid
        className="absolute right-3 top-[38svh] z-20 w-[28vw] max-w-[150px] bg-paper-2 p-1 pb-4 shadow-[0_16px_30px_-14px_rgba(0,0,0,.6)] wide:right-[2vw] wide:top-auto wide:bottom-[10vh] wide:w-[11vw] wide:max-w-none"
        style={{ rotate: '7deg' }}
      >
        <div className="aspect-square overflow-hidden">
          <SmartImage eager src={photos.heroDetail.src} alt={photos.heroDetail.alt} className="h-full w-full object-cover" />
        </div>
        <span className="tape -top-2 left-1/2 h-4 w-12 -translate-x-1/2 rotate-2" />
        <figcaption className="label mt-1 text-[7px] text-ink/50">fig. 02</figcaption>
      </figure>

      {/* vertical japanese greeting on the ink field */}
      <div
        data-jpv
        className="jp pointer-events-none absolute right-[2.2vw] top-[9vh] z-20 hidden flex-col text-[clamp(20px,2.1vw,34px)] font-semibold leading-[1.12] text-paper-2 wide:flex"
        aria-label="С днём рождения (по-японски)"
      >
        {[...intro.jp].map((c, i) => (
          <span key={i}>{c}</span>
        ))}
      </div>

      {/* headline + CTA live in normal flow: they can never drift off-screen */}
      <div className="relative z-30 flex flex-1 flex-col justify-end px-5 pb-[calc(var(--safe-b)+32px)] pt-4 wide:absolute wide:inset-y-0 wide:left-[4vw] wide:w-[56vw] wide:justify-center wide:p-0">
        <h1 data-h className="poster uppercase">
          <span className="block text-[clamp(34px,10vw,64px)] text-ink wide:text-[min(5.6vw,10.5vh)]">
            <Chars text={intro.headline[0]} />
          </span>
          <span className="block text-[clamp(34px,10vw,64px)] text-wine wide:text-[min(5.6vw,10.5vh)]">
            <Chars text={intro.headline[1]} />
          </span>
          <span className="mt-1 block text-[clamp(64px,20vw,130px)] leading-[0.85] text-verm wide:text-[min(11.5vw,21vh)]">
            <Chars text={intro.headline[2]} />
          </span>
        </h1>

        <p data-note className="mt-4 max-w-[440px] font-display text-[19px] italic leading-snug text-ink/75 wide:text-[22px]">
          <span className="mr-2 inline-block rounded-full bg-verm px-2 py-0.5 font-sans text-[11px] not-italic text-paper-2">{tenTen.stamp}</span>
          {tenTen.line}
        </p>

      </div>
    </section>
  )
}
