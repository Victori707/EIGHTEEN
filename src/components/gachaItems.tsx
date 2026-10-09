import type { GachaItemId } from '../content/siteContent'

/**
 * Иллюстрации призов гачапона — маленькие коллекционные игрушки.
 * Все рисунки в одном viewBox 240×240; `uid` нужен, чтобы id градиентов
 * не пересекались, когда один предмет нарисован на странице дважды.
 */
export function GachaItemArt({ id, uid, className = '' }: { id: GachaItemId; uid: string; className?: string }) {
  const p = (s: string) => `${id}-${uid}-${s}`
  const u = (s: string) => `url(#${p(s)})`
  const shadow = <ellipse cx="120" cy="222" rx="70" ry="9" fill="#171517" opacity=".16" />

  switch (id) {
    case 'fox':
      return (
        <svg viewBox="0 0 240 240" className={className} aria-hidden>
          <defs>
            <linearGradient id={p('ring')} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#f4f1ec" />
              <stop offset=".45" stopColor="#a9a6a2" />
              <stop offset=".7" stopColor="#e9e6e1" />
              <stop offset="1" stopColor="#7d7a76" />
            </linearGradient>
            <linearGradient id={p('fur')} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f39a4a" />
              <stop offset="1" stopColor="#d6602a" />
            </linearGradient>
          </defs>
          {shadow}
          {/* split ring + jump ring */}
          <circle cx="120" cy="38" r="24" fill="none" stroke={u('ring')} strokeWidth="6" />
          <path d="M101 26 a24 24 0 0 1 22 -12" fill="none" stroke="#fff" strokeWidth="2" opacity=".8" strokeLinecap="round" />
          <ellipse cx="120" cy="68" rx="5" ry="8" fill="none" stroke={u('ring')} strokeWidth="3.2" />
          <ellipse cx="120" cy="84" rx="5" ry="9" fill="none" stroke={u('ring')} strokeWidth="3.2" />
          {/* acrylic charm: white border, then the fox */}
          <g filter="drop-shadow(0 6px 6px rgba(23,21,23,.22))">
            <circle cx="120" cy="100" r="11" fill="#fdfbf7" />
            <path d="M60 128 L78 84 L104 118 Q120 112 136 118 L162 84 L180 128 Q186 168 150 194 Q120 212 90 194 Q54 168 60 128Z" fill="#fdfbf7" stroke="#fdfbf7" strokeWidth="16" strokeLinejoin="round" />
          </g>
          <circle cx="120" cy="100" r="4.5" fill="#e7ddcd" stroke="#cfc6b8" strokeWidth="1" />
          <path d="M60 128 L78 84 L104 118 Q120 112 136 118 L162 84 L180 128 Q186 168 150 194 Q120 212 90 194 Q54 168 60 128Z" fill={u('fur')} />
          <path d="M76 120 L81 98 L96 118Z" fill="#3a1b14" />
          <path d="M164 120 L159 98 L144 118Z" fill="#3a1b14" />
          <path d="M120 156 Q100 158 84 174 Q100 200 120 204 Q140 200 156 174 Q140 158 120 156Z" fill="#fff8ee" />
          <path d="M90 148 q9 8 18 0" fill="none" stroke="#2a1a17" strokeWidth="4.2" strokeLinecap="round" />
          <path d="M132 148 q9 8 18 0" fill="none" stroke="#2a1a17" strokeWidth="4.2" strokeLinecap="round" />
          <ellipse cx="88" cy="166" rx="9" ry="5" fill="#ef7d6a" opacity=".55" />
          <ellipse cx="152" cy="166" rx="9" ry="5" fill="#ef7d6a" opacity=".55" />
          <ellipse cx="120" cy="176" rx="7" ry="5" fill="#2a1a17" />
          <path d="M70 126 Q76 106 90 104" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".45" />
        </svg>
      )

    case 'omamori':
      return (
        <svg viewBox="0 0 240 240" className={className} aria-hidden>
          <defs>
            <linearGradient id={p('fab')} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#d43c30" />
              <stop offset="1" stopColor="#97211d" />
            </linearGradient>
            <pattern id={p('pat')} width="14" height="14" patternUnits="userSpaceOnUse">
              <path d="M0 7 a7 7 0 0 1 14 0" fill="none" stroke="#e9c27a" strokeWidth=".9" opacity=".55" />
              <path d="M-7 14 a7 7 0 0 1 14 0 M7 14 a7 7 0 0 1 14 0" fill="none" stroke="#e9c27a" strokeWidth=".9" opacity=".55" />
            </pattern>
          </defs>
          {shadow}
          {/* cord loop */}
          <path d="M120 80 C 96 46 98 18 120 16 C 142 18 144 46 120 80" fill="none" stroke="#a9773f" strokeWidth="7" />
          <path d="M120 80 C 96 46 98 18 120 16 C 142 18 144 46 120 80" fill="none" stroke="#f3dfae" strokeWidth="4" />
          <g filter="drop-shadow(0 8px 8px rgba(23,21,23,.25))">
            <path d="M70 98 L94 74 L146 74 L170 98 L170 208 Q170 214 164 214 L76 214 Q70 214 70 208Z" fill={u('fab')} />
          </g>
          <path d="M70 98 L94 74 L146 74 L170 98 L170 208 Q170 214 164 214 L76 214 Q70 214 70 208Z" fill={u('pat')} />
          <path d="M78 101 L97 82 L143 82 L162 101 L162 205 L78 205Z" fill="none" stroke="#e9c27a" strokeWidth="1.4" strokeDasharray="4 3" />
          <rect x="99" y="104" width="42" height="88" fill="#f6ecd6" stroke="#c89a63" strokeWidth="1.4" />
          <rect x="103" y="108" width="34" height="80" fill="none" stroke="#c89a63" strokeWidth=".6" />
          <text x="120" y="141" textAnchor="middle" fontFamily="'Dela Gothic One', sans-serif" fontSize="26" fill="#681f32">御</text>
          <text x="120" y="176" textAnchor="middle" fontFamily="'Dela Gothic One', sans-serif" fontSize="26" fill="#681f32">守</text>
          {/* decorative knot */}
          <g fill="#f3dfae" stroke="#a9773f" strokeWidth="1.2">
            <ellipse cx="108" cy="80" rx="9" ry="6" />
            <ellipse cx="132" cy="80" rx="9" ry="6" />
            <circle cx="120" cy="80" r="6.5" />
          </g>
          <path d="M80 110 L80 196" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".12" />
        </svg>
      )

    case 'camera':
      return (
        <svg viewBox="0 0 240 240" className={className} aria-hidden>
          <defs>
            <linearGradient id={p('body')} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fbf7f0" />
              <stop offset="1" stopColor="#e4d9c7" />
            </linearGradient>
            <linearGradient id={p('sky')} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f2b27a" />
              <stop offset="1" stopColor="#c8564a" />
            </linearGradient>
            <radialGradient id={p('lens')} cx=".38" cy=".35">
              <stop offset="0" stopColor="#4a5160" />
              <stop offset="1" stopColor="#0e0d10" />
            </radialGradient>
            <clipPath id={p('clip')}>
              <rect x="48" y="84" width="144" height="122" rx="24" />
            </clipPath>
          </defs>
          {shadow}
          {/* print coming out of the top slot */}
          <g style={{ rotate: '-4deg', transformOrigin: '120px 80px' }}>
            <rect x="84" y="24" width="72" height="70" fill="#fbf8f2" stroke="#ddd3c3" />
            <rect x="90" y="30" width="60" height="44" fill={u('sky')} />
            <circle cx="132" cy="44" r="7" fill="#fbe3b6" />
            <path d="M90 74 L106 56 L116 64 L128 52 L150 74Z" fill="#4e1626" />
          </g>
          <rect x="150" y="70" width="28" height="16" rx="5" fill="#d74c38" />
          <g filter="drop-shadow(0 10px 10px rgba(23,21,23,.25))">
            <rect x="48" y="84" width="144" height="122" rx="24" fill={u('body')} />
          </g>
          <rect x="48" y="166" width="144" height="40" fill="#681f32" clipPath={u('clip')} />
          <rect x="82" y="84" width="76" height="4" rx="2" fill="#171517" opacity=".55" />
          <rect x="62" y="98" width="36" height="20" rx="5" fill="#ece5d8" stroke="#cbbfab" />
          <path d="M68 102 l-3 12 M74 102 l-3 12 M80 102 l-3 12 M86 102 l-3 12 M92 102 l-3 12" stroke="#cbbfab" strokeWidth="1.2" />
          <rect x="156" y="98" width="22" height="16" rx="4" fill="#1b1919" />
          <circle cx="120" cy="146" r="36" fill="#f2ebdf" stroke="#cdbfa8" strokeWidth="2" />
          <circle cx="120" cy="146" r="28" fill="none" stroke="#c89a63" strokeWidth="1.2" />
          <circle cx="120" cy="146" r="25" fill="#2a2426" />
          <circle cx="120" cy="146" r="17" fill={u('lens')} />
          <circle cx="112" cy="138" r="5" fill="#fff" opacity=".7" />
          <circle cx="174" cy="186" r="4" fill="#c89a63" />
          <path d="M60 104 Q60 92 72 90" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".8" />
        </svg>
      )

    case 'ticket':
      return (
        <svg viewBox="0 0 240 240" className={className} aria-hidden>
          <defs>
            <linearGradient id={p('paper')} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#7d2840" />
              <stop offset="1" stopColor="#4e1626" />
            </linearGradient>
            <mask id={p('cut')}>
              <rect width="240" height="240" fill="#fff" />
              <circle cx="22" cy="120" r="12" fill="#000" />
              <circle cx="218" cy="120" r="12" fill="#000" />
              {Array.from({ length: 10 }, (_, i) => (
                <circle key={i} cx="164" cy={78 + i * 9.4} r="2.4" fill="#000" />
              ))}
            </mask>
          </defs>
          {shadow}
          <g style={{ rotate: '-8deg', transformOrigin: '120px 120px' }}>
            <g filter="drop-shadow(0 10px 10px rgba(23,21,23,.25))">
              <rect x="22" y="72" width="196" height="96" rx="8" fill={u('paper')} mask={u('cut')} />
            </g>
            <rect x="40" y="84" width="112" height="72" rx="3" fill="none" stroke="#c89a63" strokeWidth="1" />
            <rect x="44" y="88" width="104" height="64" rx="2" fill="none" stroke="#c89a63" strokeWidth=".5" opacity=".7" />
            <text x="96" y="106" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="8" letterSpacing="3" fill="#c89a63">TICKET</text>
            <text x="96" y="132" textAnchor="middle" fontFamily="'Cormorant Garamond', serif" fontStyle="italic" fontWeight="600" fontSize="24" fill="#f5f0e8">Admit one</text>
            <text x="96" y="147" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" letterSpacing="2" fill="#f5f0e8" opacity=".6">№ 0018</text>
            <path d="M191 108 c-4 -6 -14 -4 -13 4 c1 7 13 12 13 15 c0 -3 12 -8 13 -15 c1 -8 -9 -10 -13 -4z" fill="#d74c38" />
            <text x="191" y="146" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" letterSpacing="1.5" fill="#c89a63">10.10</text>
            <path d="M30 80 L150 80" stroke="#fff" strokeWidth="2" opacity=".15" />
          </g>
        </svg>
      )

    case 'cat':
      return (
        <svg viewBox="0 0 240 240" className={className} aria-hidden>
          <defs>
            <linearGradient id={p('fur')} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fffaf2" />
              <stop offset="1" stopColor="#e6dbc9" />
            </linearGradient>
            <linearGradient id={p('base')} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#7d2840" />
              <stop offset="1" stopColor="#4e1626" />
            </linearGradient>
            <clipPath id={p('head')}>
              <ellipse cx="120" cy="98" rx="48" ry="41" />
            </clipPath>
          </defs>
          {shadow}
          {/* base */}
          <ellipse cx="120" cy="208" rx="66" ry="15" fill="#3f1220" />
          <ellipse cx="120" cy="200" rx="66" ry="15" fill={u('base')} />
          <ellipse cx="104" cy="195" rx="30" ry="4" fill="#fff" opacity=".12" />
          {/* tail */}
          <path d="M156 194 C 192 194 200 160 180 148" fill="none" stroke="#e8ddcb" strokeWidth="16" strokeLinecap="round" />
          <path d="M186 158 C 184 152 182 150 180 148" fill="none" stroke="#2a2426" strokeWidth="16" strokeLinecap="round" />
          {/* body */}
          <path d="M76 200 C 64 158 74 122 120 120 C 166 122 176 158 164 200 Z" fill={u('fur')} />
          <path d="M140 132 C 160 140 166 164 160 186 C 150 178 142 156 140 132Z" fill="#2a2426" opacity=".9" />
          <ellipse cx="102" cy="198" rx="14" ry="9" fill="#fffaf2" stroke="#e1d5c2" />
          <ellipse cx="138" cy="198" rx="14" ry="9" fill="#fffaf2" stroke="#e1d5c2" />
          <path d="M98 201 v-4 M104 201 v-4 M134 201 v-4 M140 201 v-4" stroke="#d9ccb7" strokeWidth="1.4" strokeLinecap="round" />
          {/* ears */}
          <path d="M80 82 L78 42 L110 64Z" fill="#2a2426" />
          <path d="M160 82 L162 42 L130 64Z" fill="#2a2426" />
          <path d="M86 76 L85 54 L103 66Z" fill="#f2a99b" />
          <path d="M154 76 L155 54 L137 66Z" fill="#f2a99b" opacity=".7" />
          {/* head with patches */}
          <ellipse cx="120" cy="98" rx="48" ry="41" fill={u('fur')} />
          <g clipPath={u('head')}>
            <ellipse cx="86" cy="72" rx="30" ry="24" fill="#2a2426" />
            <ellipse cx="160" cy="70" rx="24" ry="20" fill="#2a2426" />
          </g>
          <path d="M98 102 q8 -8 16 0" fill="none" stroke="#2a2426" strokeWidth="3.6" strokeLinecap="round" />
          <path d="M126 102 q8 -8 16 0" fill="none" stroke="#2a2426" strokeWidth="3.6" strokeLinecap="round" />
          <ellipse cx="96" cy="116" rx="8" ry="4.5" fill="#f2a99b" opacity=".6" />
          <ellipse cx="144" cy="116" rx="8" ry="4.5" fill="#f2a99b" opacity=".6" />
          <path d="M116 111 h8 l-4 5z" fill="#e88a86" />
          <path d="M114 119 q3 4 6 0 q3 4 6 0" fill="none" stroke="#2a2426" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M78 110 l-18 -3 M78 116 l-18 3 M162 110 l18 -3 M162 116 l18 3" stroke="#b8a798" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M88 80 Q96 66 112 64" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".55" />
        </svg>
      )

    case 'letter':
      return (
        <svg viewBox="0 0 240 240" className={className} aria-hidden>
          <defs>
            <radialGradient id={p('wax')} cx=".38" cy=".32">
              <stop offset="0" stopColor="#ea6a52" />
              <stop offset="1" stopColor="#a52c26" />
            </radialGradient>
          </defs>
          {shadow}
          <g style={{ rotate: '-6deg', transformOrigin: '120px 130px' }}>
            <g filter="drop-shadow(0 10px 10px rgba(23,21,23,.22))">
              <rect x="34" y="70" width="172" height="116" rx="6" fill="#f6eddd" />
            </g>
            <path d="M34 186 L120 124 L206 186Z" fill="#efe4d0" />
            <path d="M34 76 L100 130 M206 76 L140 130" stroke="#e2d6c1" strokeWidth="1.2" />
            <path d="M34 72 Q34 70 38 70 L202 70 Q206 70 206 72 L120 140Z" fill="#ebdfc9" stroke="#ddd0b8" strokeWidth="1" />
            {/* wax seal with heart */}
            <path
              d="M120 114 c6 -2 10 2 15 3 c6 1 9 6 8 12 c-1 5 3 9 0 14 c-3 5 -9 5 -13 8 c-5 3 -10 3 -15 0 c-5 -3 -10 -3 -13 -8 c-3 -5 1 -9 0 -14 c-1 -6 2 -11 8 -12 c4 -1 6 -5 10 -3z"
              fill={u('wax')}
            />
            <circle cx="120" cy="136" r="15" fill="none" stroke="#8f2622" strokeWidth="1.2" opacity=".7" />
            <path d="M120 144 c-8 -6 -12 -9 -12 -14 c0 -4 3 -6 6 -6 c3 0 5 2 6 4 c1 -2 3 -4 6 -4 c3 0 6 2 6 6 c0 5 -4 8 -12 14z" fill="#8f2622" />
            <path d="M109 124 q4 -5 10 -5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".45" />
          </g>
          {/* little sparkles */}
          <g fill="#c89a63">
            <path d="M46 46 l3 9 l9 3 l-9 3 l-3 9 l-3 -9 l-9 -3 l9 -3z" />
            <path d="M196 36 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 l6 -2z" />
            <path d="M206 196 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 l6 -2z" />
          </g>
        </svg>
      )
  }
}
