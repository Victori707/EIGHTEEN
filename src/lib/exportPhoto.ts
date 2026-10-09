import { asset } from './util'
import { site } from '../content/siteContent'

export type InstaxItem = { image: string; caption: string; date: string }

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => res(img)
    img.onerror = () => rej(new Error('image'))
    img.src = asset(src)
  })
}

/** Рисует инстакс-карточку (формат Square 72×86 мм) с подписью и возвращает PNG Blob. */
export async function renderInstaxPng(item: InstaxItem): Promise<Blob> {
  const W = 1080
  const H = Math.round((W * 86) / 72)
  const side = Math.round((W * 5) / 72)
  const top = Math.round((W * 6.5) / 72)
  const S = W - side * 2

  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')
  if (!ctx) throw new Error('canvas')

  // film frame
  ctx.fillStyle = '#fbf8f2'
  ctx.fillRect(0, 0, W, H)
  const g = ctx.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, 'rgba(255,255,255,.5)')
  g.addColorStop(1, 'rgba(184,167,152,.18)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  // photo (cover-crop to square)
  try {
    const img = await loadImage(item.image)
    const k = Math.max(S / img.naturalWidth, S / img.naturalHeight)
    const dw = img.naturalWidth * k
    const dh = img.naturalHeight * k
    ctx.save()
    ctx.beginPath()
    ctx.rect(side, top, S, S)
    ctx.clip()
    ctx.drawImage(img, side + (S - dw) / 2, top + (S - dh) / 2, dw, dh)
    // gentle film warmth + vignette
    ctx.fillStyle = 'rgba(200,154,99,.06)'
    ctx.fillRect(side, top, S, S)
    const v = ctx.createRadialGradient(W / 2, top + S / 2, S * 0.35, W / 2, top + S / 2, S * 0.75)
    v.addColorStop(0, 'rgba(0,0,0,0)')
    v.addColorStop(1, 'rgba(27,25,25,.22)')
    ctx.fillStyle = v
    ctx.fillRect(side, top, S, S)
    ctx.restore()
  } catch {
    ctx.fillStyle = '#e6dccd'
    ctx.fillRect(side, top, S, S)
  }
  ctx.strokeStyle = 'rgba(27,25,25,.12)'
  ctx.lineWidth = 2
  ctx.strokeRect(side + 1, top + 1, S - 2, S - 2)

  // caption
  try {
    await Promise.all([document.fonts.load('italic 500 64px "Cormorant Garamond"'), document.fonts.load('400 24px "JetBrains Mono"')])
  } catch {
    /* fallback fonts are fine */
  }
  const baseY = top + S + (H - top - S) / 2
  ctx.fillStyle = '#1b1919'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  let size = 66
  ctx.font = `italic 500 ${size}px "Cormorant Garamond", Georgia, serif`
  while (ctx.measureText(item.caption).width > S - 120 && size > 34) {
    size -= 2
    ctx.font = `italic 500 ${size}px "Cormorant Garamond", Georgia, serif`
  }
  ctx.fillText(item.caption, W / 2, baseY - 10)
  ctx.font = '400 22px "JetBrains Mono", monospace'
  ctx.fillStyle = '#c89a63'
  ctx.textAlign = 'right'
  ctx.fillText(`${item.date} · EIGHTEEN`, W - side - 8, H - 34)
  ctx.textAlign = 'left'
  ctx.fillStyle = '#651f32'
  ctx.fillText(`${site.recipient.nickname.toUpperCase()} · ${site.recipient.age}`, side + 8, H - 34)

  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('blob'))), 'image/png'))
}
