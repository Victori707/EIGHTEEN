/** Путь к файлу из public/ с учётом base (сайт может жить в подпапке). */
export const asset = (p: string) => (/^(https?:|data:|blob:)/.test(p) ? p : import.meta.env.BASE_URL + p.replace(/^\//, ''))

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Мешок без повторов: тянет всё по одному разу, потом перемешивает заново (без повтора на стыке). */
export function createBag<T>(items: T[]) {
  let bag: number[] = []
  let last = -1
  let drawn = 0
  return {
    next(): T {
      if (!bag.length) {
        bag = shuffle(items.map((_, i) => i))
        if (bag.length > 1 && bag[bag.length - 1] === last) [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]]
      }
      last = bag.pop()!
      drawn++
      return items[last]
    },
    get drawn() {
      return drawn
    },
    get left() {
      return bag.length
    },
  }
}

export const rand = (a: number, b: number) => a + Math.random() * (b - a)

export function vibrate(ms: number | number[]) {
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* noop */
  }
}

/** Выдаёт элементы строго по порядку списка, по кругу. */
export function createSequence<T>(items: T[]) {
  let i = 0
  let drawn = 0
  return {
    next(): T {
      const v = items[i % items.length]
      i++
      drawn++
      return v
    },
    get drawn() {
      return drawn
    },
    get left() {
      return items.length - (i % items.length || (i ? items.length : 0))
    },
    reset() {
      i = 0
    },
  }
}
