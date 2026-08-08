'use client';

export function LandingPremiumRocket() {
  return (
    <svg viewBox="0 0 200 92" className="h-full w-full overflow-visible">
      <defs>
        <linearGradient id="luxury-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.22" stopColor="#eef4fb" />
          <stop offset="0.48" stopColor="#aabbd0" />
          <stop offset="0.7" stopColor="#ffffff" />
          <stop offset="1" stopColor="#7489a5" />
        </linearGradient>
        <linearGradient id="luxury-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff9c9" />
          <stop offset="0.25" stopColor="#f7d35c" />
          <stop offset="0.5" stopColor="#ad7610" />
          <stop offset="0.72" stopColor="#ffe787" />
          <stop offset="1" stopColor="#81550b" />
        </linearGradient>
        <linearGradient id="luxury-blue" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#071d51" />
          <stop offset="0.5" stopColor="#1649a5" />
          <stop offset="1" stopColor="#061536" />
        </linearGradient>
        <radialGradient id="luxury-window" cx="32%" cy="25%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.18" stopColor="#a6ecff" />
          <stop offset="0.55" stopColor="#238ac4" />
          <stop offset="1" stopColor="#031b48" />
        </radialGradient>
        <linearGradient id="luxury-flame" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.18" stopColor="#fff4a3" />
          <stop offset="0.5" stopColor="#ff9b21" />
          <stop offset="1" stopColor="#ff3b12" stopOpacity="0" />
        </linearGradient>
        <filter id="luxury-shadow" x="-40%" y="-70%" width="200%" height="240%">
          <feDropShadow dx="0" dy="7" stdDeviation="6" floodColor="#031538" floodOpacity="0.38" />
        </filter>
        <filter id="luxury-glow" x="-100%" y="-150%" width="300%" height="400%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      <ellipse cx="72" cy="78" rx="67" ry="8" fill="#0b2450" opacity="0.13" filter="url(#luxury-glow)" />
      <path d="M38 38C17 38 2 43-17 46C2 49 17 54 38 54Z" fill="#ff7a17" opacity="0.58" filter="url(#luxury-glow)" />
      <path d="M38 39C17 40-3 46-24 46C-3 47 17 53 38 53Z" fill="url(#luxury-flame)">
        <animate
          attributeName="d"
          dur="0.16s"
          repeatCount="indefinite"
          values="M38 39C17 40-3 46-24 46C-3 47 17 53 38 53Z;M38 39C21 41 8 46-11 46C8 48 21 51 38 53Z;M38 39C17 40-3 46-24 46C-3 47 17 53 38 53Z"
        />
      </path>

      <g filter="url(#luxury-shadow)">
        <path
          d="M43 46C63 13 121 8 178 46C121 84 63 79 43 46Z"
          fill="url(#luxury-body)"
          stroke="#0a2454"
          strokeWidth="2.2"
        />
        <path d="M130 17C149 22 166 31 178 46C166 61 149 70 130 75C143 57 143 35 130 17Z" fill="url(#luxury-gold)" />
        <path d="M56 33C84 19 120 20 145 31" fill="none" stroke="white" strokeWidth="3.4" strokeLinecap="round" opacity="0.82" />
        <path d="M52 53C83 68 124 64 151 49" fill="none" stroke="#48698f" strokeWidth="1.5" strokeLinecap="round" opacity="0.42" />
        <path d="M73 67L39 86L43 53Z" fill="url(#luxury-gold)" stroke="#0a2454" strokeWidth="2.2" />
        <path d="M73 25L39 6L43 39Z" fill="url(#luxury-gold)" stroke="#0a2454" strokeWidth="2.2" />
        <path d="M44 36H27V56H44Z" fill="url(#luxury-blue)" stroke="#071a3f" strokeWidth="2" />
        <path d="M92 27C109 24 124 26 138 31L133 38C119 34 105 33 92 35Z" fill="url(#luxury-blue)" opacity="0.92" />
        <circle cx="86" cy="46" r="14.5" fill="url(#luxury-gold)" />
        <circle cx="86" cy="46" r="10" fill="url(#luxury-window)" stroke="#092657" strokeWidth="2" />
        <circle cx="83" cy="42.5" r="2.3" fill="white" opacity="0.88" />
        <path d="M146 28C158 33 168 39 178 46C168 53 158 59 146 64" fill="none" stroke="#fff2a6" strokeWidth="1.5" opacity="0.85" />
      </g>
    </svg>
  );
}
