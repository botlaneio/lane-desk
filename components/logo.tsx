const PLATE =
  "M8 0h16a8 8 0 0 1 8 8v16a8 8 0 0 1-8 8H8a8 8 0 0 1-8-8V8a8 8 0 0 1 8-8Z" +
  "M9.5 12.5h13a3.5 3.5 0 0 1 0 7h-13a3.5 3.5 0 0 1 0-7Z";

export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <path d={PLATE} fillRule="evenodd" className="fill-ink" />
      <circle cx="10" cy="16" r="2.25" className="fill-orange" />
    </svg>
  );
}

export function Logo() {
  return (
    <a href="#top" aria-label="Lane Desk by BotLane, back to top" className="inline-flex items-center gap-2.5 rounded-md">
      <LogoMark />
      <span className="flex items-baseline gap-1.5 whitespace-nowrap text-[15px] leading-none">
        <span className="font-medium text-ink-2">botLane</span>
        <span className="text-border" aria-hidden="true">/</span>
        <span className="font-semibold tracking-[-0.01em] text-ink">Lane Desk</span>
      </span>
    </a>
  );
}
