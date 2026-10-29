import type { Kind } from "./party";

/** The five steps of a submission, in order. Step 5 is the review and the lock. */
export const STEPS = [
  {
    kind: "OPENING" as Kind,
    uses: 'The mediator reads this first, to label what the case is about in words you would both accept. It is not treated as evidence, so keep it short and leave the argument to the next step.',
    rows: 380,
    name: "Opening statement",
    label: "In a sentence or two, what is this about?",
    hint: "The short version. What would you say if someone asked you in the street.",
    placeholder: "She cancelled the trip the night before, after I had already paid.",
  },
  {
    kind: "CONTEXT" as Kind,
    uses: 'This is the step the mediator works hardest on. It splits both accounts into what you agree on and what you do not, so a date or an exact sentence is worth more here than how it felt.',
    rows: 420,
    name: "What happened",
    label: "What happened, in order?",
    hint: "Dates, what was said, who did what. This is the long one. The mediator separates what you both agree on from what you do not, so the order matters more than the feeling.",
    placeholder: "On the 3rd I booked the cabin and told her that evening. On the 14th she said…",
  },
  {
    kind: "PROPOSAL" as Kind,
    uses: 'A resolution is always proposed, even when nobody is found at fault. It is built from what you both ask for here, so an ask the other person could actually carry out goes further than a fair one they cannot.',
    rows: 330,
    name: "Proposed solution",
    label: "What would settle this for you?",
    hint: "Something the other person could actually do. The mediator always proposes a resolution, and it starts from what you both ask for here.",
    placeholder: "We split the deposit, and we agree dates in writing before anything is paid.",
  },
  {
    kind: "EVIDENCE" as Kind,
    uses: 'Evidence only moves the mediator where the two accounts disagree. It will not take a link on trust: whatever you paste, say in the text above what it shows.',
    rows: 230,
    name: "Evidence",
    label: "Anything that backs this up?",
    hint: "Text, and up to five links. No uploads yet, so paste a link to the message, the receipt or the photo.",
    placeholder: "The booking confirmation, and the message where I told her the date.",
  },
] as const;

export const STEP_COUNT = STEPS.length + 1; // the four written steps, then review and lock
export const MAX_BODY = 4000;
export const MAX_LINKS = 5;

export const MODE_LABEL = {
  COMMON_GROUND: "Common ground only",
  COMMON_GROUND_AND_VERDICT: "Common ground and a verdict",
} as const;

export const MODE_MEANS = {
  COMMON_GROUND:
    "The mediator will find what you already agree on and propose a resolution. It will not say who was right.",
  COMMON_GROUND_AND_VERDICT:
    "The mediator will find common ground and propose a resolution, and it may also say who was right, but only where the evidence clearly supports it.",
} as const;
