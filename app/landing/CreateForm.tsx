"use client";

import { useState } from "react";
import { MODE_LABEL, MODE_MEANS } from "@/lib/steps";

type Mode = keyof typeof MODE_LABEL;
type Created = { caseId: string; links: { a: string; b: string } };

/** The product's real create form, at true size. Not a picture of one. */
export default function CreateForm() {
  // The blueprint asks for a believable, editable example rather than an empty
  // field, so the page's one action is live the moment you reach it.
  const [title, setTitle] = useState("The cancelled weekend trip");
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

  if (created) return <Links created={created} />;

  return (
    <form className="create" data-ui onSubmit={submit}>
      <h3>Open a case</h3>

      <div className="field">
        <label htmlFor="case-title">What are you arguing about?</label>
        <input
          id="case-title"
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          required
          onFocus={(e) => e.currentTarget.select()}
        />
        <p className="hint">Both of you see this, so keep it neutral.</p>
      </div>

      <fieldset className="field">
        <legend>How far should the mediator go?</legend>
        <div className="choices">
          {(Object.keys(MODE_LABEL) as Mode[]).map((m) => (
            <label className="choice" key={m}>
              <span className="top">
                <input type="radio" name="mode" value={m} checked={mode === m} onChange={() => setMode(m)} />
                {MODE_LABEL[m]}
              </span>
            </label>
          ))}
        </div>
        <p className="hint">{MODE_MEANS[mode]}</p>
      </fieldset>

      {error && <p role="alert" className="err">{error}</p>}

      <button className="btn primary" type="submit" disabled={saving || !title.trim()}>
        {saving ? "Opening…" : "Open the case and get two links"}
      </button>
    </form>
  );
}

function Links({ created }: { created: Created }) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return (
    <div className="create" data-ui>
      <h3>Your two links</h3>
      <p className="hint">
        Keep the first. Send the second to exactly one person: whoever opens it becomes the other
        side. There is no way to recover a lost link.
      </p>
      <LinkRow label="Yours" url={origin + created.links.a} />
      <LinkRow label="Theirs" url={origin + created.links.b} />
      <a className="btn primary" href={created.links.a}>Start writing your side</a>
    </div>
  );
}

function LinkRow({ label, url }: { label: string; url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="link-out">
      <span className="lbl">{label}</span>
      <code>{url}</code>
      <button
        type="button"
        className="btn"
        onClick={() => {
          navigator.clipboard?.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
