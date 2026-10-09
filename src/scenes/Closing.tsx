import { useRef, useState } from 'react'
import gsap from 'gsap'
import { ArrowUp } from 'lucide-react'
import { site } from '../content/siteContent'
import { RegMarks, SmartImage, Stamp, WithHeart } from '../components/ui'
import { useGsap } from '../lib/useGsap'
import { prefersReducedMotion } from '../lib/util'
import { sfx } from '../lib/audio'
import { confetti } from '../lib/confetti'

export default function Closing() {
  const root = useRef<HTMLElement>(null)
  const burst = useRef<HTMLDivElement>(null)
  const C = site.closing
  const titleWords = C.title.split(' ')

  useGsap(root, () => {
    if (prefersReducedMotion()) return
    const st = { trigger: root.current, start: 'top 60%' }
    gsap.from('[data-fphoto]', { clipPath: 'inset(0 100% 0 0)', duration: 1.3, ease: 'expo.inOut', scrollTrigger: st })
    gsap.from('[data-fphoto] img', { scale: 1.25, duration: 2, ease: 'power3.out', scrollTrigger: st })
    gsap.from('[data-mini]', { y: 60, rotate: (i) => (i % 2 ? 14 : -14), opacity: 0, stagger: 0.12, duration: 0.8, ease: 'back.out(1.6)', delay: 0.6, scrollTrigger: st })
    gsap.from('[data-ftitle] [data-w]', {
      yPercent: 110,
      opacity: 0,
      stagger: 0.08,
      duration: 0.8,
      ease: 'power4.out',
      scrollTrigger: {
        ...st,
        once: true,
        onEnter: () => {
          if (burst.current) window.setTimeout(() => confetti(burst.current!, { count: 36 }), 500)
        },
      },
    })
    gsap.from('[data-ftext]', { opacity: 0, y: 16, stagger: 0.12, duration: 0.8, delay: 0.5, scrollTrigger: st })
    gsap.from('[data-tsu] > span', { opacity: 0, y: -24, stagger: 0.12, duration: 0.6, delay: 0.3, scrollTrigger: st })
  })


  return (
    <section ref={root} className="relative overflow-clip bg-wine pb-24 pt-24 text-paper-2 wide:pb-28 wide:pt-28" aria-label="С днём рождения">
      <div ref={burst} className="pointer-events-none absolute inset-0 z-30 overflow-hidden" aria-hidden />
      <RegMarks className="text-paper-2/30" />
      <div className="halftone pointer-events-none absolute -left-8 top-0 h-[50%] w-[40%] text-ink/25 [mask-image:linear-gradient(135deg,#000,transparent_70%)]" aria-hidden />

      <div className="relative grid gap-12 px-5 wide:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] wide:items-center wide:gap-[4vw] wide:px-0 wide:pr-[5vw]">
        {/* photographs: the two of you, plus three small prints */}
        <div className="relative wide:pb-16">
          <figure data-fphoto className="relative -mx-5 bg-paper-2 p-2 pb-3 shadow-[0_40px_70px_-30px_rgba(0,0,0,.7)] wide:mx-0 wide:-ml-[1vw] wide:p-3" style={{ rotate: '-1.5deg' }}>
            <div className="aspect-[4/3] overflow-hidden">
              <SmartImage src={site.photos.finale.src} alt={site.photos.finale.alt} className="h-full w-full object-cover" />
            </div>
            <figcaption className="label mt-2 flex justify-between px-1 text-[9px] text-ink/55">
              <span>fig. 18 — you</span>
              <span>{site.recipient.latin}</span>
            </figcaption>
            <span className="tape -right-6 top-6 rotate-[35deg]" />
          </figure>
          <div className="relative -mt-10 flex justify-end gap-3 pr-2 wide:-mt-20 wide:pr-10">
            {site.photos.details.map((p, i) => (
              <figure key={i} data-mini className="w-[26vw] max-w-[150px] bg-paper-2 p-1 pb-3 shadow-[0_16px_30px_-14px_rgba(0,0,0,.6)] wide:w-[10vw]" style={{ rotate: `${[-6, 4, -2][i % 3]}deg`, marginTop: `${[18, 0, 30][i % 3]}px` }}>
                <div className="aspect-square overflow-hidden">
                  <SmartImage src={p.src} alt={p.alt} className="h-full w-full object-cover" />
                </div>
              </figure>
            ))}
          </div>
        </div>

        {/* the greeting */}
        <div className="relative">
          <div className="flex items-center gap-3 text-gold">
            <span className="label">No.07 — finale</span>
            <span className="hairline w-12" />
          </div>
          <div data-tsu className="jp absolute right-0 top-0 flex flex-col text-[clamp(26px,3vw,44px)] font-semibold leading-[1.05] text-gold" aria-label="Продолжение следует (по-японски)">
            <span>つ</span>
            <span>づ</span>
            <span>く</span>
          </div>
          <h2 data-ftitle className="poster mt-5 pr-12 text-[clamp(40px,10vw,104px)] leading-[0.98] wide:pr-[5vw] wide:text-[4.3vw]">
            {titleWords.map((w, i) => (
              <span key={i} className="mask mr-[0.22em] inline-block align-top">
                <span data-w className={`inline-block ${i === titleWords.length - 1 ? 'text-verm' : ''}`}>
                  {w}
                </span>
              </span>
            ))}
          </h2>
          <p data-ftext className="mt-6 max-w-[460px] text-[clamp(17px,1.5vw,20px)] leading-[1.45] text-paper-2/85">
            {C.text}
          </p>

          <div data-ftext className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="label text-paper-2/60">To be continued</span>
            {C.meta.map((m) => (
              <span key={m} className="label text-paper-2/60">
                <span className="mr-4 text-paper-2/30">/</span>
                {m}
              </span>
            ))}
          </div>

          <div data-ftext className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })}
              className="btn-pill border-paper-2/30 text-paper-2/80"
            >
              <ArrowUp size={14} strokeWidth={1.5} /> С самого начала
            </button>
          </div>
        </div>
      </div>

      <Psst />

      <div className="pointer-events-none absolute bottom-6 right-5 hidden wide:block" style={{ rotate: '-8deg' }}>
        <Stamp color="paper" className="relative h-[86px] w-[86px]">
          <span className="poster text-[13px] leading-tight">
            10.10
            <br />
            2026
          </span>
        </Stamp>
      </div>
    </section>
  )
}

/** Пасхалка в самом низу: маленький «P.S.» на скотче, по тапу разворачивается записка. */
function Psst() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const toggle = () => {
    sfx.paper()
    setOpen((o) => !o)
  }
  useGsap(ref, () => {
    if (!open || prefersReducedMotion()) return
    gsap.from('[data-note]', { y: -20, rotate: -6, scaleY: 0.6, opacity: 0, transformOrigin: '50% 0%', duration: 0.6, ease: 'back.out(1.6)' })
  }, [open])
  return (
    <div ref={ref} className="relative mx-auto mt-16 flex max-w-[520px] flex-col items-center px-5 text-center">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="wobble relative rounded-[3px] bg-paper-2 px-4 py-2 text-wine shadow-[0_10px_20px_-10px_rgba(0,0,0,.6)]"
        style={{ rotate: '-4deg' }}
      >
        <span className="tape -top-3 left-1/2 h-4 w-12 -translate-x-1/2 rotate-3" />
        <span className="poster text-[18px]">P.S.</span>
        <span className="label ml-2 text-[9px] text-ink/50">{open ? 'закрыть' : 'тсс… нажми'}</span>
      </button>
      {open && (
        <div data-note className="mt-5 space-y-3 bg-paper-2 px-5 py-4 text-left font-display text-[19px] italic leading-snug text-ink shadow-[0_16px_30px_-16px_rgba(0,0,0,.6)]" style={{ rotate: '1.5deg' }}>
          {site.closing.easterEgg.map((t, i) => (
            <p key={i}>
              <WithHeart text={t} />
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
