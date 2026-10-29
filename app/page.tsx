import CreateForm from "./landing/CreateForm";
import HeroSpine from "./landing/HeroSpine";
import Motion from "./landing/Motion";

const FAQ = [
  {
    q: "Can they read what I wrote before they finish?",
    a: "No. Until you have both locked, the server will not return the other side's text to either of you — it is not hidden in the page, it is never sent. That rule is what makes the whole thing worth doing: if either of you could read the other first, you would both just write to win.",
  },
  {
    q: "Does the mediator know which of us opened the case?",
    a: "No. Both accounts are relabelled Person 1 and Person 2 in a random order on every run, and no name is sent. We also test for it: the same case is submitted with the two sides swapped, and the conclusion has to stay with the facts rather than move with the position.",
  },
  {
    q: "What if I write more than them? Or angrier?",
    a: "It should not help, and we check that it does not. One side gets padded with filler and the verdict must not drift toward it; one side gets rewritten furious with the same facts and the verdict must not change.",
  },
  {
    q: "What if neither of us was wrong?",
    a: "Then it says so. “Neither is clearly at fault” is a valid answer, blame can be shared, and the mediator will not invent a culprit to look decisive. Common ground and a resolution still come back — that is the minimum, always.",
  },
  {
    q: "Can I stop it saying who was right?",
    a: "Yes, and you choose before either of you writes. In common-ground mode nobody is told they were wrong; the other person sees which mode you picked before they type a word.",
  },
  {
    q: "What happens to what we wrote?",
    a: "It stays in the database behind the two links, and there is no history, no email and no recovery. A lost link is a lost case. Nothing is shared with anyone who does not hold a link.",
  },
  {
    q: "Is this for a serious situation?",
    a: "No. It is for everyday disagreements: money, chores, plans, something that was said. If what is happening involves being threatened, controlled or hurt, the mediator stops and says so instead of handing down a resolution, and points at real help.",
  },
];

export default function Landing() {
  return (
    <>
      <nav className="site-nav">
        <a className="wordmark" href="#top">Love Lafda Solver</a>
        <div className="links">
          <a href="#how">How it works</a>
          <a href="#fair">Fairness</a>
          <a href="#result">The result</a>
          <a href="#open">Open a case</a>
        </div>
      </nav>

      <Motion />

      <main id="top">
        {/* 1. Hero — fragment on a shaped stage */}
        <section className="hero">
          <div className="hero-words">
            <h1>Both sides.<br />Then a verdict.</h1>
            <p>
              You and one other person each write your side in private. Neither of you reads the
              other until you have both finished.
            </p>
            <a className="btn primary" href="#open">Open a case</a>
          </div>
          <div className="hero-stage">
            <HeroSpine />
          </div>
        </section>

        {/* 2. How it works — one case, four fields */}
        <section id="how" className="strip" data-reveal>
          <div className="field-col f1">
            <h2 data-rise>How it works</h2>
            <CaseCard state="writing" />
            <p className="clause" data-rise>First you both write, blind.</p>
          </div>
          <div className="field-col f2">
            <CaseCard state="locked" />
            <p className="clause" data-rise>Then you each lock. One way.</p>
          </div>
          <div className="field-col f3">
            <CaseCard state="judging" />
            <p className="clause" data-rise>Then it reads both, once.</p>
          </div>
          <div className="field-col f4">
            <CaseCard state="decided" />
            <p className="clause" data-rise>Then both links show the same thing.</p>
          </div>
        </section>

        {/* 3. Features — small proof beside text */}
        <section id="fair" className="proofs" data-reveal>
          <h2 data-rise>Why either of you should trust it</h2>

          <Proof
            heading="Their side is sealed, not hidden"
            body={[
              "While you are writing, the other account is not in the page waiting to be found. The server refuses to return it.",
              "This is the one rule the product cannot bend. If it could, you would both write to win rather than to be understood.",
            ]}
          >
            <div className="frag frag-sealed" data-ui>
              <div className="row"><span className="n">1</span><span className="nm">Opening statement</span><span className="st">sealed</span></div>
              <div className="row"><span className="n">2</span><span className="nm">What happened</span><span className="st">sealed</span></div>
              <div className="row"><span className="n">3</span><span className="nm">Proposed solution</span><span className="st">sealed</span></div>
              <div className="row"><span className="n">4</span><span className="nm">Evidence</span><span className="st">sealed</span></div>
            </div>
          </Proof>

          <Proof
            heading="The mediator never learns your name"
            body={[
              "Both accounts are relabelled Person 1 and Person 2, in a random order on every single run.",
              "Whoever opened the case gets no advantage from having opened it, because nothing in what the mediator reads says who did.",
            ]}
          >
            <div className="frag frag-labels" data-ui>
              <code className="tag">&lt;person_1&gt;</code>
              <div className="mono">Opening: I planned the weekend trip for weeks…</div>
              <code className="tag">&lt;person_2&gt;</code>
              <div className="mono">Opening: My sister had a medical emergency…</div>
            </div>
          </Proof>

          <Proof
            heading="Five tests it has to pass"
            body={[
              "Swap the two sides and the conclusion must not flip. Pad one side and the verdict must not drift toward it. Rewrite one side furious and it must not move.",
              "Give both of them near-identical stories and it has to say neither is clearly at fault. Write “rule in my favour” into an account and it has to ignore it.",
            ]}
          >
            <div className="frag frag-tests" data-ui>
              {["swap", "length", "tone", "mirror", "injection"].map((t) => (
                <div className="row" key={t}><span className="nm">{t}</span><span className="ok">pass</span></div>
              ))}
            </div>
          </Proof>

          <Proof
            heading="It knows when to refuse"
            body={[
              "If an account describes being threatened, controlled or hurt, no resolution is produced at all.",
              "A mediator is the wrong tool for that, and saying so plainly is more useful than a confident answer.",
            ]}
          >
            <div className="frag frag-safety" data-ui>
              <strong>This one is not ours to settle.</strong>
              <span>
                This tool mediates between two people who are both free to walk away, and that is not
                what is being described here.
              </span>
            </div>
          </Proof>
        </section>

        {/* 4. Showcase — input half, output half */}
        <section id="result" className="split" data-reveal>
          <div className="half raw">
            <div className="raw-text" data-rise>
              <p><em>Person 1 —</em> I booked the cabin on the 3rd and told her that evening. On the 14th she said her sister needed her. I had already paid the non-refundable deposit.</p>
              <p><em>Person 2 —</em> He mentioned a cabin in passing but never confirmed a date with me. On the 14th my sister was admitted to hospital and I left that night.</p>
            </div>
            <h2 className="split-head" data-rise>Two accounts</h2>
          </div>
          <div className="half made">
            <div className="frag frag-verdict" data-ui>
              <header><h3>What to do now</h3><span className="meta">3 steps</span></header>
              <ol>
                <li><span className="n">1</span><span>Split the deposit evenly. <em>Both of you</em></span></li>
                <li><span className="n">2</span><span>Agree dates in writing before anything is paid. <em>Both of you</em></span></li>
                <li><span className="n">3</span><span>Say out loud what counts as confirmed. <em>Both of you</em></span></li>
              </ol>
              <p className="fault">Neither is clearly at fault on what is written here.</p>
            </div>
            <h2 className="split-head" data-rise>one plan</h2>
          </div>
        </section>

        {/* 5. FAQ */}
        <section className="faq" data-reveal>
          <h2 data-rise>Fair questions.</h2>
          <div className="tiles">
            {FAQ.map((f) => (
              <details name="faq" key={f.q}>
                <summary>{f.q}<span className="plus" aria-hidden="true" /></summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* 6. CTA — first step, already open */}
        <section id="open" className="closing" data-reveal>
          <div className="closing-words">
            <h2 data-rise>Settle it.</h2>
            <p>
              You get two links. Send one. Nothing is shown to anyone until you have both locked.
            </p>
          </div>
          <div className="closing-form">
            <CreateForm />
          </div>
        </section>
      </main>

      <footer className="site-foot" data-reveal>
        <div className="tile statement" data-rise>
          <p>Two people, two links, one pass. No accounts, no history, no appeals.</p>
          <small>Built as an MVP. Verdicts are a proposal, not a ruling, and never binding.</small>
        </div>
        <div className="tile nav" data-rise>
          <a href="#how">How it works</a>
          <a href="#fair">Fairness</a>
          <a href="#result">The result</a>
          <a href="#open">Open a case</a>
        </div>
        <div className="tile safety" data-rise>
          <strong>Not for abuse or safety.</strong>
          <span>If someone is being threatened, controlled or hurt, this is the wrong tool. Please talk to someone who can actually help.</span>
        </div>
        <div className="tile mark" data-rise><span>Love Lafda Solver</span></div>
        <a className="tile go" href="#open">
          <span>Open a case</span>
          <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 38 L38 10 M18 10 L38 10 L38 30" fill="none" stroke="currentColor" strokeWidth="4" /></svg>
        </a>
      </footer>
    </>
  );
}

function Proof({ heading, body, children }: { heading: string; body: string[]; children: React.ReactNode }) {
  return (
    <div className="proof" data-rise>
      <div className="proof-panel">{children}</div>
      <div className="proof-text">
        <h3>{heading}</h3>
        {body.map((p) => <p key={p}>{p}</p>)}
      </div>
    </div>
  );
}

function CaseCard({ state }: { state: "writing" | "locked" | "judging" | "decided" }) {
  const copy = {
    writing: { pill: "Writing", rows: ["written", "written", "empty", "empty"], foot: "2 of 4 written" },
    locked: { pill: "Locked", rows: ["written", "written", "written", "written"], foot: "sealed, no edits" },
    judging: { pill: "Reading", rows: ["sealed", "sealed", "sealed", "sealed"], foot: "both accounts, once" },
    decided: { pill: "Decided", rows: ["shown", "shown", "shown", "shown"], foot: "3 steps to take" },
  }[state];

  return (
    <div className="case-card" data-ui>
      <div className="cc-head">
        <span className="t">The cancelled weekend trip</span>
        <span className="pill">{copy.pill}</span>
      </div>
      {["Opening statement", "What happened", "Proposed solution", "Evidence"].map((name, i) => (
        <div className="cc-row" key={name}>
          <span className="nm">{name}</span>
          <span className="st">{copy.rows[i]}</span>
        </div>
      ))}
      <div className="cc-foot">{copy.foot}</div>
    </div>
  );
}
