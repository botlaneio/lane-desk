"use client";

import { useEffect, useRef } from "react";

// The header's background layer: hidden at the top of the page, shown once the page scrolls.
export function HeaderBackdrop() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => el.toggleAttribute("data-scrolled", window.scrollY > 4);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className="nav-backdrop pointer-events-none absolute inset-0 border-b border-hairline bg-surface"
    />
  );
}
