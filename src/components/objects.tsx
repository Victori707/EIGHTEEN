/** SVG-объекты: коробка омикудзи и камера. */

export function OmikujiBox({ className, label = true }: { className?: string; label?: boolean }) {
  return (
    <svg viewBox="0 0 160 220" className={className} aria-hidden>
      <ellipse cx="80" cy="206" rx="52" ry="7" fill="#1b1919" opacity=".14" />
      {/* hexagonal box: front faces */}
      <path d="M36 40 L80 30 L124 40 L124 196 L80 206 L36 196 Z" fill="#651f32" />
      <path d="M80 30 L124 40 L124 196 L80 206 Z" fill="#4e1626" />
      <path d="M36 40 L80 30 L124 40 L80 50 Z" fill="#7a2a3f" />
      <path d="M36 40 L80 50 L80 206 M80 50 L124 40" stroke="#c89a63" strokeWidth=".8" fill="none" opacity=".7" />
      {/* hole */}
      <ellipse cx="80" cy="40" rx="5" ry="2.4" fill="#1b1919" />
      {/* bands */}
      <path d="M36 62 L80 72 L124 62" stroke="#c89a63" strokeWidth="1.4" fill="none" />
      <path d="M36 176 L80 186 L124 176" stroke="#c89a63" strokeWidth="1.4" fill="none" />
      {label && (
        <>
          <rect x="47" y="84" width="22" height="84" fill="#f0e9dd" transform="skewY(12) translate(0 -14)" />
          <g transform="skewY(12) translate(0 -14)">
            {['お', 'み', 'く', 'じ'].map((ch, i) => (
              <text key={i} x="58" y={104 + i * 19} textAnchor="middle" fontFamily="Noto Serif JP, serif" fontSize="14" fill="#651f32">
                {ch}
              </text>
            ))}
          </g>
        </>
      )}
    </svg>
  )
}

export function CameraObj({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 190" className={className} aria-hidden>
      <ellipse cx="120" cy="182" rx="100" ry="7" fill="#1b1919" opacity=".15" />
      {/* body */}
      <rect x="14" y="20" width="212" height="158" rx="26" fill="#faf6ef" />
      <rect x="14" y="20" width="212" height="158" rx="26" fill="none" stroke="#b8a798" strokeWidth="1" />
      <path d="M14 128 h212 v24 a26 26 0 0 1 -26 26 h-160 a26 26 0 0 1 -26 -26z" fill="#651f32" />
      {/* film slot */}
      <rect x="62" y="20" width="116" height="5" rx="2.5" fill="#1b1919" opacity=".85" />
      {/* flash */}
      <rect x="28" y="36" width="56" height="30" rx="5" fill="#e7dfd2" stroke="#b8a798" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line key={i} x1={34 + i * 8} y1="40" x2={30 + i * 8} y2="62" stroke="#b8a798" strokeWidth="1" />
      ))}
      {/* viewfinder */}
      <rect x="176" y="38" width="30" height="22" rx="5" fill="#1b1919" />
      <rect x="181" y="42" width="10" height="7" rx="2" fill="#fff" opacity=".25" />
      {/* lens */}
      <circle cx="120" cy="100" r="54" fill="#efe7da" stroke="#b8a798" />
      <circle cx="120" cy="100" r="44" fill="#1b1919" />
      <circle cx="120" cy="100" r="40" fill="none" stroke="#c89a63" strokeWidth="1.2" />
      <circle cx="120" cy="100" r="28" fill="#2a2426" />
      <circle cx="120" cy="100" r="16" fill="#120f10" />
      <ellipse cx="108" cy="88" rx="9" ry="5" fill="#fff" opacity=".22" transform="rotate(-35 108 88)" />
      <circle cx="132" cy="110" r="3" fill="#fff" opacity=".12" />
      {/* label */}
      <text x="34" y="158" fontFamily="JetBrains Mono, monospace" fontSize="8" letterSpacing="2" fill="#f0e9dd">INSTANT · 18</text>
      <circle cx="198" cy="154" r="4" fill="#c89a63" />
    </svg>
  )
}
