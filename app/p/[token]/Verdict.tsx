import { STEPS } from "@/lib/steps";
import type { Kind } from "@/lib/party";

type Statement = { body: string; links: string[] };
type Fault = { stated: boolean; text: string; confidence: "low" | "medium" | "high" };

export type VerdictData =
  | { safety_flag: "possible_abuse" | "self_harm"; help: string }
  | {
      safety_flag: "none";
      summary_neutral: string;
      agreed_facts: string[];
      disputed_facts: { issue: string; a_says: string; b_says: string }[];
      needs_of_each: { a: string[]; b: string[] };
      common_ground: string[];
      proposed_resolution: { step: string; who: "A" | "B" | "BOTH" }[];
      fault_view: Fault | null;
      caveats: string[];
      names: { A: string; B: string };
    };

export default function Verdict({
  verdict, yourSlot, yours, theirs,
}: {
  verdict: VerdictData;
  yourSlot: string;
  yours: Partial<Record<Kind, Statement>>;
  theirs: Partial<Record<Kind, Statement>> | null;
}) {
  if (verdict.safety_flag !== "none") {
    return (
      <section className="panel" style={{ gridColumn: "1 / -1" }}>
        <header>
          <h2>This one is not ours to settle</h2>
        </header>
        <p className="lede" style={{ maxWidth: "62ch" }}>{verdict.help}</p>
        <p className="hint" style={{ marginTop: 16, maxWidth: "62ch" }}>
          Nothing either of you wrote has been shown to the other person, and no resolution was
          produced.
        </p>
      </section>
    );
  }

  const v = verdict;
  const who = (w: "A" | "B" | "BOTH") => (w === "BOTH" ? "Both of you" : v.names[w]);
  const themName = yourSlot === "A" ? v.names.B : v.names.A;
  const youName = yourSlot === "A" ? v.names.A : v.names.B;

  return (
    <>
      {/* The finding comes first. Everything below it is the working, and a page
          that opens with the working reads as a summary rather than a decision. */}
      {v.fault_view && (
        <section className="panel verdict-ruling">
          <header>
            <h2>The decision</h2>
            <span className="pill">Confidence: {v.fault_view.confidence}</span>
          </header>
          <div className="ruling-row">
            <p className="ruling">{v.fault_view.text}</p>
            <p className="hint ruling-note">
              This is a reading of the two accounts, not a finding of fact, and nothing about it
              is binding. It is here to be argued with.
            </p>
          </div>
        </section>
      )}

      {/* Then what to do about it. */}
      <section className="panel verdict-lead">
        <header>
          <h2>What to do now</h2>
          <span className="meta num">{v.proposed_resolution.length} steps</span>
        </header>
        <ol className="resolution">
          {v.proposed_resolution.map((s, i) => (
            <li key={i}>
              <span className="n num">{i + 1}</span>
              <span className="body">
                <span className="step-text">{s.step}</span>
                <span className="who">{who(s.who)}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="hint" style={{ marginTop: 20 }}>
          A resolution comes back whether or not anyone was found at fault. Nothing here is binding:
          it is a proposal you can both argue with, which is the point.
        </p>
      </section>

      <div className="rail">
        <section className="panel">
          <header>
            <h2>Where you already agree</h2>
          </header>
          <ul className="bullets">
            {v.common_ground.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
          {v.agreed_facts.length > 0 && (
            <>
              <h3 className="sub-head">Both accounts say</h3>
              <ul className="bullets">
                {v.agreed_facts.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </>
          )}
        </section>

        <section className="panel">
          <header>
            <h2>What each of you needs</h2>
          </header>
          <div className="two-up">
            <div>
              <h3 className="sub-head">{v.names.A}</h3>
              <ul className="bullets">{v.needs_of_each.a.map((n, i) => <li key={i}>{n}</li>)}</ul>
            </div>
            <div>
              <h3 className="sub-head">{v.names.B}</h3>
              <ul className="bullets">{v.needs_of_each.b.map((n, i) => <li key={i}>{n}</li>)}</ul>
            </div>
          </div>
        </section>
      </div>

      {v.disputed_facts.length > 0 && (
        <section className="panel span">
          <header>
            <h2>Where you still disagree</h2>
            <span className="meta num">{v.disputed_facts.length} unresolved</span>
          </header>
          <div className="disputes">
            {v.disputed_facts.map((d, i) => (
              <div className="dispute" key={i}>
                <h3>{d.issue}</h3>
                <div className="two-up">
                  <div>
                    <h4 className="sub-head">{v.names.A} says</h4>
                    <p>{d.a_says}</p>
                  </div>
                  <div>
                    <h4 className="sub-head">{v.names.B} says</h4>
                    <p>{d.b_says}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* The withheld column finally opens: both accounts, side by side. */}
      <section className="panel span">
        <header>
          <h2>Both accounts, in full</h2>
          <span className="meta">Sealed until you had both locked</span>
        </header>
        <p className="hint" style={{ maxWidth: "70ch", marginBottom: 20 }}>{v.summary_neutral}</p>
        <div className="two-up">
          <div>
            <h3 className="sub-head">{youName}, you wrote</h3>
            <Account statements={yours} />
          </div>
          <div>
            <h3 className="sub-head">{themName} wrote</h3>
            {theirs ? <Account statements={theirs} /> : <p className="hint">Nothing was written.</p>}
          </div>
        </div>
      </section>

      <section className="panel span">
        <header>
          <h2>What this does not know</h2>
        </header>
        <ul className="bullets">
          {v.caveats.map((c, i) => <li key={i}>{c}</li>)}
        </ul>
        <p className="safety" style={{ marginTop: 16 }}>
          <b>Not for abuse or safety.</b> This is a mediator for everyday disagreements. If what is
          actually happening involves being threatened, controlled or hurt, please talk to someone
          who can help rather than to this.
        </p>
      </section>
    </>
  );
}

function Account({ statements }: { statements: Partial<Record<Kind, Statement>> }) {
  return (
    <div className="account">
      {STEPS.map((s) => {
        const st = statements[s.kind];
        if (!st?.body.trim() && !st?.links.length) return null;
        return (
          <div key={s.kind}>
            <h4 className="sub-head">{s.name}</h4>
            {st.body.trim() && <p>{st.body}</p>}
            {st.links.length > 0 && (
              <ul className="bullets">
                {st.links.map((l) => (
                  <li key={l}>
                    <a href={l} target="_blank" rel="noreferrer noopener">{l}</a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
