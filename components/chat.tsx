export const ILLUSTRATIVE = "AN ILLUSTRATIVE FLOW · NO CUSTOMER DATA";

export function FlowCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <figure className={`overflow-hidden rounded-card border border-hairline bg-surface shadow-pop ${className}`}>
      <figcaption className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3">
        <span className="text-[14px] font-semibold">{title}</span>
        <span className="font-mono text-[11px] font-medium tracking-[0.04em] text-ink-2">WHATSAPP</span>
      </figcaption>
      <div className="flex flex-col gap-3 bg-paper px-4 py-5">{children}</div>
      <p className="border-t border-hairline px-4 py-2.5 font-mono text-[11px] font-medium tracking-[0.04em] text-ink-2">
        {ILLUSTRATIVE}
      </p>
    </figure>
  );
}

const d = (ms?: number) => (ms === undefined ? undefined : ({ "--d": `${ms}ms` }) as React.CSSProperties);

// at / scanAt / metaAt are animation delays in ms, used inside <Replay>.
export function Bubble({
  from,
  children,
  meta,
  at,
  scanAt,
  metaAt,
}: {
  from: "customer" | "desk";
  children: React.ReactNode;
  meta?: React.ReactNode;
  at?: number;
  scanAt?: number;
  metaAt?: number;
}) {
  const customer = from === "customer";
  return (
    <div
      className={`flex flex-col gap-1.5 ${customer ? "items-start" : "items-end"} ${at === undefined ? "" : "seq"}`}
      style={d(at)}
    >
      <span className="sr-only">{customer ? "Customer:" : "Lane Assist:"}</span>
      <div
        className={`relative max-w-[88%] overflow-hidden rounded-[10px] px-3.5 py-2.5 text-[15px] leading-[1.45] ${
          customer
            ? "rounded-tl-[3px] bg-surface-2 text-ink"
            : "rounded-tr-[3px] border border-hairline bg-surface text-ink shadow-card"
        }`}
      >
        {children}
        {scanAt === undefined ? null : (
          <span
            aria-hidden="true"
            className="scan pointer-events-none absolute inset-y-0 left-0 w-1/5 bg-ink/10"
            style={d(scanAt)}
          />
        )}
      </div>
      {meta ? (
        <div className={`flex flex-wrap items-center gap-2 ${metaAt === undefined ? "" : "pop"}`} style={d(metaAt)}>
          {meta}
        </div>
      ) : null}
    </div>
  );
}
