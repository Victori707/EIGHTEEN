import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Ticker } from './components/ui'
import Intro from './scenes/Intro'
import Cake from './scenes/Cake'
import Omikuji from './scenes/Omikuji'
import Instax from './scenes/Instax'
import Gacha from './scenes/Gacha'
import Letter from './scenes/Letter'
import Closing from './scenes/Closing'

gsap.registerPlugin(ScrollTrigger)

const HB = ['С днём рождения', 'お誕生日おめでとう', 'Happy birthday', '10.10']

/**
 * EIGHTEEN — одна длинная страница. Сцены сшиты бегущими лентами,
 * без закреплений и без «экранов-заставок».
 */
export default function App() {
  const main = useRef<HTMLElement>(null)

  useEffect(() => {
    // anything that changes height (fonts, images, opened letter, fortune slip…) → re-measure triggers once it settles
    let t = 0
    const refresh = () => {
      window.clearTimeout(t)
      t = window.setTimeout(() => ScrollTrigger.refresh(), 120)
    }
    const ro = new ResizeObserver(refresh)
    if (main.current) ro.observe(main.current)
    document.fonts?.ready.then(refresh).catch(() => {})
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    return () => {
      ro.disconnect()
      window.clearTimeout(t)
    }
  }, [])

  return (
    <>
      <main ref={main} className="relative overflow-x-clip">
        <Intro />
        <Ticker items={HB} tone="wine" rotate={-2.2} />
        <Cake />
        <Omikuji />
        <Ticker items={['写真', 'Instant memories', 'Не двигайся', '写真', 'Улыбочку']} tone="verm" rotate={1.6} reverse />
        <Instax />
        <Gacha />
        <Ticker items={['手紙', 'A letter for you', 'Только для тебя']} tone="ink" rotate={-1.4} />
        <Letter />
        <Closing />
      </main>
      <div className="grain" aria-hidden />
    </>
  )
}
