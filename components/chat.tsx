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

export function Bubble({
  from,
  children,
  meta,
}: {
  from: "customer" | "desk";
  children: React.ReactNode;
  meta?: React.ReactNode;
}) {
  const customer = from === "customer";
  return (
    <div className={`flex flex-col gap-1.5 ${customer ? "items-start" : "items-end"}`}>
      <span className="sr-only">{customer ? "Customer:" : "Lane Desk:"}</span>
      <div
        className={`max-w-[88%] rounded-[10px] px-3.5 py-2.5 text-[15px] leading-[1.45] ${
          customer
            ? "rounded-tl-[3px] bg-surface-2 text-ink"
            : "rounded-tr-[3px] border border-hairline bg-surface text-ink shadow-card"
        }`}
      >
        {children}
      </div>
      {meta ? <div className="flex flex-wrap items-center gap-2">{meta}</div> : null}
    </div>
  );
}
