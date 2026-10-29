"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_BODY, MAX_LINKS, MODE_LABEL, MODE_MEANS, STEPS, STEP_COUNT, saveableLinks, shouldPoll } from "@/lib/steps";
import type { Kind } from "@/lib/party";
import Verdict, { type VerdictData } from "./Verdict";

type Statement = { body: string; links: string[] };
export type PartyView = {
  case: { id: string; title: string; mode: keyof typeof MODE_LABEL; status: string };
  you: { slot: string; displayName: string | null; locked: boolean; statements: Partial<Record<Kind, Statement>> };
  other: { displayName: string | null; locked: boolean; statements?: Partial<Record<Kind, Statement>> | null };
  verdict?: VerdictData | null;
};

const blank = (): Statement => ({ body: "", links: [] });
const them = (v: PartyView) => v.other.displayName ?? "The other person";

export default function PartyForm({ token, initial }: { token: string; initial: PartyView }) {
  const [view, setView] = useState(initial);
  const [step, setStep] = useState(0);

  // The step lives in the hash, so a refresh keeps your place and every state has an address.
  useEffect(() => {
    const read = () => {
      const n = Number(window.location.hash.replace("#step=", ""));
      if (Number.isInteger(n) && n >= 1 && n <= STEP_COUNT) setStep(n - 1);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  const [draft, setDraft] = useState<Record<Kind, Statement>>(() =>
    Object.fromEntries(STEPS.map((s) => [s.kind, initial.you.statements[s.kind] ?? blank()])) as Record<Kind, Statement>,
  );
  const [savedAt, setSavedAt] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(STEPS.map((s) => [s.kind, s.kind in initial.you.statements])),
  );
  const [locking, setLocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timers = useRef<Partial<Record<Kind, ReturnType<typeof setTimeout>>>>({});

  const locked = view.you.locked;
  const reviewing = step === STEPS.length;

  const save = useCallback(
    async (kind: Kind, value: Statement) => {
      const res = await fetch(`/api/p/${token}/statements/${kind}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...value, links: saveableLinks(value.links) }),
      });
      if (!res.ok) {
        setError("That did not save. Check your connection and try the step again.");
        return;
      }
      setError(null);
      setSavedAt((s) => ({ ...s, [kind]: true }));
    },
    [token],
  );

  // Autosave each step 700ms after typing stops, and once more when the step is left.
  const edit = (kind: Kind, value: Statement) => {
    setDraft((d) => ({ ...d, [kind]: value }));
    setSavedAt((s) => ({ ...s, [kind]: false }));
    clearTimeout(timers.current[kind]);
    timers.current[kind] = setTimeout(() => save(kind, value), 700);
  };

  const goto = (next: number) => {
    const current = STEPS[step];
    if (current) {
      clearTimeout(timers.current[current.kind]);
      save(current.kind, draft[current.kind]);
    }
    setStep(next);
    history.replaceState(null, "", `#step=${next + 1}`);
  };

  // While waiting for the other side, poll every 5s (the plan's interval; no websockets in the MVP).
  useEffect(() => {
    if (!shouldPoll(view.case.status, locked)) return;
    const tick = async () => {
      const res = await fetch(`/api/p/${token}`);
      if (res.ok) setView(await res.json());
    };
    const id = setInterval(tick, 5000);
    tick();
    return () => clearInterval(id);
  }, [locked, token, view.case.status]);

  async function retry() {
    setLocking(true);
    try {
      const res = await fetch(`/api/cases/${view.case.id}/retry`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not run it again.");
      const res2 = await fetch(`/api/p/${token}`);
      if (res2.ok) setView(await res2.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not run it again.");
    } finally {
      setLocking(false);
    }
  }

  async function lock() {
    setLocking(true);
    try {
      const res = await fetch(`/api/p/${token}/lock`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not lock.");
      const res2 = await fetch(`/api/p/${token}`);
      if (res2.ok) setView(await res2.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not lock.");
    } finally {
      setLocking(false);
    }
  }

  const written = STEPS.filter((s) => draft[s.kind].body.trim().length > 0).length;

  if (view.case.status === "DECIDED" && view.verdict) {
    return (
      <main className="canvas">
        <div className="title-row">
          <div>
            <h1>{view.case.title}</h1>
            <p className="sub">
              {view.verdict.safety_flag === "none"
                ? view.verdict.summary_neutral
                : "Both sides are in, and this is not an argument a mediator should settle."}
            </p>
          </div>
          <span className="stamp">{MODE_LABEL[view.case.mode]}</span>
        </div>
        <div className="verdict">
          <Verdict
            verdict={view.verdict}
            yourSlot={view.you.slot}
            yours={draft}
            theirs={view.other.statements ?? null}
          />
        </div>
      </main>
    );
  }

  if (view.case.status === "FAILED") {
    return (
      <main className="canvas">
        <div className="title-row">
          <div>
            <h1>{view.case.title}</h1>
            <p className="sub">
              Both of you locked, but the mediator did not come back. Nothing either of you wrote
              has been lost, and nothing has been shown to the other side.
            </p>
          </div>
          <span className="stamp">Both sides locked</span>
        </div>
        <div className="spine">
          <section className="panel">
            <header>
              <h2>The two sides</h2>
              <span className="meta">Both locked</span>
            </header>
            <div className="sides">
              <section>
                <header>
                  <h3>Your side</h3>
                  <span className="pill">Locked</span>
                </header>
                <div className="steps">
                  {STEPS.map((s, i) => (
                    <div className="step sealed" key={s.kind}>
                      <span className="n num">{i + 1}</span>
                      <span className="name">{s.name}</span>
                      <span className="state">{draft[s.kind].body.trim() ? "written" : "empty"}</span>
                    </div>
                  ))}
                </div>
              </section>
              <section>
                <header>
                  <h3>{them(view)}&rsquo;s side</h3>
                  <span className="pill">Locked</span>
                </header>
                <p className="hint">
                  Still sealed. Nothing of {them(view)}&rsquo;s is shown until a run finishes, so a
                  failed run shows neither of you anything.
                </p>
              </section>

              <section>
                <header>
                  <h3>Nothing was lost</h3>
                </header>
                <p className="hint">
                  Both accounts are stored exactly as you locked them, and a failed run writes no
                  result at all, so there is no half-verdict for either of you to see. You can leave
                  this and come back to the same link later.
                </p>
              </section>
            </div>
          </section>

          <section className="panel">
            <header>
              <h2>The mediator did not finish</h2>
            </header>
            <p style={{ maxWidth: "62ch" }}>
              This usually means the model was unreachable, or it answered with something that did
              not fit the shape a resolution has to come back in. Nothing was half-written: a run
              either produces a whole result or none.
            </p>
            <p className="hint" style={{ marginTop: 12, maxWidth: "62ch" }}>
              Running it again starts from the same two accounts, unchanged. Neither of you has to
              rewrite anything, and either link can start it.
            </p>
            <div className="steps" style={{ marginTop: 20 }}>
              <div className="step"><span className="n num">1</span><span className="name">Both accounts are read again</span><span className="state">as locked</span></div>
              <div className="step"><span className="n num">2</span><span className="name">One run, under a minute</span><span className="state">same as before</span></div>
              <div className="step"><span className="n num">3</span><span className="name">Both links show the result</span><span className="state">together</span></div>
            </div>
            <p className="safety" style={{ marginTop: 20, maxWidth: "62ch" }}>
              <b>Not for abuse or safety.</b> If what you are arguing about involves being
              threatened, controlled or hurt, do not keep retrying this. A mediator is the wrong
              tool and this one will say so rather than take a side; please talk to someone who can
              actually help.
            </p>
            {error && <p role="alert" style={{ marginTop: 12, color: "#c4242a" }}>{error}</p>}
            <div className="actions">
              <button className="btn primary" onClick={retry} disabled={locking}>
                {locking ? "Running it again\u2026" : "Run the mediator again"}
              </button>
              <span className="hint">Either link can do this.</span>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="canvas">
      <div className="title-row">
        <div>
          <h1>{view.case.title}</h1>
          <p className="sub">
            {locked
              ? `You have locked your side. ${MODE_MEANS[view.case.mode]}`
              : `Your side only. ${them(view).toLowerCase() === "the other person" ? "the other person" : them(view)} cannot see any of this until you have both locked. ${MODE_MEANS[view.case.mode]}`}
          </p>
        </div>
        <span className="stamp num">
          {locked ? MODE_LABEL[view.case.mode] : `Step ${step + 1} of ${STEP_COUNT}`}
        </span>
      </div>

      <div className="spine">
        <div className="rail">
          <section className="panel">
            <header>
              <h2>The two sides</h2>
              <span className="meta num">{written} of {STEPS.length} written</span>
            </header>
            <div className="sides">
              <section>
                <header>
                  <h3>Your side</h3>
                  <span className="pill">{locked ? "Locked" : "Open"}</span>
                </header>
                <div className="steps">
                  {STEPS.map((s, i) => {
                    const body = draft[s.kind].body.trim();
                    return (
                      <button
                        key={s.kind}
                        type="button"
                        className="step"
                        aria-current={!locked && step === i ? "step" : undefined}
                        disabled={locked}
                        onClick={() => goto(i)}
                      >
                        <span className="n num">{i + 1}</span>
                        <span className="name">{s.name}</span>
                        <span className="state">
                          {body ? (savedAt[s.kind] === false ? "saving…" : "saved") : "empty"}
                        </span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    className="step"
                    aria-current={!locked && reviewing ? "step" : undefined}
                    disabled={locked}
                    onClick={() => goto(STEPS.length)}
                  >
                    <span className="n num">5</span>
                    <span className="name">Review and lock</span>
                    <span className="state">{locked ? "locked" : "not yet"}</span>
                  </button>
                </div>
              </section>

              <section>
                <header>
                  <h3>{them(view)}&rsquo;s side</h3>
                  <span className="pill">{view.other.locked ? "Locked" : "Writing"}</span>
                </header>
                <div className="withheld">
                  <p>
                    {view.other.locked
                      ? `${them(view)} has finished and locked. Their answers stay sealed until you lock too.`
                      : `${them(view)} is answering the same five steps right now. You will not see a line of it before you have both locked, and they cannot see yours.`}
                  </p>
                </div>
              </section>

              <section>
                <header>
                  <h3>When you both lock</h3>
                </header>
                <p className="hint">
                  The mediator reads both accounts once and both links show the same result.
                  Common ground and a resolution come back either way.
                  {view.case.mode === "COMMON_GROUND_AND_VERDICT"
                    ? " A view on who was right comes back only where the evidence clearly supports one."
                    : " Nobody is told they were wrong: this case is common ground only."}
                </p>
                <p className="safety" style={{ marginTop: 14 }}>
                  <b>Not for abuse or safety.</b> If what you are writing about involves being
                  threatened, controlled or hurt, stop here. A mediator is the wrong tool and this
                  one will say so rather than take a side.
                </p>
              </section>
            </div>
          </section>
        </div>

        {locked ? (
          <section className="panel">
            <header>
              <h2>{view.other.locked ? "Both sides are in" : "Waiting for the other side"}</h2>
            </header>
            <div className="waiting">
              <p className="lede">
                {view.other.locked
                  ? "The mediator is reading both accounts now. This page will show the result by itself."
                  : `Your side is sealed. Nothing more to do until ${them(view)} locks theirs.`}
              </p>
              <p className="hint">
                This page checks every five seconds. You can close it and come back to the same link.
              </p>
            </div>

            <p className="hint" style={{ marginTop: 16 }}>
              Nothing is emailed and there is no case history. This link is the only way back to the
              result, for both of you, so keep it.
            </p>

            <h3 className="sub-head" style={{ marginTop: 24 }}>What you locked</h3>
            <div className="review">
              {STEPS.map((s) => (
                <div className="review-item" key={s.kind}>
                  <header>
                    <h3>{s.name}</h3>
                  </header>
                  {draft[s.kind].body.trim() ? (
                    <p>{draft[s.kind].body}</p>
                  ) : (
                    <p className="none">You left this one empty.</p>
                  )}
                  {draft[s.kind].links.length > 0 && (
                    <ul>
                      {draft[s.kind].links.map((l) => (
                        <li key={l}>
                          <a href={l} target="_blank" rel="noreferrer noopener">{l}</a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : reviewing ? (
          <section className="panel">
            <header>
              <h2>Read it once more</h2>
              <span className="meta">Nothing here has been shown to anyone</span>
            </header>
            <p className="hint" style={{ marginBottom: 4 }}>
              {written} of {STEPS.length} steps written,{" "}
              <span className="num">
                {STEPS.reduce((n, s) => n + draft[s.kind].body.trim().length, 0).toLocaleString()}
              </span>{" "}
              characters and{" "}
              <span className="num">{STEPS.reduce((n, s) => n + draft[s.kind].links.length, 0)}</span>{" "}
              links. This is everything the mediator will see from you.
            </p>
            <div className="review">
              {STEPS.map((s, i) => (
                <div className="review-item" key={s.kind}>
                  <header>
                    <h3>{s.name}</h3>
                    <button type="button" className="card-link" onClick={() => goto(i)}>
                      Edit
                    </button>
                  </header>
                  {draft[s.kind].body.trim() ? (
                    <p>{draft[s.kind].body}</p>
                  ) : (
                    <p className="none">You left this one empty. The mediator will work without it.</p>
                  )}
                  {draft[s.kind].links.length > 0 && (
                    <ul>
                      {draft[s.kind].links.map((l) => (
                        <li key={l}>
                          <a href={l} target="_blank" rel="noreferrer noopener">{l}</a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            <div className="door">
              <h3>Locking is one way</h3>
              <ul>
                <li>You cannot edit or add anything afterwards.</li>
                <li>You still will not see {them(view)}&rsquo;s side until they lock too.</li>
                <li>When you have both locked, the mediator runs once and you both get the same result.</li>
              </ul>
              {error && <p role="alert" style={{ color: "#c4242a", marginBottom: 12 }}>{error}</p>}
              <button className="btn primary" onClick={lock} disabled={locking || written === 0}>
                {locking ? "Locking…" : "Lock my side"}
              </button>
              {written === 0 && (
                <p className="hint" style={{ marginTop: 8 }}>
                  Write at least one step before you lock.
                </p>
              )}
            </div>
          </section>
        ) : (
          <StepPanel
            step={step}
            value={draft[STEPS[step].kind]}
            saved={savedAt[STEPS[step].kind]}
            error={error}
            onChange={(v) => edit(STEPS[step].kind, v)}
            onBack={() => goto(step - 1)}
            onNext={() => goto(step + 1)}
          />
        )}
      </div>
    </main>
  );
}

function StepPanel({
  step, value, saved, error, onChange, onBack, onNext,
}: {
  step: number;
  value: Statement;
  saved: boolean | undefined;
  error: string | null;
  onChange: (v: Statement) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const s = STEPS[step];
  const over = value.body.length > MAX_BODY;

  return (
    <section className="panel">
      <header>
        <h2>{s.name}</h2>
        <span className="meta">{saved === true ? "Saved" : saved === false ? "Saving…" : "Not saved yet"}</span>
      </header>

      <div className="field">
        <label htmlFor="body">{s.label}</label>
        <p className="hint">{s.hint}</p>
        <textarea
          id="body"
          className="input"
          value={value.body}
          placeholder={s.placeholder}
          onChange={(e) => onChange({ ...value, body: e.target.value })}
          style={{ minHeight: s.rows }}
          aria-describedby="body-count"
        />
        <div className="field-foot">
          <span id="body-count" className={`num ${over ? "over" : ""}`}>
            {value.body.length.toLocaleString()} of {MAX_BODY.toLocaleString()} characters
          </span>
          <span>Saves by itself as you type</span>
        </div>
      </div>

      {s.kind === "EVIDENCE" && (
        <div className="field" style={{ marginTop: 20 }}>
          <label htmlFor="link-0">Links</label>
          <p className="hint">Up to {MAX_LINKS}. A message, a receipt, a photo. Anything with an address.</p>
          <div className="links">
            {[...value.links, ""].slice(0, MAX_LINKS).map((l, i) => (
              <div className="link-row" key={i}>
                <input
                  id={`link-${i}`}
                  className="input"
                  type="url"
                  value={l}
                  placeholder="https://"
                  aria-label={`Link ${i + 1}`}
                  onChange={(e) => {
                    const next = [...value.links];
                    next[i] = e.target.value;
                    onChange({ ...value, links: next.filter((x, j) => x.trim() || j < next.length - 1) });
                  }}
                />
                {l && (
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => onChange({ ...value, links: value.links.filter((_, j) => j !== i) })}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="uses">
        <h3>What the mediator does with this</h3>
        <p>{s.uses}</p>
      </div>

      {error && <p role="alert" style={{ marginTop: 16, color: "#c4242a" }}>{error}</p>}

      <div className="actions">
        <button className="btn" onClick={onBack} disabled={step === 0}>Back</button>
        <span className="spacer" />
        <button className="btn primary" onClick={onNext} disabled={over}>
          {step === STEPS.length - 1 ? "Review and lock" : `Next: ${STEPS[step + 1].name}`}
        </button>
      </div>
    </section>
  );
}
