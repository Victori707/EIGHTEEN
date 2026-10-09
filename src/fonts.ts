// Шрифты лежат внутри сборки (без внешних CDN), только латиница + кириллица.
import '@fontsource/cormorant-garamond/latin-400.css'
import '@fontsource/cormorant-garamond/cyrillic-400.css'
import '@fontsource/cormorant-garamond/latin-500.css'
import '@fontsource/cormorant-garamond/cyrillic-500.css'
import '@fontsource/cormorant-garamond/latin-600.css'
import '@fontsource/cormorant-garamond/cyrillic-600.css'
import '@fontsource/cormorant-garamond/latin-400-italic.css'
import '@fontsource/cormorant-garamond/cyrillic-400-italic.css'
import '@fontsource/cormorant-garamond/latin-500-italic.css'
import '@fontsource/cormorant-garamond/cyrillic-500-italic.css'
import '@fontsource/onest/latin-400.css'
import '@fontsource/onest/cyrillic-400.css'
import '@fontsource/onest/latin-500.css'
import '@fontsource/onest/cyrillic-500.css'
import '@fontsource/jetbrains-mono/latin-400.css'
import '@fontsource/jetbrains-mono/cyrillic-400.css'

// Японский: Noto Serif JP, урезанный только до используемых на сайте символов.
// Если добавишь новые японские слова — см. README («Японские символы»).
import jpRegular from './assets/noto-serif-jp-Regular.woff2'
import jpSemi from './assets/noto-serif-jp-SemiBold.woff2'
// Плакатный шрифт Dela Gothic One (SIL OFL) — латиница, кириллица и японские символы сайта, один файл.
import delaGothic from './assets/dela-gothic-one.woff2'

const css = `
@font-face{font-family:'Noto Serif JP';font-weight:400;font-display:swap;src:url(${jpRegular}) format('woff2')}
@font-face{font-family:'Noto Serif JP';font-weight:600;font-display:swap;src:url(${jpSemi}) format('woff2')}
@font-face{font-family:'Dela Gothic One';font-weight:400;font-display:swap;src:url(${delaGothic}) format('woff2')}`
const style = document.createElement('style')
style.textContent = css
document.head.appendChild(style)
