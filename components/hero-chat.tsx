"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { ILLUSTRATIVE } from "@/components/chat";

type Scene = {
  title: string;
  ask: string;
  checks: string[];
  reply: string;
  verdict: { label: string; tone: "verified" | "handoff" };
};

const SCENES: Scene[] = [
  {
    title: "Order status",
    ask: "Hi, where’s my order? It’s #1042",
    checks: ["Number matched", "Order found", "No LLM"],
    reply: "Hi Priya, order #1042 left our warehouse on 14 Oct with Delhivery. Expected delivery: 17 Oct.",
    verdict: { label: "Verified", tone: "verified" },
  },
  {
    title: "Return question",
    ask: "Can I return these? They arrived 5 days ago.",
    checks: ["Policy wording", "Days counted in code", "Guard passed"],
    reply: "Yes. Returns are open for 7 days from delivery, so you have 2 days left. Reply RETURN to start.",
    verdict: { label: "Verified", tone: "verified" },
  },
  {
    title: "Handoff",
    ask: "Second wrong item. I want to talk to a person.",
    checks: ["Asked for a person", "Whole chat sent to owner"],
    reply: "I’ve passed your chat to the store team. They can see everything, so you won’t need to repeat it.",
    verdict: { label: "With the owner", tone: "handoff" },
  },
];

const SCENE_MS = 8000;
const FADE_MS = 350;

const d = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

export function HeroChat() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref);
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);

  const running = inView && !reduce && !paused && !hovered;

  useEffect(() => {
    if (!running) return;
    const out = setTimeout(() => setLeaving(true), SCENE_MS);
    const next = setTimeout(() => {
      setIndex((i) => (i + 1) % SCENES.length);
      setLeaving(false);
    }, SCENE_MS + FADE_MS);
    return () => {
      clearTimeout(out);
      clearTimeout(next);
    };
  }, [running, index]);

  const scene = SCENES[index];
  // The first scene waits for the hero entrance; later scenes start at once.
  const base = index === 0 ? 700 : 150;
  const replyAt = base + 900 + scene.checks.length * 400;

  return (
    <figure
      ref={ref}
      aria-label="Illustrative WhatsApp conversations handled by Lane Desk"
      className="overflow-hidden rounded-card border border-hairline bg-surface shadow-pop"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <figcaption className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3">
        <span key={scene.title} className="chat-play">
          <span className="seq block text-[14px] font-semibold" style={d(index === 0 ? base : 0)}>
            {scene.title}
          </span>
        </span>
        <span className="font-mono text-[11px] font-medium tracking-[0.04em] text-ink-2">WHATSAPP</span>
      </figcaption>

      <div className="bg-paper px-4 py-5">
        <div
          key={index}
          className="chat-play flex min-h-[284px] flex-col gap-3 transition-opacity sm:min-h-[212px]"
          style={{ opacity: leaving ? 0 : 1, transitionDuration: `${FADE_MS}ms` }}
        >
          <div className="seq flex flex-col items-start" style={d(base)}>
            <span className="sr-only">Customer:</span>
            <p className="max-w-[88%] rounded-[10px] rounded-tl-[3px] bg-surface-2 px-3.5 py-2.5 text-[15px] leading-[1.45]">
              {scene.ask}
            </p>
          </div>

          <ul className="flex flex-wrap justify-end gap-1.5" aria-label="Checks">
            {scene.checks.map((c, i) => (
              <li
                key={c}
                className="pop inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-2 py-0.5 font-mono text-[11px] font-medium tracking-[0.04em] text-ink-2 uppercase"
                style={d(base + 900 + i * 400)}
              >
                <span aria-hidden="true" className="text-verified">
                  ✓
                </span>
                {c}
              </li>
            ))}
          </ul>

          <div className="grid justify-items-end">
            <div
              aria-hidden="true"
              className="typing col-start-1 row-start-1 flex h-10 items-center gap-1 self-start rounded-[10px] rounded-tr-[3px] border border-hairline bg-surface px-3.5"
              style={d(base + 400)}
            >
              <i />
              <i />
              <i />
            </div>
            <div className="col-start-1 row-start-1 flex flex-col items-end gap-1.5">
              <span className="sr-only">Lane Desk:</span>
              <p
                className="seq max-w-[88%] rounded-[10px] rounded-tr-[3px] border border-hairline bg-surface px-3.5 py-2.5 text-[15px] leading-[1.45] shadow-card"
                style={d(replyAt)}
              >
                {scene.reply}
              </p>
              <span
                className={`pop chip ${scene.verdict.tone === "verified" ? "chip-verified" : "chip-outline"}`}
                style={d(replyAt + 400)}
              >
                {scene.verdict.tone === "verified" ? <span aria-hidden="true">✓</span> : null}
                {scene.verdict.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-hairline px-4 py-2.5">
        <p className="font-mono text-[11px] font-medium tracking-[0.04em] text-ink-2">{ILLUSTRATIVE}</p>
        <div className="flex items-center gap-2">
          <span className="flex gap-1" aria-hidden="true">
            {SCENES.map((s, i) => (
              <span
                key={s.title}
                className={`block size-1.5 rounded-full bg-ink transition-opacity ${i === index ? "opacity-100" : "opacity-20"}`}
              />
            ))}
          </span>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-pressed={paused}
            className="rounded px-1 font-mono text-[11px] font-medium tracking-[0.04em] text-ink-2 hover:text-ink"
          >
            {paused ? "PLAY" : "PAUSE"}
          </button>
        </div>
      </div>
    </figure>
  );
}
