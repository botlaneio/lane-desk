"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

export type Route = {
  name: string;
  example: string;
  path: string;
  llm: boolean;
};

const STEP_MS = 2600;

export function RouteCycler({ routes }: { routes: Route[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const inView = useInView(ref, { margin: "-80px" });
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const cycling = inView && !reduce && !paused;

  useEffect(() => {
    if (!cycling) return;
    const t = setInterval(() => setActive((i) => (i + 1) % routes.length), STEP_MS);
    return () => clearInterval(t);
  }, [cycling, routes.length]);

  return (
    <ol
      ref={ref}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
      onMouseLeave={() => setPaused(false)}
    >
      {routes.map((r, i) => {
        const isActive = i === active;
        return (
          <li
            key={r.name}
            aria-current={isActive ? "step" : undefined}
            onMouseEnter={() => {
              setActive(i);
              setPaused(true);
            }}
            className="relative flex flex-col gap-3 rounded-card border border-hairline bg-surface p-5 shadow-card"
          >
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute -inset-px rounded-card border-2 border-orange bg-orange-wash"
              initial={false}
              animate={{ opacity: isActive ? 1 : 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
            {isActive && cycling ? (
              <motion.span
                key={active}
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-3 bottom-2 h-0.5 origin-left rounded-full bg-orange"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: STEP_MS / 1000, ease: "linear" }}
              />
            ) : null}
            <div className="relative flex items-center justify-between gap-2">
              <span className="font-mono text-[12px] font-medium text-ink-2">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className={`chip ${r.llm ? "chip-quiet" : "chip-outline"}`}>
                {r.llm ? "AI draft → guard" : "No LLM"}
              </span>
            </div>
            <h3 className="relative text-[17px] font-semibold leading-snug tracking-[-0.01em]">{r.name}</h3>
            <p className="relative font-mono text-[13px] leading-snug text-ink-2">“{r.example}”</p>
            <p className="relative mt-auto text-[15px] leading-normal text-ink">{r.path}</p>
          </li>
        );
      })}
    </ol>
  );
}
