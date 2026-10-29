# Love Lafda Solver — app-screen notes

## 2.1 Inventory: the data and the jobs

Objects
- Case: title (string), mode (common ground only | common ground + verdict), status
  (collecting | judging | decided | failed), created at. One per link pair.
- Party: slot A or B, display name, locked-at timestamp. Exactly two per case.
- Statement: one per party per step. kind (opening | what happened | proposed solution |
  evidence), body (plain text, up to 4,000 characters), links (0-5 URLs). 8 per case at most.
- Verdict: one per case. Neutral summary; agreed facts (list); disputed facts (issue + what
  each side says); what each person needs (two lists); common ground (list); proposed
  resolution (ordered steps, each assigned to A, B or both); fault view (stated y/n, text,
  confidence low/medium/high); caveats; safety flag.

Magnitudes, honestly small
- 2 people. 1 case. 4 steps each. 8 statements. 1 verdict. 0 charts — nothing here is a
  time series or a quantity. The only numbers on any screen are a character count
  (0-4,000), a link count (0-5), a step number (1-5) and a confidence word.
- A typical opening statement is 1-3 sentences; "what happened" is the long one, 600-1,500
  characters; evidence is 1-3 links.
- Typical verdict: 3-4 agreed facts, 2-3 disputed, 3-5 resolution steps.

The people
- Two people mid-argument, on a phone, at night, each alone. Not a team, not a daily glance.
  One sitting of 10-25 minutes, then a wait of under a minute, then one reading together or
  apart. Nobody returns to this screen next week. There is no account and no second case.

The jobs
- Most frequent: write the current step and move to the next. Everything else is rare.
- Then: lock (one-way, the only irreversible thing here).
- Then: read the verdict and agree the steps.
- Creator only, once: name the dispute, choose the mode, send the other link.

The product's own things
- The name: "lafda" is Hindi/Marathi street slang for a mess, a scrap, a row. Not "dispute",
  not "conflict resolution".
- The two links. There is no login — the link IS the identity, and there are exactly two of
  them, one per person. That pair is the product's central object.
- Blindness: neither person can see the other's words until both have locked. The screen
  knows the other person exists and is writing, and can say nothing about what they wrote.
- The lock: a one-way door. After it, you cannot edit.
- The mode, chosen by one person and binding on both: whether anyone gets told they were wrong.
- The safety line: this is not for abuse.

## 2.2 The screen's one question

- Create (`/`): "What are we actually arguing about, and do we want a verdict?"
- Submission (`/p/<token>`, collecting): **"Have I said my whole side yet?"**
  Biggest thing: the step you are writing. One finding: how much of your side is still blank,
  and whether the other person is still writing or already locked.
- Waiting (judging): "Is it in yet?" — one line, nothing else.
- Verdict (decided): **"What do we do now?"** Biggest thing: the resolution steps, not the
  summary and not the fault view. The minimum useful outcome the plan names is the resolution,
  so the resolution is the headline block.

Blocks, each as the answer to a next question
- Submission: which step am I on (the rail) / what do I write here (the field) / how much is
  left (the step list state) / can I still change it (lock state) / is she done (other side) /
  what happens when I lock (the review step).
- Verdict: what do we do (resolution steps) / what did we both already agree (common ground +
  agreed facts) / where do we still disagree (disputed facts, side by side) / what does each
  of us actually need / was anyone wrong (fault view, verdict mode only, may be absent) /
  what this does not know (caveats).

Most frequent job one click away: the next step. On the verdict: the resolution is first.

## Non-negotiables from the plan
- Blind until decided: no screen may render the other party's text before DECIDED.
- Safety note on the create screen and the results screen; safety_flag replaces the verdict.
- fault_view is hidden entirely in common-ground mode.

## 2.3 Style and face

Style dealt: `achromatic-ledger`, seed 965461857. Chosen over `framed-sheet` because that
style's one move is a tinted L-frame holding a sidebar and a top bar, and this product has no
navigation at all — one link, one screen, no account. Colourless chrome is also the right
politics here: any colour on a person's half of the screen reads as the app taking a side.

**The face** (mine, not one of the three offered — the offered ones are a ground tint, the
hue on a chart, and mono figures; this product has no charts and almost no figures):

> The withheld column.

Every screen stands on the same two-column spine: your side and their side. While the case is
collecting, their column is drawn but empty — ruled, titled with their name, showing only
whether they are still writing or have locked — because the product's one rule is that you
cannot see their words yet. At the verdict both columns fill. No other form has a half that
is deliberately blank; this is the product's blindness made into its structure.

**The one hue.** #1d5fbf appears on exactly one thing: what belongs to neither person — the
step you are on while writing, and the resolution steps at the end. Neither person's column
is ever tinted. The lock is ink, not red.

**Ground:** #f4f4f2 in place of #f8f8f8 — a filed-record paper, one level off white,
saturation well under 15%. Cards stay white.

**Signature element:** the lock as a one-way door (the review step states exactly what you can
no longer do, and the control says so), and the pair of links on the create screen — the
product's central object is that there are exactly two of them and no password.

Density: sparse. Radii 8/6. No shadow at rest.
