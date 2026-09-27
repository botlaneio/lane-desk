"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

// Replays the .seq/.pop/.fade/.scan animations inside it each time it comes into view,
// and again every `every` ms while it stays in view. Content that is already on screen
// when the page loads is left in its final state so nothing flashes.
export function Replay({
  children,
  className,
  every = 0,
}: {
  children: React.ReactNode;
  className?: string;
  every?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [armed, setArmed] = useState(false);
  const [inView, setInView] = useState(false);
  const [run, setRun] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return;
    setArmed(true);
    const io = new IntersectionObserver(
      ([e]) => {
        setInView(e.isIntersecting);
        if (e.isIntersecting) setRun((n) => n + 1);
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  useEffect(() => {
    if (!every || !inView || !armed) return;
    const t = setInterval(() => setRun((n) => n + 1), every);
    return () => clearInterval(t);
  }, [every, inView, armed]);

  return (
    <div ref={ref} className={`${className ?? ""} ${armed ? "armed" : ""}`}>
      <div key={run} className={run > 0 ? "play contents" : "contents"}>
        {children}
      </div>
    </div>
  );
}
