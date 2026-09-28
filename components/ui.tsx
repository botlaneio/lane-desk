export function Eyebrow({ children, onInk = false }: { children: React.ReactNode; onInk?: boolean }) {
  return <p className={`t-eyebrow ${onInk ? "text-on-ink-2" : ""}`}>{children}</p>;
}

export function Check({ onInk = false }: { onInk?: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
      className={`mt-[3px] size-4 shrink-0 ${onInk ? "stroke-on-ink-2" : "stroke-ink-2"}`}
      fill="none"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  );
}

export function Arrow({ delay }: { delay: number }) {
  const style = { "--d": `${delay}ms` } as React.CSSProperties;
  return (
    <span aria-hidden="true" className="flex items-center justify-center py-1 md:py-0">
      <span className="relative flex h-6 w-px items-center justify-center bg-border md:h-px md:w-8">
        <span className="flow-dot-y absolute size-1.5 rounded-full bg-ink md:hidden" style={style} />
        <span className="flow-dot absolute hidden size-1.5 rounded-full bg-ink md:block" style={style} />
      </span>
    </span>
  );
}

export const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;
