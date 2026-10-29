"use client";

import { useState } from "react";

const PLACEHOLDER = "She cancelled the trip the night before, after I had already paid.";

/**
 * The live thing. A real opening-statement box beside the sealed column, at
 * true interface size. Typing works; the other half will not open, and says why.
 */
export default function HeroSpine() {
  const [body, setBody] = useState("");
  const [peeked, setPeeked] = useState(false);

  return (
    <div className="spine-demo" data-ui>
      <section className="panel demo-write">
        <header>
          <h3>Opening statement</h3>
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

      <button
        type="button"
        className={`panel demo-sealed${peeked ? " peeked" : ""}`}
        onClick={() => setPeeked(true)}
        aria-label="Try to read the other person's side"
      >
        <span className="demo-sealed-head">
          <span className="h">Their side</span>
          <span className="pill">Writing</span>
        </span>
        <span className="demo-sealed-body">
          {peeked
            ? "No. Not until you have both locked. That is the only reason either of you can trust what the other one wrote."
            : "They are answering the same five steps right now. Try to read it."}
        </span>
      </button>
    </div>
  );
}
