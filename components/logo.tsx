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

const LOCKUPS = {
  assist: { name: "Lane Assist", sub: "by BotLane", label: "Lane Assist by BotLane" },
  botlane: { name: "botLane", sub: "India", label: "BotLane India" },
};

export function Logo({ variant = "assist", href = "#top" }: { variant?: keyof typeof LOCKUPS; href?: string }) {
  const l = LOCKUPS[variant];
  return (
    <a href={href} aria-label={`${l.label}, home`} className="inline-flex items-center gap-2.5 rounded-md">
      <LogoMark />
      <span className="flex flex-col gap-[3px] whitespace-nowrap">
        <span className="text-[16px] leading-none font-semibold tracking-[-0.01em] text-ink">{l.name}</span>
        <span className="text-[11px] leading-none font-medium text-ink-2">{l.sub}</span>
      </span>
    </a>
  );
}
