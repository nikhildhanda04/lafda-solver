# Love Lafda Solver — landing page (the page run)

## 1. Inventory: what belongs to this product and no competitor

- **The name.** "Lafda" is Hindi/Marathi street slang for a mess, a scrap, a row.
  Not "dispute", not "conflict resolution". The product is named in the language
  people actually fight in.
- **Exactly two links.** No accounts, no passwords, no sign-up. The link IS the
  identity, and there are precisely two of them. One you keep, one you send.
- **Blindness.** Neither person sees a word of the other's side until both have
  locked. This is the product's single hardest rule and its whole credibility.
- **The lock.** A one-way door. After it you cannot edit, and the mediator runs.
- **The mode, chosen by one and binding on both.** Common ground only, or common
  ground and a verdict. The other person sees the choice before they write.
- **Five steps, four of them writing.** Opening, what happened, proposed
  solution, evidence. The same five for both people.
- **The minimum outcome is a resolution.** Even when nobody is at fault, even in
  common-ground mode, a concrete set of steps comes back.
- **The safety line.** Not for abuse, coercion or anyone's safety. The product
  says so on the way in, while you write, and on the way out.
- **The fairness work.** Neutral Person 1 / Person 2 labels, random order each
  run, no name reaches the model. The judge is tested for position, length and
  tone bias before it ships.
- **Nothing is remembered.** No history, no email, no recovery. A lost link is
  a lost case.
- **One pass.** One model call per case. No rebuttals, no appeals, no chat.
- **It costs under a cent.** One argument, one call.

## 2. The argument (claims and their proof, one per section)

| Section | Claim | Proof on the page |
|---|---|---|
| hero | Two people, two links, one verdict. Neither sees the other until both are done. | The two links themselves, as the hero object |
| how-it-works | The whole thing is five steps and under half an hour. | The real five-step rail, cropped from the actual app |
| features (blindness) | You cannot read their side early, because the product cannot show it to you. | The sealed column, shown as it really renders |
| features (fairness) | The mediator cannot favour whoever wrote first, longest, or angriest. | The neutral labels, the random order, the five fairness tests by name |
| showcase (the verdict) | What you get back is a plan, not an opinion. | A real verdict screen, cropped |
| faq | The questions anyone sane asks before typing their private argument into a box. | Direct answers, including the ones that are not flattering |
| cta | Open a case. | The create form itself, or a link to it |
| footer | The name, and the safety line one last time. | — |

Deleted for having no claim: testimonials (nobody has used it), stats (there are
none), pricing (there is no price yet), about (there is no team to describe).

## 3. Imagery — what actually exists

No photographs of this product, and none should be invented: pictures of real
people mid-argument would be both fake and tasteless. What does exist is the
**working app**, and for software the skill counts cropped interface fragments
as real pictures. Every image on this page is a real fragment of the real
product, built as live HTML under the app rules and marked `data-ui`.

## 4. The idea

> On this page, **the sealed half of the screen** becomes **the hero fragment**:
> a real, working two-column spine where your side types and theirs stays shut.

Competitor test: any other mediation or counselling app. They are chat, or forms
both parties can read. None of them has a half of the screen that structurally
refuses to open. The idea is this product's, not the category's.

**The live thing.** On the hero the visitor types into a real opening-statement
box, at true interface size, and watches the other column stay sealed. Clicking
the sealed side does what the real product does: tells you it cannot show you,
and why. It works with a thumb, renders fully without script, and it is the
product performing its single hardest rule on the page itself.

## 5. Section plan (after one redraw)

| # | Role | Blueprint | What it carries |
|---|---|---|---|
| 1 | hero | Fragment on a shaped stage | The live sealed spine; headline + the one action |
| 2 | how-it-works | One card, four fields | One case advancing: writing, locked, judging, decided |
| 3 | features | Small proof beside text | Blindness, neutral labels, the lock, the safety line |
| 4 | showcase | Input half, output half (REDRAWN) | Two raw accounts in; one resolution out |
| 5 | faq | Accordion of filled tiles | The questions anyone sane asks first |
| 6 | cta | First step, already open | The real create form, working |
| 7 | footer | A footer of tiles | The name, the safety line |

**Redraw, with reason:** `showcase-rows-as-a-board` was dealt but assumes the
product has a main list of many records (transactions, issues, deploys,
bookings). This product has no list at all: no case history, no multi-case view,
one case per link pair, by design in the plan's non-scope. The blueprint cannot
hold the real content, so it was replaced with `showcase-input-half-output-half`,
whose assumptions match exactly what this product does.

**Colour:** kept from the brand, as the sheet says. The ground stays the app's
#f4f4f2 and the ink stays near-black; the page gets its colour from the one hue
#1d5fbf used as the hero stage and the closing field. The app screens stay
austere; the page is where that single hue is allowed to be large.

**Imagery:** every picture on this page is a real, working fragment of the real
product, built in HTML at true size and marked `data-ui`, which is what the sheet
prescribes for software with no photographs. No stock, no device frames, no fake
dashboards of grey bars.

## Critique

```
ROUND 1
Seen in one second: a product that makes two people write separately. The blue
  stage with the cut corner and a real, typeable box carry it.
Idea: the sealed half of the screen becomes the hero fragment.
Live thing: type into the real opening-statement box; the other column refuses
  to open and says why.
Layout words: hero=words left, working fragment on a cut stage / how=four full
  fields, one case advancing / fair=narrow modules, proof beside text /
  result=two halves, heading split across the seam / faq=sticky head, tiles /
  cta=closing line left, real form right / footer=tiles
Scores: design 7 · usability 7 · creativity 7 · content 8 → overall 7.2
Caps applied: no real photographs (fragments only); no motion layer at all.
Top three problems:
1. Nothing on the page moved (desktop-fold): no signature move, no entrances,
   no feedback. Build the motion layer.
2. Fifteen font sizes (report.json): clamps at four different scales. Collapse
   to five page steps and let fragments keep true interface size.
3. The sealed panel is stretched hollow beside the writing box (desktop-fold):
   the grid stretches it. align-items: start.
```

```
ROUND 2
Seen in one second: unchanged, and now the stage opens as the page lands.
Idea / live thing: unchanged.
Scores: design 8 · usability 8 · creativity 7 · content 8 → overall 7.8
Caps applied: no real photographs.
Top three problems:
1. The closing form's button is dead grey on arrival (desktop-page-02): the
   title field was empty, so the page's one action looked broken. Prefilled
   with the editable example the blueprint asks for.
2. Two statement paragraphs set above 24px wrapped to three lines at 390px
   (report.json). Dropped to 22px on the phone.
3. Running text was soft grey at 5.8:1 (report.json). Moved to full ink; grey
   kept for secondary notes only.
```

Remaining, defended:
- **no-real-pictures / no-footage.** This direction's own imagery section says
  that for software with no screenshots the pictures are its own interface, and
  every image here is a real, working fragment. The open collections were
  searched for the subject's world and returned nothing honest: a page about two
  people's private argument cannot use photographs of strangers mid-argument
  without being both fake and tasteless.
- **off-centre, 40 left / 65 right.** The page's own frame is 40px on both sides
  (the navigation confirms it). The 65 is the internal padding of a `data-ui`
  interface fragment — the case card centred in the last of the four fields,
  which is what that blueprint asks for.
