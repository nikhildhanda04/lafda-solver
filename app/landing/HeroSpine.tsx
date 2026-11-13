"use client";

import { useState } from "react";

const PLACEHOLDER = "She cancelled the trip the night before, after I had already paid.";

/**
 * The versus screen: your side beside theirs, a real case's first step.
 *
 * The live thing is the sealed panel. Trying to read the other side is the
 * one move a visitor will want to make, and the page lets them make it and
 * then says no, which is the product's only structural rule demonstrated
 * rather than asserted.
 */
export default function HeroSpine() {
  const [body, setBody] = useState("");
  const [peeked, setPeeked] = useState(false);

  return (
    <div className="court-stage">
      <div className="sides">
        <section className="side side--you" data-ui>
          <header>
            <h3>Your side</h3>
            <span className="meta">{body ? "Saved" : "Step 1 of 5"}</span>
          </header>
          <label className="demo-label" htmlFor="demo-body">
            In a sentence or two, what is this about?
          </label>
          <textarea
            id="demo-body"
            className="input"
            value={body}
            placeholder={PLACEHOLDER}
            onChange={(e) => setBody(e.target.value.slice(0, 4000))}
          />
          <div className="demo-foot">
            <span className="num">{body.length.toLocaleString()} of 4,000 characters</span>
            <span>Saves by itself as you type</span>
          </div>
        </section>

        <p className="vs display" aria-hidden="true">vs</p>

        <button
          type="button"
          className={`side side--them${peeked ? " peeked" : ""}`}
          data-ui
          onClick={() => setPeeked(true)}
          aria-label="Try to read the other person's side"
        >
          <span className="demo-sealed-head">
            <span className="h">Their side</span>
            <span className="tag">{peeked ? "Sealed" : "Writing"}</span>
          </span>
          <span className="demo-sealed-body">
            {peeked
              ? "No. Not until you have both locked. That is the only reason either of you can trust what the other one wrote."
              : "They are answering the same five steps right now. Tap to read it."}
          </span>
        </button>
      </div>

      <p className="scales-note" aria-live="polite">
        {peeked
          ? "Nothing was hidden in the page for you to find. The server refuses to send it until you have both locked."
          : "Clawd never learns which side is which. Both accounts are relabelled in a random order before it reads a word."}
      </p>
    </div>
  );
}
