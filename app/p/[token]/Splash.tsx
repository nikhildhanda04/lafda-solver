"use client";

import { useEffect, useRef } from "react";

/**
 * Guilty or not guilty: the words slam in, then the camera rushes into the O
 * and the case is already inside it.
 *
 * The O is a drawn ring rather than a glyph so its counter is an exact box. The
 * ring's huge box-shadow paints the splash's ground everywhere outside it, so
 * the counter is a real window onto the page underneath; scaling the whole
 * splash around that window is the zoom.
 *
 * Without script the CSS fades the splash on its own, and with reduced motion
 * it never shows, so it can never stand between anyone and their case.
 */
const HOLD = 1300;
const ZOOM = 1000;
const WARP = 950;

export default function Splash({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    const o = ring.current;
    const app = document.querySelector<HTMLElement>(".party-shell .canvas");
    if (!el || !o || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return onDone();
    el.classList.add("is-scripted");

    const r = o.getBoundingClientRect();
    const border = parseFloat(getComputedStyle(o).borderTopWidth);
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const W = window.innerWidth;
    const H = window.innerHeight;
    // Scale until the counter, corners included, covers the far edges of the screen.
    const scale = 1.3 * Math.max(
      Math.max(cx, W - cx) / (r.width / 2 - border),
      Math.max(cy, H - cy) / (r.height / 2 - border),
    );

    el.style.transformOrigin = `${cx}px ${cy}px`;
    const zoom = el.animate(
      [{ transform: "scale(1)" }, { transform: `scale(${scale})` }],
      { duration: ZOOM, delay: HOLD, easing: "cubic-bezier(0.7, 0, 0.84, 0)", fill: "forwards" },
    );

    let warp: Animation | undefined;
    if (app) {
      const a = app.getBoundingClientRect();
      app.style.transformOrigin = `${cx - a.left}px ${cy - a.top}px`;
      warp = app.animate(
        [
          { transform: "scale(0.82)", filter: "blur(8px)" },
          { transform: "scale(1)", filter: "blur(0px)" },
        ],
        { duration: WARP, delay: HOLD + 350, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "both" },
      );
    }

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      zoom.cancel();
      warp?.cancel();
      if (app) app.style.transformOrigin = "";
      onDone();
    };
    (warp ?? zoom).finished.then(finish, () => {});

    // Any key, click or tap skips straight to the case.
    const skip = () => finish();
    window.addEventListener("keydown", skip, { once: true });
    el.addEventListener("pointerdown", skip, { once: true });
    return () => {
      window.removeEventListener("keydown", skip);
      el.removeEventListener("pointerdown", skip);
      if (!finished) {
        finished = true;
        zoom.cancel();
        warp?.cancel();
      }
    };
  }, [onDone]);

  return (
    <div className="splash" ref={root}>
      <p className="visually-hidden">Guilty or not guilty</p>
      <p className="splash-words" aria-hidden="true">
        <span className="w"><span className="t t1">Guilty</span></span>
        <span className="w w-or">
          <span className="o" ref={ring} />
          <span className="t t2">r</span>
        </span>
        <span className="w"><span className="t t3">Not guilty</span></span>
      </p>
      <p className="splash-skip" aria-hidden="true">Press any key to skip</p>
    </div>
  );
}
