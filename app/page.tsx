"use client";

import { useState } from "react";
import { MODE_LABEL, MODE_MEANS } from "@/lib/steps";

type Mode = keyof typeof MODE_LABEL;
type Created = { caseId: string; links: { a: string; b: string } };

export default function CreateCase() {
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<Mode>("COMMON_GROUND");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: title.trim(), mode }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not open the case.");
      setCreated(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open the case.");
    } finally {
      setSaving(false);
    }
  }

  if (created) return <Links created={created} title={title.trim()} mode={mode} />;

  return (
    <main className="canvas">
      <div className="title-row">
        <div>
          <h1>Settle a lafda</h1>
          <p className="sub">
            You and one other person each write your side, privately, in five steps. Neither of you
            sees the other&rsquo;s words until you have both finished. Then a mediator reads both and
            comes back with what you already agree on and what to do about the rest.
          </p>
        </div>
      </div>

      <div className="spine">
        <div className="rail">
          <section className="panel">
            <header>
              <h2>How it works</h2>
            </header>
            <div className="steps">
              <div className="step"><span className="n num">1</span><span className="name">You name the argument</span></div>
              <div className="step"><span className="n num">2</span><span className="name">You get two links</span></div>
              <div className="step"><span className="n num">3</span><span className="name">You send one to them</span></div>
              <div className="step"><span className="n num">4</span><span className="name">You each write your side</span></div>
              <div className="step"><span className="n num">5</span><span className="name">Both lock, the verdict runs</span></div>
            </div>
            <p className="hint" style={{ marginTop: 16 }}>
              There are no accounts and no passwords. The link is the only way in, so whoever holds a
              link is that side of the case.
            </p>
          </section>

          <section className="panel safety" aria-labelledby="safety-create">
            <h2 id="safety-create" style={{ fontSize: "var(--fs-body)", fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
              What this is not for
            </h2>
            <p>
              <b>This is for everyday disagreements.</b> Money, chores, plans, something that
              was said. It is not for abuse, coercion, threats or anyone&rsquo;s safety. If that is what
              is happening, a mediator is the wrong tool; please talk to someone who can actually
              help.
            </p>
          </section>
        </div>

        <form className="panel" onSubmit={submit}>
          <header>
            <h2>Open the case</h2>
          </header>

          <div className="field">
            <label htmlFor="title">What are you arguing about?</label>
            <p className="hint">
              A few words that you would both recognise. Both of you see this, so keep it neutral.
              &ldquo;The cancelled trip&rdquo;, not &ldquo;her ruining the trip&rdquo;.
            </p>
            <input
              id="title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
              placeholder="The cancelled weekend trip"
            />
          </div>

          <fieldset className="field" style={{ marginTop: 24, border: 0, padding: 0 }}>
            <legend style={{ fontWeight: 500, padding: 0 }}>How far should the mediator go?</legend>
            <p className="hint">
              You choose this now, and the other person sees it before they write a word.
            </p>
            <div className="choices">
              {(Object.keys(MODE_LABEL) as Mode[]).map((m) => (
                <label className="choice" key={m}>
                  <span className="top">
                    <input
                      type="radio"
                      name="mode"
                      value={m}
                      checked={mode === m}
                      onChange={() => setMode(m)}
                    />
                    {MODE_LABEL[m]}
                  </span>
                  <p>{MODE_MEANS[m]}</p>
                </label>
              ))}
            </div>
          </fieldset>

          {error && (
            <p role="alert" style={{ marginTop: 16, color: "#c4242a" }}>
              {error}
            </p>
          )}

          <div className="actions">
            <button className="btn primary" type="submit" disabled={saving || !title.trim()}>
              {saving ? "Opening…" : "Open the case"}
            </button>
            <span className="hint">Nothing is sent to anyone until you share a link.</span>
          </div>
        </form>
      </div>
    </main>
  );
}

function Links({ created, title, mode }: { created: Created; title: string; mode: Mode }) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return (
    <main className="canvas">
      <div className="title-row">
        <div>
          <h1>{title}</h1>
          <p className="sub">
            The case is open. {MODE_MEANS[mode]} Keep the first link for yourself and send the second
            one to the other person. Whoever opens it is the other side.
          </p>
        </div>
        <span className="stamp">Case {created.caseId.slice(-6)}</span>
      </div>

      <div className="spine">
        <section className="panel">
          <header>
            <h2>Your two links</h2>
          </header>
          <div className="links-out">
            <LinkCard
              heading="Yours, do not share this one"
              note="Open it now and start writing. You can come back to it as often as you like until you lock."
              url={origin + created.links.a}
            />
            <LinkCard
              heading="Theirs, send this one"
              note="Anyone who opens this becomes the other side of the case, so send it to exactly one person."
              url={origin + created.links.b}
            />
          </div>
        </section>

        <section className="panel">
          <header>
            <h2>What happens next</h2>
          </header>
          <div className="steps">
            <div className="step"><span className="n num">1</span><span className="name">You both write, blind</span><span className="state">no one sees the other</span></div>
            <div className="step"><span className="n num">2</span><span className="name">You each lock</span><span className="state">one way, no edits after</span></div>
            <div className="step"><span className="n num">3</span><span className="name">The mediator reads both</span><span className="state">under a minute</span></div>
            <div className="step"><span className="n num">4</span><span className="name">Both links show the same result</span><span className="state">at the same moment</span></div>
          </div>
          <p className="hint" style={{ marginTop: 16 }}>
            There is no way to recover a lost link, and no password to reset. If you lose yours,
            open a new case.
          </p>
          <a className="btn primary" href={created.links.a} style={{ marginTop: 20 }}>
            Start writing your side
          </a>
        </section>
      </div>
    </main>
  );
}

function LinkCard({ heading, note, url }: { heading: string; note: string; url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="link-card">
      <h3>{heading}</h3>
      <p className="hint">{note}</p>
      <p className="url">{url}</p>
      <div className="row">
        <button
          type="button"
          className="btn"
          onClick={() => {
            navigator.clipboard?.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
