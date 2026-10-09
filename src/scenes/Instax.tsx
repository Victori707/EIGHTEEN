import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { Download, LayoutGrid, Share2, X } from 'lucide-react'
import { site } from '../content/siteContent'
import { RegMarks, SmartImage } from '../components/ui'
import { CameraObj } from '../components/objects'
import { useGsap } from '../lib/useGsap'
import { createBag, prefersReducedMotion, rand, vibrate } from '../lib/util'
import { audio, sfx } from '../lib/audio'
import { renderInstaxPng, type InstaxItem } from '../lib/exportPhoto'

type DownloadsNs = { save: (r: { filename: string; data: Blob }) => Promise<unknown> }
/** Если сайт открыт как Claude Artifact — сохраняем через платформу; иначе обычной ссылкой. */
let downloadsNs: Promise<DownloadsNs | null> | null = null
function getDownloads() {
  if (!downloadsNs) {
    const c = (window as unknown as { claude?: { use?: (n: string) => Promise<unknown> } }).claude
    downloadsNs = c?.use ? (c.use('downloads') as Promise<DownloadsNs | null>).catch(() => null) : Promise.resolve(null)
  }
  return downloadsNs
}

/**
 * Позиция карточки хранится в долях стола (0..1), а не в пикселях:
 * при ресайзе окна карточки остаются на своих местах и никогда не вылезают за край.
 */
type Shot = { id: number; item: InstaxItem; n: number; fx: number; fy: number; rot: number; seeded?: boolean; z: number }
type Size = { w: number; h: number }

const RATIO = 86 / 72 // instax square film: 72×86 mm
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** Аккуратный «веер» для кнопки «Собрать»: сетка с лёгким разбросом. */
function tidyLayout(count: number, cols: number) {
  const rows = Math.max(1, Math.ceil(count / cols))
  return Array.from({ length: count }, (_, i) => {
    const c = i % cols
    const r = Math.floor(i / cols)
    return {
      fx: clamp01((cols > 1 ? c / (cols - 1) : 0.5) + rand(-0.03, 0.03)),
      fy: clamp01(rows > 1 ? r / (rows - 1) + rand(-0.04, 0.04) : 0.5),
      rot: rand(-7, 7),
    }
  })
}

export default function Instax() {
  const root = useRef<HTMLElement>(null)
  const table = useRef<HTMLDivElement>(null)
  const camera = useRef<HTMLDivElement>(null)
  const bag = useMemo(() => createBag(site.instax), [])
  const [shots, setShots] = useState<Shot[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [size, setSize] = useState<Size>({ w: 0, h: 0 })
  const zTop = useRef(10)
  const nextId = useRef(1)
  const [exporting, setExporting] = useState(false)
  const [exported, setExported] = useState<{ url: string; blob: Blob; name: string } | null>(null)
  const [exportError, setExportError] = useState(false)

  const dl = useRef<DownloadsNs | null>(null)
  useEffect(() => {
    getDownloads().then((ns) => (dl.current = ns))
  }, [])

  // card size follows the table, not the camera
  const cardW = Math.round(Math.min(220, Math.max(108, size.w * (size.w > 700 ? 0.2 : 0.36))))
  const cardH = Math.round(cardW * RATIO)

  useLayoutEffect(() => {
    const el = table.current
    if (!el) return
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    setSize({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  useGsap(root, () => {
    if (prefersReducedMotion()) return
    // entering the scene = a camera flash
    gsap.from('[data-click] [data-ch]', {
      yPercent: 110,
      opacity: 0,
      stagger: 0.04,
      duration: 0.5,
      ease: 'power4.out',
      scrollTrigger: {
        trigger: root.current,
        start: 'top 60%',
        once: true,
        onEnter: () => {
          const f = document.querySelector('[data-flash]')
          gsap.fromTo(f, { opacity: 0 }, { opacity: 0.9, duration: 0.06, yoyo: true, repeat: 1, ease: 'none', onComplete: () => void gsap.set(f, { opacity: 0 }) })
          if (!audio.muted) sfx.shutter()
        },
      },
    })
    gsap.from('[data-camera]', { y: 70, rotate: 6, opacity: 0, duration: 1, ease: 'back.out(1.3)', scrollTrigger: { trigger: '[data-camera]', start: 'top 92%' } })
  })

  // the table never starts empty: three already-developed shots
  useEffect(() => {
    if (!size.w || nextId.current > 1) return
    const spots = [
      [0.04, 0.12, -8],
      [0.42, 0.62, 5],
      [0.8, 0.08, -3],
    ]
    setShots(spots.map(([fx, fy, rot]) => ({ id: nextId.current++, item: bag.next(), n: bag.drawn, fx, fy, rot, seeded: true, z: ++zTop.current })))
  }, [size.w, bag])

  const focus = useCallback((id: number) => {
    const z = ++zTop.current
    setSelected(id)
    setShots((s) => s.map((p) => (p.id === id ? { ...p, z } : p)))
  }, [])

  const move = useCallback((id: number, fx: number, fy: number) => {
    setShots((s) => s.map((p) => (p.id === id ? { ...p, fx: clamp01(fx), fy: clamp01(fy) } : p)))
  }, [])

  const shoot = useCallback(() => {
    if (busy || !table.current || !camera.current) return
    setBusy(true)
    sfx.shutter()
    vibrate(25)
    const reduced = prefersReducedMotion()
    const flash = root.current!.querySelector('[data-flash]')
    if (!reduced) gsap.fromTo(flash, { opacity: 0 }, { opacity: 0.9, duration: 0.05, yoyo: true, repeat: 1, ease: 'none', onComplete: () => void gsap.set(flash, { opacity: 0 }) })
    // the shutter is an inner element — its wrapper keeps the CSS positioning
    gsap.fromTo('[data-shutter-inner]', { y: 0 }, { y: 4, duration: 0.08, yoyo: true, repeat: 1 })
    const n = bag.drawn + 1
    const shot: Shot = { id: nextId.current++, item: bag.next(), n, fx: rand(0.05, 0.95), fy: rand(0.05, 0.95), rot: rand(-11, 11), z: ++zTop.current }
    setShots((s) => [...s, shot]) // nothing is ever removed
    setSelected(shot.id)
    window.setTimeout(() => setBusy(false), reduced ? 300 : 2200)
  }, [busy, bag])

  const tidy = () => {
    sfx.paper()
    const cols = size.w > 700 ? Math.min(5, Math.max(3, Math.ceil(shots.length / 2))) : Math.min(3, Math.max(2, Math.ceil(shots.length / 3)))
    const layout = tidyLayout(shots.length, cols)
    setShots((s) => s.map((p, i) => ({ ...p, ...layout[i] })))
  }

  const exportSelected = async () => {
    const s = shots.find((p) => p.id === selected) ?? shots[shots.length - 1]
    if (!s) return
    sfx.tap()
    setExporting(true)
    setExportError(false)
    try {
      const blob = await renderInstaxPng(s.item)
      const url = URL.createObjectURL(blob)
      setExported({ url, blob, name: `instax-${String(s.n).padStart(2, '0')}.png` })
    } catch {
      setExportError(true)
    } finally {
      setExporting(false)
    }
  }

  const closeExport = () => {
    if (exported) URL.revokeObjectURL(exported.url)
    setExported(null)
  }

  const download = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    const ns = dl.current
    if (!exported || !ns) return // default <a download> behaviour
    e.preventDefault()
    try {
      await ns.save({ filename: exported.name, data: exported.blob })
    } catch {
      /* declined or unavailable — the image can still be long-pressed */
    }
  }

  const share = async () => {
    if (!exported) return
    try {
      const file = new File([exported.blob], exported.name, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: 'Instax' })
    } catch {
      /* user cancelled */
    }
  }

  const canShare = useMemo(() => {
    try {
      return !!exported && !!navigator.canShare?.({ files: [new File([exported.blob], exported.name, { type: 'image/png' })] })
    } catch {
      return false
    }
  }, [exported])

  return (
    <section ref={root} className="relative overflow-clip bg-wine pb-24 pt-24 text-paper-2 wide:pb-28 wide:pt-28" aria-label="Instant memories">
      <div data-flash className="pointer-events-none fixed inset-0 z-[45] bg-paper-2 opacity-0" aria-hidden />
      <RegMarks className="text-paper-2/30" />

      {/* header: CLICK. + 写真 + a note */}
      <div className="relative px-5 wide:px-[5vw]">
        <div className="flex items-center gap-3 text-gold">
          <span className="label">No.04 — instant memories</span>
          <span className="hairline w-12" />
        </div>
        <h2 data-click className="poster mt-4 text-[clamp(30px,8.6vw,150px)] leading-[1.05] text-paper-2 wide:text-[min(9.6vw,150px)]" aria-label="С днём рождения (по-японски)">
          {[...site.instaxScene.title].map((c, i) => (
            <span key={i} className="inline-block overflow-hidden align-top">
              <span data-ch className={`inline-block ${i >= 6 ? 'text-verm' : ''}`}>
                {c}
              </span>
            </span>
          ))}
        </h2>
      </div>

      {/* film strip — swipe it by hand, it also drifts while the page scrolls */}
      <FilmStrip />

      {/* desk + camera */}
      <div className="relative mt-10 grid gap-8 px-4 wide:grid-cols-[minmax(0,1fr)_auto] wide:items-end wide:gap-10 wide:px-[5vw]">
        {/* the desk: a printed cutting mat. Cards live INSIDE it (z above the camera). */}
        <div className="relative z-20">
          <div className="absolute inset-0 rounded-[2px] bg-[#e7ddcd] shadow-[inset_0_1px_0_rgba(255,255,255,.6),inset_0_-30px_60px_-40px_rgba(101,31,50,.25)]" />
          <div className="label absolute left-3 top-3 text-[9px] text-ink/40">Table · drag</div>
          <div className="label absolute right-3 top-3 text-[9px] tabular-nums text-ink/40">{String(shots.length).padStart(2, '0')} shots</div>
          {/* inner area keeps every card fully inside the desk */}
          <div className="relative h-[min(60svh,500px)] min-h-[340px] wide:h-[min(72vh,680px)]">
            <div ref={table} className="absolute inset-4 wide:inset-6">
              {size.w > 0 &&
                shots.map((s) => (
                  <Photo
                    key={s.id}
                    shot={s}
                    w={cardW}
                    h={cardH}
                    area={size}
                    selected={selected === s.id}
                    cameraEl={camera}
                    tableEl={table}
                    onFocus={focus}
                    onMove={move}
                  />
                ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center wide:items-start">
          <p className="mb-6 max-w-[380px] font-display text-[clamp(20px,1.7vw,24px)] italic leading-snug text-paper-2/90 wide:max-w-[min(26vw,380px)]">{site.instaxScene.note}</p>
          <div ref={camera} data-camera className="relative w-[min(74vw,300px)] wide:w-[min(26vw,380px)]">
            <button type="button" onClick={shoot} disabled={busy} className="block w-full disabled:cursor-wait" aria-label="Сделать снимок">
              <CameraObj className="block w-full drop-shadow-[0_22px_24px_rgba(0,0,0,.35)]" />
            </button>
            {/* outer wrapper owns the CSS position; GSAP only moves the inner button */}
            <div className="absolute right-[13%] top-[3%] h-[16%] w-[16%] -translate-y-1/2">
              <button
                type="button"
                data-shutter-inner
                onClick={shoot}
                disabled={busy}
                aria-label="Кнопка спуска"
                className="h-full w-full rounded-full border-[3px] border-gold bg-verm shadow-[0_4px_0_#3f1220] active:shadow-none"
              />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 wide:justify-start">
            <button type="button" onClick={shoot} disabled={busy} className="btn-pill btn-verm disabled:opacity-60">
              {busy ? 'Проявляется…' : 'Сделать кадр'}
            </button>
            <button type="button" onClick={exportSelected} disabled={!shots.length || exporting} className="btn-pill border-paper-2/50 text-paper-2 disabled:opacity-40">
              <Download size={14} strokeWidth={1.6} /> {exporting ? 'Печатаю…' : 'Сохранить'}
            </button>
            <button type="button" onClick={tidy} disabled={!shots.length} className="btn-pill border-paper-2/30 text-paper-2/80 disabled:opacity-40" aria-label="Собрать фото на столе">
              <LayoutGrid size={14} strokeWidth={1.6} /> Собрать
            </button>
          </div>
          {exportError && <p className="mt-3 text-[14px] text-paper-2">Не получилось сохранить. Попробуй ещё раз.</p>}
          <p className="label mt-4 max-w-[380px] text-[9px] leading-relaxed text-paper-2/50">жми на спуск · фото двигаются (на телефоне — за скотч)</p>
        </div>
      </div>

      {exported && (
        <div className="fixed inset-0 z-[55] flex flex-col items-center justify-center bg-ink/85 p-6" role="dialog" aria-modal="true" aria-label="Сохранить фото">
          <button type="button" onClick={closeExport} className="absolute right-4 top-[calc(var(--safe-t)+12px)] grid h-11 w-11 place-items-center rounded-full border border-paper-2/40 text-paper-2" aria-label="Закрыть">
            <X size={18} strokeWidth={1.5} />
          </button>
          <img src={exported.url} alt="Инстакс-карточка для сохранения" className="max-h-[62vh] w-auto max-w-full shadow-2xl" />
          <p className="mt-4 text-center text-[14px] text-paper-2/70">Если кнопка не сработает — удерживай картинку и выбери «Сохранить».</p>
          <div className="mt-4 flex gap-3">
            <a href={exported.url} download={exported.name} onClick={download} className="btn-pill btn-verm">
              <Download size={14} strokeWidth={1.5} /> Скачать
            </a>
            {canShare && (
              <button type="button" onClick={share} className="btn-pill border-paper-2/40 text-paper-2">
                <Share2 size={14} strokeWidth={1.5} /> Поделиться
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function Photo({
  shot,
  w,
  h,
  area,
  selected,
  cameraEl,
  tableEl,
  onFocus,
  onMove,
}: {
  shot: Shot
  w: number
  h: number
  area: Size
  selected: boolean
  cameraEl: React.RefObject<HTMLDivElement | null>
  tableEl: React.RefObject<HTMLDivElement | null>
  onFocus: (id: number) => void
  onMove: (id: number, fx: number, fy: number) => void
}) {
  const el = useRef<HTMLDivElement>(null)
  const img = useRef<HTMLDivElement>(null)
  const veil = useRef<HTMLDivElement>(null)
  const [flipped, setFlipped] = useState(false)
  const canFlip = !!shot.item.caption
  const settled = useRef(false)
  const drag = useRef<{ id: number; sx: number; sy: number; ox: number; oy: number; moved: boolean; handle: boolean } | null>(null)
  const pad = (w * 5) / 72
  const padTop = (w * 6.5) / 72
  const S = w - pad * 2
  const maxX = Math.max(0, area.w - w)
  const maxY = Math.max(0, area.h - h)
  const tx = shot.fx * maxX
  const ty = shot.fy * maxY

  // eject from the camera slot, then settle on the desk; develop over ~6s
  useEffect(() => {
    const node = el.current!
    const instant = prefersReducedMotion() || !!shot.seeded
    const dev = { v: instant ? 1 : 0 }
    const paint = () => {
      const v = dev.v
      if (img.current) img.current.style.filter = `saturate(${0.15 + 0.85 * v}) contrast(${0.55 + 0.45 * v}) brightness(${1.35 - 0.35 * v}) sepia(${0.35 * (1 - v)}) blur(${(1 - v) * 1.2}px)`
      if (veil.current) veil.current.style.opacity = String(Math.pow(1 - v, 1.6))
    }
    paint()
    if (instant) {
      gsap.set(node, { x: tx, y: ty, rotation: shot.rot })
      settled.current = true
      return
    }
    const tb = tableEl.current!.getBoundingClientRect()
    const cb = cameraEl.current!.getBoundingClientRect()
    const slotX = cb.left - tb.left + cb.width / 2 - w / 2
    const slotY = cb.top - tb.top + cb.height * (22 / 190)
    const tl = gsap.timeline({ onComplete: () => void (settled.current = true) })
    tl.set(node, { x: slotX, y: slotY, rotation: 0, scale: 1 })
      .to(node, { y: slotY - h - 6, duration: 1.1, ease: 'power1.inOut', delay: 0.2 })
      .to(node, { y: '-=14', rotation: shot.rot * 0.3, duration: 0.3, ease: 'power2.out' })
      .to(node, { x: tx, y: ty, rotation: shot.rot, duration: 0.85, ease: 'power3.inOut' })
      .to(node, { scale: 1.04, duration: 0.12, yoyo: true, repeat: 1, ease: 'power1.out' })
    const dt = gsap.to(dev, { v: 1, duration: 6.5, delay: 0.6, ease: 'power1.in', onUpdate: paint })
    return () => {
      tl.kill()
      dt.kill()
      settled.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // follow layout changes (resize, «Собрать») once the card has landed
  useEffect(() => {
    if (!settled.current || drag.current) return
    gsap.to(el.current, { x: tx, y: ty, rotation: shot.rot, duration: 0.6, ease: 'power3.out', overwrite: 'auto' })
  }, [tx, ty, shot.rot])

  const onDown = (e: React.PointerEvent) => {
    const handle = e.pointerType === 'mouse' || !!(e.target as HTMLElement).closest('[data-handle]')
    if (handle) e.currentTarget.setPointerCapture(e.pointerId)
    gsap.killTweensOf(el.current, 'x,y')
    settled.current = true
    const cur = { x: gsap.getProperty(el.current, 'x') as number, y: gsap.getProperty(el.current, 'y') as number }
    drag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: cur.x, oy: cur.y, moved: false, handle }
    onFocus(shot.id)
  }
  const onMoveP = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dx = e.clientX - d.sx
    const dy = e.clientY - d.sy
    if (!d.moved) {
      if (Math.hypot(dx, dy) < 6) return
      // on touch, a mostly-vertical swipe belongs to the page scroll (the browser will cancel us)
      if (!d.handle && Math.abs(dy) > Math.abs(dx)) return
      d.moved = true
      if (!d.handle) (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      gsap.to(el.current, { scale: 1.05, duration: 0.2 })
    }
    const x = Math.min(maxX, Math.max(0, d.ox + dx))
    const y = Math.min(maxY, Math.max(0, d.oy + dy))
    gsap.set(el.current, { x, y, rotation: shot.rot + dx * 0.02 })
  }
  const end = (e: React.PointerEvent, cancelled: boolean) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    gsap.to(el.current, { scale: 1, rotation: shot.rot, duration: 0.4, ease: 'back.out(2)' })
    if (d.moved) {
      const x = gsap.getProperty(el.current, 'x') as number
      const y = gsap.getProperty(el.current, 'y') as number
      onMove(shot.id, maxX ? x / maxX : 0, maxY ? y / maxY : 0)
    } else if (!cancelled) {
      if (canFlip) {
        sfx.paper()
        setFlipped((f) => !f)
      }
    }
  }

  return (
    <div
      ref={el}
      className="absolute left-0 top-0 select-none [perspective:900px]"
      style={{ width: w, height: h, zIndex: shot.z, touchAction: 'pan-y' }}
      onPointerDown={onDown}
      onPointerMove={onMoveP}
      onPointerUp={(e) => end(e, false)}
      onPointerCancel={(e) => end(e, true)}
      role="button"
      tabIndex={0}
      aria-label={canFlip ? `Фото ${shot.n}: ${shot.item.caption}. Нажми, чтобы перевернуть` : `Фото ${shot.n}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onFocus(shot.id)
          if (canFlip) setFlipped((f) => !f)
        }
      }}
    >
      {/* tape = drag handle on touch screens */}
      <span data-handle className="tape -top-2.5 left-1/2 z-10 h-[20px] w-[58%] -translate-x-1/2" style={{ pointerEvents: 'auto', touchAction: 'none', rotate: `${shot.id % 2 ? 3 : -4}deg` }} />
      <div
        className="relative h-full w-full [transform-style:preserve-3d]"
        style={{ transform: `rotateY(${flipped ? 180 : 0}deg)`, transition: 'transform .7s cubic-bezier(.22,1,.36,1)' }}
      >
        {/* front */}
        <div
          className={`absolute inset-0 bg-[#fbf8f2] [backface-visibility:hidden] [-webkit-backface-visibility:hidden] ${selected ? 'outline outline-2 outline-offset-2 outline-verm' : ''}`}
          style={{ boxShadow: '0 1px 1px rgba(23,21,23,.08), 0 14px 26px -10px rgba(23,21,23,.45)' }}
        >
          <div className="absolute overflow-hidden bg-[#2a2426]" style={{ left: pad, top: padTop, width: S, height: S }}>
            <div ref={img} className="h-full w-full">
              <SmartImage src={shot.item.image} alt={shot.item.caption || `Фото ${shot.n}`} className="h-full w-full object-cover" />
            </div>
            <div ref={veil} className="absolute inset-0" style={{ background: 'linear-gradient(160deg,#d8d4c6,#c9c7bb 60%,#bfc2b8)' }} />
            <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(0,0,0,.12)]" />
          </div>
          <div className="absolute inset-x-[7%] bottom-[3.5%] flex items-center justify-between">
            <span className="truncate font-display text-[clamp(11px,1.1vw,14px)] italic text-ink/70">{shot.item.caption}</span>
            <span className="label ml-2 shrink-0 text-[7px] text-verm">{String(shot.n).padStart(2, '0')}</span>
          </div>
        </div>
        {/* back */}
        <div className="absolute inset-0 flex flex-col justify-between bg-[#f3ede2] p-3 [backface-visibility:hidden] [-webkit-backface-visibility:hidden] [transform:rotateY(180deg)]" style={{ boxShadow: '0 12px 24px -10px rgba(23,21,23,.4)' }}>
          <div className="flex items-center justify-between">
            <span className="label text-[7px] text-wine">Instax · {String(shot.n).padStart(2, '0')}</span>
            <span className="label text-[7px] text-verm">{shot.item.date}</span>
          </div>
          <p className="font-display text-[clamp(15px,1.6vw,20px)] font-medium italic leading-tight text-ink">{shot.item.caption}</p>
          <div className="hairline text-wine" />
        </div>
      </div>
    </div>
  )
}

/**
 * Лента плёнки: обычный горизонтальный скролл (палец, тачпад, колёсико с Shift),
 * мышью можно тянуть, а прокрутка страницы сама подталкивает ленту вбок.
 */
function FilmStrip() {
  const box = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null)

  // page scroll nudges the strip sideways (only while it is on screen)
  useEffect(() => {
    const el = box.current
    if (!el || prefersReducedMotion()) return
    let lastY = window.scrollY
    let visible = false
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(el)
    const onScroll = () => {
      const y = window.scrollY
      if (visible && !drag.current) el.scrollLeft += (y - lastY) * 0.6
      lastY = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const onDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return // touch scrolls natively
    drag.current = { x: e.clientX, left: box.current!.scrollLeft, moved: false }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    if (Math.abs(dx) > 3) d.moved = true
    box.current!.scrollLeft = d.left - dx
  }
  const onUp = () => {
    drag.current = null
  }
  const nudge = (dir: number) => {
    const el = box.current!
    el.scrollBy({ left: dir * el.clientWidth * 0.6, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }

  return (
    <div className="relative mt-8 py-4">
      <div style={{ rotate: '-2deg' }}>
        <div
          ref={box}
          className="cursor-grab overflow-x-auto overscroll-x-contain bg-ink active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ touchAction: 'pan-x pan-y', WebkitOverflowScrolling: 'touch' }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onDragStart={(e) => e.preventDefault()}
          aria-label="Лента фотографий — листай вбок"
        >
          <div className="flex w-max select-none gap-3 px-4 py-4">
            {site.photos.contactSheet.map((p, i) => (
              <figure key={i} className="relative w-[42vw] shrink-0 sm:w-[28vw] wide:w-[15vw]">
                <div className="label mb-1.5 flex justify-between text-[9px] text-verm">
                  <span>{17 + i}</span>
                  <span>▸ {17 + i}A</span>
                </div>
                <div className="aspect-[4/3] overflow-hidden bg-[#2a2426]">
                  <SmartImage src={p.src} alt={p.alt} className="pointer-events-none h-full w-full object-cover" />
                </div>
                <div className="label mt-1.5 text-[8px] text-paper-2/40">400 · {site.recipient.latin}</div>
              </figure>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2 px-5 wide:px-[5vw]">
        <span className="label mr-1 text-[9px] text-paper-2/50">листай ленту</span>
        <button type="button" onClick={() => nudge(-1)} className="grid h-9 w-9 place-items-center rounded-full border border-paper-2/30 text-paper-2" aria-label="Листать ленту назад">
          ←
        </button>
        <button type="button" onClick={() => nudge(1)} className="grid h-9 w-9 place-items-center rounded-full border border-paper-2/30 text-paper-2" aria-label="Листать ленту вперёд">
          →
        </button>
      </div>
    </div>
  )
}
