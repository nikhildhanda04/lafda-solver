# Love Lafda Solver — product brief for a design agent

A web app for two people in an argument. Each writes their side privately. Neither
sees the other's words. When both are done, one AI mediator reads both accounts and
returns what they agree on plus a proposed resolution.

The name: "lafda" is Hindi slang for a fight or a mess.

---

## Who uses it

Two people — partners, flatmates, friends, siblings — stuck on a specific argument
with a factual spine (a cancelled trip, a split bill, who said what on which date).
Not therapy, not ongoing counselling. One argument, one outcome, done.

They are typically not in the same room, are each a bit defensive, and both believe
they are right. One person starts it and sends the other a link.

## Why it exists

In an argument, the moment one person reads the other's version, they start
rebutting instead of explaining. Writing blind removes that. It is the only
structural rule the product has, and everything else exists to support it.

---

## The core flow

1. **Create.** One person fills in a title and picks a mode. No account, no email,
   no login anywhere in the product.
2. **Two links come back.** One for each person. Each link is a 32-byte random
   token — whoever holds it is that party. The creator sends the other link to the
   other person however they like (message, email).
3. **Each person writes, privately,** through five steps (below). They can leave
   and come back; the link is the only key. Drafts autosave as they type.
4. **Each person locks.** Locking is final — no editing after it.
5. **When both have locked,** the mediator runs once. Both people see the same
   result on their own link.

A case is one argument. There is no case history, no dashboard, no list of past
cases, no multi-case view. One case per link pair.

---

## The five steps

The person writing them sees, at every step, a note explaining what the mediator
actually does with that step. This is not reassurance copy — it changes what people
write.

1. **Opening statement** — "In a sentence or two, what is this about?"
   Used to label the case in neutral words. Not treated as evidence.
2. **What happened** — "What happened, in order?"
   The long one. Dates, what was said, who did what. The mediator works hardest
   here, splitting both accounts into agreed and disputed facts.
3. **Proposed solution** — "What would settle this for you?"
   Something the other person could actually do. The resolution is built from
   what both people ask for here.
4. **Evidence** — "Anything that backs this up?"
   Free text plus up to five links. No file uploads. Evidence only moves the
   mediator where the two accounts disagree.
5. **Review and lock** — everything they wrote, in one view, then the final act.

Limits: 4000 characters per step, 5 links.

---

## The two modes

Chosen at creation, applies to both people.

- **Common ground only** — the mediator finds what they already agree on and
  proposes a resolution. It will not say who was right.
- **Common ground and a verdict** — same, and it may also say who was right, but
  only where the evidence clearly supports it. It often declines to.

---

## What the mediator returns

- A neutral one-paragraph summary of the dispute
- Agreed facts (a list)
- Disputed facts (each with: the issue, what one side says, what the other says)
- What each person needs
- Common ground
- **A proposed resolution** — always present, a list of concrete steps, each
  assigned to person A, person B, or both. Even when nobody is at fault.
- Optionally a fault view, with a stated/not-stated flag and a confidence level
- Caveats
- A safety flag

**Safety:** if the mediator detects possible abuse or self-harm, the entire verdict
is replaced with a help message. No resolution, no fault, no summary.

**Fairness by construction:** sides are shuffled and anonymised to "Person 1" and
"Person 2" before the mediator sees them, so position and identity cannot bias the
outcome. Neither person is ever told which number they were.

---

## Every state the UI has to carry

**Creating** — title, mode choice, nothing else.
**Links issued** — two links, clearly distinguishable ("yours" vs "theirs"), with the
warning that these are the only keys and cannot be recovered.
**Writing** — step N of 5, draft saving, able to move back and forth, able to abandon
and return later.
**Review** — everything written, one last read, with an explicit point of no return.
**Locked, waiting for the other person** — the most emotionally loaded state in the
product. One person is done and the other has not started. Could last days. The page
polls for the other side.
**Judging** — both locked, the mediator is running. Seconds, not minutes.
**Verdict** — the result, shared and identical for both.
**Verdict with safety flag** — the help message instead.
**Failed** — the mediator could not produce a usable answer; the case can be retried.

---

## Hard constraints

- Nothing one person writes is ever visible to the other, at any point, before
  both have locked. Nothing partially leaks — not a word count, not a timestamp,
  not "they've started".
- No accounts, no passwords, no email. The link is the identity.
- Tokens are never recoverable. Lose the link, lose the case.
- Locking is irreversible.
- The mediator runs exactly once per case (retryable only on failure).
- Mobile matters as much as desktop — people write these on phones, often late
  at night, often upset.

---

## Tone the product currently holds

Plain, unhurried, slightly formal. It does not joke about the argument and does not
perform empathy. It never takes a side in its own copy. The vocabulary is borrowed
from mediation, not from therapy or from chat apps: "mediator", "statement",
"evidence", "lock", "resolution", "common ground".

## Screens to design

1. `/` — the landing page. Explains the blind-writing rule, and creates a case.
2. `/p/<token>` — everything else. The same URL carries all states above: the five
   writing steps, review, lock, waiting, judging, and the verdict.
