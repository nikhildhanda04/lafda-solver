"use client";

import { useEffect } from "react";

/**
 * The motion layer. Everything is visible without script — this only adds the
 * `js` class, which is what the CSS keys the hidden-then-revealed states off,
 * so a failed script leaves a complete page rather than a blank one.
 */
export default function Motion() {
  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    root.classList.add("js");

    // The signature move: the court assembles on load — seal, Clawd, the beam,
    // then a pan onto each end of it.
    const stage = document.querySelector<HTMLElement>(".court-stage");
    requestAnimationFrame(() => stage?.classList.add("is-in"));

    // Section entrances, in reading order, staggered.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          el.classList.add("is-in");
          el.querySelectorAll<HTMLElement>("[data-rise]").forEach((child, i) => {
            child.style.transitionDelay = `${i * 70}ms`;
            child.classList.add("is-in");
          });
          io.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));

    // The one moving picture: the room sinks against the scroll while the
    // scales hanging in front of it stay put, so the bench gains depth.
    const spine = document.querySelector<HTMLElement>(".court");
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!spine) return;
        const y = Math.min(window.scrollY, 900);
        spine.style.transform = `translate3d(0, ${(y * 0.08).toFixed(1)}px, 0)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
