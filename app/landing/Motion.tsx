"use client";

import { useEffect } from "react";

/**
 * The motion layer. Everything is visible without script: this only adds the
 * `js` class, which is what the CSS keys the hidden-then-revealed states off,
 * so a failed script leaves a complete page rather than a blank one.
 */
export default function Motion() {
  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    root.classList.add("js");

    // The page's one reveal: each section's parts rise once, in reading order.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          el.classList.add("is-in");
          el.querySelectorAll<HTMLElement>("[data-rise]").forEach((child, i) => {
            child.style.transitionDelay = `${i * 70}ms`;
          });
          io.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));

    return () => io.disconnect();
  }, []);

  return null;
}
