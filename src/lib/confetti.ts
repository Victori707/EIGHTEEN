import gsap from 'gsap'
import { prefersReducedMotion, rand } from './util'

const COLORS = ['#c89a63', '#f0e9dd', '#faf6ef', '#8a3a4f', '#b8a798', '#d9b98c']

/** Сдержанное бумажное конфетти. Возвращает функцию очистки. */
export function confetti(container: HTMLElement, { count = 42, from = 'top' as 'top' | 'center' } = {}) {
  if (prefersReducedMotion()) return () => {}
  const w = container.clientWidth
  const h = container.clientHeight
  const nodes: HTMLElement[] = []
  for (let i = 0; i < count; i++) {
    const el = document.createElement('i')
    const round = Math.random() < 0.25
    const s = rand(5, 9)
    Object.assign(el.style, {
      position: 'absolute',
      left: '0',
      top: '0',
      width: `${round ? s : s * 0.6}px`,
      height: `${round ? s : s * 1.6}px`,
      background: COLORS[i % COLORS.length],
      borderRadius: round ? '50%' : '1px',
      pointerEvents: 'none',
      willChange: 'transform',
    })
    container.appendChild(el)
    nodes.push(el)
    const x0 = from === 'top' ? rand(0, w) : w / 2 + rand(-30, 30)
    const y0 = from === 'top' ? rand(-80, -10) : h * 0.45
    const dur = rand(3.2, 5.5)
    gsap.set(el, { x: x0, y: y0, rotation: rand(0, 360) })
    if (from === 'center') {
      gsap.to(el, { x: x0 + rand(-w * 0.5, w * 0.5), y: y0 - rand(80, h * 0.4), duration: rand(0.6, 0.9), ease: 'power3.out' })
      gsap.to(el, { y: h + 40, duration: dur, ease: 'power1.in', delay: 0.7 })
    } else {
      gsap.to(el, { y: h + 40, duration: dur, ease: 'none', delay: rand(0, 1.2) })
    }
    gsap.to(el, { rotation: `+=${rand(-540, 540)}`, rotationX: rand(-360, 360), duration: dur + 0.8, ease: 'none' })
    gsap.to(el, { x: `+=${rand(-60, 60)}`, duration: rand(1, 2), yoyo: true, repeat: 3, ease: 'sine.inOut' })
  }
  const t = window.setTimeout(() => nodes.forEach((n) => n.remove()), 8000)
  return () => {
    window.clearTimeout(t)
    nodes.forEach((n) => {
      gsap.killTweensOf(n)
      n.remove()
    })
  }
}
