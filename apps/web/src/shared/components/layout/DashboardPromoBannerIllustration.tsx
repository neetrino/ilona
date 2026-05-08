/**
 * Compact flat illustration for the dashboard promo banner (right column, sm+).
 */
export function DashboardPromoBannerIllustration() {
  return (
    <svg
      viewBox="0 0 220 100"
      className="h-[10.5rem] w-auto max-w-full text-slate-900 sm:h-[12.5rem]"
      aria-hidden
    >
      <ellipse cx="110" cy="94" rx="88" ry="6" className="fill-white/25" />
      {/* Figure left */}
      <g className="fill-slate-900">
        <ellipse cx="52" cy="38" rx="10" ry="10" className="fill-slate-800" />
        <path d="M38 48 L66 48 L70 88 L34 88 Z" />
        <path d="M46 30 L58 30 L60 22 L44 22 Z" className="fill-slate-900" />
        <rect x="40" y="18" width="24" height="6" rx="1" className="fill-slate-900" />
      </g>
      {/* Figure center — diploma */}
      <g className="fill-slate-900">
        <ellipse cx="110" cy="36" rx="11" ry="11" className="fill-slate-800" />
        <path d="M94 46 L126 46 L130 86 L90 86 Z" />
        <path d="M102 28 L118 28 L120 20 L100 20 Z" />
        <rect x="96" y="14" width="28" height="7" rx="1" />
        <rect x="100" y="52" width="20" height="14" rx="2" className="fill-white/95" />
        <path
          d="M104 58 h12 M104 62 h8"
          stroke="#94a3b8"
          strokeWidth="1.2"
          fill="none"
        />
      </g>
      {/* Figure right */}
      <g className="fill-slate-900">
        <ellipse cx="168" cy="40" rx="10" ry="10" className="fill-slate-800" />
        <path d="M154 50 L182 50 L186 90 L150 90 Z" />
        <path d="M162 32 L174 32 L176 24 L160 24 Z" />
        <rect x="156" y="20" width="24" height="6" rx="1" />
        <path d="M178 54 L196 48 L194 62 Z" fill="#fde68a" stroke="#fcd34d" strokeWidth="0.8" />
      </g>
    </svg>
  );
}
