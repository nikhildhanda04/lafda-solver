import CreateForm from "./landing/CreateForm";
import Courtroom from "./landing/Courtroom";
import HeroSpine from "./landing/HeroSpine";
import Motion from "./landing/Motion";

const FAQ = [
  {
    q: "Can they read what I wrote before they finish?",
    a: "No. Until you have both locked, the server will not return the other side's text to either of you. It is not hidden in the page, it is never sent. That rule is what makes the whole thing worth doing: if either of you could read the other first, you would both just write to win.",
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
    a: "Then it says so. Neither being at fault is a valid ruling, blame can be shared, and the mediator will not invent a culprit to look decisive. Common ground and a resolution still come back: that is the minimum, always.",
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

const STAGES = [
  { state: "writing", title: "Write blind", line: "Five steps each, neither of you can see the other." },
  { state: "locked", title: "Lock it", line: "One way. No edits after." },
  { state: "judging", title: "Clawd reads both", line: "Once, at the same time, without your names." },
  { state: "decided", title: "Same verdict, two links", line: "Both of you open the identical result." },
] as const;

export default function Landing() {
  return (
    <>
      <nav className="site-nav container" aria-label="Main">
        <a className="wordmark" href="#top">Love Lafda Solver</a>
        <div className="links">
          <a href="#how">How it works</a>
          <a href="#fair">Fairness</a>
          <a href="#result">The result</a>
        </div>
        <a className="btn btn--small" href="#open">Open a case</a>
      </nav>

      <Motion />

      <main id="top">
        {/* Hero, Counter: the case form is the visual, Clawd presides beside the words. */}
        <section className="hero container">
          <div className="hero-words">
            <h1 className="display">Both sides. Then a verdict.</h1>
            <p className="lead">Two people write blind. Clawd reads both, then rules.</p>
            <div className="hero-clawd crt">
              <Courtroom />
            </div>
          </div>
          <div id="open" className="hero-form">
            <CreateForm />
          </div>
        </section>

        {/* The versus screen: the live sealed panel. */}
        <section className="versus container" aria-labelledby="versus-head" data-reveal>
          <div className="versus-head">
            <h2 id="versus-head">Their side stays shut.</h2>
            <p className="lead">Go on, try to read it.</p>
          </div>
          <HeroSpine />
        </section>

        {/* How it works: four stages, one case moving through them. */}
        <section id="how" className="stages container" data-reveal>
          <h2>Write, lock, read, rule.</h2>
          <ol className="stage-list">
            {STAGES.map((s) => (
              <li key={s.state} data-rise>
                <h3>{s.title}</h3>
                <p>{s.line}</p>
                <CaseCard state={s.state} />
              </li>
            ))}
          </ol>
        </section>

        {/* Fairness: rows, each a claim with its small proof. */}
        <section id="fair" className="proofs container" data-reveal>
          <h2>Why either of you should trust it</h2>
          <div className="proof-rows">
            <Proof
              heading="Sealed, not hidden"
              body="The server refuses to send their account until you have both locked. There is nothing in the page to find."
            >
              <ul className="sealed-list" data-ui>
                {["Opening statement", "What happened", "Proposed solution", "Evidence"].map((s) => (
                  <li key={s}><span>{s}</span><span className="st">sealed</span></li>
                ))}
              </ul>
            </Proof>

            <Proof
              heading="It never learns your name"
              body="Both accounts become Person 1 and Person 2, in a random order on every run, so opening the case buys nothing."
            >
              <div className="labels-frag" data-ui>
                <p><code>&lt;person_1&gt;</code> I planned the weekend trip for weeks…</p>
                <p><code>&lt;person_2&gt;</code> My sister had a medical emergency…</p>
              </div>
            </Proof>

            <Proof
              heading="Five tests against bias"
              body="Swap the sides, pad one, make one furious, mirror them, slip in “rule in my favour”. The ruling has to follow the facts."
            >
              <ul className="tests-menu" data-ui>
                {["Swap", "Length", "Tone", "Mirror", "Injection"].map((t) => <li key={t}>{t}</li>)}
              </ul>
            </Proof>

            <Proof
              heading="It knows when to refuse"
              body="If an account describes being threatened, controlled or hurt, no resolution is produced at all."
            >
              <p className="refuse-frag" data-ui>
                <strong>This one is not ours to settle.</strong>
              </p>
            </Proof>
          </div>
        </section>

        {/* The result: two raw accounts in, one ruling out. */}
        <section id="result" className="result container" data-reveal>
          <h2>Two accounts. One ruling.</h2>
          <div className="result-grid">
            <div className="accounts">
              <blockquote className="account-well p1" data-rise>
                <p className="who">Person 1</p>
                <p>I booked the cabin on the 3rd and told her that evening. On the 14th she said her sister needed her. I had already paid the non-refundable deposit.</p>
              </blockquote>
              <blockquote className="account-well p2" data-rise>
                <p className="who">Person 2</p>
                <p>He mentioned a cabin in passing but never confirmed a date with me. On the 14th my sister was admitted to hospital and I left that night.</p>
              </blockquote>
            </div>
            <div className="ruling-frag" data-ui data-rise>
              <h3>The decision</h3>
              <p className="line">Person 2 is right because a sister in hospital is a reason anyone would leave.</p>
              <p className="line">Person 1 is wrong because a cabin mentioned in passing is not a confirmed date.</p>
              <h3 className="next">What to do now</h3>
              <ol>
                <li><span>Split the deposit evenly.</span><em>Both of you</em></li>
                <li><span>Agree dates in writing before anything is paid.</span><em>Person 1</em></li>
                <li><span>Say yes or no to a plan within two days.</span><em>Person 2</em></li>
              </ol>
            </div>
          </div>
        </section>

        {/* Questions as rows. */}
        <section className="faq container" data-reveal>
          <h2>Fair questions.</h2>
          <div className="faq-rows">
            {FAQ.map((f) => (
              <details name="faq" key={f.q}>
                <summary>{f.q}<span className="plus" aria-hidden="true" /></summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* The close: back to the form. */}
        <section className="closing" data-reveal>
          <div className="container closing-inner">
            <h2 className="display closing-line">Settle it.</h2>
            <p className="closing-sub">You get two links. Send one. Nothing is shown to anyone until you have both locked.</p>
            <a className="btn btn--ink" href="#open">Open a case</a>
          </div>
        </section>
      </main>

      <footer className="site-foot container">
        <div className="foot-top">
          <div className="foot-statement">
            <p>Two people, two links, one pass. No accounts, no history, no appeals.</p>
            <p className="small">Built as an MVP. Verdicts are a proposal, not a ruling, and never binding.</p>
          </div>
          <div className="foot-nav" aria-label="Footer">
            <a href="#how">How it works</a>
            <a href="#fair">Fairness</a>
            <a href="#result">The result</a>
            <a href="#open">Open a case</a>
          </div>
          <div className="foot-safety">
            <p><strong>Not for abuse or safety.</strong></p>
            <p>If someone is being threatened, controlled or hurt, this is the wrong tool. Please talk to someone who can actually help.</p>
          </div>
        </div>
        <p className="foot-mark" aria-hidden="true">Love Lafda Solver</p>
      </footer>
    </>
  );
}

function Proof({ heading, body, children }: { heading: string; body: string; children: React.ReactNode }) {
  return (
    <div className="proof-row" data-rise>
      <h3>{heading}</h3>
      <p>{body}</p>
      <div className="proof-frag">{children}</div>
    </div>
  );
}

function CaseCard({ state }: { state: "writing" | "locked" | "judging" | "decided" }) {
  const copy = {
    writing: { pill: "Writing", rows: ["written", "written", "empty", "empty"], cur: 2 },
    locked: { pill: "Locked", rows: ["written", "written", "written", "written"], cur: -1 },
    judging: { pill: "Reading", rows: ["sealed", "sealed", "sealed", "sealed"], cur: -1 },
    decided: { pill: "Decided", rows: ["shown", "shown", "shown", "shown"], cur: -1 },
  }[state];

  return (
    <div className={`case-card is-${state}`} data-ui>
      <div className="cc-head">
        <span className="t">The cancelled weekend trip</span>
        <span className="tag">{copy.pill}</span>
      </div>
      {["Opening statement", "What happened", "Proposed solution", "Evidence"].map((name, i) => (
        <div className="cc-row" key={name} aria-current={i === copy.cur ? "step" : undefined}>
          <span className="nm">{name}</span>
          <span className="st">{copy.rows[i]}</span>
        </div>
      ))}
    </div>
  );
}
