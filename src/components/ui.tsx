import { useState, type CSSProperties } from 'react'
import type React from 'react'
import { asset } from '../lib/util'

/** Картинка, которая не ломает композицию, если файла нет. */
export function SmartImage({
  src,
  alt,
  className,
  style,
  draggable = false,
  eager = false,
}: {
  src: string
  alt: string
  className?: string
  style?: CSSProperties
  draggable?: boolean
  eager?: boolean
}) {
  const [broken, setBroken] = useState(false)
  if (broken)
    return (
      <div
        className={className}
        style={{ ...style, background: 'repeating-linear-gradient(135deg,#e6dccd 0 6px,#ddd1bf 6px 12px)', display: 'grid', placeItems: 'center' }}
        role="img"
        aria-label={alt}
      >
        <span className="label text-wine/60">photo</span>
      </div>
    )
  return (
    <img
      src={asset(src)}
      alt={alt}
      className={className}
      style={style}
      draggable={draggable}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setBroken(true)}
    />
  )
}

/** Бегущая строка-лента между сценами. */
export function Ticker({
  items,
  tone = 'wine',
  rotate = -2,
  reverse = false,
  className = '',
}: {
  items: string[]
  tone?: 'wine' | 'verm' | 'ink' | 'paper'
  rotate?: number
  reverse?: boolean
  className?: string
}) {
  const bg = { wine: 'bg-wine text-paper-2', verm: 'bg-verm text-ink', ink: 'bg-ink text-paper-2', paper: 'bg-paper-2 text-ink' }[tone]
  const row = (
    <div className="flex shrink-0 items-center">
      {items.map((t, i) => (
        <span key={i} className="flex items-center whitespace-nowrap">
          <span className={/[\u3040-\u30ff\u4e00-\u9fff]/.test(t) ? 'jp px-6 text-[clamp(16px,2vw,24px)] font-semibold' : 'poster px-6 text-[clamp(16px,2vw,24px)] uppercase'}>{t}</span>
          <span className="text-gold" aria-hidden>
            ✦
          </span>
        </span>
      ))}
    </div>
  )
  return (
    <div className={`pointer-events-none relative z-30 -my-6 overflow-hidden py-3 ${bg} ${className}`} style={{ rotate: `${rotate}deg`, width: '110%', marginLeft: '-5%' }} aria-hidden>
      <div className={`ticker ${reverse ? 'ticker-rev' : ''}`}>
        {row}
        {row}
        {row}
        {row}
      </div>
    </div>
  )
}

/** Круглый штамп-печать (ханко). */
export function Stamp({ children, className = '', style, color = 'verm' }: { children: React.ReactNode; className?: string; style?: CSSProperties; color?: 'verm' | 'wine' | 'ink' | 'paper' }) {
  const c = { verm: 'text-verm', wine: 'text-wine', ink: 'text-ink', paper: 'text-paper-2' }[color]
  return (
    <div className={`grid place-items-center rounded-full border-[3px] border-current text-center ${c} ${className}`} style={style}>
      <div className="absolute inset-[5px] rounded-full border border-current opacity-60" />
      {children}
    </div>
  )
}

/** Четыре метки приводки по углам блока. */
export function RegMarks({ className = 'text-ink/40', inset = 14 }: { className?: string; inset?: number }) {
  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden>
      <span className="regmark" style={{ left: inset, top: inset }} />
      <span className="regmark" style={{ right: inset, top: inset }} />
      <span className="regmark" style={{ left: inset, bottom: inset }} />
      <span className="regmark" style={{ right: inset, bottom: inset }} />
    </div>
  )
}

/** Текст, где ♡ рисуется SVG-сердечком (никогда не обрезается и не зависит от шрифта). */
export function WithHeart({ text }: { text: string }) {
  const parts = text.split('♡')
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {p}
          {i < parts.length - 1 && (
            <svg viewBox="0 0 24 22" className="ml-[0.12em] inline-block h-[0.72em] w-[0.78em] align-baseline" aria-label="♡">
              <path d="M12 21 C 4 15, 1 11, 1 6.5 A 5.5 5.5 0 0 1 12 4 A 5.5 5.5 0 0 1 23 6.5 C 23 11, 20 15, 12 21 Z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      ))}
    </>
  )
}

/** Тонкая ботаническая веточка — общий графический мотив. */
export function Sprig({ className, style, stroke = 'currentColor' }: { className?: string; style?: CSSProperties; stroke?: string }) {
  return (
    <svg viewBox="0 0 120 220" className={className} style={style} fill="none" stroke={stroke} strokeWidth="1" strokeLinecap="round" aria-hidden>
      <path className="sprig-path" d="M60 218 C 58 170, 66 120, 54 70 S 64 16, 70 4" />
      {[
        [57, 180, -1],
        [60, 150, 1],
        [57, 120, -1],
        [58, 92, 1],
        [57, 66, -1],
        [62, 40, 1],
      ].map(([x, y, s], i) => (
        <path
          key={i}
          className="sprig-path"
          d={`M${x} ${y} q ${s * 18} -6 ${s * 30} -22 q ${-s * 20} 2 ${-s * 30} 22 z`}
          fill={i % 2 ? 'currentColor' : 'none'}
          fillOpacity={0.12}
        />
      ))}
      <circle className="sprig-path" cx="70" cy="6" r="3.5" />
    </svg>
  )
}

/** Мелкая редакционная подпись: «fig. 03 ———— ARISU». */
export function Meta({ left, right, className = '' }: { left: string; right?: string; className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="label">{left}</span>
      <span className="hairline flex-1" />
      {right && <span className="label">{right}</span>}
    </div>
  )
}
