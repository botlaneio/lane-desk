export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={`lm ${className}`} aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="8" className="fill-ink" />
      <g className="lm-eye">
        <rect x="6" y="12.5" width="20" height="7" rx="3.5" className="fill-surface" />
        <circle className="lm-dot fill-orange" cx="10" cy="16" r="2.25" />
      </g>
    </svg>
  );
}

export function Logo() {
  return (
    <a href="#top" aria-label="Lane Assist by BotLane, back to top" className="inline-flex items-center gap-2.5 rounded-md">
      <LogoMark />
      <span className="flex items-baseline gap-1.5 whitespace-nowrap text-[15px] leading-none">
        <span className="font-medium text-ink-2">botLane</span>
        <span className="text-border" aria-hidden="true">/</span>
        <span className="font-semibold tracking-[-0.01em] text-ink">Lane Assist</span>
      </span>
    </a>
  );
}
